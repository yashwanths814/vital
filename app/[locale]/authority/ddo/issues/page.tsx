"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    Timestamp,
    limit,
    startAfter,
    DocumentSnapshot,
    updateDoc,
    serverTimestamp
} from "firebase/firestore";
import { auth, db } from "../../../../lib/firebase";
import Screen from "../../../../components/Screen";
import {
    FiArrowLeft,
    FiEye,
    FiDownload,
    FiFilter,
    FiRefreshCw,
    FiAlertCircle,
    FiCheckCircle,
    FiClock,
    FiUser,
    FiHome,
    FiList,
    FiTrendingUp,
    FiPlus,
    FiChevronRight,
    FiMapPin,
    FiFolder,
    FiCalendar,
    FiMessageSquare,
    FiSearch,
    FiBarChart2,
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
    FiLogOut,
    FiSend,
    FiCheck,
    FiX,
    FiEdit,
    FiExternalLink,
    FiUserPlus,
    FiTool,
    FiBriefcase,
    FiPhone,
    FiMail,
    FiFlag,
    FiDollarSign,
    FiPackage
} from "react-icons/fi";
import { onAuthStateChanged } from "firebase/auth";
import { toast } from "react-hot-toast";

type Locale = "en" | "kn" | "hi";
type IssueStatus = "submitted" | "verified" | "assigned" | "in_progress" | "resolved" | "escalated" | "closed" | "pending" | "fund_requested" | "funded";

interface Issue {
    id: string;
    displayId: string;
    title: string;
    description: string;
    status: IssueStatus;
    stage: string;
    currentStatus: string;
    categoryId: string;
    categoryName: string;
    priority: "Low" | "Medium" | "High" | "Urgent";
    isUrgent: boolean;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    villagerId: string;
    reporterName: string;
    reporterPhone: string;
    reporterEmail: string;
    villageId: string;
    villageName: string;
    panchayatId: string;
    panchayatName: string;
    talukId: string;
    talukName: string;
    districtId: string;
    districtName: string;
    hasPhoto: boolean;
    images?: string[];
    resolvedPhoto?: string;
    gpsLatitude?: number;
    gpsLongitude?: number;
    gpsAccuracy?: number;
    specificLocation?: string;
    escalationReason?: string;
    slaDays?: number;
    expectedResolutionDate?: Timestamp;
    assignedDepartment?: string;
    assignedWorker?: {
        name: string;
        phone?: string;
        email?: string;
        id?: string;
    };
    assignedAt?: Timestamp;
    viVerifiedAt?: Timestamp;
    viVerifiedBy?: string;
    viVerificationNotes?: string;
    verifiedAt?: Timestamp;
    isVerified?: boolean;
    inProgressAt?: Timestamp;
    resolvedAt?: Timestamp;
    resolutionNotes?: string;
    commentsCount?: number;
    views?: number;
    upvotes?: number;
    fundRequested?: boolean;
    fundingStatus?: string;
    fundRequestedAt?: Timestamp;
    fundedAt?: Timestamp;
    fundingAmount?: number;
    fundingSource?: string;
}

interface Village {
    id: string;
    name: string;
    districtId?: string;
    districtName?: string;
    talukId?: string;
    talukName?: string;
}

interface Worker {
    id: string;
    name: string;
    phone: string;
    email?: string;
    specialization?: string;
    availability?: string;
    panchayatId: string;
    isActive?: boolean;
}

const PAGE_SIZE = 20;

export default function PdoIssuesPage() {
    const router = useRouter();
    const params = useParams() as { locale?: string };
    const searchParams = useSearchParams();
    const locale = (params?.locale || "en") as Locale;

    const allowedStatuses: IssueStatus[] = ['submitted', 'verified', 'assigned', 'in_progress', 'resolved', 'escalated', 'closed', 'pending', 'fund_requested', 'funded'];
    const rawStatus = searchParams.get('status');
    const statusFilter: IssueStatus | 'all' = rawStatus && allowedStatuses.includes(rawStatus as IssueStatus) ? (rawStatus as IssueStatus) : 'all';

    const t = useMemo(() => {
        const L: Record<Locale, any> = {
            en: {
                title: "Issues Management",
                subtitle: "Monitor, assign, and resolve issues in your panchayat",
                welcome: "Welcome back,",
                back: "Back to Dashboard",
                filterAll: "All Issues",
                filterSubmitted: "Submitted",
                filterVerified: "VI Verified",
                filterAssigned: "Assigned",
                filterInProgress: "In Progress",
                filterResolved: "Resolved",
                filterEscalated: "Escalated",
                filterClosed: "Closed",
                filterPending: "Pending",
                filterFundRequested: "Fund Requested",
                filterFunded: "Funded",
                loading: "Loading issues...",
                noIssues: "No issues found",
                tableHeaders: {
                    id: "Issue ID",
                    title: "Title",
                    category: "Category",
                    priority: "Priority",
                    status: "Status",
                    date: "Date",
                    actions: "Actions",
                    village: "Village",
                    reporter: "Reporter",
                    department: "Department",
                    sla: "SLA Days"
                },
                actions: {
                    view: "View Details",
                    download: "Download Report",
                    assign: "Assign to Worker",
                    resolve: "Mark Resolved",
                    close: "Close Issue",
                    escalate: "Escalate to TDO",
                    assignTo: "Assign Worker",
                    markInProgress: "Mark In Progress",
                    updateStatus: "Update Status",
                    assignWorker: "Assign Worker",
                    startWork: "Start Work",
                    viewFundRequest: "View Fund Request",
                    applyFunds: "Apply Funds"
                },
                priorityLabels: {
                    low: "Low",
                    medium: "Medium",
                    high: "High",
                    urgent: "Urgent"
                },
                statusLabels: {
                    submitted: "Submitted",
                    pending: "Pending",
                    verified: "Verified",
                    assigned: "Assigned",
                    in_progress: "In Progress",
                    resolved: "Resolved",
                    escalated: "Escalated",
                    closed: "Closed",
                    fund_requested: "Fund Requested",
                    funded: "Funded"
                },
                errors: {
                    noPermission: "You don't have permission to view issues.",
                    noPanchayat: "Your panchayat ID is not set.",
                    fetchError: "Failed to load issues. Please try again."
                },
                stats: {
                    total: "Total Issues",
                    pending: "Pending",
                    inProgress: "In Progress",
                    resolved: "Resolved",
                    overdue: "Overdue",
                    funded: "Funded"
                },
                quickActions: "Quick Actions",
                search: "Search issues...",
                filters: "Filters",
                exportAll: "Export All (CSV)",
                refresh: "Refresh",
                assignPDO: "Assign to Worker",
                resolveIssue: "Resolve Issue",
                viewDetails: "View Details",
                reporter: "Reporter",
                phone: "Phone",
                location: "Location",
                description: "Description",
                comments: "Comments",
                upvotes: "Upvotes",
                created: "Created",
                updated: "Updated",
                resolutionNotes: "Resolution Notes",
                assignIssue: "Assign Issue",
                resolvePrompt: "Add resolution notes",
                escalationPrompt: "Add escalation reason",
                closePrompt: "Add closing remarks",
                success: {
                    assigned: "Issue assigned successfully",
                    resolved: "Issue marked as resolved",
                    escalated: "Issue escalated",
                    closed: "Issue closed"
                },
                dashboard: "Dashboard",
                issues: "Issues",
                profile: "Profile",
                logout: "Logout",
                slaDeadline: "SLA Deadline",
                expectedResolution: "Expected Resolution",
                gpsLocation: "GPS Location",
                villageFilter: "Filter by Village",
                categoryFilter: "Filter by Category",
                priorityFilter: "Filter by Priority",
                statusFilter: "Filter by Status",
                clearFilters: "Clear Filters",
                assignWorker: "Assign to Worker",
                workers: "Workers",
                specialization: "Specialization",
                availability: "Availability",
                assignNotes: "Assignment Notes",
                startWork: "Start Work",
                markResolved: "Mark as Resolved",
                fundingStatus: "Funding Status",
                funded: "Funded",
                fundingRequested: "Funding Requested",
                fundingAmount: "Funding Amount",
                fundingSource: "Funding Source",
                applyForFunds: "Apply for Funds",
                checkFundingStatus: "Check Funding Status"
            },
            kn: {
                title: "ಸಮಸ್ಯೆ ನಿರ್ವಹಣೆ",
                subtitle: "ನಿಮ್ಮ ಪಂಚಾಯತ್ನಲ್ಲಿ ಸಮಸ್ಯೆಗಳನ್ನು ಮೇಲ್ವಿಚಾರಣೆ, ನಿಯೋಜಿಸಿ ಮತ್ತು ಪರಿಹರಿಸಿ",
                welcome: "ಮರಳಿ ಸ್ವಾಗತ,",
                back: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಹಿಂತಿರುಗಿ",
                filterAll: "ಎಲ್ಲಾ ಸಮಸ್ಯೆಗಳು",
                filterSubmitted: "ಸಲ್ಲಿಸಲಾಗಿದೆ",
                filterVerified: "ಪರಿಶೀಲಿಸಲಾಗಿದೆ",
                filterAssigned: "ನಿಯೋಜಿಸಲಾಗಿದೆ",
                filterInProgress: "ಪ್ರಗತಿಯಲ್ಲಿದೆ",
                filterResolved: "ಪರಿಹರಿಸಲಾಗಿದೆ",
                filterEscalated: "ಹೆಚ್ಚಿಸಲಾಗಿದೆ",
                filterClosed: "ಮುಚ್ಚಲಾಗಿದೆ",
                filterPending: "ಬಾಕಿ ಇವೆ",
                filterFundRequested: "ಹಣ ವಿನಂತಿಸಲಾಗಿದೆ",
                filterFunded: "ಹಣಕಾಸು ಒದಗಿಸಲಾಗಿದೆ",
                loading: "ಸಮಸ್ಯೆಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...",
                noIssues: "ಯಾವುದೇ ಸಮಸ್ಯೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ",
                tableHeaders: {
                    id: "ಸಮಸ್ಯೆ ಐಡಿ",
                    title: "ಶೀರ್ಷಿಕೆ",
                    category: "ವರ್ಗ",
                    priority: "ಆದ್ಯತೆ",
                    status: "ಸ್ಥಿತಿ",
                    date: "ದಿನಾಂಕ",
                    actions: "ಕ್ರಿಯೆಗಳು",
                    village: "ಗ್ರಾಮ",
                    reporter: "ವರದಿದಾರ",
                    department: "ವಿಭಾಗ",
                    sla: "SLA ದಿನಗಳು"
                },
                actions: {
                    view: "ವಿವರಗಳನ್ನು ವೀಕ್ಷಿಸಿ",
                    download: "ವರದಿ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ",
                    assign: "ಕೆಲಸಗಾರರಿಗೆ ನಿಯೋಜಿಸಿ",
                    resolve: "ಪರಿಹರಿಸಲಾಗಿದೆ ಎಂದು ಗುರುತಿಸಿ",
                    close: "ಸಮಸ್ಯೆಯನ್ನು ಮುಚ್ಚಿ",
                    escalate: "TDO ಗೆ ಹೆಚ್ಚಿಸಿ",
                    assignTo: "ಕೆಲಸಗಾರರನ್ನು ನಿಯೋಜಿಸಿ",
                    markInProgress: "ಪ್ರಗತಿಯಲ್ಲಿದೆ ಎಂದು ಗುರುತಿಸಿ",
                    updateStatus: "ಸ್ಥಿತಿಯನ್ನು ನವೀಕರಿಸಿ",
                    assignWorker: "ಕೆಲಸಗಾರರಿಗೆ ನಿಯೋಜಿಸಿ",
                    startWork: "ಕೆಲಸ ಪ್ರಾರಂಭಿಸಿ",
                    viewFundRequest: "ಹಣ ವಿನಂತಿ ವೀಕ್ಷಿಸಿ",
                    applyFunds: "ಹಣಕಾಸು ಅನ್ವಯಿಸಿ"
                },
                priorityLabels: {
                    low: "ಕಡಿಮೆ",
                    medium: "ಮಧ್ಯಮ",
                    high: "ಹೆಚ್ಚು",
                    urgent: "ತುರ್ತು"
                },
                statusLabels: {
                    submitted: "ಸಲ್ಲಿಸಲಾಗಿದೆ",
                    pending: "ಬಾಕಿ ಇವೆ",
                    verified: "ಪರಿಶೀಲಿಸಲಾಗಿದೆ",
                    assigned: "ನಿಯೋಜಿಸಲಾಗಿದೆ",
                    in_progress: "ಪ್ರಗತಿಯಲ್ಲಿದೆ",
                    resolved: "ಪರಿಹರಿಸಲಾಗಿದೆ",
                    escalated: "ಹೆಚ್ಚಿಸಲಾಗಿದೆ",
                    closed: "ಮುಚ್ಚಲಾಗಿದೆ",
                    fund_requested: "ಹಣ ವಿನಂತಿಸಲಾಗಿದೆ",
                    funded: "ಹಣಕಾಸು ಒದಗಿಸಲಾಗಿದೆ"
                },
                errors: {
                    noPermission: "ಸಮಸ್ಯೆಗಳನ್ನು ವೀಕ್ಷಿಸಲು ನಿಮಗೆ ಅನುಮತಿ ಇಲ್ಲ.",
                    noPanchayat: "ನಿಮ್ಮ ಪಂಚಾಯತ್ ಐಡಿ ಹೊಂದಿಸಲಾಗಿಲ್ಲ.",
                    fetchError: "ಸಮಸ್ಯೆಗಳನ್ನು ಲೋಡ್ ಮಾಡಲು ವಿಫಲವಾಗಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ."
                },
                stats: {
                    total: "ಒಟ್ಟು ಸಮಸ್ಯೆಗಳು",
                    pending: "ಬಾಕಿ ಇವೆ",
                    inProgress: "ಪ್ರಗತಿಯಲ್ಲಿದೆ",
                    resolved: "ಪರಿಹರಿಸಲಾಗಿದೆ",
                    overdue: "ಕಾಲಾವಧಿ ಮೀರಿದ",
                    funded: "ಹಣಕಾಸು ಒದಗಿಸಲಾಗಿದೆ"
                },
                quickActions: "ತ್ವರಿತ ಕ್ರಿಯೆಗಳು",
                search: "ಸಮಸ್ಯೆಗಳನ್ನು ಹುಡುಕಿ...",
                filters: "ಫಿಲ್ಟರ್‌ಗಳು",
                exportAll: "ಎಲ್ಲಾ ರಫ್ತು (CSV)",
                refresh: "ರಿಫ್ರೆಶ್",
                assignPDO: "ಕೆಲಸಗಾರರಿಗೆ ನಿಯೋಜಿಸಿ",
                resolveIssue: "ಸಮಸ್ಯೆಯನ್ನು ಪರಿಹರಿಸಿ",
                viewDetails: "ವಿವರಗಳನ್ನು ವೀಕ್ಷಿಸಿ",
                reporter: "ವರದಿದಾರ",
                phone: "ಫೋನ್",
                location: "ಸ್ಥಳ",
                description: "ವಿವರಣೆ",
                comments: "ಟೀಕೆಗಳು",
                upvotes: "ಅಪ್ವೋಟ್ಗಳು",
                created: "ಸೃಷ್ಟಿಸಲಾಗಿದೆ",
                updated: "ನವೀಕರಿಸಲಾಗಿದೆ",
                resolutionNotes: "ಪರಿಹಾರ ಟಿಪ್ಪಣಿಗಳು",
                assignIssue: "ಸಮಸ್ಯೆಯನ್ನು ನಿಯೋಜಿಸಿ",
                resolvePrompt: "ಪರಿಹಾರ ಟಿಪ್ಪಣಿಗಳನ್ನು ಸೇರಿಸಿ",
                escalationPrompt: "ಹೆಚ್ಚಳ ಕಾರಣವನ್ನು ಸೇರಿಸಿ",
                closePrompt: "ಮುಚ್ಚುವ ಟಿಪ್ಪಣಿಗಳನ್ನು ಸೇರಿಸಿ",
                success: {
                    assigned: "ಸಮಸ್ಯೆಯನ್ನು ಯಶಸ್ವಿಯಾಗಿ ನಿಯೋಜಿಸಲಾಗಿದೆ",
                    resolved: "ಸಮಸ್ಯೆಯನ್ನು ಪರಿಹರಿಸಲಾಗಿದೆ ಎಂದು ಗುರುತಿಸಲಾಗಿದೆ",
                    escalated: "ಸಮಸ್ಯೆಯನ್ನು ಹೆಚ್ಚಿಸಲಾಗಿದೆ",
                    closed: "ಸಮಸ್ಯೆಯನ್ನು ಮುಚ್ಚಲಾಗಿದೆ"
                },
                dashboard: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
                issues: "ಸಮಸ್ಯೆಗಳು",
                profile: "ಪ್ರೊಫೈಲ್",
                logout: "ಲಾಗ್‌ಔಟ್",
                slaDeadline: "SLA ಗಡುವು",
                expectedResolution: "ನಿರೀಕ್ಷಿತ ಪರಿಹಾರ",
                gpsLocation: "GPS ಸ್ಥಳ",
                villageFilter: "ಗ್ರಾಮದಿಂದ ಫಿಲ್ಟರ್ ಮಾಡಿ",
                categoryFilter: "ವರ್ಗದಿಂದ ಫಿಲ್ಟರ್ ಮಾಡಿ",
                priorityFilter: "ಆದ್ಯತೆಯಿಂದ ಫಿಲ್ಟರ್ ಮಾಡಿ",
                statusFilter: "ಸ್ಥಿತಿಯಿಂದ ಫಿಲ್ಟರ್ ಮಾಡಿ",
                clearFilters: "ಫಿಲ್ಟರ್‌ಗಳನ್ನು ತೆರವುಗೊಳಿಸಿ",
                assignWorker: "ಕೆಲಸಗಾರರಿಗೆ ನಿಯೋಜಿಸಿ",
                workers: "ಕೆಲಸಗಾರರು",
                specialization: "ವಿಶೇಷತೆ",
                availability: "ಲಭ್ಯತೆ",
                assignNotes: "ನಿಯೋಜನಾ ಟಿಪ್ಪಣಿಗಳು",
                startWork: "ಕೆಲಸ ಪ್ರಾರಂಭಿಸಿ",
                markResolved: "ಪರಿಹರಿಸಲಾಗಿದೆ ಎಂದು ಗುರುತಿಸಿ",
                fundingStatus: "ಹಣಕಾಸು ಸ್ಥಿತಿ",
                funded: "ಹಣಕಾಸು ಒದಗಿಸಲಾಗಿದೆ",
                fundingRequested: "ಹಣಕಾಸು ವಿನಂತಿಸಲಾಗಿದೆ",
                fundingAmount: "ಹಣಕಾಸು ಮೊತ್ತ",
                fundingSource: "ಹಣಕಾಸು ಮೂಲ",
                applyForFunds: "ಹಣಕಾಸಿಗೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ",
                checkFundingStatus: "ಹಣಕಾಸು ಸ್ಥಿತಿ ಪರಿಶೀಲಿಸಿ"
            },
            hi: {
                title: "समस्याएं प्रबंधन",
                subtitle: "अपनी पंचायत में समस्याओं की निगरानी, असाइन और समाधान करें",
                welcome: "वापसी पर स्वागत है,",
                back: "डैशबोर्ड पर वापस जाएं",
                filterAll: "सभी समस्याएं",
                filterSubmitted: "सबमिट किया गया",
                filterVerified: "सत्यापित",
                filterAssigned: "असाइन किया गया",
                filterInProgress: "प्रगति पर",
                filterResolved: "हल किया गया",
                filterEscalated: "एस्केलेटेड",
                filterClosed: "बंद किया गया",
                filterPending: "लंबित",
                filterFundRequested: "धन अनुरोधित",
                filterFunded: "वित्त पोषित",
                loading: "समस्याएं लोड हो रही हैं...",
                noIssues: "कोई समस्या नहीं मिली",
                tableHeaders: {
                    id: "समस्या आईडी",
                    title: "शीर्षक",
                    category: "श्रेणी",
                    priority: "प्राथमिकता",
                    status: "स्थिति",
                    date: "तारीख",
                    actions: "कार्रवाई",
                    village: "गाँव",
                    reporter: "रिपोर्टर",
                    department: "विभाग",
                    sla: "एसएलए दिन"
                },
                actions: {
                    view: "विवरण देखें",
                    download: "रिपोर्ट डाउनलोड करें",
                    assign: "कार्यकर्ता को असाइन करें",
                    resolve: "हल किया गया मार्क करें",
                    close: "समस्या बंद करें",
                    escalate: "टीडीओ को एस्केलेट करें",
                    assignTo: "कार्यकर्ता असाइन करें",
                    markInProgress: "प्रगति पर मार्क करें",
                    updateStatus: "स्थिति अपडेट करें",
                    assignWorker: "कार्यकर्ता को असाइन करें",
                    startWork: "काम शुरू करें",
                    viewFundRequest: "धन अनुरोध देखें",
                    applyFunds: "धन लागू करें"
                },
                priorityLabels: {
                    low: "कम",
                    medium: "मध्यम",
                    high: "उच्च",
                    urgent: "तत्काल"
                },
                statusLabels: {
                    submitted: "सबमिट किया गया",
                    pending: "लंबित",
                    verified: "सत्यापित",
                    assigned: "असाइन किया गया",
                    in_progress: "प्रगति पर",
                    resolved: "हल किया गया",
                    escalated: "एस्केलेटेड",
                    closed: "बंद किया गया",
                    fund_requested: "धन अनुरोधित",
                    funded: "वित्त पोषित"
                },
                errors: {
                    noPermission: "समस्याओं को देखने की आपकी अनुमति नहीं है.",
                    noPanchayat: "आपकी पंचायत आईडी सेट नहीं है.",
                    fetchError: "समस्याएं लोड करने में विफल. कृपया पुन: प्रयास करें."
                },
                stats: {
                    total: "कुल समस्याएं",
                    pending: "लंबित",
                    inProgress: "प्रगति पर",
                    resolved: "हल हो चुकी",
                    overdue: "समय सीमा पार",
                    funded: "वित्त पोषित"
                },
                quickActions: "त्वरित कार्रवाई",
                search: "समस्याएं खोजें...",
                filters: "फ़िल्टर",
                exportAll: "सभी निर्यात (CSV)",
                refresh: "रिफ्रेश",
                assignPDO: "कार्यकर्ता को असाइन करें",
                resolveIssue: "समस्या हल करें",
                viewDetails: "विवरण देखें",
                reporter: "रिपोर्टर",
                phone: "फ़ोन",
                location: "स्थान",
                description: "विवरण",
                comments: "टिप्पणियाँ",
                upvotes: "अपवोट",
                created: "बनाया गया",
                updated: "अपडेट किया गया",
                resolutionNotes: "समाधान नोट्स",
                assignIssue: "समस्या असाइन करें",
                resolvePrompt: "समाधान नोट्स जोड़ें",
                escalationPrompt: "एस्केलेशन कारण जोड़ें",
                closePrompt: "बंद करने के नोट्स जोड़ें",
                success: {
                    assigned: "समस्या सफलतापूर्वक असाइन की गई",
                    resolved: "समस्या हल किया गया मार्क किया गया",
                    escalated: "समस्या एस्केलेट की गई",
                    closed: "समस्या बंद की गई"
                },
                dashboard: "डैशबोर्ड",
                issues: "समस्याएँ",
                profile: "प्रोफ़ाइल",
                logout: "लॉगआउट",
                slaDeadline: "एसएलए समय सीमा",
                expectedResolution: "अपेक्षित समाधान",
                gpsLocation: "जीपीएस स्थान",
                villageFilter: "गाँव से फ़िल्टर करें",
                categoryFilter: "श्रेणी से फ़िल्टर करें",
                priorityFilter: "प्राथमिकता से फ़िल्टर करें",
                statusFilter: "स्थिति से फ़िल्टर करें",
                clearFilters: "फ़िल्टर साफ़ करें",
                assignWorker: "कार्यकर्ता को असाइन करें",
                workers: "कार्यकर्ता",
                specialization: "विशेषज्ञता",
                availability: "उपलब्धता",
                assignNotes: "असाइनमेंट नोट्स",
                startWork: "काम शुरू करें",
                markResolved: "हल किया गया मार्क करें",
                fundingStatus: "वित्तपोषण स्थिति",
                funded: "वित्त पोषित",
                fundingRequested: "वित्तपोषण अनुरोधित",
                fundingAmount: "वित्तपोषण राशि",
                fundingSource: "वित्तपोषण स्रोत",
                applyForFunds: "धन के लिए आवेदन करें",
                checkFundingStatus: "वित्तपोषण स्थिति जांचें"
            },
        };
        return L[locale] || L.en;
    }, [locale]);

    const [issues, setIssues] = useState<Issue[]>([]);
    const [loading, setLoading] = useState(true);
    const [moreLoading, setMoreLoading] = useState(false);
    const [error, setError] = useState("");
    const [panchayatId, setPanchayatId] = useState("");
    const [panchayatName, setPanchayatName] = useState("");
    const [user, setUser] = useState<any>(null);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        inProgress: 0,
        resolved: 0,
        overdue: 0,
        funded: 0
    });
    const [showFilters, setShowFilters] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");
    const [priorityFilter, setPriorityFilter] = useState("");
    const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
    const [hasMore, setHasMore] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showResolveModal, setShowResolveModal] = useState(false);
    const [showEscalateModal, setShowEscalateModal] = useState(false);
    const [showCloseModal, setShowCloseModal] = useState(false);
    const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
    const [modalNotes, setModalNotes] = useState("");
    const [refreshing, setRefreshing] = useState(false);
    const [authReady, setAuthReady] = useState(false);
    const [villages, setVillages] = useState<Village[]>([]);
    const [selectedVillage, setSelectedVillage] = useState("all");
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
    const [showWorkerSelect, setShowWorkerSelect] = useState(false);
    const [categories, setCategories] = useState<string[]>([]);

  const fetchIssues = async (after?: DocumentSnapshot | null) => {
    try {
        if (!after) setLoading(true);
        else setMoreLoading(true);

        setError("");

        const user = auth.currentUser;
        if (!user) {
            router.push(`/${locale}/authority/login`);
            return;
        }

        // Get PDO authority profile
        const authRef = doc(db, "authorities", user.uid);
        const authSnap = await getDoc(authRef);

        if (!authSnap.exists()) {
            setError(t.errors.noPermission);
            return;
        }

        const authData = authSnap.data();
        if (authData?.role !== "pdo" || authData?.verified !== true) {
            setError(t.errors.noPermission);
            return;
        }

        const pid = authData.panchayatId;
        const pName = authData.panchayatName || authData.panchayat || "Your Panchayat";
        const pdoName = authData.name || authData.displayName || "PDO Officer";
        
        if (!pid) {
            setError(t.errors.noPanchayat);
            return;
        }

        setPanchayatId(pid);
        setPanchayatName(pName);
        setUser(authData);

        // Initialize fund requests map (empty if query fails)
        const fundRequests: Map<string, any> = new Map();

        try {
            // Fetch fund requests WITHOUT orderBy first (to avoid index error)
            // We'll sort manually if needed
            const fundRequestsQuery = query(
                collection(db, "fund_requests"),
                where("panchayatId", "==", pid)
                // Removed orderBy temporarily to avoid index error
                // orderBy("createdAt", "desc")
            );
            const fundRequestsSnap = await getDocs(fundRequestsQuery);
            
            console.log("Fund requests found:", fundRequestsSnap.size);
            
            // Convert to array and sort manually
            const fundRequestsArray: any[] = [];
            fundRequestsSnap.forEach(doc => {
                const data = doc.data();
                if (data.issueId) {
                    fundRequestsArray.push({
                        id: doc.id,
                        ...data,
                        requestedAt: data.createdAt,
                        fundedAt: data.approvedAt || data.fundedAt || data.updatedAt,
                        pdoName: data.pdoName || pdoName,
                        pdoUid: data.requestedBy || user.uid
                    });
                }
            });
            
            // Sort manually by createdAt descending
            fundRequestsArray.sort((a, b) => {
                const dateA = a.createdAt?.toDate?.() || new Date(0);
                const dateB = b.createdAt?.toDate?.() || new Date(0);
                return dateB.getTime() - dateA.getTime();
            });
            
            // Add to map
            fundRequestsArray.forEach(request => {
                if (request.issueId) {
                    fundRequests.set(request.issueId, request);
                }
            });
            
        } catch (fundError: any) {
            console.warn("Could not fetch fund requests (index might be missing):", fundError.message);
            // Continue without fund requests - this is okay for now
        }

        // Build issues query
        const issuesRef = collection(db, "issues");
        let conditions: any[] = [
            where("panchayatId", "==", pid),
            orderBy("createdAt", "desc"),
            limit(PAGE_SIZE)
        ];

        if (after) {
            conditions.splice(2, 0, startAfter(after));
        }

        // Apply status filter if needed
        if (statusFilter !== 'all' && allowedStatuses.includes(statusFilter as IssueStatus)) {
            // Check if we need an index for this combination
            try {
                conditions.splice(1, 0, where("status", "==", statusFilter));
            } catch (filterError: any) {
                console.warn("Cannot apply status filter (index missing):", filterError.message);
                // Remove the filter and continue
                // You might want to filter client-side instead
            }
        }

        const q = query(issuesRef, ...conditions);
        const querySnapshot = await getDocs(q);
        
        const issuesList: Issue[] = [];
        const categorySet = new Set<string>();

        for (const issueDoc of querySnapshot.docs) {
            const data = issueDoc.data();

            // Add category to set
            if (data.categoryName) categorySet.add(data.categoryName);
            else if (data.category) categorySet.add(data.category);
            else if (data.categoryId) categorySet.add(data.categoryId);

            // Check funding status
            const fundRequest = fundRequests.get(issueDoc.id);
            let fundingStatus = data.fundingStatus || data.status;
            let isFundRequested = false;
            let isFunded = false;

            if (fundRequest) {
                isFundRequested = true;
                const fundStatus = fundRequest.status?.toLowerCase();
                if (fundStatus === 'approved' || fundStatus === 'funded' || fundStatus === 'disbursed') {
                    isFunded = true;
                    fundingStatus = 'funded';
                } else if (fundStatus === 'pending' || fundStatus === 'review' || fundStatus === 'processing') {
                    fundingStatus = 'fund_requested';
                }
            }

            // Create issue object
            const issueObj: Issue = {
                id: issueDoc.id,
                displayId: data.displayId || issueDoc.id.slice(0, 8),
                title: data.title || "No Title",
                description: data.description || "",
                status: isFunded ? 'funded' : (isFundRequested ? 'fund_requested' : (data.status || "submitted")),
                stage: data.stage || data.status || "submitted",
                currentStatus: isFunded ? 'Funded' : (isFundRequested ? 'Funding Requested' : (data.currentStatus || "Submitted")),
                categoryId: data.categoryId || "",
                categoryName: data.categoryName || data.category || "general",
                priority: data.priority || "Medium",
                isUrgent: data.isUrgent || false,
                createdAt: data.createdAt,
                updatedAt: data.updatedAt,
                villagerId: data.villagerId || "",
                reporterName: data.reporterName || "Unknown",
                reporterPhone: data.reporterPhone || "",
                reporterEmail: data.reporterEmail || "",
                villageId: data.villageId || "",
                villageName: data.villageName || "",
                panchayatId: data.panchayatId || pid,
                panchayatName: data.panchayatName || pName,
                talukId: data.talukId || "",
                talukName: data.talukName || "",
                districtId: data.districtId || "",
                districtName: data.districtName || "",
                hasPhoto: data.hasPhoto || false,
                images: data.images || [],
                resolvedPhoto: data.resolvedPhoto,
                gpsLatitude: data.gpsLatitude,
                gpsLongitude: data.gpsLongitude,
                gpsAccuracy: data.gpsAccuracy,
                specificLocation: data.specificLocation,
                escalationReason: data.escalationReason,
                slaDays: data.slaDays,
                expectedResolutionDate: data.expectedResolutionDate,
                assignedDepartment: data.assignedDepartment,
                assignedWorker: data.assignedWorker,
                assignedAt: data.assignedAt,
                viVerifiedAt: data.viVerifiedAt,
                viVerifiedBy: data.viVerifiedBy,
                viVerificationNotes: data.viVerificationNotes,
                verifiedAt: data.verifiedAt,
                isVerified: data.isVerified || false,
                inProgressAt: data.inProgressAt,
                resolvedAt: data.resolvedAt,
                resolutionNotes: data.resolutionNotes || "",
                commentsCount: data.commentsCount || 0,
                views: data.views || 0,
                upvotes: data.upvotes || 0,
                fundRequested: isFundRequested,
                fundingStatus: fundingStatus,
                fundRequestedAt: fundRequest?.requestedAt || fundRequest?.createdAt,
                fundedAt: fundRequest?.fundedAt,
                fundingAmount: fundRequest?.amount,
                fundingSource: fundRequest?.fundingSource
            };

            issuesList.push(issueObj);
        }

        // Set categories
        setCategories(Array.from(categorySet).sort());

        if (after) {
            setIssues(prev => [...prev, ...issuesList]);
        } else {
            setIssues(issuesList);
        }

        // Calculate stats
        try {
            // Get all issues for this panchayat for stats
            const allIssuesQuery = query(
                collection(db, "issues"),
                where("panchayatId", "==", pid)
            );
            const allIssuesSnap = await getDocs(allIssuesQuery);
            
            const now = new Date();
            const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));

            let fundedCount = 0;
            let fundRequestedCount = 0;
            fundRequests.forEach(request => {
                const status = request.status?.toLowerCase();
                if (status === 'approved' || status === 'funded' || status === 'disbursed') {
                    fundedCount++;
                } else if (status === 'pending' || status === 'review' || status === 'processing') {
                    fundRequestedCount++;
                }
            });

            setStats({
                total: allIssuesSnap.size,
                pending: issuesList.filter(i => ['submitted', 'pending', 'verified'].includes(i.status)).length,
                inProgress: issuesList.filter(i => ['assigned', 'in_progress'].includes(i.status)).length + fundRequestedCount,
                resolved: issuesList.filter(i => ['resolved'].includes(i.status)).length,
                overdue: issuesList.filter(i => 
                    ['submitted', 'pending', 'verified', 'assigned', 'in_progress', 'fund_requested'].includes(i.status) &&
                    i.createdAt?.toDate() < thirtyDaysAgo
                ).length,
                funded: fundedCount
            });
        } catch (statsError) {
            console.warn("Error calculating stats:", statsError);
            // Set basic stats from current issues list
            setStats({
                total: issuesList.length,
                pending: issuesList.filter(i => ['submitted', 'pending', 'verified'].includes(i.status)).length,
                inProgress: issuesList.filter(i => ['assigned', 'in_progress'].includes(i.status)).length,
                resolved: issuesList.filter(i => ['resolved'].includes(i.status)).length,
                overdue: 0,
                funded: issuesList.filter(i => i.status === 'funded').length
            });
        }

        const last = querySnapshot.docs[querySnapshot.docs.length - 1] || null;
        setLastDoc(last);
        setHasMore(querySnapshot.docs.length === PAGE_SIZE);

    } catch (err: any) {
        console.error("Error fetching issues:", err);
        
        // Provide user-friendly error messages
        if (err.code === 'failed-precondition') {
            setError("Database configuration needed. Please contact administrator to set up required indexes.");
        } else if (err.code === 'permission-denied') {
            setError("Access denied. Please check your permissions.");
        } else if (err.message?.includes('index')) {
            setError("Database index is being created. Please refresh in 1-2 minutes.");
        } else {
            setError(t.errors.fetchError);
        }
    } finally {
        setLoading(false);
        setMoreLoading(false);
        setRefreshing(false);
    }
};
    const loadMore = () => {
        if (hasMore && lastDoc && !moreLoading) {
            fetchIssues(lastDoc);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchIssues();
    };

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, () => setAuthReady(true));
        return () => unsub();
    }, []);

    useEffect(() => {
        if (authReady) {
            fetchIssues();
        }
    }, [statusFilter, authReady]);

    const getStatusColor = (status: IssueStatus) => {
        switch (status) {
            case 'submitted':
            case 'pending': return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white';
            case 'verified': return 'bg-gradient-to-r from-purple-500 to-violet-600 text-white';
            case 'assigned': return 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white';
            case 'in_progress': return 'bg-gradient-to-r from-amber-500 to-orange-600 text-white';
            case 'resolved': return 'bg-gradient-to-r from-green-500 to-emerald-600 text-white';
            case 'escalated': return 'bg-gradient-to-r from-red-500 to-pink-600 text-white';
            case 'closed': return 'bg-gradient-to-r from-gray-700 to-gray-800 text-white';
            case 'fund_requested': return 'bg-gradient-to-r from-indigo-500 to-blue-600 text-white';
            case 'funded': return 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white';
            default: return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority?.toLowerCase()) {
            case 'high': return 'bg-red-100 text-red-800 border-red-200';
            case 'medium': return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'urgent': return 'bg-gradient-to-r from-red-600 to-pink-600 text-white';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const formatDate = (timestamp: Timestamp | undefined) => {
        if (!timestamp) return "";
        try {
            const date = timestamp.toDate();
            const now = new Date();
            const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

            if (diffDays === 0) return "Today";
            if (diffDays === 1) return "Yesterday";
            if (diffDays < 7) return `${diffDays} days ago`;

            return date.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: diffDays < 365 ? undefined : 'numeric'
            });
        } catch {
            return "";
        }
    };

    const downloadIssueReport = async (issue: Issue) => {
        try {
            // Check if issue is resolved, closed, or funded
            if (issue.status !== 'resolved' && issue.status !== 'closed' && issue.status !== 'funded') {
                toast.error("Report is only available for resolved, closed, or funded issues");
                return;
            }

            const { jsPDF } = await import('jspdf');
            const doc = new jsPDF();

            // Header
            doc.setFillColor(34, 197, 94);
            doc.rect(0, 0, 210, 40, 'F');

            // Title
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(20);
            doc.text('Issue Resolution Report', 105, 20, { align: 'center' });

            // Subtitle
            doc.setFontSize(10);
            doc.text(`Panchayat: ${issue.panchayatName || panchayatName}`, 105, 30, { align: 'center' });

            // Issue Details
            doc.setTextColor(0, 0, 0);
            let yPos = 60;

            // Issue ID and Status
            doc.setFontSize(14);
            doc.text(`Issue ID: ${issue.displayId || issue.id}`, 20, yPos);
            doc.text(`Status: ${t.statusLabels[issue.status]}`, 150, yPos);
            yPos += 15;

            // Title and Category
            doc.setFontSize(12);
            doc.text(`Title: ${issue.title}`, 20, yPos);
            doc.text(`Category: ${issue.categoryName || issue.categoryId}`, 150, yPos);
            yPos += 10;

            // Priority and Created Date
            doc.text(`Priority: ${issue.priority}`, 20, yPos);
            doc.text(`Created: ${issue.createdAt?.toDate().toLocaleDateString()}`, 150, yPos);
            yPos += 10;

            // Village and Reporter
            doc.text(`Village: ${issue.villageName || 'N/A'}`, 20, yPos);
            doc.text(`Reporter: ${issue.reporterName}`, 150, yPos);
            yPos += 10;

            // Phone and Location
            if (issue.reporterPhone) {
                doc.text(`Phone: ${issue.reporterPhone}`, 20, yPos);
            }
            if (issue.specificLocation) {
                doc.text(`Location: ${issue.specificLocation}`, 150, yPos);
            }
            yPos += 15;

            // Funding Information if funded
            if (issue.status === 'funded') {
                doc.setFontSize(12);
                doc.text('Funding Information:', 20, yPos);
                yPos += 8;
                if (issue.fundingAmount) {
                    doc.text(`Amount: ₹${issue.fundingAmount.toLocaleString()}`, 20, yPos);
                }
                if (issue.fundingSource) {
                    doc.text(`Source: ${issue.fundingSource}`, 100, yPos);
                }
                if (issue.fundedAt) {
                    doc.text(`Funded on: ${issue.fundedAt.toDate().toLocaleDateString()}`, 20, yPos + 8);
                }
                yPos += 20;
            }

            // Description
            doc.setFontSize(11);
            doc.text('Description:', 20, yPos);
            yPos += 8;
            const splitDesc = doc.splitTextToSize(issue.description, 170);
            doc.text(splitDesc, 20, yPos);
            yPos += splitDesc.length * 5 + 10;

            // Resolution Details
            if (issue.resolutionNotes) {
                doc.setFontSize(12);
                doc.text('Resolution Details:', 20, yPos);
                yPos += 8;
                doc.setFontSize(10);
                const splitRes = doc.splitTextToSize(issue.resolutionNotes, 170);
                doc.text(splitRes, 20, yPos);
                yPos += splitRes.length * 5 + 10;
            }

            // Dates
            doc.setFontSize(10);
            yPos += 10;
            doc.text(`Created: ${issue.createdAt?.toDate().toLocaleString()}`, 20, yPos);
            if (issue.updatedAt) {
                doc.text(`Last Updated: ${issue.updatedAt?.toDate().toLocaleString()}`, 150, yPos);
            }
            yPos += 10;
            if (issue.assignedAt) {
                doc.text(`Assigned: ${issue.assignedAt?.toDate().toLocaleDateString()}`, 20, yPos);
            }
            if (issue.resolvedAt) {
                doc.text(`Resolved: ${issue.resolvedAt?.toDate().toLocaleDateString()}`, 150, yPos);
            }
            yPos += 10;

            // Footer
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            doc.text(`Report generated on ${new Date().toLocaleDateString()}`, 105, 280, { align: 'center' });
            doc.text(`Official Document - ${issue.panchayatName || panchayatName} Panchayat`, 105, 285, { align: 'center' });

            // Save PDF
            doc.save(`issue-report-${issue.displayId || issue.id}-${new Date().getTime()}.pdf`);
            toast.success("Report downloaded successfully");
        } catch (err) {
            console.error("Error generating PDF:", err);
            toast.error("Failed to generate report");
        }
    };

    const downloadAllCSV = () => {
        // Filter resolved/closed/funded issues only for report
        const reportableIssues = issues.filter(issue =>
            issue.status === 'resolved' || issue.status === 'closed' || issue.status === 'funded'
        );

        if (reportableIssues.length === 0) {
            toast.error("No resolved issues to export");
            return;
        }

        // Create CSV content
        const headers = ['Issue ID', 'Title', 'Category', 'Priority', 'Status', 'Village', 'Reporter', 'Reporter Phone', 'Created Date', 'Resolved Date', 'Funding Amount', 'Funding Source', 'Resolution Notes'];
        const rows = reportableIssues.map(issue => [
            issue.displayId || issue.id,
            issue.title,
            issue.categoryName || issue.categoryId,
            issue.priority,
            t.statusLabels[issue.status],
            issue.villageName || 'N/A',
            issue.reporterName,
            issue.reporterPhone || '',
            issue.createdAt?.toDate().toLocaleDateString(),
            issue.resolvedAt?.toDate().toLocaleDateString() || 'N/A',
            issue.fundingAmount ? `₹${issue.fundingAmount}` : '',
            issue.fundingSource || '',
            `"${(issue.resolutionNotes || '').replace(/"/g, '""')}"`
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `issues-report-${panchayatId}-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success("CSV exported successfully");
    };

    const handleAssign = async (issue: Issue) => {
        setSelectedIssue(issue);
        setSelectedWorker(null);
        setModalNotes("");
        setShowAssignModal(true);
    };

    const handleStartWork = async (issue: Issue) => {
        if (!issue) return;

        try {
            const issueRef = doc(db, "issues", issue.id);
            await updateDoc(issueRef, {
                status: "in_progress",
                stage: "in_progress",
                currentStatus: "In Progress",
                inProgressAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            toast.success("Issue marked as in progress");
            fetchIssues();
        } catch (error) {
            console.error("Error starting work:", error);
            toast.error("Failed to start work");
        }
    };

    const handleResolve = async (issue: Issue) => {
        setSelectedIssue(issue);
        setModalNotes("");
        setShowResolveModal(true);
    };

    const handleEscalate = async (issue: Issue) => {
        setSelectedIssue(issue);
        setModalNotes("");
        setShowEscalateModal(true);
    };

    const handleClose = async (issue: Issue) => {
        setSelectedIssue(issue);
        setModalNotes("");
        setShowCloseModal(true);
    };

    const submitAssignment = async () => {
        if (!selectedIssue || !selectedWorker) {
            toast.error("Please select a worker");
            return;
        }

        try {
            const issueRef = doc(db, "issues", selectedIssue.id);
            await updateDoc(issueRef, {
                status: "assigned",
                stage: "assigned",
                currentStatus: "Assigned to Worker",
                assignedAt: serverTimestamp(),
                assignedWorker: {
                    name: selectedWorker.name,
                    phone: selectedWorker.phone,
                    email: selectedWorker.email,
                    id: selectedWorker.id
                },
                assignNotes: modalNotes,
                updatedAt: serverTimestamp()
            });

            toast.success(t.success.assigned);
            setShowAssignModal(false);
            setSelectedWorker(null);
            setModalNotes("");
            fetchIssues();
        } catch (error) {
            console.error("Error assigning issue:", error);
            toast.error("Failed to assign issue");
        }
    };

    const submitResolution = async () => {
        if (!selectedIssue || !modalNotes.trim()) {
            toast.error("Please add resolution notes");
            return;
        }

        try {
            const issueRef = doc(db, "issues", selectedIssue.id);
            await updateDoc(issueRef, {
                status: "resolved",
                stage: "resolved",
                currentStatus: "Resolved",
                resolutionNotes: modalNotes,
                resolvedAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            toast.success(t.success.resolved);
            setShowResolveModal(false);
            setModalNotes("");
            fetchIssues();
        } catch (error) {
            console.error("Error resolving issue:", error);
            toast.error("Failed to resolve issue");
        }
    };

    const submitEscalation = async () => {
        if (!selectedIssue || !modalNotes.trim()) {
            toast.error("Please add escalation reason");
            return;
        }

        try {
            const issueRef = doc(db, "issues", selectedIssue.id);
            await updateDoc(issueRef, {
                status: "escalated",
                stage: "escalated",
                currentStatus: "Escalated to TDO",
                escalationReason: modalNotes,
                updatedAt: serverTimestamp()
            });

            toast.success(t.success.escalated);
            setShowEscalateModal(false);
            setModalNotes("");
            fetchIssues();
        } catch (error) {
            console.error("Error escalating issue:", error);
            toast.error("Failed to escalate issue");
        }
    };

    const submitClosure = async () => {
        if (!selectedIssue || !modalNotes.trim()) {
            toast.error("Please add closing remarks");
            return;
        }

        try {
            const issueRef = doc(db, "issues", selectedIssue.id);
            await updateDoc(issueRef, {
                status: "closed",
                stage: "closed",
                currentStatus: "Closed",
                closingRemarks: modalNotes,
                updatedAt: serverTimestamp()
            });

            toast.success(t.success.closed);
            setShowCloseModal(false);
            setModalNotes("");
            fetchIssues();
        } catch (error) {
            console.error("Error closing issue:", error);
            toast.error("Failed to close issue");
        }
    };

    const filteredIssues = useMemo(() => {
        let filtered = issues;

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(issue =>
                issue.title?.toLowerCase().includes(query) ||
                issue.description?.toLowerCase().includes(query) ||
                issue.categoryName?.toLowerCase().includes(query) ||
                issue.categoryId?.toLowerCase().includes(query) ||
                issue.reporterName?.toLowerCase().includes(query) ||
                issue.villageName?.toLowerCase().includes(query) ||
                issue.displayId?.toLowerCase().includes(query)
            );
        }

        // Category filter
        if (categoryFilter) {
            filtered = filtered.filter(issue =>
                issue.categoryName?.toLowerCase() === categoryFilter.toLowerCase() ||
                issue.categoryId?.toLowerCase() === categoryFilter.toLowerCase()
            );
        }

        // Priority filter
        if (priorityFilter) {
            filtered = filtered.filter(issue =>
                issue.priority?.toLowerCase() === priorityFilter.toLowerCase()
            );
        }

        // Village filter
        if (selectedVillage !== "all") {
            filtered = filtered.filter(issue =>
                issue.villageName === selectedVillage || issue.villageId === selectedVillage
            );
        }

        return filtered;
    }, [issues, searchQuery, categoryFilter, priorityFilter, selectedVillage]);

    const handleLogout = async () => {
        try {
            await auth.signOut();
            router.push(`/${locale}/role-select`);
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    const clearFilters = () => {
        setSearchQuery("");
        setCategoryFilter("");
        setPriorityFilter("");
        setSelectedVillage("all");
        const params = new URLSearchParams(searchParams.toString());
        params.delete('status');
        router.push(`?${params.toString()}`);
    };

    const getAvailableActions = (issue: Issue) => {
        const actions = [];

        // Always show view details
        actions.push({
            label: t.actions.view,
            icon: FiEye,
            color: "from-green-500 to-emerald-600",
            action: () => router.push(`/${locale}/authority/pdo/issues/${issue.id}`)
        });

        // Show apply for funds button for eligible issues (verified, assigned, in_progress)
        if (['verified', 'assigned', 'in_progress'].includes(issue.status) && !issue.fundRequested) {
            actions.push({
                label: t.actions.applyFunds,
                icon: FiDollarSign,
                color: "from-indigo-500 to-blue-600",
                action: () => router.push(`/${locale}/authority/pdo/fund-request?issue=${issue.id}`)
            });
        }

        // Show view fund request for funded or fund_requested issues
        if (issue.status === 'funded' || issue.status === 'fund_requested') {
            actions.push({
                label: t.actions.viewFundRequest,
                icon: FiPackage,
                color: "from-emerald-500 to-teal-600",
                action: () => router.push(`/${locale}/authority/pdo/fund-requests?issue=${issue.id}`)
            });
        }

        // Show assign for verified issues (not funded)
        if ((issue.status === 'verified' || issue.status === 'pending' || issue.status === 'submitted') && !issue.fundRequested) {
            actions.push({
                label: t.actions.assign,
                icon: FiUserPlus,
                color: "from-blue-500 to-cyan-600",
                action: () => handleAssign(issue)
            });
        }

        // Show start work for assigned issues
        if (issue.status === 'assigned') {
            actions.push({
                label: t.actions.startWork,
                icon: FiActivity,
                color: "from-amber-500 to-orange-600",
                action: () => handleStartWork(issue)
            });
        }

        // Show resolve for in progress issues
        if (issue.status === 'in_progress') {
            actions.push({
                label: t.actions.resolve,
                icon: FiCheckCircle,
                color: "from-emerald-500 to-green-600",
                action: () => handleResolve(issue)
            });
        }

        // Show escalate for most issues except resolved/closed/funded
        if (!['resolved', 'closed', 'funded', 'escalated'].includes(issue.status)) {
            actions.push({
                label: t.actions.escalate,
                icon: FiFlag,
                color: "from-red-500 to-pink-600",
                action: () => handleEscalate(issue)
            });
        }

        // Show close for resolved issues
        if (issue.status === 'resolved') {
            actions.push({
                label: t.actions.close,
                icon: FiCheckSquare,
                color: "from-gray-500 to-gray-700",
                action: () => handleClose(issue)
            });
        }

        // Show download report for resolved/closed/funded issues
        if (issue.status === 'resolved' || issue.status === 'closed' || issue.status === 'funded') {
            actions.push({
                label: t.actions.download,
                icon: FiDownload,
                color: "from-purple-500 to-violet-600",
                action: () => downloadIssueReport(issue),
                disabled: false
            });
        }

        return actions;
    };

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
                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mb-8">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-green-50 p-4 shadow-lg">
                                <div className="absolute inset-0 shimmer"></div>
                                <div className="h-4 w-16 bg-gradient-to-r from-green-200 to-emerald-200 rounded mb-3"></div>
                                <div className="h-8 w-12 bg-gradient-to-r from-green-300 to-emerald-300 rounded"></div>
                            </div>
                        ))}
                    </div>

                    {/* Search Skeleton */}
                    <div className="h-12 bg-gradient-to-r from-green-100 to-emerald-100 rounded-2xl mb-6 pulse"></div>

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
                    background: linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(240, 253, 244, 0.8) 100%);
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
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-green-900 tracking-tight">
                                {t.title}
                            </h1>
                            <p className="text-green-700/80 mt-2 text-sm font-semibold flex items-center gap-2">
                                <FiShield className="w-4 h-4" />
                                {t.welcome} {user?.name || user?.displayName || user?.email?.split('@')[0] || 'PDO Officer'}
                            </p>
                            {panchayatName && (
                                <p className="text-xs text-green-600/70 mt-1 flex items-center gap-1">
                                    <FiMapPin className="w-3 h-3" />
                                    Panchayat: <span className="font-semibold">{panchayatName}</span>
                                </p>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={downloadAllCSV}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all"
                            >
                                <FiDownload className="w-4 h-4" />
                                {t.exportAll}
                            </button>
                            <button
                                onClick={handleRefresh}
                                disabled={refreshing}
                                className="p-3 rounded-xl border-2 border-green-100 bg-white hover:bg-green-50 active:scale-95 transition-all duration-200"
                            >
                                <FiRefreshCw className={`w-5 h-5 text-green-700 ${refreshing ? 'refresh-spin' : ''}`} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mb-8 animate-fadeIn delay-100">
                    <div className="stat-card bg-gradient-to-br from-white to-green-50 border-2 border-green-100 rounded-2xl p-4 shadow-lg">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-green-800/80">{t.stats.total}</span>
                            <div className="p-2 bg-green-100 rounded-lg">
                                <FiBarChart2 className="w-4 h-4 text-green-600" />
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-green-900 animate-count">{stats.total}</div>
                        <div className="text-xs text-green-700/60 mt-1">{t.filterAll}</div>
                        <div className="h-1 w-full bg-gradient-to-r from-green-200 to-transparent rounded-full mt-2"></div>
                    </div>

                    <div className="stat-card bg-gradient-to-br from-white to-amber-50 border-2 border-amber-100 rounded-2xl p-4 shadow-lg">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-amber-800/80">{t.stats.pending}</span>
                            <div className="p-2 bg-amber-100 rounded-lg">
                                <FiClock className="w-4 h-4 text-amber-600" />
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-amber-900 animate-count">{stats.pending}</div>
                        <div className="text-xs text-amber-700/60 mt-1">Awaiting Action</div>
                        <div className="h-1 w-full bg-gradient-to-r from-amber-200 to-transparent rounded-full mt-2"></div>
                    </div>

                    <div className="stat-card bg-gradient-to-br from-white to-blue-50 border-2 border-blue-100 rounded-2xl p-4 shadow-lg">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-blue-800/80">{t.stats.inProgress}</span>
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <FiActivity className="w-4 h-4 text-blue-600" />
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-blue-900 animate-count">{stats.inProgress}</div>
                        <div className="text-xs text-blue-700/60 mt-1">In Process</div>
                        <div className="h-1 w-full bg-gradient-to-r from-blue-200 to-transparent rounded-full mt-2"></div>
                    </div>

                    <div className="stat-card bg-gradient-to-br from-white to-emerald-50 border-2 border-emerald-100 rounded-2xl p-4 shadow-lg">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-emerald-800/80">{t.stats.resolved}</span>
                            <div className="p-2 bg-emerald-100 rounded-lg">
                                <FiCheckCircle className="w-4 h-4 text-emerald-600" />
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-emerald-900 animate-count">{stats.resolved}</div>
                        <div className="text-xs text-emerald-700/60 mt-1">Completed</div>
                        <div className="h-1 w-full bg-gradient-to-r from-emerald-200 to-transparent rounded-full mt-2"></div>
                    </div>

                    <div className="stat-card bg-gradient-to-br from-white to-red-50 border-2 border-red-100 rounded-2xl p-4 shadow-lg">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-red-800/80">{t.stats.overdue}</span>
                            <div className="p-2 bg-red-100 rounded-lg">
                                <FiAlertTriangle className="w-4 h-4 text-red-600" />
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-red-900 animate-count">{stats.overdue}</div>
                        <div className="text-xs text-red-700/60 mt-1">&gt;30 days</div>
                        <div className="h-1 w-full bg-gradient-to-r from-red-200 to-transparent rounded-full mt-2"></div>
                    </div>

                    <div className="stat-card bg-gradient-to-br from-white to-teal-50 border-2 border-teal-100 rounded-2xl p-4 shadow-lg">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-teal-800/80">{t.stats.funded}</span>
                            <div className="p-2 bg-teal-100 rounded-lg">
                                <FiDollarSign className="w-4 h-4 text-teal-600" />
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-teal-900 animate-count">{stats.funded}</div>
                        <div className="text-xs text-teal-700/60 mt-1">Funded</div>
                        <div className="h-1 w-full bg-gradient-to-r from-teal-200 to-transparent rounded-full mt-2"></div>
                    </div>
                </div>

                {/* Search and Filter Row */}
                <div className="mb-6 animate-fadeIn delay-200">
                    <div className="flex flex-col sm:flex-row gap-3 mb-4">
                        <div className="flex-1 relative">
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

                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`px-4 py-3 rounded-2xl border-2 ${showFilters ? 'border-green-500 bg-green-50' : 'border-green-100 bg-white'} hover:bg-green-50 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2`}
                        >
                            <FiFilter className="w-5 h-5 text-green-700" />
                            <span className="text-sm font-semibold text-green-800">{t.filters}</span>
                        </button>
                    </div>

                    {/* Status Filter Buttons */}
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {['all', 'submitted', 'pending', 'verified', 'assigned', 'in_progress', 'resolved', 'escalated', 'closed', 'fund_requested', 'funded'].map((status) => (
                            <button
                                key={status}
                                onClick={() => {
                                    const params = new URLSearchParams(searchParams.toString());
                                    if (status === 'all') {
                                        params.delete('status');
                                    } else {
                                        params.set('status', status);
                                    }
                                    router.push(`?${params.toString()}`);
                                }}
                                className={`filter-btn px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap ${
                                    statusFilter === status ? 'active ' + 
                                    (status === 'funded' ? 'bg-gradient-to-r from-emerald-500 to-teal-600' : 
                                     status === 'fund_requested' ? 'bg-gradient-to-r from-indigo-500 to-blue-600' : 
                                     'bg-gradient-to-r from-green-500 to-emerald-600') + ' text-white' : 
                                    'bg-white border-2 border-green-100 text-green-800'
                                }`}
                            >
                                {t[`filter${status.charAt(0).toUpperCase() + status.slice(1)}`] || status}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Advanced Filters Panel */}
                {showFilters && (
                    <div className="mb-6 animate-scaleIn">
                        <div className="bg-white border-2 border-green-100 rounded-2xl p-5 shadow-lg">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-green-900 flex items-center gap-2">
                                    <FiFilter className="w-5 h-5" />
                                    {t.filters}
                                </h3>
                                <button
                                    onClick={clearFilters}
                                    className="text-sm text-green-700 hover:text-green-900 font-semibold"
                                >
                                    {t.clearFilters}
                                </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {villages.length > 0 && (
                                    <div>
                                        <label className="text-sm font-bold text-green-900 mb-2 block">{t.villageFilter}</label>
                                        <select
                                            value={selectedVillage}
                                            onChange={(e) => setSelectedVillage(e.target.value)}
                                            className="w-full rounded-xl border-2 border-green-100 px-4 py-3 bg-white text-green-900"
                                        >
                                            <option value="all">All Villages</option>
                                            {villages.map((village) => (
                                                <option key={village.id} value={village.name}>
                                                    {village.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {categories.length > 0 && (
                                    <div>
                                        <label className="text-sm font-bold text-green-900 mb-2 block">{t.categoryFilter}</label>
                                        <select
                                            value={categoryFilter}
                                            onChange={(e) => setCategoryFilter(e.target.value)}
                                            className="w-full rounded-xl border-2 border-green-100 px-4 py-3 bg-white text-green-900"
                                        >
                                            <option value="">All Categories</option>
                                            {categories.map((category) => (
                                                <option key={category} value={category}>
                                                    {category}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div>
                                    <label className="text-sm font-bold text-green-900 mb-2 block">{t.priorityFilter}</label>
                                    <select
                                        value={priorityFilter}
                                        onChange={(e) => setPriorityFilter(e.target.value)}
                                        className="w-full rounded-xl border-2 border-green-100 px-4 py-3 bg-white text-green-900"
                                    >
                                        <option value="">All Priorities</option>
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-sm font-bold text-green-900 mb-2 block">Funding Status</label>
                                    <select
                                        value={priorityFilter}
                                        onChange={(e) => setPriorityFilter(e.target.value)}
                                        className="w-full rounded-xl border-2 border-green-100 px-4 py-3 bg-white text-green-900"
                                    >
                                        <option value="">All Issues</option>
                                        <option value="funded">Funded Only</option>
                                        <option value="fund_requested">Funding Requested</option>
                                        <option value="non_funded">Not Funded</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="mb-6 animate-slideLeft">
                        <div className="bg-gradient-to-r from-red-500 to-orange-600 text-white rounded-2xl p-4 shadow-lg flex items-center gap-3">
                            <FiAlertCircle className="w-6 h-6 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="font-bold">Error</p>
                                <p className="text-sm opacity-90">{error}</p>
                            </div>
                            <button
                                onClick={handleRefresh}
                                className="px-4 py-2 bg-white text-red-600 rounded-xl font-bold"
                            >
                                Retry
                            </button>
                        </div>
                    </div>
                )}

                {/* Issues List */}
                <div className="space-y-4 mb-8">
                    {filteredIssues.length === 0 ? (
                        <div className="text-center py-12 animate-fadeIn">
                            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mb-6">
                                <FiInbox className="w-12 h-12 text-green-600/70" />
                            </div>
                            <h3 className="text-xl font-bold text-green-900 mb-2">
                                {searchQuery || statusFilter !== "all" || categoryFilter ? "No matching issues found" : t.noIssues}
                            </h3>
                            <p className="text-green-700/70 mb-6">
                                {searchQuery || statusFilter !== "all" || categoryFilter ? "Try adjusting your filters" : `No issues have been reported in ${panchayatName || 'your panchayat'} yet.`}
                            </p>
                            <button
                                onClick={clearFilters}
                                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-semibold"
                            >
                                View All Issues
                            </button>
                        </div>
                    ) : (
                        filteredIssues.map((issue, index) => (
                            <div
                                key={issue.id}
                                className="issue-card border-2 border-green-100 rounded-2xl p-5 shadow-lg animate-fadeIn"
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-xl ${getStatusColor(issue.status)}`}>
                                        {issue.status === 'submitted' && <FiInbox className="w-6 h-6" />}
                                        {issue.status === 'pending' && <FiClock className="w-6 h-6" />}
                                        {issue.status === 'verified' && <FiShield className="w-6 h-6" />}
                                        {issue.status === 'assigned' && <FiUsers className="w-6 h-6" />}
                                        {issue.status === 'in_progress' && <FiActivity className="w-6 h-6" />}
                                        {issue.status === 'resolved' && <FiCheckCircle className="w-6 h-6" />}
                                        {issue.status === 'escalated' && <FiAlertTriangle className="w-6 h-6" />}
                                        {issue.status === 'closed' && <FiCheckSquare className="w-6 h-6" />}
                                        {issue.status === 'fund_requested' && <FiPackage className="w-6 h-6" />}
                                        {issue.status === 'funded' && <FiDollarSign className="w-6 h-6" />}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-3 mb-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-bold text-green-900 text-lg truncate">
                                                        {issue.title}
                                                    </h3>
                                                    {issue.isUrgent && (
                                                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-lg">
                                                            URGENT
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3 mt-1 flex-wrap">
                                                    {issue.villageName && (
                                                        <div className="flex items-center gap-1 text-sm text-green-700/70 bg-green-50 px-2 py-1 rounded-lg">
                                                            <FiMapPin className="w-3 h-3" />
                                                            {issue.villageName}
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-1 text-sm text-blue-700/70 bg-blue-50 px-2 py-1 rounded-lg">
                                                        <FiUser className="w-3 h-3" />
                                                        {issue.reporterName}
                                                    </div>
                                                    {issue.reporterPhone && (
                                                        <div className="text-sm text-gray-600 flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg">
                                                            <FiPhone className="w-3 h-3" />
                                                            {issue.reporterPhone}
                                                        </div>
                                                    )}
                                                    {issue.displayId && (
                                                        <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                            #{issue.displayId}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => router.push(`/${locale}/authority/pdo/issues/${issue.id}`)}
                                                className="p-2 rounded-lg hover:bg-green-50 text-green-700/70 hover:text-green-700"
                                            >
                                                <FiChevronRight className="w-5 h-5" />
                                            </button>
                                        </div>

                                        <p className="text-green-700/80 text-sm mb-4 line-clamp-2">
                                            {issue.description}
                                        </p>

                                        <div className="flex flex-wrap items-center gap-2 mb-3">
                                            <div className={`px-3 py-1.5 rounded-full text-xs font-bold text-white ${getStatusColor(issue.status)}`}>
                                                {t.statusLabels[issue.status] || issue.currentStatus || issue.status}
                                            </div>

                                            <div className={`px-3 py-1.5 rounded-full text-xs font-bold ${getPriorityColor(issue.priority)}`}>
                                                {issue.priority}
                                            </div>

                                            <div className="px-3 py-1.5 rounded-full text-xs font-semibold bg-cyan-100 text-cyan-800 flex items-center gap-1">
                                                <FiFolder className="w-3 h-3" />
                                                {issue.categoryName || issue.categoryId}
                                            </div>

                                            {/* Show funding amount if funded */}
                                            {issue.status === 'funded' && issue.fundingAmount && (
                                                <div className="px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                                                    <FiDollarSign className="w-3 h-3" />
                                                    ₹{issue.fundingAmount.toLocaleString()}
                                                </div>
                                            )}

                                            {issue.status === 'fund_requested' && (
                                                <div className="px-3 py-1.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 flex items-center gap-1">
                                                    <FiPackage className="w-3 h-3" />
                                                    Funding Pending
                                                </div>
                                            )}

                                            {issue.slaDays && (
                                                <div className="px-3 py-1.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 flex items-center gap-1">
                                                    <FiClock className="w-3 h-3" />
                                                    SLA: {issue.slaDays} days
                                                </div>
                                            )}

                                            {issue.assignedDepartment && (
                                                <div className="px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 flex items-center gap-1">
                                                    <FiBriefcase className="w-3 h-3" />
                                                    {issue.assignedDepartment}
                                                </div>
                                            )}

                                            <div className="px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 flex items-center gap-1">
                                                <FiCalendar className="w-3 h-3" />
                                                {formatDate(issue.createdAt)}
                                            </div>
                                        </div>

                                        {/* Show funding source if available */}
                                        {issue.fundingSource && (
                                            <div className="mb-3 text-sm text-emerald-700 flex items-center gap-1">
                                                <span className="font-semibold">{t.fundingSource}:</span> 
                                                <span className="bg-emerald-50 px-2 py-1 rounded-lg">{issue.fundingSource}</span>
                                            </div>
                                        )}

                                        {issue.assignedWorker && (
                                            <div className="flex items-center gap-2 mb-3 text-sm text-blue-700">
                                                <FiUserPlus className="w-4 h-4" />
                                                <span className="font-medium">Assigned to: {issue.assignedWorker.name}</span>
                                                {issue.assignedWorker.phone && (
                                                    <span className="text-blue-600/70">({issue.assignedWorker.phone})</span>
                                                )}
                                            </div>
                                        )}

                                        <div className="flex items-center gap-4 pt-3 border-t border-green-100">
                                            {issue.commentsCount !== undefined && issue.commentsCount > 0 && (
                                                <div className="flex items-center gap-1 text-green-700/70">
                                                    <FiMessageSquare className="w-4 h-4" />
                                                    <span className="text-sm font-medium">{issue.commentsCount}</span>
                                                </div>
                                            )}

                                            {issue.upvotes !== undefined && issue.upvotes > 0 && (
                                                <div className="flex items-center gap-1 text-green-700/70">
                                                    <FiThumbsUp className="w-4 h-4" />
                                                    <span className="text-sm font-medium">{issue.upvotes}</span>
                                                </div>
                                            )}

                                            {issue.gpsLatitude && issue.gpsLongitude && (
                                                <div className="ml-auto text-xs text-green-700/70 font-medium truncate max-w-[150px] flex items-center gap-1">
                                                    <FiMapPin className="w-3 h-3" />
                                                    GPS: {issue.gpsLatitude.toFixed(4)}, {issue.gpsLongitude.toFixed(4)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Actions */}
                                <div className="mt-4 pt-4 border-t border-green-100">
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                                        {getAvailableActions(issue).map((action, idx) => (
                                            <button
                                                key={idx}
                                                onClick={action.action}
                                                disabled={action.disabled}
                                                className={`px-3 py-2 bg-gradient-to-r ${action.color} text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                                            >
                                                <action.icon className="w-3 h-3" />
                                                {action.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Load More Button */}
                {hasMore && filteredIssues.length > 0 && (
                    <div className="flex justify-center mb-12 animate-fadeIn">
                        <button
                            disabled={moreLoading}
                            onClick={loadMore}
                            className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-semibold hover:shadow-lg transition-all active:scale-95 disabled:opacity-60"
                        >
                            {moreLoading ? (
                                <span className="flex items-center gap-2">
                                    <FiRefreshCw className="w-4 h-4 animate-spin" />
                                    Loading...
                                </span>
                            ) : (
                                "Load More Issues"
                            )}
                        </button>
                    </div>
                )}

                {/* Bottom Navigation */}
                <div className="fixed bottom-4 left-4 right-4 bg-white/90 backdrop-blur-lg border-2 border-green-100 rounded-2xl p-2 shadow-xl animate-fadeIn">
                    <div className="grid grid-cols-5 gap-1">
                        <button
                            className="flex flex-col items-center justify-center p-3 rounded-xl transition-all hover:bg-green-50"
                            onClick={() => router.push(`/${locale}/authority/pdo/dashboard`)}
                        >
                            <FiHome className="w-5 h-5 text-green-600/70" />
                            <span className="text-xs mt-1 font-medium text-green-700/70">
                                {t.dashboard}
                            </span>
                        </button>

                        <button
                            className="flex flex-col items-center justify-center p-3 rounded-xl transition-all bg-gradient-to-b from-green-100 to-emerald-50"
                        >
                            <FiFileText className="w-5 h-5 text-green-700" />
                            <span className="text-xs mt-1 font-medium text-green-800 font-bold">
                                {t.issues}
                            </span>
                        </button>

                        <button
                            className="flex flex-col items-center justify-center p-3 rounded-xl transition-all hover:bg-green-50"
                            onClick={() => router.push(`/${locale}/authority/pdo/villages`)}
                        >
                            <FiMapPin className="w-5 h-5 text-green-600/70" />
                            <span className="text-xs mt-1 font-medium text-green-700/70">
                                Villages
                            </span>
                        </button>

                        <button
                            className="flex flex-col items-center justify-center p-3 rounded-xl transition-all hover:bg-green-50"
                            onClick={() => router.push(`/${locale}/authority/pdo/fund-request`)}
                        >
                            <FiDollarSign className="w-5 h-5 text-green-600/70" />
                            <span className="text-xs mt-1 font-medium text-green-700/70">
                                Apply Funds
                            </span>
                        </button>

                        <button
                            className="flex flex-col items-center justify-center p-3 rounded-xl transition-all hover:bg-green-50"
                            onClick={() => router.push(`/${locale}/authority/pdo/profile`)}
                        >
                            <FiUser className="w-5 h-5 text-green-600/70" />
                            <span className="text-xs mt-1 font-medium text-green-700/70">
                                {t.profile}
                            </span>
                        </button>
                    </div>
                </div>
                
                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    className="fixed top-4 right-4 p-3 rounded-xl border-2 border-red-100 bg-white hover:bg-red-50 text-red-700 hover:text-red-900 transition-all duration-200 hover:scale-105 shadow-sm"
                    title={t.logout}
                >
                    <FiLogOut className="w-5 h-5" />
                </button>

                {/* Modals */}
                {/* Assign Worker Modal */}
                {showAssignModal && selectedIssue && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fadeIn">
                        <div className="bg-white rounded-2xl p-6 max-w-md w-full animate-scaleIn">
                            <h3 className="text-xl font-bold text-green-900 mb-2">{t.assignWorker}</h3>
                            <p className="text-green-700/80 mb-4">Select a worker to assign this issue:</p>
                            <p className="text-sm font-semibold text-gray-700 mb-2">Issue: {selectedIssue.title}</p>

                            <div className="mb-4">
                                <label className="text-sm font-bold text-green-900 mb-2 block">{t.workers}</label>
                                {workers.length === 0 ? (
                                    <p className="text-gray-500 text-sm">No workers available in your panchayat</p>
                                ) : (
                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                        {workers.map((worker) => (
                                            <div
                                                key={worker.id}
                                                className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${selectedWorker?.id === worker.id
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-green-100 hover:border-green-300'
                                                    }`}
                                                onClick={() => setSelectedWorker(worker)}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h4 className="font-bold text-green-900">{worker.name}</h4>
                                                        <div className="flex items-center gap-2 mt-1 text-sm">
                                                            <span className="text-green-700/70">{worker.phone}</span>
                                                            {worker.specialization && (
                                                                <span className="text-blue-700/70">• {worker.specialization}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {selectedWorker?.id === worker.id && (
                                                        <FiCheckCircle className="w-5 h-5 text-blue-600" />
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="mb-4">
                                <label className="text-sm font-bold text-green-900 mb-2 block">{t.assignNotes} (Optional)</label>
                                <textarea
                                    value={modalNotes}
                                    onChange={(e) => setModalNotes(e.target.value)}
                                    placeholder="Add assignment instructions..."
                                    className="w-full h-24 p-3 border-2 border-green-100 rounded-xl"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowAssignModal(false);
                                        setSelectedWorker(null);
                                        setModalNotes("");
                                    }}
                                    className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={submitAssignment}
                                    disabled={!selectedWorker}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {t.assignWorker}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Resolve Issue Modal */}
                {showResolveModal && selectedIssue && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fadeIn">
                        <div className="bg-white rounded-2xl p-6 max-w-md w-full animate-scaleIn">
                            <h3 className="text-xl font-bold text-green-900 mb-2">{t.markResolved}</h3>
                            <p className="text-green-700/80 mb-4">{t.resolvePrompt}</p>
                            <p className="text-sm font-semibold text-gray-700 mb-2">Issue: {selectedIssue.title}</p>
                            <textarea
                                value={modalNotes}
                                onChange={(e) => setModalNotes(e.target.value)}
                                placeholder="Describe how the issue was resolved..."
                                className="w-full h-32 p-3 border-2 border-green-100 rounded-xl mb-4"
                            />
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowResolveModal(false)}
                                    className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={submitResolution}
                                    disabled={!modalNotes.trim()}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {t.markResolved}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Escalate Issue Modal */}
                {showEscalateModal && selectedIssue && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fadeIn">
                        <div className="bg-white rounded-2xl p-6 max-w-md w-full animate-scaleIn">
                            <h3 className="text-xl font-bold text-red-900 mb-2">Escalate to TDO</h3>
                            <p className="text-red-700/80 mb-4">{t.escalationPrompt}</p>
                            <p className="text-sm font-semibold text-gray-700 mb-2">Issue: {selectedIssue.title}</p>
                            <textarea
                                value={modalNotes}
                                onChange={(e) => setModalNotes(e.target.value)}
                                placeholder="Reason for escalation..."
                                className="w-full h-32 p-3 border-2 border-red-100 rounded-xl mb-4"
                            />
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowEscalateModal(false)}
                                    className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={submitEscalation}
                                    disabled={!modalNotes.trim()}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Escalate Issue
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Close Issue Modal */}
                {showCloseModal && selectedIssue && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fadeIn">
                        <div className="bg-white rounded-2xl p-6 max-w-md w-full animate-scaleIn">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Close Issue</h3>
                            <p className="text-gray-700/80 mb-4">{t.closePrompt}</p>
                            <p className="text-sm font-semibold text-gray-700 mb-2">Issue: {selectedIssue.title}</p>
                            <textarea
                                value={modalNotes}
                                onChange={(e) => setModalNotes(e.target.value)}
                                placeholder="Closing remarks..."
                                className="w-full h-32 p-3 border-2 border-gray-100 rounded-xl mb-4"
                            />
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowCloseModal(false)}
                                    className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={submitClosure}
                                    disabled={!modalNotes.trim()}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-gray-500 to-gray-700 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Close Issue
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Screen>
    );
}
