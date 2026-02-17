// app/[locale]/authority/pdo/dashboard/page.tsx
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
  query,
  where,
  getCountFromServer,
} from "firebase/firestore";
import {
  FiInbox,
  FiCheckSquare,
  FiUsers,
  FiFileText,
  FiRefreshCw,
  FiLogOut,
  FiHome,
  FiUser,
  FiBarChart2,
  FiSend,
  FiPlayCircle,
  FiActivity,
  FiDollarSign,
} from "react-icons/fi";

type Locale = "en" | "kn" | "hi";

type StatCard = {
  label: string;
  count: number;
  to: string;
  hint?: string;
  color: string;
  icon: React.ReactNode;
  bgColor: string;
  borderColor: string;
};

export default function PdoDashboardPage() {
  const router = useRouter();
  const params = useParams() as { locale?: string };
  const locale = ((params?.locale as Locale) || "en") as Locale;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState("");
  const [stats, setStats] = useState<StatCard[]>([]);
  const [animatedStats, setAnimatedStats] = useState<StatCard[]>([]);
  const [user, setUser] = useState<any>(null);
  const [panchayatId, setPanchayatId] = useState("");
  const [totalActivities, setTotalActivities] = useState(0);

  const didInit = useRef(false);
  const navLock = useRef(false);

  const isAuthorityVerified = (a: any) => {
    return (
      a?.verified === true ||
      a?.verification?.status === "verified" ||
      a?.status === "verified" ||
      a?.status === "active"
    );
  };

  const t = useMemo(() => {
    const L: Record<Locale, any> = {
      en: {
        title: "PDO Dashboard",
        subtitle: "Assign & resolve issues in your Panchayat",
        welcome: "Welcome back,",
        loading: "Loading dashboard...",
        refresh: "Refresh",
        logout: "Logout",
        dashboard: "Dashboard",
        issues: "Issues",
        profile: "Profile",
        settings: "Settings",
        quickActions: "Quick Actions",
        panchayat: "Panchayat",
        tapToInbox: "Tap to manage verified issues",
        tapToAssign: "Tap to assign issues to workers",
        tapToProgress: "Track work progress",
        tapToResolved: "View resolved issues",
        tapToAll: "View all issues in your panchayat",
        tapToFundRequest: "Request funds for development works",
        stats: "Your Panchayat Statistics",
        totalActivities: "Total Activities",
        pending: "Pending",
        resolved: "Resolved",
        inProgress: "In Progress",
        fundRequest: "Fund Request",
        cards: {
          inbox: "Inbox (VI Verified)",
          assigned: "Assigned",
          inProgress: "In Progress",
          resolved: "Resolved",
          all: "All Issues",
        },
        hints: {
          missingPid: "Missing panchayatId in your authority profile.",
          inbox: "Issues verified by Village In-charge, waiting for PDO action",
          assigned: "Assigned to worker/field staff",
          inProgress: "Work started",
          resolved: "Marked resolved",
          all: "Everything in your Panchayat scope",
        },
        cta: {
          inbox: "Open Inbox",
          all: "View All Issues",
          assignWork: "Assign Work",
          trackProgress: "Track Progress",
        },
        errPerm: "Missing or insufficient permissions.",
      },
      kn: {
        title: "PDO ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
        subtitle: "ನಿಮ್ಮ ಪಂಚಾಯತ್‌ನ ಸಮಸ್ಯೆಗಳನ್ನು ನಿಯೋಜಿಸಿ & ಪರಿಹರಿಸಿ",
        welcome: "ಮರಳಿ ಸ್ವಾಗತ,",
        loading: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಲೋಡ್ ಆಗುತ್ತಿದೆ...",
        refresh: "ರಿಫ್ರೆಶ್ ಮಾಡಿ",
        logout: "ಲಾಗ್‌ಔಟ್",
        dashboard: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
        issues: "ಸಮಸ್ಯೆಗಳು",
        profile: "ಪ್ರೊಫೈಲ್",
        settings: "ಸೆಟ್ಟಿಂಗ್ಸ್",
        quickActions: "ತ್ವರಿತ ಕ್ರಿಯೆಗಳು",
        panchayat: "ಪಂಚಾಯತ್",
        tapToInbox: "ಪರಿಶೀಲಿಸಿದ ಸಮಸ್ಯೆಗಳನ್ನು ನಿರ್ವಹಿಸಲು ಟ್ಯಾಪ್ ಮಾಡಿ",
        tapToAssign: "ಕೆಲಸಗಾರರಿಗೆ ಸಮಸ್ಯೆಗಳನ್ನು ನಿಯೋಜಿಸಲು ಟ್ಯಾಪ್ ಮಾಡಿ",
        tapToProgress: "ಕೆಲಸದ ಪ್ರಗತಿಯನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ",
        tapToResolved: "ಪರಿಹರಿಸಿದ ಸಮಸ್ಯೆಗಳನ್ನು ವೀಕ್ಷಿಸಿ",
        tapToAll: "ನಿಮ್ಮ ಪಂಚಾಯತ್ನ ಎಲ್ಲಾ ಸಮಸ್ಯೆಗಳನ್ನು ವೀಕ್ಷಿಸಿ",
        tapToFundRequest: "ಅಭಿವೃದ್ಧಿ ಕಾರ್ಯಗಳಿಗೆ ನಿಧಿ ವಿನಂತಿ",
        stats: "ನಿಮ್ಮ ಪಂಚಾಯತ್ ಅಂಕಿಅಂಶಗಳು",
        totalActivities: "ಒಟ್ಟು ಚಟುವಟಿಕೆಗಳು",
        pending: "ಬಾಕಿ ಇವೆ",
        resolved: "ಪರಿಹಾರಗೊಂಡ",
        inProgress: "ಪ್ರಗತಿಯಲ್ಲಿದೆ",
        fundRequest: "ನಿಧಿ ವಿನಂತಿ",
        cards: {
          inbox: "ಇನ್‌ಬಾಕ್ಸ್ (VI ಪರಿಶೀಲನೆ)",
          assigned: "ನಿಯೋಜಿಸಲಾಗಿದೆ",
          inProgress: "ಪ್ರಗತಿಯಲ್ಲಿದೆ",
          resolved: "ಪರಿಹಾರವಾಗಿದೆ",
          all: "ಎಲ್ಲಾ ಸಮಸ್ಯೆಗಳು",
        },
        hints: {
          missingPid: "ನಿಮ್ಮ authority ಪ್ರೊಫೈಲ್‌ನಲ್ಲಿ panchayatId ಇಲ್ಲ.",
          inbox: "ಗ್ರಾಮ ಇಂಚಾರ್ಜ್ ಪರಿಶೀಲಿಸಿದ ಸಮಸ್ಯೆಗಳು, PDO ಕ್ರಮಕ್ಕೆ ಕಾಯುತ್ತಿದೆ",
          assigned: "ಕಾರ್ಮಿಕ/ಫೀಲ್ಡ್ ತಂಡಕ್ಕೆ ನಿಯೋಜಿಸಲಾಗಿದೆ",
          inProgress: "ಕೆಲಸ ಆರಂಭವಾಗಿದೆ",
          resolved: "ಪರಿಹಾರವಾಗಿದೆ ಎಂದು ಗುರುತು ಹಾಕಲಾಗಿದೆ",
          all: "ನಿಮ್ಮ ವ್ಯಾಪ್ತಿಯ ಎಲ್ಲಾ ಸಮಸ್ಯೆಗಳು",
        },
        cta: {
          inbox: "ಇನ್‌ಬಾಕ್ಸ್ ತೆರೆ",
          all: "ಎಲ್ಲಾ ಸಮಸ್ಯೆಗಳನ್ನು ವೀಕ್ಷಿಸಿ",
          assignWork: "ಕೆಲಸ ನಿಯೋಜಿಸಿ",
          trackProgress: "ಪ್ರಗತಿ ಟ್ರ್ಯಾಕ್ ಮಾಡಿ",
        },
        errPerm: "ಅನುಮತಿ ಇಲ್ಲ ಅಥವಾ ಸಾಕಾಗಿಲ್ಲ.",
      },
      hi: {
        title: "PDO डैशबोर्ड",
        subtitle: "अपनी पंचायत में मुद्दे असाइन करें और हल करें",
        welcome: "वापसी पर स्वागत है,",
        loading: "डैशबोर्ड लोड हो रहा है...",
        refresh: "रिफ्रेश करें",
        logout: "लॉगआउट",
        dashboard: "डैशबोर्ड",
        issues: "समस्याएँ",
        profile: "प्रोफ़ाइल",
        settings: "सेटिंग्स",
        quickActions: "त्वरित कार्य",
        panchayat: "पंचायत",
        tapToInbox: "सत्यापित मुद्दों को प्रबंधित करने के लिए टैप करें",
        tapToAssign: "कार्यकर्ताओं को मुद्दे असाइन करने के लिए टैप करें",
        tapToProgress: "कार्य प्रगति ट्रैक करें",
        tapToResolved: "हल किए गए मुद्दे देखें",
        tapToAll: "अपनी पंचायत के सभी मुद्दे देखें",
        tapToFundRequest: "विकास कार्यों के लिए धनराशि का अनुरोध करें",
        stats: "आपके पंचायत के आँकड़े",
        totalActivities: "कुल गतिविधियाँ",
        pending: "लंबित",
        resolved: "हल हो चुकी",
        inProgress: "प्रगति में",
        fundRequest: "फंड रिक्वेस्ट",
        cards: {
          inbox: "इनबॉक्स (VI Verified)",
          assigned: "Assigned",
          inProgress: "In Progress",
          resolved: "Resolved",
          all: "All Issues",
        },
        hints: {
          missingPid: "Authority profile में panchayatId missing है।",
          inbox: "Village In-charge द्वारा verify किए गए मुद्दे, PDO action के लिए",
          assigned: "Worker/field team को assigned",
          inProgress: "काम शुरू",
          resolved: "Resolved mark",
          all: "आपकी scope के सभी issues",
        },
        cta: {
          inbox: "इनबॉक्स खोलें",
          all: "सभी मुद्दे देखें",
          assignWork: "काम असाइन करें",
          trackProgress: "प्रगति ट्रैक करें",
        },
        errPerm: "Missing or insufficient permissions.",
      },
    };
    return L[locale] || L.en;
  }, [locale]);

  const loadDashboardData = async () => {
    try {
      setErr("");
      setLoading(true);

      const u = auth.currentUser;
      if (!u) {
        if (!navLock.current) {
          navLock.current = true;
          router.replace(`/${locale}/authority/login`);
        }
        return;
      }

      setUser(u);

      const aSnap = await getDoc(doc(db, "authorities", u.uid));
      if (!aSnap.exists()) {
        if (!navLock.current) {
          navLock.current = true;
          router.replace(`/${locale}/authority/login`);
        }
        return;
      }

      const a = aSnap.data() as any;
      const isVerified = isAuthorityVerified(a);

      if (a?.role !== "pdo" || !isVerified) {
        if (!navLock.current) {
          navLock.current = true;
          router.replace(`/${locale}/authority/status`);
        }
        return;
      }

      const pid = String(a?.panchayatId || "");
      if (!pid) {
        setErr(t.hints.missingPid);
        setLoading(false);
        return;
      }
      setPanchayatId(pid);

      const col = collection(db, "issues");

      const qInbox = query(
        col,
        where("panchayatId", "==", pid),
        where("status", "==", "vi_verified")
      );
      const qAssigned = query(
        col,
        where("panchayatId", "==", pid),
        where("status", "==", "pdo_assigned")
      );
      const qInProgress = query(
        col,
        where("panchayatId", "==", pid),
        where("status", "==", "in_progress")
      );
      const qResolved = query(
        col,
        where("panchayatId", "==", pid),
        where("status", "==", "resolved")
      );
      const qAllIssues = query(col, where("panchayatId", "==", pid));

      const [inboxC, assignedC, progressC, resolvedC, allC] =
        await Promise.all([
          getCountFromServer(qInbox),
          getCountFromServer(qAssigned),
          getCountFromServer(qInProgress),
          getCountFromServer(qResolved),
          getCountFromServer(qAllIssues),
        ]);

      const inboxCount = inboxC.data().count || 0;
      const assignedCount = assignedC.data().count || 0;
      const inProgressCount = progressC.data().count || 0;
      const resolvedCount = resolvedC.data().count || 0;
      const allCount = allC.data().count || 0;

      const newStats: StatCard[] = [
        {
          label: t.cards.inbox,
          count: inboxCount,
          to: `/${locale}/authority/pdo/issues?status=vi_verified`,
          hint: t.hints.inbox,
          color: "text-amber-900",
          icon: <FiInbox className="w-5 h-5" />,
          bgColor: "bg-amber-100",
          borderColor: "border-amber-200",
        },
        {
          label: t.cards.assigned,
          count: assignedCount,
          to: `/${locale}/authority/pdo/issues?status=pdo_assigned`,
          hint: t.hints.assigned,
          color: "text-blue-900",
          icon: <FiSend className="w-5 h-5" />,
          bgColor: "bg-blue-100",
          borderColor: "border-blue-200",
        },
        {
          label: t.cards.inProgress,
          count: inProgressCount,
          to: `/${locale}/authority/pdo/issues?status=in_progress`,
          hint: t.hints.inProgress,
          color: "text-indigo-900",
          icon: <FiPlayCircle className="w-5 h-5" />,
          bgColor: "bg-indigo-100",
          borderColor: "border-indigo-200",
        },
        {
          label: t.cards.resolved,
          count: resolvedCount,
          to: `/${locale}/authority/pdo/issues?status=resolved`,
          hint: t.hints.resolved,
          color: "text-green-900",
          icon: <FiCheckSquare className="w-5 h-5" />,
          bgColor: "bg-green-100",
          borderColor: "border-green-200",
        },
        {
          label: t.cards.all,
          count: allCount,
          to: `/${locale}/authority/pdo/issues`,
          hint: t.hints.all,
          color: "text-gray-900",
          icon: <FiFileText className="w-5 h-5" />,
          bgColor: "bg-gray-100",
          borderColor: "border-gray-200",
        },
      ];

      setStats(newStats);
      setAnimatedStats(newStats.map((stat) => ({ ...stat, count: 0 })));
      setTotalActivities(
        inboxCount + assignedCount + inProgressCount + resolvedCount
      );

      setTimeout(() => {
        setAnimatedStats(newStats);
      }, 300);
    } catch (e: any) {
      console.error("PDO DASHBOARD ERROR:", e);
      setErr(e?.message || t.errPerm);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (didInit.current) return;
      didInit.current = true;

      navLock.current = false;

      if (u) {
        await loadDashboardData();
      } else {
        if (!navLock.current) {
          navLock.current = true;
          router.replace(`/${locale}/authority/login`);
        }
      }
    });

    return () => unsub();
  }, [router, locale]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.push(`/${locale}/role-select`);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (loading) {
    return (
      <Screen padded>
        <style>{`
          @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
          @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
          .shimmer { background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent); animation: shimmer 1.5s infinite; }
          .pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        `}</style>

        <div className="min-h-screen bg-gradient-to-b from-green-50 to-white p-4">
          <div className="mb-8">
            <div className="h-8 w-64 bg-gradient-to-r from-green-200 to-emerald-200 rounded-lg mb-2 pulse"></div>
            <div className="h-4 w-48 bg-gradient-to-r from-green-100 to-emerald-100 rounded pulse"></div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-green-50 p-4 shadow-lg"
              >
                <div className="absolute inset-0 shimmer"></div>
                <div className="h-4 w-24 bg-gradient-to-r from-green-200 to-emerald-200 rounded mb-3"></div>
                <div className="h-8 w-12 bg-gradient-to-r from-green-300 to-emerald-300 rounded"></div>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-green-50 p-5 shadow-lg"
              >
                <div className="absolute inset-0 shimmer"></div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-gradient-to-r from-green-200 to-emerald-200 rounded-xl"></div>
                  <div className="flex-1">
                    <div className="h-5 w-40 bg-gradient-to-r from-green-200 to-emerald-200 rounded mb-2"></div>
                    <div className="h-3 w-56 bg-gradient-to-r from-green-100 to-emerald-100 rounded"></div>
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
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-fadeIn { animation: fadeIn 0.6s ease-out forwards; }
        .refresh-spin { animation: spin 0.8s linear infinite; }
        .stat-card { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .stat-card:hover { transform: translateY(-5px); box-shadow: 0 12px 24px rgba(16, 185, 129, 0.15); }
        .action-card { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(240, 253, 244, 0.5) 100%); }
        .action-card:hover { transform: translateY(-3px) scale(1.01); background: linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(240, 253, 244, 0.8) 100%); box-shadow: 0 8px 20px rgba(16, 185, 129, 0.2); }
        .ripple { position: relative; overflow: hidden; }
        .ripple::after { content: ''; position: absolute; top: 50%; left: 50%; width: 0; height: 0; border-radius: 50%; background: rgba(16, 185, 129, 0.1); transform: translate(-50%, -50%); transition: width 0.6s, height 0.6s; }
        .ripple:hover::after { width: 300px; height: 300px; }
      `}</style>

      <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-white p-4 pb-20">
        {/* Header */}
        <div className="mb-8 animate-fadeIn">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-green-900 tracking-tight">
                {t.title}
              </h1>
              <p className="text-green-700/80 mt-2 text-sm font-semibold flex items-center gap-2">
                <FiActivity className="w-4 h-4" />
                {t.welcome}{" "}
                {user?.displayName ||
                  user?.email?.split("@")[0] ||
                  "PDO"}
              </p>

              <div className="mt-1 text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full inline-flex items-center gap-1">
                <FiUsers className="w-3 h-3" />
                <span>
                  Panchayat ID: <strong>{panchayatId}</strong>
                </span>
              </div>
            </div>

            {/* Refresh */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-3 rounded-xl border-2 border-green-100 bg-white hover:bg-green-50 active:scale-95 transition-all duration-200"
              title={t.refresh}
            >
              <FiRefreshCw
                className={`w-5 h-5 text-green-700 ${refreshing ? "refresh-spin" : ""
                  }`}
              />
            </button>
          </div>

          <div className="flex items-center gap-2 text-sm text-green-600/80 bg-green-50/50 rounded-xl p-3">
            <FiBarChart2 className="w-4 h-4" />
            <span className="font-semibold">{t.stats}</span>
            <span className="ml-auto text-green-900 font-bold">
              {totalActivities} {t.totalActivities}
            </span>
          </div>
        </div>

        {/* Error */}
        {err && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-100 rounded-2xl animate-fadeIn">
            <p className="text-red-700 text-sm">{err}</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {stats.map((stat, index) => (
            <button
              key={stat.label}
              onClick={() => router.push(stat.to)}
              className={`stat-card ${stat.borderColor} border-2 rounded-2xl p-4 shadow-lg text-left bg-white animate-fadeIn`}
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 ${stat.bgColor} rounded-lg`}>
                  {stat.icon}
                </div>
                {stat.count > 0 && stat.label !== t.cards.all && (
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded-full ${stat.bgColor} ${stat.color}`}
                  >
                    {stat.count}
                  </span>
                )}
              </div>

              <div className={`text-2xl font-bold ${stat.color} mb-1`}>
                {animatedStats[index]?.count ?? 0}
              </div>

              <div className="text-xs font-semibold text-gray-600">
                {stat.label}
              </div>

              {stat.hint && (
                <div className="text-[10px] text-gray-500 mt-1 line-clamp-2">
                  {stat.hint}
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Quick actions */}
        <div className="flex items-center justify-between mb-4 animate-fadeIn">
          <h2 className="text-lg font-bold text-green-900 flex items-center gap-2">
            <FiBarChart2 className="w-5 h-5" />
            {t.quickActions}
          </h2>
          <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
            {t.panchayat}
          </div>
        </div>

        <div className="space-y-4 mb-8">
          <div
            className="action-card border-2 border-amber-100 rounded-2xl p-5 ripple"
            onClick={() =>
              router.push(`/${locale}/authority/pdo/issues?status=vi_verified`)
            }
            role="button"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg">
                <FiInbox className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-amber-900 text-lg">
                  {t.cards.inbox}
                </h3>
                <p className="text-sm text-amber-700/70 mt-1">
                  {t.tapToInbox}
                </p>
              </div>
              {stats[0]?.count > 0 && (
                <div className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-bold">
                  {stats[0]?.count} {t.pending}
                </div>
              )}
            </div>
          </div>

          <div
            className="action-card border-2 border-blue-100 rounded-2xl p-5 ripple"
            onClick={() =>
              router.push(`/${locale}/authority/pdo/issues?status=vi_verified`)
            }
            role="button"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-lg">
                <FiSend className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-blue-900 text-lg">
                  {t.cta.assignWork}
                </h3>
                <p className="text-sm text-blue-700/70 mt-1">
                  {t.tapToAssign}
                </p>
              </div>
              <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">
                {stats[1]?.count ?? 0} {t.cards.assigned}
              </div>
            </div>
          </div>

          <div
            className="action-card border-2 border-emerald-100 rounded-2xl p-5 ripple"
            onClick={() =>
              router.push(`/${locale}/authority/pdo/fund-request`)
            }
            role="button"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-lg">
                <FiDollarSign className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-emerald-900 text-lg">
                  {t.fundRequest}
                </h3>
                <p className="text-sm text-emerald-700/70 mt-1">
                  {t.tapToFundRequest}
                </p>
              </div>
            </div>
          </div>

          <div
            className="action-card border-2 border-indigo-100 rounded-2xl p-5 ripple"
            onClick={() =>
              router.push(`/${locale}/authority/pdo/issues?status=in_progress`)
            }
            role="button"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                <FiPlayCircle className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-indigo-900 text-lg">
                  {t.cta.trackProgress}
                </h3>
                <p className="text-sm text-indigo-700/70 mt-1">
                  {t.tapToProgress}
                </p>
              </div>
              <div className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-bold">
                {stats[2]?.count ?? 0} {t.inProgress}
              </div>
            </div>
          </div>

          <div
            className="action-card border-2 border-gray-100 rounded-2xl p-5 ripple"
            onClick={() => router.push(`/${locale}/authority/pdo/issues`)}
            role="button"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-gray-500 to-gray-700 rounded-xl shadow-lg">
                <FiFileText className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-lg">{t.cta.all}</h3>
                <p className="text-sm text-gray-700/70 mt-1">
                  {t.tapToAll}
                </p>
              </div>
              <div className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-bold">
                {stats[4]?.count ?? 0} Total
              </div>
            </div>
          </div>
        </div>

        {/* Bottom nav */}
        <div className="fixed bottom-4 left-4 right-4 bg-white/90 backdrop-blur-lg border-2 border-green-100 rounded-2xl p-2 shadow-xl">
          <div className="grid grid-cols-5 gap-1">
            <button
              className="flex flex-col items-center justify-center p-3 rounded-xl transition-all bg-gradient-to-b from-green-100 to-emerald-50"
              onClick={() => router.push(`/${locale}/authority/pdo/dashboard`)}
            >
              <FiHome className="w-5 h-5 text-green-700" />
              <span className="text-xs mt-1 font-bold text-green-800">
                {t.dashboard}
              </span>
            </button>

            <button
              className="flex flex-col items-center justify-center p-3 rounded-xl transition-all hover:bg-green-50"
              onClick={() => router.push(`/${locale}/authority/pdo/issues`)}
            >
              <FiFileText className="w-5 h-5 text-green-600/70" />
              <span className="text-xs mt-1 font-medium text-green-700/70">
                {t.issues}
              </span>
            </button>

            <button
              className="flex flex-col items-center justify-center p-3 rounded-xl transition-all hover:bg-green-50"
              onClick={() => router.push(`/${locale}/authority/pdo/assignments`)}
            >
              <FiSend className="w-5 h-5 text-green-600/70" />
              <span className="text-xs mt-1 font-medium text-green-700/70">
                Assign
              </span>
            </button>

            <button
              className="flex flex-col items-center justify-center p-3 rounded-xl transition-all hover:bg-green-50"
              onClick={() => router.push(`/${locale}/authority/pdo/fund-request`)}
            >
              <FiDollarSign className="w-5 h-5 text-green-600/70" />
              <span className="text-xs mt-1 font-medium text-green-700/70">
                {t.fundRequest}
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

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="fixed top-4 right-4 p-3 rounded-xl border-2 border-red-100 bg-white hover:bg-red-50 text-red-700 hover:text-red-900 transition-all duration-200 hover:scale-105 shadow-sm"
          title={t.logout}
        >
          <FiLogOut className="w-5 h-5" />
        </button>
      </div>
    </Screen>
  );
}