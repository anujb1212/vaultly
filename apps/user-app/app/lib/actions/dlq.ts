"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "../../../app/lib/auth";
import { revalidatePath } from "next/cache";
import { rateLimit } from "../redis/rateLimit";

function adminToken() {
    const t = process.env.GATEWAY_ADMIN_TOKEN;
    if (!t) throw new Error("GATEWAY_ADMIN_TOKEN not set");
    return t;
}

async function requireAdmin() {
    const session = await getServerSession(authOptions);
    const email = String(session?.user?.email ?? "").toLowerCase();

    const allow = (process.env.ADMIN_EMAILS ?? "")
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);

    if (!email || !allow.includes(email)) throw new Error("UNAUTHORIZED");

    return email;
}

async function dlqRateGuard(email: string) {
    const rl = await rateLimit({
        key: `rl:dlq:admin:${email}`,
        limit: 30,
        windowSec: 60,
    });

    if (!rl.allowed) {
        throw new Error(`TOO_MANY_REQUESTS_${rl.ttl}`);
    }
}

function gatewayBase() {
    const base = process.env.NEXT_PUBLIC_GATEWAY_URL;
    if (!base) throw new Error("NEXT_PUBLIC_GATEWAY_URL not set");
    return base.replace(/\/$/, "");
}

async function gatewayPost(path: string, body: any) {
    const res = await fetch(`${gatewayBase()}${path}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Admin-Token": adminToken(),
            "X-Admin-Actor": "user-app-admin",
        },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        let msg = `HTTP_${res.status}`;
        try {
            const j = await res.json();
            msg = j?.message ? String(j.message) : msg;
        } catch {
            // ignore
        }
        throw new Error(`${path}_FAILED_${msg}`);
    }

    return res.json().catch(() => ({}));
}

function parseJobIds(formData: FormData) {
    const raw = String(formData.get("dlqJobIds") ?? "[]");
    let ids: unknown = [];
    try {
        ids = JSON.parse(raw);
    } catch {
        throw new Error("Invalid dlqJobIds");
    }

    if (!Array.isArray(ids)) throw new Error("Invalid dlqJobIds");

    const out = ids
        .map((x) => String(x))
        .map((s) => s.trim())
        .filter(Boolean);

    if (out.length === 0) throw new Error("No dlqJobIds");
    if (out.length > 50) throw new Error("Too many dlqJobIds");

    return out;
}

export async function dlqList() {
    await requireAdmin();

    const res = await fetch(
        `${gatewayBase()}/api/admin/dlq/list?limit=50&offset=0&includeArchived=false`,
        {
            headers: { "X-Admin-Token": adminToken(), "X-Admin-Actor": "user-app-admin" },
            cache: "no-store",
        }
    );

    if (!res.ok) throw new Error(`DLQ_LIST_FAILED_HTTP_${res.status}`);
    return res.json() as Promise<{ count: number; jobs: any[] }>;
}

export async function dlqReplay(formData: FormData) {
    const email = await requireAdmin();
    await dlqRateGuard(email);
    const dlqJobId = String(formData.get("dlqJobId") ?? "");
    if (!dlqJobId) throw new Error("Missing dlqJobId");

    await gatewayPost("/api/admin/dlq/replay", {
        dlqJobId,
        archiveAfter: true,
        preserveWebhookEventId: true,
    });

    revalidatePath("/admin/dlq");
}

export async function dlqArchive(formData: FormData) {
    const email = await requireAdmin();
    await dlqRateGuard(email);
    const dlqJobId = String(formData.get("dlqJobId") ?? "");
    if (!dlqJobId) throw new Error("Missing dlqJobId");

    await gatewayPost("/api/admin/dlq/archive", {
        dlqJobId,
        reason: "MANUAL_ARCHIVE_UI",
    });

    revalidatePath("/admin/dlq");
}

export async function dlqResolveGroup(formData: FormData) {
    const email = await requireAdmin();
    await dlqRateGuard(email);

    const primaryDlqJobId = String(formData.get("primaryDlqJobId") ?? "").trim();
    if (!primaryDlqJobId) throw new Error("Missing primaryDlqJobId");

    const ids = parseJobIds(formData);
    if (!ids.includes(primaryDlqJobId)) throw new Error("primaryDlqJobId not in dlqJobIds");

    await gatewayPost("/api/admin/dlq/replay", {
        dlqJobId: primaryDlqJobId,
        archiveAfter: true,
        preserveWebhookEventId: true,
        reason: "RESOLVE_GROUP_UI",
    });

    for (const id of ids) {
        if (id === primaryDlqJobId) continue;
        await gatewayPost("/api/admin/dlq/archive", {
            dlqJobId: id,
            reason: "DUPLICATE_ARCHIVE_UI",
        });
    }

    revalidatePath("/admin/dlq");
}

export async function dlqArchiveGroup(formData: FormData) {
    const email = await requireAdmin();
    await dlqRateGuard(email);

    const ids = parseJobIds(formData);
    for (const id of ids) {
        await gatewayPost("/api/admin/dlq/archive", {
            dlqJobId: id,
            reason: "ARCHIVE_GROUP_UI",
        });
    }

    revalidatePath("/admin/dlq");
}
