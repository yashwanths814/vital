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
    deleteDoc,
    updateDoc
} from "firebase/firestore";
import { auth, db } from "../../../../lib/firebase";
import Screen from "../../../../components/Screen";
import {
    FiArrowLeft,
    FiUserPlus,
    FiEdit,
    FiTrash2,
    FiUser,
    FiPhone,
    FiMail,
    FiTool,
    FiClock,
    FiCheckCircle,
    FiAlertCircle,
    FiRefreshCw,
    FiLogOut,
    FiHome,
    FiMapPin,
    FiFileText,
    FiUsers,
    FiBriefcase,
    FiCalendar,
    FiPlus,
    FiEye,
    FiSearch
} from "react-icons/fi";
import { onAuthStateChanged } from "firebase/auth";
import { toast } from "react-hot-toast";

type Locale = "en" | "kn" | "hi";

interface Worker {
    id: string;
    name: string;
    phone: string;
    email?: string;
    specialization?: string;
    experience?: string;
    address?: string;
    aadhaarNumber?: string;
    panchayatId: string;
    isActive: boolean;
    createdAt?: any;
    updatedAt?: any;
    availability?: string;
    department?: string;
    skills?: string[];
    assignedIssues?: number;
    completedIssues?: number;
    rating?: number;
}

export default function PdoWorkersPage() {
    const router = useRouter();
    const params = useParams() as { locale?: string };
    const locale = (params?.locale || "en") as Locale;

    const t = useMemo(() => {
        const L: Record<Locale, any> = {
            en: {
                title: "Workers Management",
                subtitle: "Manage workers in your panchayat",
                welcome: "Welcome back,",
                back: "Back to Dashboard",
                loading: "Loading workers...",
                noWorkers: "No workers found",
                refresh: "Refresh",
                addWorker: "Add New Worker",
                edit: "Edit",
                delete: "Delete",
                status: "Status",
                active: "Active",
                inactive: "Inactive",
                specialization: "Specialization",
                availability: "Availability",
                department: "Department",
                phone: "Phone",
                email: "Email",
                address: "Address",
                aadhaar: "Aadhaar Number",
                experience: "Experience",
                skills: "Skills",
                assignedIssues: "Assigned Issues",
                completedIssues: "Completed Issues",
                rating: "Rating",
                actions: "Actions",
                confirmDelete: "Are you sure you want to delete this worker?",
                deleteSuccess: "Worker deleted successfully",
                deleteError: "Failed to delete worker",
                toggleStatus: "Toggle Status",
                statusUpdated: "Status updated successfully",
                searchPlaceholder: "Search workers...",
                totalWorkers: "Total Workers",
                activeWorkers: "Active Workers",
                availableWorkers: "Available Now",
                onLeave: "On Leave",
                viewProfile: "View Profile",
                assignIssue: "Assign Issue",
                workerDetails: "Worker Details",
                errors: {
                    noPermission: "You don't have permission to view workers.",
                    noPanchayat: "Your panchayat ID is not set.",
                    fetchError: "Failed to load workers. Please try again."
                },
                dashboard: "Dashboard",
                workers: "Workers",
                issues: "Issues",
                profile: "Profile",
                logout: "Logout"
            },
            kn: {
                title: "ಕೆಲಸಗಾರರ ನಿರ್ವಹಣೆ",
                subtitle: "ನಿಮ್ಮ ಪಂಚಾಯತ್ನಲ್ಲಿ ಕೆಲಸಗಾರರನ್ನು ನಿರ್ವಹಿಸಿ",
                welcome: "ಮರಳಿ ಸ್ವಾಗತ,",
                back: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಹಿಂತಿರುಗಿ",
                loading: "ಕೆಲಸಗಾರರನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...",
                noWorkers: "ಯಾವುದೇ ಕೆಲಸಗಾರರು ಕಂಡುಬಂದಿಲ್ಲ",
                refresh: "ರಿಫ್ರೆಶ್",
                addWorker: "ಹೊಸ ಕೆಲಸಗಾರರನ್ನು ಸೇರಿಸಿ",
                edit: "ಸಂಪಾದಿಸಿ",
                delete: "ಅಳಿಸಿ",
                status: "ಸ್ಥಿತಿ",
                active: "ಸಕ್ರಿಯ",
                inactive: "ನಿಷ್ಕ್ರಿಯ",
                specialization: "ವಿಶೇಷತೆ",
                availability: "ಲಭ್ಯತೆ",
                department: "ವಿಭಾಗ",
                phone: "ಫೋನ್",
                email: "ಇಮೇಲ್",
                address: "ವಿಳಾಸ",
                aadhaar: "ಆಧಾರ್ ಸಂಖ್ಯೆ",
                experience: "ಅನುಭವ",
                skills: "ಕೌಶಲ್ಯಗಳು",
                assignedIssues: "ನಿಯೋಜಿತ ಸಮಸ್ಯೆಗಳು",
                completedIssues: "ಪೂರ್ಣಗೊಂಡ ಸಮಸ್ಯೆಗಳು",
                rating: "ರೇಟಿಂಗ್",
                actions: "ಕ್ರಿಯೆಗಳು",
                confirmDelete: "ಈ ಕೆಲಸಗಾರರನ್ನು ಅಳಿಸಲು ನೀವು ಖಚಿತವಾಗಿ ಬಯಸುವಿರಾ?",
                deleteSuccess: "ಕೆಲಸಗಾರರು ಯಶಸ್ವಿಯಾಗಿ ಅಳಿಸಲ್ಪಟ್ಟಿದೆ",
                deleteError: "ಕೆಲಸಗಾರರನ್ನು ಅಳಿಸಲು ವಿಫಲವಾಗಿದೆ",
                toggleStatus: "ಸ್ಥಿತಿಯನ್ನು ಟಾಗಲ್ ಮಾಡಿ",
                statusUpdated: "ಸ್ಥಿತಿ ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ",
                searchPlaceholder: "ಕೆಲಸಗಾರರನ್ನು ಹುಡುಕಿ...",
                totalWorkers: "ಒಟ್ಟು ಕೆಲಸಗಾರರು",
                activeWorkers: "ಸಕ್ರಿಯ ಕೆಲಸಗಾರರು",
                availableWorkers: "ಈಗ ಲಭ್ಯವಿದೆ",
                onLeave: "ರಜೆಯ ಮೇಲೆ",
                viewProfile: "ಪ್ರೊಫೈಲ್ ವೀಕ್ಷಿಸಿ",
                assignIssue: "ಸಮಸ್ಯೆಯನ್ನು ನಿಯೋಜಿಸಿ",
                workerDetails: "ಕೆಲಸಗಾರ ವಿವರಗಳು",
                errors: {
                    noPermission: "ಕೆಲಸಗಾರರನ್ನು ವೀಕ್ಷಿಸಲು ನಿಮಗೆ ಅನುಮತಿ ಇಲ್ಲ.",
                    noPanchayat: "ನಿಮ್ಮ ಪಂಚಾಯತ್ ಐಡಿ ಹೊಂದಿಸಲಾಗಿಲ್ಲ.",
                    fetchError: "ಕೆಲಸಗಾರರನ್ನು ಲೋಡ್ ಮಾಡಲು ವಿಫಲವಾಗಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ."
                },
                dashboard: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
                workers: "ಕೆಲಸಗಾರರು",
                issues: "ಸಮಸ್ಯೆಗಳು",
                profile: "ಪ್ರೊಫೈಲ್",
                logout: "ಲಾಗ್‌ಔಟ್"
            },
            hi: {
                title: "कार्यकर्ता प्रबंधन",
                subtitle: "अपनी पंचायत में कार्यकर्ताओं का प्रबंधन करें",
                welcome: "वापसी पर स्वागत है,",
                back: "डैशबोर्ड पर वापस जाएं",
                loading: "कार्यकर्ता लोड हो रहे हैं...",
                noWorkers: "कोई कार्यकर्ता नहीं मिला",
                refresh: "रिफ्रेश",
                addWorker: "नया कार्यकर्ता जोड़ें",
                edit: "संपादित करें",
                delete: "हटाएं",
                status: "स्थिति",
                active: "सक्रिय",
                inactive: "निष्क्रिय",
                specialization: "विशेषज्ञता",
                availability: "उपलब्धता",
                department: "विभाग",
                phone: "फोन",
                email: "ईमेल",
                address: "पता",
                aadhaar: "आधार नंबर",
                experience: "अनुभव",
                skills: "कौशल",
                assignedIssues: "असाइन मुद्दे",
                completedIssues: "पूर्ण मुद्दे",
                rating: "रेटिंग",
                actions: "कार्रवाई",
                confirmDelete: "क्या आप वाकई इस कार्यकर्ता को हटाना चाहते हैं?",
                deleteSuccess: "कार्यकर्ता सफलतापूर्वक हटाया गया",
                deleteError: "कार्यकर्ता हटाने में विफल",
                toggleStatus: "स्थिति बदलें",
                statusUpdated: "स्थिति सफलतापूर्वक अपडेट की गई",
                searchPlaceholder: "कार्यकर्ताओं को खोजें...",
                totalWorkers: "कुल कार्यकर्ता",
                activeWorkers: "सक्रिय कार्यकर्ता",
                availableWorkers: "अभी उपलब्ध",
                onLeave: "छुट्टी पर",
                viewProfile: "प्रोफ़ाइल देखें",
                assignIssue: "मुद्दा असाइन करें",
                workerDetails: "कार्यकर्ता विवरण",
                errors: {
                    noPermission: "कार्यकर्ताओं को देखने की आपकी अनुमति नहीं है.",
                    noPanchayat: "आपकी पंचायत आईडी सेट नहीं है.",
                    fetchError: "कार्यकर्ता लोड करने में विफल. कृपया पुन: प्रयास करें."
                },
                dashboard: "डैशबोर्ड",
                workers: "कार्यकर्ता",
                issues: "समस्याएँ",
                profile: "प्रोफ़ाइल",
                logout: "लॉगआउट"
            },
        };
        return L[locale] || L.en;
    }, [locale]);

    const [workers, setWorkers] = useState<Worker[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [panchayatId, setPanchayatId] = useState("");
    const [panchayatName, setPanchayatName] = useState("");
    const [user, setUser] = useState<any>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [authReady, setAuthReady] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const [stats, setStats] = useState({
        totalWorkers: 0,
        activeWorkers: 0,
        availableWorkers: 0,
        onLeave: 0
    });

    const fetchWorkers = async () => {
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

            // Fetch workers under this panchayat
            const workersQuery = query(
                collection(db, "workers"),
                where("panchayatId", "==", pid),
                orderBy("name", "asc")
            );

            const workersSnap = await getDocs(workersQuery);
            const workersList: Worker[] = [];

            let totalWorkers = 0;
            let activeWorkers = 0;
            let availableWorkers = 0;
            let onLeave = 0;

            for (const workerDoc of workersSnap.docs) {
                const data = workerDoc.data();

                const worker: Worker = {
                    id: workerDoc.id,
                    name: data.name || "",
                    phone: data.phone || "",
                    email: data.email,
                    specialization: data.specialization || data.category || "",
                    experience: data.experience || data.yearsOfExperience || "",
                    address: data.address || data.residentialAddress || "",
                    aadhaarNumber: data.aadhaarNumber || data.aadhaar || "",
                    panchayatId: data.panchayatId || pid,
                    isActive: data.isActive !== false,
                    createdAt: data.createdAt,
                    updatedAt: data.updatedAt,
                    availability: data.availability || "Available",
                    department: data.department || data.workType || "",
                    skills: data.skills || data.expertise || [],
                    assignedIssues: data.assignedIssues || 0,
                    completedIssues: data.completedIssues || 0,
                    rating: data.rating || 0
                };

                workersList.push(worker);

                totalWorkers++;
                if (worker.isActive) activeWorkers++;
                if (worker.availability === "Available") availableWorkers++;
                if (worker.availability === "On Leave") onLeave++;
            }

            setWorkers(workersList);
            setStats({
                totalWorkers,
                activeWorkers,
                availableWorkers,
                onLeave
            });

        } catch (err: any) {
            console.error("Error fetching workers:", err);
            setError(t.errors.fetchError);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchWorkers();
        toast.success("Workers list refreshed");
    };

    const handleDeleteWorker = async (workerId: string, workerName: string) => {
        if (!confirm(`${t.confirmDelete}\nWorker: ${workerName}`)) {
            return;
        }

        try {
            await deleteDoc(doc(db, "workers", workerId));

            // Remove from local state
            setWorkers(prev => prev.filter(w => w.id !== workerId));

            // Update stats
            const deletedWorker = workers.find(w => w.id === workerId);
            if (deletedWorker) {
                setStats(prev => ({
                    ...prev,
                    totalWorkers: prev.totalWorkers - 1,
                    activeWorkers: deletedWorker.isActive ? prev.activeWorkers - 1 : prev.activeWorkers,
                    availableWorkers: deletedWorker.availability === "Available" ? prev.availableWorkers - 1 : prev.availableWorkers,
                    onLeave: deletedWorker.availability === "On Leave" ? prev.onLeave - 1 : prev.onLeave
                }));
            }

            toast.success(t.deleteSuccess);
        } catch (error) {
            console.error("Error deleting worker:", error);
            toast.error(t.deleteError);
        }
    };

    const handleToggleStatus = async (workerId: string, currentStatus: boolean) => {
        try {
            await updateDoc(doc(db, "workers", workerId), {
                isActive: !currentStatus,
                updatedAt: new Date()
            });

            // Update local state
            setWorkers(prev => prev.map(w =>
                w.id === workerId ? { ...w, isActive: !currentStatus } : w
            ));

            // Update stats
            setStats(prev => ({
                ...prev,
                activeWorkers: currentStatus ? prev.activeWorkers - 1 : prev.activeWorkers + 1
            }));

            toast.success(t.statusUpdated);
        } catch (error) {
            console.error("Error updating worker status:", error);
            toast.error("Failed to update status");
        }
    };

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, () => setAuthReady(true));
        return () => unsub();
    }, []);

    useEffect(() => {
        if (authReady) {
            fetchWorkers();
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

    const filteredWorkers = useMemo(() => {
        if (!searchQuery.trim()) return workers;

        const query = searchQuery.toLowerCase();
        return workers.filter(worker =>
            worker.name?.toLowerCase().includes(query) ||
            worker.phone?.includes(query) ||
            worker.email?.toLowerCase().includes(query) ||
            worker.specialization?.toLowerCase().includes(query) ||
            worker.department?.toLowerCase().includes(query)
        );
    }, [workers, searchQuery]);

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
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="rounded-2xl bg-gradient-to-br from-white to-blue-50 p-4 shadow-lg">
                                <div className="h-4 w-16 bg-gradient-to-r from-blue-200 to-cyan-200 rounded mb-3 animate-pulse"></div>
                                <div className="h-8 w-12 bg-gradient-to-r from-blue-300 to-cyan-300 rounded animate-pulse"></div>
                            </div>
                        ))}
                    </div>

                    {/* Workers Grid Skeleton */}
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
                                {t.welcome} {user?.name || user?.email?.split('@')[0] || 'PDO Officer'}
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => router.push(`/${locale}/authority/pdo/workers/add`)}
                                className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold flex items-center gap-2 hover:shadow-lg"
                            >
                                <FiUserPlus className="w-4 h-4" />
                                {t.addWorker}
                            </button>
                            <button
                                onClick={handleRefresh}
                                disabled={refreshing}
                                className="p-2 rounded-xl border-2 border-blue-100 bg-white hover:bg-blue-50 transition-all duration-200"
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                    <div className="bg-white border-2 border-blue-100 rounded-2xl p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-blue-800/80">{t.totalWorkers}</span>
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <FiUsers className="w-4 h-4 text-blue-600" />
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-blue-900">{stats.totalWorkers}</div>
                        <div className="text-xs text-blue-700/60 mt-1">{t.workers}</div>
                        <div className="h-1 w-full bg-gradient-to-r from-blue-200 to-transparent rounded-full mt-2"></div>
                    </div>

                    <div className="bg-white border-2 border-green-100 rounded-2xl p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-green-800/80">{t.activeWorkers}</span>
                            <div className="p-2 bg-green-100 rounded-lg">
                                <FiCheckCircle className="w-4 h-4 text-green-600" />
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-green-900">{stats.activeWorkers}</div>
                        <div className="text-xs text-green-700/60 mt-1">{t.active}</div>
                        <div className="h-1 w-full bg-gradient-to-r from-green-200 to-transparent rounded-full mt-2"></div>
                    </div>

                    <div className="bg-white border-2 border-cyan-100 rounded-2xl p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-cyan-800/80">{t.availableWorkers}</span>
                            <div className="p-2 bg-cyan-100 rounded-lg">
                                <FiClock className="w-4 h-4 text-cyan-600" />
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-cyan-900">{stats.availableWorkers}</div>
                        <div className="text-xs text-cyan-700/60 mt-1">{t.availableWorkers}</div>
                        <div className="h-1 w-full bg-gradient-to-r from-cyan-200 to-transparent rounded-full mt-2"></div>
                    </div>

                    <div className="bg-white border-2 border-amber-100 rounded-2xl p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-amber-800/80">{t.onLeave}</span>
                            <div className="p-2 bg-amber-100 rounded-lg">
                                <FiUser className="w-4 h-4 text-amber-600" />
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-amber-900">{stats.onLeave}</div>
                        <div className="text-xs text-amber-700/60 mt-1">{t.onLeave}</div>
                        <div className="h-1 w-full bg-gradient-to-r from-amber-200 to-transparent rounded-full mt-2"></div>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="mb-6">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FiSearch className="h-5 w-5 text-blue-700/70" />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={t.searchPlaceholder}
                            className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-blue-100 bg-white text-blue-900 placeholder-blue-700/50 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent"
                        />
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

                {/* Workers Grid */}
                <div className="mb-8">
                    {filteredWorkers.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full flex items-center justify-center mb-6">
                                <FiUser className="w-12 h-12 text-blue-600/70" />
                            </div>
                            <h3 className="text-xl font-bold text-blue-900 mb-2">
                                {searchQuery ? "No matching workers found" : t.noWorkers}
                            </h3>
                            <p className="text-blue-700/70 mb-6">
                                {searchQuery ? "Try a different search term" : `Add workers to manage issues in ${panchayatName}`}
                            </p>
                            <button
                                onClick={() => router.push(`/${locale}/authority/pdo/workers/add`)}
                                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-semibold flex items-center gap-2 mx-auto"
                            >
                                <FiUserPlus className="w-4 h-4" />
                                {t.addWorker}
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredWorkers.map((worker) => (
                                <div
                                    key={worker.id}
                                    className="bg-white border-2 border-blue-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow hover:border-blue-200"
                                >
                                    {/* Worker Header */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-3 rounded-xl ${worker.isActive ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-gray-500 to-gray-600'} text-white`}>
                                                <FiUser className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-blue-900 text-lg">{worker.name}</h3>
                                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold text-white ${worker.isActive ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-gray-500 to-gray-600'}`}>
                                                        {worker.isActive ? t.active : t.inactive}
                                                    </span>
                                                    {worker.availability && (
                                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${worker.availability === "Available" ? 'bg-cyan-100 text-cyan-800' : 'bg-amber-100 text-amber-800'}`}>
                                                            {worker.availability}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => handleToggleStatus(worker.id, worker.isActive)}
                                                className="p-2 rounded-lg hover:bg-blue-50 text-blue-700/70 hover:text-blue-700"
                                                title={t.toggleStatus}
                                            >
                                                {worker.isActive ? <FiCheckCircle className="w-4 h-4" /> : <FiUser className="w-4 h-4" />}
                                            </button>
                                            <button
                                                onClick={() => router.push(`/${locale}/authority/pdo/workers/${worker.id}`)}
                                                className="p-2 rounded-lg hover:bg-blue-50 text-blue-700/70 hover:text-blue-700"
                                                title={t.viewProfile}
                                            >
                                                <FiEye className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Worker Info */}
                                    <div className="space-y-3 mb-4">
                                        <div className="flex items-center gap-2 text-sm text-blue-700/80">
                                            <FiPhone className="w-4 h-4 text-blue-600" />
                                            <span>{worker.phone}</span>
                                        </div>

                                        {worker.email && (
                                            <div className="flex items-center gap-2 text-sm text-blue-700/80">
                                                <FiMail className="w-4 h-4 text-blue-600" />
                                                <span className="truncate">{worker.email}</span>
                                            </div>
                                        )}

                                        {worker.specialization && (
                                            <div className="flex items-center gap-2 text-sm text-blue-700/80">
                                                <FiTool className="w-4 h-4 text-blue-600" />
                                                <span>{worker.specialization}</span>
                                            </div>
                                        )}

                                        {worker.department && (
                                            <div className="flex items-center gap-2 text-sm text-blue-700/80">
                                                <FiBriefcase className="w-4 h-4 text-blue-600" />
                                                <span>{worker.department}</span>
                                            </div>
                                        )}

                                        {worker.experience && (
                                            <div className="flex items-center gap-2 text-sm text-blue-700/80">
                                                <FiCalendar className="w-4 h-4 text-blue-600" />
                                                <span>{worker.experience} years experience</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Worker Stats */}
                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        <div className="bg-blue-50 rounded-xl p-3 text-center">
                                            <div className="text-xs font-semibold text-blue-800/80 mb-1">{t.assignedIssues}</div>
                                            <div className="text-lg font-bold text-blue-900">{worker.assignedIssues || 0}</div>
                                        </div>

                                        <div className="bg-green-50 rounded-xl p-3 text-center">
                                            <div className="text-xs font-semibold text-green-800/80 mb-1">{t.completedIssues}</div>
                                            <div className="text-lg font-bold text-green-900">{worker.completedIssues || 0}</div>
                                        </div>
                                    </div>

                                    {/* Skills */}
                                    {worker.skills && worker.skills.length > 0 && (
                                        <div className="mb-4">
                                            <div className="text-xs font-semibold text-blue-900 mb-2">{t.skills}</div>
                                            <div className="flex flex-wrap gap-1">
                                                {worker.skills.slice(0, 3).map((skill, index) => (
                                                    <span key={index} className="px-2 py-1 bg-cyan-100 text-cyan-800 text-xs rounded-lg">
                                                        {skill}
                                                    </span>
                                                ))}
                                                {worker.skills.length > 3 && (
                                                    <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-lg">
                                                        +{worker.skills.length - 3} more
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="pt-4 border-t border-blue-100">
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={() => router.push(`/${locale}/authority/pdo/workers/${worker.id}/edit`)}
                                                className="px-3 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 hover:shadow-md transition-all"
                                            >
                                                <FiEdit className="w-3 h-3" />
                                                {t.edit}
                                            </button>
                                            <button
                                                onClick={() => handleDeleteWorker(worker.id, worker.name)}
                                                className="px-3 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 hover:shadow-md transition-all"
                                            >
                                                <FiTrash2 className="w-3 h-3" />
                                                {t.delete}
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
                            <FiUsers className="w-5 h-5 text-blue-700" />
                            <span className="text-xs mt-1 font-medium text-blue-800 font-bold">
                                {t.workers}
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