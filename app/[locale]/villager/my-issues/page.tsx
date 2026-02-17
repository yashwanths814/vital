"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Screen from "../../../components/Screen";
import { auth, db } from "../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
    collection,
    getDocs,
    limit,
    orderBy,
    query,
    where,
    Timestamp,
    doc,
    getDoc
} from "firebase/firestore";
import {
  FiHome,
  FiList,
  FiTrendingUp,
  FiUser,
  FiPlus,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiRefreshCw,
  FiArrowLeft,
  FiChevronRight,
  FiMapPin,
  FiFolder,
  FiCalendar,
  FiEye,
  FiMessageSquare,
  FiFilter,
  FiSearch,
  FiBarChart2,
  FiDownload,
  FiPrinter
} from "react-icons/fi";

type Locale = "en" | "kn" | "hi";

type IssueRow = {
    id: string;
    title?: string;
    category?: string;
    status?: string;
    priority?: string;
    description?: string;
    location?: string;
    villagerId?: string;
    createdAt?: any;
    updatedAt?: any;
    images?: string[];
    assignedTo?: string;
    commentsCount?: number;
    upvotes?: number;
};

function fmtDate(v: any) {
    try {
        if (!v) return "—";
        if (v instanceof Timestamp) {
            const date = v.toDate();
            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            
            if (diffDays === 0) return "Today";
            if (diffDays === 1) return "Yesterday";
            if (diffDays < 7) return `${diffDays} days ago`;
            
            return date.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: diffDays < 365 ? undefined : 'numeric'
            });
        }
        if (v?.toDate) return v.toDate().toLocaleDateString();
        return new Date(v).toLocaleDateString();
    } catch {
        return "—";
    }
}

function getStatusColor(status: string) {
    switch (status?.toLowerCase()) {
        case 'resolved': return 'bg-gradient-to-r from-green-500 to-emerald-600';
        case 'in progress': return 'bg-gradient-to-r from-blue-500 to-cyan-600';
        case 'pending': return 'bg-gradient-to-r from-amber-500 to-orange-600';
        case 'rejected': return 'bg-gradient-to-r from-red-500 to-pink-600';
        case 'on hold': return 'bg-gradient-to-r from-purple-500 to-violet-600';
        default: return 'bg-gradient-to-r from-gray-500 to-gray-600';
    }
}

function getStatusIcon(status: string) {
    switch (status?.toLowerCase()) {
        case 'resolved': return FiCheckCircle;
        case 'in progress': return FiClock;
        case 'pending': return FiClock;
        case 'rejected': return FiAlertCircle;
        case 'on hold': return FiAlertCircle;
        default: return FiAlertCircle;
    }
}

function getPriorityColor(priority: string) {
    switch (priority?.toLowerCase()) {
        case 'high': return 'bg-gradient-to-r from-red-500 to-orange-600';
        case 'medium': return 'bg-gradient-to-r from-amber-500 to-yellow-600';
        case 'low': return 'bg-gradient-to-r from-green-500 to-emerald-600';
        case 'urgent': return 'bg-gradient-to-r from-red-600 to-pink-700';
        default: return 'bg-gradient-to-r from-gray-500 to-gray-600';
    }
}

export default function VillagerMyIssuesPage() {
    const router = useRouter();
    const params = useParams() as { locale?: string };
    const locale = (params?.locale || "en") as Locale;

    /* ------------------ i18n ------------------ */
    const t = useMemo(() => {
        const L: any = {
            en: {
                title: "My Issues",
                subtitle: "Track and manage your reported issues",
                report: "Report New Issue",
                loading: "Loading your issues...",
                empty: "You have not reported any issues yet.",
                emptySub: "Start by reporting an issue in your village",
                open: "Open Details",
                login: "Please login to continue.",
                status: "Status",
                priority: "Priority",
                category: "Category",
                date: "Date",
                location: "Location",
                actions: "Actions",
                viewDetails: "View Details",
                filter: "Filter",
                search: "Search issues...",
                all: "All",
                pending: "Pending",
                inProgress: "In Progress",
                resolved: "Resolved",
                rejected: "Rejected",
                high: "High",
                medium: "Medium",
                low: "Low",
                urgent: "Urgent",
                stats: "Issue Statistics",
                totalIssues: "Total Issues",
                activeIssues: "Active Issues",
                resolvedIssues: "Resolved Issues",
                lastUpdated: "Last Updated",
                comments: "Comments",
                upvotes: "Upvotes",
                assignee: "Assigned To",
                description: "Description",
                quickActions: "Quick Actions",
                refresh: "Refresh",
                export: "Export",
                print: "Print",
                back: "Back to Dashboard",
                noIssuesFound: "No issues found",
                tryDifferentFilter: "Try a different filter",
            },
            kn: {
                title: "ನನ್ನ ಸಮಸ್ಯೆಗಳು",
                subtitle: "ನೀವು ವರದಿ ಮಾಡಿದ ಸಮಸ್ಯೆಗಳನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ ಮತ್ತು ನಿರ್ವಹಿಸಿ",
                report: "ಹೊಸ ಸಮಸ್ಯೆ ವರದಿ ಮಾಡಿ",
                loading: "ನಿಮ್ಮ ಸಮಸ್ಯೆಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...",
                empty: "ನೀವು ಇನ್ನೂ ಯಾವುದೇ ಸಮಸ್ಯೆ ವರದಿ ಮಾಡಿಲ್ಲ.",
                emptySub: "ನಿಮ್ಮ ಗ್ರಾಮದಲ್ಲಿ ಸಮಸ್ಯೆಯನ್ನು ವರದಿ ಮಾಡುವ ಮೂಲಕ ಪ್ರಾರಂಭಿಸಿ",
                open: "ವಿವರಗಳನ್ನು ತೆರೆಯಿರಿ",
                login: "ದಯವಿಟ್ಟು ಲಾಗಿನ್ ಆಗಿ.",
                status: "ಸ್ಥಿತಿ",
                priority: "ಗಮನಾರ್ಹತೆ",
                category: "ವರ್ಗ",
                date: "ದಿನಾಂಕ",
                location: "ಸ್ಥಳ",
                actions: "ಕ್ರಿಯೆಗಳು",
                viewDetails: "ವಿವರಗಳನ್ನು ವೀಕ್ಷಿಸಿ",
                filter: "ಫಿಲ್ಟರ್",
                search: "ಸಮಸ್ಯೆಗಳನ್ನು ಹುಡುಕಿ...",
                all: "ಎಲ್ಲಾ",
                pending: "ಬಾಕಿ ಇವೆ",
                inProgress: "ಪ್ರಗತಿಯಲ್ಲಿದೆ",
                resolved: "ಪರಿಹಾರಗೊಂಡ",
                rejected: "ನಿರಾಕರಿಸಲಾಗಿದೆ",
                high: "ಹೆಚ್ಚು",
                medium: "ಮಧ್ಯಮ",
                low: "ಕಡಿಮೆ",
                urgent: "ತುರ್ತು",
                stats: "ಸಮಸ್ಯೆ ಅಂಕಿಅಂಶಗಳು",
                totalIssues: "ಒಟ್ಟು ಸಮಸ್ಯೆಗಳು",
                activeIssues: "ಸಕ್ರಿಯ ಸಮಸ್ಯೆಗಳು",
                resolvedIssues: "ಪರಿಹಾರಗೊಂಡ ಸಮಸ್ಯೆಗಳು",
                lastUpdated: "ಕೊನೆಯ ನವೀಕರಣ",
                comments: "ಟಿಪ್ಪಣಿಗಳು",
                upvotes: "ಅಪ್‌ವೋಟ್‌ಗಳು",
                assignee: "ನಿಯೋಜಿಸಲಾಗಿದೆ",
                description: "ವಿವರಣೆ",
                quickActions: "ತ್ವರಿತ ಕ್ರಿಯೆಗಳು",
                refresh: "ರಿಫ್ರೆಶ್",
                export: "ಎಕ್ಸ್‌ಪೋರ್ಟ್",
                print: "ಮುದ್ರಣ",
                back: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಹಿಂದಿರುಗಿ",
                noIssuesFound: "ಯಾವುದೇ ಸಮಸ್ಯೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ",
                tryDifferentFilter: "ವಿಭಿನ್ನ ಫಿಲ್ಟರ್‌ನ ಪ್ರಯತ್ನಿಸಿ",
            },
            hi: {
                title: "मेरे मुद्दे",
                subtitle: "आपके द्वारा रिपोर्ट किए गए मुद्दों को ट्रैक और प्रबंधित करें",
                report: "नया मुद्दा रिपोर्ट करें",
                loading: "आपके मुद्दे लोड हो रहे हैं...",
                empty: "आपने अभी तक कोई मुद्दा रिपोर्ट नहीं किया है।",
                emptySub: "अपने गाँव में एक मुद्दा रिपोर्ट करके शुरू करें",
                open: "विवरण खोलें",
                login: "कृपया लॉगिन करें।",
                status: "स्थिति",
                priority: "प्राथमिकता",
                category: "श्रेणी",
                date: "तारीख",
                location: "स्थान",
                actions: "कार्रवाई",
                viewDetails: "विवरण देखें",
                filter: "फ़िल्टर",
                search: "मुद्दे खोजें...",
                all: "सभी",
                pending: "लंबित",
                inProgress: "प्रगति पर",
                resolved: "हल",
                rejected: "अस्वीकृत",
                high: "उच्च",
                medium: "मध्यम",
                low: "कम",
                urgent: "तत्काल",
                stats: "मुद्दा आँकड़े",
                totalIssues: "कुल मुद्दे",
                activeIssues: "सक्रिय मुद्दे",
                resolvedIssues: "हल किए गए मुद्दे",
                lastUpdated: "अंतिम अपडेट",
                comments: "टिप्पणियाँ",
                upvotes: "वोट",
                assignee: "सौंपा गया",
                description: "विवरण",
                quickActions: "त्वरित कार्रवाई",
                refresh: "रिफ्रेश",
                export: "निर्यात",
                print: "प्रिंट",
                back: "डैशबोर्ड पर वापस जाएं",
                noIssuesFound: "कोई मुद्दा नहीं मिला",
                tryDifferentFilter: "एक अलग फ़िल्टर आज़माएं",
            },
        };
        return L[locale] || L.en;
    }, [locale]);

    /* ------------------ STATE ------------------ */
    const [authReady, setAuthReady] = useState(false);
    const [uid, setUid] = useState("");
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [issues, setIssues] = useState<IssueRow[]>([]);
    const [filteredIssues, setFilteredIssues] = useState<IssueRow[]>([]);
    const [err, setErr] = useState("");
    const [activeFilter, setActiveFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        inProgress: 0,
        resolved: 0,
        rejected: 0
    });

    /* ------------------ AUTH SAFE ------------------ */
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            setUid(u?.uid || "");
            setAuthReady(true);
        });
        return () => unsub();
    }, []);

    /* ------------------ LOAD ISSUES ------------------ */
    const loadIssues = async () => {
        if (!uid) {
            router.replace(`/${locale}/villager/login`);
            return;
        }

        setLoading(true);
        setErr("");

        try {
            const q = query(
                collection(db, "issues"),
                where("villagerId", "==", uid),
                orderBy("createdAt", "desc"),
                limit(50)
            );

            const snap = await getDocs(q);
            const rows = snap.docs.map((d) => ({
                id: d.id,
                ...(d.data() as any),
            }));

            setIssues(rows);
            setFilteredIssues(rows);
            
            // Calculate statistics
            const stats = {
                total: rows.length,
                pending: rows.filter(i => i.status?.toLowerCase() === 'pending').length,
                inProgress: rows.filter(i => i.status?.toLowerCase() === 'in progress').length,
                resolved: rows.filter(i => i.status?.toLowerCase() === 'resolved').length,
                rejected: rows.filter(i => i.status?.toLowerCase() === 'rejected').length
            };
            setStats(stats);
            
        } catch (e: any) {
            setErr(e?.message || "Failed to load issues");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (!authReady) return;
        loadIssues();
    }, [authReady, uid, locale, router]);

    /* ------------------ FILTER ISSUES ------------------ */
    useEffect(() => {
        let filtered = issues;
        
        // Apply status filter
        if (activeFilter !== "all") {
            filtered = filtered.filter(issue => 
                issue.status?.toLowerCase() === activeFilter.toLowerCase()
            );
        }
        
        // Apply search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(issue =>
                issue.title?.toLowerCase().includes(query) ||
                issue.description?.toLowerCase().includes(query) ||
                issue.category?.toLowerCase().includes(query) ||
                issue.location?.toLowerCase().includes(query)
            );
        }
        
        setFilteredIssues(filtered);
    }, [activeFilter, searchQuery, issues]);

    /* ------------------ HANDLE REFRESH ------------------ */
    const handleRefresh = () => {
        setRefreshing(true);
        loadIssues();
    };

    /* ------------------ LOADING SKELETON ------------------ */
    if (loading && !refreshing) {
        return (
            <Screen padded>
                <style>{`
                    @keyframes shimmer {
                        0% { transform: translateX(-100%); }
                        100% { transform: translateX(100%); }
                    }
                    @keyframes pulse {
                        0%, 100% { opacity: 1; }
                        50% { opacity: 0.5; }
                    }
                    .shimmer {
                        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
                        animation: shimmer 1.5s infinite;
                    }
                    .pulse {
                        animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                    }
                `}</style>
                
                <div className="min-h-screen bg-gradient-to-b from-green-50 to-white p-4">
                    {/* Header Skeleton */}
                    <div className="mb-8">
                        <div className="h-8 w-48 bg-gradient-to-r from-green-200 to-emerald-200 rounded-lg mb-2 pulse"></div>
                        <div className="h-4 w-64 bg-gradient-to-r from-green-100 to-emerald-100 rounded pulse"></div>
                    </div>

                    {/* Stats Skeleton */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-green-50 p-4 shadow-lg">
                                <div className="absolute inset-0 shimmer"></div>
                                <div className="h-4 w-16 bg-gradient-to-r from-green-200 to-emerald-200 rounded mb-3"></div>
                                <div className="h-8 w-12 bg-gradient-to-r from-green-300 to-emerald-300 rounded"></div>
                            </div>
                        ))}
                    </div>

                    {/* Filter Skeleton */}
                    <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="h-10 w-24 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl pulse"></div>
                        ))}
                    </div>

                    {/* Issues Skeleton */}
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-green-50 p-5 shadow-lg">
                                <div className="absolute inset-0 shimmer"></div>
                                <div className="flex items-start gap-3">
                                    <div className="h-12 w-12 bg-gradient-to-r from-green-200 to-emerald-200 rounded-xl"></div>
                                    <div className="flex-1">
                                        <div className="h-5 w-48 bg-gradient-to-r from-green-200 to-emerald-200 rounded mb-3"></div>
                                        <div className="h-3 w-64 bg-gradient-to-r from-green-100 to-emerald-100 rounded mb-2"></div>
                                        <div className="flex gap-2">
                                            <div className="h-6 w-20 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full"></div>
                                            <div className="h-6 w-24 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full"></div>
                                        </div>
                                    </div>
                                    <div className="h-8 w-8 bg-gradient-to-r from-green-200 to-emerald-200 rounded-full"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </Screen>
        );
    }

    return (
        <Screen padded>
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes slideInLeft {
                    from { opacity: 0; transform: translateX(-20px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                @keyframes slideInRight {
                    from { opacity: 0; transform: translateX(20px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                @keyframes scaleIn {
                    from { opacity: 0; transform: scale(0.9); }
                    to { opacity: 1; transform: scale(1); }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }
                @keyframes countUp {
                    from { transform: translateY(10px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animate-fadeIn { animation: fadeIn 0.6s ease-out forwards; }
                .animate-slideLeft { animation: slideInLeft 0.5s ease-out forwards; }
                .animate-slideRight { animation: slideInRight 0.5s ease-out forwards; }
                .animate-scaleIn { animation: scaleIn 0.4s ease-out forwards; }
                .animate-pulse { animation: pulse 2s ease-in-out infinite; }
                .animate-count { animation: countUp 0.5s ease-out forwards; }
                .delay-100 { animation-delay: 0.1s; }
                .delay-200 { animation-delay: 0.2s; }
                .delay-300 { animation-delay: 0.3s; }
                .delay-400 { animation-delay: 0.4s; }
                .delay-500 { animation-delay: 0.5s; }
                
                .issue-card {
                    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                    background: linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(240,253,244,0.8) 100%);
                }
                .issue-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 12px 24px rgba(34, 197, 94, 0.15);
                }
                .stat-card {
                    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                .stat-card:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 8px 16px rgba(34, 197, 94, 0.1);
                }
                .filter-btn {
                    transition: all 0.3s ease;
                }
                .filter-btn.active {
                    transform: scale(1.05);
                }
                .refresh-spin {
                    animation: spin 0.8s linear infinite;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>

            <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-white p-4 pb-24">
                {/* Header */}
                <div className="mb-8 animate-fadeIn">
                    <div className="flex items-center justify-between mb-6">
                        <button
                            onClick={() => router.push(`/${locale}/villager/dashboard`)}
                            className="p-3 rounded-2xl border-2 border-green-100 bg-white hover:bg-green-50 active:scale-95 transition-all duration-200 flex items-center gap-2"
                        >
                            <FiArrowLeft className="w-5 h-5 text-green-700" />
                            <span className="text-sm font-semibold text-green-800">{t.back}</span>
                        </button>
                        
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleRefresh}
                                disabled={refreshing}
                                className="p-3 rounded-2xl border-2 border-green-100 bg-white hover:bg-green-50 active:scale-95 transition-all duration-200"
                                title={t.refresh}
                            >
                                <FiRefreshCw className={`w-5 h-5 text-green-700 ${refreshing ? 'refresh-spin' : ''}`} />
                            </button>
                            
                            <button
                                onClick={() => router.push(`/${locale}/villager/raise-issue`)}
                                className="p-3 rounded-2xl border-2 border-green-100 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-extrabold active:scale-95 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl"
                            >
                                <FiPlus className="w-5 h-5" />
                                <span className="text-sm">{t.report}</span>
                            </button>
                        </div>
                    </div>
                    
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold text-green-900 tracking-tight mb-2">{t.title}</h1>
                        <p className="text-green-700/80 text-lg font-medium">{t.subtitle}</p>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 animate-fadeIn delay-100">
                    <div className="stat-card bg-gradient-to-br from-white to-green-50 border-2 border-green-100 rounded-2xl p-4 shadow-lg">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-green-800/80">{t.totalIssues}</span>
                            <div className="p-2 bg-green-100 rounded-lg">
                                <FiBarChart2 className="w-4 h-4 text-green-600" />
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-green-900 animate-count">{stats.total}</div>
                        <div className="h-1 w-full bg-gradient-to-r from-green-200 to-transparent rounded-full mt-2"></div>
                    </div>

                    <div className="stat-card bg-gradient-to-br from-white to-amber-50 border-2 border-amber-100 rounded-2xl p-4 shadow-lg">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-amber-800/80">{t.activeIssues}</span>
                            <div className="p-2 bg-amber-100 rounded-lg">
                                <FiClock className="w-4 h-4 text-amber-600" />
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-amber-900 animate-count">{stats.pending + stats.inProgress}</div>
                        <div className="h-1 w-full bg-gradient-to-r from-amber-200 to-transparent rounded-full mt-2"></div>
                    </div>

                    <div className="stat-card bg-gradient-to-br from-white to-emerald-50 border-2 border-emerald-100 rounded-2xl p-4 shadow-lg">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-emerald-800/80">{t.resolvedIssues}</span>
                            <div className="p-2 bg-emerald-100 rounded-lg">
                                <FiCheckCircle className="w-4 h-4 text-emerald-600" />
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-emerald-900 animate-count">{stats.resolved}</div>
                        <div className="h-1 w-full bg-gradient-to-r from-emerald-200 to-transparent rounded-full mt-2"></div>
                    </div>

                    <div className="stat-card bg-gradient-to-br from-white to-red-50 border-2 border-red-100 rounded-2xl p-4 shadow-lg">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-red-800/80">{t.rejected}</span>
                            <div className="p-2 bg-red-100 rounded-lg">
                                <FiAlertCircle className="w-4 h-4 text-red-600" />
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-red-900 animate-count">{stats.rejected}</div>
                        <div className="h-1 w-full bg-gradient-to-r from-red-200 to-transparent rounded-full mt-2"></div>
                    </div>
                </div>

                {/* Search and Filter */}
                <div className="mb-8 animate-fadeIn delay-200">
                    <div className="relative mb-4">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FiSearch className="h-5 w-5 text-green-700/70" />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={t.search}
                            className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-green-100 bg-white text-green-900 placeholder-green-700/50 focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-transparent"
                        />
                    </div>
                    
                    <div className="flex items-center gap-2 overflow-x-auto pb-2">
                        <button
                            onClick={() => setActiveFilter("all")}
                            className={`filter-btn px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap ${activeFilter === "all" ? 'active bg-gradient-to-r from-green-500 to-emerald-600 text-white' : 'bg-white border-2 border-green-100 text-green-800'}`}
                        >
                            {t.all} ({stats.total})
                        </button>
                        <button
                            onClick={() => setActiveFilter("pending")}
                            className={`filter-btn px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap ${activeFilter === "pending" ? 'active bg-gradient-to-r from-amber-500 to-orange-600 text-white' : 'bg-white border-2 border-amber-100 text-amber-800'}`}
                        >
                            {t.pending} ({stats.pending})
                        </button>
                        <button
                            onClick={() => setActiveFilter("in progress")}
                            className={`filter-btn px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap ${activeFilter === "in progress" ? 'active bg-gradient-to-r from-blue-500 to-cyan-600 text-white' : 'bg-white border-2 border-blue-100 text-blue-800'}`}
                        >
                            {t.inProgress} ({stats.inProgress})
                        </button>
                        <button
                            onClick={() => setActiveFilter("resolved")}
                            className={`filter-btn px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap ${activeFilter === "resolved" ? 'active bg-gradient-to-r from-green-500 to-emerald-600 text-white' : 'bg-white border-2 border-green-100 text-green-800'}`}
                        >
                            {t.resolved} ({stats.resolved})
                        </button>
                        <button
                            onClick={() => setActiveFilter("rejected")}
                            className={`filter-btn px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap ${activeFilter === "rejected" ? 'active bg-gradient-to-r from-red-500 to-pink-600 text-white' : 'bg-white border-2 border-red-100 text-red-800'}`}
                        >
                            {t.rejected} ({stats.rejected})
                        </button>
                    </div>
                </div>

                {/* Error Message */}
                {err && (
                    <div className="mb-6 animate-slideLeft">
                        <div className="bg-gradient-to-r from-red-500 to-orange-600 text-white rounded-2xl p-4 shadow-lg flex items-center gap-3">
                            <FiAlertCircle className="w-6 h-6 flex-shrink-0" />
                            <div>
                                <p className="font-bold">Error</p>
                                <p className="text-sm opacity-90">{err}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Issues List */}
                <div className="space-y-4 mb-8">
                    {filteredIssues.length === 0 ? (
                        <div className="text-center py-12 animate-fadeIn">
                            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mb-6">
                                <FiAlertCircle className="w-12 h-12 text-green-600/70" />
                            </div>
                            <h3 className="text-xl font-bold text-green-900 mb-2">
                                {searchQuery || activeFilter !== "all" ? t.noIssuesFound : t.empty}
                            </h3>
                            <p className="text-green-700/70 mb-6">
                                {searchQuery || activeFilter !== "all" ? t.tryDifferentFilter : t.emptySub}
                            </p>
                            <button
                                onClick={() => {
                                    setActiveFilter("all");
                                    setSearchQuery("");
                                }}
                                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-semibold"
                            >
                                View All Issues
                            </button>
                        </div>
                    ) : (
                        filteredIssues.map((issue, index) => {
                            const StatusIcon = getStatusIcon(issue.status || 'pending');
                            return (
                                <div
                                    key={issue.id}
                                    className="issue-card border-2 border-green-100 rounded-2xl p-5 shadow-lg animate-fadeIn cursor-pointer"
                                    style={{ animationDelay: `${index * 0.1}s` }}
                                    onClick={() => router.push(`/${locale}/villager/issues/${issue.id}`)}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`p-3 rounded-xl ${getStatusColor(issue.status || 'pending')} text-white`}>
                                            <StatusIcon className="w-6 h-6" />
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-3 mb-3">
                                                <h3 className="font-bold text-green-900 text-lg truncate">
                                                    {issue.title || "Untitled Issue"}
                                                </h3>
                                                <button
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="p-2 rounded-lg hover:bg-green-50 text-green-700/70 hover:text-green-700"
                                                >
                                                    <FiChevronRight className="w-5 h-5" />
                                                </button>
                                            </div>
                                            
                                            <p className="text-green-700/80 text-sm mb-4 line-clamp-2">
                                                {issue.description || "No description provided"}
                                            </p>
                                            
                                            <div className="flex flex-wrap items-center gap-3">
                                                <div className={`px-3 py-1.5 rounded-full text-xs font-bold text-white ${getStatusColor(issue.status || 'pending')}`}>
                                                    {issue.status || t.pending}
                                                </div>
                                                
                                                {issue.priority && (
                                                    <div className={`px-3 py-1.5 rounded-full text-xs font-bold text-white ${getPriorityColor(issue.priority)}`}>
                                                        {issue.priority}
                                                    </div>
                                                )}
                                                
                                                {issue.category && (
                                                    <div className="px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 flex items-center gap-1">
                                                        <FiFolder className="w-3 h-3" />
                                                        {issue.category}
                                                    </div>
                                                )}
                                                
                                                {issue.location && (
                                                    <div className="px-3 py-1.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 flex items-center gap-1">
                                                        <FiMapPin className="w-3 h-3" />
                                                        <span className="truncate max-w-[100px]">{issue.location}</span>
                                                    </div>
                                                )}
                                                
                                                <div className="px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 flex items-center gap-1">
                                                    <FiCalendar className="w-3 h-3" />
                                                    {fmtDate(issue.createdAt)}
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-green-100">
                                                {issue.commentsCount !== undefined && (
                                                    <div className="flex items-center gap-1 text-green-700/70">
                                                        <FiMessageSquare className="w-4 h-4" />
                                                        <span className="text-sm font-medium">{issue.commentsCount}</span>
                                                    </div>
                                                )}
                                                
                                                {issue.upvotes !== undefined && (
                                                    <div className="flex items-center gap-1 text-green-700/70">
                                                        <FiEye className="w-4 h-4" />
                                                        <span className="text-sm font-medium">{issue.upvotes}</span>
                                                    </div>
                                                )}
                                                
                                                {issue.assignedTo && (
                                                    <div className="ml-auto text-xs text-green-700/70 font-medium">
                                                        {t.assignee}: {issue.assignedTo}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-4 pt-4 border-t border-green-100">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                router.push(`/${locale}/villager/issues/${issue.id}`);
                                            }}
                                            className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 hover:shadow-lg transition-all"
                                        >
                                            <FiEye className="w-4 h-4" />
                                            {t.viewDetails}
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Bottom Navigation - Same as Dashboard and Profile */}
                <div className="fixed bottom-4 left-4 right-4 bg-white/90 backdrop-blur-lg border-2 border-green-100 rounded-2xl p-2 shadow-xl animate-fadeIn">
                    <div className="grid grid-cols-4 gap-1">
                        <button
                            className="flex flex-col items-center justify-center p-3 rounded-xl transition-all hover:bg-green-50"
                            onClick={() => router.push(`/${locale}/villager/dashboard`)}
                        >
                            <FiHome className="w-5 h-5 text-green-600/70" />
                            <span className="text-xs mt-1 font-medium text-green-700/70">
                                Dashboard
                            </span>
                        </button>
                        
                        <button
                            className="flex flex-col items-center justify-center p-3 rounded-xl transition-all bg-gradient-to-b from-green-100 to-emerald-50"
                        >
                            <FiList className="w-5 h-5 text-green-700" />
                            <span className="text-xs mt-1 font-medium text-green-800 font-bold">
                                My Issues
                            </span>
                        </button>
                        
                        <button
                            className="flex flex-col items-center justify-center p-3 rounded-xl transition-all hover:bg-green-50"
                            onClick={() => router.push(`/${locale}/villager/issue-tracking`)}
                        >
                            <FiTrendingUp className="w-5 h-5 text-green-600/70" />
                            <span className="text-xs mt-1 font-medium text-green-700/70">
                                Tracking
                            </span>
                        </button>
                        
                        <button
                            className="flex flex-col items-center justify-center p-3 rounded-xl transition-all hover:bg-green-50"
                            onClick={() => router.push(`/${locale}/villager/profile`)}
                        >
                            <FiUser className="w-5 h-5 text-green-600/70" />
                            <span className="text-xs mt-1 font-medium text-green-700/70">
                                Profile
                            </span>
                        </button>
                    </div>
                </div>

                {/* Floating Action Button */}
                <button
                    onClick={() => router.push(`/${locale}/villager/raise-issue`)}
                    className="fixed bottom-24 right-6 w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 z-10"
                >
                    <FiPlus className="w-6 h-6 text-white" />
                </button>
            </div>
        </Screen>
    );
}