"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Screen from "../../../components/Screen";
import { createUserWithEmailAndPassword, signOut, fetchSignInMethodsForEmail } from "firebase/auth";
import { auth, db } from "../../../lib/firebase";
import {
    collection,
    getDocs,
    orderBy,
    query,
    where,
    addDoc,
    setDoc,
    doc,
    serverTimestamp,
    getDoc
} from "firebase/firestore";
import { Eye, EyeOff, MapPin, Building2, User, Shield, Mail, Phone, FileText, Home, LogIn } from "lucide-react";
import { FiAlertCircle } from "react-icons/fi";

type Role = "pdo" | "village_incharge" | "tdo" | "ddo";
type Locale = "en" | "kn" | "hi";

type District = {
    id?: string;
    name: string;
    code?: string;
    state?: string;
    isActive?: boolean;
    createdBy?: string;
    createdAt?: any;
};

type Taluk = {
    id?: string;
    name: string;
    districtId: string;
    districtName: string;
    isActive?: boolean;
    createdBy?: string;
    createdAt?: any;
};

type Village = {
    id?: string;
    name: string;
    districtId: string;
    districtName: string;
    talukId: string;
    talukName: string;
    isActive?: boolean;
    createdBy?: string;
    createdAt?: any;
};

type Panchayat = {
    id?: string;
    name: string;
    villageId: string;
    villageName: string;
    talukId: string;
    talukName: string;
    districtId: string;
    districtName: string;
    gramPanchayatId?: string;
    isActive?: boolean;
    createdBy?: string;
    createdAt?: any;
};

export default function AuthorityRegisterPage() {
    const router = useRouter();
    const params = useParams() as { locale?: string };
    const locale = (params?.locale || "en") as Locale;

    const t = useMemo(() => {
        const L: any = {
            en: {
                title: "Authority Registration",
                subtitle: "Register as a government authority (Admin verification required)",
                role: "Select Role *",
                fullName: "Full Name *",
                email: "Email *",
                password: "Password *",
                mobile: "Mobile Number *",
                aadhaar: "Aadhaar Number *",
                officeAddress: "Office Address *",
                district: "District *",
                taluk: "Taluk/Block *",
                village: "Village *",
                panchayat: "Panchayat *",
                gramPanchayatId: "Gram Panchayat ID *",
                register: "Register as Authority",
                creating: "Creating Account...",
                cantFind: "Can't find your {item}? Enter manually",
                newEntry: "You're entering a new {item}. This will be saved in the database.",
                aadhaarNote: "Stored as full 12 digits (only last 4 visible to admin)",
                gramNote: "Enter the official Gram Panchayat ID",
                passwordRequirements: "Password Requirements",
                uppercase: "At least one uppercase letter (A-Z)",
                lowercase: "At least one lowercase letter (a-z)",
                number: "At least one number (0-9)",
                specialChar: "At least one special character (!@#$%^&* etc.)",
                minLength: "At least 8 characters long",
                govService: "Government Service Registration",
                joinAuthority: "Join as a verified authority",
                noPanchayat: "No panchayats found for this village. Contact your village authority or choose a different village.",
                emailAlreadyRegistered: "This email is already registered. Please use a different email or try logging in.",
                emailAlreadyInUse: "Email already registered. Please use a different email address.",
                weakPassword: "Password is too weak. Please use a stronger password.",
                invalidEmail: "Please enter a valid email address.",
                authError: "Authentication error. Please try again.",
                firestoreError: "Database error. Please try again.",
                emailCheck: "Checking email availability...",
                emailAvailable: "Email is available",
                alreadyRegistered: "Already registered? Please login here",
                registrationSuccess: "Registration Successful!",
                redirecting: "Redirecting to verification status...",
                emailTaken: "Email Already Registered",
                checking: "Checking Email...",
            },
            kn: {
                title: "ಅಧಿಕಾರಿ ನೋಂದಣಿ",
                subtitle: "ಸರ್ಕಾರಿ ಅಧಿಕಾರಿಯಾಗಿ ನೋಂದಾಯಿಸಿ (ನಿರ್ವಾಹಕ ಪರಿಶೀಲನೆ ಅಗತ್ಯ)",
                role: "ಪಾತ್ರ ಆಯ್ಕೆಮಾಡಿ *",
                fullName: "ಪೂರ್ಣ ಹೆಸರು *",
                email: "ಇಮೇಲ್ *",
                password: "ಪಾಸ್‌ವರ್ಡ್ *",
                mobile: "ಮೊಬೈಲ್ ಸಂಖ್ಯೆ *",
                aadhaar: "ಆಧಾರ್ ಸಂಖ್ಯೆ *",
                officeAddress: "ಕಚೇರಿ ವಿಳಾಸ *",
                district: "ಜಿಲ್ಲೆ *",
                taluk: "ತಾಲ್ಲೂಕು/ಬ್ಲಾಕ್ *",
                village: "ಗ್ರಾಮ *",
                panchayat: "ಪಂಚಾಯಿತಿ *",
                gramPanchayatId: "ಗ್ರಾಮ ಪಂಚಾಯಿತಿ ಐಡಿ *",
                register: "ಅಧಿಕಾರಿಯಾಗಿ ನೋಂದಾಯಿಸಿ",
                creating: "ಖಾತೆಯನ್ನು ರಚಿಸಲಾಗುತ್ತಿದೆ...",
                cantFind: "ನಿಮ್ಮ {item} ಕಂಡುಬಂದಿಲ್ಲವೇ? ಕೈಮಾರ್ಗದಿಂದ ನಮೂದಿಸಿ",
                newEntry: "ನೀವು ಹೊಸ {item} ನಮೂದಿಸುತ್ತಿದ್ದೀರಿ. ಇದನ್ನು ಡೇಟಾಬೇಸ್‌ನಲ್ಲಿ ಸಂಗ್ರಹಿಸಲಾಗುತ್ತದೆ.",
                aadhaarNote: "ಪೂರ್ಣ 12 ಅಂಕಿಗಳಾಗಿ ಸಂಗ್ರಹಿಸಲಾಗುತ್ತದೆ (ನಿರ್ವಾಹಕರಿಗೆ ಕೊನೆಯ 4 ಮಾತ್ರ ಗೋಚರಿಸುತ್ತದೆ)",
                gramNote: "ಅಧಿಕೃತ ಗ್ರಾಮ ಪಂಚಾಯಿತಿ ಐಡಿಯನ್ನು ನಮೂದಿಸಿ",
                passwordRequirements: "ಪಾಸ್‌ವರ್ಡ್ ಅವಶ್ಯಕತೆಗಳು",
                uppercase: "ಕನಿಷ್ಠ ಒಂದು ದೊಡ್ಡ ಅಕ್ಷರ (A-Z)",
                lowercase: "ಕನಿಷ್ಠ ಒಂದು ಸಣ್ಣ ಅಕ್ಷರ (a-z)",
                number: "ಕನಿಷ್ಠ ಒಂದು ಸಂಖ್ಯೆ (0-9)",
                specialChar: "ಕನಿಷ್ಠ ಒಂದು ವಿಶೇಷ ಅಕ್ಷರ (!@#$%^&* ಇತ್ಯಾದಿ)",
                minLength: "ಕನಿಷ್ಠ 8 ಅಕ್ಷರಗಳು",
                govService: "ಸರ್ಕಾರಿ ಸೇವೆ ನೋಂದಣಿ",
                joinAuthority: "ಪರಿಶೀಲಿತ ಅಧಿಕಾರಿಯಾಗಿ ಸೇರಿಕೊಳ್ಳಿ",
                noPanchayat: "ಈ ಗ್ರಾಮಕ್ಕೆ ಪಂಚಾಯಿತಿಗಳು ಕಂಡುಬಂದಿಲ್ಲ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ಗ್ರಾಮ ಅಧಿಕಾರಿಯನ್ನು ಸಂಪರ್ಕಿಸಿ ಅಥವಾ ಬೇರೆ ಗ್ರಾಮವನ್ನು ಆರಿಸಿ.",
                emailAlreadyRegistered: "ಈ ಇಮೇಲ್ ಈಗಾಗಲೇ ನೋಂದಾಯಿಸಲಾಗಿದೆ. ದಯವಿಟ್ಟು ಬೇರೆ ಇಮೇಲ್ ಬಳಸಿ ಅಥವಾ ಲಾಗಿನ್ ಮಾಡಿ.",
                emailAlreadyInUse: "ಇಮೇಲ್ ಈಗಾಗಲೇ ನೋಂದಾಯಿಸಲಾಗಿದೆ. ದಯವಿಟ್ಟು ಬೇರೆ ಇಮೇಲ್ ವಿಳಾಸವನ್ನು ಬಳಸಿ.",
                weakPassword: "ಪಾಸ್‌ವರ್ಡ್ ತುಂಬಾ ದುರ್ಬಲವಾಗಿದೆ. ದಯವಿಟ್ಟು ಬಲವಾದ ಪಾಸ್‌ವರ್ಡ್ ಬಳಸಿ.",
                invalidEmail: "ದಯವಿಟ್ಟು ಮಾನ್ಯ ಇಮೇಲ್ ವಿಳಾಸವನ್ನು ನಮೂದಿಸಿ.",
                authError: "ದೃಢೀಕರಣ ದೋಷ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
                firestoreError: "ಡೇಟಾಬೇಸ್ ದೋಷ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
                emailCheck: "ಇಮೇಲ್ ಲಭ್ಯತೆಯನ್ನು ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ...",
                emailAvailable: "ಇಮೇಲ್ ಲಭ್ಯವಿದೆ",
                alreadyRegistered: "ಈಗಾಗಲೇ ನೋಂದಾಯಿಸಲಾಗಿದೆಯೇ? ದಯವಿಟ್ಟು ಇಲ್ಲಿ ಲಾಗಿನ್ ಮಾಡಿ",
                registrationSuccess: "ನೋಂದಣಿ ಯಶಸ್ವಿಯಾಗಿದೆ!",
                redirecting: "ಪರಿಶೀಲನೆ ಸ್ಥಿತಿಗೆ ಮರುನಿರ್ದೇಶಿಸಲಾಗುತ್ತಿದೆ...",
                emailTaken: "ಇಮೇಲ್ ಈಗಾಗಲೇ ನೋಂದಾಯಿಸಲಾಗಿದೆ",
                checking: "ಇಮೇಲ್ ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ...",
            },
            hi: {
                title: "प्राधिकारी पंजीकरण",
                subtitle: "सरकारी प्राधिकारी के रूप में पंजीकरण करें (प्रशासक सत्यापन आवश्यक)",
                role: "भूमिका चुनें *",
                fullName: "पूरा नाम *",
                email: "ईमेल *",
                password: "पासवर्ड *",
                mobile: "मोबाइल नंबर *",
                aadhaar: "आधार नंबर *",
                officeAddress: "कार्यालय का पता *",
                district: "जिला *",
                taluk: "तालुका/ब्लॉक *",
                village: "गांव *",
                panchayat: "पंचायत *",
                gramPanchayatId: "ग्राम पंचायत आईडी *",
                register: "प्राधिकारी के रूप में पंजीकरण करें",
                creating: "खाता बनाया जा रहा है...",
                cantFind: "आपका {item} नहीं मिल रहा है? मैन्युअल रूप से दर्ज करें",
                newEntry: "आप एक नया {item} दर्ज कर रहे हैं। इसे डेटाबेस में सहेजा जाएगा।",
                aadhaarNote: "पूर्ण 12 अंकों के रूप में संग्रहीत (प्रशासक को केवल अंतिम 4 दिखाई देते हैं)",
                gramNote: "आधिकारिक ग्राम पंचायत आईडी दर्ज करें",
                passwordRequirements: "पासवर्ड आवश्यकताएं",
                uppercase: "कम से कम एक बड़ा अक्षर (A-Z)",
                lowercase: "कम से कम एक छोटा अक्षर (a-z)",
                number: "कम से कम एक संख्या (0-9)",
                specialChar: "कम से कम एक विशेष वर्ण (!@#$%^&* आदि)",
                minLength: "कम से कम 8 अक्षर लंबा",
                govService: "सरकारी सेवा पंजीकरण",
                joinAuthority: "सत्यापित प्राधिकारी के रूप में शामिल हों",
                noPanchayat: "इस गांव के लिए कोई पंचायत नहीं मिली। कृपया अपने गांव के अधिकारी से संपर्क करें या कोई अन्य गांव चुनें।",
                emailAlreadyRegistered: "यह ईमेल पहले से ही पंजीकृत है। कृपया कोई अन्य ईमेल प्रयोग करें या लॉगिन करने का प्रयास करें।",
                emailAlreadyInUse: "ईमेल पहले से ही पंजीकृत है। कृपया कोई अन्य ईमेल पता प्रयोग करें।",
                weakPassword: "पासवर्ड बहुत कमजोर है। कृपया मजबूत पासवर्ड का उपयोग करें।",
                invalidEmail: "कृपया मान्य ईमेल पता दर्ज करें।",
                authError: "प्रमाणीकरण त्रुटि। कृपया पुनः प्रयास करें।",
                firestoreError: "डेटाबेस त्रुटि। कृपया पुनः प्रयास करें।",
                emailCheck: "ईमेल उपलब्धता की जाँच की जा रही है...",
                emailAvailable: "ईमेल उपलब्ध है",
                alreadyRegistered: "पहले से पंजीकृत हैं? कृपया यहां लॉगिन करें",
                registrationSuccess: "पंजीकरण सफल!",
                redirecting: "सत्यापन स्थिति पर पुनर्निर्देशित किया जा रहा है...",
                emailTaken: "ईमेल पहले से पंजीकृत है",
                checking: "ईमेल की जाँच की जा रही है...",
            },
        };
        return L[locale] || L.en;
    }, [locale]);

    const ROLES: { id: Role; label: string }[] = useMemo(
        () => [
            { id: "pdo", label: "Panchayat Development Officer (PDO)" },
            { id: "village_incharge", label: "Village Incharge" },
            { id: "tdo", label: "Taluk Development Officer" },
            { id: "ddo", label: "District Development Officer" },
        ],
        []
    );

    const [role, setRole] = useState<Role>("pdo");

    // Auth
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState<{
        hasUppercase: boolean;
        hasLowercase: boolean;
        hasNumber: boolean;
        hasSpecialChar: boolean;
        hasMinLength: boolean;
    }>({
        hasUppercase: false,
        hasLowercase: false,
        hasNumber: false,
        hasSpecialChar: false,
        hasMinLength: false
    });

    // Common
    const [name, setName] = useState("");
    const [mobile, setMobile] = useState("");
    const [aadhaar, setAadhaar] = useState("");
    const [officeAddress, setOfficeAddress] = useState("");
    const [gramPanchayatId, setGramPanchayatId] = useState("");

    // Location data
    const [districts, setDistricts] = useState<District[]>([]);
    const [taluks, setTaluks] = useState<Taluk[]>([]);
    const [villages, setVillages] = useState<Village[]>([]);
    const [panchayats, setPanchayats] = useState<Panchayat[]>([]);

    // Manual entry states
    const [newDistrict, setNewDistrict] = useState("");
    const [newTaluk, setNewTaluk] = useState("");
    const [newVillage, setNewVillage] = useState("");
    const [newPanchayat, setNewPanchayat] = useState("");

    // Selected dropdown values
    const [selectedDistrict, setSelectedDistrict] = useState<string>("");
    const [selectedTaluk, setSelectedTaluk] = useState<string>("");
    const [selectedVillage, setSelectedVillage] = useState<string>("");
    const [selectedPanchayat, setSelectedPanchayat] = useState<string>("");

    // Modes
    const [useManualDistrict, setUseManualDistrict] = useState(false);
    const [useManualTaluk, setUseManualTaluk] = useState(false);
    const [useManualVillage, setUseManualVillage] = useState(false);
    const [useManualPanchayat, setUseManualPanchayat] = useState(false);

    // UI states
    const [loading, setLoading] = useState(false);
    const [loadingLoc, setLoadingLoc] = useState(false);
    const [err, setErr] = useState("");
    const [success, setSuccess] = useState(false);
    const [checkingEmail, setCheckingEmail] = useState(false);
    const [emailStatus, setEmailStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");

    // Validation states
    const [touched, setTouched] = useState({
        name: false,
        email: false,
        password: false,
        mobile: false,
        aadhaar: false,
        officeAddress: false
    });

    const needsTaluk = role === "pdo" || role === "village_incharge" || role === "tdo";
    const needsVillage = role === "pdo" || role === "village_incharge";
    const needsPanchayat = role === "pdo" || role === "village_incharge";

    // Function to send registration email (Firebase Cloud Function call)
    const sendRegistrationEmail = async (userId: string, userEmail: string, userName: string, userRole: string) => {
        // ✅ TEMPORARILY DISABLED DUE TO CORS ISSUES
        console.log(`[DEV] Email would be sent to ${userEmail} for ${userName} as ${userRole}`);
        return; // Exit early - COMMENT THIS OUT WHEN CORS IS FIXED
        
        try {
            const cloudFunctionURL = process.env.NEXT_PUBLIC_CLOUD_FUNCTION_URL ||
                "https://us-central1-your-project-id.cloudfunctions.net/sendRegistrationEmail";

            const response = await fetch(cloudFunctionURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: userId,
                    email: userEmail,
                    name: userName,
                    role: userRole,
                    action: "registration_complete"
                }),
            });

            if (!response.ok) {
                console.warn('Registration email failed to send, but registration was successful');
                console.warn(`Email status: ${response.status} - ${response.statusText}`);
            } else {
                console.log('Registration email sent successfully');
            }
        } catch (error) {
            console.error('Error sending registration email:', error);
        }
    };

    // Validate password strength
    const validatePasswordStrength = (pwd: string) => {
        const hasUppercase = /[A-Z]/.test(pwd);
        const hasLowercase = /[a-z]/.test(pwd);
        const hasNumber = /\d/.test(pwd);
        const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd);
        const hasMinLength = pwd.length >= 8;

        setPasswordStrength({
            hasUppercase,
            hasLowercase,
            hasNumber,
            hasSpecialChar,
            hasMinLength
        });
    };

    // Handle password change
    const handlePasswordChange = (value: string) => {
        setPassword(value);
        validatePasswordStrength(value);
        if (touched.password) {
            setTouched(prev => ({ ...prev, password: true }));
        }
    };

    // Check if password is valid
    const isPasswordValid = () => {
        return (
            passwordStrength.hasUppercase &&
            passwordStrength.hasLowercase &&
            passwordStrength.hasNumber &&
            passwordStrength.hasSpecialChar &&
            passwordStrength.hasMinLength
        );
    };

    // Check email availability with debounce
    useEffect(() => {
        const checkEmailAvailability = async () => {
            if (!email.trim() || !email.includes('@') || email.length < 5) {
                setEmailStatus("idle");
                return;
            }

            setEmailStatus("checking");
            try {
                const methods = await fetchSignInMethodsForEmail(auth, email.trim());
                if (methods && methods.length > 0) {
                    setEmailStatus("taken");
                } else {
                    setEmailStatus("available");
                }
            } catch (error) {
                console.error("Error checking email:", error);
                setEmailStatus("idle");
            }
        };

        const timer = setTimeout(() => {
            checkEmailAvailability();
        }, 500);

        return () => clearTimeout(timer);
    }, [email]);

    // Load districts on mount
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
                    ...(d.data() as District)
                }));
                setDistricts(districtsData);

                if (districtsData.length === 0) {
                    setUseManualDistrict(true);
                }
            } catch (e: any) {
                console.error("Error loading districts:", e);
            } finally {
                setLoadingLoc(false);
            }
        };
        loadDistricts();
    }, []);

    // Load taluks when district is selected
    useEffect(() => {
        const loadTaluks = async () => {
            if (!selectedDistrict || useManualDistrict) return;

            setLoadingLoc(true);
            try {
                const q = query(
                    collection(db, "taluks"),
                    where("districtId", "==", selectedDistrict),
                    orderBy("name", "asc")
                );
                const snap = await getDocs(q);
                const taluksData = snap.docs.map((d) => ({
                    id: d.id,
                    ...(d.data() as Taluk)
                }));
                setTaluks(taluksData);

                if (taluksData.length === 0) {
                    setUseManualTaluk(true);
                } else {
                    setUseManualTaluk(false);
                }
            } catch (e: any) {
                console.error("Error loading taluks:", e);
            } finally {
                setLoadingLoc(false);
            }
        };
        loadTaluks();
    }, [selectedDistrict, useManualDistrict]);

    // Load villages when taluk is selected
    useEffect(() => {
        const loadVillages = async () => {
            if (!selectedTaluk || useManualTaluk) return;

            setLoadingLoc(true);
            try {
                const q = query(
                    collection(db, "villages"),
                    where("talukId", "==", selectedTaluk),
                    orderBy("name", "asc")
                );
                const snap = await getDocs(q);
                const villagesData = snap.docs.map((d) => ({
                    id: d.id,
                    ...(d.data() as Village)
                }));
                setVillages(villagesData);

                if (villagesData.length === 0) {
                    setUseManualVillage(true);
                } else {
                    setUseManualVillage(false);
                }
            } catch (e: any) {
                console.error("Error loading villages:", e);
            } finally {
                setLoadingLoc(false);
            }
        };

        if (needsVillage) {
            loadVillages();
        }
    }, [selectedTaluk, useManualTaluk, needsVillage]);

    // Load panchayats when village is selected
    useEffect(() => {
        const loadPanchayats = async () => {
            if (!selectedVillage || useManualVillage) return;

            setLoadingLoc(true);
            try {
                const q = query(
                    collection(db, "panchayats"),
                    where("villageId", "==", selectedVillage),
                    orderBy("name", "asc")
                );
                const snap = await getDocs(q);
                const panchayatsData = snap.docs.map((d) => ({
                    id: d.id,
                    ...(d.data() as Panchayat)
                }));
                setPanchayats(panchayatsData);

                if (panchayatsData.length === 0) {
                    setUseManualPanchayat(true);
                } else {
                    setUseManualPanchayat(false);
                }
            } catch (e: any) {
                console.error("Error loading panchayats:", e);
                // If panchayats collection doesn't exist or is empty, allow manual entry
                setUseManualPanchayat(true);
            } finally {
                setLoadingLoc(false);
            }
        };

        if (needsPanchayat && selectedVillage) {
            loadPanchayats();
        }
    }, [selectedVillage, useManualVillage, needsPanchayat]);

    // Handle role change
    const handleRoleChange = (newRole: Role) => {
        setRole(newRole);
        // Reset location selections
        setSelectedDistrict("");
        setSelectedTaluk("");
        setSelectedVillage("");
        setSelectedPanchayat("");
        setNewDistrict("");
        setNewTaluk("");
        setNewVillage("");
        setNewPanchayat("");
        setGramPanchayatId("");
        setUseManualPanchayat(false);
    };

    // Validate Aadhaar
    const validateAadhaar = (aadhaar: string): boolean => {
        const cleanAadhaar = aadhaar.replace(/\D/g, '');
        return cleanAadhaar.length === 12 && /^\d+$/.test(cleanAadhaar);
    };

    // Check if email is already in use - with multiple checks
    const checkEmailExists = async (email: string): Promise<{ exists: boolean; method?: string }> => {
        try {
            // First check if email exists in Firebase Auth
            const methods = await fetchSignInMethodsForEmail(auth, email);
            if (methods.length > 0) {
                return { exists: true, method: methods[0] };
            }

            // Also check in Firestore users collection
            const usersQuery = query(
                collection(db, "users"),
                where("email", "==", email.trim())
            );
            const userSnapshot = await getDocs(usersQuery);
            
            // Check in authorities collection
            const authQuery = query(
                collection(db, "authorities"),
                where("email", "==", email.trim())
            );
            const authSnapshot = await getDocs(authQuery);
            
            // Check in villagers collection
            const villagerQuery = query(
                collection(db, "villagers"),
                where("email", "==", email.trim())
            );
            const villagerSnapshot = await getDocs(villagerQuery);

            if (!userSnapshot.empty || !authSnapshot.empty || !villagerSnapshot.empty) {
                return { exists: true, method: "firestore" };
            }

            return { exists: false };
        } catch (error) {
            console.error("Error checking email existence:", error);
            // If we can't check, assume it might exist to be safe
            return { exists: true, method: "error" };
        }
    };

    const handleSubmit = async () => {
        setErr("");
        setSuccess(false);

        // Validation
        if (!name.trim()) {
            setErr("Name is required");
            setTouched(prev => ({ ...prev, name: true }));
            return;
        }
        if (!email.trim() || !email.includes("@")) {
            setErr(t.invalidEmail);
            setTouched(prev => ({ ...prev, email: true }));
            return;
        }
        if (emailStatus === "taken") {
            setErr(t.emailAlreadyRegistered);
            return;
        }
        if (!isPasswordValid()) {
            setErr("Enter a valid password");
            setTouched(prev => ({ ...prev, password: true }));
            return;
        }
        if (!mobile.match(/^[0-9]{10}$/)) {
            setErr("Valid 10-digit mobile number is required");
            setTouched(prev => ({ ...prev, mobile: true }));
            return;
        }
        if (!validateAadhaar(aadhaar)) {
            setErr("Aadhaar must be exactly 12 digits");
            setTouched(prev => ({ ...prev, aadhaar: true }));
            return;
        }
        if (!officeAddress.trim()) {
            setErr("Office address is required");
            setTouched(prev => ({ ...prev, officeAddress: true }));
            return;
        }

        // District validation
        let districtName = "";
        if (useManualDistrict) {
            if (!newDistrict.trim()) {
                setErr("District name is required");
                return;
            }
            districtName = newDistrict.trim();
        } else {
            if (!selectedDistrict) {
                setErr("Please select a district");
                return;
            }
            const district = districts.find(d => d.id === selectedDistrict);
            districtName = district?.name || "";
        }

        // Taluk validation (if needed)
        let talukName = "";
        let talukId = selectedTaluk;
        if (needsTaluk) {
            if (useManualTaluk) {
                if (!newTaluk.trim()) {
                    setErr("Taluk name is required");
                    return;
                }
                talukName = newTaluk.trim();
            } else {
                if (!selectedTaluk) {
                    setErr("Please select a taluk");
                    return;
                }
                const taluk = taluks.find(t => t.id === selectedTaluk);
                talukName = taluk?.name || "";
                talukId = selectedTaluk;
            }
        }

        // Village validation (if needed)
        let villageName = "";
        let villageId = selectedVillage;
        if (needsVillage) {
            if (useManualVillage) {
                if (!newVillage.trim()) {
                    setErr("Village name is required");
                    return;
                }
                villageName = newVillage.trim();
            } else {
                if (!selectedVillage) {
                    setErr("Please select a village");
                    return;
                }
                const village = villages.find(v => v.id === selectedVillage);
                villageName = village?.name || "";
                villageId = selectedVillage;
            }
        }

        // Panchayat validation (if needed)
        let panchayatName = "";
        let panchayatId = selectedPanchayat;
        if (needsPanchayat) {
            if (useManualPanchayat) {
                if (!newPanchayat.trim()) {
                    setErr("Panchayat name is required");
                    return;
                }
                panchayatName = newPanchayat.trim();
            } else {
                if (!selectedPanchayat) {
                    setErr("Please select a panchayat");
                    return;
                }
                const panchayat = panchayats.find(p => p.id === selectedPanchayat);
                panchayatName = panchayat?.name || "";
                panchayatId = selectedPanchayat;
            }
        }

        // Gram Panchayat ID validation
        if ((role === "pdo" || role === "village_incharge") && !gramPanchayatId.trim()) {
            setErr("Gram Panchayat ID is required");
            return;
        }

        try {
            setLoading(true);
            setCheckingEmail(true);

            // Double-check email with multiple methods before creating user
            const emailCheck = await checkEmailExists(email.trim());
            if (emailCheck.exists) {
                setErr(t.emailAlreadyRegistered);
                setLoading(false);
                setCheckingEmail(false);
                return;
            }

            setCheckingEmail(false);

            // 1. Create Firebase Auth user
            const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
            const userId = userCredential.user.uid;

            // 2. Store location data in database if entered manually
            let districtId = selectedDistrict;
            let finalTalukId = talukId;
            let finalVillageId = villageId;
            let finalPanchayatId = panchayatId;

            // Store new district if entered manually
            if (useManualDistrict && newDistrict.trim()) {
                try {
                    const districtDoc = await addDoc(collection(db, "districts"), {
                        name: newDistrict.trim(),
                        state: "Karnataka",
                        isActive: true,
                        createdBy: userId,
                        createdAt: serverTimestamp()
                    });
                    districtId = districtDoc.id;
                    districtName = newDistrict.trim();
                } catch (error: any) {
                    console.error("Error creating district:", error);
                    // If district creation fails, still proceed with registration
                    districtName = newDistrict.trim();
                }
            }

            // Store new taluk if entered manually
            if (needsTaluk && useManualTaluk && newTaluk.trim() && districtId) {
                try {
                    const talukDoc = await addDoc(collection(db, "taluks"), {
                        name: newTaluk.trim(),
                        districtId: districtId,
                        districtName: districtName,
                        isActive: true,
                        createdBy: userId,
                        createdAt: serverTimestamp()
                    });
                    finalTalukId = talukDoc.id;
                    talukName = newTaluk.trim();
                } catch (error: any) {
                    console.error("Error creating taluk:", error);
                    talukName = newTaluk.trim();
                }
            }

            // Store new village if entered manually
            if (needsVillage && useManualVillage && newVillage.trim() && finalTalukId) {
                try {
                    const villageDoc = await addDoc(collection(db, "villages"), {
                        name: newVillage.trim(),
                        districtId: districtId,
                        districtName: districtName,
                        talukId: finalTalukId,
                        talukName: talukName,
                        isActive: true,
                        createdBy: userId,
                        createdAt: serverTimestamp()
                    });
                    finalVillageId = villageDoc.id;
                    villageName = newVillage.trim();
                } catch (error: any) {
                    console.error("Error creating village:", error);
                    villageName = newVillage.trim();
                }
            }

            // Store new panchayat if entered manually
            if (needsPanchayat && useManualPanchayat && newPanchayat.trim() && finalVillageId) {
                try {
                    const panchayatDoc = await addDoc(collection(db, "panchayats"), {
                        name: newPanchayat.trim(),
                        villageId: finalVillageId,
                        villageName: villageName,
                        talukId: finalTalukId,
                        talukName: talukName,
                        districtId: districtId,
                        districtName: districtName,
                        gramPanchayatId: gramPanchayatId.trim(),
                        isActive: true,
                        createdBy: userId,
                        createdAt: serverTimestamp()
                    });
                    finalPanchayatId = panchayatDoc.id;
                    panchayatName = newPanchayat.trim();
                } catch (error: any) {
                    console.error("Error creating panchayat:", error);
                    panchayatName = newPanchayat.trim();
                }
            }

            // 3. Create authority profile with verification fields
            const authorityData = {
                uid: userId,
                role,
                name: name.trim(),
                email: email.trim(),
                mobile: mobile.replace(/\D/g, ""),
                aadhaar: aadhaar.replace(/\D/g, ""), // Store full 12-digit Aadhaar
                aadhaarLast4: aadhaar.replace(/\D/g, "").slice(-4), // Store last 4 for display
                officeAddress: officeAddress.trim(),
                gramPanchayatId: gramPanchayatId.trim(),
                districtId: districtId || null,
                district: districtName,
                talukId: needsTaluk ? (finalTalukId || null) : null,
                taluk: needsTaluk ? talukName : null,
                villageId: needsVillage ? (finalVillageId || null) : null,
                village: needsVillage ? villageName : null,
                panchayatId: needsPanchayat ? (finalPanchayatId || null) : null,
                panchayat: needsPanchayat ? panchayatName : null,
                isManualEntry: {
                    district: useManualDistrict,
                    taluk: useManualTaluk,
                    village: useManualVillage,
                    panchayat: useManualPanchayat
                },
                // Verification fields - must match Firestore rules
                verified: false,
                verification: {
                    status: "pending",
                    requestedAt: serverTimestamp()
                },
                status: "pending",
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            // Create authority document
            await setDoc(doc(db, "authorities", userId), authorityData);

            // Also create user document
            await setDoc(doc(db, "users", userId), {
                uid: userId,
                name: name.trim(),
                email: email.trim(),
                role: "authority",
                authorityRole: role,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            // 4. Send registration email (fire and forget - don't wait for it)
            sendRegistrationEmail(userId, email.trim(), name.trim(), role).catch(error => {
                console.error("Email sending failed (non-critical):", error);
            });

            // 5. Show success message and sign out
            setSuccess(true);
            setTimeout(async () => {
                try {
                    await signOut(auth);
                } catch { }
                // Redirect to status page for unverified users
                router.replace(`/${locale}/authority/status`);
            }, 2000);

        } catch (error: any) {
            console.error("Registration error:", error);
            setCheckingEmail(false);

            // Firebase auth errors with better error messages
            if (error.code === "auth/email-already-in-use") {
                setErr(t.emailAlreadyInUse);
            } else if (error.code === "auth/invalid-email") {
                setErr(t.invalidEmail);
            } else if (error.code === "auth/weak-password") {
                setErr(t.weakPassword);
            } else if (error.code === "auth/operation-not-allowed") {
                setErr("Email/password sign-in is disabled");
            } else if (error.code === "permission-denied") {
                setErr("Permission denied. Please check your Firestore security rules.");
            } else if (error.code === "auth/network-request-failed") {
                setErr("Network error. Please check your internet connection.");
            } else if (error.code === "auth/too-many-requests") {
                setErr("Too many requests. Please try again later.");
            } else if (error.message) {
                setErr(error.message);
            } else {
                setErr(t.authError);
            }

            // Clean up on error - try to delete the auth user if it was created
            if (error.code !== "auth/email-already-in-use") {
                try {
                    await signOut(auth);
                } catch { }
            }
        } finally {
            setLoading(false);
        }
    };

    // Handle key press for Enter key
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !loading) {
            handleSubmit();
        }
    };

    // Clear email-related errors when email changes
    useEffect(() => {
        if (err && (err.toLowerCase().includes("email") || err.toLowerCase().includes("ईमेल") || err.includes("ಇಮೇಲ್"))) {
            setErr("");
        }
    }, [email, err]);

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

                @keyframes successPulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
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

                .animate-successPulse {
                    animation: successPulse 0.5s ease-in-out;
                }

                .delay-100 { animation-delay: 0.1s; }
                .delay-200 { animation-delay: 0.2s; }
                .delay-300 { animation-delay: 0.3s; }
                .delay-400 { animation-delay: 0.4s; }
                .delay-500 { animation-delay: 0.5s; }

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
                    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
                }

                .login-button:hover {
                    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
                    transform: translateY(-2px);
                    box-shadow: 0 6px 16px rgba(37, 99, 235, 0.3);
                }

                .login-button:active {
                    transform: translateY(0);
                }

                .login-button:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    transform: none;
                }
            `}</style>

            <div className="min-h-screen flex items-center justify-center p-4 animate-fadeIn">
                <div className="w-full max-w-3xl">
                    {/* Subtle background orbs */}
                    <div className="absolute inset-0 -z-10 overflow-hidden">
                        <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-green-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
                        <div className="absolute -bottom-1/4 left-1/4 w-72 h-72 bg-emerald-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
                        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-lime-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
                    </div>

                    {/* Header */}
                    <div className="mb-8 animate-slideUp">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="header-icon">
                                <Shield className="w-9 h-9 text-green-700" />
                            </div>
                            <h1 className="text-3xl font-bold text-green-900 tracking-tight">
                                {t.title}
                            </h1>
                        </div>
                        <p className="text-base text-green-700/75 leading-relaxed font-semibold">
                            {t.subtitle}
                        </p>
                        <p className="text-sm text-green-600/70 mt-2 font-semibold">
                            🏛️ {t.govService}
                        </p>
                    </div>

                    {/* Success Alert */}
                    {success && (
                        <div className="mb-6 p-4 rounded-2xl border border-green-200 bg-green-50/80 animate-slideUp delay-100 animate-successPulse">
                            <div className="flex items-start gap-3 text-green-700">
                                <div className="w-5 h-5 mt-0.5 flex-shrink-0 rounded-full bg-green-100 flex items-center justify-center">
                                    <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <div>
                                    <span className="text-sm font-semibold leading-snug block">
                                        {t.registrationSuccess}
                                    </span>
                                    <span className="text-xs mt-1 block">
                                        {t.redirecting}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Error Alert */}
                    {err && !success && (
                        <div className="mb-6 p-4 rounded-2xl border border-red-200 bg-red-50/80 animate-slideUp delay-100">
                            <div className="flex items-start gap-3 text-red-700">
                                <FiAlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                <div>
                                    <span className="text-sm leading-snug block">
                                        {err}
                                    </span>
                                    {err.includes("email") || err.includes("Email") || err.includes("ईमेल") || err.includes("ಇಮೇಲ್") ? (
                                        <span className="text-xs mt-1 block text-red-600/80">
                                            Please use a different email address or try logging in.
                                        </span>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Main Form Card - Disable when success */}
                    <div className={`card-bg border border-green-100 rounded-3xl shadow-lg overflow-hidden animate-slideUp delay-200 ${success ? 'opacity-60 pointer-events-none' : ''}`}>
                        <div className="p-6 sm:p-8">
                            {/* Role Selection */}
                            <div className="mb-8">
                                <label className="text-sm font-semibold text-green-900 mb-3 flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-green-600" />
                                    {t.role}
                                </label>
                                <div className="relative">
                                    <select
                                        value={role}
                                        onChange={(e) => handleRoleChange(e.target.value as Role)}
                                        className="input-field w-full rounded-2xl px-5 py-3.5 pr-10 outline-none text-green-900 bg-white cursor-pointer appearance-none"
                                        disabled={loading}
                                    >
                                        {ROLES.map((r) => (
                                            <option key={r.id} value={r.id}>
                                                {r.label}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-green-600">
                                        <svg className="fill-current h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Personal Information Section */}
                            <div className="mb-8">
                                <h3 className="text-lg font-bold text-green-900 mb-4 flex items-center gap-2">
                                    <User className="w-5 h-5" />
                                    Personal Information
                                </h3>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    {/* Name */}
                                    <div>
                                        <label className="text-sm font-semibold text-green-900 mb-2 flex items-center gap-2">
                                            <User className="w-4 h-4 text-green-600" />
                                            {t.fullName}
                                        </label>
                                        <input
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            onBlur={() => setTouched(prev => ({ ...prev, name: true }))}
                                            onKeyPress={handleKeyPress}
                                            className={`input-field w-full rounded-2xl px-5 py-3 outline-none text-green-900 placeholder-green-400/50 text-base ${touched.name && !name.trim() ? 'error' : ''}`}
                                            placeholder="Enter your full name"
                                            disabled={loading}
                                        />
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <label className="text-sm font-semibold text-green-900 mb-2 flex items-center gap-2">
                                            <Mail className="w-4 h-4 text-green-600" />
                                            {t.email}
                                        </label>
                                        <div className="relative">
                                            <input
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
                                                onKeyPress={handleKeyPress}
                                                className={`input-field w-full rounded-2xl px-5 py-3 outline-none text-green-900 placeholder-green-400/50 text-base ${touched.email && (!email.trim() || !email.includes('@')) ? 'error' : ''} ${emailStatus === 'taken' ? 'error' : ''} ${emailStatus === 'available' ? 'border-green-500' : ''}`}
                                                placeholder="official@example.com"
                                                type="email"
                                                disabled={loading}
                                            />
                                            {emailStatus === 'checking' && (
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                    <div className="w-5 h-5 border-2 border-green-600/30 border-t-green-600 rounded-full animate-spin"></div>
                                                </div>
                                            )}
                                            {emailStatus === 'available' && (
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600">
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                            )}
                                            {emailStatus === 'taken' && (
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-600">
                                                    <FiAlertCircle className="w-5 h-5" />
                                                </div>
                                            )}
                                        </div>
                                        {emailStatus === 'checking' && (
                                            <p className="text-xs text-green-600/80 mt-1">
                                                {t.emailCheck}
                                            </p>
                                        )}
                                        {emailStatus === 'available' && (
                                            <p className="text-xs text-green-600 font-semibold mt-1">
                                                {t.emailAvailable}
                                            </p>
                                        )}
                                        {emailStatus === 'taken' && (
                                            <p className="text-xs text-red-600 font-semibold mt-1">
                                                {t.emailAlreadyRegistered}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Password */}
                                <div className="mt-4">
                                    <label className="text-sm font-semibold text-green-900 mb-2 flex items-center gap-2">
                                        <Shield className="w-4 h-4 text-green-600" />
                                        {t.password}
                                    </label>
                                    <div className="relative">
                                        <input
                                            value={password}
                                            onChange={(e) => handlePasswordChange(e.target.value)}
                                            onBlur={() => setTouched(prev => ({ ...prev, password: true }))}
                                            onKeyPress={handleKeyPress}
                                            className={`input-field w-full rounded-2xl px-5 py-3 pr-12 outline-none text-green-900 placeholder-green-400/50 text-base ${touched.password && !isPasswordValid() ? 'error' : ''}`}
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Enter a valid password"
                                            disabled={loading}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="icon-button absolute right-3 top-1/2 -translate-y-1/2 text-green-600/60 hover:text-green-700 p-2 rounded-lg"
                                            aria-label="Toggle password visibility"
                                            disabled={loading}
                                        >
                                            {showPassword ? (
                                                <EyeOff className="w-5 h-5" />
                                            ) : (
                                                <Eye className="w-5 h-5" />
                                            )}
                                        </button>
                                    </div>

                                    {/* Password strength meter */}
                                    <div className="strength-meter">
                                        {[1, 2, 3, 4, 5].map((index) => (
                                            <div
                                                key={index}
                                                className={`strength-segment ${passwordStrength.hasMinLength && index <= 5 ? 'active' : ''
                                                    } ${passwordStrength.hasMinLength &&
                                                        passwordStrength.hasUppercase &&
                                                        passwordStrength.hasLowercase &&
                                                        passwordStrength.hasNumber &&
                                                        passwordStrength.hasSpecialChar &&
                                                        index <= 5 ? 'strong' : ''
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

                                <div className="grid gap-4 sm:grid-cols-2 mt-4">
                                    {/* Mobile */}
                                    <div>
                                        <label className="text-sm font-semibold text-green-900 mb-2 flex items-center gap-2">
                                            <Phone className="w-4 h-4 text-green-600" />
                                            {t.mobile}
                                        </label>
                                        <input
                                            value={mobile}
                                            onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                            onBlur={() => setTouched(prev => ({ ...prev, mobile: true }))}
                                            onKeyPress={handleKeyPress}
                                            className={`input-field w-full rounded-2xl px-5 py-3 outline-none text-green-900 placeholder-green-400/50 text-base ${touched.mobile && !mobile.match(/^[0-9]{10}$/) ? 'error' : ''}`}
                                            placeholder="10-digit mobile number"
                                            inputMode="numeric"
                                            disabled={loading}
                                        />
                                    </div>

                                    {/* Aadhaar */}
                                    <div>
                                        <label className="text-sm font-semibold text-green-900 mb-2 flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-green-600" />
                                            {t.aadhaar}
                                        </label>
                                        <input
                                            value={aadhaar}
                                            onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, '').slice(0, 12))}
                                            onBlur={() => setTouched(prev => ({ ...prev, aadhaar: true }))}
                                            onKeyPress={handleKeyPress}
                                            className={`input-field w-full rounded-2xl px-5 py-3 outline-none text-green-900 placeholder-green-400/50 text-base ${touched.aadhaar && !validateAadhaar(aadhaar) ? 'error' : ''}`}
                                            placeholder="12-digit Aadhaar"
                                            inputMode="numeric"
                                            disabled={loading}
                                        />
                                        <p className="text-xs text-green-900/60 mt-1">
                                            {t.aadhaarNote}
                                        </p>
                                    </div>
                                </div>

                                {/* Office Address */}
                                <div className="mt-4">
                                    <label className="text-sm font-semibold text-green-900 mb-2 flex items-center gap-2">
                                        <Home className="w-4 h-4 text-green-600" />
                                        {t.officeAddress}
                                    </label>
                                    <textarea
                                        value={officeAddress}
                                        onChange={(e) => setOfficeAddress(e.target.value)}
                                        onBlur={() => setTouched(prev => ({ ...prev, officeAddress: true }))}
                                        onKeyPress={handleKeyPress}
                                        className={`input-field w-full rounded-2xl px-5 py-3 outline-none text-green-900 placeholder-green-400/50 text-base resize-none ${touched.officeAddress && !officeAddress.trim() ? 'error' : ''}`}
                                        rows={3}
                                        placeholder="Enter complete office address"
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            {/* Location Information Section */}
                            <div>
                                <h3 className="text-lg font-bold text-green-900 mb-4 flex items-center gap-2">
                                    <MapPin className="w-5 h-5" />
                                    Location Information
                                </h3>

                                <div className="space-y-4">
                                    {/* District */}
                                    <div>
                                        <label className="text-sm font-semibold text-green-900 mb-2">
                                            {t.district}
                                        </label>
                                        {useManualDistrict ? (
                                            <div>
                                                <input
                                                    value={newDistrict}
                                                    onChange={(e) => setNewDistrict(e.target.value)}
                                                    onKeyPress={handleKeyPress}
                                                    className="input-field w-full rounded-2xl px-5 py-3 outline-none text-green-900 placeholder-green-400/50 text-base"
                                                    placeholder="Enter district name (e.g., Bangalore Urban)"
                                                    disabled={loading}
                                                />
                                                <p className="text-xs text-green-900/60 mt-1">
                                                    {t.newEntry.replace('{item}', 'district')}
                                                </p>
                                            </div>
                                        ) : (
                                            <div>
                                                <div className="relative">
                                                    <select
                                                        value={selectedDistrict}
                                                        onChange={(e) => {
                                                            setSelectedDistrict(e.target.value);
                                                            setSelectedTaluk("");
                                                            setSelectedVillage("");
                                                            setSelectedPanchayat("");
                                                        }}
                                                        className="input-field w-full rounded-2xl px-5 py-3 pr-10 outline-none text-green-900 bg-white cursor-pointer appearance-none"
                                                        disabled={loading}
                                                    >
                                                        <option value="">Select District</option>
                                                        {districts.map((d) => (
                                                            <option key={d.id} value={d.id}>
                                                                {d.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-green-600">
                                                        <svg className="fill-current h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                                            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                                                        </svg>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setUseManualDistrict(true)}
                                                    className="link-hover text-xs text-blue-600 mt-2 hover:text-blue-700 font-semibold"
                                                    disabled={loading}
                                                >
                                                    {t.cantFind.replace('{item}', 'district')}
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Taluk (if needed) */}
                                    {needsTaluk && (
                                        <div>
                                            <label className="text-sm font-semibold text-green-900 mb-2">
                                                {t.taluk}
                                            </label>
                                            {useManualTaluk ? (
                                                <div>
                                                    <input
                                                        value={newTaluk}
                                                        onChange={(e) => setNewTaluk(e.target.value)}
                                                        onKeyPress={handleKeyPress}
                                                        className="input-field w-full rounded-2xl px-5 py-3 outline-none text-green-900 placeholder-green-400/50 text-base"
                                                        placeholder="Enter taluk name"
                                                        disabled={(!selectedDistrict && !useManualDistrict) || loading}
                                                    />
                                                    <p className="text-xs text-green-900/60 mt-1">
                                                        {t.newEntry.replace('{item}', 'taluk')}
                                                    </p>
                                                </div>
                                            ) : (
                                                <div>
                                                    <div className="relative">
                                                        <select
                                                            value={selectedTaluk}
                                                            onChange={(e) => {
                                                                setSelectedTaluk(e.target.value);
                                                                setSelectedVillage("");
                                                                setSelectedPanchayat("");
                                                            }}
                                                            className="input-field w-full rounded-2xl px-5 py-3 pr-10 outline-none text-green-900 bg-white cursor-pointer appearance-none"
                                                            disabled={(!selectedDistrict && !useManualDistrict) || loading}
                                                        >
                                                            <option value="">Select Taluk</option>
                                                            {taluks.map((t) => (
                                                                <option key={t.id} value={t.id}>
                                                                    {t.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-green-600">
                                                            <svg className="fill-current h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                                                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setUseManualTaluk(true)}
                                                        className="link-hover text-xs text-blue-600 mt-2 hover:text-blue-700 font-semibold"
                                                        disabled={(!selectedDistrict && !useManualDistrict) || loading}
                                                    >
                                                        {t.cantFind.replace('{item}', 'taluk')}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Village (if needed) */}
                                    {needsVillage && (
                                        <div>
                                            <label className="text-sm font-semibold text-green-900 mb-2">
                                                {t.village}
                                            </label>
                                            {useManualVillage ? (
                                                <div>
                                                    <input
                                                        value={newVillage}
                                                        onChange={(e) => setNewVillage(e.target.value)}
                                                        onKeyPress={handleKeyPress}
                                                        className="input-field w-full rounded-2xl px-5 py-3 outline-none text-green-900 placeholder-green-400/50 text-base"
                                                        placeholder="Enter village name"
                                                        disabled={(!selectedTaluk && !useManualTaluk) || loading}
                                                    />
                                                    <p className="text-xs text-green-900/60 mt-1">
                                                        {t.newEntry.replace('{item}', 'village')}
                                                    </p>
                                                </div>
                                            ) : (
                                                <div>
                                                    <div className="relative">
                                                        <select
                                                            value={selectedVillage}
                                                            onChange={(e) => {
                                                                setSelectedVillage(e.target.value);
                                                                setSelectedPanchayat("");
                                                            }}
                                                            className="input-field w-full rounded-2xl px-5 py-3 pr-10 outline-none text-green-900 bg-white cursor-pointer appearance-none"
                                                            disabled={(!selectedTaluk && !useManualTaluk) || loading}
                                                        >
                                                            <option value="">Select Village</option>
                                                            {villages.map((v) => (
                                                                <option key={v.id} value={v.id}>
                                                                    {v.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-green-600">
                                                            <svg className="fill-current h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                                                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setUseManualVillage(true)}
                                                        className="link-hover text-xs text-blue-600 mt-2 hover:text-blue-700 font-semibold"
                                                        disabled={(!selectedTaluk && !useManualTaluk) || loading}
                                                    >
                                                        {t.cantFind.replace('{item}', 'village')}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Panchayat (for village roles) */}
                                    {needsPanchayat && (
                                        <div>
                                            <label className="text-sm font-semibold text-green-900 mb-2">
                                                {t.panchayat}
                                            </label>
                                            {useManualPanchayat ? (
                                                <div>
                                                    <input
                                                        value={newPanchayat}
                                                        onChange={(e) => setNewPanchayat(e.target.value)}
                                                        onKeyPress={handleKeyPress}
                                                        className="input-field w-full rounded-2xl px-5 py-3 outline-none text-green-900 placeholder-green-400/50 text-base"
                                                        placeholder="Enter panchayat name"
                                                        disabled={(!selectedVillage && !useManualVillage) || loading}
                                                    />
                                                    <p className="text-xs text-green-900/60 mt-1">
                                                        {t.newEntry.replace('{item}', 'panchayat')}
                                                    </p>
                                                </div>
                                            ) : (
                                                <div>
                                                    <div className="relative">
                                                        <select
                                                            value={selectedPanchayat}
                                                            onChange={(e) => setSelectedPanchayat(e.target.value)}
                                                            className="input-field w-full rounded-2xl px-5 py-3 pr-10 outline-none text-green-900 bg-white cursor-pointer appearance-none"
                                                            disabled={(!selectedVillage && !useManualVillage) || loading}
                                                        >
                                                            <option value="">Select Panchayat</option>
                                                            {panchayats.map((p) => (
                                                                <option key={p.id} value={p.id}>
                                                                    {p.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-green-600">
                                                            <svg className="fill-current h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                                                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                    <div className="mt-2 space-y-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => setUseManualPanchayat(true)}
                                                            className="link-hover text-xs text-blue-600 hover:text-blue-700 font-semibold block"
                                                            disabled={(!selectedVillage && !useManualVillage) || loading}
                                                        >
                                                            {t.cantFind.replace('{item}', 'panchayat')}
                                                        </button>
                                                        {panchayats.length === 0 && selectedVillage && (
                                                            <p className="text-xs text-red-600 font-semibold">
                                                                {t.noPanchayat}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Gram Panchayat ID (for village roles) */}
                                    {(role === "pdo" || role === "village_incharge") && (
                                        <div>
                                            <label className="text-sm font-semibold text-green-900 mb-2">
                                                {t.gramPanchayatId}
                                            </label>
                                            <input
                                                value={gramPanchayatId}
                                                onChange={(e) => setGramPanchayatId(e.target.value)}
                                                onKeyPress={handleKeyPress}
                                                className="input-field w-full rounded-2xl px-5 py-3 outline-none text-green-900 placeholder-green-400/50 text-base"
                                                placeholder="Enter official Gram Panchayat ID"
                                                disabled={loading}
                                            />
                                            <p className="text-xs text-green-900/60 mt-1">
                                                {t.gramNote}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                onClick={handleSubmit}
                                disabled={loading || success || emailStatus === "taken" || checkingEmail}
                                className={`button-base w-full mt-8 py-4 px-6 rounded-2xl font-semibold text-white text-base sm:text-lg
                                  ${success 
                                    ? 'bg-gradient-to-r from-green-500 to-green-600 cursor-not-allowed' 
                                    : emailStatus === "taken" || checkingEmail
                                    ? 'bg-gradient-to-r from-gray-400 to-gray-500 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 shadow-md hover:shadow-lg'
                                  }
                                  focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2
                                  disabled:opacity-60 disabled:cursor-not-allowed
                                  flex items-center justify-center gap-2`}
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>{t.creating}</span>
                                    </>
                                ) : success ? (
                                    <>
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span>{t.registrationSuccess}</span>
                                    </>
                                ) : emailStatus === "taken" ? (
                                    <>
                                        <FiAlertCircle className="w-5 h-5" />
                                        <span>{t.emailTaken}</span>
                                    </>
                                ) : checkingEmail ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>{t.checking}</span>
                                    </>
                                ) : (
                                    <>
                                        <Shield className="w-5 h-5" />
                                        <span>{t.register}</span>
                                    </>
                                )}
                            </button>

                            {/* Already Registered Login Button */}
                            <div className="mt-8 text-center">
                                <button
                                    onClick={() => router.push(`/${locale}/authority/login`)}
                                    disabled={loading}
                                    className="login-button"
                                >
                                    <LogIn className="w-4 h-4" />
                                    {t.alreadyRegistered}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Footer Note */}
                    <div className="mt-8 text-center text-sm text-green-700/70 font-semibold animate-fadeIn" style={{ animationDelay: '0.5s' }}>
                        <p>🏛️ {t.joinAuthority}</p>
                    </div>
                </div>
            </div>
        </Screen>
    );
}
