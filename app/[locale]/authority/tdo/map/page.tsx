"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Screen from "../../../../../components/Screen";
import { auth, db } from "../../../../../lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import {
    FiArrowLeft,
    FiMap,
    FiMapPin,
    FiFilter,
    FiSearch,
    FiLayers,
    FiMaximize2,
    FiMinimize2,
    FiInfo,
    FiAlertCircle,
    FiCheckCircle,
    FiClock,
    FiRefreshCw
} from "react-icons/fi";

// Translations
const translations = {
    en: {
        title: "Map View",
        back: "Back to Dashboard",
        searchPlaceholder: "Search location...",
        filters: "Filters",
        layers: "Layers",
        issues: "Issues",
        panchayats: "Panchayats",
        villages: "Villages",
        roads: "Roads",
        water: "Water Bodies",
        legend: "Legend",
        pending: "Pending",
        inProgress: "In Progress",
        resolved: "Resolved",
        escalated: "Escalated",
        critical: "Critical",
        high: "High",
        medium: "Medium",
        low: "Low",
        issueCount: "Issues",
        resolutionRate: "Resolution Rate",
        avgTime: "Avg Time",
        lastUpdated: "Last Updated",
        noData: "No map data available",
        loading: "Loading map data..."
    },
    hi: {
        title: "मानचित्र दृश्य",
        back: "डैशबोर्ड पर वापस जाएं",
        searchPlaceholder: "स्थान खोजें...",
        filters: "फ़िल्टर",
        layers: "परतें",
        issues: "मुद्दे",
        panchayats: "पंचायतें",
        villages: "गाँव",
        roads: "सड़कें",
        water: "जल निकाय",
        legend: "लीजेंड",
        pending: "लंबित",
        inProgress: "प्रगति पर",
        resolved: "हल हुए",
        escalated: "बढ़ाए गए",
        critical: "गंभीर",
        high: "उच्च",
        medium: "मध्यम",
        low: "निम्न",
        issueCount: "मुद्दे",
        resolutionRate: "समाधान दर",
        avgTime: "औसत समय",
        lastUpdated: "अंतिम अपडेट",
        noData: "कोई मानचित्र डेटा उपलब्ध नहीं",
        loading: "मानचित्र डेटा लोड हो रहा है..."
    },
    kn: {
        title: "ನಕ್ಷೆ ನೋಟ",
        back: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಹಿಂತಿರುಗಿ",
        searchPlaceholder: "ಸ್ಥಳ ಹುಡುಕಿ...",
        filters: "ಫಿಲ್ಟರ್‌ಗಳು",
        layers: "ಲೇಯರ್‌ಗಳು",
        issues: "ಸಮಸ್ಯೆಗಳು",
        panchayats: "ಪಂಚಾಯತ್‌ಗಳು",
        villages: "ಗ್ರಾಮಗಳು",
        roads: "ರಸ್ತೆಗಳು",
        water: "ಜಲಮೂಲಗಳು",
        legend: "ಲೆಜೆಂಡ್",
        pending: "ಬಾಕಿ",
        inProgress: "ಪ್ರಗತಿಯಲ್ಲಿದೆ",
        resolved: "ಪರಿಹರಿಸಲಾಗಿದೆ",
        escalated: "ಎತ್ತರಿಸಲಾಗಿದೆ",
        critical: "ಗಂಭೀರ",
        high: "ಹೆಚ್ಚು",
        medium: "ಮಧ್ಯಮ",
        low: "ಕಡಿಮೆ",
        issueCount: "ಸಮಸ್ಯೆಗಳು",
        resolutionRate: "ಪರಿಹಾರ ದರ",
        avgTime: "ಸರಾಸರಿ ಸಮಯ",
        lastUpdated: "ಕೊನೆಯ ನವೀಕರಣ",
        noData: "ಯಾವುದೇ ನಕ್ಷೆ ಡೇಟಾ ಲಭ್ಯವಿಲ್ಲ",
        loading: "ನಕ್ಷೆ ಡೇಟಾವನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ..."
    }
};

// Mock data for demonstration
const mockPanchayats = [
    { id: "p1", name: "Panchayat A", lat: 12.9716, lng: 77.5946, issues: 45, resolved: 38, pending: 7 },
    { id: "p2", name: "Panchayat B", lat: 12.9352, lng: 77.6245, issues: 32, resolved: 25, pending: 7 },
    { id: "p3", name: "Panchayat C", lat: 12.9250, lng: 77.5790, issues: 28, resolved: 22, pending: 6 },
    { id: "p4", name: "Panchayat D", lat: 12.9780, lng: 77.6430, issues: 56, resolved: 42, pending: 14 }
];

export default function TdoMapPage() {
    const router = useRouter();
    const params = useParams();
    const locale = params?.locale as string || "en";
    const t = translations[locale as keyof typeof translations] || translations.en;

    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedLayer, setSelectedLayer] = useState("issues");
    const [showFilters, setShowFilters] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [selectedPanchayat, setSelectedPanchayat] = useState<any>(null);
    const [mapData, setMapData] = useState({
        panchayats: mockPanchayats,
        issues: []
    });

    useEffect(() => {
        loadMapData();
    }, []);

    const loadMapData = async () => {
        setLoading(true);
        try {
            const user = auth.currentUser;
            if (!user) {
                router.push(`/${locale}/authority/login`);
                return;
            }

            const authorityDoc = await getDoc(doc(db, "authorities", user.uid));
            if (!authorityDoc.exists()) return;

            const talukId = authorityDoc.data()?.talukId;
            
            // In a real app, you would fetch actual geo data here
            // For now, we'll use mock data
            setTimeout(() => {
                setMapData({
                    panchayats: mockPanchayats,
                    issues: []
                });
                setLoading(false);
            }, 1000);
        } catch (error) {
            console.error("Error loading map data:", error);
            setLoading(false);
        }
    };

    const filteredPanchayats = mapData.panchayats.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
    };

    const getIssueColor = (resolved: number, total: number) => {
        const rate = (resolved / total) * 100;
        if (rate >= 80) return "text-green-600";
        if (rate >= 60) return "text-yellow-600";
        return "text-red-600";
    };

    if (loading) {
        return (
            <Screen padded>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <FiRefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
                        <p className="text-blue-700">{t.loading}</p>
                    </div>
                </div>
            </Screen>
        );
    }

    return (
        <Screen padded={false}>
            <div className={`min-h-screen bg-gray-100 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
                {/* Header */}
                <div className="bg-white border-b border-gray-200 px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => router.back()}
                                className="p-2 rounded-lg hover:bg-gray-100"
                            >
                                <FiArrowLeft className="w-5 h-5 text-gray-700" />
                            </button>
                            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <FiMap className="w-6 h-6 text-blue-600" />
                                {t.title}
                            </h1>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={toggleFullscreen}
                                className="p-2 rounded-lg hover:bg-gray-100"
                            >
                                {isFullscreen ? <FiMinimize2 className="w-5 h-5" /> : <FiMaximize2 className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="mt-3 relative">
                        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder={t.searchPlaceholder}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Controls Bar */}
                <div className="bg-white border-b border-gray-200 px-4 py-2 flex gap-2 overflow-x-auto">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm ${
                            showFilters ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                        }`}
                    >
                        <FiFilter className="w-4 h-4" />
                        {t.filters}
                    </button>
                    <button
                        onClick={() => setSelectedLayer("issues")}
                        className={`px-3 py-1.5 rounded-lg text-sm ${
                            selectedLayer === "issues" ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                        }`}
                    >
                        {t.issues}
                    </button>
                    <button
                        onClick={() => setSelectedLayer("panchayats")}
                        className={`px-3 py-1.5 rounded-lg text-sm ${
                            selectedLayer === "panchayats" ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                        }`}
                    >
                        {t.panchayats}
                    </button>
                    <button
                        onClick={() => setSelectedLayer("villages")}
                        className={`px-3 py-1.5 rounded-lg text-sm ${
                            selectedLayer === "villages" ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                        }`}
                    >
                        {t.villages}
                    </button>
                </div>

                {/* Filters Panel */}
                {showFilters && (
                    <div className="bg-white border-b border-gray-200 p-4">
                        <h3 className="font-semibold mb-3">{t.filters}</h3>
                        <div className="space-y-2">
                            <label className="flex items-center gap-2">
                                <input type="checkbox" className="rounded text-blue-600" />
                                <span className="text-sm">{t.pending}</span>
                            </label>
                            <label className="flex items-center gap-2">
                                <input type="checkbox" className="rounded text-blue-600" />
                                <span className="text-sm">{t.inProgress}</span>
                            </label>
                            <label className="flex items-center gap-2">
                                <input type="checkbox" className="rounded text-blue-600" />
                                <span className="text-sm">{t.resolved}</span>
                            </label>
                            <label className="flex items-center gap-2">
                                <input type="checkbox" className="rounded text-blue-600" />
                                <span className="text-sm">{t.escalated}</span>
                            </label>
                        </div>
                    </div>
                )}

                {/* Map Container */}
                <div className="relative" style={{ height: 'calc(100vh - 200px)' }}>
                    {/* Map Placeholder - Replace with actual map integration */}
                    <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                        <div className="text-center text-gray-500">
                            <FiMap className="w-16 h-16 mx-auto mb-4 opacity-30" />
                            <p>Interactive Map</p>
                            <p className="text-sm mt-2">Integrate with Google Maps, Mapbox, or Leaflet</p>
                        </div>
                    </div>

                    {/* Panchayat Markers (Demo) */}
                    {filteredPanchayats.map((p, index) => (
                        <button
                            key={p.id}
                            onClick={() => setSelectedPanchayat(p)}
                            className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 hover:scale-110 transition-transform"
                            style={{
                                left: `${20 + index * 15}%`,
                                top: `${30 + index * 10}%`,
                            }}
                        >
                            <div className={`p-2 rounded-full ${
                                selectedPanchayat?.id === p.id ? 'bg-blue-600' : 'bg-white'
                            } shadow-lg border-2 border-blue-300`}>
                                <FiMapPin className={`w-5 h-5 ${
                                    selectedPanchayat?.id === p.id ? 'text-white' : 'text-blue-600'
                                }`} />
                            </div>
                        </button>
                    ))}
                </div>

                {/* Info Panel */}
                {selectedPanchayat && (
                    <div className="absolute bottom-24 left-4 right-4 bg-white rounded-xl shadow-lg p-4 border border-gray-200">
                        <div className="flex justify-between items-start mb-3">
                            <h3 className="font-bold text-lg">{selectedPanchayat.name}</h3>
                            <button
                                onClick={() => setSelectedPanchayat(null)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <FiInfo className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="text-center p-2 bg-gray-50 rounded-lg">
                                <div className="text-2xl font-bold text-gray-800">{selectedPanchayat.issues}</div>
                                <div className="text-xs text-gray-600">{t.issueCount}</div>
                            </div>
                            <div className="text-center p-2 bg-gray-50 rounded-lg">
                                <div className={`text-2xl font-bold ${getIssueColor(selectedPanchayat.resolved, selectedPanchayat.issues)}`}>
                                    {Math.round((selectedPanchayat.resolved / selectedPanchayat.issues) * 100)}%
                                </div>
                                <div className="text-xs text-gray-600">{t.resolutionRate}</div>
                            </div>
                        </div>
                        <div className="mt-3 flex justify-between text-sm">
                            <span className="text-green-600">✓ {selectedPanchayat.resolved} {t.resolved}</span>
                            <span className="text-yellow-600">⏳ {selectedPanchayat.pending} {t.pending}</span>
                        </div>
                    </div>
                )}

                {/* Legend */}
                <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 border border-gray-200">
                    <h4 className="font-semibold text-sm mb-2">{t.legend}</h4>
                    <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <span>{t.pending}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                            <span>{t.inProgress}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <span>{t.resolved}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <span>{t.escalated}</span>
                        </div>
                    </div>
                </div>
            </div>
        </Screen>
    );
}
