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
    getDoc,
} from "firebase/firestore";
import { 
    FiEye, 
    FiEyeOff, 
    FiCheckCircle, 
    FiXCircle, 
    FiAlertCircle, 
    FiMail, 
    FiLock, 
    FiUser, 
    FiPhone, 
    FiMapPin, 
    FiHome, 
    FiShield, 
    FiArrowLeft,
    FiLoader,
    FiCheck,
    FiStar,
    FiHeart,
    FiSun,
    FiMoon,
    FiCloud,
    FiSmile,
    FiAward
} from "react-icons/fi";

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
  @keyframes floatIn {
    0% {
      opacity: 0;
      transform: translateY(40px) scale(0.9);
    }
    100% {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @keyframes fadeInScale {
    0% {
      opacity: 0;
      transform: scale(0.8);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes slideInBottom {
    0% {
      opacity: 0;
      transform: translateY(60px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideInLeft {
    0% {
      opacity: 0;
      transform: translateX(-60px);
    }
    100% {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes slideInRight {
    0% {
      opacity: 0;
      transform: translateX(60px);
    }
    100% {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes bounceIn {
    0% {
      opacity: 0;
      transform: scale(0.3);
    }
    50% {
      opacity: 1;
      transform: scale(1.05);
    }
    70% {
      transform: scale(0.9);
    }
    100% {
      transform: scale(1);
    }
  }

  @keyframes rotateIn {
    0% {
      opacity: 0;
      transform: rotate(-180deg) scale(0.3);
    }
    100% {
      opacity: 1;
      transform: rotate(0) scale(1);
    }
  }

  @keyframes flipIn {
    0% {
      opacity: 0;
      transform: perspective(400px) rotateX(90deg);
    }
    100% {
      opacity: 1;
      transform: perspective(400px) rotateX(0deg);
    }
  }

  @keyframes pulseGlow {
    0%, 100% {
      box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4);
    }
    50% {
      box-shadow: 0 0 20px 10px rgba(34, 197, 94, 0.2);
    }
  }

  @keyframes shimmerWave {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }

  @keyframes ripple {
    0% {
      transform: scale(0);
      opacity: 1;
    }
    100% {
      transform: scale(4);
      opacity: 0;
    }
  }

  @keyframes float {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-10px);
    }
  }

  @keyframes tilt {
    0%, 100% {
      transform: rotate(0deg);
    }
    25% {
      transform: rotate(2deg);
    }
    75% {
      transform: rotate(-2deg);
    }
  }

  @keyframes wave {
    0%, 100% {
      transform: rotate(0deg);
    }
    25% {
      transform: rotate(15deg);
    }
    75% {
      transform: rotate(-15deg);
    }
  }

  @keyframes glowPulse {
    0%, 100% {
      filter: drop-shadow(0 0 5px rgba(34, 197, 94, 0.5));
    }
    50% {
      filter: drop-shadow(0 0 20px rgba(34, 197, 94, 0.8));
    }
  }

  @keyframes gradientShift {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }

  .animate-float-in {
    animation: floatIn 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }

  .animate-fade-scale {
    animation: fadeInScale 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }

  .animate-slide-bottom {
    animation: slideInBottom 0.7s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }

  .animate-slide-left {
    animation: slideInLeft 0.7s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }

  .animate-slide-right {
    animation: slideInRight 0.7s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }

  .animate-bounce-custom {
    animation: bounceIn 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }

  .animate-rotate-custom {
    animation: rotateIn 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }

  .animate-flip-custom {
    animation: flipIn 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }

  .animate-pulse-glow {
    animation: pulseGlow 2s ease-in-out infinite;
  }

  .animate-shimmer {
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
    background-size: 200% 100%;
    animation: shimmerWave 2s infinite;
  }

  .animate-float {
    animation: float 3s ease-in-out infinite;
  }

  .animate-tilt {
    animation: tilt 4s ease-in-out infinite;
  }

  .animate-wave {
    animation: wave 2s ease-in-out infinite;
  }

  .animate-glow-pulse {
    animation: glowPulse 2s ease-in-out infinite;
  }

  .animate-gradient {
    background: linear-gradient(270deg, #22c55e, #10b981, #059669, #22c55e);
    background-size: 300% 100%;
    animation: gradientShift 6s ease infinite;
  }

  .stagger-1 { animation-delay: 0.05s; }
  .stagger-2 { animation-delay: 0.1s; }
  .stagger-3 { animation-delay: 0.15s; }
  .stagger-4 { animation-delay: 0.2s; }
  .stagger-5 { animation-delay: 0.25s; }
  .stagger-6 { animation-delay: 0.3s; }
  .stagger-7 { animation-delay: 0.35s; }
  .stagger-8 { animation-delay: 0.4s; }
  .stagger-9 { animation-delay: 0.45s; }
  .stagger-10 { animation-delay: 0.5s; }
  .stagger-11 { animation-delay: 0.55s; }
  .stagger-12 { animation-delay: 0.6s; }

  /* Enhanced Mobile Styles */
  @media (max-width: 640px) {
    .mobile-full-width {
      width: 100% !important;
      margin-left: 0 !important;
      margin-right: 0 !important;
    }
    
    .mobile-stack {
      flex-direction: column !important;
    }
    
    .mobile-text-sm {
      font-size: 0.875rem !important;
    }
    
    .mobile-p-3 {
      padding: 0.75rem !important;
    }
    
    .mobile-mb-2 {
      margin-bottom: 0.5rem !important;
    }
    
    .mobile-rounded-lg {
      border-radius: 0.5rem !important;
    }
    
    input, select, textarea {
      font-size: 16px !important; /* Prevents zoom on iOS */
      padding: 0.875rem 0.75rem !important;
      border-radius: 0.75rem !important;
    }
    
    button {
      padding: 1rem !important;
      border-radius: 0.75rem !important;
      font-size: 1rem !important;
    }
    
    h1 {
      font-size: 1.5rem !important;
      line-height: 2rem !important;
    }
    
    .glass-card {
      padding: 1.25rem !important;
      border-radius: 1.5rem !important;
    }
    
    .form-field {
      margin-bottom: 0.75rem !important;
    }
    
    .grid-cols-2 {
      grid-template-columns: 1fr !important;
    }
  }

  /* Enhanced Card Design */
  .glass-card-modern {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(34, 197, 94, 0.2);
    box-shadow: 
      0 20px 40px -15px rgba(0, 0, 0, 0.2),
      0 0 0 1px rgba(34, 197, 94, 0.1) inset;
    transition: all 0.3s ease;
  }

  .glass-card-modern:hover {
    box-shadow: 
      0 25px 50px -12px rgba(34, 197, 94, 0.25),
      0 0 0 2px rgba(34, 197, 94, 0.2) inset;
    transform: translateY(-2px);
  }

  /* Modern Input Styles */
  .input-modern {
    border: 2px solid transparent;
    background: linear-gradient(white, white) padding-box,
                linear-gradient(135deg, #22c55e, #10b981) border-box;
    transition: all 0.3s ease;
  }

  .input-modern:focus {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px -10px rgba(34, 197, 94, 0.3);
  }

  /* Ripple Effect */
  .ripple-button {
    position: relative;
    overflow: hidden;
  }

  .ripple-button::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 5px;
    height: 5px;
    background: rgba(255, 255, 255, 0.5);
    opacity: 0;
    border-radius: 100%;
    transform: scale(1, 1) translate(-50%);
    transform-origin: 50% 50%;
  }

  .ripple-button:focus:not(:active)::after {
    animation: ripple 1s ease-out;
  }

  /* Loading Skeleton */
  .skeleton {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmerWave 1.5s infinite;
  }

  /* Success Check Animation */
  .success-checkmark {
    width: 60px;
    height: 60px;
    margin: 0 auto;
  }

  .success-checkmark .check-icon {
    width: 60px;
    height: 60px;
    position: relative;
    border-radius: 50%;
    box-sizing: content-box;
    border: 4px solid #22c55e;
  }

  .success-checkmark .check-icon::before {
    top: 50%;
    left: 50%;
    height: 30px;
    width: 15px;
    border-bottom: 4px solid #22c55e;
    border-right: 4px solid #22c55e;
    content: '';
    position: absolute;
    transform: translate(-50%, -50%) rotate(45deg) scale(0);
    animation: checkBounce 0.5s ease forwards;
  }

  @keyframes checkBounce {
    0% {
      transform: translate(-50%, -50%) rotate(45deg) scale(0);
    }
    50% {
      transform: translate(-50%, -50%) rotate(45deg) scale(1.2);
    }
    100% {
      transform: translate(-50%, -50%) rotate(45deg) scale(1);
    }
  }

  /* Floating Labels */
  .floating-label-group {
    position: relative;
    margin-bottom: 1.5rem;
  }

  .floating-label-group input,
  .floating-label-group select {
    width: 100%;
    padding: 1rem 0.75rem;
    border: 2px solid #e2e8f0;
    border-radius: 0.75rem;
    outline: none;
    transition: all 0.3s ease;
  }

  .floating-label-group label {
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    background: white;
    padding: 0 0.25rem;
    color: #94a3b8;
    transition: all 0.3s ease;
    pointer-events: none;
  }

  .floating-label-group input:focus,
  .floating-label-group select:focus,
  .floating-label-group input:not(:placeholder-shown),
  .floating-label-group select:not([value=""]):not([value=""]) {
    border-color: #22c55e;
  }

  .floating-label-group input:focus ~ label,
  .floating-label-group select:focus ~ label,
  .floating-label-group input:not(:placeholder-shown) ~ label,
  .floating-label-group select:not([value=""]):not([value=""]) ~ label {
    top: 0;
    transform: translateY(-50%) scale(0.9);
    color: #22c55e;
    font-weight: 600;
  }

  /* Progress Steps */
  .progress-steps {
    display: flex;
    justify-content: space-between;
    margin-bottom: 2rem;
    position: relative;
  }

  .progress-steps::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 2px;
    background: #e2e8f0;
    transform: translateY(-50%);
    z-index: 1;
  }

  .step {
    position: relative;
    z-index: 2;
    background: white;
    padding: 0.5rem;
    border-radius: 50%;
    width: 2.5rem;
    height: 2.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid #e2e8f0;
    transition: all 0.3s ease;
  }

  .step.active {
    border-color: #22c55e;
    background: #22c55e;
    color: white;
    transform: scale(1.1);
  }

  .step.completed {
    border-color: #22c55e;
    background: #22c55e;
    color: white;
  }

  /* Toast Notifications */
  .toast {
    position: fixed;
    bottom: 2rem;
    left: 50%;
    transform: translateX(-50%) translateY(100%);
    background: white;
    padding: 1rem 2rem;
    border-radius: 9999px;
    box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.2);
    display: flex;
    align-items: center;
    gap: 0.75rem;
    z-index: 100;
    transition: transform 0.3s ease;
  }

  .toast.show {
    transform: translateX(-50%) translateY(0);
  }

  .toast.success {
    background: #22c55e;
    color: white;
  }

  .toast.error {
    background: #ef4444;
    color: white;
  }

  /* Modern Scrollbar */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb {
    background: linear-gradient(135deg, #22c55e, #10b981);
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(135deg, #16a34a, #059669);
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
                back: "Back",
                name: "Full Name",
                email: "Email",
                emailPlaceholder: "your.email@example.com",
                emailRestriction: "Only Gmail, Outlook, Yahoo, and government emails are allowed",
                password: "Password",
                passwordPlaceholder: "Enter a strong password",
                mobile: "Mobile Number",
                mobilePlaceholder: "Enter 10-digit mobile number",
                mobileHint: "Indian mobile number starting with 6,7,8, or 9",
                aadhaar: "Aadhaar Number",
                aadhaarPlaceholder: "Enter 12-digit Aadhaar",
                aadhaarHint: "Stored as full 12 digits (only last 4 visible to authorities)",
                district: "District",
                taluk: "Taluk",
                village: "Village",
                panchayat: "Panchayat",
                select: "Select",
                loading: "Loading...",
                register: "Register",
                registering: "Registering...",
                success: "Registration Successful!",
                successDesc: "Redirecting to status page...",
                passwordRequirements: "Password must contain:",
                uppercase: "At least one uppercase letter (A-Z)",
                lowercase: "At least one lowercase letter (a-z)",
                number: "At least one number (0-9)",
                specialChar: "At least one special character (!@#$%^&*)",
                minLength: "At least 8 characters long",
                allFieldsRequired: "All fields marked with * are required",
                alreadyHaveAccount: "Already have an account?",
                login: "Login",
                errors: {
                    fill: "Please fill all fields correctly.",
                    loadLoc: "Failed to load location data.",
                    password: "Please enter a valid password meeting all requirements",
                    aadhaar: "Aadhaar must be exactly 12 digits",
                    mobile: "Please enter a valid 10-digit Indian mobile number",
                    email: "Please enter a valid email address",
                    emailDomain: "Only Gmail, Outlook, Yahoo, and government emails are allowed",
                    mobileInvalid: "Mobile number must start with 6, 7, 8, or 9",
                    name: "Name is required",
                    selectLocation: "Please select all location fields",
                    emailExists: "This email is already registered",
                    networkError: "Network error. Please check your connection.",
                    permissionDenied: "Permission denied. Please check your Firebase rules.",
                },
            },
            kn: {
                title: "ಗ್ರಾಮಸ್ಥ ನೋಂದಣಿ",
                subtitle: "ನೋಂದಣಿ ಮಾಡಿ ಮತ್ತು ಗ್ರಾಮ ಇಂಚಾರ್ಜ್ ಪರಿಶೀಲನೆಗಾಗಿ ಕಾಯಿರಿ",
                back: "ಹಿಂದೆ",
                name: "ಪೂರ್ಣ ಹೆಸರು",
                email: "ಇಮೇಲ್",
                emailPlaceholder: "ನಿಮ್ಮ ಇಮೇಲ್@ಉದಾಹರಣೆ.ಕಾಂ",
                emailRestriction: "Gmail, Outlook, Yahoo ಮತ್ತು ಸರ್ಕಾರಿ ಇಮೇಲ್‌ಗಳನ್ನು ಮಾತ್ರ ಅನುಮತಿಸಲಾಗಿದೆ",
                password: "ಪಾಸ್‌ವರ್ಡ್",
                passwordPlaceholder: "ಬಲವಾದ ಪಾಸ್‌ವರ್ಡ್ ನಮೂದಿಸಿ",
                mobile: "ಮೊಬೈಲ್ ಸಂಖ್ಯೆ",
                mobilePlaceholder: "10-ಅಂಕಿಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ",
                mobileHint: "6,7,8, ಅಥವಾ 9 ರಿಂದ ಪ್ರಾರಂಭವಾಗುವ ಭಾರತೀಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ",
                aadhaar: "ಆಧಾರ್ ಸಂಖ್ಯೆ",
                aadhaarPlaceholder: "12-ಅಂಕಿಯ ಆಧಾರ್ ನಮೂದಿಸಿ",
                aadhaarHint: "ಪೂರ್ಣ 12 ಅಂಕೆಗಳಾಗಿ ಸಂಗ್ರಹಿಸಲಾಗಿದೆ (ಕೊನೆಯ 4 ಮಾತ್ರ ಅಧಿಕಾರಿಗಳಿಗೆ ಗೋಚರಿಸುತ್ತದೆ)",
                district: "ಜಿಲ್ಲೆ",
                taluk: "ತಾಲೂಕು",
                village: "ಗ್ರಾಮ",
                panchayat: "ಪಂಚಾಯತ್",
                select: "ಆಯ್ಕೆ ಮಾಡಿ",
                loading: "ಲೋಡ್ ಆಗುತ್ತಿದೆ...",
                register: "ನೋಂದಣಿ",
                registering: "ನೋಂದಣಿ ಆಗುತ್ತಿದೆ...",
                success: "ನೋಂದಣಿ ಯಶಸ್ವಿಯಾಗಿದೆ!",
                successDesc: "ಸ್ಥಿತಿ ಪುಟಕ್ಕೆ ಮರುನಿರ್ದೇಶಿಸಲಾಗುತ್ತಿದೆ...",
                passwordRequirements: "ಪಾಸ್‌ವರ್ಡ್ ಹೊಂದಿರಬೇಕು:",
                uppercase: "ಕನಿಷ್ಠ ಒಂದು ದೊಡ್ಡ ಅಕ್ಷರ (A-Z)",
                lowercase: "ಕನಿಷ್ಠ ಒಂದು ಸಣ್ಣ ಅಕ್ಷರ (a-z)",
                number: "ಕನಿಷ್ಠ ಒಂದು ಸಂಖ್ಯೆ (0-9)",
                specialChar: "ಕನಿಷ್ಠ ಒಂದು ವಿಶೇಷ ಅಕ್ಷರ (!@#$%^&*)",
                minLength: "ಕನಿಷ್ಠ 8 ಅಕ್ಷರಗಳು",
                allFieldsRequired: "* ಗುರುತಿಸಲಾದ ಎಲ್ಲಾ ಕ್ಷೇತ್ರಗಳು ಅಗತ್ಯವಿದೆ",
                alreadyHaveAccount: "ಈಗಾಗಲೇ ಖಾತೆ ಹೊಂದಿದ್ದೀರಾ?",
                login: "ಲಾಗಿನ್",
                errors: {
                    fill: "ದಯವಿಟ್ಟು ಎಲ್ಲಾ ಕ್ಷೇತ್ರಗಳನ್ನು ಸರಿಯಾಗಿ ಭರ್ತಿ ಮಾಡಿ.",
                    loadLoc: "ಸ್ಥಳ ಡೇಟಾವನ್ನು ಲೋಡ್ ಮಾಡಲು ವಿಫಲವಾಗಿದೆ.",
                    password: "ದಯವಿಟ್ಟು ಎಲ್ಲಾ ಅವಶ್ಯಕತೆಗಳನ್ನು ಪೂರೈಸುವ ಮಾನ್ಯ ಪಾಸ್‌ವರ್ಡ್ ನಮೂದಿಸಿ",
                    aadhaar: "ಆಧಾರ್ ನಿಖರವಾಗಿ 12 ಅಂಕೆಗಳಾಗಿರಬೇಕು",
                    mobile: "ದಯವಿಟ್ಟು ಮಾನ್ಯ 10-ಅಂಕಿಯ ಭಾರತೀಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ",
                    email: "ದಯವಿಟ್ಟು ಮಾನ್ಯ ಇಮೇಲ್ ವಿಳಾಸವನ್ನು ನಮೂದಿಸಿ",
                    emailDomain: "Gmail, Outlook, Yahoo ಮತ್ತು ಸರ್ಕಾರಿ ಇಮೇಲ್‌ಗಳನ್ನು ಮಾತ್ರ ಅನುಮತಿಸಲಾಗಿದೆ",
                    mobileInvalid: "ಮೊಬೈಲ್ ಸಂಖ್ಯೆ 6, 7, 8 ಅಥವಾ 9 ರಿಂದ ಪ್ರಾರಂಭವಾಗಬೇಕು",
                    name: "ಹೆಸರು ಅಗತ್ಯವಿದೆ",
                    selectLocation: "ದಯವಿಟ್ಟು ಎಲ್ಲಾ ಸ್ಥಳ ಕ್ಷೇತ್ರಗಳನ್ನು ಆಯ್ಕೆಮಾಡಿ",
                    emailExists: "ಈ ಇಮೇಲ್ ಈಗಾಗಲೇ ನೋಂದಾಯಿಸಲಾಗಿದೆ",
                    networkError: "ನೆಟ್‌ವರ್ಕ್ ದೋಷ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ಸಂಪರ್ಕವನ್ನು ಪರಿಶೀಲಿಸಿ.",
                    permissionDenied: "ಅನುಮತಿ ನಿರಾಕರಿಸಲಾಗಿದೆ. ದಯವಿಟ್ಟು ನಿಮ್ಮ Firebase ನಿಯಮಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.",
                },
            },
            hi: {
                title: "ग्रामीण पंजीकरण",
                subtitle: "रजिस्टर करें और ग्राम इंचार्ज सत्यापन की प्रतीक्षा करें",
                back: "वापस",
                name: "पूरा नाम",
                email: "ईमेल",
                emailPlaceholder: "आपका.ईमेल@उदाहरण.कॉम",
                emailRestriction: "केवल Gmail, Outlook, Yahoo और सरकारी ईमेल की अनुमति है",
                password: "पासवर्ड",
                passwordPlaceholder: "मजबूत पासवर्ड दर्ज करें",
                mobile: "मोबाइल नंबर",
                mobilePlaceholder: "10-अंकीय मोबाइल नंबर दर्ज करें",
                mobileHint: "6,7,8, या 9 से शुरू होने वाला भारतीय मोबाइल नंबर",
                aadhaar: "आधार नंबर",
                aadhaarPlaceholder: "12-अंकीय आधार दर्ज करें",
                aadhaarHint: "पूर्ण 12 अंकों के रूप में संग्रहीत (केवल अंतिम 4 अधिकारियों को दिखाई देते हैं)",
                district: "जिला",
                taluk: "तालुक",
                village: "गांव",
                panchayat: "पंचायत",
                select: "चुनें",
                loading: "लोड हो रहा है...",
                register: "रजिस्टर",
                registering: "रजिस्टर हो रहा है...",
                success: "पंजीकरण सफल!",
                successDesc: "स्थिति पृष्ठ पर पुनर्निर्देशित किया जा रहा है...",
                passwordRequirements: "पासवर्ड में शामिल होना चाहिए:",
                uppercase: "कम से कम एक बड़ा अक्षर (A-Z)",
                lowercase: "कम से कम एक छोटा अक्षर (a-z)",
                number: "कम से कम एक संख्या (0-9)",
                specialChar: "कम से कम एक विशेष वर्ण (!@#$%^&*)",
                minLength: "कम से कम 8 अक्षर लंबा",
                allFieldsRequired: "* चिह्नित सभी फ़ील्ड आवश्यक हैं",
                alreadyHaveAccount: "पहले से ही खाता है?",
                login: "लॉगिन",
                errors: {
                    fill: "कृपया सभी फ़ील्ड सही से भरें।",
                    loadLoc: "स्थान डेटा लोड करने में विफल।",
                    password: "कृपया सभी आवश्यकताओं को पूरा करने वाला मान्य पासवर्ड दर्ज करें",
                    aadhaar: "आधार ठीक 12 अंकों का होना चाहिए",
                    mobile: "कृपया मान्य 10-अंकीय भारतीय मोबाइल नंबर दर्ज करें",
                    email: "कृपया मान्य ईमेल पता दर्ज करें",
                    emailDomain: "केवल Gmail, Outlook, Yahoo और सरकारी ईमेल की अनुमति है",
                    mobileInvalid: "मोबाइल नंबर 6, 7, 8 या 9 से शुरू होना चाहिए",
                    name: "नाम आवश्यक है",
                    selectLocation: "कृपया सभी स्थान फ़ील्ड चुनें",
                    emailExists: "यह ईमेल पहले से पंजीकृत है",
                    networkError: "नेटवर्क त्रुटि। कृपया अपना कनेक्शन जांचें।",
                    permissionDenied: "अनुमति अस्वीकृत। कृपया अपने Firebase नियमों की जाँच करें।",
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
    const [errShake, setErrShake] = useState(false);
    const [touched, setTouched] = useState({
        name: false,
        email: false,
        password: false,
        mobile: false,
        aadhaar: false,
    });

    // Validation states
    const [emailValid, setEmailValid] = useState<boolean | null>(null);
    const [mobileValid, setMobileValid] = useState<boolean | null>(null);
    const [emailChecking, setEmailChecking] = useState(false);

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

    // Validate Indian mobile number
    const validateIndianMobile = (mobile: string): boolean => {
        const cleanMobile = mobile.replace(/\D/g, '');
        if (cleanMobile.length !== 10) return false;
        
        // Indian mobile numbers start with 6,7,8,9
        const firstDigit = cleanMobile.charAt(0);
        return ['6', '7', '8', '9'].includes(firstDigit);
    };

    // Check email availability with better error handling
    const checkEmailAvailability = async (email: string) => {
        if (!validateEmail(email)) return;
        
        setEmailChecking(true);
        try {
            // Check in users collection
            const usersQuery = query(
                collection(db, "users"),
                where("email", "==", email),
                limit(1)
            );
            const usersSnapshot = await getDocs(usersQuery);
            
            // Check in villagers collection
            const villagersQuery = query(
                collection(db, "villagers"),
                where("email", "==", email),
                limit(1)
            );
            const villagersSnapshot = await getDocs(villagersQuery);
            
            // Check in authorities collection
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
        } catch (error: any) {
            console.error("Error checking email:", error);
            if (error.code === 'permission-denied') {
                // If permission denied, we'll assume email is available
                setEmailValid(true);
            } else {
                setEmailValid(null);
            }
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
        return Object.values(passwordStrength).every(Boolean);
    };

    // Validate Aadhaar
    const validateAadhaar = (aadhaar: string): boolean => {
        const cleanAadhaar = aadhaar.replace(/\D/g, '');
        return cleanAadhaar.length === 12 && /^\d+$/.test(cleanAadhaar);
    };

    // Handle Aadhaar change
    const handleAadhaarChange = (value: string) => {
        const cleaned = value.replace(/\D/g, '').slice(0, 12);
        setAadhaar(cleaned);
        if (touched.aadhaar) {
            setTouched(prev => ({ ...prev, aadhaar: true }));
        }
    };

    // Handle mobile change
    const handleMobileChange = (value: string) => {
        const cleaned = value.replace(/\D/g, '').slice(0, 10);
        setMobile(cleaned);
        setMobileValid(validateIndianMobile(cleaned));
        if (touched.mobile) {
            setTouched(prev => ({ ...prev, mobile: true }));
        }
    };

    const triggerErrShake = () => {
        setErrShake(true);
        setTimeout(() => setErrShake(false), 500);
    };

    // Load districts with retry logic
    const loadDistricts = async (retryCount = 0) => {
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
            if (e.code === 'permission-denied' && retryCount < 3) {
                // Retry up to 3 times for permission denied
                setTimeout(() => loadDistricts(retryCount + 1), 1000 * (retryCount + 1));
            } else {
                setErr(e?.message || t.errors.loadLoc);
                triggerErrShake();
            }
        } finally {
            setLoadingLoc(false);
        }
    };

    useEffect(() => {
        loadDistricts();
    }, []);

    // Load taluks when district changes
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

                // Reset downstream selections
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
    }, [districtId]);

    // Load villages when taluk changes
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

                // Reset downstream selections
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
    }, [talukId, districtId]);

    // Load panchayats when village changes
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

    const submit = async () => {
        setErr("");

        // Validate all fields
        if (!name.trim()) {
            setErr(t.errors.name);
            setTouched(prev => ({ ...prev, name: true }));
            triggerErrShake();
            return;
        }

        if (!validateEmail(email)) {
            setErr(t.errors.emailDomain);
            setTouched(prev => ({ ...prev, email: true }));
            triggerErrShake();
            return;
        }

        if (!emailValid) {
            setErr(t.errors.emailExists);
            triggerErrShake();
            return;
        }

        if (!isPasswordValid()) {
            setErr(t.errors.password);
            setTouched(prev => ({ ...prev, password: true }));
            triggerErrShake();
            return;
        }

        if (!validateIndianMobile(mobile)) {
            setErr(t.errors.mobile);
            setTouched(prev => ({ ...prev, mobile: true }));
            triggerErrShake();
            return;
        }

        if (!validateAadhaar(aadhaar)) {
            setErr(t.errors.aadhaar);
            setTouched(prev => ({ ...prev, aadhaar: true }));
            triggerErrShake();
            return;
        }

        if (!districtId || !talukId || !villageId || !panchayatId) {
            setErr(t.errors.selectLocation);
            triggerErrShake();
            return;
        }

        try {
            setLoading(true);

            // Create auth user
            const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);

            // Resolve readable names
            const districtName = districts.find((d) => d.id === districtId)?.name || "";
            const talukName = taluks.find((x) => x.id === talukId)?.name || "";
            const villageName = villages.find((v) => v.id === villageId)?.name || "";
            const panchayat = panchayats.find((p) => p.id === panchayatId);
            const panchayatName = panchayat?.name || "";
            const panchayatCode = panchayat?.code || "";

            // Create villager profile
            const villagerData = {
                uid: cred.user.uid,
                name: name.trim(),
                email: email.trim().toLowerCase(),
                mobile: mobile,
                aadhaar: aadhaar,
                aadhaarLast4: aadhaar.slice(-4),
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

            // Create user document
            await setDoc(doc(db, "users", cred.user.uid), {
                uid: cred.user.uid,
                name: name.trim(),
                email: email.trim().toLowerCase(),
                role: "villager",
                panchayatId: panchayatId,
                districtId: districtId,
                talukId: talukId,
                villageId: villageId,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            // Show success and redirect
            setSuccess(true);
            setTimeout(() => {
                router.replace(`/${locale}/villager/status`);
            }, 2000);

        } catch (e: any) {
            console.error("VILLAGER REGISTER ERROR:", e);
            
            if (e.code === "auth/email-already-in-use") {
                setErr(t.errors.emailExists);
            } else if (e.code === "auth/invalid-email") {
                setErr(t.errors.email);
            } else if (e.code === "auth/weak-password") {
                setErr(t.errors.password);
            } else if (e.code === "auth/network-request-failed") {
                setErr(t.errors.networkError);
            } else if (e.code === "permission-denied") {
                setErr(t.errors.permissionDenied);
            } else if (e.message) {
                setErr(e.message);
            } else {
                setErr(t.errors.fill);
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
                <div className="min-h-screen bg-gradient-to-br from-green-400 via-emerald-400 to-teal-400 mobile-full-width">
                    {/* Animated Background Elements */}
                    <div className="fixed inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute top-0 left-0 w-64 h-64 bg-green-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float"></div>
                        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float stagger-2"></div>
                        <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float stagger-4"></div>
                        <div className="absolute bottom-0 right-0 w-72 h-72 bg-green-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float stagger-6"></div>
                    </div>

                    <div className="max-w-2xl mx-auto px-3 sm:px-4 relative z-10">
                        {/* Back Button with New Animation */}
                        <button
                            onClick={() => router.back()}
                            className="mb-4 flex items-center gap-2 text-white hover:text-green-100 transition-all hover:-translate-x-2 animate-slide-left"
                            aria-label={t.back}
                        >
                            <FiArrowLeft className="w-5 h-5" />
                            <span className="text-sm font-medium drop-shadow-lg">{t.back}</span>
                        </button>

                        {/* Header with New Animation */}
                        <div className="text-center mb-6 sm:mb-8 animate-float-in">
                            <div className="inline-flex items-center justify-center p-3 sm:p-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mb-3 sm:mb-4 shadow-xl animate-bounce-custom">
                                <FiAward className="w-6 h-6 sm:w-8 sm:h-8 text-white animate-glow-pulse" />
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 drop-shadow-lg">{t.title}</h1>
                            <p className="text-sm sm:text-base text-green-50 drop-shadow-md">{t.subtitle}</p>
                            <p className="text-xs text-green-100/80 mt-2 animate-pulse">{t.allFieldsRequired}</p>
                        </div>

                        {/* Success Message with New Animation */}
                        {success && (
                            <div className="mb-6 p-4 sm:p-6 rounded-3xl bg-gradient-to-r from-green-500 to-emerald-500 shadow-2xl animate-bounce-custom">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white rounded-full success-checkmark">
                                        <div className="check-icon"></div>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-lg">{t.success}</h3>
                                        <p className="text-sm text-green-50">{t.successDesc}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Error Message with New Animation */}
                        {err && !success && (
                            <div className={`mb-6 p-4 rounded-2xl bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-2xl animate-slide-bottom ${errShake ? 'animate-shake' : ''}`}>
                                <div className="flex items-center gap-3">
                                    <FiAlertCircle className="w-5 h-5 flex-shrink-0" />
                                    <p className="text-sm font-medium">{err}</p>
                                </div>
                            </div>
                        )}

                        {/* Registration Form with New Design */}
                        {!success && (
                            <div className="glass-card-modern rounded-3xl sm:rounded-4xl p-4 sm:p-6 space-y-4 sm:space-y-6 animate-scale-in">
                                {/* Progress Indicator */}
                                <div className="progress-steps mb-8">
                                    <div className="step completed stagger-1">
                                        <FiUser className="w-4 h-4" />
                                    </div>
                                    <div className="step active stagger-2">
                                        <FiMail className="w-4 h-4" />
                                    </div>
                                    <div className="step stagger-3">
                                        <FiLock className="w-4 h-4" />
                                    </div>
                                    <div className="step stagger-4">
                                        <FiPhone className="w-4 h-4" />
                                    </div>
                                    <div className="step stagger-5">
                                        <FiHome className="w-4 h-4" />
                                    </div>
                                </div>

                                {/* Name */}
                                <div className="floating-label-group stagger-1">
                                    <input
                                        type="text"
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        onBlur={() => setTouched(prev => ({ ...prev, name: true }))}
                                        placeholder=" "
                                        className={`input-modern w-full ${
                                            touched.name && !name.trim() ? 'border-red-300' : ''
                                        }`}
                                        disabled={loading}
                                    />
                                    <label htmlFor="name">
                                        <FiUser className="inline mr-1" /> {t.name} *
                                    </label>
                                    {touched.name && !name.trim() && (
                                        <p className="text-xs text-red-600 mt-1 animate-slide-left">{t.errors.name}</p>
                                    )}
                                </div>

                                {/* Email */}
                                <div className="floating-label-group stagger-2">
                                    <input
                                        type="email"
                                        id="email"
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            setEmailValid(null);
                                        }}
                                        onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
                                        placeholder=" "
                                        className={`input-modern w-full pr-10 ${
                                            touched.email && email && !validateEmail(email)
                                                ? 'border-red-300'
                                                : emailValid === true
                                                ? 'border-green-500'
                                                : emailValid === false
                                                ? 'border-red-500'
                                                : ''
                                        }`}
                                        disabled={loading}
                                    />
                                    <label htmlFor="email">
                                        <FiMail className="inline mr-1" /> {t.email} *
                                    </label>
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                        {emailChecking && (
                                            <FiLoader className="w-5 h-5 text-green-500 animate-spin" />
                                        )}
                                        {!emailChecking && emailValid === true && (
                                            <FiCheck className="w-5 h-5 text-green-500 animate-bounce-custom" />
                                        )}
                                        {!emailChecking && emailValid === false && (
                                            <FiXCircle className="w-5 h-5 text-red-500" />
                                        )}
                                    </div>
                                    <p className="text-xs text-green-700/70 mt-1">{t.emailRestriction}</p>
                                    {touched.email && email && !validateEmail(email) && (
                                        <p className="text-xs text-red-600 mt-1">{t.errors.emailDomain}</p>
                                    )}
                                </div>

                                {/* Password */}
                                <div className="floating-label-group stagger-3">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        id="password"
                                        value={password}
                                        onChange={(e) => handlePasswordChange(e.target.value)}
                                        onBlur={() => setTouched(prev => ({ ...prev, password: true }))}
                                        placeholder=" "
                                        className={`input-modern w-full pr-10 ${
                                            touched.password && !isPasswordValid()
                                                ? 'border-red-300'
                                                : password && isPasswordValid()
                                                ? 'border-green-500'
                                                : ''
                                        }`}
                                        disabled={loading}
                                    />
                                    <label htmlFor="password">
                                        <FiLock className="inline mr-1" /> {t.password} *
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-700 hover:text-green-800"
                                    >
                                        {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                                    </button>

                                    {/* Password strength indicator */}
                                    {password && (
                                        <div className="mt-3 space-y-2 animate-slide-bottom">
                                            <p className="text-xs font-semibold text-green-800">{t.passwordRequirements}</p>
                                            <div className="flex gap-1 h-2">
                                                {Object.values(passwordStrength).map((valid, index) => (
                                                    <div
                                                        key={index}
                                                        className={`flex-1 rounded-full transition-all duration-300 ${
                                                            valid ? 'bg-green-500' : 'bg-gray-200'
                                                        }`}
                                                    ></div>
                                                ))}
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {[
                                                    { key: 'hasUppercase', text: t.uppercase },
                                                    { key: 'hasLowercase', text: t.lowercase },
                                                    { key: 'hasNumber', text: t.number },
                                                    { key: 'hasSpecialChar', text: t.specialChar },
                                                    { key: 'hasMinLength', text: t.minLength },
                                                ].map((item, index) => (
                                                    <div key={index} className="flex items-center gap-1">
                                                        {passwordStrength[item.key as keyof typeof passwordStrength] ? (
                                                            <FiCheck className="text-green-500 w-3 h-3 animate-bounce-custom" />
                                                        ) : (
                                                            <FiXCircle className="text-gray-300 w-3 h-3" />
                                                        )}
                                                        <span className={`text-xs ${
                                                            passwordStrength[item.key as keyof typeof passwordStrength] 
                                                                ? 'text-green-700' 
                                                                : 'text-gray-500'
                                                        }`}>
                                                            {item.text}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Mobile */}
                                <div className="floating-label-group stagger-4">
                                    <input
                                        type="tel"
                                        id="mobile"
                                        value={mobile}
                                        onChange={(e) => handleMobileChange(e.target.value)}
                                        onBlur={() => setTouched(prev => ({ ...prev, mobile: true }))}
                                        placeholder=" "
                                        className={`input-modern w-full pr-10 ${
                                            touched.mobile && mobile && !validateIndianMobile(mobile)
                                                ? 'border-red-300'
                                                : mobileValid === true
                                                ? 'border-green-500'
                                                : ''
                                        }`}
                                        maxLength={10}
                                        disabled={loading}
                                    />
                                    <label htmlFor="mobile">
                                        <FiPhone className="inline mr-1" /> {t.mobile} *
                                    </label>
                                    {mobileValid === true && (
                                        <FiCheck className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 w-5 h-5 animate-bounce-custom" />
                                    )}
                                    <p className="text-xs text-green-700/70 mt-1">{t.mobileHint}</p>
                                    {touched.mobile && mobile && !validateIndianMobile(mobile) && (
                                        <p className="text-xs text-red-600 mt-1">{t.errors.mobileInvalid}</p>
                                    )}
                                </div>

                                {/* Aadhaar */}
                                <div className="floating-label-group stagger-5">
                                    <input
                                        type="text"
                                        id="aadhaar"
                                        value={aadhaar}
                                        onChange={(e) => handleAadhaarChange(e.target.value)}
                                        onBlur={() => setTouched(prev => ({ ...prev, aadhaar: true }))}
                                        placeholder=" "
                                        className={`input-modern w-full ${
                                            touched.aadhaar && aadhaar && !validateAadhaar(aadhaar)
                                                ? 'border-red-300'
                                                : aadhaar && validateAadhaar(aadhaar)
                                                ? 'border-green-500'
                                                : ''
                                        }`}
                                        maxLength={12}
                                        disabled={loading}
                                    />
                                    <label htmlFor="aadhaar">
                                        <FiStar className="inline mr-1" /> {t.aadhaar} *
                                    </label>
                                    <p className="text-xs text-green-700/70 mt-1">{t.aadhaarHint}</p>
                                </div>

                                {/* District */}
                                <div className="floating-label-group stagger-6">
                                    <select
                                        id="district"
                                        value={districtId}
                                        onChange={(e) => setDistrictId(e.target.value)}
                                        className="input-modern w-full"
                                        disabled={loadingLoc || loading}
                                    >
                                        <option value="" disabled></option>
                                        {districts.map((d) => (
                                            <option key={d.id} value={d.id}>
                                                {d.name}
                                            </option>
                                        ))}
                                    </select>
                                    <label htmlFor="district">
                                        <FiMapPin className="inline mr-1" /> {t.district} *
                                    </label>
                                </div>

                                {/* Taluk */}
                                <div className="floating-label-group stagger-7">
                                    <select
                                        id="taluk"
                                        value={talukId}
                                        onChange={(e) => setTalukId(e.target.value)}
                                        className="input-modern w-full"
                                        disabled={!districtId || loadingLoc || loading}
                                    >
                                        <option value="" disabled></option>
                                        {taluks.map((x) => (
                                            <option key={x.id} value={x.id}>
                                                {x.name}
                                            </option>
                                        ))}
                                    </select>
                                    <label htmlFor="taluk">
                                        <FiMapPin className="inline mr-1" /> {t.taluk} *
                                    </label>
                                </div>

                                {/* Village */}
                                <div className="floating-label-group stagger-8">
                                    <select
                                        id="village"
                                        value={villageId}
                                        onChange={(e) => setVillageId(e.target.value)}
                                        className="input-modern w-full"
                                        disabled={!talukId || loadingLoc || loading}
                                    >
                                        <option value="" disabled></option>
                                        {villages.map((v) => (
                                            <option key={v.id} value={v.id}>
                                                {v.name}
                                            </option>
                                        ))}
                                    </select>
                                    <label htmlFor="village">
                                        <FiHome className="inline mr-1" /> {t.village} *
                                    </label>
                                </div>

                                {/* Panchayat */}
                                <div className="floating-label-group stagger-9">
                                    <select
                                        id="panchayat"
                                        value={panchayatId}
                                        onChange={(e) => setPanchayatId(e.target.value)}
                                        className="input-modern w-full"
                                        disabled={!villageId || loadingLoc || loading || panchayats.length === 0}
                                    >
                                        <option value="" disabled></option>
                                        {panchayats.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.name} {p.code ? `(${p.code})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                    <label htmlFor="panchayat">
                                        <FiHome className="inline mr-1" /> {t.panchayat} *
                                    </label>
                                    {panchayats.length === 0 && villageId && !loadingLoc && (
                                        <p className="text-xs text-amber-600 mt-1 animate-pulse">
                                            No panchayats found for this village. Please contact your village authority.
                                        </p>
                                    )}
                                </div>

                                {/* Register Button */}
                                <button
                                    onClick={submit}
                                    disabled={
                                        loading || 
                                        !isPasswordValid() || 
                                        !validateIndianMobile(mobile) ||
                                        !validateAadhaar(aadhaar) ||
                                        !validateEmail(email) ||
                                        !emailValid ||
                                        !districtId || 
                                        !talukId || 
                                        !villageId || 
                                        !panchayatId ||
                                        !name.trim()
                                    }
                                    className={`stagger-10 w-full rounded-2xl animate-gradient text-white font-bold py-4 sm:py-5 text-sm sm:text-base shadow-2xl hover:shadow-3xl transition-all disabled:opacity-60 disabled:cursor-not-allowed ripple-button relative overflow-hidden ${
                                        loading ? 'opacity-80' : ''
                                    }`}
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <FiLoader className="w-5 h-5 animate-spin" />
                                            {t.registering}
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center gap-2">
                                            <FiHeart className="w-5 h-5 animate-pulse" />
                                            {t.register}
                                            <FiSun className="w-5 h-5 animate-spin-slow" />
                                        </span>
                                    )}
                                </button>

                                {/* Login Link */}
                                <div className="text-center pt-4 border-t border-green-100/30 stagger-11">
                                    <p className="text-sm text-green-800">
                                        {t.alreadyHaveAccount}{" "}
                                        <button
                                            onClick={() => router.push(`/${locale}/villager/login`)}
                                            className="font-bold text-green-700 hover:text-green-800 underline decoration-2 decoration-green-300 hover:decoration-green-500 transition-all hover:scale-105 inline-flex items-center gap-1"
                                            disabled={loading}
                                        >
                                            {t.login}
                                            <FiSmile className="w-4 h-4 animate-wave" />
                                        </button>
                                    </p>
                                </div>

                                {/* Decorative Elements */}
                                <div className="flex justify-center gap-2 mt-4 stagger-12">
                                    <FiStar className="text-green-400 animate-float" />
                                    <FiHeart className="text-green-500 animate-float stagger-2" />
                                    <FiSun className="text-yellow-500 animate-float stagger-4" />
                                    <FiMoon className="text-green-600 animate-float stagger-6" />
                                    <FiCloud className="text-green-400 animate-float stagger-8" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </Screen>
        </>
    );
}
