import "server-only";
import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY || "";
if (!apiKey && process.env.NODE_ENV === "production") {
    throw new Error("[resend] RESEND_API_KEY must be set in production");
}

export const resend = new Resend(apiKey || "dev_only");

export const RESEND_FROM = process.env.RESEND_FROM || "Vaultly <onboarding@resend.dev>";
