// app/[locale]/authority/ddo/gp-performance/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth, db } from "../../../../lib/firebase";
import { doc, getDoc, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import Screen from "../../../../components/Screen";
import GPPerformanceChart from "./components/GPPerformanceChart";
import GPDetailsModal from "./components/GPDetailsModal";

type Locale = "en" | "kn" | "hi";

interface GPPerformance {
    id: string;
    name: string;
    taluk: string;
    totalIssues: number;
    resolved: number;
    pending: number;
    escalated: number;
    resolutionRate: number;
    averageResolutionTime: number;
    last30DaysResolved: number;
    categoryBreakdown: Array<{
        category: string;
        count: number;
        resolved: number;
    }>;
    trends: Array<{
        month: string;
        resolved: number;
        created: number;
    }>;
}

interface FilterOptions {
    taluk: string;
    resolutionRate: string;
    sortBy: string;
    sortOrder: "asc" | "desc";
}

export default function GPPerformancePage() {
    const router = useRouter();
    const params = useParams() as { locale?: string };
    const locale = (params?.locale || "en") as Locale;
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [district, setDistrict] = useState<string | null>(null);
    const [districtId, setDistrictId] = useState<string | null>(null);
    const [gpPerformance, setGpPerformance] = useState<GPPerformance[]>([]);
    const [filteredPerformance, setFilteredPerformance] = useState<GPPerformance[]>([]);
    const [selectedGP, setSelectedGP] = useState<GPPerformance | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [filters, setFilters] = useState<FilterOptions>({
        taluk: "all",
        resolutionRate: "all",
        sortBy: "resolutionRate",
        sortOrder: "desc",
    });
    const [taluks, setTaluks] = useState<string[]>([]);
    const [stats, setStats] = useState({
        totalGPs: 0,
        avgResolutionRate: 0,
        topPerformer: "",
        worstPerformer: "",
    });

    /* 🌐 Multilingual text */
    const t = useMemo(() => {
        const L: Record<Locale, any> = {
            en: {
                title: "GP Performance Dashboard",
                subtitle: "Gram Panchayat-wise performance metrics and analysis",
                back: "Back to Dashboard",
                filters: {
                    title: "Filters",
                    taluk: "Taluk",
                    allTaluks: "All Taluks",
                    resolutionRate: "Resolution Rate",
                    allRates: "All Rates",
                    excellent: "Excellent (≥90%)",
                    good: "Good (75-89%)",
                    average: "Average (60-74%)",
                    poor: "Poor (<60%)",
                    sortBy: "Sort By",
                    sortOptions: {
                        resolutionRate: "Resolution Rate",
                        totalIssues: "Total Issues",
                        resolved: "Resolved Issues",
                        pending: "Pending Issues",
                        name: "GP Name",
                        taluk: "Taluk",
                    },
                    sortOrder: "Sort Order",
                    ascending: "Ascending",
                    descending: "Descending",
                    apply: "Apply Filters",
                    clear: "Clear Filters",
                },
                stats: {
                    totalGPs: "Total GPs",
                    avgResolutionRate: "Avg Resolution Rate",
                    topPerformer: "Top Performer",
                    worstPerformer: "Needs Attention",
                    totalIssues: "Total Issues",
                    resolved: "Resolved",
                    pending: "Pending",
                    escalated: "Escalated",
                    resolutionRate: "Resolution Rate",
                    avgTime: "Avg Time",
                },
                columns: {
                    rank: "Rank",
                    gpName: "GP Name",
                    taluk: "Taluk",
                    totalIssues: "Total",
                    resolved: "Resolved",
                    pending: "Pending",
                    escalated: "Escalated",
                    resolutionRate: "Resolution Rate",
                    avgTime: "Avg Time (days)",
                    actions: "Actions",
                },
                actions: {
                    viewDetails: "View Details",
                    compare: "Compare",
                    export: "Export Data",
                    refresh: "Refresh Data",
                },
                loading: "Loading GP performance data…",
                noData: "No GP performance data available",
                error: {
                    auth: "Authentication error",
                    data: "Failed to load data",
                    district: "District information not found",
                },
                modal: {
                    title: "GP Performance Details",
                    close: "Close",
                    export: "Export Report",
                },
            },
            kn: {
                title: "GP ಪರಿಣಾಮಕಾರಿತ್ವ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
                subtitle: "ಗ್ರಾಮ ಪಂಚಾಯತ್-ತಿಳಿದ ಪ್ರದರ್ಶನ ಮೆಟ್ರಿಕ್ಸ್ ಮತ್ತು ವಿಶ್ಲೇಷಣೆ",
                back: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಹಿಂತಿರುಗಿ",
                filters: {
                    title: "ಫಿಲ್ಟರ್‌ಗಳು",
                    taluk: "ತಾಲ್ಲೂಕು",
                    allTaluks: "ಎಲ್ಲಾ ತಾಲ್ಲೂಕುಗಳು",
                    resolutionRate: "ಪರಿಹಾರ ದರ",
                    allRates: "ಎಲ್ಲಾ ದರಗಳು",
                    excellent: "ಅತ್ಯುತ್ತಮ (≥90%)",
                    good: "ಉತ್ತಮ (75-89%)",
                    average: "ಸರಾಸರಿ (60-74%)",
                    poor: "ಕಳಪೆ (<60%)",
                    sortBy: "ವಿಂಗಡಿಸಿ",
                    sortOptions: {
                        resolutionRate: "ಪರಿಹಾರ ದರ",
                        totalIssues: "ಒಟ್ಟು ಸಮಸ್ಯೆಗಳು",
                        resolved: "ಪರಿಹಾರವಾದ ಸಮಸ್ಯೆಗಳು",
                        pending: "ಬಾಕಿ ಸಮಸ್ಯೆಗಳು",
                        name: "GP ಹೆಸರು",
                        taluk: "ತಾಲ್ಲೂಕು",
                    },
                    sortOrder: "ವಿಂಗಡಣೆ ಕ್ರಮ",
                    ascending: "ಆರೋಹಣ",
                    descending: "ಅವರೋಹಣ",
                    apply: "ಫಿಲ್ಟರ್‌ಗಳು ಅನ್ವಯಿಸಿ",
                    clear: "ಫಿಲ್ಟರ್‌ಗಳು ತೆರವುಗೊಳಿಸಿ",
                },
                stats: {
                    totalGPs: "ಒಟ್ಟು GPs",
                    avgResolutionRate: "ಸರಾಸರಿ ಪರಿಹಾರ ದರ",
                    topPerformer: "ಅಗ್ರಸ್ಥಾನದಲ್ಲಿರುವ",
                    worstPerformer: "ಗಮನ ಬೇಕಾದ",
                    totalIssues: "ಒಟ್ಟು ಸಮಸ್ಯೆಗಳು",
                    resolved: "ಪರಿಹಾರವಾದವು",
                    pending: "ಬಾಕಿ ಇವೆ",
                    escalated: "ಎಸ್ಕಲೇಟೆಡ್",
                    resolutionRate: "ಪರಿಹಾರ ದರ",
                    avgTime: "ಸರಾಸರಿ ಸಮಯ",
                },
                columns: {
                    rank: "ರ್ಯಾಂಕ್",
                    gpName: "GP ಹೆಸರು",
                    taluk: "ತಾಲ್ಲೂಕು",
                    totalIssues: "ಒಟ್ಟು",
                    resolved: "ಪರಿಹಾರವಾದವು",
                    pending: "ಬಾಕಿ ಇವೆ",
                    escalated: "ಎಸ್ಕಲೇಟೆಡ್",
                    resolutionRate: "ಪರಿಹಾರ ದರ",
                    avgTime: "ಸರಾಸರಿ ಸಮಯ (ದಿನಗಳು)",
                    actions: "ಕ್ರಿಯೆಗಳು",
                },
                actions: {
                    viewDetails: "ವಿವರಗಳನ್ನು ವೀಕ್ಷಿಸಿ",
                    compare: "ಹೋಲಿಕೆ ಮಾಡಿ",
                    export: "ಡೇಟಾ ರಫ್ತು ಮಾಡಿ",
                    refresh: "ಡೇಟಾ ರಿಫ್ರೆಶ್ ಮಾಡಿ",
                },
                loading: "GP ಪರಿಣಾಮಕಾರಿತ್ವ ಡೇಟಾ ಲೋಡ್ ಆಗುತ್ತಿದೆ…",
                noData: "ಯಾವುದೇ GP ಪರಿಣಾಮಕಾರಿತ್ವ ಡೇಟಾ ಲಭ್ಯವಿಲ್ಲ",
                error: {
                    auth: "ದೃಢೀಕರಣ ದೋಷ",
                    data: "ಡೇಟಾ ಲೋಡ್ ಮಾಡಲು ವಿಫಲವಾಗಿದೆ",
                    district: "ಜಿಲ್ಲಾ ಮಾಹಿತಿ ಕಂಡುಬಂದಿಲ್ಲ",
                },
                modal: {
                    title: "GP ಪರಿಣಾಮಕಾರಿತ್ವ ವಿವರಗಳು",
                    close: "ಮುಚ್ಚಿ",
                    export: "ವರದಿ ರಫ್ತು ಮಾಡಿ",
                },
            },
            hi: {
                title: "GP प्रदर्शन डैशबोर्ड",
                subtitle: "ग्राम पंचायत-वार प्रदर्शन मैट्रिक्स और विश्लेषण",
                back: "डैशबोर्ड पर वापस जाएं",
                filters: {
                    title: "फ़िल्टर",
                    taluk: "तालुका",
                    allTaluks: "सभी तालुका",
                    resolutionRate: "समाधान दर",
                    allRates: "सभी दर",
                    excellent: "उत्कृष्ट (≥90%)",
                    good: "अच्छा (75-89%)",
                    average: "औसत (60-74%)",
                    poor: "खराब (<60%)",
                    sortBy: "क्रमबद्ध करें",
                    sortOptions: {
                        resolutionRate: "समाधान दर",
                        totalIssues: "कुल समस्याएँ",
                        resolved: "हल हुई समस्याएँ",
                        pending: "लंबित समस्याएँ",
                        name: "GP नाम",
                        taluk: "तालुका",
                    },
                    sortOrder: "क्रम",
                    ascending: "आरोही",
                    descending: "अवरोही",
                    apply: "फ़िल्टर लागू करें",
                    clear: "फ़िल्टर साफ करें",
                },
                stats: {
                    totalGPs: "कुल GPs",
                    avgResolutionRate: "औसत समाधान दर",
                    topPerformer: "शीर्ष प्रदर्शन",
                    worstPerformer: "ध्यान आवश्यक",
                    totalIssues: "कुल समस्याएँ",
                    resolved: "हल हुई",
                    pending: "लंबित",
                    escalated: "एस्केलेटेड",
                    resolutionRate: "समाधान दर",
                    avgTime: "औसत समय",
                },
                columns: {
                    rank: "रैंक",
                    gpName: "GP नाम",
                    taluk: "तालुका",
                    totalIssues: "कुल",
                    resolved: "हल हुई",
                    pending: "लंबित",
                    escalated: "एस्केलेटेड",
                    resolutionRate: "समाधान दर",
                    avgTime: "औसत समय (दिन)",
                    actions: "कार्रवाई",
                },
                actions: {
                    viewDetails: "विवरण देखें",
                    compare: "तुलना करें",
                    export: "डेटा निर्यात करें",
                    refresh: "डेटा ताज़ा करें",
                },
                loading: "GP प्रदर्शन डेटा लोड हो रहा है…",
                noData: "कोई GP प्रदर्शन डेटा उपलब्ध नहीं",
                error: {
                    auth: "प्रमाणीकरण त्रुटि",
                    data: "डेटा लोड करने में विफल",
                    district: "जिला जानकारी नहीं मिली",
                },
                modal: {
                    title: "GP प्रदर्शन विवरण",
                    close: "बंद करें",
                    export: "रिपोर्ट निर्यात करें",
                },
            },
        };
        return L[locale] || L.en;
    }, [locale]);

    /* 🔐 Load DDO Data */
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Wait for auth to be ready
                await auth.authStateReady();
                const user = auth.currentUser;

                if (!user) {
                    router.replace(`/${locale}/authority/login`);
                    return;
                }

                // Load DDO authority document
                const authorityDocRef = doc(db, "authorities", user.uid);
                const authoritySnap = await getDoc(authorityDocRef);

                if (!authoritySnap.exists()) {
                    console.error("Authority document not found");
                    router.replace(`/${locale}/authority/status`);
                    return;
                }

                const authorityData = authoritySnap.data();

                // Check verification and role
                const isVerified =
                    authorityData?.verified === true ||
                    authorityData?.verification?.status === "verified" ||
                    authorityData?.status === "verified" ||
                    authorityData?.status === "active";

                if (!isVerified || authorityData?.role !== "ddo") {
                    console.error("Not verified or not DDO role");
                    router.replace(`/${locale}/authority/status`);
                    return;
                }

                // Extract district information
                const districtName = authorityData.district || authorityData.districtName;
                const districtIdentifier = authorityData.districtId || authorityData.district_id;

                if (!districtName && !districtIdentifier) {
                    setError(t.error.district);
                    setLoading(false);
                    return;
                }

                setDistrict(districtName);
                setDistrictId(districtIdentifier);

                // Load GP performance data
                await loadGPPerformanceData(districtName, districtIdentifier);

            } catch (err: any) {
                console.error("Error loading data:", err);
                setError(`${t.error.auth}: ${err.message}`);
                setLoading(false);
            }
        };

        const loadGPPerformanceData = async (districtName: string, districtId: string) => {
            try {
                // Load all issues for the district
                const issues: any[] = [];

                // Try query by district name
                try {
                    const issuesByNameQuery = query(
                        collection(db, "issues"),
                        where("district", "==", districtName)
                    );
                    const issuesByNameSnapshot = await getDocs(issuesByNameQuery);

                    issuesByNameSnapshot.forEach(doc => {
                        if (!issues.find(i => i.id === doc.id)) {
                            issues.push({ id: doc.id, ...doc.data() });
                        }
                    });
                } catch (err) {
                    console.log("Query by district name failed:", err);
                }

                // Try query by districtId
                try {
                    const issuesByIdQuery = query(
                        collection(db, "issues"),
                        where("districtId", "==", districtId)
                    );
                    const issuesByIdSnapshot = await getDocs(issuesByIdQuery);

                    issuesByIdSnapshot.forEach(doc => {
                        if (!issues.find(i => i.id === doc.id)) {
                            issues.push({ id: doc.id, ...doc.data() });
                        }
                    });
                } catch (err) {
                    console.log("Query by districtId failed:", err);
                }

                console.log(`Total issues found: ${issues.length}`);

                // Group issues by GP
                const gpData: Record<string, any> = {};

                issues.forEach(issue => {
                    const gpName = issue.panchayatName || issue.panchayat || issue.gramPanchayat || "Unknown GP";
                    const taluk = issue.talukName || issue.taluk || "Unknown Taluk";
                    const category = issue.categoryName || issue.category || issue.type || "Other";

                    if (!gpData[gpName]) {
                        gpData[gpName] = {
                            name: gpName,
                            taluk: taluk,
                            issues: [],
                            categories: {},
                            resolutionTimes: [],
                        };
                    }

                    gpData[gpName].issues.push(issue);

                    // Track categories
                    if (!gpData[gpName].categories[category]) {
                        gpData[gpName].categories[category] = { total: 0, resolved: 0 };
                    }
                    gpData[gpName].categories[category].total++;

                    if (issue.status === "resolved" || issue.status === "closed") {
                        gpData[gpName].categories[category].resolved++;

                        // Calculate resolution time
                        const createdAt = issue.createdAt?.toDate?.() || new Date();
                        const resolvedAt = issue.resolvedAt?.toDate?.() || new Date();
                        const diffTime = Math.abs(resolvedAt.getTime() - createdAt.getTime());
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        gpData[gpName].resolutionTimes.push(diffDays);
                    }
                });

                // Calculate performance metrics for each GP
                const performanceData: GPPerformance[] = [];

                Object.keys(gpData).forEach(gpName => {
                    const data = gpData[gpName];
                    const totalIssues = data.issues.length;
                    const resolved = data.issues.filter((issue: any) =>
                        issue.status === "resolved" || issue.status === "closed"
                    ).length;
                    const pending = data.issues.filter((issue: any) =>
                        ["pending", "in_progress", "assigned", "verified", "submitted"].includes(issue.status)
                    ).length;
                    const escalated = data.issues.filter((issue: any) => issue.escalated === true).length;
                    const resolutionRate = totalIssues > 0 ? Math.round((resolved / totalIssues) * 100) : 0;
                    const averageResolutionTime = data.resolutionTimes.length > 0
                        ? Math.round(data.resolutionTimes.reduce((a: number, b: number) => a + b, 0) / data.resolutionTimes.length)
                        : 0;

                    // Calculate last 30 days resolved
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                    const last30DaysResolved = data.issues.filter((issue: any) => {
                        if (!(issue.status === "resolved" || issue.status === "closed")) return false;
                        const resolvedAt = issue.resolvedAt?.toDate?.() || new Date();
                        return resolvedAt >= thirtyDaysAgo;
                    }).length;

                    // Calculate trends (last 6 months)
                    const trends = [];
                    const currentDate = new Date();
                    for (let i = 5; i >= 0; i--) {
                        const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
                        const monthName = monthDate.toLocaleString('default', { month: 'short' });

                        const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
                        const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

                        const monthIssues = data.issues.filter((issue: any) => {
                            const issueDate = issue.createdAt?.toDate?.() || new Date(0);
                            return issueDate >= monthStart && issueDate <= monthEnd;
                        });

                        const monthResolved = monthIssues.filter((issue: any) =>
                            issue.status === "resolved" || issue.status === "closed"
                        ).length;

                        trends.push({
                            month: monthName,
                            resolved: monthResolved,
                            created: monthIssues.length,
                        });
                    }

                    // Prepare category breakdown
                    const categoryBreakdown = Object.keys(data.categories).map(category => ({
                        category,
                        count: data.categories[category].total,
                        resolved: data.categories[category].resolved,
                    })).sort((a, b) => b.count - a.count);

                    performanceData.push({
                        id: gpName.replace(/\s+/g, '-').toLowerCase(),
                        name: gpName,
                        taluk: data.taluk,
                        totalIssues,
                        resolved,
                        pending,
                        escalated,
                        resolutionRate,
                        averageResolutionTime,
                        last30DaysResolved,
                        categoryBreakdown,
                        trends,
                    });
                });

                // Sort by resolution rate by default
                performanceData.sort((a, b) => b.resolutionRate - a.resolutionRate);

                // Extract unique taluks
                const uniqueTaluks = Array.from(new Set(performanceData.map(gp => gp.taluk))).sort();
                setTaluks(uniqueTaluks);

                // Calculate overall stats
                const totalGPs = performanceData.length;
                const avgResolutionRate = performanceData.length > 0
                    ? Math.round(performanceData.reduce((sum, gp) => sum + gp.resolutionRate, 0) / performanceData.length)
                    : 0;
                const topPerformer = performanceData.length > 0 ? performanceData[0].name : "";
                const worstPerformer = performanceData.length > 0 ? performanceData[performanceData.length - 1].name : "";

                setStats({
                    totalGPs,
                    avgResolutionRate,
                    topPerformer,
                    worstPerformer,
                });

                setGpPerformance(performanceData);
                applyFilters(performanceData, filters);

            } catch (err: any) {
                console.error("Error in loadGPPerformanceData:", err);
                setError(`${t.error.data}: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [router, locale, t]);

    // Apply filters
    useEffect(() => {
        applyFilters(gpPerformance, filters);
    }, [filters, gpPerformance]);

    const applyFilters = (data: GPPerformance[], filters: FilterOptions) => {
        let filtered = [...data];

        // Filter by taluk
        if (filters.taluk !== "all") {
            filtered = filtered.filter(gp => gp.taluk === filters.taluk);
        }

        // Filter by resolution rate
        if (filters.resolutionRate !== "all") {
            switch (filters.resolutionRate) {
                case "excellent":
                    filtered = filtered.filter(gp => gp.resolutionRate >= 90);
                    break;
                case "good":
                    filtered = filtered.filter(gp => gp.resolutionRate >= 75 && gp.resolutionRate < 90);
                    break;
                case "average":
                    filtered = filtered.filter(gp => gp.resolutionRate >= 60 && gp.resolutionRate < 75);
                    break;
                case "poor":
                    filtered = filtered.filter(gp => gp.resolutionRate < 60);
                    break;
            }
        }

        // Sort data
        filtered.sort((a, b) => {
            let aValue: any = a[filters.sortBy as keyof GPPerformance];
            let bValue: any = b[filters.sortBy as keyof GPPerformance];

            if (typeof aValue === 'string') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }

            if (filters.sortOrder === "asc") {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

        setFilteredPerformance(filtered);
    };

    const handleFilterChange = (key: keyof FilterOptions, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setFilters({
            taluk: "all",
            resolutionRate: "all",
            sortBy: "resolutionRate",
            sortOrder: "desc",
        });
    };

    const handleExportData = () => {
        const data = filteredPerformance.map(gp => ({
            "GP Name": gp.name,
            "Taluk": gp.taluk,
            "Total Issues": gp.totalIssues,
            "Resolved": gp.resolved,
            "Pending": gp.pending,
            "Escalated": gp.escalated,
            "Resolution Rate": `${gp.resolutionRate}%`,
            "Average Resolution Time (days)": gp.averageResolutionTime,
            "Last 30 Days Resolved": gp.last30DaysResolved,
        }));

        const csvContent = [
            Object.keys(data[0]).join(","),
            ...data.map(row => Object.values(row).join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `gp-performance-${district || "district"}-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleViewDetails = (gp: GPPerformance) => {
        setSelectedGP(gp);
        setShowDetailsModal(true);
    };

    const getPerformanceColor = (rate: number) => {
        if (rate >= 90) return "bg-green-100 text-green-800";
        if (rate >= 75) return "bg-green-50 text-green-700";
        if (rate >= 60) return "bg-yellow-100 text-yellow-800";
        return "bg-red-100 text-red-800";
    };

    if (loading) {
        return (
            <Screen padded>
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col justify-center items-center h-64 gap-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
                        <p className="text-green-700">{t.loading}</p>
                    </div>
                </div>
            </Screen>
        );
    }

    return (
        <Screen padded>
            <div className="max-w-7xl mx-auto">
                {/* Error Display */}
                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                        <div className="flex items-center gap-2 text-red-700">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <button
                                onClick={() => router.push(`/${locale}/authority/ddo/dashboard`)}
                                className="flex items-center gap-2 text-green-700 hover:text-green-900 mb-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                {t.back}
                            </button>
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-green-900">
                                {t.title}
                            </h1>
                            <p className="text-sm text-green-900/70 mt-1">
                                {t.subtitle} {district && `(${district})`}
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleExportData}
                                className="px-4 py-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 font-bold hover:bg-blue-100 transition flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                {t.actions.export}
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                className="px-4 py-2 rounded-xl bg-green-50 border border-green-200 text-green-700 font-bold hover:bg-green-100 transition flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                {t.actions.refresh}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white border border-green-100 rounded-2xl p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-green-900/70 mb-1">{t.stats.totalGPs}</p>
                                <h3 className="text-2xl font-extrabold text-green-900">
                                    {stats.totalGPs}
                                </h3>
                            </div>
                            <span className="text-2xl">🏛️</span>
                        </div>
                    </div>

                    <div className="bg-white border border-green-100 rounded-2xl p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-green-900/70 mb-1">{t.stats.avgResolutionRate}</p>
                                <h3 className="text-2xl font-extrabold text-green-900">
                                    {stats.avgResolutionRate}%
                                </h3>
                            </div>
                            <span className="text-2xl">📊</span>
                        </div>
                    </div>

                    <div className="bg-white border border-green-100 rounded-2xl p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-green-900/70 mb-1">{t.stats.topPerformer}</p>
                                <h3 className="text-lg font-extrabold text-green-900 truncate" title={stats.topPerformer}>
                                    {stats.topPerformer || "-"}
                                </h3>
                                <p className="text-xs text-green-600 mt-1">Highest resolution rate</p>
                            </div>
                            <span className="text-2xl">🏆</span>
                        </div>
                    </div>

                    <div className="bg-white border border-green-100 rounded-2xl p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-green-900/70 mb-1">{t.stats.worstPerformer}</p>
                                <h3 className="text-lg font-extrabold text-green-900 truncate" title={stats.worstPerformer}>
                                    {stats.worstPerformer || "-"}
                                </h3>
                                <p className="text-xs text-green-600 mt-1">Needs attention</p>
                            </div>
                            <span className="text-2xl">⚠️</span>
                        </div>
                    </div>
                </div>

                {/* Filters Section */}
                <div className="bg-white border border-green-100 rounded-2xl p-6 mb-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <h3 className="text-lg font-bold text-green-900">{t.filters.title}</h3>
                        <div className="flex gap-2">
                            <button
                                onClick={() => applyFilters(gpPerformance, filters)}
                                className="px-4 py-2 bg-green-700 text-white rounded-xl font-bold hover:bg-green-800 transition"
                            >
                                {t.filters.apply}
                            </button>
                            <button
                                onClick={clearFilters}
                                className="px-4 py-2 border border-green-200 text-green-700 rounded-xl font-bold hover:bg-green-50 transition"
                            >
                                {t.filters.clear}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Taluk Filter */}
                        <div>
                            <label className="block text-sm font-bold text-green-900 mb-2">
                                {t.filters.taluk}
                            </label>
                            <select
                                value={filters.taluk}
                                onChange={(e) => handleFilterChange("taluk", e.target.value)}
                                className="w-full px-4 py-2 border border-green-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 text-green-900"
                            >
                                <option value="all">{t.filters.allTaluks}</option>
                                {taluks.map(taluk => (
                                    <option key={taluk} value={taluk}>{taluk}</option>
                                ))}
                            </select>
                        </div>

                        {/* Resolution Rate Filter */}
                        <div>
                            <label className="block text-sm font-bold text-green-900 mb-2">
                                {t.filters.resolutionRate}
                            </label>
                            <select
                                value={filters.resolutionRate}
                                onChange={(e) => handleFilterChange("resolutionRate", e.target.value)}
                                className="w-full px-4 py-2 border border-green-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 text-green-900"
                            >
                                <option value="all">{t.filters.allRates}</option>
                                <option value="excellent">{t.filters.excellent}</option>
                                <option value="good">{t.filters.good}</option>
                                <option value="average">{t.filters.average}</option>
                                <option value="poor">{t.filters.poor}</option>
                            </select>
                        </div>

                        {/* Sort By Filter */}
                        <div>
                            <label className="block text-sm font-bold text-green-900 mb-2">
                                {t.filters.sortBy}
                            </label>
                            <select
                                value={filters.sortBy}
                                onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                                className="w-full px-4 py-2 border border-green-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 text-green-900"
                            >
                                <option value="resolutionRate">{t.filters.sortOptions.resolutionRate}</option>
                                <option value="totalIssues">{t.filters.sortOptions.totalIssues}</option>
                                <option value="resolved">{t.filters.sortOptions.resolved}</option>
                                <option value="pending">{t.filters.sortOptions.pending}</option>
                                <option value="name">{t.filters.sortOptions.name}</option>
                                <option value="taluk">{t.filters.sortOptions.taluk}</option>
                            </select>
                        </div>

                        {/* Sort Order Filter */}
                        <div>
                            <label className="block text-sm font-bold text-green-900 mb-2">
                                {t.filters.sortOrder}
                            </label>
                            <select
                                value={filters.sortOrder}
                                onChange={(e) => handleFilterChange("sortOrder", e.target.value as "asc" | "desc")}
                                className="w-full px-4 py-2 border border-green-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 text-green-900"
                            >
                                <option value="desc">{t.filters.descending}</option>
                                <option value="asc">{t.filters.ascending}</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* GP Performance Chart */}
                {filteredPerformance.length > 0 && (
                    <div className="mb-8">
                        <GPPerformanceChart data={filteredPerformance.slice(0, 10)} locale={locale} />
                    </div>
                )}

                {/* GP Performance Table */}
                <div className="bg-white border border-green-100 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-green-50">
                                    <th className="py-4 px-6 text-left text-sm font-bold text-green-900">{t.columns.rank}</th>
                                    <th className="py-4 px-6 text-left text-sm font-bold text-green-900">{t.columns.gpName}</th>
                                    <th className="py-4 px-6 text-left text-sm font-bold text-green-900">{t.columns.taluk}</th>
                                    <th className="py-4 px-6 text-left text-sm font-bold text-green-900">{t.columns.totalIssues}</th>
                                    <th className="py-4 px-6 text-left text-sm font-bold text-green-900">{t.columns.resolved}</th>
                                    <th className="py-4 px-6 text-left text-sm font-bold text-green-900">{t.columns.pending}</th>
                                    <th className="py-4 px-6 text-left text-sm font-bold text-green-900">{t.columns.escalated}</th>
                                    <th className="py-4 px-6 text-left text-sm font-bold text-green-900">{t.columns.resolutionRate}</th>
                                    <th className="py-4 px-6 text-left text-sm font-bold text-green-900">{t.columns.avgTime}</th>
                                    <th className="py-4 px-6 text-left text-sm font-bold text-green-900">{t.columns.actions}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPerformance.length > 0 ? (
                                    filteredPerformance.map((gp, index) => (
                                        <tr key={gp.id} className="border-b border-green-50 hover:bg-green-50">
                                            <td className="py-4 px-6">
                                                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-800' :
                                                    index === 1 ? 'bg-gray-100 text-gray-800' :
                                                        index === 2 ? 'bg-orange-100 text-orange-800' :
                                                            'bg-green-50 text-green-700'
                                                    }`}>
                                                    {index + 1}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div>
                                                    <p className="font-bold text-green-900">{gp.name}</p>
                                                    <p className="text-xs text-green-600">ID: {gp.id}</p>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                                    {gp.taluk}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 font-bold text-green-900">{gp.totalIssues}</td>
                                            <td className="py-4 px-6">
                                                <span className="font-bold text-green-700">{gp.resolved}</span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${gp.pending === 0 ? 'bg-green-100 text-green-800' :
                                                    gp.pending <= 5 ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-red-100 text-red-800'
                                                    }`}>
                                                    {gp.pending}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${gp.escalated === 0 ? 'bg-green-100 text-green-800' :
                                                    gp.escalated <= 2 ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-red-100 text-red-800'
                                                    }`}>
                                                    {gp.escalated}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${getPerformanceColor(gp.resolutionRate)}`}>
                                                    {gp.resolutionRate}%
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${gp.averageResolutionTime <= 7 ? 'bg-green-100 text-green-800' :
                                                    gp.averageResolutionTime <= 14 ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-red-100 text-red-800'
                                                    }`}>
                                                    {gp.averageResolutionTime} days
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleViewDetails(gp)}
                                                        className="px-3 py-1 bg-green-700 text-white text-sm rounded-lg hover:bg-green-800 transition"
                                                    >
                                                        {t.actions.viewDetails}
                                                    </button>
                                                    <button
                                                        onClick={() => router.push(`/${locale}/authority/ddo/issues?gp=${encodeURIComponent(gp.name)}`)}
                                                        className="px-3 py-1 border border-green-200 text-green-700 text-sm rounded-lg hover:bg-green-50 transition"
                                                    >
                                                        View Issues
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={10} className="py-8 text-center text-gray-500">
                                            {t.noData}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {filteredPerformance.length > 0 && (
                        <div className="px-6 py-4 border-t border-green-100 flex justify-between items-center">
                            <p className="text-sm text-green-700">
                                Showing {filteredPerformance.length} of {gpPerformance.length} GPs
                            </p>
                            <div className="flex gap-2">
                                <button className="px-3 py-1 border border-green-200 rounded-lg text-sm text-green-700 hover:bg-green-50">
                                    Previous
                                </button>
                                <button className="px-3 py-1 bg-green-700 text-white rounded-lg text-sm hover:bg-green-800">
                                    1
                                </button>
                                <button className="px-3 py-1 border border-green-200 rounded-lg text-sm text-green-700 hover:bg-green-50">
                                    2
                                </button>
                                <button className="px-3 py-1 border border-green-200 rounded-lg text-sm text-green-700 hover:bg-green-50">
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* GP Details Modal */}
            {showDetailsModal && selectedGP && (
                <GPDetailsModal
                    gp={selectedGP}
                    onClose={() => setShowDetailsModal(false)}
                    locale={locale}
                    t={t.modal}
                />
            )}
        </Screen>
    );
}