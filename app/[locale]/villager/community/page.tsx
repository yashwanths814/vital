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
    getDoc,
    setDoc,
    serverTimestamp
} from "firebase/firestore";
import {
    FiHome,
    FiList,
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
    FiUsers,
    FiShare2,
    FiHeart,
    FiMessageCircle,
    FiUserCheck,
    FiFlag,
    FiSettings,
    FiTrendingUp,
    FiX
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
    village?: string;
    villageName?: string;
    villagerId?: string;
    villagerName?: string;
    reporterName?: string;
    createdAt?: any;
    updatedAt?: any;
    images?: string[];
    assignedTo?: string;
    commentsCount?: number;
    upvotes?: number;
    isOwner?: boolean;
    userVillage?: string;
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
        case 'in progress': return 'bg-gradient-to-br from-blue-500 to-cyan-600';
        case 'pending': return 'bg-gradient-to-br from-amber-500 to-orange-600';
        case 'rejected': return 'bg-gradient-to-br from-red-500 to-pink-600';
        case 'on hold': return 'bg-gradient-to-br from-purple-500 to-violet-600';
        case 'verified_by_vi': return 'bg-gradient-to-br from-indigo-500 to-purple-600';
        case 'escalated_to_tdo': return 'bg-gradient-to-br from-rose-500 to-pink-600';
        case 'closed': return 'bg-gradient-to-br from-green-600 to-emerald-700';
        case 'submitted': return 'bg-gradient-to-br from-blue-400 to-indigo-500';
        default: return 'bg-gradient-to-br from-gray-500 to-gray-600';
    }
}

function getStatusIcon(status: string) {
    switch (status?.toLowerCase()) {
        case 'resolved': return FiCheckCircle;
        case 'in progress': return FiClock;
        case 'pending': return FiClock;
        case 'rejected': return FiAlertCircle;
        case 'on hold': return FiAlertCircle;
        case 'verified_by_vi': return FiUserCheck;
        case 'escalated_to_tdo': return FiFlag;
        case 'closed': return FiCheckCircle;
        case 'submitted': return FiClock;
        default: return FiAlertCircle;
    }
}

function getPriorityColor(priority: string) {
    switch (priority?.toLowerCase()) {
        case 'high': return 'bg-gradient-to-br from-red-500 to-orange-600';
        case 'medium': return 'bg-gradient-to-br from-amber-500 to-yellow-600';
        case 'low': return 'bg-gradient-to-br from-green-500 to-emerald-600';
        case 'urgent': return 'bg-gradient-to-br from-red-600 to-pink-700';
        case 'critical': return 'bg-gradient-to-br from-red-700 to-rose-800';
        default: return 'bg-gradient-to-br from-gray-500 to-gray-600';
    }
}

export default function VillagerCommunityIssuesPage() {
    const router = useRouter();
    const params = useParams() as { locale?: string };
    const locale = (params?.locale || "en") as Locale;

    /* ------------------ i18n ------------------ */
    const t = useMemo(() => {
        const L: any = {
            en: {
                title: "Community Hub",
                subtitle: "Connect, support, and resolve issues together",
                back: "Back to Dashboard",
                loading: "Loading community issues...",
                empty: "No community issues found",
                emptySub: "Be the first to report an issue in your village",
                report: "Report Issue",
                login: "Please login to continue",
                status: "Status",
                priority: "Priority",
                category: "Category",
                date: "Date",
                location: "Location",
                village: "Village",
                reportedBy: "Reported by",
                actions: "Actions",
                viewDetails: "View Details",
                share: "Share",
                filter: "Filter",
                search: "",
                all: "All",
                pending: "Pending",
                inProgress: "In Progress",
                resolved: "Resolved",
                urgent: "Urgent",
                high: "High",
                medium: "Medium",
                low: "Low",
                stats: "Statistics",
                totalIssues: "Total Issues",
                activeIssues: "Active",
                resolvedIssues: "Resolved",
                recentActivity: "Recent",
                refresh: "Refresh",
                upvote: "Support",
                comment: "Comment",
                support: "Support",
                trending: "Hot",
                newest: "Latest",
                oldest: "Oldest",
                mostSupported: "Most Supported",
                sortBy: "Sort by",
                communityWall: "Community Wall",
                showMyIssues: "My Issues",
                showAll: "All Issues",
                anonymous: "Anonymous",
                supportCount: "Supports",
                comments: "Comments",
                myVillage: "My Village",
                joinDiscussion: "Join Discussion",
                shareIssue: "Share",
                flagIssue: "Flag",
                noIssuesFound: "No issues match your search",
                tryDifferentFilter: "Try adjusting your filters",
                updateProfile: "Update Profile",
                profileNote: "Set your village to see community issues",
                selectVillage: "Select Your Village",
                villagePlaceholder: "Search for your village...",
                saveVillage: "Save Village",
                updateVillageSuccess: "Village updated successfully!",
                updateVillageError: "Failed to update village",
                loadingVillages: "Loading villages...",
                villageRequired: "Choose your village to continue",
                searchVillages: "Search villages",
                noVillagesFound: "No villages found",
                enterCustomVillage: "Enter custom village name",
                skip: "Skip for now",
                loadingYourVillage: "Loading...",
                people: "people",
                hoursAgo: "h ago",
                minutesAgo: "m ago",
                justNow: "Just now",
            },
        };
        return L[locale] || L.en;
    }, [locale]);

    /* ------------------ STATE ------------------ */
    const [authReady, setAuthReady] = useState(false);
    const [uid, setUid] = useState("");
    const [userVillage, setUserVillage] = useState("");
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [issues, setIssues] = useState<IssueRow[]>([]);
    const [filteredIssues, setFilteredIssues] = useState<IssueRow[]>([]);
    const [err, setErr] = useState("");
    const [activeFilter, setActiveFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("newest");
    const [showOnlyMyIssues, setShowOnlyMyIssues] = useState(false);
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        resolved: 0,
        myIssues: 0,
        urgent: 0,
        trending: 0
    });

    const [showVillageModal, setShowVillageModal] = useState(false);
    const [selectedVillage, setSelectedVillage] = useState("");
    const [customVillage, setCustomVillage] = useState("");
    const [savingVillage, setSavingVillage] = useState(false);
    const [availableVillages, setAvailableVillages] = useState<string[]>([]);
    const [fetchingVillage, setFetchingVillage] = useState(false);
    const [villageSearchQuery, setVillageSearchQuery] = useState("");

    /* ------------------ AUTH ------------------ */
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            if (u) {
                setUid(u.uid);
                setAuthReady(true);
            } else {
                router.replace(`/${locale}/villager/login`);
            }
        });
        return () => unsub();
    }, [locale, router]);

    /* ------------------ FETCH VILLAGE FROM ISSUES ------------------ */
    const loadUserVillageFromIssues = async (userId: string): Promise<string> => {
        try {
            const issuesQuery = query(
                collection(db, "issues"),
                where("villagerId", "==", userId),
                orderBy("createdAt", "desc"),
                limit(1)
            );
            
            const issuesSnapshot = await getDocs(issuesQuery);
            
            if (!issuesSnapshot.empty) {
                const issueData = issuesSnapshot.docs[0].data();
                const village = issueData.villageName || issueData.village || "";
                if (village) {
                    console.log("Found village:", village);
                    return village;
                }
            }
            return "";
        } catch (error) {
            console.error("Error loading village:", error);
            return "";
        }
    };

    /* ------------------ LOAD VILLAGES FROM ISSUES ------------------ */
    const loadAvailableVillagesFromIssues = async () => {
        try {
            const issuesQuery = query(
                collection(db, "issues"),
                orderBy("createdAt", "desc"),
                limit(200)
            );
            
            const issuesSnapshot = await getDocs(issuesQuery);
            const villageSet = new Set<string>();
            
            issuesSnapshot.docs.forEach(doc => {
                const data = doc.data();
                const villageName = data.villageName || data.village || "";
                if (villageName && typeof villageName === 'string' && villageName.trim()) {
                    villageSet.add(villageName.trim());
                }
            });
            
            const villageNames = Array.from(villageSet).sort();
            setAvailableVillages(villageNames);
        } catch (error) {
            console.error("Error loading villages:", error);
            setAvailableVillages([]);
        }
    };

    /* ------------------ SAVE VILLAGE ------------------ */
    const saveUserVillage = async () => {
        if (!uid) return;
        
        const villageToSave = selectedVillage || customVillage.trim();
        
        if (!villageToSave) {
            setErr("Please enter your village name");
            return;
        }
        
        setSavingVillage(true);
        setErr("");
        
        try {
            await setDoc(doc(db, "villagers", uid), {
                village: villageToSave,
                villageName: villageToSave,
                updatedAt: serverTimestamp()
            }, { merge: true });
            
            setUserVillage(villageToSave);
            setShowVillageModal(false);
            await loadCommunityIssues(villageToSave);
        } catch (error: any) {
            console.error("Error saving village:", error);
            setErr(error.message || "Failed to save village");
        } finally {
            setSavingVillage(false);
        }
    };

    /* ------------------ LOAD ISSUES ------------------ */
    const loadCommunityIssues = async (village?: string) => {
        if (!uid) return;

        setLoading(true);
        setErr("");

        try {
            let targetVillage = village;
            
            if (!targetVillage) {
                setFetchingVillage(true);
                targetVillage = await loadUserVillageFromIssues(uid);
                setFetchingVillage(false);
            }
            
            if (!targetVillage) {
                setShowVillageModal(true);
                await loadAvailableVillagesFromIssues();
                setLoading(false);
                return;
            }
            
            setUserVillage(targetVillage);
            
            const q = query(
                collection(db, "issues"),
                orderBy("createdAt", "desc"),
                limit(200)
            );

            const snap = await getDocs(q);
            const rows: IssueRow[] = [];
            
            for (const docSnap of snap.docs) {
                const issueData = docSnap.data();
                const issueVillage = issueData.villageName || issueData.village || "";
                
                if (issueVillage !== targetVillage) continue;
                
                const issueRow: IssueRow = {
                    id: docSnap.id,
                    ...issueData,
                    isOwner: issueData.villagerId === uid,
                    userVillage: targetVillage
                };

                try {
                    if (issueData.reporterName) {
                        issueRow.villagerName = issueData.reporterName;
                    } else if (issueData.villagerId) {
                        const reporterDoc = await getDoc(doc(db, "villagers", issueData.villagerId));
                        if (reporterDoc.exists()) {
                            const reporterData = reporterDoc.data();
                            issueRow.villagerName = reporterData.name || t.anonymous;
                        } else {
                            issueRow.villagerName = t.anonymous;
                        }
                    }
                } catch (error) {
                    issueRow.villagerName = t.anonymous;
                }

                rows.push(issueRow);
            }

            setIssues(rows);
            setFilteredIssues(rows);
            
            const stats = {
                total: rows.length,
                active: rows.filter(i => {
                    const status = i.status?.toLowerCase();
                    return status !== 'resolved' && status !== 'rejected' && status !== 'closed';
                }).length,
                resolved: rows.filter(i => {
                    const status = i.status?.toLowerCase();
                    return status === 'resolved' || status === 'closed';
                }).length,
                myIssues: rows.filter(i => i.villagerId === uid).length,
                urgent: rows.filter(i => {
                    const priority = i.priority?.toLowerCase();
                    return priority === 'urgent' || priority === 'critical';
                }).length,
                trending: rows.filter(i => (i.upvotes || 0) >= 5).length
            };
            
            setStats(stats);
            
        } catch (e: any) {
            console.error("Error loading issues:", e);
            setErr(e?.message || "Failed to load issues");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    /* ------------------ INIT ------------------ */
    useEffect(() => {
        if (!authReady || !uid) return;
        loadCommunityIssues();
    }, [authReady, uid]);

    /* ------------------ FILTER ------------------ */
    useEffect(() => {
        let filtered = issues;
        
        if (activeFilter !== "all") {
            filtered = filtered.filter(issue =>
                issue.status?.toLowerCase() === activeFilter.toLowerCase()
            );
        }
        
        if (showOnlyMyIssues) {
            filtered = filtered.filter(issue => issue.isOwner);
        }
        
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(issue =>
                issue.title?.toLowerCase().includes(query) ||
                issue.description?.toLowerCase().includes(query) ||
                issue.category?.toLowerCase().includes(query)
            );
        }
        
        filtered.sort((a, b) => {
            return new Date(b.createdAt?.toDate?.() || b.createdAt || 0).getTime() -
                   new Date(a.createdAt?.toDate?.() || a.createdAt || 0).getTime();
        });
        
        setFilteredIssues(filtered);
    }, [activeFilter, searchQuery, showOnlyMyIssues, issues]);

    const handleRefresh = () => {
        setRefreshing(true);
        loadCommunityIssues(userVillage);
    };

    const formatTimeAgo = (date: any) => {
        try {
            if (!date) return "";
            
            let timestamp: Date;
            if (date instanceof Timestamp) {
                timestamp = date.toDate();
            } else if (date?.toDate) {
                timestamp = date.toDate();
            } else {
                timestamp = new Date(date);
            }
            
            const now = new Date();
            const diffMs = now.getTime() - timestamp.getTime();
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffMinutes = Math.floor(diffMs / (1000 * 60));
            
            if (diffMinutes < 1) return t.justNow;
            if (diffMinutes < 60) return `${diffMinutes} ${t.minutesAgo}`;
            if (diffHours < 24) return `${diffHours} ${t.hoursAgo}`;
            
            return fmtDate(date);
        } catch {
            return "";
        }
    };

    const filteredAvailableVillages = useMemo(() => {
        if (!villageSearchQuery) return availableVillages;
        const query = villageSearchQuery.toLowerCase();
        return availableVillages.filter(village =>
            village.toLowerCase().includes(query)
        );
    }, [availableVillages, villageSearchQuery]);

    if (loading && !refreshing) {
        return (
            <Screen padded>
                <style>{`
                    @keyframes shimmer {
                        0% { background-position: -1000px 0; }
                        100% { background-position: 1000px 0; }
                    }
                    .shimmer {
                        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                        background-size: 1000px 100%;
                        animation: shimmer 2s infinite;
                    }
                `}</style>
                
                <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-4">
                    {/* Header Skeleton */}
                    <div className="mb-6">
                        <div className="h-10 w-48 bg-gray-200 rounded-xl mb-3 shimmer"></div>
                        <div className="h-5 w-64 bg-gray-100 rounded shimmer"></div>
                    </div>

                    {/* Stats Skeleton */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="bg-white rounded-2xl p-5 shadow-lg border border-green-100">
                                <div className="h-4 w-16 bg-gray-200 rounded mb-3 shimmer"></div>
                                <div className="h-8 w-12 bg-gray-300 rounded shimmer"></div>
                            </div>
                        ))}
                    </div>

                    {/* Search Skeleton */}
                    <div className="h-14 bg-white rounded-2xl mb-4 shimmer"></div>

                    {/* Issues Skeleton */}
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white rounded-2xl p-6 shadow-lg border border-green-100">
                                <div className="flex gap-4">
                                    <div className="h-12 w-12 bg-gray-200 rounded-xl shimmer"></div>
                                    <div className="flex-1">
                                        <div className="h-5 w-48 bg-gray-200 rounded mb-3 shimmer"></div>
                                        <div className="h-4 w-full bg-gray-100 rounded mb-2 shimmer"></div>
                                        <div className="flex gap-2">
                                            <div className="h-6 w-20 bg-gray-200 rounded-full shimmer"></div>
                                            <div className="h-6 w-24 bg-gray-200 rounded-full shimmer"></div>
                                        </div>
                                    </div>
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
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes slideIn {
                    from { opacity: 0; transform: translateX(-20px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                @keyframes scaleIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                @keyframes modalFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes modalSlideIn {
                    from { opacity: 0; transform: scale(0.9) translateY(20px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                .animate-fadeIn { animation: fadeIn 0.5s ease-out; }
                .animate-slideIn { animation: slideIn 0.5s ease-out; }
                .animate-scaleIn { animation: scaleIn 0.4s ease-out; }
                .animate-modalBg { animation: modalFadeIn 0.3s ease-out; }
                .animate-modalContent { animation: modalSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
                
                .issue-card {
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .issue-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 12px 24px rgba(16, 185, 129, 0.15);
                }
                .issue-card:active {
                    transform: translateY(-2px);
                }
                
                .stat-card {
                    transition: all 0.3s ease;
                }
                .stat-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 16px rgba(16, 185, 129, 0.1);
                }
                
                .filter-btn {
                    transition: all 0.2s ease;
                }
                .filter-btn:active {
                    transform: scale(0.95);
                }
                
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                .animate-spin {
                    animation: spin 1s linear infinite;
                }
            `}</style>

            {/* Village Selection Modal */}
            {showVillageModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-modalBg">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden animate-modalContent">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-6 text-white">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-2xl font-bold">{t.selectVillage}</h3>
                                <button
                                    onClick={() => {
                                        setShowVillageModal(false);
                                        router.push(`/${locale}/villager/dashboard`);
                                    }}
                                    className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                                >
                                    <FiX className="w-5 h-5" />
                                </button>
                            </div>
                            <p className="text-green-50 text-sm">{t.villageRequired}</p>
                        </div>
                        
                        {/* Modal Content */}
                        <div className="p-6 overflow-y-auto max-h-[calc(85vh-180px)]">
                            {err && (
                                <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-center gap-3">
                                    <FiAlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                                    <p className="text-red-700 text-sm font-medium">{err}</p>
                                </div>
                            )}
                            
                            {availableVillages.length > 0 && (
                                <div className="mb-6">
                                    <label className="block text-sm font-bold text-gray-700 mb-3">
                                        {t.searchVillages}
                                    </label>
                                    
                                    {/* Search Input */}
                                    <div className="relative mb-4">
                                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            value={villageSearchQuery}
                                            onChange={(e) => setVillageSearchQuery(e.target.value)}
                                            placeholder={t.villagePlaceholder}
                                            className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none"
                                        />
                                    </div>
                                    
                                    {/* Village List */}
                                    <div className="space-y-2 max-h-64 overflow-y-auto">
                                        {filteredAvailableVillages.length > 0 ? (
                                            filteredAvailableVillages.map((village, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => {
                                                        setSelectedVillage(village);
                                                        setCustomVillage("");
                                                    }}
                                                    className={`w-full text-left px-4 py-3.5 rounded-xl font-medium transition-all ${
                                                        selectedVillage === village
                                                            ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg scale-[1.02]'
                                                            : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <FiMapPin className={`w-4 h-4 ${selectedVillage === village ? 'text-white' : 'text-gray-400'}`} />
                                                        {village}
                                                    </div>
                                                </button>
                                            ))
                                        ) : (
                                            <div className="text-center py-8 text-gray-500">
                                                <FiMapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                                <p className="font-medium">{t.noVillagesFound}</p>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Divider */}
                                    <div className="relative my-6">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t-2 border-gray-200"></div>
                                        </div>
                                        <div className="relative flex justify-center">
                                            <span className="px-4 text-sm font-bold text-gray-500 bg-white">OR</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {/* Custom Village Input */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-3">
                                    {t.enterCustomVillage}
                                </label>
                                <input
                                    type="text"
                                    value={customVillage}
                                    onChange={(e) => {
                                        setCustomVillage(e.target.value);
                                        setSelectedVillage("");
                                    }}
                                    placeholder={t.villagePlaceholder}
                                    className="w-full px-4 py-3.5 rounded-2xl border-2 border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none"
                                />
                            </div>
                        </div>
                        
                        {/* Modal Footer */}
                        <div className="p-6 bg-gray-50 border-t-2 border-gray-100">
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowVillageModal(false);
                                        router.push(`/${locale}/villager/dashboard`);
                                    }}
                                    className="flex-1 px-4 py-3.5 border-2 border-gray-300 text-gray-700 font-bold rounded-2xl hover:bg-gray-100 transition-colors"
                                >
                                    {t.skip}
                                </button>
                                <button
                                    onClick={saveUserVillage}
                                    disabled={savingVillage || (!selectedVillage && !customVillage.trim())}
                                    className="flex-1 px-6 py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-2xl hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg"
                                >
                                    {savingVillage ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <FiCheckCircle className="w-5 h-5" />
                                            {t.saveVillage}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-4 pb-28">
                {/* Header */}
                <div className="mb-6 animate-fadeIn">
                    <div className="flex items-center justify-between mb-6">
                        <button
                            onClick={() => router.push(`/${locale}/villager/dashboard`)}
                            className="p-3 rounded-2xl bg-white border-2 border-green-100 hover:bg-green-50 active:scale-95 transition-all duration-200 flex items-center gap-2 shadow-sm"
                        >
                            <FiArrowLeft className="w-5 h-5 text-green-700" />
                            <span className="text-sm font-bold text-green-800">Back</span>
                        </button>
                        
                        <div className="flex items-center gap-3">
                            {fetchingVillage && (
                                <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-xl border border-blue-200">
                                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                    <span className="text-sm font-semibold text-blue-700">Loading...</span>
                                </div>
                            )}
                            
                            <button
                                onClick={handleRefresh}
                                disabled={refreshing}
                                className="p-3 rounded-2xl bg-white border-2 border-green-100 hover:bg-green-50 active:scale-95 transition-all duration-200 shadow-sm"
                                title={t.refresh}
                            >
                                <FiRefreshCw className={`w-5 h-5 text-green-700 ${refreshing ? 'animate-spin' : ''}`} />
                            </button>
                            
                            <button
                                onClick={() => router.push(`/${locale}/villager/raise-issue`)}
                                className="px-4 py-3 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold flex items-center gap-2 shadow-lg hover:shadow-xl active:scale-95 transition-all duration-200"
                            >
                                <FiPlus className="w-5 h-5" />
                                <span className="hidden sm:inline">{t.report}</span>
                            </button>
                        </div>
                    </div>
                    
                    <div className="text-center mb-6">
                        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600 mb-2">
                            {t.title}
                        </h1>
                        <p className="text-green-700/80 text-lg font-medium">{t.subtitle}</p>
                        
                        {userVillage && (
                            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-full mt-4 border-2 border-blue-100 shadow-sm">
                                <FiMapPin className="w-4 h-4 text-blue-600" />
                                <span className="text-blue-900 font-bold">{userVillage}</span>
                                <button
                                    onClick={() => setShowVillageModal(true)}
                                    className="ml-1 p-1.5 hover:bg-blue-100 rounded-full transition-colors"
                                    title="Change village"
                                >
                                    <FiSettings className="w-3.5 h-3.5 text-blue-700" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {userVillage ? (
                    <>
                        {/* Statistics Cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 animate-slideIn">
                            <div className="stat-card bg-white rounded-2xl p-5 shadow-lg border-2 border-blue-100">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">{t.totalIssues}</span>
                                    <div className="p-2.5 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl">
                                        <FiBarChart2 className="w-4 h-4 text-blue-600" />
                                    </div>
                                </div>
                                <div className="text-3xl font-black text-blue-900">{stats.total}</div>
                                <div className="mt-3 h-1.5 w-full bg-blue-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full" style={{ width: '100%' }}></div>
                                </div>
                            </div>

                            <div className="stat-card bg-white rounded-2xl p-5 shadow-lg border-2 border-amber-100">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">{t.activeIssues}</span>
                                    <div className="p-2.5 bg-gradient-to-br from-amber-100 to-amber-50 rounded-xl">
                                        <FiClock className="w-4 h-4 text-amber-600" />
                                    </div>
                                </div>
                                <div className="text-3xl font-black text-amber-900">{stats.active}</div>
                                <div className="mt-3 h-1.5 w-full bg-amber-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full" style={{ width: stats.total > 0 ? `${(stats.active / stats.total) * 100}%` : '0%' }}></div>
                                </div>
                            </div>

                            <div className="stat-card bg-white rounded-2xl p-5 shadow-lg border-2 border-emerald-100">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">{t.resolvedIssues}</span>
                                    <div className="p-2.5 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-xl">
                                        <FiCheckCircle className="w-4 h-4 text-emerald-600" />
                                    </div>
                                </div>
                                <div className="text-3xl font-black text-emerald-900">{stats.resolved}</div>
                                <div className="mt-3 h-1.5 w-full bg-emerald-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full" style={{ width: stats.total > 0 ? `${(stats.resolved / stats.total) * 100}%` : '0%' }}></div>
                                </div>
                            </div>

                            <div className="stat-card bg-white rounded-2xl p-5 shadow-lg border-2 border-rose-100">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-bold text-rose-700 uppercase tracking-wide">{t.trending}</span>
                                    <div className="p-2.5 bg-gradient-to-br from-rose-100 to-rose-50 rounded-xl">
                                        <FiTrendingUp className="w-4 h-4 text-rose-600" />
                                    </div>
                                </div>
                                <div className="text-3xl font-black text-rose-900">{stats.trending}</div>
                                <div className="mt-3 h-1.5 w-full bg-rose-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-rose-500 to-rose-600 rounded-full" style={{ width: stats.total > 0 ? `${(stats.trending / stats.total) * 100}%` : '0%' }}></div>
                                </div>
                            </div>
                        </div>

                        {/* Search and Filters */}
                        <div className="mb-6 animate-scaleIn">
                            {/* Search Bar */}
                            <div className="relative mb-4">
                                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={t.search}
                                    className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-200 bg-white focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none text-gray-700 placeholder-gray-400 shadow-sm"
                                />
                            </div>
                            
                            {/* Filter Buttons */}
                            <div className="flex items-center gap-3 overflow-x-auto pb-2">
                                <button
                                    onClick={() => setActiveFilter("all")}
                                    className={`filter-btn px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap shadow-sm ${
                                        activeFilter === "all"
                                            ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-md'
                                            : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-300'
                                    }`}
                                >
                                    {t.all} ({stats.total})
                                </button>
                                
                                <button
                                    onClick={() => setActiveFilter("pending")}
                                    className={`filter-btn px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap shadow-sm ${
                                        activeFilter === "pending"
                                            ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md'
                                            : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-amber-300'
                                    }`}
                                >
                                    {t.pending} ({stats.active})
                                </button>
                                
                                <button
                                    onClick={() => setActiveFilter("resolved")}
                                    className={`filter-btn px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap shadow-sm ${
                                        activeFilter === "resolved"
                                            ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-md'
                                            : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-emerald-300'
                                    }`}
                                >
                                    {t.resolved} ({stats.resolved})
                                </button>
                                
                                <button
                                    onClick={() => setShowOnlyMyIssues(!showOnlyMyIssues)}
                                    className={`filter-btn px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap shadow-sm ${
                                        showOnlyMyIssues
                                            ? 'bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-md'
                                            : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-purple-300'
                                    }`}
                                >
                                    {showOnlyMyIssues ? t.showMyIssues : t.showAll}
                                </button>
                            </div>
                        </div>

                        {/* Issues List */}
                        <div className="space-y-4">
                            {filteredIssues.length === 0 ? (
                                <div className="text-center py-16 animate-fadeIn">
                                    <div className="w-24 h-24 mx-auto bg-gradient-to-br from-gray-100 to-gray-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                                        <FiUsers className="w-12 h-12 text-gray-400" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-700 mb-2">{t.noIssuesFound}</h3>
                                    <p className="text-gray-500 mb-6">{t.tryDifferentFilter}</p>
                                    {!searchQuery && activeFilter === "all" && !showOnlyMyIssues && (
                                        <button
                                            onClick={() => router.push(`/${locale}/villager/raise-issue`)}
                                            className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all"
                                        >
                                            {t.report}
                                        </button>
                                    )}
                                </div>
                            ) : (
                                filteredIssues.map((issue, index) => {
                                    const StatusIcon = getStatusIcon(issue.status || 'pending');
                                    const timeAgo = formatTimeAgo(issue.createdAt);
                                    const supportCount = issue.upvotes || 0;
                                    const commentCount = issue.commentsCount || 0;
                                    const isHot = supportCount >= 5;
                                    
                                    return (
                                        <div
                                            key={issue.id}
                                            className="issue-card bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100 cursor-pointer animate-fadeIn relative overflow-hidden"
                                            style={{ animationDelay: `${index * 0.05}s` }}
                                            onClick={() => router.push(`/${locale}/villager/issues/${issue.id}`)}
                                        >
                                            {/* Hot Badge */}
                                            {isHot && (
                                                <div className="absolute top-4 right-4 px-3 py-1.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white text-xs font-black rounded-full flex items-center gap-1.5 shadow-md">
                                                    <FiTrendingUp className="w-3.5 h-3.5" />
                                                    {t.trending}
                                                </div>
                                            )}
                                            
                                            {/* Owner Badge */}
                                            {issue.isOwner && !isHot && (
                                                <div className="absolute top-4 right-4 px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-black rounded-full shadow-md">
                                                    Your Issue
                                                </div>
                                            )}
                                            
                                            <div className="flex items-start gap-4">
                                                {/* Status Icon */}
                                                <div className={`p-3.5 rounded-xl ${getStatusColor(issue.status || 'pending')} text-white shadow-md flex-shrink-0`}>
                                                    <StatusIcon className="w-6 h-6" />
                                                </div>
                                                
                                                <div className="flex-1 min-w-0">
                                                    {/* Title and Meta */}
                                                    <div className="mb-3">
                                                        <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-2">
                                                            {issue.title || "Untitled Issue"}
                                                        </h3>
                                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                                            {issue.villagerName && !issue.isOwner && (
                                                                <div className="flex items-center gap-1.5">
                                                                    <FiUser className="w-3.5 h-3.5" />
                                                                    <span className="font-medium">{issue.villagerName}</span>
                                                                </div>
                                                            )}
                                                            {timeAgo && (
                                                                <div className="flex items-center gap-1.5">
                                                                    <FiClock className="w-3.5 h-3.5" />
                                                                    <span>{timeAgo}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Description */}
                                                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                                                        {issue.description || "No description provided"}
                                                    </p>
                                                    
                                                    {/* Tags */}
                                                    <div className="flex flex-wrap items-center gap-2 mb-4">
                                                        <div className={`px-3 py-1.5 rounded-full text-xs font-black text-white ${getStatusColor(issue.status || 'pending')} shadow-sm`}>
                                                            {issue.status || t.pending}
                                                        </div>
                                                        
                                                        {issue.priority && (
                                                            <div className={`px-3 py-1.5 rounded-full text-xs font-black text-white ${getPriorityColor(issue.priority)} shadow-sm`}>
                                                                {issue.priority}
                                                            </div>
                                                        )}
                                                        
                                                        {issue.category && (
                                                            <div className="px-3 py-1.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1.5">
                                                                <FiFolder className="w-3 h-3" />
                                                                {issue.category}
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Engagement Stats */}
                                                    <div className="flex items-center gap-3 pt-4 border-t-2 border-gray-100">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                            }}
                                                            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors border border-rose-200"
                                                        >
                                                            <FiHeart className={`w-4 h-4 ${supportCount > 0 ? 'fill-rose-500 text-rose-500' : ''}`} />
                                                            <span className="text-sm font-bold">{supportCount}</span>
                                                        </button>
                                                        
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                router.push(`/${locale}/villager/issues/${issue.id}#comments`);
                                                            }}
                                                            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors border border-blue-200"
                                                        >
                                                            <FiMessageCircle className="w-4 h-4" />
                                                            <span className="text-sm font-bold">{commentCount}</span>
                                                        </button>
                                                        
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                            }}
                                                            className="ml-auto p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"
                                                        >
                                                            <FiShare2 className="w-4 h-4" />
                                                        </button>
                                                        
                                                        <button
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"
                                                        >
                                                            <FiChevronRight className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </>
                ) : (
                    <div className="text-center py-16 animate-fadeIn">
                        <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full flex items-center justify-center mb-6 shadow-lg">
                            <FiMapPin className="w-12 h-12 text-blue-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-700 mb-2">{t.villageRequired}</h3>
                        <p className="text-gray-500 mb-6">{t.profileNote}</p>
                        <button
                            onClick={() => setShowVillageModal(true)}
                            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all"
                        >
                            {t.selectVillage}
                        </button>
                    </div>
                )}
            </div>

            {/* Bottom Navigation */}
            <div className="fixed bottom-4 left-4 right-4 bg-white/95 backdrop-blur-xl border-2 border-gray-200 rounded-2xl p-2 shadow-2xl z-40">
                <div className="grid grid-cols-4 gap-1">
                    <button
                        className="flex flex-col items-center justify-center p-3 rounded-xl transition-all hover:bg-gray-50"
                        onClick={() => router.push(`/${locale}/villager/dashboard`)}
                    >
                        <FiHome className="w-5 h-5 text-gray-400" />
                        <span className="text-xs mt-1 font-medium text-gray-500">Home</span>
                    </button>
                    
                    <button
                        className="flex flex-col items-center justify-center p-3 rounded-xl transition-all hover:bg-gray-50"
                        onClick={() => router.push(`/${locale}/villager/my-issues`)}
                    >
                        <FiList className="w-5 h-5 text-gray-400" />
                        <span className="text-xs mt-1 font-medium text-gray-500">Issues</span>
                    </button>
                    
                    <button
                        className="flex flex-col items-center justify-center p-3 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50"
                    >
                        <FiUsers className="w-5 h-5 text-green-600" />
                        <span className="text-xs mt-1 font-bold text-green-700">Community</span>
                    </button>
                    
                    <button
                        className="flex flex-col items-center justify-center p-3 rounded-xl transition-all hover:bg-gray-50"
                        onClick={() => router.push(`/${locale}/villager/profile`)}
                    >
                        <FiUser className="w-5 h-5 text-gray-400" />
                        <span className="text-xs mt-1 font-medium text-gray-500">Profile</span>
                    </button>
                </div>
            </div>

            {/* Floating Action Button */}
            <button
                onClick={() => router.push(`/${locale}/villager/raise-issue`)}
                className="fixed bottom-24 right-6 w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 active:scale-95 z-30"
            >
                <FiPlus className="w-7 h-7 text-white" />
            </button>
        </Screen>
    );
}