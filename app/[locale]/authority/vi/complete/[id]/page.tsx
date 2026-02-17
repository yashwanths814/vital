"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    arrayUnion,
    doc,
    getDoc,
    serverTimestamp,
    updateDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "../../../../../lib/firebase";
import Screen from "../../../../../components/Screen";

export default function VICompleteIssuePage() {
    const router = useRouter();
    const params = useParams() as { locale?: string; id?: string };
    const locale = params?.locale || "en";
    const issueId = params?.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState("");

    const [issue, setIssue] = useState<any>(null);
    const [note, setNote] = useState("");
    const [file, setFile] = useState<File | null>(null);

    const t = useMemo(() => {
        const L: any = {
            en: {
                title: "Completion Proof (Village In-charge)",
                back: "← Back",
                summary: "Issue Summary",
                status: "Current Status",
                note: "Completion Note",
                notePh: "e.g., Work verified on ground, area cleaned, photo attached…",
                upload: "Upload Final Photo",
                save: "Mark Completed",
                saving: "Saving…",
                needPhoto: "Please upload a completion photo.",
            },
            kn: {
                title: "ಪೂರ್ಣಗೊಂಡ ಸಾಕ್ಷ್ಯ (ಗ್ರಾಮ ಇನ್‌ಚಾರ್ಜ್)",
                back: "← ಹಿಂದಕ್ಕೆ",
                summary: "ಸಮಸ್ಯೆ ಸಾರಾಂಶ",
                status: "ಪ್ರಸ್ತುತ ಸ್ಥಿತಿ",
                note: "ಪೂರ್ಣಗೊಂಡ ಟಿಪ್ಪಣಿ",
                notePh: "ಉದಾ: ಸ್ಥಳದಲ್ಲೇ ಪರಿಶೀಲನೆ, ಕೆಲಸ ಮುಗಿದಿದೆ, ಫೋಟೋ ಸೇರಿಸಲಾಗಿದೆ…",
                upload: "ಅಂತಿಮ ಫೋಟೋ ಅಪ್ಲೋಡ್",
                save: "ಪೂರ್ಣಗೊಂಡಿದೆ ಎಂದು ಗುರುತುಹಾಕಿ",
                saving: "ಉಳಿಸಲಾಗುತ್ತಿದೆ…",
                needPhoto: "ದಯವಿಟ್ಟು ಪೂರ್ಣಗೊಂಡ ಫೋಟೋ ಅಪ್ಲೋಡ್ ಮಾಡಿ.",
            },
            hi: {
                title: "पूर्ण होने का प्रमाण (विलेज इन-चार्ज)",
                back: "← वापस",
                summary: "इश्यू सारांश",
                status: "वर्तमान स्टेटस",
                note: "कम्प्लीशन नोट",
                notePh: "जैसे: ग्राउंड पर जांच की, काम पूरा, फोटो संलग्न…",
                upload: "फाइनल फोटो अपलोड",
                save: "Completed मार्क करें",
                saving: "सेव हो रहा है…",
                needPhoto: "कृपया कम्प्लीशन फोटो अपलोड करें।",
            },
        };
        return L[locale] || L.en;
    }, [locale]);

    useEffect(() => {
        const load = async () => {
            setErr("");
            setLoading(true);

            const user = auth.currentUser;
            if (!user) {
                router.replace(`/${locale}/authority/login`);
                return;
            }

            const snap = await getDoc(doc(db, "issues", issueId));
            if (!snap.exists()) {
                setErr("Issue not found.");
                setLoading(false);
                return;
            }

            setIssue(snap.data());
            setLoading(false);
        };

        load();
    }, [router, locale, issueId]);

    const uploadFinalPhoto = async (f: File) => {
        const uid = auth.currentUser?.uid || "vi";
        const path = `issues/${issueId}/completion/${uid}_${Date.now()}_${f.name}`;
        const r = ref(storage, path);
        await uploadBytes(r, f);
        return await getDownloadURL(r);
    };

    const markCompleted = async () => {
        if (!file) {
            alert(t.needPhoto);
            return;
        }

        setSaving(true);

        try {
            const url = await uploadFinalPhoto(file);

            const log = {
                note: note.trim() || "(no note)",
                photoUrl: url,
                by: auth.currentUser?.uid || "",
                byRole: "village_incharge",
                at: serverTimestamp(),
            };

            await updateDoc(doc(db, "issues", issueId), {
                status: "completed_by_vi",
                completionPhotoUrl: url,
                completionLogs: arrayUnion(log),
                completedAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            setNote("");
            setFile(null);

            // redirect to VI dashboard/issues list
            router.replace(`/${locale}/authority/vi/dashboard`);
        } catch (e: any) {
            alert(e?.message || "Failed to mark completed");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Screen padded>
            <button
                onClick={() => router.back()}
                className="text-sm font-bold text-green-700 mb-4"
            >
                {t.back}
            </button>

            <h1 className="text-xl font-extrabold text-green-900">{t.title}</h1>

            {loading && (
                <div className="mt-8 text-center text-green-700 font-semibold">
                    Loading…
                </div>
            )}

            {!loading && err && (
                <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                    {err}
                </div>
            )}

            {!loading && issue && (
                <div className="mt-6 space-y-6">
                    {/* Summary */}
                    <div className="bg-white border border-green-200 rounded-2xl p-4">
                        <div className="text-sm font-extrabold text-green-900">
                            {t.summary}
                        </div>

                        <div className="mt-2 text-green-900 font-bold">
                            {issue.title || "Issue"}
                        </div>

                        <div className="mt-1 text-xs text-green-800/80">
                            Category: {issue.category || "-"}
                        </div>

                        <div className="mt-3 text-sm font-extrabold text-green-900">
                            {t.status}
                        </div>
                        <div className="mt-1 inline-flex rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-bold text-green-800">
                            {issue.status || "-"}
                        </div>
                    </div>

                    {/* Completion Form */}
                    <div className="bg-white border border-green-200 rounded-2xl p-4">
                        <div className="text-sm font-extrabold text-green-900">
                            {t.note}
                        </div>

                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder={t.notePh}
                            rows={4}
                            className="mt-2 w-full rounded-xl border border-green-200 px-4 py-3 text-sm"
                        />

                        <div className="mt-4 text-sm font-extrabold text-green-900">
                            {t.upload}
                        </div>

                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                            className="mt-2 w-full text-sm"
                        />

                        <button
                            disabled={saving}
                            onClick={markCompleted}
                            className="mt-5 w-full rounded-xl bg-green-700 text-white font-extrabold py-3 active:scale-[0.99]"
                        >
                            {saving ? t.saving : t.save}
                        </button>
                    </div>
                </div>
            )}
        </Screen>
    );
}
