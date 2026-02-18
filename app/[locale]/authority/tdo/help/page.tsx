"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Screen from "../../../../../components/Screen";
import {
    FiArrowLeft,
    FiHelpCircle,
    FiMail,
    FiPhone,
    FiMessageSquare,
    FiBookOpen,
    FiVideo,
    FiDownload,
    FiSearch,
    FiChevronDown,
    FiChevronUp,
    FiStar,
    FiExternalLink
} from "react-icons/fi";

// Translations
const translations = {
    en: {
        title: "Help & Support",
        back: "Back to Dashboard",
        searchPlaceholder: "Search for help...",
        quickHelp: "Quick Help Topics",
        faq: "Frequently Asked Questions",
        contact: "Contact Support",
        resources: "Resources & Guides",
        tour: "Take a Guided Tour",
        guide: "User Guide",
        video: "Video Tutorials",
        download: "Download Manual",
        email: "Email Support",
        phone: "Phone Support",
        chat: "Live Chat",
        response: "Response within 24 hours",
        phoneHours: "Mon-Fri, 9 AM - 6 PM",
        chatHours: "24/7 Support",
        related: "Related Articles",
        wasHelpful: "Was this helpful?",
        yes: "Yes",
        no: "No",
        feedback: "Thank you for your feedback!",
        faqs: [
            {
                q: "How do I approve fund requests?",
                a: "Go to the Requests tab, select a pending request, and click 'Approve' or 'Reject'. You can add comments before making a decision."
            },
            {
                q: "What is the escalation process?",
                a: "Issues that are not resolved at the panchayat level within 7 days automatically escalate to TDO. You can view all escalated issues in the Escalations tab."
            },
            {
                q: "How do I generate reports?",
                a: "Navigate to the Analytics section and use the 'Generate Report' button. You can customize date ranges and select specific panchayats."
            },
            {
                q: "Can I export data to Excel?",
                a: "Yes, all reports can be exported in Excel, CSV, or PDF formats using the download options in each section."
            },
            {
                q: "How do I update my profile?",
                a: "Click on the Profile icon in the bottom navigation or top menu to update your information and preferences."
            }
        ]
    },
    hi: {
        title: "सहायता और समर्थन",
        back: "डैशबोर्ड पर वापस जाएं",
        searchPlaceholder: "सहायता खोजें...",
        quickHelp: "त्वरित सहायता विषय",
        faq: "अक्सर पूछे जाने वाले प्रश्न",
        contact: "सहायता से संपर्क करें",
        resources: "संसाधन और मार्गदर्शिकाएँ",
        tour: "निर्देशित दौरा लें",
        guide: "उपयोगकर्ता मार्गदर्शिका",
        video: "वीडियो ट्यूटोरियल",
        download: "मैनुअल डाउनलोड करें",
        email: "ईमेल समर्थन",
        phone: "फोन समर्थन",
        chat: "लाइव चैट",
        response: "24 घंटे के भीतर प्रतिक्रिया",
        phoneHours: "सोम-शुक्र, सुबह 9 - शाम 6 बजे",
        chatHours: "24/7 समर्थन",
        related: "संबंधित लेख",
        wasHelpful: "क्या यह मददगार था?",
        yes: "हाँ",
        no: "नहीं",
        feedback: "आपकी प्रतिक्रिया के लिए धन्यवाद!",
        faqs: [
            {
                q: "मैं धन अनुरोधों को कैसे स्वीकृत करूं?",
                a: "अनुरोध टैब पर जाएं, एक लंबित अनुरोध चुनें, और 'स्वीकृत' या 'अस्वीकृत' पर क्लिक करें। निर्णय लेने से पहले आप टिप्पणियां जोड़ सकते हैं।"
            },
            {
                q: "एस्केलेशन प्रक्रिया क्या है?",
                a: "जो मुद्दे पंचायत स्तर पर 7 दिनों के भीतर हल नहीं होते हैं, वे स्वचालित रूप से टीडीओ को एस्केलेट हो जाते हैं। आप एस्केलेशन टैब में सभी एस्केलेटेड मुद्दों को देख सकते हैं।"
            },
            {
                q: "मैं रिपोर्ट कैसे जनरेट करूं?",
                a: "एनालिटिक्स सेक्शन में जाएं और 'रिपोर्ट जनरेट करें' बटन का उपयोग करें। आप तिथि सीमा को अनुकूलित कर सकते हैं और विशिष्ट पंचायतों का चयन कर सकते हैं।"
            },
            {
                q: "क्या मैं डेटा एक्सेल में निर्यात कर सकता हूं?",
                a: "हाँ, सभी रिपोर्टों को प्रत्येक सेक्शन में डाउनलोड विकल्पों का उपयोग करके एक्सेल, सीएसवी या पीडीएफ प्रारूपों में निर्यात किया जा सकता है।"
            },
            {
                q: "मैं अपना प्रोफ़ाइल कैसे अपडेट करूं?",
                a: "अपनी जानकारी और प्राथमिकताओं को अपडेट करने के लिए नीचे नेविगेशन या शीर्ष मेनू में प्रोफ़ाइल आइकन पर क्लिक करें।"
            }
        ]
    },
    kn: {
        title: "ಸಹಾಯ ಮತ್ತು ಬೆಂಬಲ",
        back: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಹಿಂತಿರುಗಿ",
        searchPlaceholder: "ಸಹಾಯಕ್ಕಾಗಿ ಹುಡುಕಿ...",
        quickHelp: "ತ್ವರಿತ ಸಹಾಯ ವಿಷಯಗಳು",
        faq: "ಆಗಾಗ್ಗೆ ಕೇಳಲಾಗುವ ಪ್ರಶ್ನೆಗಳು",
        contact: "ಬೆಂಬಲವನ್ನು ಸಂಪರ್ಕಿಸಿ",
        resources: "ಸಂಪನ್ಮೂಲಗಳು ಮತ್ತು ಮಾರ್ಗದರ್ಶಿಗಳು",
        tour: "ಮಾರ್ಗದರ್ಶಿತ ಪ್ರವಾಸ ತೆಗೆದುಕೊಳ್ಳಿ",
        guide: "ಬಳಕೆದಾರ ಮಾರ್ಗದರ್ಶಿ",
        video: "ವೀಡಿಯೊ ಟ್ಯುಟೋರಿಯಲ್‌ಗಳು",
        download: "ಕೈಪಿಡಿಯನ್ನು ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ",
        email: "ಇಮೇಲ್ ಬೆಂಬಲ",
        phone: "ಫೋನ್ ಬೆಂಬಲ",
        chat: "ಲೈವ್ ಚಾಟ್",
        response: "24 ಗಂಟೆಗಳ ಒಳಗೆ ಪ್ರತಿಕ್ರಿಯೆ",
        phoneHours: "ಸೋಮ-ಶುಕ್ರ, ಬೆಳಿಗ್ಗೆ 9 - ಸಂಜೆ 6",
        chatHours: "24/7 ಬೆಂಬಲ",
        related: "ಸಂಬಂಧಿತ ಲೇಖನಗಳು",
        wasHelpful: "ಇದು ಸಹಾಯಕವಾಗಿದೆಯೇ?",
        yes: "ಹೌದು",
        no: "ಇಲ್ಲ",
        feedback: "ನಿಮ್ಮ ಪ್ರತಿಕ್ರಿಯೆಗೆ ಧನ್ಯವಾದಗಳು!",
        faqs: [
            {
                q: "ನಾನು ಹಣದ ವಿನಂತಿಗಳನ್ನು ಹೇಗೆ ಅನುಮೋದಿಸುವುದು?",
                a: "ವಿನಂತಿಗಳ ಟ್ಯಾಬ್‌ಗೆ ಹೋಗಿ, ಬಾಕಿ ಇರುವ ವಿನಂತಿಯನ್ನು ಆಯ್ಕೆಮಾಡಿ, ಮತ್ತು 'ಅನುಮೋದಿಸಿ' ಅಥವಾ 'ತಿರಸ್ಕರಿಸಿ' ಕ್ಲಿಕ್ ಮಾಡಿ. ನಿರ್ಧಾರ ತೆಗೆದುಕೊಳ್ಳುವ ಮೊದಲು ನೀವು ಕಾಮೆಂಟ್‌ಗಳನ್ನು ಸೇರಿಸಬಹುದು."
            },
            {
                q: "ಎಸ್ಕಲೇಶನ್ ಪ್ರಕ್ರಿಯೆ ಏನು?",
                a: "ಪಂಚಾಯತ್ ಮಟ್ಟದಲ್ಲಿ 7 ದಿನಗಳ ಒಳಗೆ ಪರಿಹರಿಸಲಾಗದ ಸಮಸ್ಯೆಗಳು ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಟಿಡಿಒಗೆ ಎಸ್ಕಲೇಟ್ ಆಗುತ್ತವೆ. ನೀವು ಎಸ್ಕಲೇಶನ್ ಟ್ಯಾಬ್‌ನಲ್ಲಿ ಎಲ್ಲಾ ಎಸ್ಕಲೇಟೆಡ್ ಸಮಸ್ಯೆಗಳನ್ನು ವೀಕ್ಷಿಸಬಹುದು."
            },
            {
                q: "ನಾನು ವರದಿಗಳನ್ನು ಹೇಗೆ ರಚಿಸುವುದು?",
                a: "ಅನಾಲಿಟಿಕ್ಸ್ ವಿಭಾಗಕ್ಕೆ ನ್ಯಾವಿಗೇಟ್ ಮಾಡಿ ಮತ್ತು 'ವರದಿ ರಚಿಸಿ' ಬಟನ್ ಬಳಸಿ. ನೀವು ದಿನಾಂಕ ವ್ಯಾಪ್ತಿಯನ್ನು ಕಸ್ಟಮೈಸ್ ಮಾಡಬಹುದು ಮತ್ತು ನಿರ್ದಿಷ್ಟ ಪಂಚಾಯತ್‌ಗಳನ್ನು ಆಯ್ಕೆ ಮಾಡಬಹುದು."
            },
            {
                q: "ನಾನು ಡೇಟಾವನ್ನು ಎಕ್ಸೆಲ್‌ಗೆ ರಫ್ತು ಮಾಡಬಹುದೇ?",
                a: "ಹೌದು, ಎಲ್ಲಾ ವರದಿಗಳನ್ನು ಪ್ರತಿ ವಿಭಾಗದಲ್ಲಿ ಡೌನ್‌ಲೋಡ್ ಆಯ್ಕೆಗಳನ್ನು ಬಳಸಿಕೊಂಡು ಎಕ್ಸೆಲ್, ಸಿಎಸ್ವಿ ಅಥವಾ ಪಿಡಿಎಫ್ ಸ್ವರೂಪಗಳಲ್ಲಿ ರಫ್ತು ಮಾಡಬಹುದು."
            },
            {
                q: "ನನ್ನ ಪ್ರೊಫೈಲ್ ಅನ್ನು ನಾನು ಹೇಗೆ ನವೀಕರಿಸುವುದು?",
                a: "ನಿಮ್ಮ ಮಾಹಿತಿ ಮತ್ತು ಆದ್ಯತೆಗಳನ್ನು ನವೀಕರಿಸಲು ಕೆಳಗಿನ ನ್ಯಾವಿಗೇಷನ್ ಅಥವಾ ಮೇಲಿನ ಮೆನುವಿನಲ್ಲಿರುವ ಪ್ರೊಫೈಲ್ ಐಕಾನ್ ಕ್ಲಿಕ್ ಮಾಡಿ."
            }
        ]
    }
};

export default function TdoHelpPage() {
    const router = useRouter();
    const params = useParams();
    const locale = params?.locale as string || "en";
    const t = translations[locale as keyof typeof translations] || translations.en;

    const [searchQuery, setSearchQuery] = useState("");
    const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
    const [feedbackGiven, setFeedbackGiven] = useState<Record<number, boolean>>({});

    const filteredFaqs = t.faqs.filter(faq =>
        faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.a.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleFeedback = (index: number, helpful: boolean) => {
        setFeedbackGiven(prev => ({ ...prev, [index]: true }));
        // Here you could send feedback to your analytics
    };

    return (
        <Screen padded>
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white pb-24">
                {/* Header */}
                <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-blue-100 px-4 py-3">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.back()}
                            className="p-2 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                            <FiArrowLeft className="w-5 h-5 text-blue-700" />
                        </button>
                        <h1 className="text-xl font-bold text-blue-900 flex items-center gap-2">
                            <FiHelpCircle className="w-6 h-6 text-blue-600" />
                            {t.title}
                        </h1>
                    </div>

                    {/* Search Bar */}
                    <div className="mt-3 relative">
                        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder={t.searchPlaceholder}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300"
                        />
                    </div>
                </div>

                <div className="p-4 space-y-6">
                    {/* Quick Help Topics */}
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => router.push(`/${locale}/authority/tdo/guide`)}
                            className="bg-white border-2 border-blue-100 rounded-2xl p-4 hover:shadow-md transition-all hover:border-blue-300"
                        >
                            <FiBookOpen className="w-6 h-6 text-blue-600 mb-2" />
                            <h3 className="font-semibold text-blue-900">{t.guide}</h3>
                            <p className="text-xs text-blue-600/70 mt-1">PDF Guide</p>
                        </button>
                        <button
                            onClick={() => window.open("https://youtube.com", "_blank")}
                            className="bg-white border-2 border-blue-100 rounded-2xl p-4 hover:shadow-md transition-all hover:border-blue-300"
                        >
                            <FiVideo className="w-6 h-6 text-blue-600 mb-2" />
                            <h3 className="font-semibold text-blue-900">{t.video}</h3>
                            <p className="text-xs text-blue-600/70 mt-1">Tutorials</p>
                        </button>
                    </div>

                    {/* FAQ Section */}
                    <div>
                        <h2 className="text-lg font-bold text-blue-900 mb-3">{t.faq}</h2>
                        <div className="space-y-2">
                            {filteredFaqs.length > 0 ? (
                                filteredFaqs.map((faq, index) => (
                                    <div
                                        key={index}
                                        className="bg-white border-2 border-blue-100 rounded-xl overflow-hidden"
                                    >
                                        <button
                                            onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                                            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-blue-50 transition-colors"
                                        >
                                            <span className="font-medium text-blue-900 pr-8">{faq.q}</span>
                                            {expandedFaq === index ? (
                                                <FiChevronUp className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                            ) : (
                                                <FiChevronDown className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                            )}
                                        </button>
                                        {expandedFaq === index && (
                                            <div className="px-4 pb-4">
                                                <p className="text-gray-600 text-sm">{faq.a}</p>
                                                <div className="mt-3 flex items-center gap-4">
                                                    <span className="text-xs text-gray-500">{t.wasHelpful}</span>
                                                    {!feedbackGiven[index] ? (
                                                        <>
                                                            <button
                                                                onClick={() => handleFeedback(index, true)}
                                                                className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                                                            >
                                                                {t.yes}
                                                            </button>
                                                            <button
                                                                onClick={() => handleFeedback(index, false)}
                                                                className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                                                            >
                                                                {t.no}
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <span className="text-xs text-green-600">{t.feedback}</span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-gray-500 py-4">No matching FAQs found</p>
                            )}
                        </div>
                    </div>

                    {/* Contact Support */}
                    <div>
                        <h2 className="text-lg font-bold text-blue-900 mb-3">{t.contact}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-4">
                                <FiMail className="w-6 h-6 mb-2" />
                                <h3 className="font-semibold">{t.email}</h3>
                                <p className="text-xs opacity-90 mt-1">tdo.support@gov.in</p>
                                <p className="text-xs opacity-75 mt-2">{t.response}</p>
                            </div>
                            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl p-4">
                                <FiPhone className="w-6 h-6 mb-2" />
                                <h3 className="font-semibold">{t.phone}</h3>
                                <p className="text-xs opacity-90 mt-1">1800-123-4567</p>
                                <p className="text-xs opacity-75 mt-2">{t.phoneHours}</p>
                            </div>
                            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl p-4">
                                <FiMessageSquare className="w-6 h-6 mb-2" />
                                <h3 className="font-semibold">{t.chat}</h3>
                                <p className="text-xs opacity-90 mt-1">Start Live Chat</p>
                                <p className="text-xs opacity-75 mt-2">{t.chatHours}</p>
                            </div>
                        </div>
                    </div>

                    {/* Resources */}
                    <div>
                        <h2 className="text-lg font-bold text-blue-900 mb-3">{t.resources}</h2>
                        <div className="bg-white border-2 border-blue-100 rounded-2xl p-4">
                            <button className="w-full flex items-center justify-between py-2 hover:text-blue-600">
                                <span>TDO User Manual v2.1</span>
                                <FiDownload className="w-4 h-4" />
                            </button>
                            <button className="w-full flex items-center justify-between py-2 hover:text-blue-600">
                                <span>Quick Reference Card</span>
                                <FiDownload className="w-4 h-4" />
                            </button>
                            <button className="w-full flex items-center justify-between py-2 hover:text-blue-600">
                                <span>Training Videos</span>
                                <FiExternalLink className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Screen>
    );
}
