// app/[locale]/authority/tdo/dashboard/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Screen from "../../../../components/Screen";
import { auth, db } from "../../../../lib/firebase";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    serverTimestamp,
    updateDoc,
    where,
    Timestamp,
} from "firebase/firestore";
import {
    FiClock,
    FiCheckCircle,
    FiAlertCircle,
    FiRefreshCw,
    FiDollarSign,
    FiTrendingUp,
    FiUser,
    FiLogOut,
    FiInbox,
    FiActivity,
    FiMessageSquare,
    FiCheck,
    FiX,
    FiHome,
    FiFileText,
    FiMenu,
    FiSearch,
    FiGrid,
    FiList,
    FiChevronRight,
} from "react-icons/fi";

type FundReq = {
    id: string;
    status: "pending" | "approved" | "rejected";
    amount?: number;
    reason?: string;
    issueId?: string;
    districtId?: string;
    talukId?: string;
    createdAt?: any;
    panchayatId?: string;
    pdoName?: string;
    issueTitle?: string;
    tdoComment?: string;
    purpose?: string;
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

// Multi-language translations
const translations = {
    en: {
        title: "TDO Dashboard",
        welcome: "Welcome",
        loading: "Loading dashboard...",
        searchPlaceholder: "Search requests...",
        dashboard: "Dashboard",
        requests: "Requests",
        analytics: "Analytics",
        profile: "Profile",
        logout: "Logout",
        refresh: "Refresh",
        pending: "Pending",
        approved: "Approved",
        rejected: "Rejected",
        awaitingReview: "Awaiting review",
        view: "View",
        requestsFound: "requests found",
        searchResults: "Search results",
        of: "of",
        noSearchResults: "No matching requests",
        tryDifferentSearch: "Try different search",
        checkOtherTabs: "Check other tabs",
        loadingRequests: "Loading requests...",
        noRequests: "No requests found",
        panchayat: "Panchayat",
        noDescription: "No description",
        review: "Review",
        viewDetails: "View Details",
        quickApprove: "Quick Approve",
        reviewRequest: "Review Fund Request",
        reviewDescription: "Review details and decide",
        status: "Status",
        submitted: "Submitted",
        requestDetails: "Request Details",
        reason: "Reason",
        purpose: "Purpose",
        yourComment: "Your Comment",
        optional: "Optional",
        commentPlaceholder: "Add decision comments...",
        processing: "Processing...",
        approveRequest: "Approve Request",
        rejectRequest: "Reject Request",
        tdoComment: "TDO Comment",
        notSignedIn: "Not signed in",
        authorityNotFound: "Authority not found",
        notVerified: "Not verified",
        notAuthorized: "Not authorized",
        missingTalukId: "Missing taluk ID",
        loadFail: "Failed to load",
        actionFail: "Action failed",
        taluk: "Taluk",
        menu: "Menu",
        created: "Created",
        details: "Details",
        addComment: "Add a comment...",
        approve: "Approve",
        reject: "Reject",
        comment: "Comment",
        testQuery: "Test query",
        queryError: "Query error",
        error: "Error"
    },
    hi: {
        title: "टीडीओ डैशबोर्ड",
        welcome: "स्वागत है",
        loading: "डैशबोर्ड लोड हो रहा है...",
        searchPlaceholder: "अनुरोध खोजें...",
        dashboard: "डैशबोर्ड",
        requests: "अनुरोध",
        analytics: "विश्लेषण",
        profile: "प्रोफ़ाइल",
        logout: "लॉग आउट",
        refresh: "ताज़ा करें",
        pending: "लंबित",
        approved: "स्वीकृत",
        rejected: "अस्वीकृत",
        awaitingReview: "समीक्षा की प्रतीक्षा",
        view: "देखें",
        requestsFound: "अनुरोध मिले",
        searchResults: "खोज परिणाम",
        of: "का",
        noSearchResults: "कोई मिलते अनुरोध नहीं",
        tryDifferentSearch: "अलग खोज आज़माएं",
        checkOtherTabs: "अन्य टैब देखें",
        loadingRequests: "अनुरोध लोड हो रहे हैं...",
        noRequests: "कोई अनुरोध नहीं मिला",
        panchayat: "पंचायत",
        noDescription: "कोई विवरण नहीं",
        review: "समीक्षा",
        viewDetails: "विवरण देखें",
        quickApprove: "त्वरित स्वीकृति",
        reviewRequest: "निधि अनुरोध समीक्षा",
        reviewDescription: "विवरण समीक्षा करें और निर्णय लें",
        status: "स्थिति",
        submitted: "प्रस्तुत किया गया",
        requestDetails: "अनुरोध विवरण",
        reason: "कारण",
        purpose: "उद्देश्य",
        yourComment: "आपकी टिप्पणी",
        optional: "वैकल्पिक",
        commentPlaceholder: "निर्णय टिप्पणियाँ जोड़ें...",
        processing: "प्रसंस्करण...",
        approveRequest: "अनुरोध स्वीकारें",
        rejectRequest: "अनुरोध अस्वीकारें",
        tdoComment: "टीडीओ टिप्पणी",
        notSignedIn: "लॉगिन नहीं किया",
        authorityNotFound: "प्राधिकरण नहीं मिला",
        notVerified: "सत्यापित नहीं",
        notAuthorized: "अधिकृत नहीं",
        missingTalukId: "तालुक आईडी गुम है",
        loadFail: "लोड विफल",
        actionFail: "कार्रवाई विफल",
        taluk: "तालुक",
        menu: "मेनू",
        created: "बनाया गया",
        details: "विवरण",
        addComment: "टिप्पणी जोड़ें...",
        approve: "स्वीकारें",
        reject: "अस्वीकारें",
        comment: "टिप्पणी",
        testQuery: "टेस्ट क्वेरी",
        queryError: "क्वेरी त्रुटि",
        error: "त्रुटि"
    },
    kn: {
        title: "ಟಿಡಿಒ ಡ್ಯಾಶ್ಬೋರ್ಡ್",
        welcome: "ಸ್ವಾಗತ",
        loading: "ಡ್ಯಾಶ್ಬೋರ್ಡ್ ಲೋಡ್ ಆಗುತ್ತಿದೆ...",
        searchPlaceholder: "ಕೋರಿಕೆಗಳನ್ನು ಹುಡುಕಿ...",
        dashboard: "ಡ್ಯಾಶ್ಬೋರ್ಡ್",
        requests: "ಕೋರಿಕೆಗಳು",
        analytics: "ವಿಶ್ಲೇಷಣೆ",
        profile: "ಪ್ರೊಫೈಲ್",
        logout: "ಲಾಗ್ ಔಟ್",
        refresh: "ರಿಫ್ರೆಶ್",
        pending: "ಬಾಕಿ ಇದೆ",
        approved: "ಅನುಮೋದಿಸಲಾಗಿದೆ",
        rejected: "ತಿರಸ್ಕರಿಸಲಾಗಿದೆ",
        awaitingReview: "ಪರಿಶೀಲನೆಗಾಗಿ ಕಾಯುತ್ತಿದೆ",
        view: "ನೋಡಿ",
        requestsFound: "ಕೋರಿಕೆಗಳು ಕಂಡುಬಂದವು",
        searchResults: "ಹುಡುಕಾಟ ಫಲಿತಾಂಶಗಳು",
        of: "ನಲ್ಲಿ",
        noSearchResults: "ಹೊಂದಾಣಿಕೆಯ ಕೋರಿಕೆಗಳಿಲ್ಲ",
        tryDifferentSearch: "ವಿಭಿನ್ನ ಹುಡುಕಾಟ ಪ್ರಯತ್ನಿಸಿ",
        checkOtherTabs: "ಇತರ ಟ್ಯಾಬ್‌ಗಳನ್ನು ಪರಿಶೀಲಿಸಿ",
        loadingRequests: "ಕೋರಿಕೆಗಳು ಲೋಡ್ ಆಗುತ್ತಿವೆ...",
        noRequests: "ಕೋರಿಕೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ",
        panchayat: "ಪಂಚಾಯಿತಿ",
        noDescription: "ವಿವರಣೆ ಇಲ್ಲ",
        review: "ಪರಿಶೀಲಿಸಿ",
        viewDetails: "ವಿವರಗಳನ್ನು ನೋಡಿ",
        quickApprove: "ತ್ವರಿತ ಅನುಮೋದನೆ",
        reviewRequest: "ನಿಧಿ ಕೋರಿಕೆ ಪರಿಶೀಲನೆ",
        reviewDescription: "ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸಿ ಮತ್ತು ನಿರ್ಧರಿಸಿ",
        status: "ಸ್ಥಿತಿ",
        submitted: "ಸಲ್ಲಿಸಲಾಗಿದೆ",
        requestDetails: "ಕೋರಿಕೆ ವಿವರಗಳು",
        reason: "ಕಾರಣ",
        purpose: "ಉದ್ದೇಶ",
        yourComment: "ನಿಮ್ಮ ಕಾಮೆಂಟ್",
        optional: "ಐಚ್ಛಿಕ",
        commentPlaceholder: "ನಿರ್ಧಾರ ಕಾಮೆಂಟ್‌ಗಳನ್ನು ಸೇರಿಸಿ...",
        processing: "ಪ್ರಕ್ರಿಯೆಗೊಳ್ಳುತ್ತಿದೆ...",
        approveRequest: "ಕೋರಿಕೆ ಅನುಮೋದಿಸಿ",
        rejectRequest: "ಕೋರಿಕೆ ತಿರಸ್ಕರಿಸಿ",
        tdoComment: "ಟಿಡಿಒ ಕಾಮೆಂಟ್",
        notSignedIn: "ಲಾಗಿನ್ ಆಗಿಲ್ಲ",
        authorityNotFound: "ಅಧಿಕಾರ ಕಂಡುಬಂದಿಲ್ಲ",
        notVerified: "ಪರಿಶೀಲಿಸಲಾಗಿಲ್ಲ",
        notAuthorized: "ಅಧಿಕೃತವಾಗಿಲ್ಲ",
        missingTalukId: "ತಾಲ್ಲೂಕು ಐಡಿ ಕಾಣೆಯಾಗಿದೆ",
        loadFail: "ಲೋಡ್ ವಿಫಲವಾಗಿದೆ",
        actionFail: "ಕ್ರಿಯೆ ವಿಫಲವಾಗಿದೆ",
        taluk: "ತಾಲ್ಲೂಕು",
        menu: "ಮೆನು",
        created: "ಸೃಷ್ಟಿಸಲಾಗಿದೆ",
        details: "ವಿವರಗಳು",
        addComment: "ಕಾಮೆಂಟ್ ಸೇರಿಸಿ...",
        approve: "ಅನುಮೋದಿಸಿ",
        reject: "ತಿರಸ್ಕರಿಸಿ",
        comment: "ಕಾಮೆಂಟ್",
        testQuery: "ಪರೀಕ್ಷಾ ಪ್ರಶ್ನೆ",
        queryError: "ಪ್ರಶ್ನೆ ದೋಷ",
        error: "ದೋಷ"
    }
};

export default function TDODashboardOnePage() {
    const router = useRouter();
    const params = useParams() as { locale?: string };
    const locale = params?.locale || "en";
    
    // Get translation function
    const t = (key: keyof typeof translations.en) => {
        const langTranslations = translations[locale as keyof typeof translations] || translations.en;
        return langTranslations[key] || translations.en[key];
    };

    const [booting, setBooting] = useState(true);
    const [authority, setAuthority] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [err, setErr] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    const [tab, setTab] = useState<"pending" | "approved" | "rejected">("pending");
    const [items, setItems] = useState<FundReq[]>([]);
    const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 });
    const [animatedCounts, setAnimatedCounts] = useState({
        pending: 0,
        approved: 0,
        rejected: 0,
    });

    const [open, setOpen] = useState(false);
    const [active, setActive] = useState<FundReq | null>(null);
    const [comment, setComment] = useState("");
    const [acting, setActing] = useState(false);

    // Animation for number counting
    useEffect(() => {
        const interval = setInterval(() => {
            setAnimatedCounts(prev => ({
                pending: prev.pending < counts.pending ? prev.pending + Math.ceil(counts.pending / 10) : counts.pending,
                approved: prev.approved < counts.approved ? prev.approved + Math.ceil(counts.approved / 10) : counts.approved,
                rejected: prev.rejected < counts.rejected ? prev.rejected + Math.ceil(counts.rejected / 10) : counts.rejected,
            }));
        }, 50);

        return () => clearInterval(interval);
    }, [counts]);

    const tabs = useMemo(
        () => [
            {
                key: "pending" as const,
                label: t("pending"),
                icon: <FiClock className="w-4 h-4" />,
                color: "text-amber-900",
                bgColor: "bg-amber-100",
                borderColor: "border-amber-200",
            },
            {
                key: "approved" as const,
                label: t("approved"),
                icon: <FiCheckCircle className="w-4 h-4" />,
                color: "text-green-900",
                bgColor: "bg-green-100",
                borderColor: "border-green-200",
            },
            {
                key: "rejected" as const,
                label: t("rejected"),
                icon: <FiAlertCircle className="w-4 h-4" />,
                color: "text-red-900",
                bgColor: "bg-red-100",
                borderColor: "border-red-200",
            },
        ],
        [locale]
    );

    // Temporary workaround for index issue - query without orderBy
    const loadList = async (talukId: string, status: "pending" | "approved" | "rejected") => {
        try {
            // Simple query without orderBy to avoid index requirement
            const qy = query(
                collection(db, "fund_requests"),
                where("talukId", "==", talukId)
            );
            const snap = await getDocs(qy);
            
            // Filter and sort manually
            let filteredItems = snap.docs
                .map((d) => ({ id: d.id, ...(d.data() as any) }))
                .filter(item => item.status === status);
            
            // Sort by createdAt manually
            filteredItems.sort((a, b) => {
                const getTime = (item: FundReq) => {
                    if (!item.createdAt) return 0;
                    if (item.createdAt.toDate) return item.createdAt.toDate().getTime();
                    if (item.createdAt.seconds) return item.createdAt.seconds * 1000;
                    return new Date(item.createdAt).getTime();
                };
                return getTime(b) - getTime(a); // Descending
            });
            
            setItems(filteredItems);
        } catch (error: any) {
            console.error("Error loading list:", error);
            setErr(error.message || t("loadFail"));
        }
    };

    const loadCounts = async (talukId: string) => {
        try {
            // Query all requests for this taluk
            const qy = query(
                collection(db, "fund_requests"),
                where("talukId", "==", talukId)
            );
            
            const snap = await getDocs(qy);
            
            // Count manually
            let pending = 0, approved = 0, rejected = 0;
            snap.docs.forEach(doc => {
                const data = doc.data();
                if (data.status === "pending") pending++;
                else if (data.status === "approved") approved++;
                else if (data.status === "rejected") rejected++;
            });
            
            const newCounts = { pending, approved, rejected };
            setCounts(newCounts);
            setAnimatedCounts({ pending: 0, approved: 0, rejected: 0 });
        } catch (error: any) {
            console.error("Error loading counts:", error);
        }
    };

    const loadDashboardData = async (talukId: string, statusOverride?: "pending" | "approved" | "rejected") => {
        setErr("");
        setLoading(true);
        try {
            await loadCounts(talukId);
            await loadList(talukId, statusOverride || tab);
        } catch (e: any) {
            console.error("Load error:", e);
            setErr(e?.message || t("loadFail"));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        let alive = true;

        (async () => {
            try {
                setErr("");
                setBooting(true);

                const u = auth.currentUser;
                if (!u) {
                    setErr(t("notSignedIn"));
                    return;
                }

                const aSnap = await getDoc(doc(db, "authorities", u.uid));
                if (!aSnap.exists()) {
                    setErr(t("authorityNotFound"));
                    return;
                }

                const a = aSnap.data() as any;

                const verified = a?.verified === true 
                    || a?.status === "verified" 
                    || a?.status === "active"
                    || a?.verification?.status === "verified";
                
                if (!verified) {
                    setErr(t("notVerified"));
                    setAuthority(a);
                    return;
                }

                if (a?.role !== "tdo") {
                    setErr(t("notAuthorized"));
                    setAuthority(a);
                    return;
                }

                if (!a?.talukId) {
                    setErr(t("missingTalukId"));
                    setAuthority(a);
                    return;
                }

                if (!alive) return;
                setAuthority(a);

                await loadDashboardData(a.talukId, "pending");
            } catch (e: any) {
                console.error("Boot error:", e);
                if (!alive) return;
                setErr(e?.message || t("loadFail"));
            } finally {
                if (!alive) return;
                setBooting(false);
            }
        })();

        return () => {
            alive = false;
        };
    }, [locale]);

    useEffect(() => {
        if (booting || !authority?.talukId) return;
        loadList(authority.talukId, tab).catch(() => { });
    }, [tab, authority, booting]);

    const handleRefresh = async () => {
        if (!authority?.talukId) return;
        setRefreshing(true);
        await loadDashboardData(authority.talukId);
    };

    const handleLogout = async () => {
        try {
            await auth.signOut();
            router.replace(`/${locale}/role-select`);
        } catch (e) {
            console.error(e);
        }
    };

    const openModal = (x: FundReq) => {
        setActive(x);
        setComment("");
        setOpen(true);
    };

    const closeModal = () => {
        setOpen(false);
        setActive(null);
        setComment("");
    };

    const act = async (status: "approved" | "rejected") => {
        if (!active) return;
        setActing(true);
        setErr("");

        try {
            await updateDoc(doc(db, "fund_requests", active.id), {
                status,
                tdoComment: comment || "",
                decidedAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            if (authority?.talukId) {
                await loadDashboardData(authority.talukId);
            }
            closeModal();
        } catch (e: any) {
            console.error("Action error:", e);
            setErr(e?.message || t("actionFail"));
        } finally {
            setActing(false);
        }
    };

    // Filter items based on search
    const filteredItems = useMemo(() => {
        if (!searchQuery.trim()) return items;
        
        const query = searchQuery.toLowerCase();
        return items.filter(item => 
            (item.reason?.toLowerCase().includes(query)) ||
            (item.purpose?.toLowerCase().includes(query)) ||
            (item.panchayatId?.toLowerCase().includes(query)) ||
            (item.pdoName?.toLowerCase().includes(query)) ||
            (item.amount?.toString().includes(query))
        );
    }, [items, searchQuery]);

    if (booting) {
        return (
            <Screen padded>
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
                    <div className="text-center animate-pulse">
                        <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-4"></div>
                        <div className="text-blue-700 font-bold text-lg">{t("loading")}</div>
                    </div>
                </div>
            </Screen>
        );
    }

    return (
        <Screen padded>
            <style jsx global>{`
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                .animate-slideIn { animation: slideIn 0.6s ease-out; }
                .animate-fadeIn { animation: fadeIn 0.8s ease-out; }
                .animate-pulse-slow { animation: pulse 2s infinite; }
            `}</style>

            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-3 sm:p-4 pb-24 sm:pb-20">
                {/* Mobile Header */}
                <div className="lg:hidden mb-4 animate-slideIn">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowMobileMenu(!showMobileMenu)}
                                className="p-2 rounded-xl bg-white border border-blue-200 shadow-sm"
                            >
                                <FiMenu className="w-5 h-5 text-blue-600" />
                            </button>
                            <div>
                                <h1 className="text-xl font-bold text-blue-900">
                                    {t("title")}
                                </h1>
                                <p className="text-xs text-blue-600">
                                    {authority?.talukId ? `${t("taluk")}: ${authority.talukId}` : ""}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleRefresh}
                                disabled={refreshing}
                                className="p-2 rounded-xl bg-white border border-blue-200"
                            >
                                <FiRefreshCw className={`w-5 h-5 text-blue-600 ${refreshing ? "animate-spin" : ""}`} />
                            </button>
                        </div>
                    </div>

                    {/* Mobile Menu */}
                    {showMobileMenu && (
                        <div className="mb-3 bg-white rounded-2xl border border-blue-200 p-3 shadow-lg animate-fadeIn">
                            <div className="grid grid-cols-4 gap-2">
                                <button
                                    onClick={() => router.push(`/${locale}/authority/tdo/dashboard`)}
                                    className="flex flex-col items-center p-2 rounded-xl bg-blue-50"
                                >
                                    <FiHome className="w-5 h-5 text-blue-600" />
                                    <span className="text-xs mt-1 text-blue-700 font-medium">{t("dashboard")}</span>
                                </button>
                                <button
                                    onClick={() => router.push(`/${locale}/authority/tdo/requests`)}
                                    className="flex flex-col items-center p-2 rounded-xl hover:bg-blue-50"
                                >
                                    <FiFileText className="w-5 h-5 text-blue-500" />
                                    <span className="text-xs mt-1 text-blue-600 font-medium">{t("requests")}</span>
                                </button>
                                <button
                                    onClick={() => router.push(`/${locale}/authority/tdo/analytics`)}
                                    className="flex flex-col items-center p-2 rounded-xl hover:bg-blue-50"
                                >
                                    <FiTrendingUp className="w-5 h-5 text-blue-500" />
                                    <span className="text-xs mt-1 text-blue-600 font-medium">{t("analytics")}</span>
                                </button>
                                <button
                                    onClick={() => router.push(`/${locale}/authority/tdo/profile`)}
                                    className="flex flex-col items-center p-2 rounded-xl hover:bg-blue-50"
                                >
                                    <FiUser className="w-5 h-5 text-blue-500" />
                                    <span className="text-xs mt-1 text-blue-600 font-medium">{t("profile")}</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Search Bar for Mobile */}
                    <div className="relative mb-3">
                        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder={t("searchPlaceholder")}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white border-2 border-blue-200 rounded-2xl text-blue-900 placeholder-blue-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                        />
                    </div>
                </div>

                {/* Desktop Header */}
                <div className="hidden lg:block mb-6 animate-slideIn">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-blue-900 tracking-tight">
                                {t("title")}
                            </h1>
                            <div className="flex items-center gap-4 mt-2">
                                <p className="text-blue-700 text-sm flex items-center gap-2">
                                    <FiActivity className="w-4 h-4" />
                                    {t("welcome")}, {auth.currentUser?.displayName || auth.currentUser?.email?.split("@")[0] || "TDO"}
                                </p>
                                {authority?.talukId && (
                                    <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                        {t("taluk")}: {authority.talukId}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleRefresh}
                                disabled={refreshing}
                                className="p-3 rounded-xl border-2 border-blue-200 bg-white hover:bg-blue-50 transition-colors"
                                title={t("refresh")}
                            >
                                <FiRefreshCw className={`w-5 h-5 text-blue-600 ${refreshing ? "animate-spin" : ""}`} />
                            </button>
                            <button
                                onClick={handleLogout}
                                className="p-3 rounded-xl border-2 border-red-200 bg-white hover:bg-red-50 text-red-600 transition-colors"
                                title={t("logout")}
                            >
                                <FiLogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Search Bar for Desktop */}
                    <div className="flex items-center gap-3 mb-4">
                        <div className="flex-1 relative">
                            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder={t("searchPlaceholder")}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-white border-2 border-blue-200 rounded-2xl text-blue-900 placeholder-blue-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setViewMode("grid")}
                                className={`p-3 rounded-xl border-2 ${viewMode === "grid" 
                                    ? "bg-blue-100 border-blue-300 text-blue-700" 
                                    : "bg-white border-blue-200 text-blue-500 hover:bg-blue-50"}`}
                            >
                                <FiGrid className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setViewMode("list")}
                                className={`p-3 rounded-xl border-2 ${viewMode === "list" 
                                    ? "bg-blue-100 border-blue-300 text-blue-700" 
                                    : "bg-white border-blue-200 text-blue-500 hover:bg-blue-50"}`}
                            >
                                <FiList className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Error Messages */}
                {err && (
                    <div className="mb-4 p-4 bg-red-50 border-2 border-red-100 rounded-2xl animate-fadeIn">
                        <div className="flex items-start gap-2">
                            <FiAlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                            <p className="text-red-700 text-sm">{err}</p>
                        </div>
                    </div>
                )}

                {!authority?.talukId && (
                    <div className="mb-4 p-4 bg-amber-50 border-2 border-amber-100 rounded-2xl animate-fadeIn">
                        <div className="flex items-start gap-2">
                            <FiAlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                            <p className="text-amber-700 text-sm">
                                {t("missingTalukId")}
                            </p>
                        </div>
                    </div>
                )}

                {/* Stats Cards with Animation */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
                    {tabs.map((tabItem, index) => (
                        <div
                            key={tabItem.key}
                            className={`border-2 ${tabItem.borderColor} rounded-2xl p-4 sm:p-5 shadow-lg hover:shadow-xl transition-all duration-300 animate-slideIn`}
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className={`p-2 sm:p-3 ${tabItem.bgColor} rounded-xl`}>
                                    {tabItem.icon}
                                </div>
                                <div className={`text-2xl sm:text-3xl font-bold ${tabItem.color} animate-pulse-slow`}>
                                    {animatedCounts[tabItem.key]}
                                </div>
                            </div>
                            <div className="text-sm sm:text-base font-semibold text-gray-600">
                                {tabItem.label}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                                {tabItem.key === "pending" 
                                    ? t("awaitingReview")
                                    : tabItem.key === "approved"
                                        ? t("approved")
                                        : t("rejected")}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Tabs with Animation */}
                <div className="flex gap-1 sm:gap-2 overflow-x-auto mb-4 pb-2">
                    {tabs.map((x, index) => {
                        const activeTab = tab === x.key;
                        return (
                            <button
                                key={x.key}
                                onClick={() => setTab(x.key)}
                                disabled={!authority?.talukId}
                                className={[
                                    "flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl border font-bold whitespace-nowrap transition-all duration-300 flex-shrink-0 animate-fadeIn",
                                    activeTab
                                        ? "bg-blue-600 text-white border-blue-600 shadow-lg"
                                        : "bg-white text-blue-900 border-blue-200 hover:bg-blue-50",
                                    !authority?.talukId ? "opacity-50 cursor-not-allowed" : ""
                                ].join(" ")}
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                {x.icon}
                                <span className="text-xs sm:text-sm">{x.label}</span>
                                <span className={`ml-1 sm:ml-2 px-2 py-1 rounded-full text-xs ${activeTab 
                                    ? "bg-white/20 text-white" 
                                    : `${x.bgColor} ${x.color}`}`}>
                                    {counts[x.key]}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* View Toggle and Results Count */}
                <div className="flex items-center justify-between mb-4 animate-fadeIn">
                    <div className="text-sm text-blue-700">
                        {searchQuery ? (
                            <span>{t("searchResults")}: <strong>{filteredItems.length}</strong> {t("of")} <strong>{items.length}</strong></span>
                        ) : (
                            <span><strong>{items.length}</strong> {t("requestsFound")}</span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 hidden sm:block">{t("view")}:</span>
                        <div className="flex bg-white border border-blue-200 rounded-lg p-1">
                            <button
                                onClick={() => setViewMode("grid")}
                                className={`px-3 py-1 rounded text-sm ${viewMode === "grid" 
                                    ? "bg-blue-100 text-blue-700" 
                                    : "text-gray-600 hover:text-blue-600"}`}
                            >
                                <FiGrid className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode("list")}
                                className={`px-3 py-1 rounded text-sm ${viewMode === "list" 
                                    ? "bg-blue-100 text-blue-700" 
                                    : "text-gray-600 hover:text-blue-600"}`}
                            >
                                <FiList className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="text-center py-10 animate-pulse">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
                        <p className="text-blue-700 font-semibold">{t("loadingRequests")}</p>
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="rounded-2xl border-2 border-blue-200 bg-white/50 p-8 text-center animate-fadeIn">
                        <FiInbox className="w-16 h-16 text-blue-300 mx-auto mb-4" />
                        <p className="text-blue-700 font-semibold text-lg mb-2">
                            {searchQuery ? t("noSearchResults") : t("noRequests")}
                        </p>
                        <p className="text-blue-500 text-sm">
                            {searchQuery ? t("tryDifferentSearch") : t("checkOtherTabs")}
                        </p>
                    </div>
                ) : viewMode === "grid" ? (
                    // Grid View
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        {filteredItems.map((x, index) => (
                            <div
                                key={x.id}
                                className="bg-white border-2 border-blue-100 rounded-2xl p-4 shadow-sm hover:shadow-lg transition-all duration-300 animate-slideIn hover:scale-[1.02]"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <div className="mb-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className={`p-2 rounded-xl ${x.status === "pending"
                                                ? "bg-amber-100 text-amber-700"
                                                : x.status === "approved"
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-red-100 text-red-700"
                                            }`}>
                                            <FiDollarSign className="w-5 h-5" />
                                        </div>
                                        <div className={`px-2 py-1 rounded-full text-xs font-bold ${x.status === "pending"
                                                ? "bg-amber-100 text-amber-800"
                                                : x.status === "approved"
                                                    ? "bg-green-100 text-green-800"
                                                    : "bg-red-100 text-red-800"
                                            }`}>
                                            {x.status === "pending" ? t("pending") : 
                                             x.status === "approved" ? t("approved") : 
                                             t("rejected")}
                                        </div>
                                    </div>
                                    <div className="text-2xl font-bold text-blue-900 mb-2">
                                        ₹{x.amount?.toLocaleString() || 0}
                                    </div>
                                    <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                                        {x.reason || x.purpose || t("noDescription")}
                                    </p>
                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                        <span>{t("panchayat")}: {x.panchayatId || "N/A"}</span>
                                        <span>{fmtDate(x.createdAt)}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => openModal(x)}
                                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-2.5 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 flex items-center justify-center gap-2"
                                >
                                    {x.status === "pending" ? t("review") : t("viewDetails")}
                                    <FiChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    // List View
                    <div className="space-y-3">
                        {filteredItems.map((x, index) => (
                            <div
                                key={x.id}
                                className="bg-white border-2 border-blue-100 rounded-2xl p-4 hover:shadow-lg transition-all duration-300 animate-slideIn"
                                style={{ animationDelay: `${index * 30}ms` }}
                            >
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-start gap-3 mb-3">
                                            <div className={`p-2 rounded-xl ${x.status === "pending"
                                                    ? "bg-amber-100 text-amber-700"
                                                    : x.status === "approved"
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-red-100 text-red-700"
                                                }`}>
                                                <FiDollarSign className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="text-xl font-bold text-blue-900">
                                                        ₹{x.amount?.toLocaleString() || 0}
                                                    </div>
                                                    <div className={`px-2 py-1 rounded-full text-xs font-bold ${x.status === "pending"
                                                            ? "bg-amber-100 text-amber-800"
                                                            : x.status === "approved"
                                                                ? "bg-green-100 text-green-800"
                                                                : "bg-red-100 text-red-800"
                                                        }`}>
                                                        {x.status === "pending" ? t("pending") : 
                                                         x.status === "approved" ? t("approved") : 
                                                         t("rejected")}
                                                    </div>
                                                </div>
                                                <p className="text-sm text-gray-700 mb-2">
                                                    {x.reason || x.purpose || t("noDescription")}
                                                </p>
                                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                                    <span>{t("panchayat")}: {x.panchayatId || "N/A"}</span>
                                                    <span>•</span>
                                                    <span>{fmtDate(x.createdAt)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                                        <button
                                            onClick={() => openModal(x)}
                                            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 text-sm font-semibold"
                                        >
                                            {x.status === "pending" ? t("review") : t("viewDetails")}
                                        </button>
                                        {x.status === "pending" && (
                                            <button
                                                onClick={() => {
                                                    setActive(x);
                                                    setComment("");
                                                    act("approved");
                                                }}
                                                className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-xl hover:from-green-700 hover:to-emerald-800 transition-all duration-300 text-sm font-semibold"
                                                disabled={acting}
                                            >
                                                {t("quickApprove")}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Mobile Bottom Navigation */}
                <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-blue-100 p-3 z-50 animate-slideIn">
                    <div className="grid grid-cols-5 gap-1">
                        <button
                            onClick={() => router.push(`/${locale}/authority/tdo/dashboard`)}
                            className="flex flex-col items-center justify-center p-2 rounded-xl transition-all bg-gradient-to-b from-blue-100 to-blue-50"
                        >
                            <FiHome className="w-5 h-5 text-blue-700" />
                            <span className="text-xs mt-1 font-medium text-blue-800">{t("dashboard")}</span>
                        </button>
                        <button
                            onClick={() => router.push(`/${locale}/authority/tdo/requests`)}
                            className="flex flex-col items-center justify-center p-2 rounded-xl transition-all hover:bg-blue-50"
                        >
                            <FiFileText className="w-5 h-5 text-blue-600" />
                            <span className="text-xs mt-1 font-medium text-blue-700">{t("requests")}</span>
                        </button>
                        <button
                            onClick={() => router.push(`/${locale}/authority/tdo/analytics`)}
                            className="flex flex-col items-center justify-center p-2 rounded-xl transition-all hover:bg-blue-50"
                        >
                            <FiTrendingUp className="w-5 h-5 text-blue-600" />
                            <span className="text-xs mt-1 font-medium text-blue-700">{t("analytics")}</span>
                        </button>
                        <button
                            onClick={() => router.push(`/${locale}/authority/tdo/profile`)}
                            className="flex flex-col items-center justify-center p-2 rounded-xl transition-all hover:bg-blue-50"
                        >
                            <FiUser className="w-5 h-5 text-blue-600" />
                            <span className="text-xs mt-1 font-medium text-blue-700">{t("profile")}</span>
                        </button>
                        <button
                            onClick={() => setShowMobileMenu(!showMobileMenu)}
                            className="flex flex-col items-center justify-center p-2 rounded-xl transition-all hover:bg-blue-50"
                        >
                            <FiMenu className="w-5 h-5 text-blue-600" />
                            <span className="text-xs mt-1 font-medium text-blue-700">{t("menu")}</span>
                        </button>
                    </div>
                </div>

                {/* Modal */}
                {open && active && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
                        <div className="relative w-full max-w-lg bg-white rounded-3xl border-2 border-blue-100 shadow-2xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
                            <div className="flex items-start justify-between gap-3 mb-4 sm:mb-6">
                                <div>
                                    <h2 className="text-xl sm:text-2xl font-bold text-blue-900">
                                        {t("reviewRequest")}
                                    </h2>
                                    <p className="text-sm text-blue-700 mt-1">
                                        {t("reviewDescription")}
                                    </p>
                                </div>
                                <button
                                    onClick={closeModal}
                                    className="p-2 rounded-xl border-2 border-blue-100 bg-white text-blue-900 hover:bg-blue-50 transition-colors duration-300"
                                >
                                    <FiX className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-3 sm:space-y-4">
                                <div className="p-4 sm:p-5 bg-blue-50 border-2 border-blue-100 rounded-2xl">
                                    <div className="text-2xl sm:text-3xl font-bold text-blue-900 mb-3">
                                        ₹{active.amount?.toLocaleString() || 0}
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-blue-900">{t("status")}:</span>
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${active.status === "pending"
                                                    ? "bg-amber-100 text-amber-800"
                                                    : active.status === "approved"
                                                        ? "bg-green-100 text-green-800"
                                                        : "bg-red-100 text-red-800"
                                                }`}>
                                                {active.status === "pending" ? t("pending") : 
                                                 active.status === "approved" ? t("approved") : 
                                                 t("rejected")}
                                            </span>
                                        </div>
                                        {active.panchayatId && (
                                            <div><span className="font-semibold text-blue-900">{t("panchayat")}:</span> {active.panchayatId}</div>
                                        )}
                                        {active.createdAt && (
                                            <div><span className="font-semibold text-blue-900">{t("submitted")}:</span> {fmtDate(active.createdAt)}</div>
                                        )}
                                    </div>
                                </div>

                                {(active.reason || active.purpose) && (
                                    <div className="p-4 sm:p-5 bg-amber-50 border-2 border-amber-100 rounded-2xl">
                                        <div className="flex items-center gap-2 mb-3">
                                            <FiMessageSquare className="w-4 h-4 text-amber-700" />
                                            <span className="font-bold text-amber-900">{t("requestDetails")}</span>
                                        </div>
                                        {active.reason && (
                                            <p className="text-sm text-amber-800 mb-2">
                                                <strong>{t("reason")}:</strong> {active.reason}
                                            </p>
                                        )}
                                        {active.purpose && (
                                            <p className="text-sm text-amber-800">
                                                <strong>{t("purpose")}:</strong> {active.purpose}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {active.status === "pending" && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-bold text-blue-900 mb-2">
                                                {t("yourComment")} {t("optional")}
                                            </label>
                                            <textarea
                                                value={comment}
                                                onChange={(e) => setComment(e.target.value)}
                                                rows={4}
                                                className="w-full rounded-2xl border-2 border-blue-200 bg-white px-4 py-3 text-blue-900 font-medium focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                                                placeholder={t("commentPlaceholder")}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 sm:mt-6">
                                            <button
                                                disabled={acting}
                                                onClick={() => act("approved")}
                                                className="rounded-2xl bg-gradient-to-r from-green-600 to-emerald-700 text-white font-bold py-3 sm:py-4 disabled:opacity-60 hover:from-green-700 hover:to-emerald-800 transition-all duration-300 flex items-center justify-center gap-2"
                                            >
                                                {acting ? (
                                                    <>
                                                        <FiRefreshCw className="w-4 h-4 animate-spin" />
                                                        {t("processing")}
                                                    </>
                                                ) : (
                                                    <>
                                                        <FiCheck className="w-5 h-5" />
                                                        {t("approveRequest")}
                                                    </>
                                                )}
                                            </button>

                                            <button
                                                disabled={acting}
                                                onClick={() => act("rejected")}
                                                className="rounded-2xl bg-gradient-to-r from-red-600 to-rose-700 text-white font-bold py-3 sm:py-4 disabled:opacity-60 hover:from-red-700 hover:to-rose-800 transition-all duration-300 flex items-center justify-center gap-2"
                                            >
                                                {acting ? (
                                                    <>
                                                        <FiRefreshCw className="w-4 h-4 animate-spin" />
                                                        {t("processing")}
                                                    </>
                                                ) : (
                                                    <>
                                                        <FiX className="w-5 h-5" />
                                                        {t("rejectRequest")}
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </>
                                )}

                                {active.status !== "pending" && active.tdoComment && (
                                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200">
                                        <div className="flex items-center gap-2 text-sm text-gray-700">
                                            <FiMessageSquare className="w-4 h-4" />
                                            <span className="font-semibold">{t("tdoComment")}:</span>
                                            <span>{active.tdoComment}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Screen>
    );
}