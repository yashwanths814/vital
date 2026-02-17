"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Screen from "../../../../../components/Screen";
import { auth, db } from "../../../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
    doc,
    getDoc,
    serverTimestamp,
    Timestamp,
    updateDoc,
    collection,
    query,
    orderBy,
    onSnapshot,
    addDoc,
} from "firebase/firestore";

// Icons
import {
  FiArrowLeft,
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
  FiMapPin,
  FiFolder,
  FiRefreshCw,
  FiMessageSquare,
  FiUser,
  FiFlag,
  FiHome,
  FiUsers,
  FiFileText,
  FiDownload,
  FiExternalLink,
  FiSend,
  FiXCircle,
  FiUserPlus,
  FiCamera,
  FiUpload,
  FiImage,
  FiChevronDown,
  FiChevronUp,
  FiActivity,
} from "react-icons/fi";

type Locale = "en" | "kn" | "hi";

type Issue = {
    id?: string;
    title?: string;
    category?: string;
    status?: string;
    description?: string;
    address?: string;
    specificLocation?: string;
    
    panchayatId?: string;
    panchayatName?: string;
    villageName?: string;
    
    photoUrl?: string;
    photoBase64?: string;
    gpsLatitude?: number;
    gpsLongitude?: number;
    
    createdAt?: any;
    updatedAt?: any;
    
    villagerId?: string;
    reporterName?: string;
    
    assignedWorker?: {
        name?: string;
        phone?: string;
        email?: string;
    };
    
    viVerifiedAt?: any;
    viVerifiedBy?: string;
    viVerificationNotes?: string;
    
    currentStatus?: string;
    
    resolvedPhoto?: string;
    rejectionReason?: string;
    
    assignedAt?: any;
    inProgressAt?: any;
    resolvedAt?: any;
    closedAt?: any;
};

type VillagerInfo = {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    profilePhoto?: string;
    createdAt?: any;
};

type AuthorityInfo = {
    name?: string;
    role?: string;
    panchayatId?: string;
};

type Message = {
    id?: string;
    text: string;
    senderId: string;
    senderName: string;
    senderRole: string;
    timestamp: any;
    type?: string;
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

function formatRelativeDate(dateString: string, t: any) {
    if (!dateString) return "";
    
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        
        if (diffMinutes < 1) return t.justNow;
        if (diffMinutes < 60) return `${diffMinutes} ${t.minutesAgo}`;
        if (diffHours < 24) return `${diffHours} ${t.hoursAgo}`;
        if (diffDays === 0) return `${t.today}, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        if (diffDays === 1) return `${t.yesterday}, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        if (diffDays < 7) return `${diffDays} ${t.daysAgo}`;
        
        return date.toLocaleDateString('en-IN', { 
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    } catch {
        return dateString;
    }
}

function getStatusColor(status: string) {
    switch (status?.toLowerCase()) {
        case 'submitted': return 'bg-gradient-to-r from-yellow-500 to-amber-600';
        case 'verified': return 'bg-gradient-to-r from-purple-500 to-violet-600';
        case 'assigned': return 'bg-gradient-to-r from-blue-500 to-cyan-600';
        case 'in_progress': return 'bg-gradient-to-r from-indigo-500 to-blue-600';
        case 'resolved': return 'bg-gradient-to-r from-green-500 to-emerald-600';
        case 'closed': return 'bg-gradient-to-r from-green-600 to-emerald-700';
        case 'rejected': return 'bg-gradient-to-r from-red-500 to-pink-600';
        default: return 'bg-gradient-to-r from-gray-500 to-gray-600';
    }
}

function getStatusIcon(status: string) {
    switch (status?.toLowerCase()) {
        case 'submitted': return FiAlertCircle;
        case 'verified': return FiCheckCircle;
        case 'assigned': return FiUsers;
        case 'in_progress': return FiClock;
        case 'resolved': return FiCheckCircle;
        case 'closed': return FiCheckCircle;
        case 'rejected': return FiXCircle;
        default: return FiAlertCircle;
    }
}

export default function ViIssueDetailsPage() {
    const router = useRouter();
    const params = useParams() as { locale?: string; id?: string };
    const locale = ((params?.locale as Locale) || "en") as Locale;
    const issueId = String(params?.id || "");

    // State management
    const [authReady, setAuthReady] = useState(false);
    const [uid, setUid] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState("");
    const [success, setSuccess] = useState("");
    const [issue, setIssue] = useState<Issue | null>(null);
    const [authorityInfo, setAuthorityInfo] = useState<AuthorityInfo | null>(null);
    const [villagerInfo, setVillagerInfo] = useState<VillagerInfo | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [sendingMessage, setSendingMessage] = useState(false);
    
    // Status update state
    const [showStatusUpdate, setShowStatusUpdate] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState("");
    const [workerContact, setWorkerContact] = useState({
        name: "",
        phone: "",
        email: ""
    });
    const [resolvedPhoto, setResolvedPhoto] = useState<File | null>(null);
    const [resolvedPhotoPreview, setResolvedPhotoPreview] = useState("");
    const [showChat, setShowChat] = useState(false);
    
    // UI toggles
    const [showDescription, setShowDescription] = useState(false);
    const [showVillagerInfo, setShowVillagerInfo] = useState(false);
    const [verificationNotes, setVerificationNotes] = useState("");
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState("");

    const t = useMemo(() => {
        const L: Record<Locale, any> = {
            en: {
                title: "Issue Details - Village Incharge",
                back: "Back",
                loading: "Loading details...",
                notFound: "Issue not found.",
                notAllowed: "You are not authorized as Village Incharge.",
                status: "Status",
                category: "Category",
                panchayat: "Panchayat",
                village: "Village",
                postedOn: "Posted on",
                address: "Address",
                specificLocation: "Specific Location",
                actionsHeading: "Actions",
                actions: {
                    verify: "Verify & Forward to PDO",
                    verifyWithNotes: "Verify with Notes",
                    reject: "Reject Issue",
                    refresh: "Refresh",
                    openChat: "Open Chat",
                    viewMap: "View on Map",
                    updateStatus: "Update Status"
                },
                statusOptions: {
                    verified: "Verified",
                    assigned: "Worker Assigned",
                    in_progress: "In Progress",
                    resolved: "Resolved",
                    closed: "Closed"
                },
                statusForms: {
                    assigned: "Assign Worker",
                    in_progress: "Mark as In Progress",
                    resolved: "Mark as Resolved"
                },
                workerDetails: {
                    name: "Worker Name",
                    phone: "Worker Phone",
                    email: "Worker Email (Optional)"
                },
                resolution: {
                    uploadPhoto: "Upload Resolution Photo",
                    takePhoto: "Take Photo",
                    choosePhoto: "Choose from Gallery",
                },
                chat: {
                    title: "Chat with Villager",
                    placeholder: "Type your message...",
                    send: "Send",
                    noMessages: "No messages yet. Start the conversation."
                },
                toast: {
                    verified: "✓ Verified and forwarded to PDO",
                    rejected: "✓ Issue rejected successfully",
                    notesSaved: "✓ Verification notes saved",
                    statusUpdated: "✓ Status updated successfully",
                    messageSent: "✓ Message sent successfully",
                },
                errors: {
                    perm: "Missing or insufficient permissions.",
                    generic: "Failed to process request.",
                    workerRequired: "Worker contact details are required",
                    photoRequired: "Resolution photo is required"
                },
                details: "Issue Details",
                evidence: "Photo Evidence",
                gpsCoordinates: "GPS Coordinates",
                verificationNotes: "Verification Notes",
                addNotes: "Add verification notes...",
                rejectTitle: "Reject Issue",
                rejectConfirm: "Are you sure you want to reject this issue?",
                rejectPlaceholder: "Reason for rejection...",
                rejectRequired: "Please provide a reason for rejection",
                
                villagerInfo: "Reporter Information",
                villagerName: "Name",
                villagerPhone: "Phone",
                villagerEmail: "Email",
                villagerSince: "Member Since",
                
                today: "Today",
                yesterday: "Yesterday",
                daysAgo: "days ago",
                hoursAgo: "hours ago",
                minutesAgo: "minutes ago",
                justNow: "just now",
            },
            kn: {
                title: "ಸಮಸ್ಯೆ ವಿವರಗಳು - ಗ್ರಾಪ್ರಭು",
                back: "ಹಿಂದೆ",
                loading: "ವಿವರಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...",
                notFound: "ಸಮಸ್ಯೆ ಸಿಗಲಿಲ್ಲ.",
                notAllowed: "ನೀವು ಗ್ರಾಪ್ರಭುವಾಗಿ ಅಧಿಕೃತರಲ್ಲ.",
                status: "ಸ್ಥಿತಿ",
                category: "ವರ್ಗ",
                panchayat: "ಪಂಚಾಯತ್",
                village: "ಗ್ರಾಮ",
                postedOn: "ದಿನಾಂಕ",
                address: "ವಿಳಾಸ",
                specificLocation: "ನಿರ್ದಿಷ್ಟ ಸ್ಥಳ",
                actionsHeading: "ಕ್ರಿಯೆಗಳು",
                actions: {
                    verify: "ಪರಿಶೀಲಿಸಿ & PDO ಗೆ ಕಳುಹಿಸಿ",
                    verifyWithNotes: "ಟಿಪ್ಪಣಿಗಳೊಂದಿಗೆ ಪರಿಶೀಲಿಸಿ",
                    reject: "ಸಮಸ್ಯೆ ತಿರಸ್ಕರಿಸಿ",
                    refresh: "ರಿಫ್ರೆಶ್",
                    openChat: "ಚಾಟ್ ತೆರೆಯಿರಿ",
                    viewMap: "ನಕ್ಷೆಯಲ್ಲಿ ನೋಡಿ",
                    updateStatus: "ಸ್ಥಿತಿಯನ್ನು ನವೀಕರಿಸಿ"
                },
                statusOptions: {
                    verified: "ಪರಿಶೀಲಿಸಲಾಗಿದೆ",
                    assigned: "ಕೆಲಸಗಾರ ನಿಯೋಜನೆ",
                    in_progress: "ಕಾರ್ಯ ಪ್ರಗತಿಯಲ್ಲಿ",
                    resolved: "ಬಗೆಹರಿಸಲಾಗಿದೆ",
                    closed: "ಮುಚ್ಚಲಾಗಿದೆ"
                },
                statusForms: {
                    assigned: "ಕೆಲಸಗಾರ ನಿಯೋಜಿಸಿ",
                    in_progress: "ಪ್ರಗತಿಯಲ್ಲಿ ಎಂದು ಗುರುತಿಸಿ",
                    resolved: "ಬಗೆಹರಿಸಲಾಗಿದೆ ಎಂದು ಗುರುತಿಸಿ"
                },
                workerDetails: {
                    name: "ಕೆಲಸಗಾರರ ಹೆಸರು",
                    phone: "ಕೆಲಸಗಾರರ ಫೋನ್",
                    email: "ಕೆಲಸಗಾರರ ಇಮೇಲ್ (ಐಚ್ಛಿಕ)"
                },
                resolution: {
                    uploadPhoto: "ಪರಿಹಾರ ಫೋಟೋ ಅಪ್ಲೋಡ್ ಮಾಡಿ",
                    takePhoto: "ಫೋಟೋ ತೆಗೆದುಕೊಳ್ಳಿ",
                    choosePhoto: "ಗ್ಯಾಲರಿಯಿಂದ ಆಯ್ಕೆಮಾಡಿ",
                },
                chat: {
                    title: "ಗ್ರಾಮಸ್ಥರೊಂದಿಗೆ ಚಾಟ್",
                    placeholder: "ನಿಮ್ಮ ಸಂದೇಶವನ್ನು ಟೈಪ್ ಮಾಡಿ...",
                    send: "ಕಳುಹಿಸಿ",
                    noMessages: "ಇನ್ನೂ ಸಂದೇಶಗಳಿಲ್ಲ. ಸಂಭಾಷಣೆಯನ್ನು ಪ್ರಾರಂಭಿಸಿ."
                },
                toast: {
                    verified: "✓ ಪರಿಶೀಲಿಸಲಾಗಿದೆ ಮತ್ತು PDO ಗೆ ಕಳುಹಿಸಲಾಗಿದೆ",
                    rejected: "✓ ಸಮಸ್ಯೆ ವಿಫಲವಾಗಿ ತಿರಸ್ಕರಿಸಲಾಗಿದೆ",
                    notesSaved: "✓ ಪರಿಶೀಲನಾ ಟಿಪ್ಪಣಿಗಳು ಉಳಿಸಲಾಗಿದೆ",
                    statusUpdated: "✓ ಸ್ಥಿತಿ ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ",
                    messageSent: "✓ ಸಂದೇಶ ಯಶಸ್ವಿಯಾಗಿ ಕಳುಹಿಸಲಾಗಿದೆ",
                },
                errors: {
                    perm: "ಅನುಮತಿ ಸಾಲದು.",
                    generic: "ವಿನಂತಿ ಪ್ರಕ್ರಿಯೆಗೊಳಪಡಿಸಲು ವಿಫಲವಾಗಿದೆ.",
                    workerRequired: "ಕೆಲಸಗಾರರ ಸಂಪರ್ಕ ವಿವರಗಳು ಅಗತ್ಯವಿದೆ",
                    photoRequired: "ಪರಿಹಾರ ಫೋಟೋ ಅಗತ್ಯವಿದೆ"
                },
                details: "ಸಮಸ್ಯೆ ವಿವರಗಳು",
                evidence: "ಫೋಟೋ ಸಾಕ್ಷ್ಯ",
                gpsCoordinates: "GPS ನಿರ್ದೇಶಾಂಕಗಳು",
                verificationNotes: "ಪರಿಶೀಲನಾ ಟಿಪ್ಪಣಿಗಳು",
                addNotes: "ಪರಿಶೀಲನಾ ಟಿಪ್ಪಣಿಗಳನ್ನು ಸೇರಿಸಿ...",
                rejectTitle: "ಸಮಸ್ಯೆ ತಿರಸ್ಕರಿಸಿ",
                rejectConfirm: "ಈ ಸಮಸ್ಯೆಯನ್ನು ತಿರಸ್ಕರಿಸಲು ನೀವು ಖಚಿತವಾಗಿ ಬಯಸುವಿರಾ?",
                rejectPlaceholder: "ತಿರಸ್ಕರಣೆಯ ಕಾರಣ...",
                rejectRequired: "ದಯವಿಟ್ಟು ತಿರಸ್ಕರಣೆಗೆ ಕಾರಣವನ್ನು ನೀಡಿ",
                
                villagerInfo: "ವರದಿದಾರರ ಮಾಹಿತಿ",
                villagerName: "ಹೆಸರು",
                villagerPhone: "ಫೋನ್",
                villagerEmail: "ಇಮೇಲ್",
                villagerSince: "ಸದಸ್ಯರಾದ ದಿನಾಂಕ",
                
                today: "ಇಂದು",
                yesterday: "ನಿನ್ನೆ",
                daysAgo: "ದಿನಗಳ ಹಿಂದೆ",
                hoursAgo: "ಗಂಟೆಗಳ ಹಿಂದೆ",
                minutesAgo: "ನಿಮಿಷಗಳ ಹಿಂದೆ",
                justNow: "ಇದೀಗ",
            },
            hi: {
                title: "Issue Details - ग्राम प्रभारी",
                back: "वापस",
                loading: "विवरण लोड हो रहा है...",
                notFound: "Issue नहीं मिला।",
                notAllowed: "आप ग्राम प्रभारी के रूप में अधिकृत नहीं हैं।",
                status: "स्टेटस",
                category: "कैटेगरी",
                panchayat: "पंचायत",
                village: "गांव",
                postedOn: "दिनांक",
                address: "पता",
                specificLocation: "विशिष्ट स्थान",
                actionsHeading: "कार्रवाइयाँ",
                actions: {
                    verify: "Verify & PDO को भेजें",
                    verifyWithNotes: "नोट्स के साथ Verify करें",
                    reject: "Issue अस्वीकार करें",
                    refresh: "Refresh",
                    openChat: "Chat खोलें",
                    viewMap: "मानचित्र पर देखें",
                    updateStatus: "स्टेटस अपडेट करें"
                },
                statusOptions: {
                    verified: "Verified",
                    assigned: "Worker Assigned",
                    in_progress: "In Progress",
                    resolved: "Resolved",
                    closed: "Closed"
                },
                statusForms: {
                    assigned: "Worker Assign करें",
                    in_progress: "In Progress चिह्नित करें",
                    resolved: "Resolved चिह्नित करें"
                },
                workerDetails: {
                    name: "Worker Name",
                    phone: "Worker Phone",
                    email: "Worker Email (वैकल्पिक)"
                },
                resolution: {
                    uploadPhoto: "समाधान फोटो अपलोड करें",
                    takePhoto: "फोटो लें",
                    choosePhoto: "गैलरी से चुनें",
                },
                chat: {
                    title: "ग्रामीण के साथ चैट",
                    placeholder: "अपना मैसेज टाइप करें...",
                    send: "भेजें",
                    noMessages: "अभी तक कोई मैसेज नहीं। बातचीत शुरू करें।"
                },
                toast: {
                    verified: "✓ Verified और PDO को forwarded",
                    rejected: "✓ Issue सफलतापूर्वक अस्वीकृत",
                    notesSaved: "✓ Verification नोट्स सहेजे गए",
                    statusUpdated: "✓ स्टेटस सफलतापूर्वक अपडेट किया गया",
                    messageSent: "✓ मैसेज सफलतापूर्वक भेजा गया",
                },
                errors: {
                    perm: "Missing/insufficient permissions.",
                    generic: "Request process करने में विफल।",
                    workerRequired: "Worker contact details required",
                    photoRequired: "Resolution photo required"
                },
                details: "Issue Details",
                evidence: "Photo Evidence",
                gpsCoordinates: "GPS Coordinates",
                verificationNotes: "Verification Notes",
                addNotes: "Verification notes जोड़ें...",
                rejectTitle: "Issue अस्वीकार करें",
                rejectConfirm: "क्या आप इस Issue को अस्वीकार करना चाहते हैं?",
                rejectPlaceholder: "अस्वीकृति का कारण...",
                rejectRequired: "कृपया अस्वीकृति का कारण दें",
                
                villagerInfo: "रिपोर्टर जानकारी",
                villagerName: "नाम",
                villagerPhone: "फ़ोन",
                villagerEmail: "ईमेल",
                villagerSince: "सदस्यता तिथि",
                
                today: "आज",
                yesterday: "कल",
                daysAgo: "दिन पहले",
                hoursAgo: "घंटे पहले",
                minutesAgo: "मिनट पहले",
                justNow: "अभी अभी",
            },
        };
        return L[locale] || L.en;
    }, [locale]);

    // Auth and initial data loading
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUid(user.uid);
                await loadAuthorityInfo(user.uid);
                setAuthReady(true);
            } else {
                router.replace(`/${locale}/authority/login`);
            }
        });
        return () => unsub();
    }, [locale, router]);

    const loadAuthorityInfo = async (userId: string) => {
        try {
            const aSnap = await getDoc(doc(db, "authorities", userId));
            if (aSnap.exists()) {
                const data = aSnap.data();
                setAuthorityInfo({
                    name: data.name,
                    role: data.role,
                    panchayatId: data.panchayatId,
                });
            }
        } catch (error) {
            console.error("Error loading authority info:", error);
        }
    };

    const loadVillagerInfo = async (villagerId: string) => {
        try {
            const vSnap = await getDoc(doc(db, "villagers", villagerId));
            if (vSnap.exists()) {
                const data = vSnap.data();
                setVillagerInfo({
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                    address: data.address,
                    profilePhoto: data.photoUrl || data.profilePhoto,
                    createdAt: data.createdAt
                });
            }
        } catch (error) {
            console.error("Error loading villager info:", error);
        }
    };

    const loadMessages = async () => {
        if (!issueId) return;
        
        try {
            const messagesQuery = query(
                collection(db, "issues", issueId, "messages"),
                orderBy("timestamp", "asc")
            );
            
            const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
                const msgs: Message[] = [];
                snapshot.forEach((doc) => {
                    msgs.push({
                        id: doc.id,
                        ...doc.data()
                    } as Message);
                });
                setMessages(msgs);
            });
            
            return unsubscribe;
        } catch (error) {
            console.error("Error loading messages:", error);
        }
    };

    const load = async () => {
        setErr("");
        setSuccess("");
        setLoading(true);
        setIssue(null);
        setVillagerInfo(null);

        try {
            if (!uid) return;

            const aSnap = await getDoc(doc(db, "authorities", uid));
            if (!aSnap.exists() || aSnap.data().role !== "village_incharge") {
                setErr(t.notAllowed);
                return;
            }

            const authorityData = aSnap.data();
            const viPanchayatId = authorityData.panchayatId;

            if (!viPanchayatId) {
                setErr("Your panchayatId is missing. Please contact admin.");
                return;
            }

            if (!issueId) {
                setErr(t.notFound);
                return;
            }

            const snap = await getDoc(doc(db, "issues", issueId));
            if (!snap.exists()) {
                setErr(t.notFound);
                return;
            }

            const data = snap.data() as any;

            // Check if issue belongs to VI's panchayat
            if (String(data?.panchayatId || "") !== viPanchayatId) {
                setErr("This issue does not belong to your panchayat.");
                return;
            }

            setIssue({
                id: snap.id,
                ...data
            });

            // Load additional data
            if (data.villagerId) {
                await loadVillagerInfo(data.villagerId);
            }

            // Load messages
            loadMessages();

        } catch (e: any) {
            console.error("Load error:", e);
            setErr(e?.message || t.errors.generic);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!authReady) return;
        load();
    }, [authReady, issueId, uid, locale]);

    // Real-time updates for issue
    useEffect(() => {
        if (!issueId || !authReady) return;

        const unsubscribe = onSnapshot(doc(db, "issues", issueId), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data() as any;
                setIssue(prev => ({
                    ...prev,
                    ...data,
                    id: docSnap.id
                }));
            }
        });

        return () => unsubscribe();
    }, [issueId, authReady]);

    const sendMessage = async () => {
        if (!newMessage.trim() || !issueId || !uid || sendingMessage) return;

        setSendingMessage(true);
        setErr("");

        try {
            const authorityDoc = await getDoc(doc(db, "authorities", uid));
            const authorityData = authorityDoc.exists() ? authorityDoc.data() : null;

            const messageData = {
                text: newMessage,
                senderId: uid,
                senderName: authorityData?.name || "Village Incharge",
                senderRole: "village_incharge",
                timestamp: serverTimestamp(),
                type: "text"
            };

            await addDoc(collection(db, "issues", issueId, "messages"), messageData);
            
            setNewMessage("");
            setSuccess(t.toast.messageSent);

        } catch (e: any) {
            console.error("Error sending message:", e);
            setErr("Failed to send message");
        } finally {
            setSendingMessage(false);
        }
    };

    const updateIssueStatus = async () => {
        if (!selectedStatus || !issueId) {
            setErr("Please select a status");
            return;
        }

        setSaving(true);
        setErr("");

        try {
            const updates: any = {
                status: selectedStatus,
                updatedAt: serverTimestamp(),
            };

            // Set specific timestamp based on status
            switch (selectedStatus) {
                case "verified":
                    updates.verifiedAt = serverTimestamp();
                    updates.viVerifiedBy = uid;
                    updates.viVerifiedAt = serverTimestamp();
                    if (verificationNotes) {
                        updates.viVerificationNotes = verificationNotes;
                    }
                    break;

                case "assigned":
                    if (!workerContact.name || !workerContact.phone) {
                        setErr(t.errors.workerRequired);
                        setSaving(false);
                        return;
                    }
                    updates.assignedAt = serverTimestamp();
                    updates.assignedWorker = workerContact;
                    break;

                case "in_progress":
                    updates.inProgressAt = serverTimestamp();
                    break;

                case "resolved":
                    if (!resolvedPhoto) {
                        setErr(t.errors.photoRequired);
                        setSaving(false);
                        return;
                    }
                    updates.resolvedAt = serverTimestamp();
                    // Convert photo to base64
                    const reader = new FileReader();
                    reader.onloadend = async () => {
                        const base64String = reader.result;
                        updates.resolvedPhoto = base64String;
                        
                        await updateDoc(doc(db, "issues", issueId), updates);
                        
                        // Send system message
                        const authorityDoc = await getDoc(doc(db, "authorities", uid));
                        const authorityData = authorityDoc.exists() ? authorityDoc.data() : null;

                        const statusMessage = {
                            text: `Status updated to: ${selectedStatus}`,
                            senderId: uid,
                            senderName: authorityData?.name || "Village Incharge",
                            senderRole: "village_incharge",
                            timestamp: serverTimestamp(),
                            type: "system"
                        };

                        await addDoc(collection(db, "issues", issueId, "messages"), statusMessage);

                        setSuccess(t.toast.statusUpdated);
                        setShowStatusUpdate(false);
                        resetStatusForm();
                        setSaving(false);
                    };
                    reader.readAsDataURL(resolvedPhoto);
                    return; // Return early, update will happen in onloadend

                case "closed":
                    updates.closedAt = serverTimestamp();
                    break;
            }

            await updateDoc(doc(db, "issues", issueId), updates);
            
            // Send chat message about status update
            const authorityDoc = await getDoc(doc(db, "authorities", uid));
            const authorityData = authorityDoc.exists() ? authorityDoc.data() : null;

            const statusMessage = {
                text: `Status updated to: ${selectedStatus}`,
                senderId: uid,
                senderName: authorityData?.name || "Village Incharge",
                senderRole: "village_incharge",
                timestamp: serverTimestamp(),
                type: "system"
            };

            await addDoc(collection(db, "issues", issueId, "messages"), statusMessage);

            setSuccess(t.toast.statusUpdated);
            setShowStatusUpdate(false);
            resetStatusForm();

        } catch (e: any) {
            console.error("Error updating status:", e);
            setErr(e?.message || "Failed to update status");
        } finally {
            setSaving(false);
        }
    };

    const resetStatusForm = () => {
        setSelectedStatus("");
        setWorkerContact({ name: "", phone: "", email: "" });
        setResolvedPhoto(null);
        setResolvedPhotoPreview("");
        setVerificationNotes("");
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setResolvedPhoto(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setResolvedPhotoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const openInMaps = () => {
        if (!issue?.gpsLatitude || !issue?.gpsLongitude) return;
        const url = `https://www.google.com/maps?q=${issue.gpsLatitude},${issue.gpsLongitude}&z=17`;
        window.open(url, '_blank');
    };

    const verifyAndForward = async (withNotes = false) => {
        if (!issueId || !uid) return;

        if (withNotes && !verificationNotes.trim()) {
            setErr("Please add verification notes");
            return;
        }

        setSaving(true);
        setErr("");

        try {
            const updates: any = {
                status: "verified",
                verifiedAt: serverTimestamp(),
                viVerifiedBy: uid,
                viVerifiedAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            if (withNotes) {
                updates.viVerificationNotes = verificationNotes;
            }

            await updateDoc(doc(db, "issues", issueId), updates);

            // Send chat message
            const authorityDoc = await getDoc(doc(db, "authorities", uid));
            const authorityData = authorityDoc.exists() ? authorityDoc.data() : null;

            const messageData = {
                text: withNotes 
                    ? `Issue verified with notes: ${verificationNotes}`
                    : "Issue verified by Village Incharge",
                senderId: uid,
                senderName: authorityData?.name || "Village Incharge",
                senderRole: "village_incharge",
                timestamp: serverTimestamp(),
                type: "system"
            };

            await addDoc(collection(db, "issues", issueId, "messages"), messageData);

            setSuccess(withNotes ? t.toast.notesSaved : t.toast.verified);
            setVerificationNotes("");

        } catch (e: any) {
            console.error("Verification error:", e);
            setErr(e?.message || "Failed to verify issue");
        } finally {
            setSaving(false);
        }
    };

    const rejectIssue = async () => {
        if (!rejectReason.trim()) {
            setErr(t.rejectRequired);
            return;
        }

        setSaving(true);
        setErr("");

        try {
            await updateDoc(doc(db, "issues", issueId), {
                status: "rejected",
                rejectionReason: rejectReason,
                rejectedAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            // Send chat message
            const authorityDoc = await getDoc(doc(db, "authorities", uid));
            const authorityData = authorityDoc.exists() ? authorityDoc.data() : null;

            const messageData = {
                text: `Issue rejected. Reason: ${rejectReason}`,
                senderId: uid,
                senderName: authorityData?.name || "Village Incharge",
                senderRole: "village_incharge",
                timestamp: serverTimestamp(),
                type: "system"
            };

            await addDoc(collection(db, "issues", issueId, "messages"), messageData);

            setSuccess(t.toast.rejected);
            setShowRejectModal(false);
            setRejectReason("");

        } catch (e: any) {
            setErr(e?.message || t.errors.generic);
        } finally {
            setSaving(false);
        }
    };

    const StatusIcon = issue ? getStatusIcon(issue.status || 'submitted') : FiAlertCircle;

    if (loading) {
        return (
            <Screen padded>
                <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-white p-4 safe-padding">
                    <div className="flex flex-col items-center justify-center h-full">
                        <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mb-6"></div>
                        <p className="text-green-700 font-bold text-lg">{t.loading}</p>
                    </div>
                </div>
            </Screen>
        );
    }

    if (err && !issue) {
        return (
            <Screen padded>
                <div className="min-h-screen bg-gradient-to-b from-red-50 via-white to-white p-4 safe-padding">
                    <button
                        onClick={() => router.back()}
                        className="p-3 rounded-2xl border-2 border-red-100 bg-white hover:bg-red-50 mb-8 transition-all active:scale-95"
                    >
                        <FiArrowLeft className="w-5 h-5 text-red-700" />
                    </button>
                    
                    <div className="bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-3xl p-8 text-center shadow-xl">
                        <FiAlertCircle className="w-16 h-16 mx-auto mb-6" />
                        <h2 className="text-2xl font-bold mb-3">Error</h2>
                        <p className="mb-6">{err}</p>
                        <button
                            onClick={() => router.push(`/${locale}/authority/vi/issues`)}
                            className="px-6 py-3 bg-white text-red-600 rounded-xl font-bold hover:shadow-lg transition-all active:scale-95"
                        >
                            Back to Issues
                        </button>
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
                @keyframes slideIn {
                    from { transform: translateX(-20px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
                .animate-slideIn { animation: slideIn 0.3s ease-out forwards; }
                .animate-pulse { animation: pulse 2s ease-in-out infinite; }
                .safe-padding {
                    padding-top: env(safe-area-inset-top);
                    padding-bottom: env(safe-area-inset-bottom);
                }
            `}</style>

            <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-white p-4 pb-32 safe-padding">
                {/* Header */}
                <div className="mb-6 animate-fadeIn">
                    <div className="flex items-center justify-between mb-4">
                        <button
                            onClick={() => router.back()}
                            className="p-3 rounded-2xl border-2 border-green-100 bg-white hover:bg-green-50 active:scale-95 transition-all duration-200 flex items-center gap-2"
                            aria-label={t.back}
                        >
                            <FiArrowLeft className="w-5 h-5 text-green-700" />
                            <span className="text-sm font-semibold text-green-800 hidden sm:inline">{t.back}</span>
                        </button>
                        
                        <div className="flex items-center gap-2">
                            <button
                                onClick={load}
                                disabled={saving}
                                className="p-3 rounded-2xl border-2 border-green-100 bg-white hover:bg-green-50 active:scale-95 transition-all duration-200"
                                aria-label={t.actions.refresh}
                            >
                                <FiRefreshCw className={`w-5 h-5 text-green-700 ${saving ? 'animate-spin' : ''}`} />
                            </button>
                            
                            <button
                                onClick={() => setShowChat(!showChat)}
                                className="p-3 rounded-2xl border-2 border-green-100 bg-white hover:bg-green-50 active:scale-95 transition-all duration-200"
                                aria-label={t.actions.openChat}
                            >
                                <FiMessageSquare className="w-5 h-5 text-green-700" />
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            <h1 className="text-xl sm:text-2xl font-bold text-green-900 tracking-tight mb-2">
                                {issue?.title || "Untitled Issue"}
                            </h1>
                            <div className="flex flex-wrap items-center gap-2">
                                <div className={`px-3 py-1.5 rounded-full text-sm font-bold text-white ${getStatusColor(issue?.status || 'submitted')}`}>
                                    <span className="flex items-center gap-2">
                                        <StatusIcon className="w-4 h-4" />
                                        {issue?.status || "Unknown"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Success Toast */}
                {success && (
                    <div className="mb-4 animate-fadeIn">
                        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl p-4 shadow-lg flex items-center gap-3">
                            <FiCheckCircle className="w-5 h-5 flex-shrink-0 animate-pulse" />
                            <div className="flex-1">
                                <p className="font-bold text-sm">Success</p>
                                <p className="text-xs opacity-90">{success}</p>
                            </div>
                            <button
                                onClick={() => setSuccess("")}
                                className="p-1 hover:bg-white/20 rounded-lg"
                            >
                                <FiXCircle className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Error Toast */}
                {err && (
                    <div className="mb-4 animate-fadeIn">
                        <div className="bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-2xl p-4 shadow-lg flex items-center gap-3">
                            <FiAlertCircle className="w-5 h-5 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="font-bold text-sm">Error</p>
                                <p className="text-xs opacity-90">{err}</p>
                            </div>
                            <button
                                onClick={() => setErr("")}
                                className="p-1 hover:bg-white/20 rounded-lg"
                            >
                                <FiXCircle className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Main Content */}
                <div className="space-y-4 pb-4">
                    {/* Quick Actions Card */}
                    <div className="bg-white border-2 border-green-100 rounded-2xl p-5 shadow-lg">
                        <h3 className="font-bold text-green-900 mb-4 flex items-center gap-2">
                            <FiFlag className="w-5 h-5" />
                            {t.actionsHeading}
                        </h3>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                            <button
                                onClick={() => verifyAndForward(false)}
                                disabled={saving || issue?.status === "verified"}
                                className={`p-3 rounded-xl font-bold text-white transition-all active:scale-95 flex items-center justify-center gap-2 ${
                                    saving || issue?.status === "verified"
                                        ? 'bg-gradient-to-r from-gray-400 to-gray-500 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-green-600 to-emerald-700 hover:shadow-lg'
                                }`}
                            >
                                {saving ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <FiCheckCircle className="w-5 h-5" />
                                        {t.actions.verify}
                                    </>
                                )}
                            </button>
                            
                            <button
                                onClick={() => setShowStatusUpdate(true)}
                                className="p-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-700 text-white font-bold hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <FiActivity className="w-5 h-5" />
                                {t.actions.updateStatus}
                            </button>
                            
                            <button
                                onClick={() => setShowRejectModal(true)}
                                disabled={saving}
                                className={`p-3 rounded-xl font-bold text-white transition-all active:scale-95 flex items-center justify-center gap-2 ${
                                    saving
                                        ? 'bg-gradient-to-r from-gray-400 to-gray-500 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-red-600 to-pink-700 hover:shadow-lg'
                                }`}
                            >
                                <FiXCircle className="w-5 h-5" />
                                {t.actions.reject}
                            </button>
                            
                            <button
                                onClick={() => setShowChat(true)}
                                className="p-3 rounded-xl bg-gradient-to-r from-purple-600 to-violet-700 text-white font-bold hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <FiMessageSquare className="w-5 h-5" />
                                {t.actions.openChat}
                            </button>
                        </div>
                        
                        {/* Verification Notes */}
                        <div className="mt-4 pt-4 border-t border-green-100">
                            <label className="block text-sm font-medium text-green-900 mb-2">
                                {t.verificationNotes}
                            </label>
                            <textarea
                                value={verificationNotes}
                                onChange={(e) => setVerificationNotes(e.target.value)}
                                placeholder={t.addNotes}
                                className="w-full p-3 rounded-xl border-2 border-green-200 focus:border-green-500 focus:ring-0 resize-none"
                                rows={3}
                            />
                            <button
                                onClick={() => verifyAndForward(true)}
                                disabled={!verificationNotes.trim() || saving}
                                className="mt-3 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-700 text-white font-bold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                            >
                                {t.actions.verifyWithNotes}
                            </button>
                        </div>
                    </div>

                    {/* Status Update Modal */}
                    {showStatusUpdate && (
                        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/50 backdrop-blur-sm sm:items-center sm:p-0 animate-fadeIn">
                            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl animate-slideIn">
                                <div className="p-4 border-b border-gray-100">
                                    <h3 className="font-bold text-green-900">Update Status</h3>
                                </div>
                                <div className="p-4 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Select New Status
                                        </label>
                                        <select
                                            value={selectedStatus}
                                            onChange={(e) => setSelectedStatus(e.target.value)}
                                            className="w-full p-3 rounded-xl border-2 border-green-200 focus:border-green-500 outline-none"
                                        >
                                            <option value="">Select status</option>
                                            <option value="verified">{t.statusOptions.verified}</option>
                                            <option value="assigned">{t.statusOptions.assigned}</option>
                                            <option value="in_progress">{t.statusOptions.in_progress}</option>
                                            <option value="resolved">{t.statusOptions.resolved}</option>
                                            <option value="closed">{t.statusOptions.closed}</option>
                                        </select>
                                    </div>

                                    {selectedStatus === "assigned" && (
                                        <div className="space-y-3 animate-fadeIn">
                                            <h4 className="font-bold text-gray-900">{t.statusForms.assigned}</h4>
                                            <input
                                                type="text"
                                                placeholder={t.workerDetails.name}
                                                value={workerContact.name}
                                                onChange={(e) => setWorkerContact({...workerContact, name: e.target.value})}
                                                className="w-full p-3 rounded-xl border-2 border-green-200 focus:border-green-500 outline-none"
                                            />
                                            <input
                                                type="tel"
                                                placeholder={t.workerDetails.phone}
                                                value={workerContact.phone}
                                                onChange={(e) => setWorkerContact({...workerContact, phone: e.target.value})}
                                                className="w-full p-3 rounded-xl border-2 border-green-200 focus:border-green-500 outline-none"
                                            />
                                            <input
                                                type="email"
                                                placeholder={t.workerDetails.email}
                                                value={workerContact.email}
                                                onChange={(e) => setWorkerContact({...workerContact, email: e.target.value})}
                                                className="w-full p-3 rounded-xl border-2 border-green-200 focus:border-green-500 outline-none"
                                            />
                                        </div>
                                    )}

                                    {selectedStatus === "resolved" && (
                                        <div className="space-y-3 animate-fadeIn">
                                            <h4 className="font-bold text-gray-900">{t.statusForms.resolved}</h4>
                                            <div className="space-y-3">
                                                <label className="block text-sm font-medium text-gray-700">
                                                    {t.resolution.uploadPhoto} *
                                                </label>
                                                {resolvedPhotoPreview ? (
                                                    <div className="relative">
                                                        <img 
                                                            src={resolvedPhotoPreview} 
                                                            alt="Resolution" 
                                                            className="w-full h-48 object-cover rounded-xl"
                                                        />
                                                        <button
                                                            onClick={() => {
                                                                setResolvedPhoto(null);
                                                                setResolvedPhotoPreview("");
                                                            }}
                                                            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                                                        >
                                                            <FiXCircle className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex gap-3">
                                                        <label className="flex-1">
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                capture="environment"
                                                                onChange={handlePhotoUpload}
                                                                className="hidden"
                                                            />
                                                            <div className="p-4 border-2 border-dashed border-green-300 rounded-xl text-center cursor-pointer hover:bg-green-50">
                                                                <FiCamera className="w-8 h-8 text-green-600 mx-auto mb-2" />
                                                                <span className="text-sm text-green-700">{t.resolution.takePhoto}</span>
                                                            </div>
                                                        </label>
                                                        <label className="flex-1">
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={handlePhotoUpload}
                                                                className="hidden"
                                                            />
                                                            <div className="p-4 border-2 border-dashed border-blue-300 rounded-xl text-center cursor-pointer hover:bg-blue-50">
                                                                <FiUpload className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                                                                <span className="text-sm text-blue-700">{t.resolution.choosePhoto}</span>
                                                            </div>
                                                        </label>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="p-4 border-t border-gray-100 flex gap-3">
                                    <button
                                        onClick={() => {
                                            setShowStatusUpdate(false);
                                            resetStatusForm();
                                        }}
                                        className="flex-1 py-3 px-4 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 active:scale-95"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={updateIssueStatus}
                                        disabled={saving}
                                        className={`flex-1 py-3 px-4 rounded-xl font-bold text-white ${
                                            saving
                                                ? 'bg-gradient-to-r from-gray-400 to-gray-500 cursor-not-allowed'
                                                : 'bg-gradient-to-r from-green-600 to-emerald-700 hover:shadow-lg'
                                        } active:scale-95`}
                                    >
                                        {saving ? (
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                Updating...
                                            </div>
                                        ) : (
                                            'Update Status'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Chat Modal */}
                    {showChat && (
                        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/50 backdrop-blur-sm sm:items-center sm:p-0 animate-fadeIn">
                            <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl animate-slideIn h-[80vh] flex flex-col">
                                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                                    <h3 className="font-bold text-green-900">{t.chat.title}</h3>
                                    <button
                                        onClick={() => setShowChat(false)}
                                        className="p-2 hover:bg-gray-100 rounded-lg"
                                    >
                                        <FiXCircle className="w-5 h-5 text-gray-600" />
                                    </button>
                                </div>
                                
                                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                    {messages.length === 0 ? (
                                        <div className="text-center py-12">
                                            <FiMessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                            <p className="text-gray-500">{t.chat.noMessages}</p>
                                        </div>
                                    ) : (
                                        messages.map((msg) => (
                                            <div
                                                key={msg.id}
                                                className={`animate-fadeIn ${
                                                    msg.senderRole === "village_incharge" 
                                                        ? 'ml-auto' 
                                                        : 'mr-auto'
                                                } max-w-xs`}
                                            >
                                                <div className={`p-3 rounded-xl ${
                                                    msg.senderRole === "village_incharge"
                                                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-br-none'
                                                        : 'bg-gray-100 text-gray-800 rounded-bl-none'
                                                }`}>
                                                    <p className="text-sm">{msg.text}</p>
                                                    <p className="text-xs opacity-70 mt-1">
                                                        {msg.senderName} • {msg.timestamp ? formatRelativeDate(fmtDate(msg.timestamp), t) : ''}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                
                                <div className="p-4 border-t border-gray-100">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                            placeholder={t.chat.placeholder}
                                            className="flex-1 p-3 rounded-xl border-2 border-green-200 focus:border-green-500 outline-none"
                                            disabled={sendingMessage}
                                        />
                                        <button
                                            onClick={sendMessage}
                                            disabled={!newMessage.trim() || sendingMessage}
                                            className={`px-4 py-3 rounded-xl font-bold text-white ${
                                                !newMessage.trim() || sendingMessage
                                                    ? 'bg-gradient-to-r from-gray-400 to-gray-500 cursor-not-allowed'
                                                    : 'bg-gradient-to-r from-green-600 to-emerald-700 hover:shadow-lg'
                                            } active:scale-95`}
                                        >
                                            {sendingMessage ? (
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            ) : (
                                                t.chat.send
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Issue Details Card */}
                    <div className="bg-white border-2 border-green-100 rounded-2xl p-5 shadow-lg">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-green-900 flex items-center gap-2">
                                <FiFolder className="w-5 h-5" />
                                {t.details}
                            </h3>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm text-green-800/70 mb-1">{t.category}</p>
                                    <p className="font-bold text-green-900">{issue?.category || "—"}</p>
                                </div>
                                
                                <div>
                                    <p className="text-sm text-green-800/70 mb-1">{t.panchayat}</p>
                                    <p className="font-bold text-green-900">{issue?.panchayatName || issue?.panchayatId || "—"}</p>
                                </div>
                                
                                <div>
                                    <p className="text-sm text-green-800/70 mb-1">{t.village}</p>
                                    <p className="font-bold text-green-900">{issue?.villageName || "—"}</p>
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm text-green-800/70 mb-1">{t.postedOn}</p>
                                    <p className="font-bold text-green-900">
                                        {issue?.createdAt ? formatRelativeDate(fmtDate(issue.createdAt), t) : "—"}
                                    </p>
                                </div>
                                
                                {issue?.assignedAt && (
                                    <div>
                                        <p className="text-sm text-green-800/70 mb-1">Assigned On</p>
                                        <p className="font-bold text-green-900">
                                            {formatRelativeDate(fmtDate(issue.assignedAt), t)}
                                        </p>
                                    </div>
                                )}
                                
                                {issue?.resolvedAt && (
                                    <div>
                                        <p className="text-sm text-green-800/70 mb-1">Resolved On</p>
                                        <p className="font-bold text-green-900">
                                            {formatRelativeDate(fmtDate(issue.resolvedAt), t)}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {/* Description */}
                        {issue?.description && (
                            <div className="mt-4 pt-4 border-t border-green-100">
                                <button
                                    onClick={() => setShowDescription(!showDescription)}
                                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-green-50"
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                                            <FiFileText className="w-5 h-5 text-green-700" />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-bold text-green-900">Description</p>
                                            <p className="text-green-700/70 text-sm">Tap to view</p>
                                        </div>
                                    </div>
                                    {showDescription ? (
                                        <FiChevronUp className="w-5 h-5 text-green-700" />
                                    ) : (
                                        <FiChevronDown className="w-5 h-5 text-green-700" />
                                    )}
                                </button>
                                
                                {showDescription && (
                                    <div className="mt-3 animate-fadeIn">
                                        <p className="text-green-800/80 whitespace-pre-wrap bg-green-50 p-4 rounded-xl">
                                            {issue.description}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {/* Assigned Worker */}
                        {issue?.assignedWorker && (
                            <div className="mt-4 pt-4 border-t border-green-100">
                                <h4 className="font-bold text-green-900 mb-3 flex items-center gap-2">
                                    <FiUserPlus className="w-5 h-5" />
                                    Assigned Worker
                                </h4>
                                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-blue-800/70">Name:</span>
                                            <span className="font-bold text-blue-900">{issue.assignedWorker.name}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-blue-800/70">Phone:</span>
                                            <span className="font-bold text-blue-900">{issue.assignedWorker.phone}</span>
                                        </div>
                                        {issue.assignedWorker.email && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-blue-800/70">Email:</span>
                                                <span className="font-bold text-blue-900">{issue.assignedWorker.email}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {/* Resolution Photo */}
                        {issue?.resolvedPhoto && (
                            <div className="mt-4 pt-4 border-t border-green-100">
                                <h4 className="font-bold text-green-900 mb-3 flex items-center gap-2">
                                    <FiImage className="w-5 h-5" />
                                    Resolution Photo
                                </h4>
                                <div className="relative rounded-xl overflow-hidden border-2 border-green-200">
                                    <img 
                                        src={issue.resolvedPhoto} 
                                        alt="Resolution" 
                                        className="w-full h-48 object-cover"
                                    />
                                    <button 
                                        onClick={() => window.open(issue.resolvedPhoto, '_blank')}
                                        className="absolute top-2 right-2 p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-md hover:shadow-lg"
                                    >
                                        <FiExternalLink className="w-4 h-4 text-green-700" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Photo Evidence & GPS */}
                    {(issue?.photoUrl || issue?.photoBase64 || (issue?.gpsLatitude && issue?.gpsLongitude)) && (
                        <div className="bg-white border-2 border-green-100 rounded-2xl p-5 shadow-lg">
                            <h3 className="font-bold text-green-900 mb-4 flex items-center gap-2">
                                <FiImage className="w-5 h-5" />
                                {t.evidence}
                            </h3>
                            
                            <div className="space-y-4">
                                {/* Photo */}
                                {(issue?.photoUrl || issue?.photoBase64) && (
                                    <div className="relative">
                                        <div className="rounded-xl overflow-hidden border-2 border-green-200">
                                            <img 
                                                src={issue.photoUrl || issue.photoBase64} 
                                                alt="Issue evidence"
                                                className="w-full h-48 object-cover"
                                                loading="lazy"
                                            />
                                        </div>
                                        <div className="absolute bottom-3 right-3 flex gap-2">
                                            <button 
                                                onClick={() => {
                                                    const imageUrl = issue.photoUrl || issue.photoBase64;
                                                    const link = document.createElement('a');
                                                    link.href = imageUrl!;
                                                    link.download = `issue-${issue.id}-evidence.jpg`;
                                                    document.body.appendChild(link);
                                                    link.click();
                                                    document.body.removeChild(link);
                                                }}
                                                className="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-md hover:shadow-lg transition-all active:scale-95"
                                                aria-label="Save Image"
                                            >
                                                <FiDownload className="w-4 h-4 text-green-700" />
                                            </button>
                                            <button 
                                                onClick={() => window.open(issue.photoUrl || issue.photoBase64, '_blank')}
                                                className="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-md hover:shadow-lg transition-all active:scale-95"
                                                aria-label="View full screen"
                                            >
                                                <FiExternalLink className="w-4 h-4 text-green-700" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                                
                                {/* GPS */}
                                {issue?.gpsLatitude && issue?.gpsLongitude && (
                                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="font-bold text-blue-900 flex items-center gap-2">
                                                <FiMapPin className="w-5 h-5" />
                                                {t.gpsCoordinates}
                                            </h4>
                                            <button
                                                onClick={openInMaps}
                                                className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-sm rounded-lg font-bold hover:shadow-lg transition-all active:scale-95 flex items-center gap-2"
                                            >
                                                <FiMapPin className="w-4 h-4" />
                                                {t.actions.viewMap}
                                            </button>
                                        </div>
                                        
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between items-center">
                                                <span className="text-blue-800/70">Latitude:</span>
                                                <span className="font-mono font-bold text-blue-900">
                                                    {issue.gpsLatitude.toFixed(6)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-blue-800/70">Longitude:</span>
                                                <span className="font-mono font-bold text-blue-900">
                                                    {issue.gpsLongitude.toFixed(6)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Villager Information */}
                    {villagerInfo && (
                        <div className="bg-white border-2 border-green-100 rounded-2xl p-5 shadow-lg">
                            <button
                                onClick={() => setShowVillagerInfo(!showVillagerInfo)}
                                className="w-full flex items-center justify-between"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-violet-200 rounded-xl flex items-center justify-center">
                                        <FiUser className="w-6 h-6 text-purple-700" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-green-900">{t.villagerInfo}</p>
                                        <p className="text-green-700/70 text-sm">Tap to view details</p>
                                    </div>
                                </div>
                                {showVillagerInfo ? (
                                    <FiChevronUp className="w-5 h-5 text-green-700" />
                                ) : (
                                    <FiChevronDown className="w-5 h-5 text-green-700" />
                                )}
                            </button>
                            
                            {showVillagerInfo && (
                                <div className="mt-4 animate-fadeIn">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-sm text-green-800/70 mb-1">{t.villagerName}</p>
                                                <p className="font-bold text-green-900">{villagerInfo.name || "—"}</p>
                                            </div>
                                            
                                            <div>
                                                <p className="text-sm text-green-800/70 mb-1">{t.villagerPhone}</p>
                                                <p className="font-bold text-green-900">{villagerInfo.phone || "—"}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-sm text-green-800/70 mb-1">{t.villagerEmail}</p>
                                                <p className="font-bold text-green-900 truncate">{villagerInfo.email || "—"}</p>
                                            </div>
                                            
                                            {villagerInfo.createdAt && (
                                                <div>
                                                    <p className="text-sm text-green-800/70 mb-1">{t.villagerSince}</p>
                                                    <p className="font-bold text-green-900">
                                                        {formatRelativeDate(fmtDate(villagerInfo.createdAt), t)}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {villagerInfo.address && (
                                        <div className="mt-4 pt-4 border-t border-green-100">
                                            <div className="flex items-center gap-2 mb-2">
                                                <FiMapPin className="w-4 h-4 text-green-700" />
                                                <p className="font-medium text-green-900">Address</p>
                                            </div>
                                            <p className="text-green-800/80 text-sm">{villagerInfo.address}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Reject Modal */}
                {showRejectModal && (
                    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/50 backdrop-blur-sm sm:items-center sm:p-0 animate-fadeIn">
                        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl animate-slideIn">
                            <div className="p-4 border-b border-gray-100">
                                <h3 className="font-bold text-red-900">{t.rejectTitle}</h3>
                            </div>
                            <div className="p-4">
                                <p className="text-gray-700 mb-4">{t.rejectConfirm}</p>
                                
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t.rejectPlaceholder}
                                </label>
                                <textarea
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    placeholder={t.rejectPlaceholder}
                                    className="w-full p-3 rounded-xl border-2 border-red-200 focus:border-red-500 focus:ring-0 resize-none"
                                    rows={4}
                                />
                                
                                {err && (
                                    <p className="mt-2 text-sm text-red-600">{err}</p>
                                )}
                            </div>
                            <div className="p-4 border-t border-gray-100 flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowRejectModal(false);
                                        setRejectReason("");
                                        setErr("");
                                    }}
                                    className="flex-1 py-3 px-4 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={rejectIssue}
                                    disabled={saving}
                                    className={`flex-1 py-3 px-4 rounded-xl font-bold text-white ${
                                        saving
                                            ? 'bg-gradient-to-r from-gray-400 to-gray-500 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-red-600 to-pink-700 hover:shadow-lg'
                                    } active:scale-95`}
                                >
                                    {saving ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Processing...
                                        </div>
                                    ) : (
                                        'Reject Issue'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Bottom Navigation */}
                <div className="fixed bottom-4 left-4 right-4 bg-white/90 backdrop-blur-lg border-2 border-green-100 rounded-2xl p-2 shadow-xl animate-fadeIn">
                    <div className="grid grid-cols-4 gap-1">
                        <button
                            className="flex flex-col items-center justify-center p-3 rounded-xl transition-all hover:bg-green-50"
                            onClick={() => router.push(`/${locale}/authority/vi/dashboard`)}
                        >
                            <FiHome className="w-5 h-5 text-green-600/70" />
                            <span className="text-xs mt-1 font-medium text-green-700/70">
                                Dashboard
                            </span>
                        </button>
                        
                        <button
                            className="flex flex-col items-center justify-center p-3 rounded-xl transition-all hover:bg-green-50"
                            onClick={() => router.push(`/${locale}/authority/vi/villagers`)}
                        >
                            <FiUsers className="w-5 h-5 text-green-600/70" />
                            <span className="text-xs mt-1 font-medium text-green-700/70">
                                Verify
                            </span>
                        </button>
                        
                        <button
                            className="flex flex-col items-center justify-center p-3 rounded-xl transition-all bg-gradient-to-b from-green-100 to-emerald-50"
                        >
                            <FiFileText className="w-5 h-5 text-green-700" />
                            <span className="text-xs mt-1 font-medium text-green-800 font-bold">
                                Issues
                            </span>
                        </button>
                        
                        <button
                            className="flex flex-col items-center justify-center p-3 rounded-xl transition-all hover:bg-green-50"
                            onClick={() => router.push(`/${locale}/authority/vi/profile`)}
                        >
                            <FiUser className="w-5 h-5 text-green-600/70" />
                            <span className="text-xs mt-1 font-medium text-green-700/70">
                                Profile
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </Screen>
    );
}