"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../../../../lib/firebase";
import Screen from "../../../../../components/Screen";
import {
    FiArrowLeft,
    FiSave,
    FiUser,
    FiPhone,
    FiMail,
    FiTool,
    FiHome,
    FiFileText,
    FiBriefcase,
    FiCalendar,
    FiCheckCircle,
    FiXCircle,
    FiPlus,
    FiTrash2
} from "react-icons/fi";
import { toast } from "react-hot-toast";

type Locale = "en" | "kn" | "hi";

export default function AddWorkerPage() {
    const router = useRouter();
    const params = useParams() as { locale?: string };
    const locale = (params?.locale || "en") as Locale;

    const t = useMemo(() => {
        const L: Record<Locale, any> = {
            en: {
                title: "Add New Worker",
                subtitle: "Add a new worker to your panchayat",
                back: "Back to Workers",
                save: "Save Worker",
                cancel: "Cancel",
                success: "Worker added successfully",
                error: "Failed to add worker",
                form: {
                    name: "Full Name *",
                    phone: "Phone Number *",
                    email: "Email Address",
                    aadhaar: "Aadhaar Number",
                    specialization: "Specialization *",
                    department: "Department",
                    experience: "Years of Experience",
                    address: "Address",
                    availability: "Availability *",
                    skills: "Skills (comma separated)",
                    isActive: "Active Status"
                },
                validation: {
                    nameRequired: "Name is required",
                    phoneRequired: "Phone number is required",
                    specializationRequired: "Specialization is required",
                    phoneInvalid: "Enter a valid 10-digit phone number",
                    emailInvalid: "Enter a valid email address",
                    aadhaarInvalid: "Enter a valid 12-digit Aadhaar number"
                },
                placeholders: {
                    name: "Enter worker's full name",
                    phone: "Enter 10-digit phone number",
                    email: "Enter email address",
                    aadhaar: "Enter 12-digit Aadhaar number",
                    specialization: "e.g., Plumber, Electrician, Carpenter",
                    department: "e.g., Public Works, Water Department",
                    experience: "e.g., 5",
                    address: "Enter complete address",
                    skills: "e.g., welding, masonry, painting"
                },
                options: {
                    availability: [
                        { value: "Available", label: "Available" },
                        { value: "Busy", label: "Busy" },
                        { value: "On Leave", label: "On Leave" },
                        { value: "On Vacation", label: "On Vacation" }
                    ],
                    department: [
                        { value: "Public Works", label: "Public Works" },
                        { value: "Water Department", label: "Water Department" },
                        { value: "Electricity", label: "Electricity" },
                        { value: "Sanitation", label: "Sanitation" },
                        { value: "Road Maintenance", label: "Road Maintenance" },
                        { value: "Drainage", label: "Drainage" },
                        { value: "Construction", label: "Construction" },
                        { value: "Other", label: "Other" }
                    ],
                    specialization: [
                        { value: "Plumber", label: "Plumber" },
                        { value: "Electrician", label: "Electrician" },
                        { value: "Carpenter", label: "Carpenter" },
                        { value: "Mason", label: "Mason" },
                        { value: "Painter", label: "Painter" },
                        { value: "Welder", label: "Welder" },
                        { value: "Driver", label: "Driver" },
                        { value: "Laborer", label: "Laborer" },
                        { value: "Gardener", label: "Gardener" },
                        { value: "Cleaner", label: "Cleaner" },
                        { value: "Mechanic", label: "Mechanic" },
                        { value: "Other", label: "Other" }
                    ]
                }
            },
            kn: {
                title: "ಹೊಸ ಕೆಲಸಗಾರರನ್ನು ಸೇರಿಸಿ",
                subtitle: "ನಿಮ್ಮ ಪಂಚಾಯತ್ಗೆ ಹೊಸ ಕೆಲಸಗಾರರನ್ನು ಸೇರಿಸಿ",
                back: "ಕೆಲಸಗಾರರಿಗೆ ಹಿಂತಿರುಗಿ",
                save: "ಕೆಲಸಗಾರರನ್ನು ಉಳಿಸಿ",
                cancel: "ರದ್ದುಮಾಡಿ",
                success: "ಕೆಲಸಗಾರರು ಯಶಸ್ವಿಯಾಗಿ ಸೇರಿಸಲ್ಪಟ್ಟಿದೆ",
                error: "ಕೆಲಸಗಾರರನ್ನು ಸೇರಿಸಲು ವಿಫಲವಾಗಿದೆ",
                form: {
                    name: "ಪೂರ್ಣ ಹೆಸರು *",
                    phone: "ಫೋನ್ ಸಂಖ್ಯೆ *",
                    email: "ಇಮೇಲ್ ವಿಳಾಸ",
                    aadhaar: "ಆಧಾರ್ ಸಂಖ್ಯೆ",
                    specialization: "ವಿಶೇಷತೆ *",
                    department: "ವಿಭಾಗ",
                    experience: "ವರ್ಷಗಳ ಅನುಭವ",
                    address: "ವಿಳಾಸ",
                    availability: "ಲಭ್ಯತೆ *",
                    skills: "ಕೌಶಲ್ಯಗಳು (ಕಾಮಾದಿಂದ ಬೇರ್ಪಡಿಸಲಾಗಿದೆ)",
                    isActive: "ಸಕ್ರಿಯ ಸ್ಥಿತಿ"
                },
                validation: {
                    nameRequired: "ಹೆಸರು ಅಗತ್ಯವಿದೆ",
                    phoneRequired: "ಫೋನ್ ಸಂಖ್ಯೆ ಅಗತ್ಯವಿದೆ",
                    specializationRequired: "ವಿಶೇಷತೆ ಅಗತ್ಯವಿದೆ",
                    phoneInvalid: "ಮಾನ್ಯ 10-ಅಂಕಿಯ ಫೋನ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ",
                    emailInvalid: "ಮಾನ್ಯ ಇಮೇಲ್ ವಿಳಾಸವನ್ನು ನಮೂದಿಸಿ",
                    aadhaarInvalid: "ಮಾನ್ಯ 12-ಅಂಕಿಯ ಆಧಾರ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ"
                },
                placeholders: {
                    name: "ಕೆಲಸಗಾರರ ಪೂರ್ಣ ಹೆಸರನ್ನು ನಮೂದಿಸಿ",
                    phone: "10-ಅಂಕಿಯ ಫೋನ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ",
                    email: "ಇಮೇಲ್ ವಿಳಾಸವನ್ನು ನಮೂದಿಸಿ",
                    aadhaar: "12-ಅಂಕಿಯ ಆಧಾರ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ",
                    specialization: "ಉದಾ., ಪ್ಲಂಬರ್, ಎಲೆಕ್ಟ್ರಿಶಿಯನ್, ಸೂತ್ರದಾರ",
                    department: "ಉದಾ., ಸಾರ್ವಜನಿಕ ಕೆಲಸ, ನೀರು ಇಲಾಖೆ",
                    experience: "ಉದಾ., 5",
                    address: "ಸಂಪೂರ್ಣ ವಿಳಾಸವನ್ನು ನಮೂದಿಸಿ",
                    skills: "ಉದಾ., ವೆಲ್ಡಿಂಗ್, ಕಲ್ಲಿನ ಕೆಲಸ, ಚಿತ್ರಕಲೆ"
                },
                options: {
                    availability: [
                        { value: "Available", label: "ಲಭ್ಯವಿದೆ" },
                        { value: "Busy", label: "ಬಿಜಿಯಾಗಿದೆ" },
                        { value: "On Leave", label: "ರಜೆಯ ಮೇಲೆ" },
                        { value: "On Vacation", label: "ರಜೆಯ ಮೇಲೆ" }
                    ],
                    department: [
                        { value: "Public Works", label: "ಸಾರ್ವಜನಿಕ ಕೆಲಸ" },
                        { value: "Water Department", label: "ನೀರು ಇಲಾಖೆ" },
                        { value: "Electricity", label: "ವಿದ್ಯುತ್" },
                        { value: "Sanitation", label: "ಸ್ವಚ್ಛತೆ" },
                        { value: "Road Maintenance", label: "ರಸ್ತೆ ನಿರ್ವಹಣೆ" },
                        { value: "Drainage", label: "ಒಳಚರಂಡಿ" },
                        { value: "Construction", label: "ನಿರ್ಮಾಣ" },
                        { value: "Other", label: "ಇತರೆ" }
                    ],
                    specialization: [
                        { value: "Plumber", label: "ಪ್ಲಂಬರ್" },
                        { value: "Electrician", label: "ಎಲೆಕ್ಟ್ರಿಶಿಯನ್" },
                        { value: "Carpenter", label: "ಸೂತ್ರದಾರ" },
                        { value: "Mason", label: "ಕಲ್ಲುಕೆಲಸಗಾರ" },
                        { value: "Painter", label: "ಚಿತ್ರಕಾರ" },
                        { value: "Welder", label: "ವೆಲ್ಡರ್" },
                        { value: "Driver", label: "ಚಾಲಕ" },
                        { value: "Laborer", label: "ಕೂಲಿ ಕೆಲಸಗಾರ" },
                        { value: "Gardener", label: "ತೋಟಗಾರ" },
                        { value: "Cleaner", label: "ಸ್ವಚ್ಛತೆ ಕೆಲಸಗಾರ" },
                        { value: "Mechanic", label: "ಮೆಕ್ಯಾನಿಕ್" },
                        { value: "Other", label: "ಇತರೆ" }
                    ]
                }
            },
            hi: {
                title: "नया कार्यकर्ता जोड़ें",
                subtitle: "अपनी पंचायत में एक नया कार्यकर्ता जोड़ें",
                back: "कार्यकर्ताओं पर वापस जाएं",
                save: "कार्यकर्ता सहेजें",
                cancel: "रद्द करें",
                success: "कार्यकर्ता सफलतापूर्वक जोड़ा गया",
                error: "कार्यकर्ता जोड़ने में विफल",
                form: {
                    name: "पूरा नाम *",
                    phone: "फोन नंबर *",
                    email: "ईमेल पता",
                    aadhaar: "आधार नंबर",
                    specialization: "विशेषज्ञता *",
                    department: "विभाग",
                    experience: "वर्षों का अनुभव",
                    address: "पता",
                    availability: "उपलब्धता *",
                    skills: "कौशल (अल्पविराम से अलग)",
                    isActive: "सक्रिय स्थिति"
                },
                validation: {
                    nameRequired: "नाम आवश्यक है",
                    phoneRequired: "फोन नंबर आवश्यक है",
                    specializationRequired: "विशेषज्ञता आवश्यक है",
                    phoneInvalid: "मान्य 10-अंकीय फोन नंबर दर्ज करें",
                    emailInvalid: "मान्य ईमेल पता दर्ज करें",
                    aadhaarInvalid: "मान्य 12-अंकीय आधार नंबर दर्ज करें"
                },
                placeholders: {
                    name: "कार्यकर्ता का पूरा नाम दर्ज करें",
                    phone: "10-अंकीय फोन नंबर दर्ज करें",
                    email: "ईमेल पता दर्ज करें",
                    aadhaar: "12-अंकीय आधार नंबर दर्ज करें",
                    specialization: "जैसे, प्लम्बर, इलेक्ट्रीशियन, बढ़ई",
                    department: "जैसे, लोक निर्माण, जल विभाग",
                    experience: "जैसे, 5",
                    address: "पूरा पता दर्ज करें",
                    skills: "जैसे, वेल्डिंग, राजगीरी, पेंटिंग"
                },
                options: {
                    availability: [
                        { value: "Available", label: "उपलब्ध" },
                        { value: "Busy", label: "व्यस्त" },
                        { value: "On Leave", label: "छुट्टी पर" },
                        { value: "On Vacation", label: "अवकाश पर" }
                    ],
                    department: [
                        { value: "Public Works", label: "लोक निर्माण" },
                        { value: "Water Department", label: "जल विभाग" },
                        { value: "Electricity", label: "बिजली" },
                        { value: "Sanitation", label: "स्वच्छता" },
                        { value: "Road Maintenance", label: "सड़क रखरखाव" },
                        { value: "Drainage", label: "नाली" },
                        { value: "Construction", label: "निर्माण" },
                        { value: "Other", label: "अन्य" }
                    ],
                    specialization: [
                        { value: "Plumber", label: "प्लम्बर" },
                        { value: "Electrician", label: "इलेक्ट्रीशियन" },
                        { value: "Carpenter", label: "बढ़ई" },
                        { value: "Mason", label: "राज मिस्त्री" },
                        { value: "Painter", label: "पेंटर" },
                        { value: "Welder", label: "वेल्डर" },
                        { value: "Driver", label: "चालक" },
                        { value: "Laborer", label: "मजदूर" },
                        { value: "Gardener", label: "माली" },
                        { value: "Cleaner", label: "सफाई कर्मचारी" },
                        { value: "Mechanic", label: "मैकेनिक" },
                        { value: "Other", label: "अन्य" }
                    ]
                }
            },
        };
        return L[locale] || L.en;
    }, [locale]);

    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        email: "",
        aadhaarNumber: "",
        specialization: "",
        department: "",
        experience: "",
        address: "",
        availability: "Available",
        skills: "",
        isActive: true
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [panchayatId, setPanchayatId] = useState("");
    const [panchayatName, setPanchayatName] = useState("");

    useEffect(() => {
        const fetchPanchayatInfo = async () => {
            const user = auth.currentUser;
            if (!user) {
                router.push(`/${locale}/authority/login`);
                return;
            }

            const authRef = doc(db, "authorities", user.uid);
            const authSnap = await getDoc(authRef);

            if (authSnap.exists()) {
                const authData = authSnap.data();
                setPanchayatId(authData.panchayatId);
                setPanchayatName(authData.panchayatName || authData.panchayat || "");
            }
        };

        fetchPanchayatInfo();
    }, [router, locale]);

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        // Name validation
        if (!formData.name.trim()) {
            newErrors.name = t.validation.nameRequired;
        }

        // Phone validation
        if (!formData.phone.trim()) {
            newErrors.phone = t.validation.phoneRequired;
        } else if (!/^\d{10}$/.test(formData.phone)) {
            newErrors.phone = t.validation.phoneInvalid;
        }

        // Email validation (optional)
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = t.validation.emailInvalid;
        }

        // Aadhaar validation (optional)
        if (formData.aadhaarNumber && !/^\d{12}$/.test(formData.aadhaarNumber)) {
            newErrors.aadhaarNumber = t.validation.aadhaarInvalid;
        }

        // Specialization validation
        if (!formData.specialization) {
            newErrors.specialization = t.validation.specializationRequired;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error("Please fix the errors in the form");
            return;
        }

        if (!panchayatId) {
            toast.error("Panchayat ID not found");
            return;
        }

        setLoading(true);

        try {
            const workerData = {
                ...formData,
                panchayatId,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                assignedIssues: 0,
                completedIssues: 0,
                rating: 0,
                // Parse skills from comma-separated string to array
                skills: formData.skills.split(',').map(skill => skill.trim()).filter(skill => skill)
            };

            await addDoc(collection(db, "workers"), workerData);

            toast.success(t.success);
            router.push(`/${locale}/authority/pdo/workers`);
        } catch (error) {
            console.error("Error adding worker:", error);
            toast.error(t.error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;

        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }

        // Clear error for this field when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: "" }));
        }
    };

    return (
        <Screen padded>
            <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-white p-4 pb-24">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-2xl font-bold text-blue-900">
                                {t.title}
                            </h1>
                            <p className="text-blue-700/80 mt-1 text-sm">
                                {panchayatName && `${panchayatName} • `}{t.subtitle}
                            </p>
                        </div>

                        <button
                            onClick={() => router.push(`/${locale}/authority/pdo/workers`)}
                            className="p-2 rounded-xl border-2 border-blue-100 bg-white hover:bg-blue-50"
                        >
                            <FiXCircle className="w-5 h-5 text-blue-700" />
                        </button>
                    </div>

                    <button
                        onClick={() => router.push(`/${locale}/authority/pdo/workers`)}
                        className="flex items-center gap-2 text-blue-700 hover:text-blue-900 mb-3 text-sm"
                    >
                        <FiArrowLeft className="w-4 h-4" />
                        {t.back}
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-white border-2 border-blue-100 rounded-2xl p-5 shadow-sm">
                        <h2 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                            <FiUser className="w-5 h-5" />
                            Basic Information
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-semibold text-blue-900 mb-2">
                                    {t.form.name}
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FiUser className="h-5 w-5 text-blue-700/70" />
                                    </div>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder={t.placeholders.name}
                                        className={`w-full pl-10 pr-4 py-3 rounded-xl border-2 ${errors.name ? 'border-red-300' : 'border-blue-100'} bg-white text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent`}
                                    />
                                </div>
                                {errors.name && (
                                    <p className="text-red-600 text-sm mt-1">{errors.name}</p>
                                )}
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="block text-sm font-semibold text-blue-900 mb-2">
                                    {t.form.phone}
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FiPhone className="h-5 w-5 text-blue-700/70" />
                                    </div>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder={t.placeholders.phone}
                                        className={`w-full pl-10 pr-4 py-3 rounded-xl border-2 ${errors.phone ? 'border-red-300' : 'border-blue-100'} bg-white text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent`}
                                    />
                                </div>
                                {errors.phone && (
                                    <p className="text-red-600 text-sm mt-1">{errors.phone}</p>
                                )}
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-semibold text-blue-900 mb-2">
                                    {t.form.email}
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FiMail className="h-5 w-5 text-blue-700/70" />
                                    </div>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder={t.placeholders.email}
                                        className={`w-full pl-10 pr-4 py-3 rounded-xl border-2 ${errors.email ? 'border-red-300' : 'border-blue-100'} bg-white text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent`}
                                    />
                                </div>
                                {errors.email && (
                                    <p className="text-red-600 text-sm mt-1">{errors.email}</p>
                                )}
                            </div>

                            {/* Aadhaar */}
                            <div>
                                <label className="block text-sm font-semibold text-blue-900 mb-2">
                                    {t.form.aadhaar}
                                </label>
                                <input
                                    type="text"
                                    name="aadhaarNumber"
                                    value={formData.aadhaarNumber}
                                    onChange={handleChange}
                                    placeholder={t.placeholders.aadhaar}
                                    className={`w-full px-4 py-3 rounded-xl border-2 ${errors.aadhaarNumber ? 'border-red-300' : 'border-blue-100'} bg-white text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent`}
                                />
                                {errors.aadhaarNumber && (
                                    <p className="text-red-600 text-sm mt-1">{errors.aadhaarNumber}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Professional Information */}
                    <div className="bg-white border-2 border-blue-100 rounded-2xl p-5 shadow-sm">
                        <h2 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                            <FiBriefcase className="w-5 h-5" />
                            Professional Information
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Specialization */}
                            <div>
                                <label className="block text-sm font-semibold text-blue-900 mb-2">
                                    {t.form.specialization}
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FiTool className="h-5 w-5 text-blue-700/70" />
                                    </div>
                                    <select
                                        name="specialization"
                                        value={formData.specialization}
                                        onChange={handleChange}
                                        className={`w-full pl-10 pr-4 py-3 rounded-xl border-2 ${errors.specialization ? 'border-red-300' : 'border-blue-100'} bg-white text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent`}
                                    >
                                        <option value="">{t.placeholders.specialization}</option>
                                        {t.options.specialization.map((option: { value: string; label: string }) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {errors.specialization && (
                                    <p className="text-red-600 text-sm mt-1">{errors.specialization}</p>
                                )}
                            </div>

                            {/* Department */}
                            <div>
                                <label className="block text-sm font-semibold text-blue-900 mb-2">
                                    {t.form.department}
                                </label>
                                <select
                                    name="department"
                                    value={formData.department}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl border-2 border-blue-100 bg-white text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent"
                                >
                                    <option value="">{t.placeholders.department}</option>
                                    {t.options.department.map((option: { value: string; label: string }) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Experience */}
                            <div>
                                <label className="block text-sm font-semibold text-blue-900 mb-2">
                                    {t.form.experience}
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FiCalendar className="h-5 w-5 text-blue-700/70" />
                                    </div>
                                    <input
                                        type="number"
                                        name="experience"
                                        value={formData.experience}
                                        onChange={handleChange}
                                        placeholder={t.placeholders.experience}
                                        min="0"
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-blue-100 bg-white text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            {/* Availability */}
                            <div>
                                <label className="block text-sm font-semibold text-blue-900 mb-2">
                                    {t.form.availability}
                                </label>
                                <select
                                    name="availability"
                                    value={formData.availability}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl border-2 border-blue-100 bg-white text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent"
                                >
                                    {t.options.availability.map((option: { value: string; label: string }) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Skills */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-blue-900 mb-2">
                                    {t.form.skills}
                                </label>
                                <input
                                    type="text"
                                    name="skills"
                                    value={formData.skills}
                                    onChange={handleChange}
                                    placeholder={t.placeholders.skills}
                                    className="w-full px-4 py-3 rounded-xl border-2 border-blue-100 bg-white text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent"
                                />
                                <p className="text-xs text-blue-700/60 mt-1">
                                    Enter skills separated by commas (e.g., welding, masonry, painting)
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Address and Status */}
                    <div className="bg-white border-2 border-blue-100 rounded-2xl p-5 shadow-sm">
                        <h2 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                            <FiHome className="w-5 h-5" />
                            Additional Information
                        </h2>

                        <div className="space-y-4">
                            {/* Address */}
                            <div>
                                <label className="block text-sm font-semibold text-blue-900 mb-2">
                                    {t.form.address}
                                </label>
                                <textarea
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    placeholder={t.placeholders.address}
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-xl border-2 border-blue-100 bg-white text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent resize-none"
                                />
                            </div>

                            {/* Active Status */}
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    name="isActive"
                                    checked={formData.isActive}
                                    onChange={handleChange}
                                    className="w-5 h-5 text-blue-600 rounded"
                                />
                                <label htmlFor="isActive" className="text-sm font-semibold text-blue-900">
                                    {t.form.isActive}
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="bg-white border-2 border-blue-100 rounded-2xl p-5 shadow-sm">
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => router.push(`/${locale}/authority/pdo/workers`)}
                                className="flex-1 px-6 py-3 border-2 border-blue-200 text-blue-700 rounded-xl font-semibold hover:bg-blue-50 transition-all"
                                disabled={loading}
                            >
                                {t.cancel}
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition-all disabled:opacity-50"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <FiSave className="w-4 h-4" />
                                        {t.save}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>

                {/* Bottom Navigation */}
                <div className="fixed bottom-4 left-4 right-4 bg-white/90 backdrop-blur-lg border-2 border-blue-100 rounded-2xl p-2 shadow-xl">
                    <div className="grid grid-cols-4 gap-1">
                        <button
                            className="flex flex-col items-center justify-center p-3 rounded-xl transition-all hover:bg-blue-50"
                            onClick={() => router.push(`/${locale}/authority/pdo/dashboard`)}
                        >
                            <FiHome className="w-5 h-5 text-blue-600/70" />
                            <span className="text-xs mt-1 font-medium text-blue-700/70">
                                Dashboard
                            </span>
                        </button>

                        <button
                            className="flex flex-col items-center justify-center p-3 rounded-xl transition-all hover:bg-blue-50"
                            onClick={() => router.push(`/${locale}/authority/pdo/workers`)}
                        >
                            <FiUser className="w-5 h-5 text-blue-700" />
                            <span className="text-xs mt-1 font-medium text-blue-800 font-bold">
                                Workers
                            </span>
                        </button>

                        <button
                            className="flex flex-col items-center justify-center p-3 rounded-xl transition-all hover:bg-blue-50"
                            onClick={() => router.push(`/${locale}/authority/pdo/issues`)}
                        >
                            <FiFileText className="w-5 h-5 text-blue-600/70" />
                            <span className="text-xs mt-1 font-medium text-blue-700/70">
                                Issues
                            </span>
                        </button>

                        <button
                            className="flex flex-col items-center justify-center p-3 rounded-xl transition-all hover:bg-blue-50"
                            onClick={() => router.push(`/${locale}/authority/pdo/profile`)}
                        >
                            <FiUser className="w-5 h-5 text-blue-600/70" />
                            <span className="text-xs mt-1 font-medium text-blue-700/70">
                                Profile
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </Screen>
    );
}