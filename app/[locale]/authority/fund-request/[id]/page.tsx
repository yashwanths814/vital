"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../../../lib/firebase";
import Screen from "../../../..//components/Screen";

export default function FundRequestPage() {
    const router = useRouter();
    const params = useParams() as { locale?: string; id?: string };
    const locale = params?.locale || "en";
    const issueId = params?.id as string;

    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    const [amount, setAmount] = useState("");
    const [reason, setReason] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const [issue, setIssue] = useState<any>(null);
    const [pdoProfile, setPdoProfile] = useState<any>(null);

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
                const pdoSnap = await getDoc(doc(db, "authorities", user.uid));
                if (!pdoSnap.exists()) throw new Error("PDO profile missing.");

                const pdo = pdoSnap.data() as any;
                if (pdo.role !== "pdo") {
                    router.replace(`/${locale}/role-select`);
                    return;
                }
                if (pdo.verified !== true) {
                    router.replace(`/${locale}/authority/status`);
                    return;
                }

                const issueSnap = await getDoc(doc(db, "issues", issueId));
                if (!issueSnap.exists()) throw new Error("Issue not found.");

                const iss = issueSnap.data() as any;
                const panchayatId = pdo.panchayatId || pdo.gramPanchayatId || pdo.gpId;

                if (!panchayatId || iss.panchayatId !== panchayatId) {
                    throw new Error("Not allowed (issue not in your Panchayat).");
                }

                setPdoProfile(pdo);
                setIssue({ id: issueSnap.id, ...iss });
            } catch (e: any) {
                setErr(e?.message || "Failed to load.");
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [router, locale, issueId]);

    const submit = async () => {
        setErr("");

        const amt = Number(amount);
        if (!amt || amt <= 0) {
            setErr("Enter valid amount.");
            return;
        }
        if (!reason.trim()) {
            setErr("Enter reason.");
            return;
        }

        setSubmitting(true);

        try {
            const user = auth.currentUser;
            if (!user) {
                router.replace(`/${locale}/authority/login`);
                return;
            }

            // Store fund request (TDO will review)
            await addDoc(collection(db, "fund_requests"), {
                issueId: issue.id,

                panchayatId: issue.panchayatId,
                talukId: issue.talukId,
                districtId: issue.districtId,

                requestedByUid: user.uid,
                requestedByRole: "pdo",

                amount: amt,
                reason: reason.trim(),

                status: "pending", // pending | approved | rejected
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            // optional audit log
            await addDoc(collection(db, "audit_logs"), {
                type: "FUND_REQUEST",
                issueId: issue.id,
                byUid: user.uid,
                amount: amt,
                at: serverTimestamp(),
            });

            router.replace(`/${locale}/authority/pdo/dashboard`);
        } catch (e: any) {
            setErr(e?.message || "Failed to submit fund request.");
        } finally {
            setSubmitting(false);
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
            <div className="w-full max-w-md mx-auto">
                <h1 className="text-xl sm:text-2xl font-extrabold text-green-900">
                    Raise Fund Request (PDO → TDO)
                </h1>
                <p className="text-sm text-green-800/80 mt-1">
                    Request additional funds for this issue.
                </p>

                <div className="mt-4 bg-white border border-green-100 rounded-2xl p-5 shadow-sm">
                    <p className="text-xs text-green-900/60">Issue</p>
                    <p className="font-extrabold text-green-900 mt-1">{issue.title || issue.id}</p>
                    <p className="text-sm text-green-800/80 mt-1">
                        Category: {issue.category || "—"}
                    </p>

                    <div className="mt-4">
                        <label className="text-xs font-bold text-green-900/70">Amount (₹)</label>
                        <input
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            inputMode="numeric"
                            className="mt-1 w-full rounded-xl border border-green-200 bg-white px-3 py-3 text-green-900 font-semibold outline-none focus:ring-2 focus:ring-green-300"
                            placeholder="Example: 25000"
                        />
                    </div>

                    <div className="mt-3">
                        <label className="text-xs font-bold text-green-900/70">Reason</label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={4}
                            className="mt-1 w-full rounded-xl border border-green-200 bg-white px-3 py-3 text-green-900 font-semibold outline-none focus:ring-2 focus:ring-green-300"
                            placeholder="Example: Need materials + contractor for pipeline repair"
                        />
                    </div>

                    <button
                        onClick={submit}
                        disabled={submitting}
                        className="mt-4 w-full rounded-2xl bg-green-700 text-white font-extrabold py-3 hover:brightness-95 active:scale-[0.99] transition disabled:opacity-60"
                    >
                        {submitting ? "Submitting..." : "Submit Request"}
                    </button>

                    <button
                        onClick={() => router.back()}
                        className="mt-3 w-full rounded-2xl bg-white border border-green-200 text-green-900 font-extrabold py-3 hover:bg-green-50"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </Screen>
    );
}
