"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    arrayUnion,
    doc,
    getDoc,
    updateDoc,
    serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "../../../../../lib/firebase";
import Screen from "../../../../../components/Screen";

type StatusKey = "in_progress" | "resolved_by_worker";

export default function PDOProgressPage() {
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
    const [status, setStatus] = useState<StatusKey>("in_progress");

    const t = useMemo(() => {
        const L: any = {
            en: {
                title: "Work Progress",
                back: "← Back",
                worker: "Assigned Worker",
                status: "Update Status",
                note: "Progress Note",
                notePh: "e.g., Materials delivered, cleaning started, work 60% completed…",
                photo: "Upload Photo (optional)",
                save: "Save Update",
                saving: "Saving…",
                inProgress: "In Progress",
                resolvedByWorker: "Resolved by Worker (pending VI + villager confirmation)",
            },
            kn: {
                title: "ಕೆಲಸದ ಪ್ರಗತಿ",
                back: "← ಹಿಂದಕ್ಕೆ",
                worker: "ನಿಯೋಜಿಸಿದ ಕಾರ್ಮಿಕ",
                status: "ಸ್ಥಿತಿ ಅಪ್ಡೇಟ್",
                note: "ಪ್ರಗತಿ ಟಿಪ್ಪಣಿ",
                notePh: "ಉದಾ: ಸಾಮಗ್ರಿ ಬಂದಿದೆ, ಕೆಲಸ ಆರಂಭ, 60% ಪೂರ್ಣ…",
                photo: "ಫೋಟೋ ಅಪ್ಲೋಡ್ (ಐಚ್ಛಿಕ)",
                save: "ಉಳಿಸಿ",
                saving: "ಉಳಿಸಲಾಗುತ್ತಿದೆ…",
                inProgress: "ನಡೆಯುತ್ತಿದೆ",
                resolvedByWorker: "ಕಾರ್ಮಿಕರಿಂದ ಪೂರ್ಣ (VI + ಗ್ರಾಮಸ್ಥ ದೃಢೀಕರಣ ಬಾಕಿ)",
            },
            hi: {
                title: "कार्य प्रगति",
                back: "← वापस",
                worker: "असाइन किया गया कर्मचारी",
                status: "स्टेटस अपडेट",
                note: "प्रगति नोट",
                notePh: "जैसे: सामग्री आ गई, काम शुरू, 60% पूरा…",
                photo: "फोटो अपलोड (वैकल्पिक)",
                save: "सेव करें",
                saving: "सेव हो रहा है…",
                inProgress: "कार्य प्रगति में",
                resolvedByWorker: "कर्मचारी ने पूरा किया (VI + ग्रामीण पुष्टि बाकी)",
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

            const data = snap.data();
            setIssue(data);

            // default dropdown based on current status
            if (data?.status === "resolved_by_worker") setStatus("resolved_by_worker");
            else setStatus("in_progress");

            setLoading(false);
        };

        load();
    }, [router, locale, issueId]);

    const uploadProgressPhoto = async (f: File) => {
        const uid = auth.currentUser?.uid || "pdo";
        const path = `issues/${issueId}/progress/${uid}_${Date.now()}_${f.name}`;
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, f);
        return await getDownloadURL(storageRef);
    };

    const save = async () => {
        if (!note.trim() && !file && status === issue?.status) {
            alert("Add note/photo or change status");
            return;
        }

        setSaving(true);

        try {
            let photoUrl = "";
            if (file) photoUrl = await uploadProgressPhoto(file);

            const log = {
                note: note.trim() || "(no note)",
                photoUrl: photoUrl || "",
                status,
                by: auth.currentUser?.uid || "",
                at: serverTimestamp(),
                byRole: "pdo",
            };

            await updateDoc(doc(db, "issues", issueId), {
                status,
                progressLogs: arrayUnion(log),
                updatedAt: serverTimestamp(),
            });

            // UI reset
            setNote("");
            setFile(null);

            // go back to issues list/dashboard
            router.replace(`/${locale}/authority/pdo/dashboard`);
        } catch (e: any) {
            alert(e?.message || "Failed to save update");
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
                    {/* Issue summary */}
                    <div className="bg-white border border-green-200 rounded-2xl p-4">
                        <div className="font-extrabold text-green-900">
                            {issue.title || "Issue"}
                        </div>
                        <div className="text-xs text-green-800/80 mt-1">
                            Category: {issue.category || "-"} • Status:{" "}
                            <span className="font-bold">{issue.status || "-"}</span>
                        </div>

                        <div className="mt-3">
                            <div className="text-sm font-extrabold text-green-900">
                                {t.worker}
                            </div>
                            <div className="text-sm text-green-900/80 mt-1">
                                {issue?.assignedWorker?.name || "—"}{" "}
                                {issue?.assignedWorker?.phone
                                    ? `• ${issue.assignedWorker.phone}`
                                    : ""}
                            </div>
                        </div>
                    </div>

                    {/* Update form */}
                    <div className="bg-white border border-green-200 rounded-2xl p-4">
                        <div className="text-sm font-extrabold text-green-900 mb-2">
                            {t.status}
                        </div>

                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value as StatusKey)}
                            className="w-full rounded-xl border border-green-200 px-4 py-3 text-sm bg-white"
                        >
                            <option value="in_progress">{t.inProgress}</option>
                            <option value="resolved_by_worker">{t.resolvedByWorker}</option>
                        </select>

                        <div className="mt-4 text-sm font-extrabold text-green-900">
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
                            {t.photo}
                        </div>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                            className="mt-2 w-full text-sm"
                        />

                        <button
                            disabled={saving}
                            onClick={save}
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
