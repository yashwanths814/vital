"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../../lib/firebase";
import Screen from "../../../components/Screen";
import { FiArrowLeft, FiMail, FiCheckCircle, FiAlertCircle, FiSend, FiLock } from "react-icons/fi";

type Locale = "en" | "kn" | "hi";

export default function ForgotPasswordPage() {
    const router = useRouter();
    const params = useParams() as { locale?: string };
    const locale = (params?.locale || "en") as Locale;

    const t = useMemo(() => {
        const L: Record<Locale, any> = {
            en: {
                title: "Reset Password",
                subtitle: "Enter your email to receive a password reset link",
                email: "Email Address",
                sendResetLink: "Send Reset Link",
                sending: "Sending...",
                backToLogin: "Back to Login",
                back: "Back",
                success: "Reset link sent! Check your email.",
                checkSpam: "Check your spam folder if you don't see it.",
                instructions: "We'll send you a link to reset your password.",
                err: {
                    required: "Please enter your email address.",
                    invalid: "Please enter a valid email address.",
                    notFound: "No account found with this email.",
                    tooManyRequests: "Too many attempts. Please try again later.",
                    default: "Failed to send reset link. Please try again.",
                },
            },
            kn: {
                title: "ಪಾಸ್ವರ್ಡ್ ಮರುಹೊಂದಿಸಿ",
                subtitle: "ಪಾಸ್ವರ್ಡ್ ಮರುಹೊಂದಿಸುವ ಲಿಂಕ್ ಪಡೆಯಲು ನಿಮ್ಮ ಇಮೇಲ್ ನಮೂದಿಸಿ",
                email: "ಇಮೇಲ್ ವಿಳಾಸ",
                sendResetLink: "ಮರುಹೊಂದಿಸುವ ಲಿಂಕ್ ಕಳುಹಿಸಿ",
                sending: "ಕಳುಹಿಸಲಾಗುತ್ತಿದೆ...",
                backToLogin: "ಲಾಗಿನ್‌ಗೆ ಹಿಂತಿರುಗಿ",
                back: "ಹಿಂದೆ",
                success: "ಮರುಹೊಂದಿಸುವ ಲಿಂಕ್ ಕಳುಹಿಸಲಾಗಿದೆ! ನಿಮ್ಮ ಇಮೇಲ್ ಪರಿಶೀಲಿಸಿ.",
                checkSpam: "ನೀವು ಕಾಣದಿದ್ದರೆ ಸ್ಪ್ಯಾಮ್ ಫೋಲ್ಡರ್ ಪರಿಶೀಲಿಸಿ.",
                instructions: "ನಿಮ್ಮ ಪಾಸ್ವರ್ಡ್ ಮರುಹೊಂದಿಸಲು ನಾವು ನಿಮಗೆ ಲಿಂಕ್ ಕಳುಹಿಸುತ್ತೇವೆ.",
                err: {
                    required: "ದಯವಿಟ್ಟು ನಿಮ್ಮ ಇಮೇಲ್ ವಿಳಾಸ ನಮೂದಿಸಿ.",
                    invalid: "ದಯವಿಟ್ಟು ಸರಿಯಾದ ಇಮೇಲ್ ವಿಳಾಸ ನಮೂದಿಸಿ.",
                    notFound: "ಈ ಇಮೇಲ್‌ನೊಂದಿಗೆ ಯಾವುದೇ ಖಾತೆ ಸಿಗಲಿಲ್ಲ.",
                    tooManyRequests: "ಹಲವಾರು ಪ್ರಯತ್ನಗಳು. ದಯವಿಟ್ಟು ನಂತರ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
                    default: "ಮರುಹೊಂದಿಸುವ ಲಿಂಕ್ ಕಳುಹಿಸಲು ವಿಫಲವಾಗಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
                },
            },
            hi: {
                title: "पासवर्ड रीसेट करें",
                subtitle: "पासवर्ड रीसेट लिंक प्राप्त करने के लिए अपना ईमेल दर्ज करें",
                email: "ईमेल पता",
                sendResetLink: "रीसेट लिंक भेजें",
                sending: "भेज रहे हैं...",
                backToLogin: "लॉगिन पर वापस जाएं",
                back: "वापस",
                success: "रीसेट लिंक भेज दिया गया है! अपना ईमेल चेक करें.",
                checkSpam: "अगर दिखाई न दें तो अपना स्पैम फोल्डर चेक करें.",
                instructions: "हम आपको आपका पासवर्ड रीसेट करने के लिए एक लिंक भेजेंगे।",
                err: {
                    required: "कृपया अपना ईमेल पता दर्ज करें।",
                    invalid: "कृपया एक वैध ईमेल पता दर्ज करें।",
                    notFound: "इस ईमेल से कोई खाता नहीं मिला।",
                    tooManyRequests: "बहुत सारे प्रयास। कृपया बाद में पुनः प्रयास करें।",
                    default: "रीसेट लिंक भेजने में विफल। कृपया पुनः प्रयास करें।",
                },
            },
        };
        return L[locale] || L.en;
    }, [locale]);

    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const validateEmail = (email: string) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess(false);

        if (!email) {
            setError(t.err.required);
            return;
        }

        if (!validateEmail(email)) {
            setError(t.err.invalid);
            return;
        }

        try {
            setLoading(true);
            
            // Send password reset email
            await sendPasswordResetEmail(auth, email, {
                url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/${locale}/authority/login`,
                handleCodeInApp: false,
            });

            setSuccess(true);
        } catch (err: any) {
            console.error("Password reset error:", err);
            
            // Handle specific Firebase errors
            switch (err.code) {
                case 'auth/user-not-found':
                    setError(t.err.notFound);
                    break;
                case 'auth/too-many-requests':
                    setError(t.err.tooManyRequests);
                    break;
                case 'auth/invalid-email':
                    setError(t.err.invalid);
                    break;
                default:
                    setError(t.err.default);
            }
        } finally {
            setLoading(false);
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
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes slideInRight {
                    from {
                        opacity: 0;
                        transform: translateX(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }

                .animate-fadeIn {
                    animation: fadeIn 0.5s ease-out forwards;
                }

                .animate-slideUp {
                    animation: slideUp 0.5s ease-out forwards;
                    opacity: 0;
                }

                .animate-slideInRight {
                    animation: slideInRight 0.5s ease-out forwards;
                    opacity: 0;
                }

                .delay-100 { animation-delay: 0.1s; }
                .delay-200 { animation-delay: 0.2s; }
                .delay-300 { animation-delay: 0.3s; }

                .input-field {
                    transition: all 0.3s ease;
                    background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(240,253,244,0.5) 100%);
                }

                .input-field:focus {
                    background: linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(240,253,244,0.8) 100%);
                    box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
                }

                .card-bg {
                    background: linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(240,253,244,0.8) 100%);
                    backdrop-filter: blur(10px);
                }

                .back-button {
                    transition: all 0.3s ease;
                }

                .back-button:hover {
                    transform: translateX(-4px);
                }
            `}</style>

            <div className="min-h-screen flex items-center justify-center p-4 animate-fadeIn">
                <div className="w-full max-w-md">
                    {/* Header Section */}
                    <div className="flex items-start justify-between gap-3 mb-8 animate-slideUp">
                        <div className="min-w-0 flex-1">
                            <button
                                onClick={() => router.back()}
                                className="back-button mb-4 p-3 rounded-xl border-2 border-green-100 bg-white hover:bg-green-50 text-green-700 hover:text-green-900 hover:border-green-200 active:scale-[0.95] transition-all duration-200 focus:ring-2 focus:ring-green-300 outline-none flex items-center gap-2"
                            >
                                <FiArrowLeft className="w-5 h-5" />
                                {t.back}
                            </button>
                            <h1 className="text-2xl sm:text-3xl font-black text-green-900 tracking-tight">
                                {t.title}
                            </h1>
                            <p className="text-sm sm:text-base text-green-800/70 mt-2 leading-relaxed">
                                {t.subtitle}
                            </p>
                        </div>
                    </div>

                    {/* Error Alert */}
                    {error && (
                        <div className="mb-6 p-4 rounded-2xl border-2 border-red-200 bg-gradient-to-br from-red-50 to-red-50 animate-slideUp delay-100">
                            <div className="flex items-start gap-3 text-red-700">
                                <FiAlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                <span className="text-sm font-bold leading-snug">
                                    {error}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Success Alert */}
                    {success && (
                        <div className="mb-6 p-4 rounded-2xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-50 animate-slideUp delay-100">
                            <div className="flex items-start gap-3 text-green-700">
                                <FiCheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                    <span className="text-sm font-bold leading-snug block">
                                        {t.success}
                                    </span>
                                    <span className="text-sm text-green-600 mt-1 block">
                                        {t.checkSpam}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Reset Form */}
                    {!success && (
                        <form onSubmit={handleSubmit} className="animate-slideUp delay-200">
                            <div className="card-bg border-2 border-green-100 rounded-3xl p-6 sm:p-8 shadow-xl">
                                {/* Instruction */}
                                <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 flex items-start gap-3">
                                    <FiLock className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                    <p className="text-sm text-green-700">
                                        {t.instructions}
                                    </p>
                                </div>

                                {/* Email Field */}
                                <div className="mb-6">
                                    <label className="text-sm font-bold text-green-900 mb-3 flex items-center gap-2">
                                        <FiMail className="w-5 h-5 text-green-600" />
                                        {t.email}
                                    </label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="input-field w-full rounded-2xl border-2 border-green-100 px-5 py-3 sm:py-4
                                          focus:ring-4 focus:ring-green-200 focus:border-green-400
                                          outline-none text-green-900 placeholder-green-400/60
                                          disabled:opacity-60 disabled:cursor-not-allowed"
                                        placeholder="name@authority.gov.in"
                                        inputMode="email"
                                        autoComplete="email"
                                        disabled={loading}
                                        autoFocus
                                        required
                                    />
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3 sm:py-4 px-6 rounded-2xl font-bold text-white text-base sm:text-lg
                                      transition-all duration-300 transform
                                      bg-gradient-to-r from-green-600 to-emerald-600 
                                      hover:from-green-700 hover:to-emerald-700 
                                      active:scale-[0.98] shadow-lg hover:shadow-xl
                                      focus:ring-4 focus:ring-green-300 outline-none
                                      disabled:opacity-50 disabled:cursor-not-allowed
                                      flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            {t.sending}
                                        </>
                                    ) : (
                                        <>
                                            <FiSend className="w-5 h-5" />
                                            {t.sendResetLink}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Back to Login Button */}
                    <div className="mt-6 text-center animate-slideUp delay-300">
                        <button
                            onClick={() => router.push(`/${locale}/authority/login`)}
                            className="text-green-700 hover:text-green-900 font-bold underline underline-offset-4 hover:no-underline transition-all duration-200 flex items-center gap-2 justify-center mx-auto"
                        >
                            <FiArrowLeft className="w-4 h-4" />
                            {t.backToLogin}
                        </button>
                    </div>

                    {/* Footer Note */}
                    <div className="mt-8 text-center text-xs text-green-700/50 animate-fadeIn" style={{ animationDelay: '0.4s' }}>
                        <p>🔒 Secure password reset with Firebase Auth</p>
                    </div>
                </div>
            </div>
        </Screen>
    );
}