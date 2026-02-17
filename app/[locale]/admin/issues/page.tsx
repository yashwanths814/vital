"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { collection, getDocs, orderBy, query, limit, where } from "firebase/firestore";
import { auth, db } from "../../../lib/firebase";
import Screen from "../../../components/Screen";
import { Search, Filter, AlertCircle, Calendar, MapPin, User } from "lucide-react";

type Issue = {
    id: string;
    title?: string;
    status?: string;
    category?: string;
    district?: string;
    taluk?: string;
    panchayatId?: string;
    panchayatName?: string;
    createdAt?: any;
    description?: string;
    locationText?: string;
    reporterName?: string;
    assignedWorker?: {
        name?: string;
        phone?: string;
        role?: string;
    };
};

export default function AdminIssuesPage() {
    const router = useRouter();
    const params = useParams() as { locale?: string };
    const locale = params?.locale || "en";

    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");
    const [issues, setIssues] = useState<Issue[]>([]);
    const [filteredIssues, setFilteredIssues] = useState<Issue[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");

    const t = useMemo(() => {
        const L: any = {
            en: { 
                title: "All Issues", 
                back: "Back", 
                empty: "No issues found.", 
                open: "View Details",
                search: "Search issues...",
                filter: "Filter",
                status: "Status",
                category: "Category",
                allStatus: "All Status",
                allCategory: "All Categories",
                id: "ID",
                created: "Created",
                location: "Location",
                reporter: "Reporter",
                assigned: "Assigned",
                notAssigned: "Not Assigned",
                stats: {
                    total: "Total Issues",
                    open: "Open",
                    inProgress: "In Progress",
                    resolved: "Resolved"
                }
            },
            kn: { 
                title: "ಎಲ್ಲಾ ಸಮಸ್ಯೆಗಳು", 
                back: "ಹಿಂದೆ", 
                empty: "ಯಾವುದೇ ಸಮಸ್ಯೆಗಳು ಇಲ್ಲ.", 
                open: "ವಿವರಗಳು ನೋಡಿ",
                search: "ಸಮಸ್ಯೆಗಳನ್ನು ಹುಡುಕಿ...",
                filter: "ಫಿಲ್ಟರ್",
                status: "ಸ್ಥಿತಿ",
                category: "ವರ್ಗ",
                allStatus: "ಎಲ್ಲಾ ಸ್ಥಿತಿ",
                allCategory: "ಎಲ್ಲಾ ವರ್ಗಗಳು",
                id: "ಐಡಿ",
                created: "ರಚಿಸಲಾಗಿದೆ",
                location: "ಸ್ಥಳ",
                reporter: "ವರದಿದಾರ",
                assigned: "ನಿಯೋಜಿತ",
                notAssigned: "ನಿಯೋಜಿಸಲಾಗಿಲ್ಲ",
                stats: {
                    total: "ಒಟ್ಟು ಸಮಸ್ಯೆಗಳು",
                    open: "ತೆರೆದಿರುವ",
                    inProgress: "ಪ್ರಗತಿಯಲ್ಲಿದೆ",
                    resolved: "ಪರಿಹರಿಸಲಾಗಿದೆ"
                }
            },
            hi: { 
                title: "सभी मुद्दे", 
                back: "वापस", 
                empty: "कोई मुद्दा नहीं मिला।", 
                open: "विवरण देखें",
                search: "मुद्दे खोजें...",
                filter: "फिल्टर",
                status: "स्थिति",
                category: "श्रेणी",
                allStatus: "सभी स्थिति",
                allCategory: "सभी श्रेणियाँ",
                id: "आईडी",
                created: "बनाया गया",
                location: "स्थान",
                reporter: "रिपोर्टर",
                assigned: "नियुक्त",
                notAssigned: "नियुक्त नहीं",
                stats: {
                    total: "कुल मुद्दे",
                    open: "खुले",
                    inProgress: "प्रगति पर",
                    resolved: "हल किए गए"
                }
            },
        };
        return L[locale] || L.en;
    }, [locale]);

    // Get unique statuses and categories for filters
    const statuses = useMemo(() => {
        const uniqueStatuses = Array.from(new Set(issues.map(issue => issue.status || "")))
            .filter(Boolean)
            .sort();
        return ["all", ...uniqueStatuses];
    }, [issues]);

    const categories = useMemo(() => {
        const uniqueCategories = Array.from(new Set(issues.map(issue => issue.category || "")))
            .filter(Boolean)
            .sort();
        return ["all", ...uniqueCategories];
    }, [issues]);

    // Stats calculation
    const stats = useMemo(() => {
        return {
            total: issues.length,
            open: issues.filter(issue => issue.status === "pending" || issue.status === "verified_by_vi").length,
            inProgress: issues.filter(issue => issue.status === "in_progress").length,
            resolved: issues.filter(issue => issue.status === "resolved" || issue.status === "completed").length,
        };
    }, [issues]);

    useEffect(() => {
        const load = async () => {
            setErr("");
            setLoading(true);
            try {
                const user = auth.currentUser;
                if (!user) {
                    router.replace(`/${locale}/admin/login`);
                    return;
                }

                // Verify admin status (you should implement this check)
                // For now, we'll just check if user exists

                const qy = query(
                    collection(db, "issues"), 
                    orderBy("createdAt", "desc"), 
                    limit(100)
                );
                const snap = await getDocs(qy);
                
                const loadedIssues = snap.docs.map((d) => ({ 
                    id: d.id, 
                    ...(d.data() as any) 
                }));
                
                setIssues(loadedIssues);
                setFilteredIssues(loadedIssues);
            } catch (e: any) {
                setErr(e?.message || "Failed to load issues.");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [router, locale]);

    // Filter issues based on search and filters
    useEffect(() => {
        let filtered = [...issues];

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(issue =>
                issue.title?.toLowerCase().includes(query) ||
                issue.description?.toLowerCase().includes(query) ||
                issue.id?.toLowerCase().includes(query) ||
                issue.locationText?.toLowerCase().includes(query) ||
                issue.reporterName?.toLowerCase().includes(query) ||
                issue.category?.toLowerCase().includes(query)
            );
        }

        // Status filter
        if (statusFilter !== "all") {
            filtered = filtered.filter(issue => issue.status === statusFilter);
        }

        // Category filter
        if (categoryFilter !== "all") {
            filtered = filtered.filter(issue => issue.category === categoryFilter);
        }

        setFilteredIssues(filtered);
    }, [searchQuery, statusFilter, categoryFilter, issues]);

    // Status badge color
    const getStatusColor = (status?: string) => {
        switch (status) {
            case "pending":
                return "bg-yellow-100 text-yellow-800 border-yellow-200";
            case "verified_by_vi":
                return "bg-blue-100 text-blue-800 border-blue-200";
            case "in_progress":
                return "bg-purple-100 text-purple-800 border-purple-200";
            case "resolved":
            case "completed":
                return "bg-green-100 text-green-800 border-green-200";
            case "rejected":
                return "bg-red-100 text-red-800 border-red-200";
            default:
                return "bg-gray-100 text-gray-800 border-gray-200";
        }
    };

    // Format date
    const formatDate = (date: any) => {
        if (!date) return "";
        try {
            if (date.toDate) {
                return date.toDate().toLocaleDateString();
            }
            return new Date(date).toLocaleDateString();
        } catch {
            return "";
        }
    };

    if (loading) {
        return (
            <Screen padded>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="mt-4 text-green-700 font-semibold">Loading issues...</p>
                    </div>
                </div>
            </Screen>
        );
    }

    return (
        <Screen padded>
            <div className="w-full max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                    <div className="min-w-0">
                        <h1 className="text-xl sm:text-2xl font-extrabold text-green-900">
                            {t.title}
                        </h1>
                        <p className="text-sm text-green-800/80 mt-1">
                            Monitor and manage all issues across panchayats
                        </p>
                    </div>

                    <button
                        onClick={() => router.back()}
                        className="shrink-0 px-4 py-2 rounded-xl bg-white border border-green-200 text-green-900 font-extrabold hover:bg-green-50 transition-colors"
                    >
                        {t.back}
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    <div className="bg-white border border-green-100 rounded-xl p-4 shadow-sm">
                        <div className="text-2xl font-extrabold text-green-900">{stats.total}</div>
                        <div className="text-xs text-green-900/60">{t.stats.total}</div>
                    </div>
                    <div className="bg-white border border-yellow-100 rounded-xl p-4 shadow-sm">
                        <div className="text-2xl font-extrabold text-yellow-700">{stats.open}</div>
                        <div className="text-xs text-yellow-700/60">{t.stats.open}</div>
                    </div>
                    <div className="bg-white border border-purple-100 rounded-xl p-4 shadow-sm">
                        <div className="text-2xl font-extrabold text-purple-700">{stats.inProgress}</div>
                        <div className="text-xs text-purple-700/60">{t.stats.inProgress}</div>
                    </div>
                    <div className="bg-white border border-green-100 rounded-xl p-4 shadow-sm">
                        <div className="text-2xl font-extrabold text-green-700">{stats.resolved}</div>
                        <div className="text-xs text-green-700/60">{t.stats.resolved}</div>
                    </div>
                </div>

                {/* Search and Filter Bar */}
                <div className="bg-white border border-green-100 rounded-2xl p-4 shadow-sm mb-6">
                    <div className="flex flex-col md:flex-row gap-3">
                        {/* Search */}
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-900/40" />
                                <input
                                    type="text"
                                    placeholder={t.search}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-green-200 bg-white text-green-900 font-semibold outline-none focus:ring-2 focus:ring-green-300"
                                />
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="flex flex-col sm:flex-row gap-2">
                            <div className="relative">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="w-full sm:w-40 px-4 py-2 rounded-xl border border-green-200 bg-white text-green-900 font-semibold outline-none focus:ring-2 focus:ring-green-300 appearance-none"
                                >
                                    <option value="all">{t.allStatus}</option>
                                    {statuses.filter(s => s !== "all").map(status => (
                                        <option key={status} value={status}>
                                            {status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ')}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                    <Filter className="w-4 h-4 text-green-900/40" />
                                </div>
                            </div>

                            <div className="relative">
                                <select
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                    className="w-full sm:w-40 px-4 py-2 rounded-xl border border-green-200 bg-white text-green-900 font-semibold outline-none focus:ring-2 focus:ring-green-300 appearance-none"
                                >
                                    <option value="all">{t.allCategory}</option>
                                    {categories.filter(c => c !== "all").map(category => (
                                        <option key={category} value={category}>
                                            {category}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                    <Filter className="w-4 h-4 text-green-900/40" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Results count */}
                    <div className="mt-3 text-sm text-green-900/60">
                        Showing {filteredIssues.length} of {issues.length} issues
                    </div>
                </div>

                {/* Error Display */}
                {err && (
                    <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        {err}
                    </div>
                )}

                {/* Issues List */}
                {!loading && !err && filteredIssues.length === 0 && (
                    <div className="text-center py-12">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
                            <AlertCircle className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-extrabold text-green-900 mb-2">{t.empty}</h3>
                        <p className="text-green-900/60">Try adjusting your search or filters</p>
                    </div>
                )}

                {!loading && !err && filteredIssues.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {filteredIssues.map((issue) => (
                            <div 
                                key={issue.id} 
                                className="bg-white border border-green-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
                            >
                                {/* Issue Header */}
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                                    <div className="min-w-0">
                                        <div className="text-xs text-green-900/60 mb-1">{t.id}: {issue.id}</div>
                                        <h3 className="text-lg font-extrabold text-green-900 truncate">
                                            {issue.title || "Untitled Issue"}
                                        </h3>
                                    </div>
                                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-extrabold border ${getStatusColor(issue.status)}`}>
                                        {issue.status?.replace(/_/g, ' ') || "Unknown"}
                                    </span>
                                </div>

                                {/* Issue Details */}
                                <div className="space-y-2 mb-4">
                                    {issue.category && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="font-semibold text-green-900">{t.category}:</span>
                                            <span className="text-green-900/70">{issue.category}</span>
                                        </div>
                                    )}

                                    {issue.locationText && (
                                        <div className="flex items-start gap-2 text-sm">
                                            <MapPin className="w-4 h-4 text-green-900/40 mt-0.5 flex-shrink-0" />
                                            <span className="text-green-900/70">{issue.locationText}</span>
                                        </div>
                                    )}

                                    {issue.description && (
                                        <p className="text-sm text-green-900/70 line-clamp-2">
                                            {issue.description}
                                        </p>
                                    )}

                                    <div className="flex items-center gap-4 text-xs text-green-900/60">
                                        {issue.createdAt && (
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                <span>{formatDate(issue.createdAt)}</span>
                                            </div>
                                        )}
                                        
                                        {issue.panchayatId && (
                                            <div className="flex items-center gap-1">
                                                <User className="w-3 h-3" />
                                                <span>Panchayat: {issue.panchayatId}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Assigned Worker */}
                                <div className="mb-4">
                                    <div className="text-xs font-semibold text-green-900 mb-1">
                                        {t.assigned}:
                                    </div>
                                    {issue.assignedWorker?.name ? (
                                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-green-200 bg-green-50">
                                            <div className="flex-1">
                                                <div className="font-bold text-green-900">
                                                    {issue.assignedWorker.name}
                                                </div>
                                                {issue.assignedWorker.role && (
                                                    <div className="text-xs text-green-900/70">
                                                        {issue.assignedWorker.role}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="px-3 py-2 rounded-xl border border-yellow-200 bg-yellow-50 text-yellow-700 text-sm">
                                            {t.notAssigned}
                                        </div>
                                    )}
                                </div>

                                {/* Action Button */}
                                <button
                                    onClick={() => router.push(`/${locale}/admin/issues/${issue.id}`)}
                                    className="w-full rounded-xl bg-green-700 text-white font-extrabold py-3 px-4 hover:bg-green-800 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                                >
                                    {t.open}
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Screen>
    );
}