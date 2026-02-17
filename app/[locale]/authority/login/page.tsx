"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Screen from "../../../components/Screen";
import { auth, db } from "../../../lib/firebase";
import {
    signInWithEmailAndPassword,
    setPersistence,
    browserLocalPersistence,
    onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import {
    FiArrowLeft,
    FiMail,
    FiLock,
    FiEye,
    FiEyeOff,
    FiAlertCircle,
    FiUserCheck,
    FiHelpCircle,
    FiShield,
    FiClock,
    FiCheckCircle,
    FiXCircle,
} from "react-icons/fi";

type Locale = "en" | "kn" | "hi";

export default function AuthorityLoginPage() {
    const router = useRouter();
    const params = useParams() as { locale?: string };
    const locale = (params?.locale || "en") as Locale;

    const t = useMemo(() => {
        const L: Record<Locale, any> = {
            en: {
                title: "Authority Login",
                subtitle: "Login to access your authority dashboard",
                email: "Email",
                password: "Password",
                login: "Login",
                logging: "Logging in…",
                noAccount: "New authority?",
                register: "Register",
                back: "Back",
                forgotPassword: "Forgot Password?",
                govPortal: "Government Authority Portal",
                secureAccess: "Secure access to official dashboard",
                checkingStatus: "Checking verification status...",
                redirecting: "Redirecting...",
                accountPending: "Account Pending Verification",
                accountPendingDesc: "Your account is still pending verification by an administrator. You'll be notified once verified.",
                accountRejected: "Account Verification Failed",
                accountRejectedDesc: "Your account verification was not approved. Please contact support for more information.",
                contactSupport: "Contact Support",
                tryAgain: "Try Again",
                err: {
                    required: "Please enter email and password.",
                    failed: "Login failed. Please check your credentials.",
                    invalidEmail: "Please enter a valid email address",
                    emailRequired: "Email is required",
                    passwordRequired: "Password is required",
                    tooManyAttempts: "Too many failed attempts. Please try again later.",
                    networkError: "Network error. Please check your connection.",
                    notAuthority: "This account is not registered as an authority.",
                },
            },
            kn: {
                title: "ಅಧಿಕಾರಿ ಲಾಗಿನ್",
                subtitle: "ನಿಮ್ಮ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಪ್ರವೇಶಿಸಲು ಲಾಗಿನ್ ಮಾಡಿ",
                email: "ಇಮೇಲ್",
                password: "ಪಾಸ್‌ವರ್ಡ್",
                login: "ಲಾಗಿನ್",
                logging: "ಲಾಗಿನ್ ಆಗುತ್ತಿದೆ…",
                noAccount: "ಹೊಸ ಅಧಿಕಾರಿ?",
                register: "ನೋಂದಣಿ",
                back: "ಹಿಂದೆ",
                forgotPassword: "ಪಾಸ್ವರ್ಡ್ ಮರೆತಿರಾ?",
                govPortal: "ಸರ್ಕಾರಿ ಅಧಿಕಾರಿ ಪೋರ್ಟಲ್",
                secureAccess: "ಅಧಿಕೃತ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಸುರಕ್ಷಿತ ಪ್ರವೇಶ",
                checkingStatus: "ಪರಿಶೀಲನೆ ಸ್ಥಿತಿಯನ್ನು ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ...",
                redirecting: "ಮರುನಿರ್ದೇಶಿಸಲಾಗುತ್ತಿದೆ...",
                accountPending: "ಖಾತೆ ಪರಿಶೀಲನೆ ಬಾಕಿಯಿದೆ",
                accountPendingDesc: "ನಿಮ್ಮ ಖಾತೆಯು ಇನ್ನೂ ನಿರ್ವಾಹಕರಿಂದ ಪರಿಶೀಲನೆಗಾಗಿ ಬಾಕಿಯಿದೆ. ಪರಿಶೀಲಿಸಿದ ನಂತರ ನಿಮಗೆ ಸೂಚಿಸಲಾಗುವುದು.",
                accountRejected: "ಖಾತೆ ಪರಿಶೀಲನೆ ವಿಫಲವಾಗಿದೆ",
                accountRejectedDesc: "ನಿಮ್ಮ ಖಾತೆ ಪರಿಶೀಲನೆಯನ್ನು ಅನುಮೋದಿಸಲಾಗಿಲ್ಲ. ಹೆಚ್ಚಿನ ಮಾಹಿತಿಗಾಗಿ ದಯವಿಟ್ಟು ಬೆಂಬಲವನ್ನು ಸಂಪರ್ಕಿಸಿ.",
                contactSupport: "ಬೆಂಬಲವನ್ನು ಸಂಪರ್ಕಿಸಿ",
                tryAgain: "ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ",
                err: {
                    required: "ಇಮೇಲ್ ಮತ್ತು ಪಾಸ್‌ವರ್ಡ್ ನಮೂದಿಸಿ.",
                    failed: "ಲಾಗಿನ್ ವಿಫಲವಾಗಿದೆ. ನಿಮ್ಮ ರುಜುವಾತುಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.",
                    invalidEmail: "ಮಾನ್ಯ ಇಮೇಲ್ ವಿಳಾಸವನ್ನು ನಮೂದಿಸಿ",
                    emailRequired: "ಇಮೇಲ್ ಅಗತ್ಯವಿದೆ",
                    passwordRequired: "ಪಾಸ್‌ವರ್ಡ್ ಅಗತ್ಯವಿದೆ",
                    tooManyAttempts: "ಹಲವಾರು ವಿಫಲ ಪ್ರಯತ್ನಗಳು. ದಯವಿಟ್ಟು ನಂತರ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
                    networkError: "ನೆಟ್‌ವರ್ಕ್ ದೋಷ. ನಿಮ್ಮ ಸಂಪರ್ಕವನ್ನು ಪರಿಶೀಲಿಸಿ.",
                    notAuthority: "ಈ ಖಾತೆಯು ಅಧಿಕಾರಿಯಾಗಿ ನೋಂದಾಯಿಸಲ್ಪಟ್ಟಿಲ್ಲ.",
                },
            },
            hi: {
                title: "अधिकारी लॉगिन",
                subtitle: "डैशबोर्ड एक्सेस करने के लिए लॉगिन करें",
                email: "ईमेल",
                password: "पासवर्ड",
                login: "लॉगिन",
                logging: "लॉगिन हो रहा है…",
                noAccount: "नए अधिकारी?",
                register: "रजिस्टर",
                back: "वापस",
                forgotPassword: "पासवर्ड भूल गए?",
                govPortal: "सरकारी अधिकारी पोर्टल",
                secureAccess: "आधिकारिक डैशबोर्ड तक सुरक्षित पहुंच",
                checkingStatus: "सत्यापन स्थिति की जाँच की जा रही है...",
                redirecting: "पुनर्निर्देशित किया जा रहा है...",
                accountPending: "खाता सत्यापन लंबित",
                accountPendingDesc: "आपका खाता अभी भी प्रशासक द्वारा सत्यापन के लिए लंबित है। सत्यापित होने पर आपको सूचित किया जाएगा।",
                accountRejected: "खाता सत्यापन विफल",
                accountRejectedDesc: "आपका खाता सत्यापन स्वीकृत नहीं किया गया था। अधिक जानकारी के लिए कृपया सहायता से संपर्क करें।",
                contactSupport: "सहायता से संपर्क करें",
                tryAgain: "पुनः प्रयास करें",
                err: {
                    required: "ईमेल और पासवर्ड दर्ज करें।",
                    failed: "लॉगिन फेल हुआ। अपने क्रेडेंशियल्स जांचें।",
                    invalidEmail: "कृपया मान्य ईमेल पता दर्ज करें",
                    emailRequired: "ईमेल आवश्यक है",
                    passwordRequired: "पासवर्ड आवश्यक है",
                    tooManyAttempts: "बहुत अधिक असफल प्रयास। कृपया बाद में पुनः प्रयास करें।",
                    networkError: "नेटवर्क त्रुटि। अपना कनेक्शन जांचें।",
                    notAuthority: "यह खाता अधिकारी के रूप में पंजीकृत नहीं है।",
                },
            },
        };
        return L[locale] || L.en;
    }, [locale]);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [checkingStatus, setCheckingStatus] = useState(false);
    const [err, setErr] = useState("");
    const [pendingMessage, setPendingMessage] = useState<{
        show: boolean;
        status: "pending" | "rejected" | null;
    }>({ show: false, status: null });

    const [touched, setTouched] = useState({ email: false, password: false });
    const [fieldErrors, setFieldErrors] = useState({ email: "", password: "" });

    // ✅ Check if user is already logged in and redirect based on status
    useEffect(() => {
        const checkExistingAuth = async () => {
            const unsub = onAuthStateChanged(auth, async (user) => {
                if (user) {
                    setCheckingStatus(true);
                    try {
                        // Check authority status
                        const authorityDoc = await getDoc(doc(db, "authorities", user.uid));
                        
                        if (authorityDoc.exists()) {
                            const authorityData = authorityDoc.data();
                            
                            // Check verification status
                            const isVerified = authorityData.verified === true || 
                                             authorityData.status === "verified" || 
                                             authorityData.status === "active" ||
                                             (authorityData.verification?.status === "verified");
                            
                            if (isVerified) {
                                // Verified - go to dashboard
                                router.replace(`/${locale}/authority/dashboard`);
                            } else {
                                // Not verified - go to status page
                                router.replace(`/${locale}/authority/status`);
                            }
                        } else {
                            // No authority document - sign out and stay on login
                            await auth.signOut();
                            setCheckingStatus(false);
                        }
                    } catch (error) {
                        console.error("Error checking authority status:", error);
                        await auth.signOut();
                        setCheckingStatus(false);
                    }
                }
            });
            
            return () => unsub();
        };
        
        checkExistingAuth();
    }, [router, locale]);

    const validateFields = () => {
        const errors = { email: "", password: "" };
        let ok = true;

        if (!email.trim()) {
            errors.email = t.err.emailRequired;
            ok = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.email = t.err.invalidEmail;
            ok = false;
        }

        if (!password.trim()) {
            errors.password = t.err.passwordRequired;
            ok = false;
        }

        setFieldErrors(errors);
        return ok;
    };

    const prettyAuthError = (e: any) => {
        const code = e?.code || "";
        if (code === "auth/invalid-credential") return t.err.failed;
        if (code === "auth/user-not-found") return t.err.failed;
        if (code === "auth/wrong-password") return t.err.failed;
        if (code === "auth/too-many-requests") return t.err.tooManyAttempts;
        if (code === "auth/network-request-failed") return t.err.networkError;
        return e?.message || t.err.failed;
    };

    const submit = async () => {
        setErr("");
        setPendingMessage({ show: false, status: null });
        setTouched({ email: true, password: true });

        if (!validateFields()) return;

        try {
            setLoading(true);

            // ✅ Persist session
            await setPersistence(auth, browserLocalPersistence);

            // ✅ Sign in
            const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
            const user = userCredential.user;

            // ✅ Check if user exists in authorities collection
            const authorityDoc = await getDoc(doc(db, "authorities", user.uid));
            
            if (!authorityDoc.exists()) {
                // Not an authority - sign out and show error
                await auth.signOut();
                setErr(t.err.notAuthority);
                setLoading(false);
                return;
            }

            const authorityData = authorityDoc.data();
            
            // ✅ Check verification status
            const isVerified = authorityData.verified === true || 
                             authorityData.status === "verified" || 
                             authorityData.status === "active" ||
                             (authorityData.verification?.status === "verified");

            if (isVerified) {
                // Verified - go to dashboard
                router.replace(`/${locale}/authority/dashboard`);
            } else {
                // Not verified - check if pending or rejected
                const status = authorityData.status || authorityData.verification?.status;
                
                if (status === "rejected") {
                    setPendingMessage({ show: true, status: "rejected" });
                } else {
                    setPendingMessage({ show: true, status: "pending" });
                }
                
                // Stay on login page with message
                setLoading(false);
            }

        } catch (e: any) {
            setErr(prettyAuthError(e));
            setLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !loading && !checkingStatus) submit();
    };

    // Show loading while checking existing auth
    if (checkingStatus) {
        return (
            <Screen padded>
                <div className="min-h-screen flex items-center justify-center p-4">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-green-700 font-semibold">{t.checkingStatus}</p>
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
                
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out forwards;
                }
                
                .pending-card {
                    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
                    border: 2px solid #fbbf24;
                }
                
                .rejected-card {
                    background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
                    border: 2px solid #ef4444;
                }
            `}</style>

            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    {/* Header */}
                    <div className="relative mb-10 animate-fadeIn">
                        <button
                            onClick={() => router.back()}
                            className="absolute left-0 top-0 p-3 rounded-xl border-2 border-green-100 bg-white hover:bg-green-50 text-green-700 transition-all hover:scale-105"
                            aria-label={t.back}
                            disabled={loading}
                        >
                            <FiArrowLeft className="w-5 h-5" />
                        </button>

                        <div className="text-center">
                            <div className="flex items-center justify-center gap-2 mb-4">
                                <FiShield className="w-9 h-9 text-green-700" />
                                <h1 className="text-3xl font-bold text-green-900">{t.title}</h1>
                            </div>
                            <p className="text-sm text-green-700/75 font-semibold">{t.subtitle}</p>
                            <p className="text-xs text-green-600/70 mt-3 font-semibold">🏛️ {t.govPortal}</p>
                        </div>
                    </div>

                    {/* Pending/Rejected Message */}
                    {pendingMessage.show && pendingMessage.status === "pending" && (
                        <div className="mb-6 p-5 rounded-2xl pending-card animate-fadeIn">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-yellow-100 rounded-full">
                                    <FiClock className="w-5 h-5 text-yellow-600" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-yellow-800 mb-1">{t.accountPending}</h3>
                                    <p className="text-sm text-yellow-700">{t.accountPendingDesc}</p>
                                    <button
                                        onClick={() => router.push(`/${locale}/authority/status`)}
                                        className="mt-3 text-sm font-semibold text-yellow-800 hover:text-yellow-900 underline"
                                    >
                                        {t.checkingStatus}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {pendingMessage.show && pendingMessage.status === "rejected" && (
                        <div className="mb-6 p-5 rounded-2xl rejected-card animate-fadeIn">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-red-100 rounded-full">
                                    <FiXCircle className="w-5 h-5 text-red-600" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-red-800 mb-1">{t.accountRejected}</h3>
                                    <p className="text-sm text-red-700">{t.accountRejectedDesc}</p>
                                    <div className="flex gap-3 mt-3">
                                        <button
                                            onClick={() => router.push(`/${locale}/support`)}
                                            className="text-sm font-semibold text-red-800 hover:text-red-900 underline"
                                        >
                                            {t.contactSupport}
                                        </button>
                                        <button
                                            onClick={() => setPendingMessage({ show: false, status: null })}
                                            className="text-sm font-semibold text-red-800 hover:text-red-900 underline"
                                        >
                                            {t.tryAgain}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Error Alert */}
                    {err && !pendingMessage.show && (
                        <div className="mb-6 p-4 rounded-2xl border border-red-200 bg-red-50/80 animate-fadeIn">
                            <div className="flex items-start gap-3 text-red-700">
                                <FiAlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                <span className="text-sm leading-snug font-medium">{err}</span>
                            </div>
                        </div>
                    )}

                    {/* Login Form */}
                    <div className="border border-green-100 rounded-3xl p-6 shadow-xl bg-white/85 backdrop-blur-sm animate-fadeIn">
                        {/* Email */}
                        <div className="mb-6">
                            <label className="text-sm font-semibold text-green-900 mb-2 flex items-center gap-2">
                                <FiMail className="w-4 h-4 text-green-600" />
                                {t.email}
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    if (touched.email) {
                                        setFieldErrors((p) => ({ ...p, email: "" }));
                                        setErr("");
                                    }
                                }}
                                onBlur={() => setTouched((p) => ({ ...p, email: true }))}
                                onKeyPress={handleKeyPress}
                                className={`w-full rounded-2xl px-5 py-3 outline-none border-2 transition-all ${
                                    fieldErrors.email 
                                        ? "border-red-300 focus:border-red-500" 
                                        : "border-green-200 focus:border-green-500 focus:shadow-lg"
                                }`}
                                placeholder="authority@official.gov.in"
                                disabled={loading}
                                autoFocus
                            />
                            {fieldErrors.email && touched.email && (
                                <div className="text-xs text-red-600 mt-2 font-semibold flex items-center gap-1">
                                    <FiAlertCircle className="w-3 h-3" />
                                    {fieldErrors.email}
                                </div>
                            )}
                        </div>

                        {/* Password */}
                        <div className="mb-6">
                            <label className="text-sm font-semibold text-green-900 mb-2 flex items-center gap-2">
                                <FiLock className="w-4 h-4 text-green-600" />
                                {t.password}
                            </label>
                            <div className="relative">
                                <input
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        if (touched.password) {
                                            setFieldErrors((p) => ({ ...p, password: "" }));
                                            setErr("");
                                        }
                                    }}
                                    onBlur={() => setTouched((p) => ({ ...p, password: true }))}
                                    onKeyPress={handleKeyPress}
                                    type={showPassword ? "text" : "password"}
                                    className={`w-full rounded-2xl px-5 pr-14 py-3 outline-none border-2 transition-all ${
                                        fieldErrors.password 
                                            ? "border-red-300 focus:border-red-500" 
                                            : "border-green-200 focus:border-green-500 focus:shadow-lg"
                                    }`}
                                    placeholder="••••••••"
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-green-700 p-2 hover:scale-110 transition-all"
                                    disabled={loading}
                                >
                                    {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                                </button>
                            </div>
                            {fieldErrors.password && touched.password && (
                                <div className="text-xs text-red-600 mt-2 font-semibold flex items-center gap-1">
                                    <FiAlertCircle className="w-3 h-3" />
                                    {fieldErrors.password}
                                </div>
                            )}

                            <div className="mt-3 text-right">
                                <button
                                    type="button"
                                    onClick={() => router.push(`/${locale}/authority/forgot-password`)}
                                    className="text-green-700 hover:text-green-900 text-sm font-semibold flex items-center gap-1 justify-end w-full hover:gap-2 transition-all"
                                    disabled={loading}
                                >
                                    <FiHelpCircle className="w-4 h-4" />
                                    {t.forgotPassword}
                                </button>
                            </div>
                        </div>

                        {/* Login Button */}
                        <button
                            onClick={submit}
                            disabled={loading || checkingStatus}
                            className="w-full py-3.5 rounded-2xl font-semibold text-white bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>{t.logging}</span>
                                </>
                            ) : (
                                <>
                                    <FiUserCheck className="w-5 h-5" />
                                    <span>{t.login}</span>
                                </>
                            )}
                        </button>

                        <div className="my-6 text-center text-sm font-semibold text-green-700/80 relative">
                            <span className="bg-white px-4 relative z-10">{t.noAccount}</span>
                            <div className="absolute top-1/2 left-0 w-full h-px bg-green-200 -z-0"></div>
                        </div>

                        <button
                            onClick={() => router.push(`/${locale}/authority/register`)}
                            className="w-full py-3.5 rounded-2xl border-2 border-green-200 bg-white hover:bg-green-50 text-green-900 font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] hover:border-green-300"
                            disabled={loading}
                        >
                            {t.register}
                        </button>
                    </div>

                    {/* Footer */}
                    <div className="mt-10 text-center text-sm text-green-700/70 font-semibold animate-fadeIn">
                        <p className="flex items-center justify-center gap-2">
                            <FiShield className="w-4 h-4" />
                            {t.secureAccess}
                        </p>
                    </div>
                </div>
            </div>
        </Screen>
    );
}
