"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth, db } from "../../../../../lib/firebase";
import { collection, query, where, getDocs, doc, getDoc, Timestamp } from "firebase/firestore";
import Screen from "../../../../../components/Screen";
import * as XLSX from "xlsx";
import { motion, AnimatePresence } from "framer-motion";

// Define proper types
interface Issue {
  id: string;
  title?: string;
  category?: string;
  categoryName?: string;
  type?: string;
  status?: string;
  panchayatName?: string;
  panchayat?: string;
  gramPanchayat?: string;
  createdAt?: Timestamp | string;
  resolvedAt?: Timestamp | string;
  updatedAt?: Timestamp | string;
  closedAt?: Timestamp | string;
  escalated?: boolean;
  district?: string;
  districtId?: string;
  [key: string]: any; // Allow other properties
}

interface AuthorityData {
  district?: string;
  districtId?: string;
  name?: string;
  role?: string;
  [key: string]: any;
}

interface DateRange {
  startDate: string;
  endDate: string;
}

interface GPStats {
  total: number;
  resolved: number;
  escalated: number;
  totalTime: number;
}

interface SummaryReport {
  reportType: string;
  generatedAt: string;
  district: string;
  dateRange: DateRange;
  statistics: {
    total: number;
    resolved: number;
    pending: number;
    escalated: number;
    resolutionRate: number;
    escalationRate: number;
  };
  issues: Issue[];
}

interface DetailedReport {
  reportType: string;
  generatedAt: string;
  district: string;
  dateRange: DateRange;
  issues: Array<{
    id: string;
    title?: string;
    category?: string;
    status?: string;
    panchayat?: string;
    createdAt?: string;
    resolvedAt?: string;
    escalated?: boolean;
  }>;
}

interface PerformanceReport {
  reportType: string;
  generatedAt: string;
  district: string;
  dateRange: DateRange;
  performance: Array<{
    gramPanchayat: string;
    totalIssues: number;
    resolved: number;
    escalated: number;
    resolutionRate: number;
    avgResolutionTime: number;
  }>;
}

// Translations
const translations = {
  en: {
    back: "← Back",
    title: "Custom Report Generator",
    dateRange: "Date Range",
    gramPanchayats: "Gram Panchayats",
    categories: "Categories",
    reportType: "Report Type",
    format: "Format",
    generate: "Generate Custom Report",
    generating: "Generating...",
    selected: "selected",
    summary: "Summary Report",
    detailed: "Detailed Report",
    performance: "Performance Report",
    excel: "Excel (.xlsx)",
    csv: "CSV (.csv)",
    json: "JSON (.json)",
    startDate: "Start Date",
    endDate: "End Date",
    selectAll: "Select All",
    clearAll: "Clear All",
    noFilters: "No filters available",
    loading: "Loading..."
  },
  hi: {
    back: "← वापस",
    title: "कस्टम रिपोर्ट जनरेटर",
    dateRange: "तिथि सीमा",
    gramPanchayats: "ग्राम पंचायतें",
    categories: "श्रेणियाँ",
    reportType: "रिपोर्ट प्रकार",
    format: "प्रारूप",
    generate: "कस्टम रिपोर्ट बनाएं",
    generating: "बनाया जा रहा है...",
    selected: "चयनित",
    summary: "सारांश रिपोर्ट",
    detailed: "विस्तृत रिपोर्ट",
    performance: "प्रदर्शन रिपोर्ट",
    excel: "एक्सेल (.xlsx)",
    csv: "सीएसवी (.csv)",
    json: "जेसन (.json)",
    startDate: "आरंभ तिथि",
    endDate: "समाप्ति तिथि",
    selectAll: "सभी चुनें",
    clearAll: "सभी हटाएं",
    noFilters: "कोई फ़िल्टर उपलब्ध नहीं",
    loading: "लोड हो रहा है..."
  },
  kn: {
    back: "← ಹಿಂದೆ",
    title: "ಕಸ್ಟಮ್ ವರದಿ ಜನರೇಟರ್",
    dateRange: "ದಿನಾಂಕ ವ್ಯಾಪ್ತಿ",
    gramPanchayats: "ಗ್ರಾಮ ಪಂಚಾಯತ್ಗಳು",
    categories: "ವರ್ಗಗಳು",
    reportType: "ವರದಿ ಪ್ರಕಾರ",
    format: "ಸ್ವರೂಪ",
    generate: "ಕಸ್ಟಮ್ ವರದಿ ರಚಿಸಿ",
    generating: "ರಚಿಸಲಾಗುತ್ತಿದೆ...",
    selected: "ಆಯ್ಕೆ ಮಾಡಲಾಗಿದೆ",
    summary: "ಸಾರಾಂಶ ವರದಿ",
    detailed: "ವಿವರವಾದ ವರದಿ",
    performance: "ಕಾರ್ಯಕ್ಷಮತೆ ವರದಿ",
    excel: "ಎಕ್ಸೆಲ್ (.xlsx)",
    csv: "ಸಿಎಸ್ವಿ (.csv)",
    json: "ಜೆಸನ್ (.json)",
    startDate: "ಪ್ರಾರಂಭ ದಿನಾಂಕ",
    endDate: "ಅಂತಿಮ ದಿನಾಂಕ",
    selectAll: "ಎಲ್ಲಾ ಆಯ್ಕೆಮಾಡಿ",
    clearAll: "ಎಲ್ಲಾ ತೆರವುಗೊಳಿಸಿ",
    noFilters: "ಯಾವುದೇ ಫಿಲ್ಟರ್ ಲಭ್ಯವಿಲ್ಲ",
    loading: "ಲೋಡ್ ಆಗುತ್ತಿದೆ..."
  }
};

// Helper function to safely convert any date type to Date object
const toDate = (dateValue: Timestamp | string | undefined): Date | null => {
  if (!dateValue) return null;
  
  if (dateValue instanceof Timestamp) {
    return dateValue.toDate();
  }
  
  if (typeof dateValue === 'string') {
    const date = new Date(dateValue);
    return isNaN(date.getTime()) ? null : date;
  }
  
  return null;
};

export default function CustomReportPage() {
  const router = useRouter();
  const params = useParams() as { locale?: string };
  const locale = params?.locale || "en";
  const t = translations[locale as keyof typeof translations] || translations.en;
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [selectedGPs, setSelectedGPs] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [availableGPs, setAvailableGPs] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [reportType, setReportType] = useState("summary");
  const [format, setFormat] = useState("excel");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadFilters();
  }, []);

  const loadFilters = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        router.replace(`/${locale}/authority/login`);
        return;
      }

      const authorityDoc = await getDoc(doc(db, "authorities", user.uid));
      if (!authorityDoc.exists()) {
        router.replace(`/${locale}/authority/status`);
        return;
      }

      const authorityData = authorityDoc.data() as AuthorityData;
      const district = authorityData.district;

      if (!district) return;

      const issuesQuery = query(
        collection(db, "issues"),
        where("district", "==", district)
      );
      const issuesSnap = await getDocs(issuesQuery);

      const gps = new Set<string>();
      const categories = new Set<string>();

      issuesSnap.forEach(doc => {
        const data = doc.data();
        // Try different field names for GP
        const gpName = data.panchayatName || data.panchayat || data.gramPanchayat;
        if (gpName) gps.add(gpName);
        
        // Try different field names for category
        const category = data.categoryName || data.category || data.type;
        if (category) categories.add(category);
      });

      setAvailableGPs(Array.from(gps));
      setAvailableCategories(Array.from(categories));
    } catch (error) {
      console.error("Error loading filters:", error);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSelectAllGPs = () => {
    setSelectedGPs(availableGPs);
  };

  const handleClearAllGPs = () => {
    setSelectedGPs([]);
  };

  const handleSelectAllCategories = () => {
    setSelectedCategories(availableCategories);
  };

  const handleClearAllCategories = () => {
    setSelectedCategories([]);
  };

  const generateCustomReport = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        router.replace(`/${locale}/authority/login`);
        return;
      }

      const authorityDoc = await getDoc(doc(db, "authorities", user.uid));
      if (!authorityDoc.exists()) {
        router.replace(`/${locale}/authority/status`);
        return;
      }

      const authorityData = authorityDoc.data() as AuthorityData;
      const district = authorityData.district;

      if (!district) return;

      // Build query with filters
      let q = query(
        collection(db, "issues"),
        where("district", "==", district)
      );

      const issuesSnap = await getDocs(q);
      let issues: Issue[] = issuesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Issue[];

      // Apply date filter
      const start = new Date(dateRange.startDate);
      const end = new Date(dateRange.endDate);
      end.setHours(23, 59, 59, 999);

      issues = issues.filter(issue => {
        const issueDate = toDate(issue.createdAt);
        if (!issueDate) return false;
        return issueDate >= start && issueDate <= end;
      });

      // Apply GP filter
      if (selectedGPs.length > 0) {
        issues = issues.filter(issue => {
          const gpName = issue.panchayatName || issue.panchayat || issue.gramPanchayat;
          return gpName ? selectedGPs.includes(gpName) : false;
        });
      }

      // Apply category filter
      if (selectedCategories.length > 0) {
        issues = issues.filter(issue => {
          const category = issue.categoryName || issue.category || issue.type;
          return category ? selectedCategories.includes(category) : false;
        });
      }

      // Generate report based on type
      let reportData;
      switch (reportType) {
        case "summary":
          reportData = generateSummaryReport(issues, district);
          break;
        case "detailed":
          reportData = generateDetailedReport(issues, district);
          break;
        case "performance":
          reportData = generatePerformanceReport(issues, district);
          break;
        default:
          reportData = issues;
      }

      // Download based on format
      const filename = `custom_report_${district}_${dateRange.startDate}`;
      
      if (format === "excel") {
        downloadExcel(reportData, filename);
      } else if (format === "csv") {
        downloadCSV(reportData, filename);
      } else {
        downloadJSON(reportData, filename);
      }

    } catch (error) {
      console.error("Error generating report:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateSummaryReport = (issues: Issue[], district: string): SummaryReport => {
    const total = issues.length;
    const resolved = issues.filter(i => i.status === "resolved" || i.status === "closed").length;
    const pending = issues.filter(i => ["pending", "in_progress", "assigned", "verified", "submitted"].includes(i.status || "")).length;
    const escalated = issues.filter(i => i.escalated === true).length;

    return {
      reportType: "Summary Report",
      generatedAt: new Date().toISOString(),
      district,
      dateRange,
      statistics: {
        total,
        resolved,
        pending,
        escalated,
        resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0,
        escalationRate: total > 0 ? Math.round((escalated / total) * 100) : 0
      },
      issues
    };
  };

  const generateDetailedReport = (issues: Issue[], district: string): DetailedReport => {
    return {
      reportType: "Detailed Report",
      generatedAt: new Date().toISOString(),
      district,
      dateRange,
      issues: issues.map(i => {
        const getDateString = (date?: Timestamp | string) => {
          const dateObj = toDate(date);
          return dateObj ? dateObj.toISOString() : undefined;
        };

        return {
          id: i.id,
          title: i.title,
          category: i.categoryName || i.category || i.type,
          status: i.status,
          panchayat: i.panchayatName || i.panchayat || i.gramPanchayat,
          createdAt: getDateString(i.createdAt),
          resolvedAt: getDateString(i.resolvedAt || i.updatedAt || i.closedAt),
          escalated: i.escalated
        };
      })
    };
  };

  const generatePerformanceReport = (issues: Issue[], district: string): PerformanceReport => {
    // Group by GP
    const gpStats: Record<string, GPStats> = {};
    
    issues.forEach(issue => {
      const gp = issue.panchayatName || issue.panchayat || issue.gramPanchayat || "Unknown";
      if (!gpStats[gp]) {
        gpStats[gp] = { total: 0, resolved: 0, escalated: 0, totalTime: 0 };
      }
      
      gpStats[gp].total++;
      
      if (issue.status === "resolved" || issue.status === "closed") {
        gpStats[gp].resolved++;
        
        // Calculate resolution time
        const created = toDate(issue.createdAt);
        const resolved = toDate(issue.resolvedAt || issue.updatedAt || issue.closedAt);
        
        if (created && resolved) {
          const days = Math.ceil((resolved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
          gpStats[gp].totalTime += days;
        }
      }
      
      if (issue.escalated) gpStats[gp].escalated++;
    });

    const performance = Object.entries(gpStats).map(([name, stats]) => ({
      gramPanchayat: name,
      totalIssues: stats.total,
      resolved: stats.resolved,
      escalated: stats.escalated,
      resolutionRate: stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0,
      avgResolutionTime: stats.resolved > 0 ? Math.round(stats.totalTime / stats.resolved) : 0
    }));

    return {
      reportType: "Performance Report",
      generatedAt: new Date().toISOString(),
      district,
      dateRange,
      performance
    };
  };

  const downloadExcel = (data: any, filename: string) => {
    const wb = XLSX.utils.book_new();
    
    // Convert data to appropriate format for Excel
    let worksheetData;
    if (data.performance) {
      // Performance report
      worksheetData = data.performance;
    } else if (data.issues) {
      // Detailed or summary report
      worksheetData = data.issues;
    } else {
      worksheetData = [data];
    }
    
    const ws = XLSX.utils.json_to_sheet(worksheetData);
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    
    // Add metadata sheet
    const metadata = [
      ["Report Type", data.reportType || "Custom Report"],
      ["Generated At", data.generatedAt || new Date().toISOString()],
      ["District", data.district || "Unknown"],
      ["Date Range", `${data.dateRange?.startDate} to ${data.dateRange?.endDate}`],
      ["Total Records", worksheetData.length]
    ];
    const ws_meta = XLSX.utils.aoa_to_sheet(metadata);
    XLSX.utils.book_append_sheet(wb, ws_meta, "Metadata");
    
    XLSX.writeFile(wb, `${filename}.xlsx`);
  };

  const downloadCSV = (data: any, filename: string) => {
    // Flatten data for CSV
    let flatData;
    if (data.performance) {
      flatData = data.performance;
    } else if (data.issues) {
      flatData = data.issues;
    } else {
      flatData = [data];
    }
    
    const ws = XLSX.utils.json_to_sheet(flatData);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadJSON = (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  if (initialLoading) {
    return (
      <Screen padded>
        <div className="min-h-screen flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="w-16 h-16 border-4 border-green-200 border-t-green-700 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-green-700 font-medium">{t.loading}</p>
          </motion.div>
        </div>
      </Screen>
    );
  }

  return (
    <Screen padded>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto p-4 sm:p-6"
      >
        <motion.button
          whileHover={{ x: -5 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.back()}
          className="mb-4 sm:mb-6 text-green-700 hover:text-green-900 flex items-center gap-2 text-sm sm:text-base"
        >
          <span className="text-lg">←</span> {t.back}
        </motion.button>

        <motion.h1 
          {...fadeInUp}
          className="text-xl sm:text-2xl md:text-3xl font-bold text-green-900 mb-4 sm:mb-6"
        >
          {t.title}
        </motion.h1>

        {/* Mobile Filter Toggle */}
        <div className="sm:hidden mb-4">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFilters(!showFilters)}
            className="w-full py-3 bg-green-50 text-green-700 rounded-xl font-medium flex items-center justify-center gap-2"
          >
            <svg 
              className={`w-5 h-5 transform transition-transform ${showFilters ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </motion.button>
        </div>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="bg-white border border-green-100 rounded-2xl p-4 sm:p-6 shadow-lg"
        >
          <AnimatePresence>
            <div className={`space-y-4 sm:space-y-6 ${!showFilters && 'sm:block hidden'}`}>
              {/* Date Range */}
              <motion.div variants={fadeInUp}>
                <label className="block text-sm sm:text-base font-bold text-green-900 mb-2">
                  {t.dateRange}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs text-green-600 mb-1 sm:hidden">
                      {t.startDate}
                    </label>
                    <input
                      type="date"
                      value={dateRange.startDate}
                      onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                      className="w-full p-2 sm:p-3 text-sm border border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-green-600 mb-1 sm:hidden">
                      {t.endDate}
                    </label>
                    <input
                      type="date"
                      value={dateRange.endDate}
                      onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                      className="w-full p-2 sm:p-3 text-sm border border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Gram Panchayat Filter */}
              {availableGPs.length > 0 && (
                <motion.div variants={fadeInUp}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                    <label className="text-sm sm:text-base font-bold text-green-900">
                      {t.gramPanchayats} ({selectedGPs.length} {t.selected})
                    </label>
                    <div className="flex gap-2 mt-1 sm:mt-0">
                      <button
                        onClick={handleSelectAllGPs}
                        className="text-xs text-green-600 hover:text-green-800"
                      >
                        {t.selectAll}
                      </button>
                      <button
                        onClick={handleClearAllGPs}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        {t.clearAll}
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 max-h-40 overflow-y-auto p-2 sm:p-3 border border-green-100 rounded-xl bg-green-50/30">
                    {availableGPs.map(gp => (
                      <label key={gp} className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                        <input
                          type="checkbox"
                          checked={selectedGPs.includes(gp)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedGPs([...selectedGPs, gp]);
                            } else {
                              setSelectedGPs(selectedGPs.filter(g => g !== gp));
                            }
                          }}
                          className="rounded text-green-600 focus:ring-green-500 w-4 h-4"
                        />
                        <span className="truncate">{gp}</span>
                      </label>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Category Filter */}
              {availableCategories.length > 0 && (
                <motion.div variants={fadeInUp}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                    <label className="text-sm sm:text-base font-bold text-green-900">
                      {t.categories} ({selectedCategories.length} {t.selected})
                    </label>
                    <div className="flex gap-2 mt-1 sm:mt-0">
                      <button
                        onClick={handleSelectAllCategories}
                        className="text-xs text-green-600 hover:text-green-800"
                      >
                        {t.selectAll}
                      </button>
                      <button
                        onClick={handleClearAllCategories}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        {t.clearAll}
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 max-h-40 overflow-y-auto p-2 sm:p-3 border border-green-100 rounded-xl bg-green-50/30">
                    {availableCategories.map(cat => (
                      <label key={cat} className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(cat)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCategories([...selectedCategories, cat]);
                            } else {
                              setSelectedCategories(selectedCategories.filter(c => c !== cat));
                            }
                          }}
                          className="rounded text-green-600 focus:ring-green-500 w-4 h-4"
                        />
                        <span className="truncate">{cat}</span>
                      </label>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Report Type */}
              <motion.div variants={fadeInUp}>
                <label className="block text-sm sm:text-base font-bold text-green-900 mb-2">
                  {t.reportType}
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full p-2 sm:p-3 text-sm border border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="summary">{t.summary}</option>
                  <option value="detailed">{t.detailed}</option>
                  <option value="performance">{t.performance}</option>
                </select>
              </motion.div>

              {/* Format */}
              <motion.div variants={fadeInUp}>
                <label className="block text-sm sm:text-base font-bold text-green-900 mb-2">
                  {t.format}
                </label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="w-full p-2 sm:p-3 text-sm border border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="excel">{t.excel}</option>
                  <option value="csv">{t.csv}</option>
                  <option value="json">{t.json}</option>
                </select>
              </motion.div>

              {/* Generate Button */}
              <motion.button
                variants={fadeInUp}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={generateCustomReport}
                disabled={loading}
                className="w-full py-3 sm:py-4 bg-gradient-to-r from-green-700 to-green-600 text-white rounded-xl font-bold hover:from-green-800 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl text-sm sm:text-base"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {t.generating}
                  </span>
                ) : t.generate}
              </motion.button>
            </div>
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </Screen>
  );
}
