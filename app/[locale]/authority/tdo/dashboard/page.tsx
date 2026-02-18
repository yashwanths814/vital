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
    FiMap,
    FiBarChart2,
    FiSettings,
    FiHelpCircle,
    FiBell,
    FiEye,
    FiStar,
    FiInfo,  // Added missing import
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
        error: "Error",
        map: "Map View",
        fundRequests: "Fund Requests",
        fundApprove: "Approve Fund",
        settings: "Settings",
        help: "Help",
        notifications: "Notifications",
        quickActions: "Quick Actions",
        recentActivity: "Recent Activity",
        viewAll: "View All",
        today: "Today",
        thisWeek: "This Week",
        older: "Older",
        noNotifications: "No notifications",
        markAllRead: "Mark all as read",
        helpCenter: "Help Center",
        faq: "FAQ",
        contactSupport: "Contact Support",
        about: "About",
        version: "Version",
        logoutConfirm: "Are you sure you want to logout?",
        cancel: "Cancel",
        confirm: "Confirm",
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
        error: "त्रुटि",
        map: "मानचित्र दृश्य",
        fundRequests: "निधि अनुरोध",
        fundApprove: "निधि स्वीकृत करें",
        settings: "सेटिंग्स",
        help: "सहायता",
        notifications: "सूचनाएं",
        quickActions: "त्वरित कार्रवाइयां",
        recentActivity: "हाल की गतिविधियां",
        viewAll: "सभी देखें",
        today: "आज",
        thisWeek: "इस सप्ताह",
        older: "पुराने",
        noNotifications: "कोई सूचना नहीं",
        markAllRead: "सभी पढ़ी हुई मार्क करें",
        helpCenter: "सहायता केंद्र",
        faq: "FAQ",
        contactSupport: "सहायता से संपर्क करें",
        about: "बारे में",
        version: "संस्करण",
        logoutConfirm: "क्या आप लॉगआउट करना चाहते हैं?",
        cancel: "रद्द करें",
        confirm: "पुष्टि करें",
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
        error: "ದೋಷ",
        map: "ನಕ್ಷೆ ನೋಟ",
        fundRequests: "ನಿಧಿ ಕೋರಿಕೆಗಳು",
        fundApprove: "ನಿಧಿ ಅನುಮೋದಿಸಿ",
        settings: "ಸೆಟ್ಟಿಂಗ್‌ಗಳು",
        help: "ಸಹಾಯ",
        notifications: "ಅಧಿಸೂಚನೆಗಳು",
        quickActions: "ತ್ವರಿತ ಕ್ರಿಯೆಗಳು",
        recentActivity: "ಇತ್ತೀಚಿನ ಚಟುವಟಿಕೆ",
        viewAll: "ಎಲ್ಲಾ ನೋಡಿ",
        today: "ಇಂದು",
        thisWeek: "ಈ ವಾರ",
        older: "ಹಳೆಯದು",
        noNotifications: "ಯಾವುದೇ ಅಧಿಸೂಚನೆಗಳಿಲ್ಲ",
        markAllRead: "ಎಲ್ಲಾ ಓದಿದಂತೆ ಗುರುತಿಸಿ",
        helpCenter: "ಸಹಾಯ ಕೇಂದ್ರ",
        faq: "FAQ",
        contactSupport: "ಬೆಂಬಲವನ್ನು ಸಂಪರ್ಕಿಸಿ",
        about: "ಬಗ್ಗೆ",
        version: "ಆವೃತ್ತಿ",
        logoutConfirm: "ನೀವು ಲಾಗ್ ಔಟ್ ಮಾಡಲು ಬಯಸುವಿರಾ?",
        cancel: "ರದ್ದುಮಾಡಿ",
        confirm: "ದೃಢೀಕರಿಸಿ",
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
    
    // Mobile menu states
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showHelpMenu, setShowHelpMenu] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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

    // Mock notifications
    const notifications = useMemo(() => [
        {
            id: 1,
            title: "New fund request",
            message: "Panchayat A has requested ₹50,000",
            time: "5 min ago",
            read: false,
            type: "request"
        },
        {
            id: 2,
            title: "Request approved",
            message: "Your approval was successful",
            time: "1 hour ago",
            read: false,
            type: "success"
        },
        {
            id: 3,
            title: "Pending requests",
            message: "3 requests awaiting review",
            time: "2 hours ago",
            read: true,
            type: "pending"
        }
    ], []);

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

    // Navigation functions
    const navigateTo = (path: string) => {
        setShowMobileMenu(false);
        setShowNotifications(false);
        setShowHelpMenu(false);
        router.push(path);
    };

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
        <Screen padded={false}>
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
                @keyframes slideInLeft {
                    from {
                        opacity: 0;
                        transform: translateX(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                @keyframes slideInRight {
                    from {
                        opacity: 0;
                        transform: translateX(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scaleIn {
                    from {
                        opacity: 0;
                        transform: scale(0.9);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                }
                @keyframes rotate {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                .animate-slideIn { animation: slideIn 0.6s ease-out; }
                .animate-slideLeft { animation: slideInLeft 0.5s ease-out; }
                .animate-slideRight { animation: slideInRight 0.5s ease-out; }
                .animate-fadeIn { animation: fadeIn 0.8s ease-out; }
                .animate-scaleIn { animation: scaleIn 0.4s ease-out; }
                .animate-pulse-slow { animation: pulse 2s infinite; }
                .animate-bounce-slow { animation: bounce 2s infinite; }
                .animate-rotate { animation: rotate 1s linear infinite; }
                .delay-100 { animation-delay: 0.1s; }
                .delay-200 { animation-delay: 0.2s; }
                .delay-300 { animation-delay: 0.3s; }
                .delay-400 { animation-delay: 0.4s; }
                .delay-500 { animation-delay: 0.5s; }
                
                .menu-item {
                    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                .menu-item:hover {
                    transform: scale(1.05);
                }
                .menu-item:active {
                    transform: scale(0.95);
                }
                .notification-badge {
                    animation: pulse 2s infinite;
                }
                .shimmer {
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
                    animation: shimmer 1.5s infinite;
                }
            `}</style>

            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 pb-24">
                {/* Sticky Header with Top Navigation */}
                <div className="sticky top-0 z-50 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 shadow-lg">
                    <div className="flex items-center justify-between">
                        {/* Left: Logo & Title */}
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={() => setShowMobileMenu(!showMobileMenu)}
                                className="p-2 rounded-lg bg-white/20 hover:bg-white/30 active:scale-95 transition-all duration-200"
                                aria-label="Menu"
                            >
                                <FiMenu className="w-5 h-5" />
                            </button>
                            <div>
                                <h1 className="text-lg font-bold flex items-center gap-2">
                                    <FiHome className="w-4 h-4" />
                                    {t("title")}
                                </h1>
                                <p className="text-xs opacity-90">
                                    {authority?.name || "Officer"} • {authority?.talukId || t("taluk")}
                                </p>
                            </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center space-x-2">
                            {/* Notifications */}
                            <div className="relative">
                                <button
                                    onClick={() => {
                                        setShowNotifications(!showNotifications);
                                        setShowHelpMenu(false);
                                    }}
                                    className="p-2 rounded-lg bg-white/20 hover:bg-white/30 active:scale-95 transition-all duration-200 relative"
                                    aria-label="Notifications"
                                >
                                    <FiBell className="w-5 h-5" />
                                    {notifications.filter(n => !n.read).length > 0 && (
                                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center font-bold notification-badge">
                                            {notifications.filter(n => !n.read).length}
                                        </span>
                                    )}
                                </button>

                                {/* Notifications Dropdown */}
                                {showNotifications && (
                                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-blue-100 overflow-hidden z-50 animate-scaleIn">
                                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3">
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-bold">{t("notifications")}</h3>
                                                <button
                                                    onClick={() => setShowNotifications(false)}
                                                    className="text-white/80 hover:text-white"
                                                >
                                                    <FiX className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="max-h-96 overflow-y-auto">
                                            {notifications.length === 0 ? (
                                                <div className="p-4 text-center text-gray-500">
                                                    <FiBell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                                    <p>{t("noNotifications")}</p>
                                                </div>
                                            ) : (
                                                <>
                                                    {/* Today */}
                                                    <div className="px-4 py-2 bg-blue-50 text-xs font-semibold text-blue-600">
                                                        {t("today")}
                                                    </div>
                                                    {notifications.filter(n => n.time.includes('min')).map(notif => (
                                                        <NotificationItem key={notif.id} notif={notif} />
                                                    ))}

                                                    {/* This Week */}
                                                    <div className="px-4 py-2 bg-blue-50 text-xs font-semibold text-blue-600">
                                                        {t("thisWeek")}
                                                    </div>
                                                    {notifications.filter(n => n.time.includes('hour')).map(notif => (
                                                        <NotificationItem key={notif.id} notif={notif} />
                                                    ))}

                                                    {/* Older */}
                                                    <div className="px-4 py-2 bg-blue-50 text-xs font-semibold text-blue-600">
                                                        {t("older")}
                                                    </div>
                                                    {notifications.filter(n => n.time.includes('day')).map(notif => (
                                                        <NotificationItem key={notif.id} notif={notif} />
                                                    ))}
                                                </>
                                            )}
                                        </div>
                                        <div className="border-t border-blue-100 p-3">
                                            <button className="w-full text-center text-sm text-blue-600 font-semibold hover:text-blue-800">
                                                {t("markAllRead")}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Help Menu */}
                            <div className="relative">
                                <button
                                    onClick={() => {
                                        setShowHelpMenu(!showHelpMenu);
                                        setShowNotifications(false);
                                    }}
                                    className="p-2 rounded-lg bg-white/20 hover:bg-white/30 active:scale-95 transition-all duration-200"
                                    aria-label="Help"
                                >
                                    <FiHelpCircle className="w-5 h-5" />
                                </button>

                                {/* Help Dropdown */}
                                {showHelpMenu && (
                                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-blue-100 overflow-hidden z-50 animate-scaleIn">
                                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3">
                                            <h3 className="font-bold">{t("help")}</h3>
                                        </div>
                                        <div className="p-3">
                                            <button
                                                onClick={() => navigateTo(`/${locale}/authority/tdo/help`)}
                                                className="w-full text-left px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-3"
                                            >
                                                <FiHelpCircle className="w-4 h-4 text-blue-600" />
                                                <span className="text-sm">{t("helpCenter")}</span>
                                            </button>
                                            <button
                                                onClick={() => navigateTo(`/${locale}/authority/tdo/faq`)}
                                                className="w-full text-left px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-3"
                                            >
                                                <FiStar className="w-4 h-4 text-blue-600" />
                                                <span className="text-sm">{t("faq")}</span>
                                            </button>
                                            <button
                                                onClick={() => navigateTo(`/${locale}/authority/tdo/support`)}
                                                className="w-full text-left px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-3"
                                            >
                                                <FiMessageSquare className="w-4 h-4 text-blue-600" />
                                                <span className="text-sm">{t("contactSupport")}</span>
                                            </button>
                                            <div className="border-t border-blue-100 my-2"></div>
                                            <button
                                                onClick={() => navigateTo(`/${locale}/authority/tdo/about`)}
                                                className="w-full text-left px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-3"
                                            >
                                                <FiInfo className="w-4 h-4 text-blue-600" />
                                                <span className="text-sm">{t("about")}</span>
                                            </button>
                                            <div className="px-3 py-2 text-xs text-gray-500">
                                                {t("version")} 1.0.0
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Refresh Button */}
                            <button
                                onClick={handleRefresh}
                                disabled={refreshing}
                                className="p-2 rounded-lg bg-white/20 hover:bg-white/30 active:scale-95 transition-all duration-200"
                                title={t("refresh")}
                            >
                                <FiRefreshCw className={`w-5 h-5 ${refreshing ? "animate-rotate" : ""}`} />
                            </button>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="mt-3 relative">
                        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
                        <input
                            type="text"
                            placeholder={t("searchPlaceholder")}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white/20 backdrop-blur-sm rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
                        />
                    </div>
                </div>

                {/* Mobile Menu Overlay */}
                {showMobileMenu && (
                    <div 
                        className="fixed inset-0 bg-black/50 z-40 animate-fadeIn"
                        onClick={() => setShowMobileMenu(false)}
                    />
                )}

                {/* Mobile Menu Sidebar */}
                <div className={`fixed top-0 left-0 h-full w-72 bg-white z-50 transform transition-transform duration-300 ease-in-out shadow-2xl ${showMobileMenu ? 'translate-x-0' : '-translate-x-full'}`}>
                    <div className="bg-gradient-to-b from-blue-600 to-indigo-600 text-white p-5">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                    <FiUser className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold">{authority?.name || "TDO Officer"}</h3>
                                    <p className="text-xs opacity-90">{authority?.email || ""}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowMobileMenu(false)}
                                className="p-2 rounded-lg bg-white/20 hover:bg-white/30"
                            >
                                <FiX className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="px-3 py-1 bg-white/20 rounded-full text-xs">
                                {authority?.talukId || "Taluk"}
                            </div>
                            <div className={`px-3 py-1 rounded-full text-xs ${authority?.verified ? 'bg-green-500' : 'bg-yellow-500'}`}>
                                {authority?.verified ? t("approved") : t("pending")}
                            </div>
                        </div>
                    </div>

                    <div className="p-4 overflow-y-auto h-[calc(100%-120px)]">
                        {/* Main Navigation */}
                        <div className="mb-6">
                            <p className="text-xs font-semibold text-gray-400 mb-3">MAIN</p>
                            <nav className="space-y-2">
                                <MobileMenuItem
                                    icon={<FiHome className="w-5 h-5" />}
                                    label={t("dashboard")}
                                    onClick={() => navigateTo(`/${locale}/authority/tdo/dashboard`)}
                                    active={true}
                                />
                                <MobileMenuItem
                                    icon={<FiFileText className="w-5 h-5" />}
                                    label={t("requests")}
                                    badge={counts.pending}
                                    onClick={() => navigateTo(`/${locale}/authority/tdo/requests`)}
                                />
                                <MobileMenuItem
                                    icon={<FiMap className="w-5 h-5" />}
                                    label={t("map")}
                                    onClick={() => navigateTo(`/${locale}/authority/tdo/map`)}
                                />
                                <MobileMenuItem
                                    icon={<FiTrendingUp className="w-5 h-5" />}
                                    label={t("analytics")}
                                    onClick={() => navigateTo(`/${locale}/authority/tdo/analytics`)}
                                />
                            </nav>
                        </div>

                        {/* Quick Actions */}
                        <div className="mb-6">
                            <p className="text-xs font-semibold text-gray-400 mb-3">{t("quickActions")}</p>
                            <div className="grid grid-cols-2 gap-2">
                                <QuickActionButton
                                    icon={<FiDollarSign className="w-4 h-4" />}
                                    label={t("fundRequests")}
                                    onClick={() => navigateTo(`/${locale}/authority/tdo/requests`)}
                                    color="green"
                                />
                                <QuickActionButton
                                    icon={<FiCheckCircle className="w-4 h-4" />}
                                    label={t("fundApprove")}
                                    onClick={() => navigateTo(`/${locale}/authority/tdo/requests?status=pending`)}
                                    color="blue"
                                />
                                <QuickActionButton
                                    icon={<FiMap className="w-4 h-4" />}
                                    label={t("map")}
                                    onClick={() => navigateTo(`/${locale}/authority/tdo/map`)}
                                    color="purple"
                                />
                                <QuickActionButton
                                    icon={<FiBarChart2 className="w-4 h-4" />}
                                    label={t("analytics")}
                                    onClick={() => navigateTo(`/${locale}/authority/tdo/analytics`)}
                                    color="amber"
                                />
                            </div>
                        </div>

                        {/* Account */}
                        <div className="mb-6">
                            <p className="text-xs font-semibold text-gray-400 mb-3">ACCOUNT</p>
                            <nav className="space-y-2">
                                <MobileMenuItem
                                    icon={<FiUser className="w-5 h-5" />}
                                    label={t("profile")}
                                    onClick={() => navigateTo(`/${locale}/authority/tdo/profile`)}
                                />
                                <MobileMenuItem
                                    icon={<FiSettings className="w-5 h-5" />}
                                    label={t("settings")}
                                    onClick={() => navigateTo(`/${locale}/authority/tdo/settings`)}
                                />
                                <MobileMenuItem
                                    icon={<FiHelpCircle className="w-5 h-5" />}
                                    label={t("help")}
                                    onClick={() => navigateTo(`/${locale}/authority/tdo/help`)}
                                />
                            </nav>
                        </div>

                        {/* Logout */}
                        <div className="border-t border-gray-200 pt-4">
                            <button
                                onClick={() => setShowLogoutConfirm(true)}
                                className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all menu-item"
                            >
                                <FiLogOut className="w-5 h-5" />
                                <span className="font-semibold">{t("logout")}</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Logout Confirmation Modal */}
                {showLogoutConfirm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
                        <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-scaleIn">
                            <div className="text-center mb-4">
                                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <FiLogOut className="w-8 h-8 text-red-600" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">{t("logout")}</h3>
                                <p className="text-sm text-gray-600 mt-2">{t("logoutConfirm")}</p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowLogoutConfirm(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50"
                                >
                                    {t("cancel")}
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-800"
                                >
                                    {t("confirm")}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Content */}
                <div className="p-4">
                    {/* Error Messages */}
                    {err && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-2xl animate-slideIn">
                            <div className="flex items-start gap-2">
                                <FiAlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                                <p className="text-red-700 text-sm">{err}</p>
                            </div>
                        </div>
                    )}

                    {/* Welcome Card */}
                    <div className="bg-white rounded-2xl border border-blue-100 p-4 mb-6 shadow-sm animate-slideIn">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-blue-800/70">{t("welcome")}</p>
                                <h2 className="text-xl font-bold text-blue-900 mt-1">
                                    {authority?.name || "TDO Officer"}
                                </h2>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-blue-800/60">{t("taluk")}</p>
                                <p className="text-sm font-semibold text-blue-900">{authority?.talukId || "N/A"}</p>
                            </div>
                        </div>
                    </div>

                    {/* Stats Cards with Animation */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                        {tabs.map((tabItem, index) => (
                            <div
                                key={tabItem.key}
                                className={`border-2 ${tabItem.borderColor} rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 animate-slideIn`}
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className={`p-2 ${tabItem.bgColor} rounded-xl`}>
                                        {tabItem.icon}
                                    </div>
                                    <div className={`text-2xl font-bold ${tabItem.color} animate-pulse-slow`}>
                                        {animatedCounts[tabItem.key]}
                                    </div>
                                </div>
                                <div className="text-sm font-semibold text-gray-600">
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
                    <div className="flex gap-2 overflow-x-auto mb-4 pb-2">
                        {tabs.map((x, index) => {
                            const activeTab = tab === x.key;
                            return (
                                <button
                                    key={x.key}
                                    onClick={() => setTab(x.key)}
                                    disabled={!authority?.talukId}
                                    className={[
                                        "flex items-center gap-2 px-4 py-2 rounded-xl border font-bold whitespace-nowrap transition-all duration-300 flex-shrink-0 animate-fadeIn",
                                        activeTab
                                            ? "bg-blue-600 text-white border-blue-600 shadow-lg"
                                            : "bg-white text-blue-900 border-blue-200 hover:bg-blue-50",
                                        !authority?.talukId ? "opacity-50 cursor-not-allowed" : ""
                                    ].join(" ")}
                                    style={{ animationDelay: `${index * 100}ms` }}
                                >
                                    {x.icon}
                                    <span className="text-sm">{x.label}</span>
                                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeTab 
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
                                <span><strong>{filteredItems.length}</strong> {t("of")} <strong>{items.length}</strong> {t("requestsFound")}</span>
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                </div>

                {/* Animated Bottom Navigation */}
                <div className="fixed bottom-4 left-4 right-4 z-40">
                    <div className="bg-white/95 backdrop-blur-lg border-2 border-blue-100 rounded-2xl p-2 shadow-2xl animate-slideIn">
                        <div className="grid grid-cols-5 gap-1">
                            <BottomNavItem
                                icon={<FiHome className="w-5 h-5" />}
                                label={t("dashboard")}
                                onClick={() => navigateTo(`/${locale}/authority/tdo/dashboard`)}
                                active={true}
                                index={0}
                            />
                            <BottomNavItem
                                icon={<FiFileText className="w-5 h-5" />}
                                label={t("requests")}
                                onClick={() => navigateTo(`/${locale}/authority/tdo/requests`)}
                                badge={counts.pending}
                                index={1}
                            />
                            <BottomNavItem
                                icon={<FiMap className="w-5 h-5" />}
                                label={t("map")}
                                onClick={() => navigateTo(`/${locale}/authority/tdo/map`)}
                                index={2}
                            />
                            <BottomNavItem
                                icon={<FiTrendingUp className="w-5 h-5" />}
                                label={t("analytics")}
                                onClick={() => navigateTo(`/${locale}/authority/tdo/analytics`)}
                                index={3}
                            />
                            <BottomNavItem
                                icon={<FiUser className="w-5 h-5" />}
                                label={t("profile")}
                                onClick={() => navigateTo(`/${locale}/authority/tdo/profile`)}
                                index={4}
                            />
                        </div>
                    </div>
                </div>

                {/* Modal */}
                {open && active && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
                        <div className="relative w-full max-w-lg bg-white rounded-3xl border-2 border-blue-100 shadow-2xl p-6 max-h-[90vh] overflow-y-auto animate-scaleIn">
                            <div className="flex items-start justify-between gap-3 mb-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-blue-900">
                                        {t("reviewRequest")}
                                    </h2>
                                    <p className="text-sm text-blue-700 mt-1">
                                        {t("reviewDescription")}
                                    </p>
                                </div>
                                <button
                                    onClick={closeModal}
                                    className="p-2 rounded-xl border-2 border-blue-100 bg-white text-blue-900 hover:bg-blue-50 transition-colors"
                                >
                                    <FiX className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="p-5 bg-blue-50 border-2 border-blue-100 rounded-2xl">
                                    <div className="text-3xl font-bold text-blue-900 mb-3">
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
                                    <div className="p-5 bg-amber-50 border-2 border-amber-100 rounded-2xl">
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

                                        <div className="grid grid-cols-2 gap-3 mt-4">
                                            <button
                                                disabled={acting}
                                                onClick={() => act("approved")}
                                                className="rounded-2xl bg-gradient-to-r from-green-600 to-emerald-700 text-white font-bold py-4 disabled:opacity-60 hover:from-green-700 hover:to-emerald-800 transition-all duration-300 flex items-center justify-center gap-2"
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
                                                className="rounded-2xl bg-gradient-to-r from-red-600 to-rose-700 text-white font-bold py-4 disabled:opacity-60 hover:from-red-700 hover:to-rose-800 transition-all duration-300 flex items-center justify-center gap-2"
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

// Mobile Menu Item Component
function MobileMenuItem({ icon, label, onClick, badge, active }: {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    badge?: number;
    active?: boolean;
}) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all menu-item ${active 
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white' 
                : 'hover:bg-blue-50 text-gray-700'}`}
        >
            <div className="flex items-center gap-3">
                <span className={active ? 'text-white' : 'text-blue-600'}>{icon}</span>
                <span className="font-semibold">{label}</span>
            </div>
            {badge !== undefined && badge > 0 && (
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${active 
                    ? 'bg-white/20 text-white' 
                    : 'bg-amber-100 text-amber-800'}`}>
                    {badge}
                </span>
            )}
        </button>
    );
}

// Quick Action Button Component
function QuickActionButton({ icon, label, onClick, color }: {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    color: 'green' | 'blue' | 'purple' | 'amber';
}) {
    const colorClasses = {
        green: 'bg-green-50 text-green-600 hover:bg-green-100 border-green-200',
        blue: 'bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200',
        purple: 'bg-purple-50 text-purple-600 hover:bg-purple-100 border-purple-200',
        amber: 'bg-amber-50 text-amber-600 hover:bg-amber-100 border-amber-200',
    };

    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border ${colorClasses[color]} transition-all menu-item`}
        >
            {icon}
            <span className="text-xs mt-1 font-medium">{label}</span>
        </button>
    );
}

// Bottom Navigation Item Component
function BottomNavItem({ icon, label, onClick, badge, active, index }: {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    badge?: number;
    active?: boolean;
    index: number;
}) {
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300 menu-item animate-slideIn`}
            style={{ animationDelay: `${index * 50}ms` }}
        >
            <div className="relative">
                <div className={`p-1.5 rounded-lg transition-all ${active ? 'bg-gradient-to-b from-blue-600 to-indigo-600 text-white scale-110' : 'text-blue-600'}`}>
                    {icon}
                </div>
                {badge !== undefined && badge > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white font-bold animate-pulse">
                        {badge > 9 ? '9+' : badge}
                    </span>
                )}
            </div>
            <span className={`text-[10px] mt-1 font-semibold ${active ? 'text-blue-700' : 'text-gray-500'}`}>
                {label}
            </span>
            {active && (
                <div className="w-1 h-1 bg-blue-600 rounded-full mt-1 animate-pulse" />
            )}
        </button>
    );
}

// Notification Item Component
function NotificationItem({ notif }: { notif: any }) {
    const getIcon = (type: string) => {
        switch(type) {
            case 'request': return <FiDollarSign className="w-4 h-4 text-blue-500" />;
            case 'success': return <FiCheckCircle className="w-4 h-4 text-green-500" />;
            case 'pending': return <FiClock className="w-4 h-4 text-amber-500" />;
            default: return <FiBell className="w-4 h-4 text-gray-500" />;
        }
    };

    return (
        <div className={`px-4 py-3 hover:bg-blue-50 transition-colors ${!notif.read ? 'bg-blue-50/50' : ''}`}>
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                    {getIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{notif.title}</p>
                    <p className="text-xs text-gray-600 mt-1">{notif.message}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{notif.time}</p>
                </div>
                {!notif.read && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5" />
                )}
            </div>
        </div>
    );
}
