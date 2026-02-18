// app/[locale]/authority/ddo/trends/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth, db } from "../../../../lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import Screen from "../../../../components/Screen";
import { motion, AnimatePresence } from "framer-motion";

// Translations
const translations = {
  en: {
    back: "← Back",
    title: "Resolution Trends",
    monthlyTrends: "Monthly Trends",
    gpTrends: "Top Gram Panchayats by Volume",
    loading: "Loading trends data...",
    total: "Total",
    resolved: "Resolved",
    escalated: "Escalated",
    noData: "No trends data available",
    last12Months: "Last 12 Months",
    topGPs: "Top 10 Gram Panchayats",
    viewDetails: "View Details",
    issues: "issues",
    resolutionRate: "Resolution Rate",
    escalationRate: "Escalation Rate",
    month: "Month",
    gramPanchayat: "Gram Panchayat"
  },
  hi: {
    back: "← वापस",
    title: "समाधान रुझान",
    monthlyTrends: "मासिक रुझान",
    gpTrends: "मात्रा के अनुसार शीर्ष ग्राम पंचायतें",
    loading: "रुझान डेटा लोड हो रहा है...",
    total: "कुल",
    resolved: "हल किए गए",
    escalated: "बढ़ाए गए",
    noData: "कोई रुझान डेटा उपलब्ध नहीं है",
    last12Months: "पिछले 12 महीने",
    topGPs: "शीर्ष 10 ग्राम पंचायतें",
    viewDetails: "विवरण देखें",
    issues: "मुद्दे",
    resolutionRate: "समाधान दर",
    escalationRate: "प्रवर्धन दर",
    month: "महीना",
    gramPanchayat: "ग्राम पंचायत"
  },
  kn: {
    back: "← ಹಿಂದೆ",
    title: "ಪರಿಹಾರ ಪ್ರವೃತ್ತಿಗಳು",
    monthlyTrends: "ಮಾಸಿಕ ಪ್ರವೃತ್ತಿಗಳು",
    gpTrends: "ಪ್ರಮಾಣದ ಪ್ರಕಾರ ಟಾಪ್ ಗ್ರಾಮ ಪಂಚಾಯತ್ಗಳು",
    loading: "ಪ್ರವೃತ್ತಿ ಡೇಟಾವನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...",
    total: "ಒಟ್ಟು",
    resolved: "ಪರಿಹರಿಸಲಾಗಿದೆ",
    escalated: "ಎತ್ತರಿಸಲಾಗಿದೆ",
    noData: "ಯಾವುದೇ ಪ್ರವೃತ್ತಿ ಡೇಟಾ ಲಭ್ಯವಿಲ್ಲ",
    last12Months: "ಕಳೆದ 12 ತಿಂಗಳುಗಳು",
    topGPs: "ಟಾಪ್ 10 ಗ್ರಾಮ ಪಂಚಾಯತ್ಗಳು",
    viewDetails: "ವಿವರಗಳನ್ನು ನೋಡಿ",
    issues: "ಸಮಸ್ಯೆಗಳು",
    resolutionRate: "ಪರಿಹಾರ ದರ",
    escalationRate: "ಎತ್ತರಿಸುವ ದರ",
    month: "ತಿಂಗಳು",
    gramPanchayat: "ಗ್ರಾಮ ಪಂಚಾಯತ್"
  }
};

export default function TrendsPage() {
  const router = useRouter();
  const params = useParams() as { locale?: string };
  const locale = params?.locale || "en";
  const t = translations[locale as keyof typeof translations] || translations.en;
  
  const [loading, setLoading] = useState(true);
  const [monthlyTrends, setMonthlyTrends] = useState<any[]>([]);
  const [gpTrends, setGpTrends] = useState<any[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState("12");
  const [selectedGP, setSelectedGP] = useState<string | null>(null);
  const [expandedMonths, setExpandedMonths] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTrendsData();
  }, [selectedTimeframe]);

  const loadTrendsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = auth.currentUser;
      if (!user) {
        router.push(`/${locale}/authority/login`);
        return;
      }

      const authorityDoc = await getDoc(doc(db, "authorities", user.uid));
      if (!authorityDoc.exists()) {
        setError("Authority data not found");
        return;
      }

      const district = authorityDoc.data()?.district;
      if (!district) {
        setError("District not found");
        return;
      }

      const issuesQuery = query(
        collection(db, "issues"),
        where("district", "==", district)
      );
      const issuesSnap = await getDocs(issuesQuery);

      const issues = issuesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Monthly trends based on selected timeframe
      const monthlyData: Record<string, any> = {};
      const gpData: Record<string, any> = {};
      const today = new Date();
      const monthsLimit = parseInt(selectedTimeframe);

      issues.forEach(issue => {
        const date = issue.createdAt?.toDate?.() || new Date(issue.createdAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthName = date.toLocaleString(locale, { month: 'short', year: '2-digit' });

        // Filter by timeframe
        const monthsDiff = (today.getFullYear() - date.getFullYear()) * 12 + 
                          (today.getMonth() - date.getMonth());
        if (monthsDiff > monthsLimit) return;

        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            month: monthName,
            monthKey,
            total: 0,
            resolved: 0,
            escalated: 0,
            pending: 0,
            issues: []
          };
        }

        monthlyData[monthKey].total++;
        monthlyData[monthKey].issues.push(issue);
        
        if (issue.status === "resolved") {
          monthlyData[monthKey].resolved++;
        } else if (["pending", "in_progress"].includes(issue.status)) {
          monthlyData[monthKey].pending++;
        }
        
        if (issue.escalated) monthlyData[monthKey].escalated++;

        // GP trends
        const gp = issue.panchayatName || "Unknown";
        if (!gpData[gp]) {
          gpData[gp] = {
            name: gp,
            months: {},
            total: 0,
            resolved: 0,
            escalated: 0
          };
        }
        gpData[gp].total++;
        if (issue.status === "resolved") gpData[gp].resolved++;
        if (issue.escalated) gpData[gp].escalated++;
        
        if (!gpData[gp].months[monthKey]) {
          gpData[gp].months[monthKey] = 0;
        }
        gpData[gp].months[monthKey]++;
      });

      // Sort monthly data (latest first)
      const sortedMonths = Object.keys(monthlyData).sort().reverse();
      const trends = sortedMonths.map(key => ({
        ...monthlyData[key],
        resolutionRate: monthlyData[key].total > 0 
          ? Math.round((monthlyData[key].resolved / monthlyData[key].total) * 100) 
          : 0,
        escalationRate: monthlyData[key].total > 0 
          ? Math.round((monthlyData[key].escalated / monthlyData[key].total) * 100) 
          : 0
      }));

      // Sort GP data by total issues
      const topGPs = Object.values(gpData)
        .sort((a: any, b: any) => b.total - a.total)
        .slice(0, 10)
        .map((gp: any) => ({
          ...gp,
          resolutionRate: gp.total > 0 ? Math.round((gp.resolved / gp.total) * 100) : 0,
          escalationRate: gp.total > 0 ? Math.round((gp.escalated / gp.total) * 100) : 0
        }));

      setMonthlyTrends(trends);
      setGpTrends(topGPs);
    } catch (error) {
      console.error("Error loading trends:", error);
      setError("Failed to load trends data");
    } finally {
      setLoading(false);
    }
  };

  const toggleMonthExpand = (monthKey: string) => {
    setExpandedMonths(prev =>
      prev.includes(monthKey)
        ? prev.filter(m => m !== monthKey)
        : [...prev, monthKey]
    );
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

  const cardVariants = {
    hover: { 
      scale: 1.02,
      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      transition: { duration: 0.2 }
    },
    tap: { scale: 0.98 }
  };

  if (loading) {
    return (
      <Screen padded>
        <div className="min-h-screen flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="relative">
              <div className="w-16 h-16 border-4 border-green-200 rounded-full"></div>
              <div className="w-16 h-16 border-4 border-green-700 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
            </div>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-green-700 font-medium mt-4"
            >
              {t.loading}
            </motion.p>
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
        className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-4">
          <motion.button
            whileHover={{ x: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.back()}
            className="text-green-700 hover:text-green-900 flex items-center gap-2 text-sm sm:text-base w-fit"
          >
            <span className="text-lg">←</span> {t.back}
          </motion.button>

          <motion.h1 
            {...fadeInUp}
            className="text-xl sm:text-2xl md:text-3xl font-bold text-green-900 order-first sm:order-none"
          >
            {t.title}
          </motion.h1>

          {/* Timeframe Filter */}
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="p-2 text-sm border border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 bg-white"
          >
            <option value="3">Last 3 Months</option>
            <option value="6">Last 6 Months</option>
            <option value="12">Last 12 Months</option>
            <option value="24">Last 24 Months</option>
          </select>
        </div>

        {error ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center"
          >
            <p className="text-red-600">{error}</p>
            <button
              onClick={loadTrendsData}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700"
            >
              Retry
            </button>
          </motion.div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="space-y-6 sm:space-y-8"
          >
            {/* Monthly Trends */}
            <motion.div 
              variants={fadeInUp}
              className="bg-white border border-green-100 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-green-900">
                  {t.monthlyTrends}
                </h2>
                <span className="text-xs sm:text-sm text-green-600">
                  {t.last12Months}
                </span>
              </div>

              <AnimatePresence>
                {monthlyTrends.length > 0 ? (
                  <div className="space-y-4 sm:space-y-6">
                    {monthlyTrends.map((trend, index) => (
                      <motion.div
                        key={trend.monthKey}
                        variants={fadeInUp}
                        initial="initial"
                        animate="animate"
                        transition={{ delay: index * 0.05 }}
                        className="space-y-2 sm:space-y-3"
                      >
                        {/* Month Header */}
                        <motion.div 
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                          whileHover={{ x: 5 }}
                        >
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleMonthExpand(trend.monthKey)}
                              className="p-1 hover:bg-green-50 rounded-lg transition-colors"
                            >
                              <svg 
                                className={`w-4 h-4 sm:w-5 sm:h-5 text-green-600 transform transition-transform ${
                                  expandedMonths.includes(trend.monthKey) ? 'rotate-90' : ''
                                }`}
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                            <span className="font-bold text-green-900 text-sm sm:text-base">
                              {trend.month}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm">
                            <span className="text-gray-600">{t.total}: {trend.total}</span>
                            <span className="text-green-600">{t.resolved}: {trend.resolved}</span>
                            <span className="text-red-600">{t.escalated}: {trend.escalated}</span>
                          </div>
                        </motion.div>

                        {/* Progress Bars */}
                        <div className="space-y-1">
                          <div className="h-2 sm:h-3 bg-green-100 rounded-full overflow-hidden flex">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${trend.resolutionRate}%` }}
                              transition={{ duration: 1, delay: index * 0.1 }}
                              className="h-full bg-green-500"
                            />
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${trend.escalationRate}%` }}
                              transition={{ duration: 1, delay: index * 0.1 + 0.3 }}
                              className="h-full bg-red-500"
                            />
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-green-600">
                              {t.resolutionRate}: {trend.resolutionRate}%
                            </span>
                            <span className="text-red-600">
                              {t.escalationRate}: {trend.escalationRate}%
                            </span>
                          </div>
                        </div>

                        {/* Expanded Details */}
                        <AnimatePresence>
                          {expandedMonths.includes(trend.monthKey) && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-2 sm:mt-3 p-3 sm:p-4 bg-green-50 rounded-xl">
                                <h4 className="font-semibold text-green-900 mb-2 text-sm sm:text-base">
                                  Top Issues
                                </h4>
                                <div className="space-y-2">
                                  {trend.issues.slice(0, 3).map((issue: any) => (
                                    <div key={issue.id} className="text-xs sm:text-sm">
                                      <div className="flex justify-between">
                                        <span className="truncate max-w-[150px] sm:max-w-xs">
                                          {issue.title}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                                          issue.status === 'resolved' 
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                          {issue.status}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <motion.p 
                    variants={fadeInUp}
                    className="text-center text-gray-500 py-8"
                  >
                    {t.noData}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            {/* GP Trends */}
            <motion.div 
              variants={fadeInUp}
              className="bg-white border border-green-100 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg"
            >
              <h2 className="text-lg sm:text-xl font-bold text-green-900 mb-4 sm:mb-6">
                {t.gpTrends}
              </h2>

              <AnimatePresence>
                {gpTrends.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {gpTrends.map((gp: any, index) => (
                      <motion.div
                        key={gp.name}
                        variants={cardVariants}
                        whileHover="hover"
                        whileTap="tap"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => setSelectedGP(selectedGP === gp.name ? null : gp.name)}
                        className={`cursor-pointer p-3 sm:p-4 rounded-xl border transition-colors ${
                          selectedGP === gp.name
                            ? 'border-green-500 bg-green-50'
                            : 'border-green-100 hover:border-green-300'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-green-900 text-sm sm:text-base">
                            {gp.name}
                          </h3>
                          <span className="text-xs sm:text-sm font-semibold text-green-700">
                            {gp.total} {t.issues}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-green-600">{t.resolved}: {gp.resolved}</span>
                            <span className="text-red-600">{t.escalated}: {gp.escalated}</span>
                          </div>

                          <div className="h-1.5 sm:h-2 bg-green-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${gp.resolutionRate}%` }}
                              transition={{ duration: 1, delay: index * 0.1 }}
                              className="h-full bg-green-500"
                            />
                          </div>

                          <div className="flex justify-between text-xs text-gray-500">
                            <span>{t.resolutionRate}: {gp.resolutionRate}%</span>
                            <span>{t.escalationRate}: {gp.escalationRate}%</span>
                          </div>

                          {/* Expanded GP Details */}
                          <AnimatePresence>
                            {selectedGP === gp.name && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                                className="mt-3 pt-3 border-t border-green-200"
                              >
                                <h4 className="font-semibold text-green-900 mb-2 text-xs sm:text-sm">
                                  Monthly Breakdown
                                </h4>
                                <div className="space-y-1 max-h-32 overflow-y-auto">
                                  {Object.entries(gp.months)
                                    .sort()
                                    .reverse()
                                    .slice(0, 6)
                                    .map(([month, count]: [string, any]) => (
                                      <div key={month} className="flex justify-between text-xs">
                                        <span>{month}</span>
                                        <span className="font-medium">{count} issues</span>
                                      </div>
                                    ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <motion.p 
                    variants={fadeInUp}
                    className="text-center text-gray-500 py-8"
                  >
                    {t.noData}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </Screen>
  );
}
