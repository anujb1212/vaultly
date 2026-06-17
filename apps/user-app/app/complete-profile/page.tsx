"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "../../components/theme/ThemeToggle";
import { Button } from "@repo/ui/button";
import { TextInput } from "@repo/ui/textinput";
import { ArrowRight, Smartphone, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import { z } from "zod";
import { toFieldErrors, type FieldErrors } from "../../components/auth/zodFieldErrors";
import { setPhoneNumber } from "../../app/lib/actions/setPhoneNumber";

const phoneSchema = z.object({
    phone: z
        .string()
        .length(10, { message: "Phone number must be exactly 10 digits" })
        .regex(/^\d+$/, { message: "Phone number must contain only numbers" }),
});

type PhoneFields = "phone";

export default function CompleteProfilePage() {
    const { data: session, update } = useSession();
    const router = useRouter();

    const [phone, setPhone] = useState("");
    const [formError, setFormError] = useState("");
    const [fieldErrors, setFieldErrors] = useState<FieldErrors<PhoneFields>>({});
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);

    useEffect(() => {
        if (session?.user?.phone) {
            router.replace("/dashboard");
        }
    }, [session, router]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setFormError("");
        setFieldErrors({});
        setLoading(true);

        const validation = phoneSchema.safeParse({ phone });

        if (!validation.success) {
            const { fieldErrors: fe, formError: top } = toFieldErrors<PhoneFields>(validation.error);
            setFieldErrors(fe);
            if (top) setFormError(top);
            setLoading(false);
            return;
        }

        const result = await setPhoneNumber(phone);

        if (!result.success) {
            setFormError(result.message);
            setLoading(false);
            return;
        }

        await update();
        setDone(true);

        setTimeout(() => {
            router.push("/dashboard");
        }, 1500);
    }

    return (
        <div className="min-h-screen w-full flex relative bg-background selection:bg-primary/20 overflow-hidden">
            <div className="absolute top-6 right-6 z-50">
                <ThemeToggle />
            </div>

            <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 relative">

                <div className="w-full max-w-[400px] animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {done ? (
                        <div className="text-center animate-in zoom-in-95 duration-300">
                            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 className="w-8 h-8" />
                            </div>
                            <h2 className="text-2xl font-bold tracking-tight mb-2">All set!</h2>
                            <p className="text-sm text-muted-foreground">Redirecting to your dashboard...</p>
                        </div>
                    ) : (
                        <>
                            <div className="mb-8">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-foreground text-background grid place-items-center font-bold text-lg shadow-sm">V</div>
                                    <span className="font-bold tracking-tight text-xl">Vaultly</span>
                                </div>
                                <h2 className="text-3xl font-bold tracking-tight mb-2">Just one more step</h2>
                                <p className="text-sm text-muted-foreground">
                                    We need your phone number to enable P2P transfers and secure your account.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                                <TextInput
                                    label="Phone Number"
                                    placeholder="e.g. 9876543210"
                                    onChange={(val) => {
                                        setPhone(val.trim());
                                        if (fieldErrors.phone) setFieldErrors(prev => ({ ...prev, phone: undefined }));
                                    }}
                                    type="tel"
                                    value={phone}
                                    error={fieldErrors.phone}
                                />

                                {formError && (
                                    <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium animate-in fade-in slide-in-from-top-1 duration-200">
                                        <AlertCircle className="w-4 h-4 shrink-0" />
                                        {formError}
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-11 bg-primary text-primary-foreground font-medium rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
                                >
                                    {loading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            Continue <ArrowRight className="w-4 h-4" />
                                        </span>
                                    )}
                                </Button>
                            </form>

                            <div className="mt-8 flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-border/40">
                                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                                    <Smartphone className="w-5 h-5" />
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    This is required to send and receive money. You can update it later in Settings.
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
