"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Screen from "../../../../components/Screen";
import { auth, db } from "../../../../lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import {
    FiArrowLeft,
    FiSettings,
    FiBell,
    FiLock,
    FiUser,
    FiGlobe,
    FiMail,
    FiPhone,
    FiSave,
    FiRefreshCw,
    FiMoon,
    FiSun,
    FiVolume2,
    FiEye,
    FiLogOut
} from "react-icons/fi";
import { toast } from "react-hot-toast";

// Translations
const translations = {
    en: {
        title: "Settings",
        back: "Back to Dashboard",
        profile: "Profile Settings",
        notifications: "Notification Preferences",
        security: "Security & Privacy",
        appearance: "Appearance",
        language: "Language",
        save: "Save Changes",
        saving: "Saving...",
        success: "Settings updated successfully",
        error: "Failed to update settings",
        logout: "Logout",
        editProfile: "Edit Profile",
        changePassword: "Change Password",
        twoFactor: "Two-Factor Authentication",
        enable2FA: "Enable 2FA",
        sessionTimeout: "Session Timeout",
        minutes: "minutes",
        emailNotifications: "Email Notifications",
        pushNotifications: "Push Notifications",
        smsAlerts: "SMS Alerts",
        weeklyDigest: "Weekly Digest",
        darkMode: "Dark Mode",
        lightMode: "Light Mode",
        systemDefault: "System Default",
        fontSize: "Font Size",
        small: "Small",
        medium: "Medium",
        large: "Large",
        languageOptions: {
            en: "English",
            hi: "हिंदी",
            kn: "ಕನ್ನಡ"
        }
    },
    hi: {
        title: "सेटिंग्स",
        back: "डैशबोर्ड पर वापस जाएं",
        profile: "प्रोफ़ाइल सेटिंग्स",
        notifications: "सूचना प्राथमिकताएं",
        security: "सुरक्षा और गोपनीयता",
        appearance: "रूप-रंग",
        language: "भाषा",
        save: "बदलाव सहेजें",
        saving: "सहेजा जा रहा है...",
        success: "सेटिंग्स सफलतापूर्वक अपडेट की गईं",
        error: "सेटिंग्स अपडेट करने में विफल",
        logout: "लॉगआउट",
        editProfile: "प्रोफ़ाइल संपादित करें",
        changePassword: "पासवर्ड बदलें",
        twoFactor: "दो-कारक प्रमाणीकरण",
        enable2FA: "2FA सक्षम करें",
        sessionTimeout: "सत्र समय समाप्ति",
        minutes: "मिनट",
        emailNotifications: "ईमेल सूचनाएं",
        pushNotifications: "पुश सूचनाएं",
        smsAlerts: "एसएमएस अलर्ट",
        weeklyDigest: "साप्ताहिक डाइजेस्ट",
        darkMode: "डार्क मोड",
        lightMode: "लाइट मोड",
        systemDefault: "सिस्टम डिफ़ॉल्ट",
        fontSize: "फ़ॉन्ट आकार",
        small: "छोटा",
        medium: "मध्यम",
        large: "बड़ा",
        languageOptions: {
            en: "English",
            hi: "हिंदी",
            kn: "ಕನ್ನಡ"
        }
    },
    kn: {
        title: "ಸೆಟ್ಟಿಂಗ್‌ಗಳು",
        back: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಹಿಂತಿರುಗಿ",
        profile: "ಪ್ರೊಫೈಲ್ ಸೆಟ್ಟಿಂಗ್‌ಗಳು",
        notifications: "ಅಧಿಸೂಚನೆ ಆದ್ಯತೆಗಳು",
        security: "ಸುರಕ್ಷತೆ ಮತ್ತು ಗೌಪ್ಯತೆ",
        appearance: "ಗೋಚರತೆ",
        language: "ಭಾಷೆ",
        save: "ಬದಲಾವಣೆಗಳನ್ನು ಉಳಿಸಿ",
        saving: "ಉಳಿಸಲಾಗುತ್ತಿದೆ...",
        success: "ಸೆಟ್ಟಿಂಗ್‌ಗಳನ್ನು ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ",
        error: "ಸೆಟ್ಟಿಂಗ್‌ಗಳನ್ನು ನವೀಕರಿಸಲು ವಿಫಲವಾಗಿದೆ",
        logout: "ಲಾಗ್ ಔಟ್",
        editProfile: "ಪ್ರೊಫೈಲ್ ಸಂಪಾದಿಸಿ",
        changePassword: "ಪಾಸ್‌ವರ್ಡ್ ಬದಲಾಯಿಸಿ",
        twoFactor: "ಎರಡು-ಅಂಶ ದೃಢೀಕರಣ",
        enable2FA: "2FA ಸಕ್ರಿಯಗೊಳಿಸಿ",
        sessionTimeout: "ಸೆಷನ್ ಟೈಮ್‌ಔಟ್",
        minutes: "ನಿಮಿಷಗಳು",
        emailNotifications: "ಇಮೇಲ್ ಅಧಿಸೂಚನೆಗಳು",
        pushNotifications: "ಪುಶ್ ಅಧಿಸೂಚನೆಗಳು",
        smsAlerts: "ಎಸ್‌ಎಂಎಸ್ ಎಚ್ಚರಿಕೆಗಳು",
        weeklyDigest: "ಸಾಪ್ತಾಹಿಕ ಸಾರಾಂಶ",
        darkMode: "ಡಾರ್ಕ್ ಮೋಡ್",
        lightMode: "ಲೈಟ್ ಮೋಡ್",
        systemDefault: "ಸಿಸ್ಟಮ್ ಡೀಫಾಲ್ಟ್",
        fontSize: "ಫಾಂಟ್ ಗಾತ್ರ",
        small: "ಚಿಕ್ಕದು",
        medium: "ಮಧ್ಯಮ",
        large: "ದೊಡ್ಡದು",
        languageOptions: {
            en: "English",
            hi: "हिंदी",
            kn: "ಕನ್ನಡ"
        }
    }
};

export default function TdoSettingsPage() {
    const router = useRouter();
    const params = useParams();
    const locale = params?.locale as string || "en";
    const t = translations[locale as keyof typeof translations] || translations.en;

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        // Notification settings
        emailNotifications: true,
        pushNotifications: true,
        smsAlerts: false,
        weeklyDigest: true,
        
        // Appearance
        darkMode: false,
        fontSize: "medium" as "small" | "medium" | "large",
        
        // Language
        language: locale,
        
        // Security
        sessionTimeout: 30,
        twoFactorEnabled: false
    });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setLoading(true);
        try {
            const user = auth.currentUser;
            if (!user) return;

            const settingsDoc = await getDoc(doc(db, "authorities", user.uid));
            if (settingsDoc.exists()) {
                const data = settingsDoc.data();
                setSettings(prev => ({
                    ...prev,
                    ...data.settings,
                    language: data.language || locale
                }));
            }
        } catch (error) {
            console.error("Error loading settings:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const user = auth.currentUser;
            if (!user) throw new Error("Not authenticated");

            await updateDoc(doc(db, "authorities", user.uid), {
                settings: settings,
                language: settings.language,
                updatedAt: new Date()
            });

            // Apply language change if needed
            if (settings.language !== locale) {
                // You might want to handle language change differently
                toast.success(t.success);
                setTimeout(() => {
                    router.push(`/${settings.language}/authority/tdo/settings`);
                }, 1500);
            } else {
                toast.success(t.success);
            }
        } catch (error) {
            console.error("Error saving settings:", error);
            toast.error(t.error);
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        try {
            await auth.signOut();
            router.push(`/${locale}/role-select`);
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    if (loading) {
        return (
            <Screen padded>
                <div className="min-h-screen flex items-center justify-center">
                    <FiRefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
            </Screen>
        );
    }

    return (
        <Screen padded>
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white pb-24">
                {/* Header */}
                <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-blue-100 px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => router.back()}
                                className="p-2 rounded-lg hover:bg-blue-50 transition-colors"
                            >
                                <FiArrowLeft className="w-5 h-5 text-blue-700" />
                            </button>
                            <h1 className="text-xl font-bold text-blue-900 flex items-center gap-2">
                                <FiSettings className="w-6 h-6 text-blue-600" />
                                {t.title}
                            </h1>
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold flex items-center gap-2 hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            {saving ? (
                                <FiRefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                                <FiSave className="w-4 h-4" />
                            )}
                            {saving ? t.saving : t.save}
                        </button>
                    </div>
                </div>

                <div className="p-4 space-y-6">
                    {/* Profile Section */}
                    <div className="bg-white border-2 border-blue-100 rounded-2xl p-5">
                        <h2 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                            <FiUser className="w-5 h-5" />
                            {t.profile}
                        </h2>
                        <div className="space-y-3">
                            <button
                                onClick={() => router.push(`/${locale}/authority/tdo/profile`)}
                                className="w-full text-left px-4 py-3 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors flex items-center justify-between"
                            >
                                <span className="font-medium">{t.editProfile}</span>
                                <FiArrowLeft className="w-4 h-4 rotate-180" />
                            </button>
                        </div>
                    </div>

                    {/* Notifications */}
                    <div className="bg-white border-2 border-blue-100 rounded-2xl p-5">
                        <h2 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                            <FiBell className="w-5 h-5" />
                            {t.notifications}
                        </h2>
                        <div className="space-y-3">
                            <label className="flex items-center justify-between">
                                <span className="text-gray-700">{t.emailNotifications}</span>
                                <input
                                    type="checkbox"
                                    checked={settings.emailNotifications}
                                    onChange={(e) => setSettings({...settings, emailNotifications: e.target.checked})}
                                    className="w-5 h-5 text-blue-600 rounded"
                                />
                            </label>
                            <label className="flex items-center justify-between">
                                <span className="text-gray-700">{t.pushNotifications}</span>
                                <input
                                    type="checkbox"
                                    checked={settings.pushNotifications}
                                    onChange={(e) => setSettings({...settings, pushNotifications: e.target.checked})}
                                    className="w-5 h-5 text-blue-600 rounded"
                                />
                            </label>
                            <label className="flex items-center justify-between">
                                <span className="text-gray-700">{t.smsAlerts}</span>
                                <input
                                    type="checkbox"
                                    checked={settings.smsAlerts}
                                    onChange={(e) => setSettings({...settings, smsAlerts: e.target.checked})}
                                    className="w-5 h-5 text-blue-600 rounded"
                                />
                            </label>
                            <label className="flex items-center justify-between">
                                <span className="text-gray-700">{t.weeklyDigest}</span>
                                <input
                                    type="checkbox"
                                    checked={settings.weeklyDigest}
                                    onChange={(e) => setSettings({...settings, weeklyDigest: e.target.checked})}
                                    className="w-5 h-5 text-blue-600 rounded"
                                />
                            </label>
                        </div>
                    </div>

                    {/* Security */}
                    <div className="bg-white border-2 border-blue-100 rounded-2xl p-5">
                        <h2 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                            <FiLock className="w-5 h-5" />
                            {t.security}
                        </h2>
                        <div className="space-y-4">
                            <button className="w-full text-left px-4 py-3 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors">
                                {t.changePassword}
                            </button>
                            <label className="flex items-center justify-between">
                                <span className="text-gray-700">{t.twoFactor}</span>
                                <input
                                    type="checkbox"
                                    checked={settings.twoFactorEnabled}
                                    onChange={(e) => setSettings({...settings, twoFactorEnabled: e.target.checked})}
                                    className="w-5 h-5 text-blue-600 rounded"
                                />
                            </label>
                            <div>
                                <label className="block text-gray-700 mb-2">{t.sessionTimeout}</label>
                                <select
                                    value={settings.sessionTimeout}
                                    onChange={(e) => setSettings({...settings, sessionTimeout: parseInt(e.target.value)})}
                                    className="w-full p-2 border-2 border-blue-100 rounded-xl"
                                >
                                    <option value="15">15 {t.minutes}</option>
                                    <option value="30">30 {t.minutes}</option>
                                    <option value="60">60 {t.minutes}</option>
                                    <option value="120">120 {t.minutes}</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Appearance */}
                    <div className="bg-white border-2 border-blue-100 rounded-2xl p-5">
                        <h2 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                            {settings.darkMode ? <FiMoon className="w-5 h-5" /> : <FiSun className="w-5 h-5" />}
                            {t.appearance}
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-gray-700 mb-2">{t.language}</label>
                                <select
                                    value={settings.language}
                                    onChange={(e) => setSettings({...settings, language: e.target.value})}
                                    className="w-full p-2 border-2 border-blue-100 rounded-xl"
                                >
                                    <option value="en">{t.languageOptions.en}</option>
                                    <option value="hi">{t.languageOptions.hi}</option>
                                    <option value="kn">{t.languageOptions.kn}</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-gray-700 mb-2">{t.fontSize}</label>
                                <select
                                    value={settings.fontSize}
                                    onChange={(e) => setSettings({...settings, fontSize: e.target.value as any})}
                                    className="w-full p-2 border-2 border-blue-100 rounded-xl"
                                >
                                    <option value="small">{t.small}</option>
                                    <option value="medium">{t.medium}</option>
                                    <option value="large">{t.large}</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Logout Button */}
                    <button
                        onClick={handleLogout}
                        className="w-full py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:from-red-600 hover:to-red-700 transition-all"
                    >
                        <FiLogOut className="w-5 h-5" />
                        {t.logout}
                    </button>
                </div>
            </div>
        </Screen>
    );
}
