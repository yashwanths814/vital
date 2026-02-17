// app/[locale]/authority/pdo/requests/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Screen from "../../../../components/Screen";
import { auth, db } from "../../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
    addDoc,
    collection,
    doc,
    getDoc,
    serverTimestamp,
} from "firebase/firestore";
import { FiArrowLeft, FiSend, FiAlertCircle } from "react-icons/fi";

type Locale = "en" | "kn" | "hi";

export default function PdoFundRequestPage() {
    const router = useRouter();
    const params = useParams() as { locale?: Locale };
    const locale = params?.locale || "en";

    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");
    const [amount, setAmount] = useState("");
    const [purpose, setPurpose] = useState("");

    const [authority, setAuthority] = useState<any>(null);

    /* ---------------- TRANSLATIONS ---------------- */
    const t = useMemo(() => {
        const L: Record<Locale, any> = {
            en: {
                title: "Send Fund Request",
                subtitle: "Request funds for Panchayat development",
                amount: "Amount (₹)",
                purpose: "Purpose",
                submit: "Send Request",
                sending: "Sending...",
                back: "Back",
                success: "Fund request submitted successfully",
                errPerm: "Missing or insufficient permissions",
                required: "All fields are required",
            },
            kn: {
                title: "ನಿಧಿ ವಿನಂತಿ ಕಳುಹಿಸಿ",
                subtitle: "ಪಂಚಾಯತ್ ಅಭಿವೃದ್ಧಿಗಾಗಿ ನಿಧಿ ವಿನಂತಿಸಿ",
                amount: "ಮೊತ್ತ (₹)",
                purpose: "ಉದ್ದೇಶ",
                submit: "ವಿನಂತಿ ಕಳುಹಿಸಿ",
                sending: "ಕಳುಹಿಸಲಾಗುತ್ತಿದೆ...",
                back: "ಹಿಂದೆ",
                success: "ನಿಧಿ ವಿನಂತಿ ಯಶಸ್ವಿಯಾಗಿ ಸಲ್ಲಿಸಲಾಗಿದೆ",
                errPerm: "ಅನುಮತಿ ಇಲ್ಲ ಅಥವಾ ಸಾಕಾಗಿಲ್ಲ",
                required: "ಎಲ್ಲಾ ಕ್ಷೇತ್ರಗಳು ಅಗತ್ಯ",
            },
            hi: {
                title: "फंड अनुरोध भेजें",
                subtitle: "पंचायत विकास के लिए फंड का अनुरोध करें",
                amount: "राशि (₹)",
                purpose: "उद्देश्य",
                submit: "अनुरोध भेजें",
                sending: "भेजा जा रहा है...",
                back: "वापस",
                success: "फंड अनुरोध सफलतापूर्वक भेजा गया",
                errPerm: "अनुमति नहीं है",
                required: "सभी फ़ील्ड आवश्यक हैं",
            },
        };
        return L[locale];
    }, [locale]);

    /* ---------------- AUTH + LOAD AUTHORITY ---------------- */
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (u) => {
            if (!u) {
                router.replace(`/${locale}/authority/login`);
                return;
            }

            const snap = await getDoc(doc(db, "authorities", u.uid));
            if (!snap.exists()) {
                router.replace(`/${locale}/authority/login`);
                return;
            }

            const a = snap.data();
            const verified =
                a?.verified === true ||
                a?.verification?.status === "verified" ||
                a?.status === "verified";

            if (a?.role !== "pdo" || !verified) {
                router.replace(`/${locale}/authority/status`);
                return;
            }

            setAuthority(a);
        });

        return () => unsub();
    }, [router, locale]);

    /* ---------------- SUBMIT ---------------- */
    const submit = async () => {
        if (loading) return;
        setErr("");

        if (!amount || !purpose.trim()) {
            setErr(t.required);
            return;
        }

        try {
            setLoading(true);

            await addDoc(collection(db, "fund_requests"), {
                requestedBy: auth.currentUser!.uid,
                role: "pdo",

                amount: Number(amount),
                purpose: purpose.trim(),

                panchayatId: authority.panchayatId,
                talukId: authority.talukId,
                districtId: authority.districtId,

                status: "pending",

                createdAt: serverTimestamp(),
            });

            alert(t.success);
            router.push(`/${locale}/authority/pdo/dashboard`);
        } catch (e: any) {
            console.error(e);
            setErr(e?.message || t.errPerm);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Screen padded>
            <div className="min-h-screen p-4 bg-gradient-to-b from-green-50 to-white">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <button
                        onClick={() => router.back()}
                        className="p-2 rounded-xl border bg-white"
                    >
                        <FiArrowLeft />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-green-900">{t.title}</h1>
                        <p className="text-sm text-green-700/70">{t.subtitle}</p>
                    </div>
                </div>

                {/* Error */}
                {err && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex gap-2">
                        <FiAlertCircle />
                        {err}
                    </div>
                )}

                {/* Form */}
                <div className="bg-white rounded-2xl border p-4 space-y-4 shadow-sm">
                    <div>
                        <label className="text-sm font-semibold">{t.amount}</label>
                        <input
                            value={amount}
                            onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
                            inputMode="numeric"
                            className="w-full mt-1 rounded-xl border px-4 py-3"
                            placeholder="50000"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-semibold">{t.purpose}</label>
                        <textarea
                            value={purpose}
                            onChange={(e) => setPurpose(e.target.value)}
                            rows={3}
                            className="w-full mt-1 rounded-xl border px-4 py-3"
                            placeholder="Road repair, sanitation, water supply..."
                        />
                    </div>

                    <button
                        onClick={submit}
                        disabled={loading}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                        <FiSend />
                        {loading ? t.sending : t.submit}
                    </button>
                </div>
            </div>
        </Screen>
    );
}
