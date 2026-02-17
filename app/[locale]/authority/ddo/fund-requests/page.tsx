"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth, db } from "../../../../lib/firebase";
import { doc, getDoc, collection, query, where, getDocs, Timestamp, updateDoc } from "firebase/firestore";
import Screen from "../../../../components/Screen";

type Locale = "en" | "kn" | "hi";

interface FundRequest {
    id: string;
    displayId: string;
    amount: number;
    purpose: string;
    reason: string;
    status: "pending" | "approved" | "rejected" | "disbursed";
    requestedBy: string;
    requestedByName: string;
    panchayat: string;
    taluk: string;
    district: string;
    createdAt: Date;
    documents: string[];
    tdoComment?: string;
    tdoApprovedAt?: Date;
    ddoComment?: string;
    ddoApprovedAt?: Date;
    priority: "low" | "medium" | "high";
}

export default function FundRequestsPage() {
    const router = useRouter();
    const params = useParams() as { locale?: string };
    const locale = (params?.locale || "en") as Locale;
    const [fundRequests, setFundRequests] = useState<FundRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [district, setDistrict] = useState<string | null>(null);
    const [districtId, setDistrictId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [priorityFilter, setPriorityFilter] = useState("all");
    const [selectedRequest, setSelectedRequest] = useState<FundRequest | null>(null);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [comment, setComment] = useState("");
    const [processing, setProcessing] = useState(false);

    /* 🌐 Multilingual text */
    const t = useMemo(() => {
        const L: Record<Locale, any> = {
            en: {
                title: "Fund Requests",
                subtitle: "Review and approve fund requests from TDOs",
                back: "Back to Dashboard",
                search: "Search requests...",
                filters: {
                    status: "Status",
                    priority: "Priority",
                    all: "All",
                    pending: "Pending",
                    approved: "Approved",
                    rejected: "Rejected",
                    disbursed: "Disbursed",
                    low: "Low",
                    medium: "Medium",
                    high: "High"
                },
                table: {
                    id: "Request ID",
                    amount: "Amount",
                    purpose: "Purpose",
                    panchayat: "Gram Panchayat",
                    taluk: "Taluk",
                    status: "Status",
                    priority: "Priority",
                    date: "Requested Date",
                    action: "Action",
                    view: "View Details",
                    approve: "Approve",
                    reject: "Reject",
                    disburse: "Mark Disbursed"
                },
                stats: {
                    total: "Total Requests",
                    pending: "Pending",
                    approved: "Approved",
                    amount: "Total Amount"
                },
                actions: {
                    approve: "Approve Request",
                    reject: "Reject Request",
                    comment: "Add Comment",
                    submit: "Submit",
                    cancel: "Cancel",
                    download: "Download Document"
                },
                modal: {
                    approveTitle: "Approve Fund Request",
                    rejectTitle: "Reject Fund Request",
                    commentPlaceholder: "Add your comment (optional)...",
                    confirmApprove: "Are you sure you want to approve this request?",
                    confirmReject: "Are you sure you want to reject this request?"
                },
                noData: "No fund requests found",
                loading: "Loading fund requests...",
                error: "Failed to load data",
                success: {
                    approved: "Fund request approved successfully",
                    rejected: "Fund request rejected successfully",
                    disbursed: "Fund request marked as disbursed"
                }
            },
            kn: {
                title: "ನಿಧಿ ವಿನಂತಿಗಳು",
                subtitle: "TDOs ನಿಂದ ನಿಧಿ ವಿನಂತಿಗಳನ್ನು ಪರಿಶೀಲಿಸಿ ಮತ್ತು ಅನುಮೋದಿಸಿ",
                back: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಹಿಂದಿರುಗಿ",
                search: "ವಿನಂತಿಗಳನ್ನು ಹುಡುಕಿ...",
                filters: {
                    status: "ಸ್ಥಿತಿ",
                    priority: "ಪ್ರಾಧಾನ್ಯತೆ",
                    all: "ಎಲ್ಲಾ",
                    pending: "ಬಾಕಿ",
                    approved: "ಅನುಮೋದಿತ",
                    rejected: "ನಿರಾಕರಿಸಲಾಗಿದೆ",
                    disbursed: "ಹಂಚಲಾಗಿದೆ",
                    low: "ಕಡಿಮೆ",
                    medium: "ಮಧ್ಯಮ",
                    high: "ಹೆಚ್ಚು"
                },
                table: {
                    id: "ವಿನಂತಿ ಐಡಿ",
                    amount: "ಮೊತ್ತ",
                    purpose: "ಉದ್ದೇಶ",
                    panchayat: "ಗ್ರಾಮ ಪಂಚಾಯತ್",
                    taluk: "ತಾಲ್ಲೂಕು",
                    status: "ಸ್ಥಿತಿ",
                    priority: "ಪ್ರಾಧಾನ್ಯತೆ",
                    date: "ವಿನಂತಿಸಿದ ದಿನಾಂಕ",
                    action: "ಕ್ರಿಯೆ",
                    view: "ವಿವರಗಳನ್ನು ವೀಕ್ಷಿಸಿ",
                    approve: "ಅನುಮೋದಿಸಿ",
                    reject: "ನಿರಾಕರಿಸಿ",
                    disburse: "ಹಂಚಲಾಗಿದೆ ಎಂದು ಗುರುತಿಸಿ"
                },
                stats: {
                    total: "ಒಟ್ಟು ವಿನಂತಿಗಳು",
                    pending: "ಬಾಕಿ",
                    approved: "ಅನುಮೋದಿತ",
                    amount: "ಒಟ್ಟು ಮೊತ್ತ"
                },
                actions: {
                    approve: "ವಿನಂತಿಯನ್ನು ಅನುಮೋದಿಸಿ",
                    reject: "ವಿನಂತಿಯನ್ನು ನಿರಾಕರಿಸಿ",
                    comment: "ಕಾಮೆಂಟ್ ಸೇರಿಸಿ",
                    submit: "ಸಲ್ಲಿಸಿ",
                    cancel: "ರದ್ದುಮಾಡಿ",
                    download: "ಡಾಕ್ಯುಮೆಂಟ್ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ"
                },
                modal: {
                    approveTitle: "ನಿಧಿ ವಿನಂತಿಯನ್ನು ಅನುಮೋದಿಸಿ",
                    rejectTitle: "ನಿಧಿ ವಿನಂತಿಯನ್ನು ನಿರಾಕರಿಸಿ",
                    commentPlaceholder: "ನಿಮ್ಮ ಕಾಮೆಂಟ್ ಸೇರಿಸಿ (ಐಚ್ಛಿಕ)...",
                    confirmApprove: "ಈ ವಿನಂತಿಯನ್ನು ಅನುಮೋದಿಸಲು ನೀವು ಖಚಿತವಾಗಿ ಬಯಸುವಿರಾ?",
                    confirmReject: "ಈ ವಿನಂತಿಯನ್ನು ನಿರಾಕರಿಸಲು ನೀವು ಖಚಿತವಾಗಿ ಬಯಸುವಿರಾ?"
                },
                noData: "ಯಾವುದೇ ನಿಧಿ ವಿನಂತಿಗಳು ಕಂಡುಬಂದಿಲ್ಲ",
                loading: "ನಿಧಿ ವಿನಂತಿಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...",
                error: "ಡೇಟಾ ಲೋಡ್ ಮಾಡಲು ವಿಫಲವಾಗಿದೆ",
                success: {
                    approved: "ನಿಧಿ ವಿನಂತಿ ಯಶಸ್ವಿಯಾಗಿ ಅನುಮೋದಿಸಲಾಗಿದೆ",
                    rejected: "ನಿಧಿ ವಿನಂತಿ ಯಶಸ್ವಿಯಾಗಿ ನಿರಾಕರಿಸಲಾಗಿದೆ",
                    disbursed: "ನಿಧಿ ವಿನಂತಿ ಹಂಚಲಾಗಿದೆ ಎಂದು ಗುರುತಿಸಲಾಗಿದೆ"
                }
            },
            hi: {
                title: "फंड अनुरोध",
                subtitle: "TDOs से फंड अनुरोधों की समीक्षा और स्वीकृति दें",
                back: "डैशबोर्ड पर वापस जाएं",
                search: "अनुरोध खोजें...",
                filters: {
                    status: "स्थिति",
                    priority: "प्राथमिकता",
                    all: "सभी",
                    pending: "लंबित",
                    approved: "स्वीकृत",
                    rejected: "अस्वीकृत",
                    disbursed: "वितरित",
                    low: "कम",
                    medium: "मध्यम",
                    high: "उच्च"
                },
                table: {
                    id: "अनुरोध आईडी",
                    amount: "राशि",
                    purpose: "उद्देश्य",
                    panchayat: "ग्राम पंचायत",
                    taluk: "तालुका",
                    status: "स्थिति",
                    priority: "प्राथमिकता",
                    date: "अनुरोध तिथि",
                    action: "कार्रवाई",
                    view: "विवरण देखें",
                    approve: "स्वीकृत करें",
                    reject: "अस्वीकृत करें",
                    disburse: "वितरित चिह्नित करें"
                },
                stats: {
                    total: "कुल अनुरोध",
                    pending: "लंबित",
                    approved: "स्वीकृत",
                    amount: "कुल राशि"
                },
                actions: {
                    approve: "अनुरोध स्वीकृत करें",
                    reject: "अनुरोध अस्वीकृत करें",
                    comment: "टिप्पणी जोड़ें",
                    submit: "जमा करें",
                    cancel: "रद्द करें",
                    download: "दस्तावेज़ डाउनलोड करें"
                },
                modal: {
                    approveTitle: "फंड अनुरोध स्वीकृत करें",
                    rejectTitle: "फंड अनुरोध अस्वीकृत करें",
                    commentPlaceholder: "अपनी टिप्पणी जोड़ें (वैकल्पिक)...",
                    confirmApprove: "क्या आप वाकई इस अनुरोध को स्वीकृत करना चाहते हैं?",
                    confirmReject: "क्या आप वाकई इस अनुरोध को अस्वीकृत करना चाहते हैं?"
                },
                noData: "कोई फंड अनुरोध नहीं मिला",
                loading: "फंड अनुरोध लोड हो रहे हैं...",
                error: "डेटा लोड करने में विफल",
                success: {
                    approved: "फंड अनुरोध सफलतापूर्वक स्वीकृत",
                    rejected: "फंड अनुरोध सफलतापूर्वक अस्वीकृत",
                    disbursed: "फंड अनुरोध वितरित चिह्नित"
                }
            }
        };
        return L[locale] || L.en;
    }, [locale]);

    /* 🔐 Load DDO and Fund Requests Data */
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

                // Load fund requests
                await loadFundRequests(districtName, districtIdentifier);

            } catch (err: any) {
                console.error("Error loading data:", err);
                setError(t.error);
                setLoading(false);
            }
        };

        const loadFundRequests = async (districtName: string, districtId: string) => {
            try {
                const requests: any[] = [];

                // Try by district name
                try {
                    const requestsByNameQuery = query(
                        collection(db, "fund_requests"),
                        where("district", "==", districtName)
                    );
                    const snapshotByName = await getDocs(requestsByNameQuery);
                    snapshotByName.forEach(doc => {
                        if (!requests.find(r => r.id === doc.id)) {
                            requests.push({ id: doc.id, ...doc.data() });
                        }
                    });
                } catch (err) {
                    console.log("Query by district name failed:", err);
                }

                // Try by districtId
                try {
                    const requestsByIdQuery = query(
                        collection(db, "fund_requests"),
                        where("districtId", "==", districtId)
                    );
                    const snapshotById = await getDocs(requestsByIdQuery);
                    snapshotById.forEach(doc => {
                        if (!requests.find(r => r.id === doc.id)) {
                            requests.push({ id: doc.id, ...doc.data() });
                        }
                    });
                } catch (err) {
                    console.log("Query by districtId failed:", err);
                }

                // Format fund requests data
                const formattedRequests: FundRequest[] = requests.map(req => {
                    const amount = Number(req.amount) || 0;

                    // Determine priority based on amount
                    let priority: "low" | "medium" | "high" = "low";
                    if (amount > 100000) priority = "high";
                    else if (amount > 50000) priority = "medium";

                    // Override for emergency purposes
                    const emergencyPurposes = ["Emergency Relief", "Medical Emergency", "Disaster Relief"];
                    if (emergencyPurposes.some(p => req.purpose?.includes(p))) {
                        priority = "high";
                    }

                    return {
                        id: req.id,
                        displayId: req.displayId || req.id.substring(0, 8).toUpperCase(),
                        amount: amount,
                        purpose: req.purpose || req.reason || "Not specified",
                        reason: req.reason || req.description || "",
                        status: req.status || "pending",
                        requestedBy: req.requestedBy || req.pdoUid || "",
                        requestedByName: req.requestedByName || req.pdoName || "Unknown",
                        panchayat: req.panchayat || req.panchayatName || "Unknown GP",
                        taluk: req.taluk || req.talukName || "Unknown Taluk",
                        district: req.district || districtName,
                        createdAt: req.createdAt?.toDate?.() || new Date(),
                        documents: req.documents || req.attachments || [],
                        tdoComment: req.tdoComment,
                        tdoApprovedAt: req.tdoApprovedAt?.toDate?.() || req.updatedAt?.toDate?.(),
                        ddoComment: req.ddoComment,
                        ddoApprovedAt: req.ddoApprovedAt?.toDate?.(),
                        priority: priority
                    };
                });

                // Sort by priority and recency
                formattedRequests.sort((a, b) => {
                    const priorityOrder = { high: 0, medium: 1, low: 2 };
                    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
                    if (priorityDiff !== 0) return priorityDiff;
                    return b.createdAt.getTime() - a.createdAt.getTime();
                });

                setFundRequests(formattedRequests);

            } catch (err) {
                console.error("Error loading fund requests:", err);
                throw err;
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [router, locale, t]);

    // Calculate statistics
    const stats = useMemo(() => {
        const total = fundRequests.length;
        const pending = fundRequests.filter(r => r.status === "pending").length;
        const approved = fundRequests.filter(r => r.status === "approved").length;
        const totalAmount = fundRequests.reduce((sum, r) => sum + r.amount, 0);

        return { total, pending, approved, totalAmount };
    }, [fundRequests]);

    // Filter fund requests
    const filteredRequests = useMemo(() => {
        return fundRequests.filter(request => {
            // Search filter
            const matchesSearch = searchTerm === "" ||
                request.displayId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                request.purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
                request.panchayat.toLowerCase().includes(searchTerm.toLowerCase());

            // Status filter
            const matchesStatus = statusFilter === "all" || request.status === statusFilter;

            // Priority filter
            const matchesPriority = priorityFilter === "all" || request.priority === priorityFilter;

            return matchesSearch && matchesStatus && matchesPriority;
        });
    }, [fundRequests, searchTerm, statusFilter, priorityFilter]);

    const handleApprove = (request: FundRequest) => {
        setSelectedRequest(request);
        setComment("");
        setShowApproveModal(true);
    };

    const handleReject = (request: FundRequest) => {
        setSelectedRequest(request);
        setComment("");
        setShowRejectModal(true);
    };

    const handleDisburse = async (requestId: string) => {
        try {
            setProcessing(true);
            const requestRef = doc(db, "fund_requests", requestId);
            await updateDoc(requestRef, {
                status: "disbursed",
                disbursedAt: Timestamp.now(),
                disbursedBy: auth.currentUser?.uid
            });

            // Refresh data
            const updatedRequests = fundRequests.map(r =>
                r.id === requestId ? { ...r, status: "disbursed" as const } : r
            );
            setFundRequests(updatedRequests);

            alert(t.success.disbursed);
        } catch (error) {
            console.error("Error disbursing fund request:", error);
            alert("Error disbursing fund request");
        } finally {
            setProcessing(false);
        }
    };

    const submitApproval = async (approve: boolean) => {
        if (!selectedRequest) return;

        try {
            setProcessing(true);
            const requestRef = doc(db, "fund_requests", selectedRequest.id);
            const updateData = {
                status: approve ? "approved" : "rejected",
                ddoComment: comment || null,
                ddoApprovedAt: Timestamp.now(),
                ddoUid: auth.currentUser?.uid,
                ddoName: auth.currentUser?.displayName
            };

            await updateDoc(requestRef, updateData);

            // Refresh data
            const updatedRequests = fundRequests.map(r =>
                r.id === selectedRequest.id ? {
                    ...r,
                    status: approve ? ("approved" as const) : ("rejected" as const),
                    ddoComment: comment,
                    ddoApprovedAt: new Date()
                } : r
            );
            setFundRequests(updatedRequests);

            alert(approve ? t.success.approved : t.success.rejected);

            // Close modal
            setShowApproveModal(false);
            setShowRejectModal(false);
            setSelectedRequest(null);
            setComment("");

        } catch (error) {
            console.error("Error updating fund request:", error);
            alert("Error updating fund request");
        } finally {
            setProcessing(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "pending": return "bg-yellow-100 text-yellow-800";
            case "approved": return "bg-green-100 text-green-800";
            case "rejected": return "bg-red-100 text-red-800";
            case "disbursed": return "bg-blue-100 text-blue-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "high": return "bg-red-100 text-red-800";
            case "medium": return "bg-yellow-100 text-yellow-800";
            case "low": return "bg-green-100 text-green-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat(locale === 'en' ? 'en-IN' : locale === 'kn' ? 'kn-IN' : 'hi-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <Screen padded>
            <div className="max-w-7xl mx-auto">
                {/* Header with Back Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <button
                            onClick={() => router.push(`/${locale}/authority/ddo/dashboard`)}
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
                        <p className="text-sm text-green-900/70">{t.stats.approved}</p>
                        <p className="text-2xl font-extrabold text-green-900">{stats.approved}</p>
                    </div>
                    <div className="bg-white border border-blue-100 rounded-xl p-4">
                        <p className="text-sm text-blue-900/70">{t.stats.amount}</p>
                        <p className="text-2xl font-extrabold text-blue-900">{formatCurrency(stats.totalAmount)}</p>
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
                                <option value="approved">{t.filters.approved}</option>
                                <option value="rejected">{t.filters.rejected}</option>
                                <option value="disbursed">{t.filters.disbursed}</option>
                            </select>

                            <select
                                value={priorityFilter}
                                onChange={(e) => setPriorityFilter(e.target.value)}
                                className="px-4 py-2 border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                                <option value="all">{t.filters.priority}: {t.filters.all}</option>
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
                    /* Fund Requests Table */
                    <div className="bg-white border border-green-100 rounded-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-green-50">
                                    <tr className="text-left text-sm text-green-600">
                                        <th className="p-4 font-bold">{t.table.id}</th>
                                        <th className="p-4 font-bold">{t.table.amount}</th>
                                        <th className="p-4 font-bold hidden md:table-cell">{t.table.purpose}</th>
                                        <th className="p-4 font-bold hidden lg:table-cell">{t.table.panchayat}</th>
                                        <th className="p-4 font-bold">{t.table.status}</th>
                                        <th className="p-4 font-bold hidden md:table-cell">{t.table.priority}</th>
                                        <th className="p-4 font-bold">{t.table.action}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRequests.length > 0 ? (
                                        filteredRequests.map((request) => (
                                            <tr key={request.id} className="border-b hover:bg-green-50">
                                                <td className="p-4">
                                                    <div className="font-mono text-sm font-bold text-green-900">
                                                        {request.displayId}
                                                    </div>
                                                    <p className="text-xs text-green-900/60 md:hidden mt-1">
                                                        {request.panchayat} • {request.taluk}
                                                    </p>
                                                </td>
                                                <td className="p-4">
                                                    <div className="font-bold text-green-900">
                                                        {formatCurrency(request.amount)}
                                                    </div>
                                                </td>
                                                <td className="p-4 hidden md:table-cell">
                                                    <p className="line-clamp-2 text-sm">{request.purpose}</p>
                                                </td>
                                                <td className="p-4 hidden lg:table-cell">
                                                    <p className="text-sm">{request.panchayat}</p>
                                                    <p className="text-xs text-green-900/60">{request.taluk}</p>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${getStatusColor(request.status)}`}>
                                                        {request.status}
                                                    </span>
                                                </td>
                                                <td className="p-4 hidden md:table-cell">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${getPriorityColor(request.priority)}`}>
                                                        {request.priority}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex flex-col sm:flex-row gap-2">
                                                        <button
                                                            onClick={() => router.push(`/${locale}/authority/ddo/fund-requests/${request.id}`)}
                                                            className="px-3 py-1 bg-green-700 text-white text-sm rounded-lg hover:bg-green-800 transition"
                                                        >
                                                            {t.table.view}
                                                        </button>
                                                        {request.status === "pending" && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleApprove(request)}
                                                                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
                                                                >
                                                                    {t.table.approve}
                                                                </button>
                                                                <button
                                                                    onClick={() => handleReject(request)}
                                                                    className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition"
                                                                >
                                                                    {t.table.reject}
                                                                </button>
                                                            </>
                                                        )}
                                                        {request.status === "approved" && (
                                                            <button
                                                                onClick={() => handleDisburse(request.id)}
                                                                disabled={processing}
                                                                className="px-3 py-1 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
                                                            >
                                                                {processing ? "..." : t.table.disburse}
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={7} className="p-8 text-center text-gray-500">
                                                {t.noData}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Approve Modal */}
                {showApproveModal && selectedRequest && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl max-w-md w-full p-6">
                            <h3 className="text-lg font-bold text-green-900 mb-4">
                                {t.modal.approveTitle}
                            </h3>
                            <p className="text-sm text-green-900/70 mb-4">
                                {t.modal.confirmApprove}
                            </p>
                            <div className="mb-4">
                                <p className="font-bold text-green-900">{selectedRequest.displayId}</p>
                                <p className="text-sm text-green-900/70">{selectedRequest.purpose}</p>
                                <p className="text-lg font-bold text-green-900 mt-2">
                                    {formatCurrency(selectedRequest.amount)}
                                </p>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-green-900 mb-2">
                                    {t.actions.comment}
                                </label>
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder={t.modal.commentPlaceholder}
                                    className="w-full px-3 py-2 border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    rows={3}
                                />
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => {
                                        setShowApproveModal(false);
                                        setSelectedRequest(null);
                                        setComment("");
                                    }}
                                    className="px-4 py-2 text-green-700 hover:text-green-900 font-medium"
                                >
                                    {t.actions.cancel}
                                </button>
                                <button
                                    onClick={() => submitApproval(true)}
                                    disabled={processing}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                                >
                                    {processing ? "..." : t.actions.submit}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Reject Modal */}
                {showRejectModal && selectedRequest && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl max-w-md w-full p-6">
                            <h3 className="text-lg font-bold text-green-900 mb-4">
                                {t.modal.rejectTitle}
                            </h3>
                            <p className="text-sm text-green-900/70 mb-4">
                                {t.modal.confirmReject}
                            </p>
                            <div className="mb-4">
                                <p className="font-bold text-green-900">{selectedRequest.displayId}</p>
                                <p className="text-sm text-green-900/70">{selectedRequest.purpose}</p>
                                <p className="text-lg font-bold text-green-900 mt-2">
                                    {formatCurrency(selectedRequest.amount)}
                                </p>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-green-900 mb-2">
                                    {t.actions.comment} *
                                </label>
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="Reason for rejection..."
                                    className="w-full px-3 py-2 border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    rows={3}
                                    required
                                />
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => {
                                        setShowRejectModal(false);
                                        setSelectedRequest(null);
                                        setComment("");
                                    }}
                                    className="px-4 py-2 text-green-700 hover:text-green-900 font-medium"
                                >
                                    {t.actions.cancel}
                                </button>
                                <button
                                    onClick={() => submitApproval(false)}
                                    disabled={processing || !comment.trim()}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                                >
                                    {processing ? "..." : t.actions.submit}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Screen>
    );
}