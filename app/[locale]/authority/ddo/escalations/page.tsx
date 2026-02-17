"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth, db } from "../../../../lib/firebase";
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit, Timestamp } from "firebase/firestore";
import Screen from "../../../../components/Screen";

type Locale = "en" | "kn" | "hi";

interface EscalatedIssue {
    id: string;
    displayId: string;
    title: string;
    description: string;
    category: string;
    gramPanchayat: string;
    taluk: string;
    status: string;
    daysPending: number;
    escalatedAt: Date;
    escalatedBy: string;
    escalationReason: string;
    priority: "low" | "medium" | "high" | "critical";
    lastUpdated: Date;
}

export default function EscalationsPage() {
    const router = useRouter();
    const params = useParams() as { locale?: string };
    const locale = (params?.locale || "en") as Locale;
    const [escalations, setEscalations] = useState<EscalatedIssue[]>([]);
    const [loading, setLoading] = useState(true);
    const [district, setDistrict] = useState<string | null>(null);
    const [districtId, setDistrictId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [priorityFilter, setPriorityFilter] = useState("all");

    /* 🌐 Multilingual text */
    const t = useMemo(() => {
        const L: Record<Locale, any> = {
            en: {
                title: "Escalated Issues",
                subtitle: "Monitor and resolve escalated issues from lower levels",
                back: "Back to Dashboard",
                search: "Search issues...",
                filters: {
                    status: "Status",
                    priority: "Priority",
                    all: "All",
                    pending: "Pending",
                    inProgress: "In Progress",
                    resolved: "Resolved",
                    low: "Low",
                    medium: "Medium",
                    high: "High",
                    critical: "Critical"
                },
                table: {
                    id: "Issue ID",
                    title: "Title",
                    category: "Category",
                    gp: "Gram Panchayat",
                    taluk: "Taluk",
                    days: "Days",
                    status: "Status",
                    priority: "Priority",
                    action: "Action",
                    view: "View Details",
                    resolve: "Resolve",
                    escalate: "Escalate Further"
                },
                stats: {
                    total: "Total Escalations",
                    pending: "Pending",
                    resolved: "Resolved",
                    critical: "Critical"
                },
                noData: "No escalated issues found",
                loading: "Loading escalated issues...",
                error: "Failed to load data"
            },
            kn: {
                title: "ಎಸ್ಕಲೇಟೆಡ್ ಸಮಸ್ಯೆಗಳು",
                subtitle: "ಕೆಳಮಟ್ಟದಿಂದ ಎಸ್ಕಲೇಟ್ ಆದ ಸಮಸ್ಯೆಗಳನ್ನು ಮೇಲ್ವಿಚಾರಣೆ ಮತ್ತು ಪರಿಹರಿಸಿ",
                back: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಹಿಂದಿರುಗಿ",
                search: "ಸಮಸ್ಯೆಗಳನ್ನು ಹುಡುಕಿ...",
                filters: {
                    status: "ಸ್ಥಿತಿ",
                    priority: "ಪ್ರಾಧಾನ್ಯತೆ",
                    all: "ಎಲ್ಲಾ",
                    pending: "ಬಾಕಿ",
                    inProgress: "ಪ್ರಗತಿಯಲ್ಲಿ",
                    resolved: "ಪರಿಹಾರವಾಗಿದೆ",
                    low: "ಕಡಿಮೆ",
                    medium: "ಮಧ್ಯಮ",
                    high: "ಹೆಚ್ಚು",
                    critical: "ತುರ್ತು"
                },
                table: {
                    id: "ಸಮಸ್ಯೆ ಐಡಿ",
                    title: "ಶೀರ್ಷಿಕೆ",
                    category: "ವರ್ಗ",
                    gp: "ಗ್ರಾಮ ಪಂಚಾಯತ್",
                    taluk: "ತಾಲ್ಲೂಕು",
                    days: "ದಿನಗಳು",
                    status: "ಸ್ಥಿತಿ",
                    priority: "ಪ್ರಾಧಾನ್ಯತೆ",
                    action: "ಕ್ರಿಯೆ",
                    view: "ವಿವರಗಳನ್ನು ವೀಕ್ಷಿಸಿ",
                    resolve: "ಪರಿಹರಿಸಿ",
                    escalate: "ಮತ್ತಷ್ಟು ಎಸ್ಕಲೇಟ್ ಮಾಡಿ"
                },
                stats: {
                    total: "ಒಟ್ಟು ಎಸ್ಕಲೇಶನ್‌ಗಳು",
                    pending: "ಬಾಕಿ",
                    resolved: "ಪರಿಹಾರವಾಗಿದೆ",
                    critical: "ತುರ್ತು"
                },
                noData: "ಯಾವುದೇ ಎಸ್ಕಲೇಟೆಡ್ ಸಮಸ್ಯೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ",
                loading: "ಎಸ್ಕಲೇಟೆಡ್ ಸಮಸ್ಯೆಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...",
                error: "ಡೇಟಾ ಲೋಡ್ ಮಾಡಲು ವಿಫಲವಾಗಿದೆ"
            },
            hi: {
                title: "एस्केलेटेड समस्याएँ",
                subtitle: "निचले स्तर से एस्केलेट की गई समस्याओं की निगरानी और समाधान करें",
                back: "डैशबोर्ड पर वापस जाएं",
                search: "समस्याएँ खोजें...",
                filters: {
                    status: "स्थिति",
                    priority: "प्राथमिकता",
                    all: "सभी",
                    pending: "लंबित",
                    inProgress: "प्रगति पर",
                    resolved: "हल हुई",
                    low: "कम",
                    medium: "मध्यम",
                    high: "उच्च",
                    critical: "गंभीर"
                },
                table: {
                    id: "समस्या आईडी",
                    title: "शीर्षक",
                    category: "श्रेणी",
                    gp: "ग्राम पंचायत",
                    taluk: "तालुका",
                    days: "दिन",
                    status: "स्थिति",
                    priority: "प्राथमिकता",
                    action: "कार्रवाई",
                    view: "विवरण देखें",
                    resolve: "हल करें",
                    escalate: "आगे एस्केलेट करें"
                },
                stats: {
                    total: "कुल एस्केलेशन",
                    pending: "लंबित",
                    resolved: "हल हुई",
                    critical: "गंभीर"
                },
                noData: "कोई एस्केलेटेड समस्या नहीं मिली",
                loading: "एस्केलेटेड समस्याएँ लोड हो रही हैं...",
                error: "डेटा लोड करने में विफल"
            }
        };
        return L[locale] || L.en;
    }, [locale]);

    /* 🔐 Load DDO and Escalations Data */
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                setError(null);

                await auth.authStateReady();
                const user = auth.currentUser;

                if (!user) {
                    router.replace(`/${locale}/authority/login`);
                    return;
                }

                // Load DDO authority document
                const authorityDocRef = doc(db, "authorities", user.uid);
                const authoritySnap = await getDoc(authorityDocRef);

                if (!authoritySnap.exists()) {
                    router.replace(`/${locale}/authority/status`);
                    return;
                }

                const authorityData = authoritySnap.data();
                const isVerified =
                    authorityData?.verified === true ||
                    authorityData?.verification?.status === "verified" ||
                    authorityData?.status === "verified";

                if (!isVerified || authorityData?.role !== "ddo") {
                    router.replace(`/${locale}/authority/status`);
                    return;
                }

                const districtName = authorityData.district || authorityData.districtName;
                const districtIdentifier = authorityData.districtId || authorityData.district_id;

                if (!districtName && !districtIdentifier) {
                    setError("District information not found");
                    setLoading(false);
                    return;
                }

                setDistrict(districtName);
                setDistrictId(districtIdentifier);

                // Load escalated issues
                await loadEscalatedIssues(districtName, districtIdentifier);

            } catch (err: any) {
                console.error("Error loading data:", err);
                setError(t.error);
                setLoading(false);
            }
        };

        const loadEscalatedIssues = async (districtName: string, districtId: string) => {
            try {
                const issues: any[] = [];

                // Try by district name
                try {
                    const issuesByNameQuery = query(
                        collection(db, "issues"),
                        where("district", "==", districtName),
                        where("escalated", "==", true)
                    );
                    const snapshotByName = await getDocs(issuesByNameQuery);
                    snapshotByName.forEach(doc => {
                        if (!issues.find(i => i.id === doc.id)) {
                            issues.push({ id: doc.id, ...doc.data() });
                        }
                    });
                } catch (err) {
                    console.log("Query by district name failed:", err);
                }

                // Try by districtId
                try {
                    const issuesByIdQuery = query(
                        collection(db, "issues"),
                        where("districtId", "==", districtId),
                        where("escalated", "==", true)
                    );
                    const snapshotById = await getDocs(issuesByIdQuery);
                    snapshotById.forEach(doc => {
                        if (!issues.find(i => i.id === doc.id)) {
                            issues.push({ id: doc.id, ...doc.data() });
                        }
                    });
                } catch (err) {
                    console.log("Query by districtId failed:", err);
                }

                // Format escalations data
                const formattedEscalations: EscalatedIssue[] = issues.map(issue => {
                    const createdAt = issue.createdAt?.toDate?.() || new Date();
                    const escalatedAt = issue.escalatedAt?.toDate?.() || issue.updatedAt?.toDate?.() || new Date();
                    const now = new Date();
                    const diffTime = Math.abs(now.getTime() - createdAt.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    // Determine priority based on days pending and category
                    let priority: "low" | "medium" | "high" | "critical" = "low";
                    if (diffDays > 30) priority = "critical";
                    else if (diffDays > 15) priority = "high";
                    else if (diffDays > 7) priority = "medium";

                    // Override for certain categories
                    if (["Health Emergency", "Accident", "Natural Disaster"].includes(issue.category)) {
                        priority = "critical";
                    }

                    return {
                        id: issue.id,
                        displayId: issue.displayId || issue.id.substring(0, 8).toUpperCase(),
                        title: issue.title || issue.subject || "No Title",
                        description: issue.description || issue.details || "",
                        category: issue.categoryName || issue.category || issue.type || "Other",
                        gramPanchayat: issue.panchayatName || issue.panchayat || "Unknown GP",
                        taluk: issue.talukName || issue.taluk || "Unknown Taluk",
                        status: issue.status || "unknown",
                        daysPending: diffDays,
                        escalatedAt: escalatedAt,
                        escalatedBy: issue.escalatedBy || issue.escalatedByName || "Unknown",
                        escalationReason: issue.escalationReason || issue.reason || "Not specified",
                        priority: priority,
                        lastUpdated: issue.updatedAt?.toDate?.() || escalatedAt
                    };
                });

                // Sort by priority and recency
                formattedEscalations.sort((a, b) => {
                    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
                    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
                    if (priorityDiff !== 0) return priorityDiff;
                    return b.lastUpdated.getTime() - a.lastUpdated.getTime();
                });

                setEscalations(formattedEscalations);

            } catch (err) {
                console.error("Error loading escalated issues:", err);
                throw err;
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [router, locale, t]);

    // Calculate statistics
    const stats = useMemo(() => {
        const total = escalations.length;
        const pending = escalations.filter(e =>
            ["pending", "in_progress", "assigned"].includes(e.status)
        ).length;
        const resolved = escalations.filter(e =>
            ["resolved", "closed"].includes(e.status)
        ).length;
        const critical = escalations.filter(e => e.priority === "critical").length;

        return { total, pending, resolved, critical };
    }, [escalations]);

    // Filter escalations
    const filteredEscalations = useMemo(() => {
        return escalations.filter(issue => {
            // Search filter
            const matchesSearch = searchTerm === "" ||
                issue.displayId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                issue.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                issue.gramPanchayat.toLowerCase().includes(searchTerm.toLowerCase());

            // Status filter
            const matchesStatus = statusFilter === "all" ||
                (statusFilter === "pending" && ["pending", "in_progress", "assigned"].includes(issue.status)) ||
                (statusFilter === "resolved" && ["resolved", "closed"].includes(issue.status)) ||
                issue.status === statusFilter;

            // Priority filter
            const matchesPriority = priorityFilter === "all" || issue.priority === priorityFilter;

            return matchesSearch && matchesStatus && matchesPriority;
        });
    }, [escalations, searchTerm, statusFilter, priorityFilter]);

    const handleResolveIssue = async (issueId: string) => {
        try {
            // Navigate to resolution page
            router.push(`/${locale}/authority/ddo/issues/${issueId}/resolve`);
        } catch (error) {
            console.error("Error resolving issue:", error);
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "critical": return "bg-red-100 text-red-800";
            case "high": return "bg-orange-100 text-orange-800";
            case "medium": return "bg-yellow-100 text-yellow-800";
            case "low": return "bg-green-100 text-green-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "pending": return "bg-yellow-100 text-yellow-800";
            case "in_progress":
            case "assigned": return "bg-blue-100 text-blue-800";
            case "resolved":
            case "closed": return "bg-green-100 text-green-800";
            case "verified": return "bg-purple-100 text-purple-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    return (
        <Screen padded>
            <div className="max-w-7xl mx-auto">
                {/* Header with Back Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <button
                            onClick={() => router.push(`/${locale}/authority/ddo`)}
                            className="flex items-center gap-2 text-green-700 hover:text-green-900 mb-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            {t.back}
                        </button>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-green-900">
                            {t.title}
                        </h1>
                        <p className="text-sm text-green-900/70 mt-1">
                            {t.subtitle} {district && `(${district})`}
                        </p>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white border border-green-100 rounded-xl p-4">
                        <p className="text-sm text-green-900/70">{t.stats.total}</p>
                        <p className="text-2xl font-extrabold text-green-900">{stats.total}</p>
                    </div>
                    <div className="bg-white border border-yellow-100 rounded-xl p-4">
                        <p className="text-sm text-yellow-900/70">{t.stats.pending}</p>
                        <p className="text-2xl font-extrabold text-yellow-900">{stats.pending}</p>
                    </div>
                    <div className="bg-white border border-green-100 rounded-xl p-4">
                        <p className="text-sm text-green-900/70">{t.stats.resolved}</p>
                        <p className="text-2xl font-extrabold text-green-900">{stats.resolved}</p>
                    </div>
                    <div className="bg-white border border-red-100 rounded-xl p-4">
                        <p className="text-sm text-red-900/70">{t.stats.critical}</p>
                        <p className="text-2xl font-extrabold text-red-900">{stats.critical}</p>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="bg-white border border-green-100 rounded-xl p-4 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder={t.search}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                                <svg className="absolute left-3 top-2.5 w-5 h-5 text-green-900/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="flex flex-col sm:flex-row gap-2">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-4 py-2 border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                                <option value="all">{t.filters.status}: {t.filters.all}</option>
                                <option value="pending">{t.filters.pending}</option>
                                <option value="in_progress">{t.filters.inProgress}</option>
                                <option value="resolved">{t.filters.resolved}</option>
                            </select>

                            <select
                                value={priorityFilter}
                                onChange={(e) => setPriorityFilter(e.target.value)}
                                className="px-4 py-2 border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                                <option value="all">{t.filters.priority}: {t.filters.all}</option>
                                <option value="critical">{t.filters.critical}</option>
                                <option value="high">{t.filters.high}</option>
                                <option value="medium">{t.filters.medium}</option>
                                <option value="low">{t.filters.low}</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                        <div className="flex items-center gap-2 text-red-700">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {loading ? (
                    <div className="flex flex-col justify-center items-center h-64 gap-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
                        <p className="text-green-700">{t.loading}</p>
                    </div>
                ) : (
                    /* Escalations Table */
                    <div className="bg-white border border-green-100 rounded-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-green-50">
                                    <tr className="text-left text-sm text-green-600">
                                        <th className="p-4 font-bold">{t.table.id}</th>
                                        <th className="p-4 font-bold">{t.table.title}</th>
                                        <th className="p-4 font-bold hidden md:table-cell">{t.table.category}</th>
                                        <th className="p-4 font-bold hidden lg:table-cell">{t.table.gp}</th>
                                        <th className="p-4 font-bold">{t.table.days}</th>
                                        <th className="p-4 font-bold hidden sm:table-cell">{t.table.status}</th>
                                        <th className="p-4 font-bold hidden md:table-cell">{t.table.priority}</th>
                                        <th className="p-4 font-bold">{t.table.action}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredEscalations.length > 0 ? (
                                        filteredEscalations.map((issue) => (
                                            <tr key={issue.id} className="border-b hover:bg-green-50">
                                                <td className="p-4">
                                                    <div className="font-mono text-sm font-bold text-green-900">
                                                        {issue.displayId}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div>
                                                        <p className="font-bold text-green-900 line-clamp-1">
                                                            {issue.title}
                                                        </p>
                                                        <p className="text-xs text-green-900/60 mt-1 md:hidden">
                                                            {issue.category} • {issue.gramPanchayat}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="p-4 hidden md:table-cell">
                                                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                                        {issue.category}
                                                    </span>
                                                </td>
                                                <td className="p-4 hidden lg:table-cell">
                                                    <p className="text-sm">{issue.gramPanchayat}</p>
                                                    <p className="text-xs text-green-900/60">{issue.taluk}</p>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 text-xs rounded-full font-bold ${issue.daysPending > 30 ? 'bg-red-100 text-red-800' :
                                                            issue.daysPending > 15 ? 'bg-orange-100 text-orange-800' :
                                                                issue.daysPending > 7 ? 'bg-yellow-100 text-yellow-800' :
                                                                    'bg-green-100 text-green-800'
                                                        }`}>
                                                        {issue.daysPending} {locale === 'en' ? 'days' : locale === 'kn' ? 'ದಿನಗಳು' : 'दिन'}
                                                    </span>
                                                </td>
                                                <td className="p-4 hidden sm:table-cell">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${getStatusColor(issue.status)}`}>
                                                        {issue.status}
                                                    </span>
                                                </td>
                                                <td className="p-4 hidden md:table-cell">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${getPriorityColor(issue.priority)}`}>
                                                        {issue.priority}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex flex-col sm:flex-row gap-2">
                                                        <button
                                                            onClick={() => router.push(`/${locale}/authority/ddo/issues/${issue.id}`)}
                                                            className="px-3 py-1 bg-green-700 text-white text-sm rounded-lg hover:bg-green-800 transition"
                                                        >
                                                            {t.table.view}
                                                        </button>
                                                        {!["resolved", "closed"].includes(issue.status) && (
                                                            <button
                                                                onClick={() => handleResolveIssue(issue.id)}
                                                                className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
                                                            >
                                                                {t.table.resolve}
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={8} className="p-8 text-center text-gray-500">
                                                {t.noData}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </Screen>
    );
}