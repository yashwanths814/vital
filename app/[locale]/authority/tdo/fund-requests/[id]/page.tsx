"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
    doc,
    getDoc,
    updateDoc,
    serverTimestamp,
    Timestamp
} from "firebase/firestore";
import { auth, db } from "../../../../../lib/firebase";
import Screen from "../../../../../components/Screen";

type FundRequest = {
    id: string;
    amount: number;
    reason: string;
    description?: string;
    status: "pending" | "approved" | "rejected";
    district: string;
    taluk: string;
    panchayatId: string;
    panchayatName?: string;
    villageId?: string;
    villageName?: string;
    issueLat?: number;
    issueLng?: string;
    requestedBy: string;
    requestedByName?: string;
    createdAt: Timestamp;
    documents?: string[];
    tdoComment?: string;
    decidedAt?: Timestamp;
    approvedAmount?: number;
    escalationReason?: string;
};

type AuditLog = {
    action: string;
    timestamp: Timestamp;
    by: string;
    byName?: string;
    comment?: string;
    status: string;
};

export default function FundApprovePage() {
    const router = useRouter();
    const params = useParams() as { locale?: string; id?: string };
    const locale = params?.locale || "en";
    const fundRequestId = params?.id as string;

    const t = useTranslations("fundApprove");
    const tc = useTranslations("common");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [fundRequest, setFundRequest] = useState<FundRequest | null>(null);
    const [userInfo, setUserInfo] = useState({ name: "", role: "" });

    const [comment, setComment] = useState("");
    const [approvedAmount, setApprovedAmount] = useState<number>(0);
    const [acting, setActing] = useState<"approving" | "rejecting" | "">("");
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

    useEffect(() => {
        const loadData = async () => {
            setError("");
            setLoading(true);

            const user = auth.currentUser;
            if (!user) {
                router.replace(`/${locale}/authority/login`);
                return;
            }

            try {
                // 1) Verify TDO profile
                const authoritySnap = await getDoc(doc(db, "authorities", user.uid));
                if (!authoritySnap.exists()) {
                    router.replace(`/${locale}/authority/register`);
                    return;
                }

                const authorityData = authoritySnap.data();

                if (authorityData?.role !== "tdo") {
                    router.replace(`/${locale}/role-select`);
                    return;
                }

                const isVerified = authorityData?.verified === true ||
                    authorityData?.verification?.status === "verified";

                if (!isVerified) {
                    router.replace(`/${locale}/authority/status`);
                    return;
                }

                const tdoDistrict = (authorityData?.district || "").trim();
                const tdoTaluk = (authorityData?.taluk || "").trim();

                setUserInfo({
                    name: authorityData?.name || "TDO Officer",
                    role: authorityData?.role
                });

                if (!tdoDistrict || !tdoTaluk) {
                    setError(t("missingScope"));
                    setLoading(false);
                    return;
                }

                // 2) Load fund request
                const fundRequestSnap = await getDoc(doc(db, "fund_requests", fundRequestId));
                if (!fundRequestSnap.exists()) {
                    setError(t("notFound"));
                    setLoading(false);
                    return;
                }

                const requestData = fundRequestSnap.data() as FundRequest;
                requestData.id = fundRequestSnap.id;

                // 3) Verify jurisdiction
                const reqDistrict = (requestData?.district || "").trim();
                const reqTaluk = (requestData?.taluk || "").trim();

                if (!reqDistrict || !reqTaluk) {
                    setError(t("missingScope"));
                    setLoading(false);
                    return;
                }

                if (
                    tdoDistrict.toLowerCase() !== reqDistrict.toLowerCase() ||
                    tdoTaluk.toLowerCase() !== reqTaluk.toLowerCase()
                ) {
                    setError(t("notAllowed"));
                    setLoading(false);
                    return;
                }

                setFundRequest(requestData);
                setApprovedAmount(requestData.amount || 0);

                // 4) Load audit logs if available
                try {
                    const auditLogsSnap = await getDoc(
                        doc(db, "fund_requests", fundRequestId, "audit_logs", "main")
                    );
                    if (auditLogsSnap.exists()) {
                        const logsData = auditLogsSnap.data();
                        setAuditLogs(logsData.logs || []);
                    }
                } catch (auditError) {
                    console.log("No audit logs found");
                }

            } catch (err: any) {
                console.error("Fund request load error:", err);
                setError(err.message || t("loadFail"));
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [fundRequestId, locale, router, t]);

    const canAct = fundRequest?.status === "pending";
    const isPending = fundRequest?.status === "pending";
    const isApproved = fundRequest?.status === "approved";
    const isRejected = fundRequest?.status === "rejected";

    const handleAction = async (action: "approved" | "rejected") => {
        if (!fundRequest || !canAct) return;

        setError("");
        setActing(action === "approved" ? "approving" : "rejecting");

        try {
            const user = auth.currentUser;
            if (!user) throw new Error("Not authenticated");

            const updates: any = {
                status: action,
                updatedAt: serverTimestamp(),
                decidedAt: serverTimestamp(),
                decidedBy: user.uid,
                decidedByName: userInfo.name,
                tdoComment: comment.trim() || null
            };

            if (action === "approved") {
                updates.approvedAmount = approvedAmount;
                updates.approvedAt = serverTimestamp();
            }

            if (action === "rejected") {
                updates.rejectedAt = serverTimestamp();
                updates.rejectionReason = comment.trim() || "No reason provided";
            }

            // Update main document
            await updateDoc(doc(db, "fund_requests", fundRequestId), updates);

            // Add to audit log
            const auditUpdate = {
                action: `fund_request_${action}`,
                timestamp: serverTimestamp(),
                by: user.uid,
                byName: userInfo.name,
                comment: comment.trim() || null,
                status: action,
                amount: fundRequest.amount,
                approvedAmount: action === "approved" ? approvedAmount : null
            };

            // Try to update audit logs subcollection
            try {
                const auditRef = doc(db, "fund_requests", fundRequestId, "audit_logs", "main");
                const auditSnap = await getDoc(auditRef);

                if (auditSnap.exists()) {
                    const existingLogs = auditSnap.data().logs || [];
                    await updateDoc(auditRef, {
                        logs: [...existingLogs, auditUpdate],
                        updatedAt: serverTimestamp()
                    });
                } else {
                    await updateDoc(auditRef, {
                        logs: [auditUpdate],
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp()
                    });
                }
            } catch (auditError) {
                console.warn("Could not update audit logs:", auditError);
            }

            // Show success message and redirect
            setTimeout(() => {
                router.push(`/${locale}/authority/tdo/funds`);
            }, 1500);

        } catch (err: any) {
            console.error("Action error:", err);
            setError(err.message || t("actionFail"));
            setActing("");
        }
    };

    const formatDate = (timestamp: Timestamp) => {
        if (!timestamp) return "N/A";
        return timestamp.toDate().toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    if (loading) {
        return (
            <Screen center>
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-green-700 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-green-700 font-semibold">{tc("loading")}</p>
                </div>
            </Screen>
        );
    }

    if (error) {
        return (
            <Screen padded>
                <div className="max-w-xl mx-auto">
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="text-red-600 text-2xl">⚠️</div>
                            <div>
                                <p className="font-bold text-red-800 text-lg">Error</p>
                                <p className="text-red-700 mt-1">{error}</p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={() => router.back()}
                                className="flex-1 px-4 py-3 rounded-xl border border-red-200 bg-white text-red-700 font-bold hover:bg-red-50"
                            >
                                {t("back")}
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700"
                            >
                                Retry
                            </button>
                        </div>
                    </div>
                </div>
            </Screen>
        );
    }

    if (!fundRequest) return null;

    return (
        <Screen padded>
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <button
                                onClick={() => router.back()}
                                className="p-2 rounded-lg hover:bg-green-50"
                            >
                                ←
                            </button>
                            <h1 className="text-xl sm:text-2xl font-extrabold text-green-900">
                                {t("title")}
                            </h1>
                        </div>
                        <p className="text-sm text-green-800/80">
                            {t("subtitle")}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-extrabold border ${isPending
                            ? "border-yellow-200 bg-yellow-50 text-yellow-800"
                            : isApproved
                                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                : "border-red-200 bg-red-50 text-red-700"
                            }`}>
                            {t(`status_${fundRequest.status}` as any)}
                        </span>
                        <button
                            onClick={() => router.push(`/${locale}/authority/tdo/funds`)}
                            className="px-3 py-2 rounded-xl border border-green-200 bg-white text-green-800 font-bold hover:bg-green-50"
                        >
                            All Requests
                        </button>
                    </div>
                </div>

                {/* Main Card */}
                <div className="bg-white border border-green-100 rounded-2xl p-5 sm:p-6 shadow-sm mb-6">
                    {/* Request Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                        <div>
                            <p className="text-xs font-bold text-green-900/70 mb-1">
                                {t("requestId")}
                            </p>
                            <p className="font-mono font-bold text-green-900 break-all">
                                {fundRequest.id}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-green-900/70 mb-1">
                                Requested Date
                            </p>
                            <p className="font-bold text-green-900">
                                {formatDate(fundRequest.createdAt)}
                            </p>
                        </div>
                    </div>

                    {/* Amount Card */}
                    <div className="mb-6">
                        <p className="text-xs font-bold text-green-900/70 mb-2">
                            {t("amount")}
                        </p>
                        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-2xl sm:text-3xl font-extrabold text-green-900">
                                        {formatCurrency(fundRequest.amount)}
                                    </p>
                                    <p className="text-sm text-green-800/70 mt-1">
                                        Requested Amount
                                    </p>
                                </div>
                                {isPending && (
                                    <div className="text-right">
                                        <label className="text-xs font-bold text-green-900/70 block mb-2">
                                            Approve Amount
                                        </label>
                                        <input
                                            type="number"
                                            value={approvedAmount}
                                            onChange={(e) => setApprovedAmount(Number(e.target.value))}
                                            min="0"
                                            max={fundRequest.amount}
                                            className="w-32 px-3 py-2 rounded-lg border border-green-300 text-green-900 font-bold text-right outline-none focus:ring-2 focus:ring-green-400"
                                        />
                                        <p className="text-xs text-green-800/60 mt-1">
                                            Max: {formatCurrency(fundRequest.amount)}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Jurisdiction */}
                    <div className="mb-6">
                        <p className="text-xs font-bold text-green-900/70 mb-2">
                            {t("scope")}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="rounded-xl border border-green-100 bg-green-50 px-4 py-3">
                                <p className="text-xs font-bold text-green-900/70">District</p>
                                <p className="text-sm font-bold text-green-900">
                                    {fundRequest.district || "N/A"}
                                </p>
                            </div>
                            <div className="rounded-xl border border-green-100 bg-green-50 px-4 py-3">
                                <p className="text-xs font-bold text-green-900/70">Taluk</p>
                                <p className="text-sm font-bold text-green-900">
                                    {fundRequest.taluk || "N/A"}
                                </p>
                            </div>
                            <div className="rounded-xl border border-green-100 bg-green-50 px-4 py-3">
                                <p className="text-xs font-bold text-green-900/70">Panchayat</p>
                                <p className="text-sm font-bold text-green-900">
                                    {fundRequest.panchayatName || fundRequest.panchayatId || "N/A"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Reason & Details */}
                    <div className="mb-6">
                        <p className="text-xs font-bold text-green-900/70 mb-2">
                            {t("reason")}
                        </p>
                        <div className="rounded-xl border border-green-100 bg-green-50 p-4">
                            <p className="font-bold text-green-900 mb-2">
                                {fundRequest.reason || "No reason provided"}
                            </p>
                            {fundRequest.description && (
                                <p className="text-sm text-green-900/80">
                                    {fundRequest.description}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Requested By */}
                    <div className="mb-6">
                        <p className="text-xs font-bold text-green-900/70 mb-2">
                            Requested By
                        </p>
                        <div className="rounded-xl border border-green-100 bg-green-50 p-4">
                            <p className="font-bold text-green-900">
                                {fundRequest.requestedByName || "Unknown"}
                            </p>
                            <p className="text-sm text-green-900/70 mt-1">
                                Villager ID: {fundRequest.requestedBy}
                            </p>
                        </div>
                    </div>

                    {/* Documents if available */}
                    {fundRequest.documents && fundRequest.documents.length > 0 && (
                        <div className="mb-6">
                            <p className="text-xs font-bold text-green-900/70 mb-2">
                                Supporting Documents
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {fundRequest.documents.map((docUrl, index) => (
                                    <a
                                        key={index}
                                        href={docUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 p-3 rounded-xl border border-green-200 bg-white hover:bg-green-50"
                                    >
                                        <span className="text-green-600">📄</span>
                                        <span className="text-sm font-bold text-green-900 truncate">
                                            Document {index + 1}
                                        </span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Comment Section */}
                    <div className="mb-6">
                        <label className="text-xs font-bold text-green-900/70 block mb-2">
                            {t("comment")}
                        </label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder={t("commentPh")}
                            rows={3}
                            disabled={!canAct}
                            className={`w-full rounded-xl border p-3 text-green-900 font-semibold outline-none transition-all ${canAct
                                ? "border-green-300 focus:ring-2 focus:ring-green-400 focus:border-green-400"
                                : "border-gray-300 bg-gray-50"
                                }`}
                        />
                        <p className="text-xs text-green-800/60 mt-1">
                            {canAct
                                ? "Add your remarks before approving or rejecting"
                                : "Comments cannot be added after decision"
                            }
                        </p>
                    </div>

                    {/* Action Buttons */}
                    {!canAct && (
                        <div className="mb-6 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
                            <div className="flex items-center gap-2">
                                <span className="text-yellow-600">ℹ️</span>
                                <p className="text-sm font-bold text-yellow-800">
                                    {t("alreadyDecided")}
                                </p>
                            </div>
                            {fundRequest.tdoComment && (
                                <p className="text-sm text-yellow-700 mt-2">
                                    <span className="font-bold">Comment:</span> {fundRequest.tdoComment}
                                </p>
                            )}
                        </div>
                    )}

                    {canAct && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button
                                onClick={() => handleAction("approved")}
                                disabled={acting !== ""}
                                className="rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-extrabold py-4 hover:from-green-700 hover:to-emerald-700 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                            >
                                {acting === "approving" ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        {t("approving")}
                                    </div>
                                ) : (
                                    t("approve")
                                )}
                            </button>

                            <button
                                onClick={() => handleAction("rejected")}
                                disabled={acting !== ""}
                                className="rounded-2xl bg-gradient-to-r from-red-600 to-orange-600 text-white font-extrabold py-4 hover:from-red-700 hover:to-orange-700 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                            >
                                {acting === "rejecting" ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        {t("rejecting")}
                                    </div>
                                ) : (
                                    t("reject")
                                )}
                            </button>
                        </div>
                    )}
                </div>

                {/* Audit Logs */}
                {auditLogs.length > 0 && (
                    <div className="bg-white border border-green-100 rounded-2xl p-5 sm:p-6 shadow-sm">
                        <h3 className="font-bold text-green-900 mb-4">Audit Trail</h3>
                        <div className="space-y-3">
                            {auditLogs.map((log, index) => (
                                <div
                                    key={index}
                                    className="flex items-start gap-3 p-3 rounded-xl border border-green-100 bg-green-50"
                                >
                                    <div className={`w-2 h-2 rounded-full mt-2 ${log.status === 'approved' ? 'bg-emerald-500' :
                                        log.status === 'rejected' ? 'bg-red-500' :
                                            'bg-yellow-500'
                                        }`}></div>
                                    <div className="flex-1">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                                            <p className="font-bold text-green-900 capitalize">
                                                {log.action.replace('_', ' ')}
                                            </p>
                                            <p className="text-xs text-green-800/70">
                                                {log.timestamp ? formatDate(log.timestamp) : 'N/A'}
                                            </p>
                                        </div>
                                        {log.comment && (
                                            <p className="text-sm text-green-800/80 mt-1">
                                                {log.comment}
                                            </p>
                                        )}
                                        <p className="text-xs text-green-800/60 mt-1">
                                            By: {log.byName || log.by}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={() => router.back()}
                        className="flex-1 px-4 py-3 rounded-xl border border-green-200 bg-white text-green-900 font-bold hover:bg-green-50"
                    >
                        ← {t("back")}
                    </button>
                    <button
                        onClick={() => router.push(`/${locale}/authority/tdo/map`)}
                        className="flex-1 px-4 py-3 rounded-xl border border-green-200 bg-white text-green-900 font-bold hover:bg-green-50"
                    >
                        View on Map
                    </button>
                    <button
                        onClick={() => router.push(`/${locale}/authority/tdo/funds`)}
                        className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold hover:from-green-700 hover:to-emerald-700"
                    >
                        All Requests
                    </button>
                </div>
            </div>
        </Screen>
    );
}