// app/[locale]/authority/ddo/profile/ProfileForm.tsx
"use client";

import { useState } from "react";
import Image from "next/image";

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

interface ProfileFormProps {
    profile: DDOProfile;
    onUpdate: (data: Partial<DDOProfile>) => Promise<void>;
    onUploadPhoto: (file: File) => Promise<string | undefined>;
    locale: Locale;
}

export default function ProfileForm({ profile, onUpdate, onUploadPhoto, locale }: ProfileFormProps) {
    const [formData, setFormData] = useState<Partial<DDOProfile>>({
        name: profile.name,
        phone: profile.phone || "",
        designation: profile.designation || "",
        address: profile.address || "",
        officeAddress: profile.officeAddress || "",
    });
    const [isEditing, setIsEditing] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);

    /* 🌐 Multilingual text */
    const t = {
        en: {
            personalInfo: "Personal Information",
            contactInfo: "Contact Information",
            officeInfo: "Office Information",
            name: "Full Name",
            email: "Email Address",
            phone: "Phone Number",
            district: "District",
            role: "Role",
            designation: "Designation",
            address: "Residential Address",
            officeAddress: "Office Address",
            jurisdiction: "Jurisdiction",
            edit: "Edit Profile",
            cancel: "Cancel",
            save: "Save Changes",
            uploadPhoto: "Upload Photo",
            changePhoto: "Change Photo",
            photoUploading: "Uploading...",
            updateSuccess: "Profile updated successfully",
            fields: {
                required: "This field is required",
                invalidPhone: "Invalid phone number",
            },
        },
        kn: {
            personalInfo: "ವೈಯಕ್ತಿಕ ಮಾಹಿತಿ",
            contactInfo: "ಸಂಪರ್ಕ ಮಾಹಿತಿ",
            officeInfo: "ಕಛೇರಿ ಮಾಹಿತಿ",
            name: "ಪೂರ್ಣ ಹೆಸರು",
            email: "ಇಮೇಲ್ ವಿಳಾಸ",
            phone: "ಫೋನ್ ಸಂಖ್ಯೆ",
            district: "ಜಿಲ್ಲೆ",
            role: "ಪಾತ್ರ",
            designation: "ಹುದ್ದೆ",
            address: "ವಾಸದ ವಿಳಾಸ",
            officeAddress: "ಕಛೇರಿ ವಿಳಾಸ",
            jurisdiction: "ನ್ಯಾಯ ಕ್ಷೇತ್ರ",
            edit: "ಪ್ರೊಫೈಲ್ ಸಂಪಾದಿಸಿ",
            cancel: "ರದ್ದು ಮಾಡಿ",
            save: "ಬದಲಾವಣೆಗಳನ್ನು ಉಳಿಸಿ",
            uploadPhoto: "ಫೋಟೋ ಅಪ್ಲೋಡ್ ಮಾಡಿ",
            changePhoto: "ಫೋಟೋ ಬದಲಾಯಿಸಿ",
            photoUploading: "ಅಪ್ಲೋಡ್ ಆಗುತ್ತಿದೆ...",
            updateSuccess: "ಪ್ರೊಫೈಲ್ ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ",
            fields: {
                required: "ಈ ಕ್ಷೇತ್ರ ಅಗತ್ಯವಿದೆ",
                invalidPhone: "ಅಮಾನ್ಯ ಫೋನ್ ಸಂಖ್ಯೆ",
            },
        },
        hi: {
            personalInfo: "व्यक्तिगत जानकारी",
            contactInfo: "संपर्क जानकारी",
            officeInfo: "कार्यालय जानकारी",
            name: "पूरा नाम",
            email: "ईमेल पता",
            phone: "फ़ोन नंबर",
            district: "जिला",
            role: "भूमिका",
            designation: "पदनाम",
            address: "आवासीय पता",
            officeAddress: "कार्यालय का पता",
            jurisdiction: "अधिकार क्षेत्र",
            edit: "प्रोफ़ाइल संपादित करें",
            cancel: "रद्द करें",
            save: "परिवर्तन सहेजें",
            uploadPhoto: "फोटो अपलोड करें",
            changePhoto: "फोटो बदलें",
            photoUploading: "अपलोड हो रहा है...",
            updateSuccess: "प्रोफ़ाइल सफलतापूर्वक अपडेट की गई",
            fields: {
                required: "यह फ़ील्ड आवश्यक है",
                invalidPhone: "अमान्य फ़ोन नंबर",
            },
        },
    }[locale];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await onUpdate(formData);
            setIsEditing(false);
        } catch (error) {
            console.error("Error updating profile:", error);
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert("Please upload an image file");
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            alert("Image size should be less than 5MB");
            return;
        }

        try {
            setUploadingPhoto(true);
            await onUploadPhoto(file);
        } catch (error) {
            console.error("Error uploading photo:", error);
        } finally {
            setUploadingPhoto(false);
        }
    };

    return (
        <div className="bg-white border border-green-100 rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-extrabold text-green-900">
                    {isEditing ? t.edit : t.personalInfo}
                </h2>
                {!isEditing ? (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2 bg-green-700 text-white rounded-xl font-bold hover:bg-green-800 transition"
                    >
                        {t.edit}
                    </button>
                ) : (
                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                setIsEditing(false);
                                setFormData({
                                    name: profile.name,
                                    phone: profile.phone || "",
                                    designation: profile.designation || "",
                                    address: profile.address || "",
                                    officeAddress: profile.officeAddress || "",
                                });
                            }}
                            className="px-4 py-2 border border-green-200 text-green-700 rounded-xl font-bold hover:bg-green-50 transition"
                        >
                            {t.cancel}
                        </button>
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit}>
                {/* Personal Information */}
                <div className="mb-8">
                    <h3 className="text-lg font-bold text-green-900 mb-4">{t.personalInfo}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-green-900 mb-2">
                                {t.name} *
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name || ""}
                                onChange={handleChange}
                                disabled={!isEditing}
                                required
                                className={`w-full px-4 py-2 border rounded-xl ${isEditing ? 'border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-200' : 'border-green-100 bg-green-50'} text-green-900`}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-green-900 mb-2">
                                {t.email}
                            </label>
                            <input
                                type="email"
                                value={profile.email}
                                disabled
                                className="w-full px-4 py-2 border border-green-100 bg-green-50 rounded-xl text-green-900"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-green-900 mb-2">
                                {t.phone}
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone || ""}
                                onChange={handleChange}
                                disabled={!isEditing}
                                pattern="[0-9]{10}"
                                className={`w-full px-4 py-2 border rounded-xl ${isEditing ? 'border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-200' : 'border-green-100 bg-green-50'} text-green-900`}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-green-900 mb-2">
                                {t.designation}
                            </label>
                            <input
                                type="text"
                                name="designation"
                                value={formData.designation || ""}
                                onChange={handleChange}
                                disabled={!isEditing}
                                className={`w-full px-4 py-2 border rounded-xl ${isEditing ? 'border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-200' : 'border-green-100 bg-green-50'} text-green-900`}
                            />
                        </div>
                    </div>

                    {/* Address */}
                    <div className="mt-4">
                        <label className="block text-sm font-bold text-green-900 mb-2">
                            {t.address}
                        </label>
                        <textarea
                            name="address"
                            value={formData.address || ""}
                            onChange={handleChange}
                            disabled={!isEditing}
                            rows={3}
                            className={`w-full px-4 py-2 border rounded-xl ${isEditing ? 'border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-200' : 'border-green-100 bg-green-50'} text-green-900`}
                        />
                    </div>
                </div>

                {/* Office Information */}
                <div className="mb-8">
                    <h3 className="text-lg font-bold text-green-900 mb-4">{t.officeInfo}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-green-900 mb-2">
                                {t.district}
                            </label>
                            <input
                                type="text"
                                value={profile.district}
                                disabled
                                className="w-full px-4 py-2 border border-green-100 bg-green-50 rounded-xl text-green-900"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-green-900 mb-2">
                                {t.role}
                            </label>
                            <input
                                type="text"
                                value={profile.role.toUpperCase()}
                                disabled
                                className="w-full px-4 py-2 border border-green-100 bg-green-50 rounded-xl text-green-900"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-green-900 mb-2">
                                {t.jurisdiction}
                            </label>
                            <input
                                type="text"
                                value={profile.jurisdiction || profile.district}
                                disabled
                                className="w-full px-4 py-2 border border-green-100 bg-green-50 rounded-xl text-green-900"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-green-900 mb-2">
                                District ID
                            </label>
                            <input
                                type="text"
                                value={profile.districtId}
                                disabled
                                className="w-full px-4 py-2 border border-green-100 bg-green-50 rounded-xl text-green-900"
                            />
                        </div>
                    </div>

                    {/* Office Address */}
                    <div className="mt-4">
                        <label className="block text-sm font-bold text-green-900 mb-2">
                            {t.officeAddress}
                        </label>
                        <textarea
                            name="officeAddress"
                            value={formData.officeAddress || ""}
                            onChange={handleChange}
                            disabled={!isEditing}
                            rows={3}
                            className={`w-full px-4 py-2 border rounded-xl ${isEditing ? 'border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-200' : 'border-green-100 bg-green-50'} text-green-900`}
                        />
                    </div>
                </div>

                {/* Photo Upload Section */}
                <div className="mb-8">
                    <h3 className="text-lg font-bold text-green-900 mb-4">Profile Photo</h3>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            {profile.profilePhoto ? (
                                <img
                                    src={profile.profilePhoto}
                                    alt={profile.name}
                                    className="w-20 h-20 rounded-full border-4 border-green-100 object-cover"
                                />
                            ) : (
                                <div className="w-20 h-20 rounded-full bg-green-600 border-4 border-green-100 flex items-center justify-center">
                                    <span className="text-white text-xl font-bold">
                                        {profile.name.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="block">
                                <span className="sr-only">{t.uploadPhoto}</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handlePhotoUpload}
                                    className="hidden"
                                    id="photo-upload"
                                    disabled={uploadingPhoto}
                                />
                                <label
                                    htmlFor="photo-upload"
                                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold cursor-pointer ${uploadingPhoto ? 'bg-gray-100 text-gray-700' : 'bg-green-700 text-white hover:bg-green-800'}`}
                                >
                                    {uploadingPhoto ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            {t.photoUploading}
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                            </svg>
                                            {t.changePhoto}
                                        </>
                                    )}
                                </label>
                            </label>
                            <p className="text-xs text-green-600 mt-2">
                                Supported formats: JPG, PNG, GIF • Max size: 5MB
                            </p>
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                {isEditing && (
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            className="px-6 py-3 bg-green-700 text-white rounded-xl font-bold hover:bg-green-800 transition flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {t.save}
                        </button>
                    </div>
                )}
            </form>
        </div>
    );
}