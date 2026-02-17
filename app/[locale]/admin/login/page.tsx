"use client";

import { useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { FiLock, FiUser, FiEye, FiEyeOff, FiAlertCircle, FiShield } from "react-icons/fi";

import Screen from "../../../components/Screen";
import { useAdminAuth } from "../../../context/AdminAuthContext";

export default function AdminLoginPage() {
    const router = useRouter();
    const params = useParams() as { locale?: string };
    const locale = params?.locale || "en";

    const { login, loading } = useAdminAuth();

    const [email, setEmail] = useState(
        process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || ""
    );
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const t = useMemo(() => {
        const LABELS: Record<string, any> = {
            en: {
                title: "Super Admin Login",
                subtitle: "Access the entire VITAL system",
                emailLabel: "Email",
                passwordLabel: "Password",
                emailPlaceholder: "Enter admin email",
                passwordPlaceholder: "Enter password",
                loginButton: "Login",
                loggingIn: "Logging in...",
                errorCredentials: "Invalid email or password",
                secureAccess: "Secure Access",
                footer: "© 2026 VITAL by Unnat Bharat Abhiyan",
                features: "Enterprise-grade security for system management",
            },
            kn: {
                title: "ಸೂಪರ್ ಆಡ್ಮಿನ್ ಲಾಗಿನ್",
                subtitle: "ಪೂರ್ಣ VITAL ವ್ಯವಸ್ಥೆ ಪ್ರವೇಶ",
                emailLabel: "ಇಮೇಲ್",
                passwordLabel: "ಪಾಸ್ವರ್ಡ್",
                emailPlaceholder: "ಆಡ್ಮಿನ್ ಇಮೇಲ್ ನಮೂದಿಸಿ",
                passwordPlaceholder: "ಪಾಸ್ವರ್ಡ್ ನಮೂದಿಸಿ",
                loginButton: "ಲಾಗಿನ್",
                loggingIn: "ಲಾಗಿನ್ ಆಗುತ್ತಿದೆ...",
                errorCredentials: "ಅಮಾನ್ಯ ಇಮೇಲ್ ಅಥವಾ ಪಾಸ್ವರ್ಡ್",
                secureAccess: "ನಿರಾಪದ ಪ್ರವೇಶ",
                footer: "© 2026 VITAL by Unnat Bharat Abhiyan",
                features: "ವ್ಯವಸ್ಥೆ ನಿರ್ವಹಣೆಗೆ ಎಂಟರ್‌ಪ್ರೈজ್-ಗ್ರೇಡ್ ಭದ್ರತೆ",
            },
            hi: {
                title: "सुपर एडमिन लॉगिन",
                subtitle: "पूरे VITAL सिस्टम तक पहुंच",
                emailLabel: "ईमेल",
                passwordLabel: "पासवर्ड",
                emailPlaceholder: "एडमिन ईमेल दर्ज करें",
                passwordPlaceholder: "पासवर्ड दर्ज करें",
                loginButton: "लॉगिन",
                loggingIn: "लॉगिन हो रहा है...",
                errorCredentials: "अमान्य ईमेल या पासवर्ड",
                secureAccess: "सुरक्षित पहुंच",
                footer: "© 2026 VITAL by Unnat Bharat Abhiyan",
                features: "सिस्टम प्रबंधन के लिए एंटरप्राइज-ग्रेड सुरक्षा",
            },
        };
        return LABELS[locale] || LABELS.en;
    }, [locale]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsSubmitting(true);

        try {
            await login(email.trim(), password);
            router.push(`/${locale}/admin/dashboard`);
        } catch (err: any) {
            setError(err?.message || t.errorCredentials);
            setIsSubmitting(false);
        }
    };

    return (
        <Screen center padded={false}>
            <style>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }

                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(40px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes slideInLeft {
                    from {
                        opacity: 0;
                        transform: translateX(-40px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }

                @keyframes pulse-border {
                    0%, 100% {
                        border-color: rgb(220, 252, 231);
                    }
                    50% {
                        border-color: rgb(167, 243, 208);
                    }
                }

                @keyframes float {
                    0%, 100% {
                        transform: translateY(0px);
                    }
                    50% {
                        transform: translateY(-8px);
                    }
                }

                @keyframes shimmer {
                    0% {
                        background-position: -1000px 0;
                    }
                    100% {
                        background-position: 1000px 0;
                    }
                }

                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-4px); }
                    75% { transform: translateX(4px); }
                }

                .animate-fadeIn {
                    animation: fadeIn 0.6s ease-out forwards;
                }

                .animate-slideUp {
                    animation: slideUp 0.8s ease-out forwards;
                    opacity: 0;
                }

                .animate-slideInLeft {
                    animation: slideInLeft 0.6s ease-out forwards;
                    opacity: 0;
                }

                .animate-float {
                    animation: float 3s ease-in-out infinite;
                }

                .animate-shake {
                    animation: shake 0.4s ease-in-out;
                }

                .input-focus {
                    transition: all 0.3s ease;
                }

                .input-focus:focus {
                    box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1),
                                0 4px 12px rgba(22, 163, 74, 0.15);
                }

                .button-glow {
                    position: relative;
                    overflow: hidden;
                }

                .button-glow::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
                    transition: left 0.5s;
                }

                .button-glow:hover::before {
                    left: 100%;
                }

                .lock-icon {
                    animation: float 4s ease-in-out infinite;
                }

                .card-bg {
                    background: linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(240,253,244,0.8) 100%);
                    backdrop-filter: blur(10px);
                }

                .form-input {
                    background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(240,253,244,0.5) 100%);
                    transition: all 0.3s ease;
                }

                .form-input:focus {
                    background: linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(240,253,244,0.8) 100%);
                }

                .error-shake {
                    animation: shake 0.4s ease-in-out;
                }

                /* Stagger animations */
                .delay-100 { animation-delay: 0.1s; }
                .delay-200 { animation-delay: 0.2s; }
                .delay-300 { animation-delay: 0.3s; }
                .delay-400 { animation-delay: 0.4s; }
                .delay-500 { animation-delay: 0.5s; }

                /* Loading state */
                .loading-spinner {
                    display: inline-block;
                    width: 16px;
                    height: 16px;
                    border: 2px solid rgba(255,255,255,0.3);
                    border-radius: 50%;
                    border-top-color: white;
                    animation: spin 0.8s linear infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                /* Gradient text */
                .gradient-text {
                    background: linear-gradient(135deg, #16a34a, #15803d);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                /* Smooth transitions */
                input, button, textarea, select {
                    transition: all 0.3s ease;
                }
            `}</style>

            <div className="w-full px-4 sm:px-6 py-8 flex items-center justify-center min-h-screen animate-fadeIn">
                <div className="w-full max-w-md">
                    {/* Decorative Elements */}
                    <div className="absolute inset-0 -z-10 overflow-hidden">
                        <div className="absolute top-20 right-10 w-72 h-72 bg-gradient-to-br from-green-100 to-emerald-50 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" />
                        <div className="absolute bottom-10 left-10 w-72 h-72 bg-gradient-to-br from-green-50 to-emerald-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20" style={{ animation: 'float 4s ease-in-out infinite', animationDelay: '2s' }} />
                    </div>

                    {/* Main Card */}
                    <div className="card-bg rounded-3xl border-2 border-green-100 shadow-2xl p-8 sm:p-10 animate-slideUp delay-100 relative z-10">
                        {/* Header */}
                        <div className="text-center mb-8 sm:mb-10">
                            {/* Lock Icon */}
                            <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform duration-300 lock-icon relative">
                                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-400 opacity-0 hover:opacity-20 transition-opacity" />
                                <FiShield className="text-4xl sm:text-5xl text-green-700 relative z-10" />
                            </div>

                            {/* Title */}
                            <h1 className="text-2xl sm:text-3xl font-black text-green-900 tracking-tight animate-slideInLeft delay-200">
                                {t.title}
                            </h1>

                            {/* Subtitle */}
                            <p className="text-sm sm:text-base text-green-800/70 mt-3 leading-relaxed animate-slideInLeft delay-300">
                                {t.subtitle}
                            </p>

                            {/* Security Badge */}
                            <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 animate-slideInLeft delay-400">
                                <div className="w-2 h-2 rounded-full bg-green-600" />
                                <span className="text-xs font-bold text-green-700">{t.secureAccess}</span>
                            </div>
                        </div>

                        {/* Error Alert */}
                        {error && (
                            <div className="mb-6 p-4 bg-gradient-to-br from-red-50 to-red-50 border-2 border-red-200 rounded-2xl error-shake">
                                <div className="flex items-start gap-3 text-red-700">
                                    <FiAlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm font-bold leading-snug">
                                        {error}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleLogin} className="space-y-5">
                            {/* Email Input */}
                            <div className="animate-slideUp delay-300">
                                <label className="block text-sm font-bold text-green-900 mb-3 flex items-center gap-2">
                                    <FiUser className="text-green-600 w-5 h-5" />
                                    {t.emailLabel}
                                </label>
                                <input
                                    type="email"
                                    className="form-input w-full px-5 py-3 sm:py-4 border-2 border-green-100 rounded-2xl 
                      focus:ring-4 focus:ring-green-200 focus:border-green-400
                      outline-none input-focus
                      text-green-900 placeholder-green-400/60
                      disabled:opacity-60 disabled:cursor-not-allowed"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder={t.emailPlaceholder}
                                    required
                                    disabled={loading || isSubmitting}
                                    inputMode="email"
                                    autoComplete="email"
                                    autoFocus
                                />
                            </div>

                            {/* Password Input */}
                            <div className="animate-slideUp delay-400">
                                <label className="block text-sm font-bold text-green-900 mb-3 flex items-center gap-2">
                                    <FiLock className="text-green-600 w-5 h-5" />
                                    {t.passwordLabel}
                                </label>
                                <div className="relative group">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        className="form-input w-full px-5 py-3 sm:py-4 pr-14 border-2 border-green-100 rounded-2xl 
                        focus:ring-4 focus:ring-green-200 focus:border-green-400
                        outline-none input-focus
                        text-green-900 placeholder-green-400/60
                        disabled:opacity-60 disabled:cursor-not-allowed"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder={t.passwordPlaceholder}
                                        required
                                        disabled={loading || isSubmitting}
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((s) => !s)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-lg
                        flex items-center justify-center
                        text-green-600/60 hover:text-green-700 hover:bg-green-50
                        transition-all duration-200
                        disabled:opacity-50 disabled:cursor-not-allowed
                        focus:ring-2 focus:ring-green-300 outline-none"
                                        disabled={loading || isSubmitting}
                                        aria-label="Toggle password visibility"
                                        tabIndex={0}
                                    >
                                        {showPassword ? (
                                            <FiEyeOff className="w-5 h-5" />
                                        ) : (
                                            <FiEye className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading || isSubmitting}
                                className={`w-full py-3 sm:py-4 px-6 rounded-2xl font-bold text-white text-base sm:text-lg
                    transition-all duration-300 transform
                    button-glow
                    focus:ring-4 focus:ring-green-300 outline-none
                    animate-slideUp delay-500
                    ${loading || isSubmitting
                        ? "bg-gradient-to-r from-gray-400 to-gray-500 cursor-not-allowed opacity-75"
                        : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 active:scale-[0.98] shadow-lg hover:shadow-xl"
                    }`}
            >
                                {loading || isSubmitting ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="loading-spinner" />
                                        {t.loggingIn}
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center gap-2">
                                        <FiLock className="w-5 h-5" />
                                        {t.loginButton}
                                    </span>
                                )}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-green-200">
                            {/* Features */}
                            <div className="space-y-3 mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center flex-shrink-0">
                                        <span className="text-lg">🔐</span>
                                    </div>
                                    <span className="text-xs sm:text-sm text-green-800 font-medium">{t.features}</span>
                                </div>
                            </div>

                            {/* Footer */}
                            <p className="text-[10px] sm:text-xs text-green-800/60 font-semibold text-center">
                                {t.footer}
                            </p>
                        </div>
                    </div>

                   
                </div>
            </div>
        </Screen>
    );
}