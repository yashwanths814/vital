// app/[locale]/authority/ddo/category-analysis/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth, db } from "../../../../lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import Screen from "../../../../components/Screen";
import { motion, AnimatePresence } from "framer-motion";

// Translation dictionary
const translations = {
  en: {
    back: "← Back",
    title: "Category Analysis",
    loading: "Loading...",
    totalIssues: "Total Issues:",
    resolved: "Resolved:",
    pending: "Pending:",
    escalated: "Escalated:",
    gpAffected: "GPs Affected:",
    resolutionRate: "Resolution Rate:",
    avgTime: "Avg Time:",
    days: "days",
    noCategories: "No categories found",
    statsOverview: "Statistics Overview",
    totalCategories: "Total Categories",
    totalIssuesCount: "Total Issues",
    overallResolved: "Overall Resolved",
    overallPending: "Overall Pending"
  },
  kn: {
    back: "← ಹಿಂದೆ",
    title: "ವರ್ಗೀಯ ವಿಶ್ಲೇಷಣೆ",
    loading: "ಲೋಡ್ ಆಗುತ್ತಿದೆ...",
    totalIssues: "ಒಟ್ಟು ಸಮಸ್ಯೆಗಳು:",
    resolved: "ಪರಿಹರಿಸಲಾಗಿದೆ:",
    pending: "ಬಾಕಿ ಇವೆ:",
    escalated: "ಉಲ್ಬಣಗೊಂಡಿದೆ:",
    gpAffected: "ಗ್ರಾಪಂಗಳು:",
    resolutionRate: "ಪರಿಹಾರ ದರ:",
    avgTime: "ಸರಾಸರಿ ಸಮಯ:",
    days: "ದಿನಗಳು",
    noCategories: "ಯಾವುದೇ ವರ್ಗಗಳು ಕಂಡುಬಂದಿಲ್ಲ",
    statsOverview: "ಅಂಕಿಅಂಶಗಳ ಅವಲೋಕನ",
    totalCategories: "ಒಟ್ಟು ವರ್ಗಗಳು",
    totalIssuesCount: "ಒಟ್ಟು ಸಮಸ್ಯೆಗಳು",
    overallResolved: "ಒಟ್ಟು ಪರಿಹರಿಸಲಾಗಿದೆ",
    overallPending: "ಒಟ್ಟು ಬಾಕಿ"
  },
  hi: {
    back: "← वापस",
    title: "श्रेणी विश्लेषण",
    loading: "लोड हो रहा है...",
    totalIssues: "कुल समस्याएं:",
    resolved: "हल की गईं:",
    pending: "लंबित:",
    escalated: "बढ़ी हुई:",
    gpAffected: "प्रभावित ग्राम पंचायतें:",
    resolutionRate: "समाधान दर:",
    avgTime: "औसत समय:",
    days: "दिन",
    noCategories: "कोई श्रेणी नहीं मिली",
    statsOverview: "सांख्यिकी अवलोकन",
    totalCategories: "कुल श्रेणियां",
    totalIssuesCount: "कुल समस्याएं",
    overallResolved: "कुल हल की गईं",
    overallPending: "कुल लंबित"
  }
};

export default function CategoryAnalysisPage() {
  const router = useRouter();
  const params = useParams() as { locale?: string };
  const locale = params?.locale || "en";
  const t = translations[locale as keyof typeof translations] || translations.en;
  
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalCategories: 0,
    totalIssues: 0,
    totalResolved: 0,
    totalPending: 0
  });

  useEffect(() => {
    loadCategoryData();
  }, []);

  const loadCategoryData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        router.push(`/${locale}/authority/login`);
        return;
      }

      const authorityDoc = await getDoc(doc(db, "authorities", user.uid));
      const district = authorityDoc.data()?.district;

      if (!district) return;

      const issuesQuery = query(
        collection(db, "issues"),
        where("district", "==", district)
      );
      const issuesSnap = await getDocs(issuesQuery);

      const categoryStats: Record<string, any> = {};

      issuesSnap.forEach(doc => {
        const data = doc.data();
        const category = data.category || "Other";

        if (!categoryStats[category]) {
          categoryStats[category] = {
            name: category,
            total: 0,
            resolved: 0,
            pending: 0,
            escalated: 0,
            gps: new Set(),
            totalTime: 0
          };
        }

        categoryStats[category].total++;
        categoryStats[category].gps.add(data.panchayatName);

        if (data.status === "resolved") {
          categoryStats[category].resolved++;
          const created = data.createdAt?.toDate?.() || new Date(data.createdAt);
          const resolved = data.resolvedAt?.toDate?.() || new Date(data.resolvedAt);
          const days = Math.ceil((resolved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
          categoryStats[category].totalTime += days;
        } else if (["pending", "in_progress"].includes(data.status)) {
          categoryStats[category].pending++;
        }

        if (data.escalated) {
          categoryStats[category].escalated++;
        }
      });

      const categoryArray = Object.values(categoryStats).map((cat: any) => ({
        ...cat,
        gps: cat.gps.size,
        resolutionRate: cat.total > 0 ? Math.round((cat.resolved / cat.total) * 100) : 0,
        avgResolutionTime: cat.resolved > 0 ? Math.round(cat.totalTime / cat.resolved) : 0
      }));

      // Calculate overall stats
      const totalIssues = categoryArray.reduce((sum, cat) => sum + cat.total, 0);
      const totalResolved = categoryArray.reduce((sum, cat) => sum + cat.resolved, 0);
      const totalPending = categoryArray.reduce((sum, cat) => sum + cat.pending, 0);

      setStats({
        totalCategories: categoryArray.length,
        totalIssues,
        totalResolved,
        totalPending
      });

      setCategories(categoryArray.sort((a, b) => b.total - a.total));
    } catch (error) {
      console.error("Error loading category data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Animation variants - Perfectly typed for Framer Motion
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 12,
        duration: 0.5
      }
    }
  };

  const statCardVariants = {
    hidden: { scale: 0.9, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 200,
        damping: 15,
        duration: 0.4
      }
    }
  };

  // ✅ Fixed: Use proper easing types
  const spinnerTransition = {
    duration: 1.5,
    repeat: Infinity,
    ease: "linear" as const
  };

  const textTransition = {
    duration: 1,
    repeat: Infinity,
    ease: "easeInOut" as const
  };

  return (
    <Screen padded>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Back Button */}
        <motion.button
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          onClick={() => router.back()}
          className="mb-4 sm:mb-6 text-green-700 hover:text-green-900 flex items-center gap-2 text-sm sm:text-base"
        >
          <span className="text-lg">←</span> {t.back}
        </motion.button>

        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-6 sm:mb-8"
        >
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-green-900">
            {t.title}
          </h1>
        </motion.div>

        {loading ? (
          // Loading Animation - Fixed with proper easing types
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-12"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={spinnerTransition}
              className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full mb-4"
            />
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={textTransition}
            >
              <p className="text-green-700 text-sm sm:text-base">{t.loading}</p>
            </motion.div>
          </motion.div>
        ) : (
          <>
            {/* Stats Overview Cards - Mobile Responsive */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8"
            >
              <motion.div
                variants={statCardVariants}
                className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm border border-green-100"
              >
                <p className="text-xs sm:text-sm text-green-600 mb-1">{t.totalCategories}</p>
                <p className="text-lg sm:text-2xl font-bold text-green-900">{stats.totalCategories}</p>
              </motion.div>

              <motion.div
                variants={statCardVariants}
                className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm border border-green-100"
              >
                <p className="text-xs sm:text-sm text-green-600 mb-1">{t.totalIssuesCount}</p>
                <p className="text-lg sm:text-2xl font-bold text-green-900">{stats.totalIssues}</p>
              </motion.div>

              <motion.div
                variants={statCardVariants}
                className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm border border-green-100"
              >
                <p className="text-xs sm:text-sm text-green-600 mb-1">{t.overallResolved}</p>
                <p className="text-lg sm:text-2xl font-bold text-green-600">{stats.totalResolved}</p>
              </motion.div>

              <motion.div
                variants={statCardVariants}
                className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm border border-green-100"
              >
                <p className="text-xs sm:text-sm text-green-600 mb-1">{t.overallPending}</p>
                <p className="text-lg sm:text-2xl font-bold text-yellow-600">{stats.totalPending}</p>
              </motion.div>
            </motion.div>

            {/* Categories Grid - Mobile Responsive */}
            {categories.length > 0 ? (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
              >
                <AnimatePresence>
                  {categories.map((category, index) => (
                    <motion.div
                      key={category.name}
                      variants={itemVariants}
                      whileHover={{ y: -4 }}
                      transition={{ duration: 0.2 }}
                      className="bg-white border border-green-100 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <h3 className="text-base sm:text-lg font-bold text-green-900 mb-3 sm:mb-4 line-clamp-1">
                        {category.name}
                      </h3>
                      
                      <div className="space-y-2 sm:space-y-3">
                        {/* Total Issues */}
                        <div className="flex justify-between items-center text-xs sm:text-sm">
                          <span className="text-green-700">{t.totalIssues}</span>
                          <motion.span 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: index * 0.1 + 0.3, type: "spring", stiffness: 200, damping: 15 }}
                            className="font-bold text-green-900"
                          >
                            {category.total}
                          </motion.span>
                        </div>

                        {/* Resolved */}
                        <div className="flex justify-between items-center text-xs sm:text-sm">
                          <span className="text-green-700">{t.resolved}</span>
                          <motion.span 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: index * 0.1 + 0.4, type: "spring", stiffness: 200, damping: 15 }}
                            className="font-bold text-green-600"
                          >
                            {category.resolved}
                          </motion.span>
                        </div>

                        {/* Pending */}
                        <div className="flex justify-between items-center text-xs sm:text-sm">
                          <span className="text-green-700">{t.pending}</span>
                          <motion.span 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: index * 0.1 + 0.5, type: "spring", stiffness: 200, damping: 15 }}
                            className="font-bold text-yellow-600"
                          >
                            {category.pending}
                          </motion.span>
                        </div>

                        {/* Escalated */}
                        <div className="flex justify-between items-center text-xs sm:text-sm">
                          <span className="text-green-700">{t.escalated}</span>
                          <motion.span 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: index * 0.1 + 0.6, type: "spring", stiffness: 200, damping: 15 }}
                            className="font-bold text-red-600"
                          >
                            {category.escalated}
                          </motion.span>
                        </div>

                        {/* GPs Affected */}
                        <div className="flex justify-between items-center text-xs sm:text-sm">
                          <span className="text-green-700">{t.gpAffected}</span>
                          <motion.span 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: index * 0.1 + 0.7, type: "spring", stiffness: 200, damping: 15 }}
                            className="font-bold"
                          >
                            {category.gps}
                          </motion.span>
                        </div>

                        {/* Resolution Rate */}
                        <div className="flex justify-between items-center text-xs sm:text-sm">
                          <span className="text-green-700">{t.resolutionRate}</span>
                          <motion.span 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: index * 0.1 + 0.8, type: "spring", stiffness: 200, damping: 15 }}
                            className={`font-bold ${
                              category.resolutionRate >= 80 ? 'text-green-600' :
                              category.resolutionRate >= 60 ? 'text-yellow-600' : 'text-red-600'
                            }`}
                          >
                            {category.resolutionRate}%
                          </motion.span>
                        </div>

                        {/* Average Time */}
                        <div className="flex justify-between items-center text-xs sm:text-sm">
                          <span className="text-green-700">{t.avgTime}</span>
                          <motion.span 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: index * 0.1 + 0.9, type: "spring", stiffness: 200, damping: 15 }}
                            className="font-bold"
                          >
                            {category.avgResolutionTime} {t.days}
                          </motion.span>
                        </div>

                        {/* Progress Bar */}
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: "100%" }}
                          transition={{ delay: index * 0.1 + 1, duration: 0.5 }}
                          className="mt-3 sm:mt-4"
                        >
                          <div className="h-1.5 sm:h-2 bg-green-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${category.resolutionRate}%` }}
                              transition={{ delay: index * 0.1 + 1.2, duration: 0.8, ease: "easeOut" }}
                              className="h-full bg-green-500 rounded-full"
                            />
                          </div>
                        </motion.div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              // No Categories Found
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center py-12 bg-white rounded-2xl border border-green-100"
              >
                <p className="text-green-700 text-sm sm:text-base">{t.noCategories}</p>
              </motion.div>
            )}
          </>
        )}
      </div>
    </Screen>
  );
}
