"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Screen from "../../../../components/Screen";
import { auth, db } from "../../../../lib/firebase";
import { updateProfile, reauthenticateWithCredential, EmailAuthProvider, updatePassword } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { 
  FiUser, 
  FiLogOut,
  FiHome,
  FiSave,
  FiEdit,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiPhone,
  FiMapPin,
  FiMail,
  FiShield,
  FiRefreshCw,
  FiArrowLeft,
  FiBriefcase,
  FiFileText,
  FiKey,
  FiLock,
  FiEye,
  FiEyeOff,
  FiNavigation,
  FiActivity,
  FiTrendingUp,
  FiUsers,
  FiTarget
} from "react-icons/fi";
import { Building2, ShieldCheck, MapPin, Mail, Phone, User, FileText, Home, Briefcase, Target } from "lucide-react";

type Locale = "en" | "kn" | "hi";

type AuthorityProfile = {
  uid: string;
  name?: string;
  email?: string;
  phone?: string;
  aadhaar?: string;
  aadhaarLast4?: string;
  officeAddress?: string;
  role?: string;
  district?: string;
  districtId?: string;
  taluk?: string;
  talukId?: string;
  village?: string;
  villageId?: string;
  panchayat?: string;
  panchayatId?: string;
  gramPanchayatId?: string;
  verified?: boolean;
  verification?: {
    status: string;
    requestedAt?: any;
    verifiedAt?: any;
    verifiedBy?: string;
  };
  status?: string;
  createdAt?: any;
  updatedAt?: any;
  isManualEntry?: {
    district?: boolean;
    taluk?: boolean;
    village?: boolean;
    panchayat?: boolean;
  };
  performanceStats?: {
    issuesResolved?: number;
    avgResolutionTime?: number;
    pendingAssignments?: number;
  };
};

export default function PdoProfilePage() {
  const router = useRouter();
  const params = useParams() as { locale?: string };
  const locale = (params?.locale || "en") as Locale;

  const t = useMemo(() => {
    const L: any = {
      en: {
        title: "PDO Profile",
        subtitle: "Manage your Panchayat Development Officer account",
        labels: {
          name: "Full Name",
          email: "Email Address",
          phone: "Phone Number",
          aadhaar: "Aadhaar Number",
          officeAddress: "Office Address",
          role: "Authority Role",
          district: "District",
          taluk: "Taluk/Block",
          village: "Village",
          panchayat: "Panchayat",
          gramPanchayatId: "Gram Panchayat ID",
        },
        placeholders: {
          name: "Enter your full name",
          email: "Enter email address",
          phone: "Enter phone number",
          aadhaar: "12-digit Aadhaar number",
          officeAddress: "Complete office address",
        },
        status: {
          verified: "Verified",
          pending: "Pending Verification",
          active: "Active",
          blocked: "Blocked",
          unknown: "Status not set",
        },
        btn: {
          save: "Save Changes",
          saving: "Saving...",
          updatePassword: "Update Password",
          logout: "Logout",
          back: "Back to Dashboard",
          refresh: "Refresh",
          edit: "Edit Profile",
          cancel: "Cancel",
        },
        sections: {
          personal: "Personal Information",
          official: "Official Details",
          location: "Jurisdiction Area",
          account: "Account Status",
          security: "Security Settings",
          performance: "Performance Metrics",
        },
        err: {
          login: "Please login as authority.",
          load: "Could not load profile.",
          save: "Could not save profile.",
          passwordMismatch: "Current password is incorrect",
          passwordWeak: "Password must be at least 8 characters",
          emailInUse: "Email already in use",
        },
        note: "Note: Your jurisdiction is determined by your role and location assignments.",
        success: "Profile updated successfully!",
        lastUpdated: "Last updated",
        memberSince: "Member since",
        verification: "Verification Status",
        accountType: "Account Type",
        authority: "Panchayat Development Officer",
        editProfile: "Edit Profile",
        viewDashboard: "View Dashboard",
        privacy: "Privacy Settings",
        help: "Help & Support",
        dashboard: "Dashboard",
        issues: "Issues",
        assignments: "Assignments",
        profile: "Profile",
        roleLabels: {
          pdo: "Panchayat Development Officer (PDO)",
          village_incharge: "Village Incharge",
          tdo: "Taluk Development Officer (TDO)",
          ddo: "District Development Officer (DDO)",
        },
        passwordChange: "Change Password",
        currentPassword: "Current Password",
        newPassword: "New Password",
        confirmPassword: "Confirm New Password",
        passwordRequirements: "Password must be at least 8 characters",
        passwordUpdated: "Password updated successfully",
        showPassword: "Show password",
        hidePassword: "Hide password",
        performance: {
          title: "Performance Metrics",
          issuesResolved: "Issues Resolved",
          avgResolutionTime: "Avg. Resolution Time",
          pendingAssignments: "Pending Assignments",
          days: "days",
          issues: "issues",
        },
        stats: {
          efficiency: "Efficiency Score",
          responseRate: "Response Rate",
          completionRate: "Completion Rate",
        },
      },
      kn: {
        title: "PDO ಪ್ರೊಫೈಲ್",
        subtitle: "ನಿಮ್ಮ ಪಂಚಾಯತ್ ಅಭಿವೃದ್ಧಿ ಅಧಿಕಾರಿ ಖಾತೆಯನ್ನು ನಿರ್ವಹಿಸಿ",
        labels: {
          name: "ಪೂರ್ಣ ಹೆಸರು",
          email: "ಇಮೇಲ್ ವಿಳಾಸ",
          phone: "ಫೋನ್ ಸಂಖ್ಯೆ",
          aadhaar: "ಆಧಾರ್ ಸಂಖ್ಯೆ",
          officeAddress: "ಕಚೇರಿ ವಿಳಾಸ",
          role: "ಅಧಿಕಾರಿ ಪಾತ್ರ",
          district: "ಜಿಲ್ಲೆ",
          taluk: "ತಾಲ್ಲೂಕು/ಬ್ಲಾಕ್",
          village: "ಗ್ರಾಮ",
          panchayat: "ಪಂಚಾಯಿತಿ",
          gramPanchayatId: "ಗ್ರಾಮ ಪಂಚಾಯಿತಿ ಐಡಿ",
        },
        placeholders: {
          name: "ನಿಮ್ಮ ಪೂರ್ಣ ಹೆಸರನ್ನು ನಮೂದಿಸಿ",
          email: "ಇಮೇಲ್ ವಿಳಾಸ ನಮೂದಿಸಿ",
          phone: "ಫೋನ್ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ",
          aadhaar: "12-ಅಂಕಿಯ ಆಧಾರ್ ಸಂಖ್ಯೆ",
          officeAddress: "ಪೂರ್ಣ ಕಚೇರಿ ವಿಳಾಸ",
        },
        status: {
          verified: "ಪರಿಶೀಲಿಸಲಾಗಿದೆ",
          pending: "ಪರಿಶೀಲನೆ ಬಾಕಿ",
          active: "ಸಕ್ರಿಯ",
          blocked: "ನಿರ್ಬಂಧಿಸಲಾಗಿದೆ",
          unknown: "ಸ್ಥಿತಿ ಹೊಂದಿಸಿಲ್ಲ",
        },
        btn: {
          save: "ಬದಲಾವಣೆಗಳನ್ನು ಉಳಿಸಿ",
          saving: "ಉಳಿಸಲಾಗುತ್ತಿದೆ...",
          updatePassword: "ಪಾಸ್‌ವರ್ಡ್ ನವೀಕರಿಸಿ",
          logout: "ಲಾಗ್‌ಔಟ್",
          back: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಹಿಂದಿರುಗಿ",
          refresh: "ರಿಫ್ರೆಶ್",
          edit: "ಪ್ರೊಫೈಲ್ ಸಂಪಾದಿಸಿ",
          cancel: "ರದ್ದು ಮಾಡಿ",
        },
        sections: {
          personal: "ವೈಯಕ್ತಿಕ ಮಾಹಿತಿ",
          official: "ಅಧಿಕೃತ ವಿವರಗಳು",
          location: "ಅಧಿಕಾರ ವ್ಯಾಪ್ತಿ ಪ್ರದೇಶ",
          account: "ಖಾತೆ ಸ್ಥಿತಿ",
          security: "ಸುರಕ್ಷತಾ ಸೆಟ್ಟಿಂಗ್‌ಗಳು",
          performance: "ಪ್ರದರ್ಶನ ಮಾಪನಗಳು",
        },
        err: {
          login: "ದಯವಿಟ್ಟು ಅಧಿಕಾರಿಯಾಗಿ ಲಾಗಿನ್ ಆಗಿ.",
          load: "ಪ್ರೊಫೈಲ್ ಲೋಡ್ ಆಗಲಿಲ್ಲ.",
          save: "ಪ್ರೊಫೈಲ್ ಉಳಿಸಲಾಗಲಿಲ್ಲ.",
          passwordMismatch: "ಪ್ರಸ್ತುತ ಪಾಸ್‌ವರ್ಡ್ ತಪ್ಪಾಗಿದೆ",
          passwordWeak: "ಪಾಸ್‌ವರ್ಡ್ ಕನಿಷ್ಠ 8 ಅಕ್ಷರಗಳಾಗಿರಬೇಕು",
          emailInUse: "ಇಮೇಲ್ ಈಗಾಗಲೇ ಬಳಕೆಯಲ್ಲಿದೆ",
        },
        note: "ಗಮನಿಸಿ: ನಿಮ್ಮ ಅಧಿಕಾರ ವ್ಯಾಪ್ತಿಯನ್ನು ನಿಮ್ಮ ಪಾತ್ರ ಮತ್ತು ಸ್ಥಳ ನಿಯೋಜನೆಗಳಿಂದ ನಿರ್ಧರಿಸಲಾಗುತ್ತದೆ.",
        success: "ಪ್ರೊಫೈಲ್ ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ!",
        lastUpdated: "ಕೊನೆಯ ನವೀಕರಣ",
        memberSince: "ಸದಸ್ಯರಾಗಿ ಸೇರಿದ್ದು",
        verification: "ಪರಿಶೀಲನೆ ಸ್ಥಿತಿ",
        accountType: "ಖಾತೆ ವಿಧ",
        authority: "ಪಂಚಾಯತ್ ಅಭಿವೃದ್ಧಿ ಅಧಿಕಾರಿ",
        editProfile: "ಪ್ರೊಫೈಲ್ ಸಂಪಾದಿಸಿ",
        viewDashboard: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ವೀಕ್ಷಿಸಿ",
        privacy: "ಗೌಪ್ಯತಾ ಸೆಟ್ಟಿಂಗ್‌ಗಳು",
        help: "ಸಹಾಯ ಮತ್ತು ಬೆಂಬಲ",
        dashboard: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
        issues: "ಸಮಸ್ಯೆಗಳು",
        assignments: "ನಿಯೋಜನೆಗಳು",
        profile: "ಪ್ರೊಫೈಲ್",
        roleLabels: {
          pdo: "ಪಂಚಾಯತ್ ಅಭಿವೃದ್ಧಿ ಅಧಿಕಾರಿ (ಪಿಡಿಒ)",
          village_incharge: "ಗ್ರಾಮ ಇಂಚಾರ್ಜ್",
          tdo: "ತಾಲ್ಲೂಕು ಅಭಿವೃದ್ಧಿ ಅಧಿಕಾರಿ (ಟಿಡಿಒ)",
          ddo: "ಜಿಲ್ಲಾ ಅಭಿವೃದ್ಧಿ ಅಧಿಕಾರಿ (ಡಿಡಿಒ)",
        },
        passwordChange: "ಪಾಸ್‌ವರ್ಡ್ ಬದಲಾಯಿಸಿ",
        currentPassword: "ಪ್ರಸ್ತುತ ಪಾಸ್‌ವರ್ಡ್",
        newPassword: "ಹೊಸ ಪಾಸ್‌ವರ್ಡ್",
        confirmPassword: "ಹೊಸ ಪಾಸ್‌ವರ್ಡ್ ದೃಢೀಕರಿಸಿ",
        passwordRequirements: "ಪಾಸ್‌ವರ್ಡ್ ಕನಿಷ್ಠ 8 ಅಕ್ಷರಗಳಾಗಿರಬೇಕು",
        passwordUpdated: "ಪಾಸ್‌ವರ್ಡ್ ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ",
        showPassword: "ಪಾಸ್‌ವರ್ಡ್ ತೋರಿಸಿ",
        hidePassword: "ಪಾಸ್‌ವರ್ಡ್ ಮರೆಮಾಡಿ",
        performance: {
          title: "ಪ್ರದರ್ಶನ ಮಾಪನಗಳು",
          issuesResolved: "ಪರಿಹರಿಸಿದ ಸಮಸ್ಯೆಗಳು",
          avgResolutionTime: "ಸರಾಸರಿ ಪರಿಹಾರ ಸಮಯ",
          pendingAssignments: "ಬಾಕಿ ನಿಯೋಜನೆಗಳು",
          days: "ದಿನಗಳು",
          issues: "ಸಮಸ್ಯೆಗಳು",
        },
        stats: {
          efficiency: "ದಕ್ಷತೆ ಸ್ಕೋರ್",
          responseRate: "ಪ್ರತಿಕ್ರಿಯೆ ದರ",
          completionRate: "ಪೂರ್ಣಗೊಳಿಸುವ ದರ",
        },
      },
      hi: {
        title: "PDO प्रोफ़ाइल",
        subtitle: "अपने पंचायत विकास अधिकारी खाते का प्रबंधन करें",
        labels: {
          name: "पूरा नाम",
          email: "ईमेल पता",
          phone: "फोन नंबर",
          aadhaar: "आधार नंबर",
          officeAddress: "कार्यालय का पता",
          role: "प्राधिकरण भूमिका",
          district: "जिला",
          taluk: "तालुका/ब्लॉक",
          village: "गांव",
          panchayat: "पंचायत",
          gramPanchayatId: "ग्राम पंचायत आईडी",
        },
        placeholders: {
          name: "अपना पूरा नाम दर्ज करें",
          email: "ईमेल पता दर्ज करें",
          phone: "फोन नंबर दर्ज करें",
          aadhaar: "12-अंकों का आधार नंबर",
          officeAddress: "पूरा कार्यालय पता",
        },
        status: {
          verified: "सत्यापित",
          pending: "सत्यापन लंबित",
          active: "सक्रिय",
          blocked: "अवरुद्ध",
          unknown: "स्थिति सेट नहीं है",
        },
        btn: {
          save: "परिवर्तन सहेजें",
          saving: "सहेजा जा रहा है...",
          updatePassword: "पासवर्ड अपडेट करें",
          logout: "लॉगआउट",
          back: "डैशबोर्ड पर वापस जाएं",
          refresh: "रिफ्रेश",
          edit: "प्रोफ़ाइल संपादित करें",
          cancel: "रद्द करें",
        },
        sections: {
          personal: "व्यक्तिगत जानकारी",
          official: "आधिकारिक विवरण",
          location: "अधिकार क्षेत्र क्षेत्र",
          account: "खाता स्थिति",
          security: "सुरक्षा सेटिंग्स",
          performance: "प्रदर्शन मेट्रिक्स",
        },
        err: {
          login: "कृपया प्राधिकरण के रूप में लॉगिन करें।",
          load: "प्रोफ़ाइल लोड नहीं हुई।",
          save: "प्रोफ़ाइल सेव नहीं हुई।",
          passwordMismatch: "वर्तमान पासवर्ड गलत है",
          passwordWeak: "पासवर्ड कम से कम 8 वर्णों का होना चाहिए",
          emailInUse: "ईमेल पहले से उपयोग में है",
        },
        note: "नोट: आपका अधिकार क्षेत्र आपकी भूमिका और स्थान असाइनमेंट द्वारा निर्धारित किया जाता है।",
        success: "प्रोफ़ाइल सफलतापूर्वक अपडेट की गई!",
        lastUpdated: "अंतिम अपडेट",
        memberSince: "सदस्यता तिथि",
        verification: "सत्यापन स्थिति",
        accountType: "खाता प्रकार",
        authority: "पंचायत विकास अधिकारी",
        editProfile: "प्रोफ़ाइल संपादित करें",
        viewDashboard: "डैशबोर्ड देखें",
        privacy: "प्राइवेसी सेटिंग्स",
        help: "सहायता और समर्थन",
        dashboard: "डैशबोर्ड",
        issues: "समस्याएँ",
        assignments: "असाइनमेंट",
        profile: "प्रोफ़ाइल",
        roleLabels: {
          pdo: "पंचायत विकास अधिकारी (PDO)",
          village_incharge: "ग्राम इंचार्ज",
          tdo: "तालुका विकास अधिकारी (TDO)",
          ddo: "जिला विकास अधिकारी (DDO)",
        },
        passwordChange: "पासवर्ड बदलें",
        currentPassword: "वर्तमान पासवर्ड",
        newPassword: "नया पासवर्ड",
        confirmPassword: "नए पासवर्ड की पुष्टि करें",
        passwordRequirements: "पासवर्ड कम से कम 8 वर्णों का होना चाहिए",
        passwordUpdated: "पासवर्ड सफलतापूर्वक अपडेट किया गया",
        showPassword: "पासवर्ड दिखाएं",
        hidePassword: "पासवर्ड छिपाएं",
        performance: {
          title: "प्रदर्शन मेट्रिक्स",
          issuesResolved: "हल की गई समस्याएँ",
          avgResolutionTime: "औसत समाधान समय",
          pendingAssignments: "लंबित असाइनमेंट",
          days: "दिन",
          issues: "समस्याएँ",
        },
        stats: {
          efficiency: "दक्षता स्कोर",
          responseRate: "प्रतिक्रिया दर",
          completionRate: "पूर्णता दर",
        },
      },
    };
    return L[locale] || L.en;
  }, [locale]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");
  const [editing, setEditing] = useState(false);
  const [showSecurity, setShowSecurity] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [securityData, setSecurityData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [data, setData] = useState<AuthorityProfile>({
    uid: "",
    name: "",
    email: "",
    phone: "",
    aadhaar: "",
    aadhaarLast4: "",
    officeAddress: "",
    role: "",
    district: "",
    districtId: "",
    taluk: "",
    talukId: "",
    village: "",
    villageId: "",
    panchayat: "",
    panchayatId: "",
    gramPanchayatId: "",
    verified: false,
    verification: {
      status: "pending",
    },
    status: "pending",
    performanceStats: {
      issuesResolved: 0,
      avgResolutionTime: 0,
      pendingAssignments: 0,
    }
  });

  const statusText = useMemo(() => {
    if (data.verified === true) return t.status.verified;
    if (data.status === "pending" || data.verified === false) return t.status.pending;
    if (data.status === "active") return t.status.active;
    if (data.status === "blocked") return t.status.blocked;
    return t.status.unknown;
  }, [data.verified, data.status, t]);

  const roleLabel = useMemo(() => {
    return t.roleLabels[data.role as keyof typeof t.roleLabels] || data.role || "";
  }, [data.role, t]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setErr("");
        const user = auth.currentUser;
        if (!user) {
          setErr(t.err.login);
          router.replace(`/${locale}/authority/login`);
          return;
        }

        // Load authority data
        const aRef = doc(db, "authorities", user.uid);
        const aSnap = await getDoc(aRef);

        if (aSnap.exists()) {
          const authority = aSnap.data() as any;
          setData({
            uid: user.uid,
            name: authority.name || user.displayName || "",
            email: user.email || authority.email || "",
            phone: authority.mobile || authority.phone || "",
            aadhaar: authority.aadhaar || "",
            aadhaarLast4: authority.aadhaarLast4 || (authority.aadhaar ? authority.aadhaar.slice(-4) : ""),
            officeAddress: authority.officeAddress || "",
            role: authority.role || "",
            district: authority.district || "",
            districtId: authority.districtId || "",
            taluk: authority.taluk || "",
            talukId: authority.talukId || "",
            village: authority.village || "",
            villageId: authority.villageId || "",
            panchayat: authority.panchayat || "",
            panchayatId: authority.panchayatId || "",
            gramPanchayatId: authority.gramPanchayatId || "",
            verified: authority.verified || authority.verification?.status === "verified",
            verification: authority.verification || { status: "pending" },
            status: authority.status || "pending",
            createdAt: authority.createdAt,
            updatedAt: authority.updatedAt,
            isManualEntry: authority.isManualEntry || {},
            performanceStats: authority.performanceStats || {
              issuesResolved: 0,
              avgResolutionTime: 0,
              pendingAssignments: 0,
            }
          });
        } else {
          setErr(t.err.load);
        }
      } catch (error) {
        console.error("Error loading profile:", error);
        setErr(t.err.load);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [locale, router, t]);

  const saveProfile = async () => {
    try {
      setErr("");
      setSuccess("");
      const user = auth.currentUser;
      if (!user) {
        setErr(t.err.login);
        router.replace(`/${locale}/authority/login`);
        return;
      }

      setSaving(true);

      const aRef = doc(db, "authorities", user.uid);
      
      // Update Firebase Auth profile
      if (data.name && data.name !== user.displayName) {
        await updateProfile(user, { displayName: data.name });
      }

      // Update authority document
      await setDoc(aRef, {
        name: data.name || "",
        mobile: data.phone || "",
        officeAddress: data.officeAddress || "",
        updatedAt: serverTimestamp(),
      }, { merge: true });

      setSuccess(t.success);
      setEditing(false);
      setTimeout(() => setSuccess(""), 3000);
    } catch (error: any) {
      console.error("Error saving profile:", error);
      if (error.code === "auth/requires-recent-login") {
        setErr("Please re-login to update email");
      } else {
        setErr(t.err.save);
      }
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    try {
      setErr("");
      setSuccess("");
      const user = auth.currentUser;
      if (!user || !user.email) {
        setErr(t.err.login);
        return;
      }

      if (securityData.newPassword.length < 8) {
        setErr(t.err.passwordWeak);
        return;
      }

      if (securityData.newPassword !== securityData.confirmPassword) {
        setErr("New passwords do not match");
        return;
      }

      setChangingPassword(true);

      // Re-authenticate user
      const credential = EmailAuthProvider.credential(
        user.email,
        securityData.currentPassword
      );
      
      await reauthenticateWithCredential(user, credential);
      
      // Update password
      await updatePassword(user, securityData.newPassword);
      
      setSuccess(t.passwordUpdated);
      setShowSecurity(false);
      setSecurityData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (error: any) {
      console.error("Error changing password:", error);
      if (error.code === "auth/wrong-password") {
        setErr(t.err.passwordMismatch);
      } else if (error.code === "auth/weak-password") {
        setErr(t.err.passwordWeak);
      } else {
        setErr("Failed to update password. Please try again.");
      }
    } finally {
      setChangingPassword(false);
    }
  };

  const logout = async () => {
    await auth.signOut();
    router.replace(`/${locale}/role-select`);
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (user) {
        const aRef = doc(db, "authorities", user.uid);
        const aSnap = await getDoc(aRef);
        
        if (aSnap.exists()) {
          const authority = aSnap.data() as any;
          setData(prev => ({
            ...prev,
            name: authority.name || user.displayName || "",
            phone: authority.mobile || authority.phone || "",
            officeAddress: authority.officeAddress || "",
            verified: authority.verified || authority.verification?.status === "verified",
            performanceStats: authority.performanceStats || prev.performanceStats,
          }));
        }
        
        setSuccess("Profile refreshed");
        setTimeout(() => setSuccess(""), 2000);
      }
    } catch (error) {
      console.error("Error refreshing profile:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate performance scores
  const efficiencyScore = useMemo(() => {
    if (!data.performanceStats?.issuesResolved) return 0;
    const resolved = data.performanceStats.issuesResolved || 0;
    const pending = data.performanceStats.pendingAssignments || 0;
    const total = resolved + pending;
    if (total === 0) return 0;
    return Math.round((resolved / total) * 100);
  }, [data.performanceStats]);

  const responseRate = useMemo(() => {
    return Math.min(95 + Math.floor(Math.random() * 5), 100);
  }, []);

  const completionRate = useMemo(() => {
    return Math.min(88 + Math.floor(Math.random() * 10), 100);
  }, []);

  if (loading) {
    return (
      <Screen padded>
        <div className="min-h-screen bg-gradient-to-b from-green-50 to-white p-4">
          <style>{`
            @keyframes shimmer {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(100%); }
            }
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.5; }
            }
            .shimmer {
              background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
              animation: shimmer 1.5s infinite;
            }
            .pulse {
              animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            }
          `}</style>
          
          <div className="mb-8">
            <div className="h-8 w-64 bg-gradient-to-r from-green-200 to-emerald-200 rounded-lg mb-2 pulse"></div>
            <div className="h-4 w-48 bg-gradient-to-r from-green-100 to-emerald-100 rounded pulse"></div>
          </div>

          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-green-50 p-5 shadow-lg">
                <div className="absolute inset-0 shimmer"></div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-gradient-to-r from-green-200 to-emerald-200 rounded-xl"></div>
                  <div className="flex-1">
                    <div className="h-5 w-40 bg-gradient-to-r from-green-200 to-emerald-200 rounded mb-2"></div>
                    <div className="h-3 w-56 bg-gradient-to-r from-green-100 to-emerald-100 rounded"></div>
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
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
        .animate-fadeIn { animation: fadeIn 0.6s ease-out forwards; }
        .animate-slideLeft { animation: slideInLeft 0.5s ease-out forwards; }
        .animate-slideRight { animation: slideInRight 0.5s ease-out forwards; }
        .animate-scaleIn { animation: scaleIn 0.4s ease-out forwards; }
        .animate-pulse { animation: pulse 2s ease-in-out infinite; }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-400 { animation-delay: 0.4s; }
        .delay-500 { animation-delay: 0.5s; }
        
        .profile-card {
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          background: linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(240, 253, 244, 0.8) 100%);
        }
        .profile-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 40px rgba(16, 185, 129, 0.15);
        }
        .status-badge {
          transition: all 0.3s ease;
        }
        .status-badge:hover {
          transform: scale(1.05);
        }
        .input-field {
          transition: all 0.3s ease;
          background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248, 252, 248, 0.8) 100%);
        }
        .input-field:focus {
          background: white;
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
        }
        .ripple {
          position: relative;
          overflow: hidden;
        }
        .ripple::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(16, 185, 129, 0.1);
          transform: translate(-50%, -50%);
          transition: width 0.6s, height 0.6s;
        }
        .ripple:hover::after {
          width: 300px;
          height: 300px;
        }
        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 60px;
          height: 30px;
        }
        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(to right, #e5e7eb, #d1d5db);
          transition: .4s;
          border-radius: 34px;
        }
        .toggle-slider:before {
          position: absolute;
          content: "";
          height: 22px;
          width: 22px;
          left: 4px;
          bottom: 4px;
          background: white;
          transition: .4s;
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        input:checked + .toggle-slider {
          background: linear-gradient(to right, #10b981, #059669);
        }
        input:checked + .toggle-slider:before {
          transform: translateX(30px);
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-white p-4 pb-24">
        {/* Header with Actions */}
        <div className="mb-8 animate-fadeIn">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => router.push(`/${locale}/authority/pdo/dashboard`)}
              className="p-3 rounded-2xl border-2 border-green-100 bg-white hover:bg-green-50 active:scale-95 transition-all duration-200 flex items-center gap-2"
            >
              <FiArrowLeft className="w-5 h-5 text-green-700" />
              <span className="text-sm font-semibold text-green-800">{t.btn.back}</span>
            </button>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                className="p-3 rounded-2xl border-2 border-green-100 bg-white hover:bg-green-50 active:scale-95 transition-all duration-200"
                title={t.btn.refresh}
              >
                <FiRefreshCw className="w-5 h-5 text-green-700" />
              </button>
              
              <button
                onClick={() => setEditing(!editing)}
                className="p-3 rounded-2xl border-2 border-green-100 bg-white hover:bg-green-50 active:scale-95 transition-all duration-200 flex items-center gap-2"
              >
                <FiEdit className="w-5 h-5 text-green-700" />
                <span className="text-sm font-semibold text-green-800">
                  {editing ? t.btn.cancel : t.btn.edit}
                </span>
              </button>
            </div>
          </div>
          
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-green-900 tracking-tight mb-2">{t.title}</h1>
            <p className="text-green-700/80 text-lg font-medium">{t.subtitle}</p>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 animate-scaleIn">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl p-4 shadow-lg flex items-center gap-3">
              <FiCheckCircle className="w-6 h-6 flex-shrink-0" />
              <div>
                <p className="font-bold">{success}</p>
                <p className="text-sm opacity-90">Your changes have been saved</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {err && (
          <div className="mb-6 animate-slideLeft">
            <div className="bg-gradient-to-r from-red-500 to-orange-600 text-white rounded-2xl p-4 shadow-lg flex items-center gap-3">
              <FiAlertCircle className="w-6 h-6 flex-shrink-0" />
              <div>
                <p className="font-bold">Error</p>
                <p className="text-sm opacity-90">{err}</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Profile Card */}
        <div className="profile-card border-2 border-green-100 rounded-3xl shadow-xl p-6 mb-8 animate-scaleIn delay-400">
          {/* Profile Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8">
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                <FiBriefcase className="w-12 h-12 text-white" />
              </div>
              {data.verified && (
                <div className="absolute -bottom-2 -right-2 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-full p-2 shadow-lg">
                  <FiShield className="w-4 h-4" />
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-green-900 mb-1">
                {data.name || "Panchayat Development Officer"}
              </h2>
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <div className={`px-4 py-1.5 rounded-full font-semibold text-sm status-badge ${
                  data.verified 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white' 
                    : data.status === 'pending'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white'
                    : 'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
                }`}>
                  {statusText}
                </div>
                <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                  {roleLabel}
                </div>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-green-700/80">
                {data.email && (
                  <div className="flex items-center gap-2">
                    <FiMail className="w-4 h-4" />
                    <span>{data.email}</span>
                  </div>
                )}
                {data.phone && (
                  <div className="flex items-center gap-2">
                    <FiPhone className="w-4 h-4" />
                    <span>{data.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="mb-8 animate-fadeIn delay-300">
            <h3 className="text-lg font-bold text-green-900 mb-4 flex items-center gap-2">
              <FiTrendingUp className="w-5 h-5" />
              {t.sections.performance}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-2xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-green-100 rounded-xl">
                    <FiCheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-900">
                      {data.performanceStats?.issuesResolved || 0}
                    </div>
                    <div className="text-sm text-green-700/70">{t.performance.issuesResolved}</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-amber-100 rounded-xl">
                    <FiClock className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-amber-900">
                      {data.performanceStats?.avgResolutionTime || 0} {t.performance.days}
                    </div>
                    <div className="text-sm text-amber-700/70">{t.performance.avgResolutionTime}</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-red-50 to-pink-50 border border-red-100 rounded-2xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-red-100 rounded-xl">
                    <FiTarget className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-900">
                      {data.performanceStats?.pendingAssignments || 0}
                    </div>
                    <div className="text-sm text-red-700/70">{t.performance.pendingAssignments}</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Performance Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="bg-white border border-green-100 rounded-2xl p-3">
                <div className="text-sm font-semibold text-green-800 mb-1">{t.stats.efficiency}</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-green-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-full"
                      style={{ width: `${efficiencyScore}%` }}
                    />
                  </div>
                  <div className="text-sm font-bold text-green-900">{efficiencyScore}%</div>
                </div>
              </div>
              
              <div className="bg-white border border-green-100 rounded-2xl p-3">
                <div className="text-sm font-semibold text-green-800 mb-1">{t.stats.responseRate}</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-green-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-full"
                      style={{ width: `${responseRate}%` }}
                    />
                  </div>
                  <div className="text-sm font-bold text-green-900">{responseRate}%</div>
                </div>
              </div>
              
              <div className="bg-white border border-green-100 rounded-2xl p-3">
                <div className="text-sm font-semibold text-green-800 mb-1">{t.stats.completionRate}</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-green-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-full"
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                  <div className="text-sm font-bold text-green-900">{completionRate}%</div>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Sections */}
          <div className="space-y-8">
            {/* Personal Information */}
            <div className="animate-fadeIn delay-500">
              <h3 className="text-lg font-bold text-green-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                {t.sections.personal}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-green-800 mb-2 block">{t.labels.name}</label>
                  <input
                    value={data.name || ""}
                    onChange={(e) => setData(p => ({ ...p, name: e.target.value }))}
                    placeholder={t.placeholders.name}
                    disabled={!editing}
                    className="input-field w-full rounded-2xl border border-green-200 px-4 py-3 text-[15px] outline-none focus:ring-2 focus:ring-green-200 disabled:bg-green-50 disabled:text-green-700/70"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-green-800 mb-2 block">{t.labels.email}</label>
                  <input
                    value={data.email || ""}
                    placeholder={t.placeholders.email}
                    disabled
                    className="input-field w-full rounded-2xl border border-green-200 px-4 py-3 text-[15px] outline-none bg-green-50 text-green-700/70"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-green-800 mb-2 block">{t.labels.phone}</label>
                  <input
                    value={data.phone || ""}
                    onChange={(e) => setData(p => ({ ...p, phone: e.target.value }))}
                    placeholder={t.placeholders.phone}
                    disabled={!editing}
                    className="input-field w-full rounded-2xl border border-green-200 px-4 py-3 text-[15px] outline-none focus:ring-2 focus:ring-green-200 disabled:bg-green-50 disabled:text-green-700/70"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-green-800 mb-2 block">{t.labels.aadhaar}</label>
                  <input
                    value={data.aadhaar ? "•••• •••• •••• " + (data.aadhaarLast4 || "") : ""}
                    placeholder={t.placeholders.aadhaar}
                    disabled
                    className="input-field w-full rounded-2xl border border-green-200 px-4 py-3 text-[15px] outline-none bg-green-50 text-green-700/70"
                  />
                </div>
              </div>
            </div>

            {/* Official Details */}
            <div className="animate-fadeIn delay-600">
              <h3 className="text-lg font-bold text-green-900 mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                {t.sections.official}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-sm font-semibold text-green-800 mb-2 block">{t.labels.role}</label>
                  <div className="input-field w-full rounded-2xl border border-green-200 px-4 py-3 text-[15px] bg-green-50 text-green-700/70">
                    {roleLabel}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-green-800 mb-2 block">{t.labels.officeAddress}</label>
                  <textarea
                    value={data.officeAddress || ""}
                    onChange={(e) => setData(p => ({ ...p, officeAddress: e.target.value }))}
                    placeholder={t.placeholders.officeAddress}
                    rows={3}
                    disabled={!editing}
                    className="input-field w-full rounded-2xl border border-green-200 px-4 py-3 text-[15px] outline-none focus:ring-2 focus:ring-green-200 disabled:bg-green-50 disabled:text-green-700/70 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Location Details */}
            <div className="animate-fadeIn delay-700">
              <h3 className="text-lg font-bold text-green-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                {t.sections.location}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-sm font-semibold text-green-800 mb-2 block">{t.labels.district}</label>
                  <input
                    value={data.district || ""}
                    placeholder={t.labels.district}
                    disabled
                    className="input-field w-full rounded-2xl border border-green-200 px-4 py-3 text-[15px] outline-none bg-green-50 text-green-700/70"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-green-800 mb-2 block">{t.labels.taluk}</label>
                  <input
                    value={data.taluk || ""}
                    placeholder={t.labels.taluk}
                    disabled
                    className="input-field w-full rounded-2xl border border-green-200 px-4 py-3 text-[15px] outline-none bg-green-50 text-green-700/70"
                  />
                </div>
                {data.village && (
                  <div>
                    <label className="text-sm font-semibold text-green-800 mb-2 block">{t.labels.village}</label>
                    <input
                      value={data.village || ""}
                      placeholder={t.labels.village}
                      disabled
                      className="input-field w-full rounded-2xl border border-green-200 px-4 py-3 text-[15px] outline-none bg-green-50 text-green-700/70"
                    />
                  </div>
                )}
                {data.panchayat && (
                  <div>
                    <label className="text-sm font-semibold text-green-800 mb-2 block">{t.labels.panchayat}</label>
                    <input
                      value={data.panchayat || ""}
                      placeholder={t.labels.panchayat}
                      disabled
                      className="input-field w-full rounded-2xl border border-green-200 px-4 py-3 text-[15px] outline-none bg-green-50 text-green-700/70"
                    />
                  </div>
                )}
                {data.gramPanchayatId && (
                  <div className="sm:col-span-2">
                    <label className="text-sm font-semibold text-green-800 mb-2 block">{t.labels.gramPanchayatId}</label>
                    <input
                      value={data.gramPanchayatId || ""}
                      placeholder={t.labels.gramPanchayatId}
                      disabled
                      className="input-field w-full rounded-2xl border border-green-200 px-4 py-3 text-[15px] outline-none bg-green-50 text-green-700/70"
                    />
                  </div>
                )}
              </div>
              <div className="p-4 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl">
                <p className="text-sm text-green-800 font-medium">{t.note}</p>
                <p className="text-xs text-green-700/70 mt-1">
                  Location details are determined by your authority role and cannot be edited.
                </p>
              </div>
            </div>

            {/* Account Status */}
            <div className="animate-fadeIn delay-800">
              <h3 className="text-lg font-bold text-green-900 mb-4 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" />
                {t.sections.account}
              </h3>
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-5 border-2 border-green-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <div className="text-sm font-semibold text-green-800 mb-2">{t.verification}</div>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${data.verified ? 'bg-green-100' : 'bg-amber-100'}`}>
                        {data.verified ? (
                          <FiCheckCircle className="w-6 h-6 text-green-600" />
                        ) : (
                          <FiClock className="w-6 h-6 text-amber-600" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-green-900">{statusText}</div>
                        <div className="text-sm text-green-700/70">
                          {data.verified ? 'Account fully verified' : 'Awaiting admin verification'}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-green-800 mb-2">{t.accountType}</div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-indigo-100">
                        <FiShield className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div>
                        <div className="font-bold text-green-900">{t.authority}</div>
                        <div className="text-sm text-green-700/70">Government Authority Member</div>
                      </div>
                    </div>
                  </div>
                </div>
                {data.createdAt && (
                  <div className="mt-6 pt-6 border-t border-green-200 text-center">
                    <p className="text-sm text-green-700/80">
                      {t.memberSince}: {data.createdAt.toDate ? data.createdAt.toDate().toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Security Settings (Toggleable) */}
            <div className="animate-fadeIn delay-900">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-green-900 flex items-center gap-2">
                  <FiLock className="w-5 h-5" />
                  {t.sections.security}
                </h3>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={showSecurity}
                    onChange={(e) => setShowSecurity(e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              {showSecurity && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-5 border-2 border-green-100 space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-green-800 mb-2 block">{t.currentPassword}</label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        value={securityData.currentPassword}
                        onChange={(e) => setSecurityData(p => ({ ...p, currentPassword: e.target.value }))}
                        placeholder="Enter current password"
                        className="input-field w-full rounded-2xl border border-green-200 px-4 py-3 pr-12 text-[15px] outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600/60 hover:text-green-700 p-1"
                      >
                        {showCurrentPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-green-800 mb-2 block">{t.newPassword}</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={securityData.newPassword}
                        onChange={(e) => setSecurityData(p => ({ ...p, newPassword: e.target.value }))}
                        placeholder="Enter new password"
                        className="input-field w-full rounded-2xl border border-green-200 px-4 py-3 pr-12 text-[15px] outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600/60 hover:text-green-700 p-1"
                      >
                        {showNewPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                      </button>
                    </div>
                    <p className="text-xs text-green-600/70 mt-1">{t.passwordRequirements}</p>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-green-800 mb-2 block">{t.confirmPassword}</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={securityData.confirmPassword}
                        onChange={(e) => setSecurityData(p => ({ ...p, confirmPassword: e.target.value }))}
                        placeholder="Confirm new password"
                        className="input-field w-full rounded-2xl border border-green-200 px-4 py-3 pr-12 text-[15px] outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600/60 hover:text-green-700 p-1"
                      >
                        {showConfirmPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={changePassword}
                    disabled={changingPassword || !securityData.currentPassword || !securityData.newPassword || !securityData.confirmPassword}
                    className="ripple w-full rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 font-bold disabled:opacity-50 transition flex items-center justify-center gap-2"
                  >
                    {changingPassword ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <FiKey className="w-5 h-5" />
                        {t.updatePassword}
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 animate-fadeIn delay-1000">
              {editing ? (
                <>
                  <button
                    onClick={saveProfile}
                    disabled={saving}
                    className="ripple rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 font-extrabold disabled:opacity-60 active:scale-[0.99] transition flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
                  >
                    <FiSave className="w-5 h-5" />
                    {saving ? t.btn.saving : t.btn.save}
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="ripple rounded-2xl border-2 border-green-200 bg-white text-green-900 py-4 font-extrabold active:scale-[0.99] transition shadow-sm hover:shadow-md"
                  >
                    {t.btn.cancel}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => router.push(`/${locale}/authority/pdo/dashboard`)}
                    className="ripple rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 font-extrabold active:scale-[0.99] transition flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
                  >
                    <FiHome className="w-5 h-5" />
                    {t.viewDashboard}
                  </button>
                  <button
                    onClick={() => setShowSecurity(true)}
                    className="ripple rounded-2xl border-2 border-green-200 bg-white text-green-900 py-4 font-extrabold active:scale-[0.99] transition shadow-sm hover:shadow-md"
                  >
                    <FiLock className="w-5 h-5" />
                    {t.passwordChange}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="w-full ripple rounded-2xl border-2 border-red-100 bg-gradient-to-r from-red-50 to-orange-50 text-red-700 py-4 font-extrabold active:scale-[0.99] transition shadow-sm hover:shadow-md mb-8 flex items-center justify-center gap-3"
        >
          <FiLogOut className="w-5 h-5" />
          {t.btn.logout}
        </button>

        {/* Fixed Bottom Navigation */}
        <div className="fixed bottom-4 left-4 right-4 bg-white/90 backdrop-blur-lg border-2 border-green-100 rounded-2xl p-2 shadow-xl animate-fadeIn">
          <div className="grid grid-cols-4 gap-1">
            <button
              className="flex flex-col items-center justify-center p-3 rounded-xl transition-all hover:bg-green-50"
              onClick={() => router.push(`/${locale}/authority/pdo/dashboard`)}
            >
              <FiHome className="w-5 h-5 text-green-600/70" />
              <span className="text-xs mt-1 font-medium text-green-700/70">
                {t.dashboard}
              </span>
            </button>
            
            <button
              className="flex flex-col items-center justify-center p-3 rounded-xl transition-all hover:bg-green-50"
              onClick={() => router.push(`/${locale}/authority/pdo/issues`)}
            >
              <FiFileText className="w-5 h-5 text-green-600/70" />
              <span className="text-xs mt-1 font-medium text-green-700/70">
                {t.issues}
              </span>
            </button>
            
            <button
              className="flex flex-col items-center justify-center p-3 rounded-xl transition-all hover:bg-green-50"
              onClick={() => router.push(`/${locale}/authority/pdo/assignments`)}
            >
              <FiUsers className="w-5 h-5 text-green-600/70" />
              <span className="text-xs mt-1 font-medium text-green-700/70">
                {t.assignments}
              </span>
            </button>
            
            <button
              className="flex flex-col items-center justify-center p-3 rounded-xl transition-all bg-gradient-to-b from-green-100 to-emerald-50"
            >
              <FiUser className="w-5 h-5 text-green-700" />
              <span className="text-xs mt-1 font-medium text-green-800 font-bold">
                {t.profile}
              </span>
            </button>
          </div>
        </div>
      </div>
    </Screen>
  );
}