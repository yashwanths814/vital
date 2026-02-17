"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth, db } from "../../../lib/firebase";
import { 
  setDoc,
  doc, 
  collection, 
  serverTimestamp, 
  getDoc, 
  getDocs,
  query,
  where,
  orderBy,
  addDoc
} from "firebase/firestore";
import Screen from "../../../components/Screen";
import { 
  FiCamera, 
  FiMapPin, 
  FiUpload, 
  FiCheck, 
  FiAlertCircle,
  FiArrowLeft,
  FiChevronRight,
  FiHome,
  FiList,
  FiTrendingUp,
  FiUser,
  FiPlus,
  FiX,
  FiLoader,
  FiImage,
  FiNavigation
} from "react-icons/fi";
import { MdLocationPin, MdTitle, MdDescription, MdPhotoCamera } from "react-icons/md";

type Locale = "en" | "kn" | "hi";

/* ---------- image helpers ---------- */
function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

async function compressToJpegDataUrl(file: File, maxW = 1000, quality = 0.7) {
  const dataUrl = await fileToDataUrl(file);

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = dataUrl;
  });

  const scale = Math.min(1, maxW / img.width);
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, w, h);

  return canvas.toDataURL("image/jpeg", quality);
}

// Location types
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

// Karnataka Districts with emojis
const KARNATAKA_DISTRICTS = [
  { id: "01", name: "Bangalore Urban", emoji: "🏙️" },
  { id: "02", name: "Bangalore Rural", emoji: "🌳" },
  { id: "03", name: "Mysuru", emoji: "🏰" },
  { id: "04", name: "Belagavi", emoji: "🕌" },
  { id: "05", name: "Tumakuru", emoji: "🌵" },
  { id: "06", name: "Dakshina Kannada", emoji: "🏖️" },
  { id: "07", name: "Uttara Kannada", emoji: "🌲" },
  { id: "08", name: "Kalaburagi", emoji: "🏜️" },
  { id: "09", name: "Ballari", emoji: "⛏️" },
  { id: "10", name: "Dharwad", emoji: "🎓" },
  { id: "11", name: "Shivamogga", emoji: "🌊" },
  { id: "12", name: "Hassan", emoji: "🕌" },
  { id: "13", name: "Mandya", emoji: "🍯" },
  { id: "14", name: "Kolar", emoji: "🥇" },
  { id: "15", name: "Chitradurga", emoji: "🏰" },
  { id: "16", name: "Raichur", emoji: "🛕" },
  { id: "17", name: "Bagalkote", emoji: "🏺" },
  { id: "18", name: "Vijayapura", emoji: "🕌" },
  { id: "19", name: "Chikkamagaluru", emoji: "🌿" },
  { id: "20", name: "Koppal", emoji: "⛰️" },
  { id: "21", name: "Udupi", emoji: "🌅" },
  { id: "22", name: "Yadgir", emoji: "🏞️" },
  { id: "23", name: "Ramanagara", emoji: "🎬" },
  { id: "24", name: "Chikkaballapura", emoji: "🏞️" },
  { id: "25", name: "Gadag", emoji: "🏺" },
  { id: "26", name: "Bidar", emoji: "🕌" },
  { id: "27", name: "Haveri", emoji: "🌾" },
  { id: "28", name: "Kodagu", emoji: "🌄" },
  { id: "29", name: "Chamarajanagara", emoji: "🌳" },
  { id: "30", name: "Davangere", emoji: "🏭" }
];

// Issue Categories with SLA
const ISSUE_CATEGORIES = [
  { 
    id: "RD", 
    name: "Road Damage", 
    emoji: "🛣️", 
    sla: 30,
    priority: "Medium",
    titles: ["Potholes on main road", "Road blocked by debris", "Broken bridge/culvert", "Damaged speed breaker", "Custom Title"],
    icon: "🛣️"
  },
  { 
    id: "WS", 
    name: "Water Supply", 
    emoji: "💧", 
    sla: 7,
    priority: "High",
    titles: ["No water supply", "Water leakage", "Low water pressure", "Contaminated water", "Custom Title"],
    icon: "💧"
  },
  { 
    id: "EL", 
    name: "Electricity", 
    emoji: "⚡", 
    sla: 3,
    priority: "High",
    titles: ["Power outage", "Loose wire/sparking", "Transformer issue", "Voltage fluctuation", "Custom Title"],
    icon: "⚡"
  },
  { 
    id: "SN", 
    name: "Sanitation", 
    emoji: "🚮", 
    sla: 7,
    priority: "Medium",
    titles: ["Garbage not collected", "Overflowing bins", "Public toilet issue", "Bad smell in area", "Custom Title"],
    icon: "🚮"
  },
  { 
    id: "HC", 
    name: "Healthcare", 
    emoji: "🏥", 
    sla: 14,
    priority: "High",
    titles: ["PHC closed/unavailable", "Ambulance needed", "Medicine shortage", "Staff unavailable", "Custom Title"],
    icon: "🏥"
  },
  { 
    id: "ED", 
    name: "Education", 
    emoji: "🎓", 
    sla: 21,
    priority: "Medium",
    titles: ["School facility issue", "No teacher present", "Water/toilet problem", "Classroom damage", "Custom Title"],
    icon: "🎓"
  },
  { 
    id: "SL", 
    name: "Street Light", 
    emoji: "💡", 
    sla: 5,
    priority: "Medium",
    titles: ["Streetlight not working", "Flickering light", "Pole damaged", "New streetlight needed", "Custom Title"],
    icon: "💡"
  },
  { 
    id: "DR", 
    name: "Drainage", 
    emoji: "🌊", 
    sla: 14,
    priority: "Medium",
    titles: ["Drain clogged", "Waterlogging", "Sewage overflow", "Mosquito breeding", "Custom Title"],
    icon: "🌊"
  },
  { 
    id: "OT", 
    name: "Other", 
    emoji: "📋", 
    sla: 14,
    priority: "Low",
    titles: ["General public issue", "Safety concern", "Government service issue", "Other", "Custom Title"],
    icon: "📋"
  }
];

// Generate unique Issue ID
function generateIssueId(panchayatCode: string, categoryId: string, issueCount: number): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const sequence = (issueCount + 1).toString().padStart(4, '0');
  return `${panchayatCode.slice(0, 4).toUpperCase()}${year}${month}${day}${categoryId}${sequence}`;
}

// GPS detection function
async function getCurrentLocation(): Promise<{latitude: number; longitude: number; accuracy: number}> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        reject(new Error(`Location error: ${error.message}`));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
}

export default function RaiseIssuePage() {
  const router = useRouter();
  const params = useParams() as { locale?: string };
  const locale = (params?.locale || "en") as Locale;

  const [currentStep, setCurrentStep] = useState(1);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Step 1: Location
  const [districtId, setDistrictId] = useState("");
  const [talukId, setTalukId] = useState("");
  const [villageId, setVillageId] = useState("");
  const [panchayatId, setPanchayatId] = useState("");
  const [specificLocation, setSpecificLocation] = useState("");
  
  // Step 2: Category
  const [category, setCategory] = useState("");
  const [selectedTitle, setSelectedTitle] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  
  // Step 3: Description
  const [description, setDescription] = useState("");
  
  // Step 4: GPS
  const [coordinates, setCoordinates] = useState<{latitude: number; longitude: number; accuracy: number} | null>(null);
  const [fetchingGPS, setFetchingGPS] = useState(false);
  const [gpsError, setGpsError] = useState("");
  
  // Step 5: Photo
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [imageDataUrl, setImageDataUrl] = useState<string>("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  
  // Location data state
  const [districts, setDistricts] = useState<District[]>([]);
  const [taluks, setTaluks] = useState<Taluk[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);
  const [panchayats, setPanchayats] = useState<Panchayat[]>([]);
  const [loadingLoc, setLoadingLoc] = useState(false);
  
  // Success state
  const [success, setSuccess] = useState(false);
  const [issueId, setIssueId] = useState("");
  const [error, setError] = useState("");

  // Translations
  const t = useMemo(() => {
    const L: Record<Locale, any> = {
      en: {
        title: "Report an Issue",
        subtitle: "Help improve your village by reporting problems",
        steps: {
          1: "Location",
          2: "Category",
          3: "Details",
          4: "GPS",
          5: "Photo"
        },
        location: {
          district: "District",
          taluk: "Taluk",
          village: "Village",
          panchayat: "Panchayat",
          specific: "Specific Location/Landmark",
          selectDistrict: "Select your district",
          selectTaluk: "Select taluk",
          selectVillage: "Select village",
          selectPanchayat: "Select panchayat"
        },
        category: {
          selectCategory: "Select Issue Category",
          issueTitle: "Issue Title",
          customTitle: "Enter Custom Title",
          sla: "Expected Resolution",
          priority: "Priority"
        },
        details: {
          description: "Detailed Description",
          descriptionPlaceholder: "Describe the issue in detail. Include when it started, severity, safety concerns...",
          minChars: "Minimum 50 characters"
        },
        gps: {
          title: "GPS Location",
          subtitle: "Capture exact location of the issue",
          detect: "Detect Location",
          updating: "Updating Location...",
          verify: "Verify in Maps",
          accuracy: "Accuracy",
          lowAccuracy: "Low accuracy. Move closer to issue."
        },
        photo: {
          title: "Add Photo Evidence",
          subtitle: "A picture helps faster resolution",
          camera: "Open Camera",
          gallery: "Choose from Gallery",
          retake: "Retake Photo",
          change: "Change Photo",
          remove: "Remove Photo",
          uploading: "Processing Photo..."
        },
        buttons: {
          next: "Next Step",
          previous: "Previous",
          submit: "Submit Issue",
          submitting: "Submitting...",
          another: "Report Another Issue",
          track: "Track Issues",
          skip: "Skip for now"
        },
        errors: {
          required: "Please complete all fields",
          gpsRequired: "GPS location is required",
          photoRequired: "Photo is required",
          descriptionLength: "Description must be at least 50 characters",
          locationRequired: "Please select location details",
          loadLoc: "Failed to load location data. Please refresh.",
          photoBig: "Photo too large. Retake photo closer or lower quality.",
          geoOnly: "GPS location is required. Please enable location services.",
          notVillager: "You need to be registered as a villager to submit issues",
          notVerified: "Your villager account is not verified yet. Please contact your village incharge for verification."
        },
        success: {
          title: "Issue Reported Successfully!",
          message: "Your issue has been registered with authorities",
          issueId: "Issue ID",
          resolutionDate: "Expected Resolution",
          department: "Assigned Department",
          saveId: "Save this ID for tracking",
          note: "You'll be notified about updates via SMS/Email"
        },
        nav: {
          dashboard: "Dashboard",
          myIssues: "My Issues",
          trackIssues: "Track Issues",
          profile: "Profile"
        },
        loading: "Loading...",
        select: "Select",
        optional: "Optional"
      },
      kn: {
        title: "ಸಮಸ್ಯೆ ವರದಿ ಮಾಡಿ",
        subtitle: "ಸಮಸ್ಯೆಗಳನ್ನು ವರದಿ ಮಾಡುವ ಮೂಲಕ ನಿಮ್ಮ ಗ್ರಾಮವನ್ನು ಸುಧಾರಿಸಲು ಸಹಾಯ ಮಾಡಿ",
        steps: {
          1: "ಸ್ಥಳ",
          2: "ವರ್ಗ",
          3: "ವಿವರಗಳು",
          4: "GPS",
          5: "ಫೋಟೋ"
        },
        location: {
          district: "ಜಿಲ್ಲೆ",
          taluk: "ತಾಲ್ಲೂಕು",
          village: "ಗ್ರಾಮ",
          panchayat: "ಪಂಚಾಯತಿ",
          specific: "ನಿರ್ದಿಷ್ಟ ಸ್ಥಳ/ಲ್ಯಾಂಡ್ಮಾರ್ಕ್",
          selectDistrict: "ನಿಮ್ಮ ಜಿಲ್ಲೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ",
          selectTaluk: "ತಾಲ್ಲೂಕು ಆಯ್ಕೆಮಾಡಿ",
          selectVillage: "ಗ್ರಾಮ ಆಯ್ಕೆಮಾಡಿ",
          selectPanchayat: "ಪಂಚಾಯತಿ ಆಯ್ಕೆಮಾಡಿ"
        },
        category: {
          selectCategory: "ಸಮಸ್ಯೆಯ ವರ್ಗವನ್ನು ಆಯ್ಕೆಮಾಡಿ",
          issueTitle: "ಸಮಸ್ಯೆಯ ಶೀರ್ಷಿಕೆ",
          customTitle: "ಕಸ್ಟಮ್ ಶೀರ್ಷಿಕೆ ನಮೂದಿಸಿ",
          sla: "ನಿರೀಕ್ಷಿತ ಪರಿಹಾರ",
          priority: "ಪ್ರಾಥಮಿಕತೆ"
        },
        details: {
          description: "ವಿವರವಾದ ವಿವರಣೆ",
          descriptionPlaceholder: "ಸಮಸ್ಯೆಯನ್ನು ವಿವರವಾಗಿ ವಿವರಿಸಿ. ಅದು ಯಾವಾಗ ಪ್ರಾರಂಭವಾಯಿತು, ತೀವ್ರತೆ, ಸುರಕ್ಷತಾ ಕಾಳಜಿಗಳನ್ನು ಸೇರಿಸಿ...",
          minChars: "ಕನಿಷ್ಠ 50 ಅಕ್ಷರಗಳು"
        },
        gps: {
          title: "GPS ಸ್ಥಳ",
          subtitle: "ಸಮಸ್ಯೆಯ ನಿಖರವಾದ ಸ್ಥಳವನ್ನು ಪತ್ತೆ ಮಾಡಿ",
          detect: "ಸ್ಥಳ ಪತ್ತೆ ಮಾಡಿ",
          updating: "ಸ್ಥಳವನ್ನು ನವೀಕರಿಸಲಾಗುತ್ತಿದೆ...",
          verify: "ನಕ್ಷೆಯಲ್ಲಿ ಪರಿಶೀಲಿಸಿ",
          accuracy: "ನಿಖರತೆ",
          lowAccuracy: "ಕಡಿಮೆ ನಿಖರತೆ. ಸಮಸ್ಯೆಗೆ ಹತ್ತಿರ ಸರಿಸಿ."
        },
        photo: {
          title: "ಫೋಟೋ ಸಾಕ್ಷ್ಯ ಸೇರಿಸಿ",
          subtitle: "ಚಿತ್ರವು ವೇಗವಾದ ಪರಿಹಾರಕ್ಕೆ ಸಹಾಯ ಮಾಡುತ್ತದೆ",
          camera: "ಕ್ಯಾಮೆರಾ ತೆರೆಯಿರಿ",
          gallery: "ಗ್ಯಾಲರಿಯಿಂದ ಆಯ್ಕೆಮಾಡಿ",
          retake: "ಮತ್ತೆ ಫೋಟೋ ತೆಗೆದುಕೊಳ್ಳಿ",
          change: "ಫೋಟೋ ಬದಲಾಯಿಸಿ",
          remove: "ಫೋಟೋ ತೆಗೆದುಹಾಕಿ",
          uploading: "ಫೋಟೋ ಪ್ರೊಸೆಸ್ ಆಗುತ್ತಿದೆ..."
        },
        buttons: {
          next: "ಮುಂದಿನ ಹಂತ",
          previous: "ಹಿಂದಿನ",
          submit: "ಸಮಸ್ಯೆ ಸಲ್ಲಿಸಿ",
          submitting: "ಸಲ್ಲಿಸಲಾಗುತ್ತಿದೆ...",
          another: "ಮತ್ತೊಂದು ಸಮಸ್ಯೆಯನ್ನು ವರದಿ ಮಾಡಿ",
          track: "ಸಮಸ್ಯೆಗಳನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ",
          skip: "ಈಗಾಗಲೇ ಬಿಡಿ"
        },
        errors: {
          required: "ದಯವಿಟ್ಟು ಎಲ್ಲಾ ಕ್ಷೇತ್ರಗಳನ್ನು ಪೂರ್ಣಗೊಳಿಸಿ",
          gpsRequired: "GPS ಸ್ಥಳ ಅಗತ್ಯವಿದೆ",
          photoRequired: "ಫೋಟೋ ಅಗತ್ಯವಿದೆ",
          descriptionLength: "ವಿವರಣೆಯು ಕನಿಷ್ಠ 50 ಅಕ್ಷರಗಳಾಗಿರಬೇಕು",
          locationRequired: "ದಯವಿಟ್ಟು ಸ್ಥಳದ ವಿವರಗಳನ್ನು ಆಯ್ಕೆಮಾಡಿ",
          loadLoc: "ಸ್ಥಳದ ಮಾಹಿತಿ ಲೋಡ್ ಮಾಡಲು ವಿಫಲವಾಗಿದೆ. ದಯವಿಟ್ಟು ರಿಫ್ರೆಶ್ ಮಾಡಿ.",
          photoBig: "ಫೋಟೋ ದೊಡ್ಡದಾಗಿದೆ. ಇನ್ನೊಮ್ಮೆ ಸಮೀಪದಿಂದ ಫೋಟೋ ತೆಗೆದುಕೊಳ್ಳಿ.",
          geoOnly: "GPS ಸ್ಥಳ ಅಗತ್ಯವಿದೆ. ದಯವಿಟ್ಟು ಸ್ಥಳ ಸೇವೆಗಳನ್ನು ಸಕ್ರಿಯಗೊಳಿಸಿ.",
          notVillager: "ಸಮಸ್ಯೆಗಳನ್ನು ಸಲ್ಲಿಸಲು ನೀವು ಗ್ರಾಮಸ್ಥರಾಗಿ ನೋಂದಾಯಿಸಿಕೊಳ್ಳಬೇಕು. ದಯವಿಟ್ಟು ಮೊದಲು ನಿಮ್ಮ ಗ್ರಾಮಸ್ಥ ನೋಂದಣಿಯನ್ನು ಪೂರ್ಣಗೊಳಿಸಿ.",
          notVerified: "ನಿಮ್ಮ ಗ್ರಾಮಸ್ಥ ಖಾತೆಯನ್ನು ಇನ್ನೂ ಪರಿಶೀಲಿಸಲಾಗಿಲ್ಲ. ದಯವಿಟ್ಟು ಪರಿಶೀಲನೆಗಾಗಿ ನಿಮ್ಮ ಗ್ರಾಮ ಇನ್ಚಾರ್ಜ್ ಅನ್ನು ಸಂಪರ್ಕಿಸಿ."
        },
        success: {
          title: "ಸಮಸ್ಯೆಯನ್ನು ಯಶಸ್ವಿಯಾಗಿ ವರದಿ ಮಾಡಲಾಗಿದೆ!",
          message: "ನಿಮ್ಮ ಸಮಸ್ಯೆಯನ್ನು ಅಧಿಕಾರಿಗಳು ನೋಂದಾಯಿಸಿದ್ದಾರೆ",
          issueId: "ಸಮಸ್ಯೆ ID",
          resolutionDate: "ನಿರೀಕ್ಷಿತ ಪರಿಹಾರ",
          department: "ನಿಯೋಜಿತ ಇಲಾಖೆ",
          saveId: "ಟ್ರ್ಯಾಕಿಂಗ್‌ಗಾಗಿ ಈ ID ಯನ್ನು ಉಳಿಸಿ",
          note: "SMS/ಇಮೇಲ್ ಮೂಲಕ ನವೀಕರಣಗಳ ಬಗ್ಗೆ ನಿಮಗೆ ತಿಳಿಸಲಾಗುವುದು"
        },
        nav: {
          dashboard: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
          myIssues: "ನನ್ನ ಸಮಸ್ಯೆಗಳು",
          trackIssues: "ಸಮಸ್ಯೆಗಳನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ",
          profile: "ಪ್ರೊಫೈಲ್"
        },
        loading: "ಲೋಡ್ ಆಗುತ್ತಿದೆ...",
        select: "ಆಯ್ಕೆ ಮಾಡಿ",
        optional: "ಐಚ್ಛಿಕ"
      },
      hi: {
        title: "समस्या रिपोर्ट करें",
        subtitle: "समस्याओं की रिपोर्ट करके अपने गाँव को बेहतर बनाने में मदद करें",
        steps: {
          1: "स्थान",
          2: "श्रेणी",
          3: "विवरण",
          4: "जीपीएस",
          5: "फोटो"
        },
        location: {
          district: "जिला",
          taluk: "तालुका",
          village: "गाँव",
          panchayat: "पंचायत",
          specific: "विशिष्ट स्थान/लैंडमार्क",
          selectDistrict: "अपना जिला चुनें",
          selectTaluk: "तालुका चुनें",
          selectVillage: "गाँव चुनें",
          selectPanchayat: "पंचायत चुनें"
        },
        category: {
          selectCategory: "समस्या श्रेणी चुनें",
          issueTitle: "समस्या शीर्षक",
          customTitle: "कस्टम शीर्षक दर्ज करें",
          sla: "अपेक्षित समाधान",
          priority: "प्राथमिकता"
        },
        details: {
          description: "विस्तृत विवरण",
          descriptionPlaceholder: "समस्या का विस्तार से वर्णन करें। यह कब शुरू हुई, गंभीरता, सुरक्षा चिंताएं शामिल करें...",
          minChars: "न्यूनतम 50 वर्ण"
        },
        gps: {
          title: "जीपीएस स्थान",
          subtitle: "समस्या का सटीक स्थान कैप्चर करें",
          detect: "स्थान का पता लगाएं",
          updating: "स्थान अपडेट किया जा रहा है...",
          verify: "मानचित्र में सत्यापित करें",
          accuracy: "सटीकता",
          lowAccuracy: "कम सटीकता। समस्या के करीब जाएं।"
        },
        photo: {
          title: "फोटो सबूत जोड़ें",
          subtitle: "एक तस्वीर तेज समाधान में मदद करती है",
          camera: "कैमरा खोलें",
          gallery: "गैलरी से चुनें",
          retake: "फिर से फोटो लें",
          change: "फोटो बदलें",
          remove: "फोटो हटाएं",
          uploading: "फोटो प्रोसेस हो रहा है..."
        },
        buttons: {
          next: "अगला चरण",
          previous: "पिछला",
          submit: "समस्या सबमिट करें",
          submitting: "सबमिट किया जा रहा है...",
          another: "एक और समस्या रिपोर्ट करें",
          track: "समस्याएं ट्रैक करें",
          skip: "अभी के लिए छोड़ें"
        },
        errors: {
          required: "कृपया सभी फ़ील्ड पूर्ण करें",
          gpsRequired: "जीपीएस स्थान आवश्यक है",
          photoRequired: "फोटो आवश्यक है",
          descriptionLength: "विवरण कम से कम 50 वर्ण का होना चाहिए",
          locationRequired: "कृपया स्थान विवरण चुनें",
          loadLoc: "स्थान डेटा लोड करने में विफल। कृपया रिफ्रेश करें।",
          photoBig: "फोटो बहुत बड़ा है। फिर से पास से फोटो लें।",
          geoOnly: "जीपीएस स्थान आवश्यक है। कृपया लोकेशन सेवाएं सक्षम करें।",
          notVillager: "समस्याएं सबमिट करने के लिए आपको एक ग्रामीण के रूप में पंजीकृत होना आवश्यक है। कृपया पहले अपना ग्रामीण पंजीकरण पूरा करें।",
          notVerified: "आपका ग्रामीण खाता अभी तक सत्यापित नहीं हुआ है। कृपया सत्यापन के लिए अपने गाँव के इंचार्ज से संपर्क करें।"
        },
        success: {
          title: "समस्या सफलतापूर्वक रिपोर्ट की गई!",
          message: "आपकी समस्या अधिकारियों द्वारा पंजीकृत की गई है",
          issueId: "समस्या आईडी",
          resolutionDate: "अपेक्षित समाधान",
          department: "नियत विभाग",
          saveId: "ट्रैकिंग के लिए इस आईडी को सहेजें",
          note: "आपको एसएमएस/ईमेल के माध्यम से अपडेट के बारे में सूचित किया जाएगा"
        },
        nav: {
          dashboard: "डैशबोर्ड",
          myIssues: "मेरी समस्याएं",
          trackIssues: "समस्याएं ट्रैक करें",
          profile: "प्रोफ़ाइल"
        },
        loading: "लोड हो रहा है...",
        select: "चुनें",
        optional: "वैकल्पिक"
      }
    };
    return L[locale] || L.en;
  }, [locale]);

  /* ------------------ LOAD USER PROFILE ------------------ */
  useEffect(() => {
    const loadProfile = async () => {
      const user = auth.currentUser;
      if (!user) {
        router.push(`/${locale}/villager/login`);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "villagers", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserProfile(data);
          
          if (!data.verified) {
            setError(t.errors.notVerified);
            return;
          }
          
          if (data.districtId) setDistrictId(data.districtId);
          if (data.talukId) setTalukId(data.talukId);
          if (data.villageId) setVillageId(data.villageId);
          if (data.panchayatId) setPanchayatId(data.panchayatId);
        } else {
          setError(t.errors.notVillager);
        }
      } catch (error) {
        console.error("Error loading profile:", error);
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [router, locale, t]);

  /* ------------------ LOAD LOCATION DATA ------------------ */
  useEffect(() => {
    const loadDistricts = async () => {
      setError("");
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
        setDistricts(districtsData.length > 0 ? districtsData : KARNATAKA_DISTRICTS.map(d => ({ id: d.id, name: d.name })));
      } catch (e: any) {
        console.error("Error loading districts:", e);
        setDistricts(KARNATAKA_DISTRICTS.map(d => ({ id: d.id, name: d.name })));
      } finally {
        setLoadingLoc(false);
      }
    };
    loadDistricts();
  }, []);

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

      setError("");
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

        setVillages([]);
        setPanchayats([]);
        setTalukId("");
        setVillageId("");
        setPanchayatId("");
      } catch (e: any) {
        console.error("Error loading taluks:", e);
      } finally {
        setLoadingLoc(false);
      }
    };

    loadTaluks();
  }, [districtId]);

  useEffect(() => {
    const loadVillages = async () => {
      if (!districtId || !talukId) {
        setVillages([]);
        setPanchayats([]);
        setVillageId("");
        setPanchayatId("");
        return;
      }

      setError("");
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

        setPanchayats([]);
        setVillageId("");
        setPanchayatId("");
      } catch (e: any) {
        console.error("Error loading villages:", e);
      } finally {
        setLoadingLoc(false);
      }
    };

    loadVillages();
  }, [talukId, districtId]);

  useEffect(() => {
    const loadPanchayats = async () => {
      if (!districtId || !talukId || !villageId) {
        setPanchayats([]);
        setPanchayatId("");
        return;
      }

      setError("");
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
      } finally {
        setLoadingLoc(false);
      }
    };

    loadPanchayats();
  }, [villageId, talukId, districtId]);

  /* ------------------ AUTO-FETCH GPS ------------------ */
  useEffect(() => {
    if (currentStep === 4 && !coordinates) {
      detectGPS();
    }
  }, [currentStep]);

  // Get selected category
  const selectedCategory = useMemo(() => {
    return ISSUE_CATEGORIES.find(cat => cat.id === category);
  }, [category]);

  // Calculate expected resolution date
  const expectedResolutionDate = useMemo(() => {
    if (!selectedCategory) return "";
    const date = new Date();
    date.setDate(date.getDate() + selectedCategory.sla);
    return date.toLocaleDateString('en-IN', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }, [selectedCategory]);

  // Get title options
  const titleOptions = useMemo(() => {
    return selectedCategory?.titles || [];
  }, [selectedCategory]);

  // Get final title
  const finalTitle = useMemo(() => {
    if (selectedTitle === "Custom Title") return customTitle;
    return selectedTitle;
  }, [selectedTitle, customTitle]);

  // Get selected panchayat
  const selectedPanchayat = useMemo(() => {
    return panchayats.find(p => p.id === panchayatId);
  }, [panchayats, panchayatId]);

  /* ------------------ GPS DETECTION ------------------ */
  const detectGPS = async () => {
    setFetchingGPS(true);
    setGpsError("");
    try {
      const location = await getCurrentLocation();
      setCoordinates(location);
    } catch (err: any) {
      setGpsError(err.message);
    } finally {
      setFetchingGPS(false);
    }
  };

  // Open in maps
  const openInMaps = () => {
    if (!coordinates) return;
    const url = `https://www.google.com/maps?q=${coordinates.latitude},${coordinates.longitude}&z=18`;
    window.open(url, '_blank');
  };

  /* ------------------ PHOTO HANDLING ------------------ */
  const handleImageSelect = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setError("Image size must be less than 10MB");
      return;
    }

    setImageFile(file);
    setUploadingPhoto(true);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    try {
      const compressedDataUrl = await compressToJpegDataUrl(file, 1000, 0.7);
      setImageDataUrl(compressedDataUrl);
    } catch (err) {
      console.error("Error compressing image:", err);
      const dataUrl = await fileToDataUrl(file);
      setImageDataUrl(dataUrl);
    } finally {
      setUploadingPhoto(false);
    }
    setError("");
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview("");
    setImageDataUrl("");
  };

  /* ------------------ STEP VALIDATION ------------------ */
  const validateStep = (step: number): boolean => {
    setError("");
    setGpsError("");

    switch (step) {
      case 1:
        if (!districtId || !talukId || !villageId || !panchayatId) {
          setError(t.errors.locationRequired);
          return false;
        }
        break;
      case 2:
        if (!category || !selectedTitle) {
          setError(t.errors.required);
          return false;
        }
        if (selectedTitle === "Custom Title" && !customTitle.trim()) {
          setError(t.errors.required);
          return false;
        }
        break;
      case 3:
        if (!description.trim() || description.trim().length < 50) {
          setError(t.errors.descriptionLength);
          return false;
        }
        break;
      case 4:
        if (!coordinates) {
          setError(t.errors.gpsRequired);
          return false;
        }
        break;
      case 5:
        // Photo is optional in this version
        break;
    }
    return true;
  };

  /* ------------------ NAVIGATION ------------------ */
  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setError("");
    setGpsError("");
  };

  /* ------------------ SUBMIT ISSUE ------------------ */
  const submitIssue = async () => {
    if (!validateStep(5)) return;
    
    const user = auth.currentUser;
    if (!user) {
      router.push(`/${locale}/villager/login`);
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      // Get location names
      const districtName = districts.find(d => d.id === districtId)?.name || "";
      const talukName = taluks.find(t => t.id === talukId)?.name || "";
      const villageName = villages.find(v => v.id === villageId)?.name || "";
      const panchayatName = selectedPanchayat?.name || "";
      const panchayatCode = selectedPanchayat?.code || panchayatId.slice(0, 4).toUpperCase() || "PANCH";

      // Get issue count and generate ID
      const issuesQuery = await getDocs(
        query(
          collection(db, "issues"),
          where("panchayatId", "==", panchayatId)
        )
      );
      const issueCount = issuesQuery.size;
      const generatedIssueId = generateIssueId(panchayatCode, category, issueCount);

      // Calculate expected resolution date
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + (selectedCategory?.sla || 14));

      // Create issue data - SIMPLIFIED VERSION
      const issueData = {
        // Required fields
        villagerId: user.uid,
        categoryId: category,
        panchayatId: panchayatId,
        title: finalTitle,
        description: description.trim(),
        
        // Location
        districtId,
        talukId,
        villageId,
        districtName,
        talukName,
        villageName,
        panchayatName,
        specificLocation: specificLocation.trim() || null,
        
        // Category
        categoryName: selectedCategory?.name || "Other",
        slaDays: selectedCategory?.sla || 14,
        priority: selectedCategory?.priority || "Medium",
        expectedResolutionDate: expectedDate,
        
        // GPS
        gpsLatitude: coordinates?.latitude || null,
        gpsLongitude: coordinates?.longitude || null,
        gpsAccuracy: coordinates?.accuracy || null,
        
        // Photo
        photoUrl: imageDataUrl || null,
        hasPhoto: !!imageDataUrl,
        
        // Status
        status: "pending",
        stage: "submitted",
        
        // Reporter info
        reporterName: userProfile?.name || user.displayName || "Anonymous",
        reporterEmail: user.email,
        reporterPhone: userProfile?.mobile || null,
        
        // Timestamps
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        
        // Department
        assignedDepartment: getDepartmentByCategory(category),
        
        // Display fields
        displayId: generatedIssueId,
        
        // Defaults
        upvotes: 0,
        commentsCount: 0,
        views: 0,
        isUrgent: false,
        isVerified: false,
      };

      console.log("Submitting issue:", generatedIssueId);

      // Add to Firestore
      const docRef = await addDoc(collection(db, "issues"), issueData);
      
      console.log("Issue created with ID:", docRef.id);
      
      // Success
      setIssueId(generatedIssueId);
      setSuccess(true);

    } catch (err: any) {
      console.error("Submit error:", err);
      setError(`Error: ${err.code} - ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Get department by category
  const getDepartmentByCategory = (categoryId: string): string => {
    const deptMap: Record<string, string> = {
      "RD": "Public Works Department",
      "WS": "Water Supply Board",
      "EL": "Electricity Board",
      "SN": "Municipal Corporation",
      "HC": "Health Department",
      "ED": "Education Department",
      "SL": "Municipal Corporation",
      "DR": "Public Works Department",
      "OT": "General Administration"
    };
    return deptMap[categoryId] || deptMap["OT"];
  };

  if (loading) {
    return (
      <Screen center>
        <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
        <p className="mt-6 text-green-700 font-semibold text-lg animate-pulse">{t.loading}</p>
      </Screen>
    );
  }

  if (error && (error.includes("not verified") || error.includes("notVillager"))) {
    return (
      <Screen padded>
        <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiAlertCircle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Account Verification Required</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => router.push(`/${locale}/villager/profile`)}
              className="w-full py-3 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-xl font-bold hover:from-green-600 hover:to-teal-700"
            >
              Go to Profile
            </button>
          </div>
        </div>
      </Screen>
    );
  }

  if (success) {
    return (
      <Screen padded>
        <div className="min-h-screen bg-gradient-to-br from-emerald-100 via-teal-50 to-blue-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 text-center max-w-2xl w-full">
            <div className="relative mb-8">
              <div className="absolute -top-16 left-1/2 transform -translate-x-1/2">
                <div className="w-32 h-32 bg-gradient-to-br from-green-400 to-teal-500 rounded-full flex items-center justify-center shadow-xl animate-bounce">
                  <div className="w-24 h-24 bg-white/90 rounded-full flex items-center justify-center">
                    <FiCheck className="w-16 h-16 text-green-600" />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-20 mb-8">
              <h2 className="text-4xl font-bold text-gray-900 mb-3">
                {t.success.title}
              </h2>
              <p className="text-gray-600 text-lg">{t.success.message}</p>
              <p className="text-sm text-green-600 mt-2">{t.success.note}</p>
            </div>
            
            <div className="bg-gradient-to-r from-green-50 to-teal-50 border-2 border-green-200 rounded-2xl p-8 mb-8">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mr-3">
                  <span className="text-2xl">🆔</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">{t.success.issueId}</p>
                  <p className="text-4xl font-black text-green-600 tracking-wider">{issueId}</p>
                </div>
              </div>
              <p className="text-sm text-gray-500 animate-pulse">{t.success.saveId}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-blue-700 mb-1">
                  {t.success.resolutionDate}
                </p>
                <p className="font-bold text-gray-900">{expectedResolutionDate}</p>
              </div>
              <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-purple-700 mb-1">
                  {t.success.department}
                </p>
                <p className="font-bold text-gray-900">{getDepartmentByCategory(category)}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => {
                  setSuccess(false);
                  setCurrentStep(1);
                  setCategory("");
                  setSelectedTitle("");
                  setCustomTitle("");
                  setDescription("");
                  setCoordinates(null);
                  setImageFile(null);
                  setImagePreview("");
                  setImageDataUrl("");
                  setError("");
                }}
                className="px-8 py-4 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-xl hover:from-green-600 hover:to-teal-700 font-bold shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <FiPlus className="w-5 h-5" />
                {t.buttons.another}
              </button>
              <button
                onClick={() => router.push(`/${locale}/villager/my-issues`)}
                className="px-8 py-4 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl hover:from-gray-200 hover:to-gray-300 font-bold shadow hover:shadow-md flex items-center justify-center gap-2"
              >
                <FiList className="w-5 h-5" />
                {t.buttons.track}
              </button>
            </div>
          </div>
        </div>
      </Screen>
    );
  }

  return (
    <Screen padded>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { transform: translateX(-20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
        .animate-slideIn { animation: slideIn 0.4s ease-out forwards; }
        .animate-pulse-slow { animation: pulse 2s infinite; }
      `}</style>

      <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-white">
        {/* Header */}
        <div className="p-4 animate-fadeIn">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push(`/${locale}/villager/dashboard`)}
                className="p-3 rounded-xl border-2 border-green-100 bg-white hover:bg-green-50 active:scale-95 transition-all duration-200"
              >
                <FiArrowLeft className="w-5 h-5 text-green-700" />
              </button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-green-900 tracking-tight">
                  {t.title}
                </h1>
                <p className="text-green-700/80 mt-1 text-sm font-semibold">
                  {t.subtitle}
                </p>
              </div>
            </div>
          </div>

          {/* Progress Steps - Mobile Optimized */}
          <div className="mb-6 bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-xl border border-green-100">
            <div className="flex items-center justify-between">
              {[1, 2, 3, 4, 5].map((step) => (
                <div key={step} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1 relative">
                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center text-lg md:text-xl font-bold transition-all duration-300 ${
                      currentStep === step 
                        ? "scale-110 bg-gradient-to-br from-green-500 to-teal-600 text-white shadow-lg ring-4 ring-green-100" 
                        : currentStep > step
                        ? "bg-green-100 text-green-700 shadow-md"
                        : "bg-gray-100 text-gray-400"
                    }`}>
                      {currentStep > step ? "✓" : step}
                    </div>
                    <p className={`text-xs mt-2 font-bold text-center ${
                      currentStep >= step ? "text-green-700" : "text-gray-500"
                    }`}>
                      {t.steps[step as keyof typeof t.steps]}
                    </p>
                    {currentStep === step && (
                      <div className="absolute -bottom-2 w-6 h-1 bg-green-500 rounded-full animate-pulse-slow"></div>
                    )}
                  </div>
                  {step < 5 && (
                    <div className={`h-1 flex-1 mx-1 md:mx-2 ${
                      currentStep > step ? "bg-gradient-to-r from-green-400 to-teal-400" : "bg-gray-200"
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-4 pb-24">
          {(error || gpsError) && (
            <div className="mb-6 p-4 rounded-2xl border-2 border-red-200 bg-gradient-to-br from-red-50 to-red-50 animate-fadeIn">
              <div className="flex items-start gap-3 text-red-700">
                <FiAlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span className="text-sm font-bold">
                  {error || gpsError}
                </span>
              </div>
            </div>
          )}

          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-green-100 animate-fadeIn">
            <div className="h-2 bg-gradient-to-r from-green-500 via-teal-500 to-blue-500"></div>
            
            <div className="p-4 md:p-6">
              {/* Step 1: Location */}
              {currentStep === 1 && (
                <div className="space-y-6 animate-slideIn">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-green-100 to-teal-100 flex items-center justify-center text-2xl">
                      <MdLocationPin className="w-6 h-6 md:w-8 md:h-8 text-green-600" />
                    </div>
                    <div>
                      <h2 className="text-xl md:text-2xl font-bold text-gray-900">{t.steps[1]}</h2>
                      <p className="text-gray-600 text-sm">Select the issue location</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        {t.location.district} *
                      </label>
                      <select
                        value={districtId}
                        onChange={(e) => setDistrictId(e.target.value)}
                        disabled={loadingLoc}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 outline-none bg-white"
                      >
                        <option value="">{loadingLoc ? t.loading : t.location.selectDistrict}</option>
                        {districts.map(d => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        {t.location.taluk} *
                      </label>
                      <select
                        value={talukId}
                        onChange={(e) => setTalukId(e.target.value)}
                        disabled={!districtId || loadingLoc}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 outline-none bg-white disabled:opacity-60"
                      >
                        <option value="">{loadingLoc ? t.loading : t.location.selectTaluk}</option>
                        {taluks.map(t => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        {t.location.village} *
                      </label>
                      <select
                        value={villageId}
                        onChange={(e) => setVillageId(e.target.value)}
                        disabled={!talukId || loadingLoc}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 outline-none bg-white disabled:opacity-60"
                      >
                        <option value="">{loadingLoc ? t.loading : t.location.selectVillage}</option>
                        {villages.map(v => (
                          <option key={v.id} value={v.id}>
                            {v.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        {t.location.panchayat} *
                      </label>
                      <select
                        value={panchayatId}
                        onChange={(e) => setPanchayatId(e.target.value)}
                        disabled={!villageId || loadingLoc || panchayats.length === 0}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 outline-none bg-white disabled:opacity-60"
                      >
                        <option value="">{loadingLoc ? t.loading : t.location.selectPanchayat}</option>
                        {panchayats.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} {p.code ? `(${p.code})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        {t.location.specific} <span className="text-gray-500 text-xs">({t.optional})</span>
                      </label>
                      <input
                        type="text"
                        value={specificLocation}
                        onChange={(e) => setSpecificLocation(e.target.value)}
                        placeholder="e.g., Near temple, Main road, Market area"
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 outline-none bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Category */}
              {currentStep === 2 && (
                <div className="space-y-6 animate-slideIn">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center text-2xl">
                      <MdTitle className="w-6 h-6 md:w-8 md:h-8 text-purple-600" />
                    </div>
                    <div>
                      <h2 className="text-xl md:text-2xl font-bold text-gray-900">{t.steps[2]}</h2>
                      <p className="text-gray-600 text-sm">Select issue type and title</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-4">
                      {t.category.selectCategory} *
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {ISSUE_CATEGORIES.map(cat => (
                        <button
                          key={cat.id}
                          onClick={() => setCategory(cat.id)}
                          className={`p-3 md:p-4 rounded-xl md:rounded-2xl border-2 transition-all duration-300 active:scale-95 ${
                            category === cat.id
                              ? "border-green-500 bg-gradient-to-br from-green-50 to-teal-50 shadow-lg"
                              : "border-gray-200 hover:border-green-300"
                          }`}
                        >
                          <div className="text-2xl md:text-3xl mb-2">{cat.icon}</div>
                          <div className="font-bold text-gray-800 text-xs md:text-sm mb-1 truncate">{cat.name}</div>
                          <div className="text-xs text-green-600 font-semibold truncate">
                            {cat.sla}d • {cat.priority}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {selectedCategory && (
                    <div className="space-y-4 animate-fadeIn">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          {t.category.issueTitle} *
                        </label>
                        <select
                          value={selectedTitle}
                          onChange={(e) => setSelectedTitle(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 outline-none bg-white"
                        >
                          <option value="">Select a title</option>
                          {titleOptions.map(title => (
                            <option key={title} value={title}>{title}</option>
                          ))}
                        </select>
                      </div>

                      {selectedTitle === "Custom Title" && (
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">
                            {t.category.customTitle} *
                          </label>
                          <input
                            type="text"
                            value={customTitle}
                            onChange={(e) => setCustomTitle(e.target.value)}
                            placeholder="Type your issue title"
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 outline-none bg-white"
                          />
                        </div>
                      )}

                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4">
                        <p className="text-sm font-bold text-green-700 mb-2">
                          {t.category.sla}
                        </p>
                        <p className="font-bold text-gray-900 text-sm">{expectedResolutionDate}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Description */}
              {currentStep === 3 && (
                <div className="space-y-6 animate-slideIn">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center text-2xl">
                      <MdDescription className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-xl md:text-2xl font-bold text-gray-900">{t.steps[3]}</h2>
                      <p className="text-gray-600 text-sm">Describe the issue in detail</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      {t.details.description} *
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={t.details.descriptionPlaceholder}
                      rows={6}
                      className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-green-500 outline-none resize-none bg-white"
                    />
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-xs text-gray-500">
                        {description.length} characters • {t.details.minChars}
                      </p>
                      <div className={`w-3 h-3 rounded-full ${description.length >= 50 ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: GPS */}
              {currentStep === 4 && (
                <div className="space-y-6 animate-slideIn">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-teal-100 to-cyan-100 flex items-center justify-center text-2xl">
                      <FiNavigation className="w-6 h-6 md:w-8 md:h-8 text-teal-600" />
                    </div>
                    <div>
                      <h2 className="text-xl md:text-2xl font-bold text-gray-900">{t.steps[4]}</h2>
                      <p className="text-gray-600 text-sm">Capture exact location coordinates</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <button
                      onClick={detectGPS}
                      disabled={fetchingGPS}
                      className={`px-6 py-4 rounded-xl font-bold text-white ${
                        fetchingGPS 
                          ? "bg-blue-400 cursor-not-allowed" 
                          : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95"
                      } flex items-center justify-center gap-3 transition-all`}
                    >
                      {fetchingGPS ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          {t.gps.updating}
                        </>
                      ) : (
                        <>
                          <FiMapPin className="w-5 h-5" />
                          {t.gps.detect}
                        </>
                      )}
                    </button>

                    {coordinates ? (
                      <div className="bg-gradient-to-r from-green-50 to-teal-50 border-2 border-green-300 rounded-2xl p-4 md:p-6 animate-fadeIn">
                        <div className="flex items-start gap-3 md:gap-4">
                          <div className="w-10 h-10 md:w-12 md:h-12 bg-green-200 rounded-full flex items-center justify-center flex-shrink-0">
                            <FiCheck className="w-5 h-5 md:w-6 md:h-6 text-green-700" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-green-900 mb-3 text-sm md:text-base">📍 GPS Location Captured</p>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <p className="text-green-700 font-semibold mb-1 text-xs">Latitude</p>
                                <p className="text-gray-900 font-mono bg-white/50 p-2 rounded-lg text-xs md:text-sm truncate">
                                  {coordinates.latitude.toFixed(6)}
                                </p>
                              </div>
                              <div>
                                <p className="text-green-700 font-semibold mb-1 text-xs">Longitude</p>
                                <p className="text-gray-900 font-mono bg-white/50 p-2 rounded-lg text-xs md:text-sm truncate">
                                  {coordinates.longitude.toFixed(6)}
                                </p>
                              </div>
                            </div>
                            <div className="mt-3">
                              <p className="text-green-700 font-semibold mb-1 text-xs">{t.gps.accuracy}</p>
                              <p className="text-gray-900 text-sm">±{coordinates.accuracy.toFixed(1)} meters</p>
                            </div>
                            <button
                              onClick={openInMaps}
                              className="mt-4 px-4 py-2 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg font-bold text-sm hover:from-green-700 hover:to-teal-700 flex items-center gap-2"
                            >
                              <span>🗺️</span>
                              {t.gps.verify}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 md:p-8 text-center">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <FiMapPin className="w-6 h-6 md:w-8 md:h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-600 font-semibold text-sm md:text-base">Location not detected yet</p>
                        <p className="text-gray-500 text-xs md:text-sm mt-1">Click "Detect Location" to capture GPS</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 5: Photo */}
              {currentStep === 5 && (
                <div className="space-y-6 animate-slideIn">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center text-2xl">
                      <MdPhotoCamera className="w-6 h-6 md:w-8 md:h-8 text-pink-600" />
                    </div>
                    <div>
                      <h2 className="text-xl md:text-2xl font-bold text-gray-900">{t.steps[5]}</h2>
                      <p className="text-gray-600 text-sm">Add photo evidence for better resolution</p>
                    </div>
                  </div>

                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageSelect(file);
                    }}
                  />
                  <input
                    ref={galleryInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageSelect(file);
                    }}
                  />

                  {uploadingPhoto ? (
                    <div className="flex flex-col items-center justify-center p-12">
                      <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="mt-4 text-green-700 font-semibold">{t.photo.uploading}</p>
                    </div>
                  ) : !imagePreview ? (
                    <div className="space-y-4">
                      <button
                        onClick={() => cameraInputRef.current?.click()}
                        className="w-full p-6 md:p-8 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold hover:from-purple-700 hover:to-indigo-700 shadow-xl active:scale-95 transition-all"
                      >
                        <FiCamera className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-4" />
                        <p className="text-xl md:text-2xl mb-2">{t.photo.camera}</p>
                        <p className="text-purple-100 text-sm">Take a photo directly</p>
                      </button>

                      <button
                        onClick={() => galleryInputRef.current?.click()}
                        className="w-full p-6 md:p-8 rounded-2xl border-2 border-gray-300 bg-white hover:border-green-500 hover:bg-green-50 font-bold text-gray-700 active:scale-95 transition-all"
                      >
                        <FiUpload className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-4 text-gray-500" />
                        <p className="text-xl md:text-2xl mb-2">{t.photo.gallery}</p>
                        <p className="text-gray-500 text-sm">Select from gallery</p>
                      </button>

                      <button
                        onClick={nextStep}
                        className="w-full py-4 px-6 rounded-2xl border-2 border-green-500 bg-white text-green-600 font-bold hover:bg-green-50 active:scale-95 transition-all"
                      >
                        {t.buttons.skip}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="relative rounded-2xl overflow-hidden border-2 border-gray-300">
                        <img 
                          src={imagePreview} 
                          alt="Issue evidence" 
                          className="w-full h-48 md:h-64 object-cover"
                        />
                        
                        <div className="absolute top-3 right-3">
                          <button
                            onClick={removeImage}
                            className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 active:scale-95 transition-all"
                          >
                            <FiX className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
                          <div className="flex items-center gap-3 text-white">
                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                              <FiCheck className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-bold text-sm md:text-base">Photo Ready</p>
                              <p className="text-xs text-gray-200">Image will be attached to report</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => cameraInputRef.current?.click()}
                          className="py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold active:scale-95 transition-all"
                        >
                          {t.photo.retake}
                        </button>
                        <button
                          onClick={() => galleryInputRef.current?.click()}
                          className="py-3 px-4 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl font-bold active:scale-95 transition-all"
                        >
                          {t.photo.change}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="mt-8 flex gap-3">
                {currentStep > 1 && (
                  <button
                    onClick={prevStep}
                    className="px-4 md:px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl font-bold hover:from-gray-200 hover:to-gray-300 active:scale-95 transition-all flex-1"
                  >
                    {t.buttons.previous}
                  </button>
                )}
                
                {currentStep < 5 ? (
                  <button
                    onClick={nextStep}
                    className={`${currentStep > 1 ? 'flex-1' : 'w-full'} px-4 md:px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl font-bold hover:from-green-700 hover:to-teal-700 active:scale-95 transition-all flex items-center justify-center gap-2`}
                  >
                    {t.buttons.next}
                    <FiChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={submitIssue}
                    disabled={submitting}
                    className={`flex-1 px-4 md:px-6 py-3 rounded-xl font-bold text-white ${
                      submitting 
                        ? "bg-gradient-to-r from-green-400 to-teal-400 cursor-not-allowed" 
                        : "bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 active:scale-95"
                    } transition-all`}
                  >
                    {submitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        {t.buttons.submitting}
                      </span>
                    ) : (
                      t.buttons.submit
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Navigation - Mobile Only */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t-2 border-green-100 shadow-xl md:hidden">
          <div className="grid grid-cols-4 gap-1 p-2">
            <button
              onClick={() => router.push(`/${locale}/villager/dashboard`)}
              className="flex flex-col items-center justify-center p-3 rounded-xl hover:bg-green-50 transition-all active:scale-95"
            >
              <FiHome className="w-5 h-5 text-green-600" />
              <span className="text-xs mt-1 font-medium text-green-700">
                {t.nav.dashboard}
              </span>
            </button>
            <button
              onClick={() => router.push(`/${locale}/villager/my-issues`)}
              className="flex flex-col items-center justify-center p-3 rounded-xl hover:bg-green-50 transition-all active:scale-95"
            >
              <FiList className="w-5 h-5 text-green-600" />
              <span className="text-xs mt-1 font-medium text-green-700">
                {t.nav.myIssues}
              </span>
            </button>
            <button
              onClick={() => router.push(`/${locale}/villager/issue-tracking`)}
              className="flex flex-col items-center justify-center p-3 rounded-xl hover:bg-green-50 transition-all active:scale-95"
            >
              <FiTrendingUp className="w-5 h-5 text-green-600" />
              <span className="text-xs mt-1 font-medium text-green-700">
                {t.nav.trackIssues}
              </span>
            </button>
            <button
              onClick={() => router.push(`/${locale}/villager/profile`)}
              className="flex flex-col items-center justify-center p-3 rounded-xl hover:bg-green-50 transition-all active:scale-95"
            >
              <FiUser className="w-5 h-5 text-green-600" />
              <span className="text-xs mt-1 font-medium text-green-700">
                {t.nav.profile}
              </span>
            </button>
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-lg border-2 border-green-100 rounded-2xl p-2 shadow-xl">
          <div className="grid grid-cols-4 gap-1">
            <button
              onClick={() => router.push(`/${locale}/villager/dashboard`)}
              className="flex flex-col items-center justify-center p-4 rounded-xl hover:bg-green-50 transition-all"
            >
              <FiHome className="w-5 h-5 text-green-600" />
              <span className="text-xs mt-1 font-medium text-green-700">
                {t.nav.dashboard}
              </span>
            </button>
            <button
              onClick={() => router.push(`/${locale}/villager/my-issues`)}
              className="flex flex-col items-center justify-center p-4 rounded-xl hover:bg-green-50 transition-all"
            >
              <FiList className="w-5 h-5 text-green-600" />
              <span className="text-xs mt-1 font-medium text-green-700">
                {t.nav.myIssues}
              </span>
            </button>
            <button
              onClick={() => router.push(`/${locale}/villager/issue-tracking`)}
              className="flex flex-col items-center justify-center p-4 rounded-xl hover:bg-green-50 transition-all"
            >
              <FiTrendingUp className="w-5 h-5 text-green-600" />
              <span className="text-xs mt-1 font-medium text-green-700">
                {t.nav.trackIssues}
              </span>
            </button>
            <button
              onClick={() => router.push(`/${locale}/villager/profile`)}
              className="flex flex-col items-center justify-center p-4 rounded-xl hover:bg-green-50 transition-all"
            >
              <FiUser className="w-5 h-5 text-green-600" />
              <span className="text-xs mt-1 font-medium text-green-700">
                {t.nav.profile}
              </span>
            </button>
          </div>
        </div>
      </div>
    </Screen>
  );
}