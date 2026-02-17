"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Screen from "../../../components/Screen";
import { auth } from "../../../lib/firebase";
import {
    signInWithEmailAndPassword,
    setPersistence,
    browserLocalPersistence,
    onAuthStateChanged,
} from "firebase/auth";
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
                err: {
                    required: "Please enter email and password.",
                    failed: "Login failed. Please try again.",
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
                err: {
                    required: "ಇಮೇಲ್ ಮತ್ತು ಪಾಸ್‌ವರ್ಡ್ ನಮೂದಿಸಿ.",
                    failed: "ಲಾಗಿನ್ ವಿಫಲವಾಗಿದೆ. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
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
                err: {
                    required: "ईमेल और पासवर्ड दर्ज करें।",
                    failed: "लॉगिन फेल हुआ। फिर से कोशिश करें।",
                },
            },
        };
        return L[locale] || L.en;
    }, [locale]);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    // ✅ Single loading flag is enough
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    const [touched, setTouched] = useState({ email: false, password: false });
    const [fieldErrors, setFieldErrors] = useState({ email: "", password: "" });

    // ✅ If user is already logged in, go to status (stable)
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            if (u) {
                router.replace(`/${locale}/authority/status`);
            }
        });
        return () => unsub();
    }, [router, locale]);

    const validateFields = () => {
        const errors = { email: "", password: "" };
        let ok = true;

        if (!email.trim()) {
            errors.email = "Email is required";
            ok = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.email = "Please enter a valid email address";
            ok = false;
        }

        if (!password.trim()) {
            errors.password = "Password is required";
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
        if (code === "auth/too-many-requests") return "Too many attempts. Try later.";
        return e?.message || t.err.failed;
    };

    // ✅ Key change: DON’T read Firestore here, DON’T go dashboard here
    const submit = async () => {
        setErr("");
        setTouched({ email: true, password: true });

        if (!validateFields()) return;

        try {
            setLoading(true);

            // ✅ Persist session
            await setPersistence(auth, browserLocalPersistence);

            // ✅ Sign in
            await signInWithEmailAndPassword(auth, email.trim(), password);

            // ✅ Always go to status page (single source of truth)
            router.replace(`/${locale}/authority/status`);
        } catch (e: any) {
            setErr(prettyAuthError(e));
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !loading) submit();
    };

    // ------------------- YOUR UI BELOW (unchanged) -------------------
    return (
        <Screen padded>
            {/* keep your styles + UI as you already have */}
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    {/* Header */}
                    <div className="relative mb-10">
                        <button
                            onClick={() => router.back()}
                            className="absolute left-0 top-0 p-3 rounded-xl border-2 border-green-100 bg-white hover:bg-green-50 text-green-700"
                            aria-label={t.back}
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

                    {err && (
                        <div className="mb-6 p-4 rounded-2xl border border-red-200 bg-red-50/80">
                            <div className="flex items-start gap-3 text-red-700">
                                <FiAlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                <span className="text-sm leading-snug font-medium">{err}</span>
                            </div>
                        </div>
                    )}

                    <div className="border border-green-100 rounded-3xl p-6 shadow-xl bg-white/85">
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
                                    if (touched.email) setFieldErrors((p) => ({ ...p, email: "" }));
                                }}
                                onBlur={() => setTouched((p) => ({ ...p, email: true }))}
                                onKeyPress={handleKeyPress}
                                className={`w-full rounded-2xl px-5 py-3 outline-none border-2 ${fieldErrors.email ? "border-red-300" : "border-green-200"
                                    }`}
                                placeholder="authority@official.gov.in"
                                disabled={loading}
                                autoFocus
                            />
                            {fieldErrors.email && touched.email && (
                                <div className="text-xs text-red-600 mt-2 font-semibold">⚠ {fieldErrors.email}</div>
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
                                        if (touched.password) setFieldErrors((p) => ({ ...p, password: "" }));
                                    }}
                                    onBlur={() => setTouched((p) => ({ ...p, password: true }))}
                                    onKeyPress={handleKeyPress}
                                    type={showPassword ? "text" : "password"}
                                    className={`w-full rounded-2xl px-5 pr-14 py-3 outline-none border-2 ${fieldErrors.password ? "border-red-300" : "border-green-200"
                                        }`}
                                    placeholder="••••••••"
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-green-700 p-2"
                                    disabled={loading}
                                >
                                    {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                                </button>
                            </div>
                            {fieldErrors.password && touched.password && (
                                <div className="text-xs text-red-600 mt-2 font-semibold">⚠ {fieldErrors.password}</div>
                            )}

                            <div className="mt-3 text-right">
                                <button
                                    type="button"
                                    onClick={() => router.push(`/${locale}/authority/forgot-password`)}
                                    className="text-green-700 hover:text-green-900 text-sm font-semibold flex items-center gap-1 justify-end w-full"
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
                            disabled={loading}
                            className="w-full py-3.5 rounded-2xl font-semibold text-white bg-gradient-to-r from-green-600 to-emerald-500 flex items-center justify-center gap-2 disabled:opacity-60"
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

                        <div className="my-6 text-center text-sm font-semibold text-green-700/80">
                            {t.noAccount}
                        </div>

                        <button
                            onClick={() => router.push(`/${locale}/authority/register`)}
                            className="w-full py-3.5 rounded-2xl border border-green-200 bg-white hover:bg-green-50 text-green-900 font-semibold"
                            disabled={loading}
                        >
                            {t.register}
                        </button>
                    </div>

                    <div className="mt-10 text-center text-sm text-green-700/70 font-semibold">
                        <p>🔒 {t.secureAccess}</p>
                    </div>
                </div>
            </div>
        </Screen>
    );
}
