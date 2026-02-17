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
    updateDoc,
    where,
    serverTimestamp,
    orderBy,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
    FiUsers,
    FiAlertCircle,
    FiCheckCircle,
    FiClock,
    FiRefreshCw,
    FiLogOut,
    FiHome,
    FiUser,
    FiFileText,
    FiShield,
    FiSearch,
    FiFilter,
    FiEye,
    FiMoreVertical,
    FiArrowLeft,
    FiArrowRight,
    FiDownload,
    FiMail,
    FiPhone,
    FiMapPin,
    FiCalendar,
    FiCheckSquare,
    FiBarChart2,
    FiXCircle
} from "react-icons/fi";

type Locale = "en" | "kn" | "hi";

type Villager = {
    id: string;
    name?: string;
    email?: string;
    mobile?: string;
    aadhaarLast4?: string;
    district?: string;
    taluk?: string;
    village?: string;
    panchayatId?: string;
    panchayatName?: string;
    status?: "pending" | "active" | "rejected" | "inactive" | "suspended";
    verified?: boolean;
    verifiedBy?: string;
    verifiedAt?: any;
    createdAt?: any;
    address?: string;
    profileComplete?: boolean;
};

type FilterType = "all" | "pending" | "active" | "rejected" | "inactive";

interface StatCard {
    label: string;
    count: number;
    color: string;
    icon: ReactNode;
    bgColor: string;
    borderColor: string;
    filter: FilterType;
}

export default function VillageInchargeVillagersPage() {
    const router = useRouter();
    const params = useParams() as { locale?: string };
    const locale = ((params?.locale as Locale) || "en") as Locale;

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [err, setErr] = useState("");
    const [success, setSuccess] = useState("");
    const [busyId, setBusyId] = useState<string | null>(null);
    const [user, setUser] = useState<any>(null);
    const [rows, setRows] = useState<Villager[]>([]);
    const [filter, setFilter] = useState<FilterType>("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [panchayatId, setPanchayatId] = useState<string>("");
    const [village, setVillage] = useState<string>("");
    const [selectedVillager, setSelectedVillager] = useState<Villager | null>(null);
    const [showDetails, setShowDetails] = useState(false);
    const [stats, setStats] = useState<StatCard[]>([]);
    const [animatedStats, setAnimatedStats] = useState<StatCard[]>([]);

    const t = useMemo(() => {
        const L: Record<Locale, any> = {
            en: {
                title: "Villager Management",
                subtitle: "Verify and manage villagers in your jurisdiction",
                welcome: "Welcome back,",
                loading: "Loading villagers...",
                refresh: "Refresh",
                logout: "Logout",
                back: "Back to Dashboard",
                none: "No villagers found.",
                verify: "Verify",
                verifying: "Verifying...",
                activate: "Activate",
                deactivate: "Deactivate",
                suspend: "Suspend",
                reject: "Reject",
                filterAll: "All Villagers",
                filterPending: "Pending",
                filterActive: "Active",
                filterRejected: "Rejected",
                filterInactive: "Inactive",
                searchPlaceholder: "",
                status: "Status",
                verified: "Verified",
                notVerified: "Not Verified",
                details: "View Details",
                registeredOn: "Registered",
                verifiedOn: "Verified On",
                actions: "Actions",
                confirmActivate: "Activate this villager?",
                confirmDeactivate: "Deactivate this villager?",
                confirmVerify: "Verify this villager?",
                confirmSuspend: "Suspend this villager?",
                confirmReject: "Reject this villager?",
                yes: "Yes",
                no: "No",
                villagerDetails: "Villager Details",
                close: "Close",
                stats: "Villager Statistics",
                quickActions: "Quick Actions",
                village: "Village",
                pendingVerification: "Pending Verification",
                verifiedToday: "Verified Today",
                totalVillagers: "Total Villagers",
                activeVillagers: "Active Villagers",
                exportData: "Export Data",
                viewProfile: "View Profile",
                sendMessage: "Send Message",
                verifyNow: "Verify Now",
                statusLabels: {
                    pending: "Pending",
                    active: "Active",
                    rejected: "Rejected",
                    inactive: "Inactive",
                    suspended: "Suspended"
                },
                statusColors: {
                    pending: "amber",
                    active: "green",
                    rejected: "red",
                    inactive: "gray",
                    suspended: "orange"
                },
                error: {
                    login: "Please login as authority.",
                    load: "Could not load villagers.",
                    verify: "Verification failed.",
                    update: "Status update failed.",
                },
                successMessages: {
                    verified: "Villager verified successfully!",
                    activated: "Villager activated successfully!",
                    deactivated: "Villager deactivated successfully!",
                    suspended: "Villager suspended successfully!",
                    rejected: "Villager rejected successfully!",
                }
            },
            kn: {
                title: "ಗ್ರಾಮಸ್ಥರ ನಿರ್ವಹಣೆ",
                subtitle: "ನಿಮ್ಮ ಅಧಿಕಾರ ವ್ಯಾಪ್ತಿಯಲ್ಲಿ ಗ್ರಾಮಸ್ಥರನ್ನು ಪರಿಶೀಲಿಸಿ ಮತ್ತು ನಿರ್ವಹಿಸಿ",
                welcome: "ಮರಳಿ ಸ್ವಾಗತ,",
                loading: "ಗ್ರಾಮಸ್ಥರನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...",
                refresh: "ರಿಫ್ರೆಶ್ ಮಾಡಿ",
                logout: "ಲಾಗ್‌ಔಟ್",
                back: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಹಿಂದಿರುಗಿ",
                none: "ಗ್ರಾಮಸ್ಥರು ಕಂಡುಬಂದಿಲ್ಲ.",
                verify: "ಪರಿಶೀಲಿಸಿ",
                verifying: "ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ...",
                activate: "ಸಕ್ರಿಯಗೊಳಿಸಿ",
                deactivate: "ನಿಷ್ಕ್ರಿಯಗೊಳಿಸಿ",
                suspend: "ಸ್ಥಗಿತಗೊಳಿಸಿ",
                reject: "ತಿರಸ್ಕರಿಸಿ",
                filterAll: "ಎಲ್ಲಾ ಗ್ರಾಮಸ್ಥರು",
                filterPending: "ಬಾಕಿ",
                filterActive: "ಸಕ್ರಿಯ",
                filterRejected: "ತಿರಸ್ಕರಿಸಲಾಗಿದೆ",
                filterInactive: "ನಿಷ್ಕ್ರಿಯ",
                searchPlaceholder: "ಹೆಸರು, ಮೊಬೈಲ್, ಆಧಾರ್ ಮೂಲಕ ಹುಡುಕಿ...",
                status: "ಸ್ಥಿತಿ",
                verified: "ಪರಿಶೀಲಿಸಲಾಗಿದೆ",
                notVerified: "ಪರಿಶೀಲಿಸಿಲ್ಲ",
                details: "ವಿವರಗಳನ್ನು ವೀಕ್ಷಿಸಿ",
                registeredOn: "ನೋಂದಾಯಿತ",
                verifiedOn: "ಪರಿಶೀಲಿಸಲಾಗಿದೆ",
                actions: "ಕ್ರಿಯೆಗಳು",
                confirmActivate: "ಈ ಗ್ರಾಮಸ್ಥರನ್ನು ಸಕ್ರಿಯಗೊಳಿಸುವುದೇ?",
                confirmDeactivate: "ಈ ಗ್ರಾಮಸ್ಥರನ್ನು ನಿಷ್ಕ್ರಿಯಗೊಳಿಸುವುದೇ?",
                confirmVerify: "ಈ ಗ್ರಾಮಸ್ಥರನ್ನು ಪರಿಶೀಲಿಸುವುದೇ?",
                confirmSuspend: "ಈ ಗ್ರಾಮಸ್ಥರನ್ನು ಸ್ಥಗಿತಗೊಳಿಸುವುದೇ?",
                confirmReject: "ಈ ಗ್ರಾಮಸ್ಥರನ್ನು ತಿರಸ್ಕರಿಸುವುದೇ?",
                yes: "ಹೌದು",
                no: "ಇಲ್ಲ",
                villagerDetails: "ಗ್ರಾಮಸ್ಥರ ವಿವರಗಳು",
                close: "ಮುಚ್ಚಿ",
                stats: "ಗ್ರಾಮಸ್ಥರ ಅಂಕಿಅಂಶಗಳು",
                quickActions: "ತ್ವರಿತ ಕ್ರಿಯೆಗಳು",
                village: "ಗ್ರಾಮ",
                pendingVerification: "ಪರಿಶೀಲನೆ ಬಾಕಿ",
                verifiedToday: "ಇಂದು ಪರಿಶೀಲಿಸಲಾಗಿದೆ",
                totalVillagers: "ಒಟ್ಟು ಗ್ರಾಮಸ್ಥರು",
                activeVillagers: "ಸಕ್ರಿಯ ಗ್ರಾಮಸ್ಥರು",
                exportData: "ಡೇಟಾ ರಫ್ತು ಮಾಡಿ",
                viewProfile: "ಪ್ರೊಫೈಲ್ ವೀಕ್ಷಿಸಿ",
                sendMessage: "ಸಂದೇಶ ಕಳುಹಿಸಿ",
                verifyNow: "ಈಗ ಪರಿಶೀಲಿಸಿ",
                statusLabels: {
                    pending: "ಬಾಕಿ",
                    active: "ಸಕ್ರಿಯ",
                    rejected: "ತಿರಸ್ಕರಿಸಲಾಗಿದೆ",
                    inactive: "ನಿಷ್ಕ್ರಿಯ",
                    suspended: "ಸ್ಥಗಿತ"
                },
                statusColors: {
                    pending: "amber",
                    active: "green",
                    rejected: "red",
                    inactive: "gray",
                    suspended: "orange"
                },
                error: {
                    login: "ದಯವಿಟ್ಟು ಅಧಿಕಾರಿಯಾಗಿ ಲಾಗಿನ್ ಆಗಿ.",
                    load: "ಗ್ರಾಮಸ್ಥರನ್ನು ಲೋಡ್ ಮಾಡಲಾಗಲಿಲ್ಲ.",
                    verify: "ಪರಿಶೀಲನೆ ವಿಫಲವಾಗಿದೆ.",
                    update: "ಸ್ಥಿತಿ ನವೀಕರಣ ವಿಫಲವಾಗಿದೆ.",
                },
                successMessages: {
                    verified: "ಗ್ರಾಮಸ್ಥರನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಪರಿಶೀಲಿಸಲಾಗಿದೆ!",
                    activated: "ಗ್ರಾಮಸ್ಥರನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಸಕ್ರಿಯಗೊಳಿಸಲಾಗಿದೆ!",
                    deactivated: "ಗ್ರಾಮಸ್ಥರನ್ನು ಯಶಸ್ವಿಯಾಗಿ ನಿಷ್ಕ್ರಿಯಗೊಳಿಸಲಾಗಿದೆ!",
                    suspended: "ಗ್ರಾಮಸ್ಥರನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಸ್ಥಗಿತಗೊಳಿಸಲಾಗಿದೆ!",
                    rejected: "ಗ್ರಾಮಸ್ಥರನ್ನು ಯಶಸ್ವಿಯಾಗಿ ತಿರಸ್ಕರಿಸಲಾಗಿದೆ!",
                }
            },
            hi: {
                title: "ग्रामीण प्रबंधन",
                subtitle: "अपने अधिकार क्षेत्र में ग्रामीणों को सत्यापित और प्रबंधित करें",
                welcome: "वापसी पर स्वागत है,",
                loading: "ग्रामीण लोड हो रहे हैं...",
                refresh: "रिफ्रेश करें",
                logout: "लॉगआउट",
                back: "डैशबोर्ड पर वापस जाएं",
                none: "कोई ग्रामीण नहीं मिला।",
                verify: "सत्यापित करें",
                verifying: "सत्यापित किया जा रहा है...",
                activate: "सक्रिय करें",
                deactivate: "निष्क्रिय करें",
                suspend: "निलंबित करें",
                reject: "अस्वीकार करें",
                filterAll: "सभी ग्रामीण",
                filterPending: "लंबित",
                filterActive: "सक्रिय",
                filterRejected: "अस्वीकृत",
                filterInactive: "निष्क्रिय",
                searchPlaceholder: "नाम, मोबाइल, आधार से खोजें...",
                status: "स्थिति",
                verified: "सत्यापित",
                notVerified: "सत्यापित नहीं",
                details: "विवरण देखें",
                registeredOn: "पंजीकृत",
                verifiedOn: "सत्यापित",
                actions: "कार्रवाई",
                confirmActivate: "इस ग्रामीण को सक्रिय करें?",
                confirmDeactivate: "इस ग्रामीण को निष्क्रिय करें?",
                confirmVerify: "इस ग्रामीण को सत्यापित करें?",
                confirmSuspend: "इस ग्रामीण को निलंबित करें?",
                confirmReject: "इस ग्रामीण को अस्वीकार करें?",
                yes: "हाँ",
                no: "नहीं",
                villagerDetails: "ग्रामीण विवरण",
                close: "बंद करें",
                stats: "ग्रामीण आँकड़े",
                quickActions: "त्वरित कार्रवाई",
                village: "गाँव",
                pendingVerification: "सत्यापन लंबित",
                verifiedToday: "आज सत्यापित",
                totalVillagers: "कुल ग्रामीण",
                activeVillagers: "सक्रिय ग्रामीण",
                exportData: "डेटा निर्यात करें",
                viewProfile: "प्रोफ़ाइल देखें",
                sendMessage: "संदेश भेजें",
                verifyNow: "अभी सत्यापित करें",
                statusLabels: {
                    pending: "लंबित",
                    active: "सक्रिय",
                    rejected: "अस्वीकृत",
                    inactive: "निष्क्रिय",
                    suspended: "निलंबित"
                },
                statusColors: {
                    pending: "amber",
                    active: "green",
                    rejected: "red",
                    inactive: "gray",
                    suspended: "orange"
                },
                error: {
                    login: "कृपया प्राधिकरण के रूप में लॉगिन करें।",
                    load: "ग्रामीण लोड नहीं हो सके।",
                    verify: "सत्यापन विफल।",
                    update: "स्थिति अपडेट विफल।",
                },
                successMessages: {
                    verified: "ग्रामीण सफलतापूर्वक सत्यापित!",
                    activated: "ग्रामीण सफलतापूर्वक सक्रिय!",
                    deactivated: "ग्रामीण सफलतापूर्वक निष्क्रिय!",
                    suspended: "ग्रामीण सफलतापूर्वक निलंबित!",
                    rejected: "ग्रामीण सफलतापूर्वक अस्वीकृत!",
                }
            },
        };
        return L[locale] || L.en;
    }, [locale]);

    const loadAuthorityAndVillagers = async (viUid: string) => {
        // 1) Load authority profile
        const aSnap = await getDoc(doc(db, "authorities", viUid));
        if (!aSnap.exists()) throw new Error("Authority profile not found.");

        const a = aSnap.data() as any;
        const isVerified =
            a?.verified === true || a?.verification?.status === "verified";

        if (a?.role !== "village_incharge" || !isVerified) {
            throw new Error("You are not authorized to view villagers.");
        }

        const authorityPanchayatId = a?.panchayatId;
        const authorityVillage = a?.village;

        if (!authorityPanchayatId) throw new Error("panchayatId missing in authority profile.");

        setPanchayatId(authorityPanchayatId);
        setVillage(authorityVillage || "");

        // 2) Build query for villagers
        let villagersQuery;
        
        if (authorityVillage) {
            villagersQuery = query(
                collection(db, "villagers"),
                where("panchayatId", "==", authorityPanchayatId),
                where("village", "==", authorityVillage),
                orderBy("createdAt", "desc")
            );
        } else {
            villagersQuery = query(
                collection(db, "villagers"),
                where("panchayatId", "==", authorityPanchayatId),
                orderBy("createdAt", "desc")
            );
        }

        const snap = await getDocs(villagersQuery);

        const list: Villager[] = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as any),
        }));

        setRows(list);
        
        // Calculate stats
        const total = list.length;
        const pending = list.filter(v => !v.verified && v.status === "pending").length;
        const active = list.filter(v => v.verified && v.status === "active").length;
        const rejected = list.filter(v => v.status === "rejected").length;
        const inactive = list.filter(v => v.status === "inactive" || v.status === "suspended").length;
        
        const newStats: StatCard[] = [
            {
                label: t.totalVillagers,
                count: total,
                color: "text-blue-900",
                icon: <FiUsers className="w-5 h-5" />,
                bgColor: "bg-blue-100",
                borderColor: "border-blue-200",
                filter: "all"
            },
            {
                label: t.pendingVerification,
                count: pending,
                color: "text-amber-900",
                icon: <FiAlertCircle className="w-5 h-5" />,
                bgColor: "bg-amber-100",
                borderColor: "border-amber-200",
                filter: "pending"
            },
            {
                label: t.activeVillagers,
                count: active,
                color: "text-green-900",
                icon: <FiCheckCircle className="w-5 h-5" />,
                bgColor: "bg-green-100",
                borderColor: "border-green-200",
                filter: "active"
            },
            {
                label: t.filterRejected,
                count: rejected + inactive,
                color: "text-red-900",
                icon: <FiClock className="w-5 h-5" />,
                bgColor: "bg-red-100",
                borderColor: "border-red-200",
                filter: "rejected"
            },
        ];

        setStats(newStats);
        setAnimatedStats(newStats.map(stat => ({ ...stat, count: 0 })));
        
        setTimeout(() => {
            setAnimatedStats(newStats);
        }, 300);
    };

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            try {
                setErr("");
                setLoading(true);

                if (!user) {
                    router.replace(`/${locale}/authority/login`);
                    return;
                }

                setUser(user);
                await loadAuthorityAndVillagers(user.uid);
                setLoading(false);
            } catch (e: any) {
                console.error("VI VILLAGERS LOAD ERROR:", e);
                setErr(e?.message || t.error.load);
                setLoading(false);
            }
        });

        return () => unsub();
    }, [router, locale, t]);

    const getStatusColor = (status: string = "pending", verified: boolean = false) => {
        if (!verified && status === "pending") return "bg-gradient-to-r from-amber-500 to-orange-600";
        if (verified && status === "active") return "bg-gradient-to-r from-green-500 to-emerald-600";
        if (status === "rejected") return "bg-gradient-to-r from-red-500 to-pink-600";
        if (status === "inactive" || status === "suspended") return "bg-gradient-to-r from-gray-500 to-gray-600";
        return "bg-gradient-to-r from-blue-500 to-cyan-600";
    };

    const getStatusText = (status: string = "pending", verified: boolean = false) => {
        if (!verified && status === "pending") return t.statusLabels.pending;
        if (verified && status === "active") return t.statusLabels.active;
        return t.statusLabels[status as keyof typeof t.statusLabels] || status;
    };

    const filteredRows = useMemo(() => {
        let filtered = rows;

        // Apply status filter
        if (filter !== "all") {
            if (filter === "rejected") {
                filtered = filtered.filter(v => v.status === "rejected" || v.status === "inactive" || v.status === "suspended");
            } else {
                filtered = filtered.filter(v => v.status === filter);
            }
        }

        // Apply search filter
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(v => 
                v.name?.toLowerCase().includes(term) ||
                v.mobile?.includes(term) ||
                v.aadhaarLast4?.includes(term) ||
                v.email?.toLowerCase().includes(term) ||
                v.village?.toLowerCase().includes(term)
            );
        }

        return filtered;
    }, [rows, filter, searchTerm]);

    const verifyVillager = async (villagerId: string) => {
        if (!confirm(t.confirmVerify)) return;
        
        try {
            setErr("");
            setBusyId(villagerId);

            const user = auth.currentUser;
            if (!user) throw new Error(t.error.login);

            await updateDoc(doc(db, "villagers", villagerId), {
                verified: true,
                status: "active",
                verifiedBy: user.uid,
                verifiedAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            setRows(prev => prev.map(v => 
                v.id === villagerId 
                    ? { 
                        ...v, 
                        verified: true, 
                        status: "active",
                        verifiedBy: user.uid,
                        verifiedAt: new Date()
                    } 
                    : v
            ));
            
            setSuccess(t.successMessages.verified);
            setTimeout(() => setSuccess(""), 3000);
        } catch (e: any) {
            console.error("VERIFY ERROR:", e);
            setErr(e?.message || t.error.verify);
        } finally {
            setBusyId(null);
        }
    };

    const updateVillagerStatus = async (villagerId: string, newStatus: "active" | "inactive" | "suspended" | "rejected") => {
        const confirmMsg = t[`confirm${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}` as keyof typeof t];
        if (!confirm(confirmMsg || `Change status to ${newStatus}?`)) return;

        try {
            setErr("");
            setBusyId(villagerId);

            const user = auth.currentUser;
            if (!user) throw new Error(t.error.login);

            await updateDoc(doc(db, "villagers", villagerId), {
                status: newStatus,
                updatedAt: serverTimestamp(),
                ...(newStatus === "active" && { verified: true }),
            });

            setRows(prev => prev.map(v => 
                v.id === villagerId 
                    ? { 
                        ...v, 
                        status: newStatus,
                        ...(newStatus === "active" && { verified: true })
                    } 
                    : v
            ));
            
            setSuccess(t.successMessages[`${newStatus}d` as keyof typeof t.successMessages] || "Status updated successfully!");
            setTimeout(() => setSuccess(""), 3000);
        } catch (e: any) {
            console.error("STATUS UPDATE ERROR:", e);
            setErr(e?.message || t.error.update);
        } finally {
            setBusyId(null);
        }
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return "N/A";
        try {
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
            return date.toLocaleDateString(locale, {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return "N/A";
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            const user = auth.currentUser;
            if (user) {
                await loadAuthorityAndVillagers(user.uid);
                setSuccess("Data refreshed");
                setTimeout(() => setSuccess(""), 2000);
            }
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

    const openVillagerDetails = (villager: Villager) => {
        setSelectedVillager(villager);
        setShowDetails(true);
    };

    if (loading) {
        return (
            <Screen padded>
                <style>{`
                    @keyframes shimmer {
                        0% { transform: translateX(-100%); }
                        100% { transform: translateX(100%); }
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

                    {/* Content Skeleton */}
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-blue-50 p-5 shadow-lg">
                                <div className="absolute inset-0 shimmer"></div>
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-gradient-to-r from-blue-200 to-cyan-200 rounded-xl"></div>
                                    <div className="flex-1">
                                        <div className="h-5 w-40 bg-gradient-to-r from-blue-200 to-cyan-200 rounded mb-2"></div>
                                        <div className="h-3 w-56 bg-gradient-to-r from-blue-100 to-cyan-100 rounded"></div>
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
                .villager-card {
                    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                    background: linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(239, 246, 255, 0.8) 100%);
                }
                .villager-card:hover {
                    transform: translateY(-3px);
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

            <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-white p-4 pb-24">
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
                        
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => router.push(`/${locale}/authority/vi/dashboard`)}
                                className="p-3 rounded-xl border-2 border-blue-100 bg-white hover:bg-blue-50 active:scale-95 transition-all duration-200 flex items-center gap-2"
                            >
                                <FiArrowLeft className="w-5 h-5 text-blue-700" />
                                <span className="text-sm font-semibold text-blue-800">{t.back}</span>
                            </button>
                            
                            <button
                                onClick={handleRefresh}
                                disabled={refreshing}
                                className="p-3 rounded-xl border-2 border-blue-100 bg-white hover:bg-blue-50 active:scale-95 transition-all duration-200"
                            >
                                <FiRefreshCw className={`w-5 h-5 text-blue-700 ${refreshing ? 'refresh-spin' : ''}`} />
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-blue-600/80 bg-blue-50/50 rounded-xl p-3">
                        <FiBarChart2 className="w-4 h-4" />
                        <span className="font-semibold">{t.stats}</span>
                        {village && (
                            <span className="ml-auto px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                                {village} Village
                            </span>
                        )}
                    </div>
                </div>

                {/* Success Message */}
                {success && (
                    <div className="mb-6 animate-scaleIn">
                        <div className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-2xl p-4 shadow-lg flex items-center gap-3">
                            <FiCheckCircle className="w-6 h-6 flex-shrink-0" />
                            <div>
                                <p className="font-bold">{success}</p>
                                <p className="text-sm opacity-90">Action completed successfully</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Error Message */}
                {err && (
                    <div className="mb-6 animate-slideLeft">
                        <div className="bg-gradient-to-r from-red-500 to-orange-600 text-white rounded-2xl p-4 shadow-lg flex items-center gap-3">
                            <FiAlertCircle className="w-6 h-6 flex-shrink-0" />
                            <div>
                                <p className="font-bold">Error</p>
                                <p className="text-sm opacity-90">{err}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Animated Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {stats.map((stat, index) => (
                        <button
                            key={stat.label}
                            onClick={() => setFilter(stat.filter)}
                            className={`stat-card ${stat.borderColor} border-2 rounded-2xl p-5 shadow-lg text-left animate-fadeIn ${
                                filter === stat.filter ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                            }`}
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

                {/* Search and Filter Section */}
                <div className="mb-8 animate-fadeIn" style={{ animationDelay: '400ms' }}>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-600/60 w-5 h-5" />
                            <input
                                type="text"
                                placeholder={t.searchPlaceholder}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-blue-100 bg-white text-blue-900 placeholder-blue-900/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                            {(["all", "pending", "active", "rejected"] as FilterType[]).map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-4 py-3 rounded-xl font-medium transition-all ${
                                        filter === f
                                            ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white'
                                            : 'bg-white text-blue-900 border-2 border-blue-100 hover:bg-blue-50'
                                    }`}
                                >
                                    {t[`filter${f.charAt(0).toUpperCase() + f.slice(1)}`]}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Villagers List */}
                <div className="space-y-4 mb-8">
                    {filteredRows.length === 0 ? (
                        <div className="text-center py-12 rounded-2xl border-2 border-blue-100 bg-white/50 animate-fadeIn">
                            <FiUsers className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                            <p className="text-blue-900/60 text-lg font-medium">{t.none}</p>
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm("")}
                                    className="mt-3 text-blue-600 hover:text-blue-800 font-medium"
                                >
                                    Clear search
                                </button>
                            )}
                        </div>
                    ) : (
                        filteredRows.map((v, index) => (
                            <div
                                key={v.id}
                                className="villager-card border-2 border-blue-100 rounded-2xl p-5 shadow-lg animate-fadeIn"
                                style={{ animationDelay: `${index * 100 + 500}ms` }}
                            >
                                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                                    {/* Villager Info */}
                                    <div className="flex-1 space-y-4">
                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                            <div>
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-xl font-bold text-blue-900">
                                                        {v.name || "Unnamed Villager"}
                                                    </h3>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${getStatusColor(v.status, v.verified)}`}>
                                                        {getStatusText(v.status, v.verified)}
                                                    </span>
                                                </div>
                                                
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex flex-wrap gap-4">
                                                        {v.mobile && (
                                                            <div className="flex items-center gap-2 text-blue-800">
                                                                <FiPhone className="w-4 h-4" />
                                                                <span className="font-medium">{v.mobile}</span>
                                                            </div>
                                                        )}
                                                        {v.email && (
                                                            <div className="flex items-center gap-2 text-blue-800">
                                                                <FiMail className="w-4 h-4" />
                                                                <span className="font-medium">{v.email}</span>
                                                            </div>
                                                        )}
                                                        {v.aadhaarLast4 && (
                                                            <div className="flex items-center gap-2 text-blue-800">
                                                                <FiUser className="w-4 h-4" />
                                                                <span className="font-medium">Aadhaar: ****{v.aadhaarLast4}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex flex-wrap gap-3 text-blue-700/70">
                                                        {v.village && (
                                                            <div className="flex items-center gap-2">
                                                                <FiMapPin className="w-4 h-4" />
                                                                <span>{v.village}</span>
                                                            </div>
                                                        )}
                                                        {v.taluk && (
                                                            <div className="flex items-center gap-2">
                                                                <FiMapPin className="w-4 h-4" />
                                                                <span>{v.taluk} Taluk</span>
                                                            </div>
                                                        )}
                                                        {v.district && (
                                                            <div className="flex items-center gap-2">
                                                                <FiMapPin className="w-4 h-4" />
                                                                <span>{v.district} District</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex flex-wrap gap-4 text-xs text-blue-900/55">
                                                        {v.createdAt && (
                                                            <div className="flex items-center gap-2">
                                                                <FiCalendar className="w-3 h-3" />
                                                                <span>{t.registeredOn}: {formatDate(v.createdAt)}</span>
                                                            </div>
                                                        )}
                                                        {v.verifiedAt && (
                                                            <div className="flex items-center gap-2">
                                                                <FiCheckCircle className="w-3 h-3" />
                                                                <span>{t.verifiedOn}: {formatDate(v.verifiedAt)}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col sm:items-end gap-2">
                                                <button
                                                    onClick={() => openVillagerDetails(v)}
                                                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
                                                >
                                                    <FiEye className="w-4 h-4" />
                                                    {t.details}
                                                </button>
                                                <div className="text-[11px] text-blue-900/45">
                                                    ID: {v.id.slice(0, 8)}...
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-col gap-2 min-w-[200px]">
                                        {!v.verified && v.status === "pending" && (
                                            <button
                                                onClick={() => verifyVillager(v.id)}
                                                disabled={busyId === v.id}
                                                className="ripple rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-3 font-semibold disabled:opacity-60 hover:shadow-lg transition-all flex items-center justify-center gap-2"
                                            >
                                                {busyId === v.id ? (
                                                    <>
                                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                        {t.verifying}
                                                    </>
                                                ) : (
                                                    <>
                                                        <FiCheckSquare className="w-5 h-5" />
                                                        {t.verify}
                                                    </>
                                                )}
                                            </button>
                                        )}
                                        
                                        {v.verified && v.status === "active" && (
                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    onClick={() => updateVillagerStatus(v.id, "suspended")}
                                                    disabled={busyId === v.id}
                                                    className="ripple rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 text-white px-3 py-2 text-sm font-semibold disabled:opacity-60 hover:shadow-lg transition-all"
                                                >
                                                    {busyId === v.id ? "..." : t.suspend}
                                                </button>
                                                <button
                                                    onClick={() => updateVillagerStatus(v.id, "inactive")}
                                                    disabled={busyId === v.id}
                                                    className="ripple rounded-xl bg-gradient-to-r from-gray-500 to-gray-600 text-white px-3 py-2 text-sm font-semibold disabled:opacity-60 hover:shadow-lg transition-all"
                                                >
                                                    {busyId === v.id ? "..." : t.deactivate}
                                                </button>
                                            </div>
                                        )}
                                        
                                        {(v.status === "inactive" || v.status === "suspended") && (
                                            <button
                                                onClick={() => updateVillagerStatus(v.id, "active")}
                                                disabled={busyId === v.id}
                                                className="ripple rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-4 py-3 font-semibold disabled:opacity-60 hover:shadow-lg transition-all"
                                            >
                                                {busyId === v.id ? "..." : t.activate}
                                            </button>
                                        )}
                                        
                                        {v.status === "pending" && (
                                            <button
                                                onClick={() => updateVillagerStatus(v.id, "rejected")}
                                                disabled={busyId === v.id}
                                                className="ripple rounded-xl border-2 border-red-200 bg-red-50 text-red-700 px-4 py-3 font-semibold disabled:opacity-60 hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                                            >
                                                <FiXCircle className="w-5 h-5" />
                                                {busyId === v.id ? "..." : t.reject}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Villager Details Modal */}
                {showDetails && selectedVillager && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
                        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scaleIn">
                            <div className="p-6">
                                {/* Modal Header */}
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className="text-2xl font-bold text-blue-900">{t.villagerDetails}</h2>
                                        <p className="text-blue-700/70 text-sm">{selectedVillager.name}</p>
                                    </div>
                                    <button
                                        onClick={() => setShowDetails(false)}
                                        className="p-2 rounded-xl hover:bg-blue-50 text-blue-700"
                                    >
                                        <FiXCircle className="w-6 h-6" />
                                    </button>
                                </div>

                                {/* Villager Details */}
                                <div className="space-y-6">
                                    {/* Personal Info */}
                                    <div className="bg-blue-50/50 rounded-2xl p-5">
                                        <h3 className="text-lg font-semibold text-blue-900 mb-4">Personal Information</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-sm text-blue-700/70">Full Name</label>
                                                <p className="font-medium text-blue-900">{selectedVillager.name || "Not provided"}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm text-blue-700/70">Mobile Number</label>
                                                <p className="font-medium text-blue-900">{selectedVillager.mobile || "Not provided"}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm text-blue-700/70">Email Address</label>
                                                <p className="font-medium text-blue-900">{selectedVillager.email || "Not provided"}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm text-blue-700/70">Aadhaar Number</label>
                                                <p className="font-medium text-blue-900">
                                                    {selectedVillager.aadhaarLast4 ? `****${selectedVillager.aadhaarLast4}` : "Not provided"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Location Info */}
                                    <div className="bg-green-50/50 rounded-2xl p-5">
                                        <h3 className="text-lg font-semibold text-blue-900 mb-4">Location Information</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-sm text-blue-700/70">Village</label>
                                                <p className="font-medium text-blue-900">{selectedVillager.village || "Not provided"}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm text-blue-700/70">Taluk</label>
                                                <p className="font-medium text-blue-900">{selectedVillager.taluk || "Not provided"}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm text-blue-700/70">District</label>
                                                <p className="font-medium text-blue-900">{selectedVillager.district || "Not provided"}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm text-blue-700/70">Panchayat ID</label>
                                                <p className="font-medium text-blue-900">{selectedVillager.panchayatId || "Not provided"}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Status Info */}
                                    <div className="bg-amber-50/50 rounded-2xl p-5">
                                        <h3 className="text-lg font-semibold text-blue-900 mb-4">Account Status</h3>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <label className="text-sm text-blue-700/70">Verification Status</label>
                                                    <p className="font-medium text-blue-900">
                                                        {selectedVillager.verified ? "Verified" : "Not Verified"}
                                                    </p>
                                                </div>
                                                <div>
                                                    <label className="text-sm text-blue-700/70">Account Status</label>
                                                    <span className={`px-3 py-1 rounded-full text-sm font-bold text-white ${getStatusColor(selectedVillager.status, selectedVillager.verified)}`}>
                                                        {getStatusText(selectedVillager.status, selectedVillager.verified)}
                                                    </span>
                                                </div>
                                            </div>
                                            {selectedVillager.createdAt && (
                                                <div>
                                                    <label className="text-sm text-blue-700/70">Registration Date</label>
                                                    <p className="font-medium text-blue-900">{formatDate(selectedVillager.createdAt)}</p>
                                                </div>
                                            )}
                                            {selectedVillager.verifiedAt && (
                                                <div>
                                                    <label className="text-sm text-blue-700/70">Verification Date</label>
                                                    <p className="font-medium text-blue-900">{formatDate(selectedVillager.verifiedAt)}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => {
                                                setShowDetails(false);
                                                if (!selectedVillager.verified && selectedVillager.status === "pending") {
                                                    verifyVillager(selectedVillager.id);
                                                } else if (selectedVillager.status !== "active") {
                                                    updateVillagerStatus(selectedVillager.id, "active");
                                                }
                                            }}
                                            className="flex-1 ripple rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 font-semibold hover:shadow-lg transition-all"
                                        >
                                            {!selectedVillager.verified && selectedVillager.status === "pending" ? t.verifyNow : t.activate}
                                        </button>
                                        <button
                                            onClick={() => setShowDetails(false)}
                                            className="flex-1 ripple rounded-xl border-2 border-blue-200 bg-white text-blue-900 py-3 font-semibold hover:bg-blue-50 transition-all"
                                        >
                                            {t.close}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    className="fixed top-4 right-4 p-3 rounded-xl border-2 border-red-100 bg-white hover:bg-red-50 text-red-700 hover:text-red-900 transition-all duration-200 hover:scale-105 shadow-sm z-10"
                    title={t.logout}
                >
                    <FiLogOut className="w-5 h-5" />
                </button>

                {/* Bottom Navigation */}
                <div className="fixed bottom-4 left-4 right-4 bg-white/90 backdrop-blur-lg border-2 border-blue-100 rounded-2xl p-2 shadow-xl animate-fadeIn">
                    <div className="grid grid-cols-4 gap-1">
                        <button
                            className="flex flex-col items-center justify-center p-3 rounded-xl transition-all hover:bg-blue-50"
                            onClick={() => router.push(`/${locale}/authority/vi/dashboard`)}
                        >
                            <FiHome className="w-5 h-5 text-blue-600/70" />
                            <span className="text-xs mt-1 font-medium text-blue-700/70">
                                Dashboard
                            </span>
                        </button>
                        
                        <button
                            className="flex flex-col items-center justify-center p-3 rounded-xl transition-all bg-gradient-to-b from-blue-100 to-cyan-50"
                        >
                            <FiUsers className="w-5 h-5 text-blue-700" />
                            <span className="text-xs mt-1 font-medium text-blue-800 font-bold">
                                Villagers
                            </span>
                        </button>
                        
                        <button
                            className="flex flex-col items-center justify-center p-3 rounded-xl transition-all hover:bg-blue-50"
                            onClick={() => router.push(`/${locale}/authority/vi/issues`)}
                        >
                            <FiFileText className="w-5 h-5 text-blue-600/70" />
                            <span className="text-xs mt-1 font-medium text-blue-700/70">
                                Issues
                            </span>
                        </button>
                        
                        <button
                            className="flex flex-col items-center justify-center p-3 rounded-xl transition-all hover:bg-blue-50"
                            onClick={() => router.push(`/${locale}/authority/vi/profile`)}
                        >
                            <FiUser className="w-5 h-5 text-blue-600/70" />
                            <span className="text-xs mt-1 font-medium text-blue-700/70">
                                Profile
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </Screen>
    );
}