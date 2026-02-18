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
      opacity: 0;
    }
    50% {
      transform: scale(1.1);
      opacity: 1;
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }

  @keyframes glow {
    0%, 100% {
      box-shadow: 0 0 5px rgba(34, 197, 94, 0.3);
    }
    50% {
      box-shadow: 0 0 20px rgba(34, 197, 94, 0.6);
    }
  }

  @keyframes borderGlow {
    0%, 100% {
      border-color: rgba(34, 197, 94, 0.3);
    }
    50% {
      border-color: rgba(34, 197, 94, 0.8);
    }
  }

  @keyframes float {
    0%, 100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-5px);
    }
  }

  @keyframes ripple {
    0% {
      transform: scale(0.8);
      opacity: 1;
    }
    100% {
      transform: scale(2);
      opacity: 0;
    }
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .animate-slide-in-down {
    animation: slideInDown 0.6s ease-out;
  }

  .animate-slide-in-up {
    animation: slideInUp 0.6s ease-out;
  }

  .animate-slide-in-left {
    animation: slideInLeft 0.5s ease-out;
  }

  .animate-slide-in-right {
    animation: slideInRight 0.5s ease-out;
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

  .animate-border-glow {
    animation: borderGlow 1.5s ease-in-out infinite;
  }

  .animate-float {
    animation: float 3s ease-in-out infinite;
  }

  .animate-spin {
    animation: spin 1s linear infinite;
  }

  /* Form inputs with enhanced effects */
  input:focus {
    animation: glow 1.5s ease-in-out infinite;
    transform: translateY(-1px);
  }

  select:focus {
    animation: glow 1.5s ease-in-out infinite;
    transform: translateY(-1px);
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
    transform: translateY(-1px);
  }

  /* Button animations */
  button:not(:disabled) {
    position: relative;
    overflow: hidden;
  }

  button:not(:disabled):hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
  }

  button:not(:disabled):active {
    transform: translateY(0);
  }

  button:not(:disabled)::after {
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

  button:not(:disabled):active::after {
    width: 300px;
    height: 300px;
    opacity: 0;
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
    opacity: 0;
    transform: translateY(20px);
  }

  .form-field:nth-child(1) { animation-delay: 0.1s; animation-fill-mode: forwards; }
  .form-field:nth-child(2) { animation-delay: 0.15s; animation-fill-mode: forwards; }
  .form-field:nth-child(3) { animation-delay: 0.2s; animation-fill-mode: forwards; }
  .form-field:nth-child(4) { animation-delay: 0.25s; animation-fill-mode: forwards; }
  .form-field:nth-child(5) { animation-delay: 0.3s; animation-fill-mode: forwards; }
  .form-field:nth-child(6) { animation-delay: 0.35s; animation-fill-mode: forwards; }
  .form-field:nth-child(7) { animation-delay: 0.4s; animation-fill-mode: forwards; }
  .form-field:nth-child(8) { animation-delay: 0.45s; animation-fill-mode: forwards; }
  .form-field:nth-child(9) { animation-delay: 0.5s; animation-fill-mode: forwards; }
  .form-field:nth-child(10) { animation-delay: 0.55s; animation-fill-mode: forwards; }

  /* Loading state animation */
  .loading-pulse {
    animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }

  /* Disabled state smoothness */
  button:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  /* Select dropdown smooth opening */
  select {
    appearance: none;
    background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23166534' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
    background-repeat: no-repeat;
    background-position: right 1rem center;
    background-size: 1em;
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
    background-color: #f3f4f6;
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
    padding: 8px;
    color: #166534;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease-out;
    border-radius: 50%;
  }

  .password-toggle-btn:hover {
    color: #15803d;
    transform: translateY(-50%) scale(1.1);
    background-color: rgba(34, 197, 94, 0.1);
  }

  .password-toggle-btn:active {
    transform: translateY(-50%) scale(0.95);
  }

  .password-input-with-icon {
    padding-right: 48px;
  }

  /* Mobile number field with country code */
  .mobile-field-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .country-code {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #166534;
    font-weight: 600;
    font-size: 14px;
    background: #f0fdf4;
    padding: 2px 8px;
    border-radius: 16px;
    border: 1px solid #bbf7d0;
    z-index: 1;
  }

  .mobile-input-with-code {
    padding-left: 70px;
  }

  /* Input validation icons */
  .validation-icon {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    width: 20px;
    height: 20px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
  }

  .validation-icon.valid {
    color: #22c55e;
    animation: checkBounce 0.4s ease-out;
  }

  .validation-icon.invalid {
    color: #ef4444;
  }

  /* Mobile view optimizations */
  @media (max-width: 640px) {
    .form-field {
      animation: slideInLeft 0.4s ease-out backwards;
    }
    
    input, select, button {
      font-size: 16px !important; /* Prevents zoom on mobile */
    }
    
    .password-toggle-btn {
      padding: 12px;
    }
    
    .country-code {
      font-size: 13px;
      padding: 2px 6px;
    }
    
    .mobile-input-with-code {
      padding-left: 65px;
    }
  }

  /* Ripple effect for interactive elements */
  .ripple-effect {
    position: relative;
    overflow: hidden;
  }

  .ripple-effect:after {
    content: "";
    display: block;
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    pointer-events: none;
    background-image: radial-gradient(circle, #fff 10%, transparent 10.01%);
    background-repeat: no-repeat;
    background-position: 50%;
    transform: scale(10, 10);
    opacity: 0;
    transition: transform 0.5s, opacity 1s;
  }

  .ripple-effect:active:after {
    transform: scale(0, 0);
    opacity: 0.3;
    transition: 0s;
  }

  /* Progress indicator */
  .progress-bar {
    height: 4px;
    background: linear-gradient(90deg, #22c55e var(--progress), #e5e7eb var(--progress));
    transition: background 0.3s ease;
    border-radius: 2px;
  }

  /* Floating labels */
  .floating-label {
    position: relative;
  }

  .floating-label input:placeholder-shown + label {
    opacity: 0;
    transform: translateY(0);
  }

  .floating-label input:not(:placeholder-shown) + label,
  .floating-label input:focus + label {
    opacity: 1;
    transform: translateY(-24px);
    font-size: 12px;
    color: #166534;
  }

  /* Success message animation */
  .success-message {
    animation: slideInUp 0.5s ease-out;
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
                mobile: "Mobile Number",
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
                    password: "Password must contain uppercase, lowercase, number, and special character",
                    aadhaar: "Aadhaar must be exactly 12 digits",
                    mobile: "Enter a valid 10-digit Indian mobile number",
                    mobileStart: "Mobile number cannot start with 0, 1, 2, 3, 4, or 5",
                    email: "Please enter a valid email address",
                    name: "Name is required",
                    selectAll: "Please select district, taluk, village, and panchayat"
                },
                passwordRequirements: {
                    uppercase: "Uppercase letter (A-Z)",
                    lowercase: "Lowercase letter (a-z)",
                    number: "Number (0-9)",
                    special: "Special character (!@#$%^&*)",
                    length: "At least 8 characters"
                },
                mobileHint: "Enter 10-digit mobile number (e.g., 9876543210)",
                aadhaarHint: "Stored as full 12 digits (only last 4 visible to authorities)",
                countryCode: "+91"
            },
            kn: {
                title: "ಗ್ರಾಮಸ್ಥ ನೋಂದಣಿ",
                subtitle: "ನೋಂದಣಿ ಮಾಡಿ ಮತ್ತು ಗ್ರಾಮ ಇಂಚಾರ್ಜ್ ಪರಿಶೀಲನೆಗಾಗಿ ಕಾಯಿರಿ",
                name: "ಪೂರ್ಣ ಹೆಸರು",
                email: "ಇಮೇಲ್",
                password: "ಪಾಸ್‌ವರ್ಡ್",
                mobile: "ಮೊಬೈಲ್ ಸಂಖ್ಯೆ",
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
                    mobile: "ಮಾನ್ಯ ೧೦-ಅಂಕಿಯ ಭಾರತೀಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ",
                    mobileStart: "ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ೦, ೧, ೨, ೩, ೪, ಅಥವಾ ೫ ರಿಂದ ಪ್ರಾರಂಭವಾಗುವುದಿಲ್ಲ",
                    email: "ಮಾನ್ಯ ಇಮೇಲ್ ವಿಳಾಸವನ್ನು ನಮೂದಿಸಿ",
                    name: "ಹೆಸರು ಅಗತ್ಯವಿದೆ",
                    selectAll: "ದಯವಿಟ್ಟು ಜಿಲ್ಲೆ, ತಾಲೂಕು, ಗ್ರಾಮ ಮತ್ತು ಪಂಚಾಯತ್ ಆಯ್ಕೆಮಾಡಿ"
                },
                passwordRequirements: {
                    uppercase: "ದೊಡ್ಡಕ್ಷರ (A-Z)",
                    lowercase: "ಸಣ್ಣಕ್ಷರ (a-z)",
                    number: "ಸಂಖ್ಯೆ (0-9)",
                    special: "ವಿಶೇಷ ಅಕ್ಷರ (!@#$%^&*)",
                    length: "ಕನಿಷ್ಠ ೮ ಅಕ್ಷರಗಳು"
                },
                mobileHint: "೧೦-ಅಂಕಿಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ (ಉದಾ: ೯೮೭೬೫೪೩೨೧೦)",
                aadhaarHint: "ಪೂರ್ಣ ೧೨ ಅಂಕೆಗಳಾಗಿ ಸಂಗ್ರಹಿಸಲಾಗಿದೆ (ಕೊನೆಯ ೪ ಮಾತ್ರ ಅಧಿಕಾರಿಗಳಿಗೆ ಗೋಚರಿಸುತ್ತದೆ)",
                countryCode: "+೯೧"
            },
            hi: {
                title: "ग्रामीण पंजीकरण",
                subtitle: "रजिस्टर करें और ग्राम प्रभारी के सत्यापन की प्रतीक्षा करें",
                name: "पूरा नाम",
                email: "ईमेल",
                password: "पासवर्ड",
                mobile: "मोबाइल नंबर",
                aadhaar: "आधार नंबर",
                district: "जिला",
                taluk: "तालुक",
                village: "गांव",
                panchayat: "पंचायत",
                select: "चुनें",
                loading: "लोड हो रहा है…",
                register: "रजिस्टर करें",
                registering: "रजिस्टर हो रहा है…",
                errors: {
                    fill: "कृपया सभी फ़ील्ड सही से भरें।",
                    loadLoc: "जिला/तालुक/गांव/पंचायत सूची लोड नहीं हुई।",
                    password: "पासवर्ड में अपरकेस, लोअरकेस, संख्या और विशेष वर्ण होना चाहिए",
                    aadhaar: "आधार ठीक 12 अंकों का होना चाहिए",
                    mobile: "कृपया एक वैध 10-अंकीय भारतीय मोबाइल नंबर दर्ज करें",
                    mobileStart: "मोबाइल नंबर 0, 1, 2, 3, 4, या 5 से शुरू नहीं हो सकता",
                    email: "कृपया एक वैध ईमेल पता दर्ज करें",
                    name: "नाम आवश्यक है",
                    selectAll: "कृपया जिला, तालुक, गांव और पंचायत चुनें"
                },
                passwordRequirements: {
                    uppercase: "अपरकेस अक्षर (A-Z)",
                    lowercase: "लोअरकेस अक्षर (a-z)",
                    number: "संख्या (0-9)",
                    special: "विशेष वर्ण (!@#$%^&*)",
                    length: "कम से कम 8 अक्षर"
                },
                mobileHint: "10-अंकीय मोबाइल नंबर दर्ज करें (जैसे: 9876543210)",
                aadhaarHint: "पूर्ण 12 अंकों के रूप में संग्रहीत (केवल अंतिम 4 अधिकारियों को दिखाई देते हैं)",
                countryCode: "+91"
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
    const [mobileError, setMobileError] = useState("");
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
    const [formProgress, setFormProgress] = useState(0);

    // Validate Indian mobile number
    const validateIndianMobile = (number: string): { isValid: boolean; error: string } => {
        const cleanNumber = number.replace(/\D/g, '');
        
        if (cleanNumber.length === 0) {
            return { isValid: false, error: "" };
        }
        
        if (cleanNumber.length !== 10) {
            return { isValid: false, error: t.errors.mobile };
        }
        
        // Check if it starts with valid digits (6-9)
        const firstDigit = cleanNumber.charAt(0);
        if (!/^[6-9]/.test(firstDigit)) {
            return { isValid: false, error: t.errors.mobileStart };
        }
        
        // Check if all are digits
        if (!/^\d+$/.test(cleanNumber)) {
            return { isValid: false, error: t.errors.mobile };
        }
        
        return { isValid: true, error: "" };
    };

    // Validate email
    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(email);
    };

    // Update form progress
    useEffect(() => {
        let progress = 0;
        const totalFields = 8; // name, email, password, mobile, aadhaar, district, taluk, village, panchayat
        
        if (name.trim()) progress += 1;
        if (validateEmail(email)) progress += 1;
        if (isPasswordValid()) progress += 1;
        if (validateIndianMobile(mobile).isValid) progress += 1;
        if (validateAadhaar(aadhaar)) progress += 1;
        if (districtId) progress += 1;
        if (talukId) progress += 1;
        if (villageId) progress += 1;
        if (panchayatId) progress += 1;
        
        setFormProgress((progress / totalFields) * 100);
    }, [name, email, password, mobile, aadhaar, districtId, talukId, villageId, panchayatId]);

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

    // Handle mobile change
    const handleMobileChange = (value: string) => {
        const cleanNumber = value.replace(/\D/g, '').slice(0, 10);
        setMobile(cleanNumber);
        
        const validation = validateIndianMobile(cleanNumber);
        setMobileError(validation.error);
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
            setErr(t.errors.name);
            triggerErrShake();
            return;
        }
        if (!validateEmail(email)) {
            setErr(t.errors.email);
            triggerErrShake();
            return;
        }
        if (!isPasswordValid()) {
            setErr(t.errors.password);
            triggerErrShake();
            return;
        }
        const mobileValidation = validateIndianMobile(mobile);
        if (!mobileValidation.isValid) {
            setErr(mobileValidation.error || t.errors.mobile);
            triggerErrShake();
            return;
        }
        if (!validateAadhaar(aadhaar)) {
            setErr(t.errors.aadhaar);
            triggerErrShake();
            return;
        }
        if (!districtId || !talukId || !villageId || !panchayatId) {
            setErr(t.errors.selectAll);
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
                    {/* Progress bar */}
                    <div className="w-full h-1 bg-gray-200 rounded-full mb-6 overflow-hidden">
                        <div 
                            className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-500 ease-out"
                            style={{ width: `${formProgress}%` }}
                        />
                    </div>

                    <h1 className="text-2xl font-extrabold text-green-900 header-title animate-slide-in-down">
                        {t.title}
                    </h1>
                    <p className="text-sm text-green-800/70 mt-1 header-subtitle animate-fade-in">
                        {t.subtitle}
                    </p>

                    {err && (
                        <div className={`mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 error-container ${errShake ? 'error-shake' : ''}`}>
                            {err}
                        </div>
                    )}

                    <div className="mt-6 grid gap-4 bg-white border border-green-100 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-shadow duration-300">
                        {/* Name field */}
                        <div className="form-field relative">
                            <label className="text-xs font-bold text-green-900 mb-1 block">
                                {t.name} *
                            </label>
                            <input
                                className="w-full rounded-xl border border-green-200 px-3 py-3 focus:border-green-500 transition-all"
                                placeholder={t.name}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                            {name && (
                                <span className="validation-icon valid absolute right-3 top-1/2 transform -translate-y-1/2">
                                    ✓
                                </span>
                            )}
                        </div>

                        {/* Email field */}
                        <div className="form-field relative">
                            <label className="text-xs font-bold text-green-900 mb-1 block">
                                {t.email} *
                            </label>
                            <input
                                className="w-full rounded-xl border border-green-200 px-3 py-3 focus:border-green-500 transition-all"
                                placeholder={t.email}
                                type="email"
                                inputMode="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            {email && (
                                <span className={`validation-icon absolute right-3 top-1/2 transform -translate-y-1/2 ${validateEmail(email) ? 'valid' : 'invalid'}`}>
                                    {validateEmail(email) ? '✓' : '✗'}
                                </span>
                            )}
                        </div>

                        {/* Password field */}
                        <div className="form-field">
                            <label className="text-xs font-bold text-green-900 mb-1 block">
                                {t.password} *
                            </label>
                            <div className="password-field-wrapper">
                                <input
                                    className="w-full rounded-xl border border-green-200 px-3 py-3 password-input-with-icon focus:border-green-500 transition-all"
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
                                    aria-label={showPassword ? "Hide password" : "Show password"}
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
                            <div className="mt-3 space-y-2 bg-green-50 p-3 rounded-xl">
                                <div className="flex items-center gap-2">
                                    <div className={`w-4 h-4 rounded-full transition-all duration-300 ${passwordStrength.hasUppercase ? 'bg-green-500 password-check' : 'bg-gray-300'}`}></div>
                                    <span className={`text-xs ${passwordStrength.hasUppercase ? 'text-green-700 font-medium' : 'text-gray-500'}`}>
                                        {t.passwordRequirements.uppercase}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className={`w-4 h-4 rounded-full transition-all duration-300 ${passwordStrength.hasLowercase ? 'bg-green-500 password-check' : 'bg-gray-300'}`}></div>
                                    <span className={`text-xs ${passwordStrength.hasLowercase ? 'text-green-700 font-medium' : 'text-gray-500'}`}>
                                        {t.passwordRequirements.lowercase}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className={`w-4 h-4 rounded-full transition-all duration-300 ${passwordStrength.hasNumber ? 'bg-green-500 password-check' : 'bg-gray-300'}`}></div>
                                    <span className={`text-xs ${passwordStrength.hasNumber ? 'text-green-700 font-medium' : 'text-gray-500'}`}>
                                        {t.passwordRequirements.number}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className={`w-4 h-4 rounded-full transition-all duration-300 ${passwordStrength.hasSpecialChar ? 'bg-green-500 password-check' : 'bg-gray-300'}`}></div>
                                    <span className={`text-xs ${passwordStrength.hasSpecialChar ? 'text-green-700 font-medium' : 'text-gray-500'}`}>
                                        {t.passwordRequirements.special}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className={`w-4 h-4 rounded-full transition-all duration-300 ${passwordStrength.hasMinLength ? 'bg-green-500 password-check' : 'bg-gray-300'}`}></div>
                                    <span className={`text-xs ${passwordStrength.hasMinLength ? 'text-green-700 font-medium' : 'text-gray-500'}`}>
                                        {t.passwordRequirements.length}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Mobile field with India specific validation */}
                        <div className="form-field relative">
                            <label className="text-xs font-bold text-green-900 mb-1 block">
                                {t.mobile} *
                            </label>
                            <div className="mobile-field-wrapper">
                                <span className="country-code animate-float">{t.countryCode}</span>
                                <input
                                    className="w-full rounded-xl border border-green-200 px-3 py-3 mobile-input-with-code focus:border-green-500 transition-all"
                                    placeholder="9876543210"
                                    inputMode="numeric"
                                    value={mobile}
                                    onChange={(e) => handleMobileChange(e.target.value)}
                                />
                                {mobile && (
                                    <span className={`validation-icon absolute right-3 top-1/2 transform -translate-y-1/2 ${validateIndianMobile(mobile).isValid ? 'valid' : 'invalid'}`}>
                                        {validateIndianMobile(mobile).isValid ? '✓' : '✗'}
                                    </span>
                                )}
                            </div>
                            {mobileError && (
                                <p className="text-xs text-red-600 mt-1 animate-slide-in-left">
                                    {mobileError}
                                </p>
                            )}
                            <p className="text-xs text-green-900/60 mt-1">
                                {t.mobileHint}
                            </p>
                        </div>

                        {/* Aadhaar field */}
                        <div className="form-field relative">
                            <label className="text-xs font-bold text-green-900 mb-1 block">
                                {t.aadhaar} *
                            </label>
                            <input
                                className="w-full rounded-xl border border-green-200 px-3 py-3 focus:border-green-500 transition-all"
                                placeholder="1234 5678 9012"
                                inputMode="numeric"
                                value={aadhaar.replace(/(\d{4})/g, '$1 ').trim()}
                                onChange={(e) => handleAadhaarChange(e.target.value.replace(/\s/g, ''))}
                            />
                            {aadhaar && (
                                <span className={`validation-icon absolute right-3 top-1/2 transform -translate-y-1/2 ${validateAadhaar(aadhaar) ? 'valid' : 'invalid'}`}>
                                    {validateAadhaar(aadhaar) ? '✓' : '✗'}
                                </span>
                            )}
                            <p className="text-xs text-green-900/60 mt-1">
                                {t.aadhaarHint}
                            </p>
                        </div>

                        {/* ✅ District dropdown */}
                        <div className="form-field">
                            <label className="text-xs font-bold text-green-900 mb-1 block">
                                {t.district} *
                            </label>
                            <select
                                value={districtId}
                                onChange={(e) => setDistrictId(e.target.value)}
                                className="w-full rounded-xl border border-green-200 px-3 py-3 bg-white focus:border-green-500 transition-all"
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
                            <label className="text-xs font-bold text-green-900 mb-1 block">
                                {t.taluk} *
                            </label>
                            <select
                                value={talukId}
                                onChange={(e) => setTalukId(e.target.value)}
                                disabled={!districtId || loadingLoc}
                                className="w-full rounded-xl border border-green-200 px-3 py-3 bg-white focus:border-green-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
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
                            <label className="text-xs font-bold text-green-900 mb-1 block">
                                {t.village} *
                            </label>
                            <select
                                value={villageId}
                                onChange={(e) => setVillageId(e.target.value)}
                                disabled={!talukId || loadingLoc}
                                className="w-full rounded-xl border border-green-200 px-3 py-3 bg-white focus:border-green-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
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
                            <label className="text-xs font-bold text-green-900 mb-1 block">
                                {t.panchayat} *
                            </label>
                            <select
                                value={panchayatId}
                                onChange={(e) => setPanchayatId(e.target.value)}
                                disabled={!villageId || loadingLoc || panchayats.length === 0}
                                className="w-full rounded-xl border border-green-200 px-3 py-3 bg-white focus:border-green-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                <option value="">{loadingLoc ? t.loading : t.select}</option>
                                {panchayats.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name} {p.code ? `(${p.code})` : ''}
                                    </option>
                                ))}
                            </select>
                            {panchayats.length === 0 && villageId && !loadingLoc && (
                                <p className="text-xs text-red-600 mt-1 animate-slide-in-left">
                                    No panchayats found for this village. Contact your village authority or choose a different village.
                                </p>
                            )}
                        </div>

                        {/* Register button */}
                        <button
                            disabled={loading || !isPasswordValid() || !districtId || !talukId || !villageId || !panchayatId || !validateIndianMobile(mobile).isValid || !validateEmail(email) || !validateAadhaar(aadhaar)}
                            onClick={submit}
                            className={`mt-4 rounded-2xl bg-gradient-to-r from-green-600 to-green-700 text-white font-extrabold py-4 hover:from-green-700 hover:to-green-800 active:scale-[0.98] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed relative overflow-hidden group ${loading ? 'loading-pulse' : ''}`}
                        >
                            <span className="relative z-10">
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        {t.registering}
                                    </span>
                                ) : t.register}
                            </span>
                            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                        </button>
                    </div>
                </div>
            </Screen>
        </>
    );
}
