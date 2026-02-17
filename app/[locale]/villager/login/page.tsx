"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../../lib/firebase";
import Screen from "../../../components/Screen";
import { FiMail, FiLock, FiEye, FiEyeOff, FiAlertCircle, FiUsers } from "react-icons/fi";

export default function VillagerLoginPage() {
    const router = useRouter();
    const params = useParams() as { locale?: string };
    const locale = params?.locale || "en";

    const t = useMemo(() => {
        const L: any = {
            en: {
                title: "Villager Login",
                subtitle: "Login to raise issues and track updates",
                email: "Email",
                password: "Password",
                login: "Login",
                creating: "Logging in…",
                noAcc: "Don't have an account?",
                register: "Register",
                forgotPassword: "Forgot your password?",
                bad: "Invalid Email ID or password",
                invalidEmail: "Invalid Email ID or password",
                noProfile: "Profile not found. Please register.",
                communityBased: "Community-based issue tracking",
                fillAllFields: "Please fill in all fields.",
                tooManyAttempts: "Too many login attempts. Please try again later.",
                requiredFieldEmail: "Email is required",
                requiredFieldPassword: "Password is required",
            },
            kn: {
                title: "ಗ್ರಾಮಸ್ಥ ಲಾಗಿನ್",
                subtitle: "ಸಮಸ್ಯೆಗಳನ್ನು ಬೆಳೆಸಲು ಮತ್ತು ಅಪ್‌ಡೇಟ್‌ಗಳನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಲು ಲಾಗಿನ್ ಮಾಡಿ",
                email: "ಇಮೇಲ್",
                password: "ಪಾಸ್‌ವರ್ಡ್",
                login: "ಲಾಗಿನ್",
                creating: "ಲಾಗಿನ್ ಆಗುತ್ತಿದೆ…",
                noAcc: "ಖಾತೆ ಹೊಂದಿಲ್ಲವೇ?",
                register: "ನೋಂದಣಿ",
                forgotPassword: "ಪಾಸ್‌ವರ್ಡ್ ಮರೆತುವಿರಾ?",
                bad: "ಅಮಾನ್ಯ ಇಮೇಲ್ ಐಡಿ ಅಥವಾ ಪಾಸ್‌ವರ್ಡ್",
                invalidEmail: "ಅಮಾನ್ಯ ಇಮೇಲ್ ಐಡಿ ಅಥವಾ ಪಾಸ್‌ವರ್ಡ್",
                noProfile: "ಪ್ರೊಫೈಲ್ ಕಂಡುಬಂದಿಲ್ಲ. ದಯವಿಟ್ಟು ನೋಂದಣಿ ಮಾಡಿ.",
                communityBased: "ಸಮುದಾಯ-ಆಧಾರಿತ ಸಮಸ್ಯೆ ಟ್ರ್ಯಾಕಿಂಗ್",
                fillAllFields: "ದಯವಿಟ್ಟು ಎಲ್ಲ ಕ್ಷೇತ್ರಗಳನ್ನು ತುಂಬಿಸಿ.",
                tooManyAttempts: "ಹೆಚ್ಚಿನ ಲಾಗಿನ್ ಪ್ರಯತ್ನಗಳು. ದಯವಿಟ್ಟು ನಂತರ ಪ್ರಯತ್ನಿಸಿ.",
                requiredFieldEmail: "Email is required",
                requiredFieldPassword: "Password is required",
            },
            hi: {
                title: "ग्रामीण लॉगिन",
                subtitle: "समस्याओं को उठाने और अपडेट ट्रैक करने के लिए लॉगिन करें",
                email: "ईमेल",
                password: "पासवर्ड",
                login: "लॉगिन",
                creating: "लॉगिन हो रहा है…",
                noAcc: "खाता नहीं है?",
                register: "रजिस्टर",
                forgotPassword: "पासवर्ड भूल गए?",
                bad: "अमान्य ईमेल आईडी या पासवर्ड",
                invalidEmail: "अमान्य ईमेल आईडी या पासवर्ड",
                noProfile: "प्रोफ़ाइल नहीं मिली। कृपया रजिस्टर करें।",
                communityBased: "समुदाय-आधारित समस्या ट्रैकिंग",
                fillAllFields: "कृपया सभी क्षेत्रों को भरें।",
                tooManyAttempts: "बहुत सारे लॉगिन प्रयास। कृपया बाद में पुन: प्रयास करें।",
                requiredFieldEmail: "ईमेल आवश्यक है",
                requiredFieldPassword: "पासवर्ड आवश्यक है",
            },
        };
        return L[locale] || L.en;
    }, [locale]);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [touched, setTouched] = useState({ email: false, password: false });
    const [fieldErrors, setFieldErrors] = useState({ email: "", password: "" });
    const [focusedField, setFocusedField] = useState<string | null>(null);

    const validateFields = () => {
        const errors = { email: "", password: "" };
        let isValid = true;

        if (!email.trim()) {
            errors.email = t.requiredFieldEmail;
            isValid = false;
        }

        if (!password.trim()) {
            errors.password = t.requiredFieldPassword;
            isValid = false;
        }

        setFieldErrors(errors);
        return isValid;
    };

    const submit = async () => {
        setErr("");
        setTouched({ email: true, password: true });

        if (!validateFields()) {
            return;
        }

        try {
            setLoading(true);
            setIsSubmitting(true);

            const cred = await signInWithEmailAndPassword(
                auth,
                email.trim(),
                password
            );

            const vSnap = await getDoc(doc(db, "villagers", cred.user.uid));

            if (!vSnap.exists()) {
                setErr(t.noProfile);
                await auth.signOut();
                setIsSubmitting(false);
                return;
            }

            const v = vSnap.data() as any;

            if (v.verified === true) {
                router.replace(`/${locale}/villager/dashboard`);
            } else {
                router.replace(`/${locale}/villager/status`);
            }
        } catch (e: any) {
            if (
                e?.code === "auth/user-not-found" ||
                e?.code === "auth/wrong-password" ||
                e?.code === "auth/invalid-credential"
            ) {
                setErr(t.bad);
            } else if (e?.code === "auth/invalid-email") {
                setErr(t.invalidEmail);
            } else if (e?.code === "auth/too-many-requests") {
                setErr(t.tooManyAttempts);
            } else {
                setErr(e?.message || "Login failed. Please try again.");
            }
            setIsSubmitting(false);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !loading && !isSubmitting) {
            submit();
        }
    };

    return (
        <Screen padded>
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(15px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-3px); }
                    75% { transform: translateX(3px); }
                }

                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-8px); }
                }

                @keyframes glow {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(22, 163, 74, 0.3); }
                    50% { box-shadow: 0 0 0 8px rgba(22, 163, 74, 0); }
                }

                .animate-fadeIn {
                    animation: fadeIn 0.5s ease-out forwards;
                }

                .animate-slideUp {
                    animation: slideUp 0.5s ease-out forwards;
                    opacity: 0;
                }

                .animate-shake {
                    animation: shake 0.35s ease-in-out;
                }

                .animate-float {
                    animation: float 3s ease-in-out infinite;
                }

                .animate-glow {
                    animation: glow 2s infinite;
                }

                .delay-100 { animation-delay: 0.1s; }
                .delay-200 { animation-delay: 0.2s; }
                .delay-300 { animation-delay: 0.3s; }
                .delay-400 { animation-delay: 0.4s; }

                .input-field {
                    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                    background: rgba(255, 255, 255, 0.7);
                    border: 2px solid rgba(22, 163, 74, 0.15);
                }

                .input-field:hover {
                    border-color: rgba(22, 163, 74, 0.3);
                    background: rgba(255, 255, 255, 0.85);
                }

                .input-field:focus {
                    background: rgba(255, 255, 255, 0.95);
                    border-color: rgba(22, 163, 74, 0.6);
                    box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.08), 0 4px 12px rgba(22, 163, 74, 0.1);
                    transform: translateY(-2px);
                }

                .input-field.error {
                    background: rgba(255, 255, 255, 0.9);
                    border-color: rgba(239, 68, 68, 0.4) !important;
                    animation: shake 0.35s ease-in-out;
                }

                .input-field.error:focus {
                    border-color: rgba(239, 68, 68, 0.7) !important;
                    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.08), 0 4px 12px rgba(239, 68, 68, 0.1);
                }

                .card-bg {
                    background: rgba(255, 255, 255, 0.85);
                    backdrop-filter: blur(8px);
                }

                .divider {
                    position: relative;
                    text-align: center;
                    margin: 2rem 0 1.5rem 0;
                }

                .divider::before {
                    content: '';
                    position: absolute;
                    left: 0;
                    top: 50%;
                    width: 100%;
                    height: 1px;
                    background: linear-gradient(to right, transparent, rgba(22, 163, 74, 0.15), transparent);
                }

                .divider span {
                    background: rgba(255, 255, 255, 0.85);
                    padding: 0 1rem;
                    color: rgba(22, 163, 74, 0.8);
                    font-size: 0.9rem;
                    font-weight: 600;
                    position: relative;
                    letter-spacing: 0.3px;
                }

                .error-text {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.75rem;
                    font-weight: 500;
                    color: rgb(239, 68, 68);
                    margin-top: 0.5rem;
                    animation: slideUp 0.3s ease-out;
                }

                .button-base {
                    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                }

                .button-base:active {
                    transform: scale(0.98);
                }

                .icon-button {
                    transition: all 0.2s ease;
                    cursor: pointer;
                }

                .icon-button:hover {
                    transform: scale(1.1);
                }

                .icon-button:active {
                    transform: scale(0.95);
                }

                .link-hover {
                    position: relative;
                    transition: color 0.2s ease;
                }

                .link-hover::after {
                    content: '';
                    position: absolute;
                    bottom: -2px;
                    left: 0;
                    width: 0;
                    height: 1px;
                    background: currentColor;
                    transition: width 0.3s ease;
                }

                .link-hover:hover::after {
                    width: 100%;
                }

                .header-icon {
                    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                }

                .header-icon:hover {
                    transform: scale(1.15) rotate(5deg);
                    filter: drop-shadow(0 4px 8px rgba(22, 163, 74, 0.2));
                }

                .bg-orb {
                    transition: opacity 0.3s ease;
                }
            `}</style>

            <div className="min-h-screen flex items-center justify-center p-4 animate-fadeIn">
                <div className="w-full max-w-md">
                    {/* Subtle background orbs */}
                    <div className="absolute inset-0 -z-10 overflow-hidden">
                        <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-green-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
                        <div className="absolute -bottom-1/4 left-1/4 w-72 h-72 bg-emerald-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
                    </div>

                    {/* Header */}
                    <div className="mb-10 animate-slideUp">
                        <div className="flex items-center gap-2 sm:gap-3 mb-4">
                            <div className="header-icon">
                                <FiUsers className="w-8 sm:w-9 h-8 sm:h-9 text-green-700" />
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-bold text-green-900 tracking-tight">
                                {t.title}
                            </h1>
                        </div>
                        <p className="text-sm sm:text-base text-green-700/75 leading-relaxed font-semibold">
                            {t.subtitle}
                        </p>
                        <p className="text-xs sm:text-sm text-green-600/70 mt-3 font-semibold">
                            ✨ {t.communityBased}
                        </p>
                    </div>

                    {/* Error Alert */}
                    {err && (
                        <div className="mb-6 p-4 rounded-2xl border border-red-200 bg-red-50/80 animate-slideUp">
                            <div className="flex items-start gap-3 text-red-700">
                                <FiAlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                <span className="text-sm leading-snug">
                                    {err}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Form Card */}
                    <div className="card-bg border border-green-100 rounded-3xl p-6 sm:p-8 shadow-lg animate-slideUp delay-100">
                        {/* Email Field */}
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
                                    if (touched.email && e.target.value.trim()) {
                                        setFieldErrors((prev) => ({ ...prev, email: "" }));
                                    }
                                }}
                                onFocus={() => setFocusedField("email")}
                                onBlur={() => {
                                    setTouched((prev) => ({ ...prev, email: true }));
                                    setFocusedField(null);
                                }}
                                onKeyPress={handleKeyPress}
                                className={`input-field w-full rounded-2xl px-5 py-3 sm:py-3.5
                                  outline-none text-green-900 placeholder-green-400/50 text-base
                                  disabled:opacity-60 disabled:cursor-not-allowed
                                  ${fieldErrors.email ? "error" : ""}`}
                                placeholder="your.email@gmail.com"
                                inputMode="email"
                                autoComplete="email"
                                disabled={loading || isSubmitting}
                                autoFocus
                            />
                            {fieldErrors.email && touched.email && (
                                <div className="error-text">
                                    <span>⚠</span>
                                    {fieldErrors.email}
                                </div>
                            )}
                        </div>

                        {/* Password Field */}
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
                                        if (touched.password && e.target.value.trim()) {
                                            setFieldErrors((prev) => ({ ...prev, password: "" }));
                                        }
                                    }}
                                    onFocus={() => setFocusedField("password")}
                                    onBlur={() => {
                                        setTouched((prev) => ({ ...prev, password: true }));
                                        setFocusedField(null);
                                    }}
                                    onKeyPress={handleKeyPress}
                                    type={showPassword ? "text" : "password"}
                                    className={`input-field w-full rounded-2xl px-5 pr-14 py-3 sm:py-3.5
                                      outline-none text-green-900 placeholder-green-400/50 text-base
                                      disabled:opacity-60 disabled:cursor-not-allowed
                                      ${fieldErrors.password ? "error" : ""}`}
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                    disabled={loading || isSubmitting}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="icon-button absolute right-3 top-1/2 -translate-y-1/2 text-green-600/60 hover:text-green-700 p-2 rounded-lg"
                                    disabled={loading || isSubmitting}
                                    aria-label="Toggle password visibility"
                                >
                                    {showPassword ? (
                                        <FiEyeOff className="w-5 h-5" />
                                    ) : (
                                        <FiEye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                            {fieldErrors.password && touched.password && (
                                <div className="error-text">
                                    <span>⚠</span>
                                    {fieldErrors.password}
                                </div>
                            )}

                            {/* Forgot Password Link */}
                            <div className="mt-3 text-right">
                                <button
                                    type="button"
                                    onClick={() => router.push(`/${locale}/authority/forgot-password`)}
                                    className="link-hover text-green-700 hover:text-green-900 text-sm font-semibold"
                                    disabled={loading || isSubmitting}
                                >
                                    {t.forgotPassword}
                                </button>
                            </div>
                        </div>

                        {/* Login Button */}
                        <button
                            onClick={submit}
                            disabled={loading || isSubmitting}
                            className="button-base w-full py-3.5 sm:py-4 px-6 rounded-2xl font-semibold text-white text-base sm:text-lg
                              bg-gradient-to-r from-green-600 to-emerald-500
                              hover:from-green-700 hover:to-emerald-600
                              shadow-md hover:shadow-lg
                              focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2
                              disabled:opacity-60 disabled:cursor-not-allowed
                              flex items-center justify-center gap-2"
                        >
                            {loading || isSubmitting ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>{t.creating}</span>
                                </>
                            ) : (
                                <>
                                    <FiLock className="w-5 h-5" />
                                    <span>{t.login}</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Divider */}
                    <div className="divider animate-slideUp delay-200">
                        <span>{t.noAcc}</span>
                    </div>

                    {/* Register Link */}
                    <button
                        onClick={() => router.push(`/${locale}/villager/register`)}
                        className="button-base w-full py-3.5 sm:py-4 px-6 rounded-2xl border border-green-200 bg-white hover:bg-green-50/50 text-green-900 font-semibold transition-all shadow-sm hover:shadow-md animate-slideUp delay-300"
                        disabled={loading || isSubmitting}
                    >
                        {t.register}
                    </button>

                    {/* Footer Note */}
                    <div className="mt-10 text-center text-sm sm:text-base text-green-700/70 font-semibold animate-fadeIn" style={{ animationDelay: '0.5s' }}>
                        <p>🤝 Join your community to raise and track issues</p>
                    </div>
                </div>
            </div>
        </Screen>
    );
}