"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Screen from "../../../../components/Screen";
import { auth, db } from "../../../../lib/firebase";
import {
    addDoc,
    collection,
    doc,
    getDoc,
    serverTimestamp,
    query,
    where,
    getDocs
} from "firebase/firestore";
import {
    FiArrowLeft,
    FiDollarSign,
    FiFileText,
    FiSend,
    FiAlertCircle,
    FiCalendar,
    FiCheckCircle,
    FiChevronDown,
    FiChevronUp,
    FiTag,
    FiClock,
    FiUser,
    FiHome,
    FiLoader,
    FiRefreshCw,
    FiSearch,
    FiInfo,
    FiCheck,
    FiX,
    FiShield,
    FiFilter,
    FiList,
    FiCheckSquare,
    FiAlertTriangle
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

type Locale = "en" | "kn" | "hi";
type TimelineOption = "immediate" | "7days" | "15days" | "30days" | "custom";

interface Issue {
    id: string;
    title: string;
    category: string;
    description: string;
    status: string;
    stage: string;
    currentStatus: string;
    isVerified: boolean;
    createdAt: any;
    categoryName: string;
    displayId: string;
    specificLocation: string;
    priority: string;
    assignedDepartment?: string;
    viVerifiedAt?: any;
    panchayatId: string;
    districtId: string;
    talukId: string;
    fundingStatus?: string;
    fundRequested?: boolean;
}

interface TimelineOptionType {
    id: TimelineOption;
    label: string;
    value: number;
    description: string;
}

export default function PDOFundRequestPage() {
    const router = useRouter();
    const params = useParams() as { locale?: string };
    const locale = (params?.locale || "en") as Locale;

    /* ---------------- translations ---------------- */
    const t = useMemo(() => {
        const L: any = {
            en: {
                title: "Apply Funds to Issues",
                subtitle: "Request funds for development activities",
                selectIssue: "Select Issue for Funding",
                searchIssues: "Search issues...",
                noIssues: "No issues available for funding",
                amount: "Amount (₹)",
                reason: "Detailed Justification",
                timeline: "Required Timeline",
                timelinePlaceholder: "When funds are needed",
                immediate: "Immediate (Within 3 days)",
                sevenDays: "Within 7 days",
                fifteenDays: "Within 15 days",
                thirtyDays: "Within 30 days",
                custom: "Custom date",
                customDate: "Select specific date",
                estimatedCost: "Estimated Cost Breakdown",
                costPlaceholder: "e.g., Materials: ₹20,000, Labor: ₹15,000...",
                submit: "Submit Fund Request",
                sending: "Submitting…",
                back: "Back",
                success: "Fund request submitted successfully",
                error: "Something went wrong",
                selectIssueFirst: "Please select an issue first",
                invalidAmount: "Enter valid amount",
                reasonRequired: "Detailed justification is required",
                timelineRequired: "Please select timeline",
                loadingIssues: "Loading issues...",
                loadingProfile: "Loading profile...",
                loading: "Loading...",
                refresh: "Refresh",
                issueDetails: "Issue Details",
                category: "Category",
                dateReported: "Date Reported",
                status: "Status",
                currentStatus: "Current Status",
                verified: "Verified",
                notVerified: "Not Verified",
                budgetAllocation: "Budget Allocation",
                otherExpenses: "Other Expenses",
                total: "Total",
                networkError: "Network error. Please check your connection.",
                retry: "Retry",
                loadingData: "Loading data...",
                noIssuesFound: "No issues found in your panchayat",
                tryRefresh: "Try refreshing or check back later",
                issueId: "Issue ID",
                location: "Location",
                priority: "Priority",
                verifiedStatus: "Verification Status",
                assignedTo: "Assigned To",
                high: "High",
                medium: "Medium",
                low: "Low",
                urgent: "Urgent",
                viVerified: "VI Verified",
                department: "Department",
                verifiedByVI: "Verified by VI",
                readyForFunding: "Ready for Funding",
                allIssues: "All Issues",
                filter: "Filter",
                clearFilter: "Clear Filter",
                eligibilityCriteria: "Eligibility Criteria",
                eligibleForFunding: "Eligible for Funding",
                notEligible: "Not Eligible",
                criteriaNote: "Issues must be verified or assigned to a department",
                fundingStatus: "Funding Status",
                alreadyFunded: "Already Funded",
                fundingPending: "Funding Pending",
                ready: "Ready",
                eligible: "Eligible",
                ineligible: "Ineligible",
                applyFunds: "Apply Funds",
                fundingApplied: "Funding Applied",
                checkEligibility: "Check Eligibility",
                viewAll: "View All",
                fundingEligible: "Funding Eligible",
                viewDetails: "View Details",
                applyNow: "Apply Now",
                selectToApply: "Select to apply funds",
                cannotApply: "Cannot apply funds to this issue",
                alreadyRequested: "Funding already requested",
                resolved: "Resolved",
                closed: "Closed",
                completed: "Completed",
                funded: "Funded",
                showAll: "Show All",
                showEligible: "Show Eligible Only",
            },
            kn: {
                title: "ಸಮಸ್ಯೆಗಳಿಗೆ ಹಣಕಾಸು ಅನ್ವಯಿಸಿ",
                subtitle: "ಅಭಿವೃದ್ಧಿ ಕಾರ್ಯಗಳಿಗಾಗಿ ಹಣ ಕೇಳಿ",
                selectIssue: "ಹಣಕಾಸು ಒದಗಿಸಲು ಸಮಸ್ಯೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ",
                searchIssues: "ಸಮಸ್ಯೆಗಳನ್ನು ಹುಡುಕಿ...",
                noIssues: "ಹಣಕಾಸಿಗೆ ಯಾವುದೇ ಸಮಸ್ಯೆಗಳು ಲಭ್ಯವಿಲ್ಲ",
                amount: "ಮೊತ್ತ (₹)",
                reason: "ವಿವರಣಾತ್ಮಕ ಸಮರ್ಥನೆ",
                timeline: "ಅಗತ್ಯವಿರುವ ಸಮಯ",
                timelinePlaceholder: "ಹಣ ಬೇಕಾಗುವ ಸಮಯ",
                immediate: "ತಕ್ಷಣ (3 ದಿನಗಳೊಳಗೆ)",
                sevenDays: "7 ದಿನಗಳೊಳಗೆ",
                fifteenDays: "15 ದಿನಗಳೊಳಗೆ",
                thirtyDays: "30 ದಿನಗಳೊಳಗೆ",
                custom: "ಕಸ್ಟಮ್ ದಿನಾಂಕ",
                customDate: "ನಿರ್ದಿಷ್ಟ ದಿನಾಂಕವನ್ನು ಆಯ್ಕೆಮಾಡಿ",
                estimatedCost: "ಅಂದಾಜು ವೆಚ್ಚ ವಿಭಜನೆ",
                costPlaceholder: "ಉದಾ: ಸಾಮಗ್ರಿಗಳು: ₹20,000, ಕಾರ್ಮಿಕರು: ₹15,000...",
                submit: "ಹಣಕಾಸು ವಿನಂತಿ ಸಲ್ಲಿಸಿ",
                sending: "ಸಲ್ಲಿಸಲಾಗುತ್ತಿದೆ…",
                back: "ಹಿಂದೆ",
                success: "ಹಣ ವಿನಂತಿ ಯಶಸ್ವಿಯಾಗಿ ಸಲ್ಲಿಸಲಾಗಿದೆ",
                error: "ಏನೋ ತಪ್ಪಾಗಿದೆ",
                selectIssueFirst: "ದಯವಿಟ್ಟು ಮೊದಲು ಸಮಸ್ಯೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ",
                invalidAmount: "ಮಾನ್ಯ ಮೊತ್ತವನ್ನು ನಮೂದಿಸಿ",
                reasonRequired: "ವಿವರಣಾತ್ಮಕ ಸಮರ್ಥನೆ ಅಗತ್ಯವಿದೆ",
                timelineRequired: "ದಯವಿಟ್ಟು ಸಮಯವನ್ನು ಆಯ್ಕೆಮಾಡಿ",
                loadingIssues: "ಸಮಸ್ಯೆಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...",
                loadingProfile: "ಪ್ರೊಫೈಲ್ ಲೋಡ್ ಆಗುತ್ತಿದೆ...",
                loading: "ಲೋಡ್ ಆಗುತ್ತಿದೆ...",
                refresh: "ರಿಫ್ರೆಶ್ ಮಾಡಿ",
                issueDetails: "ಸಮಸ್ಯೆಯ ವಿವರಗಳು",
                category: "ವರ್ಗ",
                dateReported: "ವರದಿ ಮಾಡಿದ ದಿನಾಂಕ",
                status: "ಸ್ಥಿತಿ",
                currentStatus: "ಪ್ರಸ್ತುತ ಸ್ಥಿತಿ",
                verified: "ಪರಿಶೀಲಿಸಲಾಗಿದೆ",
                notVerified: "ಪರಿಶೀಲಿಸಲಾಗಿಲ್ಲ",
                budgetAllocation: "ಬಜೆಟ್ ಹಂಚಿಕೆ",
                otherExpenses: "ಇತರ ವೆಚ್ಚಗಳು",
                total: "ಒಟ್ಟು",
                networkError: "ನೆಟ್‌ವರ್ಕ್ ದೋಷ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ಸಂಪರ್ಕ ಪರಿಶೀಲಿಸಿ.",
                retry: "ಮರುಪ್ರಯತ್ನಿಸಿ",
                loadingData: "ಡೇಟಾ ಲೋಡ್ ಆಗುತ್ತಿದೆ...",
                noIssuesFound: "ನಿಮ್ಮ ಪಂಚಾಯತ್ನಲ್ಲಿ ಯಾವುದೇ ಸಮಸ್ಯೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ",
                tryRefresh: "ರಿಫ್ರೆಶ್ ಮಾಡಿ ಅಥವಾ ನಂತರ ಪರಿಶೀಲಿಸಿ",
                issueId: "ಸಮಸ್ಯೆ ID",
                location: "ಸ್ಥಳ",
                priority: "ಪ್ರಾಮುಖ್ಯತೆ",
                verifiedStatus: "ಪರಿಶೀಲನೆ ಸ್ಥಿತಿ",
                assignedTo: "ನಿಯೋಜಿಸಲಾಗಿದೆ",
                high: "ಹೆಚ್ಚಿನ",
                medium: "ಮಧ್ಯಮ",
                low: "ಕಡಿಮೆ",
                urgent: "ತುರ್ತು",
                viVerified: "VI ಪರಿಶೀಲಿಸಿದೆ",
                department: "ವಿಭಾಗ",
                verifiedByVI: "VI ರಿಂದ ಪರಿಶೀಲಿಸಲಾಗಿದೆ",
                readyForFunding: "ಹಣಕಾಸಿಗೆ ಸಿದ್ಧವಾಗಿದೆ",
                allIssues: "ಎಲ್ಲಾ ಸಮಸ್ಯೆಗಳು",
                filter: "ಫಿಲ್ಟರ್",
                clearFilter: "ಫಿಲ್ಟರ್ ತೆರವುಗೊಳಿಸಿ",
                eligibilityCriteria: "ಫಲಾನುಭವಿ ಮಾನದಂಡಗಳು",
                eligibleForFunding: "ಹಣಕಾಸು ಫಲಾನುಭವಿ",
                notEligible: "ಫಲಾನುಭವಿ ಅಲ್ಲ",
                criteriaNote: "ಸಮಸ್ಯೆಗಳು ಪರಿಶೀಲಿಸಲ್ಪಟ್ಟಿರಬೇಕು ಅಥವಾ ಇಲಾಖೆಗೆ ನಿಯೋಜಿಸಲ್ಪಟ್ಟಿರಬೇಕು",
                fundingStatus: "ಹಣಕಾಸು ಸ್ಥಿತಿ",
                alreadyFunded: "ಈಗಾಗಲೇ ಹಣಕಾಸು ಒದಗಿಸಲಾಗಿದೆ",
                fundingPending: "ಹಣಕಾಸು ಉಳಿದಿದೆ",
                ready: "ಸಿದ್ಧ",
                eligible: "ಫಲಾನುಭವಿ",
                ineligible: "ಫಲಾನುಭವಿ ಅಲ್ಲ",
                applyFunds: "ಹಣಕಾಸು ಅನ್ವಯಿಸಿ",
                fundingApplied: "ಹಣಕಾಸು ಅನ್ವಯಿಸಲಾಗಿದೆ",
                checkEligibility: "ಫಲಾನುಭವಿತ್ವ ಪರಿಶೀಲಿಸಿ",
                viewAll: "ಎಲ್ಲಾ ವೀಕ್ಷಿಸಿ",
                fundingEligible: "ಹಣಕಾಸು ಫಲಾನುಭವಿ",
                viewDetails: "ವಿವರಗಳನ್ನು ವೀಕ್ಷಿಸಿ",
                applyNow: "ಈಗ ಅನ್ವಯಿಸಿ",
                selectToApply: "ಹಣಕಾಸು ಅನ್ವಯಿಸಲು ಆಯ್ಕೆಮಾಡಿ",
                cannotApply: "ಈ ಸಮಸ್ಯೆಗೆ ಹಣಕಾಸು ಅನ್ವಯಿಸಲಾಗುವುದಿಲ್ಲ",
                alreadyRequested: "ಹಣಕಾಸು ಈಗಾಗಲೇ ವಿನಂತಿಸಲಾಗಿದೆ",
                resolved: "ಪರಿಹರಿಸಲಾಗಿದೆ",
                closed: "ಮುಚ್ಚಲಾಗಿದೆ",
                completed: "ಪೂರ್ಣಗೊಂಡಿದೆ",
                funded: "ಹಣಕಾಸು ಒದಗಿಸಲಾಗಿದೆ",
                showAll: "ಎಲ್ಲಾ ತೋರಿಸಿ",
                showEligible: "ಫಲಾನುಭವಿಗಳನ್ನು ಮಾತ್ರ ತೋರಿಸಿ",
            },
            hi: {
                title: "मुद्दों के लिए धन लागू करें",
                subtitle: "विकास कार्यों के लिए धन का अनुरोध करें",
                selectIssue: "वित्तपोषण के लिए समस्या चुनें",
                searchIssues: "समस्याएं खोजें...",
                noIssues: "वित्तपोषण के लिए कोई समस्या उपलब्ध नहीं है",
                amount: "राशि (₹)",
                reason: "विस्तृत औचित्य",
                timeline: "आवश्यक समय सीमा",
                timelinePlaceholder: "धन कब चाहिए",
                immediate: "तत्काल (3 दिनों के भीतर)",
                sevenDays: "7 दिनों के भीतर",
                fifteenDays: "15 दिनों के भीतर",
                thirtyDays: "30 दिनों के भीतर",
                custom: "कस्टम तिथि",
                customDate: "विशिष्ट तिथि चुनें",
                estimatedCost: "अनुमानित लागत विवरण",
                costPlaceholder: "जैसे: सामग्री: ₹20,000, श्रम: ₹15,000...",
                submit: "धन अनुरोध भेजें",
                sending: "भेजा जा रहा है…",
                back: "वापस",
                success: "फंड अनुरोध सफलतापूर्वक भेजा गया",
                error: "कुछ गलत हो गया",
                selectIssueFirst: "कृपया पहले एक समस्या चुनें",
                invalidAmount: "मान्य राशि दर्ज करें",
                reasonRequired: "विस्तृत औचित्य आवश्यक है",
                timelineRequired: "कृपया समय सीमा चुनें",
                loadingIssues: "समस्याएं लोड हो रही हैं...",
                loadingProfile: "प्रोफ़ाइल लोड हो रही है...",
                loading: "लोड हो रहा है...",
                refresh: "रिफ्रेश करें",
                issueDetails: "समस्या विवरण",
                category: "श्रेणी",
                dateReported: "रिपोर्ट की तिथि",
                status: "स्थिति",
                currentStatus: "वर्तमान स्थिति",
                verified: "सत्यापित",
                notVerified: "सत्यापित नहीं",
                budgetAllocation: "बजट आवंटन",
                otherExpenses: "अन्य खर्च",
                total: "कुल",
                networkError: "नेटवर्क त्रुटि। कृपया अपना कनेक्शन जांचें।",
                retry: "पुनः प्रयास करें",
                loadingData: "डेटा लोड हो रहा है...",
                noIssuesFound: "आपकी पंचायत में कोई समस्या नहीं मिली",
                tryRefresh: "रिफ्रेश करें या बाद में पुनः जांचें",
                issueId: "समस्या ID",
                location: "स्थान",
                priority: "प्राथमिकता",
                verifiedStatus: "सत्यापन स्थिति",
                assignedTo: "आवंटित किया गया",
                high: "उच्च",
                medium: "मध्यम",
                low: "कम",
                urgent: "जरूरी",
                viVerified: "VI द्वारा सत्यापित",
                department: "विभाग",
                verifiedByVI: "VI द्वारा सत्यापित",
                readyForFunding: "वित्तपोषण के लिए तैयार",
                allIssues: "सभी समस्याएं",
                filter: "फ़िल्टर",
                clearFilter: "फ़िल्टर साफ़ करें",
                eligibilityCriteria: "पात्रता मानदंड",
                eligibleForFunding: "वित्तपोषण के लिए पात्र",
                notEligible: "पात्र नहीं",
                criteriaNote: "मुद्दों को सत्यापित या किसी विभाग को सौंपा जाना चाहिए",
                fundingStatus: "वित्तपोषण स्थिति",
                alreadyFunded: "पहले ही धन प्राप्त हो चुका है",
                fundingPending: "धन लंबित है",
                ready: "तैयार",
                eligible: "पात्र",
                ineligible: "अपात्र",
                applyFunds: "धन लागू करें",
                fundingApplied: "धन लागू किया गया",
                checkEligibility: "पात्रता जांचें",
                viewAll: "सभी देखें",
                fundingEligible: "वित्तपोषण पात्र",
                viewDetails: "विवरण देखें",
                applyNow: "अभी लागू करें",
                selectToApply: "धन लागू करने के लिए चुनें",
                cannotApply: "इस समस्या पर धन लागू नहीं किया जा सकता",
                alreadyRequested: "धन पहले ही अनुरोधित किया जा चुका है",
                resolved: "हल हो गया",
                closed: "बंद",
                completed: "पूर्ण",
                funded: "वित्त पोषित",
                showAll: "सभी दिखाएं",
                showEligible: "केवल पात्र दिखाएं",
            },
        };
        return L[locale] || L.en;
    }, [locale]);

    /* ---------------- state ---------------- */
    const [amount, setAmount] = useState("");
    const [reason, setReason] = useState("");
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");
    const [authority, setAuthority] = useState<any>(null);
    const [issues, setIssues] = useState<Issue[]>([]);
    const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [showTimelineDropdown, setShowTimelineDropdown] = useState(false);
    const [selectedTimeline, setSelectedTimeline] = useState<TimelineOption | null>(null);
    const [customDate, setCustomDate] = useState("");
    const [materialsCost, setMaterialsCost] = useState("");
    const [laborCost, setLaborCost] = useState("");
    const [transportCost, setTransportCost] = useState("");
    const [otherCost, setOtherCost] = useState("");
    const [showBudgetBreakdown, setShowBudgetBreakdown] = useState(false);
    
    // Loading states
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [loadingIssues, setLoadingIssues] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    // Ref for dropdown
    const issueDropdownRef = useRef<HTMLDivElement>(null);

    /* ---------------- timeline options ---------------- */
    const timelineOptions: TimelineOptionType[] = useMemo(() => [
        { id: "immediate", label: t.immediate, value: 3, description: "Urgent requirement" },
        { id: "7days", label: t.sevenDays, value: 7, description: "Next week" },
        { id: "15days", label: t.fifteenDays, value: 15, description: "Within fortnight" },
        { id: "30days", label: t.thirtyDays, value: 30, description: "Within month" },
        { id: "custom", label: t.custom, value: 0, description: t.customDate },
    ], [t]);

    /* ---------------- check if issue is eligible for funding ---------------- */
    const isEligibleForFunding = useCallback((issue: Issue): boolean => {
        // Issues that are NOT eligible
        const ineligibleStatuses = [
            'resolved', 'closed', 'completed', 'funded', 
            'fund_requested', 'rejected', 'cancelled'
        ];
        
        if (ineligibleStatuses.includes(issue.status?.toLowerCase())) {
            return false;
        }
        
        // Check funding status
        if (issue.fundingStatus === 'funded' || issue.fundRequested === true) {
            return false;
        }
        
        // Eligible if: verified by VI OR assigned to department OR already verified
        const isEligible = 
            issue.viVerifiedAt || 
            issue.assignedDepartment || 
            issue.status === 'verified' || 
            issue.status === 'assigned' ||
            issue.isVerified === true;
        
        return isEligible;
    }, []);

    /* ---------------- load data ---------------- */
    const loadData = useCallback(async (refresh = false) => {
        if (refresh) {
            setRefreshing(true);
        } else {
            setLoadingProfile(true);
            setLoadingIssues(true);
        }
        setLoadError(null);

        try {
            // Check authentication
            const u = auth.currentUser;
            if (!u) {
                router.replace(`/${locale}/authority/login`);
                return;
            }

            // Load profile
            const snap = await getDoc(doc(db, "authorities", u.uid));
            if (!snap.exists()) {
                router.replace(`/${locale}/authority/register`);
                return;
            }

            const a = snap.data();
            if (a.role !== "pdo") {
                router.replace(`/${locale}/authority/status`);
                return;
            }

            setAuthority(a);
            setLoadingProfile(false);

            // Load ALL issues in PDO's panchayat
            const issuesQuery = query(
                collection(db, "issues"),
                where("panchayatId", "==", a.panchayatId)
            );

            const issuesSnapshot = await getDocs(issuesQuery);
            const issuesList: Issue[] = [];
            
            // Also check fund_requests collection for funding status
            const fundRequestsQuery = query(
                collection(db, "fund_requests"),
                where("panchayatId", "==", a.panchayatId)
            );
            const fundRequestsSnapshot = await getDocs(fundRequestsQuery);
            const fundRequests: Map<string, boolean> = new Map();
            
            fundRequestsSnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.issueId) {
                    fundRequests.set(data.issueId, true);
                }
            });

            issuesSnapshot.forEach((doc) => {
                const issueData = doc.data();
                const issueId = doc.id;
                
                issuesList.push({
                    id: issueId,
                    ...issueData,
                    fundRequested: fundRequests.has(issueId),
                    fundingStatus: fundRequests.has(issueId) ? 'requested' : 'none'
                } as Issue);
            });

            // Sort issues by creation date (newest first)
            issuesList.sort((a, b) => {
                const dateA = a.createdAt?.toDate?.() || new Date(0);
                const dateB = b.createdAt?.toDate?.() || new Date(0);
                return dateB.getTime() - dateA.getTime();
            });

            setIssues(issuesList);
            setLoadingIssues(false);
            
            if (issuesList.length === 0) {
                setLoadError(t.noIssuesFound);
            }
            
        } catch (error: any) {
            console.error("Load error:", error);
            setLoadError(t.networkError);
            setLoadingProfile(false);
            setLoadingIssues(false);
        } finally {
            if (refresh) {
                setRefreshing(false);
            }
        }
    }, [router, locale, t]);

    /* ---------------- filtered issues ---------------- */
    const filteredIssues = useMemo(() => {
        let filtered = issues;
        
        // Filter by search query
        if (searchQuery.trim()) {
            filtered = filtered.filter(issue =>
                issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                issue.categoryName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                issue.displayId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                issue.specificLocation?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        
        return filtered;
    }, [issues, searchQuery]);

    /* ---------------- initial load ---------------- */
    useEffect(() => {
        loadData();
    }, [loadData]);

    /* ---------------- handle refresh ---------------- */
    const handleRefresh = () => {
        loadData(true);
    };

    /* ---------------- handle retry ---------------- */
    const handleRetry = () => {
        setLoadError(null);
        loadData();
    };

    /* ---------------- calculate total ---------------- */
    useEffect(() => {
        const calculateTotal = () => {
            const materials = parseFloat(materialsCost) || 0;
            const labor = parseFloat(laborCost) || 0;
            const transport = parseFloat(transportCost) || 0;
            const other = parseFloat(otherCost) || 0;
            const total = materials + labor + transport + other;
            if (total > 0 && !amount) {
                setAmount(total.toString());
            }
        };

        const timeout = setTimeout(calculateTotal, 500);
        return () => clearTimeout(timeout);
    }, [materialsCost, laborCost, transportCost, otherCost, amount]);

    /* ---------------- get status badge ---------------- */
    const getStatusBadge = (issue: Issue) => {
        if (issue.fundRequested) {
            return {
                text: t.fundingApplied,
                color: "bg-purple-100 text-purple-800 border-purple-200",
                icon: <FiCheckCircle className="w-3 h-3" />
            };
        }
        
        if (issue.viVerifiedAt) {
            return {
                text: t.viVerified,
                color: "bg-green-100 text-green-800 border-green-200",
                icon: <FiShield className="w-3 h-3" />
            };
        }
        
        if (issue.status === "assigned" && issue.assignedDepartment) {
            return {
                text: `${t.assignedTo}: ${issue.assignedDepartment}`,
                color: "bg-blue-100 text-blue-800 border-blue-200",
                icon: <FiCheck className="w-3 h-3" />
            };
        }
        
        if (issue.status === "verified") {
            return {
                text: t.verified,
                color: "bg-green-100 text-green-800 border-green-200",
                icon: <FiCheck className="w-3 h-3" />
            };
        }
        
        if (issue.status === "in_progress") {
            return {
                text: issue.currentStatus || t.currentStatus,
                color: "bg-yellow-100 text-yellow-800 border-yellow-200",
                icon: <FiClock className="w-3 h-3" />
            };
        }
        
        return {
            text: issue.status || t.status,
            color: "bg-gray-100 text-gray-800 border-gray-200",
            icon: <FiInfo className="w-3 h-3" />
        };
    };

    /* ---------------- get eligibility badge ---------------- */
    const getEligibilityBadge = (issue: Issue) => {
        const isEligible = isEligibleForFunding(issue);
        
        if (issue.fundRequested) {
            return {
                text: t.alreadyRequested,
                color: "bg-purple-100 text-purple-800 border-purple-200",
                icon: <FiCheckSquare className="w-3 h-3" />
            };
        }
        
        if (!isEligible) {
            return {
                text: t.notEligible,
                color: "bg-red-100 text-red-800 border-red-200",
                icon: <FiAlertTriangle className="w-3 h-3" />
            };
        }
        
        return {
            text: t.eligibleForFunding,
            color: "bg-green-100 text-green-800 border-green-200",
            icon: <FiCheckCircle className="w-3 h-3" />
        };
    };

    /* ---------------- get priority color ---------------- */
    const getPriorityColor = (priority: string) => {
        switch (priority?.toLowerCase()) {
            case 'high':
            case 'urgent':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'medium':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'low':
                return 'bg-green-100 text-green-800 border-green-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    /* ---------------- get priority text ---------------- */
    const getPriorityText = (priority: string) => {
        switch (priority?.toLowerCase()) {
            case 'high':
                return t.high;
            case 'medium':
                return t.medium;
            case 'low':
                return t.low;
            case 'urgent':
                return t.urgent;
            default:
                return priority || t.medium;
        }
    };

    /* ---------------- submit ---------------- */
    const submit = async () => {
        setErr("");

        // Validation
        if (!selectedIssue) {
            setErr(t.selectIssueFirst);
            return;
        }
        
        // Check eligibility
        if (!isEligibleForFunding(selectedIssue)) {
            setErr(t.cannotApply);
            return;
        }
        
        if (!amount || Number(amount) <= 0) {
            setErr(t.invalidAmount);
            return;
        }
        if (!reason.trim()) {
            setErr(t.reasonRequired);
            return;
        }
        if (!selectedTimeline) {
            setErr(t.timelineRequired);
            return;
        }

        try {
            setLoading(true);

            // Calculate budget breakdown
            const budgetBreakdown = {
                materials: parseFloat(materialsCost) || 0,
                labor: parseFloat(laborCost) || 0,
                transport: parseFloat(transportCost) || 0,
                other: parseFloat(otherCost) || 0,
                total: Number(amount)
            };

            // Prepare timeline data
            const timelineData = selectedTimeline === "custom"
                ? { type: "custom", date: customDate }
                : { type: selectedTimeline, days: timelineOptions.find(t => t.id === selectedTimeline)?.value };

            await addDoc(collection(db, "fund_requests"), {
                // Issue reference
                issueId: selectedIssue.id,
                issueTitle: selectedIssue.title,
                issueCategory: selectedIssue.categoryName || selectedIssue.category,
                issueDescription: selectedIssue.description,
                issueDisplayId: selectedIssue.displayId,
                issuePriority: selectedIssue.priority,
                issueLocation: selectedIssue.specificLocation,
                issueDepartment: selectedIssue.assignedDepartment,
                issueStatus: selectedIssue.status,
                issueVerifiedByVI: selectedIssue.viVerifiedAt ? true : false,
                issueEligible: isEligibleForFunding(selectedIssue),

                // Request details
                amount: Number(amount),
                reason: reason.trim(),
                purpose: reason.trim(),
                status: "pending",

                // Budget breakdown
                budgetBreakdown: budgetBreakdown,
                estimatedTotal: budgetBreakdown.total,

                // Timeline
                requiredTimeline: timelineData,
                requestedBy: auth.currentUser!.uid,
                pdoUid: auth.currentUser!.uid,
                pdoName: authority.name,

                // Jurisdiction
                panchayatId: authority.panchayatId,
                talukId: authority.talukId,
                districtId: authority.districtId,

                // Timestamps
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            // Success animation and redirect
            setTimeout(() => {
                alert(t.success);
                router.replace(`/${locale}/authority/pdo/dashboard`);
            }, 500);

        } catch (e: any) {
            console.error(e);
            setErr(t.error);
        } finally {
            setLoading(false);
        }
    };

    /* ---------------- animations ---------------- */
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: "spring" as const,
                stiffness: 100
            }
        }
    };

    /* ---------------- main UI ---------------- */
    return (
        <Screen padded>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="min-h-screen bg-gradient-to-b from-green-50 to-white p-4 pb-24"
            >
                {/* Header */}
                <motion.div
                    variants={itemVariants}
                    className="flex items-center gap-3 mb-6 sticky top-0 bg-white/80 backdrop-blur-sm z-10 pt-4"
                >
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => router.back()}
                        className="p-3 rounded-xl border-2 border-green-200 bg-white shadow-sm"
                    >
                        <FiArrowLeft className="text-green-700" />
                    </motion.button>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-green-900">{t.title}</h1>
                        <p className="text-sm text-green-700/80">{t.subtitle}</p>
                        {authority?.panchayatId && (
                            <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full inline-flex items-center gap-1 mt-1">
                                <FiInfo className="w-3 h-3" />
                                Panchayat ID: {authority.panchayatId}
                            </div>
                        )}
                    </div>
                    
                    {/* Refresh Button */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="p-2 rounded-lg border border-green-200 bg-white"
                    >
                        <FiRefreshCw 
                            className={`w-5 h-5 text-green-600 ${refreshing ? 'animate-spin' : ''}`}
                        />
                    </motion.button>
                </motion.div>

                {/* Error */}
                <AnimatePresence>
                    {err && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-2xl flex gap-3 items-start"
                        >
                            <FiAlertCircle className="text-red-600 mt-0.5 flex-shrink-0" />
                            <p className="text-red-700 text-sm flex-1">{err}</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Loading State */}
                {loadingIssues && !refreshing && !loadError && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-8 text-center"
                    >
                        <FiLoader className="w-8 h-8 animate-spin text-green-600 mx-auto mb-3" />
                        <p className="text-green-700">{t.loadingIssues}</p>
                    </motion.div>
                )}

                {/* Error State */}
                {loadError && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl"
                    >
                        <div className="flex items-center gap-3">
                            <FiAlertCircle className="text-red-600 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="text-red-700 text-sm">{loadError}</p>
                                <button
                                    onClick={handleRetry}
                                    className="mt-2 text-red-600 text-sm font-medium flex items-center gap-1"
                                >
                                    <FiRefreshCw className="w-3 h-3" />
                                    {t.retry}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* No Issues Found */}
                {!loadingIssues && filteredIssues.length === 0 && !loadError && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mb-6 p-6 text-center bg-gradient-to-b from-green-50 to-white rounded-xl border border-green-200"
                    >
                        <FiFileText className="w-12 h-12 text-green-400 mx-auto mb-3" />
                        <p className="text-green-700 font-medium mb-2">{t.noIssuesFound}</p>
                        <p className="text-green-600 text-sm mb-4">{t.tryRefresh}</p>
                        <button
                            onClick={handleRefresh}
                            className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium flex items-center gap-2 mx-auto"
                        >
                            <FiRefreshCw className="w-4 h-4" />
                            {t.refresh}
                        </button>
                    </motion.div>
                )}

                {!loadingIssues && filteredIssues.length > 0 && (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="space-y-6"
                    >
                        {/* Simple Issue Selection */}
                        <motion.div variants={itemVariants} className="relative">
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-semibold text-green-900">
                                    {t.selectIssue}
                                    <span className="text-red-500 ml-1">*</span>
                                </label>
                                <div className="text-xs text-green-600 flex items-center gap-1">
                                    <FiInfo className="w-3 h-3" />
                                    {filteredIssues.length} {t.allIssues}
                                </div>
                            </div>
                            
                            <div className="space-y-2 max-h-60 overflow-y-auto p-1">
                                {filteredIssues.map((issue) => {
                                    const isEligible = isEligibleForFunding(issue);
                                    const isSelected = selectedIssue?.id === issue.id;
                                    
                                    return (
                                        <motion.div
                                            key={issue.id}
                                            whileHover={{ scale: 1.01 }}
                                            whileTap={{ scale: 0.99 }}
                                            onClick={() => setSelectedIssue(issue)}
                                            className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${isSelected ? 'border-green-500 bg-green-50' : 'border-green-200 bg-white hover:bg-green-50'} ${!isEligible ? 'opacity-70 cursor-not-allowed' : ''}`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="font-medium text-green-900">{issue.title}</div>
                                                    <div className="text-xs text-green-700/70 mt-1 flex items-center gap-2">
                                                        <FiTag className="w-3 h-3" />
                                                        {issue.categoryName || issue.category}
                                                    </div>
                                                    <div className="text-xs text-green-700/50 mt-1 flex items-center gap-2">
                                                        <span>{issue.displayId}</span>
                                                        <span className={`px-1.5 py-0.5 rounded-full text-xs ${isEligible ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                            {isEligible ? t.eligible : t.ineligible}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-1 ml-2">
                                                    <span className={`px-2 py-0.5 rounded-full text-xs ${getPriorityColor(issue.priority)}`}>
                                                        {getPriorityText(issue.priority)}
                                                    </span>
                                                    {isSelected && (
                                                        <FiCheck className="w-4 h-4 text-green-600" />
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </motion.div>

                        {/* Selected Issue Details */}
                        {selectedIssue && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="mt-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-semibold text-green-900 text-sm">{t.issueDetails}</h3>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-1 ${getPriorityColor(selectedIssue.priority)} text-xs rounded-full font-semibold`}>
                                            {getPriorityText(selectedIssue.priority)}
                                        </span>
                                        {selectedIssue.viVerifiedAt && (
                                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-semibold flex items-center gap-1">
                                                <FiShield className="w-3 h-3" />
                                                {t.viVerified}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-green-700/70">{t.category}:</span>
                                        <span className="font-medium text-green-900">{selectedIssue.categoryName || selectedIssue.category}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-green-700/70">{t.issueId}:</span>
                                        <span className="font-medium text-green-900">{selectedIssue.displayId}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-green-700/70">{t.location}:</span>
                                        <span className="font-medium text-green-900 text-right">{selectedIssue.specificLocation}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-green-700/70">{t.fundingStatus}:</span>
                                        <span className={`font-medium ${isEligibleForFunding(selectedIssue) ? 'text-green-700' : 'text-red-700'}`}>
                                            {isEligibleForFunding(selectedIssue) ? t.eligibleForFunding : t.notEligible}
                                        </span>
                                    </div>
                                    {selectedIssue.assignedDepartment && (
                                        <div className="flex justify-between">
                                            <span className="text-green-700/70">{t.department}:</span>
                                            <span className="font-medium text-green-900">{selectedIssue.assignedDepartment}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-green-700/70">{t.dateReported}:</span>
                                        <span className="font-medium text-green-900">
                                            {selectedIssue.createdAt?.toDate?.().toLocaleDateString() || 'N/A'}
                                        </span>
                                    </div>
                                    {selectedIssue.viVerifiedAt && (
                                        <div className="flex justify-between">
                                            <span className="text-green-700/70">{t.verifiedByVI}:</span>
                                            <span className="font-medium text-green-900">
                                                {selectedIssue.viVerifiedAt?.toDate?.().toLocaleDateString() || 'N/A'}
                                            </span>
                                        </div>
                                    )}
                                    <div className="text-green-700/80 mt-2 text-sm pt-2 border-t border-green-200">
                                        <div className="font-medium mb-1">Description:</div>
                                        {selectedIssue.description}
                                    </div>
                                    
                                    {/* Eligibility Warning */}
                                    {!isEligibleForFunding(selectedIssue) && (
                                        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                                            <div className="flex items-center gap-2 text-red-700 text-xs">
                                                <FiAlertTriangle className="w-3 h-3 flex-shrink-0" />
                                                <span>{t.cannotApply}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* Timeline Selection */}
                        <motion.div variants={itemVariants}>
                            <label className="block text-sm font-semibold text-green-900 mb-2">
                                {t.timeline}
                                <span className="text-red-500 ml-1">*</span>
                            </label>
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setShowTimelineDropdown(!showTimelineDropdown)}
                                    className={`w-full p-4 rounded-xl border-2 ${selectedTimeline ? 'border-blue-500 bg-blue-50' : 'border-green-200 bg-white'} flex items-center justify-between transition-all duration-300`}
                                >
                                    <div className="text-left">
                                        {selectedTimeline ? (
                                            <div>
                                                <div className="font-semibold text-blue-900">
                                                    {timelineOptions.find(t => t.id === selectedTimeline)?.label}
                                                </div>
                                                <div className="text-xs text-blue-700/70 mt-1 flex items-center gap-2">
                                                    <FiClock className="w-3 h-3" />
                                                    {timelineOptions.find(t => t.id === selectedTimeline)?.description}
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-green-700/60">{t.timelinePlaceholder}</span>
                                        )}
                                    </div>
                                    {showTimelineDropdown ? <FiChevronUp /> : <FiChevronDown />}
                                </button>

                                <AnimatePresence>
                                    {showTimelineDropdown && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-blue-200 rounded-xl shadow-lg z-50"
                                        >
                                            <div className="p-2">
                                                {timelineOptions.map((option) => (
                                                    <motion.button
                                                        key={option.id}
                                                        type="button"
                                                        whileHover={{ backgroundColor: "#dbeafe" }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={() => {
                                                            setSelectedTimeline(option.id);
                                                            setShowTimelineDropdown(false);
                                                        }}
                                                        className={`w-full p-3 text-left rounded-lg mb-1 transition-all ${selectedTimeline === option.id ? 'bg-blue-100 border-blue-500 border' : 'hover:bg-blue-50'}`}
                                                    >
                                                        <div className="font-medium text-blue-900">{option.label}</div>
                                                        <div className="text-xs text-blue-700/70 mt-1">{option.description}</div>
                                                    </motion.button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Custom Date Input */}
                            {selectedTimeline === 'custom' && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-3"
                                >
                                    <input
                                        type="date"
                                        value={customDate}
                                        onChange={(e) => setCustomDate(e.target.value)}
                                        className="w-full p-3 rounded-xl border-2 border-blue-200 bg-white"
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                </motion.div>
                            )}
                        </motion.div>

                        {/* Budget Breakdown */}
                        <motion.div variants={itemVariants}>
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-sm font-semibold text-green-900">
                                    {t.budgetAllocation}
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setShowBudgetBreakdown(!showBudgetBreakdown)}
                                    className="text-sm text-green-600 font-medium flex items-center gap-1"
                                >
                                    {showBudgetBreakdown ? 'Hide' : 'Show'} Breakdown
                                    {showBudgetBreakdown ? <FiChevronUp /> : <FiChevronDown />}
                                </button>
                            </div>

                            <AnimatePresence>
                                {showBudgetBreakdown && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="space-y-3 mb-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl"
                                    >
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-xs font-medium text-amber-900 mb-1 block">
                                                    Materials
                                                </label>
                                                <input
                                                    type="text"
                                                    value={materialsCost}
                                                    onChange={(e) => setMaterialsCost(e.target.value.replace(/\D/g, ""))}
                                                    className="w-full p-2 rounded-lg border border-amber-300 bg-white text-sm"
                                                    placeholder="₹"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-amber-900 mb-1 block">
                                                    Labor
                                                </label>
                                                <input
                                                    type="text"
                                                    value={laborCost}
                                                    onChange={(e) => setLaborCost(e.target.value.replace(/\D/g, ""))}
                                                    className="w-full p-2 rounded-lg border border-amber-300 bg-white text-sm"
                                                    placeholder="₹"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-amber-900 mb-1 block">
                                                    Transport
                                                </label>
                                                <input
                                                    type="text"
                                                    value={transportCost}
                                                    onChange={(e) => setTransportCost(e.target.value.replace(/\D/g, ""))}
                                                    className="w-full p-2 rounded-lg border border-amber-300 bg-white text-sm"
                                                    placeholder="₹"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-amber-900 mb-1 block">
                                                    {t.otherExpenses}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={otherCost}
                                                    onChange={(e) => setOtherCost(e.target.value.replace(/\D/g, ""))}
                                                    className="w-full p-2 rounded-lg border border-amber-300 bg-white text-sm"
                                                    placeholder="₹"
                                                />
                                            </div>
                                        </div>

                                        <div className="pt-3 border-t border-amber-300">
                                            <div className="flex justify-between items-center">
                                                <span className="font-semibold text-amber-900">{t.total}:</span>
                                                <span className="text-xl font-bold text-amber-700">
                                                    ₹{(parseFloat(materialsCost) || 0) + (parseFloat(laborCost) || 0) + (parseFloat(transportCost) || 0) + (parseFloat(otherCost) || 0)}
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>

                        {/* Amount */}
                        <motion.div variants={itemVariants}>
                            <label className="block text-sm font-semibold text-green-900 mb-2">
                                {t.amount}
                                <span className="text-red-500 ml-1">*</span>
                            </label>
                            <div className="relative">
                                <FiDollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-green-600" />
                                <input
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
                                    className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-green-200 bg-white text-lg font-semibold"
                                    placeholder="50000"
                                    inputMode="numeric"
                                />
                            </div>
                        </motion.div>

                        {/* Reason */}
                        <motion.div variants={itemVariants}>
                            <label className="block text-sm font-semibold text-green-900 mb-2">
                                {t.reason}
                                <span className="text-red-500 ml-1">*</span>
                            </label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border-2 border-green-200 bg-white min-h-[120px] resize-none"
                                placeholder={t.costPlaceholder}
                                rows={4}
                            />
                        </motion.div>

                        {/* Submit Button */}
                        <motion.div variants={itemVariants}>
                            <motion.button
                                type="button"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={submit}
                                disabled={loading || loadingIssues || filteredIssues.length === 0 || !selectedIssue || !isEligibleForFunding(selectedIssue)}
                                className="w-full py-4 rounded-xl bg-gradient-to-r from-green-600 via-emerald-500 to-green-600 text-white font-bold text-lg flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-green-200"
                            >
                                {loading ? (
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                                    />
                                ) : (
                                    <FiSend className="w-5 h-5" />
                                )}
                                {loading ? t.sending : t.submit}
                            </motion.button>
                        </motion.div>
                    </motion.div>
                )}

                {/* Bottom Navigation Bar */}
                <motion.div
                    initial={{ y: 100 }}
                    animate={{ y: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="fixed bottom-4 left-4 right-4 bg-white/90 backdrop-blur-lg border-2 border-green-100 rounded-2xl p-2 shadow-xl"
                >
                    <div className="grid grid-cols-5 gap-1">
                        <motion.button
                            type="button"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex flex-col items-center justify-center p-3 rounded-xl transition-all hover:bg-green-50"
                            onClick={() => router.push(`/${locale}/authority/pdo/dashboard`)}
                        >
                            <FiHome className="w-5 h-5 text-green-600" />
                            <span className="text-xs mt-1 font-medium text-green-700">Home</span>
                        </motion.button>

                        <motion.button
                            type="button"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex flex-col items-center justify-center p-3 rounded-xl transition-all hover:bg-green-50"
                            onClick={() => router.push(`/${locale}/authority/pdo/issues`)}
                        >
                            <FiFileText className="w-5 h-5 text-green-600" />
                            <span className="text-xs mt-1 font-medium text-green-700">Issues</span>
                        </motion.button>

                        <motion.button
                            type="button"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex flex-col items-center justify-center p-3 rounded-xl transition-all bg-gradient-to-b from-green-100 to-emerald-50"
                        >
                            <FiDollarSign className="w-5 h-5 text-green-700" />
                            <span className="text-xs mt-1 font-bold text-green-800">Funds</span>
                        </motion.button>

                        <motion.button
                            type="button"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex flex-col items-center justify-center p-3 rounded-xl transition-all hover:bg-green-50"
                            onClick={() => router.push(`/${locale}/authority/pdo/assignments`)}
                        >
                            <FiSend className="w-5 h-5 text-green-600" />
                            <span className="text-xs mt-1 font-medium text-green-700">Assign</span>
                        </motion.button>

                        <motion.button
                            type="button"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex flex-col items-center justify-center p-3 rounded-xl transition-all hover:bg-green-50"
                            onClick={() => router.push(`/${locale}/authority/pdo/profile`)}
                        >
                            <FiUser className="w-5 h-5 text-green-600" />
                            <span className="text-xs mt-1 font-medium text-green-700">Profile</span>
                        </motion.button>
                    </div>
                </motion.div>
            </motion.div>
        </Screen>
    );
}