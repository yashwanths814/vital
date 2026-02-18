// app/[locale]/authority/pdo/assignments/page.tsx
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
    updateDoc,
    addDoc,
    serverTimestamp
} from "firebase/firestore";
import { auth, db } from "../../../../../lib/firebase";
import Screen from "../../../../../components/Screen";
import {
    FiArrowLeft,
    FiUser,
    FiPhone,
    FiTool,
    FiClock,
    FiCheckCircle,
    FiAlertCircle,
    FiRefreshCw,
    FiLogOut,
    FiHome,
    FiFileText,
    FiUsers,
    FiBriefcase,
    FiMapPin,
    FiMail,
    FiCalendar,
    FiPlus,
    FiSend,
    FiX,
    FiSearch,
    FiFilter
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

interface Issue {
    id: string;
    title: string;
    description: string;
    status: string;
    category: string;
    priority: string;
    location?: string;
    createdAt?: any;
    panchayatId: string;
    reportedBy?: string;
    assignedTo?: string;
    assignedWorkerId?: string;
    images?: string[];
}

export default function PdoAssignmentsPage() {
    const router = useRouter();
    const params = useParams() as { locale?: string };
    const locale = (params?.locale || "en") as Locale;

    const t = useMemo(() => {
        const L: Record<Locale, any> = {
            en: {
                title: "Assign Issues",
                subtitle: "Assign issues to workers in your panchayat",
                welcome: "Welcome back,",
                back: "Back to Dashboard",
                loading: "Loading assignments...",
                refresh: "Refresh",
                noWorkers: "No workers available",
                noIssues: "No pending issues to assign",
                workers: "Available Workers",
                pendingIssues: "Pending Issues",
                assignedIssues: "Assigned Issues",
                selectWorker: "Select a worker",
                selectIssue: "Select an issue",
                assign: "Assign",
                assignNow: "Assign Now",
                cancel: "Cancel",
                searchWorker: "Search workers...",
                searchIssue: "Search issues...",
                filter: "Filter",
                clearFilter: "Clear Filter",
                status: "Status",
                specialization: "Specialization",
                availability: "Availability",
                experience: "Experience",
                skills: "Skills",
                phone: "Phone",
                email: "Email",
                department: "Department",
                address: "Address",
                assigned: "Assigned",
                completed: "Completed",
                rating: "Rating",
                active: "Active",
                inactive: "Inactive",
                available: "Available",
                busy: "Busy",
                onLeave: "On Leave",
                high: "High",
                medium: "Medium",
                low: "Low",
                critical: "Critical",
                assignSuccess: "Issue assigned successfully",
                assignError: "Failed to assign issue",
                confirmAssign: "Are you sure you want to assign this issue?",
                noSelection: "Please select both a worker and an issue",
                errors: {
                    noPermission: "You don't have permission to view assignments.",
                    noPanchayat: "Your panchayat ID is not set.",
                    fetchError: "Failed to load data. Please try again."
                },
                dashboard: "Dashboard",
                workers: "Workers",
                issues: "Issues",
                assignments: "Assignments",
                profile: "Profile",
                logout: "Logout"
            },
            kn: {
                title: "ಸಮಸ್ಯೆಗಳನ್ನು ನಿಯೋಜಿಸಿ",
                subtitle: "ನಿಮ್ಮ ಪಂಚಾಯತ್ನಲ್ಲಿ ಕೆಲಸಗಾರರಿಗೆ ಸಮಸ್ಯೆಗಳನ್ನು ನಿಯೋಜಿಸಿ",
                welcome: "ಮರಳಿ ಸ್ವಾಗತ,",
                back: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಹಿಂತಿರುಗಿ",
                loading: "ನಿಯೋಜನೆಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...",
                refresh: "ರಿಫ್ರೆಶ್",
                noWorkers: "ಯಾವುದೇ ಕೆಲಸಗಾರರು ಲಭ್ಯವಿಲ್ಲ",
                noIssues: "ನಿಯೋಜಿಸಲು ಯಾವುದೇ ಬಾಕಿ ಸಮಸ್ಯೆಗಳಿಲ್ಲ",
                workers: "ಲಭ್ಯವಿರುವ ಕೆಲಸಗಾರರು",
                pendingIssues: "ಬಾಕಿ ಇರುವ ಸಮಸ್ಯೆಗಳು",
                assignedIssues: "ನಿಯೋಜಿತ ಸಮಸ್ಯೆಗಳು",
                selectWorker: "ಕೆಲಸಗಾರರನ್ನು ಆಯ್ಕೆಮಾಡಿ",
                selectIssue: "ಸಮಸ್ಯೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ",
                assign: "ನಿಯೋಜಿಸಿ",
                assignNow: "ಈಗ ನಿಯೋಜಿಸಿ",
                cancel: "ರದ್ದುಮಾಡಿ",
                searchWorker: "ಕೆಲಸಗಾರರನ್ನು ಹುಡುಕಿ...",
                searchIssue: "ಸಮಸ್ಯೆಗಳನ್ನು ಹುಡುಕಿ...",
                filter: "ಫಿಲ್ಟರ್",
                clearFilter: "ಫಿಲ್ಟರ್ ತೆರವುಗೊಳಿಸಿ",
                status: "ಸ್ಥಿತಿ",
                specialization: "ವಿಶೇಷತೆ",
                availability: "ಲಭ್ಯತೆ",
                experience: "ಅನುಭವ",
                skills: "ಕೌಶಲ್ಯಗಳು",
                phone: "ಫೋನ್",
                email: "ಇಮೇಲ್",
                department: "ವಿಭಾಗ",
                address: "ವಿಳಾಸ",
                assigned: "ನಿಯೋಜಿತ",
                completed: "ಪೂರ್ಣಗೊಂಡ",
                rating: "ರೇಟಿಂಗ್",
                active: "ಸಕ್ರಿಯ",
                inactive: "ನಿಷ್ಕ್ರಿಯ",
                available: "ಲಭ್ಯವಿದೆ",
                busy: "ಬಿಜಿಯಾಗಿದೆ",
                onLeave: "ರಜೆಯ ಮೇಲೆ",
                high: "ಹೆಚ್ಚು",
                medium: "ಮಧ್ಯಮ",
                low: "ಕಡಿಮೆ",
                critical: "ನಿರ್ಣಾಯಕ",
                assignSuccess: "ಸಮಸ್ಯೆ ಯಶಸ್ವಿಯಾಗಿ ನಿಯೋಜಿಸಲಾಗಿದೆ",
                assignError: "ಸಮಸ್ಯೆಯನ್ನು ನಿಯೋಜಿಸಲು ವಿಫಲವಾಗಿದೆ",
                confirmAssign: "ಈ ಸಮಸ್ಯೆಯನ್ನು ನಿಯೋಜಿಸಲು ನೀವು ಖಚಿತವಾಗಿ ಬಯಸುವಿರಾ?",
                noSelection: "ದಯವಿಟ್ಟು ಕೆಲಸಗಾರ ಮತ್ತು ಸಮಸ್ಯೆ ಎರಡನ್ನೂ ಆಯ್ಕೆಮಾಡಿ",
                errors: {
                    noPermission: "ನಿಯೋಜನೆಗಳನ್ನು ವೀಕ್ಷಿಸಲು ನಿಮಗೆ ಅನುಮತಿ ಇಲ್ಲ.",
                    noPanchayat: "ನಿಮ್ಮ ಪಂಚಾಯತ್ ಐಡಿ ಹೊಂದಿಸಲಾಗಿಲ್ಲ.",
                    fetchError: "ಡೇಟಾವನ್ನು ಲೋಡ್ ಮಾಡಲು ವಿಫಲವಾಗಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ."
                },
                dashboard: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
                workers: "ಕೆಲಸಗಾರರು",
                issues: "ಸಮಸ್ಯೆಗಳು",
                assignments: "ನಿಯೋಜನೆಗಳು",
                profile: "ಪ್ರೊಫೈಲ್",
                logout: "ಲಾಗ್‌ಔಟ್"
            },
            hi: {
                title: "मुद्दे असाइन करें",
                subtitle: "अपनी पंचायत में कार्यकर्ताओं को मुद्दे असाइन करें",
                welcome: "वापसी पर स्वागत है,",
                back: "डैशबोर्ड पर वापस जाएं",
                loading: "असाइनमेंट लोड हो रहे हैं...",
                refresh: "रिफ्रेश",
                noWorkers: "कोई कार्यकर्ता उपलब्ध नहीं है",
                noIssues: "असाइन करने के लिए कोई लंबित मुद्दे नहीं हैं",
                workers: "उपलब्ध कार्यकर्ता",
                pendingIssues: "लंबित मुद्दे",
                assignedIssues: "असाइन किए गए मुद्दे",
                selectWorker: "कार्यकर्ता चुनें",
                selectIssue: "मुद्दा चुनें",
                assign: "असाइन करें",
                assignNow: "अभी असाइन करें",
                cancel: "रद्द करें",
                searchWorker: "कार्यकर्ता खोजें...",
                searchIssue: "मुद्दे खोजें...",
                filter: "फ़िल्टर",
                clearFilter: "फ़िल्टर साफ़ करें",
                status: "स्थिति",
                specialization: "विशेषज्ञता",
                availability: "उपलब्धता",
                experience: "अनुभव",
                skills: "कौशल",
                phone: "फोन",
                email: "ईमेल",
                department: "विभाग",
                address: "पता",
                assigned: "असाइन किए गए",
                completed: "पूर्ण किए गए",
                rating: "रेटिंग",
                active: "सक्रिय",
                inactive: "निष्क्रिय",
                available: "उपलब्ध",
                busy: "व्यस्त",
                onLeave: "छुट्टी पर",
                high: "उच्च",
                medium: "मध्यम",
                low: "निम्न",
                critical: "गंभीर",
                assignSuccess: "मुद्दा सफलतापूर्वक असाइन किया गया",
                assignError: "मुद्दा असाइन करने में विफल",
                confirmAssign: "क्या आप वाकई इस मुद्दे को असाइन करना चाहते हैं?",
                noSelection: "कृपया कार्यकर्ता और मुद्दा दोनों चुनें",
                errors: {
                    noPermission: "असाइनमेंट देखने की आपकी अनुमति नहीं है।",
                    noPanchayat: "आपकी पंचायत आईडी सेट नहीं है।",
                    fetchError: "डेटा लोड करने में विफल। कृपया पुन: प्रयास करें।"
                },
                dashboard: "डैशबोर्ड",
                workers: "कार्यकर्ता",
                issues: "समस्याएँ",
                assignments: "असाइनमेंट",
                profile: "प्रोफ़ाइल",
                logout: "लॉगआउट"
            },
        };
        return L[locale] || L.en;
    }, [locale]);

    const [workers, setWorkers] = useState<Worker[]>([]);
    const [pendingIssues, setPendingIssues] = useState<Issue[]>([]);
    const [assignedIssues, setAssignedIssues] = useState<Issue[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [panchayatId, setPanchayatId] = useState("");
    const [panchayatName, setPanchayatName] = useState("");
    const [user, setUser] = useState<any>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [authReady, setAuthReady] = useState(false);

    // Selection state
    const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
    const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
    const [showAssignModal, setShowAssignModal] = useState(false);

    // Search and filter
    const [workerSearch, setWorkerSearch] = useState("");
    const [issueSearch, setIssueSearch] = useState("");
    const [specializationFilter, setSpecializationFilter] = useState("");
    const [availabilityFilter, setAvailabilityFilter] = useState("");

    const fetchData = async () => {
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
                where("isActive", "==", true),
                orderBy("name", "asc")
            );

            const workersSnap = await getDocs(workersQuery);
            const workersList: Worker[] = [];

            workersSnap.forEach((doc) => {
                const data = doc.data();
                workersList.push({
                    id: doc.id,
                    name: data.name || "",
                    phone: data.phone || "",
                    email: data.email,
                    specialization: data.specialization || "",
                    experience: data.experience || "",
                    address: data.address || "",
                    aadhaarNumber: data.aadhaarNumber || "",
                    panchayatId: data.panchayatId,
                    isActive: data.isActive !== false,
                    createdAt: data.createdAt,
                    updatedAt: data.updatedAt,
                    availability: data.availability || "Available",
                    department: data.department || "",
                    skills: data.skills || [],
                    assignedIssues: data.assignedIssues || 0,
                    completedIssues: data.completedIssues || 0,
                    rating: data.rating || 0
                });
            });

            setWorkers(workersList);

            // Fetch pending issues (vi_verified status)
            const pendingQuery = query(
                collection(db, "issues"),
                where("panchayatId", "==", pid),
                where("status", "==", "vi_verified"),
                orderBy("createdAt", "desc")
            );

            const pendingSnap = await getDocs(pendingQuery);
            const pendingList: Issue[] = [];

            pendingSnap.forEach((doc) => {
                const data = doc.data();
                pendingList.push({
                    id: doc.id,
                    title: data.title || "Untitled Issue",
                    description: data.description || "",
                    status: data.status || "vi_verified",
                    category: data.category || "Other",
                    priority: data.priority || "medium",
                    location: data.location || "",
                    createdAt: data.createdAt,
                    panchayatId: data.panchayatId,
                    reportedBy: data.reportedBy,
                    assignedTo: data.assignedTo,
                    assignedWorkerId: data.assignedWorkerId,
                    images: data.images || []
                });
            });

            setPendingIssues(pendingList);

            // Fetch assigned issues (pdo_assigned status)
            const assignedQuery = query(
                collection(db, "issues"),
                where("panchayatId", "==", pid),
                where("status", "==", "pdo_assigned"),
                orderBy("createdAt", "desc")
            );

            const assignedSnap = await getDocs(assignedQuery);
            const assignedList: Issue[] = [];

            assignedSnap.forEach((doc) => {
                const data = doc.data();
                assignedList.push({
                    id: doc.id,
                    title: data.title || "Untitled Issue",
                    description: data.description || "",
                    status: data.status || "pdo_assigned",
                    category: data.category || "Other",
                    priority: data.priority || "medium",
                    location: data.location || "",
                    createdAt: data.createdAt,
                    panchayatId: data.panchayatId,
                    reportedBy: data.reportedBy,
                    assignedTo: data.assignedTo,
                    assignedWorkerId: data.assignedWorkerId,
                    images: data.images || []
                });
            });

            setAssignedIssues(assignedList);

        } catch (err: any) {
            console.error("Error fetching data:", err);
            setError(t.errors.fetchError);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchData();
        toast.success("Data refreshed");
    };

    const handleAssignIssue = async () => {
        if (!selectedWorker || !selectedIssue) {
            toast.error(t.noSelection);
            return;
        }

        if (!confirm(t.confirmAssign)) {
            return;
        }

        try {
            // Update the issue
            const issueRef = doc(db, "issues", selectedIssue.id);
            await updateDoc(issueRef, {
                status: "pdo_assigned",
                assignedWorkerId: selectedWorker.id,
                assignedTo: selectedWorker.name,
                assignedAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            // Update worker's assigned issues count
            const workerRef = doc(db, "workers", selectedWorker.id);
            await updateDoc(workerRef, {
                assignedIssues: (selectedWorker.assignedIssues || 0) + 1,
                updatedAt: serverTimestamp()
            });

            // Create assignment record
            await addDoc(collection(db, "assignments"), {
                issueId: selectedIssue.id,
                issueTitle: selectedIssue.title,
                workerId: selectedWorker.id,
                workerName: selectedWorker.name,
                panchayatId,
                assignedBy: user?.uid,
                assignedByName: user?.name || "PDO Officer",
                assignedAt: serverTimestamp(),
                status: "active",
                notes: ""
            });

            toast.success(t.assignSuccess);

            // Refresh data
            fetchData();

            // Reset selection
            setSelectedWorker(null);
            setSelectedIssue(null);
            setShowAssignModal(false);

        } catch (error) {
            console.error("Error assigning issue:", error);
            toast.error(t.assignError);
        }
    };

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, () => setAuthReady(true));
        return () => unsub();
    }, []);

    useEffect(() => {
        if (authReady) {
            fetchData();
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

    // Filter workers
    const filteredWorkers = useMemo(() => {
        return workers.filter(worker => {
            // Search filter
            const matchesSearch = workerSearch === "" ||
                worker.name.toLowerCase().includes(workerSearch.toLowerCase()) ||
                worker.phone.includes(workerSearch) ||
                worker.specialization?.toLowerCase().includes(workerSearch.toLowerCase()) ||
                worker.department?.toLowerCase().includes(workerSearch.toLowerCase());

            // Specialization filter
            const matchesSpecialization = specializationFilter === "" ||
                worker.specialization === specializationFilter;

            // Availability filter
            const matchesAvailability = availabilityFilter === "" ||
                worker.availability === availabilityFilter;

            return matchesSearch && matchesSpecialization && matchesAvailability;
        });
    }, [workers, workerSearch, specializationFilter, availabilityFilter]);

    // Filter pending issues
    const filteredIssues = useMemo(() => {
        return pendingIssues.filter(issue => {
            const matchesSearch = issueSearch === "" ||
                issue.title.toLowerCase().includes(issueSearch.toLowerCase()) ||
                issue.description.toLowerCase().includes(issueSearch.toLowerCase()) ||
                issue.category.toLowerCase().includes(issueSearch.toLowerCase());

            return matchesSearch;
        });
    }, [pendingIssues, issueSearch]);

    // Get unique specializations for filter
    const specializations = useMemo(() => {
        const unique = new Set(workers.map(w => w.specialization).filter(Boolean));
        return Array.from(unique);
    }, [workers]);

    if (loading) {
        return (
            <Screen padded>
                <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-4">
                    {/* Header Skeleton */}
                    <div className="mb-8">
                        <div className="h-8 w-64 bg-gradient-to-r from-purple-200 to-pink-200 rounded-lg mb-2 animate-pulse"></div>
                        <div className="h-4 w-48 bg-gradient-to-r from-purple-100 to-pink-100 rounded animate-pulse"></div>
                    </div>

                    {/* Content Skeleton */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Workers Skeleton */}
                        <div className="space-y-4">
                            <div className="h-6 w-40 bg-gradient-to-r from-purple-200 to-pink-200 rounded animate-pulse mb-4"></div>
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="bg-white border-2 border-purple-100 rounded-2xl p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="h-12 w-12 bg-gradient-to-r from-purple-200 to-pink-200 rounded-xl animate-pulse"></div>
                                        <div className="flex-1">
                                            <div className="h-5 w-32 bg-gradient-to-r from-purple-200 to-pink-200 rounded mb-2 animate-pulse"></div>
                                            <div className="h-4 w-24 bg-gradient-to-r from-purple-100 to-pink-100 rounded animate-pulse"></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Issues Skeleton */}
                        <div className="space-y-4">
                            <div className="h-6 w-40 bg-gradient-to-r from-purple-200 to-pink-200 rounded animate-pulse mb-4"></div>
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="bg-white border-2 border-purple-100 rounded-2xl p-4">
                                    <div className="h-5 w-48 bg-gradient-to-r from-purple-200 to-pink-200 rounded mb-3 animate-pulse"></div>
                                    <div className="h-4 w-full bg-gradient-to-r from-purple-100 to-pink-100 rounded mb-2 animate-pulse"></div>
                                    <div className="h-4 w-3/4 bg-gradient-to-r from-purple-100 to-pink-100 rounded animate-pulse"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </Screen>
        );
    }

    return (
        <Screen padded>
            <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-white p-4 pb-24">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-2xl font-bold text-purple-900">
                                {t.title}
                            </h1>
                            <p className="text-purple-700/80 mt-1 text-sm">
                                {panchayatName}
                            </p>
                            <p className="text-purple-600/70 text-sm mt-1 flex items-center gap-1">
                                <FiUser className="w-3 h-3" />
                                {t.welcome} {user?.name || user?.email?.split('@')[0] || 'PDO Officer'}
                            </p>
                        </div>

                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="p-2 rounded-xl border-2 border-purple-100 bg-white hover:bg-purple-50 transition-all duration-200"
                            title={t.refresh}
                        >
                            <FiRefreshCw className={`w-5 h-5 text-purple-700 ${refreshing ? 'animate-spin' : ''}`} />
                        </button>
                    </div>

                    <button
                        onClick={() => router.push(`/${locale}/authority/pdo/dashboard`)}
                        className="flex items-center gap-2 text-purple-700 hover:text-purple-900 mb-3 text-sm"
                    >
                        <FiArrowLeft className="w-4 h-4" />
                        {t.back}
                    </button>
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

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Workers Column */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-purple-900 flex items-center gap-2">
                                <FiUsers className="w-5 h-5" />
                                {t.workers} ({filteredWorkers.length})
                            </h2>
                            <div className="flex gap-2">
                                <select
                                    value={specializationFilter}
                                    onChange={(e) => setSpecializationFilter(e.target.value)}
                                    className="px-3 py-2 text-sm border-2 border-purple-100 rounded-xl bg-white text-purple-900"
                                >
                                    <option value="">{t.specialization}</option>
                                    {specializations.map(spec => (
                                        <option key={spec} value={spec}>{spec}</option>
                                    ))}
                                </select>
                                <select
                                    value={availabilityFilter}
                                    onChange={(e) => setAvailabilityFilter(e.target.value)}
                                    className="px-3 py-2 text-sm border-2 border-purple-100 rounded-xl bg-white text-purple-900"
                                >
                                    <option value="">{t.availability}</option>
                                    <option value="Available">{t.available}</option>
                                    <option value="Busy">{t.busy}</option>
                                    <option value="On Leave">{t.onLeave}</option>
                                </select>
                            </div>
                        </div>

                        {/* Search Workers */}
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FiSearch className="h-5 w-5 text-purple-700/70" />
                            </div>
                            <input
                                type="text"
                                value={workerSearch}
                                onChange={(e) => setWorkerSearch(e.target.value)}
                                placeholder={t.searchWorker}
                                className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-purple-100 bg-white text-purple-900 placeholder-purple-700/50 focus:outline-none focus:ring-2 focus:ring-purple-200"
                            />
                        </div>

                        {/* Workers List */}
                        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                            {filteredWorkers.length === 0 ? (
                                <div className="text-center py-8 bg-white border-2 border-purple-100 rounded-2xl">
                                    <FiUsers className="w-12 h-12 text-purple-300 mx-auto mb-3" />
                                    <p className="text-purple-900 font-semibold">{t.noWorkers}</p>
                                </div>
                            ) : (
                                filteredWorkers.map((worker) => (
                                    <div
                                        key={worker.id}
                                        onClick={() => setSelectedWorker(worker)}
                                        className={`bg-white border-2 rounded-2xl p-4 cursor-pointer transition-all hover:shadow-md ${
                                            selectedWorker?.id === worker.id
                                                ? 'border-purple-500 bg-purple-50'
                                                : 'border-purple-100 hover:border-purple-200'
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`p-3 rounded-xl ${
                                                worker.availability === "Available"
                                                    ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                                                    : worker.availability === "Busy"
                                                    ? 'bg-gradient-to-r from-orange-500 to-red-600'
                                                    : 'bg-gradient-to-r from-gray-500 to-gray-600'
                                            } text-white`}>
                                                <FiUser className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <h3 className="font-bold text-purple-900">{worker.name}</h3>
                                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                            <span className={`px-2 py-1 rounded-full text-xs font-bold text-white ${
                                                                worker.availability === "Available"
                                                                    ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                                                                    : worker.availability === "Busy"
                                                                    ? 'bg-gradient-to-r from-orange-500 to-red-600'
                                                                    : 'bg-gradient-to-r from-gray-500 to-gray-600'
                                                            }`}>
                                                                {worker.availability === "Available" ? t.available :
                                                                 worker.availability === "Busy" ? t.busy : t.onLeave}
                                                            </span>
                                                            {worker.specialization && (
                                                                <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                                                                    {worker.specialization}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-xs text-purple-600/70">{t.assigned}</div>
                                                        <div className="font-bold text-purple-900">{worker.assignedIssues || 0}</div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2 mt-3">
                                                    <div className="flex items-center gap-1 text-xs text-purple-700/70">
                                                        <FiPhone className="w-3 h-3" />
                                                        <span>{worker.phone}</span>
                                                    </div>
                                                    {worker.department && (
                                                        <div className="flex items-center gap-1 text-xs text-purple-700/70">
                                                            <FiBriefcase className="w-3 h-3" />
                                                            <span>{worker.department}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {worker.skills && worker.skills.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                        {worker.skills.slice(0, 3).map((skill, idx) => (
                                                            <span key={idx} className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded-lg">
                                                                {skill}
                                                            </span>
                                                        ))}
                                                        {worker.skills.length > 3 && (
                                                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-lg">
                                                                +{worker.skills.length - 3}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Issues Column */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-purple-900 flex items-center gap-2">
                                <FiFileText className="w-5 h-5" />
                                {t.pendingIssues} ({filteredIssues.length})
                            </h2>
                        </div>

                        {/* Search Issues */}
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FiSearch className="h-5 w-5 text-purple-700/70" />
                            </div>
                            <input
                                type="text"
                                value={issueSearch}
                                onChange={(e) => setIssueSearch(e.target.value)}
                                placeholder={t.searchIssue}
                                className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-purple-100 bg-white text-purple-900 placeholder-purple-700/50 focus:outline-none focus:ring-2 focus:ring-purple-200"
                            />
                        </div>

                        {/* Pending Issues List */}
                        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                            {filteredIssues.length === 0 ? (
                                <div className="text-center py-8 bg-white border-2 border-purple-100 rounded-2xl">
                                    <FiFileText className="w-12 h-12 text-purple-300 mx-auto mb-3" />
                                    <p className="text-purple-900 font-semibold">{t.noIssues}</p>
                                </div>
                            ) : (
                                filteredIssues.map((issue) => (
                                    <div
                                        key={issue.id}
                                        onClick={() => setSelectedIssue(issue)}
                                        className={`bg-white border-2 rounded-2xl p-4 cursor-pointer transition-all hover:shadow-md ${
                                            selectedIssue?.id === issue.id
                                                ? 'border-purple-500 bg-purple-50'
                                                : 'border-purple-100 hover:border-purple-200'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <h3 className="font-bold text-purple-900">{issue.title}</h3>
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold text-white ${
                                                issue.priority === 'high' ? 'bg-gradient-to-r from-red-500 to-pink-600' :
                                                issue.priority === 'medium' ? 'bg-gradient-to-r from-orange-500 to-amber-600' :
                                                issue.priority === 'critical' ? 'bg-gradient-to-r from-purple-600 to-indigo-600' :
                                                'bg-gradient-to-r from-green-500 to-emerald-600'
                                            }`}>
                                                {issue.priority === 'high' ? t.high :
                                                 issue.priority === 'medium' ? t.medium :
                                                 issue.priority === 'critical' ? t.critical : t.low}
                                            </span>
                                        </div>

                                        <p className="text-sm text-purple-700/70 mb-3 line-clamp-2">
                                            {issue.description}
                                        </p>

                                        <div className="flex items-center gap-2 text-xs text-purple-600/70">
                                            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-lg">
                                                {issue.category}
                                            </span>
                                            {issue.location && (
                                                <>
                                                    <FiMapPin className="w-3 h-3" />
                                                    <span>{issue.location}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Assigned Issues Summary */}
                        {assignedIssues.length > 0 && (
                            <div className="mt-6">
                                <h3 className="text-md font-bold text-purple-900 mb-3 flex items-center gap-2">
                                    <FiCheckCircle className="w-4 h-4 text-green-600" />
                                    {t.assignedIssues} ({assignedIssues.length})
                                </h3>
                                <div className="space-y-2">
                                    {assignedIssues.slice(0, 3).map((issue) => (
                                        <div key={issue.id} className="bg-green-50 border-2 border-green-100 rounded-xl p-3">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <p className="font-semibold text-green-900 text-sm">{issue.title}</p>
                                                    <p className="text-xs text-green-700/70 mt-1">
                                                        Assigned to: {issue.assignedTo}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {assignedIssues.length > 3 && (
                                        <p className="text-xs text-purple-600/70 text-center">
                                            +{assignedIssues.length - 3} more assigned issues
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Assign Button */}
                {selectedWorker && selectedIssue && (
                    <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-10">
                        <button
                            onClick={() => setShowAssignModal(true)}
                            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all hover:scale-105"
                        >
                            <FiSend className="w-5 h-5" />
                            {t.assignNow}
                        </button>
                    </div>
                )}

                {/* Assign Modal */}
                {showAssignModal && selectedWorker && selectedIssue && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-purple-900">{t.confirmAssign}</h3>
                                <button
                                    onClick={() => setShowAssignModal(false)}
                                    className="p-2 hover:bg-purple-50 rounded-xl"
                                >
                                    <FiX className="w-5 h-5 text-purple-700" />
                                </button>
                            </div>

                            <div className="space-y-4 mb-6">
                                {/* Worker Info */}
                                <div className="bg-purple-50 rounded-2xl p-4">
                                    <div className="text-xs font-semibold text-purple-700/70 mb-2">{t.selectWorker}</div>
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl text-white">
                                            <FiUser className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-purple-900">{selectedWorker.name}</p>
                                            <p className="text-sm text-purple-700/70">{selectedWorker.specialization} • {selectedWorker.phone}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Issue Info */}
                                <div className="bg-purple-50 rounded-2xl p-4">
                                    <div className="text-xs font-semibold text-purple-700/70 mb-2">{t.selectIssue}</div>
                                    <div>
                                        <p className="font-bold text-purple-900">{selectedIssue.title}</p>
                                        <p className="text-sm text-purple-700/70 mt-1 line-clamp-2">{selectedIssue.description}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-lg">
                                                {selectedIssue.category}
                                            </span>
                                            <span className={`px-2 py-1 rounded-lg text-xs font-bold text-white ${
                                                selectedIssue.priority === 'high' ? 'bg-gradient-to-r from-red-500 to-pink-600' :
                                                selectedIssue.priority === 'medium' ? 'bg-gradient-to-r from-orange-500 to-amber-600' :
                                                selectedIssue.priority === 'critical' ? 'bg-gradient-to-r from-purple-600 to-indigo-600' :
                                                'bg-gradient-to-r from-green-500 to-emerald-600'
                                            }`}>
                                                {selectedIssue.priority === 'high' ? t.high :
                                                 selectedIssue.priority === 'medium' ? t.medium :
                                                 selectedIssue.priority === 'critical' ? t.critical : t.low}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowAssignModal(false)}
                                    className="flex-1 px-4 py-3 border-2 border-purple-200 text-purple-700 rounded-xl font-semibold hover:bg-purple-50 transition-all"
                                >
                                    {t.cancel}
                                </button>
                                <button
                                    onClick={handleAssignIssue}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition-all"
                                >
                                    <FiSend className="w-4 h-4" />
                                    {t.assign}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Bottom Navigation */}
                <div className="fixed bottom-4 left-4 right-4 bg-white/90 backdrop-blur-lg border-2 border-purple-100 rounded-2xl p-2 shadow-xl">
                    <div className="grid grid-cols-5 gap-1">
                        <button
                            className="flex flex-col items-center justify-center p-3 rounded-xl transition-all hover:bg-purple-50"
                            onClick={() => router.push(`/${locale}/authority/pdo/dashboard`)}
                        >
                            <FiHome className="w-5 h-5 text-purple-600/70" />
                            <span className="text-xs mt-1 font-medium text-purple-700/70">
                                {t.dashboard}
                            </span>
                        </button>

                        <button
                            className="flex flex-col items-center justify-center p-3 rounded-xl transition-all hover:bg-purple-50"
                            onClick={() => router.push(`/${locale}/authority/pdo/workers`)}
                        >
                            <FiUsers className="w-5 h-5 text-purple-600/70" />
                            <span className="text-xs mt-1 font-medium text-purple-700/70">
                                {t.workers}
                            </span>
                        </button>

                        <button
                            className="flex flex-col items-center justify-center p-3 rounded-xl transition-all bg-gradient-to-b from-purple-100 to-indigo-50"
                        >
                            <FiSend className="w-5 h-5 text-purple-700" />
                            <span className="text-xs mt-1 font-medium text-purple-800 font-bold">
                                {t.assignments}
                            </span>
                        </button>

                        <button
                            className="flex flex-col items-center justify-center p-3 rounded-xl transition-all hover:bg-purple-50"
                            onClick={() => router.push(`/${locale}/authority/pdo/issues`)}
                        >
                            <FiFileText className="w-5 h-5 text-purple-600/70" />
                            <span className="text-xs mt-1 font-medium text-purple-700/70">
                                {t.issues}
                            </span>
                        </button>

                        <button
                            className="flex flex-col items-center justify-center p-3 rounded-xl transition-all hover:bg-purple-50"
                            onClick={() => router.push(`/${locale}/authority/pdo/profile`)}
                        >
                            <FiUser className="w-5 h-5 text-purple-600/70" />
                            <span className="text-xs mt-1 font-medium text-purple-700/70">
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
