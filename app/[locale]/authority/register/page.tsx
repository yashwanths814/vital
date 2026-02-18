"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Screen from "../../../components/Screen";
import { auth, db } from "../../../lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import {
    collection,
    doc,
    getDocs,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    where,
    limit,
} from "firebase/firestore";
import { Eye, EyeOff, MapPin, User, Mail, Phone, FileText, Home, LogIn } from "lucide-react";
import { FiAlertCircle, FiShield } from "react-icons/fi";

type Locale = "en" | "kn" | "hi";

type District = { 
    id: string; 
    name: string; 
    code?: string; 
    state?: string;
    isActive?: boolean;
};

type Taluk = { 
    id: string; 
    name: string; 
    districtId: string;
    districtName: string;
    isActive?: boolean;
};

type Village = {
    id: string;
    name: string;
    districtId: string;
    districtName: string;
    talukId: string;
    talukName: string;
    isActive?: boolean;
};

type Panchayat = {
    id: string;
    name: string;
    code?: string;
    districtId: string;
    talukId: string;
    villageId?: string;
    villageName?: string;
    isActive?: boolean;
};

// Indian mobile number validation
const validateIndianMobile = (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
        return /^[6-9]\d{9}$/.test(cleaned);
    } else if (cleaned.length === 11 && cleaned.startsWith('0')) {
        return /^0[6-9]\d{9}$/.test(cleaned);
    } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
        return /^91[6-9]\d{9}$/.test(cleaned);
    }
    return false;
};

const formatIndianMobile = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
        return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
        return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
    } else if (cleaned.length === 11 && cleaned.startsWith('0')) {
        return `+91 ${cleaned.slice(1, 6)} ${cleaned.slice(6)}`;
    }
    return phone;
};

export default function VillagerRegisterPage() {
    const router = useRouter();
    const params = useParams() as { locale?: string };
    const locale = (params?.locale || "en") as Locale;

    const t = useMemo(() => {
        const L: any = {
            en: {
                title: "Villager Registration",
                subtitle: "Register and wait for Village In-charge verification",
                fullName: "Full Name *",
                email: "Email *",
                password: "Password *",
                mobile: "Mobile Number *",
                mobileHint: "Indian mobile number (starts with 6, 7, 8, or 9)",
                mobileFormat: "Format: +91 XXXXX XXXXX",
                mobileInvalid: "Please enter a valid Indian mobile number (10 digits starting with 6-9)",
                aadhaar: "Aadhaar Number *",
                aadhaarNote: "Stored as full 12 digits (only last 4 visible to authorities)",
                district: "District *",
                taluk: "Taluk *",
                village: "Village *",
                panchayat: "Panchayat *",
                register: "Register as Villager",
                creating: "Creating Account...",
                passwordRequirements: "Password Requirements",
                uppercase: "At least one uppercase letter (A-Z)",
                lowercase: "At least one lowercase letter (a-z)",
                number: "At least one number (0-9)",
                specialChar: "At least one special character (!@#$%^&* etc.)",
                minLength: "At least 8 characters long",
                selectDistrict: "Select District",
                selectTaluk: "Select Taluk",
                selectVillage: "Select Village",
                selectPanchayat: "Select Panchayat",
                enterFullName: "Enter your full name",
                enterEmail: "your.email@example.com",
                enterPassword: "Enter a valid password",
                enterMobile: "98765 43210",
                enterAadhaar: "12-digit Aadhaar",
                alreadyRegistered: "Already registered?",
                loginHere: "Login here",
                noPanchayat: "No panchayats found for this village. Please contact your village authority.",
                emailRestriction: "Only Gmail, Outlook, Yahoo, and government emails are allowed",
                errors: {
                    name: "Name is required",
                    email: "Please enter a valid email address",
                    emailDomain: "Only Gmail, Outlook, Yahoo, and government emails are allowed",
                    emailExists: "This email is already registered",
                    password: "Please enter a valid password meeting all requirements",
                    mobile: "Please enter a valid 10-digit Indian mobile number",
                    aadhaar: "Aadhaar must be exactly 12 digits",
                    selectLocation: "Please select all location fields",
                    loadLoc: "Failed to load location data",
                },
            },
            kn: {
                title: "ಗ್ರಾಮಸ್ಥ ನೋಂದಣಿ",
                subtitle: "ನೋಂದಣಿ ಮಾಡಿ ಮತ್ತು ಗ್ರಾಮ ಇಂಚಾರ್ಜ್ ಪರಿಶೀಲನೆಗಾಗಿ ಕಾಯಿರಿ",
                fullName: "ಪೂರ್ಣ ಹೆಸರು *",
                email: "ಇಮೇಲ್ *",
                password: "ಪಾಸ್‌ವರ್ಡ್ *",
                mobile: "ಮೊಬೈಲ್ ಸಂಖ್ಯೆ *",
                mobileHint: "ಭಾರತೀಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ (6, 7, 8, ಅಥವಾ 9 ರಿಂದ ಆರಂಭ)",
                mobileFormat: "ಸ್ವರೂಪ: +91 XXXXX XXXXX",
                mobileInvalid: "ದಯವಿಟ್ಟು ಮಾನ್ಯ ಭಾರತೀಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ (6-9 ರಿಂದ ಆರಂಭವಾಗುವ 10 ಅಂಕೆಗಳು)",
                aadhaar: "ಆಧಾರ್ ಸಂಖ್ಯೆ *",
                aadhaarNote: "ಪೂರ್ಣ 12 ಅಂಕಿಗಳಾಗಿ ಸಂಗ್ರಹಿಸಲಾಗುತ್ತದೆ (ಕೊನೆಯ 4 ಮಾತ್ರ ಅಧಿಕಾರಿಗಳಿಗೆ ಗೋಚರಿಸುತ್ತದೆ)",
                district: "ಜಿಲ್ಲೆ *",
                taluk: "ತಾಲೂಕು *",
                village: "ಗ್ರಾಮ *",
                panchayat: "ಪಂಚಾಯತ್ *",
                register: "ಗ್ರಾಮಸ್ಥರಾಗಿ ನೋಂದಣಿ",
                creating: "ಖಾತೆಯನ್ನು ರಚಿಸಲಾಗುತ್ತಿದೆ...",
                passwordRequirements: "ಪಾಸ್‌ವರ್ಡ್ ಅವಶ್ಯಕತೆಗಳು",
                uppercase: "ಕನಿಷ್ಠ ಒಂದು ದೊಡ್ಡ ಅಕ್ಷರ (A-Z)",
                lowercase: "ಕನಿಷ್ಠ ಒಂದು ಸಣ್ಣ ಅಕ್ಷರ (a-z)",
                number: "ಕನಿಷ್ಠ ಒಂದು ಸಂಖ್ಯೆ (0-9)",
                specialChar: "ಕನಿಷ್ಠ ಒಂದು ವಿಶೇಷ ಅಕ್ಷರ (!@#$%^&* ಇತ್ಯಾದಿ)",
                minLength: "ಕನಿಷ್ಠ 8 ಅಕ್ಷರಗಳು",
                selectDistrict: "ಜಿಲ್ಲೆ ಆಯ್ಕೆಮಾಡಿ",
                selectTaluk: "ತಾಲೂಕು ಆಯ್ಕೆಮಾಡಿ",
                selectVillage: "ಗ್ರಾಮ ಆಯ್ಕೆಮಾಡಿ",
                selectPanchayat: "ಪಂಚಾಯತ್ ಆಯ್ಕೆಮಾಡಿ",
                enterFullName: "ನಿಮ್ಮ ಪೂರ್ಣ ಹೆಸರು ನಮೂದಿಸಿ",
                enterEmail: "ನಿಮ್ಮ ಇಮೇಲ್@ಉದಾಹರಣೆ.ಕಾಂ",
                enterPassword: "ಮಾನ್ಯ ಪಾಸ್‌ವರ್ಡ್ ನಮೂದಿಸಿ",
                enterMobile: "98765 43210",
                enterAadhaar: "12-ಅಂಕಿಯ ಆಧಾರ್",
                alreadyRegistered: "ಈಗಾಗಲೇ ನೋಂದಾಯಿಸಿದ್ದೀರಾ?",
                loginHere: "ಇಲ್ಲಿ ಲಾಗಿನ್ ಮಾಡಿ",
                noPanchayat: "ಈ ಗ್ರಾಮಕ್ಕೆ ಪಂಚಾಯತ್‌ಗಳು ಕಂಡುಬಂದಿಲ್ಲ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ಗ್ರಾಮ ಅಧಿಕಾರಿಯನ್ನು ಸಂಪರ್ಕಿಸಿ.",
                emailRestriction: "Gmail, Outlook, Yahoo ಮತ್ತು ಸರ್ಕಾರಿ ಇಮೇಲ್‌ಗಳನ್ನು ಮಾತ್ರ ಅನುಮತಿಸಲಾಗಿದೆ",
                errors: {
                    name: "ಹೆಸರು ಅಗತ್ಯವಿದೆ",
                    email: "ದಯವಿಟ್ಟು ಮಾನ್ಯ ಇಮೇಲ್ ವಿಳಾಸವನ್ನು ನಮೂದಿಸಿ",
                    emailDomain: "Gmail, Outlook, Yahoo ಮತ್ತು ಸರ್ಕಾರಿ ಇಮೇಲ್‌ಗಳನ್ನು ಮಾತ್ರ ಅನುಮತಿಸಲಾಗಿದೆ",
                    emailExists: "ಈ ಇಮೇಲ್ ಈಗಾಗಲೇ ನೋಂದಾಯಿಸಲಾಗಿದೆ",
                    password: "ದಯವಿಟ್ಟು ಎಲ್ಲಾ ಅವಶ್ಯಕತೆಗಳನ್ನು ಪೂರೈಸುವ ಮಾನ್ಯ ಪಾಸ್‌ವರ್ಡ್ ನಮೂದಿಸಿ",
                    mobile: "ದಯವಿಟ್ಟು ಮಾನ್ಯ 10-ಅಂಕಿಯ ಭಾರತೀಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ",
                    aadhaar: "ಆಧಾರ್ ನಿಖರವಾಗಿ 12 ಅಂಕೆಗಳಾಗಿರಬೇಕು",
                    selectLocation: "ದಯವಿಟ್ಟು ಎಲ್ಲಾ ಸ್ಥಳ ಕ್ಷೇತ್ರಗಳನ್ನು ಆಯ್ಕೆಮಾಡಿ",
                    loadLoc: "ಸ್ಥಳ ಡೇಟಾವನ್ನು ಲೋಡ್ ಮಾಡಲು ವಿಫಲವಾಗಿದೆ",
                },
            },
            hi: {
                title: "ग्रामीण पंजीकरण",
                subtitle: "रजिस्टर करें और ग्राम इंचार्ज सत्यापन की प्रतीक्षा करें",
                fullName: "पूरा नाम *",
                email: "ईमेल *",
                password: "पासवर्ड *",
                mobile: "मोबाइल नंबर *",
                mobileHint: "भारतीय मोबाइल नंबर (6, 7, 8, या 9 से शुरू)",
                mobileFormat: "प्रारूप: +91 XXXXX XXXXX",
                mobileInvalid: "कृपया एक वैध भारतीय मोबाइल नंबर दर्ज करें (6-9 से शुरू होने वाले 10 अंक)",
                aadhaar: "आधार नंबर *",
                aadhaarNote: "पूर्ण 12 अंकों के रूप में संग्रहीत (केवल अंतिम 4 अधिकारियों को दिखाई देते हैं)",
                district: "जिला *",
                taluk: "तालुक *",
                village: "गांव *",
                panchayat: "पंचायत *",
                register: "ग्रामीण के रूप में पंजीकरण",
                creating: "खाता बनाया जा रहा है...",
                passwordRequirements: "पासवर्ड आवश्यकताएं",
                uppercase: "कम से कम एक बड़ा अक्षर (A-Z)",
                lowercase: "कम से कम एक छोटा अक्षर (a-z)",
                number: "कम से कम एक संख्या (0-9)",
                specialChar: "कम से कम एक विशेष वर्ण (!@#$%^&* आदि)",
                minLength: "कम से कम 8 अक्षर लंबा",
                selectDistrict: "जिला चुनें",
                selectTaluk: "तालुक चुनें",
                selectVillage: "गांव चुनें",
                selectPanchayat: "पंचायत चुनें",
                enterFullName: "अपना पूरा नाम दर्ज करें",
                enterEmail: "आपका.ईमेल@उदाहरण.कॉम",
                enterPassword: "मान्य पासवर्ड दर्ज करें",
                enterMobile: "98765 43210",
                enterAadhaar: "12-अंकीय आधार",
                alreadyRegistered: "पहले से पंजीकृत हैं?",
                loginHere: "यहाँ लॉगिन करें",
                noPanchayat: "इस गांव के लिए कोई पंचायत नहीं मिली। कृपया अपने गांव के अधिकारी से संपर्क करें।",
                emailRestriction: "केवल Gmail, Outlook, Yahoo और सरकारी ईमेल की अनुमति है",
                errors: {
                    name: "नाम आवश्यक है",
                    email: "कृपया मान्य ईमेल पता दर्ज करें",
                    emailDomain: "केवल Gmail, Outlook, Yahoo और सरकारी ईमेल की अनुमति है",
                    emailExists: "यह ईमेल पहले से पंजीकृत है",
                    password: "कृपया सभी आवश्यकताओं को पूरा करने वाला मान्य पासवर्ड दर्ज करें",
                    mobile: "कृपया मान्य 10-अंकीय भारतीय मोबाइल नंबर दर्ज करें",
                    aadhaar: "आधार ठीक 12 अंकों का होना चाहिए",
                    selectLocation: "कृपया सभी स्थान फ़ील्ड चुनें",
                    loadLoc: "स्थान डेटा लोड करने में विफल",
                },
            },
        };
        return L[locale] || L.en;
    }, [locale]);

    // Form state
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [mobile, setMobile] = useState("");
    const [aadhaar, setAadhaar] = useState("");

    // Location state
    const [districtId, setDistrictId] = useState("");
    const [talukId, setTalukId] = useState("");
    const [villageId, setVillageId] = useState("");
    const [panchayatId, setPanchayatId] = useState("");

    // Lists
    const [districts, setDistricts] = useState<District[]>([]);
    const [taluks, setTaluks] = useState<Taluk[]>([]);
    const [villages, setVillages] = useState<Village[]>([]);
    const [panchayats, setPanchayats] = useState<Panchayat[]>([]);

    // UI state
    const [loadingLoc, setLoadingLoc] = useState(false);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");
    const [success, setSuccess] = useState(false);

    // Validation states
    const [emailValid, setEmailValid] = useState<boolean | null>(null);
    const [emailChecking, setEmailChecking] = useState(false);
    const [touched, setTouched] = useState({
        name: false,
        email: false,
        password: false,
        mobile: false,
        aadhaar: false,
    });

    // Password strength
    const [passwordStrength, setPasswordStrength] = useState({
        hasUppercase: false,
        hasLowercase: false,
        hasNumber: false,
        hasSpecialChar: false,
        hasMinLength: false
    });

    // Allowed email domains
    const allowedDomains = [
        'gmail.com', 
        'outlook.com', 
        'hotmail.com', 
        'yahoo.com', 
        'yahoo.co.in',
        'gov.in',
        'nic.in',
        'karnataka.gov.in'
    ];

    // Validate email with domain restriction
    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return false;
        
        const domain = email.split('@')[1].toLowerCase();
        return allowedDomains.some(allowed => domain === allowed || domain.endsWith('.' + allowed));
    };

    // Check email availability
    const checkEmailAvailability = async (email: string) => {
        if (!validateEmail(email)) return;
        
        setEmailChecking(true);
        try {
            const usersQuery = query(
                collection(db, "users"),
                where("email", "==", email),
                limit(1)
            );
            const usersSnapshot = await getDocs(usersQuery);
            
            const villagersQuery = query(
                collection(db, "villagers"),
                where("email", "==", email),
                limit(1)
            );
            const villagersSnapshot = await getDocs(villagersQuery);
            
            const authoritiesQuery = query(
                collection(db, "authorities"),
                where("email", "==", email),
                limit(1)
            );
            const authoritiesSnapshot = await getDocs(authoritiesQuery);
            
            setEmailValid(
                usersSnapshot.empty && 
                villagersSnapshot.empty && 
                authoritiesSnapshot.empty
            );
        } catch (error) {
            console.error("Error checking email:", error);
            setEmailValid(null);
        } finally {
            setEmailChecking(false);
        }
    };

    // Debounced email check
    useEffect(() => {
        const timer = setTimeout(() => {
            if (email && touched.email) {
                checkEmailAvailability(email);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [email, touched.email]);

    // Validate password strength
    const validatePasswordStrength = (pwd: string) => {
        setPasswordStrength({
            hasUppercase: /[A-Z]/.test(pwd),
            hasLowercase: /[a-z]/.test(pwd),
            hasNumber: /\d/.test(pwd),
            hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd),
            hasMinLength: pwd.length >= 8
        });
    };

    const handlePasswordChange = (value: string) => {
        setPassword(value);
        validatePasswordStrength(value);
        if (touched.password) {
            setTouched(prev => ({ ...prev, password: true }));
        }
    };

    const isPasswordValid = () => {
        return Object.values(passwordStrength).every(Boolean);
    };

    const validateAadhaar = (aadhaar: string): boolean => {
        const cleanAadhaar = aadhaar.replace(/\D/g, '');
        return cleanAadhaar.length === 12 && /^\d+$/.test(cleanAadhaar);
    };

    const handleAadhaarChange = (value: string) => {
        const cleaned = value.replace(/\D/g, '').slice(0, 12);
        setAadhaar(cleaned);
        if (touched.aadhaar) {
            setTouched(prev => ({ ...prev, aadhaar: true }));
        }
    };

    const handleMobileChange = (value: string) => {
        const digitsOnly = value.replace(/\D/g, '');
        let processed = digitsOnly;
        if (digitsOnly.startsWith('91') && digitsOnly.length > 10) {
            processed = digitsOnly;
        } else if (digitsOnly.length > 10) {
            processed = digitsOnly.slice(-10);
        } else {
            processed = digitsOnly;
        }
        setMobile(processed);
        if (touched.mobile) {
            setTouched(prev => ({ ...prev, mobile: true }));
        }
    };

    // Load districts
    useEffect(() => {
        const loadDistricts = async () => {
            setLoadingLoc(true);
            try {
                const q = query(
                    collection(db, "districts"),
                    orderBy("name", "asc")
                );
                const snap = await getDocs(q);
                const districtsData = snap.docs.map((d) => ({ 
                    id: d.id, 
                    ...(d.data() as any) 
                }));
                setDistricts(districtsData);
            } catch (e) {
                console.error("Error loading districts:", e);
                setErr(t.errors.loadLoc);
            } finally {
                setLoadingLoc(false);
            }
        };
        loadDistricts();
    }, []);

    // Load taluks when district changes
    useEffect(() => {
        const loadTaluks = async () => {
            if (!districtId) {
                setTaluks([]);
                setTalukId("");
                setVillageId("");
                setPanchayatId("");
                return;
            }

            setLoadingLoc(true);
            try {
                const q = query(
                    collection(db, "taluks"),
                    where("districtId", "==", districtId),
                    orderBy("name", "asc")
                );
                const snap = await getDocs(q);
                const taluksData = snap.docs.map((d) => ({ 
                    id: d.id, 
                    ...(d.data() as any) 
                }));
                setTaluks(taluksData);
                setTalukId("");
                setVillageId("");
                setPanchayatId("");
            } catch (e) {
                console.error("Error loading taluks:", e);
            } finally {
                setLoadingLoc(false);
            }
        };
        loadTaluks();
    }, [districtId]);

    // Load villages when taluk changes
    useEffect(() => {
        const loadVillages = async () => {
            if (!districtId || !talukId) {
                setVillages([]);
                setVillageId("");
                setPanchayatId("");
                return;
            }

            setLoadingLoc(true);
            try {
                const q = query(
                    collection(db, "villages"),
                    where("talukId", "==", talukId),
                    where("districtId", "==", districtId),
                    orderBy("name", "asc")
                );
                const snap = await getDocs(q);
                const villagesData = snap.docs.map((d) => ({ 
                    id: d.id, 
                    ...(d.data() as any) 
                }));
                setVillages(villagesData);
                setVillageId("");
                setPanchayatId("");
            } catch (e) {
                console.error("Error loading villages:", e);
            } finally {
                setLoadingLoc(false);
            }
        };
        loadVillages();
    }, [talukId, districtId]);

    // Load panchayats when village changes
    useEffect(() => {
        const loadPanchayats = async () => {
            if (!districtId || !talukId || !villageId) {
                setPanchayats([]);
                setPanchayatId("");
                return;
            }

            setLoadingLoc(true);
            try {
                const q = query(
                    collection(db, "panchayats"),
                    where("talukId", "==", talukId),
                    where("districtId", "==", districtId),
                    where("villageId", "==", villageId),
                    orderBy("name", "asc")
                );
                const snap = await getDocs(q);
                const panchayatsData = snap.docs.map((d) => ({ 
                    id: d.id, 
                    ...(d.data() as any) 
                }));
                setPanchayats(panchayatsData);
                setPanchayatId("");
            } catch (e) {
                console.error("Error loading panchayats:", e);
            } finally {
                setLoadingLoc(false);
            }
        };
        loadPanchayats();
    }, [villageId, talukId, districtId]);

    const handleSubmit = async () => {
        setErr("");

        // Validation
        if (!name.trim()) {
            setErr(t.errors.name);
            setTouched(prev => ({ ...prev, name: true }));
            return;
        }

        if (!validateEmail(email)) {
            setErr(t.errors.emailDomain);
            setTouched(prev => ({ ...prev, email: true }));
            return;
        }

        if (!emailValid) {
            setErr(t.errors.emailExists);
            return;
        }

        if (!isPasswordValid()) {
            setErr(t.errors.password);
            setTouched(prev => ({ ...prev, password: true }));
            return;
        }

        if (!validateIndianMobile(mobile)) {
            setErr(t.errors.mobile);
            setTouched(prev => ({ ...prev, mobile: true }));
            return;
        }

        if (!validateAadhaar(aadhaar)) {
            setErr(t.errors.aadhaar);
            setTouched(prev => ({ ...prev, aadhaar: true }));
            return;
        }

        if (!districtId || !talukId || !villageId || !panchayatId) {
            setErr(t.errors.selectLocation);
            return;
        }

        try {
            setLoading(true);

            const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);

            const districtName = districts.find((d) => d.id === districtId)?.name || "";
            const talukName = taluks.find((x) => x.id === talukId)?.name || "";
            const villageName = villages.find((v) => v.id === villageId)?.name || "";
            const panchayat = panchayats.find((p) => p.id === panchayatId);
            const panchayatName = panchayat?.name || "";
            const panchayatCode = panchayat?.code || "";

            const villagerData = {
                uid: cred.user.uid,
                name: name.trim(),
                email: email.trim().toLowerCase(),
                mobile: mobile.replace(/\D/g, "").slice(-10),
                mobileFormatted: formatIndianMobile(mobile),
                aadhaar: aadhaar.replace(/\D/g, ""),
                aadhaarLast4: aadhaar.replace(/\D/g, "").slice(-4),
                districtId,
                talukId,
                villageId,
                panchayatId,
                district: districtName,
                taluk: talukName,
                village: villageName,
                panchayatName,
                panchayatCode,
                status: "pending",
                verified: false,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            await setDoc(doc(db, "villagers", cred.user.uid), villagerData);

            await setDoc(doc(db, "users", cred.user.uid), {
                uid: cred.user.uid,
                name: name.trim(),
                email: email.trim().toLowerCase(),
                role: "villager",
                panchayatId,
                districtId,
                talukId,
                villageId,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            setSuccess(true);
            setTimeout(() => {
                router.replace(`/${locale}/villager/status`);
            }, 2000);

        } catch (error: any) {
            console.error("Registration error:", error);
            
            if (error.code === "auth/email-already-in-use") {
                setErr(t.errors.emailExists);
            } else if (error.code === "auth/invalid-email") {
                setErr(t.errors.email);
            } else if (error.code === "auth/weak-password") {
                setErr(t.errors.password);
            } else if (error.message) {
                setErr(error.message);
            } else {
                setErr("Registration failed. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !loading) {
            handleSubmit();
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

                @keyframes slideInRight {
                    from {
                        opacity: 0;
                        transform: translateX(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
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

                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }

                @keyframes shimmer {
                    0% { background-position: -1000px 0; }
                    100% { background-position: 1000px 0; }
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

                .animate-shake {
                    animation: shake 0.35s ease-in-out;
                }

                .animate-float {
                    animation: float 3s ease-in-out infinite;
                }

                .animate-pulse-slow {
                    animation: pulse 2s ease-in-out infinite;
                }

                .delay-100 { animation-delay: 0.1s; }
                .delay-200 { animation-delay: 0.2s; }
                .delay-300 { animation-delay: 0.3s; }
                .delay-400 { animation-delay: 0.4s; }
                .delay-500 { animation-delay: 0.5s; }
                .delay-600 { animation-delay: 0.6s; }
                .delay-700 { animation-delay: 0.7s; }

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
                    outline: none;
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
                    position: relative;
                    overflow: hidden;
                }

                .card-bg::before {
                    content: '';
                    position: absolute;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    background: linear-gradient(
                        45deg,
                        transparent 30%,
                        rgba(255, 255, 255, 0.1) 50%,
                        transparent 70%
                    );
                    animation: shimmer 8s linear infinite;
                    pointer-events: none;
                }

                .divider {
                    position: relative;
                    text-align: center;
                    margin: 1.5rem 0 1rem 0;
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
                    position: relative;
                    overflow: hidden;
                }

                .button-base::after {
                    content: '';
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    width: 0;
                    height: 0;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.3);
                    transform: translate(-50%, -50%);
                    transition: width 0.6s, height 0.6s;
                }

                .button-base:active::after {
                    width: 300px;
                    height: 300px;
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

                .strength-meter {
                    display: flex;
                    gap: 3px;
                    margin-top: 8px;
                }

                .strength-segment {
                    flex: 1;
                    height: 4px;
                    background: #e5e7eb;
                    border-radius: 2px;
                    transition: all 0.3s ease;
                }

                .strength-segment.active {
                    background: #10b981;
                }

                .strength-segment.strong {
                    background: #059669;
                }

                .login-button {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 16px;
                    background: linear-gradient(135deg, #f0fdf4, #dcfce7);
                    border: 1.5px solid #86efac;
                    border-radius: 40px;
                    color: #166534;
                    font-weight: 600;
                    font-size: 14px;
                    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                    cursor: pointer;
                    box-shadow: 0 2px 8px rgba(22, 163, 74, 0.1);
                }

                .login-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(22, 163, 74, 0.2);
                    border-color: #4ade80;
                }

                .login-button:active {
                    transform: translateY(0) scale(0.95);
                }

                .login-button svg {
                    transition: transform 0.3s ease;
                }

                .login-button:hover svg {
                    transform: translateX(3px);
                }

                /* Mobile Responsive Styles */
                @media (max-width: 640px) {
                    .input-field {
                        font-size: 16px !important;
                        padding: 12px 16px !important;
                    }
                    
                    .card-bg {
                        border-radius: 24px !important;
                    }
                    
                    .grid {
                        gap: 12px !important;
                    }
                    
                    button, select, .link-hover, .icon-button {
                        min-height: 48px;
                        min-width: 48px;
                    }
                    
                    .link-hover {
                        padding: 8px 0;
                        display: inline-block;
                    }
                    
                    .p-6 {
                        padding: 20px !important;
                    }
                    
                    h1 {
                        font-size: 24px !important;
                    }
                    
                    .text-sm {
                        font-size: 14px !important;
                    }
                    
                    .pointer-events-none {
                        padding-right: 16px !important;
                    }

                    .space-y-4 > * {
                        margin-bottom: 16px;
                    }

                    .absolute.left-3 span {
                        font-size: 14px !important;
                        padding: 6px 10px !important;
                    }

                    input.pl-16 {
                        padding-left: 80px !important;
                    }

                    .login-button {
                        padding: 6px 12px;
                        font-size: 13px;
                    }
                }

                @media (max-width: 380px) {
                    .grid {
                        grid-template-columns: 1fr !important;
                    }
                    
                    .text-xs {
                        font-size: 12px !important;
                    }
                    
                    .absolute.left-3 span {
                        font-size: 13px !important;
                        padding: 4px 8px !important;
                    }
                    
                    input.pl-16 {
                        padding-left: 70px !important;
                    }

                    .flex.items-center.gap-2 {
                        gap: 6px !important;
                    }

                    .login-button {
                        padding: 4px 10px;
                        font-size: 12px;
                    }
                }

                @media (max-width: 320px) {
                    .p-6 {
                        padding: 16px !important;
                    }

                    h1 {
                        font-size: 20px !important;
                    }

                    .text-base {
                        font-size: 14px !important;
                    }

                    .gap-3 {
                        gap: 8px !important;
                    }
                }

                select {
                    font-size: 16px !important;
                }

                .button-base:active {
                    transform: scale(0.98);
                    opacity: 0.9;
                }

                :focus-visible {
                    outline: 2px solid #16a34a;
                    outline-offset: 2px;
                }

                .orb {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(60px);
                    opacity: 0.15;
                    animation: float 8s ease-in-out infinite;
                }

                .orb-1 {
                    top: 10%;
                    right: 5%;
                    width: 300px;
                    height: 300px;
                    background: #4ade80;
                    animation-delay: 0s;
                }

                .orb-2 {
                    bottom: 10%;
                    left: 5%;
                    width: 250px;
                    height: 250px;
                    background: #22c55e;
                    animation-delay: -2s;
                }

                .orb-3 {
                    top: 40%;
                    left: 30%;
                    width: 200px;
                    height: 200px;
                    background: #86efac;
                    animation-delay: -4s;
                }
            `}</style>

            <div className="min-h-screen flex items-center justify-center p-4 animate-fadeIn">
                <div className="w-full max-w-3xl relative">
                    {/* Animated background orbs */}
                    <div className="orb orb-1"></div>
                    <div className="orb orb-2"></div>
                    <div className="orb orb-3"></div>

                    {/* Header with Login Button */}
                    <div className="mb-8 animate-slideUp">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div className="flex items-center gap-3">
                                <div className="header-icon animate-pulse-slow">
                                    <FiShield className="w-9 h-9 text-green-700" />
                                </div>
                                <h1 className="text-3xl font-bold text-green-900 tracking-tight">
                                    {t.title}
                                </h1>
                            </div>
                            
                            {/* Login Button */}
                            <button
                                onClick={() => router.push(`/${locale}/villager/login`)}
                                className="login-button animate-slideInRight"
                            >
                                <LogIn className="w-4 h-4" />
                                <span>{t.loginHere}</span>
                            </button>
                        </div>
                        <p className="text-base text-green-700/75 leading-relaxed font-semibold mt-4">
                            {t.subtitle}
                        </p>
                    </div>

                    {/* Mobile login link */}
                    <div className="sm:hidden mb-4 text-center animate-slideUp delay-100">
                        <p className="text-sm text-green-700">
                            {t.alreadyRegistered}{" "}
                            <button
                                onClick={() => router.push(`/${locale}/villager/login`)}
                                className="text-green-600 font-semibold underline underline-offset-2 hover:text-green-700 transition-colors"
                            >
                                {t.loginHere}
                            </button>
                        </p>
                    </div>

                    {/* Error Alert */}
                    {err && (
                        <div className="mb-6 p-4 rounded-2xl border border-red-200 bg-red-50/80 animate-slideUp delay-200">
                            <div className="flex items-start gap-3 text-red-700">
                                <FiAlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 animate-pulse" />
                                <span className="text-sm leading-snug">{err}</span>
                            </div>
                        </div>
                    )}

                    {/* Success Message */}
                    {success && (
                        <div className="mb-6 p-6 rounded-3xl bg-gradient-to-r from-green-500 to-emerald-500 shadow-2xl animate-bounceIn">
                            <div className="flex items-center gap-3 text-white">
                                <div className="p-2 bg-white rounded-full">
                                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">Registration Successful!</h3>
                                    <p className="text-sm text-green-50">Redirecting to status page...</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Main Form Card */}
                    {!success && (
                        <div className="card-bg border border-green-100 rounded-3xl shadow-lg overflow-hidden animate-slideUp delay-300">
                            <div className="p-6 sm:p-8">
                                {/* Personal Information Section */}
                                <div className="mb-8">
                                    <h3 className="text-lg font-bold text-green-900 mb-4 flex items-center gap-2 animate-fadeIn delay-400">
                                        <User className="w-5 h-5 animate-float" />
                                        Personal Information
                                    </h3>

                                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                                        {/* Name */}
                                        <div className="col-span-1 animate-fadeIn delay-500">
                                            <label className="text-sm font-semibold text-green-900 mb-2 flex items-center gap-2">
                                                <User className="w-4 h-4 text-green-600 flex-shrink-0" />
                                                <span className="truncate">{t.fullName}</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                onBlur={() => setTouched(prev => ({ ...prev, name: true }))}
                                                onKeyPress={handleKeyPress}
                                                className={`input-field w-full rounded-2xl px-4 py-3 outline-none text-green-900 placeholder-green-400/50 text-base ${
                                                    touched.name && !name.trim() ? 'error' : ''
                                                }`}
                                                placeholder={t.enterFullName}
                                                disabled={loading}
                                            />
                                        </div>

                                        {/* Email */}
                                        <div className="col-span-1 animate-fadeIn delay-600">
                                            <label className="text-sm font-semibold text-green-900 mb-2 flex items-center gap-2">
                                                <Mail className="w-4 h-4 text-green-600 flex-shrink-0" />
                                                <span className="truncate">{t.email}</span>
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => {
                                                        setEmail(e.target.value);
                                                        setEmailValid(null);
                                                    }}
                                                    onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
                                                    onKeyPress={handleKeyPress}
                                                    className={`input-field w-full rounded-2xl px-4 py-3 pr-10 outline-none text-green-900 placeholder-green-400/50 text-base ${
                                                        touched.email && email && !validateEmail(email) ? 'error' : ''
                                                    }`}
                                                    placeholder={t.enterEmail}
                                                    disabled={loading}
                                                />
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                    {emailChecking && (
                                                        <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                                                    )}
                                                    {!emailChecking && emailValid === true && (
                                                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                    {!emailChecking && emailValid === false && (
                                                        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-xs text-green-600/70 mt-1">{t.emailRestriction}</p>
                                        </div>
                                    </div>

                                    {/* Password */}
                                    <div className="mt-4 animate-fadeIn delay-700">
                                        <label className="text-sm font-semibold text-green-900 mb-2 flex items-center gap-2">
                                            <FiShield className="w-4 h-4 text-green-600 flex-shrink-0" />
                                            <span className="truncate">{t.password}</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={password}
                                                onChange={(e) => handlePasswordChange(e.target.value)}
                                                onBlur={() => setTouched(prev => ({ ...prev, password: true }))}
                                                onKeyPress={handleKeyPress}
                                                className={`input-field w-full rounded-2xl px-4 py-3 pr-12 outline-none text-green-900 placeholder-green-400/50 text-base ${
                                                    touched.password && !isPasswordValid() ? 'error' : ''
                                                }`}
                                                placeholder={t.enterPassword}
                                                disabled={loading}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="icon-button absolute right-2 top-1/2 -translate-y-1/2 text-green-600/60 hover:text-green-700 p-2 rounded-lg"
                                            >
                                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>

                                        {/* Password strength meter */}
                                        <div className="strength-meter">
                                            {[1, 2, 3, 4, 5].map((index) => (
                                                <div
                                                    key={index}
                                                    className={`strength-segment ${
                                                        passwordStrength.hasMinLength ? 'active' : ''
                                                    } ${
                                                        isPasswordValid() ? 'strong' : ''
                                                    }`}
                                                />
                                            ))}
                                        </div>

                                        {/* Password requirements */}
                                        <div className="mt-3 space-y-2">
                                            <p className="text-xs font-semibold text-green-700">{t.passwordRequirements}</p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                <div className="flex items-center">
                                                    <div className={`w-2 h-2 rounded-full mr-2 ${passwordStrength.hasUppercase ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                                    <span className={`text-xs ${passwordStrength.hasUppercase ? 'text-green-700 font-semibold' : 'text-gray-500'}`}>
                                                        {t.uppercase}
                                                    </span>
                                                </div>
                                                <div className="flex items-center">
                                                    <div className={`w-2 h-2 rounded-full mr-2 ${passwordStrength.hasLowercase ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                                    <span className={`text-xs ${passwordStrength.hasLowercase ? 'text-green-700 font-semibold' : 'text-gray-500'}`}>
                                                        {t.lowercase}
                                                    </span>
                                                </div>
                                                <div className="flex items-center">
                                                    <div className={`w-2 h-2 rounded-full mr-2 ${passwordStrength.hasNumber ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                                    <span className={`text-xs ${passwordStrength.hasNumber ? 'text-green-700 font-semibold' : 'text-gray-500'}`}>
                                                        {t.number}
                                                    </span>
                                                </div>
                                                <div className="flex items-center">
                                                    <div className={`w-2 h-2 rounded-full mr-2 ${passwordStrength.hasSpecialChar ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                                    <span className={`text-xs ${passwordStrength.hasSpecialChar ? 'text-green-700 font-semibold' : 'text-gray-500'}`}>
                                                        {t.specialChar}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center mt-1">
                                                <div className={`w-2 h-2 rounded-full mr-2 ${passwordStrength.hasMinLength ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                                <span className={`text-xs ${passwordStrength.hasMinLength ? 'text-green-700 font-semibold' : 'text-gray-500'}`}>
                                                    {t.minLength}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 mt-4">
                                        {/* Mobile with +91 prefix */}
                                        <div className="col-span-1 animate-fadeIn delay-800">
                                            <label className="text-sm font-semibold text-green-900 mb-2 flex items-center gap-2">
                                                <Phone className="w-4 h-4 text-green-600 flex-shrink-0" />
                                                <span className="truncate">{t.mobile}</span>
                                            </label>
                                            <div className="relative">
                                                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                                                    <span className="text-green-600 font-medium text-sm sm:text-base bg-green-50 px-2 py-1.5 rounded-l-xl border-r border-green-200">
                                                        +91
                                                    </span>
                                                </div>
                                                <input
                                                    type="tel"
                                                    value={mobile}
                                                    onChange={(e) => handleMobileChange(e.target.value)}
                                                    onBlur={() => setTouched(prev => ({ ...prev, mobile: true }))}
                                                    onKeyPress={handleKeyPress}
                                                    className={`input-field w-full rounded-2xl pl-16 pr-4 py-3 outline-none text-green-900 placeholder-green-400/50 text-base ${
                                                        touched.mobile && mobile && !validateIndianMobile(mobile) ? 'error' : ''
                                                    }`}
                                                    placeholder={t.enterMobile}
                                                    inputMode="numeric"
                                                    disabled={loading}
                                                />
                                            </div>
                                            {mobile && !validateIndianMobile(mobile) && touched.mobile && (
                                                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                                    <FiAlertCircle className="w-3 h-3 flex-shrink-0" />
                                                    <span>{t.mobileInvalid}</span>
                                                </p>
                                            )}
                                            {validateIndianMobile(mobile) && (
                                                <p className="text-xs text-green-600 mt-1 font-semibold">
                                                    ✓ {formatIndianMobile(mobile)}
                                                </p>
                                            )}
                                            <p className="text-xs text-green-900/60 mt-1">{t.mobileHint}</p>
                                        </div>

                                        {/* Aadhaar */}
                                        <div className="col-span-1 animate-fadeIn delay-900">
                                            <label className="text-sm font-semibold text-green-900 mb-2 flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-green-600 flex-shrink-0" />
                                                <span className="truncate">{t.aadhaar}</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={aadhaar}
                                                onChange={(e) => handleAadhaarChange(e.target.value)}
                                                onBlur={() => setTouched(prev => ({ ...prev, aadhaar: true }))}
                                                onKeyPress={handleKeyPress}
                                                className={`input-field w-full rounded-2xl px-4 py-3 outline-none text-green-900 placeholder-green-400/50 text-base ${
                                                    touched.aadhaar && !validateAadhaar(aadhaar) ? 'error' : ''
                                                }`}
                                                placeholder={t.enterAadhaar}
                                                inputMode="numeric"
                                                maxLength={12}
                                                disabled={loading}
                                            />
                                            <p className="text-xs text-green-900/60 mt-1">{t.aadhaarNote}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Location Information Section */}
                                <div className="animate-fadeIn delay-1000">
                                    <h3 className="text-lg font-bold text-green-900 mb-4 flex items-center gap-2">
                                        <MapPin className="w-5 h-5 animate-float" />
                                        Location Information
                                    </h3>

                                    <div className="space-y-4">
                                        {/* District */}
                                        <div className="animate-fadeIn delay-1100">
                                            <label className="text-sm font-semibold text-green-900 mb-2">
                                                {t.district}
                                            </label>
                                            <div className="relative">
                                                <select
                                                    value={districtId}
                                                    onChange={(e) => setDistrictId(e.target.value)}
                                                    className="input-field w-full rounded-2xl px-4 py-3 pr-10 outline-none text-green-900 bg-white cursor-pointer appearance-none"
                                                    disabled={loadingLoc || loading}
                                                >
                                                    <option value="">{t.selectDistrict}</option>
                                                    {districts.map((d) => (
                                                        <option key={d.id} value={d.id}>
                                                            {d.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-green-600">
                                                    <svg className="fill-current h-5 w-5" viewBox="0 0 20 20">
                                                        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Taluk */}
                                        <div className="animate-fadeIn delay-1200">
                                            <label className="text-sm font-semibold text-green-900 mb-2">
                                                {t.taluk}
                                            </label>
                                            <div className="relative">
                                                <select
                                                    value={talukId}
                                                    onChange={(e) => setTalukId(e.target.value)}
                                                    className="input-field w-full rounded-2xl px-4 py-3 pr-10 outline-none text-green-900 bg-white cursor-pointer appearance-none"
                                                    disabled={!districtId || loadingLoc || loading}
                                                >
                                                    <option value="">{t.selectTaluk}</option>
                                                    {taluks.map((t) => (
                                                        <option key={t.id} value={t.id}>
                                                            {t.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-green-600">
                                                    <svg className="fill-current h-5 w-5" viewBox="0 0 20 20">
                                                        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Village */}
                                        <div className="animate-fadeIn delay-1300">
                                            <label className="text-sm font-semibold text-green-900 mb-2">
                                                {t.village}
                                            </label>
                                            <div className="relative">
                                                <select
                                                    value={villageId}
                                                    onChange={(e) => setVillageId(e.target.value)}
                                                    className="input-field w-full rounded-2xl px-4 py-3 pr-10 outline-none text-green-900 bg-white cursor-pointer appearance-none"
                                                    disabled={!talukId || loadingLoc || loading}
                                                >
                                                    <option value="">{t.selectVillage}</option>
                                                    {villages.map((v) => (
                                                        <option key={v.id} value={v.id}>
                                                            {v.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-green-600">
                                                    <svg className="fill-current h-5 w-5" viewBox="0 0 20 20">
                                                        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Panchayat */}
                                        <div className="animate-fadeIn delay-1400">
                                            <label className="text-sm font-semibold text-green-900 mb-2">
                                                {t.panchayat}
                                            </label>
                                            <div className="relative">
                                                <select
                                                    value={panchayatId}
                                                    onChange={(e) => setPanchayatId(e.target.value)}
                                                    className="input-field w-full rounded-2xl px-4 py-3 pr-10 outline-none text-green-900 bg-white cursor-pointer appearance-none"
                                                    disabled={!villageId || loadingLoc || loading || panchayats.length === 0}
                                                >
                                                    <option value="">{t.selectPanchayat}</option>
                                                    {panchayats.map((p) => (
                                                        <option key={p.id} value={p.id}>
                                                            {p.name} {p.code ? `(${p.code})` : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-green-600">
                                                    <svg className="fill-current h-5 w-5" viewBox="0 0 20 20">
                                                        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                                                    </svg>
                                                </div>
                                            </div>
                                            {panchayats.length === 0 && villageId && !loadingLoc && (
                                                <p className="text-xs text-red-600 mt-2 font-semibold">
                                                    {t.noPanchayat}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading || !isPasswordValid() || !validateIndianMobile(mobile) || 
                                             !validateAadhaar(aadhaar) || !validateEmail(email) || !emailValid ||
                                             !districtId || !talukId || !villageId || !panchayatId || !name.trim()}
                                    className="button-base w-full mt-8 py-4 px-6 rounded-2xl font-semibold text-white text-base sm:text-lg
                                              bg-gradient-to-r from-green-600 to-emerald-500
                                              hover:from-green-700 hover:to-emerald-600
                                              shadow-md hover:shadow-lg
                                              focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2
                                              disabled:opacity-60 disabled:cursor-not-allowed
                                              flex items-center justify-center gap-2
                                              animate-fadeIn"
                                    style={{ animationDelay: '1.5s' }}
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>{t.creating}</span>
                                        </>
                                    ) : (
                                        <>
                                            <FiShield className="w-5 h-5 animate-pulse-slow" />
                                            <span>{t.register}</span>
                                        </>
                                    )}
                                </button>

                                {/* Mobile login option */}
                                <div className="mt-6 sm:hidden">
                                    <div className="divider animate-fadeIn" style={{ animationDelay: '1.6s' }}>
                                        <span>OR</span>
                                    </div>
                                    <button
                                        onClick={() => router.push(`/${locale}/villager/login`)}
                                        className="w-full py-3 px-4 rounded-2xl border-2 border-green-200 bg-white/50
                                                 text-green-700 font-semibold text-sm
                                                 flex items-center justify-center gap-2
                                                 hover:bg-green-50 hover:border-green-300
                                                 transition-all duration-300
                                                 animate-fadeIn"
                                        style={{ animationDelay: '1.7s' }}
                                    >
                                        <LogIn className="w-4 h-4" />
                                        <span>{t.loginHere}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Screen>
    );
}
