"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth, db } from "../../../../lib/firebase";
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from "firebase/firestore";
import Screen from "../../../../components/Screen";
import * as XLSX from "xlsx";

type Locale = "en" | "kn" | "hi";

interface DashboardStats {
  totalIssues: number;
  resolvedIssues: number;
  pendingIssues: number;
  escalatedIssues: number;
  averageResolutionTime: number;
  fundRequestsPending: number;
  totalFundsApproved: number;
  last30DaysResolved: number;
  last30DaysEscalated: number;
}

interface IssueTypeDistribution {
  name: string;
  value: number;
  color: string;
  percentage: number;
}

interface PerformanceMetrics {
  gpPerformance: Array<{
    name: string;
    resolved: number;
    pending: number;
    total: number;
    resolutionRate: number;
    averageTime: number;
  }>;
  resolutionTrend: Array<{
    month: string;
    resolved: number;
    escalated: number;
    pending: number;
  }>;
  categoryPerformance: Array<{
    category: string;
    resolved: number;
    pending: number;
    total: number;
    resolutionRate: number;
  }>;
}

interface DDOProfile {
  name: string;
  email: string;
  phone?: string;
  district: string;
  districtId: string;
  role: string;
  designation?: string;
  profilePhoto?: string;
  joinedDate?: string;
  lastActive?: string;
  verificationStatus: string;
  officeAddress?: string;
  jurisdiction?: string;
  employeeId?: string;
  department?: string;
}

// Simple Card Components with mobile optimization - FIXED to accept style prop
const Card = ({ children, className = "", style = {} }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) => (
  <div className={`bg-white border border-green-100 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm ${className}`} style={style}>
    {children}
  </div>
);

const CardHeader = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`mb-3 sm:mb-4 ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <h3 className={`text-base sm:text-lg font-bold text-green-900 ${className}`}>
    {children}
  </h3>
);

const CardContent = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={className}>
    {children}
  </div>
);

export default function DDODashboardPage() {
  const router = useRouter();
  const params = useParams() as { locale?: string };
  const locale = (params?.locale || "en") as Locale;
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [issueDistribution, setIssueDistribution] = useState<IssueTypeDistribution[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [recentEscalations, setRecentEscalations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [indexError, setIndexError] = useState(false);
  const [district, setDistrict] = useState<string | null>(null);
  const [districtId, setDistrictId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<DDOProfile | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showReportMenu, setShowReportMenu] = useState(false);
  const [allIssues, setAllIssues] = useState<any[]>([]);
  const [animateCards, setAnimateCards] = useState(false);

  // Animation effect
  useEffect(() => {
    if (!loading) {
      setTimeout(() => setAnimateCards(true), 100);
    }
  }, [loading]);

  /* 🌐 Multilingual text with full translations */
  const t = useMemo(() => {
    const L: Record<Locale, any> = {
      en: {
        title: "DDO Dashboard",
        subtitle: "District-level monitoring & escalations",
        profile: {
          title: "Profile",
          name: "Name",
          email: "Email",
          phone: "Phone",
          district: "District",
          designation: "Designation",
          role: "Role",
          joinedDate: "Joined Date",
          lastActive: "Last Active",
          verificationStatus: "Verification Status",
          verified: "Verified",
          pending: "Pending",
          editProfile: "Edit Profile",
          close: "Close",
          update: "Update",
          changePhoto: "Change Photo",
          updateSuccess: "Profile updated successfully",
          officeAddress: "Office Address",
          jurisdiction: "Jurisdiction",
          employeeId: "Employee ID",
          department: "Department",
        },
        reports: {
          download: "Download Report",
          generate: "Generate Report",
          summary: "Summary Report",
          detailed: "Detailed Report",
          excel: "Excel Report",
          csv: "CSV Report",
          pdf: "PDF Report",
          json: "JSON Report",
          performance: "Performance Report",
          escalations: "Escalations Report",
          fund: "Fund Requests Report",
          monthly: "Monthly Report",
          quarterly: "Quarterly Report",
          yearly: "Yearly Report",
          selectFormat: "Select Report Format",
        },
        cards: {
          escalations: "Escalated Issues",
          unresolved: "Unresolved Cases",
          analytics: "District Analytics",
          reports: "Reports",
          fundRequests: "Fund Requests",
          gpPerformance: "GP Performance",
          category: "Category Analysis",
          trends: "Resolution Trends",
        },
        stats: {
          totalIssues: "Total Issues",
          resolved: "Resolved",
          pending: "Pending",
          escalationRate: "Escalation Rate",
          avgResolution: "Avg Resolution Time",
          fundsApproved: "Funds Approved",
          last30Resolved: "Resolved (30 days)",
          last30Escalated: "Escalated (30 days)",
        },
        charts: {
          issueDistribution: "Issue Type Distribution",
          resolutionTrend: "Resolution Trend",
          gpRanking: "Gram Panchayat Ranking",
          categoryBreakdown: "Category Breakdown",
        },
        actions: {
          open: "Open",
          logout: "Logout",
          viewAll: "View All",
          approveFunds: "Approve Funds",
          downloadReport: "Download Report",
          generateReport: "Generate Report",
          viewProfile: "View Profile",
          exportData: "Export Data",
          customizeReport: "Customize Report",
        },
        tables: {
          recentEscalations: "Recent Escalations",
          issueId: "Issue ID",
          category: "Category",
          gp: "Gram Panchayat",
          taluk: "Taluk",
          daysPending: "Days Pending",
          status: "Status",
          action: "Action",
        },
        loading: "Loading district data…",
        noData: "No data available",
        indexWarning: "Index Required: Create Firestore index for better performance",
        createIndex: "Create Index",
        error: {
          auth: "Authentication error",
          data: "Failed to load data",
          district: "District information not found",
          profile: "Failed to update profile",
        },
        filters: {
          all: "All",
          resolved: "Resolved",
          pending: "Pending",
          escalated: "Escalated",
          last30Days: "Last 30 Days",
          last90Days: "Last 90 Days",
          thisYear: "This Year",
        },
        mobile: {
          view: "View",
          pending: "pending",
          days: "days",
          export: "Export",
        },
      },
      kn: {
        title: "DDO ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
        subtitle: "ಜಿಲ್ಲಾ ಮಟ್ಟದ ಮೇಲ್ವಿಚಾರಣೆ ಮತ್ತು ಎಸ್ಕಲೇಶನ್",
        profile: {
          title: "ಪ್ರೊಫೈಲ್",
          name: "ಹೆಸರು",
          email: "ಇಮೇಲ್",
          phone: "ಫೋನ್",
          district: "ಜಿಲ್ಲೆ",
          designation: "ಹುದ್ದೆ",
          role: "ಪಾತ್ರ",
          joinedDate: "ಸೇರ್ಪಡೆ ದಿನಾಂಕ",
          lastActive: "ಕೊನೆಯ ಸಕ್ರಿಯ",
          verificationStatus: "ದೃಢೀಕರಣ ಸ್ಥಿತಿ",
          verified: "ದೃಢೀಕರಿಸಲಾಗಿದೆ",
          pending: "ಬಾಕಿ ಇವೆ",
          editProfile: "ಪ್ರೊಫೈಲ್ ಸಂಪಾದಿಸಿ",
          close: "ಮುಚ್ಚಿ",
          update: "ನವೀಕರಿಸಿ",
          changePhoto: "ಫೋಟೋ ಬದಲಾಯಿಸಿ",
          updateSuccess: "ಪ್ರೊಫೈಲ್ ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ",
          officeAddress: "ಕಛೇರಿ ವಿಳಾಸ",
          jurisdiction: "ನ್ಯಾಯ ಕ್ಷೇತ್ರ",
          employeeId: "ನೌಕರರ ಐಡಿ",
          department: "ವಿಭಾಗ",
        },
        reports: {
          download: "ವರದಿ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ",
          generate: "ವರದಿ ರಚಿಸಿ",
          summary: "ಸಾರಾಂಶ ವರದಿ",
          detailed: "ವಿವರವಾದ ವರದಿ",
          excel: "ಎಕ್ಸೆಲ್ ವರದಿ",
          csv: "CSV ವರದಿ",
          pdf: "PDF ವರದಿ",
          json: "JSON ವರದಿ",
          performance: "ಪ್ರದರ್ಶನ ವರದಿ",
          escalations: "ಎಸ್ಕಲೇಶನ್ ವರದಿ",
          fund: "ನಿಧಿ ವಿನಂತಿ ವರದಿ",
          monthly: "ತಿಂಗಳ ವರದಿ",
          quarterly: "ತ್ರೈಮಾಸಿಕ ವರದಿ",
          yearly: "ವಾರ್ಷಿಕ ವರದಿ",
          selectFormat: "ವರದಿ ಫಾರ್ಮ್ಯಾಟ್ ಆಯ್ಕೆಮಾಡಿ",
        },
        cards: {
          escalations: "ಎಸ್ಕಲೇಟೆಡ್ ಸಮಸ್ಯೆಗಳು",
          unresolved: "ಪರಿಹಾರವಾಗದ ಪ್ರಕರಣಗಳು",
          analytics: "ಜಿಲ್ಲಾ ವಿಶ್ಲೇಷಣೆ",
          reports: "ವರದಿಗಳು",
          fundRequests: "ನಿಧಿ ವಿನಂತಿಗಳು",
          gpPerformance: "ಗ್ರಾಮ ಪಂಚಾಯತ್ ಪರಿಣಾಮಕಾರಿತ್ವ",
          category: "ವರ್ಗ ವಿಶ್ಲೇಷಣೆ",
          trends: "ಪರಿಹಾರ ಟ್ರೆಂಡ್‌ಗಳು",
        },
        stats: {
          totalIssues: "ಒಟ್ಟು ಸಮಸ್ಯೆಗಳು",
          resolved: "ಪರಿಹಾರವಾದವು",
          pending: "ಬಾಕಿ ಇವೆ",
          escalationRate: "ಎಸ್ಕಲೇಶನ್ ದರ",
          avgResolution: "ಸರಾಸರಿ ಪರಿಹಾರ ಸಮಯ",
          fundsApproved: "ಅನುಮೋದಿತ ನಿಧಿಗಳು",
          last30Resolved: "ಪರಿಹಾರವಾದವು (30 ದಿನಗಳು)",
          last30Escalated: "ಎಸ್ಕಲೇಟೆಡ್ (30 ದಿನಗಳು)",
        },
        charts: {
          issueDistribution: "ಸಮಸ್ಯೆ ವಿಧ ವಿತರಣೆ",
          resolutionTrend: "ಪರಿಹಾರ ಟ್ರೆಂಡ್",
          gpRanking: "ಗ್ರಾಮ ಪಂಚಾಯತ್ ರ್ಯಾಂಕಿಂಗ್",
          categoryBreakdown: "ವರ್ಗ ವಿಭಜನೆ",
        },
        actions: {
          open: "ತೆರೆ",
          logout: "ಲಾಗೌಟ್",
          viewAll: "ಎಲ್ಲಾ ವೀಕ್ಷಿಸಿ",
          approveFunds: "ನಿಧಿಗಳನ್ನು ಅನುಮೋದಿಸಿ",
          downloadReport: "ವರದಿ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ",
          generateReport: "ವರದಿ ರಚಿಸಿ",
          viewProfile: "ಪ್ರೊಫೈಲ್ ವೀಕ್ಷಿಸಿ",
          exportData: "ಡೇಟಾ ರಫ್ತು ಮಾಡಿ",
          customizeReport: "ವರದಿ ಕಸ್ಟಮೈಜ್ ಮಾಡಿ",
        },
        tables: {
          recentEscalations: "ಇತ್ತೀಚಿನ ಎಸ್ಕಲೇಶನ್‌ಗಳು",
          issueId: "ಸಮಸ್ಯೆ ಐಡಿ",
          category: "ವರ್ಗ",
          gp: "ಗ್ರಾಮ ಪಂಚಾಯತ್",
          taluk: "ತಾಲ್ಲೂಕು",
          daysPending: "ಬಾಕಿ ಇರುವ ದಿನಗಳು",
          status: "ಸ್ಥಿತಿ",
          action: "ಕ್ರಿಯೆ",
        },
        loading: "ಜಿಲ್ಲಾ ಡೇಟಾ ಲೋಡ್ ಆಗುತ್ತಿದೆ…",
        noData: "ಯಾವುದೇ ಡೇಟಾ ಲಭ್ಯವಿಲ್ಲ",
        indexWarning: "ಇಂಡೆಕ್ಸ್ ಅಗತ್ಯ: ಉತ್ತಮ ಪರಿಣಾಮಕಾರಿತ್ವಕ್ಕಾಗಿ ಫೈರ್‌ಸ್ಟೋರ್ ಇಂಡೆಕ್ಸ್ ರಚಿಸಿ",
        createIndex: "ಇಂಡೆಕ್ಸ್ ರಚಿಸಿ",
        error: {
          auth: "ದೃಢೀಕರಣ ದೋಷ",
          data: "ಡೇಟಾ ಲೋಡ್ ಮಾಡಲು ವಿಫಲವಾಗಿದೆ",
          district: "ಜಿಲ್ಲಾ ಮಾಹಿತಿ ಕಂಡುಬಂದಿಲ್ಲ",
          profile: "ಪ್ರೊಫೈಲ್ ನವೀಕರಿಸಲು ವಿಫಲವಾಗಿದೆ",
        },
        filters: {
          all: "ಎಲ್ಲಾ",
          resolved: "ಪರಿಹಾರವಾದವು",
          pending: "ಬಾಕಿ ಇವೆ",
          escalated: "ಎಸ್ಕಲೇಟೆಡ್",
          last30Days: "ಕಳೆದ 30 ದಿನಗಳು",
          last90Days: "ಕಳೆದ 90 ದಿನಗಳು",
          thisYear: "ಈ ವರ್ಷ",
        },
        mobile: {
          view: "ವೀಕ್ಷಿಸಿ",
          pending: "ಬಾಕಿ",
          days: "ದಿನಗಳು",
          export: "ರಫ್ತು",
        },
      },
      hi: {
        title: "DDO डैशबोर्ड",
        subtitle: "जिला स्तर पर निगरानी और एस्केलेशन",
        profile: {
          title: "प्रोफ़ाइल",
          name: "नाम",
          email: "ईमेल",
          phone: "फ़ोन",
          district: "जिला",
          designation: "पदनाम",
          role: "भूमिका",
          joinedDate: "शामिल होने की तिथि",
          lastActive: "अंतिम सक्रिय",
          verificationStatus: "सत्यापन स्थिति",
          verified: "सत्यापित",
          pending: "लंबित",
          editProfile: "प्रोफ़ाइल संपादित करें",
          close: "बंद करें",
          update: "अपडेट करें",
          changePhoto: "फोटो बदलें",
          updateSuccess: "प्रोफ़ाइल सफलतापूर्वक अपडेट की गई",
          officeAddress: "कार्यालय का पता",
          jurisdiction: "अधिकार क्षेत्र",
          employeeId: "कर्मचारी आईडी",
          department: "विभाग",
        },
        reports: {
          download: "रिपोर्ट डाउनलोड करें",
          generate: "रिपोर्ट बनाएँ",
          summary: "सारांश रिपोर्ट",
          detailed: "विस्तृत रिपोर्ट",
          excel: "एक्सेल रिपोर्ट",
          csv: "CSV रिपोर्ट",
          pdf: "PDF रिपोर्ट",
          json: "JSON रिपोर्ट",
          performance: "प्रदर्शन रिपोर्ट",
          escalations: "एस्केलेशन रिपोर्ट",
          fund: "फंड अनुरोध रिपोर्ट",
          monthly: "मासिक रिपोर्ट",
          quarterly: "त्रैमासिक रिपोर्ट",
          yearly: "वार्षिक रिपोर्ट",
          selectFormat: "रिपोर्ट प्रारूप चुनें",
        },
        cards: {
          escalations: "एस्केलेटेड समस्याएँ",
          unresolved: "अनसुलझे मामले",
          analytics: "जिला एनालिटिक्स",
          reports: "रिपोर्ट्स",
          fundRequests: "फंड अनुरोध",
          gpPerformance: "ग्राम पंचायत प्रदर्शन",
          category: "श्रेणी विश्लेषण",
          trends: "समाधान रुझान",
        },
        stats: {
          totalIssues: "कुल समस्याएँ",
          resolved: "हल हुई",
          pending: "लंबित",
          escalationRate: "एस्केलेशन दर",
          avgResolution: "औसत समाधान समय",
          fundsApproved: "अनुमोदित फंड",
          last30Resolved: "हल हुई (30 दिन)",
          last30Escalated: "एस्केलेटेड (30 दिन)",
        },
        charts: {
          issueDistribution: "समस्या प्रकार वितरण",
          resolutionTrend: "समाधान ट्रेंड",
          gpRanking: "ग्राम पंचायत रैंकिंग",
          categoryBreakdown: "श्रेणी विभाजन",
        },
        actions: {
          open: "खोलें",
          logout: "लॉगआउट",
          viewAll: "सभी देखें",
          approveFunds: "फंड स्वीकृत करें",
          downloadReport: "रिपोर्ट डाउनलोड करें",
          generateReport: "रिपोर्ट बनाएँ",
          viewProfile: "प्रोफ़ाइल देखें",
          exportData: "डेटा निर्यात करें",
          customizeReport: "रिपोर्ट कस्टमाइज़ करें",
        },
        tables: {
          recentEscalations: "हाल के एस्केलेशन",
          issueId: "समस्या आईडी",
          category: "श्रेणी",
          gp: "ग्राम पंचायत",
          taluk: "तालुका",
          daysPending: "लंबित दिन",
          status: "स्थिति",
          action: "कार्रवाई",
        },
        loading: "जिला डेटा लोड हो रहा है…",
        noData: "कोई डेटा उपलब्ध नहीं",
        indexWarning: "इंडेक्स आवश्यक: बेहतर प्रदर्शन के लिए फायरस्टोर इंडेक्स बनाएं",
        createIndex: "इंडेक्स बनाएं",
        error: {
          auth: "प्रमाणीकरण त्रुटि",
          data: "डेटा लोड करने में विफल",
          district: "जिला जानकारी नहीं मिली",
          profile: "प्रोफ़ाइल अपडेट करने में विफल",
        },
        filters: {
          all: "सभी",
          resolved: "हल हुई",
          pending: "लंबित",
          escalated: "एस्केलेटेड",
          last30Days: "पिछले 30 दिन",
          last90Days: "पिछले 90 दिन",
          thisYear: "इस वर्ष",
        },
        mobile: {
          view: "देखें",
          pending: "लंबित",
          days: "दिन",
          export: "निर्यात",
        },
      },
    };
    return L[locale] || L.en;
  }, [locale]);

  /* 🔐 Load DDO Data */
  useEffect(() => {
    const loadDDOData = async () => {
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

        console.log("DDO UID:", user.uid);

        // Load DDO authority document
        const authorityDocRef = doc(db, "authorities", user.uid);
        const authoritySnap = await getDoc(authorityDocRef);

        if (!authoritySnap.exists()) {
          console.error("Authority document not found");
          router.replace(`/${locale}/authority/status`);
          return;
        }

        const authorityData = authoritySnap.data();
        console.log("DDO Authority Data:", authorityData);

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

        // Extract district information (check both district and districtId)
        const districtName = authorityData.district || authorityData.districtName;
        const districtIdentifier = authorityData.districtId || authorityData.district_id;

        if (!districtName && !districtIdentifier) {
          setError(t.error.district);
          setLoading(false);
          return;
        }

        console.log("District Name:", districtName);
        console.log("District ID:", districtIdentifier);

        // Set profile data
        const profileData: DDOProfile = {
          name: authorityData.name || authorityData.fullName || "DDO Officer",
          email: authorityData.email || user.email || "",
          phone: authorityData.phone || authorityData.phoneNumber || "",
          district: districtName,
          districtId: districtIdentifier,
          role: authorityData.role || "ddo",
          designation: authorityData.designation || "District Development Officer",
          profilePhoto: authorityData.profilePhoto || authorityData.photoURL || "",
          officeAddress: authorityData.officeAddress || "",
          jurisdiction: authorityData.jurisdiction || districtName,
          employeeId: authorityData.employeeId || "",
          department: authorityData.department || "District Administration",
          joinedDate: authorityData.createdAt?.toDate?.()?.toLocaleDateString() || authorityData.joinedDate || "",
          lastActive: new Date().toLocaleDateString(),
          verificationStatus: isVerified ? "verified" : "pending"
        };

        setProfile(profileData);
        setDistrict(districtName);
        setDistrictId(districtIdentifier);

        // Load all dashboard data
        await loadDashboardData(districtName, districtIdentifier);

      } catch (err: any) {
        console.error("Error loading DDO data:", err);
        setError(`${t.error.auth}: ${err.message}`);
        setLoading(false);
      }
    };

    const loadDashboardData = async (districtName: string, districtId: string) => {
      try {
        console.log("Loading dashboard data for:", { districtName, districtId });

        // Load issues using both district name and districtId
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

          console.log(`Found ${issuesByNameSnapshot.size} issues by district name`);
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

          console.log(`Found ${issuesByIdSnapshot.size} issues by district ID`);
        } catch (err) {
          console.log("Query by districtId failed:", err);
        }

        console.log("Total unique issues found:", issues.length);
        setAllIssues(issues);

        // Sort issues by createdAt (newest first)
        issues.sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(0);
          const dateB = b.createdAt?.toDate?.() || new Date(0);
          return dateB.getTime() - dateA.getTime();
        });

        // Calculate basic stats
        const totalIssues = issues.length;
        const resolvedIssues = issues.filter(issue =>
          issue.status === "resolved" || issue.status === "closed"
        ).length;

        const pendingIssues = issues.filter(issue =>
          ["pending", "in_progress", "assigned", "verified", "submitted"].includes(issue.status)
        ).length;

        const escalatedIssues = issues.filter(issue => issue.escalated === true).length;

        // Calculate last 30 days stats
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const last30DaysIssues = issues.filter(issue => {
          const issueDate = issue.createdAt?.toDate?.() || new Date(0);
          return issueDate >= thirtyDaysAgo;
        });

        const last30DaysResolved = last30DaysIssues.filter(issue =>
          issue.status === "resolved" || issue.status === "closed"
        ).length;

        const last30DaysEscalated = last30DaysIssues.filter(issue => issue.escalated === true).length;

        // Calculate issue type distribution
        const distribution: Record<string, number> = {};
        issues.forEach(issue => {
          const category = issue.categoryName || issue.category || issue.type || "Other";
          distribution[category] = (distribution[category] || 0) + 1;
        });

        const issueDistributionData = Object.entries(distribution).map(([name, value], index) => ({
          name,
          value,
          percentage: Math.round((value / totalIssues) * 100),
          color: ["#10B981", "#3B82F6", "#EF4444", "#F59E0B", "#8B5CF6", "#EC4899", "#14B8A6"][index % 7]
        })).sort((a, b) => b.value - a.value);

        // Load recent escalations
        let recentEscalationsData = issues
          .filter(issue => issue.escalated === true)
          .slice(0, 5)
          .map(issue => {
            const createdAt = issue.createdAt?.toDate?.() || new Date();
            const now = new Date();
            const diffTime = Math.abs(now.getTime() - createdAt.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            return {
              id: issue.id,
              displayId: issue.displayId || issue.id.substring(0, 8),
              category: issue.categoryName || issue.category || issue.type || "Unknown",
              gramPanchayat: issue.panchayatName || issue.panchayat || "Unknown GP",
              taluk: issue.talukName || issue.taluk || "Unknown Taluk",
              status: issue.status || "unknown",
              daysPending: diffDays,
              ...issue
            };
          });

        // Load GP performance
        const gpPerformance = await calculateGPPerformance(issues);

        // Calculate average resolution time
        const averageResolutionTime = calculateAverageResolutionTime(issues);

        // Load fund requests
        const { pendingFundRequests, totalApprovedFunds } = await loadFundRequests(districtName, districtId);

        // Set all data
        setStats({
          totalIssues,
          resolvedIssues,
          pendingIssues,
          escalatedIssues,
          averageResolutionTime,
          fundRequestsPending: pendingFundRequests,
          totalFundsApproved: totalApprovedFunds,
          last30DaysResolved,
          last30DaysEscalated,
        });

        setIssueDistribution(issueDistributionData);
        setRecentEscalations(recentEscalationsData);
        setPerformanceMetrics(gpPerformance);

        console.log("Dashboard data loaded successfully");

      } catch (err: any) {
        console.error("Error in loadDashboardData:", err);
        setError(`${t.error.data}: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    const loadFundRequests = async (districtName: string, districtId: string) => {
      let pendingFundRequests = 0;
      let totalApprovedFunds = 0;

      try {
        console.log("Loading fund requests for:", { districtName, districtId });

        // Try both district name and districtId queries
        const fundRequests: any[] = [];

        // Query by district name
        try {
          const requestsByNameQuery = query(
            collection(db, "fund_requests"),
            where("district", "==", districtName)
          );
          const requestsByNameSnapshot = await getDocs(requestsByNameQuery);

          requestsByNameSnapshot.forEach(doc => {
            fundRequests.push({ id: doc.id, ...doc.data() });
          });

          console.log(`Found ${requestsByNameSnapshot.size} fund requests by district name`);
        } catch (err) {
          console.log("Fund request query by district name failed:", err);
        }

        // Query by districtId
        try {
          const requestsByIdQuery = query(
            collection(db, "fund_requests"),
            where("districtId", "==", districtId)
          );
          const requestsByIdSnapshot = await getDocs(requestsByIdQuery);

          requestsByIdSnapshot.forEach(doc => {
            if (!fundRequests.find(r => r.id === doc.id)) {
              fundRequests.push({ id: doc.id, ...doc.data() });
            }
          });

          console.log(`Found ${requestsByIdSnapshot.size} fund requests by district ID`);
        } catch (err) {
          console.log("Fund request query by districtId failed:", err);
        }

        console.log("Total unique fund requests:", fundRequests.length);

        // Calculate pending and approved funds
        fundRequests.forEach(request => {
          if (request.status === "pending") {
            pendingFundRequests++;
          }
          if (request.status === "approved" && request.amount) {
            totalApprovedFunds += Number(request.amount);
          }
        });

      } catch (err) {
        console.error("Error loading fund requests:", err);
      }

      return { pendingFundRequests, totalApprovedFunds };
    };

    const calculateAverageResolutionTime = (issues: any[]): number => {
      const resolvedIssues = issues.filter(issue =>
        issue.status === "resolved" || issue.status === "closed"
      );

      if (resolvedIssues.length === 0) return 0;

      const totalDays = resolvedIssues.reduce((sum, issue) => {
        const createdAt = issue.createdAt?.toDate?.() || new Date();
        const resolvedAt = issue.resolvedAt?.toDate?.() ||
          issue.updatedAt?.toDate?.() ||
          issue.closedAt?.toDate?.() ||
          new Date();
        const diffTime = Math.abs(resolvedAt.getTime() - createdAt.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return sum + diffDays;
      }, 0);

      return Math.round(totalDays / resolvedIssues.length);
    };

    const calculateGPPerformance = async (issues: any[]): Promise<PerformanceMetrics> => {
      // Group issues by GP
      const gpStats: Record<string, { resolved: number, total: number, totalTime: number }> = {};

      issues.forEach(issue => {
        const gpName = issue.panchayatName || issue.panchayat || issue.gramPanchayat || "Unknown GP";
        if (!gpStats[gpName]) {
          gpStats[gpName] = { resolved: 0, total: 0, totalTime: 0 };
        }

        gpStats[gpName].total++;
        if (issue.status === "resolved" || issue.status === "closed") {
          gpStats[gpName].resolved++;

          // Calculate resolution time
          const createdAt = issue.createdAt?.toDate?.() || new Date();
          const resolvedAt = issue.resolvedAt?.toDate?.() || new Date();
          const diffTime = Math.abs(resolvedAt.getTime() - createdAt.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          gpStats[gpName].totalTime += diffDays;
        }
      });

      // Calculate category performance
      const categoryStats: Record<string, { resolved: number, total: number }> = {};
      issues.forEach(issue => {
        const category = issue.categoryName || issue.category || issue.type || "Other";
        if (!categoryStats[category]) {
          categoryStats[category] = { resolved: 0, total: 0 };
        }
        categoryStats[category].total++;
        if (issue.status === "resolved" || issue.status === "closed") {
          categoryStats[category].resolved++;
        }
      });

      // Convert to array and calculate rates
      const gpPerformance = Object.entries(gpStats)
        .map(([name, stats]) => ({
          name,
          resolved: stats.resolved,
          pending: stats.total - stats.resolved,
          total: stats.total,
          resolutionRate: stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0,
          averageTime: stats.resolved > 0 ? Math.round(stats.totalTime / stats.resolved) : 0
        }))
        .sort((a, b) => b.resolutionRate - a.resolutionRate)
        .slice(0, 8);

      const categoryPerformance = Object.entries(categoryStats)
        .map(([category, stats]) => ({
          category,
          resolved: stats.resolved,
          pending: stats.total - stats.resolved,
          total: stats.total,
          resolutionRate: stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0
        }))
        .sort((a, b) => b.total - a.total);

      // Generate resolution trend (last 6 months)
      const currentDate = new Date();
      const resolutionTrend = [];

      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthName = monthDate.toLocaleString('default', { month: 'short' });

        const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
        const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

        const monthIssues = issues.filter(issue => {
          const issueDate = issue.createdAt?.toDate?.() || new Date(0);
          return issueDate >= monthStart && issueDate <= monthEnd;
        });

        const resolved = monthIssues.filter(issue =>
          issue.status === "resolved" || issue.status === "closed"
        ).length;

        const escalated = monthIssues.filter(issue => issue.escalated === true).length;
        const pending = monthIssues.filter(issue =>
          ["pending", "in_progress"].includes(issue.status)
        ).length;

        resolutionTrend.push({
          month: monthName,
          resolved,
          escalated,
          pending
        });
      }

      return {
        gpPerformance,
        resolutionTrend,
        categoryPerformance
      };
    };

    loadDDOData();
  }, [router, locale, t]);

  // Enhanced Report Generation Functions
  const generateSummaryReport = () => {
    if (!stats || !profile) return;

    const reportData = {
      reportType: "Summary Report",
      generatedAt: new Date().toISOString(),
      generatedBy: profile.name,
      district: profile.district,
      districtId: profile.districtId,

      // Executive Summary
      executiveSummary: {
        totalIssues: stats.totalIssues,
        resolutionRate: stats.totalIssues > 0 ? Math.round((stats.resolvedIssues / stats.totalIssues) * 100) : 0,
        escalationRate: stats.totalIssues > 0 ? Math.round((stats.escalatedIssues / stats.totalIssues) * 100) : 0,
        averageResolutionTime: stats.averageResolutionTime,
        pendingIssues: stats.pendingIssues,
      },

      // Key Metrics
      keyMetrics: stats,

      // Top Performers
      topPerformers: performanceMetrics?.gpPerformance.slice(0, 3) || [],

      // Issue Distribution
      issueDistribution: issueDistribution,

      // Recent Trends
      recentTrends: performanceMetrics?.resolutionTrend || [],

      // Recommendations
      recommendations: [
        "Focus on reducing escalation rate",
        "Improve resolution time for pending issues",
        "Address top categories with low resolution rates"
      ]
    };

    return reportData;
  };

  const generateDetailedReport = () => {
    if (!stats || !profile) return;

    const reportData = {
      reportType: "Detailed Analysis Report",
      generatedAt: new Date().toISOString(),
      generatedBy: profile.name,
      district: profile.district,
      districtId: profile.districtId,

      // Detailed Statistics
      statistics: {
        ...stats,
        resolutionRate: stats.totalIssues > 0 ? Math.round((stats.resolvedIssues / stats.totalIssues) * 100) : 0,
        escalationRate: stats.totalIssues > 0 ? Math.round((stats.escalatedIssues / stats.totalIssues) * 100) : 0,
        pendingResolutionRate: stats.pendingIssues > 0 ? Math.round((stats.resolvedIssues / (stats.resolvedIssues + stats.pendingIssues)) * 100) : 0,
      },

      // GP Performance Details
      gpPerformance: performanceMetrics?.gpPerformance || [],

      // Category Analysis
      categoryAnalysis: performanceMetrics?.categoryPerformance || [],

      // Timeline Analysis
      timelineAnalysis: performanceMetrics?.resolutionTrend || [],

      // Issue Details
      issuesByStatus: {
        resolved: stats.resolvedIssues,
        pending: stats.pendingIssues,
        escalated: stats.escalatedIssues,
        inProgress: allIssues.filter(i => i.status === "in_progress").length,
        verified: allIssues.filter(i => i.status === "verified").length,
      },

      // Financial Summary
      financialSummary: {
        pendingFundRequests: stats.fundRequestsPending,
        totalFundsApproved: stats.totalFundsApproved,
        averageFundRequest: stats.totalFundsApproved > 0 ? Math.round(stats.totalFundsApproved / 10) : 0, // Estimated
      },

      // Action Items
      actionItems: [
        {
          priority: "High",
          action: "Address escalated issues immediately",
          target: "Within 7 days",
          responsible: "DDO Team"
        },
        {
          priority: "Medium",
          action: "Improve resolution time for pending issues",
          target: "Within 30 days",
          responsible: "GP Teams"
        },
        {
          priority: "Low",
          action: "Analyze category-wise performance",
          target: "Within 15 days",
          responsible: "Analytics Team"
        }
      ]
    };

    return reportData;
  };

  const generateExcelReport = () => {
    if (!stats || !profile || !performanceMetrics) return;

    // Create multiple worksheets
    const wb = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData = [
      ["DDO District Report", "", "", ""],
      ["Generated By:", profile.name, "District:", profile.district],
      ["Generated At:", new Date().toLocaleString(), "District ID:", profile.districtId],
      ["", "", "", ""],
      ["Key Metrics", "Value", "Target", "Status"],
      ["Total Issues", stats.totalIssues, "N/A", "Actual"],
      ["Resolved Issues", stats.resolvedIssues, Math.round(stats.totalIssues * 0.8), stats.resolvedIssues >= stats.totalIssues * 0.8 ? "✓" : "⚠"],
      ["Pending Issues", stats.pendingIssues, Math.round(stats.totalIssues * 0.1), stats.pendingIssues <= stats.totalIssues * 0.1 ? "✓" : "⚠"],
      ["Escalated Issues", stats.escalatedIssues, Math.round(stats.totalIssues * 0.05), stats.escalatedIssues <= stats.totalIssues * 0.05 ? "✓" : "⚠"],
      ["Resolution Rate", `${Math.round((stats.resolvedIssues / stats.totalIssues) * 100)}%`, "80%", stats.resolvedIssues / stats.totalIssues >= 0.8 ? "✓" : "⚠"],
      ["Avg Resolution Time", `${stats.averageResolutionTime} days`, "7 days", stats.averageResolutionTime <= 7 ? "✓" : "⚠"],
      ["Funds Approved", `₹${stats.totalFundsApproved.toLocaleString()}`, "N/A", "Actual"],
      ["Pending Fund Requests", stats.fundRequestsPending, "0", stats.fundRequestsPending === 0 ? "✓" : "⚠"],
    ];

    const ws_summary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws_summary, "Summary");

    // GP Performance Sheet
    const gpHeaders = [["Gram Panchayat", "Total Issues", "Resolved", "Pending", "Resolution Rate", "Avg Time (days)"]];
    const gpData = performanceMetrics.gpPerformance.map(gp => [
      gp.name,
      gp.total,
      gp.resolved,
      gp.pending,
      `${gp.resolutionRate}%`,
      gp.averageTime
    ]);
    const ws_gp = XLSX.utils.aoa_to_sheet([...gpHeaders, ...gpData]);
    XLSX.utils.book_append_sheet(wb, ws_gp, "GP Performance");

    // Issue Distribution Sheet
    const issueHeaders = [["Category", "Count", "Percentage", "Trend"]];
    const issueData = issueDistribution.map(item => [
      item.name,
      item.value,
      `${item.percentage}%`,
      item.percentage > 20 ? "High" : item.percentage > 10 ? "Medium" : "Low"
    ]);
    const ws_issues = XLSX.utils.aoa_to_sheet([...issueHeaders, ...issueData]);
    XLSX.utils.book_append_sheet(wb, ws_issues, "Issue Distribution");

    // Recent Escalations Sheet
    const escHeaders = [["Issue ID", "Category", "Gram Panchayat", "Taluk", "Days Pending", "Status", "Priority"]];
    const escData = recentEscalations.map(issue => [
      issue.displayId,
      issue.category,
      issue.gramPanchayat,
      issue.taluk,
      issue.daysPending,
      issue.status,
      issue.daysPending > 14 ? "High" : issue.daysPending > 7 ? "Medium" : "Low"
    ]);
    const ws_esc = XLSX.utils.aoa_to_sheet([...escHeaders, ...escData]);
    XLSX.utils.book_append_sheet(wb, ws_esc, "Recent Escalations");

    return wb;
  };

  const downloadReport = (format: string) => {
    if (!stats) return;

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `DDO_Report_${district || districtId}_${timestamp}`;

    switch (format) {
      case 'json':
        const reportData = generateDetailedReport();
        const dataStr = JSON.stringify(reportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: "application/json" });
        downloadFile(dataBlob, `${filename}.json`);
        break;

      case 'excel':
        const wb = generateExcelReport();
        if (wb) {
          XLSX.writeFile(wb, `${filename}.xlsx`);
        }
        break;

      case 'csv':
        const csvData = [
          ['Metric', 'Value'],
          ['Total Issues', stats.totalIssues],
          ['Resolved Issues', stats.resolvedIssues],
          ['Pending Issues', stats.pendingIssues],
          ['Escalated Issues', stats.escalatedIssues],
          ['Resolution Rate', `${Math.round((stats.resolvedIssues / stats.totalIssues) * 100)}%`],
          ['Avg Resolution Time', `${stats.averageResolutionTime} days`],
          ['Funds Approved', `₹${stats.totalFundsApproved}`],
          ['Pending Fund Requests', stats.fundRequestsPending],
        ];
        const csvContent = csvData.map(row => row.join(',')).join('\n');
        const csvBlob = new Blob([csvContent], { type: "text/csv" });
        downloadFile(csvBlob, `${filename}.csv`);
        break;

      case 'summary':
        const summaryData = generateSummaryReport();
        const summaryStr = JSON.stringify(summaryData, null, 2);
        const summaryBlob = new Blob([summaryStr], { type: "application/json" });
        downloadFile(summaryBlob, `${filename}_summary.json`);
        break;

      default:
        alert(`Report format ${format} not implemented`);
    }

    setShowReportMenu(false);
  };

  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCreateIndex = () => {
    window.open("https://console.firebase.google.com/v1/r/project/vital-1cff1/firestore/indexes", "_blank");
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.replace(`/${locale}/role-select`);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleUpdateProfile = async (updatedData: Partial<DDOProfile>) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const authorityDocRef = doc(db, "authorities", user.uid);
      await updateDoc(authorityDocRef, {
        ...updatedData,
        updatedAt: new Date()
      });

      // Update local state
      setProfile(prev => prev ? { ...prev, ...updatedData } : null);

      // Show success message
      alert(t.profile.updateSuccess);
      setShowProfileModal(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      setError(t.error.profile);
    }
  };

  return (
    <Screen padded>
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { transform: translateX(-10px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
        .animate-slide-in {
          animation: slideIn 0.4s ease-out forwards;
        }
        .animate-pulse-slow {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .hover-scale {
          transition: transform 0.2s ease;
        }
        .hover-scale:hover {
          transform: scale(1.02);
        }
        .mobile-scroll {
          -webkit-overflow-scrolling: touch;
          scrollbar-width: thin;
        }
        .mobile-scroll::-webkit-scrollbar {
          height: 4px;
        }
        .mobile-scroll::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        .mobile-scroll::-webkit-scrollbar-thumb {
          background: #10b981;
          border-radius: 4px;
        }
        @media (max-width: 640px) {
          .mobile-stack {
            flex-direction: column !important;
          }
          .mobile-full {
            width: 100% !important;
          }
          .mobile-grid {
            grid-template-columns: 1fr !important;
          }
          .mobile-text-sm {
            font-size: 0.75rem !important;
          }
          .mobile-p-2 {
            padding: 0.5rem !important;
          }
          .mobile-gap-2 {
            gap: 0.5rem !important;
          }
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-2 sm:px-4">
        {/* Error Display */}
        {error && (
          <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-xl animate-fade-in">
            <div className="flex items-center gap-2 text-red-700">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-xs sm:text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Index Warning */}
        {indexError && (
          <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-yellow-50 border border-yellow-200 rounded-xl animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-xs sm:text-sm text-yellow-700">
                  {t.indexWarning}
                </p>
              </div>
              <button
                onClick={handleCreateIndex}
                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-yellow-600 text-white text-xs sm:text-sm rounded-lg hover:bg-yellow-700 transition font-bold"
              >
                {t.createIndex}
              </button>
            </div>
          </div>
        )}

        {/* Header - Mobile Optimized */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-8">
          <div className="animate-slide-in">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-green-900">
              {t.title}
            </h1>
            <p className="text-xs sm:text-sm text-green-900/70 mt-1">
              {t.subtitle} {district && `(${district})`}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 sm:gap-3">
            <button
              onClick={() => setShowProfileModal(true)}
              className="flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-xl bg-green-50 border border-green-200 text-green-700 text-xs sm:text-sm font-bold hover:bg-green-100 transition flex items-center justify-center gap-1 sm:gap-2 hover-scale"
            >
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="hidden xs:inline">{t.actions.viewProfile}</span>
              <span className="xs:hidden">Profile</span>
            </button>

            {/* Report Dropdown - Mobile Optimized */}
            <div className="relative flex-1 sm:flex-none">
              <button
                onClick={() => setShowReportMenu(!showReportMenu)}
                className="w-full sm:w-auto px-3 sm:px-4 py-2 rounded-xl bg-blue-600 text-white text-xs sm:text-sm font-bold hover:bg-blue-700 transition flex items-center justify-center gap-1 sm:gap-2 hover-scale"
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="hidden xs:inline">{t.reports.download}</span>
                <span className="xs:hidden">Reports</span>
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showReportMenu && (
                <div className="absolute right-0 mt-2 w-56 sm:w-64 bg-white border border-green-100 rounded-xl shadow-lg z-50 animate-fade-in">
                  <div className="p-2">
                    <p className="text-xs font-bold text-green-900 px-2 py-1">{t.reports.selectFormat}</p>
                    <div className="space-y-1">
                      <button
                        onClick={() => downloadReport('summary')}
                        className="w-full text-left px-3 py-2.5 sm:py-2 text-xs sm:text-sm text-green-700 hover:bg-green-50 rounded-lg flex items-center gap-2"
                      >
                        <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {t.reports.summary}
                      </button>
                      <button
                        onClick={() => downloadReport('detailed')}
                        className="w-full text-left px-3 py-2.5 sm:py-2 text-xs sm:text-sm text-green-700 hover:bg-green-50 rounded-lg flex items-center gap-2"
                      >
                        <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        {t.reports.detailed}
                      </button>
                      <button
                        onClick={() => downloadReport('excel')}
                        className="w-full text-left px-3 py-2.5 sm:py-2 text-xs sm:text-sm text-green-700 hover:bg-green-50 rounded-lg flex items-center gap-2"
                      >
                        <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {t.reports.excel}
                      </button>
                      <button
                        onClick={() => downloadReport('csv')}
                        className="w-full text-left px-3 py-2.5 sm:py-2 text-xs sm:text-sm text-green-700 hover:bg-green-50 rounded-lg flex items-center gap-2"
                      >
                        <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        {t.reports.csv}
                      </button>
                      <div className="border-t border-green-100 my-1"></div>
                      <button
                        onClick={() => router.push(`/${locale}/authority/ddo/reports/custom`)}
                        className="w-full text-left px-3 py-2.5 sm:py-2 text-xs sm:text-sm text-green-700 hover:bg-green-50 rounded-lg flex items-center gap-2"
                      >
                        <svg className="w-4 h-4 text-purple-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {t.actions.customizeReport}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleLogout}
              className="flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm font-bold hover:bg-red-100 transition hover-scale"
            >
              <span className="hidden xs:inline">{t.actions.logout}</span>
              <span className="xs:hidden">Logout</span>
            </button>
          </div>
        </div>

        {/* Profile Info Bar - Mobile Optimized */}
        {profile && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-100 rounded-xl sm:rounded-2xl animate-fade-in">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                <div className="relative flex-shrink-0">
                  {profile.profilePhoto ? (
                    <img
                      src={profile.profilePhoto}
                      alt={profile.name}
                      className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-3 sm:border-4 border-white shadow"
                    />
                  ) : (
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-green-600 border-3 sm:border-4 border-white shadow flex items-center justify-center">
                      <span className="text-white text-lg sm:text-xl font-bold">
                        {profile.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                    <svg className="w-2 h-2 sm:w-3 sm:h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm sm:text-lg font-extrabold text-green-900 truncate">{profile.name}</h3>
                  <p className="text-xs sm:text-sm text-green-700 truncate">{profile.designation}</p>
                  <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1">
                    <span className="text-xs px-1.5 sm:px-2 py-0.5 bg-green-100 text-green-800 rounded-full font-bold">
                      {profile.role.toUpperCase()}
                    </span>
                    <span className={`text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-bold ${profile.verificationStatus === 'verified' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {profile.verificationStatus === 'verified' ? t.profile.verified : t.profile.pending}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-xs sm:text-sm text-green-700 text-center sm:text-right w-full sm:w-auto">
                <p className="truncate"><span className="font-bold hidden sm:inline">{t.profile.district}:</span> {profile.district}</p>
                <p className="hidden sm:block"><span className="font-bold">{t.profile.lastActive}:</span> {profile.lastActive}</p>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col justify-center items-center h-48 sm:h-64 gap-3 sm:gap-4">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-green-700"></div>
            <p className="text-sm sm:text-base text-green-700 animate-pulse-slow">{t.loading}</p>
          </div>
        ) : stats ? (
          <>
            {/* Stats Overview Cards - Mobile Optimized Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-8">
              <StatCard
                title={t.stats.totalIssues}
                value={stats.totalIssues}
                color="blue"
                icon="📊"
                mobile={true}
                delay={0}
              />
              <StatCard
                title={t.stats.resolved}
                value={stats.resolvedIssues}
                color="green"
                icon="✅"
                percentage={stats.totalIssues > 0 ? Math.round((stats.resolvedIssues / stats.totalIssues) * 100) : 0}
                mobile={true}
                delay={1}
              />
              <StatCard
                title={t.stats.pending}
                value={stats.pendingIssues}
                color="yellow"
                icon="⏳"
                mobile={true}
                delay={2}
              />
              <StatCard
                title={t.stats.last30Resolved}
                value={stats.last30DaysResolved}
                color="green"
                icon="📈"
                mobile={true}
                delay={3}
              />
            </div>

            {/* Second Row Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-8">
              <StatCard
                title={t.stats.escalationRate}
                value={stats.totalIssues > 0 ? Math.round((stats.escalatedIssues / stats.totalIssues) * 100) : 0}
                color="red"
                icon="🚨"
                suffix="%"
                mobile={true}
                delay={4}
              />
              <StatCard
                title={t.stats.avgResolution}
                value={stats.averageResolutionTime}
                color="purple"
                icon="⏰"
                suffix={` ${t.mobile.days}`}
                mobile={true}
                delay={5}
              />
              <StatCard
                title={t.stats.fundsApproved}
                value={stats.totalFundsApproved}
                color="green"
                icon="💰"
                suffix=" ₹"
                mobile={true}
                delay={6}
              />
              <StatCard
                title={t.stats.last30Escalated}
                value={stats.last30DaysEscalated}
                color="red"
                icon="⚠️"
                mobile={true}
                delay={7}
              />
            </div>

            {/* Main Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-8">
              {/* Issue Distribution Card */}
              <Card className="lg:col-span-2 animate-fade-in">
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg font-bold text-green-900">
                    {t.charts.issueDistribution}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {issueDistribution.length > 0 ? (
                    <div className="space-y-2 sm:space-y-3">
                      {issueDistribution.slice(0, 5).map((item, idx) => (
                        <div key={item.name} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 hover:bg-green-50 p-2 rounded-lg transition-colors" style={{ animationDelay: `${idx * 50}ms` }}>
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className="w-3 h-3 sm:w-4 sm:h-4 rounded flex-shrink-0"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="text-xs sm:text-sm font-medium text-green-900 truncate">{item.name}</span>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-4 ml-5 sm:ml-0">
                            <span className="text-xs sm:text-sm font-bold text-green-900">{item.value}</span>
                            <span className="text-xs text-green-600">
                              {item.percentage}%
                            </span>
                            <div className="flex-1 h-1.5 sm:h-2 bg-green-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-500 transition-all duration-500"
                                style={{ width: `${Math.min(item.percentage, 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-4 text-sm">{t.noData}</p>
                  )}
                </CardContent>
              </Card>

              {/* GP Performance */}
              <Card className="animate-fade-in" style={{ animationDelay: "100ms" }}>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg font-bold text-green-900">
                    {t.charts.gpRanking}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {performanceMetrics?.gpPerformance && performanceMetrics.gpPerformance.length > 0 ? (
                    <div className="space-y-2 sm:space-y-3">
                      {performanceMetrics.gpPerformance.slice(0, 5).map((gp, index) => (
                        <div key={gp.name} className="flex items-center justify-between p-2 sm:p-3 bg-green-50 rounded-lg hover:shadow-sm transition-shadow" style={{ animationDelay: `${index * 50}ms` }}>
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            <span className="text-xs sm:text-sm font-bold text-green-700 flex-shrink-0">#{index + 1}</span>
                            <div className="min-w-0">
                              <p className="text-xs sm:text-sm font-bold text-green-900 truncate">{gp.name}</p>
                              <p className="text-xs text-green-600">
                                {gp.resolved}/{gp.total} • {gp.averageTime}{t.mobile.days}
                              </p>
                            </div>
                          </div>
                          <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs font-bold flex-shrink-0 ${
                            gp.resolutionRate >= 90 ? 'bg-green-100 text-green-800' :
                            gp.resolutionRate >= 75 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {gp.resolutionRate}%
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-4 text-sm">{t.noData}</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Escalations - Mobile Scrollable */}
            <Card className="mb-4 sm:mb-8 animate-fade-in" style={{ animationDelay: "200ms" }}>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <CardTitle className="text-base sm:text-lg font-bold text-green-900">
                    {t.tables.recentEscalations}
                  </CardTitle>
                  <div className="flex gap-2">
                    <button
                      onClick={() => downloadReport('excel')}
                      className="text-xs sm:text-sm text-green-700 hover:text-green-900 font-bold flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-green-50 transition-colors"
                    >
                      <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      <span className="hidden xs:inline">{t.mobile.export}</span>
                    </button>
                    <button
                      onClick={() => router.push(`/${locale}/authority/ddo/escalations`)}
                      className="text-xs sm:text-sm text-green-700 hover:text-green-900 font-bold px-2 py-1 rounded-lg hover:bg-green-50 transition-colors"
                    >
                      {t.actions.viewAll} →
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto mobile-scroll -mx-2 sm:mx-0">
                  <div className="inline-block min-w-full align-middle px-2 sm:px-0">
                    <table className="min-w-full divide-y divide-green-100">
                      <thead>
                        <tr className="text-left text-xs text-green-600">
                          <th className="pb-2 sm:pb-3 px-2 sm:px-0 font-bold whitespace-nowrap">{t.tables.issueId}</th>
                          <th className="pb-2 sm:pb-3 px-2 sm:px-0 font-bold whitespace-nowrap">{t.tables.category}</th>
                          <th className="pb-2 sm:pb-3 px-2 sm:px-0 font-bold whitespace-nowrap">{t.tables.gp}</th>
                          <th className="pb-2 sm:pb-3 px-2 sm:px-0 font-bold whitespace-nowrap">{t.tables.daysPending}</th>
                          <th className="pb-2 sm:pb-3 px-2 sm:px-0 font-bold whitespace-nowrap">{t.tables.status}</th>
                          <th className="pb-2 sm:pb-3 px-2 sm:px-0 font-bold whitespace-nowrap">{t.tables.action}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-green-50">
                        {recentEscalations.length > 0 ? (
                          recentEscalations.slice(0, 3).map((issue, idx) => (
                            <tr key={issue.id} className="hover:bg-green-50 transition-colors" style={{ animationDelay: `${idx * 50}ms` }}>
                              <td className="py-2 sm:py-3 px-2 sm:px-0 font-mono text-xs whitespace-nowrap">{issue.displayId}</td>
                              <td className="py-2 sm:py-3 px-2 sm:px-0">
                                <span className="px-1.5 sm:px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full whitespace-nowrap">
                                  {issue.category || "Unknown"}
                                </span>
                              </td>
                              <td className="py-2 sm:py-3 px-2 sm:px-0 text-xs whitespace-nowrap">{issue.gramPanchayat}</td>
                              <td className="py-2 sm:py-3 px-2 sm:px-0">
                                <span className={`px-1.5 sm:px-2 py-0.5 text-xs rounded-full font-bold whitespace-nowrap ${
                                  issue.daysPending > 14 ? 'bg-red-100 text-red-800' :
                                  issue.daysPending > 7 ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {issue.daysPending || 0}{t.mobile.days}
                                </span>
                              </td>
                              <td className="py-2 sm:py-3 px-2 sm:px-0">
                                <span className={`px-1.5 sm:px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap ${
                                  issue.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  issue.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {issue.status || 'unknown'}
                                </span>
                              </td>
                              <td className="py-2 sm:py-3 px-2 sm:px-0">
                                <button
                                  onClick={() => router.push(`/${locale}/authority/ddo/issues/${issue.id}`)}
                                  className="text-green-700 hover:text-green-900 text-xs font-bold whitespace-nowrap"
                                >
                                  {t.mobile.view}
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="py-4 text-center text-gray-500 text-sm">
                              {t.noData}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Cards - Mobile Optimized Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
              <DDOCard
                title={t.cards.escalations}
                count={stats.escalatedIssues}
                icon="🚨"
                onClick={() => router.push(`/${locale}/authority/ddo/escalations`)}
                cta={t.actions.open}
                mobile={true}
                delay={0}
              />
              <DDOCard
                title={t.cards.fundRequests}
                count={stats.fundRequestsPending}
                icon="💰"
                onClick={() => router.push(`/${locale}/authority/ddo/fund-requests`)}
                cta={t.actions.approveFunds}
                mobile={true}
                delay={1}
              />
              <DDOCard
                title={t.cards.analytics}
                icon="📈"
                onClick={() => router.push(`/${locale}/authority/ddo/analytics`)}
                cta={t.actions.open}
                mobile={true}
                delay={2}
              />
              <DDOCard
                title={t.cards.reports}
                icon="📋"
                onClick={() => setShowReportMenu(true)}
                cta={t.actions.generateReport}
                mobile={true}
                delay={3}
              />
              <DDOCard
                title={t.cards.unresolved}
                count={stats.pendingIssues}
                icon="⏳"
                onClick={() => router.push(`/${locale}/authority/ddo/unresolved`)}
                cta={t.actions.open}
                mobile={true}
                delay={4}
              />
              <DDOCard
                title={t.cards.gpPerformance}
                icon="🏆"
                onClick={() => router.push(`/${locale}/authority/ddo/gp-performance`)}
                cta={t.actions.open}
                mobile={true}
                delay={5}
              />
              <DDOCard
                title={t.cards.category}
                icon="📊"
                onClick={() => router.push(`/${locale}/authority/ddo/category-analysis`)}
                cta={t.actions.open}
                mobile={true}
                delay={6}
              />
              <DDOCard
                title={t.cards.trends}
                icon="📈"
                onClick={() => router.push(`/${locale}/authority/ddo/trends`)}
                cta={t.actions.open}
                mobile={true}
                delay={7}
              />
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">{t.noData}</p>
          </div>
        )}
      </div>

      {/* Profile Modal - Mobile Optimized */}
      {showProfileModal && profile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4 animate-fade-in">
          <div className="bg-white rounded-xl sm:rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-xl font-extrabold text-green-900">{t.profile.title}</h3>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex flex-col items-center mb-4 sm:mb-6">
                <div className="relative mb-3 sm:mb-4">
                  {profile.profilePhoto ? (
                    <img
                      src={profile.profilePhoto}
                      alt={profile.name}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-green-100"
                    />
                  ) : (
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-green-600 border-4 border-green-100 flex items-center justify-center">
                      <span className="text-white text-2xl sm:text-3xl font-bold">
                        {profile.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <h4 className="text-base sm:text-lg font-extrabold text-green-900 text-center">{profile.name}</h4>
                <p className="text-xs sm:text-sm text-green-700 text-center">{profile.designation}</p>
                <p className="text-xs text-green-600 mt-1 text-center">{profile.department}</p>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row sm:justify-between border-b border-green-100 pb-2">
                  <span className="text-xs sm:text-sm font-bold text-green-900">{t.profile.email}:</span>
                  <span className="text-xs sm:text-sm text-green-700 break-all">{profile.email}</span>
                </div>
                {profile.phone && (
                  <div className="flex flex-col sm:flex-row sm:justify-between border-b border-green-100 pb-2">
                    <span className="text-xs sm:text-sm font-bold text-green-900">{t.profile.phone}:</span>
                    <span className="text-xs sm:text-sm text-green-700">{profile.phone}</span>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row sm:justify-between border-b border-green-100 pb-2">
                  <span className="text-xs sm:text-sm font-bold text-green-900">{t.profile.district}:</span>
                  <span className="text-xs sm:text-sm text-green-700">{profile.district}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between border-b border-green-100 pb-2">
                  <span className="text-xs sm:text-sm font-bold text-green-900">{t.profile.role}:</span>
                  <span className="text-xs sm:text-sm text-green-700">{profile.role.toUpperCase()}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between border-b border-green-100 pb-2">
                  <span className="text-xs sm:text-sm font-bold text-green-900">{t.profile.verificationStatus}:</span>
                  <span className={`text-xs px-2 py-1 rounded-full font-bold inline-block ${
                    profile.verificationStatus === 'verified' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {profile.verificationStatus === 'verified' ? t.profile.verified : t.profile.pending}
                  </span>
                </div>
              </div>

              <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="w-full sm:w-auto px-4 py-2 border border-green-200 text-green-700 rounded-xl font-bold hover:bg-green-50 transition-colors text-sm"
                >
                  {t.profile.close}
                </button>
                <button
                  onClick={() => router.push(`/${locale}/authority/ddo/profile`)}
                  className="w-full sm:w-auto px-4 py-2 bg-green-700 text-white rounded-xl font-bold hover:bg-green-800 transition-colors text-sm"
                >
                  {t.profile.editProfile}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Screen>
  );
}

/* 🧩 Stat Card Component - Mobile Optimized with Animation */
function StatCard({
  title,
  value,
  color,
  icon,
  percentage,
  suffix = "",
  mobile = false,
  delay = 0
}: {
  title: string;
  value: number;
  color: string;
  icon: string;
  percentage?: number;
  suffix?: string;
  mobile?: boolean;
  delay?: number;
}) {
  const colorClasses = {
    blue: "bg-blue-50 border-blue-100 text-blue-800",
    green: "bg-green-50 border-green-100 text-green-800",
    red: "bg-red-50 border-red-100 text-red-800",
    yellow: "bg-yellow-50 border-yellow-100 text-yellow-800",
    purple: "bg-purple-50 border-purple-100 text-purple-800",
  };

  const formattedValue = typeof value === 'number' 
    ? suffix.includes('₹') 
      ? `₹${value.toLocaleString()}`
      : `${value.toLocaleString()}${suffix}`
    : value;

  return (
    <div 
      className={`${colorClasses[color as keyof typeof colorClasses]} border rounded-xl sm:rounded-2xl p-3 sm:p-5 hover-scale transition-all duration-300`}
      style={{ animation: `fadeIn 0.5s ease-out ${delay * 0.1}s both` }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs sm:text-sm font-bold opacity-80 mb-0.5 sm:mb-1 truncate">{title}</p>
          <div className="flex items-baseline gap-1 sm:gap-2 flex-wrap">
            <h3 className="text-sm sm:text-2xl font-extrabold">
              {formattedValue}
            </h3>
            {percentage !== undefined && (
              <span className={`text-xs font-bold ${
                percentage >= 80 ? 'text-green-600' : 
                percentage >= 60 ? 'text-yellow-600' : 
                'text-red-600'
              }`}>
                {percentage}%
              </span>
            )}
          </div>
        </div>
        <span className="text-xl sm:text-2xl">{icon}</span>
      </div>
      {percentage !== undefined && (
        <div className="mt-2 sm:mt-3 h-1.5 sm:h-2 bg-green-100 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              percentage >= 80 ? 'bg-green-500' : 
              percentage >= 60 ? 'bg-yellow-500' : 
              'bg-red-500'
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}

/* 🧩 Enhanced DDO Card - Mobile Optimized with Animation */
function DDOCard({
  title,
  count,
  icon,
  cta,
  onClick,
  mobile = false,
  delay = 0
}: {
  title: string;
  count?: number;
  icon: string;
  cta: string;
  onClick: () => void;
  mobile?: boolean;
  delay?: number;
}) {
  return (
    <div 
      className="bg-white border border-green-100 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-sm hover:shadow-md transition-all duration-300 hover:border-green-300 hover-scale"
      style={{ animation: `fadeIn 0.5s ease-out ${delay * 0.1}s both` }}
    >
      <div>
        <div className="flex items-start justify-between mb-2 sm:mb-3">
          <h3 className="text-xs sm:text-lg font-extrabold text-green-900">
            {title}
          </h3>
          <span className="text-lg sm:text-2xl">{icon}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        {count !== undefined && (
          <span className="text-xs sm:text-sm font-bold text-green-700">
            {count} {mobile ? '' : 'pending'}
          </span>
        )}
        <button
          onClick={onClick}
          className="px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-green-700 text-white text-xs sm:text-sm font-extrabold hover:bg-green-800 active:scale-95 transition-all"
        >
          {cta}
        </button>
      </div>
    </div>
  );
}
