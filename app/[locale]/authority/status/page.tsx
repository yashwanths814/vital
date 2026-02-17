// app/[locale]/authority/status/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Screen from "../../../components/Screen";
import { auth, db } from "../../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";

type Locale = "en" | "kn" | "hi";
type Role = "pdo" | "village_incharge" | "tdo" | "ddo";

export default function AuthorityStatusPage() {
    const router = useRouter();
    const params = useParams() as { locale?: string };
    const locale = (params?.locale || "en") as Locale;

    const t = useMemo(() => {
        const L: Record<Locale, any> = {
            en: {
                title: "Verification Status",
                subtitle:
                    "Your authority account must be verified by Admin before you can access the dashboard.",
                loading: "Loading…",
                pendingTitle: "Pending Verification",
                pendingDesc:
                    "Your request is submitted. Please wait — Admin will verify your details.",
                verifiedTitle: "Verified",
                verifiedDesc:
                    "Your account is verified. You can now access your authority dashboard.",
                rejectedTitle: "Rejected",
                rejectedDesc:
                    "Your verification was rejected. Please contact Admin or re-register with correct details.",
                reason: "Reason",
                actions: {
                    goDashboard: "Go to Dashboard",
                    logout: "Logout",
                    registerAgain: "Register Again",
                    backHome: "Back to Home",
                },
            },
            kn: {
                title: "ಪರಿಶೀಲನೆ ಸ್ಥಿತಿ",
                subtitle:
                    "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಪ್ರವೇಶಿಸಲು ಮೊದಲು ಆಡ್ಮಿನ್ ನಿಮ್ಮ ಖಾತೆಯನ್ನು ಪರಿಶೀಲಿಸಬೇಕು.",
                loading: "ಲೋಡ್ ಆಗುತ್ತಿದೆ…",
                pendingTitle: "ಪರಿಶೀಲನೆ ಬಾಕಿ ಇದೆ",
                pendingDesc:
                    "ನಿಮ್ಮ ವಿನಂತಿ ಸಲ್ಲಿಸಲಾಗಿದೆ. ದಯವಿಟ್ಟು ಕಾಯಿರಿ — ಆಡ್ಮಿನ್ ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸುತ್ತಾರೆ (OTP + ಪರಿಶೀಲನೆ).",
                verifiedTitle: "ಪರಿಶೀಲಿಸಲಾಗಿದೆ",
                verifiedDesc:
                    "ನಿಮ್ಮ ಖಾತೆ ಪರಿಶೀಲಿಸಲಾಗಿದೆ. ಈಗ ನೀವು ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಪ್ರವೇಶಿಸಬಹು ದು.",
                rejectedTitle: "ನಿರಾಕರಿಸಲಾಗಿದೆ",
                rejectedDesc:
                    "ನಿಮ್ಮ ಪರಿಶೀಲನೆ ನಿರಾಕರಿಸಲಾಗಿದೆ. ದಯವಿಟ್ಟು ಆಡ್ಮಿನ್ ಅನ್ನು ಸಂಪರ್ಕಿಸಿ ಅಥವಾ ಸರಿಯಾದ ವಿವರಗಳೊಂದಿಗೆ ಮರು ನೋಂದಣಿ ಮಾಡಿ.",
                reason: "ಕಾರಣ",
                actions: {
                    goDashboard: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಹೋಗಿ",
                    logout: "ಲಾಗೌಟ್",
                    registerAgain: "ಮರು ನೋಂದಣಿ",
                    backHome: "ಮುಖಪುಟಕ್ಕೆ",
                },
            },
            hi: {
                title: "वेरिफिकेशन स्टेटस",
                subtitle:
                    "डैशबोर्ड एक्सेस करने से पहले Admin द्वारा आपका अकाउंट verify होना जरूरी है।",
                loading: "लोड हो रहा है…",
                pendingTitle: "वेरिफिकेशन पेंडिंग",
                pendingDesc:
                    "आपका रिक्वेस्ट सबमिट हो गया है। कृपया इंतज़ार करें — Admin OTP + डिटेल्स verify करेंगे।",
                verifiedTitle: "Verified",
                verifiedDesc:
                    "आपका अकाउंट verify हो गया है। अब आप डैशबोर्ड एक्सेस कर सकते हैं।",
                rejectedTitle: "Rejected",
                rejectedDesc:
                    "आपका वेरिफिकेशन reject हो गया है। कृपया Admin से संपर्क करें या सही जानकारी से दोबारा रजिस्टर करें।",
                reason: "कारण",
                actions: {
                    goDashboard: "डैशबोर्ड खोलें",
                    logout: "लॉगआउट",
                    registerAgain: "दोबारा रजिस्टर",
                    backHome: "होम जाएँ",
                },
            },
        };
        return L[locale] || L.en;
    }, [locale]);

    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 50);
        return () => clearTimeout(timer);
    }, []);

    const goRoleDashboard = (role: Role) => {
        if (role === "pdo") return router.replace(`/${locale}/authority/pdo/dashboard`);
        if (role === "village_incharge") return router.replace(`/${locale}/authority/vi/dashboard`);
        if (role === "tdo") return router.replace(`/${locale}/authority/tdo/dashboard`);
        return router.replace(`/${locale}/authority/ddo/dashboard`);
    };

    useEffect(() => {
        const run = async () => {
            const u = auth.currentUser;
            if (!u) {
                router.replace(`/${locale}/authority/login`);
                return;
            }

            const snap = await getDoc(doc(db, "authorities", u.uid));
            if (!snap.exists()) {
                router.replace(`/${locale}/authority/register`);
                return;
            }

            const data = snap.data() as any;
            setProfile(data);

            const isVerified = data?.verified === true || data?.verification?.status === "verified";
            if (isVerified) {
                const role = (data?.role || "pdo") as Role;
                goRoleDashboard(role);
            }
        };

        run()
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [router, locale]);

    const status: "pending" | "verified" | "rejected" = useMemo(() => {
        if (!profile) return "pending";
        if (profile?.verification?.status === "rejected") return "rejected";
        if (profile?.verified === true || profile?.verification?.status === "verified")
            return "verified";
        return "pending";
    }, [profile]);

    const reason = profile?.verification?.reason || profile?.rejectionReason || "";

    // ─── LOADING ────────────────────────────────────────────────────
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
                    .loader-ring {
                        width: 48px; height: 48px;
                        border: 4px solid #16a34a;
                        border-top-color: transparent;
                        border-radius: 50%;
                        animation: spinLoader 0.7s linear infinite;
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
                `}</style>
                <div style={{ position: "relative", width: 48, height: 48 }}>
                    <div className="loader-pulse" />
                    <div className="loader-pulse loader-pulse-delayed" />
                    <div className="loader-ring" />
                </div>
                <p
                    style={{
                        marginTop: 20,
                        color: "#166534",
                        fontWeight: 600,
                        fontSize: 15,
                        letterSpacing: "0.02em",
                    }}
                >
                    {t.loading}
                </p>
            </Screen>
        );
    }

    // ─── SHARED STYLES & KEYFRAMES ──────────────────────────────────
    const globalStyles = `
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(18px); }
            to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInDown {
            from { opacity: 0; transform: translateY(-10px); }
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
        /* pending hourglass gentle bob */
        @keyframes hourglassBob {
            0%, 100% { transform: translateY(0); }
            50%      { transform: translateY(-3px); }
        }
        /* verified check draw */
        @keyframes checkDraw {
            from { stroke-dashoffset: 48; }
            to   { stroke-dashoffset: 0; }
        }
        /* rejected X draw */
        @keyframes xDraw {
            from { stroke-dashoffset: 56; }
            to   { stroke-dashoffset: 0; }
        }
        /* subtle ambient glow pulse for verified */
        @keyframes glowPulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(22,163,74,0.18); }
            50%      { box-shadow: 0 0 0 12px rgba(22,163,74,0); }
        }
        /* reason box shake-in */
        @keyframes shakeIn {
            0%   { transform: translateX(-6px); opacity: 0; }
            40%  { transform: translateX(4px); }
            70%  { transform: translateX(-2px); }
            100% { transform: translateX(0); opacity: 1; }
        }
        /* button hover lift */
        .btn-primary {
            background: linear-gradient(135deg, #15803d, #16a34a);
            color: #fff;
            font-weight: 700;
            font-size: 14px;
            letter-spacing: 0.02em;
            padding: 12px 24px;
            border: none;
            border-radius: 14px;
            cursor: pointer;
            transition: transform 0.18s cubic-bezier(.34,1.56,.64,1),
                        box-shadow 0.18s ease;
            box-shadow: 0 2px 8px rgba(22,163,74,0.28);
        }
        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(22,163,74,0.35);
        }
        .btn-primary:active {
            transform: translateY(0px) scale(0.97);
            box-shadow: 0 1px 4px rgba(22,163,74,0.2);
        }
        .btn-secondary {
            background: #fff;
            color: #166534;
            font-weight: 600;
            font-size: 14px;
            letter-spacing: 0.02em;
            padding: 12px 24px;
            border: 1.5px solid #bbf7d0;
            border-radius: 14px;
            cursor: pointer;
            transition: transform 0.18s cubic-bezier(.34,1.56,.64,1),
                        box-shadow 0.18s ease,
                        border-color 0.18s ease;
            box-shadow: 0 1px 3px rgba(22,163,74,0.08);
        }
        .btn-secondary:hover {
            transform: translateY(-2px);
            border-color: #86efac;
            box-shadow: 0 4px 12px rgba(22,163,74,0.14);
        }
        .btn-secondary:active {
            transform: translateY(0px) scale(0.97);
            box-shadow: 0 1px 2px rgba(22,163,74,0.08);
        }
    `;

    // ─── ANIMATED STATUS ICON ───────────────────────────────────────
    const StatusIcon = () => {
        if (status === "pending") {
            return (
                <div
                    style={{
                        width: 56,
                        height: 56,
                        borderRadius: 16,
                        background: "linear-gradient(135deg, #fef9c3, #fef08a)",
                        border: "1.5px solid #fde047",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        animation: mounted ? "iconPop 0.45s cubic-bezier(.34,1.56,.64,1) 0.3s both" : "none",
                        flexShrink: 0,
                    }}
                >
                    <span
                        style={{
                            fontSize: 26,
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
                        width: 56,
                        height: 56,
                        borderRadius: 16,
                        background: "linear-gradient(135deg, #dcfce7, #bbf7d0)",
                        border: "1.5px solid #4ade80",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        animation: mounted
                            ? "iconPop 0.45s cubic-bezier(.34,1.56,.64,1) 0.3s both, glowPulse 2.4s ease-in-out 1s infinite"
                            : "none",
                        flexShrink: 0,
                    }}
                >
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                        <path
                            d="M5 13l4 4L19 7"
                            stroke="#16a34a"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeDasharray="48"
                            strokeDashoffset="0"
                            style={{
                                animation: mounted ? "checkDraw 0.5s ease 0.55s both" : "none",
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
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    background: "linear-gradient(135deg, #fee2e2, #fecaca)",
                    border: "1.5px solid #f87171",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    animation: mounted ? "iconPop 0.45s cubic-bezier(.34,1.56,.64,1) 0.3s both" : "none",
                    flexShrink: 0,
                }}
            >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path
                        d="M6 6l12 12M18 6l-12 12"
                        stroke="#dc2626"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray="56"
                        strokeDashoffset="0"
                        style={{
                            animation: mounted ? "xDraw 0.45s ease 0.55s both" : "none",
                        }}
                    />
                </svg>
            </div>
        );
    };

    // ─── TITLE & SUBTITLE ───────────────────────────────────────────
    const titleColor =
        status === "pending" ? "#854d0e" : status === "verified" ? "#166534" : "#991b1b";

    // ─── CARD BORDER ACCENT COLOUR ──────────────────────────────────
    const cardBorderColor =
        status === "pending"
            ? "#fde047"
            : status === "verified"
            ? "#4ade80"
            : "#f87171";
    const cardTopGlow =
        status === "pending"
            ? "rgba(253,224,71,0.22)"
            : status === "verified"
            ? "rgba(74,222,128,0.22)"
            : "rgba(248,113,113,0.22)";

    return (
        <Screen padded>
            <style>{globalStyles}</style>

            <div
                style={{
                    maxWidth: 480,
                    margin: "0 auto",
                    padding: "0 4px",
                }}
            >
                {/* ── Header ── */}
                <div
                    style={{
                        textAlign: "center",
                        animation: mounted ? "fadeInDown 0.5s ease both" : "none",
                    }}
                >
                    <h1
                        style={{
                            fontSize: "clamp(1.5rem, 5vw, 2rem)",
                            fontWeight: 800,
                            color: "#14532d",
                            margin: 0,
                            letterSpacing: "-0.02em",
                        }}
                    >
                        {t.title}
                    </h1>
                    <p
                        style={{
                            fontSize: 13.5,
                            color: "#4d7c5e",
                            marginTop: 8,
                            marginBottom: 0,
                            lineHeight: 1.5,
                            maxWidth: 360,
                            margin: "8px auto 0",
                        }}
                    >
                        {t.subtitle}
                    </p>
                </div>

                {/* ── Status Card ── */}
                <div
                    style={{
                        marginTop: 28,
                        background: "#fff",
                        borderRadius: 22,
                        border: `1.5px solid ${cardBorderColor}`,
                        boxShadow: `0 4px 24px ${cardTopGlow}, 0 1px 3px rgba(0,0,0,0.06)`,
                        padding: "24px 22px 28px",
                        animation: mounted ? "scaleIn 0.45s cubic-bezier(.34,1.56,.64,1) 0.15s both" : "none",
                        position: "relative",
                        overflow: "hidden",
                    }}
                >
                    {/* subtle top-edge color bar */}
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            height: 3,
                            background:
                                status === "pending"
                                    ? "linear-gradient(90deg, #fde047, #facc15, #fde047)"
                                    : status === "verified"
                                    ? "linear-gradient(90deg, #4ade80, #22c55e, #4ade80)"
                                    : "linear-gradient(90deg, #f87171, #ef4444, #f87171)",
                            borderRadius: "22px 22px 0 0",
                        }}
                    />

                    {/* Icon + Text row */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 16,
                            marginTop: 6,
                        }}
                    >
                        <StatusIcon />

                        <div style={{ minWidth: 0, flex: 1 }}>
                            <h2
                                style={{
                                    margin: 0,
                                    fontSize: 17,
                                    fontWeight: 750,
                                    color: titleColor,
                                    letterSpacing: "-0.01em",
                                    animation: mounted
                                        ? "fadeInUp 0.4s ease 0.45s both"
                                        : "none",
                                }}
                            >
                                {status === "pending" && t.pendingTitle}
                                {status === "verified" && t.verifiedTitle}
                                {status === "rejected" && t.rejectedTitle}
                            </h2>
                            <p
                                style={{
                                    margin: "6px 0 0",
                                    fontSize: 13.5,
                                    color: "#4d7c5e",
                                    lineHeight: 1.55,
                                    animation: mounted
                                        ? "fadeInUp 0.4s ease 0.55s both"
                                        : "none",
                                }}
                            >
                                {status === "pending" && t.pendingDesc}
                                {status === "verified" && t.verifiedDesc}
                                {status === "rejected" && t.rejectedDesc}
                            </p>

                            {/* Rejection reason */}
                            {status === "rejected" && reason && (
                                <div
                                    style={{
                                        marginTop: 16,
                                        borderRadius: 12,
                                        border: "1px solid #fecaca",
                                        background: "linear-gradient(135deg, #fef2f2, #fee2e2)",
                                        padding: "10px 14px",
                                        animation: mounted ? "shakeIn 0.5s ease 0.7s both" : "none",
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: 11,
                                            fontWeight: 700,
                                            color: "#b91c1c",
                                            textTransform: "uppercase",
                                            letterSpacing: "0.06em",
                                        }}
                                    >
                                        {t.reason}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 13.5,
                                            color: "#991b1b",
                                            fontWeight: 600,
                                            marginTop: 4,
                                            lineHeight: 1.45,
                                        }}
                                    >
                                        {reason}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Action Buttons ── */}
                    <div
                        style={{
                            marginTop: 24,
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 10,
                            animation: mounted ? "fadeInUp 0.4s ease 0.65s both" : "none",
                        }}
                    >
                        {status === "pending" && (
                            <>
                                <button
                                    className="btn-secondary"
                                    onClick={async () => {
                                        await auth.signOut();
                                        router.replace(`/${locale}/role-select`);
                                    }}
                                >
                                    {t.actions.logout}
                                </button>
                                <button
                                    className="btn-primary"
                                    onClick={() => router.replace(`/${locale}/role-select`)}
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
                                        await auth.signOut();
                                        router.replace(`/${locale}/authority/register`);
                                    }}
                                >
                                    {t.actions.registerAgain}
                                </button>
                                <button
                                    className="btn-secondary"
                                    onClick={async () => {
                                        await auth.signOut();
                                        router.replace(`/${locale}/role-select`);
                                    }}
                                >
                                    {t.actions.backHome}
                                </button>
                            </>
                        )}

                        {status === "verified" && (
                            <>
                                <button
                                    className="btn-primary"
                                    onClick={() => {
                                        const role = (profile?.role || "pdo") as Role;
                                        goRoleDashboard(role);
                                    }}
                                >
                                    {t.actions.goDashboard}
                                </button>
                                <button
                                    className="btn-secondary"
                                    onClick={async () => {
                                        await auth.signOut();
                                        router.replace(`/${locale}/role-select`);
                                    }}
                                >
                                    {t.actions.logout}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </Screen>
    );
}