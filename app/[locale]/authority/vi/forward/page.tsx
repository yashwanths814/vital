"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    updateDoc,
    where,
    serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../../../../lib/firebase";
import Screen from "../../../../components/Screen";

type Issue = {
    id: string;
    title: string;
    category: string;
    description: string;
    villagerName: string;
    villagerMobile: string;
};

export default function VIForwardToPDOPage() {
    const router = useRouter();
    const params = useParams() as { locale?: string };
    const locale = params?.locale || "en";

    const [loading, setLoading] = useState(true);
    const [issues, setIssues] = useState<Issue[]>([]);
    const [err, setErr] = useState("");

    const t = useMemo(() => {
        const L: any = {
            en: {
                title: "Forward to PDO",
                subtitle: "Send verified issues to Gram Panchayat PDO for assignment",
                loading: "Loading verified issues…",
                noData: "No verified issues to forward",
                forward: "Forward to PDO",
                done: "Forwarded ✅",
            },
            kn: {
                title: "PDO ಗೆ ಕಳುಹಿಸಿ",
                subtitle: "ಪರಿಶೀಲಿಸಿದ ಸಮಸ್ಯೆಗಳನ್ನು PDO ಗೆ ಕಳುಹಿಸಿ",
                loading: "ಪರಿಶೀಲಿಸಿದ ಸಮಸ್ಯೆಗಳು ಲೋಡ್ ಆಗುತ್ತಿದೆ…",
                noData: "PDO ಗೆ ಕಳುಹಿಸಲು ಸಮಸ್ಯೆಗಳು ಇಲ್ಲ",
                forward: "PDO ಗೆ ಕಳುಹಿಸಿ",
                done: "ಕಳುಹಿಸಲಾಗಿದೆ ✅",
            },
            hi: {
                title: "PDO को भेजें",
                subtitle: "सत्यापित समस्याएँ PDO को असाइनमेंट के लिए भेजें",
                loading: "सत्यापित समस्याएँ लोड हो रही हैं…",
                noData: "भेजने के लिए कोई सत्यापित समस्या नहीं",
                forward: "PDO को भेजें",
                done: "भेज दिया ✅",
            },
        };
        return L[locale] || L.en;
    }, [locale]);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setErr("");

            const user = auth.currentUser;
            if (!user) {
                router.replace(`/${locale}/authority/login`);
                return;
            }

            // ✅ Verify Village In-charge profile
            const authRef = doc(db, "authorities", user.uid);
            const authSnap = await getDoc(authRef);

            if (!authSnap.exists()) {
                setErr("Authority profile missing");
                setLoading(false);
                return;
            }

            const a = authSnap.data() as any;

            if (a.role !== "village_incharge") {
                router.replace(`/${locale}/role-select`);
                return;
            }

            if (!a.verified) {
                router.replace(`/${locale}/authority/status`);
                return;
            }

            const panchayatId = a.panchayatId;
            if (!panchayatId) {
                setErr("panchayatId missing");
                setLoading(false);
                return;
            }

            // ✅ Get verified issues only (ready to forward)
            const qy = query(
                collection(db, "issues"),
                where("panchayatId", "==", panchayatId),
                where("status", "==", "verified_by_vi")
            );

            const snap = await getDocs(qy);

            const list: Issue[] = snap.docs.map((d) => {
                const i = d.data() as any;
                return {
                    id: d.id,
                    title: i.title,
                    category: i.category,
                    description: i.description,
                    villagerName: i.villagerName,
                    villagerMobile: i.villagerMobile,
                };
            });

            setIssues(list);
            setLoading(false);
        };

        load();
    }, [router, locale]);

    const forwardToPDO = async (issueId: string) => {
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        await updateDoc(doc(db, "issues", issueId), {
            status: "assigned_to_pdo",
            assignedByVI: uid,
            assignedToPDOAt: serverTimestamp(),
        });

        setIssues((prev) => prev.filter((x) => x.id !== issueId));
    };

    return (
        <Screen padded>
            <h1 className="text-xl sm:text-2xl font-extrabold text-green-900">
                {t.title}
            </h1>
            <p className="text-sm text-green-800/80 mt-1">{t.subtitle}</p>

            {loading && (
                <div className="mt-8 text-center text-green-700 font-semibold">
                    {t.loading}
                </div>
            )}

            {!loading && err && (
                <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                    {err}
                </div>
            )}

            {!loading && !err && issues.length === 0 && (
                <div className="mt-8 rounded-xl bg-white border border-green-200 p-4 text-center text-green-800 font-semibold">
                    {t.noData}
                </div>
            )}

            {!loading && !err && issues.length > 0 && (
                <div className="mt-6 space-y-4">
                    {issues.map((i) => (
                        <div
                            key={i.id}
                            className="rounded-2xl bg-white border border-green-200 p-4 shadow-sm"
                        >
                            <div className="font-extrabold text-green-900">{i.title}</div>
                            <div className="text-xs text-green-800/80 mt-1">
                                Category: {i.category}
                            </div>

                            <p className="text-sm text-green-900/80 mt-2">{i.description}</p>

                            <div className="mt-3 text-xs text-green-800/80">
                                👤 {i.villagerName} • 📞 {i.villagerMobile}
                            </div>

                            <button
                                onClick={() => forwardToPDO(i.id)}
                                className="mt-4 w-full rounded-xl bg-green-600 text-white py-2 font-extrabold hover:bg-green-700 active:scale-[0.99] transition"
                            >
                                {t.forward}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </Screen>
    );
}
