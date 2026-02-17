"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    doc,
    getDoc,
    serverTimestamp,
    updateDoc,
} from "firebase/firestore";
import { auth, db } from "../../../../lib/firebase";
import Screen from "../../../../components/Screen";
import Image from "next/image";

export default function VillagerConfirmIssuePage() {
    const router = useRouter();
    const params = useParams() as { locale?: string; id?: string };
    const locale = params?.locale || "en";
    const issueId = params?.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [issue, setIssue] = useState<any>(null);
    const [note, setNote] = useState("");

    const t = useMemo(() => {
        const L: any = {
            en: {
                title: "Confirm Issue Resolution",
                resolved: "Issue Resolved",
                reopen: "Not Resolved",
                note: "Your Feedback (optional)",
                resolvedBtn: "Confirm Resolved",
                reopenBtn: "Reopen Issue",
                saving: "Submitting…",
            },
            kn: {
                title: "ಸಮಸ್ಯೆ ಪರಿಹಾರ ದೃಢೀಕರಣ",
                resolved: "ಸಮಸ್ಯೆ ಪರಿಹಾರವಾಗಿದೆ",
                reopen: "ಪರಿಹಾರವಾಗಿಲ್ಲ",
                note: "ನಿಮ್ಮ ಪ್ರತಿಕ್ರಿಯೆ (ಐಚ್ಛಿಕ)",
                resolvedBtn: "ಪರಿಹಾರವಾಗಿದೆ ಎಂದು ದೃಢೀಕರಿಸಿ",
                reopenBtn: "ಸಮಸ್ಯೆ ಮರುತೆರೆಯಿರಿ",
                saving: "ಸಲ್ಲಿಸಲಾಗುತ್ತಿದೆ…",
            },
            hi: {
                title: "समस्या समाधान की पुष्टि",
                resolved: "समस्या हल हो गई",
                reopen: "हल नहीं हुई",
                note: "आपकी प्रतिक्रिया (वैकल्पिक)",
                resolvedBtn: "Resolved कन्फर्म करें",
                reopenBtn: "Issue Reopen करें",
                saving: "सबमिट हो रहा है…",
            },
        };
        return L[locale] || L.en;
    }, [locale]);

    useEffect(() => {
        const load = async () => {
            const user = auth.currentUser;
            if (!user) {
                router.replace(`/${locale}/villager/login`);
                return;
            }

            const snap = await getDoc(doc(db, "issues", issueId));
            if (!snap.exists()) {
                router.back();
                return;
            }

            const data = snap.data();

            if (data.reporterUid !== user.uid) {
                router.replace(`/${locale}/villager/dashboard`);
                return;
            }

            if (data.status !== "completed_by_vi") {
                router.replace(`/${locale}/villager/track/${issueId}`);
                return;
            }

            setIssue(data);
            setLoading(false);
        };

        load();
    }, [router, locale, issueId]);

    const submit = async (decision: "resolved" | "reopened") => {
        setSaving(true);

        const nextStatus =
            decision === "resolved" ? "closed" : "reopened_by_villager";

        await updateDoc(doc(db, "issues", issueId), {
            status: nextStatus,
            villagerConfirmation: {
                decision,
                note: note.trim() || "",
                at: serverTimestamp(),
            },
            updatedAt: serverTimestamp(),
        });

        router.replace(`/${locale}/villager/dashboard`);
    };

    return (
        <Screen padded>
            <h1 className="text-xl font-extrabold text-green-900">
                {t.title}
            </h1>

            {loading && (
                <div className="mt-8 text-center font-semibold text-green-700">
                    Loading…
                </div>
            )}

            {!loading && issue && (
                <div className="mt-6 space-y-6">
                    {/* Completion Photo */}
                    {issue.completionPhotoUrl && (
                        <div className="rounded-2xl overflow-hidden border border-green-200">
                            <Image
                                src={issue.completionPhotoUrl}
                                alt="Completion proof"
                                width={800}
                                height={600}
                                className="w-full object-cover"
                            />
                        </div>
                    )}

                    {/* Feedback */}
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder={t.note}
                        rows={4}
                        className="w-full rounded-xl border border-green-200 px-4 py-3 text-sm"
                    />

                    {/* Actions */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                            disabled={saving}
                            onClick={() => submit("resolved")}
                            className="rounded-xl bg-green-700 text-white font-extrabold py-3"
                        >
                            {saving ? t.saving : t.resolvedBtn}
                        </button>

                        <button
                            disabled={saving}
                            onClick={() => submit("reopened")}
                            className="rounded-xl bg-red-600 text-white font-extrabold py-3"
                        >
                            {saving ? t.saving : t.reopenBtn}
                        </button>
                    </div>
                </div>
            )}
        </Screen>
    );
}
