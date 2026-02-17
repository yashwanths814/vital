"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAdminAuth } from "../../../context/AdminAuthContext";
import Screen from "../../../components/Screen";
import { DashboardService, DashboardStats } from "../../../services/firebase/dashboardService";

export default function AdminDashboard() {
    const router = useRouter();
    const params = useParams() as { locale?: string };
    const locale = params?.locale || "en";

    const { admin, loading, logout } = useAdminAuth();

    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [statsLoading, setStatsLoading] = useState(true);
    const [statsErr, setStatsErr] = useState("");
    const [animatedValues, setAnimatedValues] = useState<Record<string, number>>({});

    useEffect(() => {
        if (!loading && !admin) router.replace(`/${locale}/admin/login`);
    }, [loading, admin, locale, router]);

    useEffect(() => {
        if (!admin) return;

        let alive = true;
        setStatsLoading(true);
        setStatsErr("");

        DashboardService.getAdminDashboardStats()
            .then((s) => {
                if (!alive) return;
                setStats(s);
                
                // Animate counter values with real data
                const valuesToAnimate = {
                    totalIssues: s.totalIssues,
                    openIssues: s.openIssues,
                    inProgress: s.inProgress,
                    resolved: s.resolved,
                    escalated: s.escalated,
                    villagers: s.villagers,
                    authorities: s.authorities,
                };
                
                Object.entries(valuesToAnimate).forEach(([key, value]) => {
                    animateCounter(key, value);
                });
                
                setStatsLoading(false);
            })
            .catch((e: any) => {
                if (!alive) return;
                setStats(null);
                setStatsLoading(false);
                setStatsErr(e?.message || "Failed to load dashboard stats.");
            });

        return () => {
            alive = false;
        };
    }, [admin]);

    const animateCounter = (key: string, target: number) => {
        const start = 0;
        const duration = 1500;
        const startTime = Date.now();
        
        const updateCounter = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(start + (target - start) * easeOut);
            
            setAnimatedValues(prev => ({
                ...prev,
                [key]: current
            }));
            
            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            } else {
                setAnimatedValues(prev => ({
                    ...prev,
                    [key]: target
                }));
            }
        };
        
        requestAnimationFrame(updateCounter);
    };

    const t = useMemo(() => {
        const L: any = {
            en: {
                title: "Admin Dashboard",
                subtitle: "Central control panel for VITAL — monitor issues, verify authorities, manage escalations.",
                quickActions: "Quick Actions",
                verificationHub: "Authority Verification Hub",
                systemAnalytics: "System Analytics",
                logout: "Logout",
                go: "Open",
                loading: "Loading dashboard...",
                issueChart: "Issues by Status",
                userChart: "Users Split",
                verifyAuthorities: "Verify Authorities",
                verifyAuthoritiesDesc: "Approve PDO / Village In-charge / TDO / DDO",
                allIssues: "All Issues & Analytics",
                allIssuesDesc: "View total issues, status distribution, and performance metrics.",
                slaEscalations: "SLA & Escalations",
                slaEscalationsDesc: "Monitor overdue issues and escalations.",
                pdoVerify: "Gram Panchayat PDO Verification",
                pdoVerifyDesc: "Verify PDO credentials",
                vicVerify: "Village In-charge Verification",
                vicVerifyDesc: "Verify village in-charge",
                tdoVerify: "Taluk Development Officer Verification",
                tdoVerifyDesc: "Verify TDO to handle escalations",
                ddoVerify: "District Development Officer Verification",
                ddoVerifyDesc: "Verify DDO to oversee district-level escalations",
                live: "Live data from Firestore",
                retry: "Retry",
                pending: "Pending",
                totalIssues: "Total Issues",
                open: "Open",
                inProgress: "In Progress",
                resolved: "Resolved",
                escalated: "Escalated",
                villagers: "Villagers",
                authorities: "Authorities",
            },
            kn: {
                title: "ಆಡ್ಮಿನ್ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
                subtitle: "VITAL ಕೇಂದ್ರ ನಿಯಂತ್ರಣ — ಸಮಸ್ಯೆಗಳು, ಪರಿಶೀಲನೆ, ಎಸ್ಕಲೇಶನ್‌ಗಳನ್ನು ಮೇಲ್ವಿಚಾರಣೆ ಮಾಡಿ.",
                quickActions: "ತ್ವರಿತ ಕ್ರಿಯೆಗಳು",
                verificationHub: "ಅಧಿಕಾರಿ ಪರಿಶೀಲನಾ ಕೇಂದ್ರ",
                systemAnalytics: "ವ್ಯವಸ್ಥೆಯ ವಿಶ್ಲೇಷಣೆ",
                logout: "ಲಾಗೌಟ್",
                go: "ತೆರೆ",
                loading: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಲೋಡ್ ಆಗುತ್ತಿದೆ...",
                issueChart: "ಸ್ಥಿತಿಯ ಪ್ರಕಾರ ಸಮಸ್ಯೆಗಳು",
                userChart: "ಬಳಕೆದಾರರ ಹಂಚಿಕೆ",
                verifyAuthorities: "ಅಧಿಕಾರಿಗಳ ಪರಿಶೀಲನೆ",
                verifyAuthoritiesDesc: "PDO / ಗ್ರಾಮ ಇನ್‌ಚಾರ್ಜ್ / TDO / DDO ಪರಿಶೀಲನೆ",
                allIssues: "ಎಲ್ಲಾ ಸಮಸ್ಯೆಗಳು & ವಿಶ್ಲೇಷಣೆ",
                allIssuesDesc: "ಒಟ್ಟು ಸಮಸ್ಯೆಗಳು, ಸ್ಥಿತಿ ಹಂಚಿಕೆ, ಮತ್ತು ಮೆಟ್ರಿಕ್ಸ್.",
                slaEscalations: "SLA & ಎಸ್ಕಲೇಶನ್",
                slaEscalationsDesc: "ವಿಳಂಬ ಸಮಸ್ಯೆಗಳು ಮತ್ತು ಎಸ್ಕಲೇಶನ್‌ಗಳನ್ನು ಮೇಲ್ವಿಚಾರಣೆ ಮಾಡಿ.",
                pdoVerify: "ಗ್ರಾಮ ಪಂಚಾಯತ್ PDO ಪರಿಶೀಲನೆ",
                pdoVerifyDesc: "PDO ವಿವರ ಪರಿಶೀಲನೆ",
                vicVerify: "ಗ್ರಾಮ ಇನ್‌ಚಾರ್ಜ್ ಪರಿಶೀಲನೆ",
                vicVerifyDesc: "ಗ್ರಾಮ ಇನ್‌ಚಾರ್ಜ್ ಪರಿಶೀಲನೆ",
                tdoVerify: "TDO ಪರಿಶೀಲನೆ",
                tdoVerifyDesc: "ಎಸ್ಕಲೇಶನ್ ಮತ್ತು ಅನುದಾನ ಅನುಮೋದನೆಗಾಗಿ TDO",
                ddoVerify: "DDO ಪರಿಶೀಲನೆ",
                ddoVerifyDesc: "ಜಿಲ್ಲಾ ಮಟ್ಟದ ಎಸ್ಕಲೇಶನ್ ಮೇಲ್ವಿಚಾರಣೆಗಾಗಿ",
                footer: "© 2026 VITAL — Unnat Bharat Abhiyan & Digital India",
                live: "Firestore ನಿಂದ ಲೈವ್ ಡೇಟಾ",
                retry: "ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ",
                pending: "ಬಾಕಿ",
                totalIssues: "ಒಟ್ಟು ಸಮಸ್ಯೆಗಳು",
                open: "ತೆರೆದಿರುವ",
                inProgress: "ಪ್ರಗತಿಯಲ್ಲಿದೆ",
                resolved: "ಪರಿಹಾರ",
                escalated: "ಎಸ್ಕಲೇಶನ್",
                villagers: "ಗ್ರಾಮಸ್ಥರು",
                authorities: "ಅಧಿಕಾರಿಗಳು",
            },
            hi: {
                title: "एडमिन डैशबोर्ड",
                subtitle: "VITAL का केंद्रीय नियंत्रण — मुद्दे, वेरिफिकेशन, एस्केलेशन मॉनिटर करें।",
                quickActions: "क्विक एक्शन्स",
                verificationHub: "अधिकारियों का वेरिफिकेशन हब",
                systemAnalytics: "सिस्टम एनालिटिक्स",
                logout: "लॉगआउट",
                go: "ओपन",
                loading: "डैशबोर्ड लोड हो रहा है...",
                issueChart: "स्टेटस के अनुसार मुद्दे",
                userChart: "यूज़र्स स्प्लिट",
                verifyAuthorities: "अधिकारियों का वेरिफिकेशन",
                verifyAuthoritiesDesc: "PDO / विलेज इन-चार्ज / TDO / DDO को अप्रूव करें",
                allIssues: "सभी मुद्दे और एनालिटिक्स",
                allIssuesDesc: "कुल मुद्दे, स्टेटस वितरण, और परफॉर्मेंस मेट्रिक्स देखें।",
                slaEscalations: "SLA और एस्केलेशन",
                slaEscalationsDesc: "ओवरड्यू मुद्दे और एस्केलेशन मॉनिटर करें।",
                pdoVerify: "ग्राम पंचायत PDO वेरिफिकेशन",
                pdoVerifyDesc: "PDO वेरिफ़ाई करें",
                vicVerify: "विलेज इन-चार्ज वेरिफिकेशन",
                vicVerifyDesc: "विलेज इन-चार्ज वेरिफिकेशन",
                tdoVerify: "TDO वेरिफिकेशन",
                tdoVerifyDesc: "एस्केलेशन और फंड अप्रूवल के लिए",
                ddoVerify: "DDO वेरिफिकेशन",
                ddoVerifyDesc: "डिस्ट्रिक्ट लेवल एस्केलेशन ओवरसी के लिए",
                footer: "© 2026 VITAL — Unnat Bharat Abhiyan & Digital India",
                live: "Firestore से लाइव डेटा",
                retry: "फिर से कोशिश करें",
                pending: "लंबित",
                totalIssues: "कुल मुद्दे",
                open: "खुले",
                inProgress: "प्रगति में",
                resolved: "हल हुए",
                escalated: "एस्केलेटेड",
                villagers: "ग्रामीण",
                authorities: "अधिकारी",
            },
        };
        return L[locale] || L.en;
    }, [locale]);

    const analyticsCards = stats
        ? [
            { 
                id: "total-issues",
                label: t.totalIssues, 
                value: animatedValues.totalIssues || 0, 
                sub: t.live,
                icon: "📊",
                color: "from-blue-500 to-cyan-500"
            },
            { 
                id: "open-issues",
                label: t.open, 
                value: animatedValues.openIssues || 0,
                icon: "🔴",
                color: "from-red-500 to-orange-500"
            },
            { 
                id: "in-progress",
                label: t.inProgress, 
                value: animatedValues.inProgress || 0,
                icon: "🟡",
                color: "from-yellow-500 to-amber-500"
            },
            { 
                id: "resolved",
                label: t.resolved, 
                value: animatedValues.resolved || 0,
                icon: "🟢",
                color: "from-green-500 to-emerald-500"
            },
            { 
                id: "escalated",
                label: t.escalated, 
                value: animatedValues.escalated || 0,
                icon: "⚡",
                color: "from-purple-500 to-pink-500"
            },
            { 
                id: "villagers",
                label: t.villagers, 
                value: animatedValues.villagers || 0,
                icon: "👨‍🌾",
                color: "from-cyan-500 to-blue-500"
            },
            { 
                id: "authorities",
                label: t.authorities, 
                value: animatedValues.authorities || 0,
                icon: "👨‍💼",
                color: "from-indigo-500 to-purple-500"
            },
        ]
        : [];

    const issueStatusData = stats ? [
        { label: "Open", value: stats.openIssues, color: "#ef4444" },
        { label: "In Progress", value: stats.inProgress, color: "#f59e0b" },
        { label: "Resolved", value: stats.resolved, color: "#10b981" },
        { label: "Escalated", value: stats.escalated, color: "#8b5cf6" },
    ].filter(item => item.value > 0) : [];

    const userSplitData = stats ? [
        { label: "Villagers", value: stats.villagers, color: "#06b6d4" },
        { label: "Authorities", value: stats.authorities, color: "#8b5cf6" },
    ].filter(item => item.value > 0) : [];

    if (loading) {
        return (
            <Screen center>
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-green-700 font-medium animate-pulse">{t.loading}</p>
                </div>
            </Screen>
        );
    }

    if (!admin) return null;

    return (
        <Screen padded>
            <div className="w-full animate-fadeIn">
                {/* Header with gradient */}
                <div className="relative rounded-2xl bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 p-6 text-white shadow-lg mb-8 overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -translate-x-24 translate-y-24" />
                    
                    <div className="relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-white drop-shadow">
                                {t.title}
                            </h1>
                            <p className="text-sm sm:text-base text-white/90 mt-2 max-w-3xl">
                                {t.subtitle}
                            </p>
                            <div className="flex items-center gap-3 mt-3">
                                <div className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium">
                                    Logged in: <span className="font-bold">{admin.email}</span>
                                </div>
                                <div className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium">
                                    Role: <span className="font-bold">{admin.role}</span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={async () => {
                                await logout();
                                router.push(`/${locale}/role-select`);
                            }}
                            className="relative px-5 py-2.5 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 text-white font-semibold hover:bg-white/30 active:scale-[0.98] transition-all duration-200 hover:shadow-lg hover:shadow-white/10"
                        >
                            {t.logout}
                        </button>
                    </div>
                </div>

                {/* Error / Retry */}
                {statsErr && (
                    <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 text-red-800 animate-shake">
                        <div className="font-bold text-sm">Failed to load stats</div>
                        <div className="text-sm mt-1">{statsErr}</div>
                        <button
                            className="mt-3 px-4 py-2 rounded-xl bg-white border border-red-200 font-semibold hover:bg-red-50 transition-all hover:scale-[1.02]"
                            onClick={() => {
                                setStatsErr("");
                                setStatsLoading(true);
                                DashboardService.getAdminDashboardStats()
                                    .then((s) => {
                                        setStats(s);
                                        setStatsLoading(false);
                                    })
                                    .catch((e: any) => {
                                        setStats(null);
                                        setStatsLoading(false);
                                        setStatsErr(e?.message || "Failed to load dashboard stats.");
                                    });
                            }}
                        >
                            {t.retry}
                        </button>
                    </div>
                )}

                {/* Quick Actions */}
                <section className="mb-8">
                    <h2 className="text-lg sm:text-xl font-extrabold text-green-900 mb-4">
                        {t.quickActions}
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <ActionCard
                            title={t.verifyAuthorities}
                            desc={t.verifyAuthoritiesDesc}
                            onClick={() => router.push(`/${locale}/admin/verify`)}
                            cta={t.go}
                            icon="🔐"
                            color="from-purple-500 to-pink-500"
                        />
                        <ActionCard
                            title={t.allIssues}
                            desc={t.allIssuesDesc}
                            onClick={() => router.push(`/${locale}/admin/issues`)}
                            cta={t.go}
                            icon="📈"
                            color="from-blue-500 to-cyan-500"
                        />
                        <ActionCard
                            title={t.slaEscalations}
                            desc={t.slaEscalationsDesc}
                            onClick={() => router.push(`/${locale}/admin/escalations`)}
                            cta={t.go}
                            icon="⏰"
                            color="from-orange-500 to-red-500"
                        />
                    </div>
                </section>

                {/* System Analytics */}
                {stats && stats.totalIssues > 0 && (
                    <section className="mb-10">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg sm:text-xl font-extrabold text-green-900">
                                {t.systemAnalytics}
                            </h2>
                            <span className="text-xs text-green-600 bg-green-50 px-3 py-1 rounded-full font-medium">
                                {t.live}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-7 gap-3 mb-6">
                            {analyticsCards.map((c) => (
                                <div
                                    key={c.id}
                                    className="group relative bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-2xl p-4 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer overflow-hidden"
                                    onClick={() => {
                                        if (c.id === "total-issues") {
                                            router.push(`/${locale}/admin/issues`);
                                        }
                                    }}
                                >
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br opacity-10 group-hover:opacity-20 transition-opacity"
                                        style={{ background: c.color.split(' ')[1] }}
                                    />
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-xs text-gray-600 font-medium">{c.label}</p>
                                            <p className="text-2xl font-extrabold text-gray-900 mt-1">
                                                {c.value}
                                            </p>
                                        </div>
                                        <span className="text-2xl">{c.icon}</span>
                                    </div>
                                    {c.sub && <p className="text-xs text-gray-500 mt-2">{c.sub}</p>}
                                </div>
                            ))}
                        </div>

                        {/* Graphs Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {issueStatusData.length > 0 && (
                                <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all duration-300">
                                    <div className="mb-4">
                                        <div className="text-sm font-extrabold text-gray-900">{t.issueChart}</div>
                                        <div className="text-xs text-gray-500 mt-1">Distribution of all reported issues</div>
                                    </div>
                                    <PieChart data={issueStatusData} />
                                </div>
                            )}
                            
                            {userSplitData.length > 0 && stats.villagers + stats.authorities > 0 && (
                                <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all duration-300">
                                    <div className="mb-4">
                                        <div className="text-sm font-extrabold text-gray-900">{t.userChart}</div>
                                        <div className="text-xs text-gray-500 mt-1">Platform user composition</div>
                                    </div>
                                    <div className="flex flex-col md:flex-row items-center gap-6">
                                        <DonutChart data={userSplitData} />
                                        <div className="flex-1">
                                            {userSplitData.map((item, index) => (
                                                <div key={`user-split-${index}`} className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <div 
                                                            className="w-3 h-3 rounded-full" 
                                                            style={{ backgroundColor: item.color }}
                                                        />
                                                        <span className="text-sm font-medium text-gray-700">{item.label}</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-sm font-bold text-gray-900">{item.value}</div>
                                                        {stats.villagers + stats.authorities > 0 && (
                                                            <div className="text-xs text-gray-500">
                                                                ({Math.round((item.value / (stats.villagers + stats.authorities)) * 100)}%)
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            <div className="pt-3 mt-3 border-t border-gray-200">
                                                <div className="flex justify-between">
                                                    <span className="text-sm font-semibold text-gray-900">Total Users</span>
                                                    <span className="text-sm font-bold text-gray-900">
                                                        {stats.villagers + stats.authorities}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* Authority Verification Hub */}
                {stats && (
                    <section className="mb-10">
                        <h2 className="text-lg sm:text-xl font-extrabold text-green-900 mb-6">
                            {t.verificationHub}
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <VerifyCard
                                title={t.pdoVerify}
                                pending={stats.pendingPDO}
                                desc={t.pdoVerifyDesc}
                                onClick={() => router.push(`/${locale}/admin/verify/pdo`)}
                                cta={t.go}
                                icon="🏛️"
                                color="from-blue-500 to-cyan-500"
                                pendingLabel={t.pending}
                            />
                            <VerifyCard
                                title={t.vicVerify}
                                pending={stats.pendingVillageIncharge}
                                desc={t.vicVerifyDesc}
                                onClick={() =>
                                    router.push(`/${locale}/admin/verify/village-incharge`)
                                }
                                cta={t.go}
                                icon="🏘️"
                                color="from-green-500 to-emerald-500"
                                pendingLabel={t.pending}
                            />
                            <VerifyCard
                                title={t.tdoVerify}
                                pending={stats.pendingTDO}
                                desc={t.tdoVerifyDesc}
                                onClick={() => router.push(`/${locale}/admin/verify/tdo`)}
                                cta={t.go}
                                icon="🏢"
                                color="from-orange-500 to-amber-500"
                                pendingLabel={t.pending}
                            />
                            <VerifyCard
                                title={t.ddoVerify}
                                pending={stats.pendingDDO}
                                desc={t.ddoVerifyDesc}
                                onClick={() => router.push(`/${locale}/admin/verify/ddo`)}
                                cta={t.go}
                                icon="🏛️"
                                color="from-purple-500 to-pink-500"
                                pendingLabel={t.pending}
                            />
                        </div>

                        <p className="text-xs text-gray-500 text-center mt-10 pt-6 border-t border-gray-200">
                            {t.footer}
                        </p>
                    </section>
                )}
            </div>
        </Screen>
    );
}

/** ---------- UI Components ---------- */

function ActionCard({
    title,
    desc,
    cta,
    onClick,
    icon,
    color,
}: {
    title: string;
    desc: string;
    cta: string;
    onClick: () => void;
    icon: string;
    color: string;
}) {
    return (
        <div className="group relative bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer overflow-hidden">
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${color} opacity-10 group-hover:opacity-20 transition-opacity rounded-full -translate-y-8 translate-x-8`} />
            
            <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                    <h3 className="font-extrabold text-gray-900 text-lg">{title}</h3>
                    <span className="text-2xl">{icon}</span>
                </div>
                <p className="text-sm text-gray-600 mb-6">{desc}</p>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onClick();
                    }}
                    className={`px-5 py-2.5 rounded-xl bg-gradient-to-r ${color} text-white font-extrabold hover:shadow-lg hover:brightness-110 active:scale-[0.98] transition-all duration-200`}
                >
                    {cta}
                </button>
            </div>
        </div>
    );
}

function VerifyCard({
    title,
    pending,
    desc,
    cta,
    onClick,
    icon,
    color,
    pendingLabel,
}: {
    title: string;
    pending: number;
    desc: string;
    cta: string;
    onClick: () => void;
    icon: string;
    color: string;
    pendingLabel: string;
}) {
    return (
        <div className="group relative bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer">
            <div className="flex flex-col h-full">
                <div className="flex items-start gap-3 mb-4 flex-1">
                    <span className="text-2xl flex-shrink-0">{icon}</span>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-extrabold text-gray-900 text-base mb-1">{title}</h3>
                        <p className="text-sm text-gray-600">{desc}</p>
                    </div>
                </div>
                
                <div className="mt-auto">
                    <div className="flex items-center justify-between mb-3">
                        <div className="text-left">
                            <p className="text-xs text-gray-500 font-medium">{pendingLabel}</p>
                            <div className="relative">
                                <p className="text-2xl font-extrabold text-gray-900">{pending}</p>
                                {pending > 0 && (
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
                                )}
                            </div>
                        </div>
                        
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onClick();
                            }}
                            className={`px-4 py-2.5 rounded-xl bg-gradient-to-r ${color} text-white font-extrabold hover:shadow-lg hover:brightness-110 active:scale-[0.98] transition-all duration-200 whitespace-nowrap`}
                        >
                            {cta} →
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/** ---------- Graph Components ---------- */

function PieChart({ data }: { data: { label: string; value: number; color: string }[] }) {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const radius = 80;
    const center = 100;
    let currentAngle = 0;

    if (total === 0) {
        return (
            <div className="text-center py-8">
                <div className="text-gray-400 text-sm">No data available</div>
            </div>
        );
    }

    const slices = data.map((item, index) => {
        const percentage = total > 0 ? item.value / total : 0;
        const angle = percentage * 2 * Math.PI;
        const startAngle = currentAngle;
        const endAngle = currentAngle + angle;
        currentAngle = endAngle;

        const x1 = center + radius * Math.cos(startAngle);
        const y1 = center + radius * Math.sin(startAngle);
        const x2 = center + radius * Math.cos(endAngle);
        const y2 = center + radius * Math.sin(endAngle);

        const largeArcFlag = angle > Math.PI ? 1 : 0;

        const pathData = `
            M ${center} ${center}
            L ${x1} ${y1}
            A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}
            Z
        `;

        return (
            <g key={`slice-${item.label}-${index}`}>
                <path
                    d={pathData}
                    fill={item.color}
                    className="transition-all duration-500 hover:opacity-90 cursor-pointer"
                />
                {percentage > 0.1 && (
                    <text
                        x={center + (radius * 0.7) * Math.cos(startAngle + angle / 2)}
                        y={center + (radius * 0.7) * Math.sin(startAngle + angle / 2)}
                        textAnchor="middle"
                        fill="white"
                        fontSize="12"
                        fontWeight="bold"
                        className="pointer-events-none"
                    >
                        {Math.round(percentage * 100)}%
                    </text>
                )}
            </g>
        );
    });

    return (
        <div className="relative">
            <svg width="200" height="200" viewBox="0 0 200 200" className="mx-auto">
                {slices}
                <circle cx={center} cy={center} r={radius * 0.3} fill="white" />
                <text
                    x={center}
                    y={center}
                    textAnchor="middle"
                    dy="0.3em"
                    fontSize="14"
                    fontWeight="bold"
                    fill="#4b5563"
                >
                    {total}
                </text>
            </svg>
            
            <div className="flex flex-wrap justify-center gap-3 mt-4">
                {data.map((item, index) => (
                    <div key={`legend-${item.label}-${index}`} className="flex items-center gap-2">
                        <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: item.color }}
                        />
                        <span className="text-xs font-medium text-gray-700">
                            {item.label}: {item.value}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function DonutChart({ data }: { data: { label: string; value: number; color: string }[] }) {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const radius = 60;
    const strokeWidth = 20;
    const center = 70;

    if (total === 0) {
        return (
            <div className="text-center py-8">
                <div className="text-gray-400 text-sm">No data available</div>
            </div>
        );
    }

    let currentOffset = 0;
    const segments = data.map((item, index) => {
        const percentage = total > 0 ? item.value / total : 0;
        const circumference = 2 * Math.PI * radius;
        const strokeDasharray = `${circumference * percentage} ${circumference * (1 - percentage)}`;
        
        const segment = (
            <circle
                key={`segment-${item.label}-${index}`}
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke={item.color}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={-currentOffset}
                className="transition-all duration-1000 ease-out"
                style={{
                    transform: 'rotate(-90deg)',
                    transformOrigin: 'center',
                }}
            />
        );

        currentOffset += circumference * percentage;
        return segment;
    });

    return (
        <div className="relative flex-shrink-0">
            <svg width="140" height="140" viewBox="0 0 140 140" className="mx-auto">
                <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="transparent"
                    stroke="#e5e7eb"
                    strokeWidth={strokeWidth}
                />
                {segments}
                <text
                    x={center}
                    y={center}
                    textAnchor="middle"
                    dy="0.3em"
                    fontSize="16"
                    fontWeight="bold"
                    fill="#374151"
                >
                    {total}
                </text>
            </svg>
        </div>
    );
}