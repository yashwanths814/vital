"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Screen from "../../../../components/Screen";
import { auth, db } from "../../../../lib/firebase";
import {
    collection,
    getDocs,
    query,
    where,
    doc,
    getDoc,
    limit,
    Timestamp
} from "firebase/firestore";
import {
    FiAlertCircle,
    FiHome,
    FiFileText,
    FiTrendingUp,
    FiUser,
    FiRefreshCw,
    FiClock,
    FiCalendar,
    FiMapPin,
    FiFilter,
    FiSearch,
    FiEye,
    FiFlag,
    FiCheckCircle,
    FiXCircle,
    FiDownload,
    FiPrinter,
    FiShare2,
    FiFile,
    FiCornerUpRight,
    FiActivity,
    FiChevronDown,
    FiChevronUp
} from "react-icons/fi";
import jsPDF from "jspdf";

type Issue = {
    id: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    category: string;
    categoryId?: string;
    categoryName?: string;
    createdAt: Timestamp | Date | string;
    updatedAt: Timestamp | Date | string;
    villagerId: string;
    villagerName: string;
    villageId: string;
    villageName: string;
    panchayatId: string;
    panchayatName?: string;
    talukId: string;
    talukName?: string;
    districtId: string;
    districtName?: string;
    images?: string[];
    photoUrl?: string;
    latitude?: number;
    longitude?: number;
    specificLocation?: string;
    escalationLevel?: string;
    escalationReason?: string;
    escalatedAt?: Timestamp | Date;
    escalatedBy?: string;
    assignedTo?: string;
    assignedToName?: string;
    assignedAt?: Timestamp | Date;
    assignedDepartment?: string;
    slaDays?: number;
    expectedResolutionDate?: Timestamp | Date;
    daysOpen?: number;
    overdue?: boolean;
    viVerifiedAt?: Timestamp | Date;
    isVerified?: boolean;
    viVerificationNotes?: string;
    pdoAssignedAt?: Timestamp | Date;
    inProgressAt?: Timestamp | Date;
    lastActivityAt?: Timestamp | Date;
    lastComment?: string;
    commentCount?: number;
    commentsCount?: number;
    reporterName?: string;
    reporterEmail?: string;
    reporterPhone?: string;
    displayId?: string;
    stage?: string;
    upvotes?: number;
    views?: number;
    gpsLatitude?: number;
    gpsLongitude?: number;
    gpsAccuracy?: number;
    hasPhoto?: boolean;
    isUrgent?: boolean;
    verifiedAt?: Timestamp | Date;
    viVerifiedBy?: string;
};

type FilterOptions = {
    status: string[];
    priority: string[];
    category: string[];
    taluk: string[];
    timeRange: string;
    overdueOnly: boolean;
    escalatedOnly: boolean;
};

type SortOption = "newest" | "oldest" | "priority" | "overdue" | "recentlyUpdated";

// TRANSLATIONS
const TRANSLATIONS = {
    en: {
        title: "Unresolved Issues",
        subtitle: "Track and manage pending issues across the district",
        loading: "Loading unresolved issues…",
        notSignedIn: "You are not signed in.",
        notAuthorized: "You are not authorized.",
        loadFail: "Failed to load issues",
        refresh: "Refresh",
        overview: "Overview",
        totalUnresolved: "Total Unresolved",
        overdueIssues: "Overdue Issues",
        highPriority: "High Priority",
        escalatedIssues: "Escalated Issues",
        avgResolutionTime: "Avg. Resolution Time",
        daysOpen: "Days Open",
        days: "days",
        filters: "Filters",
        searchPlaceholder: "Search by issue title, description, or ID...",
        clearFilters: "Clear Filters",
        applyFilters: "Apply Filters",
        sortBy: "Sort By",
        newest: "Newest First",
        oldest: "Oldest First",
        priorityLabel: "Priority",
        overdue: "Most Overdue",
        recentlyUpdated: "Recently Updated",
        noIssues: "No unresolved issues found",
        noIssuesFiltered: "No issues match your filters",
        resetFilters: "Reset Filters",
        viewDetails: "View Details",
        assign: "Assign",
        escalate: "Escalate",
        comment: "Add Comment",
        downloadReport: "Download Report",
        printList: "Print List",
        exportCSV: "Export CSV",
        share: "Share",
        issueId: "Issue ID",
        statusLabel: "Status",
        category: "Category",
        created: "Created",
        updated: "Last Updated",
        villager: "Raised By",
        village: "Village",
        panchayat: "Panchayat",
        taluk: "Taluk",
        district: "District",
        daysOpenLabel: "Days Open",
        escalationLevel: "Escalation Level",
        assignWorker: "Assign Worker",
        escalateIssue: "Escalate Issue",
        addComment: "Add Comment",
        quickActions: "Quick Actions",
        markResolved: "Mark as Resolved",
        sendReminder: "Send Reminder",
        reassign: "Reassign",
        dashboard: "Dashboard",
        requests: "Requests",
        analytics: "Analytics",
        unresolved: "Unresolved",
        profile: "Profile",
        status: {
            submitted: "Submitted",
            pending: "Pending",
            verified: "Verified",
            vi_verified: "VI Verified",
            pdo_assigned: "PDO Assigned",
            in_progress: "In Progress",
            escalated_to_tdo: "Escalated to TDO",
            escalated_to_ddo: "Escalated to DDO",
            ddo_review: "DDO Review",
            resolved: "Resolved",
            closed: "Closed",
            rejected: "Rejected"
        },
        priorityMap: {
            low: "Low",
            medium: "Medium",
            high: "High",
            urgent: "Urgent",
        },
        filterLabels: {
            allStatus: "All Status",
            allPriority: "All Priority",
            allCategory: "All Categories",
            allTaluk: "All Taluks",
            timeRange: "Time Range",
            last7Days: "Last 7 Days",
            last30Days: "Last 30 Days",
            last90Days: "Last 90 Days",
            thisYear: "This Year",
            allTime: "All Time",
            overdueOnly: "Overdue Only",
            escalatedOnly: "Escalated Only",
        },
        reports: "Reports",
        generateReport: "Generate Report",
        downloadPDF: "Download PDF",
        printReport: "Print Report",
        reportGenerated: "Report Generated",
        reportFailed: "Report Generation Failed",
        summary: "Summary",
        recommendations: "Recommendations",
        topTaluks: "Top Taluks with Unresolved Issues",
        issueDetails: "Issue Details",
        generate: "Generate",
        cancel: "Cancel",
        generating: "Generating Report...",
        allTime: "All Time",
        last7Days: "Last 7 Days",
        last30Days: "Last 30 Days",
        last90Days: "Last 90 Days",
        thisYear: "This Year",
        overdueOnly: "Overdue Only",
        escalatedOnly: "Escalated Only",
        timeRange: "Time Range",
    },
    // Add other languages here with the same structure
};

export default function DDOUnresolvedPage() {
    const router = useRouter();
    const params = useParams<{ locale?: string }>();
    const locale = (params?.locale as keyof typeof TRANSLATIONS) || "en";

    const t = (key: keyof typeof TRANSLATIONS.en) => {
        return TRANSLATIONS[locale]?.[key] || TRANSLATIONS.en[key] || key;
    };

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [err, setErr] = useState("");
    const [issues, setIssues] = useState<Issue[]>([]);
    const [filteredIssues, setFilteredIssues] = useState<Issue[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [generatingReport, setGeneratingReport] = useState(false);
    const [reportMessage, setReportMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [district, setDistrict] = useState("");
    const [districtId, setDistrictId] = useState("");

    // Filter states
    const [filters, setFilters] = useState<FilterOptions>({
        status: [],
        priority: [],
        category: [],
        taluk: [],
        timeRange: "all",
        overdueOnly: false,
        escalatedOnly: false,
    });

    const [sortBy, setSortBy] = useState<SortOption>("newest");

    // Available filter options from data
    const [availableCategories, setAvailableCategories] = useState<string[]>([]);
    const [availableTaluks, setAvailableTaluks] = useState<string[]>([]);

    const loadIssues = async () => {
        setErr("");
        setRefreshing(true);

        try {
            const user = auth.currentUser;
            if (!user) {
                setErr(t("notSignedIn") as string);
                setLoading(false);
                setRefreshing(false);
                return;
            }

            // Get DDO profile
            const authDoc = await getDoc(doc(db, "authorities", user.uid));
            if (!authDoc.exists()) {
                setErr(t("notAuthorized") as string);
                setLoading(false);
                setRefreshing(false);
                return;
            }

            const authority = authDoc.data();
            if (authority?.role !== "ddo") {
                setErr(t("notAuthorized") as string);
                setLoading(false);
                setRefreshing(false);
                return;
            }

            // Check verification
            const verified = authority?.verified === true
                || authority?.status === "verified"
                || authority?.status === "active"
                || authority?.verification?.status === "verified";

            if (!verified) {
                setErr("Please wait for admin verification");
                setLoading(false);
                setRefreshing(false);
                return;
            }

            // Set district info
            const districtName = authority.districtName || authority.district || "";
            const districtIdVal = authority.districtId || "";
            setDistrict(districtName);
            setDistrictId(districtIdVal);

            if (!districtName && !districtIdVal) {
                setErr("Your profile is missing district information");
                setLoading(false);
                setRefreshing(false);
                return;
            }

            // Load all unresolved issues for the district
            const unresolvedStatuses = [
                "submitted",
                "pending",
                "verified",
                "vi_verified",
                "pdo_assigned",
                "in_progress",
                "escalated_to_tdo",
                "escalated_to_ddo",
                "ddo_review"
            ];

            const issuesRef = collection(db, "issues");
            let issuesQuery;
            
            if (districtIdVal) {
                issuesQuery = query(
                    issuesRef,
                    where("districtId", "==", districtIdVal),
                    where("status", "in", unresolvedStatuses),
                    limit(500)
                );
            } else {
                issuesQuery = query(
                    issuesRef,
                    where("districtName", "==", districtName),
                    where("status", "in", unresolvedStatuses),
                    limit(500)
                );
            }

            const snapshot = await getDocs(issuesQuery);

            if (snapshot.empty) {
                setIssues([]);
                setFilteredIssues([]);
                setAvailableCategories([]);
                setAvailableTaluks([]);
                setLoading(false);
                setRefreshing(false);
                return;
            }

            const issuesList: Issue[] = [];
            const categoriesSet = new Set<string>();
            const taluksSet = new Set<string>();

            snapshot.forEach(doc => {
                const data = doc.data();

                // Calculate days open safely
                const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : 
                                 data.createdAt ? new Date(data.createdAt) : new Date();
                const now = new Date();
                const diffTime = Math.abs(now.getTime() - createdAt.getTime());
                const daysOpen = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                // Check if overdue (more than SLA days or 30 days default)
                const slaDays = data.slaDays || 30;
                const overdue = daysOpen > slaDays;

                const issue: Issue = {
                    id: doc.id,
                    title: data.title || "No Title",
                    description: data.description || "",
                    status: data.status || "submitted",
                    priority: data.priority || "medium",
                    category: data.categoryName || data.category || "Other",
                    categoryId: data.categoryId,
                    categoryName: data.categoryName,
                    createdAt: data.createdAt,
                    updatedAt: data.updatedAt || data.createdAt,
                    villagerId: data.villagerId || data.reporterId || "",
                    villagerName: data.reporterName || data.villagerName || "Unknown",
                    villageId: data.villageId || "",
                    villageName: data.villageName || "",
                    panchayatId: data.panchayatId || "",
                    panchayatName: data.panchayatName || "",
                    talukId: data.talukId || "",
                    talukName: data.talukName || "",
                    districtId: data.districtId || districtIdVal || "",
                    districtName: data.districtName || districtName || "",
                    images: data.images || (data.photoUrl ? [data.photoUrl] : []),
                    photoUrl: data.photoUrl,
                    latitude: data.gpsLatitude || data.latitude,
                    longitude: data.gpsLongitude || data.longitude,
                    specificLocation: data.specificLocation,
                    escalationLevel: data.escalationLevel,
                    escalationReason: data.escalationReason,
                    escalatedAt: data.escalatedAt,
                    escalatedBy: data.escalatedBy,
                    assignedTo: data.assignedTo,
                    assignedToName: data.assignedToName,
                    assignedAt: data.assignedAt,
                    assignedDepartment: data.assignedDepartment,
                    slaDays: data.slaDays || 30,
                    expectedResolutionDate: data.expectedResolutionDate,
                    daysOpen,
                    overdue,
                    viVerifiedAt: data.viVerifiedAt || data.verifiedAt,
                    isVerified: data.isVerified || data.verified === true,
                    viVerificationNotes: data.viVerificationNotes,
                    pdoAssignedAt: data.pdoAssignedAt,
                    inProgressAt: data.inProgressAt,
                    lastActivityAt: data.updatedAt || data.createdAt,
                    lastComment: data.lastComment,
                    commentCount: data.commentsCount || data.commentCount || 0,
                    commentsCount: data.commentsCount || data.commentCount || 0,
                    reporterName: data.reporterName,
                    reporterEmail: data.reporterEmail,
                    reporterPhone: data.reporterPhone,
                    displayId: data.displayId,
                    stage: data.stage,
                    upvotes: data.upvotes || 0,
                    views: data.views || 0,
                    gpsLatitude: data.gpsLatitude,
                    gpsLongitude: data.gpsLongitude,
                    gpsAccuracy: data.gpsAccuracy,
                    hasPhoto: data.hasPhoto || !!data.photoUrl,
                    isUrgent: data.isUrgent || false,
                };

                issuesList.push(issue);

                if (issue.category) {
                    categoriesSet.add(issue.category);
                }
                if (issue.talukName) {
                    taluksSet.add(issue.talukName);
                } else if (issue.talukId) {
                    taluksSet.add(issue.talukId);
                }
            });

            // Sort by createdAt descending (newest first) as default
            issuesList.sort((a, b) => {
                const toDate = (val: any) => {
                    if (!val) return new Date(0);
                    if (typeof val === "object" && typeof val.toDate === "function") {
                        return val.toDate();
                    }
                    if (val instanceof Date) {
                        return val;
                    }
                    return new Date(val);
                };
                const aTime = toDate(a.createdAt);
                const bTime = toDate(b.createdAt);
                return bTime.getTime() - aTime.getTime();
            });

            setIssues(issuesList);
            setFilteredIssues(issuesList);
            setAvailableCategories(Array.from(categoriesSet).sort());
            setAvailableTaluks(Array.from(taluksSet).sort());

        } catch (e: any) {
            console.error("Error loading issues:", e);
            setErr(e?.message || t("loadFail") as string);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Apply filters and search
    useEffect(() => {
        let result = [...issues];

        // Apply search
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(issue =>
                issue.title.toLowerCase().includes(term) ||
                issue.description.toLowerCase().includes(term) ||
                issue.id.toLowerCase().includes(term) ||
                (issue.displayId && issue.displayId.toLowerCase().includes(term)) ||
                issue.villagerName.toLowerCase().includes(term) ||
                (issue.reporterName && issue.reporterName.toLowerCase().includes(term)) ||
                (issue.panchayatName && issue.panchayatName.toLowerCase().includes(term)) ||
                (issue.talukName && issue.talukName.toLowerCase().includes(term))
            );
        }

        // Apply status filters
        if (filters.status.length > 0) {
            result = result.filter(issue => filters.status.includes(issue.status));
        }

        // Apply priority filters
        if (filters.priority.length > 0) {
            result = result.filter(issue => filters.priority.includes(issue.priority));
        }

        // Apply category filters
        if (filters.category.length > 0) {
            result = result.filter(issue => filters.category.includes(issue.category));
        }

        // Apply taluk filters
        if (filters.taluk.length > 0) {
            result = result.filter(issue =>
                (issue.talukName && filters.taluk.includes(issue.talukName)) ||
                (issue.talukId && filters.taluk.includes(issue.talukId))
            );
        }

        // Apply time range filter
        if (filters.timeRange !== "all") {
            const now = new Date();
            let cutoffDate = new Date();

            switch (filters.timeRange) {
                case "last7Days":
                    cutoffDate.setDate(now.getDate() - 7);
                    break;
                case "last30Days":
                    cutoffDate.setDate(now.getDate() - 30);
                    break;
                case "last90Days":
                    cutoffDate.setDate(now.getDate() - 90);
                    break;
                case "thisYear":
                    cutoffDate = new Date(now.getFullYear(), 0, 1);
                    break;
                default:
                    cutoffDate = new Date(0);
            }

            result = result.filter(issue => {
                let createdAt: Date;
                if (
                    issue.createdAt &&
                    typeof issue.createdAt === "object" &&
                    typeof (issue.createdAt as { toDate?: () => Date }).toDate === "function"
                ) {
                    createdAt = (issue.createdAt as { toDate: () => Date }).toDate();
                } else if (typeof issue.createdAt === "string" || issue.createdAt instanceof Date) {
                    createdAt = new Date(issue.createdAt);
                } else {
                    createdAt = new Date(0);
                }
                return createdAt >= cutoffDate;
            });
        }

        // Apply overdue filter
        if (filters.overdueOnly) {
            result = result.filter(issue => issue.overdue);
        }

        // Apply escalated filter
        if (filters.escalatedOnly) {
            result = result.filter(issue =>
                issue.status?.includes("escalated") ||
                issue.escalationLevel ||
                issue.status === "ddo_review"
            );
        }

        // Apply sorting
        result.sort((a, b) => {
            const getDateValue = (val: any) => {
                if (val && typeof val === "object" && typeof val.toDate === "function") {
                    return val.toDate();
                } else if (typeof val === "string" || val instanceof Date) {
                    return new Date(val);
                } else {
                    return new Date(0);
                }
            };

            switch (sortBy) {
                case "newest": {
                    const aTime = getDateValue(a.createdAt);
                    const bTime = getDateValue(b.createdAt);
                    return bTime.getTime() - aTime.getTime();
                }

                case "oldest": {
                    const aTimeOld = getDateValue(a.createdAt);
                    const bTimeOld = getDateValue(b.createdAt);
                    return aTimeOld.getTime() - bTimeOld.getTime();
                }

                case "priority": {
                    const priorityOrder: Record<string, number> = { "urgent": 4, "high": 3, "medium": 2, "low": 1 };
                    const aPriority = priorityOrder[a.priority?.toLowerCase()] || 0;
                    const bPriority = priorityOrder[b.priority?.toLowerCase()] || 0;
                    if (bPriority !== aPriority) return bPriority - aPriority;
                    const aTimeP = getDateValue(a.createdAt);
                    const bTimeP = getDateValue(b.createdAt);
                    return bTimeP.getTime() - aTimeP.getTime();
                }

                case "overdue": {
                    if (a.overdue !== b.overdue) return a.overdue ? -1 : 1;
                    if (a.daysOpen !== b.daysOpen) return (b.daysOpen || 0) - (a.daysOpen || 0);
                    const aTimeO = getDateValue(a.createdAt);
                    const bTimeO = getDateValue(b.createdAt);
                    return bTimeO.getTime() - aTimeO.getTime();
                }

                case "recentlyUpdated": {
                    const aUpdated = getDateValue(a.updatedAt);
                    const bUpdated = getDateValue(b.updatedAt);
                    return bUpdated.getTime() - aUpdated.getTime();
                }

                default:
                    return 0;
            }
        });

        setFilteredIssues(result);
    }, [issues, searchTerm, filters, sortBy]);

    useEffect(() => {
        loadIssues();
    }, []);

    // Calculate statistics
    const statistics = useMemo(() => {
        const total = issues.length;
        const overdue = issues.filter(i => i.overdue).length;
        const highPriority = issues.filter(i => i.priority?.toLowerCase() === "high" || i.priority?.toLowerCase() === "urgent").length;
        const escalated = issues.filter(i =>
            i.status?.includes("escalated") ||
            i.escalationLevel ||
            i.status === "ddo_review"
        ).length;

        const totalDays = issues.reduce((sum, issue) => sum + (issue.daysOpen || 0), 0);
        const avgDaysOpen = issues.length > 0 ? Math.round(totalDays / issues.length) : 0;

        return {
            total,
            overdue,
            highPriority,
            escalated,
            avgDaysOpen
        };
    }, [issues]);

    const handleFilterChange = (filterType: keyof FilterOptions, value: any) => {
        if (filterType === "overdueOnly" || filterType === "escalatedOnly") {
            setFilters(prev => ({ ...prev, [filterType]: value }));
        } else if (filterType === "timeRange") {
            setFilters(prev => ({ ...prev, [filterType]: value }));
        } else {
            setFilters(prev => {
                const currentValues = [...(prev[filterType] as string[])];
                if (currentValues.includes(value)) {
                    return { ...prev, [filterType]: currentValues.filter(v => v !== value) };
                } else {
                    return { ...prev, [filterType]: [...currentValues, value] };
                }
            });
        }
    };

    const clearFilters = () => {
        setFilters({
            status: [],
            priority: [],
            category: [],
            taluk: [],
            timeRange: "all",
            overdueOnly: false,
            escalatedOnly: false,
        });
        setSearchTerm("");
    };

    const formatDate = (date: any) => {
        try {
            if (!date) return "";
            const dateObj = date?.toDate ? date.toDate() : new Date(date);
            return dateObj.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        } catch {
            return "";
        }
    };

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'submitted':
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'verified':
            case 'vi_verified': return 'bg-purple-100 text-purple-800';
            case 'pdo_assigned': return 'bg-blue-100 text-blue-800';
            case 'in_progress': return 'bg-indigo-100 text-indigo-800';
            case 'escalated_to_tdo':
            case 'escalated_to_ddo':
            case 'ddo_review': return 'bg-red-100 text-red-800';
            case 'resolved':
            case 'closed': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority?.toLowerCase()) {
            case 'urgent': return 'bg-red-500 text-white';
            case 'high': return 'bg-orange-500 text-white';
            case 'medium': return 'bg-yellow-500 text-gray-800';
            case 'low': return 'bg-green-500 text-white';
            default: return 'bg-gray-500 text-white';
        }
    };

    const getPriorityText = (priority: string) => {
        const priorityMap = TRANSLATIONS.en.priorityMap as Record<string, string>;
        return priorityMap[priority?.toLowerCase()] || priority;
    };

    const getStatusText = (status: string) => {
        const statusMap = TRANSLATIONS.en.status as Record<string, string>;
        return statusMap[status?.toLowerCase()] || status;
    };

    const generatePDFReport = async () => {
        setGeneratingReport(true);
        setReportMessage(null);

        try {
            const pdf = new jsPDF('landscape', 'mm', 'a4');

            pdf.setFontSize(20);
            pdf.setTextColor(0, 0, 139);
            pdf.text(String(t("title")), 20, 20);

            pdf.setFontSize(12);
            pdf.setTextColor(100, 100, 100);
            pdf.text(`District: ${district}`, 20, 30);
            pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 37);
            pdf.text(`Total Unresolved Issues: ${statistics.total}`, 20, 44);

            pdf.setFontSize(14);
            pdf.setTextColor(0, 0, 0);
            pdf.text(String(t("summary")), 20, 55);

            pdf.setFontSize(10);
            pdf.text(`Overdue Issues: ${statistics.overdue}`, 20, 65);
            pdf.text(`High Priority: ${statistics.highPriority}`, 20, 72);
            pdf.text(`Escalated Issues: ${statistics.escalated}`, 20, 79);
            pdf.text(`Average Days Open: ${statistics.avgDaysOpen} days`, 20, 86);

            const talukCounts = new Map<string, number>();
            filteredIssues.forEach(issue => {
                const taluk = issue.talukName || issue.talukId || "Unknown";
                talukCounts.set(taluk, (talukCounts.get(taluk) || 0) + 1);
            });

            const topTaluks = Array.from(talukCounts.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5);

            if (topTaluks.length > 0) {
                pdf.setFontSize(14);
                pdf.text(String(t("topTaluks")), 120, 55);

                pdf.setFontSize(10);
                topTaluks.forEach(([taluk, count], idx) => {
                    const y = 65 + (idx * 7);
                    pdf.text(`${idx + 1}. ${taluk}: ${count} issues`, 120, y);
                });
            }

            pdf.setFontSize(14);
            pdf.text(String(t("issueDetails")), 20, 100);

            pdf.setFontSize(8);
            let y = 110;

            pdf.text("ID", 20, y);
            pdf.text("Title", 40, y);
            pdf.text("Priority", 80, y);
            pdf.text("Status", 100, y);
            pdf.text("Taluk", 120, y);
            pdf.text("Days", 150, y);
            pdf.text("Created", 160, y);

            y += 5;
            pdf.line(20, y, 200, y);
            y += 3;

            filteredIssues.slice(0, 20).forEach((issue, idx) => {
                if (y > 270) {
                    pdf.addPage();
                    y = 20;
                }

                pdf.text(issue.displayId || issue.id.substring(0, 8), 20, y);
                pdf.text(issue.title.substring(0, 20), 40, y);
                pdf.text(getPriorityText(issue.priority), 80, y);
                pdf.text(getStatusText(issue.status), 100, y);
                pdf.text((issue.talukName || issue.talukId || "").substring(0, 15), 120, y);
                pdf.text((issue.daysOpen || 0).toString(), 150, y);
                pdf.text(formatDate(issue.createdAt), 160, y);

                y += 6;
            });

            pdf.setFontSize(14);
            pdf.text(String(t("recommendations")), 20, y + 10);

            pdf.setFontSize(10);
            const recommendations = [
                statistics.overdue > 0 ? `Take immediate action on ${statistics.overdue} overdue issues` : "No overdue issues - Good work!",
                statistics.highPriority > 0 ? `Focus on ${statistics.highPriority} high/urgent priority issues` : "No high priority issues pending",
                statistics.escalated > 0 ? `Review ${statistics.escalated} escalated issues` : "No escalated issues to review",
                statistics.avgDaysOpen > 20 ? `Improve resolution time (current avg: ${statistics.avgDaysOpen} days)` : `Good average resolution time (${statistics.avgDaysOpen} days)`
            ];

            recommendations.forEach((rec, idx) => {
                const recY = y + 20 + (idx * 7);
                pdf.text(`• ${rec}`, 20, recY);
            });

            pdf.save(`DDO_Unresolved_Issues_${new Date().toISOString().split('T')[0]}.pdf`);

            setReportMessage({ type: 'success', text: String(t("reportGenerated")) });
        } catch (error) {
            console.error("PDF generation error:", error);
            setReportMessage({ type: 'error', text: String(t("reportFailed")) });
        } finally {
            setGeneratingReport(false);
            setTimeout(() => setReportMessage(null), 3000);
        }
    };

    const generateCSVReport = () => {
        try {
            const headers = [
                'Issue ID',
                'Display ID',
                'Title',
                'Priority',
                'Status',
                'Category',
                'Created Date',
                'Days Open',
                'Overdue',
                'Reporter',
                'Village',
                'Panchayat',
                'Taluk',
                'District'
            ];

            let csvContent = headers.join(',') + '\n';

            filteredIssues.forEach(issue => {
                const row = [
                    `"${issue.id}"`,
                    `"${issue.displayId || ''}"`,
                    `"${issue.title.replace(/"/g, '""')}"`,
                    `"${getPriorityText(issue.priority)}"`,
                    `"${getStatusText(issue.status)}"`,
                    `"${issue.category}"`,
                    `"${formatDate(issue.createdAt)}"`,
                    issue.daysOpen || 0,
                    issue.overdue ? 'Yes' : 'No',
                    `"${issue.reporterName || issue.villagerName}"`,
                    `"${issue.villageName || ''}"`,
                    `"${issue.panchayatName || ''}"`,
                    `"${issue.talukName || issue.talukId || ''}"`,
                    `"${district}"`
                ];
                csvContent += row.join(',') + '\n';
            });

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `DDO_Unresolved_Issues_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setReportMessage({ type: 'success', text: t("reportGenerated") as string });
        } catch (error) {
            console.error("CSV generation error:", error);
            setReportMessage({ type: 'error', text: t("reportFailed") as string });
        } finally {
            setTimeout(() => setReportMessage(null), 3000);
        }
    };

    const generatePrintReport = () => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
        <html>
          <head>
            <title>${t("title")}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { color: #1e40af; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f0f9ff; }
              .summary { background: #f8fafc; padding: 15px; border-radius: 5px; margin: 20px 0; }
              .recommendation { background: #fef3c7; padding: 10px; margin: 10px 0; border-left: 4px solid #f59e0b; }
              .urgent { background-color: #fee2e2; }
              .high { background-color: #ffedd5; }
              .overdue { background-color: #fef3c7; }
            </style>
          </head>
          <body>
            <h1>${t("title")}</h1>
            <p>District: ${district}</p>
            <p>Generated: ${new Date().toLocaleDateString()}</p>
            
            <div class="summary">
              <h2>${t("summary")}</h2>
              <p>Total Unresolved Issues: ${statistics.total}</p>
              <p>Overdue Issues: ${statistics.overdue}</p>
              <p>High Priority Issues: ${statistics.highPriority}</p>
              <p>Escalated Issues: ${statistics.escalated}</p>
              <p>Average Days Open: ${statistics.avgDaysOpen} days</p>
            </div>
            
            <h2>${t("issueDetails")} (${filteredIssues.length})</h2>
            <table>
              <tr>
                <th>Issue ID</th>
                <th>Title</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Taluk</th>
                <th>Days Open</th>
                <th>Created</th>
              </tr>
              ${filteredIssues.map(issue => `
                <tr class="${issue.priority === 'urgent' ? 'urgent' : issue.priority === 'high' ? 'high' : ''} ${issue.overdue ? 'overdue' : ''}">
                  <td>${issue.displayId || issue.id.substring(0, 8)}</td>
                  <td>${issue.title}</td>
                  <td>${getPriorityText(issue.priority)}</td>
                  <td>${getStatusText(issue.status)}</td>
                  <td>${issue.talukName || issue.talukId || ''}</td>
                  <td>${issue.daysOpen || 0}</td>
                  <td>${formatDate(issue.createdAt)}</td>
                </tr>
              `).join('')}
            </table>
            
            <div class="recommendation">
              <h2>${t("recommendations")}</h2>
              ${statistics.overdue > 0 ? `<p>• Take immediate action on ${statistics.overdue} overdue issues</p>` : '<p>• No overdue issues - Good work!</p>'}
              ${statistics.highPriority > 0 ? `<p>• Focus on ${statistics.highPriority} high/urgent priority issues</p>` : '<p>• No high priority issues pending</p>'}
              ${statistics.escalated > 0 ? `<p>• Review ${statistics.escalated} escalated issues</p>` : '<p>• No escalated issues to review</p>'}
              <p>• ${statistics.avgDaysOpen > 20 ? `Improve resolution time (current avg: ${statistics.avgDaysOpen} days)` : `Good average resolution time (${statistics.avgDaysOpen} days)`}</p>
            </div>
          </body>
        </html>
      `);
            printWindow.document.close();
            printWindow.print();
        }
    };

    return (
        <Screen padded>
            <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-3 sm:p-4 pb-28">
                {/* Header */}
                <div className="mb-4 sm:mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-blue-900 flex items-center gap-2">
                                <FiAlertCircle className="w-6 h-6 sm:w-7 sm:h-7" /> {String(t("title"))}
                            </h1>
                            <p className="text-blue-700/80 text-sm sm:text-base mt-1">{String(t("subtitle"))}</p>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowReportModal(true)}
                                className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-xl hover:from-green-700 hover:to-emerald-800 active:scale-95 transition-all flex items-center gap-2"
                            >
                                <FiDownload className="w-4 h-4" />
                                <span className="hidden sm:inline">{String(t("downloadReport"))}</span>
                            </button>

                            <button
                                onClick={loadIssues}
                                disabled={refreshing}
                                className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-60"
                            >
                                <FiRefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                                <span className="hidden sm:inline">{String(t("refresh"))}</span>
                            </button>
                        </div>
                    </div>

                    {district && (
                        <div className="text-xs sm:text-sm bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full inline-flex items-center gap-1">
                            <FiMapPin className="w-3 h-3" />
                            {String(district)}
                        </div>
                    )}
                </div>

                {/* Error */}
                {err && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-700 text-sm">
                        <FiAlertCircle className="w-5 h-5 flex-shrink-0" /> {String(err)}
                    </div>
                )}

                {/* Report Message */}
                {reportMessage && (
                    <div className={`mb-4 p-4 ${reportMessage.type === 'success' ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'} rounded-xl flex items-center gap-2 text-sm`}>
                        <FiAlertCircle className={`w-5 h-5 flex-shrink-0 ${reportMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`} />
                        <span className={reportMessage.type === 'success' ? 'text-green-700' : 'text-red-700'}>
                            {String(reportMessage.text)}
                        </span>
                    </div>
                )}

                {/* Search and Filters */}
                <div className="mb-6 space-y-3">
                    {/* Search Bar */}
                    <div className="relative">
                        <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={String(t("searchPlaceholder"))}
                            className="w-full pl-12 pr-4 py-3 bg-white border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                        />
                    </div>

                    {/* Filter Toggle and Sort */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="px-4 py-2 bg-white border border-blue-200 text-blue-700 rounded-xl hover:bg-blue-50 active:scale-95 transition-all flex items-center gap-2"
                        >
                            <FiFilter className="w-4 h-4" />
                            {String(t("filters"))}
                            {showFilters ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />}
                        </button>

                        <div className="flex items-center gap-2">
                            <span className="text-sm text-blue-700">{String(t("sortBy"))}:</span>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as SortOption)}
                                className="px-3 py-2 bg-white border border-blue-200 rounded-xl text-sm text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                            >
                                <option value="newest">{String(t("newest"))}</option>
                                <option value="oldest">{String(t("oldest"))}</option>
                                <option value="priority">{t("priorityLabel") as string}</option>
                                <option value="overdue">{String(t("overdue"))}</option>
                                <option value="recentlyUpdated">{String(t("recentlyUpdated"))}</option>
                            </select>
                        </div>
                    </div>

                    {/* Filter Panel */}
                    {showFilters && (
                        <div className="bg-white border border-blue-100 rounded-xl p-4 animate-fadeIn">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* Status Filter */}
                                <div>
                                    <label className="block text-sm font-semibold text-blue-900 mb-2">
                                        {String(t("statusLabel"))}
                                    </label>
                                    <div className="space-y-1 max-h-48 overflow-y-auto">
                                        {["submitted", "pending", "verified", "vi_verified", "pdo_assigned", "in_progress", "escalated_to_tdo", "escalated_to_ddo", "ddo_review"].map(status => (
                                            <label key={status} className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={filters.status.includes(status)}
                                                    onChange={() => handleFilterChange("status", status)}
                                                    className="rounded border-blue-300 text-blue-600 focus:ring-blue-200"
                                                />
                                                <span className="text-sm">{getStatusText(status)}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Priority Filter */}
                                <div>
                                    <label className="block text-sm font-semibold text-blue-900 mb-2">
                                        {String(t("priorityLabel"))}
                                    </label>
                                    <div className="space-y-1">
                                        {["urgent", "high", "medium", "low"].map(priority => (
                                            <label key={priority} className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={filters.priority.includes(priority)}
                                                    onChange={() => handleFilterChange("priority", priority)}
                                                    className="rounded border-blue-300 text-blue-600 focus:ring-blue-200"
                                                />
                                                <span className="text-sm">{getPriorityText(priority)}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Category Filter */}
                                <div>
                                    <label className="block text-sm font-semibold text-blue-900 mb-2">
                                        {String(t("category"))}
                                    </label>
                                    <div className="space-y-1 max-h-32 overflow-y-auto">
                                        {availableCategories.length > 0 ? availableCategories.map(category => (
                                            <label key={category} className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={filters.category.includes(category)}
                                                    onChange={() => handleFilterChange("category", category)}
                                                    className="rounded border-blue-300 text-blue-600 focus:ring-blue-200"
                                                />
                                                <span className="text-sm truncate">{category}</span>
                                            </label>
                                        )) : <p className="text-sm text-gray-500">No categories available</p>}
                                    </div>
                                </div>

                                {/* Other Filters */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-blue-900 mb-2">
                                            {String(t("taluk"))}
                                        </label>
                                        <div className="space-y-1 max-h-32 overflow-y-auto">
                                            {availableTaluks.length > 0 ? availableTaluks.map(taluk => (
                                                <label key={taluk} className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={filters.taluk.includes(taluk)}
                                                        onChange={() => handleFilterChange("taluk", taluk)}
                                                        className="rounded border-blue-300 text-blue-600 focus:ring-blue-200"
                                                    />
                                                    <span className="text-sm truncate">{taluk}</span>
                                                </label>
                                            )) : <p className="text-sm text-gray-500">No taluks available</p>}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-blue-900 mb-2">
                                            {String(t("timeRange"))}
                                        </label>
                                        <select
                                            value={filters.timeRange}
                                            onChange={(e) => handleFilterChange("timeRange", e.target.value)}
                                            className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm"
                                        >
                                            <option value="all">{String(t("allTime"))}</option>
                                            <option value="last7Days">{String(t("last7Days"))}</option>
                                            <option value="last30Days">{String(t("last30Days"))}</option>
                                            <option value="last90Days">{String(t("last90Days"))}</option>
                                            <option value="thisYear">{String(t("thisYear"))}</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={filters.overdueOnly}
                                                onChange={(e) => handleFilterChange("overdueOnly", e.target.checked)}
                                                className="rounded border-blue-300 text-blue-600 focus:ring-blue-200"
                                            />
                                            <span className="text-sm">{String(t("overdueOnly"))}</span>
                                        </label>
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={filters.escalatedOnly}
                                                onChange={(e) => handleFilterChange("escalatedOnly", e.target.checked)}
                                                className="rounded border-blue-300 text-blue-600 focus:ring-blue-200"
                                            />
                                            <span className="text-sm">{String(t("escalatedOnly"))}</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Filter Actions */}
                            <div className="flex justify-between items-center mt-4 pt-4 border-t border-blue-100">
                                <div className="text-sm text-blue-700">
                                    {filteredIssues.length} {String(t("totalUnresolved")).toLowerCase()}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={clearFilters}
                                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 active:scale-95 transition-all"
                                    >
                                        {String(t("clearFilters"))}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Statistics Overview */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
                    <div className="bg-white border border-blue-100 rounded-xl p-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <FiAlertCircle className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-blue-900">{statistics.total}</div>
                                <div className="text-sm text-blue-600">{String(t("totalUnresolved"))}</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-amber-100 rounded-xl p-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                                <FiClock className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-amber-900">{statistics.overdue}</div>
                                <div className="text-sm text-amber-600">{String(t("overdueIssues"))}</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-red-100 rounded-xl p-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                <FiFlag className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-red-900">{statistics.highPriority}</div>
                                <div className="text-sm text-red-600">{String(t("highPriority"))}</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-purple-100 rounded-xl p-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                <FiCornerUpRight className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-purple-900">{statistics.escalated}</div>
                                <div className="text-sm text-purple-600">{String(t("escalatedIssues"))}</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-green-100 rounded-xl p-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <FiActivity className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-green-900">{statistics.avgDaysOpen}</div>
                                <div className="text-sm text-green-600">{String(t("avgResolutionTime"))}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Loading */}
                {loading ? (
                    <div className="text-center py-10 text-blue-700 font-semibold">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mb-3"></div>
                        <div>{String(t("loading"))}</div>
                    </div>
                ) : filteredIssues.length === 0 ? (
                    <div className="text-center py-10">
                        <FiAlertCircle className="w-16 h-16 text-blue-300 mx-auto mb-4" />
                        <p className="text-blue-700 font-semibold text-lg mb-2">
                            {searchTerm || Object.values(filters).some(arr => Array.isArray(arr) ? arr.length > 0 : arr !== false && arr !== "all")
                                ? String(t("noIssuesFiltered"))
                                : String(t("noIssues"))}
                        </p>
                        <p className="text-blue-500 text-sm mb-4">
                            {searchTerm || Object.values(filters).some(arr => Array.isArray(arr) ? arr.length > 0 : arr !== false && arr !== "all")
                                ? String(t("resetFilters"))
                                : "All issues in your district have been resolved"}
                        </p>
                        {(searchTerm || Object.values(filters).some(arr => Array.isArray(arr) ? arr.length > 0 : arr !== false && arr !== "all")) && (
                            <button
                                onClick={clearFilters}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                {String(t("resetFilters"))}
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Issues List */}
                        <div className="space-y-3 mb-20">
                            {filteredIssues.map((issue) => (
                                <div
                                    key={issue.id}
                                    className="bg-white border border-blue-100 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all"
                                >
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                        {/* Left Column - Issue Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-lg font-bold text-blue-900 mb-1 truncate">
                                                        {issue.title}
                                                    </h3>
                                                    <p className="text-blue-700/70 text-sm mb-2 line-clamp-2">
                                                        {issue.description}
                                                    </p>
                                                </div>
                                                <div className="flex flex-col items-end gap-2 ml-2">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${getPriorityColor(issue.priority)}`}>
                                                        {getPriorityText(issue.priority)}
                                                    </span>
                                                    {issue.overdue && (
                                                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold">
                                                            {String(t("overdue"))}
                                                        </span>
                                                    )}
                                                    {issue.displayId && (
                                                        <span className="text-xs text-blue-600 font-mono bg-blue-50 px-2 py-1 rounded">
                                                            {issue.displayId}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-3 text-sm">
                                                <span className={`px-3 py-1 rounded-full ${getStatusColor(issue.status)}`}>
                                                    {String(getStatusText(issue.status))}
                                                </span>

                                                <span className="text-blue-700/70 flex items-center gap-1">
                                                    <FiCalendar className="w-4 h-4" />
                                                    {formatDate(issue.createdAt)}
                                                </span>

                                                <span className="text-blue-700/70 flex items-center gap-1">
                                                    <FiClock className="w-4 h-4" />
                                                    {issue.daysOpen || 0} {String(t("days")).toLowerCase()}
                                                </span>

                                                {issue.talukName && (
                                                    <span className="text-blue-700/70 flex items-center gap-1">
                                                        <FiMapPin className="w-4 h-4" />
                                                        {issue.talukName}
                                                    </span>
                                                )}

                                                {issue.category && (
                                                    <span className="text-blue-700/70 bg-blue-50 px-2 py-1 rounded">
                                                        {issue.category}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Right Column - Actions */}
                                        <div className="flex flex-col sm:flex-row lg:flex-col gap-2">
                                            <button
                                                onClick={() => router.push(`/${locale}/authority/ddo/issues/${issue.id}`)}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                                            >
                                                <FiEye className="w-4 h-4" />
                                                {String(t("viewDetails"))}
                                            </button>

                                            {issue.status === "escalated_to_ddo" || issue.status === "ddo_review" ? (
                                                <button
                                                    onClick={() => router.push(`/${locale}/authority/ddo/issues/${issue.id}?action=review`)}
                                                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <FiCheckCircle className="w-4 h-4" />
                                                    {String(t("markResolved"))}
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => router.push(`/${locale}/authority/ddo/issues/${issue.id}?action=escalate`)}
                                                    className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <FiFlag className="w-4 h-4" />
                                                    {String(t("escalate"))}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* Bottom Navigation */}
                <div className="fixed bottom-4 left-4 right-4 bg-white/90 backdrop-blur border border-blue-100 rounded-2xl p-2 shadow-xl">
                    <div className="grid grid-cols-5 gap-1">
                        <Nav
                            icon={<FiHome className="w-5 h-5" />}
                            label={String(t("dashboard"))}
                            onClick={() => router.push(`/${locale}/authority/ddo/dashboard`)}
                        />
                        <Nav
                            icon={<FiFileText className="w-5 h-5" />}
                            label={String(t("requests"))}
                            onClick={() => router.push(`/${locale}/authority/ddo/requests`)}
                        />
                        <Nav
                            icon={<FiTrendingUp className="w-5 h-5" />}
                            label={String(t("analytics"))}
                            onClick={() => router.push(`/${locale}/authority/ddo/analytics`)}
                        />
                        <Nav
                            icon={<FiAlertCircle className="w-5 h-5" />}
                            label={String(t("unresolved"))}
                            active
                        />
                        <Nav
                            icon={<FiUser className="w-5 h-5" />}
                            label={String(t("profile"))}
                            onClick={() => router.push(`/${locale}/authority/ddo/profile`)}
                        />
                    </div>
                </div>

                {/* Report Generation Modal */}
                {showReportModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl border border-blue-100 p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-blue-900">{String(t("reports"))}</h3>
                                <button
                                    onClick={() => setShowReportModal(false)}
                                    className="p-2 rounded-lg hover:bg-blue-50"
                                >
                                    <FiXCircle className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="text-sm text-blue-700">
                                    <p className="mb-2">Generate reports for the current filtered list:</p>
                                    <p className="font-semibold">{filteredIssues.length} issues selected</p>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={generatePDFReport}
                                        disabled={generatingReport || filteredIssues.length === 0}
                                        className="flex flex-col items-center justify-center p-4 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors disabled:opacity-50"
                                    >
                                        <FiDownload className="w-6 h-6 text-blue-600 mb-2" />
                                        <span className="text-sm font-semibold text-blue-800">{String(t("downloadPDF"))}</span>
                                    </button>

                                    <button
                                        onClick={generateCSVReport}
                                        disabled={generatingReport || filteredIssues.length === 0}
                                        className="flex flex-col items-center justify-center p-4 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 transition-colors disabled:opacity-50"
                                    >
                                        <FiFile className="w-6 h-6 text-green-600 mb-2" />
                                        <span className="text-sm font-semibold text-green-800">{String(t("exportCSV"))}</span>
                                    </button>

                                    <button
                                        onClick={generatePrintReport}
                                        disabled={generatingReport || filteredIssues.length === 0}
                                        className="flex flex-col items-center justify-center p-4 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors disabled:opacity-50"
                                    >
                                        <FiPrinter className="w-6 h-6 text-amber-600 mb-2" />
                                        <span className="text-sm font-semibold text-amber-800">{String(t("printReport"))}</span>
                                    </button>

                                    <button
                                        onClick={() => {
                                            setReportMessage({ type: 'success', text: 'Share feature coming soon!' });
                                            setTimeout(() => setReportMessage(null), 3000);
                                        }}
                                        disabled={generatingReport || filteredIssues.length === 0}
                                        className="flex flex-col items-center justify-center p-4 bg-purple-50 border border-purple-200 rounded-xl hover:bg-purple-100 transition-colors disabled:opacity-50"
                                    >
                                        <FiShare2 className="w-6 h-6 text-purple-600 mb-2" />
                                        <span className="text-sm font-semibold text-purple-800">{String(t("share"))}</span>
                                    </button>
                                </div>

                                {generatingReport && (
                                    <div className="text-center py-4">
                                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-600 mb-2"></div>
                                        <p className="text-sm text-blue-600">{String(t("generating"))}</p>
                                    </div>
                                )}

                                <div className="flex gap-3 pt-4 border-t">
                                    <button
                                        onClick={() => setShowReportModal(false)}
                                        className="flex-1 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                                    >
                                        {String(t("cancel"))}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Screen>
    );
}

function Nav({ icon, label, onClick, active }: {
    icon: React.ReactNode;
    label: string;
    onClick?: () => void;
    active?: boolean;
}) {
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center p-2 rounded-xl transition-all active:scale-95 ${active ? "bg-gradient-to-b from-blue-100 to-blue-50 text-blue-800 border border-blue-200" : "hover:bg-blue-50"
                }`}
        >
            {icon}
            <span className="text-xs mt-1 font-semibold">{label}</span>
        </button>
    );
}