"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth, db } from "../../../lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import Screen from "../../../components/Screen";
import { 
  FiAlertCircle, 
  FiCheckCircle, 
  FiClock, 
  FiPlus, 
  FiList, 
  FiUsers, 
  FiUser, 
  FiLogOut,
  FiHome,
  FiBarChart2,
  FiRefreshCw,
  FiTrendingUp // Changed from FiBell to FiTrendingUp
} from "react-icons/fi";

type Locale = "en" | "kn" | "hi";

export default function VillagerIssuesDashboard() {
    const router = useRouter();
    const params = useParams() as { locale?: string };
    const locale = (params?.locale || "en") as Locale;

    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        resolved: 0,
    });

    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [animatedStats, setAnimatedStats] = useState({ total: 0, pending: 0, resolved: 0 });
    const [activeTab, setActiveTab] = useState("dashboard");

    const t = useMemo(() => {
        const L: Record<Locale, any> = {
            en: {
                title: "Villager Dashboard",
                subtitle: "Track and report village issues",
                welcome: "Welcome back,",
                raise: "Raise New Issue",
                track: "My Issues",
                community: "Community Issues",
                profile: "My Profile",
                total: "Total Issues",
                pending: "Pending",
                resolved: "Resolved",
                refresh: "Refresh",
                loading: "Loading dashboard...",
                recentActivity: "Recent Activity",
                noIssues: "No issues reported yet",
                quickActions: "Quick Actions",
                logout: "Logout",
                village: "Village",
                dashboard: "Dashboard",
                stats: "Your Issue Statistics",
                tapToReport: "Tap to report a new issue",
                viewAll: "View All",
                today: "Today",
                thisWeek: "This Week",
                allTime: "All Time",
                priority: "Priority",
                low: "Low",
                medium: "Medium",
                high: "High",
                urgent: "Urgent",
                issueTracking: "Issue Tracking",
                settings: "Settings",
            },
            kn: {
                title: "ಗ್ರಾಮಸ್ಥರ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
                subtitle: "ಗ್ರಾಮ ಸಮಸ್ಯೆಗಳನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ",
                welcome: "ಮರಳಿ ಸ್ವಾಗತ,",
                raise: "ಹೊಸ ಸಮಸ್ಯೆ ಸಲ್ಲಿಸಿ",
                track: "ನನ್ನ ಸಮಸ್ಯೆಗಳು",
                community: "ಗ್ರಾಮ ಸಮಸ್ಯೆಗಳು",
                profile: "ನನ್ನ ಪ್ರೊಫೈಲ್",
                total: "ಒಟ್ಟು ಸಮಸ್ಯೆಗಳು",
                pending: "ಬಾಕಿ ಇವೆ",
                resolved: "ಪರಿಹಾರಗೊಂಡ",
                refresh: "ರಿಫ್ರೆಶ್ ಮಾಡಿ",
                loading: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಲೋಡ್ ಆಗುತ್ತಿದೆ...",
                recentActivity: "ಇತ್ತೀಚಿನ ಚಟುವಟಿಕೆ",
                noIssues: "ಇನ್ನೂ ಯಾವುದೇ ಸಮಸ್ಯೆಗಳು ವರದಿಯಾಗಿಲ್ಲ",
                quickActions: "ತ್ವರಿತ ಕ್ರಿಯೆಗಳು",
                logout: "ಲಾಗ್‌ಔಟ್",
                village: "ಗ್ರಾಮ",
                dashboard: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
                stats: "ನಿಮ್ಮ ಸಮಸ್ಯೆ ಅಂಕಿಅಂಶಗಳು",
                tapToReport: "ಹೊಸ ಸಮಸ್ಯೆಯನ್ನು ವರದಿ ಮಾಡಲು ಟ್ಯಾಪ್ ಮಾಡಿ",
                viewAll: "ಎಲ್ಲಾ ವೀಕ್ಷಿಸಿ",
                today: "ಇಂದು",
                thisWeek: "ಈ ವಾರ",
                allTime: "ಎಲ್ಲಾ ಸಮಯ",
                priority: "ಗಮನಾರ್ಹತೆ",
                low: "ಕಡಿಮೆ",
                medium: "ಮಧ್ಯಮ",
                high: "ಹೆಚ್ಚು",
                urgent: "ತುರ್ತು",
                issueTracking: "ಸಮಸ್ಯೆ ಟ್ರ್ಯಾಕಿಂಗ್",
                settings: "ಸೆಟ್ಟಿಂಗ್ಸ್",
            },
            hi: {
                title: "ग्रामीण डैशबोर्ड",
                subtitle: "ग्राम समस्याएँ देखें और दर्ज करें",
                welcome: "वापसी पर स्वागत है,",
                raise: "नई समस्या दर्ज करें",
                track: "मेरी समस्याएँ",
                community: "सामुदायिक समस्याएँ",
                profile: "मेरी प्रोफ़ाइल",
                total: "कुल समस्याएँ",
                pending: "लंबित",
                resolved: "हल हो चुकी",
                refresh: "रिफ्रेश करें",
                loading: "डैशबोर्ड लोड हो रहा है...",
                recentActivity: "हाल की गतिविधि",
                noIssues: "अभी तक कोई समस्या दर्ज नहीं हुई",
                quickActions: "त्वरित कार्य",
                logout: "लॉगआउट",
                village: "गाँव",
                dashboard: "डैशबोर्ड",
                stats: "आपके समस्या आँकड़े",
                tapToReport: "नई समस्या दर्ज करने के लिए टैप करें",
                viewAll: "सभी देखें",
                today: "आज",
                thisWeek: "इस सप्ताह",
                allTime: "सभी समय",
                priority: "प्राथमिकता",
                low: "कम",
                medium: "मध्यम",
                high: "उच्च",
                urgent: "तत्काल",
                issueTracking: "समस्या ट्रैकिंग",
                settings: "सेटिंग्स",
            },
        };
        return L[locale];
    }, [locale]);

    useEffect(() => {
        const loadDashboard = async () => {
            const u = auth.currentUser;
            if (!u) {
                router.replace(`/${locale}/villager/login`);
                return;
            }

            try {
                setUser(u);
                
                const q = query(
                    collection(db, "issues"),
                    where("villagerId", "==", u.uid)
                );

                const snap = await getDocs(q);

                let pending = 0;
                let resolved = 0;

                snap.forEach((d) => {
                    const s = d.data().status;
                    if (s === "resolved") resolved++;
                    else pending++;
                });

                const newStats = {
                    total: snap.size,
                    pending,
                    resolved,
                };
                
                setStats(newStats);
                
                // Animate the numbers
                setTimeout(() => {
                    setAnimatedStats({
                        total: newStats.total,
                        pending: newStats.pending,
                        resolved: newStats.resolved,
                    });
                }, 300);

            } catch (error) {
                console.error("Error loading dashboard:", error);
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        };

        loadDashboard();
    }, [router, locale]);

    const handleRefresh = async () => {
        setRefreshing(true);
        const u = auth.currentUser;
        if (!u) return;

        const q = query(
            collection(db, "issues"),
            where("villagerId", "==", u.uid)
        );

        const snap = await getDocs(q);

        let pending = 0;
        let resolved = 0;

        snap.forEach((d) => {
            const s = d.data().status;
            if (s === "resolved") resolved++;
            else pending++;
        });

        const newStats = {
            total: snap.size,
            pending,
            resolved,
        };
        
        setStats(newStats);
        setAnimatedStats(newStats);
        
        // Simulate refresh delay
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
                    @keyframes float {
                        0%, 100% { transform: translateY(0px); }
                        50% { transform: translateY(-10px); }
                    }
                    .shimmer {
                        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
                        animation: shimmer 1.5s infinite;
                    }
                    .pulse {
                        animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                    }
                    .float {
                        animation: float 3s ease-in-out infinite;
                    }
                `}</style>
                
                <div className="min-h-screen bg-gradient-to-b from-green-50 to-white p-4">
                    {/* Animated Header Skeleton */}
                    <div className="mb-8">
                        <div className="h-8 w-48 bg-gradient-to-r from-green-200 to-emerald-200 rounded-lg mb-2 pulse"></div>
                        <div className="h-4 w-64 bg-gradient-to-r from-green-100 to-emerald-100 rounded pulse"></div>
                    </div>

                    {/* Stats Skeleton */}
                    <div className="grid grid-cols-3 gap-3 mb-8">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-green-50 p-4 shadow-lg">
                                <div className="absolute inset-0 shimmer"></div>
                                <div className="h-4 w-16 bg-gradient-to-r from-green-200 to-emerald-200 rounded mb-3"></div>
                                <div className="h-8 w-12 bg-gradient-to-r from-green-300 to-emerald-300 rounded"></div>
                            </div>
                        ))}
                    </div>

                    {/* Actions Skeleton */}
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-green-50 p-5 shadow-lg">
                                <div className="absolute inset-0 shimmer"></div>
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-gradient-to-r from-green-200 to-emerald-200 rounded-xl"></div>
                                    <div className="flex-1">
                                        <div className="h-5 w-32 bg-gradient-to-r from-green-200 to-emerald-200 rounded mb-2"></div>
                                        <div className="h-3 w-48 bg-gradient-to-r from-green-100 to-emerald-100 rounded"></div>
                                    </div>
                                    <div className="h-8 w-8 bg-gradient-to-r from-green-200 to-emerald-200 rounded-full"></div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Floating Icon */}
                    <div className="fixed bottom-6 right-6 float">
                        <div className="h-14 w-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-xl">
                            <FiPlus className="w-6 h-6 text-white" />
                        </div>
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
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-5px); }
                }
                @keyframes shimmer {
                    0% { background-position: -1000px 0; }
                    100% { background-position: 1000px 0; }
                }
                @keyframes countUp {
                    from { transform: translateY(10px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes gradient {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                .animate-fadeIn { animation: fadeIn 0.6s ease-out forwards; }
                .animate-slideLeft { animation: slideInLeft 0.5s ease-out forwards; }
                .animate-slideRight { animation: slideInRight 0.5s ease-out forwards; }
                .animate-scaleIn { animation: scaleIn 0.4s ease-out forwards; }
                .animate-pulse { animation: pulse 2s ease-in-out infinite; }
                .animate-float { animation: float 3s ease-in-out infinite; }
                .animate-shimmer { background: linear-gradient(90deg, #f0fdf4 25%, #dcfce7 50%, #f0fdf4 75%); background-size: 1000px 100%; animation: shimmer 2s infinite; }
                .animate-count { animation: countUp 0.5s ease-out forwards; }
                .animate-gradient { background: linear-gradient(-45deg, #dcfce7, #bbf7d0, #86efac, #4ade80); background-size: 400% 400%; animation: gradient 15s ease infinite; }
                .delay-100 { animation-delay: 0.1s; }
                .delay-200 { animation-delay: 0.2s; }
                .delay-300 { animation-delay: 0.3s; }
                .delay-400 { animation-delay: 0.4s; }
                .delay-500 { animation-delay: 0.5s; }
                
                .stat-card {
                    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                .stat-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 12px 24px rgba(34, 197, 94, 0.15);
                }
                .action-card {
                    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                    background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(240,253,244,0.5) 100%);
                }
                .action-card:hover {
                    transform: translateY(-3px) scale(1.01);
                    background: linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(240,253,244,0.8) 100%);
                    box-shadow: 0 8px 20px rgba(34, 197, 94, 0.2);
                }
                .refresh-spin {
                    animation: spin 0.8s linear infinite;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
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
                    background: rgba(34, 197, 94, 0.1);
                    transform: translate(-50%, -50%);
                    transition: width 0.6s, height 0.6s;
                }
                .ripple:hover::after {
                    width: 300px;
                    height: 300px;
                }
            `}</style>

            <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-white p-4">
                {/* Header with Welcome Message */}
                <div className="mb-8 animate-fadeIn">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-green-900 tracking-tight">
                                {t.title}
                            </h1>
                            <p className="text-green-700/80 mt-2 text-sm font-semibold flex items-center gap-2">
                                <FiHome className="w-4 h-4" />
                                {t.welcome} {user?.displayName || user?.email?.split('@')[0] || 'Villager'}
                            </p>
                        </div>
                        
                        {/* Refresh Button */}
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="p-3 rounded-xl border-2 border-green-100 bg-white hover:bg-green-50 active:scale-95 transition-all duration-200"
                        >
                            <FiRefreshCw className={`w-5 h-5 text-green-700 ${refreshing ? 'refresh-spin' : ''}`} />
                        </button>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-green-600/80 bg-green-50/50 rounded-xl p-3">
                        <FiBarChart2 className="w-4 h-4" />
                        <span className="font-semibold">{t.stats}</span>
                    </div>
                </div>

                {/* Animated Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <div 
                        className="stat-card bg-gradient-to-br from-white to-emerald-50 border-2 border-emerald-100 rounded-2xl p-5 shadow-lg animate-slideLeft delay-100"
                        style={{ animationDelay: '0.1s' }}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-semibold text-green-800/80">{t.total}</span>
                            <div className="p-2 bg-emerald-100 rounded-lg">
                                <FiAlertCircle className="w-5 h-5 text-emerald-600" />
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-green-900 animate-count">
                            {animatedStats.total}
                        </div>
                        <div className="h-1 w-full bg-gradient-to-r from-emerald-200 to-transparent rounded-full mt-3"></div>
                    </div>

                    <div 
                        className="stat-card bg-gradient-to-br from-white to-amber-50 border-2 border-amber-100 rounded-2xl p-5 shadow-lg animate-fadeIn delay-200"
                        style={{ animationDelay: '0.2s' }}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-semibold text-amber-800/80">{t.pending}</span>
                            <div className="p-2 bg-amber-100 rounded-lg">
                                <FiClock className="w-5 h-5 text-amber-600" />
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-amber-900 animate-count">
                            {animatedStats.pending}
                        </div>
                        <div className="h-1 w-full bg-gradient-to-r from-amber-200 to-transparent rounded-full mt-3"></div>
                    </div>

                    <div 
                        className="stat-card bg-gradient-to-br from-white to-green-50 border-2 border-green-100 rounded-2xl p-5 shadow-lg animate-slideRight delay-300"
                        style={{ animationDelay: '0.3s' }}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-semibold text-green-800/80">{t.resolved}</span>
                            <div className="p-2 bg-green-100 rounded-lg">
                                <FiCheckCircle className="w-5 h-5 text-green-600" />
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-green-900 animate-count">
                            {animatedStats.resolved}
                        </div>
                        <div className="h-1 w-full bg-gradient-to-r from-green-200 to-transparent rounded-full mt-3"></div>
                    </div>
                </div>

                {/* Quick Actions Header */}
                <div className="flex items-center justify-between mb-4 animate-fadeIn delay-400">
                    <h2 className="text-lg font-bold text-green-900 flex items-center gap-2">
                        <FiBarChart2 className="w-5 h-5" />
                        {t.quickActions}
                    </h2>
                    <div className="flex items-center gap-2">
                        <span className="text-xs px-3 py-1 bg-green-100 text-green-800 rounded-full font-semibold">
                            {stats.total > 0 ? `${stats.resolved}/${stats.total} ${t.resolved}` : t.noIssues}
                        </span>
                    </div>
                </div>

                {/* Quick Actions Grid */}
                <div className="space-y-4 mb-8">
                    <div 
                        className="action-card border-2 border-green-100 rounded-2xl p-5 ripple animate-scaleIn delay-100"
                        onClick={() => router.push(`/${locale}/villager/raise-issue`)}
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                                <FiPlus className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-green-900 text-lg">{t.raise}</h3>
                                <p className="text-sm text-green-700/70 mt-1">{t.tapToReport}</p>
                            </div>
                            <div className="p-2 bg-green-50 rounded-lg">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            </div>
                        </div>
                    </div>

                    <div 
                        className="action-card border-2 border-blue-100 rounded-2xl p-5 ripple animate-scaleIn delay-200"
                        onClick={() => router.push(`/${locale}/villager/my-issues`)}
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-lg">
                                <FiList className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-blue-900 text-lg">{t.track}</h3>
                                <p className="text-sm text-blue-700/70 mt-1">View and track your reported issues</p>
                            </div>
                            {stats.pending > 0 && (
                                <div className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-bold animate-pulse">
                                    {stats.pending} {t.pending}
                                </div>
                            )}
                        </div>
                    </div>

                    <div 
                        className="action-card border-2 border-purple-100 rounded-2xl p-5 ripple animate-scaleIn delay-300"
                        onClick={() => router.push(`/${locale}/villager/community`)}
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
                                <FiUsers className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-purple-900 text-lg">{t.community}</h3>
                                <p className="text-sm text-purple-700/70 mt-1">See what others in your village are reporting</p>
                            </div>
                            <div className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-bold">
                                {t.village}
                            </div>
                        </div>
                    </div>

                    <div 
                        className="action-card border-2 border-amber-100 rounded-2xl p-5 ripple animate-scaleIn delay-400"
                        onClick={() => router.push(`/${locale}/villager/profile`)}
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg">
                                <FiUser className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-amber-900 text-lg">{t.profile}</h3>
                                <p className="text-sm text-amber-700/70 mt-1">Manage your account and preferences</p>
                            </div>
                            <div className="w-8 h-8 bg-gradient-to-br from-amber-200 to-orange-200 rounded-full flex items-center justify-center text-amber-800 font-bold">
                                {user?.email?.[0]?.toUpperCase() || 'V'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Navigation - UPDATED */}
                <div className="fixed bottom-4 left-4 right-4 bg-white/90 backdrop-blur-lg border-2 border-green-100 rounded-2xl p-2 shadow-xl animate-fadeIn">
                    <div className="grid grid-cols-4 gap-1">
                        <button
                            className="flex flex-col items-center justify-center p-3 rounded-xl transition-all bg-gradient-to-b from-green-100 to-emerald-50"
                            onClick={() => router.push(`/${locale}/villager/dashboard`)}
                        >
                            <FiHome className="w-5 h-5 text-green-700" />
                            <span className="text-xs mt-1 font-medium text-green-800 font-bold">
                                {t.dashboard}
                            </span>
                        </button>
                        
                        <button
                            className="flex flex-col items-center justify-center p-3 rounded-xl transition-all hover:bg-green-50"
                            onClick={() => router.push(`/${locale}/villager/my-issues`)}
                        >
                            <FiList className="w-5 h-5 text-green-600/70" />
                            <span className="text-xs mt-1 font-medium text-green-700/70">
                                {t.track}
                            </span>
                        </button>
                        
                        <button
                            className="flex flex-col items-center justify-center p-3 rounded-xl transition-all hover:bg-green-50"
                            onClick={() => router.push(`/${locale}/villager/issue-tracking`)}
                        >
                            <FiTrendingUp className="w-5 h-5 text-green-600/70" />
                            <span className="text-xs mt-1 font-medium text-green-700/70">
                                {t.issueTracking}
                            </span>
                        </button>
                        
                        <button
                            className="flex flex-col items-center justify-center p-3 rounded-xl transition-all hover:bg-green-50"
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
                    className="fixed bottom-24 right-6 w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-300 animate-float hover:scale-110 z-10"
                >
                    <FiPlus className="w-6 h-6 text-white" />
                </button>

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