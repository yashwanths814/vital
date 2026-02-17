// app/[locale]/authority/tdo/analytics/page.tsx
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
} from "react-icons/fi";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

type Scope = {
  useIds: boolean;
  districtId: string;
  talukId: string;
  district: string;
  taluk: string;
};

type FundReq = {
  id: string;
  status: "pending" | "approved" | "rejected";
  amount?: number;
  createdAt?: any;
  panchayatId?: string;
  talukId?: string;
  reason?: string;
  purpose?: string;
  pdoName?: string;
};

type AnalyticsData = {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
  totalAmount: number;
  avgAmount: number;
  approvalRate: number;
  rejectionRate: number;
  pendingAmount: number;
  approvedAmount: number;
  rejectedAmount: number;
  recentRequests: FundReq[];
  monthlyTrends: { month: string; pending: number; approved: number; rejected: number; amount: number }[];
  topPanchayats: { panchayatId: string; count: number; totalAmount: number }[];
  allRequests: FundReq[];
};

// ✅ SINGLE FILE TRANSLATIONS
const TRANSLATIONS = {
  en: {
    title: "Fund Analytics Dashboard",
    subtitle: "Comprehensive insights and trends for your taluk",
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
    total: "Total",
    totalAmount: "Total Amount",
    avgAmount: "Avg. Amount",
    approvalRate: "Approval Rate",
    rejectionRate: "Rejection Rate",
    pendingAmount: "Pending Amount",
    approvedAmount: "Approved Amount",
    rejectedAmount: "Rejected Amount",
    amount: "Amount",
    status: "Status",
    date: "Date",
    panchayat: "Panchayat",
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
    withinSLA: "Within SLA",
    breached: "SLA Breached",
    highApproval: "High approval rate",
    lowPending: "Low pending requests",
    fundsUtilized: "Funds utilized",
    quickProcessing: "Quick processing time",
    insights: "Key Insights",
    slaPerformance: "SLA Performance",
    // New report translations
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
    reportTitle: "Fund Request Analysis Report",
    reportSubtitle: "TDO Dashboard Analytics",
    generatedOn: "Generated on",
    summary: "Summary",
    recommendations: "Recommendations",
    topPanchayats: "Top Panchayats by Requests",
    requestDetails: "Request Details",
    noPanchayatData: "No panchayat data available",
    generate: "Generate",
    cancel: "Cancel",
    generating: "Generating Report...",
  },
  hi: {
    title: "निधि विश्लेषण डैशबोर्ड",
    subtitle: "आपके तालुके के लिए व्यापक अंतर्दृष्टि और रुझान",
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
    total: "कुल",
    totalAmount: "कुल राशि",
    avgAmount: "औसत राशि",
    approvalRate: "स्वीकृति दर",
    rejectionRate: "अस्वीकृति दर",
    pendingAmount: "लंबित राशि",
    approvedAmount: "स्वीकृत राशि",
    rejectedAmount: "अस्वीकृत राशि",
    amount: "राशि",
    status: "स्थिति",
    date: "तारीख",
    panchayat: "पंचायत",
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
    withinSLA: "SLA के भीतर",
    breached: "SLA उल्लंघन",
    highApproval: "उच्च स्वीकृति दर",
    lowPending: "कम लंबित अनुरोध",
    fundsUtilized: "निधियों का उपयोग",
    quickProcessing: "त्वरित प्रसंस्करण समय",
    insights: "मुख्य अंतर्दृष्टि",
    slaPerformance: "SLA प्रदर्शन",
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
    reportTitle: "निधि अनुरोध विश्लेषण रिपोर्ट",
    reportSubtitle: "टीडीओ डैशबोर्ड विश्लेषण",
    generatedOn: "पर जनरेट किया गया",
    summary: "सारांश",
    recommendations: "सिफारिशें",
    topPanchayats: "अनुरोधों द्वारा शीर्ष पंचायतें",
    requestDetails: "अनुरोध विवरण",
    noPanchayatData: "कोई पंचायत डेटा उपलब्ध नहीं",
    generate: "जनरेट करें",
    cancel: "रद्द करें",
    generating: "रिपोर्ट जनरेट हो रही है...",
  },
  kn: {
    title: "ನಿಧಿ ವಿಶ್ಲೇಷಣೆ ಡ್ಯಾಶ್ಬೋರ್ಡ್",
    subtitle: "ನಿಮ್ಮ ತಾಲೂಕಿಗೆ ಸಂಪೂರ್ಣ ಒಳನೋಟಗಳು ಮತ್ತು ಪ್ರವೃತ್ತಿಗಳು",
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
    total: "ಒಟ್ಟು",
    totalAmount: "ಒಟ್ಟು ಮೊತ್ತ",
    avgAmount: "ಸರಾಸರಿ ಮೊತ್ತ",
    approvalRate: "ಅನುಮೋದನೆ ದರ",
    rejectionRate: "ನಿರಾಕರಣೆ ದರ",
    pendingAmount: "ಬಾಕಿ ಮೊತ್ತ",
    approvedAmount: "ಅನುಮೋದಿತ ಮೊತ್ತ",
    rejectedAmount: "ನಿರಾಕೃತ ಮೊತ್ತ",
    amount: "ಮೊತ್ತ",
    status: "ಸ್ಥಿತಿ",
    date: "ದಿನಾಂಕ",
    panchayat: "ಪಂಚಾಯಿತಿ",
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
    withinSLA: "SLA ಒಳಗೆ",
    breached: "SLA ಉಲ್ಲಂಘನೆ",
    highApproval: "ಹೆಚ್ಚಿನ ಅನುಮೋದನೆ ದರ",
    lowPending: "ಕಡಿಮೆ ಬಾಕಿ ವಿನಂತಿಗಳು",
    fundsUtilized: "ನಿಧಿಗಳನ್ನು ಬಳಸಲಾಗಿದೆ",
    quickProcessing: "ತ್ವರಿತ ಪ್ರಕ್ರಿಯೆ ಸಮಯ",
    insights: "ಪ್ರಮುಖ ಒಳನೋಟಗಳು",
    slaPerformance: "SLA ಕಾರ್ಯಕ್ಷಮತೆ",
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
    reportTitle: "ನಿಧಿ ವಿನಂತಿ ವಿಶ್ಲೇಷಣೆ ವರದಿ",
    reportSubtitle: "ಟಿಡಿಒ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ವಿಶ್ಲೇಷಣೆ",
    generatedOn: "ಜನರೇಟ್ ಮಾಡಲಾಗಿದೆ",
    summary: "ಸಾರಾಂಶ",
    recommendations: "ಶಿಫಾರಸುಗಳು",
    topPanchayats: "ವಿನಂತಿಗಳ ಪ್ರಕಾರ ಉನ್ನತ ಪಂಚಾಯಿತಿಗಳು",
    requestDetails: "ವಿನಂತಿ ವಿವರಗಳು",
    noPanchayatData: "ಯಾವುದೇ ಪಂಚಾಯಿತಿ ಡೇಟಾ ಲಭ್ಯವಿಲ್ಲ",
    generate: "ಜನರೇಟ್ ಮಾಡಿ",
    cancel: "ರದ್ದುಮಾಡಿ",
    generating: "ರಿಪೋರ್ಟ್ ಜನರೇಟ್ ಆಗುತ್ತಿದೆ...",
  },
};

export default function TDOAnalyticsPage() {
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
  const [reportMessage, setReportMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [reportOptions, setReportOptions] = useState({
    includeCharts: true,
    includeTables: true,
    includeDetails: true,
  });

  const [analytics, setAnalytics] = useState<AnalyticsData>({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0,
    totalAmount: 0,
    avgAmount: 0,
    approvalRate: 0,
    rejectionRate: 0,
    pendingAmount: 0,
    approvedAmount: 0,
    rejectedAmount: 0,
    recentRequests: [],
    monthlyTrends: [],
    topPanchayats: [],
    allRequests: []
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
        total: prev.total < analytics.total ? prev.total + Math.ceil(analytics.total / 20) : analytics.total,
        totalAmount: prev.totalAmount < analytics.totalAmount ? prev.totalAmount + Math.ceil(analytics.totalAmount / 20) : analytics.totalAmount,
        avgAmount: prev.avgAmount < analytics.avgAmount ? prev.avgAmount + (analytics.avgAmount / 20) : analytics.avgAmount,
        approvalRate: prev.approvalRate < analytics.approvalRate ? prev.approvalRate + (analytics.approvalRate / 20) : analytics.approvalRate,
        rejectionRate: prev.rejectionRate < analytics.rejectionRate ? prev.rejectionRate + (analytics.rejectionRate / 20) : analytics.rejectionRate,
      }));
    }, 50);

    return () => clearInterval(interval);
  }, [analytics]);

  const loadAnalytics = async () => {
    setErr("");
    setRefreshing(true);

    try {
      const u = auth.currentUser;
      if (!u) {
        setErr(t("notSignedIn"));
        return;
      }

      const authDoc = await getDoc(doc(db, "authorities", u.uid));
      if (!authDoc.exists()) {
        setErr(t("notAuthorized"));
        return;
      }

      const authority = authDoc.data();
      if (authority?.role !== "tdo") {
        setErr(t("notAuthorized"));
        return;
      }

      const verified = authority?.verified === true 
        || authority?.status === "verified" 
        || authority?.status === "active"
        || authority?.verification?.status === "verified";
      
      if (!verified) {
        setErr("Please wait for admin verification");
        return;
      }

      const sc: Scope = {
        useIds: Boolean(authority.districtId && authority.talukId),
        districtId: authority.districtId || "",
        talukId: authority.talukId || "",
        district: authority.district || "",
        taluk: authority.taluk || "",
      };
      setScope(sc);

      if (!sc.talukId && !sc.taluk) {
        setErr("Your profile is missing taluk information");
        return;
      }

      const scopeWhere = sc.useIds
        ? [where("talukId", "==", sc.talukId)]
        : [where("taluk", "==", sc.taluk)];

      const baseQuery = query(collection(db, "fund_requests"), ...scopeWhere);
      const snapshot = await getDocs(baseQuery);
      
      if (snapshot.empty) {
        setAnalytics({
          pending: 0,
          approved: 0,
          rejected: 0,
          total: 0,
          totalAmount: 0,
          avgAmount: 0,
          approvalRate: 0,
          rejectionRate: 0,
          pendingAmount: 0,
          approvedAmount: 0,
          rejectedAmount: 0,
          recentRequests: [],
          monthlyTrends: [],
          topPanchayats: [],
          allRequests: []
        });
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FundReq));
      const allRequests = [...requests];
      
      // Calculate statistics
      let pending = 0, approved = 0, rejected = 0;
      let pendingAmount = 0, approvedAmount = 0, rejectedAmount = 0, totalAmount = 0;
      const recentRequests: FundReq[] = [];
      const monthlyTrendsMap = new Map<string, { pending: number; approved: number; rejected: number; amount: number; month: string }>();
      const panchayatMap = new Map<string, { count: number; totalAmount: number }>();

      requests.forEach(req => {
        const amount = req.amount || 0;
        totalAmount += amount;

        switch (req.status) {
          case 'pending':
            pending++;
            pendingAmount += amount;
            break;
          case 'approved':
            approved++;
            approvedAmount += amount;
            break;
          case 'rejected':
            rejected++;
            rejectedAmount += amount;
            break;
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
            monthlyTrendsMap.set(monthKey, { pending: 0, approved: 0, rejected: 0, amount: 0, month: monthName });
          }
          
          const trend = monthlyTrendsMap.get(monthKey)!;
          trend.amount += amount;
          if (req.status === 'pending') trend.pending++;
          if (req.status === 'approved') trend.approved++;
          if (req.status === 'rejected') trend.rejected++;
        }

        // Panchayat analysis
        if (req.panchayatId) {
          if (!panchayatMap.has(req.panchayatId)) {
            panchayatMap.set(req.panchayatId, { count: 0, totalAmount: 0 });
          }
          const panchayatData = panchayatMap.get(req.panchayatId)!;
          panchayatData.count++;
          panchayatData.totalAmount += amount;
        }
      });

      const total = pending + approved + rejected;
      const avgAmount = total > 0 ? totalAmount / total : 0;
      const approvalRate = total > 0 ? (approved / total) * 100 : 0;
      const rejectionRate = total > 0 ? (rejected / total) * 100 : 0;

      // Convert monthly trends
      const monthlyTrends = Array.from(monthlyTrendsMap.values())
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-6);

      // Top panchayats
      const topPanchayats = Array.from(panchayatMap.entries())
        .map(([panchayatId, data]) => ({ panchayatId, ...data }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const newAnalytics = {
        pending,
        approved,
        rejected,
        total,
        totalAmount,
        avgAmount,
        approvalRate,
        rejectionRate,
        pendingAmount,
        approvedAmount,
        rejectedAmount,
        recentRequests: recentRequests.sort((a, b) => {
          const aTime = a.createdAt?.toDate?.() || a.createdAt;
          const bTime = b.createdAt?.toDate?.() || b.createdAt;
          return new Date(bTime).getTime() - new Date(aTime).getTime();
        }),
        monthlyTrends,
        topPanchayats,
        allRequests
      };

      setAnalytics(newAnalytics);
      setAnimated({
        ...newAnalytics,
        pending: 0,
        approved: 0,
        rejected: 0,
        total: 0,
        totalAmount: 0,
        avgAmount: 0,
        approvalRate: 0,
        rejectionRate: 0,
        pendingAmount: 0,
        approvedAmount: 0,
        rejectedAmount: 0,
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
  const totalReqs = analytics.pending + analytics.approved + analytics.rejected;
  const pendingPercent = totalReqs > 0 ? (analytics.pending / totalReqs) * 100 : 0;
  const approvedPercent = totalReqs > 0 ? (analytics.approved / totalReqs) * 100 : 0;
  const rejectedPercent = totalReqs > 0 ? (analytics.rejected / totalReqs) * 100 : 0;

  // Report Generation Functions
  const generatePDFReport = async () => {
    setGeneratingReport(true);
    setReportMessage(null);
    
    try {
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      
      // Add title
      pdf.setFontSize(20);
      pdf.setTextColor(0, 0, 139); // Dark blue
      pdf.text(t("reportTitle"), 20, 20);
      
      pdf.setFontSize(12);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`${t("generatedOn")}: ${new Date().toLocaleDateString()}`, 20, 30);
      pdf.text(`Taluk: ${scope?.taluk || scope?.talukId || 'N/A'}`, 20, 37);
      
      // Summary section
      pdf.setFontSize(16);
      pdf.setTextColor(0, 0, 0);
      pdf.text(t("summary"), 20, 50);
      
      pdf.setFontSize(10);
      pdf.text(`Total Requests: ${analytics.total}`, 20, 60);
      pdf.text(`Pending: ${analytics.pending} (${pendingPercent.toFixed(1)}%)`, 20, 67);
      pdf.text(`Approved: ${analytics.approved} (${approvedPercent.toFixed(1)}%)`, 20, 74);
      pdf.text(`Rejected: ${analytics.rejected} (${rejectedPercent.toFixed(1)}%)`, 20, 81);
      pdf.text(`Total Amount: ₹${analytics.totalAmount.toLocaleString()}`, 20, 88);
      pdf.text(`Avg. Amount: ₹${analytics.avgAmount.toLocaleString()}`, 20, 95);
      pdf.text(`Approval Rate: ${analytics.approvalRate.toFixed(1)}%`, 20, 102);
      
      // Top Panchayats
      if (analytics.topPanchayats.length > 0) {
        pdf.setFontSize(14);
        pdf.text(t("topPanchayats"), 20, 115);
        
        pdf.setFontSize(10);
        analytics.topPanchayats.forEach((panchayat, idx) => {
          const y = 125 + (idx * 7);
          pdf.text(`${idx + 1}. ${panchayat.panchayatId}: ${panchayat.count} requests, ₹${panchayat.totalAmount.toLocaleString()}`, 20, y);
        });
      }
      
      // Monthly Trends
      if (analytics.monthlyTrends.length > 0) {
        pdf.setFontSize(14);
        pdf.text(t("trends"), 120, 50);
        
        pdf.setFontSize(10);
        pdf.text("Month", 120, 60);
        pdf.text("Pending", 160, 60);
        pdf.text("Approved", 180, 60);
        pdf.text("Rejected", 200, 60);
        pdf.text("Amount", 220, 60);
        
        analytics.monthlyTrends.forEach((trend, idx) => {
          const y = 70 + (idx * 7);
          pdf.text(trend.month, 120, y);
          pdf.text(trend.pending.toString(), 160, y);
          pdf.text(trend.approved.toString(), 180, y);
          pdf.text(trend.rejected.toString(), 200, y);
          pdf.text(`₹${trend.amount.toLocaleString()}`, 220, y);
        });
      }
      
      // Recommendations
      pdf.setFontSize(14);
      pdf.text(t("recommendations"), 20, 170);
      
      pdf.setFontSize(10);
      const recommendations = [
        analytics.pending > 10 ? "Review pending requests promptly" : "Good job on keeping pending requests low",
        analytics.approvalRate < 50 ? "Consider reviewing approval criteria" : "Maintain high approval standards",
        analytics.totalAmount > 1000000 ? "Monitor fund utilization carefully" : "Funds are being managed efficiently"
      ];
      
      recommendations.forEach((rec, idx) => {
        const y = 180 + (idx * 7);
        pdf.text(`• ${rec}`, 20, y);
      });
      
      // Save PDF
      pdf.save(`TDO_Analytics_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      
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
        'Status',
        'Amount',
        'Created Date',
        'Reason'
      ];
      
      // CSV content
      let csvContent = headers.join(',') + '\n';
      
      analytics.allRequests.forEach(req => {
        const date = req.createdAt?.toDate ? req.createdAt.toDate().toISOString() : '';
        const row = [
          `"${req.id}"`,
          `"${req.panchayatId || 'N/A'}"`,
          `"${req.status}"`,
          req.amount || 0,
          `"${date}"`,
          `"${req.reason || req.purpose || 'N/A'}"`
        ];
        csvContent += row.join(',') + '\n';
      });
      
      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `TDO_Requests_${new Date().toISOString().split('T')[0]}.csv`);
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
    const printContent = document.getElementById('analytics-report-content');
    if (printContent) {
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
              <p>Taluk: ${scope?.taluk || scope?.talukId || 'N/A'}</p>
              
              <div class="summary">
                <h2>${t("summary")}</h2>
                <p>Total Requests: ${analytics.total}</p>
                <p>Pending: ${analytics.pending} (${pendingPercent.toFixed(1)}%)</p>
                <p>Approved: ${analytics.approved} (${approvedPercent.toFixed(1)}%)</p>
                <p>Rejected: ${analytics.rejected} (${rejectedPercent.toFixed(1)}%)</p>
                <p>Total Amount: ₹${analytics.totalAmount.toLocaleString()}</p>
                <p>Avg. Amount: ₹${analytics.avgAmount.toLocaleString()}</p>
              </div>
              
              ${analytics.monthlyTrends.length > 0 ? `
                <h2>${t("trends")}</h2>
                <table>
                  <tr>
                    <th>Month</th>
                    <th>Pending</th>
                    <th>Approved</th>
                    <th>Rejected</th>
                    <th>Amount</th>
                  </tr>
                  ${analytics.monthlyTrends.map(trend => `
                    <tr>
                      <td>${trend.month}</td>
                      <td>${trend.pending}</td>
                      <td>${trend.approved}</td>
                      <td>${trend.rejected}</td>
                      <td>₹${trend.amount.toLocaleString()}</td>
                    </tr>
                  `).join('')}
                </table>
              ` : ''}
              
              <div class="recommendation">
                <h2>${t("recommendations")}</h2>
                <p>${analytics.pending > 10 ? "Review pending requests promptly to improve processing time." : "Good job on keeping pending requests low."}</p>
                <p>${analytics.approvalRate < 50 ? "Consider reviewing approval criteria for better outcomes." : "Maintain high approval standards."}</p>
                <p>${analytics.totalAmount > 1000000 ? "Monitor fund utilization carefully to ensure optimal allocation." : "Funds are being managed efficiently."}</p>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const scopeLabel = scope
    ? scope.useIds
      ? `Taluk ID: ${scope.talukId}`
      : `Taluk: ${scope.taluk}`
    : "";

  return (
    <Screen padded>
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-3 sm:p-4 pb-28">
        {/* Header with Report Button */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-blue-900 flex items-center gap-2">
                <FiTrendingUp className="w-6 h-6 sm:w-7 sm:h-7" /> {t("title")}
              </h1>
              <p className="text-blue-700/80 text-sm sm:text-base mt-1">{t("subtitle")}</p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={timePeriod}
                onChange={(e) => setTimePeriod(e.target.value)}
                className="px-3 py-2 bg-white border border-blue-200 rounded-xl text-sm text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
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
                className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-60"
              >
                <FiRefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">{t("refresh")}</span>
              </button>
            </div>
          </div>

          {scopeLabel && (
            <div className="text-xs sm:text-sm bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full inline-flex items-center gap-1">
              <FiActivity className="w-3 h-3" />
              {scopeLabel}
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
          <div className="text-center py-10 text-blue-700 font-semibold">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mb-3"></div>
            <div>{t("loading")}</div>
          </div>
        ) : analytics.total === 0 ? (
          <div className="text-center py-10">
            <FiTrendingUp className="w-16 h-16 text-blue-300 mx-auto mb-4" />
            <p className="text-blue-700 font-semibold text-lg mb-2">{t("noData")}</p>
            <p className="text-blue-500 text-sm">No fund requests found for your taluk</p>
          </div>
        ) : (
          <>
            {/* Report Content (for printing) */}
            <div id="analytics-report-content" className="hidden">
              {/* This content is only used for printing */}
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
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
                title={t("total")}
                value={animated.total}
                icon={<FiDollarSign className="w-5 h-5" />}
                color="blue"
                amount={animated.totalAmount}
                subtitle={`₹${animated.totalAmount.toLocaleString()}`}
              />
            </div>

            {/* Charts and Detailed Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Status Distribution */}
              <div className="bg-white rounded-2xl border border-blue-100 p-4 sm:p-5 shadow-sm">
                <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
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
                            #ef4444 ${pendingPercent + approvedPercent}% 100%
                          )`
                        }}
                      ></div>
                      <div className="absolute inset-8 bg-white rounded-full flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-900">{animated.total}</div>
                          <div className="text-sm text-blue-600">{t("total")}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <LegendItem color="bg-amber-500" label={t("pending")} value={animated.pending} percent={pendingPercent} />
                    <LegendItem color="bg-green-500" label={t("approved")} value={animated.approved} percent={approvedPercent} />
                    <LegendItem color="bg-red-500" label={t("rejected")} value={animated.rejected} percent={rejectedPercent} />
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="bg-white rounded-2xl border border-blue-100 p-4 sm:p-5 shadow-sm">
                <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                  <FiBarChart2 className="w-5 h-5" /> {t("statistics")}
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
                    title={t("rejectionRate")}
                    value={`${animated.rejectionRate.toFixed(1)}%`}
                    icon={<FiPercent className="w-4 h-4" />}
                    color="red"
                  />
                  <MetricCard
                    title={t("totalAmount")}
                    value={`₹${Math.round(animated.totalAmount).toLocaleString()}`}
                    icon={<FiDollarSign className="w-4 h-4" />}
                    color="purple"
                  />
                </div>
              </div>
            </div>

            {/* Top Panchayats */}
            {analytics.topPanchayats.length > 0 && (
              <div className="bg-white rounded-2xl border border-blue-100 p-4 sm:p-5 shadow-sm mb-6">
                <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                  <FiActivity className="w-5 h-5" /> {t("topPanchayats")}
                </h3>
                <div className="space-y-3">
                  {analytics.topPanchayats.map((panchayat, idx) => (
                    <div
                      key={panchayat.panchayatId}
                      className="flex items-center justify-between p-3 border border-blue-50 rounded-xl hover:bg-blue-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-700 font-bold">{idx + 1}</span>
                        </div>
                        <div>
                          <div className="font-semibold text-blue-900">{panchayat.panchayatId}</div>
                          <div className="text-xs text-blue-600">{panchayat.count} requests</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-blue-900">₹{panchayat.totalAmount.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">Total amount</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Monthly Trends */}
            {analytics.monthlyTrends.length > 0 && (
              <div className="bg-white rounded-2xl border border-blue-100 p-4 sm:p-5 shadow-sm mb-20">
                <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                  <FiCalendar className="w-5 h-5" /> {t("trends")}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm text-blue-700 border-b">
                        <th className="pb-2 font-semibold">{t("date")}</th>
                        <th className="pb-2 font-semibold">{t("pending")}</th>
                        <th className="pb-2 font-semibold">{t("approved")}</th>
                        <th className="pb-2 font-semibold">{t("rejected")}</th>
                        <th className="pb-2 font-semibold">{t("amount")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.monthlyTrends.map((trend, idx) => (
                        <tr key={idx} className="border-b border-blue-50 hover:bg-blue-50">
                          <td className="py-3 text-sm font-medium text-blue-900">{trend.month}</td>
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
                          <td className="py-3 text-sm font-semibold text-blue-900">
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
        <div className="fixed bottom-4 left-4 right-4 bg-white/90 backdrop-blur border border-blue-100 rounded-2xl p-2 shadow-xl">
          <div className="grid grid-cols-4 gap-1">
            <Nav
              icon={<FiHome className="w-5 h-5" />}
              label={t("dashboard")}
              onClick={() => router.push(`/${locale}/authority/tdo/dashboard`)}
            />
            <Nav
              icon={<FiFileText className="w-5 h-5" />}
              label={t("requests")}
              onClick={() => router.push(`/${locale}/authority/tdo/requests`)}
            />
            <Nav 
              icon={<FiTrendingUp className="w-5 h-5" />} 
              label={t("analytics")} 
              active 
            />
            <Nav
              icon={<FiUser className="w-5 h-5" />}
              label={t("profile")}
              onClick={() => router.push(`/${locale}/authority/tdo/profile`)}
            />
          </div>
        </div>

        {/* Report Generation Modal */}
        {showReportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl border border-blue-100 p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-blue-900">{t("reports")}</h3>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="p-2 rounded-lg hover:bg-blue-50"
                >
                  <FiXCircle className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">{t("reportOptions")}</h4>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={reportOptions.includeCharts}
                        onChange={(e) => setReportOptions({...reportOptions, includeCharts: e.target.checked})}
                        className="rounded border-blue-300 text-blue-600 focus:ring-blue-200"
                      />
                      <span className="text-sm">{t("includeCharts")}</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={reportOptions.includeTables}
                        onChange={(e) => setReportOptions({...reportOptions, includeTables: e.target.checked})}
                        className="rounded border-blue-300 text-blue-600 focus:ring-blue-200"
                      />
                      <span className="text-sm">{t("includeTables")}</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={reportOptions.includeDetails}
                        onChange={(e) => setReportOptions({...reportOptions, includeDetails: e.target.checked})}
                        className="rounded border-blue-300 text-blue-600 focus:ring-blue-200"
                      />
                      <span className="text-sm">{t("includeDetails")}</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={generatePDFReport}
                    disabled={generatingReport}
                    className="flex flex-col items-center justify-center p-4 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors disabled:opacity-50"
                  >
                    <FiDownload className="w-6 h-6 text-blue-600 mb-2" />
                    <span className="text-sm font-semibold text-blue-800">{t("downloadPDF")}</span>
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
                      // Email report functionality would go here
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
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-600 mb-2"></div>
                    <p className="text-sm text-blue-600">{t("generating")}</p>
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
  color: "amber" | "green" | "red" | "blue";
  amount: number;
  subtitle: string;
}) {
  const colorClasses = {
    amber: "bg-amber-100 text-amber-800 border-amber-200",
    green: "bg-green-100 text-green-800 border-green-200",
    red: "bg-red-100 text-red-800 border-red-200",
    blue: "bg-blue-100 text-blue-800 border-blue-200",
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
    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 hover:bg-blue-100 transition-colors">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 bg-white rounded-lg">
          {icon}
        </div>
        <div className="text-sm font-medium text-blue-800">{title}</div>
      </div>
      <div className="text-2xl font-bold text-blue-900">{value}</div>
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
      className={`flex flex-col items-center p-2 rounded-xl transition-all active:scale-95 ${
        active ? "bg-gradient-to-b from-blue-100 to-blue-50 text-blue-800 border border-blue-200" : "hover:bg-blue-50"
      }`}
    >
      {icon}
      <span className="text-xs mt-1 font-semibold">{label}</span>
    </button>
  );
}