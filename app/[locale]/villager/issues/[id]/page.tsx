"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Screen from "../../../../components/Screen";
import { auth, db } from "../../../../lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  doc,
  getDoc,
  Timestamp,
  onSnapshot
} from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";

// Icons
import {
  FiArrowLeft,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiFolder,
  FiRefreshCw,
  FiChevronRight,
  FiMessageSquare,
  FiTrendingUp,
  FiUser,
  FiFlag,
  FiHome,
  FiList,
  FiPlus,
  FiDownload,
  FiImage,
  FiChevronDown,
  FiChevronUp,
  FiShare2,
  FiZap,
  FiAlertTriangle,
  FiBell,
  FiMapPin,
  FiCalendar,
  FiMail,
  FiPhone,
  FiEye,
  FiThumbsUp,
  FiMessageCircle,
  FiNavigation,
  FiCopy
} from "react-icons/fi";

type Locale = "en" | "kn" | "hi";

type EscHistoryItem = {
  type?: "auto" | "manual";
  from?: string;
  to?: string;
  at?: any;
  reason?: string;
  level?: number;
};

type Issue = {
  id?: string;
  title?: string;
  category?: string;
  categoryName?: string;
  status?: string;
  description?: string;
  address?: string;
  specificLocation?: string;

  panchayatId?: string;
  panchayatName?: string;
  talukId?: string;
  talukName?: string;
  villageId?: string;
  villageName?: string;
  districtId?: string;
  districtName?: string;

  photoUrl?: string;
  photoBase64?: string;
  gpsLatitude?: number;
  gpsLongitude?: number;
  gpsAccuracy?: number;

  createdAt?: any;
  updatedAt?: any;
  resolveDueAt?: any;

  villagerId?: string;
  reporterName?: string;
  reporterEmail?: string;
  reporterPhone?: string;

  manualEscalationUsed?: boolean;
  assignedRole?: "pdo" | "tdo" | "ddo";
  assignedWorker?: {
    id?: string;
    name?: string;
    email?: string;
    role?: string;
  };
  escalatedLevel?: number;
  escalation?: {
    lastEscalatedTo?: string;
    history?: EscHistoryItem[];
  };

  slaDays?: number;
  priority?: string;
  expectedResolutionDate?: any;

  submittedAt?: any;
  verifiedAt?: any;
  assignedAt?: any;
  inProgressAt?: any;
  resolvedAt?: any;
  closedAt?: any;

  displayId?: string;
  views?: number;
  upvotes?: number;
  commentsCount?: number;
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

function toMillis(v: any): number {
  try {
    if (!v) return 0;
    if (v instanceof Timestamp) return v.toMillis();
    if (v?.toMillis) return v.millis();
    if (v?.toDate) return v.toDate().getTime();
    if (typeof v === "string") return new Date(v).getTime();
    return 0;
  } catch {
    return 0;
  }
}

function formatRelativeDate(dateString: string, locale: Locale) {
  if (!dateString) return "";

  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    const translations = {
      en: {
        justNow: "Just now",
        minutesAgo: "minutes ago",
        hoursAgo: "hours ago",
        today: "Today",
        yesterday: "Yesterday",
        daysAgo: "days ago"
      },
      kn: {
        justNow: "ಇದೀಗ",
        minutesAgo: "ನಿಮಿಷಗಳ ಹಿಂದೆ",
        hoursAgo: "ಗಂಟೆಗಳ ಹಿಂದೆ",
        today: "ಇಂದು",
        yesterday: "ನಿನ್ನೆ",
        daysAgo: "ದಿನಗಳ ಹಿಂದೆ"
      },
      hi: {
        justNow: "अभी अभी",
        minutesAgo: "मिनट पहले",
        hoursAgo: "घंटे पहले",
        today: "आज",
        yesterday: "कल",
        daysAgo: "दिन पहले"
      }
    };

    const t = translations[locale];

    if (diffMinutes < 1) return t.justNow;
    if (diffHours < 1) return `${diffMinutes} ${t.minutesAgo}`;
    if (diffHours < 24) return `${diffHours} ${t.hoursAgo}`;
    if (diffDays === 0) return `${t.today}, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    if (diffDays === 1) return `${t.yesterday}, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    if (diffDays < 7) return `${diffDays} ${t.daysAgo}`;

    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
}

function getStatusColor(status: string) {
  switch (status?.toLowerCase()) {
    case 'resolved': return 'bg-gradient-to-r from-green-500 to-emerald-600';
    case 'in progress': return 'bg-gradient-to-r from-blue-500 to-cyan-600';
    case 'pending': return 'bg-gradient-to-r from-amber-500 to-orange-600';
    case 'rejected': return 'bg-gradient-to-r from-red-500 to-pink-600';
    case 'verified_by_vi': return 'bg-gradient-to-r from-purple-500 to-violet-600';
    case 'closed': return 'bg-gradient-to-r from-green-600 to-emerald-700';
    default: return 'bg-gradient-to-r from-gray-500 to-gray-600';
  }
}

function getStatusIcon(status: string) {
  switch (status?.toLowerCase()) {
    case 'resolved': return FiCheckCircle;
    case 'closed': return FiCheckCircle;
    case 'in progress': return FiClock;
    case 'pending': return FiClock;
    case 'verified_by_vi': return FiCheckCircle;
    case 'rejected': return FiAlertCircle;
    default: return FiAlertCircle;
  }
}

function getPriorityColor(priority: string) {
  switch (priority?.toLowerCase()) {
    case 'high': return 'bg-red-100 text-red-800 border-red-200';
    case 'medium': return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

export default function VillagerIssueDetailsPage() {
  const router = useRouter();
  const params = useParams() as { locale?: string; id?: string };

  const locale = (params?.locale || "en") as Locale;
  const issueId = String(params?.id || "");

  const [showDescription, setShowDescription] = useState(false);
  const [showEscalationHistory, setShowEscalationHistory] = useState(false);
  const [showReporterInfo, setShowReporterInfo] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);

  const t = useMemo(() => {
    const translations = {
      en: {
        // Header
        title: "Issue Details",
        back: "Back",
        refresh: "Refresh",
        share: "Share",

        // Status & Info
        status: "Status",
        category: "Category",
        priority: "Priority",
        location: "Location",
        description: "Description",
        postedOn: "Posted on",
        lastUpdated: "Last updated",
        dueDate: "Due Date",
        sla: "SLA",
        days: "days",
        tapToView: "Tap to view",
        showMore: "Show More",
        showLess: "Show Less",

        // Escalation
        escalation: "Escalation",
        currentLevel: "Current Level",
        assignedTo: "Assigned To",
        escalationHistory: "Escalation History",
        autoEscalation: "Auto Escalation",
        manualEscalation: "Manual Escalation",
        currentAuthority: "Current Authority",
        nextAuthority: "Next Authority",
        timePassed: "Time Passed",
        daysRequired: "days required",
        availableIn: "Available in",
        daysMore: "days more",
        maxLevel: "Maximum Level Reached",

        // Buttons
        triggerAutoEscalate: "Trigger Auto Escalation",
        triggerManualEscalate: "Trigger Manual Escalation",
        alreadyUsed: "Already Used",
        availableNow: "Available Now",
        sending: "Sending...",

        // Auto Escalation
        autoTitle: "Auto Escalation",
        autoDesc: "Automatically escalates based on SLA",
        pdo: "PDO",
        tdo: "TDO",
        ddo: "DDO",
        pdoDesc: "Panchayat Development Officer",
        tdoDesc: "Taluk Development Officer",
        ddoDesc: "District Development Officer",

        // Manual Escalation
        manualTitle: "Manual Escalation",
        manualDesc: "Direct escalation by villager",
        manualTooltip: "Can be used only once after 4 days",
        manualConfirm: "Are you sure? This will escalate to next authority immediately.",
        manualEscalateConfirm: "Are you sure? This will escalate to next authority immediately.",

        // Actions
        actions: "Actions",
        viewChat: "Open Chat",
        chatAvailable: "Chat Available After Due Date",
        chatLocked: "Chat will be available after",
        downloadReport: "Download Report",
        shareIssue: "Share Issue",
        notifyMe: "Notify Updates",

        // Details
        details: "Issue Details",
        evidence: "Photo Evidence",
        viewOnMap: "View on Map",
        gpsCoordinates: "GPS Coordinates",
        latitude: "Latitude",
        longitude: "Longitude",

        // Reporter
        reporterInfo: "Reporter Information",
        name: "Name",
        phone: "Phone",
        email: "Email",

        // Stats
        stats: "Statistics",
        views: "Views",
        upvotes: "Upvotes",
        comments: "Comments",

        // Share
        copyLink: "Copy Link",
        linkCopied: "Link Copied!",
        saveImage: "Save Image",

        // Navigation
        dashboard: "Dashboard",
        myIssues: "My Issues",
        issueTracking: "Tracking",
        profile: "Profile",
        reportNew: "Report New",

        // Loading & Errors
        loading: "Loading details...",
        notFound: "Issue not found.",
        notAllowed: "You are not allowed to view this issue.",
        genericError: "Failed to load issue.",
        escalateFail: "Failed to escalate.",

        // Time
        justNow: "Just now",
        minutesAgo: "minutes ago",
        hoursAgo: "hours ago",
        today: "Today",
        yesterday: "Yesterday",
        daysAgo: "days ago"
      },
      kn: {
        // Header
        title: "ಸಮಸ್ಯೆ ವಿವರಗಳು",
        back: "ಹಿಂದೆ",
        refresh: "ರಿಫ್ರೆಶ್",
        share: "ಹಂಚಿಕೊಳ್ಳಿ",

        // Status & Info
        status: "ಸ್ಥಿತಿ",
        category: "ವರ್ಗ",
        priority: "ಪ್ರಾಥಮಿಕತೆ",
        location: "ಸ್ಥಳ",
        description: "ವಿವರಣೆ",
        postedOn: "ದಿನಾಂಕ",
        lastUpdated: "ಕೊನೆಯ ನವೀಕರಣ",
        dueDate: "ಅಂತಿಮ ದಿನ",
        sla: "SLA",
        days: "ದಿನಗಳು",
        tapToView: "ನೋಡಲು ಟ್ಯಾಪ್ ಮಾಡಿ",
        showMore: "ಹೆಚ್ಚು ತೋರಿಸಿ",
        showLess: "ಕಡಿಮೆ ತೋರಿಸಿ",

        // Escalation
        escalation: "ಎಸ್ಕಲೇಶನ್",
        currentLevel: "ಪ್ರಸ್ತುತ ಹಂತ",
        assignedTo: "ನಿಯೋಜಿಸಲಾಗಿದೆ",
        escalationHistory: "ಎಸ್ಕಲೇಶನ್ ಇತಿಹಾಸ",
        autoEscalation: "ಸ್ವಯಂ ಎಸ್ಕಲೇಶನ್",
        manualEscalation: "ಮಾನವೇಯ ಎಸ್ಕಲೇಶನ್",
        currentAuthority: "ಪ್ರಸ್ತುತ ಅಧಿಕಾರಿ",
        nextAuthority: "ಮುಂದಿನ ಅಧಿಕಾರಿ",
        timePassed: "ಕಳೆದ ಸಮಯ",
        daysRequired: "ದಿನಗಳು ಬೇಕು",
        availableIn: "ಲಭ್ಯವಾಗುತ್ತದೆ",
        daysMore: "ದಿನಗಳಲ್ಲಿ",
        maxLevel: "ಗರಿಷ್ಠ ಮಟ್ಟ ತಲುಪಿದೆ",

        // Buttons
        triggerAutoEscalate: "ಸ್ವಯಂ ಎಸ್ಕಲೇಶನ್ ಪ್ರಾರಂಭಿಸಿ",
        triggerManualEscalate: "ಮಾನವೇಯ ಎಸ್ಕಲೇಶನ್ ಪ್ರಾರಂಭಿಸಿ",
        alreadyUsed: "ಈಗಾಗಲೇ ಬಳಸಲಾಗಿದೆ",
        availableNow: "ಈಗ ಲಭ್ಯವಿದೆ",
        sending: "ಕಳುಹಿಸಲಾಗುತ್ತಿದೆ...",

        // Auto Escalation
        autoTitle: "ಸ್ವಯಂ ಎಸ್ಕಲೇಶನ್",
        autoDesc: "SLA ಆಧಾರದ ಮೇಲೆ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಎಸ್ಕಲೇಟ್ ಆಗುತ್ತದೆ",
        pdo: "ಪಿಡಿಒ",
        tdo: "ಟಿಡಿಒ",
        ddo: "ಡಿಡಿಒ",
        pdoDesc: "ಪಂಚಾಯಿತಿ ಅಭಿವೃದ್ಧಿ ಅಧಿಕಾರಿ",
        tdoDesc: "ತಾಲ್ಲೂಕು ಅಭಿವೃದ್ಧಿ ಅಧಿಕಾರಿ",
        ddoDesc: "ಜಿಲ್ಲಾ ಅಭಿವೃದ್ಧಿ ಅಧಿಕಾರಿ",

        // Manual Escalation
        manualTitle: "ಮಾನವೇಯ ಎಸ್ಕಲೇಶನ್",
        manualDesc: "ಗ್ರಾಮಸ್ಥರಿಂದ ನೇರ ಎಸ್ಕಲೇಶನ್",
        manualTooltip: "4 ದಿನಗಳ ನಂತರ ಒಮ್ಮೆ ಮಾತ್ರ ಬಳಸಬಹುದು",
        manualConfirm: "ನೀವು ಖಚಿತವಾಗಿ ಬಯಸುವಿರಾ? ಇದು ತಕ್ಷಣ ಮುಂದಿನ ಅಧಿಕಾರಿಗೆ ಎಸ್ಕಲೇಟ್ ಆಗುತ್ತದೆ.",
        manualEscalateConfirm: "ನೀವು ಖಚಿತವಾಗಿ ಬಯಸುವಿರಾ? ಇದು ತಕ್ಷಣ ಮುಂದಿನ ಅಧಿಕಾರಿಗೆ ಎಸ್ಕಲೇಟ್ ಆಗುತ್ತದೆ.",

        // Actions
        actions: "ಕ್ರಿಯೆಗಳು",
        viewChat: "ಚಾಟ್ ತೆರೆಯಿರಿ",
        chatAvailable: "ಡ್ಯೂ ಡೇಟ್ ನಂತರ ಚಾಟ್ ಲಭ್ಯವಿದೆ",
        chatLocked: "ಚಾಟ್ ಲಭ್ಯವಾಗುತ್ತದೆ",
        downloadReport: "ರಿಪೋರ್ಟ್ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ",
        shareIssue: "ಸಮಸ್ಯೆಯನ್ನು ಹಂಚಿಕೊಳ್ಳಿ",
        notifyMe: "ನವೀಕರಣಗಳನ್ನು ತಿಳಿಸಿ",

        // Details
        details: "ಸಮಸ್ಯೆ ವಿವರಗಳು",
        evidence: "ಫೋಟೋ ಸಾಕ್ಷ್ಯ",
        viewOnMap: "ನಕ್ಷೆಯಲ್ಲಿ ನೋಡಿ",
        gpsCoordinates: "GPS ನಿರ್ದೇಶಾಂಕಗಳು",
        latitude: "ಅಕ್ಷಾಂಶ",
        longitude: "ರೇಖಾಂಶ",

        // Reporter
        reporterInfo: "ವರದಿದಾರರ ಮಾಹಿತಿ",
        name: "ಹೆಸರು",
        phone: "ಫೋನ್",
        email: "ಇಮೇಲ್",

        // Stats
        stats: "ಅಂಕಿಅಂಶಗಳು",
        views: "ನೋಟಗಳು",
        upvotes: "ಅಪ್‌ವೋಟ್‌ಗಳು",
        comments: "ಕಾಮೆಂಟ್‌ಗಳು",

        // Share
        copyLink: "ಲಿಂಕ್ ನಕಲಿಸಿ",
        linkCopied: "ಲಿಂಕ್ ನಕಲಿಸಲಾಗಿದೆ!",
        saveImage: "ಚಿತ್ರ ಉಳಿಸಿ",

        // Navigation
        dashboard: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
        myIssues: "ನನ್ನ ಸಮಸ್ಯೆಗಳು",
        issueTracking: "ಟ್ರ್ಯಾಕಿಂಗ್",
        profile: "ಪ್ರೊಫೈಲ್",
        reportNew: "ಹೊಸದನ್ನು ವರದಿ ಮಾಡಿ",

        // Loading & Errors
        loading: "ವಿವರಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...",
        notFound: "ಸಮಸ್ಯೆ ಕಂಡುಬಂದಿಲ್ಲ.",
        notAllowed: "ಈ ಸಮಸ್ಯೆಯನ್ನು ನೋಡಲು ನಿಮಗೆ ಅನುಮತಿ ಇಲ್ಲ.",
        genericError: "ಸಮಸ್ಯೆ ಲೋಡ್ ಮಾಡಲು ವಿಫಲವಾಗಿದೆ.",
        escalateFail: "ಎಸ್ಕಲೇಶನ್ ವಿಫಲವಾಗಿದೆ.",

        // Time
        justNow: "ಇದೀಗ",
        minutesAgo: "ನಿಮಿಷಗಳ ಹಿಂದೆ",
        hoursAgo: "ಗಂಟೆಗಳ ಹಿಂದೆ",
        today: "ಇಂದು",
        yesterday: "ನಿನ್ನೆ",
        daysAgo: "ದಿನಗಳ ಹಿಂದೆ"
      },
      hi: {
        // Header
        title: "मुद्दे का विवरण",
        back: "वापस",
        refresh: "रिफ्रेश",
        share: "शेयर करें",

        // Status & Info
        status: "स्थिति",
        category: "श्रेणी",
        priority: "प्राथमिकता",
        location: "स्थान",
        description: "विवरण",
        postedOn: "दिनांक",
        lastUpdated: "आख़िरी अपडेट",
        dueDate: "अंतिम तिथि",
        sla: "SLA",
        days: "दिन",
        tapToView: "देखने के लिए टैप करें",
        showMore: "और दिखाएं",
        showLess: "कम दिखाएं",

        // Escalation
        escalation: "एस्केलेशन",
        currentLevel: "वर्तमान स्तर",
        assignedTo: "नियोजित",
        escalationHistory: "एस्केलेशन इतिहास",
        autoEscalation: "ऑटो एस्केलेशन",
        manualEscalation: "मैनुअल एस्केलेशन",
        currentAuthority: "वर्तमान अधिकारी",
        nextAuthority: "अगला अधिकारी",
        timePassed: "समय बीता",
        daysRequired: "दिन चाहिए",
        availableIn: "उपलब्ध होगा",
        daysMore: "दिनों में",
        maxLevel: "अधिकतम स्तर पहुँच गया",

        // Buttons
        triggerAutoEscalate: "ऑटो एस्केलेशन शुरू करें",
        triggerManualEscalate: "मैनुअल एस्केलेशन शुरू करें",
        alreadyUsed: "पहले ही इस्तेमाल किया",
        availableNow: "अभी उपलब्ध",
        sending: "भेज रहे...",

        // Auto Escalation
        autoTitle: "ऑटो एस्केलेशन",
        autoDesc: "SLA के आधार पर स्वचालित रूप से एस्केलेट होता है",
        pdo: "पीडीओ",
        tdo: "टीडीओ",
        ddo: "डीडीओ",
        pdoDesc: "पंचायत विकास अधिकारी",
        tdoDesc: "तालुका विकास अधिकारी",
        ddoDesc: "जिला विकास अधिकारी",

        // Manual Escalation
        manualTitle: "मैनुअल एस्केलेशन",
        manualDesc: "ग्रामीण द्वारा सीधा एस्केलेशन",
        manualTooltip: "4 दिनों के बाद केवल एक बार इस्तेमाल किया जा सकता है",
        manualConfirm: "क्या आप सुनिश्चित हैं? यह तुरंत अगले अधिकारी को एस्केलेट कर देगा।",
        manualEscalateConfirm: "क्या आप सुनिश्चित हैं? यह तुरंत अगले अधिकारी को एस्केलेट कर देगा।",

        // Actions
        actions: "कार्रवाई",
        viewChat: "चैट खोलें",
        chatAvailable: "ड्यू डेट के बाद चैट उपलब्ध",
        chatLocked: "चैट उपलब्ध होगा",
        downloadReport: "रिपोर्ट डाउनलोड करें",
        shareIssue: "मुद्दा साझा करें",
        notifyMe: "अपडेट सूचित करें",

        // Details
        details: "मुद्दे का विवरण",
        evidence: "फोटो सबूत",
        viewOnMap: "मानचित्र पर देखें",
        gpsCoordinates: "GPS निर्देशांक",
        latitude: "अक्षांश",
        longitude: "देशांतर",

        // Reporter
        reporterInfo: "रिपोर्टर जानकारी",
        name: "नाम",
        phone: "फ़ोन",
        email: "ईमेल",

        // Stats
        stats: "आँकड़े",
        views: "दृश्य",
        upvotes: "अपवोट",
        comments: "टिप्पणियाँ",

        // Share
        copyLink: "लिंक कॉपी करें",
        linkCopied: "लिंक कॉपी हो गया!",
        saveImage: "इमेज सेव करें",

        // Navigation
        dashboard: "डैशबोर्ड",
        myIssues: "मेरे मुद्दे",
        issueTracking: "ट्रैकिंग",
        profile: "प्रोफ़ाइल",
        reportNew: "नया रिपोर्ट करें",

        // Loading & Errors
        loading: "विवरण लोड हो रहा है...",
        notFound: "मुद्दा नहीं मिला।",
        notAllowed: "आपको यह मुद्दा देखने की अनुमति नहीं है।",
        genericError: "मुद्दा लोड करने में विफल।",
        escalateFail: "एस्केलेशन विफल।",

        // Time
        justNow: "अभी अभी",
        minutesAgo: "मिनट पहले",
        hoursAgo: "घंटे पहले",
        today: "आज",
        yesterday: "कल",
        daysAgo: "दिन पहले"
      }
    };
    return translations[locale] || translations.en;
  }, [locale]);

  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [uid, setUid] = useState<string>("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);

  const [issue, setIssue] = useState<Issue | null>(null);
  const [escalateLoading, setEscalateLoading] = useState(false);

  // Wait for auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setUid(u?.uid || "");
      setAuthReady(true);
      if (!u) {
        router.replace(`/${locale}/villager/login`);
      }
    });
    return () => unsub();
  }, [locale, router]);

  // Real-time issue subscription
  useEffect(() => {
    if (!authReady || !issueId || !uid) return;

    setLoading(true);
    setError("");

    const issueRef = doc(db, "issues", issueId);

    const unsubscribe = onSnapshot(issueRef, async (docSnap) => {
      if (!docSnap.exists()) {
        setError(t.notFound);
        setIssue(null);
        setLoading(false);
        return;
      }

      const data = docSnap.data() as any;

      // Check if user is allowed to view this issue
      if (String(data?.villagerId || "") !== uid) {
        setError(t.notAllowed);
        setIssue(null);
        setLoading(false);
        return;
      }

      setIssue({
        id: docSnap.id,
        ...data,
      });

      setLoading(false);
    }, (error) => {
      console.error("Error loading issue:", error);
      setError(t.genericError);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [authReady, issueId, uid, locale, t]);

  // Helper functions for escalation
  const getAutoEscalationInfo = () => {
    if (!issue) return null;

    const currentLevel = issue.escalatedLevel || 0;
    const slaDays = issue.slaDays || 7;
    const createdAt = toMillis(issue.createdAt);
    const now = Date.now();
    const daysPassed = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));

    // Calculate next escalation based on current level
    let nextLevel = currentLevel;
    let nextEscalationDays = 0;

    if (currentLevel === 0) { // PDO → TDO
      nextLevel = 1;
      nextEscalationDays = slaDays;
    } else if (currentLevel === 1) { // TDO → DDO
      nextLevel = 2;
      nextEscalationDays = slaDays * 2;
    } else { // Already at DDO
      return null;
    }

    const daysUntilNext = Math.max(0, nextEscalationDays - daysPassed);
    const shouldAutoEscalate = daysPassed >= nextEscalationDays;

    return {
      currentLevel,
      nextLevel,
      daysPassed,
      slaDays,
      nextEscalationDays,
      daysUntilNext,
      shouldAutoEscalate,
      currentAuthority: getAuthorityName(currentLevel, locale),
      nextAuthority: getAuthorityName(nextLevel, locale),
      currentAuthorityDesc: getAuthorityDescription(currentLevel, locale),
      nextAuthorityDesc: getAuthorityDescription(nextLevel, locale)
    };
  };

  const getAuthorityName = (level: number, lang: Locale) => {
    if (lang === 'kn') {
      switch (level) {
        case 0: return t.pdo;
        case 1: return t.tdo;
        case 2: return t.ddo;
        default: return t.pdo;
      }
    } else if (lang === 'hi') {
      switch (level) {
        case 0: return t.pdo;
        case 1: return t.tdo;
        case 2: return t.ddo;
        default: return t.pdo;
      }
    } else {
      switch (level) {
        case 0: return t.pdo;
        case 1: return t.tdo;
        case 2: return t.ddo;
        default: return t.pdo;
      }
    }
  };

  const getAuthorityDescription = (level: number, lang: Locale) => {
    if (lang === 'kn') {
      switch (level) {
        case 0: return t.pdoDesc;
        case 1: return t.tdoDesc;
        case 2: return t.ddoDesc;
        default: return '';
      }
    } else if (lang === 'hi') {
      switch (level) {
        case 0: return t.pdoDesc;
        case 1: return t.tdoDesc;
        case 2: return t.ddoDesc;
        default: return '';
      }
    } else {
      switch (level) {
        case 0: return t.pdoDesc;
        case 1: return t.tdoDesc;
        case 2: return t.ddoDesc;
        default: return '';
      }
    }
  };

  const autoEscalationInfo = useMemo(() => getAutoEscalationInfo(), [issue, locale, t]);

  const manualEscalationInfo = () => {
    if (!issue) return null;

    const createdAt = toMillis(issue.createdAt);
    const now = Date.now();
    const daysPassed = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));
    const manualEscalationDays = 4; // Available after 4 days

    const daysUntilManual = Math.max(0, manualEscalationDays - daysPassed);
    const manualEscalationAvailable = daysPassed >= manualEscalationDays;

    return {
      daysPassed,
      manualEscalationDays,
      daysUntilManual,
      manualEscalationAvailable,
      manualUsed: issue.manualEscalationUsed === true
    };
  };

  const manualInfo = useMemo(() => manualEscalationInfo(), [issue]);

  const onAutoEscalate = async () => {
    if (!issueId || !autoEscalationInfo?.shouldAutoEscalate) return;

    setError("");
    setSuccess("");
    setEscalateLoading(true);

    try {
      const response = await fetch('/api/escalation/auto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issueId })
      });

      if (response.ok) {
        const result = await response.json();
        setSuccess(result.message || 'Auto escalation triggered successfully!');
        await refreshIssue();
      } else {
        const error = await response.json();
        setError(error.error || 'Auto escalation failed');
      }
    } catch (error: any) {
      setError('Network error. Please try again.');
      console.error('Auto escalation error:', error);
    } finally {
      setEscalateLoading(false);
    }
  };

  const onManualEscalate = async () => {
    if (!issueId || !window.confirm(t.manualEscalateConfirm)) return;

    setError("");
    setSuccess("");
    setEscalateLoading(true);

    try {
      const response = await fetch('/api/escalation/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issueId })
      });

      if (response.ok) {
        const result = await response.json();
        setSuccess(result.message || 'Escalation successful!');
        // Refresh issue data to show updated status
        await refreshIssue();
      } else {
        const error = await response.json();
        setError(error.error || 'Escalation failed');
      }
    } catch (error: any) {
      setError('Network error. Please try again.');
      console.error('Escalation error:', error);
    } finally {
      setEscalateLoading(false);
    }
  };

  const refreshIssue = async () => {
    setRefreshing(true);
    try {
      const docSnap = await getDoc(doc(db, "issues", issueId));
      if (docSnap.exists()) {
        setIssue({
          id: docSnap.id,
          ...docSnap.data()
        } as Issue);
      }
    } catch (error) {
      console.error("Error refreshing:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const openInMaps = () => {
    if (!issue?.gpsLatitude || !issue?.gpsLongitude) return;
    const url = `https://www.google.com/maps?q=${issue.gpsLatitude},${issue.gpsLongitude}&z=17`;
    window.open(url, '_blank');
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/${locale}/villager/issues/${issueId}`;
    const shareText = locale === 'kn'
      ? `ಸಮಸ್ಯೆ: ${issue?.title}\nಸ್ಥಿತಿ: ${issue?.status}\nID: ${issue?.displayId}`
      : locale === 'hi'
        ? `मुद्दा: ${issue?.title}\nस्थिति: ${issue?.status}\nID: ${issue?.displayId}`
        : `Issue: ${issue?.title}\nStatus: ${issue?.status}\nID: ${issue?.displayId}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: issue?.title || t.title,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        console.log('Error sharing:', err);
        copyToClipboard(shareUrl);
      }
    } else {
      copyToClipboard(shareUrl);
    }
    setShowShareOptions(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  };

  const saveImage = () => {
    if (!issue?.photoUrl && !issue?.photoBase64) return;
    const imageUrl = issue.photoUrl || issue.photoBase64;
    const link = document.createElement('a');
    link.href = imageUrl!;
    link.download = `issue-${issue.displayId || issue.id}-evidence.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const StatusIcon = issue ? getStatusIcon(issue.status || 'pending') : FiAlertCircle;

  if (loading) {
    return (
      <Screen padded>
        <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-white p-4 safe-padding">
          <div className="flex items-center gap-3 mb-8 pt-4">
            <div className="w-12 h-12 bg-green-100 rounded-2xl animate-pulse"></div>
            <div className="flex-1">
              <div className="h-6 bg-green-100 rounded-lg animate-pulse mb-2"></div>
              <div className="h-4 bg-green-100 rounded-lg animate-pulse w-2/3"></div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-lg">
            <div className="flex flex-col items-center justify-center">
              <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mb-6"></div>
              <p className="text-green-700 font-bold text-lg">{t.loading}</p>
            </div>
          </div>
        </div>
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen padded>
        <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-white p-4 safe-padding">
          <button
            onClick={() => router.push(`/${locale}/villager/my-issues`)}
            className="p-3 rounded-2xl border-2 border-green-100 bg-white hover:bg-green-50 mb-8 touch-manipulation active:scale-95 mt-4"
          >
            <FiArrowLeft className="w-5 h-5 text-green-700" />
          </button>

          <div className="bg-gradient-to-r from-red-500 to-orange-600 text-white rounded-3xl p-8 text-center">
            <FiAlertCircle className="w-16 h-16 mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-3">Error</h2>
            <p className="mb-6">{error}</p>
            <button
              onClick={() => router.push(`/${locale}/villager/my-issues`)}
              className="px-6 py-3 bg-white text-red-600 rounded-xl font-bold touch-manipulation active:scale-95"
            >
              {t.back} {t.myIssues}
            </button>
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
        @keyframes slideIn {
          from { transform: translateX(-20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
        .animate-slideIn { animation: slideIn 0.3s ease-out forwards; }
        .safe-padding {
          padding-top: env(safe-area-inset-top);
          padding-bottom: env(safe-area-inset-bottom);
        }
        .touch-manipulation {
          touch-action: manipulation;
        }
        /* Mobile optimizations */
        @media (max-width: 640px) {
          .text-responsive-lg {
            font-size: 1.25rem;
            line-height: 1.3;
          }
          .text-responsive-md {
            font-size: 0.9375rem;
          }
          .text-responsive-sm {
            font-size: 0.8125rem;
          }
          .p-responsive {
            padding: 0.75rem;
          }
          .space-y-responsive {
            gap: 0.75rem;
          }
        }
        
        /* Hide scrollbar but keep functionality */
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        
        /* Better touch targets */
        .touch-target {
          min-height: 44px;
          min-width: 44px;
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-white p-2 pb-28 safe-padding touch-manipulation">
        {/* Header - Sticky */}
        <div className="sticky top-0 z-10 bg-gradient-to-b from-green-50/95 to-transparent backdrop-blur-sm pt-2 pb-2 px-2 -mx-2">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => router.push(`/${locale}/villager/my-issues`)}
              className="p-3 rounded-2xl border-2 border-green-100 bg-white hover:bg-green-50 active:scale-95 transition-all duration-200 flex items-center gap-2 touch-manipulation touch-target"
              aria-label={t.back}
            >
              <FiArrowLeft className="w-5 h-5 text-green-700" />
              <span className="text-responsive-sm font-semibold text-green-800 hidden sm:inline">{t.back}</span>
            </button>

            <div className="flex items-center gap-1">
              <button
                onClick={refreshIssue}
                disabled={refreshing}
                className="p-3 rounded-2xl border-2 border-green-100 bg-white hover:bg-green-50 active:scale-95 transition-all duration-200 touch-manipulation touch-target"
                aria-label={t.refresh}
              >
                <FiRefreshCw className={`w-4 h-4 text-green-700 ${refreshing ? 'animate-spin' : ''}`} />
              </button>

              <button
                onClick={() => setShowShareOptions(!showShareOptions)}
                className="p-3 rounded-2xl border-2 border-green-100 bg-white hover:bg-green-50 active:scale-95 transition-all duration-200 touch-manipulation touch-target"
                aria-label={t.share}
              >
                <FiShare2 className="w-4 h-4 text-green-700" />
              </button>
            </div>
          </div>

          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <h1 className="text-responsive-lg font-bold text-green-900 tracking-tight mb-1 line-clamp-2 leading-tight">
                {issue?.title || "Untitled Issue"}
              </h1>
              <div className="flex items-center gap-1 flex-wrap">
                <div className={`px-2 py-1 rounded-full text-responsive-sm font-bold text-white ${getStatusColor(issue?.status || 'pending')} whitespace-nowrap`}>
                  {issue?.status || "Unknown"}
                </div>
                {issue?.displayId && (
                  <div className="px-1.5 py-0.5 bg-green-100 text-green-800 text-responsive-sm rounded-full font-mono whitespace-nowrap">
                    #{issue.displayId}
                  </div>
                )}
              </div>
            </div>

            <div className={`p-2.5 rounded-2xl ${getStatusColor(issue?.status || 'pending')} text-white flex-shrink-0`}>
              <StatusIcon className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Share Options Modal */}
        {showShareOptions && (
          <div className="fixed inset-0 z-50 flex items-end justify-center p-2 bg-black/50 backdrop-blur-sm sm:items-center sm:p-0">
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl animate-slideIn max-h-[80vh] overflow-y-auto">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-bold text-green-900 text-responsive-md">{t.shareIssue}</h3>
              </div>
              <div className="p-2">
                <button
                  onClick={handleShare}
                  className="w-full p-3 flex items-center gap-3 hover:bg-green-50 rounded-xl transition-colors touch-manipulation active:bg-green-100 touch-target"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-emerald-200 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FiShare2 className="w-5 h-5 text-green-700" />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p className="font-bold text-green-900 text-responsive-sm truncate">{t.share}</p>
                    <p className="text-green-700/70 text-responsive-sm truncate">Share via your device</p>
                  </div>
                </button>

                <button
                  onClick={() => copyToClipboard(`${window.location.origin}/${locale}/villager/issues/${issueId}`)}
                  className="w-full p-3 flex items-center gap-3 hover:bg-green-50 rounded-xl transition-colors touch-manipulation active:bg-green-100 touch-target mt-1"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-cyan-200 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FiCopy className="w-5 h-5 text-blue-700" />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p className="font-bold text-blue-900 text-responsive-sm truncate">{t.copyLink}</p>
                    <p className="text-blue-700/70 text-responsive-sm truncate">Copy link to clipboard</p>
                  </div>
                </button>

                {issue?.photoUrl && (
                  <button
                    onClick={saveImage}
                    className="w-full p-3 flex items-center gap-3 hover:bg-green-50 rounded-xl transition-colors touch-manipulation active:bg-green-100 touch-target mt-1"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-violet-200 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FiDownload className="w-5 h-5 text-purple-700" />
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <p className="font-bold text-purple-900 text-responsive-sm truncate">{t.saveImage}</p>
                      <p className="text-purple-700/70 text-responsive-sm truncate">Save evidence photo</p>
                    </div>
                  </button>
                )}
              </div>
              <div className="p-4 border-t border-gray-100">
                <button
                  onClick={() => setShowShareOptions(false)}
                  className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold hover:brightness-95 touch-manipulation active:scale-95 touch-target"
                >
                  {locale === 'kn' ? 'ಮುಚ್ಚಿ' : locale === 'hi' ? 'बंद करें' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success/Error Messages */}
        {success && (
          <div className="mx-2 mb-3 animate-fadeIn">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl p-3 shadow-lg flex items-start gap-2">
              <FiCheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-responsive-sm">{locale === 'kn' ? 'ಯಶಸ್ವಿ' : locale === 'hi' ? 'सफल' : 'Success'}</p>
                <p className="text-responsive-sm opacity-90">{success}</p>
              </div>
            </div>
          </div>
        )}

        {linkCopied && (
          <div className="mx-2 mb-3 animate-fadeIn">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-2xl p-3 shadow-lg flex items-center gap-2">
              <FiCheckCircle className="w-5 h-5 flex-shrink-0" />
              <p className="font-bold text-responsive-sm">{t.linkCopied}</p>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="space-y-2.5 px-2 pb-4">
          {/* Quick Stats */}
          <div className="bg-white border-2 border-green-100 rounded-2xl p-3 shadow-lg">
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <FiEye className="w-4 h-4 text-green-600" />
                  <span className="font-bold text-green-900 text-responsive-sm">{issue?.views || 0}</span>
                </div>
                <p className="text-green-700/70 text-responsive-sm">{t.views}</p>
              </div>
              <div className="text-center p-2">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <FiThumbsUp className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-blue-900 text-responsive-sm">{issue?.upvotes || 0}</span>
                </div>
                <p className="text-blue-700/70 text-responsive-sm">{t.upvotes}</p>
              </div>
              <div className="text-center p-2">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <FiMessageCircle className="w-4 h-4 text-purple-600" />
                  <span className="font-bold text-purple-900 text-responsive-sm">{issue?.commentsCount || 0}</span>
                </div>
                <p className="text-purple-700/70 text-responsive-sm">{t.comments}</p>
              </div>
            </div>
          </div>

          {/* Issue Details Card */}
          <div className="bg-white border-2 border-green-100 rounded-2xl p-3 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-green-900 flex items-center gap-1.5 text-responsive-sm">
                <FiFolder className="w-4 h-4" />
                {t.details}
              </h3>
              <div className="flex items-center gap-2">
                <div className={`px-2 py-0.5 rounded-full text-responsive-sm font-bold ${getPriorityColor(issue?.priority || 'medium')}`}>
                  {issue?.priority || "Medium"}
                </div>
                {issue?.slaDays && (
                  <div className="text-responsive-sm text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                    {issue.slaDays} {t.days}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2 mb-2">
              <div className="flex items-center justify-between text-responsive-sm">
                <span className="text-green-800/70 font-medium">{t.category}:</span>
                <span className="font-bold text-green-900 text-right truncate max-w-[60%]">
                  {issue?.categoryName || issue?.category || "—"}
                </span>
              </div>

              <div className="flex items-center justify-between text-responsive-sm">
                <span className="text-green-800/70 font-medium">{t.location}:</span>
                <span className="font-bold text-green-900 text-right truncate max-w-[60%]">
                  {issue?.villageName || issue?.talukName || "—"}
                </span>
              </div>

              <div className="flex items-center justify-between text-responsive-sm">
                <span className="text-green-800/70 font-medium">{t.postedOn}:</span>
                <span className="font-bold text-green-900 text-right">
                  {formatRelativeDate(fmtDate(issue?.createdAt), locale)}
                </span>
              </div>

              {issue?.resolveDueAt && (
                <div className="flex items-center justify-between text-responsive-sm">
                  <span className="text-green-800/70 font-medium">{t.dueDate}:</span>
                  <span className={`font-bold ${Date.now() >= toMillis(issue.resolveDueAt) ? 'text-red-700' : 'text-green-900'} text-right`}>
                    {formatRelativeDate(fmtDate(issue.resolveDueAt), locale)}
                  </span>
                </div>
              )}
            </div>

            {/* Description */}
            {issue?.description && (
              <div className="mt-2 pt-2 border-t border-green-100">
                <button
                  onClick={() => setShowDescription(!showDescription)}
                  className="w-full flex items-center justify-between p-1.5 rounded-lg hover:bg-green-50 touch-manipulation touch-target"
                >
                  <div className="flex items-center gap-1.5">
                    <div className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center">
                      <FiMessageCircle className="w-3.5 h-3.5 text-green-700" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-green-900 text-responsive-sm">{t.description}</p>
                      <p className="text-green-700/70 text-responsive-sm">{t.tapToView}</p>
                    </div>
                  </div>
                  {showDescription ? (
                    <FiChevronUp className="w-4 h-4 text-green-700" />
                  ) : (
                    <FiChevronDown className="w-4 h-4 text-green-700" />
                  )}
                </button>

                {showDescription && (
                  <div className="mt-2 animate-fadeIn">
                    <p className="text-green-800/80 text-responsive-sm whitespace-pre-wrap bg-green-50 p-2.5 rounded-xl leading-relaxed">
                      {issue.description}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Photo Evidence & GPS */}
          {(issue?.photoUrl || issue?.photoBase64 || (issue?.gpsLatitude && issue?.gpsLongitude)) && (
            <div className="bg-white border-2 border-green-100 rounded-2xl p-3 shadow-lg">
              <h3 className="font-bold text-green-900 mb-2 flex items-center gap-1.5 text-responsive-sm">
                <FiImage className="w-4 h-4" />
                {t.evidence}
              </h3>

              <div className="space-y-3">
                {/* Photo */}
                {(issue?.photoUrl || issue?.photoBase64) && (
                  <div className="relative">
                    <div className="rounded-xl overflow-hidden border-2 border-green-100">
                      <img
                        src={issue.photoUrl || issue.photoBase64}
                        alt="Issue evidence"
                        className="w-full h-40 object-cover"
                        loading="lazy"
                      />
                    </div>
                    <button
                      onClick={saveImage}
                      className="absolute bottom-2 right-2 p-1.5 bg-white/90 backdrop-blur-sm rounded-lg shadow-md touch-manipulation active:scale-95 touch-target"
                      aria-label={t.saveImage}
                    >
                      <FiDownload className="w-3.5 h-3.5 text-green-700" />
                    </button>
                  </div>
                )}

                {/* GPS */}
                {issue?.gpsLatitude && issue?.gpsLongitude && (
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-2.5">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-blue-900 flex items-center gap-1.5 text-responsive-sm">
                        <FiNavigation className="w-3.5 h-3.5" />
                        {t.gpsCoordinates}
                      </h4>
                      <button
                        onClick={openInMaps}
                        className="px-2.5 py-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-responsive-sm rounded-lg font-bold hover:brightness-95 touch-manipulation active:scale-95"
                      >
                        {t.viewOnMap}
                      </button>
                    </div>

                    <div className="space-y-1 text-responsive-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-blue-800/70">{t.latitude}:</span>
                        <span className="font-mono font-bold text-blue-900 text-responsive-sm">
                          {issue.gpsLatitude.toFixed(6)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-blue-800/70">{t.longitude}:</span>
                        <span className="font-mono font-bold text-blue-900 text-responsive-sm">
                          {issue.gpsLongitude.toFixed(6)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Escalation Section */}
          <div className="bg-white border-2 border-green-100 rounded-2xl p-3 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-green-900 flex items-center gap-1.5 text-responsive-sm">
                <FiTrendingUp className="w-4 h-4" />
                {t.escalation}
              </h3>
              <div className="text-responsive-sm text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                {t.currentLevel}: {issue?.escalatedLevel || 0}
              </div>
            </div>

            {/* Current Assignment */}
            <div className="mb-3 p-2.5 bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl">
              <p className="text-responsive-sm text-blue-800/70 mb-0.5">{t.assignedTo}</p>
              <p className="font-bold text-blue-900 text-responsive-sm mb-0.5">
                {getAuthorityName(issue?.escalatedLevel || 0, locale)}
              </p>
              <p className="text-responsive-sm text-blue-800/70">
                {getAuthorityDescription(issue?.escalatedLevel || 0, locale)}
              </p>
            </div>

            {/* Auto Escalation */}
            <div className="mb-3">
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-100 to-cyan-200 rounded-lg flex items-center justify-center">
                  <FiZap className="w-3.5 h-3.5 text-blue-700" />
                </div>
                <div>
                  <h4 className="font-bold text-green-900 text-responsive-sm">{t.autoTitle}</h4>
                  <p className="text-green-700/70 text-responsive-sm">{t.autoDesc}</p>
                </div>
              </div>

              {autoEscalationInfo && autoEscalationInfo.nextLevel !== null ? (
                <div className="space-y-2.5">
                  <div className="p-2.5 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                    <div className="flex justify-between items-start mb-1.5">
                      <div className="flex-1">
                        <p className="text-responsive-sm text-green-800/70">{t.nextAuthority}</p>
                        <p className="font-bold text-green-900 text-responsive-sm">
                          {autoEscalationInfo.nextAuthority}
                        </p>
                        <p className="text-responsive-sm text-green-800/70 mt-0.5">
                          {autoEscalationInfo.nextAuthorityDesc}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-responsive-sm font-bold text-green-900">
                          {autoEscalationInfo.nextEscalationDays} {t.days}
                        </div>
                      </div>
                    </div>

                    <div className="mt-2">
                      <div className="flex justify-between text-responsive-sm text-green-800/70 mb-1">
                        <span>{t.timePassed}: {autoEscalationInfo.daysPassed} {t.days}</span>
                        <span>{autoEscalationInfo.nextEscalationDays} {t.daysRequired}</span>
                      </div>
                      <div className="w-full bg-green-200 rounded-full h-1.5">
                        <div
                          className="bg-gradient-to-r from-green-500 to-emerald-600 h-1.5 rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(100, (autoEscalationInfo.daysPassed / autoEscalationInfo.nextEscalationDays) * 100)}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={onAutoEscalate}
                    disabled={!autoEscalationInfo.shouldAutoEscalate || escalateLoading}
                    className={`w-full py-2.5 rounded-xl font-bold text-white transition-all touch-manipulation active:scale-95 touch-target text-responsive-sm ${autoEscalationInfo.shouldAutoEscalate && !escalateLoading
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700'
                      : 'bg-gradient-to-r from-gray-400 to-gray-500 cursor-not-allowed'
                      }`}
                  >
                    {escalateLoading ? (
                      <span className="flex items-center justify-center gap-1.5">
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        {t.sending}
                      </span>
                    ) : autoEscalationInfo.shouldAutoEscalate ? (
                      t.triggerAutoEscalate
                    ) : (
                      `${t.availableIn} ${autoEscalationInfo.daysUntilNext} ${t.daysMore}`
                    )}
                  </button>
                </div>
              ) : (
                <div className="p-2.5 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl">
                  <p className="text-responsive-sm font-bold text-gray-700">{t.maxLevel}</p>
                  <p className="text-responsive-sm text-gray-600 mt-0.5">
                    {locale === 'kn'
                      ? 'ಈ ಸಮಸ್ಯೆ ಈಗಾಗಲೇ ಹೆಚ್ಚಿನ ಅಧಿಕಾರಿ ಮಟ್ಟದಲ್ಲಿದೆ (ಡಿಡಿಒ)'
                      : locale === 'hi'
                        ? 'यह मुद्दा पहले ही उच्चतम अधिकारी स्तर (डीडीओ) पर पहुँच गया है'
                        : 'This issue is already at the highest authority level (DDO)'}
                  </p>
                </div>
              )}
            </div>

            {/* Manual Escalation */}
            <div className="pt-3 border-t border-green-100">
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-6 h-6 bg-gradient-to-br from-amber-100 to-orange-200 rounded-lg flex items-center justify-center">
                  <FiAlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                </div>
                <div>
                  <h4 className="font-bold text-green-900 text-responsive-sm">{t.manualTitle}</h4>
                  <p className="text-green-700/70 text-responsive-sm">{t.manualDesc}</p>
                </div>
              </div>

              {manualInfo && (
                <div className="space-y-2.5">
                  <div className="p-2.5 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-responsive-sm text-amber-800/70">
                          {locale === 'kn'
                            ? 'ಲಭ್ಯವಾಗುತ್ತದೆ'
                            : locale === 'hi'
                              ? 'उपलब्ध होता है'
                              : 'Available after'}
                        </p>
                        <p className="font-bold text-amber-900 text-responsive-sm">
                          4 {t.days}
                        </p>
                        <p className="text-responsive-sm text-amber-800/70 mt-0.5">
                          {locale === 'kn'
                            ? 'ನೇರ ಸೂಚನೆ ಮುಂದಿನ ಅಧಿಕಾರಿಗೆ'
                            : locale === 'hi'
                              ? 'अगले अधिकारी को सीधी सूचना'
                              : 'Direct notification to next authority'}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-responsive-sm font-bold text-amber-900">
                          {manualInfo.manualUsed ? t.alreadyUsed :
                            manualInfo.manualEscalationAvailable ? t.availableNow :
                              `${t.availableIn} ${manualInfo.daysUntilManual} ${t.days}`}
                        </div>
                      </div>
                    </div>

                    {!manualInfo.manualUsed && (
                      <div className="mt-2">
                        <div className="flex justify-between text-responsive-sm text-amber-800/70 mb-1">
                          <span>{t.timePassed}: {manualInfo.daysPassed} {t.days}</span>
                          <span>4 {t.daysRequired}</span>
                        </div>
                        <div className="w-full bg-amber-200 rounded-full h-1.5">
                          <div
                            className="bg-gradient-to-r from-amber-500 to-orange-600 h-1.5 rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.min(100, (manualInfo.daysPassed / 4) * 100)}%`
                            }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={onManualEscalate}
                    disabled={!manualInfo.manualEscalationAvailable || manualInfo.manualUsed || escalateLoading}
                    className={`w-full py-2.5 rounded-xl font-bold text-white transition-all touch-manipulation active:scale-95 touch-target text-responsive-sm ${manualInfo.manualUsed || !manualInfo.manualEscalationAvailable || escalateLoading
                      ? 'bg-gradient-to-r from-gray-400 to-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700'
                      }`}
                  >
                    {escalateLoading ? (
                      <span className="flex items-center justify-center gap-1.5">
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        {t.sending}
                      </span>
                    ) : manualInfo.manualUsed ? (
                      t.alreadyUsed
                    ) : !manualInfo.manualEscalationAvailable ? (
                      `${t.availableIn} ${manualInfo.daysUntilManual} ${t.daysMore}`
                    ) : (
                      t.triggerManualEscalate
                    )}
                  </button>

                  <p className="text-responsive-sm text-gray-500 text-center">
                    {t.manualTooltip}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Escalation History */}
          {issue?.escalation?.history && issue.escalation.history.length > 0 && (
            <div className="bg-white border-2 border-green-100 rounded-2xl p-3 shadow-lg">
              <button
                onClick={() => setShowEscalationHistory(!showEscalationHistory)}
                className="w-full flex items-center justify-between touch-manipulation touch-target"
              >
                <div className="flex items-center gap-1.5">
                  <div className="w-7 h-7 bg-gradient-to-br from-amber-50 to-orange-100 rounded-lg flex items-center justify-center">
                    <FiTrendingUp className="w-3.5 h-3.5 text-amber-700" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-green-900 text-responsive-sm">{t.escalationHistory}</p>
                    <p className="text-green-700/70 text-responsive-sm">
                      {issue.escalation.history.length} {locale === 'kn' ? 'ನಮೂದುಗಳು' : locale === 'hi' ? 'प्रविष्टियाँ' : 'entries'}
                    </p>
                  </div>
                </div>
                {showEscalationHistory ? (
                  <FiChevronUp className="w-4 h-4 text-green-700" />
                ) : (
                  <FiChevronDown className="w-4 h-4 text-green-700" />
                )}
              </button>

              {showEscalationHistory && (
                <div className="mt-2 space-y-1.5 animate-fadeIn">
                  {[...issue.escalation.history]
                    .slice()
                    .reverse()
                    .map((h, idx) => (
                      <div
                        key={idx}
                        className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-2.5"
                      >
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex items-center gap-1 flex-wrap">
                            <div className={`px-1.5 py-0.5 rounded text-responsive-sm font-bold ${h.type === 'manual'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                              }`}>
                              {h.type === 'manual' ? t.manualEscalation : t.autoEscalation}
                            </div>
                            <div className="text-responsive-sm font-bold text-green-900">
                              {String(h.from || "").toUpperCase()} → {String(h.to || "").toUpperCase()}
                            </div>
                          </div>
                          <div className="text-responsive-sm text-green-700/70 whitespace-nowrap">
                            {formatRelativeDate(fmtDate(h.at), locale)}
                          </div>
                        </div>

                        {h.reason && (
                          <p className="text-responsive-sm text-green-800/80 mt-1">{h.reason}</p>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Reporter Info */}
          <div className="bg-white border-2 border-green-100 rounded-2xl p-3 shadow-lg">
            <button
              onClick={() => setShowReporterInfo(!showReporterInfo)}
              className="w-full flex items-center justify-between touch-manipulation touch-target"
            >
              <div className="flex items-center gap-1.5">
                <div className="w-7 h-7 bg-gradient-to-br from-purple-50 to-violet-100 rounded-lg flex items-center justify-center">
                  <FiUser className="w-3.5 h-3.5 text-purple-700" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-green-900 text-responsive-sm">{t.reporterInfo}</p>
                  <p className="text-green-700/70 text-responsive-sm">{t.tapToView}</p>
                </div>
              </div>
              {showReporterInfo ? (
                <FiChevronUp className="w-4 h-4 text-green-700" />
              ) : (
                <FiChevronDown className="w-4 h-4 text-green-700" />
              )}
            </button>

            {showReporterInfo && (
              <div className="mt-2 space-y-1.5 animate-fadeIn">
                <div className="grid grid-cols-1 gap-1.5">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-2.5">
                    <p className="text-responsive-sm text-green-800/70 mb-0.5">{t.name}</p>
                    <p className="font-bold text-green-900 text-responsive-sm truncate">{issue?.reporterName || "—"}</p>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-2.5">
                    <p className="text-responsive-sm text-blue-800/70 mb-0.5">{t.phone}</p>
                    <p className="font-bold text-blue-900 text-responsive-sm truncate">{issue?.reporterPhone || "—"}</p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200 rounded-xl p-2.5">
                    <p className="text-responsive-sm text-purple-800/70 mb-0.5">{t.email}</p>
                    <p className="font-bold text-purple-900 text-responsive-sm truncate">{issue?.reporterEmail || "—"}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Navigation - Mobile Optimized */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t-2 border-green-100 p-2 shadow-2xl animate-fadeIn safe-padding">
          <div className="grid grid-cols-5 gap-1">
            <button
              className="flex flex-col items-center justify-center p-1.5 rounded-xl transition-all hover:bg-green-50 active:scale-95 touch-manipulation min-h-[56px]"
              onClick={() => router.push(`/${locale}/villager/dashboard`)}
              aria-label={t.dashboard}
            >
              <FiHome className="w-5 h-5 text-green-600" />
              <span className="text-[10px] mt-0.5 font-medium text-green-700 text-center leading-tight">
                {t.dashboard}
              </span>
            </button>

            <button
              className="flex flex-col items-center justify-center p-1.5 rounded-xl transition-all hover:bg-green-50 active:scale-95 touch-manipulation min-h-[56px]"
              onClick={() => router.push(`/${locale}/villager/my-issues`)}
              aria-label={t.myIssues}
            >
              <FiList className="w-5 h-5 text-green-600" />
              <span className="text-[10px] mt-0.5 font-medium text-green-700 text-center leading-tight">
                {t.myIssues}
              </span>
            </button>

            <div className="relative">
              <button
                onClick={() => router.push(`/${locale}/villager/raise-issue`)}
                className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-300 active:scale-95 z-10 touch-manipulation"
                aria-label={t.reportNew}
              >
                <FiPlus className="w-6 h-6 text-white" />
              </button>
              <div className="min-h-[56px]"></div>
            </div>

            <button
              className="flex flex-col items-center justify-center p-1.5 rounded-xl transition-all hover:bg-green-50 active:scale-95 touch-manipulation min-h-[56px]"
              onClick={() => router.push(`/${locale}/villager/issue-tracking`)}
              aria-label={t.issueTracking}
            >
              <FiTrendingUp className="w-5 h-5 text-green-600" />
              <span className="text-[10px] mt-0.5 font-medium text-green-700 text-center leading-tight">
                {t.issueTracking}
              </span>
            </button>

            <button
              className="flex flex-col items-center justify-center p-1.5 rounded-xl transition-all hover:bg-green-50 active:scale-95 touch-manipulation min-h-[56px]"
              onClick={() => router.push(`/${locale}/villager/profile`)}
              aria-label={t.profile}
            >
              <FiUser className="w-5 h-5 text-green-600" />
              <span className="text-[10px] mt-0.5 font-medium text-green-700 text-center leading-tight">
                {t.profile}
              </span>
            </button>
          </div>
        </div>
      </div>
    </Screen>
  );
}