// app/[locale]/villager/status/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Screen from "../../../components/Screen";
import { auth, db } from "../../../lib/firebase";
import { doc, onSnapshot, Timestamp } from "firebase/firestore";
import { onAuthStateChanged, User, signOut } from "firebase/auth";

type Locale = "en" | "kn" | "hi";

type VillagerProfile = {
    uid: string;
    email: string;
    name?: string;
    phone?: string;
    village?: string;
    taluk?: string;
    district?: string;

    // Verification fields
    status?: "pending" | "verified" | "rejected";
    isVerified?: boolean;
    verified?: boolean;
    isRejected?: boolean;
    approved?: boolean;

    // Verification object
    verification?: {
        status?: "pending" | "verified" | "rejected";
        reason?: string;
        verifiedAt?: Timestamp;
        verifiedBy?: string;
        rejectedAt?: Timestamp;
        rejectedBy?: string;
    };

    rejectionReason?: string;
    reason?: string;
    rejectionNote?: string;

    // Metadata
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
    submittedAt?: Timestamp;
};

export default function VillagerStatusPage() {
    const router = useRouter();
    const params = useParams() as { locale?: string };
    const locale = (params?.locale || "en") as Locale;

    const t = useMemo(() => {
        const L: Record<Locale, any> = {
            en: {
                title: "Villager Verification Status",
                subtitle: "Your villager account must be verified by Village Admin before you can report issues and view reports.",
                loading: "Loading…",
                checking: "Checking verification status…",

                // Status messages
                pendingTitle: "Pending Verification",
                pendingDesc: "Your villager registration request has been submitted. Village Admin will verify your details shortly.",

                verifiedTitle: "Verified ✅",
                verifiedDesc: "Your villager account is verified. You can now report issues and view village reports.",

                rejectedTitle: "Rejected ❌",
                rejectedDesc: "Your villager verification was rejected. Please contact Village Admin or re-register with correct details.",

                // User info
                userInfo: "Your Information",
                name: "Name",
                email: "Email",
                phone: "Phone",
                village: "Village",
                taluk: "Taluk",
                district: "District",

                // Verification details
                verificationDetails: "Verification Details",
                verifiedOn: "Verified on",
                verifiedBy: "Verified by",
                rejectedOn: "Rejected on",
                rejectedBy: "Rejected by",
                submittedOn: "Submitted on",

                reason: "Reason for Rejection",
                noReason: "No reason provided",

                // Actions
                actions: {
                    goDashboard: "Go to Dashboard",
                    logout: "Logout",
                    registerAgain: "Register Again",
                    backHome: "Back to Home",
                    checkStatus: "Check Status",
                    refresh: "Refresh Status",
                },

                // Messages
                autoRefresh: "Status updates automatically",
                lastChecked: "Last checked",
                justNow: "just now",
                minutesAgo: "minutes ago",
            },
            kn: {
                title: "ಗ್ರಾಮಸ್ಥ ಪರಿಶೀಲನೆ ಸ್ಥಿತಿ",
                subtitle: "ಸಮಸ್ಯೆಗಳನ್ನು ವರದಿ ಮಾಡಲು ಮತ್ತು ವರದಿಗಳನ್ನು ವೀಕ್ಷಿಸಲು ಮೊದಲು ಗ್ರಾಮ ಆಡ್ಮಿನ್ ನಿಮ್ಮ ಗ್ರಾಮಸ್ಥ ಖಾತೆಯನ್ನು ಪರಿಶೀಲಿಸಬೇಕು.",
                loading: "ಲೋಡ್ ಆಗುತ್ತಿದೆ…",
                checking: "ಪರಿಶೀಲನೆ ಸ್ಥಿತಿಯನ್ನು ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ…",

                pendingTitle: "ಪರಿಶೀಲನೆ ಬಾಕಿ ಇದೆ ⏳",
                pendingDesc: "ನಿಮ್ಮ ಗ್ರಾಮಸ್ಥ ನೋಂದಣಿ ವಿನಂತಿ ಸಲ್ಲಿಸಲಾಗಿದೆ. ಗ್ರಾಮ ಆಡ್ಮಿನ್ ಶೀಘ್ರದಲ್ಲೇ ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸುತ್ತಾರೆ.",

                verifiedTitle: "ಪರಿಶೀಲಿಸಲಾಗಿದೆ ✅",
                verifiedDesc: "ನಿಮ್ಮ ಗ್ರಾಮಸ್ಥ ಖಾತೆ ಪರಿಶೀಲಿಸಲಾಗಿದೆ. ಈಗ ನೀವು ಸಮಸ್ಯೆಗಳನ್ನು ವರದಿ ಮಾಡಬಹುದು ಮತ್ತು ಗ್ರಾಮ ವರದಿಗಳನ್ನು ವೀಕ್ಷಿಸಬಹುದು.",

                rejectedTitle: "ನಿರಾಕರಿಸಲಾಗಿದೆ ❌",
                rejectedDesc: "ನಿಮ್ಮ ಗ್ರಾಮಸ್ಥ ಪರಿಶೀಲನೆ ನಿರಾಕರಿಸಲಾಗಿದೆ. ದಯವಿಟ್ಟು ಗ್ರಾಮ ಆಡ್ಮಿನ್ ಅನ್ನು ಸಂಪರ್ಕಿಸಿ ಅಥವಾ ಸರಿಯಾದ ವಿವರಗಳೊಂದಿಗೆ ಮರು ನೋಂದಣಿ ಮಾಡಿ.",

                userInfo: "ನಿಮ್ಮ ಮಾಹಿತಿ",
                name: "ಹೆಸರು",
                email: "ಇಮೇಲ್",
                phone: "ಫೋನ್",
                village: "ಗ್ರಾಮ",
                taluk: "ತಾಲ್ಲೂಕು",
                district: "ಜಿಲ್ಲೆ",

                verificationDetails: "ಪರಿಶೀಲನೆ ವಿವರಗಳು",
                verifiedOn: "ಪರಿಶೀಲಿಸಲಾಗಿದೆ",
                verifiedBy: "ಪರಿಶೀಲಿಸಿದವರು",
                rejectedOn: "ನಿರಾಕರಿಸಲಾಗಿದೆ",
                rejectedBy: "ನಿರಾಕರಿಸಿದವರು",
                submittedOn: "ಸಲ್ಲಿಸಲಾಗಿದೆ",

                reason: "ನಿರಾಕರಣೆಗೆ ಕಾರಣ",
                noReason: "ಕಾರಣ ನೀಡಲಾಗಿಲ್ಲ",

                actions: {
                    goDashboard: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಹೋಗಿ",
                    logout: "ಲಾಗೌಟ್",
                    registerAgain: "ಮರು ನೋಂದಣಿ",
                    backHome: "ಮುಖಪುಟಕ್ಕೆ",
                    checkStatus: "ಸ್ಥಿತಿಯನ್ನು ಪರಿಶೀಲಿಸಿ",
                    refresh: "ಸ್ಥಿತಿ ರಿಫ್ರೆಶ್ ಮಾಡಿ",
                },

                autoRefresh: "ಸ್ಥಿತಿ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ನವೀಕರಣವಾಗುತ್ತದೆ",
                lastChecked: "ಕೊನೆಯ ಪರಿಶೀಲನೆ",
                justNow: "ಇದೀಗ",
                minutesAgo: "ನಿಮಿಷಗಳ ಹಿಂದೆ",
            },
            hi: {
                title: "ग्रामीण सत्यापन स्थिति",
                subtitle: "समस्याओं की रिपोर्ट करने और रिपोर्टें देखने से पहले ग्राम प्रशासक द्वारा आपका ग्रामीण खाता सत्यापित होना जरूरी है।",
                loading: "लोड हो रहा है…",
                checking: "सत्यापन स्थिति की जाँच की जा रही है…",

                pendingTitle: "सत्यापन लंबित ⏳",
                pendingDesc: "आपकी ग्रामीण पंजीकरण अनुरोध सबमिट हो गई है। ग्राम प्रशासक शीघ्र ही आपके विवरण को सत्यापित करेंगे।",

                verifiedTitle: "सत्यापित ✅",
                verifiedDesc: "आपका ग्रामीण खाता सत्यापित हो गया है। अब आप समस्याओं की रिपोर्ट कर सकते हैं और ग्राम रिपोर्टें देख सकते हैं।",

                rejectedTitle: "अस्वीकृत ❌",
                rejectedDesc: "आपके ग्रामीण का सत्यापन अस्वीकृत किया गया है। कृपया ग्राम प्रशासक से संपर्क करें या सही जानकारी से दोबारा पंजीकरण करें।",

                userInfo: "आपकी जानकारी",
                name: "नाम",
                email: "ईमेल",
                phone: "फ़ोन",
                village: "गाँव",
                taluk: "तालुका",
                district: "जिला",

                verificationDetails: "सत्यापन विवरण",
                verifiedOn: "सत्यापित किया गया",
                verifiedBy: "सत्यापित किया गया",
                rejectedOn: "अस्वीकृत किया गया",
                rejectedBy: "अस्वीकृत किया गया",
                submittedOn: "सबमिट किया गया",

                reason: "अस्वीकरण का कारण",
                noReason: "कोई कारण नहीं दिया गया",

                actions: {
                    goDashboard: "डैशबोर्ड खोलें",
                    logout: "लॉगआउट",
                    registerAgain: "दोबारा पंजीकरण",
                    backHome: "होम जाएँ",
                    checkStatus: "स्थिति जाँचें",
                    refresh: "स्थिति रिफ्रेश करें",
                },

                autoRefresh: "स्थिति स्वचालित रूप से अपडेट होती है",
                lastChecked: "अंतिम जाँच",
                justNow: "अभी अभी",
                minutesAgo: "मिनट पहले",
            },
        };
        return L[locale] || L.en;
    }, [locale]);

    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<VillagerProfile | null>(null);
    const [mounted, setMounted] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [lastChecked, setLastChecked] = useState<Date>(new Date());
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string>("");

    // Mount animation
    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 50);
        return () => clearTimeout(timer);
    }, []);

    // Real-time listener for villager profile
    useEffect(() => {
        let unsubscribe: (() => void) | undefined;

        const setupProfileListener = async (currentUser: User) => {
            try {
                setError("");

                // Try multiple collection names
                const collections = ["villagers", "users", "villagerProfiles"];

                for (const collection of collections) {
                    try {
                        const docRef = doc(db, collection, currentUser.uid);

                        unsubscribe = onSnapshot(docRef, (docSnap) => {
                            setLastChecked(new Date());

                            if (docSnap.exists()) {
                                const data = docSnap.data();
                                console.log("Profile updated:", data);
                                setProfile({
                                    uid: currentUser.uid,
                                    email: currentUser.email || "",
                                    ...data
                                } as VillagerProfile);
                            } else {
                                console.log("No document found in", collection);
                                // Create minimal profile if document doesn't exist
                                setProfile({
                                    uid: currentUser.uid,
                                    email: currentUser.email || "",
                                    status: "pending",
                                    createdAt: Timestamp.now()
                                });
                            }
                            setLoading(false);
                            setRefreshing(false);
                        }, (error) => {
                            console.error("Error in snapshot:", error);
                            setError("Failed to load profile. Please try again.");
                            setLoading(false);
                            setRefreshing(false);
                        });

                        // If we successfully set up listener, break the loop
                        if (unsubscribe !== undefined) break;

                    } catch (err) {
                        console.log(`Collection ${collection} error:`, err);
                    }
                }

                // If no listener was set up
                if (!unsubscribe) {
                    setProfile({
                        uid: currentUser.uid,
                        email: currentUser.email || "",
                        status: "pending"
                    });
                    setLoading(false);
                }

            } catch (error) {
                console.error("Setup error:", error);
                setError("Failed to setup profile listener.");
                setLoading(false);
            }
        };

        const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
            if (!currentUser) {
                console.log("No user, redirecting to role-select");
                router.push(`/${locale}/role-select`);
                setLoading(false);
                return;
            }

            setUser(currentUser);
            await setupProfileListener(currentUser);
        });

        // Cleanup
        return () => {
            if (unsubscribe) unsubscribe();
            unsubscribeAuth();
        };
    }, [router, locale]);

    const status: "pending" | "verified" | "rejected" = useMemo(() => {
        if (!profile) return "pending";

        if (profile?.verification?.status === "rejected" ||
            profile?.status === "rejected" ||
            profile?.isRejected === true) {
            return "rejected";
        }
        if (profile?.verified === true ||
            profile?.verification?.status === "verified" ||
            profile?.status === "verified" ||
            profile?.isVerified === true ||
            profile?.approved === true) {
            return "verified";
        }
        return "pending";
    }, [profile]);

    const reason = profile?.verification?.reason ||
        profile?.rejectionReason ||
        profile?.reason ||
        profile?.rejectionNote || t.noReason;

    // Format relative time
    const formatRelativeTime = (date: Date) => {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return t.justNow;
        if (diffMins === 1) return "1 minute ago";
        if (diffMins < 60) return `${diffMins} ${t.minutesAgo}`;

        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Handle refresh
    const handleRefresh = () => {
        setRefreshing(true);
        setLastChecked(new Date());
        // The real-time listener will automatically update
        setTimeout(() => setRefreshing(false), 1000);
    };

    // Handle logout
    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push(`/${locale}/role-select`);
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    // Loading screen
    if (loading) {
        return (
            <Screen center>
                <style>{`
          @keyframes spinLoader {
            to { transform: rotate(360deg); }
          }
          @keyframes pulseRing {
            0%   { transform: scale(1); opacity: 0.6; }
            100% { transform: scale(1.8); opacity: 0; }
          }
          @keyframes fadeInLoader {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes scaleLoader {
            from { transform: scale(0.8); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
          .loader-ring {
            width: 48px; height: 48px;
            border: 4px solid #16a34a;
            border-top-color: transparent;
            border-radius: 50%;
            animation: spinLoader 0.7s linear infinite, scaleLoader 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
          }
          .loader-pulse {
            position: absolute; inset: -8px;
            border: 2px solid #16a34a;
            border-radius: 50%;
            animation: pulseRing 1.4s ease-out infinite;
          }
          .loader-pulse-delayed {
            animation-delay: 0.7s;
          }
          .loader-text {
            animation: fadeInLoader 0.8s ease-out 0.4s both;
          }
        `}</style>
                <div style={{ position: "relative", width: 48, height: 48 }}>
                    <div className="loader-pulse" />
                    <div className="loader-pulse loader-pulse-delayed" />
                    <div className="loader-ring" />
                </div>
                <p
                    className="loader-text"
                    style={{
                        marginTop: 20,
                        color: "#166534",
                        fontWeight: 600,
                        fontSize: 15,
                        letterSpacing: "0.02em",
                    }}
                >
                    {t.checking}
                </p>
            </Screen>
        );
    }

    // Error screen
    if (error) {
        return (
            <Screen padded>
                <div style={{
                    maxWidth: 520,
                    margin: "0 auto",
                    padding: "40px 20px",
                    minHeight: "100vh",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    textAlign: "center"
                }}>
                    <div style={{
                        width: 80,
                        height: 80,
                        borderRadius: 20,
                        background: "#fee2e2",
                        border: "2px solid #f87171",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: 24
                    }}>
                        <span style={{ fontSize: 36 }}>⚠️</span>
                    </div>
                    <h2 style={{ color: "#dc2626", marginBottom: 12 }}>Error</h2>
                    <p style={{ color: "#4d7c5e", marginBottom: 24 }}>{error}</p>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
                        <button
                            onClick={handleRefresh}
                            style={{
                                background: "#16a34a",
                                color: "white",
                                padding: "12px 24px",
                                borderRadius: 12,
                                border: "none",
                                fontWeight: 600,
                                cursor: "pointer",
                                transition: "all 0.2s"
                            }}
                        >
                            {t.actions.refresh}
                        </button>
                        <button
                            onClick={() => router.push(`/${locale}/role-select`)}
                            style={{
                                background: "white",
                                color: "#166534",
                                padding: "12px 24px",
                                borderRadius: 12,
                                border: "2px solid #bbf7d0",
                                fontWeight: 600,
                                cursor: "pointer",
                                transition: "all 0.2s"
                            }}
                        >
                            {t.actions.backHome}
                        </button>
                    </div>
                </div>
            </Screen>
        );
    }

    // Global styles
    const globalStyles = `
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(24px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeInDown {
      from { opacity: 0; transform: translateY(-20px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.88); }
      to   { opacity: 1; transform: scale(1); }
    }
    @keyframes iconPop {
      0%   { transform: scale(0); opacity: 0; }
      60%  { transform: scale(1.25); }
      100% { transform: scale(1); opacity: 1; }
    }
    @keyframes hourglassBob {
      0%, 100% { transform: translateY(0); }
      50%      { transform: translateY(-6px); }
    }
    @keyframes checkDraw {
      from { stroke-dashoffset: 48; }
      to   { stroke-dashoffset: 0; }
    }
    @keyframes xDraw {
      from { stroke-dashoffset: 56; }
      to   { stroke-dashoffset: 0; }
    }
    @keyframes glowPulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(22,163,74,0.18); }
      50%      { box-shadow: 0 0 0 12px rgba(22,163,74,0); }
    }
    @keyframes shimmer {
      0% { background-position: -1000px 0; }
      100% { background-position: 1000px 0; }
    }

    .btn-primary {
      background: linear-gradient(135deg, #15803d, #16a34a);
      color: #fff;
      font-weight: 700;
      font-size: 14px;
      letter-spacing: 0.02em;
      padding: 13px 26px;
      border: none;
      border-radius: 14px;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      box-shadow: 0 4px 12px rgba(22,163,74,0.28);
      position: relative;
      overflow: hidden;
    }
    .btn-primary:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 20px rgba(22,163,74,0.38);
    }
    .btn-primary:active {
      transform: translateY(-1px) scale(0.97);
    }

    .btn-secondary {
      background: #fff;
      color: #166534;
      font-weight: 600;
      font-size: 14px;
      letter-spacing: 0.02em;
      padding: 13px 26px;
      border: 1.5px solid #bbf7d0;
      border-radius: 14px;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      box-shadow: 0 2px 6px rgba(22,163,74,0.1);
    }
    .btn-secondary:hover {
      transform: translateY(-3px);
      border-color: #86efac;
      box-shadow: 0 6px 16px rgba(22,163,74,0.16);
    }
    .btn-secondary:active {
      transform: translateY(-1px) scale(0.97);
    }

    .refresh-btn {
      background: #f0fdf4;
      color: #166534;
      border: 2px solid #bbf7d0;
      border-radius: 10px;
      padding: 8px 16px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }
    .refresh-btn:hover {
      background: #dcfce7;
      transform: translateY(-1px);
    }
    .refresh-btn:active {
      transform: translateY(0);
    }
  `;

    // Status Icon component
    const StatusIcon = () => {
        if (status === "pending") {
            return (
                <div
                    style={{
                        width: 64,
                        height: 64,
                        borderRadius: 18,
                        background: "linear-gradient(135deg, #fef9c3, #fef08a)",
                        border: "2px solid #fde047",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        animation: mounted ? "iconPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both" : "none",
                        flexShrink: 0,
                        boxShadow: "0 8px 16px rgba(253, 224, 71, 0.3)",
                    }}
                >
                    <span
                        style={{
                            fontSize: 32,
                            display: "inline-block",
                            animation: "hourglassBob 2s ease-in-out infinite",
                        }}
                    >
                        ⏳
                    </span>
                </div>
            );
        }
        if (status === "verified") {
            return (
                <div
                    style={{
                        width: 64,
                        height: 64,
                        borderRadius: 18,
                        background: "linear-gradient(135deg, #dcfce7, #bbf7d0)",
                        border: "2px solid #4ade80",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        animation: mounted
                            ? "iconPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both, glowPulse 2.4s ease-in-out 1s infinite"
                            : "none",
                        flexShrink: 0,
                        boxShadow: "0 8px 16px rgba(74, 222, 128, 0.3)",
                    }}
                >
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                        <path
                            d="M5 13l4 4L19 7"
                            stroke="#16a34a"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeDasharray="48"
                            strokeDashoffset="0"
                            style={{
                                animation: mounted ? "checkDraw 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.65s both" : "none",
                            }}
                        />
                    </svg>
                </div>
            );
        }
        // rejected
        return (
            <div
                style={{
                    width: 64,
                    height: 64,
                    borderRadius: 18,
                    background: "linear-gradient(135deg, #fee2e2, #fecaca)",
                    border: "2px solid #f87171",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    animation: mounted ? "iconPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both" : "none",
                    flexShrink: 0,
                    boxShadow: "0 8px 16px rgba(248, 113, 113, 0.3)",
                }}
            >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path
                        d="M6 6l12 12M18 6l-12 12"
                        stroke="#dc2626"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeDasharray="56"
                        strokeDashoffset="0"
                        style={{
                            animation: mounted ? "xDraw 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.65s both" : "none",
                        }}
                    />
                </svg>
            </div>
        );
    };

    // Colors based on status
    const titleColor = status === "pending" ? "#854d0e" : status === "verified" ? "#166534" : "#991b1b";
    const cardBorderColor = status === "pending" ? "#fde047" : status === "verified" ? "#4ade80" : "#f87171";
    const cardTopGlow = status === "pending" ? "rgba(253,224,71,0.25)" :
        status === "verified" ? "rgba(74,222,128,0.25)" :
            "rgba(248,113,113,0.25)";

    return (
        <Screen padded>
            <style>{globalStyles}</style>

            <div
                style={{
                    maxWidth: 520,
                    margin: "0 auto",
                    padding: "0 8px",
                    minHeight: "100vh",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                }}
            >
                {/* Header */}
                <div
                    style={{
                        textAlign: "center",
                        animation: mounted ? "fadeInDown 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both" : "none",
                        marginBottom: 32,
                        position: "relative",
                    }}
                >
                    <h1
                        style={{
                            fontSize: "clamp(1.6rem, 6vw, 2.2rem)",
                            fontWeight: 800,
                            color: "#14532d",
                            margin: 0,
                            letterSpacing: "-0.02em",
                            lineHeight: 1.2,
                        }}
                    >
                        {t.title}
                    </h1>
                    <p
                        style={{
                            fontSize: "clamp(13px, 3.5vw, 15px)",
                            color: "#4d7c5e",
                            marginTop: 12,
                            marginBottom: 8,
                            lineHeight: 1.6,
                            maxWidth: 420,
                            margin: "12px auto 0",
                        }}
                    >
                        {t.subtitle}
                    </p>

                    {/* Last checked indicator */}
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        marginTop: 16,
                        fontSize: 13,
                        color: "#6b7280"
                    }}>
                        <span>🔄 {t.autoRefresh}</span>
                        <span>•</span>
                        <span>{t.lastChecked}: {formatRelativeTime(lastChecked)}</span>
                        <button
                            onClick={handleRefresh}
                            className="refresh-btn"
                            style={{ marginLeft: 8 }}
                            disabled={refreshing}
                        >
                            {refreshing ? "🔄" : "↻"} {refreshing ? "..." : t.actions.refresh}
                        </button>
                    </div>
                </div>

                {/* Status Card */}
                <div
                    style={{
                        background: "#fff",
                        borderRadius: 24,
                        border: `2px solid ${cardBorderColor}`,
                        boxShadow: `0 8px 32px ${cardTopGlow}, 0 1px 4px rgba(0,0,0,0.08)`,
                        padding: "28px 24px",
                        animation: mounted ? "scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s both" : "none",
                        position: "relative",
                        overflow: "hidden",
                        marginBottom: 24,
                    }}
                >
                    {/* Top color bar */}
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            height: 4,
                            background: `linear-gradient(90deg, transparent, ${cardBorderColor}, transparent)`,
                            borderRadius: "24px 24px 0 0",
                            animation: "shimmer 2s infinite",
                        }}
                    />

                    {/* Icon + Status */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 20,
                            marginBottom: 24,
                        }}
                    >
                        <StatusIcon />

                        <div style={{ minWidth: 0, flex: 1 }}>
                            <h2
                                style={{
                                    margin: "0 0 8px 0",
                                    fontSize: "clamp(16px, 4vw, 19px)",
                                    fontWeight: 750,
                                    color: titleColor,
                                    letterSpacing: "-0.01em",
                                    animation: mounted ? "fadeInUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.45s both" : "none",
                                    lineHeight: 1.3,
                                }}
                            >
                                {status === "pending" && t.pendingTitle}
                                {status === "verified" && t.verifiedTitle}
                                {status === "rejected" && t.rejectedTitle}
                            </h2>
                            <p
                                style={{
                                    margin: 0,
                                    fontSize: "clamp(13px, 3vw, 15px)",
                                    color: "#4d7c5e",
                                    lineHeight: 1.6,
                                    animation: mounted ? "fadeInUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.55s both" : "none",
                                }}
                            >
                                {status === "pending" && t.pendingDesc}
                                {status === "verified" && t.verifiedDesc}
                                {status === "rejected" && t.rejectedDesc}
                            </p>
                        </div>
                    </div>

                    {/* User Information */}
                    <div
                        style={{
                            background: "#f8fafc",
                            borderRadius: 16,
                            padding: "16px 20px",
                            marginBottom: 20,
                            animation: mounted ? "fadeInUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.65s both" : "none",
                            border: "1px solid #e2e8f0",
                        }}
                    >
                        <h3
                            style={{
                                fontSize: 14,
                                fontWeight: 700,
                                color: "#475569",
                                margin: "0 0 12px 0",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                            }}
                        >
                            {t.userInfo}
                        </h3>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
                            {profile?.name && (
                                <div>
                                    <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>{t.name}</div>
                                    <div style={{ fontWeight: 600, color: "#1e293b" }}>{profile.name}</div>
                                </div>
                            )}
                            {profile?.email && (
                                <div>
                                    <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>{t.email}</div>
                                    <div style={{ fontWeight: 600, color: "#1e293b", wordBreak: "break-all" }}>{profile.email}</div>
                                </div>
                            )}
                            {profile?.phone && (
                                <div>
                                    <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>{t.phone}</div>
                                    <div style={{ fontWeight: 600, color: "#1e293b" }}>{profile.phone}</div>
                                </div>
                            )}
                            {profile?.village && (
                                <div>
                                    <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>{t.village}</div>
                                    <div style={{ fontWeight: 600, color: "#1e293b" }}>{profile.village}</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Verification Details */}
                    {(status === "verified" || status === "rejected") && (
                        <div
                            style={{
                                background: status === "verified" ? "#f0fdf4" : "#fef2f2",
                                borderRadius: 16,
                                padding: "16px 20px",
                                marginBottom: 20,
                                animation: mounted ? "fadeInUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.75s both" : "none",
                                border: `1px solid ${status === "verified" ? "#bbf7d0" : "#fecaca"}`,
                            }}
                        >
                            <h3
                                style={{
                                    fontSize: 14,
                                    fontWeight: 700,
                                    color: status === "verified" ? "#166534" : "#dc2626",
                                    margin: "0 0 12px 0",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.05em",
                                }}
                            >
                                {t.verificationDetails}
                            </h3>

                            {status === "verified" && profile?.verification?.verifiedAt && (
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
                                    <div>
                                        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>{t.verifiedOn}</div>
                                        <div style={{ fontWeight: 600, color: "#166534" }}>
                                            {profile.verification.verifiedAt.toDate().toLocaleDateString()}
                                        </div>
                                    </div>
                                    {profile.verification.verifiedBy && (
                                        <div>
                                            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>{t.verifiedBy}</div>
                                            <div style={{ fontWeight: 600, color: "#166534" }}>{profile.verification.verifiedBy}</div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {status === "rejected" && (
                                <>
                                    {profile?.verification?.rejectedAt && (
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 12 }}>
                                            <div>
                                                <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>{t.rejectedOn}</div>
                                                <div style={{ fontWeight: 600, color: "#dc2626" }}>
                                                    {profile.verification.rejectedAt.toDate().toLocaleDateString()}
                                                </div>
                                            </div>
                                            {profile.verification.rejectedBy && (
                                                <div>
                                                    <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>{t.rejectedBy}</div>
                                                    <div style={{ fontWeight: 600, color: "#dc2626" }}>{profile.verification.rejectedBy}</div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div>
                                        <div style={{ fontSize: 12, color: "#dc2626", fontWeight: 700, marginBottom: 6 }}>
                                            {t.reason}
                                        </div>
                                        <div style={{
                                            fontSize: 15,
                                            color: "#991b1b",
                                            fontWeight: 600,
                                            padding: "10px 14px",
                                            background: "white",
                                            borderRadius: 10,
                                            borderLeft: "4px solid #f87171"
                                        }}>
                                            {reason}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Submitted Date */}
                    {(profile?.createdAt || profile?.submittedAt) && (
                        <div style={{
                            fontSize: 13,
                            color: "#6b7280",
                            textAlign: "center",
                            marginTop: 12,
                            animation: mounted ? "fadeInUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.85s both" : "none",
                        }}>
                            {t.submittedOn}: {(profile?.createdAt || profile?.submittedAt)?.toDate().toLocaleDateString()}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div
                        style={{
                            marginTop: 28,
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 12,
                            animation: mounted ? "fadeInUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.9s both" : "none",
                        }}
                    >
                        {status === "pending" && (
                            <>
                                <button
                                    className="btn-secondary"
                                    onClick={handleLogout}
                                    style={{
                                        flex: "1 1 140px",
                                        minWidth: "120px",
                                    }}
                                >
                                    {t.actions.logout}
                                </button>
                                <button
                                    className="btn-primary"
                                    onClick={() => router.push(`/${locale}/role-select`)}
                                    style={{
                                        flex: "1 1 140px",
                                        minWidth: "120px",
                                    }}
                                >
                                    {t.actions.backHome}
                                </button>
                            </>
                        )}

                        {status === "rejected" && (
                            <>
                                <button
                                    className="btn-primary"
                                    onClick={async () => {
                                        await handleLogout();
                                        router.push(`/${locale}/villager/register`);
                                    }}
                                    style={{
                                        flex: "1 1 140px",
                                        minWidth: "120px",
                                    }}
                                >
                                    {t.actions.registerAgain}
                                </button>
                                <button
                                    className="btn-secondary"
                                    onClick={handleLogout}
                                    style={{
                                        flex: "1 1 140px",
                                        minWidth: "120px",
                                    }}
                                >
                                    {t.actions.logout}
                                </button>
                            </>
                        )}

                        {status === "verified" && (
                            <>
                                <button
                                    className="btn-primary"
                                    onClick={() => router.push(`/${locale}/villager/dashboard`)}
                                    style={{
                                        flex: "1 1 140px",
                                        minWidth: "120px",
                                    }}
                                >
                                    {t.actions.goDashboard}
                                </button>
                                <button
                                    className="btn-secondary"
                                    onClick={handleLogout}
                                    style={{
                                        flex: "1 1 140px",
                                        minWidth: "120px",
                                    }}
                                >
                                    {t.actions.logout}
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Auto-refresh note */}
                <div style={{
                    fontSize: 13,
                    color: "#6b7280",
                    textAlign: "center",
                    padding: "12px 16px",
                    background: "#f8fafc",
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                    animation: mounted ? "fadeInUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 1s both" : "none",
                }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                        <span>🔄</span>
                        <span>{t.autoRefresh}. {t.lastChecked}: {formatRelativeTime(lastChecked)}</span>
                    </div>
                </div>
            </div>
        </Screen>
    );
}