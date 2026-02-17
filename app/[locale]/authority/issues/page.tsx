"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    orderBy,
    query,
    where,
    Timestamp,
} from "firebase/firestore";
import { auth, db } from "../../../lib/firebase";
import Screen from "../../../components/Screen";

type Issue = {
    id: string;
    title?: string;
    category?: string;
    description?: string;
    status?: string;
    createdAt?: any;
    locationText?: string;
    address?: string;
    villagerName?: string;
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

export default function AuthorityIssuesPage() {
    const router = useRouter();
    const params = useParams() as { locale?: string };
    const locale = params?.locale || "en";
    const sp = useSearchParams();

    const status = sp.get("status") || "submitted";

    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");
    const [issues, setIssues] = useState<Issue[]>([]);
    const [header, setHeader] = useState({ panchayatId: "", role: "" });

    const t = useMemo(() => {
        const L: any = {
            en: {
                title: "Issues",
                subtitle: "Issues in your Gram Panchayat",
                back: "Back",
                empty: "No issues found for this filter.",
                open: "Open",
                status: "Status",
                created: "Created",
                view: "Open details →",
            },
            kn: {
                title: "ಸಮಸ್ಯೆಗಳು",
                subtitle: "ನಿಮ್ಮ ಗ್ರಾಮ ಪಂಚಾಯತ್ ಸಮಸ್ಯೆಗಳು",
                back: "ಹಿಂದೆ",
                empty: "ಈ ಫಿಲ್ಟರ್‌ಗೆ ಯಾವುದೇ ಸಮಸ್ಯೆಗಳು ಇಲ್ಲ.",
                open: "ತೆರೆ",
                status: "ಸ್ಥಿತಿ",
                created: "ರಚಿಸಿದ ಸಮಯ",
                view: "ವಿವರಗಳು →",
            },
            hi: {
                title: "मुद्दे",
                subtitle: "आपकी ग्राम पंचायत के मुद्दे",
                back: "वापस",
                empty: "इस फ़िल्टर में कोई मुद्दा नहीं मिला।",
                open: "खोलें",
                status: "स्टेटस",
                created: "बनाया गया",
                view: "डिटेल्स →",
            },
        };
        return L[locale] || L.en;
    }, [locale]);

    useEffect(() => {
        const load = async () => {
            setErr("");
            setLoading(true);
            setIssues([]);

            const user = auth.currentUser;
            if (!user) {
                router.replace(`/${locale}/authority/login`);
                return;
            }

            // 1) Authority profile
            const authRef = doc(db, "authorities", user.uid);
            const authSnap = await getDoc(authRef);

            if (!authSnap.exists()) {
                router.replace(`/${locale}/authority/register`);
                return;
            }

            const a = authSnap.data() as any;

            if (a?.role !== "pdo") {
                router.replace(`/${locale}/role-select`);
                return;
            }

            if (a?.verified !== true) {
                router.replace(`/${locale}/authority/status`);
                return;
            }

            const panchayatId = a?.panchayatId || a?.gramPanchayatId || a?.gpId;
            if (!panchayatId) {
                setErr("panchayatId missing in authorities profile.");
                setLoading(false);
                return;
            }

            setHeader({ panchayatId, role: a?.role || "" });

            // 2) Issues for this panchayat + status
            try {
                const issuesRef = collection(db, "issues");
                const qy = query(
                    issuesRef,
                    where("panchayatId", "==", panchayatId),
                    where("status", "==", status),
                    orderBy("createdAt", "desc")
                );

                const snap = await getDocs(qy);
                const rows: Issue[] = snap.docs.map((d) => ({
                    id: d.id,
                    ...(d.data() as any),
                }));

                setIssues(rows);
            } catch (e: any) {
                setErr(e?.message || "Failed to load issues.");
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [router, locale, status]);

    return (
        <Screen padded>
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-extrabold text-green-900">{t.title}</h1>
                    <p className="text-sm text-green-800/80 mt-1">
                        {t.subtitle} • <span className="font-semibold">{header.panchayatId}</span>
                    </p>
                    <p className="text-xs text-green-900/60 mt-1">
                        {t.status}: <span className="font-semibold">{status}</span>
                    </p>
                </div>

                <button
                    onClick={() => router.back()}
                    className="shrink-0 px-4 py-2 rounded-xl bg-white border border-green-200 text-green-900 font-extrabold hover:bg-green-50 active:scale-[0.99] transition"
                >
                    {t.back}
                </button>
            </div>

            {loading && (
                <div className="mt-10 text-center text-green-700 font-semibold">
                    Loading issues…
                </div>
            )}

            {!loading && err && (
                <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                    {err}
                </div>
            )}

            {!loading && !err && issues.length === 0 && (
                <div className="mt-6 rounded-2xl border border-green-200 bg-white px-4 py-4 text-sm font-semibold text-green-800">
                    {t.empty}
                </div>
            )}

            {!loading && !err && issues.length > 0 && (
                <div className="mt-6 space-y-3">
                    {issues.map((it) => (
                        <div
                            key={it.id}
                            className="rounded-2xl bg-white border border-green-200 p-4 shadow-sm"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="text-sm text-green-900/60">
                                        {t.created}:{" "}
                                        <span className="font-semibold text-green-900">
                                            {fmtDate(it.createdAt)}
                                        </span>
                                    </div>

                                    <div className="mt-1 text-lg font-extrabold text-green-900 truncate">
                                        {it.title || "Untitled Issue"}
                                    </div>

                                    <div className="mt-1 text-sm text-green-900/70">
                                        <span className="font-semibold">Category:</span>{" "}
                                        {it.category || "-"}
                                        {"  •  "}
                                        <span className="font-semibold">{t.status}:</span>{" "}
                                        {it.status || "-"}
                                    </div>

                                    {it.description && (
                                        <div className="mt-2 text-sm text-green-900/80 line-clamp-2">
                                            {it.description}
                                        </div>
                                    )}

                                    {(it.locationText || it.address) && (
                                        <div className="mt-2 text-xs text-green-900/60">
                                            {it.locationText || it.address}
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() =>
                                        router.push(`/${locale}/authority/issues/${it.id}`)
                                    }
                                    className="shrink-0 px-4 py-2 rounded-xl bg-green-700 text-white font-extrabold hover:bg-green-800 active:scale-[0.99] transition"
                                >
                                    {t.open}
                                </button>
                            </div>

                            <button
                                onClick={() => router.push(`/${locale}/authority/issues/${it.id}`)}
                                className="mt-3 text-sm font-bold text-green-700 hover:underline"
                            >
                                {t.view}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </Screen>
    );
}
