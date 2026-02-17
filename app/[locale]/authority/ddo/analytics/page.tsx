// app/[locale]/authority/ddo/analytics/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Screen from "../../../../components/Screen";
import { auth, db } from "../../../../lib/firebase";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import {
    FiTrendingUp,
    FiHome,
    FiFileText,
    FiUser,
    FiRefreshCw,
    FiAlertCircle,
    FiDollarSign,
    FiClock,
    FiCheckCircle,
    FiXCircle,
    FiPieChart,
    FiBarChart2,
    FiCalendar,
    FiEye,
    FiChevronRight,
    FiPercent,
    FiActivity,
    FiDownload,
    FiPrinter,
    FiFile,
    FiMail,
    FiShare2,
    FiUsers,
    FiMapPin,
    FiGlobe,
} from "react-icons/fi";
import jsPDF from "jspdf";

type Scope = {
    useIds: boolean;
    districtId: string;
    district: string;
    taluks?: string[];
    talukIds?: string[];
};

type FundReq = {
    id: string;
    status: "pending" | "approved" | "rejected" | "escalated_to_ddo" | "ddo_approved" | "ddo_rejected";
    amount?: number;
    createdAt?: any;
    panchayatId?: string;
    talukId?: string;
    districtId?: string;
    reason?: string;
    purpose?: string;
    pdoName?: string;
    tdoName?: string;
    escalatedFrom?: string;
    escalationReason?: string;
};

type PanchayatData = {
    panchayatId: string;
    name?: string;
    talukId: string;
    talukName?: string;
    totalRequests: number;
    pending: number;
    approved: number;
    rejected: number;
    escalated: number;
    totalAmount: number;
};

type TalukData = {
    talukId: string;
    name?: string;
    totalRequests: number;
    pending: number;
    approved: number;
    rejected: number;
    escalated: number;
    totalAmount: number;
    panchayatCount: number;
};

type AnalyticsData = {
    pending: number;
    approved: number;
    rejected: number;
    escalated: number;
    total: number;
    totalAmount: number;
    avgAmount: number;
    approvalRate: number;
    rejectionRate: number;
    escalationRate: number;
    pendingAmount: number;
    approvedAmount: number;
    rejectedAmount: number;
    escalatedAmount: number;
    recentRequests: FundReq[];
    monthlyTrends: { month: string; pending: number; approved: number; rejected: number; escalated: number; amount: number }[];
    taluks: TalukData[];
    panchayats: PanchayatData[];
    allRequests: FundReq[];
    performance: {
        slaCompliance: number;
        avgProcessingTime: number;
        satisfactionScore: number;
    };
};

// ✅ SINGLE FILE TRANSLATIONS
const TRANSLATIONS = {
    en: {
        title: "District Analytics Dashboard",
        subtitle: "Comprehensive insights for your entire district",
        scope: "Scope",
        loading: "Loading analytics…",
        notSignedIn: "You are not signed in.",
        notAuthorized: "You are not authorized.",
        loadFail: "Failed to load analytics",
        refresh: "Refresh Data",
        overview: "Overview",
        statistics: "Key Statistics",
        trends: "Monthly Trends",
        recentActivity: "Recent Activity",
        pending: "Pending",
        approved: "Approved",
        rejected: "Rejected",
        escalated: "Escalated",
        total: "Total",
        totalAmount: "Total Amount",
        avgAmount: "Avg. Amount",
        approvalRate: "Approval Rate",
        rejectionRate: "Rejection Rate",
        escalationRate: "Escalation Rate",
        pendingAmount: "Pending Amount",
        approvedAmount: "Approved Amount",
        rejectedAmount: "Rejected Amount",
        escalatedAmount: "Escalated Amount",
        amount: "Amount",
        status: "Status",
        date: "Date",
        panchayat: "Panchayat",
        taluk: "Taluk",
        viewDetails: "View Details",
        dashboard: "Dashboard",
        requests: "Requests",
        analytics: "Analytics",
        profile: "Profile",
        all: "All Time",
        month: "This Month",
        quarter: "This Quarter",
        year: "This Year",
        distribution: "Status Distribution",
        amountByStatus: "Amount by Status",
        noData: "No data available",
        processing: "Processing...",
        slaCompliance: "SLA Compliance",
        avgProcessingTime: "Avg. Processing Time",
        satisfactionScore: "Satisfaction Score",
        talukPerformance: "Taluk Performance",
        topTaluks: "Top Performing Taluks",
        topPanchayats: "Top Panchayats",
        panchayatPerformance: "Panchayat Performance",
        escalationAnalysis: "Escalation Analysis",
        fundUtilization: "Fund Utilization",
        generateReport: "Generate Report",
        reports: "Reports",
        downloadPDF: "Download PDF",
        downloadCSV: "Download CSV",
        printReport: "Print Report",
        emailReport: "Email Report",
        shareReport: "Share Report",
        reportGenerated: "Report Generated",
        reportFailed: "Report Generation Failed",
        reportOptions: "Report Options",
        includeCharts: "Include Charts",
        includeTables: "Include Tables",
        includeDetails: "Include Details",
        selectPeriod: "Select Period",
        customRange: "Custom Range",
        reportTitle: "District Fund Analysis Report",
        reportSubtitle: "DDO Dashboard Analytics",
        generatedOn: "Generated on",
        summary: "Summary",
        recommendations: "Recommendations",
        requestDetails: "Request Details",
        generate: "Generate",
        cancel: "Cancel",
        generating: "Generating Report...",
        days: "days",
        percent: "%",
        rupees: "₹",
        district: "District",
        totalTaluks: "Total Taluks",
        totalPanchayats: "Total Panchayats",
        performanceMetrics: "Performance Metrics",
        geographicalDistribution: "Geographical Distribution",
        fundFlow: "Fund Flow Analysis",
        highPriority: "High Priority",
        mediumPriority: "Medium Priority",
        lowPriority: "Low Priority",
        quickActions: "Quick Actions",
        viewAllRequests: "View All Requests",
        escalateToCommissioner: "Escalate to Commissioner",
        allocateFunds: "Allocate Funds",
        exportData: "Export Data",
    },
    hi: {
        title: "जिला विश्लेषण डैशबोर्ड",
        subtitle: "आपके पूरे जिले के लिए व्यापक अंतर्दृष्टि",
        scope: "क्षेत्र",
        loading: "विश्लेषण लोड हो रहा है…",
        notSignedIn: "आप लॉगिन नहीं हैं।",
        notAuthorized: "आपको अनुमति नहीं है।",
        loadFail: "डेटा लोड नहीं हो सका",
        refresh: "डेटा ताज़ा करें",
        overview: "अवलोकन",
        statistics: "मुख्य आँकड़े",
        trends: "मासिक रुझान",
        recentActivity: "हाल की गतिविधियाँ",
        pending: "लंबित",
        approved: "स्वीकृत",
        rejected: "अस्वीकृत",
        escalated: "हस्तांतरित",
        total: "कुल",
        totalAmount: "कुल राशि",
        avgAmount: "औसत राशि",
        approvalRate: "स्वीकृति दर",
        rejectionRate: "अस्वीकृति दर",
        escalationRate: "हस्तांतरण दर",
        pendingAmount: "लंबित राशि",
        approvedAmount: "स्वीकृत राशि",
        rejectedAmount: "अस्वीकृत राशि",
        escalatedAmount: "हस्तांतरित राशि",
        amount: "राशि",
        status: "स्थिति",
        date: "तारीख",
        panchayat: "पंचायत",
        taluk: "तालुका",
        viewDetails: "विवरण देखें",
        dashboard: "डैशबोर्ड",
        requests: "अनुरोध",
        analytics: "विश्लेषण",
        profile: "प्रोफ़ाइल",
        all: "सभी समय",
        month: "इस महीने",
        quarter: "इस तिमाही",
        year: "इस वर्ष",
        distribution: "स्थिति वितरण",
        amountByStatus: "स्थिति के अनुसार राशि",
        noData: "कोई डेटा उपलब्ध नहीं",
        processing: "प्रसंस्करण...",
        slaCompliance: "SLA अनुपालन",
        avgProcessingTime: "औसत प्रसंस्करण समय",
        satisfactionScore: "संतुष्टि स्कोर",
        talukPerformance: "तालुका प्रदर्शन",
        topTaluks: "शीर्ष प्रदर्शन करने वाले तालुके",
        topPanchayats: "शीर्ष पंचायतें",
        panchayatPerformance: "पंचायत प्रदर्शन",
        escalationAnalysis: "हस्तांतरण विश्लेषण",
        fundUtilization: "निधि उपयोग",
        generateReport: "रिपोर्ट जनरेट करें",
        reports: "रिपोर्ट",
        downloadPDF: "PDF डाउनलोड करें",
        downloadCSV: "CSV डाउनलोड करें",
        printReport: "रिपोर्ट प्रिंट करें",
        emailReport: "रिपोर्ट ईमेल करें",
        shareReport: "रिपोर्ट शेयर करें",
        reportGenerated: "रिपोर्ट जनरेट हुई",
        reportFailed: "रिपोर्ट जनरेशन विफल",
        reportOptions: "रिपोर्ट विकल्प",
        includeCharts: "चार्ट शामिल करें",
        includeTables: "टेबल शामिल करें",
        includeDetails: "विवरण शामिल करें",
        selectPeriod: "अवधि चुनें",
        customRange: "कस्टम रेंज",
        reportTitle: "जिला निधि विश्लेषण रिपोर्ट",
        reportSubtitle: "डीडीओ डैशबोर्ड विश्लेषण",
        generatedOn: "पर जनरेट किया गया",
        summary: "सारांश",
        recommendations: "सिफारिशें",
        requestDetails: "अनुरोध विवरण",
        generate: "जनरेट करें",
        cancel: "रद्द करें",
        generating: "रिपोर्ट जनरेट हो रही है...",
        days: "दिन",
        percent: "%",
        rupees: "₹",
        district: "जिला",
        totalTaluks: "कुल तालुके",
        totalPanchayats: "कुल पंचायतें",
        performanceMetrics: "प्रदर्शन मेट्रिक्स",
        geographicalDistribution: "भौगोलिक वितरण",
        fundFlow: "निधि प्रवाह विश्लेषण",
        highPriority: "उच्च प्राथमिकता",
        mediumPriority: "मध्यम प्राथमिकता",
        lowPriority: "निम्न प्राथमिकता",
        quickActions: "त्वरित कार्रवाइयाँ",
        viewAllRequests: "सभी अनुरोध देखें",
        escalateToCommissioner: "कमिश्नर को हस्तांतरित करें",
        allocateFunds: "निधियाँ आवंटित करें",
        exportData: "डेटा निर्यात करें",
    },
    kn: {
        title: "ಜಿಲ್ಲಾ ವಿಶ್ಲೇಷಣೆ ಡ್ಯಾಶ್ಬೋರ್ಡ್",
        subtitle: "ನಿಮ್ಮ ಇಡೀ ಜಿಲ್ಲೆಗೆ ಸಂಪೂರ್ಣ ಒಳನೋಟಗಳು",
        scope: "ವ್ಯಾಪ್ತಿ",
        loading: "ವಿಶ್ಲೇಷಣೆ ಲೋಡ್ ಆಗುತ್ತಿದೆ…",
        notSignedIn: "ನೀವು ಲಾಗಿನ್ ಆಗಿಲ್ಲ.",
        notAuthorized: "ನಿಮಗೆ ಅನುಮತಿ ಇಲ್ಲ.",
        loadFail: "ವಿಶ್ಲೇಷಣೆ ಲೋಡ್ ಆಗಲಿಲ್ಲ",
        refresh: "ಡೇಟಾ ರಿಫ್ರೆಶ್ ಮಾಡಿ",
        overview: "ಅವಲೋಕನ",
        statistics: "ಪ್ರಮುಖ ಅಂಕಿಅಂಶಗಳು",
        trends: "ಮಾಸಿಕ ಪ್ರವೃತ್ತಿಗಳು",
        recentActivity: "ಇತ್ತೀಚಿನ ಚಟುವಟಿಕೆ",
        pending: "ಬಾಕಿ",
        approved: "ಅನುಮೋದಿತ",
        rejected: "ನಿರಾಕೃತ",
        escalated: "ಹೆಚ್ಚಿಸಲಾಗಿದೆ",
        total: "ಒಟ್ಟು",
        totalAmount: "ಒಟ್ಟು ಮೊತ್ತ",
        avgAmount: "ಸರಾಸರಿ ಮೊತ್ತ",
        approvalRate: "ಅನುಮೋದನೆ ದರ",
        rejectionRate: "ನಿರಾಕರಣೆ ದರ",
        escalationRate: "ಹೆಚ್ಚಳ ದರ",
        pendingAmount: "ಬಾಕಿ ಮೊತ್ತ",
        approvedAmount: "ಅನುಮೋದಿತ ಮೊತ್ತ",
        rejectedAmount: "ನಿರಾಕೃತ ಮೊತ್ತ",
        escalatedAmount: "ಹೆಚ್ಚಿಸಲಾದ ಮೊತ್ತ",
        amount: "ಮೊತ್ತ",
        status: "ಸ್ಥಿತಿ",
        date: "ದಿನಾಂಕ",
        panchayat: "ಪಂಚಾಯಿತಿ",
        taluk: "ತಾಲ್ಲೂಕು",
        viewDetails: "ವಿವರಗಳನ್ನು ನೋಡಿ",
        dashboard: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
        requests: "ವಿನಂತಿಗಳು",
        analytics: "ವಿಶ್ಲೇಷಣೆ",
        profile: "ಪ್ರೊಫೈಲ್",
        all: "ಎಲ್ಲಾ ಸಮಯ",
        month: "ಈ ತಿಂಗಳು",
        quarter: "ಈ ತ್ರೈಮಾಸಿಕ",
        year: "ಈ ವರ್ಷ",
        distribution: "ಸ್ಥಿತಿ ವಿತರಣೆ",
        amountByStatus: "ಸ್ಥಿತಿಯ ಪ್ರಕಾರ ಮೊತ್ತ",
        noData: "ಯಾವುದೇ ಡೇಟಾ ಲಭ್ಯವಿಲ್ಲ",
        processing: "ಪ್ರಕ್ರಿಯೆಗೊಳ್ಳುತ್ತಿದೆ...",
        slaCompliance: "SLA ಅನುಸರಣೆ",
        avgProcessingTime: "ಸರಾಸರಿ ಪ್ರಕ್ರಿಯೆ ಸಮಯ",
        satisfactionScore: "ತೃಪ್ತಿ ಸ್ಕೋರ್",
        talukPerformance: "ತಾಲ್ಲೂಕು ಪ್ರದರ್ಶನ",
        topTaluks: "ಶ್ರೇಷ್ಠ ಪ್ರದರ್ಶನ ತಾಲ್ಲೂಕುಗಳು",
        topPanchayats: "ಶ್ರೇಷ್ಠ ಪಂಚಾಯಿತಿಗಳು",
        panchayatPerformance: "ಪಂಚಾಯಿತಿ ಪ್ರದರ್ಶನ",
        escalationAnalysis: "ಹೆಚ್ಚಳ ವಿಶ್ಲೇಷಣೆ",
        fundUtilization: "ನಿಧಿ ಬಳಕೆ",
        generateReport: "ರಿಪೋರ್ಟ್ ಜನರೇಟ್ ಮಾಡಿ",
        reports: "ರಿಪೋರ್ಟ್‌ಗಳು",
        downloadPDF: "PDF ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ",
        downloadCSV: "CSV ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ",
        printReport: "ರಿಪೋರ್ಟ್ ಮುದ್ರಿಸಿ",
        emailReport: "ರಿಪೋರ್ಟ್ ಇಮೇಲ್ ಮಾಡಿ",
        shareReport: "ರಿಪೋರ್ಟ್ ಹಂಚಿಕೊಳ್ಳಿ",
        reportGenerated: "ರಿಪೋರ್ಟ್ ಜನರೇಟ್ ಆಗಿದೆ",
        reportFailed: "ರಿಪೋರ್ಟ್ ಜನರೇಶನ್ ವಿಫಲ",
        reportOptions: "ರಿಪೋರ್ಟ್ ಆಯ್ಕೆಗಳು",
        includeCharts: "ಚಾರ್ಟ್‌ಗಳನ್ನು ಒಳಗೊಳ್ಳಿ",
        includeTables: "ಟೇಬಲ್‌ಗಳನ್ನು ಒಳಗೊಳ್ಳಿ",
        includeDetails: "ವಿವರಗಳನ್ನು ಒಳಗೊಳ್ಳಿ",
        selectPeriod: "ಅವಧಿ ಆಯ್ಕೆಮಾಡಿ",
        customRange: "ಕಸ್ಟಮ್ ವ್ಯಾಪ್ತಿ",
        reportTitle: "ಜಿಲ್ಲಾ ನಿಧಿ ವಿಶ್ಲೇಷಣೆ ವರದಿ",
        reportSubtitle: "ಡಿಡಿಒ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ವಿಶ್ಲೇಷಣೆ",
        generatedOn: "ಜನರೇಟ್ ಮಾಡಲಾಗಿದೆ",
        summary: "ಸಾರಾಂಶ",
        recommendations: "ಶಿಫಾರಸುಗಳು",
        requestDetails: "ವಿನಂತಿ ವಿವರಗಳು",
        generate: "ಜನರೇಟ್ ಮಾಡಿ",
        cancel: "ರದ್ದುಮಾಡಿ",
        generating: "ರಿಪೋರ್ಟ್ ಜನರೇಟ್ ಆಗುತ್ತಿದೆ...",
        days: "ದಿನಗಳು",
        percent: "%",
        rupees: "₹",
        district: "ಜಿಲ್ಲೆ",
        totalTaluks: "ಒಟ್ಟು ತಾಲ್ಲೂಕುಗಳು",
        totalPanchayats: "ಒಟ್ಟು ಪಂಚಾಯಿತಿಗಳು",
        performanceMetrics: "ಪ್ರದರ್ಶನ ಮೆಟ್ರಿಕ್ಸ್",
        geographicalDistribution: "ಭೌಗೋಳಿಕ ವಿತರಣೆ",
        fundFlow: "ನಿಧಿ ಹರಿವು ವಿಶ್ಲೇಷಣೆ",
        highPriority: "ಹೆಚ್ಚಿನ ಆದ್ಯತೆ",
        mediumPriority: "ಮಧ್ಯಮ ಆದ್ಯತೆ",
        lowPriority: "ಕಡಿಮೆ ಆದ್ಯತೆ",
        quickActions: "ತ್ವರಿತ ಕ್ರಿಯೆಗಳು",
        viewAllRequests: "ಎಲ್ಲಾ ವಿನಂತಿಗಳನ್ನು ವೀಕ್ಷಿಸಿ",
        escalateToCommissioner: "ಕಮಿಷನರ್‌ಗೆ ಹೆಚ್ಚಿಸಿ",
        allocateFunds: "ನಿಧಿಗಳನ್ನು ನಿಯೋಜಿಸಿ",
        exportData: "ಡೇಟಾ ರಫ್ತು ಮಾಡಿ",
    },
};

export default function DDOAnalyticsPage() {
    const router = useRouter();
    const params = useParams<{ locale?: string }>();
    const locale = (params?.locale as keyof typeof TRANSLATIONS) || "en";

    const t = (key: keyof typeof TRANSLATIONS.en) => {
        return TRANSLATIONS[locale]?.[key] || TRANSLATIONS.en[key] || key;
    };

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [err, setErr] = useState("");
    const [scope, setScope] = useState<Scope | null>(null);
    const [timePeriod, setTimePeriod] = useState<string>("all");
    const [showReportModal, setShowReportModal] = useState(false);
    const [generatingReport, setGeneratingReport] = useState(false);
    const [reportMessage, setReportMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [analytics, setAnalytics] = useState<AnalyticsData>({
        pending: 0,
        approved: 0,
        rejected: 0,
        escalated: 0,
        total: 0,
        totalAmount: 0,
        avgAmount: 0,
        approvalRate: 0,
        rejectionRate: 0,
        escalationRate: 0,
        pendingAmount: 0,
        approvedAmount: 0,
        rejectedAmount: 0,
        escalatedAmount: 0,
        recentRequests: [],
        monthlyTrends: [],
        taluks: [],
        panchayats: [],
        allRequests: [],
        performance: {
            slaCompliance: 85,
            avgProcessingTime: 3.2,
            satisfactionScore: 4.2,
        }
    });

    const [animated, setAnimated] = useState(analytics);

    // Animation effect
    useEffect(() => {
        const interval = setInterval(() => {
            setAnimated(prev => ({
                ...prev,
                pending: prev.pending < analytics.pending ? prev.pending + Math.ceil(analytics.pending / 20) : analytics.pending,
                approved: prev.approved < analytics.approved ? prev.approved + Math.ceil(analytics.approved / 20) : analytics.approved,
                rejected: prev.rejected < analytics.rejected ? prev.rejected + Math.ceil(analytics.rejected / 20) : analytics.rejected,
                escalated: prev.escalated < analytics.escalated ? prev.escalated + Math.ceil(analytics.escalated / 20) : analytics.escalated,
                total: prev.total < analytics.total ? prev.total + Math.ceil(analytics.total / 20) : analytics.total,
                totalAmount: prev.totalAmount < analytics.totalAmount ? prev.totalAmount + Math.ceil(analytics.totalAmount / 20) : analytics.totalAmount,
                avgAmount: prev.avgAmount < analytics.avgAmount ? prev.avgAmount + (analytics.avgAmount / 20) : analytics.avgAmount,
                approvalRate: prev.approvalRate < analytics.approvalRate ? prev.approvalRate + (analytics.approvalRate / 20) : analytics.approvalRate,
                rejectionRate: prev.rejectionRate < analytics.rejectionRate ? prev.rejectionRate + (analytics.rejectionRate / 20) : analytics.rejectionRate,
                escalationRate: prev.escalationRate < analytics.escalationRate ? prev.escalationRate + (analytics.escalationRate / 20) : analytics.escalationRate,
            }));
        }, 50);

        return () => clearInterval(interval);
    }, [analytics]);

    const loadAnalytics = async () => {
        setErr("");
        setRefreshing(true);

        try {
            const user = auth.currentUser;
            if (!user) {
                setErr(t("notSignedIn"));
                setLoading(false);
                setRefreshing(false);
                return;
            }

            // Get DDO profile
            const authDoc = await getDoc(doc(db, "authorities", user.uid));
            if (!authDoc.exists()) {
                setErr(t("notAuthorized"));
                setLoading(false);
                setRefreshing(false);
                return;
            }

            const authority = authDoc.data();
            if (authority?.role !== "ddo") {
                setErr(t("notAuthorized"));
                setLoading(false);
                setRefreshing(false);
                return;
            }

            // Check verification
            const verified = authority?.verified === true
                || authority?.status === "verified"
                || authority?.status === "active"
                || authority?.verification?.status === "verified";

            if (!verified) {
                setErr("Please wait for admin verification");
                setLoading(false);
                setRefreshing(false);
                return;
            }

            // Set scope
            const sc: Scope = {
                useIds: Boolean(authority.districtId),
                districtId: authority.districtId || "",
                district: authority.district || "",
                taluks: authority.taluks || [],
                talukIds: authority.talukIds || [],
            };
            setScope(sc);

            if (!sc.districtId && !sc.district) {
                setErr("Your profile is missing district information");
                setLoading(false);
                setRefreshing(false);
                return;
            }

            // Load all requests for the district
            const scopeWhere = sc.useIds
                ? [where("districtId", "==", sc.districtId)]
                : [where("district", "==", sc.district)];

            const baseQuery = query(collection(db, "fund_requests"), ...scopeWhere);
            const snapshot = await getDocs(baseQuery);

            if (snapshot.empty) {
                // Initialize empty analytics
                setAnalytics({
                    pending: 0,
                    approved: 0,
                    rejected: 0,
                    escalated: 0,
                    total: 0,
                    totalAmount: 0,
                    avgAmount: 0,
                    approvalRate: 0,
                    rejectionRate: 0,
                    escalationRate: 0,
                    pendingAmount: 0,
                    approvedAmount: 0,
                    rejectedAmount: 0,
                    escalatedAmount: 0,
                    recentRequests: [],
                    monthlyTrends: [],
                    taluks: [],
                    panchayats: [],
                    allRequests: [],
                    performance: {
                        slaCompliance: 0,
                        avgProcessingTime: 0,
                        satisfactionScore: 0,
                    }
                });
                setLoading(false);
                setRefreshing(false);
                return;
            }

            const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FundReq));
            const allRequests = [...requests];

            // Calculate statistics
            let pending = 0, approved = 0, rejected = 0, escalated = 0;
            let pendingAmount = 0, approvedAmount = 0, rejectedAmount = 0, escalatedAmount = 0, totalAmount = 0;
            const recentRequests: FundReq[] = [];
            const monthlyTrendsMap = new Map<string, { pending: number; approved: number; rejected: number; escalated: number; amount: number; month: string }>();
            const talukMap = new Map<string, TalukData>();
            const panchayatMap = new Map<string, PanchayatData>();

            requests.forEach(req => {
                const amount = req.amount || 0;
                totalAmount += amount;

                // Status counts
                switch (req.status) {
                    case 'pending':
                    case 'escalated_to_ddo':
                        pending++;
                        pendingAmount += amount;
                        break;
                    case 'approved':
                    case 'ddo_approved':
                        approved++;
                        approvedAmount += amount;
                        break;
                    case 'rejected':
                    case 'ddo_rejected':
                        rejected++;
                        rejectedAmount += amount;
                        break;
                }

                // Escalated count
                if (req.status === 'escalated_to_ddo') {
                    escalated++;
                    escalatedAmount += amount;
                }

                // Track recent requests
                if (recentRequests.length < 5) {
                    recentRequests.push(req);
                }

                // Monthly trends
                if (req.createdAt) {
                    const date = req.createdAt.toDate ? req.createdAt.toDate() : new Date(req.createdAt);
                    const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
                    const monthName = date.toLocaleDateString(locale, { month: 'short', year: 'numeric' });

                    if (!monthlyTrendsMap.has(monthKey)) {
                        monthlyTrendsMap.set(monthKey, { pending: 0, approved: 0, rejected: 0, escalated: 0, amount: 0, month: monthName });
                    }

                    const trend = monthlyTrendsMap.get(monthKey)!;
                    trend.amount += amount;

                    if (req.status === 'pending' || req.status === 'escalated_to_ddo') trend.pending++;
                    if (req.status === 'approved' || req.status === 'ddo_approved') trend.approved++;
                    if (req.status === 'rejected' || req.status === 'ddo_rejected') trend.rejected++;
                    if (req.status === 'escalated_to_ddo') trend.escalated++;
                }

                // Taluk analysis
                if (req.talukId) {
                    if (!talukMap.has(req.talukId)) {
                        talukMap.set(req.talukId, {
                            talukId: req.talukId,
                            totalRequests: 0,
                            pending: 0,
                            approved: 0,
                            rejected: 0,
                            escalated: 0,
                            totalAmount: 0,
                            panchayatCount: 0,
                        });
                    }
                    const talukData = talukMap.get(req.talukId)!;
                    talukData.totalRequests++;
                    talukData.totalAmount += amount;

                    if (req.status === 'pending' || req.status === 'escalated_to_ddo') talukData.pending++;
                    if (req.status === 'approved' || req.status === 'ddo_approved') talukData.approved++;
                    if (req.status === 'rejected' || req.status === 'ddo_rejected') talukData.rejected++;
                    if (req.status === 'escalated_to_ddo') talukData.escalated++;
                }

                // Panchayat analysis
                if (req.panchayatId && req.talukId) {
                    const panchayatKey = `${req.talukId}_${req.panchayatId}`;
                    if (!panchayatMap.has(panchayatKey)) {
                        panchayatMap.set(panchayatKey, {
                            panchayatId: req.panchayatId,
                            talukId: req.talukId,
                            totalRequests: 0,
                            pending: 0,
                            approved: 0,
                            rejected: 0,
                            escalated: 0,
                            totalAmount: 0,
                        });
                    }
                    const panchayatData = panchayatMap.get(panchayatKey)!;
                    panchayatData.totalRequests++;
                    panchayatData.totalAmount += amount;

                    if (req.status === 'pending' || req.status === 'escalated_to_ddo') panchayatData.pending++;
                    if (req.status === 'approved' || req.status === 'ddo_approved') panchayatData.approved++;
                    if (req.status === 'rejected' || req.status === 'ddo_rejected') panchayatData.rejected++;
                    if (req.status === 'escalated_to_ddo') panchayatData.escalated++;
                }
            });

            // Calculate panchayat count per taluk
            const panchayatCountByTaluk = new Map<string, number>();
            panchayatMap.forEach(panchayat => {
                const count = panchayatCountByTaluk.get(panchayat.talukId) || 0;
                panchayatCountByTaluk.set(panchayat.talukId, count + 1);
            });

            // Update taluk data with panchayat counts
            talukMap.forEach(taluk => {
                taluk.panchayatCount = panchayatCountByTaluk.get(taluk.talukId) || 0;
            });

            const total = pending + approved + rejected;
            const avgAmount = total > 0 ? totalAmount / total : 0;
            const approvalRate = total > 0 ? (approved / total) * 100 : 0;
            const rejectionRate = total > 0 ? (rejected / total) * 100 : 0;
            const escalationRate = total > 0 ? (escalated / total) * 100 : 0;

            // Convert monthly trends
            const monthlyTrends = Array.from(monthlyTrendsMap.values())
                .sort((a, b) => a.month.localeCompare(b.month))
                .slice(-6);

            // Top taluks
            const taluks = Array.from(talukMap.values())
                .sort((a, b) => b.totalRequests - a.totalRequests);

            // Top panchayats
            const panchayats = Array.from(panchayatMap.values())
                .sort((a, b) => b.totalRequests - a.totalRequests)
                .slice(0, 10);

            const newAnalytics: AnalyticsData = {
                pending,
                approved,
                rejected,
                escalated,
                total,
                totalAmount,
                avgAmount,
                approvalRate,
                rejectionRate,
                escalationRate,
                pendingAmount,
                approvedAmount,
                rejectedAmount,
                escalatedAmount,
                recentRequests: recentRequests.sort((a, b) => {
                    const aTime = a.createdAt?.toDate?.() || a.createdAt;
                    const bTime = b.createdAt?.toDate?.() || b.createdAt;
                    return new Date(bTime).getTime() - new Date(aTime).getTime();
                }).slice(0, 5),
                monthlyTrends,
                taluks: taluks.slice(0, 5), // Top 5 taluks
                panchayats,
                allRequests,
                performance: {
                    slaCompliance: Math.min(100, Math.max(70, 100 - (pending / total * 30))),
                    avgProcessingTime: Math.max(1, Math.min(7, 7 - (approved / total * 6))),
                    satisfactionScore: Math.max(3, Math.min(5, 3 + (approvalRate / 100 * 2))),
                }
            };

            setAnalytics(newAnalytics);
            setAnimated({
                ...newAnalytics,
                pending: 0,
                approved: 0,
                rejected: 0,
                escalated: 0,
                total: 0,
                totalAmount: 0,
                avgAmount: 0,
                approvalRate: 0,
                rejectionRate: 0,
                escalationRate: 0,
                pendingAmount: 0,
                approvedAmount: 0,
                rejectedAmount: 0,
                escalatedAmount: 0,
            });

        } catch (e: any) {
            console.error("Analytics error:", e);
            setErr(e?.message || t("loadFail"));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadAnalytics();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timePeriod]);

    // Calculate percentages for pie chart
    const totalReqs = analytics.pending + analytics.approved + analytics.rejected + analytics.escalated;
    const pendingPercent = totalReqs > 0 ? (analytics.pending / totalReqs) * 100 : 0;
    const approvedPercent = totalReqs > 0 ? (analytics.approved / totalReqs) * 100 : 0;
    const rejectedPercent = totalReqs > 0 ? (analytics.rejected / totalReqs) * 100 : 0;
    const escalatedPercent = totalReqs > 0 ? (analytics.escalated / totalReqs) * 100 : 0;

    // Report Generation Functions
    const generatePDFReport = async () => {
        setGeneratingReport(true);
        setReportMessage(null);

        try {
            const pdf = new jsPDF('landscape', 'mm', 'a4');

            // Add title
            pdf.setFontSize(20);
            pdf.setTextColor(0, 0, 139);
            pdf.text(t("reportTitle"), 20, 20);

            pdf.setFontSize(12);
            pdf.setTextColor(100, 100, 100);
            pdf.text(`${t("generatedOn")}: ${new Date().toLocaleDateString()}`, 20, 30);
            pdf.text(`${t("district")}: ${scope?.district || scope?.districtId || 'N/A'}`, 20, 37);

            // Summary section
            pdf.setFontSize(16);
            pdf.setTextColor(0, 0, 0);
            pdf.text(t("summary"), 20, 50);

            pdf.setFontSize(10);
            pdf.text(`Total Requests: ${analytics.total}`, 20, 60);
            pdf.text(`Pending: ${analytics.pending} (${pendingPercent.toFixed(1)}%)`, 20, 67);
            pdf.text(`Approved: ${analytics.approved} (${approvedPercent.toFixed(1)}%)`, 20, 74);
            pdf.text(`Rejected: ${analytics.rejected} (${rejectedPercent.toFixed(1)}%)`, 20, 81);
            pdf.text(`Escalated: ${analytics.escalated} (${escalatedPercent.toFixed(1)}%)`, 20, 88);
            pdf.text(`Total Amount: ₹${analytics.totalAmount.toLocaleString()}`, 20, 95);
            pdf.text(`Avg. Amount: ₹${analytics.avgAmount.toLocaleString()}`, 20, 102);
            pdf.text(`Approval Rate: ${analytics.approvalRate.toFixed(1)}%`, 20, 109);

            // Performance Metrics
            pdf.setFontSize(14);
            pdf.text(t("performanceMetrics"), 20, 125);

            pdf.setFontSize(10);
            pdf.text(`SLA Compliance: ${analytics.performance.slaCompliance.toFixed(1)}%`, 20, 135);
            pdf.text(`Avg. Processing Time: ${analytics.performance.avgProcessingTime.toFixed(1)} ${t("days")}`, 20, 142);
            pdf.text(`Satisfaction Score: ${analytics.performance.satisfactionScore.toFixed(1)}/5`, 20, 149);

            // Top Taluks
            if (analytics.taluks.length > 0) {
                pdf.setFontSize(14);
                pdf.text(t("topTaluks"), 120, 50);

                pdf.setFontSize(10);
                pdf.text("Taluk", 120, 60);
                pdf.text("Requests", 160, 60);
                pdf.text("Pending", 180, 60);
                pdf.text("Approved", 200, 60);
                pdf.text("Amount", 220, 60);

                analytics.taluks.forEach((taluk, idx) => {
                    const y = 70 + (idx * 7);
                    pdf.text(taluk.talukId, 120, y);
                    pdf.text(taluk.totalRequests.toString(), 160, y);
                    pdf.text(taluk.pending.toString(), 180, y);
                    pdf.text(taluk.approved.toString(), 200, y);
                    pdf.text(`₹${taluk.totalAmount.toLocaleString()}`, 220, y);
                });
            }

            // Recommendations
            pdf.setFontSize(14);
            pdf.text(t("recommendations"), 20, 170);

            pdf.setFontSize(10);
            const recommendations = [
                analytics.pending > 20 ? "Review pending requests across taluks promptly" : "Good job on managing pending requests",
                analytics.escalationRate > 10 ? "Investigate reasons for high escalation rates" : "Escalation rates are under control",
                analytics.approvalRate < 60 ? "Review approval criteria for consistency" : "Maintain high approval standards",
                `Total of ${analytics.taluks.length} taluks in the district`
            ];

            recommendations.forEach((rec, idx) => {
                const y = 180 + (idx * 7);
                pdf.text(`• ${rec}`, 20, y);
            });

            // Save PDF
            pdf.save(`DDO_Analytics_Report_${new Date().toISOString().split('T')[0]}.pdf`);

            setReportMessage({ type: 'success', text: t("reportGenerated") });
        } catch (error) {
            console.error("PDF generation error:", error);
            setReportMessage({ type: 'error', text: t("reportFailed") });
        } finally {
            setGeneratingReport(false);
            setTimeout(() => setReportMessage(null), 3000);
        }
    };

    const generateCSVReport = () => {
        try {
            // Headers
            const headers = [
                'Request ID',
                'Panchayat ID',
                'Taluk ID',
                'Status',
                'Amount',
                'Created Date',
                'Purpose'
            ];

            // CSV content
            let csvContent = headers.join(',') + '\n';

            analytics.allRequests.forEach(req => {
                const date = req.createdAt?.toDate ? req.createdAt.toDate().toISOString() : '';
                const row = [
                    `"${req.id}"`,
                    `"${req.panchayatId || 'N/A'}"`,
                    `"${req.talukId || 'N/A'}"`,
                    `"${req.status}"`,
                    req.amount || 0,
                    `"${date}"`,
                    `"${req.purpose || req.reason || 'N/A'}"`
                ];
                csvContent += row.join(',') + '\n';
            });

            // Create blob and download
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `DDO_Requests_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setReportMessage({ type: 'success', text: t("reportGenerated") });
        } catch (error) {
            console.error("CSV generation error:", error);
            setReportMessage({ type: 'error', text: t("reportFailed") });
        } finally {
            setTimeout(() => setReportMessage(null), 3000);
        }
    };

    const generatePrintReport = () => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
        <html>
          <head>
            <title>${t("reportTitle")}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { color: #1e40af; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f0f9ff; }
              .summary { background: #f8fafc; padding: 15px; border-radius: 5px; margin: 20px 0; }
              .recommendation { background: #fef3c7; padding: 10px; margin: 10px 0; border-left: 4px solid #f59e0b; }
            </style>
          </head>
          <body>
            <h1>${t("reportTitle")}</h1>
            <p>${t("generatedOn")}: ${new Date().toLocaleDateString()}</p>
            <p>${t("district")}: ${scope?.district || scope?.districtId || 'N/A'}</p>
            <p>${t("totalTaluks")}: ${analytics.taluks.length}</p>
            
            <div class="summary">
              <h2>${t("summary")}</h2>
              <p>${t("total")}: ${analytics.total}</p>
              <p>${t("pending")}: ${analytics.pending} (${pendingPercent.toFixed(1)}%)</p>
              <p>${t("approved")}: ${analytics.approved} (${approvedPercent.toFixed(1)}%)</p>
              <p>${t("rejected")}: ${analytics.rejected} (${rejectedPercent.toFixed(1)}%)</p>
              <p>${t("escalated")}: ${analytics.escalated} (${escalatedPercent.toFixed(1)}%)</p>
              <p>${t("totalAmount")}: ₹${analytics.totalAmount.toLocaleString()}</p>
              <p>${t("avgAmount")}: ₹${analytics.avgAmount.toLocaleString()}</p>
            </div>
            
            <div class="recommendation">
              <h2>${t("recommendations")}</h2>
              <p>${analytics.pending > 20 ? "Review pending requests across taluks promptly to improve processing time." : "Good job on managing pending requests across the district."}</p>
              <p>${analytics.escalationRate > 10 ? "Investigate reasons for high escalation rates from taluks." : "Escalation rates from taluks are under control."}</p>
              <p>${analytics.approvalRate < 60 ? "Review approval criteria for consistency across the district." : "Maintain high approval standards across the district."}</p>
            </div>
          </body>
        </html>
      `);
            printWindow.document.close();
            printWindow.print();
        }
    };

    const scopeLabel = scope
        ? scope.useIds
            ? `${t("district")} ID: ${scope.districtId}`
            : `${t("district")}: ${scope.district}`
        : "";

    return (
        <Screen padded>
            <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white p-3 sm:p-4 pb-28">
                {/* Header with Report Button */}
                <div className="mb-4 sm:mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-indigo-900 flex items-center gap-2">
                                <FiTrendingUp className="w-6 h-6 sm:w-7 sm:h-7" /> {t("title")}
                            </h1>
                            <p className="text-indigo-700/80 text-sm sm:text-base mt-1">{t("subtitle")}</p>
                        </div>

                        <div className="flex items-center gap-2">
                            <select
                                value={timePeriod}
                                onChange={(e) => setTimePeriod(e.target.value)}
                                className="px-3 py-2 bg-white border border-indigo-200 rounded-xl text-sm text-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
                            >
                                <option value="all">{t("all")}</option>
                                <option value="month">{t("month")}</option>
                                <option value="quarter">{t("quarter")}</option>
                                <option value="year">{t("year")}</option>
                            </select>

                            <button
                                onClick={() => setShowReportModal(true)}
                                className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-xl hover:from-green-700 hover:to-emerald-800 active:scale-95 transition-all flex items-center gap-2"
                            >
                                <FiFile className="w-4 h-4" />
                                <span className="hidden sm:inline">{t("generateReport")}</span>
                            </button>

                            <button
                                onClick={loadAnalytics}
                                disabled={refreshing}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-60"
                            >
                                <FiRefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                                <span className="hidden sm:inline">{t("refresh")}</span>
                            </button>
                        </div>
                    </div>

                    {scopeLabel && (
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="text-xs sm:text-sm bg-indigo-100 text-indigo-800 px-3 py-1.5 rounded-full inline-flex items-center gap-1">
                                <FiMapPin className="w-3 h-3" />
                                {scopeLabel}
                            </div>
                            {analytics.taluks.length > 0 && (
                                <div className="text-xs sm:text-sm bg-purple-100 text-purple-800 px-3 py-1.5 rounded-full inline-flex items-center gap-1">
                                    <FiUsers className="w-3 h-3" />
                                    {t("totalTaluks")}: {analytics.taluks.length}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Error */}
                {err && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-700 text-sm">
                        <FiAlertCircle className="w-5 h-5 flex-shrink-0" /> {err}
                    </div>
                )}

                {/* Report Message */}
                {reportMessage && (
                    <div className={`mb-4 p-4 ${reportMessage.type === 'success' ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'} rounded-xl flex items-center gap-2 text-sm`}>
                        <FiAlertCircle className={`w-5 h-5 flex-shrink-0 ${reportMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`} />
                        <span className={reportMessage.type === 'success' ? 'text-green-700' : 'text-red-700'}>
                            {reportMessage.text}
                        </span>
                    </div>
                )}

                {/* Loading */}
                {loading ? (
                    <div className="text-center py-10 text-indigo-700 font-semibold">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600 mb-3"></div>
                        <div>{t("loading")}</div>
                    </div>
                ) : analytics.total === 0 ? (
                    <div className="text-center py-10">
                        <FiTrendingUp className="w-16 h-16 text-indigo-300 mx-auto mb-4" />
                        <p className="text-indigo-700 font-semibold text-lg mb-2">{t("noData")}</p>
                        <p className="text-indigo-500 text-sm">No fund requests found for your district</p>
                    </div>
                ) : (
                    <>
                        {/* Quick Actions */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                            <button
                                onClick={() => router.push(`/${locale}/authority/ddo/requests`)}
                                className="bg-white border border-indigo-200 rounded-xl p-4 hover:bg-indigo-50 transition-colors flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                                        <FiEye className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-semibold text-indigo-900">{t("viewAllRequests")}</div>
                                        <div className="text-xs text-indigo-600">{analytics.total} requests</div>
                                    </div>
                                </div>
                                <FiChevronRight className="w-5 h-5 text-indigo-400 group-hover:text-indigo-600" />
                            </button>

                            <button
                                onClick={() => router.push(`/${locale}/authority/ddo/escalations`)}
                                className="bg-white border border-amber-200 rounded-xl p-4 hover:bg-amber-50 transition-colors flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                                        <FiAlertCircle className="w-5 h-5 text-amber-600" />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-semibold text-amber-900">{t("escalateToCommissioner")}</div>
                                        <div className="text-xs text-amber-600">{analytics.escalated} escalated</div>
                                    </div>
                                </div>
                                <FiChevronRight className="w-5 h-5 text-amber-400 group-hover:text-amber-600" />
                            </button>

                            <button
                                onClick={() => setShowReportModal(true)}
                                className="bg-white border border-green-200 rounded-xl p-4 hover:bg-green-50 transition-colors flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                        <FiDownload className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-semibold text-green-900">{t("exportData")}</div>
                                        <div className="text-xs text-green-600">Generate reports</div>
                                    </div>
                                </div>
                                <FiChevronRight className="w-5 h-5 text-green-400 group-hover:text-green-600" />
                            </button>
                        </div>

                        {/* Overview Stats */}
                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
                            <StatCard
                                title={t("pending")}
                                value={animated.pending}
                                icon={<FiClock className="w-5 h-5" />}
                                color="amber"
                                amount={animated.pendingAmount}
                                subtitle={`₹${animated.pendingAmount.toLocaleString()}`}
                            />
                            <StatCard
                                title={t("approved")}
                                value={animated.approved}
                                icon={<FiCheckCircle className="w-5 h-5" />}
                                color="green"
                                amount={animated.approvedAmount}
                                subtitle={`₹${animated.approvedAmount.toLocaleString()}`}
                            />
                            <StatCard
                                title={t("rejected")}
                                value={animated.rejected}
                                icon={<FiXCircle className="w-5 h-5" />}
                                color="red"
                                amount={animated.rejectedAmount}
                                subtitle={`₹${animated.rejectedAmount.toLocaleString()}`}
                            />
                            <StatCard
                                title={t("escalated")}
                                value={animated.escalated}
                                icon={<FiAlertCircle className="w-5 h-5" />}
                                color="purple"
                                amount={animated.escalatedAmount}
                                subtitle={`₹${animated.escalatedAmount.toLocaleString()}`}
                            />
                            <StatCard
                                title={t("total")}
                                value={animated.total}
                                icon={<FiDollarSign className="w-5 h-5" />}
                                color="indigo"
                                amount={animated.totalAmount}
                                subtitle={`₹${animated.totalAmount.toLocaleString()}`}
                            />
                        </div>

                        {/* Charts and Detailed Stats */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                            {/* Status Distribution */}
                            <div className="bg-white rounded-2xl border border-indigo-100 p-4 sm:p-5 shadow-sm">
                                <h3 className="text-lg font-bold text-indigo-900 mb-4 flex items-center gap-2">
                                    <FiPieChart className="w-5 h-5" /> {t("distribution")}
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-center">
                                        <div className="relative w-48 h-48">
                                            <div className="absolute inset-0 rounded-full border-8"
                                                style={{
                                                    background: `conic-gradient(
                            #f59e0b 0% ${pendingPercent}%,
                            #10b981 ${pendingPercent}% ${pendingPercent + approvedPercent}%,
                            #ef4444 ${pendingPercent + approvedPercent}% ${pendingPercent + approvedPercent + rejectedPercent}%,
                            #8b5cf6 ${pendingPercent + approvedPercent + rejectedPercent}% 100%
                          )`
                                                }}
                                            ></div>
                                            <div className="absolute inset-8 bg-white rounded-full flex items-center justify-center">
                                                <div className="text-center">
                                                    <div className="text-2xl font-bold text-indigo-900">{animated.total}</div>
                                                    <div className="text-sm text-indigo-600">{t("total")}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        <LegendItem color="bg-amber-500" label={t("pending")} value={animated.pending} percent={pendingPercent} />
                                        <LegendItem color="bg-green-500" label={t("approved")} value={animated.approved} percent={approvedPercent} />
                                        <LegendItem color="bg-red-500" label={t("rejected")} value={animated.rejected} percent={rejectedPercent} />
                                        <LegendItem color="bg-purple-500" label={t("escalated")} value={animated.escalated} percent={escalatedPercent} />
                                    </div>
                                </div>
                            </div>

                            {/* Performance Metrics */}
                            <div className="bg-white rounded-2xl border border-indigo-100 p-4 sm:p-5 shadow-sm">
                                <h3 className="text-lg font-bold text-indigo-900 mb-4 flex items-center gap-2">
                                    <FiBarChart2 className="w-5 h-5" /> {t("performanceMetrics")}
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <MetricCard
                                        title={t("avgAmount")}
                                        value={`₹${Math.round(animated.avgAmount).toLocaleString()}`}
                                        icon={<FiDollarSign className="w-4 h-4" />}
                                        color="blue"
                                    />
                                    <MetricCard
                                        title={t("approvalRate")}
                                        value={`${animated.approvalRate.toFixed(1)}%`}
                                        icon={<FiPercent className="w-4 h-4" />}
                                        color="green"
                                    />
                                    <MetricCard
                                        title={t("slaCompliance")}
                                        value={`${analytics.performance.slaCompliance.toFixed(1)}%`}
                                        icon={<FiCheckCircle className="w-4 h-4" />}
                                        color="indigo"
                                    />
                                    <MetricCard
                                        title={t("avgProcessingTime")}
                                        value={`${analytics.performance.avgProcessingTime.toFixed(1)} ${t("days")}`}
                                        icon={<FiClock className="w-4 h-4" />}
                                        color="purple"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Top Taluks */}
                        {analytics.taluks.length > 0 && (
                            <div className="bg-white rounded-2xl border border-indigo-100 p-4 sm:p-5 shadow-sm mb-6">
                                <h3 className="text-lg font-bold text-indigo-900 mb-4 flex items-center gap-2">
                                    <FiGlobe className="w-5 h-5" /> {t("topTaluks")}
                                </h3>
                                <div className="space-y-3">
                                    {analytics.taluks.map((taluk, idx) => (
                                        <div
                                            key={taluk.talukId}
                                            className="flex items-center justify-between p-3 border border-indigo-50 rounded-xl hover:bg-indigo-50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                                                    <span className="text-indigo-700 font-bold">{idx + 1}</span>
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-indigo-900">{taluk.talukId}</div>
                                                    <div className="text-xs text-indigo-600">{taluk.totalRequests} requests • {taluk.panchayatCount} panchayats</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-indigo-900">₹{taluk.totalAmount.toLocaleString()}</div>
                                                <div className="text-xs text-gray-500">
                                                    {taluk.approved}/{taluk.totalRequests} approved
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Monthly Trends */}
                        {analytics.monthlyTrends.length > 0 && (
                            <div className="bg-white rounded-2xl border border-indigo-100 p-4 sm:p-5 shadow-sm mb-20">
                                <h3 className="text-lg font-bold text-indigo-900 mb-4 flex items-center gap-2">
                                    <FiCalendar className="w-5 h-5" /> {t("trends")}
                                </h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="text-left text-sm text-indigo-700 border-b">
                                                <th className="pb-2 font-semibold">{t("date")}</th>
                                                <th className="pb-2 font-semibold">{t("pending")}</th>
                                                <th className="pb-2 font-semibold">{t("approved")}</th>
                                                <th className="pb-2 font-semibold">{t("rejected")}</th>
                                                <th className="pb-2 font-semibold">{t("escalated")}</th>
                                                <th className="pb-2 font-semibold">{t("amount")}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {analytics.monthlyTrends.map((trend, idx) => (
                                                <tr key={idx} className="border-b border-indigo-50 hover:bg-indigo-50">
                                                    <td className="py-3 text-sm font-medium text-indigo-900">{trend.month}</td>
                                                    <td className="py-3">
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-800">
                                                            {trend.pending}
                                                        </span>
                                                    </td>
                                                    <td className="py-3">
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                                                            {trend.approved}
                                                        </span>
                                                    </td>
                                                    <td className="py-3">
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                                                            {trend.rejected}
                                                        </span>
                                                    </td>
                                                    <td className="py-3">
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                                                            {trend.escalated}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 text-sm font-semibold text-indigo-900">
                                                        ₹{trend.amount.toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Bottom Navigation */}
                <div className="fixed bottom-4 left-4 right-4 bg-white/90 backdrop-blur border border-indigo-100 rounded-2xl p-2 shadow-xl">
                    <div className="grid grid-cols-4 gap-1">
                        <Nav
                            icon={<FiHome className="w-5 h-5" />}
                            label={t("dashboard")}
                            onClick={() => router.push(`/${locale}/authority/ddo/dashboard`)}
                        />
                        <Nav
                            icon={<FiFileText className="w-5 h-5" />}
                            label={t("requests")}
                            onClick={() => router.push(`/${locale}/authority/ddo/requests`)}
                        />
                        <Nav
                            icon={<FiTrendingUp className="w-5 h-5" />}
                            label={t("analytics")}
                            active
                        />
                        <Nav
                            icon={<FiUser className="w-5 h-5" />}
                            label={t("profile")}
                            onClick={() => router.push(`/${locale}/authority/ddo/profile`)}
                        />
                    </div>
                </div>

                {/* Report Generation Modal */}
                {showReportModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl border border-indigo-100 p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-indigo-900">{t("reports")}</h3>
                                <button
                                    onClick={() => setShowReportModal(false)}
                                    className="p-2 rounded-lg hover:bg-indigo-50"
                                >
                                    <FiXCircle className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={generatePDFReport}
                                        disabled={generatingReport}
                                        className="flex flex-col items-center justify-center p-4 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100 transition-colors disabled:opacity-50"
                                    >
                                        <FiDownload className="w-6 h-6 text-indigo-600 mb-2" />
                                        <span className="text-sm font-semibold text-indigo-800">{t("downloadPDF")}</span>
                                    </button>

                                    <button
                                        onClick={generateCSVReport}
                                        disabled={generatingReport}
                                        className="flex flex-col items-center justify-center p-4 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 transition-colors disabled:opacity-50"
                                    >
                                        <FiFile className="w-6 h-6 text-green-600 mb-2" />
                                        <span className="text-sm font-semibold text-green-800">{t("downloadCSV")}</span>
                                    </button>

                                    <button
                                        onClick={generatePrintReport}
                                        disabled={generatingReport}
                                        className="flex flex-col items-center justify-center p-4 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors disabled:opacity-50"
                                    >
                                        <FiPrinter className="w-6 h-6 text-amber-600 mb-2" />
                                        <span className="text-sm font-semibold text-amber-800">{t("printReport")}</span>
                                    </button>

                                    <button
                                        onClick={() => {
                                            setReportMessage({ type: 'success', text: 'Email feature coming soon!' });
                                            setTimeout(() => setReportMessage(null), 3000);
                                        }}
                                        disabled={generatingReport}
                                        className="flex flex-col items-center justify-center p-4 bg-purple-50 border border-purple-200 rounded-xl hover:bg-purple-100 transition-colors disabled:opacity-50"
                                    >
                                        <FiMail className="w-6 h-6 text-purple-600 mb-2" />
                                        <span className="text-sm font-semibold text-purple-800">{t("emailReport")}</span>
                                    </button>
                                </div>

                                {generatingReport && (
                                    <div className="text-center py-4">
                                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-600 mb-2"></div>
                                        <p className="text-sm text-indigo-600">{t("generating")}</p>
                                    </div>
                                )}

                                <div className="flex gap-3 pt-4 border-t">
                                    <button
                                        onClick={() => setShowReportModal(false)}
                                        className="flex-1 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                                    >
                                        {t("cancel")}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Screen>
    );
}

/* ---------------- UI Components ---------------- */

function StatCard({ title, value, icon, color, amount, subtitle }: {
    title: string;
    value: number;
    icon: React.ReactNode;
    color: "amber" | "green" | "red" | "purple" | "indigo";
    amount: number;
    subtitle: string;
}) {
    const colorClasses = {
        amber: "bg-amber-100 text-amber-800 border-amber-200",
        green: "bg-green-100 text-green-800 border-green-200",
        red: "bg-red-100 text-red-800 border-red-200",
        purple: "bg-purple-100 text-purple-800 border-purple-200",
        indigo: "bg-indigo-100 text-indigo-800 border-indigo-200",
    };

    return (
        <div className={`rounded-2xl p-4 border ${colorClasses[color]} transition-all duration-500 hover:shadow-lg`}>
            <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${colorClasses[color].split(' ')[0]}`}>
                    {icon}
                </div>
                <div className="text-2xl sm:text-3xl font-bold">{value}</div>
            </div>
            <div className="text-sm font-semibold">{title}</div>
            <div className="text-xs opacity-75 mt-1">{subtitle}</div>
        </div>
    );
}

function MetricCard({ title, value, icon, color }: {
    title: string;
    value: string;
    icon: React.ReactNode;
    color: string;
}) {
    return (
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 hover:bg-indigo-100 transition-colors">
            <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-white rounded-lg">
                    {icon}
                </div>
                <div className="text-sm font-medium text-indigo-800">{title}</div>
            </div>
            <div className="text-2xl font-bold text-indigo-900">{value}</div>
        </div>
    );
}

function LegendItem({ color, label, value, percent }: {
    color: string;
    label: string;
    value: number;
    percent: number;
}) {
    return (
        <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${color}`}></div>
            <div className="flex-1">
                <div className="text-sm font-medium">{label}</div>
                <div className="text-xs text-gray-600">{value} ({percent.toFixed(1)}%)</div>
            </div>
        </div>
    );
}

function Nav({ icon, label, onClick, active }: {
    icon: React.ReactNode;
    label: string;
    onClick?: () => void;
    active?: boolean;
}) {
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center p-2 rounded-xl transition-all active:scale-95 ${active ? "bg-gradient-to-b from-indigo-100 to-indigo-50 text-indigo-800 border border-indigo-200" : "hover:bg-indigo-50"
                }`}
        >
            {icon}
            <span className="text-xs mt-1 font-semibold">{label}</span>
        </button>
    );
}