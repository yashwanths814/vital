"use client";

import { useMemo, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Screen from "../../../components/Screen";
import { DashboardService, DashboardStats } from "../../../services/firebase/dashboardService";

type VerificationRole = {
    id: string;
    title: string;
    desc: string;
    icon: string;
    color: string;
    gradient: string;
    pending?: number;
};

type VerificationStats = {
    pendingPDO: number;
    pendingVillageIncharge: number;
    pendingTDO: number;
    pendingDDO: number;
};

export default function AdminVerifyHubPage() {
    const router = useRouter();
    const params = useParams() as { locale?: string };
    const locale = params?.locale || "en";

    const [stats, setStats] = useState<VerificationStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let alive = true;
        setLoading(true);
        setError("");

        DashboardService.getAdminDashboardStats()
            .then((dashboardStats) => {
                if (!alive) return;
                
                // Extract verification stats from dashboard data
                const verificationStats: VerificationStats = {
                    pendingPDO: dashboardStats.pendingPDO || 0,
                    pendingVillageIncharge: dashboardStats.pendingVillageIncharge || 0,
                    pendingTDO: dashboardStats.pendingTDO || 0,
                    pendingDDO: dashboardStats.pendingDDO || 0,
                };
                
                setStats(verificationStats);
                setLoading(false);
            })
            .catch((e: any) => {
                if (!alive) return;
                setStats(null);
                setLoading(false);
                setError(e?.message || "Failed to load verification stats.");
            });

        return () => {
            alive = false;
        };
    }, []);

    const t = useMemo(() => {
        const L: any = {
            en: {
                title: "Authority Verification Hub",
                subtitle: "Choose which authority role to verify — PDO, Village In-charge, TDO, or DDO.",
                pdo: "PDO Verification",
                pdoDesc: "Gram Panchayat Development Officer • Approve via OTP + email confirmation",
                vic: "Village In-charge Verification",
                vicDesc: "Village Representative • Enables villager verification workflow",
                tdo: "TDO Verification",
                tdoDesc: "Taluk Development Officer • Handles escalations + fund approvals",
                ddo: "DDO Verification",
                ddoDesc: "District Development Officer • Oversees district-level escalations",
                back: "Back to Dashboard",
                pending: "Pending",
                verify: "Verify",
                live: "Live verification queue",
                footer: "© 2026 VITAL — Unnat Bharat Abhiyan & Digital India",
                loading: "Loading verification data...",
                error: "Failed to load data",
                retry: "Retry",
                totalPending: "Total Pending",
            },
            kn: {
                title: "ಅಧಿಕಾರಿ ಪರಿಶೀಲನಾ ಕೇಂದ್ರ",
                subtitle: "ಪರಿಶೀಲಿಸಲು ಅಧಿಕಾರಿ ಪಾತ್ರ ಆಯ್ಕೆ ಮಾಡಿ — PDO, ಗ್ರಾಮ ಇನ್‌ಚಾರ್ಜ್, TDO, ಅಥವಾ DDO.",
                pdo: "PDO ಪರಿಶೀಲನೆ",
                pdoDesc: "ಗ್ರಾಮ ಪಂಚಾಯತ್ ಅಭಿವೃದ್ಧಿ ಅಧಿಕಾರಿ • OTP + ಇಮೇಲ್ ದೃಢೀಕರಣದ ಮೂಲಕ ಅನುಮೋದಿಸಿ",
                vic: "ಗ್ರಾಮ ಇನ್‌ಚಾರ್ಜ್ ಪರಿಶೀಲನೆ",
                vicDesc: "ಗ್ರಾಮ ಪ್ರತಿನಿಧಿ • ಗ್ರಾಮಸ್ಥರ ಪರಿಶೀಲನೆ ಕಾರ್ಯಪ್ರವೃತ್ತಿಯನ್ನು ಸಕ್ರಿಯಗೊಳಿಸುತ್ತದೆ",
                tdo: "TDO ಪರಿಶೀಲನೆ",
                tdoDesc: "ತಾಲ್ಲೂಕು ಅಭಿವೃದ್ಧಿ ಅಧಿಕಾರಿ • ಎಸ್ಕಲೇಶನ್ + ಅನುದಾನ ಅನುಮೋದನೆಗಳನ್ನು ನಿರ್ವಹಿಸುತ್ತಾರೆ",
                ddo: "DDO ಪರಿಶೀಲನೆ",
                ddoDesc: "ಜಿಲ್ಲಾ ಅಭಿವೃದ್ಧಿ ಅಧಿಕಾರಿ • ಜಿಲ್ಲಾ ಮಟ್ಟದ ಎಸ್ಕಲೇಶನ್‌ಗಳನ್ನು ಮೇಲ್ವಿಚಾರಣೆ ಮಾಡುತ್ತಾರೆ",
                back: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಹಿಂತಿರುಗಿ",
                pending: "ಬಾಕಿ",
                verify: "ಪರಿಶೀಲಿಸಿ",
                live: "ನೇರ ಪರಿಶೀಲನಾ ಕ್ಯೂ",
                footer: "© 2026 VITAL — Unnat Bharat Abhiyan & Digital India",
                loading: "ಪರಿಶೀಲನಾ ಡೇಟಾ ಲೋಡ್ ಆಗುತ್ತಿದೆ...",
                error: "ಡೇಟಾ ಲೋಡ್ ಮಾಡಲು ವಿಫಲವಾಗಿದೆ",
                retry: "ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ",
                totalPending: "ಒಟ್ಟು ಬಾಕಿ",
            },
            hi: {
                title: "अधिकारी वेरिफिकेशन हब",
                subtitle: "किस role को verify करना है चुनें — PDO, Village In-charge, TDO, या DDO।",
                pdo: "PDO वेरिफिकेशन",
                pdoDesc: "ग्राम पंचायत विकास अधिकारी • OTP + ईमेल कन्फर्मेशन के माध्यम से अनुमोदित करें",
                vic: "Village In-charge वेरिफिकेशन",
                vicDesc: "ग्राम प्रतिनिधि • ग्रामीण वेरिफिकेशन वर्कफ्लो सक्रिय करता है",
                tdo: "TDO वेरिफिकेशन",
                tdoDesc: "तालुक विकास अधिकारी • एस्केलेशन + फंड अनुमोदन संभालते हैं",
                ddo: "DDO वेरिफिकेशन",
                ddoDesc: "जिला विकास अधिकारी • जिला स्तरीय एस्केलेशन की निगरानी करते हैं",
                back: "डैशबोर्ड पर वापस जाएं",
                pending: "लंबित",
                verify: "वेरिफाई",
                live: "लाइव वेरिफिकेशन क्यू",
                footer: "© 2026 VITAL — Unnat Bharat Abhiyan & Digital India",
                loading: "वेरिफिकेशन डेटा लोड हो रहा है...",
                error: "डेटा लोड करने में विफल",
                retry: "फिर से कोशिश करें",
                totalPending: "कुल लंबित",
            },
        };
        return L[locale] || L.en;
    }, [locale]);

    const verificationRoles: VerificationRole[] = stats ? [
        {
            id: "pdo",
            title: t.pdo,
            desc: t.pdoDesc,
            icon: "🏛️",
            color: "from-blue-500 to-cyan-500",
            gradient: "bg-gradient-to-r from-blue-500 to-cyan-500",
            pending: stats.pendingPDO || 0,
        },
        {
            id: "vic",
            title: t.vic,
            desc: t.vicDesc,
            icon: "🏘️",
            color: "from-green-500 to-emerald-500",
            gradient: "bg-gradient-to-r from-green-500 to-emerald-500",
            pending: stats.pendingVillageIncharge || 0,
        },
        {
            id: "tdo",
            title: t.tdo,
            desc: t.tdoDesc,
            icon: "🏢",
            color: "from-orange-500 to-amber-500",
            gradient: "bg-gradient-to-r from-orange-500 to-amber-500",
            pending: stats.pendingTDO || 0,
        },
        {
            id: "ddo",
            title: t.ddo,
            desc: t.ddoDesc,
            icon: "🏛️",
            color: "from-purple-500 to-pink-500",
            gradient: "bg-gradient-to-r from-purple-500 to-pink-500",
            pending: stats.pendingDDO || 0,
        },
    ] : [];

    const totalPending = stats ? 
        (stats.pendingPDO || 0) + 
        (stats.pendingVillageIncharge || 0) + 
        (stats.pendingTDO || 0) + 
        (stats.pendingDDO || 0) 
        : 0;

    const handleRoleClick = (roleId: string) => {
        switch (roleId) {
            case "pdo":
                router.push(`/${locale}/admin/verify/pdo`);
                break;
            case "vic":
                router.push(`/${locale}/admin/verify/village-incharge`);
                break;
            case "tdo":
                router.push(`/${locale}/admin/verify/tdo`);
                break;
            case "ddo":
                router.push(`/${locale}/admin/verify/ddo`);
                break;
        }
    };

    const reloadData = () => {
        setLoading(true);
        setError("");
        DashboardService.getAdminDashboardStats()
            .then((dashboardStats) => {
                const verificationStats: VerificationStats = {
                    pendingPDO: dashboardStats.pendingPDO || 0,
                    pendingVillageIncharge: dashboardStats.pendingVillageIncharge || 0,
                    pendingTDO: dashboardStats.pendingTDO || 0,
                    pendingDDO: dashboardStats.pendingDDO || 0,
                };
                setStats(verificationStats);
                setLoading(false);
            })
            .catch((e: any) => {
                setStats(null);
                setLoading(false);
                setError(e?.message || "Failed to load verification stats.");
            });
    };

    return (
        <Screen padded>
            <div className="w-full animate-fadeIn">
                {/* Header with gradient */}
                <div className="relative rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 text-white shadow-lg mb-8 overflow-hidden">
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
                                    {t.live}
                                </div>
                                <div className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium">
                                    {t.totalPending}: <span className="font-bold">{loading ? "..." : totalPending}</span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => router.push(`/${locale}/admin/dashboard`)}
                            className="relative px-5 py-2.5 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 text-white font-semibold hover:bg-white/30 active:scale-[0.98] transition-all duration-200 hover:shadow-lg hover:shadow-white/10"
                        >
                            {t.back}
                        </button>
                    </div>
                </div>

                {/* Error / Retry */}
                {error && (
                    <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 text-red-800 animate-shake">
                        <div className="font-bold text-sm">{t.error}</div>
                        <div className="text-sm mt-1">{error}</div>
                        <button
                            className="mt-3 px-4 py-2 rounded-xl bg-white border border-red-200 font-semibold hover:bg-red-50 transition-all hover:scale-[1.02]"
                            onClick={reloadData}
                        >
                            {t.retry}
                        </button>
                    </div>
                )}

                {/* Loading State */}
                {loading && !stats && !error && (
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="text-indigo-700 font-medium">{t.loading}</p>
                    </div>
                )}

                {/* Verification Cards Grid */}
                {stats && !loading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {verificationRoles.map((role, index) => (
                            <div 
                                key={role.id}
                                className="group relative bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer overflow-hidden"
                                onClick={() => handleRoleClick(role.id)}
                                style={{
                                    animation: `fadeIn 0.6s ease-out ${index * 0.1}s both`,
                                }}
                            >
                                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${role.color} opacity-10 group-hover:opacity-20 transition-opacity rounded-full -translate-y-16 translate-x-16`} />
                                
                                <div className="relative z-10">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="text-3xl">{role.icon}</span>
                                                <h3 className="text-xl font-extrabold text-gray-900">{role.title}</h3>
                                            </div>
                                            <p className="text-sm text-gray-600">{role.desc}</p>
                                        </div>
                                        
                                        <div className="shrink-0 text-right ml-4">
                                            <p className="text-xs text-gray-500 font-medium">{t.pending}</p>
                                            <div className="relative">
                                                <p className="text-3xl font-extrabold text-gray-900">{role.pending}</p>
                                                {role.pending && role.pending > 0 && (
                                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between mt-6">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-full ${role.gradient}`} />
                                            <span className="text-xs text-gray-500">
                                                {role.pending || 0} requests awaiting verification
                                            </span>
                                        </div>
                                        
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRoleClick(role.id);
                                            }}
                                            className={`px-6 py-3 rounded-xl ${role.gradient} text-white font-extrabold hover:shadow-lg hover:brightness-110 active:scale-[0.98] transition-all duration-200 flex items-center gap-2`}
                                        >
                                            {t.verify}
                                            <span className="text-lg">→</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* If no data but not loading */}
                {!stats && !loading && !error && (
                    <div className="text-center py-12">
                        <div className="text-gray-400 text-5xl mb-4">📋</div>
                        <p className="text-gray-500 font-medium">No verification data available</p>
                        <button
                            onClick={reloadData}
                            className="mt-4 px-4 py-2 rounded-xl bg-indigo-100 text-indigo-700 font-medium hover:bg-indigo-200 transition"
                        >
                            {t.retry}
                        </button>
                    </div>
                )}

                {/* Footer */}
                <p className="text-xs text-gray-500 text-center mt-10 pt-6 border-t border-gray-200">
                    {t.footer}
                </p>
            </div>
        </Screen>
    );
}