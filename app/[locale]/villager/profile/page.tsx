"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth, db } from "../../../lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs } from "firebase/firestore";
import Screen from "../../../components/Screen";
import { 
  FiUser, 
  FiLogOut,
  FiHome,
  FiList,
  FiTrendingUp,
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
  FiArrowLeft
} from "react-icons/fi";

type Locale = "en" | "kn" | "hi";

type VillagerProfile = {
    uid: string;
    name?: string;
    email?: string;
    phone?: string;
    panchayatId?: string;
    taluk?: string;
    district?: string;
    address?: string;
    verified?: boolean;
    status?: "pending" | "active" | "blocked" | string;
    createdAt?: any;
    updatedAt?: any;
    panchayatName?: string;
    gramPanchayatId?: string;
};

export default function VillagerProfilePage() {
    const router = useRouter();
    const { locale = "en" } = useParams() as { locale: Locale };

    const t = useMemo(() => {
        const L: Record<Locale, any> = {
            en: {
                title: "My Profile",
                subtitle: "Manage your account and settings",
                labels: {
                    name: "Full Name",
                    email: "Email Address",
                    phone: "Phone Number",
                    panchayatId: "Panchayat ID",
                    taluk: "Taluk",
                    district: "District",
                    address: "Full Address",
                    panchayatName: "Panchayat Name",
                    gramPanchayatId: "Gram Panchayat ID",
                },
                placeholders: {
                    name: "Enter your full name",
                    email: "Enter email address",
                    phone: "Enter phone number",
                    panchayatId: "Enter Panchayat ID",
                    taluk: "Enter Taluk",
                    district: "Enter District",
                    address: "House number, Street, Landmark",
                    panchayatName: "Auto-filled from database",
                    gramPanchayatId: "Auto-filled from database",
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
                    raise: "Report Issue",
                    logout: "Logout",
                    back: "Back to Dashboard",
                    refresh: "Refresh",
                },
                sections: {
                    personal: "Personal Information",
                    location: "Location Details",
                    account: "Account Status",
                    security: "Security",
                },
                stats: {
                    totalIssues: "Total Issues",
                    pendingIssues: "Pending Issues",
                    resolvedIssues: "Resolved Issues",
                },
                err: {
                    login: "Please login as villager.",
                    load: "Could not load profile.",
                    save: "Could not save profile.",
                },
                note: "Note: Panchayat ID must match while raising issues for proper assignment.",
                success: "Profile updated successfully!",
                lastUpdated: "Last updated",
                memberSince: "Member since",
                verification: "Verification Status",
                accountType: "Account Type",
                villager: "Villager",
                editProfile: "Edit Profile",
                viewActivity: "View Activity",
                privacy: "Privacy Settings",
                help: "Help & Support",
                dashboard: "Dashboard",
                track: "My Issues",
                tracking: "Issue Tracking",
                profile: "Profile",
            },
            kn: {
                title: "ನನ್ನ ಪ್ರೊಫೈಲ್",
                subtitle: "ನಿಮ್ಮ ಖಾತೆ ಮತ್ತು ಸೆಟ್ಟಿಂಗ್‌ಗಳನ್ನು ನಿರ್ವಹಿಸಿ",
                labels: {
                    name: "ಪೂರ್ಣ ಹೆಸರು",
                    email: "ಇಮೇಲ್ ವಿಳಾಸ",
                    phone: "ಫೋನ್ ಸಂಖ್ಯೆ",
                    panchayatId: "ಪಂಚಾಯತ್ ಐಡಿ",
                    taluk: "ತಾಲೂಕು",
                    district: "ಜಿಲ್ಲೆ",
                    address: "ಪೂರ್ಣ ವಿಳಾಸ",
                    panchayatName: "ಪಂಚಾಯಿತಿ ಹೆಸರು",
                    gramPanchayatId: "ಗ್ರಾಮ ಪಂಚಾಯಿತಿ ಐಡಿ",
                },
                placeholders: {
                    name: "ನಿಮ್ಮ ಪೂರ್ಣ ಹೆಸರನ್ನು ನಮೂದಿಸಿ",
                    email: "ಇಮೇಲ್ ವಿಳಾಸ ನಮೂದಿಸಿ",
                    phone: "ಫೋನ್ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ",
                    panchayatId: "ಪಂಚಾಯತ್ ಐಡಿ ನಮೂದಿಸಿ",
                    taluk: "ತಾಲೂಕು ನಮೂದಿಸಿ",
                    district: "ಜಿಲ್ಲೆ ನಮೂದಿಸಿ",
                    address: "ಮನೆ ಸಂಖ್ಯೆ, ರಸ್ತೆ, ಗುರುತು",
                    panchayatName: "ಡೇಟಾಬೇಸ್‌ನಿಂದ ಸ್ವಯಂ ಭರ್ತಿ",
                    gramPanchayatId: "ಡೇಟಾಬೇಸ್‌ನಿಂದ ಸ್ವಯಂ ಭರ್ತಿ",
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
                    raise: "ಸಮಸ್ಯೆ ವರದಿ ಮಾಡಿ",
                    logout: "ಲಾಗ್‌ಔಟ್",
                    back: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಹಿಂದಿರುಗಿ",
                    refresh: "ರಿಫ್ರೆಶ್",
                },
                sections: {
                    personal: "ವೈಯಕ್ತಿಕ ಮಾಹಿತಿ",
                    location: "ಸ್ಥಳ ವಿವರಗಳು",
                    account: "ಖಾತೆ ಸ್ಥಿತಿ",
                    security: "ಭದ್ರತೆ",
                },
                stats: {
                    totalIssues: "ಒಟ್ಟು ಸಮಸ್ಯೆಗಳು",
                    pendingIssues: "ಬಾಕಿ ಸಮಸ್ಯೆಗಳು",
                    resolvedIssues: "ಪರಿಹಾರಗೊಂಡ ಸಮಸ್ಯೆಗಳು",
                },
                err: {
                    login: "ದಯವಿಟ್ಟು ಗ್ರಾಮಸ್ಥರಾಗಿ ಲಾಗಿನ್ ಆಗಿ.",
                    load: "ಪ್ರೊಫೈಲ್ ಲೋಡ್ ಆಗಲಿಲ್ಲ.",
                    save: "ಪ್ರೊಫೈಲ್ ಉಳಿಸಲಾಗಲಿಲ್ಲ.",
                },
                note: "ಸೂಚನೆ: ಸಮಸ್ಯೆ ವರದಿ ಮಾಡುವಾಗ ಪಂಚಾಯತ್ ಐಡಿ ಹೊಂದಾಣಿಕೆಯಾಗಬೇಕು.",
                success: "ಪ್ರೊಫೈಲ್ ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ!",
                lastUpdated: "ಕೊನೆಯ ನವೀಕರಣ",
                memberSince: "ಸದಸ್ಯರಾಗಿ ಸೇರಿದ್ದು",
                verification: "ಪರಿಶೀಲನೆ ಸ್ಥಿತಿ",
                accountType: "ಖಾತೆ ವಿಧ",
                villager: "ಗ್ರಾಮಸ್ಥ",
                editProfile: "ಪ್ರೊಫೈಲ್ ಸಂಪಾದಿಸಿ",
                viewActivity: "ಚಟುವಟಿಕೆ ವೀಕ್ಷಿಸಿ",
                privacy: "ಗೌಪ್ಯತಾ ಸೆಟ್ಟಿಂಗ್‌ಗಳು",
                help: "ಸಹಾಯ ಮತ್ತು ಬೆಂಬಲ",
                dashboard: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
                track: "ನನ್ನ ಸಮಸ್ಯೆಗಳು",
                tracking: "ಸಮಸ್ಯೆ ಟ್ರ್ಯಾಕಿಂಗ್",
                profile: "ಪ್ರೊಫೈಲ್",
            },
            hi: {
                title: "मेरी प्रोफ़ाइल",
                subtitle: "अपने खाते और सेटिंग्स प्रबंधित करें",
                labels: {
                    name: "पूरा नाम",
                    email: "ईमेल पता",
                    phone: "फोन नंबर",
                    panchayatId: "पंचायत आईडी",
                    taluk: "तालुक",
                    district: "जिला",
                    address: "पूरा पता",
                    panchayatName: "पंचायत नाम",
                    gramPanchayatId: "ग्राम पंचायत आईडी",
                },
                placeholders: {
                    name: "अपना पूरा नाम दर्ज करें",
                    email: "ईमेल पता दर्ज करें",
                    phone: "फोन नंबर दर्ज करें",
                    panchayatId: "पंचायत आईडी दर्ज करें",
                    taluk: "तालुक दर्ज करें",
                    district: "जिला दर्ज करें",
                    address: "मकान नंबर, गली, लैंडमार्क",
                    panchayatName: "डेटाबेस से स्वतः भरा गया",
                    gramPanchayatId: "डेटाबेस से स्वतः भरा गया",
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
                    raise: "समस्या रिपोर्ट करें",
                    logout: "लॉगआउट",
                    back: "डैशबोर्ड पर वापस जाएं",
                    refresh: "रिफ्रेश",
                },
                sections: {
                    personal: "व्यक्तिगत जानकारी",
                    location: "स्थान विवरण",
                    account: "खाता स्थिति",
                    security: "सुरक्षा",
                },
                stats: {
                    totalIssues: "कुल समस्याएं",
                    pendingIssues: "लंबित समस्याएं",
                    resolvedIssues: "हल की गई समस्याएं",
                },
                err: {
                    login: "कृपया ग्रामीण के रूप में लॉगिन करें।",
                    load: "प्रोफ़ाइल लोड नहीं हुई।",
                    save: "प्रोफ़ाइल सेव नहीं हुई।",
                },
                note: "नोट: समस्या रिपोर्ट करते समय पंचायत आईडी मेल खाना चाहिए।",
                success: "प्रोफ़ाइल सफलतापूर्वक अपडेट की गई!",
                lastUpdated: "अंतिम अपडेट",
                memberSince: "सदस्यता तिथि",
                verification: "सत्यापन स्थिति",
                accountType: "खाता प्रकार",
                villager: "ग्रामीण",
                editProfile: "प्रोफ़ाइल संपादित करें",
                viewActivity: "गतिविधि देखें",
                privacy: "प्राइवेसी सेटिंग्स",
                help: "सहायता और समर्थन",
                dashboard: "डैशबोर्ड",
                track: "मेरे मुद्दे",
                tracking: "समस्या ट्रैकिंग",
                profile: "प्रोफ़ाइल",
            },
        };
        return L[locale];
    }, [locale]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState("");
    const [success, setSuccess] = useState(false);
    const [editing, setEditing] = useState(false);
    const [issueStats, setIssueStats] = useState({
        total: 0,
        pending: 0,
        resolved: 0,
    });

    const [data, setData] = useState<VillagerProfile>({
        uid: "",
        name: "",
        email: "",
        phone: "",
        panchayatId: "",
        taluk: "",
        district: "",
        address: "",
        verified: false,
        status: "pending",
    });

    const statusText = useMemo(() => {
        if (data.verified === true) return t.status.verified;
        if (data.status === "pending" || data.verified === false) return t.status.pending;
        if (data.status === "active") return t.status.active;
        if (data.status === "blocked") return t.status.blocked;
        return t.status.unknown;
    }, [data.verified, data.status, t]);

    // Function to fetch panchayat details from database
    const fetchPanchayatDetails = async (panchayatId: string) => {
        try {
            // Try to find panchayat in panchayats collection
            const panchayatQuery = query(
                collection(db, "panchayats"),
                where("id", "==", panchayatId)
            );
            const panchayatSnap = await getDocs(panchayatQuery);
            
            if (!panchayatSnap.empty) {
                const panchayatData = panchayatSnap.docs[0].data();
                return {
                    name: panchayatData.name || "",
                    gramPanchayatId: panchayatData.gramPanchayatId || "",
                    district: panchayatData.districtName || "",
                    taluk: panchayatData.talukName || ""
                };
            }
            
            // If not found in panchayats, try in authorities collection
            const authorityQuery = query(
                collection(db, "authorities"),
                where("panchayatId", "==", panchayatId)
            );
            const authoritySnap = await getDocs(authorityQuery);
            
            if (!authoritySnap.empty) {
                const authorityData = authoritySnap.docs[0].data();
                return {
                    name: authorityData.panchayat || "",
                    gramPanchayatId: authorityData.gramPanchayatId || "",
                    district: authorityData.district || "",
                    taluk: authorityData.taluk || ""
                };
            }
            
            return null;
        } catch (error) {
            console.error("Error fetching panchayat details:", error);
            return null;
        }
    };

    useEffect(() => {
        const load = async () => {
            try {
                setErr("");
                const user = auth.currentUser;
                if (!user) {
                    setLoading(false);
                    setErr(t.err.login);
                    router.replace(`/${locale}/villager/login`);
                    return;
                }

                // Load profile data
                const vRef = doc(db, "villagers", user.uid);
                const vSnap = await getDoc(vRef);

                if (vSnap.exists()) {
                    const v = vSnap.data() as any;
                    
                    // Fetch panchayat details if panchayatId exists
                    let panchayatDetails = null;
                    if (v.panchayatId) {
                        panchayatDetails = await fetchPanchayatDetails(v.panchayatId);
                    }
                    
                    setData({
                        uid: user.uid,
                        name: v.name || "",
                        email: user.email || "",
                        phone: v.phone || "",
                        panchayatId: v.panchayatId || "",
                        panchayatName: panchayatDetails?.name || v.panchayatName || "",
                        gramPanchayatId: panchayatDetails?.gramPanchayatId || v.gramPanchayatId || "",
                        taluk: panchayatDetails?.taluk || v.taluk || "",
                        district: panchayatDetails?.district || v.district || "",
                        address: v.address || "",
                        verified: v.verified ?? false,
                        status: v.status || "pending",
                        createdAt: v.createdAt,
                        updatedAt: v.updatedAt,
                    });
                } else {
                    // Create minimal profile
                    await setDoc(
                        vRef,
                        {
                            uid: user.uid,
                            email: user.email,
                            verified: false,
                            status: "pending",
                            createdAt: serverTimestamp(),
                            updatedAt: serverTimestamp(),
                        },
                        { merge: true }
                    );
                    setData(prev => ({ ...prev, uid: user.uid, email: user.email || "" }));
                }

                // Load issue stats directly from Firestore
                try {
                    const issuesQuery = query(
                        collection(db, "issues"),
                        where("villagerId", "==", user.uid)
                    );
                    const issuesSnap = await getDocs(issuesQuery);
                    
                    let total = 0;
                    let pending = 0;
                    let resolved = 0;
                    
                    issuesSnap.forEach((doc) => {
                        total++;
                        const issueData = doc.data();
                        if (issueData.status === "resolved") {
                            resolved++;
                        } else {
                            pending++;
                        }
                    });
                    
                    setIssueStats({
                        total,
                        pending,
                        resolved,
                    });
                } catch (statsError) {
                    console.error("Error loading issue stats:", statsError);
                    // Keep default stats if error
                }

                setLoading(false);
            } catch {
                setLoading(false);
                setErr(t.err.load);
            }
        };

        load();
    }, [locale, router, t]);

    const save = async () => {
        try {
            setErr("");
            setSuccess(false);
            const user = auth.currentUser;
            if (!user) {
                setErr(t.err.login);
                router.replace(`/${locale}/villager/login`);
                return;
            }

            setSaving(true);

            const vRef = doc(db, "villagers", user.uid);

            await setDoc(
                vRef,
                {
                    uid: user.uid,
                    name: data.name || "",
                    email: user.email || data.email || "",
                    phone: data.phone || "",
                    panchayatId: data.panchayatId || "",
                    panchayatName: data.panchayatName || "",
                    gramPanchayatId: data.gramPanchayatId || "",
                    taluk: data.taluk || "",
                    district: data.district || "",
                    address: data.address || "",
                    updatedAt: serverTimestamp(),
                },
                { merge: true }
            );

            setSuccess(true);
            setEditing(false);
            setTimeout(() => setSuccess(false), 3000);
        } catch {
            setErr(t.err.save);
        } finally {
            setSaving(false);
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
                // Reload profile data
                const vRef = doc(db, "villagers", user.uid);
                const vSnap = await getDoc(vRef);
                
                if (vSnap.exists()) {
                    const v = vSnap.data() as any;
                    
                    // Fetch panchayat details if panchayatId exists
                    let panchayatDetails = null;
                    if (v.panchayatId) {
                        panchayatDetails = await fetchPanchayatDetails(v.panchayatId);
                    }
                    
                    setData(prev => ({
                        ...prev,
                        name: v.name || "",
                        phone: v.phone || "",
                        panchayatId: v.panchayatId || "",
                        panchayatName: panchayatDetails?.name || v.panchayatName || "",
                        gramPanchayatId: panchayatDetails?.gramPanchayatId || v.gramPanchayatId || "",
                        taluk: panchayatDetails?.taluk || v.taluk || "",
                        district: panchayatDetails?.district || v.district || "",
                        address: v.address || "",
                    }));
                }
                
                setSuccess(true);
                setTimeout(() => setSuccess(false), 2000);
            }
        } catch (error) {
            console.error("Error refreshing profile:", error);
        } finally {
            setLoading(false);
        }
    };

    // Loading skeleton remains the same...

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
                @keyframes countUp {
                    from { transform: translateY(10px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animate-fadeIn { animation: fadeIn 0.6s ease-out forwards; }
                .animate-slideLeft { animation: slideInLeft 0.5s ease-out forwards; }
                .animate-slideRight { animation: slideInRight 0.5s ease-out forwards; }
                .animate-scaleIn { animation: scaleIn 0.4s ease-out forwards; }
                .animate-pulse { animation: pulse 2s ease-in-out infinite; }
                .animate-float { animation: float 3s ease-in-out infinite; }
                .animate-count { animation: countUp 0.5s ease-out forwards; }
                .delay-100 { animation-delay: 0.1s; }
                .delay-200 { animation-delay: 0.2s; }
                .delay-300 { animation-delay: 0.3s; }
                .delay-400 { animation-delay: 0.4s; }
                .delay-500 { animation-delay: 0.5s; }
                
                .profile-card {
                    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                    background: linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(240,253,244,0.8) 100%);
                }
                .profile-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 20px 40px rgba(34, 197, 94, 0.15);
                }
                .status-badge {
                    transition: all 0.3s ease;
                }
                .status-badge:hover {
                    transform: scale(1.05);
                }
                .input-field {
                    transition: all 0.3s ease;
                    background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,252,249,0.8) 100%);
                }
                .input-field:focus {
                    background: white;
                    box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.1);
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
                    background: rgba(34, 197, 94, 0.1);
                    transform: translate(-50%, -50%);
                    transition: width 0.6s, height 0.6s;
                }
                .ripple:hover::after {
                    width: 300px;
                    height: 300px;
                }
            `}</style>

            <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-white p-4 pb-24">
                {/* Header with Actions */}
                <div className="mb-8 animate-fadeIn">
                    <div className="flex items-center justify-between mb-6">
                        <button
                            onClick={() => router.push(`/${locale}/villager/dashboard`)}
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
                                <span className="text-sm font-semibold text-green-800">{t.editProfile}</span>
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
                                <p className="font-bold">{t.success}</p>
                                <p className="text-sm opacity-90">Your profile has been updated successfully</p>
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

                {/* Profile Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <div className="profile-card border-2 border-green-100 rounded-2xl p-5 shadow-lg animate-slideLeft delay-100">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-semibold text-green-800/80">{t.stats.totalIssues}</span>
                            <div className="p-2 bg-green-100 rounded-lg">
                                <FiAlertCircle className="w-5 h-5 text-green-600" />
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-green-900 animate-count">
                            {issueStats.total}
                        </div>
                        <div className="h-1 w-full bg-gradient-to-r from-green-200 to-transparent rounded-full mt-3"></div>
                    </div>

                    <div className="profile-card border-2 border-amber-100 rounded-2xl p-5 shadow-lg animate-fadeIn delay-200">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-semibold text-amber-800/80">{t.stats.pendingIssues}</span>
                            <div className="p-2 bg-amber-100 rounded-lg">
                                <FiClock className="w-5 h-5 text-amber-600" />
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-amber-900 animate-count">
                            {issueStats.pending}
                        </div>
                        <div className="h-1 w-full bg-gradient-to-r from-amber-200 to-transparent rounded-full mt-3"></div>
                    </div>

                    <div className="profile-card border-2 border-emerald-100 rounded-2xl p-5 shadow-lg animate-slideRight delay-300">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-semibold text-emerald-800/80">{t.stats.resolvedIssues}</span>
                            <div className="p-2 bg-emerald-100 rounded-lg">
                                <FiCheckCircle className="w-5 h-5 text-emerald-600" />
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-emerald-900 animate-count">
                            {issueStats.resolved}
                        </div>
                        <div className="h-1 w-full bg-gradient-to-r from-emerald-200 to-transparent rounded-full mt-3"></div>
                    </div>
                </div>

                {/* Main Profile Card */}
                <div className="profile-card border-2 border-green-100 rounded-3xl shadow-xl p-6 mb-8 animate-scaleIn delay-400">
                    {/* Profile Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                                <FiUser className="w-12 h-12 text-white" />
                            </div>
                            {data.verified && (
                                <div className="absolute -bottom-2 -right-2 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-full p-2 shadow-lg">
                                    <FiShield className="w-4 h-4" />
                                </div>
                            )}
                        </div>
                        
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-green-900 mb-1">
                                {data.name || "Anonymous Villager"}
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
                                <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                                    {t.villager}
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

                    {/* Profile Sections */}
                    <div className="space-y-8">
                        {/* Personal Information */}
                        <div className="animate-fadeIn delay-500">
                            <h3 className="text-lg font-bold text-green-900 mb-4 flex items-center gap-2">
                                <FiUser className="w-5 h-5" />
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
                            </div>
                        </div>

                        {/* Location Details */}
                        <div className="animate-fadeIn delay-600">
                            <h3 className="text-lg font-bold text-green-900 mb-4 flex items-center gap-2">
                                <FiMapPin className="w-5 h-5" />
                                {t.sections.location}
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="text-sm font-semibold text-green-800 mb-2 block">{t.labels.panchayatId}</label>
                                    <input
                                        value={data.panchayatId || ""}
                                        onChange={(e) => setData(p => ({ ...p, panchayatId: e.target.value }))}
                                        placeholder={t.placeholders.panchayatId}
                                        disabled={!editing}
                                        className="input-field w-full rounded-2xl border border-green-200 px-4 py-3 text-[15px] outline-none focus:ring-2 focus:ring-green-200 disabled:bg-green-50 disabled:text-green-700/70"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-green-800 mb-2 block">{t.labels.panchayatName}</label>
                                    <input
                                        value={data.panchayatName || ""}
                                        placeholder={t.placeholders.panchayatName}
                                        disabled
                                        className="input-field w-full rounded-2xl border border-green-200 px-4 py-3 text-[15px] outline-none bg-green-50 text-green-700/70"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-green-800 mb-2 block">{t.labels.gramPanchayatId}</label>
                                    <input
                                        value={data.gramPanchayatId || ""}
                                        placeholder={t.placeholders.gramPanchayatId}
                                        disabled
                                        className="input-field w-full rounded-2xl border border-green-200 px-4 py-3 text-[15px] outline-none bg-green-50 text-green-700/70"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-green-800 mb-2 block">{t.labels.taluk}</label>
                                    <input
                                        value={data.taluk || ""}
                                        onChange={(e) => setData(p => ({ ...p, taluk: e.target.value }))}
                                        placeholder={t.placeholders.taluk}
                                        disabled={!editing}
                                        className="input-field w-full rounded-2xl border border-green-200 px-4 py-3 text-[15px] outline-none focus:ring-2 focus:ring-green-200 disabled:bg-green-50 disabled:text-green-700/70"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-green-800 mb-2 block">{t.labels.district}</label>
                                    <input
                                        value={data.district || ""}
                                        onChange={(e) => setData(p => ({ ...p, district: e.target.value }))}
                                        placeholder={t.placeholders.district}
                                        disabled={!editing}
                                        className="input-field w-full rounded-2xl border border-green-200 px-4 py-3 text-[15px] outline-none focus:ring-2 focus:ring-green-200 disabled:bg-green-50 disabled:text-green-700/70"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-green-800 mb-2 block">{t.labels.address}</label>
                                <textarea
                                    value={data.address || ""}
                                    onChange={(e) => setData(p => ({ ...p, address: e.target.value }))}
                                    placeholder={t.placeholders.address}
                                    rows={3}
                                    disabled={!editing}
                                    className="input-field w-full rounded-2xl border border-green-200 px-4 py-3 text-[15px] outline-none focus:ring-2 focus:ring-green-200 disabled:bg-green-50 disabled:text-green-700/70 resize-none"
                                />
                            </div>
                        </div>

                        {/* Account Status */}
                        <div className="animate-fadeIn delay-700">
                            <h3 className="text-lg font-bold text-green-900 mb-4 flex items-center gap-2">
                                <FiShield className="w-5 h-5" />
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
                                                    {data.verified ? 'Account fully verified' : 'Verification in progress'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold text-green-800 mb-2">{t.accountType}</div>
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-xl bg-blue-100">
                                                <FiUser className="w-6 h-6 text-blue-600" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-green-900">{t.villager}</div>
                                                <div className="text-sm text-green-700/70">Regular village member</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {!editing && (
                                    <div className="mt-6 p-4 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl">
                                        <p className="text-sm text-green-800 font-medium">{t.note}</p>
                                        <p className="text-xs text-green-700/70 mt-1">
                                            Panchayat details are fetched from the database when authorities register.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 animate-fadeIn delay-800">
                            {editing ? (
                                <>
                                    <button
                                        onClick={save}
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
                                        Cancel Editing
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={() => router.push(`/${locale}/villager/raise-issue`)}
                                        className="ripple rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 font-extrabold active:scale-[0.99] transition flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
                                    >
                                        <FiAlertCircle className="w-5 h-5" />
                                        {t.btn.raise}
                                    </button>
                                    <button
                                        onClick={() => router.push(`/${locale}/villager/my-issues`)}
                                        className="ripple rounded-2xl border-2 border-green-200 bg-white text-green-900 py-4 font-extrabold active:scale-[0.99] transition shadow-sm hover:shadow-md"
                                    >
                                        {t.viewActivity}
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

                {/* Fixed Bottom Navigation - FIXED VERSION */}
                <div className="fixed bottom-4 left-4 right-4 bg-white/90 backdrop-blur-lg border-2 border-green-100 rounded-2xl p-2 shadow-xl animate-fadeIn">
                    <div className="grid grid-cols-4 gap-1">
                        <button
                            className="flex flex-col items-center justify-center p-3 rounded-xl transition-all hover:bg-green-50"
                            onClick={() => router.push(`/${locale}/villager/dashboard`)}
                        >
                            <FiHome className="w-5 h-5 text-green-600/70" />
                            <span className="text-xs mt-1 font-medium text-green-700/70">
                                {t.dashboard}
                            </span>
                        </button>
                        
                        <button
                            className="flex flex-col items-center justify-center p-3 rounded-xl transition-all hover:bg-green-50"
                            onClick={() => router.push(`/${locale}/villager/my-issues`)}
                        >
                            <FiList className="w-5 h-5 text-green-600/70" />
                            <span className="text-xs mt-1 font-medium text-green-700/70">
                                {t.track}
                            </span>
                        </button>
                        
                        <button
                            className="flex flex-col items-center justify-center p-3 rounded-xl transition-all hover:bg-green-50"
                            onClick={() => router.push(`/${locale}/villager/issue-tracking`)}
                        >
                            <FiTrendingUp className="w-5 h-5 text-green-600/70" />
                            <span className="text-xs mt-1 font-medium text-green-700/70">
                                {t.tracking}
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