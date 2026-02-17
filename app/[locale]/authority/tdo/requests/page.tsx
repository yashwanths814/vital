// app/[locale]/authority/tdo/requests/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Screen from "../../../../components/Screen";
import { auth, db } from "../../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    updateDoc,
    serverTimestamp,
    Timestamp,
    getCountFromServer,
} from "firebase/firestore";
import {
    FiCheckCircle,
    FiXCircle,
    FiFileText,
    FiClock,
    FiAlertCircle,
    FiRefreshCw,
    FiDollarSign,
    FiTrendingUp,
    FiUser,
    FiLogOut,
    FiBarChart2,
    FiInbox,
    FiActivity,
    FiUsers,
    FiChevronRight,
    FiMessageSquare,
    FiCheck,
    FiX,
    FiHome,
    FiMenu,
    FiSearch,
    FiGrid,
    FiList,
    FiFilter,
    FiDownload,
    FiPrinter,
    FiEye,
    FiEdit,
    FiTrash2,
    FiCalendar,
    FiMapPin,
    FiPercent,
} from "react-icons/fi";

type Locale = "en" | "kn" | "hi";

type FundRequest = {
    id: string;
    status: "pending" | "approved" | "rejected";
    amount: number;
    purpose: string;
    remarks?: string;
    reviewedBy?: string;
    reviewedAt?: any;
    createdAt?: any;
    talukId: string;
    districtId: string;
    panchayatId?: string;
    pdoName?: string;
    issueTitle?: string;
    tdoComment?: string;
    reason?: string;
    issueId?: string;
};

function formatDate(v: any): string {
    try {
        if (!v) return "";
        if (v instanceof Timestamp) return v.toDate().toLocaleDateString();
        if (v?.toDate) return v.toDate().toLocaleDateString();
        if (typeof v === "string") return new Date(v).toLocaleDateString();
        return "";
    } catch {
        return "";
    }
}

function formatDateTime(v: any): string {
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

export default function TdoFundRequestsPage() {
    const router = useRouter();
    const { locale } = useParams() as { locale: Locale };

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [requests, setRequests] = useState<FundRequest[]>([]);
    const [filteredRequests, setFilteredRequests] = useState<FundRequest[]>([]);
    const [err, setErr] = useState("");
    const [tdo, setTdo] = useState<any>(null);
    const [debugInfo, setDebugInfo] = useState("");

    // UI States
    const [viewMode, setViewMode] = useState<"grid" | "list" | "compact">("grid");
    const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "rejected">("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState<"date" | "amount" | "status">("date");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

    // Modal States
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<FundRequest | null>(null);
    const [modalAction, setModalAction] = useState<"view" | "approve" | "reject">("view");
    const [remarks, setRemarks] = useState("");
    const [acting, setActing] = useState(false);

    // Stats
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        totalAmount: 0,
        pendingAmount: 0,
        approvedAmount: 0,
        rejectedAmount: 0,
    });

    const [animatedStats, setAnimatedStats] = useState({
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        totalAmount: 0,
        pendingAmount: 0,
        approvedAmount: 0,
        rejectedAmount: 0,
    });

    const navLock = useRef(false);

    const t = useMemo(() => {
        const L: Record<Locale, any> = {
            en: {
                title: "Fund Requests Management",
                subtitle: "Review and manage fund requests from PDOs",
                pending: "Pending",
                approve: "Approve",
                reject: "Reject",
                approved: "Approved",
                rejected: "Rejected",
                all: "All",
                amount: "Amount",
                purpose: "Purpose",
                remarks: "Remarks",
                comment: "Comment",
                empty: "No fund requests found",
                errPerm: "Unauthorized access",
                searchPlaceholder: "Search requests...",
                filter: "Filter",
                sort: "Sort",
                date: "Date",
                status: "Status",
                asc: "Ascending",
                desc: "Descending",
                view: "View",
                edit: "Edit",
                delete: "Delete",
                export: "Export",
                print: "Print",
                refresh: "Refresh",
                logout: "Logout",
                dashboard: "Dashboard",
                requests: "Requests",
                analytics: "Analytics",
                profile: "Profile",
                loading: "Loading...",
                total: "Total",
                totalAmount: "Total Amount",
                actionSuccess: "Action completed successfully",
                actionFailed: "Action failed",
                addComment: "Add comment (optional)",
                confirmApprove: "Are you sure you want to approve this request?",
                confirmReject: "Are you sure you want to reject this request?",
                yes: "Yes",
                no: "No",
                cancel: "Cancel",
                submit: "Submit",
                processing: "Processing...",
                requestDetails: "Request Details",
                createdAt: "Created",
                reviewedAt: "Reviewed",
                by: "by",
                noResults: "No matching requests found",
                clearFilters: "Clear Filters",
                viewDetails: "View Details",
                approveRequest: "Approve Request",
                rejectRequest: "Reject Request",
                amountInRupees: "Amount in ₹",
                purposeOfRequest: "Purpose of Request",
                panchayat: "Panchayat",
                pdo: "PDO",
                taluk: "Taluk",
                district: "District",
                back: "Back",
                next: "Next",
                page: "Page",
                of: "of",
                items: "items",
                perPage: "per page",
                gridView: "Grid View",
                listView: "List View",
                compactView: "Compact View",
            },
            kn: {
                title: "ಹಣ ವಿನಂತಿ ನಿರ್ವಹಣೆ",
                subtitle: "ಪಿಡಿಒಗಳಿಂದ ಹಣ ವಿನಂತಿಗಳನ್ನು ಪರಿಶೀಲಿಸಿ ಮತ್ತು ನಿರ್ವಹಿಸಿ",
                pending: "ಬಾಕಿ ಇದೆ",
                approve: "ಅನುಮೋದಿಸಿ",
                reject: "ನಿರಾಕರಿಸಿ",
                approved: "ಅನುಮೋದಿಸಲಾಗಿದೆ",
                rejected: "ನಿರಾಕರಿಸಲಾಗಿದೆ",
                all: "ಎಲ್ಲಾ",
                amount: "ಮೊತ್ತ",
                purpose: "ಉದ್ದೇಶ",
                remarks: "ಟಿಪ್ಪಣಿ",
                comment: "ಕಾಮೆಂಟ್",
                empty: "ಯಾವುದೇ ಹಣ ವಿನಂತಿಗಳು ಇಲ್ಲ",
                errPerm: "ಅನುಮತಿ ಇಲ್ಲ",
                searchPlaceholder: "ವಿನಂತಿಗಳನ್ನು ಹುಡುಕಿ...",
                filter: "ಫಿಲ್ಟರ್",
                sort: "ವಿಂಗಡಿಸಿ",
                date: "ದಿನಾಂಕ",
                status: "ಸ್ಥಿತಿ",
                asc: "ಆರೋಹಣ",
                desc: "ಅವರೋಹಣ",
                view: "ವೀಕ್ಷಿಸಿ",
                edit: "ಸಂಪಾದಿಸಿ",
                delete: "ಅಳಿಸಿ",
                export: "ಎಕ್ಸ್ಪೋರ್ಟ್",
                print: "ಪ್ರಿಂಟ್",
                refresh: "ರಿಫ್ರೆಶ್",
                logout: "ಲಾಗ್ ಔಟ್",
                dashboard: "ಡ್ಯಾಶ್ಬೋರ್ಡ್",
                requests: "ವಿನಂತಿಗಳು",
                analytics: "ವಿಶ್ಲೇಷಣೆ",
                profile: "ಪ್ರೊಫೈಲ್",
                loading: "ಲೋಡ್ ಆಗುತ್ತಿದೆ...",
                total: "ಒಟ್ಟು",
                totalAmount: "ಒಟ್ಟು ಮೊತ್ತ",
                actionSuccess: "ಕ್ರಿಯೆ ಯಶಸ್ವಿಯಾಗಿ ಪೂರ್ಣಗೊಂಡಿದೆ",
                actionFailed: "ಕ್ರಿಯೆ ವಿಫಲವಾಗಿದೆ",
                addComment: "ಕಾಮೆಂಟ್ ಸೇರಿಸಿ (ಐಚ್ಛಿಕ)",
                confirmApprove: "ನೀವು ಖಚಿತವಾಗಿ ಈ ವಿನಂತಿಯನ್ನು ಅನುಮೋದಿಸಲು ಬಯಸುವಿರಾ?",
                confirmReject: "ನೀವು ಖಚಿತವಾಗಿ ಈ ವಿನಂತಿಯನ್ನು ನಿರಾಕರಿಸಲು ಬಯಸುವಿರಾ?",
                yes: "ಹೌದು",
                no: "ಇಲ್ಲ",
                cancel: "ರದ್ದು",
                submit: "ಸಲ್ಲಿಸು",
                processing: "ಪ್ರೊಸೆಸಿಂಗ್ ಆಗುತ್ತಿದೆ...",
                requestDetails: "ವಿನಂತಿ ವಿವರಗಳು",
                createdAt: "ರಚಿಸಲಾಗಿದೆ",
                reviewedAt: "ಪರಿಶೀಲಿಸಲಾಗಿದೆ",
                by: "ಮೂಲಕ",
                noResults: "ಯಾವುದೇ ಹೊಂದಾಣಿಕೆಯ ವಿನಂತಿಗಳು ಕಂಡುಬಂದಿಲ್ಲ",
                clearFilters: "ಫಿಲ್ಟರ್ಗಳನ್ನು ತೆರವುಗೊಳಿಸಿ",
                viewDetails: "ವಿವರಗಳನ್ನು ವೀಕ್ಷಿಸಿ",
                approveRequest: "ವಿನಂತಿಯನ್ನು ಅನುಮೋದಿಸಿ",
                rejectRequest: "ವಿನಂತಿಯನ್ನು ನಿರಾಕರಿಸಿ",
                amountInRupees: "ರೂಪಾಯಿಗಳಲ್ಲಿ ಮೊತ್ತ",
                purposeOfRequest: "ವಿನಂತಿಯ ಉದ್ದೇಶ",
                panchayat: "ಪಂಚಾಯತ್",
                pdo: "ಪಿಡಿಒ",
                taluk: "ತಾಲ್ಲೂಕು",
                district: "ಜಿಲ್ಲೆ",
                back: "ಹಿಂದೆ",
                next: "ಮುಂದೆ",
                page: "ಪುಟ",
                of: "ನ",
                items: "ಐಟಂಗಳು",
                perPage: "ಪ್ರತಿ ಪುಟ",
                gridView: "ಗ್ರಿಡ್ ವೀಕ್ಷಣೆ",
                listView: "ಪಟ್ಟಿ ವೀಕ್ಷಣೆ",
                compactView: "ಸಂಕ್ಷಿಪ್ತ ವೀಕ್ಷಣೆ",
            },
            hi: {
                title: "फंड अनुरोध प्रबंधन",
                subtitle: "पीडीओ से फंड अनुरोधों की समीक्षा और प्रबंधन करें",
                pending: "लंबित",
                approve: "स्वीकृत करें",
                reject: "अस्वीकार करें",
                approved: "स्वीकृत",
                rejected: "अस्वीकृत",
                all: "सभी",
                amount: "राशि",
                purpose: "उद्देश्य",
                remarks: "टिप्पणी",
                comment: "टिप्पणी",
                empty: "कोई फंड अनुरोध नहीं मिला",
                errPerm: "अनधिकृत पहुंच",
                searchPlaceholder: "अनुरोध खोजें...",
                filter: "फ़िल्टर",
                sort: "क्रमबद्ध करें",
                date: "तारीख",
                status: "स्थिति",
                asc: "आरोही",
                desc: "अवरोही",
                view: "देखें",
                edit: "संपादित करें",
                delete: "हटाएं",
                export: "निर्यात",
                print: "प्रिंट",
                refresh: "ताज़ा करें",
                logout: "लॉग आउट",
                dashboard: "डैशबोर्ड",
                requests: "अनुरोध",
                analytics: "विश्लेषण",
                profile: "प्रोफ़ाइल",
                loading: "लोड हो रहा है...",
                total: "कुल",
                totalAmount: "कुल राशि",
                actionSuccess: "कार्रवाई सफलतापूर्वक पूरी हुई",
                actionFailed: "कार्रवाई विफल",
                addComment: "टिप्पणी जोड़ें (वैकल्पिक)",
                confirmApprove: "क्या आप वाकई इस अनुरोध को स्वीकृत करना चाहते हैं?",
                confirmReject: "क्या आप वाकई इस अनुरोध को अस्वीकार करना चाहते हैं?",
                yes: "हाँ",
                no: "नहीं",
                cancel: "रद्द करें",
                submit: "सबमिट करें",
                processing: "प्रसंस्करण...",
                requestDetails: "अनुरोध विवरण",
                createdAt: "बनाया गया",
                reviewedAt: "समीक्षा की गई",
                by: "द्वारा",
                noResults: "कोई मिलते अनुरोध नहीं मिले",
                clearFilters: "फ़िल्टर साफ़ करें",
                viewDetails: "विवरण देखें",
                approveRequest: "अनुरोध स्वीकृत करें",
                rejectRequest: "अनुरोध अस्वीकार करें",
                amountInRupees: "रुपये में राशि",
                purposeOfRequest: "अनुरोध का उद्देश्य",
                panchayat: "पंचायत",
                pdo: "पीडीओ",
                taluk: "तालुका",
                district: "जिला",
                back: "पीछे",
                next: "आगे",
                page: "पृष्ठ",
                of: "का",
                items: "आइटम",
                perPage: "प्रति पृष्ठ",
                gridView: "ग्रिड दृश्य",
                listView: "सूची दृश्य",
                compactView: "संक्षिप्त दृश्य",
            },
        };
        return L[locale] || L.en;
    }, [locale]);

    // Calculate statistics
    const calculateStats = (reqs: FundRequest[]) => {
        const stats = {
            total: reqs.length,
            pending: reqs.filter(r => r.status === "pending").length,
            approved: reqs.filter(r => r.status === "approved").length,
            rejected: reqs.filter(r => r.status === "rejected").length,
            totalAmount: reqs.reduce((sum, r) => sum + (r.amount || 0), 0),
            pendingAmount: reqs.filter(r => r.status === "pending")
                .reduce((sum, r) => sum + (r.amount || 0), 0),
            approvedAmount: reqs.filter(r => r.status === "approved")
                .reduce((sum, r) => sum + (r.amount || 0), 0),
            rejectedAmount: reqs.filter(r => r.status === "rejected")
                .reduce((sum, r) => sum + (r.amount || 0), 0),
        };

        setStats(stats);
        
        // Animate stats
        setTimeout(() => {
            setAnimatedStats(stats);
        }, 300);
    };

    // Load requests and statistics
    const loadRequests = async (uid: string) => {
        try {
            setLoading(true);
            setErr("");

            // Get TDO profile
            const tdoSnap = await getDoc(doc(db, "authorities", uid));
            if (!tdoSnap.exists()) throw new Error(t.errPerm);

            const tdoData = tdoSnap.data();
            if (tdoData.role !== "tdo" || tdoData.verified !== true) {
                router.replace(`/${locale}/authority/status`);
                return;
            }

            if (!tdoData.talukId) {
                throw new Error("Taluk ID not found in profile");
            }

            setTdo(tdoData);

            // Load requests for this taluk
            const q = query(
                collection(db, "fund_requests"),
                where("talukId", "==", tdoData.talukId),
                orderBy("createdAt", "desc")
            );

            const snap = await getDocs(q);
            const requestsData = snap.docs.map((d) => ({ 
                id: d.id, 
                ...(d.data() as Omit<FundRequest, 'id'>)
            })) as FundRequest[];

            setRequests(requestsData);
            setFilteredRequests(requestsData);
            calculateStats(requestsData);

        } catch (e: any) {
            console.error("Load error:", e);
            setErr(e.message || t.errPerm);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Apply filters and sorting
    useEffect(() => {
        let result = [...requests];

        // Apply status filter
        if (filterStatus !== "all") {
            result = result.filter(r => r.status === filterStatus);
        }

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(r =>
                (r.purpose?.toLowerCase().includes(query)) ||
                (r.remarks?.toLowerCase().includes(query)) ||
                (r.panchayatId?.toLowerCase().includes(query)) ||
                (r.pdoName?.toLowerCase().includes(query)) ||
                (r.amount?.toString().includes(query)) ||
                (r.reason?.toLowerCase().includes(query))
            );
        }

        // Apply sorting
        result.sort((a, b) => {
            let aVal, bVal;

            switch (sortBy) {
                case "amount":
                    aVal = a.amount || 0;
                    bVal = b.amount || 0;
                    break;
                case "status":
                    aVal = a.status;
                    bVal = b.status;
                    break;
                case "date":
                default:
                    aVal = a.createdAt;
                    bVal = b.createdAt;
                    break;
            }

            if (sortOrder === "asc") {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });

        setFilteredRequests(result);
    }, [requests, filterStatus, searchQuery, sortBy, sortOrder]);

    // Handle auth state
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            if (!u) {
                router.replace(`/${locale}/authority/login`);
                return;
            }
            if (!navLock.current) {
                navLock.current = true;
                loadRequests(u.uid);
            }
        });
        return () => unsub();
    }, [locale]);

    // Handle actions
    const handleAction = async (id: string, status: "approved" | "rejected") => {
        if (!remarks.trim() && status === "rejected") {
            alert("Please provide remarks for rejection");
            return;
        }

        setActing(true);
        try {
            await updateDoc(doc(db, "fund_requests", id), {
                status,
                remarks: remarks.trim(),
                reviewedBy: auth.currentUser?.uid,
                reviewedAt: serverTimestamp(),
                tdoComment: remarks.trim(),
            });

            // Update local state
            setRequests(prev => prev.map(r => 
                r.id === id 
                    ? { 
                        ...r, 
                        status, 
                        remarks: remarks.trim(),
                        tdoComment: remarks.trim(),
                        reviewedAt: new Date()
                    } 
                    : r
            ));

            setModalOpen(false);
            setSelectedRequest(null);
            setRemarks("");
            
            alert(t.actionSuccess);
        } catch (e: any) {
            console.error("Action error:", e);
            alert(t.actionFailed);
        } finally {
            setActing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        if (auth.currentUser) {
            loadRequests(auth.currentUser.uid);
        }
    };

    const handleLogout = async () => {
        try {
            await auth.signOut();
            router.replace(`/${locale}/role-select`);
        } catch (e) {
            console.error(e);
        }
    };

    const openModal = (request: FundRequest, action: "view" | "approve" | "reject" = "view") => {
        setSelectedRequest(request);
        setModalAction(action);
        setRemarks(request.tdoComment || "");
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setSelectedRequest(null);
        setRemarks("");
    };

    const clearFilters = () => {
        setFilterStatus("all");
        setSearchQuery("");
        setSortBy("date");
        setSortOrder("desc");
    };

    // View mode options
    const viewModes = [
        { key: "grid" as const, icon: FiGrid, label: t.gridView },
        { key: "list" as const, icon: FiList, label: t.listView },
        { key: "compact" as const, icon: FiMenu, label: t.compactView },
    ];

    // Status filter options
    const statusFilters = [
        { key: "all" as const, label: t.all, color: "bg-blue-100 text-blue-800" },
        { key: "pending" as const, label: t.pending, color: "bg-amber-100 text-amber-800" },
        { key: "approved" as const, label: t.approved, color: "bg-green-100 text-green-800" },
        { key: "rejected" as const, label: t.rejected, color: "bg-red-100 text-red-800" },
    ];

    // Sort options
    const sortOptions = [
        { key: "date" as const, label: t.date },
        { key: "amount" as const, label: t.amount },
        { key: "status" as const, label: t.status },
    ];

    if (loading && !refreshing) {
        return (
            <Screen padded>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
                        <p className="text-blue-700 font-semibold">{t.loading}</p>
                    </div>
                </div>
            </Screen>
        );
    }

    return (
        <Screen padded>
            <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4 pb-24">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-blue-900">
                                {t.title}
                            </h1>
                            <p className="text-blue-700/80 mt-1 text-sm flex items-center gap-2">
                                <FiActivity className="w-4 h-4" />
                                {t.subtitle}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleRefresh}
                                disabled={refreshing}
                                className="p-2 rounded-lg border border-blue-100 bg-white hover:bg-blue-50 transition-colors"
                                title={t.refresh}
                            >
                                <FiRefreshCw className={`w-5 h-5 text-blue-700 ${refreshing ? "animate-spin" : ""}`} />
                            </button>
                            <button
                                onClick={handleLogout}
                                className="p-2 rounded-lg border border-red-100 bg-white text-red-600 hover:bg-red-50 transition-colors"
                                title={t.logout}
                            >
                                <FiLogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="relative mb-4">
                        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder={t.searchPlaceholder}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white border-2 border-blue-100 rounded-2xl text-blue-900 placeholder-blue-400 focus:outline-none focus:border-blue-300 transition-all"
                        />
                    </div>
                </div>

                {/* Error Messages */}
                {err && (
                    <div className="mb-4 p-4 bg-red-50 border-2 border-red-100 rounded-2xl animate-fadeIn">
                        <p className="text-red-700 text-sm">{err}</p>
                    </div>
                )}

                {/* Statistics Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    {/* Total Requests */}
                    <div className="bg-white border-2 border-blue-100 rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <FiFileText className="w-5 h-5 text-blue-700" />
                            </div>
                            <span className="text-xs font-bold px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                                {animatedStats.total}
                            </span>
                        </div>
                        <div className="text-2xl font-bold text-blue-900 mb-1">
                            {animatedStats.total}
                        </div>
                        <div className="text-sm text-gray-600">{t.total}</div>
                    </div>

                    {/* Pending */}
                    <div className="bg-white border-2 border-amber-100 rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-2 bg-amber-100 rounded-lg">
                                <FiClock className="w-5 h-5 text-amber-700" />
                            </div>
                            <span className="text-xs font-bold px-2 py-1 rounded-full bg-amber-100 text-amber-800">
                                {animatedStats.pending}
                            </span>
                        </div>
                        <div className="text-2xl font-bold text-amber-900 mb-1">
                            {animatedStats.pending}
                        </div>
                        <div className="text-sm text-gray-600">{t.pending}</div>
                    </div>

                    {/* Approved */}
                    <div className="bg-white border-2 border-green-100 rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <FiCheckCircle className="w-5 h-5 text-green-700" />
                            </div>
                            <span className="text-xs font-bold px-2 py-1 rounded-full bg-green-100 text-green-800">
                                {animatedStats.approved}
                            </span>
                        </div>
                        <div className="text-2xl font-bold text-green-900 mb-1">
                            {animatedStats.approved}
                        </div>
                        <div className="text-sm text-gray-600">{t.approved}</div>
                    </div>

                    {/* Rejected */}
                    <div className="bg-white border-2 border-red-100 rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-2 bg-red-100 rounded-lg">
                                <FiXCircle className="w-5 h-5 text-red-700" />
                            </div>
                            <span className="text-xs font-bold px-2 py-1 rounded-full bg-red-100 text-red-800">
                                {animatedStats.rejected}
                            </span>
                        </div>
                        <div className="text-2xl font-bold text-red-900 mb-1">
                            {animatedStats.rejected}
                        </div>
                        <div className="text-sm text-gray-600">{t.rejected}</div>
                    </div>
                </div>

                {/* Control Bar */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    {/* Status Filters */}
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <FiFilter className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-semibold text-blue-900">{t.filter}:</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {statusFilters.map((filter) => (
                                <button
                                    key={filter.key}
                                    onClick={() => setFilterStatus(filter.key)}
                                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${filterStatus === filter.key
                                            ? `${filter.color} border-2 border-current`
                                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                        }`}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* View Mode Toggle */}
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-semibold text-blue-900">{t.view}:</span>
                        </div>
                        <div className="flex bg-white border border-blue-100 rounded-lg p-1">
                            {viewModes.map((mode) => (
                                <button
                                    key={mode.key}
                                    onClick={() => setViewMode(mode.key)}
                                    className={`p-2 rounded flex items-center gap-1 ${viewMode === mode.key
                                            ? "bg-blue-100 text-blue-700"
                                            : "text-gray-600 hover:bg-blue-50"
                                        }`}
                                    title={mode.label}
                                >
                                    <mode.icon className="w-4 h-4" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sort Controls */}
                <div className="flex flex-wrap gap-3 mb-6">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-blue-900">{t.sort}:</span>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-sm text-blue-900 focus:outline-none focus:border-blue-300"
                        >
                            {sortOptions.map((option) => (
                                <option key={option.key} value={option.key}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-blue-900">{t.order}:</span>
                        <button
                            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                            className="px-3 py-1.5 rounded-lg border border-blue-200 bg-white text-blue-900 hover:bg-blue-50 text-sm font-medium"
                        >
                            {sortOrder === "asc" ? t.asc : t.desc}
                        </button>
                    </div>

                    {(filterStatus !== "all" || searchQuery || sortBy !== "date" || sortOrder !== "desc") && (
                        <button
                            onClick={clearFilters}
                            className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 text-sm font-medium ml-auto"
                        >
                            {t.clearFilters}
                        </button>
                    )}
                </div>

                {/* Requests List */}
                <div className="mb-20">
                    {refreshing ? (
                        <div className="text-center py-10">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mb-3"></div>
                            <p className="text-blue-700 font-semibold">{t.loading}</p>
                        </div>
                    ) : filteredRequests.length === 0 ? (
                        <div className="rounded-2xl border-2 border-blue-100 bg-white p-8 text-center animate-fadeIn">
                            <FiInbox className="w-12 h-12 text-blue-300 mx-auto mb-4" />
                            <p className="text-blue-700 font-semibold mb-2">
                                {searchQuery || filterStatus !== "all" ? t.noResults : t.empty}
                            </p>
                            {(searchQuery || filterStatus !== "all") && (
                                <button
                                    onClick={clearFilters}
                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                >
                                    {t.clearFilters}
                                </button>
                            )}
                        </div>
                    ) : viewMode === "grid" ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredRequests.map((req) => (
                                <div
                                    key={req.id}
                                    className="bg-white border-2 border-blue-100 rounded-2xl p-4 hover:shadow-lg transition-all duration-300 animate-fadeInUp"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className={`p-2 rounded-xl ${req.status === "pending"
                                                ? "bg-amber-100 text-amber-700"
                                                : req.status === "approved"
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-red-100 text-red-700"
                                            }`}>
                                            <FiDollarSign className="w-5 h-5" />
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${req.status === "pending"
                                                ? "bg-amber-100 text-amber-800"
                                                : req.status === "approved"
                                                    ? "bg-green-100 text-green-800"
                                                    : "bg-red-100 text-red-800"
                                            }`}>
                                            {req.status === "pending" ? t.pending :
                                                req.status === "approved" ? t.approved :
                                                    t.rejected}
                                        </span>
                                    </div>
                                    <div className="text-2xl font-bold text-blue-900 mb-2">
                                        ₹{req.amount?.toLocaleString() || "0"}
                                    </div>
                                    <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                                        {req.purpose || req.reason || t.purposeOfRequest}
                                    </p>
                                    <div className="text-xs text-gray-500 mb-4 flex items-center gap-1">
                                        <FiCalendar className="w-3 h-3" />
                                        {formatDate(req.createdAt)}
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => openModal(req, "view")}
                                            className="flex-1 bg-blue-600 text-white font-semibold py-2 rounded-xl hover:bg-blue-700 transition-colors"
                                        >
                                            {t.viewDetails}
                                        </button>
                                        {req.status === "pending" && (
                                            <>
                                                <button
                                                    onClick={() => openModal(req, "approve")}
                                                    className="p-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                                                    title={t.approve}
                                                >
                                                    <FiCheck className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => openModal(req, "reject")}
                                                    className="p-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                                                    title={t.reject}
                                                >
                                                    <FiX className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : viewMode === "list" ? (
                        <div className="space-y-3">
                            {filteredRequests.map((req) => (
                                <div
                                    key={req.id}
                                    className="bg-white border-2 border-blue-100 rounded-2xl p-4 hover:shadow-md transition-all duration-200 animate-fadeInUp"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className={`p-2 rounded-xl ${req.status === "pending"
                                                        ? "bg-amber-100 text-amber-700"
                                                        : req.status === "approved"
                                                            ? "bg-green-100 text-green-700"
                                                            : "bg-red-100 text-red-700"
                                                    }`}>
                                                    <FiDollarSign className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="text-xl font-bold text-blue-900">
                                                        ₹{req.amount?.toLocaleString() || "0"}
                                                    </div>
                                                    <div className="text-sm text-blue-700">
                                                        {req.panchayatId || t.panchayat}
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-700 mb-2">
                                                {req.purpose || req.reason || t.purposeOfRequest}
                                            </p>
                                            <div className="flex items-center gap-3 text-xs text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <FiCalendar className="w-3 h-3" />
                                                    {formatDate(req.createdAt)}
                                                </span>
                                                {req.pdoName && (
                                                    <span className="flex items-center gap-1">
                                                        <FiUser className="w-3 h-3" />
                                                        {req.pdoName}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <button
                                                onClick={() => openModal(req, "view")}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-sm transition-colors"
                                            >
                                                {t.viewDetails}
                                            </button>
                                            {req.status === "pending" && (
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => openModal(req, "approve")}
                                                        className="flex-1 p-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                                                        title={t.approve}
                                                    >
                                                        <FiCheck className="w-3 h-3" />
                                                    </button>
                                                    <button
                                                        onClick={() => openModal(req, "reject")}
                                                        className="flex-1 p-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                                                        title={t.reject}
                                                    >
                                                        <FiX className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            )}
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold text-center ${req.status === "pending"
                                                    ? "bg-amber-100 text-amber-800"
                                                    : req.status === "approved"
                                                        ? "bg-green-100 text-green-800"
                                                        : "bg-red-100 text-red-800"
                                                }`}>
                                                {req.status === "pending" ? t.pending :
                                                    req.status === "approved" ? t.approved :
                                                        t.rejected}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        // Compact View
                        <div className="space-y-2">
                            {filteredRequests.map((req) => (
                                <div
                                    key={req.id}
                                    className="bg-white border border-blue-100 rounded-xl p-3 hover:bg-blue-50 transition-colors animate-fadeInUp"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 flex-1">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${req.status === "pending"
                                                    ? "bg-amber-100 text-amber-700"
                                                    : req.status === "approved"
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-red-100 text-red-700"
                                                }`}>
                                                <FiDollarSign className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-semibold text-blue-900 truncate">
                                                    ₹{req.amount?.toLocaleString() || "0"}
                                                </div>
                                                <div className="text-xs text-gray-600 truncate">
                                                    {req.purpose || req.reason || t.purposeOfRequest}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${req.status === "pending"
                                                    ? "bg-amber-100 text-amber-800"
                                                    : req.status === "approved"
                                                        ? "bg-green-100 text-green-800"
                                                        : "bg-red-100 text-red-800"
                                                }`}>
                                                {req.status === "pending" ? "P" :
                                                    req.status === "approved" ? "A" : "R"}
                                            </span>
                                            <button
                                                onClick={() => openModal(req, "view")}
                                                className="p-1.5 text-blue-600 hover:text-blue-800"
                                                title={t.viewDetails}
                                            >
                                                <FiEye className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Bottom Navigation */}
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-blue-100 p-3 z-40">
                    <div className="grid grid-cols-4 gap-2">
                        <button
                            onClick={() => router.push(`/${locale}/authority/tdo/dashboard`)}
                            className="flex flex-col items-center p-2 rounded-xl hover:bg-blue-50 transition-colors"
                        >
                            <FiHome className="w-5 h-5 text-blue-600" />
                            <span className="text-xs mt-1 text-blue-700 font-medium">{t.dashboard}</span>
                        </button>
                        <button
                            onClick={() => router.push(`/${locale}/authority/tdo/requests`)}
                            className="flex flex-col items-center p-2 rounded-xl bg-blue-50 border border-blue-200"
                        >
                            <FiFileText className="w-5 h-5 text-blue-700" />
                            <span className="text-xs mt-1 text-blue-800 font-medium">{t.requests}</span>
                        </button>
                        <button
                            onClick={() => router.push(`/${locale}/authority/tdo/analytics`)}
                            className="flex flex-col items-center p-2 rounded-xl hover:bg-blue-50 transition-colors"
                        >
                            <FiTrendingUp className="w-5 h-5 text-blue-600" />
                            <span className="text-xs mt-1 text-blue-700 font-medium">{t.analytics}</span>
                        </button>
                        <button
                            onClick={() => router.push(`/${locale}/authority/tdo/profile`)}
                            className="flex flex-col items-center p-2 rounded-xl hover:bg-blue-50 transition-colors"
                        >
                            <FiUser className="w-5 h-5 text-blue-600" />
                            <span className="text-xs mt-1 text-blue-700 font-medium">{t.profile}</span>
                        </button>
                    </div>
                </div>

                {/* Modal */}
                {modalOpen && selectedRequest && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
                        <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
                        <div className="relative w-full max-w-md bg-white rounded-2xl border-2 border-blue-100 p-6 max-h-[90vh] overflow-y-auto">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h2 className="text-xl font-bold text-blue-900">
                                        {modalAction === "view" ? t.requestDetails :
                                            modalAction === "approve" ? t.approveRequest :
                                                t.rejectRequest}
                                    </h2>
                                </div>
                                <button
                                    onClick={closeModal}
                                    className="p-2 rounded-lg border border-blue-100 bg-white text-blue-900 hover:bg-blue-50"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="space-y-4">
                                {/* Amount and Status */}
                                <div className="p-4 bg-blue-50 rounded-xl">
                                    <div className="text-2xl font-bold text-blue-900 mb-2">
                                        ₹{selectedRequest.amount?.toLocaleString() || "0"}
                                    </div>
                                    <div className="space-y-1 text-sm">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-blue-900">{t.status}:</span>
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${selectedRequest.status === "pending"
                                                    ? "bg-amber-100 text-amber-800"
                                                    : selectedRequest.status === "approved"
                                                        ? "bg-green-100 text-green-800"
                                                        : "bg-red-100 text-red-800"
                                                }`}>
                                                {selectedRequest.status === "pending" ? t.pending :
                                                    selectedRequest.status === "approved" ? t.approved :
                                                        t.rejected}
                                            </span>
                                        </div>
                                        {selectedRequest.panchayatId && (
                                            <div><span className="font-semibold text-blue-900">{t.panchayat}:</span> {selectedRequest.panchayatId}</div>
                                        )}
                                        {selectedRequest.pdoName && (
                                            <div><span className="font-semibold text-blue-900">{t.pdo}:</span> {selectedRequest.pdoName}</div>
                                        )}
                                        {selectedRequest.createdAt && (
                                            <div><span className="font-semibold text-blue-900">{t.createdAt}:</span> {formatDateTime(selectedRequest.createdAt)}</div>
                                        )}
                                        {selectedRequest.reviewedAt && (
                                            <div><span className="font-semibold text-blue-900">{t.reviewedAt}:</span> {formatDateTime(selectedRequest.reviewedAt)}</div>
                                        )}
                                    </div>
                                </div>

                                {/* Purpose/Reason */}
                                {(selectedRequest.purpose || selectedRequest.reason) && (
                                    <div className="p-4 bg-amber-50 rounded-xl">
                                        <div className="flex items-center gap-2 mb-2">
                                            <FiMessageSquare className="w-4 h-4 text-amber-700" />
                                            <span className="font-bold text-amber-900">{t.purposeOfRequest}</span>
                                        </div>
                                        <p className="text-sm text-amber-800">
                                            {selectedRequest.purpose || selectedRequest.reason}
                                        </p>
                                    </div>
                                )}

                                {/* Existing Remarks */}
                                {selectedRequest.remarks && (
                                    <div className="p-4 bg-gray-50 rounded-xl">
                                        <div className="flex items-center gap-2 mb-2">
                                            <FiFileText className="w-4 h-4 text-gray-700" />
                                            <span className="font-bold text-gray-900">{t.remarks}</span>
                                        </div>
                                        <p className="text-sm text-gray-800">
                                            {selectedRequest.remarks}
                                        </p>
                                    </div>
                                )}

                                {/* Action Form (for pending requests) */}
                                {selectedRequest.status === "pending" && modalAction !== "view" && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-bold text-blue-900 mb-2">
                                                {t.comment} {modalAction === "reject" && " *"}
                                            </label>
                                            <textarea
                                                value={remarks}
                                                onChange={(e) => setRemarks(e.target.value)}
                                                rows={3}
                                                className="w-full rounded-xl border-2 border-blue-200 bg-white p-3 text-blue-900 focus:outline-none focus:border-blue-300 text-sm"
                                                placeholder={t.addComment}
                                                required={modalAction === "reject"}
                                            />
                                        </div>

                                        <div className="flex gap-3">
                                            <button
                                                onClick={closeModal}
                                                className="flex-1 rounded-xl border-2 border-blue-200 bg-white text-blue-900 font-bold py-3 hover:bg-blue-50"
                                            >
                                                {t.cancel}
                                            </button>
                                            <button
                                                disabled={acting || (modalAction === "reject" && !remarks.trim())}
                                                onClick={() => handleAction(selectedRequest.id, modalAction === "approve" ? "approved" : "rejected")}
                                                className={`flex-1 rounded-xl font-bold py-3 ${modalAction === "approve"
                                                        ? "bg-green-600 text-white hover:bg-green-700"
                                                        : "bg-red-600 text-white hover:bg-red-700"
                                                    } disabled:opacity-60`}
                                            >
                                                {acting ? (
                                                    <span className="flex items-center justify-center gap-2">
                                                        <FiRefreshCw className="animate-spin w-4 h-4" />
                                                        {t.processing}
                                                    </span>
                                                ) : modalAction === "approve" ? t.approve : t.reject}
                                            </button>
                                        </div>
                                    </>
                                )}

                                {/* View only for non-pending or view mode */}
                                {selectedRequest.status !== "pending" && selectedRequest.tdoComment && (
                                    <div className="p-3 bg-gray-50 rounded-xl">
                                        <div className="flex items-center gap-2 text-sm text-gray-700">
                                            <FiMessageSquare className="w-4 h-4" />
                                            <span className="font-semibold">{t.comment}:</span>
                                            <span>{selectedRequest.tdoComment}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Add CSS animations */}
                <style jsx global>{`
                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                    
                    @keyframes fadeInUp {
                        from {
                            opacity: 0;
                            transform: translateY(20px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }
                    
                    .animate-fadeIn {
                        animation: fadeIn 0.3s ease-out;
                    }
                    
                    .animate-fadeInUp {
                        animation: fadeInUp 0.4s ease-out;
                    }
                `}</style>
            </div>
        </Screen>
    );
}