"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "../../../app/lib/auth";
import { revalidatePath } from "next/cache";

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
}

export async function dlqList() {
    await requireAdmin();

    const res = await fetch(`${process.env.NEXT_PUBLIC_GATEWAY_URL}/api/admin/dlq/list?limit=50&offset=0&includeArchived=false`, {
        headers: { "X-Admin-Token": adminToken(), "X-Admin-Actor": "user-app-admin" },
        cache: "no-store",
    });

    if (!res.ok) throw new Error(`DLQ_LIST_FAILED_HTTP_${res.status}`);
    return res.json() as Promise<{ count: number; jobs: any[] }>;
}

export async function dlqReplay(formData: FormData) {
    await requireAdmin();
    const dlqJobId = String(formData.get("dlqJobId") ?? "");
    if (!dlqJobId) throw new Error("Missing dlqJobId");

    const res = await fetch(`${process.env.NEXT_PUBLIC_GATEWAY_URL}/api/admin/dlq/replay`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Token": adminToken(), "X-Admin-Actor": "user-app-admin" },
        body: JSON.stringify({ dlqJobId, archiveAfter: true, preserveWebhookEventId: true }),
    });

    if (!res.ok) throw new Error(`DLQ_REPLAY_FAILED_HTTP_${res.status}`);
    revalidatePath("/admin/dlq");
}

export async function dlqArchive(formData: FormData) {
    await requireAdmin();
    const dlqJobId = String(formData.get("dlqJobId") ?? "");
    if (!dlqJobId) throw new Error("Missing dlqJobId");

    const res = await fetch(`${process.env.NEXT_PUBLIC_GATEWAY_URL}/api/admin/dlq/archive`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Token": adminToken(), "X-Admin-Actor": "user-app-admin" },
        body: JSON.stringify({ dlqJobId, reason: "MANUAL_ARCHIVE_UI" }),
    });

    if (!res.ok) throw new Error(`DLQ_ARCHIVE_FAILED_HTTP_${res.status}`);
    revalidatePath("/admin/dlq");
}
