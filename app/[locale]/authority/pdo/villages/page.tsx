"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    Timestamp
} from "firebase/firestore";
import { auth, db } from "../../../../lib/firebase";
import Screen from "../../../../components/Screen";
import {
    FiArrowLeft,
    FiHome,
    FiMapPin,
    FiUsers,
    FiFileText,
    FiClock,
    FiCheckCircle,
    FiAlertCircle,
    FiRefreshCw,
    FiLogOut,
    FiEye,
    FiUser,
    FiPhone,
    FiDroplet,
    FiZap,
    FiBookOpen,
    FiTool,
    FiInfo,
    FiTarget,
    FiBarChart2,
    FiGlobe,
    FiCalendar
} from "react-icons/fi";
import { onAuthStateChanged } from "firebase/auth";
import { toast } from "react-hot-toast";

type Locale = "en" | "kn" | "hi";

interface Village {
    id: string;
    name: string;
    panchayatId: string;
    districtId?: string;
    districtName?: string;
    talukId?: string;
    talukName?: string;
    population?: number;
    households?: number;
    area?: number;
    pincode?: string;
    wardCount?: number;
    isActive?: boolean;
    contactPerson?: string;
    contactPhone?: string;
    description?: string;
    latitude?: number;
    longitude?: number;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}

interface VillageStats {
    totalIssues: number;
    pendingIssues: number;
    resolvedIssues: number;
}

export default function PdoVillagesPage() {
    const router = useRouter();
    const params = useParams() as { locale?: string };
    const locale = (params?.locale || "en") as Locale;

    const t = useMemo(() => {
        const L: Record<Locale, any> = {
            en: {
                title: "Villages Under My Panchayat",
                subtitle: "View and manage villages in your jurisdiction",
                welcome: "Welcome back,",
                back: "Back to Dashboard",
                loading: "Loading villages...",
                noVillages: "No villages found in your panchayat",
                refresh: "Refresh",
                viewDetails: "View Details",
                viewIssues: "View Issues",
                stats: {
                    totalVillages: "Total Villages",
                    totalPopulation: "Total Population",
                    totalHouseholds: "Total Households",
                    totalIssues: "Total Issues",
                    pendingIssues: "Pending Issues"
                },
                villageDetails: "Village Details",
                population: "Population",
                households: "Households",
                status: "Status",
                active: "Active",
                inactive: "Inactive",
                infrastructure: "Infrastructure",
                schools: "Schools",
                hospitals: "Health Centers",
                anganwadis: "Anganwadis",
                waterSupply: "Water Supply",
                electricity: "Electricity",
                roads: "Roads",
                contactInfo: "Contact Information",
                pincode: "Pincode",
                wards: "Wards",
                lastActivity: "Last Activity",
                errors: {
                    noPermission: "You don't have permission to view villages.",
                    noPanchayat: "Your panchayat ID is not set.",
                    fetchError: "Failed to load villages. Please try again."
                },
                success: {
                    refreshed: "Villages list refreshed"
                },
                dashboard: "Dashboard",
                villages: "Villages",
                issues: "Issues",
                profile: "Profile",
                logout: "Logout",
                taluk: "Taluk",
                district: "District",
                gpsLocation: "GPS Location",
                code: "Village Code",
                area: "Area (sq km)",
                viewMap: "View on Map"
            },
            kn: {
                title: "ನನ್ನ ಪಂಚಾಯತ್ನ ಅಡಿಯಲ್ಲಿ ಗ್ರಾಮಗಳು",
                subtitle: "ನಿಮ್ಮ ನ್ಯಾಯವ್ಯಾಪ್ತಿಯಲ್ಲಿರುವ ಗ್ರಾಮಗಳನ್ನು ವೀಕ್ಷಿಸಿ ಮತ್ತು ನಿರ್ವಹಿಸಿ",
                welcome: "ಮರಳಿ ಸ್ವಾಗತ,",
                back: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಹಿಂತಿರುಗಿ",
                loading: "ಗ್ರಾಮಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...",
                noVillages: "ನಿಮ್ಮ ಪಂಚಾಯತ್ನಲ್ಲಿ ಯಾವುದೇ ಗ್ರಾಮಗಳು ಕಂಡುಬಂದಿಲ್ಲ",
                refresh: "ರಿಫ್ರೆಶ್",
                viewDetails: "ವಿವರಗಳನ್ನು ವೀಕ್ಷಿಸಿ",
                viewIssues: "ಸಮಸ್ಯೆಗಳನ್ನು ವೀಕ್ಷಿಸಿ",
                stats: {
                    totalVillages: "ಒಟ್ಟು ಗ್ರಾಮಗಳು",
                    totalPopulation: "ಒಟ್ಟು ಜನಸಂಖ್ಯೆ",
                    totalHouseholds: "ಒಟ್ಟು ಕುಟುಂಬಗಳು",
                    totalIssues: "ಒಟ್ಟು ಸಮಸ್ಯೆಗಳು",
                    pendingIssues: "ಬಾಕಿ ಸಮಸ್ಯೆಗಳು"
                },
                villageDetails: "ಗ್ರಾಮ ವಿವರಗಳು",
                population: "ಜನಸಂಖ್ಯೆ",
                households: "ಕುಟುಂಬಗಳು",
                status: "ಸ್ಥಿತಿ",
                active: "ಸಕ್ರಿಯ",
                inactive: "ನಿಷ್ಕ್ರಿಯ",
                infrastructure: "ಮೂಲಸೌಕರ್ಯ",
                schools: "ಶಾಲೆಗಳು",
                hospitals: "ಆರೋಗ್ಯ ಕೇಂದ್ರಗಳು",
                anganwadis: "ಅಂಗನವಾಡಿಗಳು",
                waterSupply: "ನೀರು ಸರಬರಾಜು",
                electricity: "ವಿದ್ಯುತ್",
                roads: "ರಸ್ತೆಗಳು",
                contactInfo: "ಸಂಪರ್ಕ ಮಾಹಿತಿ",
                pincode: "ಪಿನ್‌ಕೋಡ್",
                wards: "ವಾರ್ಡ್‌ಗಳು",
                lastActivity: "ಕೊನೆಯ ಚಟುವಟಿಕೆ",
                errors: {
                    noPermission: "ಗ್ರಾಮಗಳನ್ನು ವೀಕ್ಷಿಸಲು ನಿಮಗೆ ಅನುಮತಿ ಇಲ್ಲ.",
                    noPanchayat: "ನಿಮ್ಮ ಪಂಚಾಯತ್ ಐಡಿ ಹೊಂದಿಸಲಾಗಿಲ್ಲ.",
                    fetchError: "ಗ್ರಾಮಗಳನ್ನು ಲೋಡ್ ಮಾಡಲು ವಿಫಲವಾಗಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ."
                },
                success: {
                    refreshed: "ಗ್ರಾಮಗಳ ಪಟ್ಟಿಯನ್ನು ರಿಫ್ರೆಶ್ ಮಾಡಲಾಗಿದೆ"
                },
                dashboard: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
                villages: "ಗ್ರಾಮಗಳು",
                issues: "ಸಮಸ್ಯೆಗಳು",
                profile: "ಪ್ರೊಫೈಲ್",
                logout: "ಲಾಗ್‌ಔಟ್",
                taluk: "ತಾಲ್ಲೂಕು",
                district: "ಜಿಲ್ಲೆ",
                gpsLocation: "GPS ಸ್ಥಳ",
                code: "ಗ್ರಾಮ ಕೋಡ್",
                area: "ವಿಸ್ತೀರ್ಣ (ಚ.ಕಿ.ಮೀ)",
                viewMap: "ನಕ್ಷೆಯಲ್ಲಿ ವೀಕ್ಷಿಸಿ"
            },
            hi: {
                title: "मेरी पंचायत के अंतर्गत गाँव",
                subtitle: "अपने क्षेत्राधिकार में गाँवों को देखें और प्रबंधित करें",
                welcome: "वापसी पर स्वागत है,",
                back: "डैशबोर्ड पर वापस जाएं",
                loading: "गाँव लोड हो रहे हैं...",
                noVillages: "आपकी पंचायत में कोई गाँव नहीं मिला",
                refresh: "रिफ्रेश",
                viewDetails: "विवरण देखें",
                viewIssues: "मुद्दे देखें",
                stats: {
                    totalVillages: "कुल गाँव",
                    totalPopulation: "कुल जनसंख्या",
                    totalHouseholds: "कुल परिवार",
                    totalIssues: "कुल मुद्दे",
                    pendingIssues: "लंबित मुद्दे"
                },
                villageDetails: "गाँव विवरण",
                population: "जनसंख्या",
                households: "परिवार",
                status: "स्थिति",
                active: "सक्रिय",
                inactive: "निष्क्रिय",
                infrastructure: "अवसंरचना",
                schools: "स्कूल",
                hospitals: "स्वास्थ्य केंद्र",
                anganwadis: "आंगनवाड़ी",
                waterSupply: "जल आपूर्ति",
                electricity: "बिजली",
                roads: "सड़कें",
                contactInfo: "संपर्क जानकारी",
                pincode: "पिनकोड",
                wards: "वार्ड",
                lastActivity: "अंतिम गतिविधि",
                errors: {
                    noPermission: "गाँव देखने की आपकी अनुमति नहीं है.",
                    noPanchayat: "आपकी पंचायत आईडी सेट नहीं है.",
                    fetchError: "गाँव लोड करने में विफल. कृपया पुन: प्रयास करें."
                },
                success: {
                    refreshed: "गाँवों की सूची ताज़ा की गई"
                },
                dashboard: "डैशबोर्ड",
                villages: "गाँव",
                issues: "समस्याएँ",
                profile: "प्रोफ़ाइल",
                logout: "लॉगआउट",
                taluk: "तालुका",
                district: "जिला",
                gpsLocation: "जीपीएस स्थान",
                code: "गाँव कोड",
                area: "क्षेत्रफल (वर्ग कि.मी.)",
                viewMap: "मानचित्र पर देखें"
            },
        };
        return L[locale] || L.en;
    }, [locale]);

    const [villages, setVillages] = useState<Village[]>([]);
    const [villageStats, setVillageStats] = useState<Record<string, VillageStats>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [panchayatId, setPanchayatId] = useState("");
    const [panchayatName, setPanchayatName] = useState("");
    const [user, setUser] = useState<any>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [authReady, setAuthReady] = useState(false);

    const [stats, setStats] = useState({
        totalVillages: 0,
        totalPopulation: 0,
        totalHouseholds: 0,
        totalIssues: 0,
        pendingIssues: 0
    });

    const fetchVillages = async () => {
        try {
            setLoading(true);
            setError("");

            const user = auth.currentUser;
            if (!user) {
                router.push(`/${locale}/authority/login`);
                return;
            }

            // Get PDO authority profile
            const authRef = doc(db, "authorities", user.uid);
            const authSnap = await getDoc(authRef);

            if (!authSnap.exists()) {
                setError(t.errors.noPermission);
                return;
            }

            const authData = authSnap.data();
            if (authData?.role !== "pdo" || authData?.verified !== true) {
                setError(t.errors.noPermission);
                return;
            }

            const pid = authData.panchayatId;
            const pName = authData.panchayatName || authData.panchayat || "Your Panchayat";
            if (!pid) {
                setError(t.errors.noPanchayat);
                return;
            }

            setPanchayatId(pid);
            setPanchayatName(pName);
            setUser(authData);

            // Fetch villages under this panchayat - UPDATED QUERY
            const villagesQuery = query(
                collection(db, "villages"),
                where("panchayatId", "==", pid),
                orderBy("name", "asc")
            );

            const villagesSnap = await getDocs(villagesQuery);
            const villagesList: Village[] = [];
            const statsMap: Record<string, VillageStats> = {};

            let totalPopulation = 0;
            let totalHouseholds = 0;
            let totalIssues = 0;
            let pendingIssues = 0;

            for (const villageDoc of villagesSnap.docs) {
                const data = villageDoc.data();

                // Map data to Village interface
                const village: Village = {
                    id: villageDoc.id,
                    name: data.name || data.villageName || "",
                    panchayatId: data.panchayatId || pid,
                    districtId: data.districtId,
                    districtName: data.districtName,
                    talukId: data.talukId,
                    talukName: data.talukName,
                    population: data.population || 0,
                    households: data.households || data.householdCount || 0,
                    area: data.area || data.totalArea || 0,
                    pincode: data.pincode || data.postalCode,
                    wardCount: data.wardCount || data.numberOfWards || 0,
                    isActive: data.isActive !== false,
                    contactPerson: data.contactPerson || data.contactName,
                    contactPhone: data.contactPhone || data.contactNumber,
                    description: data.description || data.notes,
                    latitude: data.latitude || data.gpsLatitude,
                    longitude: data.longitude || data.gpsLongitude,
                    createdAt: data.createdAt,
                    updatedAt: data.updatedAt
                };

                villagesList.push(village);

                // Get village issues stats - UPDATED to match your issue structure
                const issuesQuery = query(
                    collection(db, "issues"),
                    where("villageId", "==", villageDoc.id),
                    where("panchayatId", "==", pid)
                );
                const issuesSnap = await getDocs(issuesQuery);
                const issues = issuesSnap.docs.map(d => {
                    const issueData = d.data();
                    return {
                        id: d.id,
                        status: issueData.status || issueData.stage || "submitted",
                        ...issueData
                    };
                });

                const villageTotal = issues.length;
                const villagePending = issues.filter(i =>
                    ['submitted', 'pending', 'verified', 'assigned', 'in_progress'].includes(i.status)
                ).length;
                const villageResolved = issues.filter(i => i.status === 'resolved').length;

                statsMap[villageDoc.id] = {
                    totalIssues: villageTotal,
                    pendingIssues: villagePending,
                    resolvedIssues: villageResolved
                };

                totalPopulation += village.population || 0;
                totalHouseholds += village.households || 0;
                totalIssues += villageTotal;
                pendingIssues += villagePending;
            }

            setVillages(villagesList);
            setVillageStats(statsMap);
            setStats({
                totalVillages: villagesList.length,
                totalPopulation,
                totalHouseholds,
                totalIssues,
                pendingIssues
            });

        } catch (err: any) {
            console.error("Error fetching villages:", err);
            setError(t.errors.fetchError);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchVillages();
        toast.success(t.success.refreshed);
    };

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, () => setAuthReady(true));
        return () => unsub();
    }, []);

    useEffect(() => {
        if (authReady) {
            fetchVillages();
        }
    }, [authReady]);

    const handleLogout = async () => {
        try {
            await auth.signOut();
            router.push(`/${locale}/role-select`);
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    const getStatusColor = (isActive: boolean) => {
        return isActive
            ? "bg-gradient-to-r from-green-500 to-emerald-600"
            : "bg-gradient-to-r from-gray-500 to-gray-600";
    };

    const getPopulationColor = (population: number) => {
        if (population > 5000) return "bg-gradient-to-r from-red-500 to-pink-600";
        if (population > 2000) return "bg-gradient-to-r from-amber-500 to-orange-600";
        if (population > 1000) return "bg-gradient-to-r from-blue-500 to-cyan-600";
        return "bg-gradient-to-r from-green-500 to-emerald-600";
    };

    const formatNumber = (num: number) => {
        return num?.toLocaleString() || "0";
    };

    const formatDate = (timestamp: Timestamp | undefined) => {
        if (!timestamp) return "N/A";
        try {
            const date = timestamp.toDate();
            const now = new Date();
            const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

            if (diffDays === 0) return "Today";
            if (diffDays === 1) return "Yesterday";
            if (diffDays < 7) return `${diffDays} days ago`;

            return date.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: diffDays < 365 ? undefined : 'numeric'
            });
        } catch {
            return "N/A";
        }
    };

    const openInMaps = (latitude: number, longitude: number) => {
        if (!latitude || !longitude) {
            toast.error("GPS coordinates not available");
            return;
        }
        const url = `https://www.google.com/maps?q=${latitude},${longitude}&z=15`;
        window.open(url, '_blank');
    };

    if (loading) {
        return (
            <Screen padded>
                <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4">
                    {/* Header Skeleton */}
                    <div className="mb-8">
                        <div className="h-8 w-64 bg-gradient-to-r from-blue-200 to-cyan-200 rounded-lg mb-2 animate-pulse"></div>
                        <div className="h-4 w-48 bg-gradient-to-r from-blue-100 to-cyan-100 rounded animate-pulse"></div>
                    </div>

                    {/* Stats Skeleton */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="rounded-2xl bg-gradient-to-br from-white to-blue-50 p-4 shadow-lg">
                                <div className="h-4 w-16 bg-gradient-to-r from-blue-200 to-cyan-200 rounded mb-3 animate-pulse"></div>
                                <div className="h-8 w-12 bg-gradient-to-r from-blue-300 to-cyan-300 rounded animate-pulse"></div>
                            </div>
                        ))}
                    </div>

                    {/* Villages Grid Skeleton */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="rounded-2xl bg-gradient-to-br from-white to-blue-50 p-5 shadow-lg">
                                <div className="flex items-start gap-3">
                                    <div className="h-12 w-12 bg-gradient-to-r from-blue-200 to-cyan-200 rounded-xl animate-pulse"></div>
                                    <div className="flex-1">
                                        <div className="h-5 w-32 bg-gradient-to-r from-blue-200 to-cyan-200 rounded mb-3 animate-pulse"></div>
                                        <div className="h-3 w-48 bg-gradient-to-r from-blue-100 to-cyan-100 rounded mb-2 animate-pulse"></div>
                                        <div className="flex gap-2">
                                            <div className="h-6 w-16 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-full animate-pulse"></div>
                                            <div className="h-6 w-20 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-full animate-pulse"></div>
                                        </div>
                                    </div>
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
            <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-white p-4 pb-24">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-2xl font-bold text-blue-900">
                                {t.title}
                            </h1>
                            <p className="text-blue-700/80 mt-1 text-sm">
                                {panchayatName}
                            </p>
                            <p className="text-blue-600/70 text-sm mt-1 flex items-center gap-1">
                                <FiUser className="w-3 h-3" />
                                {t.welcome} {user?.name || user?.displayName || user?.email?.split('@')[0] || 'PDO Officer'}
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleRefresh}
                                disabled={refreshing}
                                className="p-3 rounded-xl border-2 border-blue-100 bg-white hover:bg-blue-50 transition-all duration-200"
                                title={t.refresh}
                            >
                                <FiRefreshCw className={`w-5 h-5 text-blue-700 ${refreshing ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={() => router.push(`/${locale}/authority/pdo/dashboard`)}
                        className="flex items-center gap-2 text-blue-700 hover:text-blue-900 mb-3 text-sm"
                    >
                        <FiArrowLeft className="w-4 h-4" />
                        {t.back}
                    </button>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
                    <div className="bg-white border-2 border-blue-100 rounded-2xl p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-blue-800/80">{t.stats.totalVillages}</span>
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <FiHome className="w-4 h-4 text-blue-600" />
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-blue-900">{stats.totalVillages}</div>
                        <div className="text-xs text-blue-700/60 mt-1">{t.villages}</div>
                        <div className="h-1 w-full bg-gradient-to-r from-blue-200 to-transparent rounded-full mt-2"></div>
                    </div>

                    <div className="bg-white border-2 border-green-100 rounded-2xl p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-green-800/80">{t.stats.totalPopulation}</span>
                            <div className="p-2 bg-green-100 rounded-lg">
                                <FiUsers className="w-4 h-4 text-green-600" />
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-green-900">{formatNumber(stats.totalPopulation)}</div>
                        <div className="text-xs text-green-700/60 mt-1">{t.population}</div>
                        <div className="h-1 w-full bg-gradient-to-r from-green-200 to-transparent rounded-full mt-2"></div>
                    </div>

                    <div className="bg-white border-2 border-cyan-100 rounded-2xl p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-cyan-800/80">{t.stats.totalHouseholds}</span>
                            <div className="p-2 bg-cyan-100 rounded-lg">
                                <FiHome className="w-4 h-4 text-cyan-600" />
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-cyan-900">{formatNumber(stats.totalHouseholds)}</div>
                        <div className="text-xs text-cyan-700/60 mt-1">{t.households}</div>
                        <div className="h-1 w-full bg-gradient-to-r from-cyan-200 to-transparent rounded-full mt-2"></div>
                    </div>

                    <div className="bg-white border-2 border-amber-100 rounded-2xl p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-amber-800/80">{t.stats.totalIssues}</span>
                            <div className="p-2 bg-amber-100 rounded-lg">
                                <FiFileText className="w-4 h-4 text-amber-600" />
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-amber-900">{stats.totalIssues}</div>
                        <div className="text-xs text-amber-700/60 mt-1">{t.issues}</div>
                        <div className="h-1 w-full bg-gradient-to-r from-amber-200 to-transparent rounded-full mt-2"></div>
                    </div>

                    <div className="bg-white border-2 border-red-100 rounded-2xl p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-red-800/80">{t.stats.pendingIssues}</span>
                            <div className="p-2 bg-red-100 rounded-lg">
                                <FiClock className="w-4 h-4 text-red-600" />
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-red-900">{stats.pendingIssues}</div>
                        <div className="text-xs text-red-700/60 mt-1">Pending</div>
                        <div className="h-1 w-full bg-gradient-to-r from-red-200 to-transparent rounded-full mt-2"></div>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6">
                        <div className="bg-gradient-to-r from-red-500 to-orange-600 text-white rounded-2xl p-4 shadow-lg flex items-center gap-3">
                            <FiAlertCircle className="w-6 h-6 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="text-sm opacity-90">{error}</p>
                            </div>
                            <button
                                onClick={handleRefresh}
                                className="px-4 py-2 bg-white text-red-600 rounded-xl font-bold text-sm"
                            >
                                Retry
                            </button>
                        </div>
                    </div>
                )}

                {/* Villages Grid */}
                <div className="mb-8">
                    {villages.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full flex items-center justify-center mb-6">
                                <FiHome className="w-12 h-12 text-blue-600/70" />
                            </div>
                            <h3 className="text-xl font-bold text-blue-900 mb-2">
                                {t.noVillages}
                            </h3>
                            <p className="text-blue-700/70 mb-6">
                                No villages found in {panchayatName}
                            </p>
                            <button
                                onClick={handleRefresh}
                                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-2xl font-semibold"
                            >
                                {t.refresh}
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {villages.map((village) => (
                                <div
                                    key={village.id}
                                    className="bg-white border-2 border-blue-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow hover:border-blue-200"
                                >
                                    {/* Village Header */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-3 rounded-xl ${getStatusColor(village.isActive || true)} text-white`}>
                                                <FiHome className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-blue-900 text-lg">{village.name}</h3>
                                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                    {village.id && (
                                                        <span className="text-xs font-mono text-blue-700/70 bg-blue-50 px-2 py-1 rounded">
                                                            ID: {village.id.substring(0, 8)}
                                                        </span>
                                                    )}
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold text-white ${getStatusColor(village.isActive || true)}`}>
                                                        {village.isActive ? t.active : t.inactive}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => router.push(`/${locale}/authority/pdo/issues?village=${village.id}`)}
                                            className="p-2 rounded-lg hover:bg-blue-50 text-blue-700/70 hover:text-blue-700"
                                            title={t.viewIssues}
                                        >
                                            <FiEye className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Village Location Info */}
                                    <div className="mb-4">
                                        <div className="flex flex-wrap items-center gap-2 text-sm text-blue-700/80">
                                            {village.districtName && (
                                                <div className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-lg">
                                                    <FiGlobe className="w-3 h-3" />
                                                    <span>{village.districtName}</span>
                                                </div>
                                            )}
                                            {village.talukName && (
                                                <div className="flex items-center gap-1 bg-cyan-50 px-2 py-1 rounded-lg">
                                                    <FiMapPin className="w-3 h-3" />
                                                    <span>{village.talukName}</span>
                                                </div>
                                            )}
                                            {village.pincode && (
                                                <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded-lg">
                                                    <FiTarget className="w-3 h-3" />
                                                    <span>{village.pincode}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Village Stats */}
                                    <div className="grid grid-cols-3 gap-3 mb-4">
                                        <div className="bg-blue-50 rounded-xl p-3">
                                            <div className="flex items-center gap-2 mb-1">
                                                <FiUsers className="w-4 h-4 text-blue-600" />
                                                <span className="text-xs font-semibold text-blue-700/80">{t.population}</span>
                                            </div>
                                            <div className={`text-lg font-bold ${getPopulationColor(village.population || 0)}`}>
                                                {formatNumber(village.population || 0)}
                                            </div>
                                        </div>

                                        <div className="bg-green-50 rounded-xl p-3">
                                            <div className="flex items-center gap-2 mb-1">
                                                <FiHome className="w-4 h-4 text-green-600" />
                                                <span className="text-xs font-semibold text-green-700/80">{t.households}</span>
                                            </div>
                                            <div className="text-lg font-bold text-green-900">
                                                {formatNumber(village.households || 0)}
                                            </div>
                                        </div>

                                        {village.area && village.area > 0 && (
                                            <div className="bg-purple-50 rounded-xl p-3">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <FiMapPin className="w-4 h-4 text-purple-600" />
                                                    <span className="text-xs font-semibold text-purple-700/80">{t.area}</span>
                                                </div>
                                                <div className="text-lg font-bold text-purple-900">
                                                    {village.area}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Issues Overview */}
                                    <div className="mb-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-semibold text-blue-900 flex items-center gap-2">
                                                <FiFileText className="w-4 h-4" />
                                                Issues Overview
                                            </span>
                                            <span className="text-xs text-blue-700/70">
                                                {villageStats[village.id]?.totalIssues || 0} total
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-2 bg-blue-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-500"
                                                    style={{
                                                        width: `${((villageStats[village.id]?.resolvedIssues || 0) / Math.max(villageStats[village.id]?.totalIssues || 1, 1)) * 100}%`
                                                    }}
                                                ></div>
                                            </div>
                                            <div className="text-xs text-blue-700/70">
                                                {villageStats[village.id]?.resolvedIssues || 0}/{villageStats[village.id]?.totalIssues || 0}
                                            </div>
                                        </div>
                                        <div className="flex justify-between text-xs text-blue-700/70 mt-2">
                                            <span className="flex items-center gap-1">
                                                <FiCheckCircle className="w-3 h-3 text-green-600" />
                                                {villageStats[village.id]?.resolvedIssues || 0} resolved
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <FiClock className="w-3 h-3 text-amber-600" />
                                                {villageStats[village.id]?.pendingIssues || 0} pending
                                            </span>
                                        </div>
                                    </div>

                                    {/* GPS Location */}
                                    {village.latitude && village.longitude && (
                                        <div className="mb-4">
                                            <button
                                                onClick={() => openInMaps(village.latitude!, village.longitude!)}
                                                className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl hover:shadow-md transition-all"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <FiMapPin className="w-4 h-4 text-blue-600" />
                                                    <div className="text-left">
                                                        <div className="text-xs font-semibold text-blue-900">{t.gpsLocation}</div>
                                                        <div className="text-xs text-blue-700/70 font-mono">
                                                            {village.latitude?.toFixed(4)}, {village.longitude?.toFixed(4)}
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className="text-xs text-blue-700/70 font-medium">{t.viewMap}</span>
                                            </button>
                                        </div>
                                    )}

                                    {/* Contact Information */}
                                    {village.contactPerson && (
                                        <div className="mb-4">
                                            <div className="text-xs font-semibold text-blue-900 mb-1">{t.contactInfo}</div>
                                            <div className="flex items-center gap-2 text-sm text-blue-700/80">
                                                <FiUser className="w-4 h-4" />
                                                <span>{village.contactPerson}</span>
                                            </div>
                                            {village.contactPhone && (
                                                <div className="flex items-center gap-2 text-sm text-blue-700/80 mt-1">
                                                    <FiPhone className="w-4 h-4" />
                                                    <span>{village.contactPhone}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Last Updated */}
                                    {village.updatedAt && (
                                        <div className="text-xs text-blue-700/60 flex items-center gap-1 mt-2">
                                            <FiCalendar className="w-3 h-3" />
                                            {t.lastActivity}: {formatDate(village.updatedAt)}
                                        </div>
                                    )}

                                    {/* Quick Actions */}
                                    <div className="pt-4 border-t border-blue-100">
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={() => router.push(`/${locale}/authority/pdo/issues?village=${village.id}`)}
                                                className="px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 hover:shadow-md transition-all"
                                            >
                                                <FiEye className="w-4 h-4" />
                                                {t.viewIssues}
                                            </button>
                                            <button
                                                onClick={() => router.push(`/${locale}/authority/pdo/villages/${village.id}`)}
                                                className="px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 hover:shadow-md transition-all"
                                            >
                                                <FiInfo className="w-4 h-4" />
                                                {t.viewDetails}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Bottom Navigation */}
                <div className="fixed bottom-4 left-4 right-4 bg-white/90 backdrop-blur-lg border-2 border-blue-100 rounded-2xl p-2 shadow-xl">
                    <div className="grid grid-cols-4 gap-1">
                        <button
                            className="flex flex-col items-center justify-center p-3 rounded-xl transition-all hover:bg-blue-50"
                            onClick={() => router.push(`/${locale}/authority/pdo/dashboard`)}
                        >
                            <FiHome className="w-5 h-5 text-blue-600/70" />
                            <span className="text-xs mt-1 font-medium text-blue-700/70">
                                {t.dashboard}
                            </span>
                        </button>

                        <button
                            className="flex flex-col items-center justify-center p-3 rounded-xl transition-all bg-gradient-to-b from-blue-100 to-cyan-50"
                        >
                            <FiMapPin className="w-5 h-5 text-blue-700" />
                            <span className="text-xs mt-1 font-medium text-blue-800 font-bold">
                                {t.villages}
                            </span>
                        </button>

                        <button
                            className="flex flex-col items-center justify-center p-3 rounded-xl transition-all hover:bg-blue-50"
                            onClick={() => router.push(`/${locale}/authority/pdo/issues`)}
                        >
                            <FiFileText className="w-5 h-5 text-blue-600/70" />
                            <span className="text-xs mt-1 font-medium text-blue-700/70">
                                {t.issues}
                            </span>
                        </button>

                        <button
                            className="flex flex-col items-center justify-center p-3 rounded-xl transition-all hover:bg-blue-50"
                            onClick={() => router.push(`/${locale}/authority/pdo/profile`)}
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
                    className="fixed top-4 right-4 p-3 rounded-xl border-2 border-red-100 bg-white hover:bg-red-50 text-red-700 hover:text-red-900 transition-all duration-200 shadow-sm"
                    title={t.logout}
                >
                    <FiLogOut className="w-5 h-5" />
                </button>
            </div>
        </Screen>
    );
}