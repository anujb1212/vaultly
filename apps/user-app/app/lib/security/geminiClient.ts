import { z } from "zod";
import { isAICircuitOpen, openAICircuit } from "./aiQuota";

const AISecurityInsightSchema = z.object({
    title: z.string().min(3).max(80),
    summary: z.string().min(10).max(300),
    recommendedActions: z.array(z.string().min(3).max(60)).max(5),
});

export type AISecurityInsightOutput = z.infer<typeof AISecurityInsightSchema>;

const PROMPT_VERSION = "ai-security-insights-v1";

function scrubTextNumbers(text: string) {
    return text.replace(/\d{4,}/g, "****");
}

function systemInstructionText() {
    return [
        "You are a fintech wallet security advisor.",
        "This feature is read-only advisory: never initiate, authorize, or automate any money movement.",
        "Never request or output secrets: PIN, password, OTP, tokens, webhook signatures.",
        "Never include full phone numbers, exact balances, or long unique identifiers.",
        "Use only the provided sanitized signal context.",
        "Return ONLY valid JSON with keys: title, summary, recommendedActions.",
    ].join("\n");
}

function extractCandidateText(data: any) {
    // Gemini response shape: candidates[].content.parts[].text 
    const parts = data?.candidates?.[0]?.content?.parts;
    if (!Array.isArray(parts)) return "";
    return parts.map((p: any) => (typeof p?.text === "string" ? p.text : "")).join("");
}

export async function generateAISecurityInsightWithGemini(opts: {
    userId: number;
    signalPayload: object;
}) {
    const circuitOpen = await isAICircuitOpen("gemini");
    if (circuitOpen) {
        return {
            ok: false as const,
            error: "CIRCUIT_OPEN" as const,
            provider: "gemini" as const,
            model: process.env.GEMINI_MODEL ?? "gemini-2.0-flash",
            promptVersion: PROMPT_VERSION,
        };
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        return {
            ok: false as const,
            error: "MISSING_API_KEY" as const,
            provider: "gemini" as const,
            model: process.env.GEMINI_MODEL ?? "gemini-2.0-flash",
            promptVersion: PROMPT_VERSION,
        };
    }

    const model = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const body = {
        system_instruction: {
            parts: [{ text: systemInstructionText() }],
        },
        contents: [
            {
                role: "user",
                parts: [{ text: JSON.stringify(opts.signalPayload) }],
            },
        ],
        generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 250,
            responseMimeType: "application/json",
        },
    };

    const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
    });

    if (res.status === 429 || res.status >= 500) {
        await openAICircuit({
            provider: "gemini",
            ttlSec: 20 * 60,
            reason: `HTTP_${res.status}`,
        });
    }

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        return {
            ok: false as const,
            error: "HTTP_ERROR" as const,
            httpStatus: res.status,
            provider: "gemini" as const,
            model,
            promptVersion: PROMPT_VERSION,
            detail: text.slice(0, 200),
        };
    }

    const data = await res.json().catch(() => null);
    if (!data) {
        return {
            ok: false as const,
            error: "BAD_JSON_RESPONSE" as const,
            provider: "gemini" as const,
            model,
            promptVersion: PROMPT_VERSION,
        };
    }

    const text = extractCandidateText(data);
    if (!text) {
        return {
            ok: false as const,
            error: "EMPTY_RESPONSE" as const,
            provider: "gemini" as const,
            model,
            promptVersion: PROMPT_VERSION,
        };
    }

    let parsed: unknown;
    try {
        parsed = JSON.parse(text);
    } catch {
        return {
            ok: false as const,
            error: "NON_JSON_OUTPUT" as const,
            provider: "gemini" as const,
            model,
            promptVersion: PROMPT_VERSION,
        };
    }

    const validated = AISecurityInsightSchema.safeParse(parsed);
    if (!validated.success) {
        return {
            ok: false as const,
            error: "SCHEMA_INVALID" as const,
            provider: "gemini" as const,
            model,
            promptVersion: PROMPT_VERSION,
        };
    }

    const out: AISecurityInsightOutput = {
        title: scrubTextNumbers(validated.data.title),
        summary: scrubTextNumbers(validated.data.summary),
        recommendedActions: validated.data.recommendedActions.map(scrubTextNumbers),
    };

    return {
        ok: true as const,
        provider: "gemini" as const,
        model,
        promptVersion: PROMPT_VERSION,
        output: out,
    };
}
