"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, Timestamp, collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { auth, db } from "../../../lib/firebase";
import Screen from "../../../components/Screen";
import { onAuthStateChanged } from "firebase/auth";
import {
  FiArrowLeft,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiCalendar,
  FiMapPin,
  FiFolder,
  FiRefreshCw,
  FiChevronDown,
  FiChevronUp,
  FiHome,
  FiList,
  FiTrendingUp,
  FiUser,
  FiPlus,
  FiSearch
} from "react-icons/fi";

type TimelineStep = {
  key: string;
  title: string;
  desc: string;
  done: boolean;
  at?: string;
};

type IssueOption = {
  id: string;
  title: string;
  status: string;
  createdAt: any;
  location?: string;
  category?: string;
  description?: string;
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

function formatIssueLabel(issue: IssueOption) {
  const date = issue.createdAt ? fmtDate(issue.createdAt).split(",")[0] : "Unknown date";
  return `${issue.title} • ${issue.status} • ${date}`;
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

// Helper function to get date from Firestore field
function getDateFromFirestore(field: any): Date | null {
  if (!field) return null;
  try {
    if (field instanceof Timestamp) return field.toDate();
    if (field?.toDate) return field.toDate();
    if (typeof field === "string") return new Date(field);
    return null;
  } catch {
    return null;
  }
}

export default function VillagerIssueTrackingPage() {
  const router = useRouter();
  const params = useParams() as { locale?: string };
  const locale = params?.locale || "en";
  const dropdownRef = useRef<HTMLDivElement>(null);

  const t = useMemo(() => {
    const L: any = {
      en: {
        title: "Issue Tracking",
        subtitle: "Track the progress of your reported issues",
        selectIssue: "Select an issue to track",
        loading: "Loading...",
        loadingIssues: "Loading your issues...",
        notFound: "Issue not found",
        notAllowed: "You are not allowed to view this issue.",
        stepSubmitted: "Submitted",
        stepSubmittedDesc: "Your issue has been submitted successfully.",
        stepVi: "Verified by Village In-charge",
        stepViDesc: "Village in-charge verified the issue.",
        stepAssigned: "Worker Assigned",
        stepAssignedDesc: "PDO assigned a worker to resolve your issue.",
        stepInProgress: "In Progress",
        stepInProgressDesc: "Work is currently in progress.",
        stepEscalated: "Escalated",
        stepEscalatedDesc: "Issue escalated to higher authority.",
        stepClosed: "Resolved",
        stepClosedDesc: "Issue has been resolved/closed.",
        lastUpdate: "Last updated",
        back: "Back to Dashboard",
        refresh: "Refresh",
        viewDetails: "View Issue Details",
        noIssues: "No issues found",
        reportIssue: "Report New Issue",
        status: "Status",
        location: "Location",
        category: "Category",
        created: "Created",
        currentStatus: "Current Status",
        timeline: "Timeline",
        selectPlaceholder: "Choose an issue...",
        loadingTimeline: "Loading timeline...",
        errorLoading: "Error loading timeline",
        today: "Today",
        yesterday: "Yesterday",
        daysAgo: "days ago",
        searchIssues: "Search issues...",
        // Navigation text
        dashboard: "Dashboard",
        myIssues: "My Issues",
        issueTracking: "Issue Tracking",
        profile: "Profile",
        // Status indicators
        completed: "Completed",
        pending: "Pending",
      },
      kn: {
        title: "ಸಮಸ್ಯೆ ಟ್ರ್ಯಾಕಿಂಗ್",
        subtitle: "ನಿಮ್ಮ ವರದಿ ಮಾಡಿದ ಸಮಸ್ಯೆಗಳ ಪ್ರಗತಿಯನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ",
        selectIssue: "ಟ್ರ್ಯಾಕ್ ಮಾಡಲು ಸಮಸ್ಯೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ",
        loading: "ಲೋಡ್ ಆಗುತ್ತಿದೆ...",
        loadingIssues: "ನಿಮ್ಮ ಸಮಸ್ಯೆಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...",
        notFound: "ಸಮಸ್ಯೆ ಕಂಡುಬಂದಿಲ್ಲ",
        notAllowed: "ಈ ಸಮಸ್ಯೆಯನ್ನು ನೋಡಲು ನಿಮಗೆ ಅನುಮತಿ ಇಲ್ಲ.",
        stepSubmitted: "ಸಲ್ಲಿಸಲಾಗಿದೆ",
        stepSubmittedDesc: "ನಿಮ್ಮ ಸಮಸ್ಯೆಯನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಸಲ್ಲಿಸಲಾಗಿದೆ.",
        stepVi: "ಗ್ರಾಮ ಇನ್‌ಚಾರ್ಜ್ ಪರಿಶೀಲನೆ",
        stepViDesc: "ಗ್ರಾಮ ಇನ್‌ಚಾರ್ಜ್ ಸಮಸ್ಯೆಯನ್ನು ಪರಿಶೀಲಿಸಿದ್ದಾರೆ.",
        stepAssigned: "ಕೆಲಸಗಾರ ನಿಯೋಜನೆ",
        stepAssignedDesc: "PDO ಕೆಲಸಗಾರನನ್ನು ನಿಯೋಜಿಸಿದ್ದಾರೆ.",
        stepInProgress: "ಕಾರ್ಯ ಪ್ರಗತಿಯಲ್ಲಿ",
        stepInProgressDesc: "ಕೆಲಸ ನಡೆಯುತ್ತಿದೆ.",
        stepEscalated: "ಎಸ್ಕಲೇಶನ್",
        stepEscalatedDesc: "ಮೇಲಾಧಿಕಾರಿಗೆ ಎಸ್ಕಲೇಶನ್ ಮಾಡಲಾಗಿದೆ.",
        stepClosed: "ಬಗೆಹರಿಸಲಾಗಿದೆ",
        stepClosedDesc: "ಸಮಸ್ಯೆ ಬಗೆಹರಿಸಿ ಮುಚ್ಚಲಾಗಿದೆ.",
        lastUpdate: "ಕೊನೆಯ ನವೀಕರಣ",
        back: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಹಿಂದಿರುಗಿ",
        refresh: "ರಿಫ್ರೆಶ್",
        viewDetails: "ಸಮಸ್ಯೆಯ ವಿವರಗಳನ್ನು ವೀಕ್ಷಿಸಿ",
        noIssues: "ಯಾವುದೇ ಸಮಸ್ಯೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ",
        reportIssue: "ಹೊಸ ಸಮಸ್ಯೆ ವರದಿ ಮಾಡಿ",
        status: "ಸ್ಥಿತಿ",
        location: "ಸ್ಥಳ",
        category: "ವರ್ಗ",
        created: "ಸೃಷ್ಟಿಸಲಾಗಿದೆ",
        currentStatus: "ಪ್ರಸ್ತುತ ಸ್ಥಿತಿ",
        timeline: "ಟೈಮ್‌ಲೈನ್",
        selectPlaceholder: "ಸಮಸ್ಯೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ...",
        loadingTimeline: "ಟೈಮ್‌ಲೈನ್ ಲೋಡ್ ಆಗುತ್ತಿದೆ...",
        errorLoading: "ಟೈಮ್‌ಲೈನ್ ಲೋಡ್ ಮಾಡುವಲ್ಲಿ ದೋಷ",
        today: "ಇಂದು",
        yesterday: "ನಿನ್ನೆ",
        daysAgo: "ದಿನಗಳ ಹಿಂದೆ",
        searchIssues: "ಸಮಸ್ಯೆಗಳನ್ನು ಹುಡುಕಿ...",
        // Navigation text
        dashboard: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
        myIssues: "ನನ್ನ ಸಮಸ್ಯೆಗಳು",
        issueTracking: "ಸಮಸ್ಯೆ ಟ್ರ್ಯಾಕಿಂಗ್",
        profile: "ಪ್ರೊಫೈಲ್",
        // Status indicators
        completed: "ಪೂರ್ಣಗೊಂಡಿದೆ",
        pending: "ಬಾಕಿ ಇದೆ",
      },
      hi: {
        title: "मुद्दा ट्रैकिंग",
        subtitle: "अपने रिपोर्ट किए गए मुद्दों की प्रगति को ट्रैक करें",
        selectIssue: "ट्रैक करने के लिए एक मुद्दा चुनें",
        loading: "लोड हो रहा है...",
        loadingIssues: "आपके मुद्दे लोड हो रहे हैं...",
        notFound: "मुद्दा नहीं मिला",
        notAllowed: "आपको यह मुद्दा देखने की अनुमति नहीं है।",
        stepSubmitted: "सबमिट हुआ",
        stepSubmittedDesc: "आपका मुद्दा सफलतापूर्वक सबमिट हो गया है।",
        stepVi: "विलेज इन-चार्ज द्वारा वेरिफ़ाइड",
        stepViDesc: "विलेज इन-चार्ज ने मुद्दे को वेरिफ़ाई किया।",
        stepAssigned: "वर्कर असाइन",
        stepAssignedDesc: "PDO ने वर्कर असाइन किया।",
        stepInProgress: "प्रगति में",
        stepInProgressDesc: "काम अभी चल रहा है।",
        stepEscalated: "एस्केलेटेड",
        stepEscalatedDesc: "उच्च अधिकारी को एस्केलेट किया गया।",
        stepClosed: "रिज़ॉल्व्ड",
        stepClosedDesc: "मुद्दा हल/क्लोज़ कर दिया गया।",
        lastUpdate: "आख़िरी अपडेट",
        back: "डैशबोर्ड पर वापस जाएं",
        refresh: "रिफ्रेश",
        viewDetails: "मुद्दे का विवरण देखें",
        noIssues: "कोई मुद्दा नहीं मिला",
        reportIssue: "नया मुद्दा रिपोर्ट करें",
        status: "स्थिति",
        location: "स्थान",
        category: "श्रेणी",
        created: "बनाया गया",
        currentStatus: "वर्तमान स्थिति",
        timeline: "टाइमलाइन",
        selectPlaceholder: "मुद्दा चुनें...",
        loadingTimeline: "टाइमलाइन लोड हो रही है...",
        errorLoading: "टाइमलाइन लोड करने में त्रुटि",
        today: "आज",
        yesterday: "कल",
        daysAgo: "दिन पहले",
        searchIssues: "मुद्दों को खोजें...",
        // Navigation text
        dashboard: "डैशबोर्ड",
        myIssues: "मेरे मुद्दे",
        issueTracking: "मुद्दा ट्रैकिंग",
        profile: "प्रोफ़ाइल",
        // Status indicators
        completed: "पूरा हुआ",
        pending: "लंबित",
      },
    };
    return L[locale] || L.en;
  }, [locale]);

  const [authReady, setAuthReady] = useState(false);
  const [uid, setUid] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingIssues, setLoadingIssues] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [issues, setIssues] = useState<IssueOption[]>([]);
  const [filteredIssues, setFilteredIssues] = useState<IssueOption[]>([]);
  const [selectedIssueId, setSelectedIssueId] = useState<string>("");
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const [err, setErr] = useState("");
  const [steps, setSteps] = useState<TimelineStep[]>([]);
  const [lastUpdated, setLastUpdated] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter issues based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredIssues(issues);
    } else {
      const filtered = issues.filter(issue =>
        issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredIssues(filtered);
    }
  }, [searchQuery, issues]);

  // Auth state listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUid(u?.uid || "");
      setAuthReady(true);
      if (!u) {
        router.replace(`/${locale}/villager/login`);
      }
    });
    return () => unsub();
  }, [locale, router]);

  // Load user's issues for dropdown
  const loadIssues = async () => {
    if (!uid) return;

    setLoadingIssues(true);
    try {
      const q = query(
        collection(db, "issues"),
        where("villagerId", "==", uid),
        orderBy("createdAt", "desc")
      );

      const snap = await getDocs(q);
      const issueList = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));

      setIssues(issueList);
      setFilteredIssues(issueList);

      // Auto-select first issue if none selected
      if (issueList.length > 0 && !selectedIssueId) {
        setSelectedIssueId(issueList[0].id);
      }
    } catch (e: any) {
      console.error("Error loading issues:", e);
    } finally {
      setLoadingIssues(false);
    }
  };

  // Load timeline for selected issue - FIXED VERSION
  const loadTimeline = async () => {
    if (!selectedIssueId || !uid) {
      setSteps([]);
      setSelectedIssue(null);
      return;
    }

    setLoading(true);
    setErr("");

    try {
      const snap = await getDoc(doc(db, "issues", selectedIssueId));
      if (!snap.exists()) {
        setErr(t.notFound);
        setSelectedIssue(null);
        setLoading(false);
        return;
      }

      const issue = snap.data() as any;
      setSelectedIssue(issue);

      // Debug: Log issue data to see what's available
      console.log("Issue data for timeline:", {
        status: issue.status,
        verifiedAt: issue.verifiedAt,
        assignedAt: issue.assignedAt,
        inProgressAt: issue.inProgressAt,
        escalatedAt: issue.escalatedAt,
        closedAt: issue.closedAt,
        assignedWorker: issue.assignedWorker,
        escalatedLevel: issue.escalatedLevel
      });

      // Check if user is allowed to view this issue
      if (issue.villagerId !== uid) {
        setErr(t.notAllowed);
        setSelectedIssue(null);
        setLoading(false);
        return;
      }

      const status = (issue.status || "pending").toLowerCase();

      // Get timestamps using helper function
      const atSubmitted = getDateFromFirestore(issue.createdAt || issue.submittedAt);
      const atVi = getDateFromFirestore(issue.verifiedAt || issue.viVerifiedAt);
      const atAssigned = getDateFromFirestore(issue.assignedAt);
      const atInProgress = getDateFromFirestore(issue.inProgressAt);
      const atEscalated = getDateFromFirestore(issue.escalatedAt || issue.escalation?.lastEscalatedAt);
      const atClosed = getDateFromFirestore(issue.closedAt || issue.resolvedAt);

      // Format dates for display
      const formatForDisplay = (date: Date | null) => {
        return date ? date.toLocaleString() : undefined;
      };

      // Determine which steps are done based on actual timestamps AND status
      const isSubmittedDone = true; // Always done when issue exists

      const isViDone = !!atVi || [
        'verified_by_vi', 'verified', 'assigned', 'in_progress', 'in progress',
        'escalated', 'escalated_to_tdo', 'escalated_to_ddo', 'closed', 'resolved', 'completed'
      ].includes(status);

      const isAssignedDone = !!atAssigned || !!issue.assignedWorker || [
        'assigned', 'in_progress', 'in progress',
        'escalated', 'escalated_to_tdo', 'escalated_to_ddo', 'closed', 'resolved', 'completed'
      ].includes(status);

      const isInProgressDone = !!atInProgress || [
        'in_progress', 'in progress',
        'escalated', 'escalated_to_tdo', 'escalated_to_ddo', 'closed', 'resolved', 'completed'
      ].includes(status);

      const isEscalatedDone = !!atEscalated || (issue.escalatedLevel > 0) || [
        'escalated', 'escalated_to_tdo', 'escalated_to_ddo'
      ].includes(status);

      const isClosedDone = !!atClosed || [
        'closed', 'resolved', 'completed'
      ].includes(status);

      // Debug: Log timeline calculations
      console.log("Timeline calculations:", {
        status,
        isViDone,
        isAssignedDone,
        isInProgressDone,
        isEscalatedDone,
        isClosedDone,
        hasAssignedWorker: !!issue.assignedWorker,
        escalatedLevel: issue.escalatedLevel
      });

      const list: TimelineStep[] = [
        {
          key: "submitted",
          title: t.stepSubmitted,
          desc: t.stepSubmittedDesc,
          done: isSubmittedDone,
          at: formatForDisplay(atSubmitted),
        },
        {
          key: "verified_by_vi",
          title: t.stepVi,
          desc: t.stepViDesc,
          done: isViDone,
          at: formatForDisplay(atVi),
        },
        {
          key: "assigned",
          title: t.stepAssigned,
          desc: t.stepAssignedDesc,
          done: isAssignedDone,
          at: formatForDisplay(atAssigned),
        },
        {
          key: "in_progress",
          title: t.stepInProgress,
          desc: t.stepInProgressDesc,
          done: isInProgressDone,
          at: formatForDisplay(atInProgress),
        },
        {
          key: "escalated_to_tdo",
          title: t.stepEscalated,
          desc: t.stepEscalatedDesc,
          done: isEscalatedDone,
          at: formatForDisplay(atEscalated),
        },
        {
          key: "closed",
          title: t.stepClosed,
          desc: t.stepClosedDesc,
          done: isClosedDone,
          at: formatForDisplay(atClosed),
        },
      ];

      setSteps(list);

      // Set last updated
      const updatedAt = getDateFromFirestore(issue.updatedAt) ||
        getDateFromFirestore(issue.lastUpdatedAt) ||
        atClosed || atInProgress || atAssigned || atVi || atSubmitted;
      setLastUpdated(updatedAt ? updatedAt.toLocaleString() : "");

    } catch (e: any) {
      console.error("Timeline load error:", e);
      setErr(e?.message || t.errorLoading);
    } finally {
      setLoading(false);
    }
  };

  // Load issues on auth ready
  useEffect(() => {
    if (authReady && uid) {
      loadIssues();
    }
  }, [authReady, uid]);

  // Load timeline when issue is selected
  useEffect(() => {
    if (selectedIssueId) {
      loadTimeline();
    }
  }, [selectedIssueId]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadIssues().then(() => {
      if (selectedIssueId) {
        loadTimeline();
      }
      setRefreshing(false);
    });
  };

  const formatRelativeDate = (dateString: string) => {
    if (!dateString) return "";

    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return `${t.today}, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      if (diffDays === 1) return `${t.yesterday}, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      if (diffDays < 7) return `${diffDays} ${t.daysAgo}, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

      return date.toLocaleString();
    } catch {
      return dateString;
    }
  };

  const StatusIcon = selectedIssue ? getStatusIcon(selectedIssue.status || 'pending') : FiAlertCircle;

  return (
    <Screen padded>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out forwards; }
        .shimmer {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          animation: shimmer 2s infinite;
        }
        .pulse { animation: pulse 2s ease-in-out infinite; }
        .timeline-done {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
          border: 2px solid #059669;
        }
        .timeline-pending {
          background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
          border: 2px solid #d1d5db;
        }
        .dropdown-container {
          position: relative;
          z-index: 100;
        }
        .dropdown-menu {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          z-index: 1000;
        }
        .step-done-line {
          background: linear-gradient(to bottom, #10b981, #059669);
        }
        .step-pending-line {
          background: #e5e7eb;
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-white p-4 pb-24">
        {/* Header */}
        <div className="mb-8 animate-fadeIn">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => router.push(`/${locale}/villager/dashboard`)}
              className="p-3 rounded-2xl border-2 border-green-100 bg-white hover:bg-green-50 active:scale-95 transition-all duration-200 flex items-center gap-2"
            >
              <FiArrowLeft className="w-5 h-5 text-green-700" />
              <span className="text-sm font-semibold text-green-800">{t.back}</span>
            </button>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-3 rounded-2xl border-2 border-green-100 bg-white hover:bg-green-50 active:scale-95 transition-all duration-200"
              title={t.refresh}
            >
              <FiRefreshCw className={`w-5 h-5 text-green-700 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-green-900 tracking-tight mb-2">{t.title}</h1>
            <p className="text-green-700/80 text-lg font-medium">{t.subtitle}</p>
          </div>
        </div>

        {/* Issue Selection Dropdown */}
        <div className="mb-8 animate-fadeIn delay-100 dropdown-container" ref={dropdownRef}>
          <label className="block text-sm font-semibold text-green-800 mb-3">
            {t.selectIssue}
          </label>

          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`w-full p-4 rounded-2xl border-2 ${isDropdownOpen ? 'border-green-400 ring-2 ring-green-100' : 'border-green-100'} bg-white text-left transition-all duration-200 flex items-center justify-between hover:bg-green-50`}
            >
              <div className="flex-1 min-w-0">
                {selectedIssueId ? (
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(issues.find(i => i.id === selectedIssueId)?.status || 'pending')}`}></div>
                    <span className="font-semibold text-green-900 truncate">
                      {issues.find(i => i.id === selectedIssueId)?.title || "Loading..."}
                    </span>
                  </div>
                ) : (
                  <span className="text-green-700/60">{t.selectPlaceholder}</span>
                )}
              </div>
              {isDropdownOpen ? (
                <FiChevronUp className="w-5 h-5 text-green-600 flex-shrink-0" />
              ) : (
                <FiChevronDown className="w-5 h-5 text-green-600 flex-shrink-0" />
              )}
            </button>

            {isDropdownOpen && (
              <div className="dropdown-menu">
                <div className="w-full mt-2 bg-white border-2 border-green-100 rounded-2xl shadow-2xl shadow-green-100/50 overflow-hidden">
                  {/* Search Bar */}
                  <div className="p-3 border-b border-green-100 bg-green-50/50">
                    <div className="relative">
                      <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-green-600" />
                      <input
                        type="text"
                        placeholder={t.searchIssues}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-green-200 rounded-xl text-sm text-green-900 placeholder-green-600/60 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    {loadingIssues ? (
                      <div className="p-8 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mb-3"></div>
                        <p className="text-green-700">{t.loadingIssues}</p>
                      </div>
                    ) : filteredIssues.length === 0 ? (
                      <div className="p-8 text-center">
                        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mb-4">
                          <FiAlertCircle className="w-8 h-8 text-green-600/70" />
                        </div>
                        <p className="text-green-800 font-semibold mb-2">
                          {searchQuery ? "No matching issues found" : t.noIssues}
                        </p>
                        {!searchQuery && (
                          <button
                            onClick={() => router.push(`/${locale}/villager/raise-issue`)}
                            className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:brightness-95 transition-all mt-2"
                          >
                            {t.reportIssue}
                          </button>
                        )}
                      </div>
                    ) : (
                      filteredIssues.map((issue) => (
                        <button
                          key={issue.id}
                          onClick={() => {
                            setSelectedIssueId(issue.id);
                            setIsDropdownOpen(false);
                            setSearchQuery("");
                          }}
                          className={`w-full p-4 text-left hover:bg-green-50 transition-all ${selectedIssueId === issue.id ? 'bg-gradient-to-r from-green-50 to-emerald-50' : ''} border-b border-green-50 last:border-b-0`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-2 h-2 mt-2 rounded-full ${getStatusColor(issue.status)}`}></div>
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-green-900 mb-1 truncate">
                                {issue.title}
                              </div>
                              <div className="text-sm text-green-700/80 mb-2 line-clamp-2">
                                {issue.description || "No description"}
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${getStatusColor(issue.status)}`}>
                                  {issue.status}
                                </span>
                                {issue.category && (
                                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                                    {issue.category}
                                  </span>
                                )}
                                <span className="text-xs text-green-700/60 font-medium flex items-center gap-1">
                                  <FiCalendar className="w-3 h-3" />
                                  {fmtDate(issue.createdAt).split(",")[0]}
                                </span>
                              </div>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {err && (
          <div className="mb-6 animate-fadeIn">
            <div className="bg-gradient-to-r from-red-500 to-orange-600 text-white rounded-2xl p-4 shadow-lg flex items-center gap-3">
              <FiAlertCircle className="w-6 h-6 flex-shrink-0" />
              <div>
                <p className="font-bold">Error</p>
                <p className="text-sm opacity-90">{err}</p>
              </div>
            </div>
          </div>
        )}

        {/* Issue Info Card */}
        {selectedIssue && (
          <div className="mb-8 animate-fadeIn delay-200">
            <div className="bg-gradient-to-br from-white to-green-50 border-2 border-green-100 rounded-2xl p-5 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <h3 className="font-bold text-green-900 text-xl mb-2 line-clamp-2">
                    {selectedIssue.title || "Untitled Issue"}
                  </h3>
                  <p className="text-green-700/80 text-sm line-clamp-3">
                    {selectedIssue.description || "No description provided"}
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${getStatusColor(selectedIssue.status || 'pending')} text-white flex-shrink-0`}>
                  <StatusIcon className="w-6 h-6" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-white border border-green-100 rounded-xl p-3 hover:border-green-300 transition-colors">
                  <div className="text-xs font-semibold text-green-800/70 mb-1 flex items-center gap-1">
                    <FiAlertCircle className="w-3 h-3" />
                    {t.status}
                  </div>
                  <div className={`px-3 py-1.5 rounded-full text-sm font-bold text-white inline-block ${getStatusColor(selectedIssue.status || 'pending')}`}>
                    {selectedIssue.status || t.pending}
                  </div>
                </div>

                {selectedIssue.location && (
                  <div className="bg-white border border-green-100 rounded-xl p-3 hover:border-green-300 transition-colors">
                    <div className="text-xs font-semibold text-green-800/70 mb-1 flex items-center gap-1">
                      <FiMapPin className="w-3 h-3" />
                      {t.location}
                    </div>
                    <div className="text-sm font-semibold text-green-900 truncate">
                      {selectedIssue.location}
                    </div>
                  </div>
                )}

                {selectedIssue.category && (
                  <div className="bg-white border border-green-100 rounded-xl p-3 hover:border-green-300 transition-colors">
                    <div className="text-xs font-semibold text-green-800/70 mb-1 flex items-center gap-1">
                      <FiFolder className="w-3 h-3" />
                      {t.category}
                    </div>
                    <div className="text-sm font-semibold text-green-900 truncate">
                      {selectedIssue.category}
                    </div>
                  </div>
                )}

                <div className="bg-white border border-green-100 rounded-xl p-3 hover:border-green-300 transition-colors">
                  <div className="text-xs font-semibold text-green-800/70 mb-1 flex items-center gap-1">
                    <FiCalendar className="w-3 h-3" />
                    {t.created}
                  </div>
                  <div className="text-sm font-semibold text-green-900">
                    {formatRelativeDate(fmtDate(selectedIssue.createdAt))}
                  </div>
                </div>
              </div>

              {selectedIssue.assignedWorker && (
                <div className="mt-4 pt-4 border-t border-green-100">
                  <div className="text-xs font-semibold text-green-800/70 mb-1 flex items-center gap-1">
                    <FiUser className="w-3 h-3" />
                    {t.stepAssigned}
                  </div>
                  <div className="text-sm font-semibold text-green-900 bg-green-50 px-3 py-2 rounded-lg">
                    👷 {selectedIssue.assignedWorker.name || selectedIssue.assignedWorker.email || "Worker assigned"}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Timeline Section */}
        <div className="animate-fadeIn delay-300">
          {!selectedIssueId ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mb-6">
                <FiClock className="w-12 h-12 text-green-600/70" />
              </div>
              <h3 className="text-xl font-bold text-green-900 mb-2">
                {t.selectIssue}
              </h3>
              <p className="text-green-700/70 mb-6">
                Select an issue from the dropdown above to view its timeline
              </p>
              {issues.length === 0 && (
                <button
                  onClick={() => router.push(`/${locale}/villager/raise-issue`)}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold hover:brightness-95 transition-all"
                >
                  {t.reportIssue}
                </button>
              )}
            </div>
          ) : loading ? (
            <div className="bg-white border-2 border-green-100 rounded-2xl p-8 shadow-lg">
              <div className="flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mb-6 pulse">
                  <FiClock className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-green-700 font-semibold">{t.loadingTimeline}</p>
                <div className="mt-4 w-32 h-2 bg-green-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-green-500 to-emerald-600 animate-pulse"></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border-2 border-green-100 rounded-2xl p-5 shadow-lg hover:shadow-xl transition-shadow duration-300">
              {/* Timeline Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h4 className="text-lg font-extrabold text-green-900 flex items-center gap-2">
                    <FiTrendingUp className="w-5 h-5" />
                    {t.timeline}
                  </h4>
                  {lastUpdated && (
                    <p className="text-xs text-green-900/60 mt-1">
                      {t.lastUpdate}: <span className="font-semibold">{formatRelativeDate(lastUpdated)}</span>
                    </p>
                  )}
                </div>

                <div className={`px-5 py-2.5 rounded-full text-sm font-bold text-white flex items-center gap-2 ${getStatusColor(selectedIssue?.status || 'pending')}`}>
                  <StatusIcon className="w-4 h-4" />
                  <span>{t.currentStatus}: {selectedIssue?.status || "Unknown"}</span>
                </div>
              </div>

              {/* Timeline Steps - FIXED VERSION */}
              <div className="space-y-6">
                {steps.map((s, idx) => (
                  <div key={s.key} className="flex items-start gap-4">
                    {/* Step Number and Line - FIXED */}
                    <div className="relative flex flex-col items-center">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center z-10 transition-all duration-300 ${s.done ? 'timeline-done' : 'timeline-pending'}`}
                      >
                        {s.done ? (
                          <FiCheckCircle className="w-6 h-6 text-white" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-3 border-gray-400 bg-white"></div>
                        )}
                      </div>

                      {/* Connecting Line - FIXED */}
                      {idx !== steps.length - 1 && (
                        <div className={`absolute top-12 w-1 h-full ${s.done ? 'step-done-line' : 'step-pending-line'}`}></div>
                      )}
                    </div>

                    {/* Step Content */}
                    <div className={`flex-1 pb-6 ${idx !== steps.length - 1 ? 'border-b border-gray-200' : ''}`}>
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                        <div className="flex-1">
                          <h5 className={`font-extrabold text-lg ${s.done ? 'text-green-900' : 'text-gray-700'}`}>
                            {s.title}
                          </h5>
                          <p className={`text-sm mt-1 ${s.done ? 'text-green-700/80' : 'text-gray-500/80'}`}>
                            {s.desc}
                          </p>
                        </div>

                        {s.at && (
                          <div className={`text-sm px-3 py-1.5 rounded-full flex-shrink-0 ${s.done ? 'bg-green-100 text-green-800 font-semibold' : 'bg-gray-100 text-gray-600'}`}>
                            {formatRelativeDate(s.at)}
                          </div>
                        )}
                      </div>

                      {/* Status Badge */}
                      <div className="mt-3">
                        <span
                          className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-extrabold ${s.done ? 'bg-green-100 border border-green-200 text-green-800' : 'bg-gray-100 border border-gray-200 text-gray-600'}`}
                        >
                          {s.done ? (
                            <>
                              <FiCheckCircle className="w-4 h-4 mr-2 text-green-600" />
                              {t.completed}
                            </>
                          ) : (
                            <>
                              <FiClock className="w-4 h-4 mr-2 text-gray-500" />
                              {t.pending}
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* View Details Button */}
              {selectedIssueId && (
                <button
                  onClick={() => router.push(`/${locale}/villager/issues/${selectedIssueId}`)}
                  className="mt-8 w-full rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-extrabold py-4 hover:brightness-95 active:scale-[0.99] transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  {t.viewDetails} <FiArrowLeft className="w-5 h-5 rotate-180" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-4 left-4 right-4 bg-white/95 backdrop-blur-lg border-2 border-green-100 rounded-2xl p-2 shadow-xl animate-fadeIn z-50">
          <div className="grid grid-cols-4 gap-1">
            <button
              className="flex flex-col items-center justify-center p-3 rounded-xl transition-all hover:bg-green-50 active:scale-95"
              onClick={() => router.push(`/${locale}/villager/dashboard`)}
            >
              <FiHome className="w-5 h-5 text-green-600/70" />
              <span className="text-xs mt-1 font-medium text-green-700/70">
                {t.dashboard}
              </span>
            </button>

            <button
              className="flex flex-col items-center justify-center p-3 rounded-xl transition-all hover:bg-green-50 active:scale-95"
              onClick={() => router.push(`/${locale}/villager/my-issues`)}
            >
              <FiList className="w-5 h-5 text-green-600/70" />
              <span className="text-xs mt-1 font-medium text-green-700/70">
                {t.myIssues}
              </span>
            </button>

            <button
              className="flex flex-col items-center justify-center p-3 rounded-xl transition-all bg-gradient-to-b from-green-100 to-emerald-50 border border-green-200"
            >
              <FiTrendingUp className="w-5 h-5 text-green-700" />
              <span className="text-xs mt-1 font-medium text-green-800 font-bold">
                {t.issueTracking}
              </span>
            </button>

            <button
              className="flex flex-col items-center justify-center p-3 rounded-xl transition-all hover:bg-green-50 active:scale-95"
              onClick={() => router.push(`/${locale}/villager/profile`)}
            >
              <FiUser className="w-5 h-5 text-green-600/70" />
              <span className="text-xs mt-1 font-medium text-green-700/70">
                {t.profile}
              </span>
            </button>
          </div>
        </div>

        {/* Floating Action Button */}
        <button
          onClick={() => router.push(`/${locale}/villager/raise-issue`)}
          className="fixed bottom-24 right-6 w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 z-40"
        >
          <FiPlus className="w-6 h-6 text-white" />
        </button>
      </div>
    </Screen>
  );
}