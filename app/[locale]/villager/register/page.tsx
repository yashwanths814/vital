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
} from "firebase/firestore";

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

const animationStyles = `
  @keyframes slideInDown {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.7;
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
    0%, 100% {
      transform: translateX(0);
    }
    25% {
      transform: translateX(-5px);
    }
    75% {
      transform: translateX(5px);
    }
  }

  @keyframes checkBounce {
    0% {
      transform: scale(0.8);
    }
    50% {
      transform: scale(1.1);
    }
    100% {
      transform: scale(1);
    }
  }

  @keyframes glow {
    0%, 100% {
      box-shadow: 0 0 5px rgba(34, 197, 94, 0.3);
    }
    50% {
      box-shadow: 0 0 15px rgba(34, 197, 94, 0.6);
    }
  }

  @keyframes slideInLeft {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .animate-slide-in-down {
    animation: slideInDown 0.6s ease-out;
  }

  .animate-slide-in-up {
    animation: slideInUp 0.6s ease-out;
  }

  .animate-fade-in {
    animation: fadeIn 0.6s ease-out;
  }

  .animate-shake {
    animation: shake 0.5s ease-in-out;
  }

  .animate-check-bounce {
    animation: checkBounce 0.4s ease-out;
  }

  .animate-glow {
    animation: glow 2s ease-in-out infinite;
  }

  /* Form inputs with enhanced effects */
  input:focus {
    animation: glow 1.5s ease-in-out infinite;
  }

  select:focus {
    animation: glow 1.5s ease-in-out infinite;
  }

  /* Smooth transitions for all interactive elements */
  input,
  select,
  button {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  input:hover:not(:disabled),
  select:hover:not(:disabled) {
    border-color: rgba(34, 197, 94, 0.8);
    box-shadow: 0 0 8px rgba(34, 197, 94, 0.2);
  }

  /* Button animations */
  button:not(:disabled):hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
  }

  button:not(:disabled):active {
    transform: translateY(0);
  }

  /* Password strength indicator animation */
  .password-check {
    animation: checkBounce 0.4s ease-out;
  }

  /* Error message animation */
  .error-shake {
    animation: shake 0.5s ease-in-out;
  }

  /* Stagger animation for form fields */
  .form-field {
    animation: slideInUp 0.5s ease-out backwards;
  }

  .form-field:nth-child(1) { animation-delay: 0.1s; }
  .form-field:nth-child(2) { animation-delay: 0.2s; }
  .form-field:nth-child(3) { animation-delay: 0.3s; }
  .form-field:nth-child(4) { animation-delay: 0.4s; }
  .form-field:nth-child(5) { animation-delay: 0.5s; }
  .form-field:nth-child(6) { animation-delay: 0.6s; }
  .form-field:nth-child(7) { animation-delay: 0.7s; }
  .form-field:nth-child(8) { animation-delay: 0.8s; }
  .form-field:nth-child(9) { animation-delay: 0.9s; }
  .form-field:nth-child(10) { animation-delay: 1s; }

  /* Loading state animation */
  .loading-pulse {
    animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }

  /* Disabled state smoothness */
  button:disabled {
    cursor: not-allowed;
  }

  /* Select dropdown smooth opening */
  select {
    appearance: none;
  }

  /* Error container slide in */
  .error-container {
    animation: slideInDown 0.4s ease-out;
  }

  /* Header animation */
  .header-title {
    animation: slideInDown 0.6s ease-out;
  }

  .header-subtitle {
    animation: fadeIn 0.8s ease-out 0.2s both;
  }

  /* Success checkmark animation */
  .checkmark {
    animation: checkBounce 0.6s ease-out;
  }

  /* Smooth focus ring */
  input:focus,
  select:focus {
    outline: none;
    border-color: rgb(34, 197, 94);
    box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
  }

  /* Disabled input styling with smooth transition */
  input:disabled,
  select:disabled {
    transition: all 0.3s ease-out;
  }

  /* Label animation */
  label {
    transition: all 0.2s ease-out;
  }

  /* Placeholder text animation */
  input::placeholder {
    transition: color 0.3s ease-out;
  }

  input:focus::placeholder {
    color: transparent;
  }

  /* Password field wrapper for icon positioning */
  .password-field-wrapper {
    position: relative;
  }

  .password-toggle-btn {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px 8px;
    color: #166534;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease-out;
  }

  .password-toggle-btn:hover {
    color: #15803d;
    transform: translateY(-50%) scale(1.1);
  }

  .password-toggle-btn:active {
    transform: translateY(-50%) scale(0.95);
  }

  .password-input-with-icon {
    padding-right: 40px;
  }
`;

export default function VillagerRegisterPage() {
    const router = useRouter();
    const params = useParams() as { locale?: string };
    const locale = ((params?.locale as Locale) || "en") as Locale;

    const t = useMemo(() => {
        const L: Record<Locale, any> = {
            en: {
                title: "Villager Registration",
                subtitle: "Register and wait for Village In-charge verification",
                name: "Full Name",
                email: "Email",
                password: "Password",
                mobile: "Mobile",
                aadhaar: "Aadhaar Number",
                district: "District",
                taluk: "Taluk",
                village: "Village",
                panchayat: "Panchayat",
                select: "Select",
                loading: "Loading…",
                register: "Register",
                registering: "Registering…",
                errors: {
                    fill: "Please fill all fields correctly.",
                    loadLoc: "Failed to load districts/taluks/villages/panchayats.",
                    password: "Enter your password",
                    aadhaar: "Aadhaar must be exactly 12 digits",
                    mobile: "Mobile must be 10 digits",
                    email: "Valid email is required"
                },
            },
            kn: {
                title: "ಗ್ರಾಮಸ್ಥ ನೋಂದಣಿ",
                subtitle: "ನೋಂದಣಿ ಮಾಡಿ ಮತ್ತು ಗ್ರಾಮ ಇಂಚಾರ್ಜ್ ಪರಿಶೀಲನೆಗಾಗಿ ಕಾಯಿರಿ",
                name: "ಹೆಸರು",
                email: "ಇಮೇಲ್",
                password: "ಪಾಸ್‌ವರ್ಡ್",
                mobile: "ಮೊಬೈಲ್",
                aadhaar: "ಆಧಾರ್ ಸಂಖ್ಯೆ",
                district: "ಜಿಲ್ಲೆ",
                taluk: "ತಾಲೂಕು",
                village: "ಗ್ರಾಮ",
                panchayat: "ಪಂಚಾಯತ್",
                select: "ಆಯ್ಕೆ ಮಾಡಿ",
                loading: "ಲೋಡ್ ಆಗುತ್ತಿದೆ…",
                register: "ನೋಂದಣಿ",
                registering: "ನೋಂದಣಿ ಆಗುತ್ತಿದೆ…",
                errors: {
                    fill: "ದಯವಿಟ್ಟು ಎಲ್ಲಾ ಫೀಲ್ಡ್‌ಗಳನ್ನು ಸರಿಯಾಗಿ ತುಂಬಿ.",
                    loadLoc: "ಜಿಲ್ಲೆ/ತಾಲೂಕು/ಗ್ರಾಮ/ಪಂಚಾಯತ್ ಲಿಸ್ಟ್ ಲೋಡ್ ಆಗಲಿಲ್ಲ.",
                    password: "ಪಾಸ್‌ವರ್ಡ್ ಕನಿಷ್ಠ ೮ ಅಕ್ಷರಗಳಾಗಿರಬೇಕು, ದೊಡ್ಡಕ್ಷರ, ಸಣ್ಣಕ್ಷರ, ಸಂಖ್ಯೆ ಮತ್ತು ವಿಶೇಷ ಅಕ್ಷರ ಹೊಂದಿರಬೇಕು",
                    aadhaar: "ಆಧಾರ್ ನಿಖರವಾಗಿ ೧೨ ಅಂಕೆಗಳಾಗಿರಬೇಕು",
                    mobile: "ಮೊಬೈಲ್ ೧೦ ಅಂಕೆಗಳಾಗಿರಬೇಕು",
                    email: "ಮಾನ್ಯ ಇಮೇಲ್ ಅಗತ್ಯವಿದೆ"
                },
            },
            hi: {
                title: "ग्रामीण पंजीकरण",
                subtitle: "रजिस्टर करें और Village In-charge verification का इंतज़ार करें",
                name: "पूरा नाम",
                email: "ईमेल",
                password: "पासवर्ड",
                mobile: "मोबाइल",
                aadhaar: "आधार नंबर",
                district: "जिला",
                taluk: "तालुक",
                village: "गांव",
                panchayat: "पंचायत",
                select: "चुनें",
                loading: "लोड हो रहा है…",
                register: "रजिस्टर",
                registering: "रजिस्टर हो रहा है…",
                errors: {
                    fill: "कृपया सभी फ़ील्ड सही से भरें।",
                    loadLoc: "जिला/तालुक/गांव/पंचायत लिस्ट लोड नहीं हुई।",
                    password: "पासवर्ड कम से कम 8 अक्षरों का होना चाहिए, बड़े अक्षर, छोटे अक्षर, संख्या और विशेष वर्ण शामिल हों",
                    aadhaar: "आधार ठीक 12 अंकों का होना चाहिए",
                    mobile: "मोबाइल 10 अंकों का होना चाहिए",
                    email: "मान्य ईमेल आवश्यक है"
                },
            },
        };
        return L[locale] || L.en;
    }, [locale]);

    const [name, setName] = useState("");
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
    const [mobile, setMobile] = useState("");
    const [aadhaar, setAadhaar] = useState("");

    // ✅ dropdown ids (store ids, not free-text)
    const [districtId, setDistrictId] = useState("");
    const [talukId, setTalukId] = useState("");
    const [villageId, setVillageId] = useState("");
    const [panchayatId, setPanchayatId] = useState("");

    // lists
    const [districts, setDistricts] = useState<District[]>([]);
    const [taluks, setTaluks] = useState<Taluk[]>([]);
    const [villages, setVillages] = useState<Village[]>([]);
    const [panchayats, setPanchayats] = useState<Panchayat[]>([]);

    const [loadingLoc, setLoadingLoc] = useState(false);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");
    const [errShake, setErrShake] = useState(false);

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

    // Validate Aadhaar
    const validateAadhaar = (aadhaar: string): boolean => {
        const cleanAadhaar = aadhaar.replace(/\D/g, '');
        return cleanAadhaar.length === 12 && /^\d+$/.test(cleanAadhaar);
    };

    // Handle Aadhaar change
    const handleAadhaarChange = (value: string) => {
        setAadhaar(value.replace(/\D/g, '').slice(0, 12));
    };

    // 1) Load districts
    useEffect(() => {
        const loadDistricts = async () => {
            setErr("");
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
            } catch (e: any) {
                console.error("Error loading districts:", e);
                setErr(e?.message || t.errors.loadLoc);
                triggerErrShake();
            } finally {
                setLoadingLoc(false);
            }
        };
        loadDistricts();
    }, [t.errors.loadLoc]);

    // 2) Load taluks when district changes
    useEffect(() => {
        const loadTaluks = async () => {
            if (!districtId) {
                setTaluks([]);
                setVillages([]);
                setPanchayats([]);
                setTalukId("");
                setVillageId("");
                setPanchayatId("");
                return;
            }

            setErr("");
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

                // reset downstream selections
                setVillages([]);
                setPanchayats([]);
                setTalukId("");
                setVillageId("");
                setPanchayatId("");
            } catch (e: any) {
                console.error("Error loading taluks:", e);
                setErr(e?.message || t.errors.loadLoc);
                triggerErrShake();
            } finally {
                setLoadingLoc(false);
            }
        };

        loadTaluks();
    }, [districtId, t.errors.loadLoc]);

    // 3) Load villages when taluk changes
    useEffect(() => {
        const loadVillages = async () => {
            if (!districtId || !talukId) {
                setVillages([]);
                setPanchayats([]);
                setVillageId("");
                setPanchayatId("");
                return;
            }

            setErr("");
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

                // reset downstream selections
                setPanchayats([]);
                setVillageId("");
                setPanchayatId("");
            } catch (e: any) {
                console.error("Error loading villages:", e);
                setErr(e?.message || t.errors.loadLoc);
                triggerErrShake();
            } finally {
                setLoadingLoc(false);
            }
        };

        loadVillages();
    }, [talukId, districtId, t.errors.loadLoc]);

    // 4) Load panchayats when village changes
    useEffect(() => {
        const loadPanchayats = async () => {
            if (!districtId || !talukId || !villageId) {
                setPanchayats([]);
                setPanchayatId("");
                return;
            }

            setErr("");
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

                // reset panchayat selection
                setPanchayatId("");
            } catch (e: any) {
                console.error("Error loading panchayats:", e);
                // Don't show error if no panchayats found
            } finally {
                setLoadingLoc(false);
            }
        };

        loadPanchayats();
    }, [villageId, talukId, districtId]);

    const triggerErrShake = () => {
        setErrShake(true);
        setTimeout(() => setErrShake(false), 500);
    };

    const submit = async () => {
        setErr("");

        // Validation
        if (!name.trim()) {
            setErr("Name is required");
            triggerErrShake();
            return;
        }
        if (!email.trim() || !email.includes("@")) {
            setErr(t.errors.email);
            triggerErrShake();
            return;
        }
        if (!isPasswordValid()) {
            setErr(t.errors.password);
            triggerErrShake();
            return;
        }
        if (!mobile.match(/^[0-9]{10}$/)) {
            setErr(t.errors.mobile);
            triggerErrShake();
            return;
        }
        if (!validateAadhaar(aadhaar)) {
            setErr(t.errors.aadhaar);
            triggerErrShake();
            return;
        }
        if (!districtId || !talukId || !villageId || !panchayatId) {
            setErr("Please select district, taluk, village, and panchayat");
            triggerErrShake();
            return;
        }

        try {
            setLoading(true);

            // 1) Create auth user
            const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);

            // resolve readable names
            const districtName = districts.find((d) => d.id === districtId)?.name || "";
            const talukName = taluks.find((x) => x.id === talukId)?.name || "";
            const villageName = villages.find((v) => v.id === villageId)?.name || "";
            const panchayat = panchayats.find((p) => p.id === panchayatId);
            const panchayatName = panchayat?.name || "";
            const panchayatCode = panchayat?.code || "";

            // 2) Create profile in /villagers/{uid}
            const villagerData = {
                uid: cred.user.uid,
                name: name.trim(),
                email: email.trim(),
                mobile: mobile.replace(/\D/g, ""),
                aadhaar: aadhaar.replace(/\D/g, ""), // Store full 12-digit Aadhaar
                aadhaarLast4: aadhaar.replace(/\D/g, "").slice(-4), // Store last 4 for display

                // ✅ store IDs for joins
                districtId,
                talukId,
                villageId,
                panchayatId,

                // ✅ store display strings for easy UI
                district: districtName,
                taluk: talukName,
                village: villageName,
                panchayatName,
                panchayatCode,

                // REQUIRED BY RULES:
                status: "pending",
                verified: false,

                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            await setDoc(doc(db, "villagers", cred.user.uid), villagerData);

            // Also create user document
            await setDoc(doc(db, "users", cred.user.uid), {
                uid: cred.user.uid,
                name: name.trim(),
                email: email.trim(),
                role: "villager",
                panchayatId: panchayatId,
                districtId: districtId,
                talukId: talukId,
                villageId: villageId,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            router.replace(`/${locale}/villager/status`);
        } catch (e: any) {
            console.error("VILLAGER REGISTER ERROR:", e);
            
            // Firebase auth errors
            if (e.code === "auth/email-already-in-use") {
                setErr("Email already registered");
            } else if (e.code === "auth/invalid-email") {
                setErr("Invalid email address");
            } else if (e.code === "auth/weak-password") {
                setErr("Password is too weak");
            } else if (e.code === "auth/operation-not-allowed") {
                setErr("Email/password sign-in is disabled");
            } else if (e.message) {
                setErr(e.message);
            } else {
                setErr("Registration failed. Please try again.");
            }
            triggerErrShake();
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <style>{animationStyles}</style>
            <Screen padded>
                <div className="max-w-xl mx-auto">
                    <h1 className="text-2xl font-extrabold text-green-900 header-title">{t.title}</h1>
                    <p className="text-sm text-green-800/70 mt-1 header-subtitle">{t.subtitle}</p>

                    {err && (
                        <div className={`mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 error-container ${errShake ? 'error-shake' : ''}`}>
                            {err}
                        </div>
                    )}

                    <div className="mt-6 grid gap-4 bg-white border border-green-100 rounded-2xl p-4">
                        <div className="form-field">
                            <label className="text-xs font-bold text-green-900">{t.name} *</label>
                            <input
                                className="mt-1 w-full rounded-xl border border-green-200 px-3 py-3"
                                placeholder={t.name}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        <div className="form-field">
                            <label className="text-xs font-bold text-green-900">{t.email} *</label>
                            <input
                                className="mt-1 w-full rounded-xl border border-green-200 px-3 py-3"
                                placeholder={t.email}
                                inputMode="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div className="form-field">
                            <label className="text-xs font-bold text-green-900">{t.password} *</label>
                            <div className="password-field-wrapper">
                                <input
                                    className="mt-1 w-full rounded-xl border border-green-200 px-3 py-3 password-input-with-icon"
                                    placeholder="Enter your password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => handlePasswordChange(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="password-toggle-btn"
                                    tabIndex={-1}
                                >
                                    {showPassword ? (
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                            <circle cx="12" cy="12" r="3"></circle>
                                        </svg>
                                    ) : (
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                            <line x1="1" y1="1" x2="23" y2="23"></line>
                                        </svg>
                                    )}
                                </button>
                            </div>
                            
                            {/* Password strength indicator */}
                            <div className="mt-2 space-y-1">
                                <div className="flex items-center">
                                    <div className={`w-3 h-3 rounded-full mr-2 transition-all ${passwordStrength.hasUppercase ? 'bg-green-500 password-check' : 'bg-gray-300'}`}></div>
                                    <span className={`text-xs ${passwordStrength.hasUppercase ? 'text-green-700' : 'text-gray-500'}`}>
                                        At least one uppercase letter (A-Z)
                                    </span>
                                </div>
                                <div className="flex items-center">
                                    <div className={`w-3 h-3 rounded-full mr-2 transition-all ${passwordStrength.hasLowercase ? 'bg-green-500 password-check' : 'bg-gray-300'}`}></div>
                                    <span className={`text-xs ${passwordStrength.hasLowercase ? 'text-green-700' : 'text-gray-500'}`}>
                                        At least one lowercase letter (a-z)
                                    </span>
                                </div>
                                <div className="flex items-center">
                                    <div className={`w-3 h-3 rounded-full mr-2 transition-all ${passwordStrength.hasNumber ? 'bg-green-500 password-check' : 'bg-gray-300'}`}></div>
                                    <span className={`text-xs ${passwordStrength.hasNumber ? 'text-green-700' : 'text-gray-500'}`}>
                                        At least one number (0-9)
                                    </span>
                                </div>
                                <div className="flex items-center">
                                    <div className={`w-3 h-3 rounded-full mr-2 transition-all ${passwordStrength.hasSpecialChar ? 'bg-green-500 password-check' : 'bg-gray-300'}`}></div>
                                    <span className={`text-xs ${passwordStrength.hasSpecialChar ? 'text-green-700' : 'text-gray-500'}`}>
                                        At least one special character (!@#$%^&* etc.)
                                    </span>
                                </div>
                                <div className="flex items-center">
                                    <div className={`w-3 h-3 rounded-full mr-2 transition-all ${passwordStrength.hasMinLength ? 'bg-green-500 password-check' : 'bg-gray-300'}`}></div>
                                    <span className={`text-xs ${passwordStrength.hasMinLength ? 'text-green-700' : 'text-gray-500'}`}>
                                        At least 8 characters long
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="form-field">
                            <label className="text-xs font-bold text-green-900">{t.mobile} *</label>
                            <input
                                className="mt-1 w-full rounded-xl border border-green-200 px-3 py-3"
                                placeholder="10-digit mobile number"
                                inputMode="numeric"
                                value={mobile}
                                onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                            />
                        </div>

                        <div className="form-field">
                            <label className="text-xs font-bold text-green-900">{t.aadhaar} *</label>
                            <input
                                className="mt-1 w-full rounded-xl border border-green-200 px-3 py-3"
                                placeholder="12-digit Aadhaar"
                                inputMode="numeric"
                                value={aadhaar}
                                onChange={(e) => handleAadhaarChange(e.target.value)}
                            />
                            <p className="text-xs text-green-900/60 mt-1">
                                Stored as full 12 digits (only last 4 visible to authorities)
                            </p>
                        </div>

                        {/* ✅ District dropdown */}
                        <div className="form-field">
                            <label className="text-xs font-bold text-green-900">{t.district} *</label>
                            <select
                                value={districtId}
                                onChange={(e) => setDistrictId(e.target.value)}
                                className="mt-1 w-full rounded-xl border border-green-200 px-3 py-3 bg-white"
                                disabled={loadingLoc}
                            >
                                <option value="">{loadingLoc ? t.loading : t.select}</option>
                                {districts.map((d) => (
                                    <option key={d.id} value={d.id}>
                                        {d.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* ✅ Taluk dropdown */}
                        <div className="form-field">
                            <label className="text-xs font-bold text-green-900">{t.taluk} *</label>
                            <select
                                value={talukId}
                                onChange={(e) => setTalukId(e.target.value)}
                                disabled={!districtId || loadingLoc}
                                className="mt-1 w-full rounded-xl border border-green-200 px-3 py-3 bg-white disabled:opacity-60"
                            >
                                <option value="">{loadingLoc ? t.loading : t.select}</option>
                                {taluks.map((x) => (
                                    <option key={x.id} value={x.id}>
                                        {x.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* ✅ Village dropdown */}
                        <div className="form-field">
                            <label className="text-xs font-bold text-green-900">{t.village} *</label>
                            <select
                                value={villageId}
                                onChange={(e) => setVillageId(e.target.value)}
                                disabled={!talukId || loadingLoc}
                                className="mt-1 w-full rounded-xl border border-green-200 px-3 py-3 bg-white disabled:opacity-60"
                            >
                                <option value="">{loadingLoc ? t.loading : t.select}</option>
                                {villages.map((v) => (
                                    <option key={v.id} value={v.id}>
                                        {v.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* ✅ Panchayat dropdown */}
                        <div className="form-field">
                            <label className="text-xs font-bold text-green-900">{t.panchayat} *</label>
                            <select
                                value={panchayatId}
                                onChange={(e) => setPanchayatId(e.target.value)}
                                disabled={!villageId || loadingLoc || panchayats.length === 0}
                                className="mt-1 w-full rounded-xl border border-green-200 px-3 py-3 bg-white disabled:opacity-60"
                            >
                                <option value="">{loadingLoc ? t.loading : t.select}</option>
                                {panchayats.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name} {p.code ? `(${p.code})` : ''}
                                    </option>
                                ))}
                            </select>
                            {panchayats.length === 0 && villageId && !loadingLoc && (
                                <p className="text-xs text-red-600 mt-1">
                                    No panchayats found for this village. Contact your village authority or choose a different village.
                                </p>
                            )}
                        </div>

                        <button
                            disabled={loading || !isPasswordValid() || !districtId || !talukId || !villageId || !panchayatId}
                            onClick={submit}
                            className={`mt-4 rounded-2xl bg-green-700 text-white font-extrabold py-4 hover:brightness-95 active:scale-[0.99] transition disabled:opacity-60 ${loading ? 'loading-pulse' : ''}`}
                        >
                            {loading ? t.registering : t.register}
                        </button>
                    </div>
                </div>
            </Screen>
        </>
    );
}