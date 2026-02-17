"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../../../../lib/firebase";
import Screen from "../../../../components/Screen";
import { FiArrowLeft, FiAlertCircle, FiCheckCircle, FiClock, FiMapPin, FiUser, FiPhone, FiTag, FiCalendar, FiFileText, FiLoader } from "react-icons/fi";

function fmtDate(v: any) {
    try {
        if (!v) return "";
        if (v?.toDate) return v.toDate().toLocaleString();
        if (typeof v === "string") return new Date(v).toLocaleString();
        return "";
    } catch {
        return "";
    }
}

const getStatusColor = (status: string) => {
    const statusMap: any = {
        open: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", icon: "text-blue-600" },
        "in-progress": { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-700", icon: "text-yellow-600" },
        resolved: { bg: "bg-green-50", border: "border-green-200", text: "text-green-700", icon: "text-green-600" },
        escalated: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", icon: "text-red-600" },
    };
    return statusMap[status?.toLowerCase()] || statusMap.open;
};

const getStatusIcon = (status: string) => {
    const statusMap: any = {
        open: FiAlertCircle,
        "in-progress": FiLoader,
        resolved: FiCheckCircle,
        escalated: FiAlertCircle,
    };
    return statusMap[status?.toLowerCase()] || FiAlertCircle;
};

export default function AdminIssueDetailsPage() {
    const router = useRouter();
    const params = useParams() as { locale?: string; id?: string };
    const locale = params?.locale || "en";
    const issueId = params?.id as string;

    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");
    const [issue, setIssue] = useState<any>(null);
    const [isRealtime, setIsRealtime] = useState(false);

    const t = useMemo(() => {
        const L: any = {
            en: {
                title: "Issue Details",
                back: "Back",
                issueId: "Issue ID",
                status: "Status",
                created: "Created",
                titleLabel: "Title",
                category: "Category",
                description: "Description",
                location: "Location",
                assignedWorker: "Assigned Worker",
                notAssigned: "Not assigned yet.",
                panchayatId: "Panchayat ID",
                reportedBy: "Reported By",
                contact: "Contact",
                noPermission: "No permission to view this issue.",
                notFound: "Issue not found.",
                details: "Issue Details",
                workerInfo: "Worker Information",
                reporterInfo: "Reporter Information",
                loading: "Loading issue details...",
                realtimeUpdate: "Real-time update",
            },
            kn: {
                title: "ಸಮಸ್ಯೆಯ ವಿವರಗಳು",
                back: "ಹಿಂದೆ",
                issueId: "ಸಮಸ್ಯೆ ಐಡಿ",
                status: "ಸ್ಥಿತಿ",
                created: "ರಚಿಸಿದ ಸಮಯ",
                titleLabel: "ಶೀರ್ಷಿಕೆ",
                category: "ವರ್ಗ",
                description: "ವಿವರಣೆ",
                location: "ಸ್ಥಳ",
                assignedWorker: "ನೇಮಿಸಿದ ಕಾರ್ಮಿಕ",
                notAssigned: "ಇನ್ನೂ ನೇಮಿಸಲಾಗಿಲ್ಲ.",
                panchayatId: "ಪಂಚಾಯತಿ ಐಡಿ",
                reportedBy: "ವರದಿ ಮಾಡಿದವರು",
                contact: "ಸಂಪರ್ಕ",
                noPermission: "ಈ ಸಮಸ್ಯೆಯನ್ನು ನೋಡಲು ಅನುಮತಿ ಇಲ್ಲ.",
                notFound: "ಸಮಸ್ಯೆ ಕಂಡುಬಂದಿಲ್ಲ.",
                details: "ಸಮಸ್ಯೆಯ ವಿವರಗಳು",
                workerInfo: "ಕಾರ್ಮಿಕ ಮಾಹಿತಿ",
                reporterInfo: "ವರದಿಕಾರ ಮಾಹಿತಿ",
                loading: "ಸಮಸ್ಯೆಯ ವಿವರಗಳನ್ನು ಲೋಡ್ ಮಾಡುತ್ತಿದೆ...",
                realtimeUpdate: "ರಿಯಲ್-ಟೈಮ್ ಅಪ್‌ಡೇಟ್",
            },
            hi: {
                title: "मुद्दे का विवरण",
                back: "वापस",
                issueId: "इश्यू आईडी",
                status: "स्टेटस",
                created: "बनाया गया",
                titleLabel: "शीर्षक",
                category: "कैटेगरी",
                description: "विवरण",
                location: "लोकेशन",
                assignedWorker: "असाइन वर्कर",
                notAssigned: "अभी असाइन नहीं हुआ।",
                panchayatId: "पंचायत आईडी",
                reportedBy: "रिपोर्ट किया गया",
                contact: "संपर्क",
                noPermission: "इस इश्यू को देखने की अनुमति नहीं है।",
                notFound: "इश्यू नहीं मिला।",
                details: "इश्यू विवरण",
                workerInfo: "वर्कर जानकारी",
                reporterInfo: "रिपोर्टर जानकारी",
                loading: "इश्यू विवरण लोड हो रहे हैं...",
                realtimeUpdate: "रीयल-टाइम अपडेट",
            },
        };
        return L[locale] || L.en;
    }, [locale]);

    useEffect(() => {
        const user = auth.currentUser;
        if (!user) {
            router.replace(`/${locale}/admin/login`);
            return;
        }

        setErr("");
        setLoading(true);

        // Set up real-time listener
        const issueRef = doc(db, "issues", issueId);
        
        const unsubscribe = onSnapshot(
            issueRef,
            (snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.data() as any;
                    setIssue({ id: snapshot.id, ...data });
                    setIsRealtime(true);
                    setLoading(false);
                } else {
                    setErr(t.notFound);
                    setLoading(false);
                }
            },
            (error: any) => {
                console.error("Error fetching issue:", error);
                setErr(error?.message || "Failed to load issue.");
                setLoading(false);
            }
        );

        return () => unsubscribe();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [router, locale, issueId, t.notFound]);

    if (loading) {
        return (
            <Screen center>
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
                    <p className="text-green-700 font-semibold text-center">{t.loading}</p>
                </div>
            </Screen>
        );
    }

    if (err) {
        return (
            <Screen padded>
                <style>{`
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

                    .animate-slideUp {
                        animation: slideUp 0.6s ease-out;
                    }
                `}</style>
                <div className="max-w-2xl mx-auto animate-slideUp">
                    <div className="rounded-2xl border-2 border-red-200 bg-gradient-to-br from-red-50 to-red-50 p-6 flex items-start gap-4">
                        <FiAlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold text-red-900">{err}</p>
                            <button
                                onClick={() => router.back()}
                                className="mt-3 px-4 py-2 rounded-lg border border-red-200 bg-white text-red-700 font-bold hover:bg-red-50 transition"
                            >
                                {t.back}
                            </button>
                        </div>
                    </div>
                </div>
            </Screen>
        );
    }

    if (!issue) return null;

    const statusColors = getStatusColor(issue.status);
    const StatusIcon = getStatusIcon(issue.status);

    return (
        <Screen padded>
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
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
                        transform: translateX(-30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }

                @keyframes pulse-soft {
                    0%, 100% {
                        opacity: 1;
                    }
                    50% {
                        opacity: 0.8;
                    }
                }

                .animate-fadeIn {
                    animation: fadeIn 0.6s ease-out;
                }

                .animate-slideDown {
                    animation: slideDown 0.6s ease-out forwards;
                    opacity: 0;
                }

                .animate-slideUp {
                    animation: slideUp 0.7s ease-out forwards;
                    opacity: 0;
                }

                .animate-slideInLeft {
                    animation: slideInLeft 0.6s ease-out forwards;
                    opacity: 0;
                }

                .animate-pulse-soft {
                    animation: pulse-soft 2s ease-in-out infinite;
                }

                .delay-100 { animation-delay: 0.1s; }
                .delay-200 { animation-delay: 0.2s; }
                .delay-300 { animation-delay: 0.3s; }
                .delay-400 { animation-delay: 0.4s; }
                .delay-500 { animation-delay: 0.5s; }

                .card-hover {
                    transition: all 0.3s ease;
                }

                .card-hover:hover {
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
                    transform: translateY(-2px);
                }

                .info-label {
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: rgba(20, 83, 45, 0.6);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .status-badge {
                    animation: slideUp 0.6s ease-out forwards;
                    opacity: 0;
                    animation-delay: 0.2s;
                }

                .realtime-indicator {
                    animation: pulse-soft 2s ease-in-out infinite;
                }
            `}</style>

            <div className="w-full max-w-4xl mx-auto animate-fadeIn">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-8 animate-slideDown delay-100">
                    <div className="flex-1 min-w-0">
                        <h1 className="text-3xl sm:text-4xl font-black text-green-900 tracking-tight">
                            {t.title}
                        </h1>
                        <p className="text-sm sm:text-base text-green-800/70 mt-2">
                            {t.details} • Admin View
                        </p>
                    </div>

                    {/* Back Button */}
                    <button
                        onClick={() => router.back()}
                        className="animate-slideInLeft delay-200 shrink-0 p-3 rounded-xl border-2 border-green-100 bg-white hover:bg-green-50 text-green-700 hover:text-green-900 hover:border-green-200 active:scale-[0.95] transition-all duration-200 focus:ring-2 focus:ring-green-300 outline-none"
                        aria-label={t.back}
                    >
                        <FiArrowLeft className="w-5 h-5" />
                    </button>
                </div>

                {/* Real-time indicator */}
                {isRealtime && (
                    <div className="mb-6 animate-slideUp delay-100 flex items-center gap-2 text-xs text-green-600 font-semibold bg-green-50 border border-green-200 rounded-lg px-3 py-2 inline-flex">
                        <div className="w-2 h-2 rounded-full bg-green-600 realtime-indicator" />
                        {t.realtimeUpdate}
                    </div>
                )}

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Main Info */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Status Card */}
                        <div className={`card-hover animate-slideUp delay-200 border-2 ${statusColors.border} ${statusColors.bg} rounded-3xl p-6 sm:p-8`}>
                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-xl bg-white`}>
                                    <StatusIcon className={`w-6 h-6 ${statusColors.icon}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="info-label">{t.status}</p>
                                    <h2 className={`text-2xl font-black ${statusColors.text} mt-1 capitalize`}>
                                        {issue.status || "Unknown"}
                                    </h2>
                                </div>
                            </div>
                        </div>

                        {/* Issue Title Card */}
                        <div className="card-hover animate-slideUp delay-300 bg-white border-2 border-green-100 rounded-3xl p-6 sm:p-8">
                            <p className="info-label">{t.titleLabel}</p>
                            <h3 className="text-2xl sm:text-3xl font-black text-green-900 mt-2 leading-tight">
                                {issue.title || "—"}
                            </h3>
                        </div>

                        {/* Description & Location */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Category */}
                            <div className="card-hover animate-slideUp delay-400 bg-white border-2 border-green-100 rounded-2xl p-5 sm:p-6">
                                <p className="info-label flex items-center gap-2">
                                    <FiTag className="w-4 h-4" />
                                    {t.category}
                                </p>
                                <p className="text-lg font-bold text-green-900 mt-2">
                                    {issue.category || "—"}
                                </p>
                            </div>

                            {/* Panchayat */}
                            <div className="card-hover animate-slideUp delay-500 bg-white border-2 border-green-100 rounded-2xl p-5 sm:p-6">
                                <p className="info-label">{t.panchayatId}</p>
                                <p className="text-lg font-bold text-green-900 mt-2">
                                    {issue.panchayatId || "—"}
                                </p>
                            </div>
                        </div>

                        {/* Description */}
                        {issue.description && (
                            <div className="card-hover animate-slideUp delay-500 bg-white border-2 border-green-100 rounded-2xl p-6 sm:p-8">
                                <p className="info-label flex items-center gap-2">
                                    <FiFileText className="w-4 h-4" />
                                    {t.description}
                                </p>
                                <p className="text-base text-green-900/80 mt-3 leading-relaxed">
                                    {issue.description}
                                </p>
                            </div>
                        )}

                        {/* Location */}
                        {(issue.locationText || issue.address) && (
                            <div className="card-hover animate-slideUp delay-500 bg-white border-2 border-green-100 rounded-2xl p-6 sm:p-8">
                                <p className="info-label flex items-center gap-2">
                                    <FiMapPin className="w-4 h-4" />
                                    {t.location}
                                </p>
                                <p className="text-base text-green-900/80 mt-3 leading-relaxed">
                                    {issue.locationText || issue.address}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Side Info */}
                    <div className="space-y-6">
                        {/* Created Date */}
                        <div className="card-hover animate-slideUp delay-300 bg-white border-2 border-green-100 rounded-2xl p-5 sm:p-6">
                            <p className="info-label flex items-center gap-2">
                                <FiCalendar className="w-4 h-4" />
                                {t.created}
                            </p>
                            <p className="text-sm font-bold text-green-900 mt-2">
                                {fmtDate(issue.createdAt) || "—"}
                            </p>
                        </div>

                        {/* Issue ID */}
                        <div className="card-hover animate-slideUp delay-400 bg-white border-2 border-green-100 rounded-2xl p-5 sm:p-6 max-w-full">
                            <p className="info-label">{t.issueId}</p>
                            <p className="text-xs font-mono font-bold text-green-900 mt-2 break-all">
                                {issue.id}
                            </p>
                        </div>

                        {/* Reporter Info */}
                        {issue.reporterName && (
                            <div className="card-hover animate-slideUp delay-400 bg-gradient-to-br from-blue-50 to-blue-50 border-2 border-blue-200 rounded-2xl p-5 sm:p-6">
                                <p className="info-label flex items-center gap-2 text-blue-700">
                                    <FiUser className="w-4 h-4" />
                                    {t.reportedBy}
                                </p>
                                <p className="text-sm font-bold text-blue-900 mt-2">
                                    {issue.reporterName}
                                </p>
                                {issue.reporterPhone && (
                                    <a
                                        href={`tel:${issue.reporterPhone}`}
                                        className="flex items-center gap-2 text-xs text-blue-700 hover:text-blue-900 mt-2 font-semibold transition"
                                    >
                                        <FiPhone className="w-3 h-3" />
                                        {issue.reporterPhone}
                                    </a>
                                )}
                            </div>
                        )}

                        {/* Assigned Worker */}
                        <div className="card-hover animate-slideUp delay-500 bg-gradient-to-br from-purple-50 to-purple-50 border-2 border-purple-200 rounded-2xl p-5 sm:p-6">
                            <p className="info-label flex items-center gap-2 text-purple-700">
                                <FiUser className="w-4 h-4" />
                                {t.assignedWorker}
                            </p>
                            {issue.assignedWorker?.name ? (
                                <div className="mt-3 space-y-1">
                                    <p className="text-sm font-bold text-purple-900">
                                        {issue.assignedWorker.name}
                                    </p>
                                    {issue.assignedWorker.phone && (
                                        <a
                                            href={`tel:${issue.assignedWorker.phone}`}
                                            className="flex items-center gap-2 text-xs text-purple-700 hover:text-purple-900 font-semibold transition"
                                        >
                                            <FiPhone className="w-3 h-3" />
                                            {issue.assignedWorker.phone}
                                        </a>
                                    )}
                                    {issue.assignedWorker.role && (
                                        <p className="text-xs text-purple-700 font-semibold mt-1">
                                            {issue.assignedWorker.role}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <p className="text-xs text-purple-700 mt-3 font-medium italic">
                                    {t.notAssigned}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-10 pt-6 border-t border-green-200 text-center animate-slideUp delay-500">
                    <p className="text-xs text-green-700/60 font-semibold">
                        🔒 All data is fetched in real-time from Firestore
                    </p>
                </div>
            </div>
        </Screen>
    );
}