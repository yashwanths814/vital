"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    doc,
    getDoc,
    updateDoc,
    serverTimestamp,
    collection,
    getDocs,
    query,
    where,
    addDoc,
    Timestamp,
} from "firebase/firestore";
import { auth, db } from "../../../../lib/firebase";
import Screen from "../../../../components/Screen";

type Worker = {
    id: string;
    name: string;
    phone: string;
    role?: string;
};

function fmtDate(v: any) {
    try {
        if (!v) return "";
        if (v instanceof Timestamp) return v.toDate().toLocaleString();
        if (v?.toDate) return v.toDate().toLocaleString();
        if (typeof v === "string") return new Date(v).toLocaleString();
        return "";
    } catch {
        return "";
    }
}

export default function PDOIssueDetailsPage() {
    const router = useRouter();
    const params = useParams() as { locale?: string; id?: string };
    const locale = params?.locale || "en";
    const issueId = params?.id as string;

    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");
    const [issue, setIssue] = useState<any>(null);

    const [workers, setWorkers] = useState<Worker[]>([]);
    const [workerId, setWorkerId] = useState("");
    const [assignNote, setAssignNote] = useState("");
    const [assigning, setAssigning] = useState(false);

    const t = useMemo(() => {
        const L: any = {
            en: {
                title: "Issue Details",
                subtitle: "Assign worker, track status, and raise fund request if needed",
                back: "Back",
                issueId: "Issue ID",
                status: "Status",
                created: "Created",
                titleLabel: "Title",
                category: "Category",
                description: "Description",
                location: "Location",
                assignedWorker: "Assigned Worker",
                notAssigned: "Not assigned yet.",
                assignWorker: "Assign Worker",
                waitVi: "Waiting for VI verification",
                selectWorker: "Select Worker",
                note: "PDO Note (optional)",
                notePh: "Example: Complete within 3 days. Priority high.",
                assignBtn: "Assign Worker",
                assigning: "Assigning...",
                raiseFund: "Raise Fund Request →",
                noWorkers: "No workers found. Add workers for your panchayat.",
                pickWorker: "Select a worker.",
                notAllowed: "You are not allowed to view this issue.",
                notFound: "Issue not found.",
                profileMissing: "Authority profile missing.",
                panchayatMissing: "panchayatId missing in PDO profile.",
            },
            kn: {
                title: "ಸಮಸ್ಯೆಯ ವಿವರಗಳು",
                subtitle: "ಕಾರ್ಮಿಕರನ್ನು ನೇಮಿಸಿ, ಸ್ಥಿತಿಯನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ ಮತ್ತು ಅಗತ್ಯವಿದ್ದರೆ ನಿಧಿ ಕೇಳಿ",
                back: "ಹಿಂದೆ",
                issueId: "ಸಮಸ್ಯೆ ಐಡಿ",
                status: "ಸ್ಥಿತಿ",
                created: "ರಚಿಸಿದ ಸಮಯ",
                titleLabel: "ಶೀರ್ಷಿಕೆ",
                category: "ವರ್ಗ",
                description: "ವಿವರಣೆ",
                location: "ಸ್ಥಳ",
                assignedWorker: "ನೇಮಿಸಿದ ಕಾರ್ಮಿಕ",
                notAssigned: "ಇನ್ನೂ ನೇಮಿಸಲಾಗಿಲ್ಲ.",
                assignWorker: "ಕಾರ್ಮಿಕರನ್ನು ನೇಮಿಸಿ",
                waitVi: "VI ಪರಿಶೀಲನೆಗಾಗಿ ಕಾಯುತ್ತಿದೆ",
                selectWorker: "ಕಾರ್ಮಿಕರನ್ನು ಆಯ್ಕೆಮಾಡಿ",
                note: "PDO ಟಿಪ್ಪಣಿ (ಐಚ್ಛಿಕ)",
                notePh: "ಉದಾ: 3 ದಿನಗಳಲ್ಲಿ ಮುಗಿಸಿ. ಆದ್ಯತೆ ಹೆಚ್ಚು.",
                assignBtn: "ಕಾರ್ಮಿಕರನ್ನು ನೇಮಿಸಿ",
                assigning: "ನೇಮಿಸಲಾಗುತ್ತಿದೆ...",
                raiseFund: "ನಿಧಿ ವಿನಂತಿ →",
                noWorkers: "ಕಾರ್ಮಿಕರು ಕಂಡುಬಂದಿಲ್ಲ. ನಿಮ್ಮ ಪಂಚಾಯತ್‌ಗೆ ಕಾರ್ಮಿಕರನ್ನು ಸೇರಿಸಿ.",
                pickWorker: "ಕಾರ್ಮಿಕರನ್ನು ಆಯ್ಕೆಮಾಡಿ.",
                notAllowed: "ಈ ಸಮಸ್ಯೆಯನ್ನು ನೋಡುವ ಅನುಮತಿ ಇಲ್ಲ.",
                notFound: "ಸಮಸ್ಯೆ ಕಂಡುಬಂದಿಲ್ಲ.",
                profileMissing: "ಅಧಿಕಾರಿ ಪ್ರೊಫೈಲ್ ಇಲ್ಲ.",
                panchayatMissing: "PDO ಪ್ರೊಫೈಲ್‌ನಲ್ಲಿ panchayatId ಇಲ್ಲ.",
            },
            hi: {
                title: "मुद्दे का विवरण",
                subtitle: "वर्कर असाइन करें, स्टेटस ट्रैक करें और ज़रूरत हो तो फंड रिक्वेस्ट करें",
                back: "वापस",
                issueId: "इश्यू आईडी",
                status: "स्टेटस",
                created: "बनाया गया",
                titleLabel: "शीर्षक",
                category: "कैटेगरी",
                description: "विवरण",
                location: "लोकेशन",
                assignedWorker: "असाइन वर्कर",
                notAssigned: "अभी असाइन नहीं हुआ।",
                assignWorker: "वर्कर असाइन करें",
                waitVi: "VI वेरिफिकेशन का इंतज़ार",
                selectWorker: "वर्कर चुनें",
                note: "PDO नोट (Optional)",
                notePh: "उदा: 3 दिनों में पूरा करें. हाई प्रायोरिटी.",
                assignBtn: "वर्कर असाइन करें",
                assigning: "असाइन हो रहा है...",
                raiseFund: "फंड रिक्वेस्ट →",
                noWorkers: "कोई वर्कर नहीं मिला. अपने पंचायत के लिए वर्कर जोड़ें.",
                pickWorker: "वर्कर चुनें.",
                notAllowed: "आपको यह इश्यू देखने की अनुमति नहीं है।",
                notFound: "इश्यू नहीं मिला।",
                profileMissing: "Authority प्रोफाइल नहीं मिला।",
                panchayatMissing: "PDO प्रोफाइल में panchayatId नहीं है।",
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

            try {
                // 1) Load PDO profile
                const pdoSnap = await getDoc(doc(db, "authorities", user.uid));
                if (!pdoSnap.exists()) {
                    setErr(t.profileMissing);
                    setLoading(false);
                    return;
                }

                const pdo = pdoSnap.data() as any;

                if (pdo.role !== "pdo") {
                    router.replace(`/${locale}/role-select`);
                    return;
                }

                if (pdo.verified !== true) {
                    router.replace(`/${locale}/authority/status`);
                    return;
                }

                const panchayatId = pdo.panchayatId || pdo.gramPanchayatId || pdo.gpId;
                if (!panchayatId) {
                    setErr(t.panchayatMissing);
                    setLoading(false);
                    return;
                }

                // 2) Load issue
                const issueRef = doc(db, "issues", issueId);
                const issueSnap = await getDoc(issueRef);

                if (!issueSnap.exists()) {
                    setErr(t.notFound);
                    setLoading(false);
                    return;
                }

                const data = issueSnap.data() as any;

                // Security check: issue must belong to same panchayat
                if (data.panchayatId !== panchayatId) {
                    setErr(t.notAllowed);
                    setLoading(false);
                    return;
                }

                setIssue({ id: issueSnap.id, ...data });

                // 3) Load workers
                const ws = await getDocs(
                    query(collection(db, "workers"), where("panchayatId", "==", panchayatId))
                );

                setWorkers(
                    ws.docs.map((d) => ({
                        id: d.id,
                        ...(d.data() as any),
                    }))
                );
            } catch (e: any) {
                setErr(e?.message || "Failed to load issue.");
            } finally {
                setLoading(false);
            }
        };

        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [router, locale, issueId]);

    const canAssign = useMemo(() => {
        if (!issue) return false;
        return ["verified_by_vi", "in_progress"].includes(issue.status);
    }, [issue]);

    const assignWorker = async () => {
        if (!issue) return;

        if (!workerId) {
            setErr(t.pickWorker);
            return;
        }

        setErr("");
        setAssigning(true);

        try {
            const user = auth.currentUser;
            if (!user) {
                router.replace(`/${locale}/authority/login`);
                return;
            }

            const w = workers.find((x) => x.id === workerId);
            if (!w) {
                setErr("Worker not found.");
                setAssigning(false);
                return;
            }

            await updateDoc(doc(db, "issues", issue.id), {
                status: "in_progress",
                assignedWorker: {
                    id: w.id,
                    name: w.name,
                    phone: w.phone,
                    role: w.role || "",
                },
                assignedBy: user.uid,
                assignedAt: serverTimestamp(),
                pdoNote: assignNote || "",
                updatedAt: serverTimestamp(),
            });

            await addDoc(collection(db, "audit_logs"), {
                type: "ASSIGN_WORKER",
                issueId: issue.id,
                byUid: user.uid,
                worker: { id: w.id, name: w.name, phone: w.phone, role: w.role || "" },
                note: assignNote || "",
                at: serverTimestamp(),
            });

            setIssue((prev: any) => ({
                ...prev,
                status: "in_progress",
                assignedWorker: { id: w.id, name: w.name, phone: w.phone, role: w.role || "" },
            }));

            setAssignNote("");
        } catch (e: any) {
            setErr(e?.message || "Failed to assign worker.");
        } finally {
            setAssigning(false);
        }
    };

    if (loading) {
        return (
            <Screen center>
                <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
            </Screen>
        );
    }

    if (err) {
        return (
            <Screen padded>
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                    {err}
                </div>
            </Screen>
        );
    }

    if (!issue) return null;

    return (
        <Screen padded>
            <div className="w-full max-w-3xl mx-auto">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h1 className="text-xl sm:text-2xl font-extrabold text-green-900">
                            {t.title}
                        </h1>
                        <p className="text-sm text-green-800/80 mt-1">
                            {t.subtitle}
                        </p>
                    </div>

                    <button
                        onClick={() => router.back()}
                        className="shrink-0 px-3 py-2 rounded-xl border border-green-200 bg-white text-green-800 font-bold hover:bg-green-50"
                    >
                        {t.back}
                    </button>
                </div>

                {/* Issue Card */}
                <div className="mt-5 bg-white border border-green-100 rounded-2xl p-5 shadow-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-green-900/60">{t.issueId}</p>
                            <p className="font-extrabold text-green-900 break-all">{issue.id}</p>

                            <p className="text-xs text-green-900/60 mt-3">{t.created}</p>
                            <p className="text-sm font-bold text-green-900">
                                {fmtDate(issue.createdAt)}
                            </p>

                            <p className="text-xs text-green-900/60 mt-3">{t.status}</p>
                            <p className="inline-flex mt-1 px-3 py-1 rounded-full text-xs font-extrabold border border-green-200 bg-green-50 text-green-800">
                                {issue.status}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs text-green-900/60">{t.titleLabel}</p>
                            <p className="font-bold text-green-900">{issue.title || "—"}</p>

                            <p className="text-xs text-green-900/60 mt-3">{t.category}</p>
                            <p className="font-semibold text-green-900">{issue.category || "—"}</p>

                            {issue.description && (
                                <>
                                    <p className="text-xs text-green-900/60 mt-3">{t.description}</p>
                                    <p className="text-sm text-green-900/80">{issue.description}</p>
                                </>
                            )}

                            {(issue.locationText || issue.address) && (
                                <>
                                    <p className="text-xs text-green-900/60 mt-3">{t.location}</p>
                                    <p className="text-sm text-green-900/70">
                                        {issue.locationText || issue.address}
                                    </p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Assigned Worker */}
                    <div className="mt-5 border-t border-green-100 pt-4">
                        <p className="text-sm font-extrabold text-green-900">{t.assignedWorker}</p>

                        {issue.assignedWorker?.name ? (
                            <div className="mt-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                                <p className="font-bold text-green-900">{issue.assignedWorker.name}</p>
                                <p className="text-sm text-green-800/80">
                                    {issue.assignedWorker.phone || "—"}
                                    {issue.assignedWorker.role ? ` • ${issue.assignedWorker.role}` : ""}
                                </p>
                            </div>
                        ) : (
                            <p className="mt-2 text-sm text-green-800/70">{t.notAssigned}</p>
                        )}
                    </div>
                </div>

                {/* Assign Worker Panel */}
                <div className="mt-5 bg-white border border-green-100 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-2">
                        <h2 className="text-base font-extrabold text-green-900">{t.assignWorker}</h2>

                        {!canAssign && (
                            <span className="text-xs font-bold text-yellow-700 bg-yellow-50 border border-yellow-200 px-2 py-1 rounded-full">
                                {t.waitVi}
                            </span>
                        )}
                    </div>

                    {workers.length === 0 && (
                        <div className="mt-3 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm font-semibold text-yellow-800">
                            {t.noWorkers}
                        </div>
                    )}

                    <div className="mt-3">
                        <label className="text-xs font-bold text-green-900/70">
                            {t.selectWorker}
                        </label>

                        <select
                            value={workerId}
                            onChange={(e) => setWorkerId(e.target.value)}
                            disabled={!canAssign || assigning || workers.length === 0}
                            className="mt-1 w-full rounded-xl border border-green-200 bg-white px-3 py-3 text-green-900 font-semibold outline-none focus:ring-2 focus:ring-green-300"
                        >
                            <option value="">-- Choose --</option>
                            {workers.map((w) => (
                                <option key={w.id} value={w.id}>
                                    {w.name} {w.role ? `(${w.role})` : ""} {w.phone ? `- ${w.phone}` : ""}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="mt-3">
                        <label className="text-xs font-bold text-green-900/70">{t.note}</label>
                        <textarea
                            value={assignNote}
                            onChange={(e) => setAssignNote(e.target.value)}
                            disabled={!canAssign || assigning}
                            rows={3}
                            className="mt-1 w-full rounded-xl border border-green-200 bg-white px-3 py-3 text-green-900 font-semibold outline-none focus:ring-2 focus:ring-green-300"
                            placeholder={t.notePh}
                        />
                    </div>

                    <button
                        onClick={assignWorker}
                        disabled={!canAssign || assigning || workers.length === 0}
                        className="mt-4 w-full rounded-2xl bg-green-700 text-white font-extrabold py-3 hover:brightness-95 active:scale-[0.99] transition disabled:opacity-60"
                    >
                        {assigning ? t.assigning : t.assignBtn}
                    </button>

                    <button
                        onClick={() => router.push(`/${locale}/authority/fund-request/${issue.id}`)}
                        className="mt-3 w-full rounded-2xl bg-white border border-green-200 text-green-900 font-extrabold py-3 hover:bg-green-50 active:scale-[0.99] transition"
                    >
                        {t.raiseFund}
                    </button>
                </div>
            </div>
        </Screen>
    );
}
