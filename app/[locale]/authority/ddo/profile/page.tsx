// app/[locale]/authority/ddo/profile/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth, db, storage } from "../../../../lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Screen from "../../../../components/Screen";
import ProfileForm from "./ProfileForm";

type Locale = "en" | "kn" | "hi";

interface DDOProfile {
    uid: string;
    name: string;
    email: string;
    phone?: string;
    district: string;
    districtId: string;
    role: string;
    designation?: string;
    profilePhoto?: string;
    joinedDate?: string;
    lastActive?: string;
    verificationStatus: string;
    address?: string;
    officeAddress?: string;
    jurisdiction?: string;
}

export default function DDOProfilePage() {
    const router = useRouter();
    const params = useParams() as { locale?: string };
    const locale = (params?.locale || "en") as Locale;
    const [profile, setProfile] = useState<DDOProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    /* 🌐 Multilingual text */
    const t = {
        en: {
            title: "My Profile",
            subtitle: "Manage your profile information",
            back: "Back to Dashboard",
            loading: "Loading profile...",
            error: {
                auth: "Authentication error",
                profile: "Failed to load profile",
            },
        },
        kn: {
            title: "ನನ್ನ ಪ್ರೊಫೈಲ್",
            subtitle: "ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ಮಾಹಿತಿಯನ್ನು ನಿರ್ವಹಿಸಿ",
            back: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಹಿಂತಿರುಗಿ",
            loading: "ಪ್ರೊಫೈಲ್ ಲೋಡ್ ಆಗುತ್ತಿದೆ...",
            error: {
                auth: "ದೃಢೀಕರಣ ದೋಷ",
                profile: "ಪ್ರೊಫೈಲ್ ಲೋಡ್ ಮಾಡಲು ವಿಫಲವಾಗಿದೆ",
            },
        },
        hi: {
            title: "मेरी प्रोफ़ाइल",
            subtitle: "अपनी प्रोफ़ाइल जानकारी प्रबंधित करें",
            back: "डैशबोर्ड पर वापस जाएं",
            loading: "प्रोफ़ाइल लोड हो रही है...",
            error: {
                auth: "प्रमाणीकरण त्रुटि",
                profile: "प्रोफ़ाइल लोड करने में विफल",
            },
        },
    }[locale];

    useEffect(() => {
        const loadProfile = async () => {
            try {
                setLoading(true);
                setError(null);

                // Wait for auth to be ready
                await auth.authStateReady();
                const user = auth.currentUser;

                if (!user) {
                    router.replace(`/${locale}/authority/login`);
                    return;
                }

                // Load DDO authority document
                const authorityDocRef = doc(db, "authorities", user.uid);
                const authoritySnap = await getDoc(authorityDocRef);

                if (!authoritySnap.exists()) {
                    console.error("Authority document not found");
                    router.replace(`/${locale}/authority/status`);
                    return;
                }

                const authorityData = authoritySnap.data();

                // Extract district information
                const districtName = authorityData.district || authorityData.districtName;
                const districtIdentifier = authorityData.districtId || authorityData.district_id;

                // Create profile data
                const isVerified =
                    authorityData?.verified === true ||
                    authorityData?.verification?.status === "verified" ||
                    authorityData?.status === "verified" ||
                    authorityData?.status === "active";

                const profileData: DDOProfile = {
                    uid: user.uid,
                    name: authorityData.name || authorityData.fullName || "DDO Officer",
                    email: authorityData.email || user.email || "",
                    phone: authorityData.phone || authorityData.phoneNumber || "",
                    district: districtName,
                    districtId: districtIdentifier,
                    role: authorityData.role || "ddo",
                    designation: authorityData.designation || "District Development Officer",
                    profilePhoto: authorityData.profilePhoto || authorityData.photoURL || "",
                    address: authorityData.address || "",
                    officeAddress: authorityData.officeAddress || "",
                    jurisdiction: authorityData.jurisdiction || districtName,
                    joinedDate: authorityData.createdAt?.toDate?.()?.toLocaleDateString() ||
                        authorityData.joinedDate ||
                        new Date().toLocaleDateString(),
                    lastActive: new Date().toLocaleDateString(),
                    verificationStatus: isVerified ? "verified" : "pending"
                };

                setProfile(profileData);

            } catch (err: any) {
                console.error("Error loading profile:", err);
                setError(`${t.error.profile}: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, [router, locale, t]);

    const handleUpdateProfile = async (updatedData: Partial<DDOProfile>) => {
        try {
            const user = auth.currentUser;
            if (!user) {
                setError(t.error.auth);
                return;
            }

            const authorityDocRef = doc(db, "authorities", user.uid);
            await updateDoc(authorityDocRef, {
                ...updatedData,
                updatedAt: new Date(),
                lastUpdated: new Date()
            });

            // Update local state
            setProfile(prev => prev ? { ...prev, ...updatedData } : null);

            setSuccess("Profile updated successfully!");
            setTimeout(() => setSuccess(null), 3000);
        } catch (error) {
            console.error("Error updating profile:", error);
            setError("Failed to update profile");
        }
    };

    const handleUploadPhoto = async (file: File) => {
        try {
            const user = auth.currentUser;
            if (!user) return;

            // Create storage reference
            const storageRef = ref(storage, `profile-photos/${user.uid}/${Date.now()}_${file.name}`);

            // Upload file
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);

            // Update profile with new photo URL
            await handleUpdateProfile({ profilePhoto: downloadURL });

            return downloadURL;
        } catch (error) {
            console.error("Error uploading photo:", error);
            setError("Failed to upload photo");
            throw error;
        }
    };

    if (loading) {
        return (
            <Screen padded>
                <div className="max-w-4xl mx-auto">
                    <div className="flex flex-col justify-center items-center h-64 gap-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
                        <p className="text-green-700">{t.loading}</p>
                    </div>
                </div>
            </Screen>
        );
    }

    return (
        <Screen padded>
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <button
                                onClick={() => router.push(`/${locale}/authority/ddo/dashboard`)}
                                className="flex items-center gap-2 text-green-700 hover:text-green-900 mb-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                {t.back}
                            </button>
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-green-900">
                                {t.title}
                            </h1>
                            <p className="text-sm text-green-900/70 mt-1">
                                {t.subtitle}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Error/Success Messages */}
                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                        <div className="flex items-center gap-2 text-red-700">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    </div>
                )}

                {success && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                        <div className="flex items-center gap-2 text-green-700">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span>{success}</span>
                        </div>
                    </div>
                )}

                {/* Profile Content */}
                {profile && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column - Profile Info & Photo */}
                        <div className="lg:col-span-1">
                            <div className="bg-white border border-green-100 rounded-2xl p-6 shadow-sm">
                                <div className="flex flex-col items-center">
                                    {/* Profile Photo */}
                                    <div className="relative mb-4">
                                        {profile.profilePhoto ? (
                                            <img
                                                src={profile.profilePhoto}
                                                alt={profile.name}
                                                className="w-32 h-32 rounded-full border-4 border-green-100 object-cover"
                                            />
                                        ) : (
                                            <div className="w-32 h-32 rounded-full bg-green-600 border-4 border-green-100 flex items-center justify-center">
                                                <span className="text-white text-4xl font-bold">
                                                    {profile.name.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                        )}

                                        {/* Verification Badge */}
                                        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    </div>

                                    {/* Basic Info */}
                                    <h2 className="text-xl font-extrabold text-green-900 text-center mb-1">
                                        {profile.name}
                                    </h2>
                                    <p className="text-sm text-green-700 text-center mb-4">
                                        {profile.designation}
                                    </p>

                                    {/* Status Badges */}
                                    <div className="flex flex-wrap gap-2 mb-6">
                                        <span className="text-xs px-3 py-1 bg-green-100 text-green-800 rounded-full font-bold">
                                            {profile.role.toUpperCase()}
                                        </span>
                                        <span className={`text-xs px-3 py-1 rounded-full font-bold ${profile.verificationStatus === 'verified' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {profile.verificationStatus === 'verified' ? 'Verified' : 'Pending Verification'}
                                        </span>
                                        <span className="text-xs px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-bold">
                                            {profile.district}
                                        </span>
                                    </div>

                                    {/* Stats */}
                                    <div className="w-full space-y-4">
                                        <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                                            <span className="text-sm font-bold text-green-900">Member Since</span>
                                            <span className="text-sm text-green-700">{profile.joinedDate}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                                            <span className="text-sm font-bold text-green-900">Last Active</span>
                                            <span className="text-sm text-green-700">{profile.lastActive}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Profile Form */}
                        <div className="lg:col-span-2">
                            <ProfileForm
                                profile={profile}
                                onUpdate={handleUpdateProfile}
                                onUploadPhoto={handleUploadPhoto}
                                locale={locale}
                            />
                        </div>
                    </div>
                )}
            </div>
        </Screen>
    );
}