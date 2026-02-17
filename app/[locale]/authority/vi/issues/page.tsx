"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Screen from "../../../../components/Screen";
import { auth, db } from "../../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    limit,
    orderBy,
    query,
    startAfter,
    where,
    DocumentSnapshot,
    Timestamp,
} from "firebase/firestore";
import { FirebaseError } from "firebase/app";

// Icons
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
    FiPrinter,
    FiShield,
    FiCheckSquare,
    FiAlertTriangle,
    FiInbox,
    FiThumbsUp,
    FiUsers,
    FiGlobe,
    FiActivity,
    FiLoader,
    FiFileText,
    FiLogOut
} from "react-icons/fi";

type Locale = "en" | "kn" | "hi";

type Issue = {
    id: string;
    title?: string;
    category?: string;
    status?: string;
    description?: string;
    panchayatId?: string;
    createdAt?: any;
    villagerId?: string;
    priority?: string;
    location?: string;
    images?: string[];
    commentsCount?: number;
    upvotes?: number;
    villageName?: string;
    specificLocation?: string;
    reporterName?: string;
    reporterPhone?: string;
};

type Village = {
    id: string;
    name: string;
    districtId?: string;
    districtName?: string;
    talukId?: string;
    talukName?: string;
    isActive?: boolean;
};

const PAGE_SIZE = 20;

// ✅ Simplified statuses for VI - only what they need to see
const STATUSES = [
    "submitted",
    "vi_verified",
    "pdo_assigned",
] as const;

function fmtDate(v: any) {
    try {
        if (!v) return "";
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
        return "";
    }
}

function getStatusColor(status: string) {
    switch (status?.toLowerCase()) {
        case 'resolved': return 'bg-gradient-to-r from-green-500 to-emerald-600';
        case 'vi_verified': return 'bg-gradient-to-r from-purple-500 to-violet-600';
        case 'pdo_assigned': return 'bg-gradient-to-r from-blue-500 to-cyan-600';
        case 'in_progress': return 'bg-gradient-to-r from-amber-500 to-orange-600';
        case 'submitted': return 'bg-gradient-to-r from-gray-500 to-gray-600';
        case 'closed': return 'bg-gradient-to-r from-green-600 to-emerald-700';
        default: return 'bg-gradient-to-r from-gray-500 to-gray-600';
    }
}

function getStatusIcon(status: string) {
    switch (status?.toLowerCase()) {
        case 'resolved': return FiCheckCircle;
        case 'vi_verified': return FiShield;
        case 'pdo_assigned': return FiUsers;
        case 'in_progress': return FiActivity;
        case 'submitted': return FiInbox;
        case 'closed': return FiCheckSquare;
        default: return FiAlertCircle;
    }
}

function getPriorityColor(priority: string) {
    switch (priority?.toLowerCase()) {
        case 'high': return 'bg-red-100 text-red-800 border-red-200';
        case 'medium': return 'bg-amber-100 text-amber-800 border-amber-200';
        case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'urgent': return 'bg-gradient-to-r from-red-600 to-pink-600 text-white';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
}

function formatStatus(status: string) {
    switch (status?.toLowerCase()) {
        case 'vi_verified': return 'Verified';
        case 'pdo_assigned': return 'PDO Assigned';
        case 'in_progress': return 'In Progress';
        case 'submitted': return 'Submitted';
        default: return status?.charAt(0).toUpperCase() + status?.slice(1) || 'Unknown';
    }
}

// Function to get village name from villageId
async function getVillageName(villageId: string): Promise<string> {
    try {
        if (!villageId) return "";
        
        const villageDoc = await getDoc(doc(db, "villages", villageId));
        if (villageDoc.exists()) {
            const villageData = villageDoc.data() as Village;
            return villageData.name || "";
        }
        
        // Try alternative: Check if it's actually a panchayat ID
        const panchayatDoc = await getDoc(doc(db, "panchayats", villageId));
        if (panchayatDoc.exists()) {
            const panchayatData = panchayatDoc.data() as any;
            return panchayatData.villageName || panchayatData.name || "";
        }
        
        return "";
    } catch (error) {
        console.error("Error fetching village name:", error);
        return "";
    }
}

// Function to get all villages in a district or taluk (for filtering)
async function getVillagesByDistrict(districtId: string): Promise<Village[]> {
    try {
        if (!districtId) return [];
        
        const q = query(
            collection(db, "villages"),
            where("districtId", "==", districtId),
            where("isActive", "==", true),
            orderBy("name", "asc")
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as Village));
    } catch (error) {
        console.error("Error fetching villages by district:", error);
        return [];
    }
}

async function getVillagesByTaluk(talukId: string): Promise<Village[]> {
    try {
        if (!talukId) return [];
        
        const q = query(
            collection(db, "villages"),
            where("talukId", "==", talukId),
            where("isActive", "==", true),
            orderBy("name", "asc")
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as Village));
    } catch (error) {
        console.error("Error fetching villages by taluk:", error);
        return [];
    }
}

export default function ViiIssuesListPage() {
    const router = useRouter();
    const params = useParams() as { locale?: string };
    const searchParams = useSearchParams();

    const locale = ((params?.locale as Locale) || "en") as Locale;

    const [showFilters, setShowFilters] = useState(false);
    const [stats, setStats] = useState({
        total: 0,
        submitted: 0,
        vi_verified: 0,
        pdo_assigned: 0,
    });
    const [allVillages, setAllVillages] = useState<Village[]>([]);
    const [loadingVillages, setLoadingVillages] = useState(false);

    const t = useMemo(() => {
        const L: Record<Locale, any> = {
            en: {
                title: "Verify Issues",
                subtitle: "Review and verify submitted issues in your village",
                loading: "Loading…",
                loadMore: "Load more",
                open: "Open",
                filters: "Filters",
                status: "Status",
                category: "Category",
                all: "All",
                categoryPh: "road / drainage / electricity",
                empty: "No issues found.",
                back: "Back",
                retry: "Retry",
                errors: {
                    missingIndex:
                        "Index missing for panchayatId + createdAt. Add the composite index and retry.",
                    permissionDenied:
                        "Missing or insufficient permissions. (Ensure your authority is verified and panchayatId is correct.)",
                    generic: "Failed to load issues.",
                    notAllowed: "Not allowed. Please login as a verified Village In-charge.",
                    missingPid: "Your panchayatId is missing in authorities/{uid}.",
                },
                chips: {
                    submitted: "Submitted",
                    vi_verified: "Verified",
                    pdo_assigned: "PDO Assigned",
                },
                // New translations
                refresh: "Refresh",
                search: "Search issues...",
                priority: "Priority",
                location: "Location",
                date: "Date",
                actions: "Actions",
                viewDetails: "View Details",
                assignee: "Assigned To",
                description: "Description",
                noIssuesFound: "No issues found",
                tryDifferentFilter: "Try a different filter",
                village: "Village",
                stats: {
                    total: "Total Issues",
                    submitted: "Submitted",
                    vi_verified: "Verified",
                    pdo_assigned: "PDO Assigned",
                },
                quickActions: "Quick Actions",
                verifyNow: "Verify Now",
                assignToPDO: "Assign to PDO",
                markInProgress: "Mark In Progress",
                markResolved: "Mark Resolved",
                reporter: "Reporter",
                phone: "Phone",
                newIssues: "New Issues",
                verifiedIssues: "Verified Issues",
                assignedIssues: "Assigned Issues",
                selectVillage: "Select Village",
                allVillages: "All Villages",
                loadingVillages: "Loading villages...",
                // Navigation translations from dashboard
                dashboard: "Dashboard",
                verify: "Verifications",
                issues: "Issues",
                profile: "Profile",
                settings: "Settings",
                logout: "Logout",
                welcome: "Welcome back,",
                totalActivities: "Total Activities",
                pending: "Pending",
                resolved: "Resolved",
                overdue: "Overdue",
            },
            kn: {
                title: "ಸಮಸ್ಯೆಗಳನ್ನು ಪರಿಶೀಲಿಸಿ",
                subtitle: "ನಿಮ್ಮ ಗ್ರಾಮದಲ್ಲಿ ಸಲ್ಲಿಸಿದ ಸಮಸ್ಯೆಗಳನ್ನು ಪರಿಶೀಲಿಸಿ ಮತ್ತು ಪರಿಶೀಲಿಸಿ",
                loading: "ಲೋಡ್ ಆಗುತ್ತಿದೆ…",
                loadMore: "ಇನ್ನಷ್ಟು ಲೋಡ್ ಮಾಡಿ",
                open: "ತೆರೆ",
                filters: "ಫಿಲ್ಟರ್‌ಗಳು",
                status: "ಸ್ಥಿತಿ",
                category: "ವರ್ಗ",
                all: "ಎಲ್ಲಾ",
                categoryPh: "ರಸ್ತೆ / ಚರಂಡಿ / ವಿದ್ಯುತ್",
                empty: "ಯಾವುದೇ ಸಮಸ್ಯೆಗಳು ಸಿಗಲಿಲ್ಲ.",
                back: "ಹಿಂದೆ",
                retry: "ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ",
                errors: {
                    missingIndex:
                        "panchayatId + createdAt ಗೆ index ಬೇಕಾಗಿದೆ. Firebase console ನಲ್ಲಿ index ಸೇರಿಸಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
                    permissionDenied:
                        "ಅನುಮತಿ ಸಾಲದು. (Authority verified ಆಗಿದೆಯೇ ಮತ್ತು panchayatId ಸರಿಯಿದೆಯೇ ಪರಿಶೀಲಿಸಿ.)",
                    generic: "ಸಮಸ್ಯೆಗಳು ಲೋಡ್ ಆಗಲಿಲ್ಲ.",
                    notAllowed:
                        "ಅನುಮತಿ ಇಲ್ಲ. ಪರಿಶೀಲಿತ Village In-charge ಮೂಲಕ ಲಾಗಿನ್ ಆಗಿ.",
                    missingPid: "authorities/{uid} ನಲ್ಲಿ panchayatId ಇಲ್ಲ.",
                },
                chips: {
                    submitted: "ಸಲ್ಲಿಸಲಾಗಿದೆ",
                    vi_verified: "ಪರಿಶೀಲಿಸಲಾಗಿದೆ",
                    pdo_assigned: "PDO ನಿಯೋಜನೆ",
                },
                // New translations
                refresh: "ರಿಫ್ರೆಶ್",
                search: "ಸಮಸ್ಯೆಗಳನ್ನು ಹುಡುಕಿ...",
                priority: "ಗಮನಾರ್ಹತೆ",
                location: "ಸ್ಥಳ",
                date: "ದಿನಾಂಕ",
                actions: "ಕ್ರಿಯೆಗಳು",
                viewDetails: "ವಿವರಗಳನ್ನು ವೀಕ್ಷಿಸಿ",
                assignee: "ನಿಯೋಜಿಸಲಾಗಿದೆ",
                description: "ವಿವರಣೆ",
                noIssuesFound: "ಯಾವುದೇ ಸಮಸ್ಯೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ",
                tryDifferentFilter: "ವಿಭಿನ್ನ ಫಿಲ್ಟರ್‌ನ ಪ್ರಯತ್ನಿಸಿ",
                village: "ಗ್ರಾಮ",
                stats: {
                    total: "ಒಟ್ಟು ಸಮಸ್ಯೆಗಳು",
                    submitted: "ಸಲ್ಲಿಸಲಾಗಿದೆ",
                    vi_verified: "ಪರಿಶೀಲಿಸಲಾಗಿದೆ",
                    pdo_assigned: "PDO ನಿಯೋಜನೆ",
                },
                quickActions: "ತ್ವರಿತ ಕ್ರಿಯೆಗಳು",
                verifyNow: "ಈಗ ಪರಿಶೀಲಿಸಿ",
                assignToPDO: "PDO ಗೆ ನಿಯೋಜಿಸಿ",
                markInProgress: "ಪ್ರಗತಿಯಲ್ಲಿದೆ ಎಂದು ಗುರುತಿಸಿ",
                markResolved: "ಪರಿಹರಿಸಲಾಗಿದೆ ಎಂದು ಗುರುತಿಸಿ",
                reporter: "ವರದಿದಾರ",
                phone: "ಫೋನ್",
                newIssues: "ಹೊಸ ಸಮಸ್ಯೆಗಳು",
                verifiedIssues: "ಪರಿಶೀಲಿಸಿದ ಸಮಸ್ಯೆಗಳು",
                assignedIssues: "ನಿಯೋಜಿತ ಸಮಸ್ಯೆಗಳು",
                selectVillage: "ಗ್ರಾಮ ಆಯ್ಕೆಮಾಡಿ",
                allVillages: "ಎಲ್ಲಾ ಗ್ರಾಮಗಳು",
                loadingVillages: "ಗ್ರಾಮಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...",
                // Navigation translations from dashboard
                dashboard: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
                verify: "ಪರಿಶೀಲನೆಗಳು",
                issues: "ಸಮಸ್ಯೆಗಳು",
                profile: "ಪ್ರೊಫೈಲ್",
                settings: "ಸೆಟ್ಟಿಂಗ್ಸ್",
                logout: "ಲಾಗ್‌ಔಟ್",
                welcome: "ಮರಳಿ ಸ್ವಾಗತ,",
                totalActivities: "ಒಟ್ಟು ಚಟುವಟಿಕೆಗಳು",
                pending: "ಬಾಕಿ ಇವೆ",
                resolved: "ಪರಿಹಾರಗೊಂಡ",
                overdue: "ಕಾಲಾವಧಿ ಮೀರಿದ",
            },
            hi: {
                title: "मुद्दे सत्यापित करें",
                subtitle: "अपने गाँव में सबमिट किए गए मुद्दों की समीक्षा और सत्यापन करें",
                loading: "लोड हो रहा है…",
                loadMore: "और लोड करें",
                open: "ओपन",
                filters: "फ़िल्टर",
                status: "स्टेटस",
                category: "कैटेगरी",
                all: "सभी",
                categoryPh: "road / drainage / electricity",
                empty: "कोई मुद्दे नहीं मिले।",
                back: "वापस",
                retry: "फिर से कोशिश करें",
                errors: {
                    missingIndex:
                        "panchayatId + createdAt के लिए index चाहिए। Firebase console में index जोड़ें और retry करें।",
                    permissionDenied:
                        "Missing/insufficient permissions. (Authority verified और panchayatId check करें.)",
                    generic: "Issues load नहीं हुए।",
                    notAllowed:
                        "Not allowed. Verified Village In-charge से login करें।",
                    missingPid: "authorities/{uid} में panchayatId missing है।",
                },
                chips: {
                    submitted: "Submitted",
                    vi_verified: "Verified",
                    pdo_assigned: "PDO Assigned",
                },
                // New translations
                refresh: "रिफ्रेश",
                search: "मुद्दे खोजें...",
                priority: "प्राथमिकता",
                location: "स्थान",
                date: "तारीख",
                actions: "कार्रवाई",
                viewDetails: "विवरण देखें",
                assignee: "सौंपा गया",
                description: "विवरण",
                noIssuesFound: "कोई मुद्दा नहीं मिला",
                tryDifferentFilter: "एक अलग फ़िल्टर आज़माएं",
                village: "गाँव",
                stats: {
                    total: "कुल मुद्दे",
                    submitted: "Submitted",
                    vi_verified: "Verified",
                    pdo_assigned: "PDO Assigned",
                },
                quickActions: "त्वरित कार्रवाई",
                verifyNow: "अभी सत्यापित करें",
                assignToPDO: "PDO को सौंपें",
                markInProgress: "प्रगति पर मार्क करें",
                markResolved: "हल किया गया मार्क करें",
                reporter: "रिपोर्टर",
                phone: "फ़ोन",
                newIssues: "नए मुद्दे",
                verifiedIssues: "सत्यापित मुद्दे",
                assignedIssues: "सौंपे गए मुद्दे",
                selectVillage: "गाँव चुनें",
                allVillages: "सभी गाँव",
                loadingVillages: "गाँव लोड हो रहे हैं...",
                // Navigation translations from dashboard
                dashboard: "डैशबोर्ड",
                verify: "सत्यापन",
                issues: "समस्याएँ",
                profile: "प्रोफ़ाइल",
                settings: "सेटिंग्स",
                logout: "लॉगआउट",
                welcome: "वापसी पर स्वागत है,",
                totalActivities: "कुल गतिविधियाँ",
                pending: "लंबित",
                resolved: "हल हो चुकी",
                overdue: "समय सीमा पार",
            },
        };
        return L[locale] || L.en;
    }, [locale]);

    const [authReady, setAuthReady] = useState(false);
    const [loading, setLoading] = useState(true);
    const [moreLoading, setMoreLoading] = useState(false);
    const [err, setErr] = useState("");
    const [refreshing, setRefreshing] = useState(false);
    const [user, setUser] = useState<any>(null);

    const [panchayatId, setPanchayatId] = useState<string>("");
    const [villageName, setVillageName] = useState<string>("");
    const [villageId, setVillageId] = useState<string>("");
    const [districtId, setDistrictId] = useState<string>("");
    const [talukId, setTalukId] = useState<string>("");
    const [rawItems, setRawItems] = useState<Issue[]>([]);
    const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
    const [hasMore, setHasMore] = useState(false);

    // UI filters (client-side to avoid extra composite indexes)
    const initialStatus = String(searchParams?.get("status") || "all");
    const [statusFilter, setStatusFilter] = useState<string>(
        STATUSES.includes(initialStatus as any) ? initialStatus : "all"
    );
    const [categoryFilter, setCategoryFilter] = useState<string>("");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedVillageFilter, setSelectedVillageFilter] = useState<string>("all");

    const didInit = useRef(false);

    const buildBaseQuery = (pid: string, after?: DocumentSnapshot | null) => {
        const parts: any[] = [
            where("panchayatId", "==", pid),
            orderBy("createdAt", "desc"),
            limit(PAGE_SIZE),
        ];
        if (after) parts.splice(2, 0, startAfter(after));
        return query(collection(db, "issues"), ...parts);
    };

    const mapFirebaseError = (e: any) => {
        if (e instanceof FirebaseError) {
            if (e.code === "failed-precondition") return t.errors.missingIndex;
            if (e.code === "permission-denied") return t.errors.permissionDenied;
            return e.message;
        }
        return e?.message || t.errors.generic;
    };

    const ensureViAuthority = async (): Promise<{panchayatId: string, villageId: string, villageName: string, districtId: string, talukId: string} | null> => {
        const u = auth.currentUser;
        if (!u) {
            router.replace(`/${locale}/authority/login`);
            return null;
        }

        setUser(u);

        const aSnap = await getDoc(doc(db, "authorities", u.uid));
        if (!aSnap.exists()) {
            router.replace(`/${locale}/authority/login`);
            return null;
        }

        const a = aSnap.data() as any;
        const isVerified = a?.verified === true || a?.verification?.status === "verified";
        if (a?.role !== "village_incharge" || !isVerified) {
            setErr(t.errors.notAllowed);
            router.replace(`/${locale}/authority/status`);
            return null;
        }

        const pid = String(a?.panchayatId || "");
        const vid = String(a?.villageId || "");
        const did = String(a?.districtId || "");
        const tid = String(a?.talukId || "");
        
        if (!pid) {
            setErr(t.errors.missingPid);
            return null;
        }
        
        // Get village name from database
        let vName = "Your Village";
        if (vid) {
            try {
                const villageDoc = await getDoc(doc(db, "villages", vid));
                if (villageDoc.exists()) {
                    const villageData = villageDoc.data() as Village;
                    vName = villageData.name || a?.village || "Your Village";
                }
            } catch (error) {
                console.error("Error fetching village:", error);
                vName = a?.village || a?.panchayat || "Your Village";
            }
        } else {
            vName = a?.village || a?.panchayat || "Your Village";
        }
        
        return { 
            panchayatId: pid, 
            villageId: vid, 
            villageName: vName,
            districtId: did,
            talukId: tid
        };
    };

    // Function to load all villages in the district/taluk for filtering
    const loadAllVillages = async (districtId: string, talukId: string) => {
        if (!districtId && !talukId) return;
        
        setLoadingVillages(true);
        try {
            let villages: Village[] = [];
            
            if (talukId) {
                villages = await getVillagesByTaluk(talukId);
            } else if (districtId) {
                villages = await getVillagesByDistrict(districtId);
            }
            
            setAllVillages(villages);
        } catch (error) {
            console.error("Error loading villages:", error);
        } finally {
            setLoadingVillages(false);
        }
    };

    const calculateStats = (items: Issue[]) => {
        const stats = {
            total: items.length,
            submitted: items.filter(i => i.status?.toLowerCase() === 'submitted').length,
            vi_verified: items.filter(i => i.status?.toLowerCase() === 'vi_verified').length,
            pdo_assigned: items.filter(i => i.status?.toLowerCase() === 'pdo_assigned').length,
        };
        setStats(stats);
    };

    // Function to enhance issues with village names
    const enhanceIssuesWithVillageNames = async (issues: Issue[]): Promise<Issue[]> => {
        const enhancedIssues = await Promise.all(
            issues.map(async (issue) => {
                if (issue.villageName) return issue;
                
                // Try to get village name from villageId if present in issue
                if (issue.panchayatId) {
                    try {
                        // First try to get village from panchayat document
                        const panchayatDoc = await getDoc(doc(db, "panchayats", issue.panchayatId));
                        if (panchayatDoc.exists()) {
                            const panchayatData = panchayatDoc.data() as any;
                            return {
                                ...issue,
                                villageName: panchayatData.villageName || panchayatData.name || "Unknown Village"
                            };
                        }
                        
                        // Fallback: Check if panchayatId is actually a village ID
                        const villageDoc = await getDoc(doc(db, "villages", issue.panchayatId));
                        if (villageDoc.exists()) {
                            const villageData = villageDoc.data() as Village;
                            return {
                                ...issue,
                                villageName: villageData.name || "Unknown Village"
                            };
                        }
                    } catch (error) {
                        console.error("Error fetching village name for issue:", error);
                    }
                }
                
                return issue;
            })
        );
        
        return enhancedIssues;
    };

    const firstLoad = async () => {
        setErr("");
        setLoading(true);
        setRawItems([]);
        setLastDoc(null);
        setHasMore(false);

        try {
            const authorityInfo = await ensureViAuthority();
            if (!authorityInfo) return;

            setPanchayatId(authorityInfo.panchayatId);
            setVillageId(authorityInfo.villageId);
            setVillageName(authorityInfo.villageName);
            setDistrictId(authorityInfo.districtId);
            setTalukId(authorityInfo.talukId);

            // Load all villages for filtering
            await loadAllVillages(authorityInfo.districtId, authorityInfo.talukId);

            const q = buildBaseQuery(authorityInfo.panchayatId, null);
            const snap = await getDocs(q);

            let list: Issue[] = snap.docs.map((d) => ({ 
                id: d.id, 
                ...(d.data() as any) 
            }));
            
            // Enhance issues with village names
            list = await enhanceIssuesWithVillageNames(list);
            
            setRawItems(list);
            calculateStats(list);

            const last = snap.docs[snap.docs.length - 1] || null;
            setLastDoc(last);
            setHasMore(snap.docs.length === PAGE_SIZE);
        } catch (e: any) {
            setErr(mapFirebaseError(e));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const loadMore = async () => {
        if (!panchayatId || !lastDoc || !hasMore || moreLoading) return;

        setMoreLoading(true);
        setErr("");

        try {
            const q = buildBaseQuery(panchayatId, lastDoc);
            const snap = await getDocs(q);

            let list: Issue[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
            
            // Enhance issues with village names
            list = await enhanceIssuesWithVillageNames(list);
            
            const newItems = [...rawItems, ...list];
            setRawItems(newItems);
            calculateStats(newItems);

            const last = snap.docs[snap.docs.length - 1] || null;
            setLastDoc(last);
            setHasMore(snap.docs.length === PAGE_SIZE);
        } catch (e: any) {
            setErr(mapFirebaseError(e));
        } finally {
            setMoreLoading(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        firstLoad();
    };

    const handleLogout = async () => {
        try {
            await auth.signOut();
            router.push(`/${locale}/role-select`);
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, () => setAuthReady(true));
        return () => unsub();
    }, []);

    useEffect(() => {
        if (!authReady) return;
        if (didInit.current) return;
        didInit.current = true;
        firstLoad();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authReady]);

    // Client-side filtered list (no extra Firestore indexes)
    const items = useMemo(() => {
        let list = rawItems;

        if (statusFilter !== "all") {
            list = list.filter((x) => String(x.status || "submitted") === statusFilter);
        }

        const cat = categoryFilter.trim().toLowerCase();
        if (cat) {
            list = list.filter((x) => String(x.category || "").toLowerCase() === cat);
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            list = list.filter(issue =>
                issue.title?.toLowerCase().includes(query) ||
                issue.description?.toLowerCase().includes(query) ||
                issue.category?.toLowerCase().includes(query) ||
                issue.location?.toLowerCase().includes(query) ||
                issue.villageName?.toLowerCase().includes(query) ||
                issue.reporterName?.toLowerCase().includes(query)
            );
        }

        // Filter by village
        if (selectedVillageFilter !== "all") {
            list = list.filter(issue => 
                issue.villageName?.toLowerCase() === selectedVillageFilter.toLowerCase() ||
                issue.panchayatId === selectedVillageFilter
            );
        }

        return list;
    }, [rawItems, statusFilter, categoryFilter, searchQuery, selectedVillageFilter]);

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
                
                <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4">
                    {/* Header Skeleton */}
                    <div className="mb-8">
                        <div className="h-8 w-48 bg-gradient-to-r from-blue-200 to-cyan-200 rounded-lg mb-2 pulse"></div>
                        <div className="h-4 w-64 bg-gradient-to-r from-blue-100 to-cyan-100 rounded pulse"></div>
                    </div>

                    {/* Stats Skeleton */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-blue-50 p-4 shadow-lg">
                                <div className="absolute inset-0 shimmer"></div>
                                <div className="h-4 w-16 bg-gradient-to-r from-blue-200 to-cyan-200 rounded mb-3"></div>
                                <div className="h-8 w-12 bg-gradient-to-r from-blue-300 to-cyan-300 rounded"></div>
                            </div>
                        ))}
                    </div>

                    {/* Search Skeleton */}
                    <div className="h-12 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-2xl mb-6 pulse"></div>

                    {/* Issues Skeleton */}
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-blue-50 p-5 shadow-lg">
                                <div className="absolute inset-0 shimmer"></div>
                                <div className="flex items-start gap-3">
                                    <div className="h-12 w-12 bg-gradient-to-r from-blue-200 to-cyan-200 rounded-xl"></div>
                                    <div className="flex-1">
                                        <div className="h-5 w-48 bg-gradient-to-r from-blue-200 to-cyan-200 rounded mb-3"></div>
                                        <div className="h-3 w-64 bg-gradient-to-r from-blue-100 to-cyan-100 rounded mb-2"></div>
                                        <div className="flex gap-2">
                                            <div className="h-6 w-20 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-full"></div>
                                            <div className="h-6 w-24 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-full"></div>
                                        </div>
                                    </div>
                                    <div className="h-8 w-8 bg-gradient-to-r from-blue-200 to-cyan-200 rounded-full"></div>
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
                @keyframes gradientFlow {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                .animate-fadeIn { animation: fadeIn 0.6s ease-out forwards; }
                .animate-slideLeft { animation: slideInLeft 0.5s ease-out forwards; }
                .animate-slideRight { animation: slideInRight 0.5s ease-out forwards; }
                .animate-scaleIn { animation: scaleIn 0.4s ease-out forwards; }
                .animate-pulse { animation: pulse 2s ease-in-out infinite; }
                .animate-count { animation: countUp 0.5s ease-out forwards; }
                .animate-gradientFlow {
                    background-size: 200% 200%;
                    animation: gradientFlow 3s ease infinite;
                }
                .delay-100 { animation-delay: 0.1s; }
                .delay-200 { animation-delay: 0.2s; }
                .delay-300 { animation-delay: 0.3s; }
                .delay-400 { animation-delay: 0.4s; }
                .delay-500 { animation-delay: 0.5s; }
                
                .issue-card {
                    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                    background: linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(239, 246, 255, 0.8) 100%);
                }
                .issue-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 12px 24px rgba(59, 130, 246, 0.15);
                }
                .stat-card {
                    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                .stat-card:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 8px 16px rgba(59, 130, 246, 0.1);
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
                .status-badge {
                    transition: all 0.3s ease;
                }
                .status-badge:hover {
                    transform: scale(1.05);
                }
                .action-card {
                    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                    background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(239, 246, 255, 0.5) 100%);
                }
                .action-card:hover {
                    transform: translateY(-3px) scale(1.01);
                    background: linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(239, 246, 255, 0.8) 100%);
                    box-shadow: 0 8px 20px rgba(59, 130, 246, 0.2);
                }
            `}</style>

            <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-white p-4 pb-24">
                {/* Header - Same as Dashboard */}
                <div className="mb-8 animate-fadeIn">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-blue-900 tracking-tight">
                                {t.title}
                            </h1>
                            <p className="text-blue-700/80 mt-2 text-sm font-semibold flex items-center gap-2">
                                <FiShield className="w-4 h-4" />
                                {t.welcome} {user?.displayName || user?.email?.split('@')[0] || 'Village Incharge'}
                            </p>
                        </div>
                        
                        {/* Refresh Button */}
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="p-3 rounded-xl border-2 border-blue-100 bg-white hover:bg-blue-50 active:scale-95 transition-all duration-200"
                        >
                            <FiRefreshCw className={`w-5 h-5 text-blue-700 ${refreshing ? 'refresh-spin' : ''}`} />
                        </button>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-blue-600/80 bg-blue-50/50 rounded-xl p-3">
                        <FiBarChart2 className="w-4 h-4" />
                        <span className="font-semibold">{t.stats.total}</span>
                    </div>
                </div>

                {/* Statistics Cards - Using Blue Theme */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 animate-fadeIn delay-100">
                    <div className="stat-card bg-gradient-to-br from-white to-blue-50 border-2 border-blue-100 rounded-2xl p-4 shadow-lg">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-blue-800/80">{t.stats.total}</span>
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <FiBarChart2 className="w-4 h-4 text-blue-600" />
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-blue-900 animate-count">{stats.total}</div>
                        <div className="text-xs text-blue-700/60 mt-1">{t.all}</div>
                        <div className="h-1 w-full bg-gradient-to-r from-blue-200 to-transparent rounded-full mt-2"></div>
                    </div>

                    <div className="stat-card bg-gradient-to-br from-white to-gray-50 border-2 border-gray-100 rounded-2xl p-4 shadow-lg">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-800/80">{t.newIssues}</span>
                            <div className="p-2 bg-gray-100 rounded-lg">
                                <FiInbox className="w-4 h-4 text-gray-600" />
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-gray-900 animate-count">{stats.submitted}</div>
                        <div className="text-xs text-gray-700/60 mt-1">{t.chips.submitted}</div>
                        <div className="h-1 w-full bg-gradient-to-r from-gray-200 to-transparent rounded-full mt-2"></div>
                    </div>

                    <div className="stat-card bg-gradient-to-br from-white to-green-50 border-2 border-green-100 rounded-2xl p-4 shadow-lg">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-green-800/80">{t.verifiedIssues}</span>
                            <div className="p-2 bg-green-100 rounded-lg">
                                <FiShield className="w-4 h-4 text-green-600" />
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-green-900 animate-count">{stats.vi_verified}</div>
                        <div className="text-xs text-green-700/60 mt-1">{t.chips.vi_verified}</div>
                        <div className="h-1 w-full bg-gradient-to-r from-green-200 to-transparent rounded-full mt-2"></div>
                    </div>

                    <div className="stat-card bg-gradient-to-br from-white to-cyan-50 border-2 border-cyan-100 rounded-2xl p-4 shadow-lg">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-cyan-800/80">{t.assignedIssues}</span>
                            <div className="p-2 bg-cyan-100 rounded-lg">
                                <FiUsers className="w-4 h-4 text-cyan-600" />
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-cyan-900 animate-count">{stats.pdo_assigned}</div>
                        <div className="text-xs text-cyan-700/60 mt-1">{t.chips.pdo_assigned}</div>
                        <div className="h-1 w-full bg-gradient-to-r from-cyan-200 to-transparent rounded-full mt-2"></div>
                    </div>
                </div>

                {/* Search and Filter Row */}
                <div className="mb-6 animate-fadeIn delay-200">
                    <div className="flex flex-col sm:flex-row gap-3 mb-4">
                        <div className="flex-1 relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FiSearch className="h-5 w-5 text-blue-700/70" />
                            </div>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={t.search}
                                className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-blue-100 bg-white text-blue-900 placeholder-blue-700/50 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent"
                            />
                        </div>
                        
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`px-4 py-3 rounded-2xl border-2 ${showFilters ? 'border-blue-500 bg-blue-50' : 'border-blue-100 bg-white'} hover:bg-blue-50 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2`}
                        >
                            <FiFilter className="w-5 h-5 text-blue-700" />
                            <span className="text-sm font-semibold text-blue-800">{t.filters}</span>
                        </button>
                    </div>
                    
                    {/* Quick Filter Buttons */}
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        <button
                            onClick={() => setStatusFilter("all")}
                            className={`filter-btn px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap ${statusFilter === "all" ? 'active bg-gradient-to-r from-blue-500 to-cyan-600 text-white' : 'bg-white border-2 border-blue-100 text-blue-800'}`}
                        >
                            {t.all}
                        </button>
                        <button
                            onClick={() => setStatusFilter("submitted")}
                            className={`filter-btn px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap ${statusFilter === "submitted" ? 'active bg-gradient-to-r from-gray-500 to-gray-600 text-white' : 'bg-white border-2 border-gray-100 text-gray-800'}`}
                        >
                            {t.chips.submitted} ({stats.submitted})
                        </button>
                        <button
                            onClick={() => setStatusFilter("vi_verified")}
                            className={`filter-btn px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap ${statusFilter === "vi_verified" ? 'active bg-gradient-to-r from-green-500 to-emerald-600 text-white' : 'bg-white border-2 border-green-100 text-green-800'}`}
                        >
                            {t.chips.vi_verified} ({stats.vi_verified})
                        </button>
                        <button
                            onClick={() => setStatusFilter("pdo_assigned")}
                            className={`filter-btn px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap ${statusFilter === "pdo_assigned" ? 'active bg-gradient-to-r from-cyan-500 to-blue-600 text-white' : 'bg-white border-2 border-cyan-100 text-cyan-800'}`}
                        >
                            {t.chips.pdo_assigned} ({stats.pdo_assigned})
                        </button>
                    </div>
                </div>

                {/* Filters Panel */}
                {showFilters && (
                    <div className="mb-6 animate-scaleIn">
                        <div className="bg-white border-2 border-blue-100 rounded-2xl p-5 shadow-lg">
                            <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                                <FiFilter className="w-5 h-5" />
                                {t.filters}
                            </h3>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-bold text-blue-900 mb-2 block">{t.status}</label>
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="w-full rounded-xl border-2 border-blue-100 px-4 py-3 bg-white text-blue-900"
                                    >
                                        <option value="all">{t.all}</option>
                                        {STATUSES.map((s) => (
                                            <option key={s} value={s}>
                                                {t.chips[s]}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-sm font-bold text-blue-900 mb-2 block">{t.category}</label>
                                    <input
                                        value={categoryFilter}
                                        onChange={(e) => setCategoryFilter(e.target.value)}
                                        placeholder={t.categoryPh}
                                        className="w-full rounded-xl border-2 border-blue-100 px-4 py-3"
                                    />
                                </div>

                                {/* Village Filter (Only if there are multiple villages) */}
                                {allVillages.length > 0 && (
                                    <div className="sm:col-span-2">
                                        <label className="text-sm font-bold text-blue-900 mb-2 block">{t.selectVillage}</label>
                                        <div className="relative">
                                            {loadingVillages ? (
                                                <div className="flex items-center justify-center p-4 border-2 border-blue-100 rounded-xl bg-blue-50">
                                                    <FiLoader className="w-4 h-4 text-blue-600 animate-spin mr-2" />
                                                    <span className="text-sm text-blue-600">{t.loadingVillages}</span>
                                                </div>
                                            ) : (
                                                <select
                                                    value={selectedVillageFilter}
                                                    onChange={(e) => setSelectedVillageFilter(e.target.value)}
                                                    className="w-full rounded-xl border-2 border-blue-100 px-4 py-3 bg-white text-blue-900"
                                                >
                                                    <option value="all">{t.allVillages}</option>
                                                    {allVillages.map((village) => (
                                                        <option key={village.id} value={village.name}>
                                                            {village.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Error Message */}
                {err && (
                    <div className="mb-6 animate-slideLeft">
                        <div className="bg-gradient-to-r from-red-500 to-orange-600 text-white rounded-2xl p-4 shadow-lg flex items-center gap-3">
                            <FiAlertCircle className="w-6 h-6 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="font-bold">Error</p>
                                <p className="text-sm opacity-90">{err}</p>
                            </div>
                            <button
                                onClick={firstLoad}
                                className="px-4 py-2 bg-white text-red-600 rounded-xl font-bold"
                            >
                                {t.retry}
                            </button>
                        </div>
                    </div>
                )}

                {/* Issues List */}
                <div className="space-y-4 mb-8">
                    {items.length === 0 ? (
                        <div className="text-center py-12 animate-fadeIn">
                            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full flex items-center justify-center mb-6">
                                <FiInbox className="w-12 h-12 text-blue-600/70" />
                            </div>
                            <h3 className="text-xl font-bold text-blue-900 mb-2">
                                {searchQuery || statusFilter !== "all" || categoryFilter || selectedVillageFilter !== "all" ? t.noIssuesFound : t.empty}
                            </h3>
                            <p className="text-blue-700/70 mb-6">
                                {searchQuery || statusFilter !== "all" || categoryFilter || selectedVillageFilter !== "all" ? t.tryDifferentFilter : `No issues have been submitted to ${villageName || 'your village'} yet.`}
                            </p>
                            <button
                                onClick={() => {
                                    setStatusFilter("all");
                                    setCategoryFilter("");
                                    setSearchQuery("");
                                    setSelectedVillageFilter("all");
                                }}
                                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-2xl font-semibold"
                            >
                                View All Issues
                            </button>
                        </div>
                    ) : (
                        items.map((issue, index) => {
                            const StatusIcon = getStatusIcon(issue.status || 'submitted');
                            return (
                                <div
                                    key={issue.id}
                                    className="issue-card border-2 border-blue-100 rounded-2xl p-5 shadow-lg animate-fadeIn cursor-pointer"
                                    style={{ animationDelay: `${index * 0.1}s` }}
                                    onClick={() => router.push(`/${locale}/authority/vi/issues/${issue.id}`)}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`p-3 rounded-xl ${getStatusColor(issue.status || 'submitted')} text-white`}>
                                            <StatusIcon className="w-6 h-6" />
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-3 mb-3">
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-blue-900 text-lg truncate">
                                                        {issue.title || "Untitled Issue"}
                                                    </h3>
                                                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                                                        {issue.villageName && (
                                                            <div className="flex items-center gap-1 text-sm text-blue-700/70 bg-blue-50 px-2 py-1 rounded-lg">
                                                                <FiMapPin className="w-3 h-3" />
                                                                {issue.villageName}
                                                            </div>
                                                        )}
                                                        {issue.reporterName && (
                                                            <div className="flex items-center gap-1 text-sm text-cyan-700/70 bg-cyan-50 px-2 py-1 rounded-lg">
                                                                <FiUser className="w-3 h-3" />
                                                                {issue.reporterName}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="p-2 rounded-lg hover:bg-blue-50 text-blue-700/70 hover:text-blue-700"
                                                >
                                                    <FiChevronRight className="w-5 h-5" />
                                                </button>
                                            </div>
                                            
                                            <p className="text-blue-700/80 text-sm mb-4 line-clamp-2">
                                                {issue.description || "No description provided"}
                                            </p>
                                            
                                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                                <div className={`status-badge px-3 py-1.5 rounded-full text-xs font-bold text-white ${getStatusColor(issue.status || 'submitted')}`}>
                                                    {formatStatus(issue.status || 'submitted')}
                                                </div>
                                                
                                                {issue.priority && (
                                                    <div className={`px-3 py-1.5 rounded-full text-xs font-bold ${getPriorityColor(issue.priority)}`}>
                                                        {issue.priority}
                                                    </div>
                                                )}
                                                
                                                {issue.category && (
                                                    <div className="px-3 py-1.5 rounded-full text-xs font-semibold bg-cyan-100 text-cyan-800 flex items-center gap-1">
                                                        <FiFolder className="w-3 h-3" />
                                                        {issue.category}
                                                    </div>
                                                )}
                                                
                                                <div className="px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 flex items-center gap-1">
                                                    <FiCalendar className="w-3 h-3" />
                                                    {fmtDate(issue.createdAt)}
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-4 pt-3 border-t border-blue-100">
                                                {issue.commentsCount !== undefined && (
                                                    <div className="flex items-center gap-1 text-blue-700/70">
                                                        <FiMessageSquare className="w-4 h-4" />
                                                        <span className="text-sm font-medium">{issue.commentsCount}</span>
                                                    </div>
                                                )}
                                                
                                                {issue.upvotes !== undefined && (
                                                    <div className="flex items-center gap-1 text-blue-700/70">
                                                        <FiThumbsUp className="w-4 h-4" />
                                                        <span className="text-sm font-medium">{issue.upvotes}</span>
                                                    </div>
                                                )}
                                                
                                                {issue.reporterPhone && (
                                                    <div className="ml-auto text-xs text-blue-700/70 font-medium">
                                                        {t.phone}: {issue.reporterPhone}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Quick Actions based on status */}
                                    <div className="mt-4 pt-4 border-t border-blue-100">
                                        {issue.status === 'submitted' && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    router.push(`/${locale}/authority/vi/issues/${issue.id}?action=verify`);
                                                }}
                                                className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 hover:shadow-lg transition-all"
                                            >
                                                <FiCheckCircle className="w-4 h-4" />
                                                {t.verifyNow}
                                            </button>
                                        )}
                                        
                                        {issue.status === 'vi_verified' && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    router.push(`/${locale}/authority/vi/issues/${issue.id}?action=assign`);
                                                }}
                                                className="w-full px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 hover:shadow-lg transition-all"
                                            >
                                                <FiUsers className="w-4 h-4" />
                                                {t.assignToPDO}
                                            </button>
                                        )}
                                        
                                        {issue.status === 'pdo_assigned' && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    router.push(`/${locale}/authority/vi/issues/${issue.id}`);
                                                }}
                                                className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 hover:shadow-lg transition-all"
                                            >
                                                <FiEye className="w-4 h-4" />
                                                {t.viewDetails}
                                            </button>
                                        )}
                                        
                                        {!['submitted', 'vi_verified', 'pdo_assigned'].includes(issue.status || '') && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    router.push(`/${locale}/authority/vi/issues/${issue.id}`);
                                                }}
                                                className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 hover:shadow-lg transition-all"
                                            >
                                                <FiEye className="w-4 h-4" />
                                                {t.viewDetails}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Load More Button */}
                {hasMore && items.length > 0 && (
                    <div className="flex justify-center mb-12 animate-fadeIn">
                        <button
                            disabled={moreLoading}
                            onClick={loadMore}
                            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-2xl font-semibold hover:shadow-lg transition-all active:scale-95 disabled:opacity-60"
                        >
                            {moreLoading ? (
                                <span className="flex items-center gap-2">
                                    <FiRefreshCw className="w-4 h-4 animate-spin" />
                                    {t.loading}
                                </span>
                            ) : (
                                t.loadMore
                            )}
                        </button>
                    </div>
                )}

                {/* Bottom Navigation - Same as Dashboard */}
                <div className="fixed bottom-4 left-4 right-4 bg-white/90 backdrop-blur-lg border-2 border-blue-100 rounded-2xl p-2 shadow-xl animate-fadeIn">
                    <div className="grid grid-cols-4 gap-1">
                        <button
                            className="flex flex-col items-center justify-center p-3 rounded-xl transition-all hover:bg-blue-50"
                            onClick={() => router.push(`/${locale}/authority/vi/dashboard`)}
                        >
                            <FiHome className="w-5 h-5 text-blue-600/70" />
                            <span className="text-xs mt-1 font-medium text-blue-700/70">
                                {t.dashboard}
                            </span>
                        </button>
                        
                        <button
                            className="flex flex-col items-center justify-center p-3 rounded-xl transition-all hover:bg-blue-50"
                            onClick={() => router.push(`/${locale}/authority/vi/villagers`)}
                        >
                            <FiUsers className="w-5 h-5 text-blue-600/70" />
                            <span className="text-xs mt-1 font-medium text-blue-700/70">
                                {t.verify}
                            </span>
                        </button>
                        
                        <button
                            className="flex flex-col items-center justify-center p-3 rounded-xl transition-all bg-gradient-to-b from-blue-100 to-cyan-50"
                        >
                            <FiFileText className="w-5 h-5 text-blue-700" />
                            <span className="text-xs mt-1 font-medium text-blue-800 font-bold">
                                {t.issues}
                            </span>
                        </button>
                        
                        <button
                            className="flex flex-col items-center justify-center p-3 rounded-xl transition-all hover:bg-blue-50"
                            onClick={() => router.push(`/${locale}/authority/vi/profile`)}
                        >
                            <FiUser className="w-5 h-5 text-blue-600/70" />
                            <span className="text-xs mt-1 font-medium text-blue-700/70">
                                {t.profile}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Logout Button - Same as Dashboard */}
                <button
                    onClick={handleLogout}
                    className="fixed top-4 right-4 p-3 rounded-xl border-2 border-red-100 bg-white hover:bg-red-50 text-red-700 hover:text-red-900 transition-all duration-200 hover:scale-105 shadow-sm"
                    title={t.logout}
                >
                    <FiLogOut className="w-5 h-5" />
                </button>
            </div>
        </Screen>
    );
}