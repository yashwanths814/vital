"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import Screen from "../../../../components/Screen";
import { auth, db } from "../../../../lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiUsers,
  FiFileText,
  FiShield,
  FiTrendingUp,
  FiRefreshCw,
  FiLogOut,
  FiHome,
  FiUser,
  FiBarChart2,
  FiBell,
  FiSettings
} from "react-icons/fi";

type Locale = "en" | "kn" | "hi";

interface StatCard {
  label: string;
  count: number;
  to: string;
  color: string;
  icon: ReactNode;
  bgColor: string;
  borderColor: string;
}

export default function VillageInchargeDashboard() {
  const router = useRouter();
  const params = useParams() as { locale?: string };
  const locale = ((params?.locale as Locale) || "en") as Locale;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState("");
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<StatCard[]>([]);
  const [animatedStats, setAnimatedStats] = useState<StatCard[]>([]);

  const t = useMemo(() => {
    const L: Record<Locale, any> = {
      en: {
        title: "Village In-charge Dashboard",
        subtitle: "Verify villagers, manage issues & prevent escalation",
        welcome: "Welcome back,",
        loading: "Loading dashboard...",
        refresh: "Refresh",
        logout: "Logout",
        dashboard: "Dashboard",
        verify: "Verifications",
        issues: "Issues",
        profile: "Profile",
        settings: "Settings",
        quickActions: "Quick Actions",
        village: "Village",
        tapToVerify: "Tap to verify pending villagers",
        tapToManage: "Tap to manage pending issues",
        viewVerified: "View verified issues",
        handleOverdue: "Handle overdue issues",
        stats: "Your Management Statistics",
        totalActivities: "Total Activities",
        pending: "Pending",
        resolved: "Resolved",
        overdue: "Overdue",
        cards: {
          pendingVillagers: "Pending Villagers",
          pendingIssues: "Pending Issues",
          verifiedIssues: "Verified Issues",
          overdueIssues: "Overdue Issues",
        },
        cta: {
          verifyVillagers: "Verify Villagers",
          verifyIssues: "Verify Issues",
        },
      },
      kn: {
        title: "ಗ್ರಾಮ ಇಂಚಾರ್ಜ್ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
        subtitle: "ಗ್ರಾಮಸ್ಥರು ಮತ್ತು ಸಮಸ್ಯೆಗಳನ್ನು ಪರಿಶೀಲಿಸಿ",
        welcome: "ಮರಳಿ ಸ್ವಾಗತ,",
        loading: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಲೋಡ್ ಆಗುತ್ತಿದೆ...",
        refresh: "ರಿಫ್ರೆಶ್ ಮಾಡಿ",
        logout: "ಲಾಗ್‌ಔಟ್",
        dashboard: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
        verify: "ಪರಿಶೀಲನೆಗಳು",
        issues: "ಸಮಸ್ಯೆಗಳು",
        profile: "ಪ್ರೊಫೈಲ್",
        settings: "ಸೆಟ್ಟಿಂಗ್ಸ್",
        quickActions: "ತ್ವರಿತ ಕ್ರಿಯೆಗಳು",
        village: "ಗ್ರಾಮ",
        tapToVerify: "ಬಾಕಿ ಇರುವ ಗ್ರಾಮಸ್ಥರನ್ನು ಪರಿಶೀಲಿಸಲು ಟ್ಯಾಪ್ ಮಾಡಿ",
        tapToManage: "ಬಾಕಿ ಸಮಸ್ಯೆಗಳನ್ನು ನಿರ್ವಹಿಸಲು ಟ್ಯಾಪ್ ಮಾಡಿ",
        viewVerified: "ಪರಿಶೀಲಿಸಿದ ಸಮಸ್ಯೆಗಳನ್ನು ವೀಕ್ಷಿಸಿ",
        handleOverdue: "ಕಾಲಾವಧಿ ಮೀರಿದ ಸಮಸ್ಯೆಗಳನ್ನು ನಿರ್ವಹಿಸಿ",
        stats: "ನಿಮ್ಮ ನಿರ್ವಹಣಾ ಅಂಕಿಅಂಶಗಳು",
        totalActivities: "ಒಟ್ಟು ಚಟುವಟಿಕೆಗಳು",
        pending: "ಬಾಕಿ ಇವೆ",
        resolved: "ಪರಿಹಾರಗೊಂಡ",
        overdue: "ಕಾಲಾವಧಿ ಮೀರಿದ",
        cards: {
          pendingVillagers: "ಬಾಕಿ ಇರುವ ಗ್ರಾಮಸ್ಥರು",
          pendingIssues: "ಬಾಕಿ ಇರುವ ಸಮಸ್ಯೆಗಳು",
          verifiedIssues: "ಪರಿಶೀಲಿಸಿದ ಸಮಸ್ಯೆಗಳು",
          overdueIssues: "ಕಾಲಾವಧಿ ಮೀರಿದ ಸಮಸ್ಯೆಗಳು",
        },
        cta: {
          verifyVillagers: "ಗ್ರಾಮಸ್ಥರನ್ನು ಪರಿಶೀಲಿಸಿ",
          verifyIssues: "ಸಮಸ್ಯೆಗಳನ್ನು ಪರಿಶೀಲಿಸಿ",
        },
      },
      hi: {
        title: "ग्राम इंचार्ज डैशबोर्ड",
        subtitle: "ग्रामीणों और समस्याओं का प्रबंधन",
        welcome: "वापसी पर स्वागत है,",
        loading: "डैशबोर्ड लोड हो रहा है...",
        refresh: "रिफ्रेश करें",
        logout: "लॉगआउट",
        dashboard: "डैशबोर्ड",
        verify: "सत्यापन",
        issues: "समस्याएँ",
        profile: "प्रोफ़ाइल",
        settings: "सेटिंग्स",
        quickActions: "त्वरित कार्य",
        village: "गाँव",
        tapToVerify: "लंबित ग्रामीणों को सत्यापित करने के लिए टैप करें",
        tapToManage: "लंबित समस्याओं को प्रबंधित करने के लिए टैप करें",
        viewVerified: "सत्यापित समस्याएँ देखें",
        handleOverdue: "समय सीमा पार समस्याओं को संभालें",
        stats: "आपके प्रबंधन आँकड़े",
        totalActivities: "कुल गतिविधियाँ",
        pending: "लंबित",
        resolved: "हल हो चुकी",
        overdue: "समय सीमा पार",
        cards: {
          pendingVillagers: "लंबित ग्रामीण",
          pendingIssues: "लंबित समस्याएँ",
          verifiedIssues: "सत्यापित समस्याएँ",
          overdueIssues: "समय सीमा पार मुद्दे",
        },
        cta: {
          verifyVillagers: "ग्रामीण सत्यापित करें",
          verifyIssues: "समस्याएँ सत्यापित करें",
        },
      },
    };
    return L[locale] || L.en;
  }, [locale]);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setErr("");

        const u = auth.currentUser;
        if (!u) {
          router.replace(`/${locale}/authority/login`);
          return;
        }

        setUser(u);

        const aSnap = await getDoc(doc(db, "authorities", u.uid));
        if (!aSnap.exists()) {
          router.replace(`/${locale}/authority/login`);
          return;
        }

        const a = aSnap.data() as any;
        const verified = a?.verified === true || a?.verification?.status === "verified";

        if (a?.role !== "village_incharge" || !verified) {
          router.replace(`/${locale}/authority/status`);
          return;
        }

        const panchayatId = a?.panchayatId;
        if (!panchayatId) throw new Error("Missing panchayatId");

        // Queries
        const qVillagers = query(
          collection(db, "villagers"),
          where("panchayatId", "==", panchayatId),
          where("status", "==", "pending")
        );

        const qPendingIssues = query(
          collection(db, "issues"),
          where("panchayatId", "==", panchayatId),
          where("status", "==", "submitted")
        );

        const qVerifiedIssues = query(
          collection(db, "issues"),
          where("panchayatId", "==", panchayatId),
          where("status", "==", "vi_verified")
        );

        const qAllVI = query(
          collection(db, "issues"),
          where("panchayatId", "==", panchayatId),
          where("escalationLevel", "==", "vi")
        );

        const [vSnap, pSnap, rSnap, allVISnap] = await Promise.all([
          getDocs(qVillagers),
          getDocs(qPendingIssues),
          getDocs(qVerifiedIssues),
          getDocs(qAllVI),
        ]);

        const now = Date.now();
        const overdueCount = allVISnap.docs.filter((d) => {
          const i = d.data() as any;
          const created = i?.createdAt?.toDate?.();
          const slaDays = Number(i?.slaDays || 3);
          if (!created) return false;
          const deadline = created.getTime() + slaDays * 86400000;
          return now > deadline && i.status !== "resolved";
        }).length;

        const newStats: StatCard[] = [
          {
            label: t.cards.pendingVillagers,
            count: vSnap.size,
            to: `/${locale}/authority/vi/villagers`,
            color: "text-amber-900",
            icon: <FiUsers className="w-5 h-5" />,
            bgColor: "bg-amber-100",
            borderColor: "border-amber-200"
          },
          {
            label: t.cards.pendingIssues,
            count: pSnap.size,
            to: `/${locale}/authority/vi/issues`,
            color: "text-red-900",
            icon: <FiAlertCircle className="w-5 h-5" />,
            bgColor: "bg-red-100",
            borderColor: "border-red-200"
          },
          {
            label: t.cards.verifiedIssues,
            count: rSnap.size,
            to: `/${locale}/authority/vi/issues?status=vi_verified`,
            color: "text-green-900",
            icon: <FiCheckCircle className="w-5 h-5" />,
            bgColor: "bg-green-100",
            borderColor: "border-green-200"
          },
          {
            label: t.cards.overdueIssues,
            count: overdueCount,
            to: `/${locale}/authority/vi/issues?filter=overdue`,
            color: "text-purple-900",
            icon: <FiClock className="w-5 h-5" />,
            bgColor: "bg-purple-100",
            borderColor: "border-purple-200"
          },
        ];

        setStats(newStats);
        
        // Initialize animated stats with zeros
        setAnimatedStats(newStats.map(stat => ({ ...stat, count: 0 })));
        
        // Animate the numbers
        setTimeout(() => {
          setAnimatedStats(newStats);
        }, 300);

      } catch (e: any) {
        setErr(e.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        loadDashboard();
      } else {
        router.replace(`/${locale}/authority/login`);
      }
    });

    return () => unsub();
  }, [router, locale, t]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const u = auth.currentUser;
      if (!u) return;

      const aSnap = await getDoc(doc(db, "authorities", u.uid));
      const a = aSnap.data() as any;
      const panchayatId = a?.panchayatId;

      // Re-run queries
      const qVillagers = query(
        collection(db, "villagers"),
        where("panchayatId", "==", panchayatId),
        where("status", "==", "pending")
      );

      const qPendingIssues = query(
        collection(db, "issues"),
        where("panchayatId", "==", panchayatId),
        where("status", "==", "submitted")
      );

      const qVerifiedIssues = query(
        collection(db, "issues"),
        where("panchayatId", "==", panchayatId),
        where("status", "==", "vi_verified")
      );

      const qAllVI = query(
        collection(db, "issues"),
        where("panchayatId", "==", panchayatId),
        where("escalationLevel", "==", "vi")
      );

      const [vSnap, pSnap, rSnap, allVISnap] = await Promise.all([
        getDocs(qVillagers),
        getDocs(qPendingIssues),
        getDocs(qVerifiedIssues),
        getDocs(qAllVI),
      ]);

      const now = Date.now();
      const overdueCount = allVISnap.docs.filter((d) => {
        const i = d.data() as any;
        const created = i?.createdAt?.toDate?.();
        const slaDays = Number(i?.slaDays || 3);
        if (!created) return false;
        const deadline = created.getTime() + slaDays * 86400000;
        return now > deadline && i.status !== "resolved";
      }).length;

      const newStats: StatCard[] = [
        {
          label: t.cards.pendingVillagers,
          count: vSnap.size,
          to: `/${locale}/authority/vi/villagers`,
          color: "text-amber-900",
          icon: <FiUsers className="w-5 h-5" />,
          bgColor: "bg-amber-100",
          borderColor: "border-amber-200"
        },
        {
          label: t.cards.pendingIssues,
          count: pSnap.size,
          to: `/${locale}/authority/vi/issues`,
          color: "text-red-900",
          icon: <FiAlertCircle className="w-5 h-5" />,
          bgColor: "bg-red-100",
          borderColor: "border-red-200"
        },
        {
          label: t.cards.verifiedIssues,
          count: rSnap.size,
          to: `/${locale}/authority/vi/issues?status=vi_verified`,
          color: "text-green-900",
          icon: <FiCheckCircle className="w-5 h-5" />,
          bgColor: "bg-green-100",
          borderColor: "border-green-200"
        },
        {
          label: t.cards.overdueIssues,
          count: overdueCount,
          to: `/${locale}/authority/vi/issues?filter=overdue`,
          color: "text-purple-900",
          icon: <FiClock className="w-5 h-5" />,
          bgColor: "bg-purple-100",
          borderColor: "border-purple-200"
        },
      ];

      setStats(newStats);
      setAnimatedStats(newStats);
    } catch (error) {
      console.error("Refresh error:", error);
    } finally {
      setTimeout(() => setRefreshing(false), 500);
    }
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
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
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
        
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4">
          {/* Header Skeleton */}
          <div className="mb-8">
            <div className="h-8 w-64 bg-gradient-to-r from-blue-200 to-cyan-200 rounded-lg mb-2 pulse"></div>
            <div className="h-4 w-48 bg-gradient-to-r from-blue-100 to-cyan-100 rounded pulse"></div>
          </div>

          {/* Stats Skeleton */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-blue-50 p-4 shadow-lg">
                <div className="absolute inset-0 shimmer"></div>
                <div className="h-4 w-24 bg-gradient-to-r from-blue-200 to-cyan-200 rounded mb-3"></div>
                <div className="h-8 w-12 bg-gradient-to-r from-blue-300 to-cyan-300 rounded"></div>
              </div>
            ))}
          </div>

          {/* Actions Skeleton */}
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-blue-50 p-5 shadow-lg">
                <div className="absolute inset-0 shimmer"></div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-gradient-to-r from-blue-200 to-cyan-200 rounded-xl"></div>
                  <div className="flex-1">
                    <div className="h-5 w-40 bg-gradient-to-r from-blue-200 to-cyan-200 rounded mb-2"></div>
                    <div className="h-3 w-56 bg-gradient-to-r from-blue-100 to-cyan-100 rounded"></div>
                  </div>
                  <div className="h-8 w-8 bg-gradient-to-r from-blue-200 to-cyan-200 rounded-full"></div>
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
        .refresh-spin {
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .stat-card {
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .stat-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 24px rgba(59, 130, 246, 0.15);
        }
        .action-card {
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(239, 246, 255, 0.5) 100%);
        }
        .action-card:hover {
          transform: translateY(-3px) scale(1.01);
          background: linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(239, 246, 255, 0.8) 100%);
          box-shadow: 0 8px 20px rgba(59, 130, 246, 0.2);
        }
        .ripple {
          position: relative;
          overflow: hidden;
        }
        .ripple::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(59, 130, 246, 0.1);
          transform: translate(-50%, -50%);
          transition: width 0.6s, height 0.6s;
        }
        .ripple:hover::after {
          width: 300px;
          height: 300px;
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-white p-4">
        {/* Header */}
        <div className="mb-8 animate-fadeIn">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-blue-900 tracking-tight">
                {t.title}
              </h1>
              <p className="text-blue-700/80 mt-2 text-sm font-semibold flex items-center gap-2">
                <FiShield className="w-4 h-4" />
                {t.welcome} {user?.displayName || user?.email?.split('@')[0] || 'Village Incharge'}
              </p>
            </div>
            
            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-3 rounded-xl border-2 border-blue-100 bg-white hover:bg-blue-50 active:scale-95 transition-all duration-200"
            >
              <FiRefreshCw className={`w-5 h-5 text-blue-700 ${refreshing ? 'refresh-spin' : ''}`} />
            </button>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-blue-600/80 bg-blue-50/50 rounded-xl p-3">
            <FiBarChart2 className="w-4 h-4" />
            <span className="font-semibold">{t.stats}</span>
          </div>
        </div>

        {/* Error Display */}
        {err && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-100 rounded-2xl animate-fadeIn">
            <p className="text-red-700 text-sm">{err}</p>
          </div>
        )}

        {/* Animated Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <button
              key={stat.label}
              onClick={() => router.push(stat.to)}
              className={`stat-card ${stat.borderColor} border-2 rounded-2xl p-5 shadow-lg text-left animate-fadeIn`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`text-sm font-semibold ${stat.color}/80`}>
                  {stat.label}
                </span>
                <div className={`p-2 ${stat.bgColor} rounded-lg`}>
                  {stat.icon}
                </div>
              </div>
              <div className={`text-3xl font-bold ${stat.color} animate-count`}>
                {animatedStats[index]?.count || 0}
              </div>
              <div className={`h-1 w-full bg-gradient-to-r ${stat.bgColor.replace('bg-', 'from-')} to-transparent rounded-full mt-3`}></div>
            </button>
          ))}
        </div>

        {/* Quick Actions Header */}
        <div className="flex items-center justify-between mb-4 animate-fadeIn" style={{ animationDelay: '400ms' }}>
          <h2 className="text-lg font-bold text-blue-900 flex items-center gap-2">
            <FiBarChart2 className="w-5 h-5" />
            {t.quickActions}
          </h2>
          <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
            {t.village}
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="space-y-4 mb-8">
          {/* Verify Villagers Card */}
          <div 
            className="action-card border-2 border-amber-100 rounded-2xl p-5 ripple animate-scaleIn"
            onClick={() => router.push(`/${locale}/authority/vi/villagers`)}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg">
                <FiUsers className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-amber-900 text-lg">{t.cta.verifyVillagers}</h3>
                <p className="text-sm text-amber-700/70 mt-1">{t.tapToVerify}</p>
              </div>
              {stats[0]?.count > 0 && (
                <div className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-bold animate-pulse">
                  {stats[0]?.count} {t.pending}
                </div>
              )}
            </div>
          </div>

          {/* Verify Issues Card */}
          <div 
            className="action-card border-2 border-red-100 rounded-2xl p-5 ripple animate-scaleIn"
            onClick={() => router.push(`/${locale}/authority/vi/issues`)}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl shadow-lg">
                <FiFileText className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-red-900 text-lg">{t.cta.verifyIssues}</h3>
                <p className="text-sm text-red-700/70 mt-1">{t.tapToManage}</p>
              </div>
              {stats[1]?.count > 0 && (
                <div className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-bold animate-pulse">
                  {stats[1]?.count} {t.pending}
                </div>
              )}
            </div>
          </div>

          {/* View Verified Issues Card */}
          <div 
            className="action-card border-2 border-green-100 rounded-2xl p-5 ripple animate-scaleIn"
            onClick={() => router.push(`/${locale}/authority/vi/issues?status=vi_verified`)}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                <FiCheckCircle className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-green-900 text-lg">{t.cards.verifiedIssues}</h3>
                <p className="text-sm text-green-700/70 mt-1">{t.viewVerified}</p>
              </div>
              {stats[2]?.count > 0 && (
                <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold">
                  {stats[2]?.count} {t.resolved}
                </div>
              )}
            </div>
          </div>

          {/* Overdue Issues Card */}
          <div 
            className="action-card border-2 border-purple-100 rounded-2xl p-5 ripple animate-scaleIn"
            onClick={() => router.push(`/${locale}/authority/vi/issues?filter=overdue`)}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg">
                <FiClock className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-purple-900 text-lg">{t.cards.overdueIssues}</h3>
                <p className="text-sm text-purple-700/70 mt-1">{t.handleOverdue}</p>
              </div>
              {stats[3]?.count > 0 && (
                <div className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-bold animate-pulse">
                  {stats[3]?.count} {t.overdue}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-4 left-4 right-4 bg-white/90 backdrop-blur-lg border-2 border-blue-100 rounded-2xl p-2 shadow-xl animate-fadeIn">
          <div className="grid grid-cols-4 gap-1">
            <button
              className="flex flex-col items-center justify-center p-3 rounded-xl transition-all bg-gradient-to-b from-blue-100 to-cyan-50"
              onClick={() => router.push(`/${locale}/authority/vi/dashboard`)}
            >
              <FiHome className="w-5 h-5 text-blue-700" />
              <span className="text-xs mt-1 font-medium text-blue-800 font-bold">
                {t.dashboard}
              </span>
            </button>
            
            <button
              className="flex flex-col items-center justify-center p-3 rounded-xl transition-all hover:bg-blue-50"
              onClick={() => router.push(`/${locale}/authority/vi/villagers`)}
            >
              <FiUsers className="w-5 h-5 text-blue-600/70" />
              <span className="text-xs mt-1 font-medium text-blue-700/70">
                {t.verify}
              </span>
            </button>
            
            <button
              className="flex flex-col items-center justify-center p-3 rounded-xl transition-all hover:bg-blue-50"
              onClick={() => router.push(`/${locale}/authority/vi/issues`)}
            >
              <FiFileText className="w-5 h-5 text-blue-600/70" />
              <span className="text-xs mt-1 font-medium text-blue-700/70">
                {t.issues}
              </span>
            </button>
            
            <button
              className="flex flex-col items-center justify-center p-3 rounded-xl transition-all hover:bg-blue-50"
              onClick={() => router.push(`/${locale}/authority/vi/profile`)}
            >
              <FiUser className="w-5 h-5 text-blue-600/70" />
              <span className="text-xs mt-1 font-medium text-blue-700/70">
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
      </div>
    </Screen>
  );
}