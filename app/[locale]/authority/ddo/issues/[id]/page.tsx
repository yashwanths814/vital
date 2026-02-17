"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, updateDoc, collection, addDoc, query, where, getDocs, orderBy, onSnapshot, serverTimestamp, Timestamp } from "firebase/firestore";
import { auth, db } from "../../../../../lib/firebase";
import Screen from "../../../../../components/Screen";
import {
    FiArrowLeft,
    FiDownload,
    FiMessageSquare,
    FiUser,
    FiMapPin,
    FiCalendar,
    FiClock,
    FiAlertCircle,
    FiCheckCircle,
    FiImage,
    FiSend,
    FiRefreshCw,
    FiEdit,
    FiFlag,
    FiFolder,
    FiFileText,
    FiExternalLink,
    FiXCircle,
    FiUserPlus,
    FiCamera,
    FiUpload,
    FiChevronDown,
    FiChevronUp,
    FiActivity,
    FiUsers,
    FiTarget,
    FiPlayCircle,
    FiHome,
    FiBriefcase,
    FiTrendingUp,
    FiBarChart2,
    FiPhone,
    FiMail,
    FiNavigation,
    FiShare2,
    FiPrinter,
    FiCopy,
    FiBell
} from "react-icons/fi";
import { use } from "react";

type Locale = "en" | "kn" | "hi";

interface Issue {
    id: string;
    title: string;
    description: string;
    status: string;
    category: string;
    priority: string;
    createdAt: any;
    updatedAt: any;
    villagerId: string;
    villagerName: string;
    villageId: string;
    villageName: string;
    panchayatId: string;
    panchayatName?: string;
    images: string[];
    latitude?: number;
    longitude?: number;
    address?: string;
    specificLocation?: string;
    escalationLevel?: string;
    slaDays?: number;
    assignedWorker?: {
        name: string;
        phone?: string;
        email?: string;
    };
    viVerifiedAt?: any;
    viVerifiedBy?: string;
    viVerificationNotes?: string;
    assignedAt?: any;
    inProgressAt?: any;
    resolvedAt?: any;
    closedAt?: any;
    rejectionReason?: string;
}

interface Message {
    id: string;
    text: string;
    senderUid: string;
    senderName: string;
    senderRole: string;
    createdAt: any;
    type?: string;
}

interface AuthorityInfo {
    name: string;
    role: string;
    panchayatId: string;
}

interface Worker {
    id: string;
    name: string;
    phone: string;
    email?: string;
    specialization?: string;
    availability?: string;
}

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
        case 'vi_verified': return 'bg-gradient-to-r from-purple-500 to-violet-600';
        case 'pdo_assigned': return 'bg-gradient-to-r from-blue-500 to-cyan-600';
        case 'in_progress': return 'bg-gradient-to-r from-indigo-500 to-blue-600';
        case 'resolved': return 'bg-gradient-to-r from-green-500 to-emerald-600';
        case 'closed': return 'bg-gradient-to-r from-green-600 to-emerald-700';
        case 'escalated': return 'bg-gradient-to-r from-red-500 to-pink-600';
        case 'rejected': return 'bg-gradient-to-r from-red-600 to-rose-700';
        default: return 'bg-gradient-to-r from-gray-500 to-gray-600';
    }
}

function getStatusIcon(status: string) {
    switch (status?.toLowerCase()) {
        case 'submitted': return FiAlertCircle;
        case 'vi_verified': return FiCheckCircle;
        case 'pdo_assigned': return FiUserPlus;
        case 'in_progress': return FiPlayCircle;
        case 'resolved': return FiCheckCircle;
        case 'closed': return FiCheckCircle;
        case 'escalated': return FiFlag;
        case 'rejected': return FiXCircle;
        default: return FiAlertCircle;
    }
}

function getPriorityColor(priority: string) {
    switch (priority?.toLowerCase()) {
        case 'urgent': return 'bg-gradient-to-r from-red-500 to-pink-600';
        case 'high': return 'bg-gradient-to-r from-orange-500 to-amber-600';
        case 'medium': return 'bg-gradient-to-r from-yellow-500 to-amber-600';
        case 'low': return 'bg-gradient-to-r from-green-500 to-emerald-600';
        default: return 'bg-gradient-to-r from-gray-500 to-gray-600';
    }
}

export default function IssueDetailsPage({
    params,
}: {
    params: Promise<{ id: string; locale: string }>;
}) {
    const router = useRouter();

    const unwrappedParams = use(params);
    const locale = unwrappedParams.locale as Locale;
    const issueId = unwrappedParams.id;

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [issue, setIssue] = useState<Issue | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [authorityInfo, setAuthorityInfo] = useState<AuthorityInfo | null>(null);
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [sendingMessage, setSendingMessage] = useState(false);
    const [saving, setSaving] = useState(false);

    // UI States
    const [showChat, setShowChat] = useState(false);
    const [showStatusUpdate, setShowStatusUpdate] = useState(false);
    const [showDescription, setShowDescription] = useState(false);
    const [showWorkers, setShowWorkers] = useState(false);
    const [showVillagerInfo, setShowVillagerInfo] = useState(false);

    // Status Update State
    const [selectedStatus, setSelectedStatus] = useState("");
    const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
    const [assignNotes, setAssignNotes] = useState("");
    const [resolutionPhoto, setResolutionPhoto] = useState<File | null>(null);
    const [resolutionPhotoPreview, setResolutionPhotoPreview] = useState("");
    const [resolutionNotes, setResolutionNotes] = useState("");

    // Villager Info
    const [villagerInfo, setVillagerInfo] = useState<any>(null);

    const t = useMemo(() => {
        const L: Record<Locale, any> = {
            en: {
                title: "Issue Details - PDO",
                back: "Back to Issues",
                loading: "Loading issue details...",
                error: "Failed to load issue details",
                success: {
                    statusUpdated: "✓ Status updated successfully",
                    messageSent: "✓ Message sent successfully",
                    assigned: "✓ Issue assigned to worker",
                    escalated: "✓ Issue escalated to TDO",
                    resolved: "✓ Issue marked as resolved",
                },
                sections: {
                    details: "Issue Details",
                    location: "Location",
                    media: "Photo Evidence",
                    messages: "Conversation",
                    actions: "PDO Actions",
                    timeline: "Timeline",
                    villager: "Reporter Information",
                    workers: "Available Workers",
                },
                labels: {
                    status: "Status",
                    priority: "Priority",
                    category: "Category",
                    villager: "Raised By",
                    village: "Village",
                    panchayat: "Panchayat",
                    created: "Created",
                    updated: "Last Updated",
                    description: "Description",
                    location: "Location Coordinates",
                    address: "Address",
                    specificLocation: "Specific Location",
                    sla: "SLA Deadline",
                    escalationLevel: "Escalation Level",
                    assignedWorker: "Assigned Worker",
                    verificationNotes: "VI Verification Notes",
                    viVerifiedBy: "Verified By",
                    viVerifiedAt: "Verified At",
                },
                actions: {
                    download: "Download Report",
                    assign: "Assign to Worker",
                    startProgress: "Start Work",
                    markResolved: "Mark as Resolved",
                    escalate: "Escalate to TDO",
                    send: "Send Message",
                    updateStatus: "Update Status",
                    openChat: "Open Chat",
                    refresh: "Refresh",
                    copyLink: "Copy Link",
                    share: "Share",
                    print: "Print",
                },
                status: {
                    submitted: "Submitted",
                    vi_verified: "VI Verified",
                    pdo_assigned: "Assigned to Worker",
                    in_progress: "In Progress",
                    resolved: "Resolved",
                    escalated: "Escalated to TDO",
                    rejected: "Rejected",
                },
                priority: {
                    low: "Low Priority",
                    medium: "Medium Priority",
                    high: "High Priority",
                    urgent: "Urgent Priority",
                },
                statusUpdate: {
                    title: "Update Issue Status",
                    assignWorker: "Assign Worker",
                    assignNotes: "Assignment Notes (Optional)",
                    startWork: "Mark as In Progress",
                    markResolved: "Mark as Resolved",
                    resolutionNotes: "Resolution Notes",
                    uploadPhoto: "Upload Resolution Photo",
                    takePhoto: "Take Photo",
                    choosePhoto: "Choose from Gallery",
                    escalate: "Escalate to TDO",
                    escalateNotes: "Escalation Notes",
                },
                chat: {
                    title: "Conversation",
                    placeholder: "Type your message...",
                    send: "Send",
                    noMessages: "No messages yet. Start the conversation.",
                },
                timeline: {
                    created: "Issue Created",
                    vi_verified: "Verified by VI",
                    pdo_assigned: "Assigned to Worker",
                    in_progress: "Work Started",
                    resolved: "Resolved",
                    escalated: "Escalated to TDO",
                },
                workers: {
                    title: "Available Workers",
                    name: "Name",
                    phone: "Phone",
                    email: "Email",
                    specialization: "Specialization",
                    availability: "Availability",
                    select: "Select Worker",
                    none: "No workers available",
                },
                villagerInfo: {
                    title: "Reporter Information",
                    name: "Name",
                    phone: "Phone",
                    email: "Email",
                    memberSince: "Member Since",
                },
                errors: {
                    generic: "Something went wrong",
                    workerRequired: "Please select a worker",
                    photoRequired: "Resolution photo is required",
                    notesRequired: "Please provide resolution notes",
                    invalidIssueId: "Invalid issue ID",
                    issueNotFound: "Issue not found",
                    noPermission: "You don't have permission to access this issue",
                },
                today: "Today",
                yesterday: "Yesterday",
                daysAgo: "days ago",
                hoursAgo: "hours ago",
                minutesAgo: "minutes ago",
                justNow: "just now",
            },
            kn: {
                title: "ಸಮಸ್ಯೆ ವಿವರಗಳು - ಪಿಡಿಒ",
                back: "ಸಮಸ್ಯೆಗಳಿಗೆ ಹಿಂತಿರುಗಿ",
                loading: "ಸಮಸ್ಯೆಯ ವಿವರಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...",
                error: "ಸಮಸ್ಯೆಯ ವಿವರಗಳನ್ನು ಲೋಡ್ ಮಾಡಲು ವಿಫಲವಾಗಿದೆ",
                success: {
                    statusUpdated: "✓ ಸ್ಥಿತಿ ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ",
                    messageSent: "✓ ಸಂದೇಶ ಯಶಸ್ವಿಯಾಗಿ ಕಳುಹಿಸಲಾಗಿದೆ",
                    assigned: "✓ ಸಮಸ್ಯೆ ಕೆಲಸಗಾರರಿಗೆ ನಿಯೋಜಿಸಲಾಗಿದೆ",
                    escalated: "✓ ಸಮಸ್ಯೆ ಟಿಡಿಒಗೆ ಹೆಚ್ಚಿಸಲಾಗಿದೆ",
                    resolved: "✓ ಸಮಸ್ಯೆ ಪರಿಹರಿಸಲಾಗಿದೆ ಎಂದು ಗುರುತು ಮಾಡಲಾಗಿದೆ",
                },
                sections: {
                    details: "ಸಮಸ್ಯೆ ವಿವರಗಳು",
                    location: "ಸ್ಥಳ",
                    media: "ಫೋಟೋ ಸಾಕ್ಷ್ಯ",
                    messages: "ಸಂವಾದ",
                    actions: "ಪಿಡಿಒ ಕ್ರಿಯೆಗಳು",
                    timeline: "ಸಮಯರೇಖೆ",
                    villager: "ವರದಿದಾರರ ಮಾಹಿತಿ",
                    workers: "ಲಭ್ಯವಿರುವ ಕೆಲಸಗಾರರು",
                },
                labels: {
                    status: "ಸ್ಥಿತಿ",
                    priority: "ಆದ್ಯತೆ",
                    category: "ವರ್ಗ",
                    villager: "ರೈಸ್ ಮಾಡಿದವರು",
                    village: "ಗ್ರಾಮ",
                    panchayat: "ಪಂಚಾಯತ್",
                    created: "ಸೃಷ್ಟಿಸಲಾಗಿದೆ",
                    updated: "ಕೊನೆಯ ನವೀಕರಣ",
                    description: "ವಿವರಣೆ",
                    location: "ಸ್ಥಳ ನಿರ್ದೇಶಾಂಕಗಳು",
                    address: "ವಿಳಾಸ",
                    specificLocation: "ನಿರ್ದಿಷ್ಟ ಸ್ಥಳ",
                    sla: "SLA ಗಡುವು",
                    escalationLevel: "ಹೆಚ್ಚಳ ಮಟ್ಟ",
                    assignedWorker: "ನಿಯೋಜಿತ ಕೆಲಸಗಾರ",
                    verificationNotes: "VI ಪರಿಶೀಲನಾ ಟಿಪ್ಪಣಿಗಳು",
                    viVerifiedBy: "ಪರಿಶೀಲಿಸಿದವರು",
                    viVerifiedAt: "ಪರಿಶೀಲನಾ ಸಮಯ",
                },
                actions: {
                    download: "ವರದಿ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ",
                    assign: "ಕೆಲಸಗಾರರಿಗೆ ನಿಯೋಜಿಸಿ",
                    startProgress: "ಕೆಲಸ ಪ್ರಾರಂಭಿಸಿ",
                    markResolved: "ಪರಿಹರಿಸಲಾಗಿದೆ ಎಂದು ಗುರುತಿಸಿ",
                    escalate: "TDO ಗೆ ಹೆಚ್ಚಿಸಿ",
                    send: "ಸಂದೇಶ ಕಳುಹಿಸಿ",
                    updateStatus: "ಸ್ಥಿತಿಯನ್ನು ನವೀಕರಿಸಿ",
                    openChat: "ಚಾಟ್ ತೆರೆಯಿರಿ",
                    refresh: "ರಿಫ್ರೆಶ್",
                    copyLink: "ಲಿಂಕ್ ನಕಲಿಸಿ",
                    share: "ಶೇರ್ ಮಾಡಿ",
                    print: "ಮುದ್ರಿಸಿ",
                },
                status: {
                    submitted: "ಸಲ್ಲಿಸಲಾಗಿದೆ",
                    vi_verified: "VI ಪರಿಶೀಲಿತ",
                    pdo_assigned: "ಕೆಲಸಗಾರರಿಗೆ ನಿಯೋಜಿಸಲಾಗಿದೆ",
                    in_progress: "ಪ್ರಗತಿಯಲ್ಲಿದೆ",
                    resolved: "ಪರಿಹರಿಸಲಾಗಿದೆ",
                    escalated: "TDO ಗೆ ಹೆಚ್ಚಿಸಲಾಗಿದೆ",
                    rejected: "ತಿರಸ್ಕರಿಸಲಾಗಿದೆ",
                },
                priority: {
                    low: "ಕಡಿಮೆ ಆದ್ಯತೆ",
                    medium: "ಮಧ್ಯಮ ಆದ್ಯತೆ",
                    high: "ಹೆಚ್ಚಿನ ಆದ್ಯತೆ",
                    urgent: "ತುರ್ತು ಆದ್ಯತೆ",
                },
                statusUpdate: {
                    title: "ಸಮಸ್ಯೆಯ ಸ್ಥಿತಿಯನ್ನು ನವೀಕರಿಸಿ",
                    assignWorker: "ಕೆಲಸಗಾರರನ್ನು ನಿಯೋಜಿಸಿ",
                    assignNotes: "ನಿಯೋಜನಾ ಟಿಪ್ಪಣಿಗಳು (ಐಚ್ಛಿಕ)",
                    startWork: "ಪ್ರಗತಿಯಲ್ಲಿ ಎಂದು ಗುರುತಿಸಿ",
                    markResolved: "ಪರಿಹರಿಸಲಾಗಿದೆ ಎಂದು ಗುರುತಿಸಿ",
                    resolutionNotes: "ಪರಿಹಾರ ಟಿಪ್ಪಣಿಗಳು",
                    uploadPhoto: "ಪರಿಹಾರ ಫೋಟೋ ಅಪ್ಲೋಡ್ ಮಾಡಿ",
                    takePhoto: "ಫೋಟೋ ತೆಗೆದುಕೊಳ್ಳಿ",
                    choosePhoto: "ಗ್ಯಾಲರಿಯಿಂದ ಆಯ್ಕೆಮಾಡಿ",
                    escalate: "TDO ಗೆ ಹೆಚ್ಚಿಸಿ",
                    escalateNotes: "ಹೆಚ್ಚಳ ಟಿಪ್ಪಣಿಗಳು",
                },
                chat: {
                    title: "ಸಂವಾದ",
                    placeholder: "ನಿಮ್ಮ ಸಂದೇಶವನ್ನು ಟೈಪ್ ಮಾಡಿ...",
                    send: "ಕಳುಹಿಸಿ",
                    noMessages: "ಇನ್ನೂ ಸಂದೇಶಗಳಿಲ್ಲ. ಸಂಭಾಷಣೆಯನ್ನು ಪ್ರಾರಂಭಿಸಿ.",
                },
                timeline: {
                    created: "ಸಮಸ್ಯೆ ಸೃಷ್ಟಿಸಲಾಗಿದೆ",
                    vi_verified: "VI ಅವರಿಂದ ಪರಿಶೀಲಿಸಲಾಗಿದೆ",
                    pdo_assigned: "ಕೆಲಸಗಾರರಿಗೆ ನಿಯೋಜಿಸಲಾಗಿದೆ",
                    in_progress: "ಕೆಲಸ ಪ್ರಾರಂಭಿಸಲಾಗಿದೆ",
                    resolved: "ಪರಿಹರಿಸಲಾಗಿದೆ",
                    escalated: "TDO ಗೆ ಹೆಚ್ಚಿಸಲಾಗಿದೆ",
                },
                workers: {
                    title: "ಲಭ್ಯವಿರುವ ಕೆಲಸಗಾರರು",
                    name: "ಹೆಸರು",
                    phone: "ಫೋನ್",
                    email: "ಇಮೇಲ್",
                    specialization: "ವಿಶೇಷತೆ",
                    availability: "ಲಭ್ಯತೆ",
                    select: "ಕೆಲಸಗಾರರನ್ನು ಆಯ್ಕೆಮಾಡಿ",
                    none: "ಯಾವುದೇ ಕೆಲಸಗಾರರು ಲಭ್ಯವಿಲ್ಲ",
                },
                villagerInfo: {
                    title: "ವರದಿದಾರರ ಮಾಹಿತಿ",
                    name: "ಹೆಸರು",
                    phone: "ಫೋನ್",
                    email: "ಇಮೇಲ್",
                    memberSince: "ಸದಸ್ಯರಾದ ದಿನಾಂಕ",
                },
                errors: {
                    generic: "ಏನೋ ತಪ್ಪಾಗಿದೆ",
                    workerRequired: "ದಯವಿಟ್ಟು ಕೆಲಸಗಾರರನ್ನು ಆಯ್ಕೆಮಾಡಿ",
                    photoRequired: "ಪರಿಹಾರ ಫೋಟೋ ಅಗತ್ಯವಿದೆ",
                    notesRequired: "ದಯವಿಟ್ಟು ಪರಿಹಾರ ಟಿಪ್ಪಣಿಗಳನ್ನು ನೀಡಿ",
                    invalidIssueId: "ಅಮಾನ್ಯ ಸಮಸ್ಯೆ ID",
                    issueNotFound: "ಸಮಸ್ಯೆ ಕಂಡುಬಂದಿಲ್ಲ",
                    noPermission: "ಈ ಸಮಸ್ಯೆಯನ್ನು ಪ್ರವೇಶಿಸಲು ನಿಮಗೆ ಅನುಮತಿ ಇಲ್ಲ",
                },
                today: "ಇಂದು",
                yesterday: "ನಿನ್ನೆ",
                daysAgo: "ದಿನಗಳ ಹಿಂದೆ",
                hoursAgo: "ಗಂಟೆಗಳ ಹಿಂದೆ",
                minutesAgo: "ನಿಮಿಷಗಳ ಹಿಂದೆ",
                justNow: "ಇದೀಗ",
            },
            hi: {
                title: "मुद्दे का विवरण - PDO",
                back: "मुद्दों पर वापस जाएं",
                loading: "मुद्दे का विवरण लोड हो रहा है...",
                error: "मुद्दे का विवरण लोड करने में विफल",
                success: {
                    statusUpdated: "✓ स्थिति सफलतापूर्वक अपडेट की गई",
                    messageSent: "✓ संदेश सफलतापूर्वक भेजा गया",
                    assigned: "✓ मुद्दा कार्यकर्ता को असाइन किया गया",
                    escalated: "✓ मुद्दा TDO को एस्केलेट किया गया",
                    resolved: "✓ मुद्दा हल किया गया चिह्नित",
                },
                sections: {
                    details: "मुद्दे का विवरण",
                    location: "स्थान",
                    media: "फोटो सबूत",
                    messages: "बातचीत",
                    actions: "PDO कार्रवाई",
                    timeline: "समयरेखा",
                    villager: "रिपोर्टर जानकारी",
                    workers: "उपलब्ध कार्यकर्ता",
                },
                labels: {
                    status: "स्थिति",
                    priority: "प्राथमिकता",
                    category: "श्रेणी",
                    villager: "रिपोर्ट किया गया",
                    village: "गांव",
                    panchayat: "पंचायत",
                    created: "बनाया गया",
                    updated: "अंतिम अपडेट",
                    description: "विवरण",
                    location: "स्थान निर्देशांक",
                    address: "पता",
                    specificLocation: "विशिष्ट स्थान",
                    sla: "SLA समय सीमा",
                    escalationLevel: "एस्केलेशन लेवल",
                    assignedWorker: "असाइन कार्यकर्ता",
                    verificationNotes: "VI वेरिफिकेशन नोट्स",
                    viVerifiedBy: "वेरिफाई किया गया",
                    viVerifiedAt: "वेरिफिकेशन समय",
                },
                actions: {
                    download: "रिपोर्ट डाउनलोड करें",
                    assign: "कार्यकर्ता को असाइन करें",
                    startProgress: "काम शुरू करें",
                    markResolved: "हल किया गया चिह्नित करें",
                    escalate: "TDO को एस्केलेट करें",
                    send: "संदेश भेजें",
                    updateStatus: "स्थिति अपडेट करें",
                    openChat: "चैट खोलें",
                    refresh: "रिफ्रेश",
                    copyLink: "लिंक कॉपी करें",
                    share: "शेयर करें",
                    print: "प्रिंट करें",
                },
                status: {
                    submitted: "सबमिट",
                    vi_verified: "VI वेरिफाइड",
                    pdo_assigned: "कार्यकर्ता को असाइन",
                    in_progress: "इन प्रोग्रेस",
                    resolved: "हल",
                    escalated: "TDO को एस्केलेट",
                    rejected: "अस्वीकृत",
                },
                priority: {
                    low: "लो प्रायोरिटी",
                    medium: "मीडियम प्रायोरिटी",
                    high: "हाई प्रायोरिटी",
                    urgent: "अर्जेंट प्रायोरिटी",
                },
                statusUpdate: {
                    title: "मुद्दे की स्थिति अपडेट करें",
                    assignWorker: "कार्यकर्ता असाइन करें",
                    assignNotes: "असाइनमेंट नोट्स (ऑप्शनल)",
                    startWork: "इन प्रोग्रेस चिह्नित करें",
                    markResolved: "हल किया गया चिह्नित करें",
                    resolutionNotes: "समाधान नोट्स",
                    uploadPhoto: "समाधान फोटो अपलोड करें",
                    takePhoto: "फोटो लें",
                    choosePhoto: "गैलरी से चुनें",
                    escalate: "TDO को एस्केलेट करें",
                    escalateNotes: "एस्केलेशन नोट्स",
                },
                chat: {
                    title: "बातचीत",
                    placeholder: "अपना संदेश टाइप करें...",
                    send: "भेजें",
                    noMessages: "अभी तक कोई संदेश नहीं। बातचीत शुरू करें।",
                },
                timeline: {
                    created: "मुद्दा बनाया गया",
                    vi_verified: "VI द्वारा वेरिफाई किया गया",
                    pdo_assigned: "कार्यकर्ता को असाइन किया गया",
                    in_progress: "काम शुरू हुआ",
                    resolved: "हल किया गया",
                    escalated: "TDO को एस्केलेट किया गया",
                },
                workers: {
                    title: "उपलब्ध कार्यकर्ता",
                    name: "नाम",
                    phone: "फोन",
                    email: "ईमेल",
                    specialization: "विशेषज्ञता",
                    availability: "उपलब्धता",
                    select: "कार्यकर्ता चुनें",
                    none: "कोई कार्यकर्ता उपलब्ध नहीं",
                },
                villagerInfo: {
                    title: "रिपोर्टर जानकारी",
                    name: "नाम",
                    phone: "फोन",
                    email: "ईमेल",
                    memberSince: "सदस्यता तिथि",
                },
                errors: {
                    generic: "कुछ गलत हुआ",
                    workerRequired: "कृपया कार्यकर्ता चुनें",
                    photoRequired: "समाधान फोटो आवश्यक है",
                    notesRequired: "कृपया समाधान नोट्स प्रदान करें",
                    invalidIssueId: "अमान्य मुद्दा ID",
                    issueNotFound: "मुद्दा नहीं मिला",
                    noPermission: "आपके पास इस मुद्दे को एक्सेस करने की अनुमति नहीं है",
                },
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

    useEffect(() => {
        // Check if issueId is valid before proceeding
        if (!issueId || typeof issueId !== 'string' || issueId.trim() === '') {
            setError(t.errors.invalidIssueId);
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                setLoading(true);
                setError("");

                const user = auth.currentUser;
                if (!user) {
                    router.push(`/${locale}/authority/login`);
                    return;
                }

                // Get PDO profile
                const authRef = doc(db, "authorities", user.uid);
                const authSnap = await getDoc(authRef);

                if (!authSnap.exists() || authSnap.data()?.role !== "pdo") {
                    setError(t.errors.noPermission);
                    setLoading(false);
                    return;
                }

                const authData = authSnap.data();
                setAuthorityInfo({
                    name: authData.name || "PDO",
                    role: authData.role,
                    panchayatId: authData.panchayatId,
                });

                // Load workers for this panchayat
                const workersQuery = query(
                    collection(db, "workers"),
                    where("panchayatId", "==", authData.panchayatId)
                );
                const workersSnap = await getDocs(workersQuery);
                const workersList: Worker[] = [];
                workersSnap.forEach(doc => {
                    workersList.push({
                        id: doc.id,
                        ...doc.data()
                    } as Worker);
                });
                setWorkers(workersList);

                // Get issue - ensure issueId is valid
                const issueRef = doc(db, "issues", issueId);
                const issueSnap = await getDoc(issueRef);

                if (!issueSnap.exists()) {
                    setError(t.errors.issueNotFound);
                    setLoading(false);
                    return;
                }

                const issueData = issueSnap.data();

                // Check if this issue belongs to the PDO's panchayat
                if (issueData.panchayatId !== authData.panchayatId) {
                    setError(t.errors.noPermission);
                    setLoading(false);
                    return;
                }

                setIssue({
                    id: issueSnap.id,
                    ...issueData
                } as Issue);

                // Load villager info if available
                if (issueData.villagerId) {
                    const villagerRef = doc(db, "villagers", issueData.villagerId);
                    const villagerSnap = await getDoc(villagerRef);
                    if (villagerSnap.exists()) {
                        setVillagerInfo(villagerSnap.data());
                    }
                }

                // Listen to messages
                const messagesRef = collection(db, `issues/${issueId}/messages`);
                const messagesQuery = query(messagesRef, orderBy("createdAt", "asc"));

                const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
                    const msgs: Message[] = [];
                    snapshot.forEach((doc) => {
                        const data = doc.data();
                        msgs.push({
                            id: doc.id,
                            text: data.text || "",
                            senderUid: data.senderUid || data.userId || "",
                            senderName: data.senderName || data.username || "Unknown",
                            senderRole: data.senderRole || data.userRole || "user",
                            createdAt: data.createdAt || data.timestamp || serverTimestamp(),
                            type: data.type || "user"
                        } as Message);
                    });
                    setMessages(msgs);

                    // Scroll to bottom
                    setTimeout(() => {
                        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                });

                // Listen to issue updates
                const issueUnsubscribe = onSnapshot(issueRef, (doc) => {
                    if (doc.exists()) {
                        const updatedData = doc.data();
                        // Check if still belongs to PDO's panchayat
                        if (updatedData.panchayatId === authData.panchayatId) {
                            setIssue({
                                id: doc.id,
                                ...updatedData
                            } as Issue);
                        }
                    }
                });

                return () => {
                    unsubscribe();
                    issueUnsubscribe();
                };
            } catch (err: any) {
                console.error("Error:", err);
                setError(err.message || t.errors.generic);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [issueId, locale, router, t]);

    const sendMessage = async () => {
        if (!newMessage.trim() || sendingMessage) return;

        try {
            setSendingMessage(true);
            const user = auth.currentUser;
            if (!user || !authorityInfo || !issue) return;

            const messagesRef = collection(db, `issues/${issueId}/messages`);
            await addDoc(messagesRef, {
                text: newMessage,
                senderUid: user.uid,
                senderName: authorityInfo.name,
                senderRole: "pdo",
                createdAt: serverTimestamp(),
                panchayatId: issue.panchayatId
            });

            setNewMessage("");
            setSuccess(t.success.messageSent);
            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            console.error("Error sending message:", err);
            setError("Failed to send message");
        } finally {
            setSendingMessage(false);
        }
    };

    const updateIssueStatus = async () => {
        if (!issue || saving) return;

        try {
            setSaving(true);
            setError("");

            const updates: any = {
                status: selectedStatus,
                updatedAt: serverTimestamp(),
            };

            // Add specific data based on status
            switch (selectedStatus) {
                case "pdo_assigned":
                    if (!selectedWorker) {
                        setError(t.errors.workerRequired);
                        setSaving(false);
                        return;
                    }
                    updates.assignedAt = serverTimestamp();
                    updates.assignedWorker = {
                        name: selectedWorker.name,
                        phone: selectedWorker.phone,
                        email: selectedWorker.email,
                        id: selectedWorker.id
                    };
                    if (assignNotes) {
                        updates.assignNotes = assignNotes;
                    }
                    break;

                case "in_progress":
                    updates.inProgressAt = serverTimestamp();
                    break;

                case "resolved":
                    if (!resolutionNotes.trim()) {
                        setError(t.errors.notesRequired);
                        setSaving(false);
                        return;
                    }
                    updates.resolvedAt = serverTimestamp();
                    updates.resolutionNotes = resolutionNotes;
                    // Handle photo upload if available
                    if (resolutionPhoto) {
                        // Convert photo to base64 (for demo)
                        const reader = new FileReader();
                        reader.onloadend = async () => {
                            const base64String = reader.result;
                            updates.resolvedPhoto = base64String;
                            await finalizeStatusUpdate(updates);
                        };
                        reader.readAsDataURL(resolutionPhoto);
                        return; // Early return, finalize will be called in onloadend
                    }
                    break;

                case "escalated":
                    updates.escalatedAt = serverTimestamp();
                    updates.escalationLevel = "tdo";
                    break;
            }

            await finalizeStatusUpdate(updates);
        } catch (err: any) {
            console.error("Error updating status:", err);
            setError(err.message || "Failed to update status");
        } finally {
            setSaving(false);
        }
    };

    const finalizeStatusUpdate = async (updates: any) => {
        try {
            const issueRef = doc(db, "issues", issueId);
            await updateDoc(issueRef, updates);

            // Add system message
            const messagesRef = collection(db, `issues/${issueId}/messages`);
            await addDoc(messagesRef, {
                text: `Status updated to: ${t.status[selectedStatus] || selectedStatus}`,
                senderUid: "system",
                senderName: "System",
                senderRole: "system",
                createdAt: serverTimestamp(),
                type: "system",
                panchayatId: issue?.panchayatId
            });

            setSuccess(t.success.statusUpdated);
            setTimeout(() => setSuccess(""), 3000);
            setShowStatusUpdate(false);
            resetStatusForm();
        } catch (err: any) {
            throw err;
        }
    };

    const resetStatusForm = () => {
        setSelectedStatus("");
        setSelectedWorker(null);
        setAssignNotes("");
        setResolutionPhoto(null);
        setResolutionPhotoPreview("");
        setResolutionNotes("");
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setResolutionPhoto(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setResolutionPhotoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const downloadReport = async () => {
        if (!issue) return;

        try {
            const { jsPDF } = await import('jspdf');
            const doc = new jsPDF();

            // Header
            doc.setFontSize(20);
            doc.text('PDO Issue Report', 20, 20);

            // Issue Details
            doc.setFontSize(12);
            let y = 40;

            doc.text(`Issue ID: ${issue.id}`, 20, y); y += 10;
            doc.text(`Title: ${issue.title}`, 20, y); y += 10;
            doc.text(`Status: ${t.status[issue.status] || issue.status}`, 20, y); y += 10;
            doc.text(`Priority: ${t.priority[issue.priority] || issue.priority}`, 20, y); y += 10;
            doc.text(`Category: ${issue.category}`, 20, y); y += 10;
            doc.text(`Raised By: ${issue.villagerName}`, 20, y); y += 10;
            doc.text(`Village: ${issue.villageName || issue.villageId}`, 20, y); y += 10;
            doc.text(`Panchayat: ${issue.panchayatName || issue.panchayatId}`, 20, y); y += 10;
            doc.text(`Created: ${fmtDate(issue.createdAt)}`, 20, y); y += 10;

            // Description
            y += 5;
            doc.text('Description:', 20, y); y += 10;
            const splitDesc = doc.splitTextToSize(issue.description || "", 170);
            doc.text(splitDesc, 20, y); y += splitDesc.length * 7;

            // Footer
            doc.setFontSize(10);
            doc.text(`Report generated by ${authorityInfo?.name || 'PDO'} on ${new Date().toLocaleDateString()}`, 20, 280);

            doc.save(`pdo-issue-report-${issue.id}.pdf`);
        } catch (err) {
            console.error("Error generating PDF:", err);
            setError("Failed to generate report");
        }
    };

    const copyIssueLink = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url).then(() => {
            setSuccess("Link copied to clipboard");
            setTimeout(() => setSuccess(""), 2000);
        });
    };

    const openInMaps = () => {
        if (!issue?.latitude || !issue?.longitude) return;
        const url = `https://www.google.com/maps?q=${issue.latitude},${issue.longitude}&z=17`;
        window.open(url, '_blank');
    };

    const StatusIcon = issue ? getStatusIcon(issue.status) : FiAlertCircle;
    const PriorityIcon = FiFlag;

    if (loading) {
        return (
            <Screen padded>
                <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-white p-4 safe-padding">
                    <style>{`
                        @keyframes shimmer {
                            0% { transform: translateX(-100%); }
                            100% { transform: translateX(100%); }
                        }
                        .shimmer {
                            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
                            animation: shimmer 1.5s infinite;
                        }
                    `}</style>

                    <div className="flex flex-col items-center justify-center h-full">
                        <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mb-6"></div>
                        <p className="text-green-700 font-bold text-lg">{t.loading}</p>
                    </div>
                </div>
            </Screen>
        );
    }

    if (error || !issue) {
        return (
            <Screen padded>
                <div className="min-h-screen bg-gradient-to-b from-red-50 via-white to-white p-4 safe-padding">
                    <button
                        onClick={() => router.push(`/${locale}/authority/pdo/issues`)}
                        className="p-3 rounded-2xl border-2 border-red-100 bg-white hover:bg-red-50 mb-8 transition-all active:scale-95 flex items-center gap-2"
                    >
                        <FiArrowLeft className="w-5 h-5 text-red-700" />
                        <span className="text-sm font-semibold text-red-800">{t.back}</span>
                    </button>

                    <div className="bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-3xl p-8 text-center shadow-xl">
                        <FiAlertCircle className="w-16 h-16 mx-auto mb-6 animate-pulse" />
                        <h2 className="text-2xl font-bold mb-3">Error</h2>
                        <p className="mb-6 text-lg font-medium">{error || t.errors.issueNotFound}</p>
                        <div className="space-y-4">
                            <button
                                onClick={() => router.push(`/${locale}/authority/pdo/issues`)}
                                className="w-full px-6 py-3 bg-white text-red-600 rounded-xl font-bold hover:shadow-lg transition-all active:scale-95"
                            >
                                {t.back}
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                className="w-full px-6 py-3 bg-red-700 text-white rounded-xl font-bold hover:shadow-lg transition-all active:scale-95"
                            >
                                <span className="flex items-center justify-center gap-2">
                                    <FiRefreshCw className="w-4 h-4" />
                                    Try Again
                                </span>
                            </button>
                        </div>
                    </div>

                    <div className="mt-8 bg-white border-2 border-red-100 rounded-2xl p-6">
                        <h3 className="font-bold text-red-900 mb-3 flex items-center gap-2">
                            <FiAlertCircle className="w-5 h-5" />
                            Troubleshooting Tips
                        </h3>
                        <ul className="space-y-2 text-red-800/80">
                            <li className="flex items-start gap-2">
                                <span className="text-red-600">•</span>
                                <span>Check if you have the correct issue ID</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-red-600">•</span>
                                <span>Make sure you have permission to access this issue</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-red-600">•</span>
                                <span>The issue might have been deleted or archived</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-red-600">•</span>
                                <span>Contact your supervisor if the problem persists</span>
                            </li>
                        </ul>
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
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-5px); }
                }
                .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
                .animate-slideIn { animation: slideIn 0.3s ease-out forwards; }
                .animate-pulse { animation: pulse 2s ease-in-out infinite; }
                .animate-float { animation: float 3s ease-in-out infinite; }
                .safe-padding {
                    padding-top: env(safe-area-inset-top);
                    padding-bottom: env(safe-area-inset-bottom);
                }
                
                .status-timeline {
                    position: relative;
                }
                
                .status-timeline::before {
                    content: '';
                    position: absolute;
                    left: 15px;
                    top: 0;
                    bottom: 0;
                    width: 2px;
                    background: linear-gradient(to bottom, #10b981, #059669, #047857);
                }
                
                .chat-bubble {
                    position: relative;
                    border-radius: 20px;
                    max-width: 80%;
                }
                
                .chat-bubble::after {
                    content: '';
                    position: absolute;
                    bottom: -8px;
                    width: 16px;
                    height: 16px;
                    transform: rotate(45deg);
                }
                
                .chat-bubble.user::after {
                    right: 10px;
                    background: linear-gradient(135deg, #10b981, #059669);
                }
                
                .chat-bubble.other::after {
                    left: 10px;
                    background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
                }
            `}</style>

            <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-white p-4 pb-32 safe-padding">
                {/* Header */}
                <div className="mb-6 animate-fadeIn">
                    <div className="flex items-center justify-between mb-4">
                        <button
                            onClick={() => router.push(`/${locale}/authority/pdo/issues`)}
                            className="p-3 rounded-2xl border-2 border-green-100 bg-white hover:bg-green-50 active:scale-95 transition-all duration-200 flex items-center gap-2"
                        >
                            <FiArrowLeft className="w-5 h-5 text-green-700" />
                            <span className="text-sm font-semibold text-green-800 hidden sm:inline">{t.back}</span>
                        </button>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => window.location.reload()}
                                className="p-3 rounded-2xl border-2 border-green-100 bg-white hover:bg-green-50 active:scale-95 transition-all duration-200"
                            >
                                <FiRefreshCw className="w-5 h-5 text-green-700" />
                            </button>

                            <button
                                onClick={() => setShowChat(!showChat)}
                                className="p-3 rounded-2xl border-2 border-green-100 bg-white hover:bg-green-50 active:scale-95 transition-all duration-200 relative"
                            >
                                <FiMessageSquare className="w-5 h-5 text-green-700" />
                                {messages.length > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                        {messages.length}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            <h1 className="text-xl sm:text-2xl font-bold text-green-900 tracking-tight mb-2 line-clamp-2">
                                {issue.title}
                            </h1>
                            <div className="flex flex-wrap items-center gap-2">
                                <div className={`px-3 py-1.5 rounded-full text-sm font-bold text-white ${getStatusColor(issue.status)}`}>
                                    <span className="flex items-center gap-2">
                                        <StatusIcon className="w-4 h-4" />
                                        {t.status[issue.status] || issue.status}
                                    </span>
                                </div>

                                <div className={`px-3 py-1.5 rounded-full text-sm font-bold text-white ${getPriorityColor(issue.priority)}`}>
                                    <span className="flex items-center gap-2">
                                        <PriorityIcon className="w-4 h-4" />
                                        {t.priority[issue.priority] || issue.priority}
                                    </span>
                                </div>

                                <div className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                                    {issue.category}
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
                {error && (
                    <div className="mb-4 animate-fadeIn">
                        <div className="bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-2xl p-4 shadow-lg flex items-center gap-3">
                            <FiAlertCircle className="w-5 h-5 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="font-bold text-sm">Error</p>
                                <p className="text-xs opacity-90">{error}</p>
                            </div>
                            <button
                                onClick={() => setError("")}
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
                            <FiActivity className="w-5 h-5" />
                            {t.sections.actions}
                        </h3>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <button
                                onClick={() => {
                                    setSelectedStatus("pdo_assigned");
                                    setShowStatusUpdate(true);
                                }}
                                disabled={issue.status !== "vi_verified"}
                                className={`p-3 rounded-xl font-bold text-white transition-all active:scale-95 flex flex-col items-center justify-center gap-2 ${issue.status !== "vi_verified"
                                    ? 'bg-gradient-to-r from-gray-400 to-gray-500 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-blue-600 to-cyan-700 hover:shadow-lg'
                                    }`}
                            >
                                <FiUserPlus className="w-5 h-5" />
                                <span className="text-xs">{t.actions.assign}</span>
                            </button>

                            <button
                                onClick={() => {
                                    setSelectedStatus("in_progress");
                                    setShowStatusUpdate(true);
                                }}
                                disabled={issue.status !== "pdo_assigned"}
                                className={`p-3 rounded-xl font-bold text-white transition-all active:scale-95 flex flex-col items-center justify-center gap-2 ${issue.status !== "pdo_assigned"
                                    ? 'bg-gradient-to-r from-gray-400 to-gray-500 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-indigo-600 to-blue-700 hover:shadow-lg'
                                    }`}
                            >
                                <FiPlayCircle className="w-5 h-5" />
                                <span className="text-xs">{t.actions.startProgress}</span>
                            </button>

                            <button
                                onClick={() => {
                                    setSelectedStatus("resolved");
                                    setShowStatusUpdate(true);
                                }}
                                disabled={!["in_progress", "pdo_assigned"].includes(issue.status)}
                                className={`p-3 rounded-xl font-bold text-white transition-all active:scale-95 flex flex-col items-center justify-center gap-2 ${!["in_progress", "pdo_assigned"].includes(issue.status)
                                    ? 'bg-gradient-to-r from-gray-400 to-gray-500 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-green-600 to-emerald-700 hover:shadow-lg'
                                    }`}
                            >
                                <FiCheckCircle className="w-5 h-5" />
                                <span className="text-xs">{t.actions.markResolved}</span>
                            </button>

                            <button
                                onClick={() => {
                                    setSelectedStatus("escalated");
                                    setShowStatusUpdate(true);
                                }}
                                disabled={["resolved", "escalated", "closed"].includes(issue.status)}
                                className={`p-3 rounded-xl font-bold text-white transition-all active:scale-95 flex flex-col items-center justify-center gap-2 ${["resolved", "escalated", "closed"].includes(issue.status)
                                    ? 'bg-gradient-to-r from-gray-400 to-gray-500 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-red-600 to-pink-700 hover:shadow-lg'
                                    }`}
                            >
                                <FiFlag className="w-5 h-5" />
                                <span className="text-xs">{t.actions.escalate}</span>
                            </button>
                        </div>

                        <div className="mt-4 pt-4 border-t border-green-100 flex gap-2">
                            <button
                                onClick={downloadReport}
                                className="flex-1 p-3 rounded-xl border-2 border-green-200 bg-white text-green-700 hover:bg-green-50 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                <FiDownload className="w-4 h-4" />
                                <span className="text-sm font-semibold">{t.actions.download}</span>
                            </button>

                            <button
                                onClick={copyIssueLink}
                                className="flex-1 p-3 rounded-xl border-2 border-blue-200 bg-white text-blue-700 hover:bg-blue-50 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                <FiCopy className="w-4 h-4" />
                                <span className="text-sm font-semibold">{t.actions.copyLink}</span>
                            </button>
                        </div>
                    </div>

                    {/* Issue Details Card */}
                    <div className="bg-white border-2 border-green-100 rounded-2xl p-5 shadow-lg">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-green-900 flex items-center gap-2">
                                <FiFolder className="w-5 h-5" />
                                {t.sections.details}
                            </h3>
                            <button
                                onClick={() => setShowDescription(!showDescription)}
                                className="p-2 hover:bg-green-50 rounded-lg"
                            >
                                {showDescription ? <FiChevronUp className="w-5 h-5 text-green-700" /> : <FiChevronDown className="w-5 h-5 text-green-700" />}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm text-green-800/70 mb-1">{t.labels.category}</p>
                                    <p className="font-bold text-green-900">{issue.category || "—"}</p>
                                </div>

                                <div>
                                    <p className="text-sm text-green-800/70 mb-1">{t.labels.panchayat}</p>
                                    <p className="font-bold text-green-900">{issue.panchayatName || issue.panchayatId || "—"}</p>
                                </div>

                                <div>
                                    <p className="text-sm text-green-800/70 mb-1">{t.labels.village}</p>
                                    <p className="font-bold text-green-900">{issue.villageName || issue.villageId || "—"}</p>
                                </div>

                                <div>
                                    <p className="text-sm text-green-800/70 mb-1">{t.labels.villager}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <FiUser className="w-4 h-4 text-green-700" />
                                        <span className="font-bold text-green-900">{issue.villagerName || "—"}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm text-green-800/70 mb-1">{t.labels.created}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <FiCalendar className="w-4 h-4 text-green-700" />
                                        <span className="font-bold text-green-900">
                                            {issue.createdAt ? formatRelativeDate(fmtDate(issue.createdAt), t) : "—"}
                                        </span>
                                    </div>
                                </div>

                                {issue.updatedAt && (
                                    <div>
                                        <p className="text-sm text-green-800/70 mb-1">{t.labels.updated}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <FiClock className="w-4 h-4 text-green-700" />
                                            <span className="font-bold text-green-900">
                                                {formatRelativeDate(fmtDate(issue.updatedAt), t)}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {issue.assignedWorker && (
                                    <div>
                                        <p className="text-sm text-green-800/70 mb-1">{t.labels.assignedWorker}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <FiUserPlus className="w-4 h-4 text-green-700" />
                                            <span className="font-bold text-green-900">{issue.assignedWorker.name}</span>
                                            {issue.assignedWorker.phone && (
                                                <span className="text-sm text-green-700/70">({issue.assignedWorker.phone})</span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Description */}
                        {showDescription && issue.description && (
                            <div className="mt-4 pt-4 border-t border-green-100 animate-fadeIn">
                                <p className="text-sm text-green-800/70 mb-2">{t.labels.description}</p>
                                <div className="bg-green-50 p-4 rounded-xl">
                                    <p className="text-green-800 whitespace-pre-wrap">{issue.description}</p>
                                </div>
                            </div>
                        )}

                        {/* VI Verification Info */}
                        {issue.viVerifiedAt && (
                            <div className="mt-4 pt-4 border-t border-green-100">
                                <div className="flex items-center gap-2 mb-3">
                                    <FiCheckCircle className="w-5 h-5 text-purple-600" />
                                    <h4 className="font-bold text-purple-900">VI Verification</h4>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {issue.viVerifiedBy && (
                                        <div>
                                            <p className="text-sm text-purple-800/70 mb-1">{t.labels.viVerifiedBy}</p>
                                            <p className="font-bold text-purple-900">{issue.viVerifiedBy}</p>
                                        </div>
                                    )}

                                    {issue.viVerifiedAt && (
                                        <div>
                                            <p className="text-sm text-purple-800/70 mb-1">{t.labels.viVerifiedAt}</p>
                                            <p className="font-bold text-purple-900">{formatRelativeDate(fmtDate(issue.viVerifiedAt), t)}</p>
                                        </div>
                                    )}

                                    {issue.viVerificationNotes && (
                                        <div className="sm:col-span-2">
                                            <p className="text-sm text-purple-800/70 mb-1">{t.labels.verificationNotes}</p>
                                            <p className="text-purple-800/80">{issue.viVerificationNotes}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Location Card */}
                    {(issue.latitude && issue.longitude) || issue.address ? (
                        <div className="bg-white border-2 border-green-100 rounded-2xl p-5 shadow-lg">
                            <h3 className="font-bold text-green-900 mb-4 flex items-center gap-2">
                                <FiMapPin className="w-5 h-5 text-green-600" />
                                {t.sections.location}
                            </h3>

                            <div className="space-y-4">
                                {issue.address && (
                                    <div>
                                        <p className="text-sm text-green-800/70 mb-1">{t.labels.address}</p>
                                        <p className="font-bold text-green-900">{issue.address}</p>
                                    </div>
                                )}

                                {issue.specificLocation && (
                                    <div>
                                        <p className="text-sm text-green-800/70 mb-1">{t.labels.specificLocation}</p>
                                        <p className="font-bold text-green-900">{issue.specificLocation}</p>
                                    </div>
                                )}

                                {issue.latitude && issue.longitude && (
                                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="font-bold text-blue-900 flex items-center gap-2">
                                                <FiMapPin className="w-5 h-5" />
                                                {t.labels.location}
                                            </h4>
                                            <button
                                                onClick={openInMaps}
                                                className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-sm rounded-lg font-bold hover:shadow-lg transition-all active:scale-95 flex items-center gap-2"
                                            >
                                                <FiNavigation className="w-4 h-4" />
                                                Open in Maps
                                            </button>
                                        </div>

                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between items-center">
                                                <span className="text-blue-800/70">Latitude:</span>
                                                <span className="font-mono font-bold text-blue-900">
                                                    {issue.latitude.toFixed(6)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-blue-800/70">Longitude:</span>
                                                <span className="font-mono font-bold text-blue-900">
                                                    {issue.longitude.toFixed(6)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : null}

                    {/* Media Card */}
                    {issue.images && issue.images.length > 0 && (
                        <div className="bg-white border-2 border-green-100 rounded-2xl p-5 shadow-lg">
                            <h3 className="font-bold text-green-900 mb-4 flex items-center gap-2">
                                <FiImage className="w-5 h-5 text-green-600" />
                                {t.sections.media}
                            </h3>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {issue.images.map((img, index) => (
                                    <div key={index} className="relative group">
                                        <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden border-2 border-green-200">
                                            <img
                                                src={img}
                                                alt={`Issue evidence ${index + 1}`}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='12' text-anchor='middle' dy='.3em' fill='%239ca3af'%3EImage%3C/text%3E%3C/svg%3E";
                                                }}
                                            />
                                        </div>
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 rounded-xl flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                                            <button
                                                onClick={() => window.open(img, '_blank')}
                                                className="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-md hover:shadow-lg transition-all"
                                            >
                                                <FiExternalLink className="w-4 h-4 text-green-700" />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const link = document.createElement('a');
                                                    link.href = img;
                                                    link.download = `issue-${issue.id}-image-${index + 1}.jpg`;
                                                    document.body.appendChild(link);
                                                    link.click();
                                                    document.body.removeChild(link);
                                                }}
                                                className="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-md hover:shadow-lg transition-all"
                                            >
                                                <FiDownload className="w-4 h-4 text-green-700" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
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
                                        <p className="font-bold text-green-900">{t.villagerInfo.title}</p>
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
                                                <p className="text-sm text-green-800/70 mb-1">{t.villagerInfo.name}</p>
                                                <p className="font-bold text-green-900">{villagerInfo.name || "—"}</p>
                                            </div>

                                            <div>
                                                <p className="text-sm text-green-800/70 mb-1">{t.villagerInfo.phone}</p>
                                                <p className="font-bold text-green-900 flex items-center gap-2">
                                                    <FiPhone className="w-4 h-4" />
                                                    {villagerInfo.phone || "—"}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-sm text-green-800/70 mb-1">{t.villagerInfo.email}</p>
                                                <p className="font-bold text-green-900 flex items-center gap-2 truncate">
                                                    <FiMail className="w-4 h-4" />
                                                    {villagerInfo.email || "—"}
                                                </p>
                                            </div>

                                            {villagerInfo.createdAt && (
                                                <div>
                                                    <p className="text-sm text-green-800/70 mb-1">{t.villagerInfo.memberSince}</p>
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

                    {/* Available Workers */}
                    {workers.length > 0 && issue.status === "vi_verified" && (
                        <div className="bg-white border-2 border-green-100 rounded-2xl p-5 shadow-lg">
                            <button
                                onClick={() => setShowWorkers(!showWorkers)}
                                className="w-full flex items-center justify-between"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-cyan-200 rounded-xl flex items-center justify-center">
                                        <FiUsers className="w-6 h-6 text-blue-700" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-green-900">{t.workers.title}</p>
                                        <p className="text-green-700/70 text-sm">
                                            {workers.length} workers available. Tap to view
                                        </p>
                                    </div>
                                </div>
                                {showWorkers ? (
                                    <FiChevronUp className="w-5 h-5 text-green-700" />
                                ) : (
                                    <FiChevronDown className="w-5 h-5 text-green-700" />
                                )}
                            </button>

                            {showWorkers && (
                                <div className="mt-4 animate-fadeIn">
                                    <div className="space-y-3">
                                        {workers.map((worker) => (
                                            <div
                                                key={worker.id}
                                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedWorker?.id === worker.id
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-green-100 hover:border-green-300'
                                                    }`}
                                                onClick={() => setSelectedWorker(worker)}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h4 className="font-bold text-green-900">{worker.name}</h4>
                                                        <div className="flex items-center gap-4 mt-1">
                                                            <span className="text-sm text-green-700/70 flex items-center gap-1">
                                                                <FiPhone className="w-3 h-3" />
                                                                {worker.phone}
                                                            </span>
                                                            {worker.specialization && (
                                                                <span className="text-sm text-blue-700/70">
                                                                    {worker.specialization}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {selectedWorker?.id === worker.id && (
                                                        <FiCheckCircle className="w-5 h-5 text-blue-600" />
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {selectedWorker && (
                                        <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl animate-fadeIn">
                                            <p className="text-sm text-blue-800/70 mb-2">
                                                Selected Worker: <span className="font-bold text-blue-900">{selectedWorker.name}</span>
                                            </p>
                                            <button
                                                onClick={() => {
                                                    setSelectedStatus("pdo_assigned");
                                                    setShowStatusUpdate(true);
                                                }}
                                                className="w-full p-3 bg-gradient-to-r from-blue-600 to-cyan-700 text-white rounded-xl font-bold hover:shadow-lg transition-all active:scale-95"
                                            >
                                                Assign This Worker
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Status Update Modal */}
                {showStatusUpdate && (
                    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/50 backdrop-blur-sm sm:items-center sm:p-0 animate-fadeIn">
                        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl animate-slideIn max-h-[90vh] overflow-y-auto">
                            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                                <h3 className="font-bold text-green-900">{t.statusUpdate.title}</h3>
                                <button
                                    onClick={() => {
                                        setShowStatusUpdate(false);
                                        resetStatusForm();
                                    }}
                                    className="p-2 hover:bg-gray-100 rounded-lg"
                                >
                                    <FiXCircle className="w-5 h-5 text-gray-600" />
                                </button>
                            </div>

                            <div className="p-4 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        New Status: <span className="font-bold text-green-700">{t.status[selectedStatus] || selectedStatus}</span>
                                    </label>

                                    {selectedStatus === "pdo_assigned" && (
                                        <div className="space-y-4 animate-fadeIn">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    {t.statusUpdate.assignWorker}
                                                </label>
                                                {selectedWorker ? (
                                                    <div className="p-3 bg-blue-50 border-2 border-blue-200 rounded-xl">
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <p className="font-bold text-blue-900">{selectedWorker.name}</p>
                                                                <p className="text-sm text-blue-700/70">{selectedWorker.phone}</p>
                                                            </div>
                                                            <button
                                                                onClick={() => setSelectedWorker(null)}
                                                                className="p-2 hover:bg-blue-100 rounded-lg"
                                                            >
                                                                <FiXCircle className="w-4 h-4 text-blue-700" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setShowWorkers(true)}
                                                        className="w-full p-3 border-2 border-dashed border-blue-300 rounded-xl text-center hover:bg-blue-50 transition-all"
                                                    >
                                                        <FiUserPlus className="w-5 h-5 text-blue-600 mx-auto mb-2" />
                                                        <span className="text-sm text-blue-700">{t.workers.select}</span>
                                                    </button>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    {t.statusUpdate.assignNotes}
                                                </label>
                                                <textarea
                                                    value={assignNotes}
                                                    onChange={(e) => setAssignNotes(e.target.value)}
                                                    placeholder="Add assignment instructions..."
                                                    className="w-full p-3 rounded-xl border-2 border-green-200 focus:border-green-500 outline-none resize-none"
                                                    rows={3}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {selectedStatus === "resolved" && (
                                        <div className="space-y-4 animate-fadeIn">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    {t.statusUpdate.resolutionNotes} *
                                                </label>
                                                <textarea
                                                    value={resolutionNotes}
                                                    onChange={(e) => setResolutionNotes(e.target.value)}
                                                    placeholder="Describe how the issue was resolved..."
                                                    className="w-full p-3 rounded-xl border-2 border-green-200 focus:border-green-500 outline-none resize-none"
                                                    rows={3}
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    {t.statusUpdate.uploadPhoto} (Optional)
                                                </label>
                                                {resolutionPhotoPreview ? (
                                                    <div className="relative">
                                                        <img
                                                            src={resolutionPhotoPreview}
                                                            alt="Resolution"
                                                            className="w-full h-48 object-cover rounded-xl"
                                                        />
                                                        <button
                                                            onClick={() => {
                                                                setResolutionPhoto(null);
                                                                setResolutionPhotoPreview("");
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
                                                                <span className="text-sm text-green-700">{t.statusUpdate.takePhoto}</span>
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
                                                                <span className="text-sm text-blue-700">{t.statusUpdate.choosePhoto}</span>
                                                            </div>
                                                        </label>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {selectedStatus === "escalated" && (
                                        <div className="animate-fadeIn">
                                            <div className="p-4 bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-xl mb-4">
                                                <div className="flex items-center gap-3">
                                                    <FiAlertCircle className="w-5 h-5 text-red-600" />
                                                    <div>
                                                        <p className="font-bold text-red-900">Escalate to Taluk Development Officer</p>
                                                        <p className="text-sm text-red-700/70 mt-1">This issue will be transferred to TDO for higher-level intervention.</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    {t.statusUpdate.escalateNotes} (Optional)
                                                </label>
                                                <textarea
                                                    placeholder="Reason for escalation..."
                                                    className="w-full p-3 rounded-xl border-2 border-red-200 focus:border-red-500 outline-none resize-none"
                                                    rows={3}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {error && (
                                    <div className="p-3 bg-red-50 border-2 border-red-200 rounded-xl">
                                        <p className="text-sm text-red-700">{error}</p>
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
                                    className={`flex-1 py-3 px-4 rounded-xl font-bold text-white ${saving
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
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                                        <FiMessageSquare className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-green-900">{t.chat.title}</h3>
                                        <p className="text-xs text-green-700/70">Issue: {issue.title}</p>
                                    </div>
                                </div>
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
                                            className={`animate-fadeIn ${msg.senderRole === "pdo"
                                                ? 'ml-auto'
                                                : 'mr-auto'
                                                } max-w-xs`}
                                        >
                                            <div className={`p-3 rounded-xl ${msg.senderRole === "pdo"
                                                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-br-none'
                                                : msg.senderRole === "system"
                                                    ? 'bg-gray-100 text-gray-800 rounded-xl'
                                                    : 'bg-blue-50 text-blue-800 rounded-bl-none'
                                                }`}>
                                                <div className="flex justify-between items-start">
                                                    <span className="text-xs font-medium">
                                                        {msg.senderName}
                                                        {msg.senderRole !== "system" && (
                                                            <span className="ml-1 text-xs opacity-70">({msg.senderRole})</span>
                                                        )}
                                                    </span>
                                                    <span className="text-xs opacity-70">
                                                        {msg.createdAt ? formatRelativeDate(fmtDate(msg.createdAt), t) : ''}
                                                    </span>
                                                </div>
                                                <p className="mt-1 text-sm">{msg.text}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                                <div ref={messagesEndRef} />
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
                                        className={`px-4 py-3 rounded-xl font-bold text-white ${!newMessage.trim() || sendingMessage
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

                {/* Bottom Navigation */}
                <div className="fixed bottom-4 left-4 right-4 bg-white/90 backdrop-blur-lg border-2 border-green-100 rounded-2xl p-2 shadow-xl animate-fadeIn">
                    <div className="grid grid-cols-4 gap-1">
                        <button
                            className="flex flex-col items-center justify-center p-3 rounded-xl transition-all hover:bg-green-50"
                            onClick={() => router.push(`/${locale}/authority/pdo/dashboard`)}
                        >
                            <FiHome className="w-5 h-5 text-green-600/70" />
                            <span className="text-xs mt-1 font-medium text-green-700/70">
                                Dashboard
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
                            onClick={() => router.push(`/${locale}/authority/pdo/assignments`)}
                        >
                            <FiUsers className="w-5 h-5 text-green-600/70" />
                            <span className="text-xs mt-1 font-medium text-green-700/70">
                                Assign
                            </span>
                        </button>

                        <button
                            className="flex flex-col items-center justify-center p-3 rounded-xl transition-all hover:bg-green-50"
                            onClick={() => router.push(`/${locale}/authority/pdo/profile`)}
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