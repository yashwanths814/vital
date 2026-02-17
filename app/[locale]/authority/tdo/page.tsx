"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { auth, db } from "../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where,
    Timestamp,
} from "firebase/firestore";
import Screen from "../../../components/Screen";
import { FiBarChart2, FiMap, FiCheckCircle, FiAlertCircle, FiUsers, FiDollarSign, FiClock } from "react-icons/fi";

// Types
type DashboardStat = {
    label: string;
    value: number | string;
    to: string;
    color: string;
    icon: React.ReactNode;
    trend?: "up" | "down" | "neutral";
};

type QuickAction = {
    title: string;
    description: string;
    icon: React.ReactNode;
    to: string;
    color: string;
    bgColor: string;
};

type FundRequest = {
    id: string;
    amount: number;
    reason: string;
    status: "pending" | "approved" | "rejected";
    panchayatName: string;
    createdAt: Timestamp;
};

export default function TDODashboardOnePage() {
    const router = useRouter();
    const params = useParams() as { locale?: string };
    const locale = params?.locale || "en";

    // Translations - FIXED: Use correct namespace or default
    const t = useTranslations();

    // Get translation with fallbacks
    const getTranslation = (key: string, fallback: string): string => {
        try {
            return t(key) || fallback;
        } catch {
            return fallback;
        }
    };

    // State
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [userName, setUserName] = useState("");
    const [jurisdiction, setJurisdiction] = useState({
        district: "",
        taluk: "",
    });

    // Dashboard Data
    const [stats, setStats] = useState<DashboardStat[]>([]);
    const [pendingFunds, setPendingFunds] = useState<FundRequest[]>([]);
    const [counts, setCounts] = useState({
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0
    });

    // Format currency for Indian Rupees
    const formatCurrency = (amount: number): string => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    // Format date relative to now
    const formatTimeAgo = (timestamp: Timestamp): string => {
        const now = new Date();
        const date = timestamp.toDate();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    // Load dashboard data
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            try {
                setLoading(true);
                setError("");

                if (!user) {
                    router.replace(`/${locale}/authority/login`);
                    return;
                }

                // 1. Get TDO profile
                const authorityDoc = await getDoc(doc(db, "authorities", user.uid));

                if (!authorityDoc.exists()) {
                    router.replace(`/${locale}/authority/register`);
                    return;
                }

                const authorityData = authorityDoc.data();

                // Check role and verification
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

                // Set user info
                setUserName(authorityData?.name || "Officer");
                setJurisdiction({
                    district: authorityData?.district || "",
                    taluk: authorityData?.taluk || "",
                });

                if (!authorityData?.district || !authorityData?.taluk) {
                    setError("Your jurisdiction is not configured");
                    setLoading(false);
                    return;
                }

                const { district, taluk } = authorityData;

                // 2. Fetch all data in parallel
                const [
                    issuesSnapshot,
                    villagersSnapshot,
                    fundRequestsSnapshot,
                    workersSnapshot,
                    pendingFundsSnapshot
                ] = await Promise.all([
                    // Issues
                    getDocs(query(
                        collection(db, "issues"),
                        where("district", "==", district),
                        where("taluk", "==", taluk)
                    )),
                    // Villagers
                    getDocs(query(
                        collection(db, "villagers"),
                        where("district", "==", district),
                        where("taluk", "==", taluk)
                    )),
                    // All fund requests for stats
                    getDocs(query(
                        collection(db, "fund_requests"),
                        where("district", "==", district),
                        where("taluk", "==", taluk)
                    )),
                    // Workers
                    getDocs(query(
                        collection(db, "workers"),
                        where("district", "==", district),
                        where("taluk", "==", taluk)
                    )),
                    // Pending fund requests ONLY
                    getDocs(query(
                        collection(db, "fund_requests"),
                        where("district", "==", district),
                        where("taluk", "==", taluk),
                        where("status", "==", "pending")
                    ))
                ]);

                // 3. Process data and calculate stats
                let totalIssues = 0;
                let pendingIssues = 0;
                let escalatedIssues = 0;
                let totalFundRequests = 0;
                let pendingFundRequests = 0;
                let approvedFunds = 0;
                let rejectedFunds = 0;

                const pendingFundsList: FundRequest[] = [];

                // Process issues
                issuesSnapshot.forEach((doc) => {
                    const issue = doc.data();
                    totalIssues++;

                    if (issue.status !== "resolved" && issue.status !== "closed") {
                        pendingIssues++;
                    }

                    if (["escalated_tdo", "escalated_ddo"].includes(issue.status)) {
                        escalatedIssues++;
                    }
                });

                // Process all fund requests for stats
                fundRequestsSnapshot.forEach((doc) => {
                    const request = doc.data();
                    totalFundRequests++;

                    if (request.status === "pending") {
                        pendingFundRequests++;
                    } else if (request.status === "approved") {
                        approvedFunds += request.amount || 0;
                    } else if (request.status === "rejected") {
                        rejectedFunds++;
                    }
                });

                // Process pending fund requests for display
                pendingFundsSnapshot.forEach((doc) => {
                    const request = doc.data();
                    if (pendingFundsList.length < 3) {
                        pendingFundsList.push({
                            id: doc.id,
                            amount: request.amount || 0,
                            reason: request.reason || "",
                            status: "pending",
                            panchayatName: request.panchayatName || request.panchayatId || "Unknown",
                            createdAt: request.createdAt || Timestamp.now()
                        });
                    }
                });

                // Update counts
                setCounts({
                    total: totalFundRequests,
                    pending: pendingFundRequests,
                    approved: fundRequestsSnapshot.size - pendingFundRequests - rejectedFunds,
                    rejected: rejectedFunds
                });

                // 4. Update stats for dashboard - FIXED: Using direct labels instead of translations
                const dashboardStats: DashboardStat[] = [
                    {
                        label: locale === "kn" ? "ಸಮಸ್ಯೆಗಳು" : locale === "hi" ? "समस्याएं" : "Total Issues",
                        value: totalIssues,
                        to: `/${locale}/authority/tdo/issues`,
                        color: "bg-blue-50 border-blue-100 text-blue-900",
                        icon: <FiAlertCircle className="w-5 h-5" />,
                        trend: totalIssues > 0 ? "up" : "neutral"
                    },
                    {
                        label: locale === "kn" ? "ಬಾಕಿ ಸಮಸ್ಯೆಗಳು" : locale === "hi" ? "लंबित समस्याएं" : "Pending Issues",
                        value: pendingIssues,
                        to: `/${locale}/authority/tdo/issues?status=pending`,
                        color: "bg-yellow-50 border-yellow-100 text-yellow-900",
                        icon: <FiClock className="w-5 h-5" />,
                        trend: pendingIssues > 0 ? "up" : "neutral"
                    },
                    {
                        label: locale === "kn" ? "ಗ್ರಾಮಸ್ಥರು" : locale === "hi" ? "ग्रामीण" : "Villagers",
                        value: villagersSnapshot.size,
                        to: `/${locale}/authority/tdo/villagers`,
                        color: "bg-green-50 border-green-100 text-green-900",
                        icon: <FiUsers className="w-5 h-5" />,
                        trend: "neutral"
                    },
                    {
                        label: locale === "kn" ? "ನಿಧಿ ವಿನಂತಿಗಳು" : locale === "hi" ? "फंड अनुरोध" : "Fund Requests",
                        value: totalFundRequests,
                        to: `/${locale}/authority/tdo/funds`,
                        color: "bg-purple-50 border-purple-100 text-purple-900",
                        icon: <FiDollarSign className="w-5 h-5" />,
                        trend: pendingFundRequests > 0 ? "up" : "neutral"
                    },
                    {
                        label: locale === "kn" ? "ಅನುಮೋದಿತ ನಿಧಿ" : locale === "hi" ? "अनुमोदित फंड" : "Approved Funds",
                        value: formatCurrency(approvedFunds),
                        to: `/${locale}/authority/tdo/funds?status=approved`,
                        color: "bg-emerald-50 border-emerald-100 text-emerald-900",
                        icon: <FiCheckCircle className="w-5 h-5" />,
                        trend: approvedFunds > 0 ? "up" : "neutral"
                    },
                    {
                        label: locale === "kn" ? "ಕಾರ್ಮಿಕರು" : locale === "hi" ? "कार्यकर्ता" : "Workers",
                        value: workersSnapshot.size,
                        to: `/${locale}/authority/tdo/workers`,
                        color: "bg-indigo-50 border-indigo-100 text-indigo-900",
                        icon: <FiUsers className="w-5 h-5" />,
                        trend: "neutral"
                    }
                ];

                setStats(dashboardStats);
                setPendingFunds(pendingFundsList);
                setLoading(false);

            } catch (err: any) {
                console.error("Dashboard load error:", err);
                setError(err.message || "Failed to load dashboard");
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [router, locale]);

    // Quick actions for mobile
    const quickActions: QuickAction[] = useMemo(() => [
        {
            title: locale === "kn" ? "ನಕ್ಷೆ" : locale === "hi" ? "मानचित्र" : "View Map",
            description: locale === "kn" ? "ನಕ್ಷೆಯಲ್ಲಿ ವೀಕ್ಷಿಸಿ" : locale === "hi" ? "मानचित्र पर देखें" : "View requests on map",
            icon: <FiMap className="w-5 h-5" />,
            to: `/${locale}/authority/tdo/map`,
            color: "text-blue-600",
            bgColor: "bg-blue-50 border-blue-100"
        },
        {
            title: locale === "kn" ? "ನಿಧಿ ಅನುಮೋದಿಸಿ" : locale === "hi" ? "फंड स्वीकृत करें" : "Approve Funds",
            description: locale === "kn" ? "ನಿಧಿ ವಿನಂತಿಗಳನ್ನು ಅನುಮೋದಿಸಿ" : locale === "hi" ? "फंड अनुरोधों को स्वीकृत करें" : "Approve pending fund requests",
            icon: <FiCheckCircle className="w-5 h-5" />,
            to: `/${locale}/authority/tdo/funds`,
            color: "text-green-600",
            bgColor: "bg-green-50 border-green-100"
        },
        {
            title: locale === "kn" ? "ವಿಶ್ಲೇಷಣೆ" : locale === "hi" ? "विश्लेषण" : "Analytics",
            description: locale === "kn" ? "ವಿಶ್ಲೇಷಣಾ ವರದಿಗಳು" : locale === "hi" ? "विश्लेषण रिपोर्ट" : "View analytics and reports",
            icon: <FiBarChart2 className="w-5 h-5" />,
            to: `/${locale}/authority/tdo/analytics`,
            color: "text-purple-600",
            bgColor: "bg-purple-50 border-purple-100"
        }
    ], [locale]);

    // Render loading state
    if (loading) {
        return (
            <Screen padded={false}>
                <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-b from-green-50 to-white">
                    <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-green-700 font-semibold">
                        {locale === "kn" ? "ಲೋಡ್ ಆಗುತ್ತಿದೆ..." : locale === "hi" ? "लोड हो रहा है..." : "Loading Dashboard..."}
                    </p>
                    <p className="text-sm text-green-600 mt-2">
                        {jurisdiction.taluk && `${jurisdiction.taluk}, ${jurisdiction.district}`}
                    </p>
                </div>
            </Screen>
        );
    }

    return (
        <Screen padded={false}>
            {/* Header */}
            <div className="sticky top-0 z-50 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-4 shadow-lg">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => router.back()}
                            className="p-2 rounded-lg bg-white/20 hover:bg-white/30"
                            aria-label="Back"
                        >
                            ←
                        </button>
                        <div>
                            <h1 className="text-lg font-bold">
                                {locale === "kn" ? "ಟಿಡಿಒ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್" : locale === "hi" ? "टीडीओ डैशबोर्ड" : "TDO Dashboard"}
                            </h1>
                            <p className="text-xs opacity-90">
                                {userName} • {jurisdiction.taluk}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => window.location.reload()}
                        className="p-2 rounded-lg bg-white/20 hover:bg-white/30"
                        aria-label="Refresh"
                    >
                        ↻
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto pb-24">
                {/* Error */}
                {error && (
                    <div className="mx-4 mt-4 p-4 rounded-xl bg-red-50 border border-red-200">
                        <div className="flex items-center space-x-3">
                            <div className="text-red-600">⚠️</div>
                            <div className="flex-1">
                                <p className="font-bold text-red-800">
                                    {locale === "kn" ? "ದೋಷ" : locale === "hi" ? "त्रुटि" : "Error"}
                                </p>
                                <p className="text-sm text-red-700 mt-1">{error}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-3 w-full py-2 rounded-lg bg-red-600 text-white font-bold"
                        >
                            {locale === "kn" ? "ಮರುಪ್ರಯತ್ನಿಸಿ" : locale === "hi" ? "पुनः प्रयास करें" : "Retry"}
                        </button>
                    </div>
                )}

                {/* Welcome Card */}
                <div className="px-4 pt-6 pb-4">
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-green-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-green-800/70">
                                    {locale === "kn" ? "ಸ್ವಾಗತ" : locale === "hi" ? "स्वागत है" : "Welcome back"}
                                </p>
                                <h2 className="text-xl font-bold text-green-900 mt-1">{userName}</h2>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-green-800/60">
                                    {locale === "kn" ? "ನ್ಯಾಯಾಧಿಕಾರ" : locale === "hi" ? "अधिकार क्षेत्र" : "Jurisdiction"}
                                </p>
                                <p className="text-sm font-semibold text-green-900">{jurisdiction.taluk}</p>
                                {jurisdiction.district && (
                                    <p className="text-xs text-green-800/60 mt-1">{jurisdiction.district}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="px-4 mb-6">
                    <h3 className="text-sm font-bold text-green-900 mb-3">
                        {locale === "kn" ? "ತ್ವರಿತ ಕ್ರಿಯೆಗಳು" : locale === "hi" ? "त्वरित कार्रवाइयाँ" : "Quick Actions"}
                    </h3>
                    <div className="flex space-x-3 overflow-x-auto pb-2">
                        {quickActions.map((action, index) => (
                            <button
                                key={index}
                                onClick={() => router.push(action.to)}
                                className={`flex-shrink-0 w-36 rounded-xl p-3 border ${action.bgColor} active:scale-95 transition-transform`}
                            >
                                <div className="flex items-center space-x-2 mb-2">
                                    <span className={action.color}>{action.icon}</span>
                                    <span className={`text-sm font-bold ${action.color}`}>
                                        {action.title}
                                    </span>
                                </div>
                                <p className="text-xs text-green-800/70 text-left">
                                    {action.description}
                                </p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="px-4 mb-6">
                    <h3 className="text-sm font-bold text-green-900 mb-3">
                        {locale === "kn" ? "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಅಂಕಿಅಂಶಗಳು" : locale === "hi" ? "डैशबोर्ड आँकड़े" : "Dashboard Statistics"}
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        {stats.slice(0, 4).map((stat, index) => (
                            <button
                                key={index}
                                onClick={() => router.push(stat.to)}
                                className={`rounded-xl p-4 border ${stat.color} active:scale-95 transition-transform`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className={stat.color.includes("text-") ? "" : "text-green-900"}>
                                        {stat.icon}
                                    </span>
                                    {stat.trend === "up" && <span className="text-xs text-red-500">↑</span>}
                                </div>
                                <div className="text-left">
                                    <div className="text-2xl font-bold">{stat.value}</div>
                                    <p className="text-xs text-green-900/70 mt-1">{stat.label}</p>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Second row of stats */}
                    {stats.length > 4 && (
                        <div className="grid grid-cols-2 gap-3 mt-3">
                            {stats.slice(4).map((stat, index) => (
                                <button
                                    key={index}
                                    onClick={() => router.push(stat.to)}
                                    className={`rounded-xl p-4 border ${stat.color} active:scale-95 transition-transform`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={stat.color.includes("text-") ? "" : "text-green-900"}>
                                            {stat.icon}
                                        </span>
                                        {stat.trend === "up" && <span className="text-xs text-red-500">↑</span>}
                                    </div>
                                    <div className="text-left">
                                        <div className="text-xl font-bold truncate">{stat.value}</div>
                                        <p className="text-xs text-green-900/70 mt-1">{stat.label}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Funding Statistics Section - FIXED LINE 403 */}
                <div className="px-4 mb-6">
                    <div className="flex items-center gap-2 text-sm text-blue-600/80 bg-blue-50/50 rounded-xl p-3 mb-4">
                        <FiBarChart2 className="w-4 h-4" />
                        <span className="font-semibold">
                            {locale === "kn" ? "ನಿಧಿ ಅಂಕಿಅಂಶಗಳು" : locale === "hi" ? "फंडिंग आंकड़े" : "Funding Statistics"}
                        </span>
                        <span className="ml-auto text-blue-900 font-bold">
                            {counts.pending + counts.approved + counts.rejected} {locale === "kn" ? "ಒಟ್ಟು ವಿನಂತಿಗಳು" : locale === "hi" ? "कुल अनुरोध" : "Total Requests"}
                        </span>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                        <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3 text-center">
                            <div className="text-2xl font-bold text-yellow-900">{counts.pending}</div>
                            <div className="text-xs text-yellow-800/70 mt-1">
                                {locale === "kn" ? "ಬಾಕಿ" : locale === "hi" ? "लंबित" : "Pending"}
                            </div>
                        </div>
                        <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-center">
                            <div className="text-2xl font-bold text-green-900">{counts.approved}</div>
                            <div className="text-xs text-green-800/70 mt-1">
                                {locale === "kn" ? "ಅನುಮೋದಿತ" : locale === "hi" ? "अनुमोदित" : "Approved"}
                            </div>
                        </div>
                        <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-center">
                            <div className="text-2xl font-bold text-red-900">{counts.rejected}</div>
                            <div className="text-xs text-red-800/70 mt-1">
                                {locale === "kn" ? "ತಿರಸ್ಕರಿಸಲಾಗಿದೆ" : locale === "hi" ? "अस्वीकृत" : "Rejected"}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pending Fund Requests */}
                {pendingFunds.length > 0 && (
                    <div className="px-4 mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold text-green-900">
                                {locale === "kn" ? "ಬಾಕಿ ಅನುಮೋದನೆಗಳು" : locale === "hi" ? "लंबित अनुमोदन" : "Pending Approvals"}
                            </h3>
                            <button
                                onClick={() => router.push(`/${locale}/authority/tdo/funds?status=pending`)}
                                className="text-xs text-green-700 font-bold"
                            >
                                {locale === "kn" ? "ಎಲ್ಲಾ ನೋಡಿ" : locale === "hi" ? "सभी देखें" : "View All"} →
                            </button>
                        </div>

                        <div className="space-y-3">
                            {pendingFunds.map((fund) => (
                                <button
                                    key={fund.id}
                                    onClick={() => router.push(`/${locale}/authority/tdo/fund-approve/${fund.id}`)}
                                    className="w-full bg-white rounded-xl p-4 border border-yellow-200 hover:border-yellow-300 active:scale-95 transition-all"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2 mb-2">
                                                <span className="text-yellow-600">💰</span>
                                                <span className="text-sm font-bold text-green-900">
                                                    ₹{fund.amount.toLocaleString()}
                                                </span>
                                                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                                                    {locale === "kn" ? "ಬಾಕಿ" : locale === "hi" ? "लंबित" : "Pending"}
                                                </span>
                                            </div>
                                            <p className="text-sm text-green-900/80 mb-1 line-clamp-2">{fund.reason}</p>
                                            <div className="flex items-center space-x-3 text-xs text-green-800/60">
                                                <span>{fund.panchayatName}</span>
                                                <span>•</span>
                                                <span>{formatTimeAgo(fund.createdAt)}</span>
                                            </div>
                                        </div>
                                        <div className="text-green-700 ml-2">→</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Empty state for no pending funds */}
                {pendingFunds.length === 0 && (
                    <div className="px-4 mb-6">
                        <div className="bg-white rounded-xl p-6 border border-green-100 text-center">
                            <div className="text-4xl mb-3">✅</div>
                            <p className="text-green-800/70">
                                {locale === "kn" ? "ಯಾವುದೇ ಬಾಕಿ ಅನುಮೋದನೆಗಳು ಇಲ್ಲ" : locale === "hi" ? "कोई लंबित अनुमोदन नहीं" : "No pending approvals"}
                            </p>
                            <button
                                onClick={() => router.push(`/${locale}/authority/tdo/funds`)}
                                className="mt-3 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-bold"
                            >
                                {locale === "kn" ? "ನಿಧಿ ವಿನಂತಿಗಳನ್ನು ವೀಕ್ಷಿಸಿ" : locale === "hi" ? "फंड अनुरोध देखें" : "View Fund Requests"}
                            </button>
                        </div>
                    </div>
                )}

                {/* Spacer for bottom navigation */}
                <div className="h-20"></div>
            </div>

            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-green-200 px-4 py-3 z-50 shadow-lg">
                <div className="grid grid-cols-4 gap-1">
                    <button
                        onClick={() => router.push(`/${locale}/authority/tdo/dashboard`)}
                        className="flex flex-col items-center p-2 rounded-lg text-green-700 bg-green-50"
                    >
                        <span className="text-xl">🏠</span>
                        <span className="text-xs mt-1">
                            {locale === "kn" ? "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್" : locale === "hi" ? "डैशबोर्ड" : "Dashboard"}
                        </span>
                    </button>
                    <button
                        onClick={() => router.push(`/${locale}/authority/tdo/funds`)}
                        className="flex flex-col items-center p-2 rounded-lg text-green-800/60"
                    >
                        <span className="text-xl">💰</span>
                        <span className="text-xs mt-1">
                            {locale === "kn" ? "ನಿಧಿ" : locale === "hi" ? "फंड" : "Funds"}
                        </span>
                    </button>
                    <button
                        onClick={() => router.push(`/${locale}/authority/tdo/issues`)}
                        className="flex flex-col items-center p-2 rounded-lg text-green-800/60"
                    >
                        <span className="text-xl">📋</span>
                        <span className="text-xs mt-1">
                            {locale === "kn" ? "ಸಮಸ್ಯೆಗಳು" : locale === "hi" ? "समस्याएं" : "Issues"}
                        </span>
                    </button>
                    <button
                        onClick={() => router.push(`/${locale}/authority/tdo/profile`)}
                        className="flex flex-col items-center p-2 rounded-lg text-green-800/60"
                    >
                        <span className="text-xl">👤</span>
                        <span className="text-xs mt-1">
                            {locale === "kn" ? "ಪ್ರೊಫೈಲ್" : locale === "hi" ? "प्रोफाइल" : "Profile"}
                        </span>
                    </button>
                </div>
            </div>
        </Screen>
    );
}