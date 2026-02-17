"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth, db } from "../../../lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import Screen from "../../../components/Screen";

type Locale = "en" | "kn" | "hi";

export default function VillagerConfirmPage() {
    const router = useRouter();
    const { locale = "en" } = useParams() as { locale: Locale };

    const [checking, setChecking] = useState(true);

    const t = useMemo(() => {
        const L: Record<Locale, any> = {
            en: {
                title: "Verification Pending",
                subtitle:
                    "Your account is under verification by the Village In-charge.",
                note:
                    "Once verified, you will automatically be redirected to raise issues.",
                waiting: "Waiting for verification…",
            },
            kn: {
                title: "ಪರಿಶೀಲನೆ ಬಾಕಿಯಿದೆ",
                subtitle:
                    "ನಿಮ್ಮ ಖಾತೆಯನ್ನು ಗ್ರಾಮ ಇನ್‌ಚಾರ್ಜ್ ಪರಿಶೀಲಿಸುತ್ತಿದ್ದಾರೆ.",
                note:
                    "ಪರಿಶೀಲನೆ ಪೂರ್ಣವಾದ ನಂತರ ನೀವು ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಮುಂದಕ್ಕೆ ಸಾಗುತ್ತೀರಿ.",
                waiting: "ಪರಿಶೀಲನೆಗಾಗಿ ಕಾಯಲಾಗುತ್ತಿದೆ…",
            },
            hi: {
                title: "सत्यापन लंबित",
                subtitle:
                    "आपका अकाउंट ग्राम इंचार्ज द्वारा सत्यापन में है।",
                note:
                    "सत्यापन पूरा होते ही आपको स्वतः आगे भेज दिया जाएगा।",
                waiting: "सत्यापन की प्रतीक्षा…",
            },
        };
        return L[locale];
    }, [locale]);

    useEffect(() => {
        const u = auth.currentUser;
        if (!u) {
            router.replace(`/${locale}/villager/login`);
            return;
        }

        const ref = doc(db, "users", u.uid);

        const unsub = onSnapshot(ref, (snap) => {
            if (!snap.exists()) return;

            const data = snap.data() as any;

            // ✅ once verified → redirect instantly
            if (data.verified === true) {
                router.replace(`/${locale}/villager/issues`);
            } else {
                setChecking(false);
            }
        });

        return () => unsub();
    }, [router, locale]);

    if (checking) {
        return (
            <Screen center>
                <Spinner />
            </Screen>
        );
    }

    return (
        <Screen center>
            <div className="max-w-md text-center px-4">
                <div className="mx-auto w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />

                <h1 className="mt-6 text-2xl font-extrabold text-green-900">
                    {t.title}
                </h1>

                <p className="mt-2 text-sm text-green-800/80">
                    {t.subtitle}
                </p>

                <p className="mt-4 text-xs text-green-900/60">
                    {t.note}
                </p>

                <div className="mt-6 text-green-700 font-semibold">
                    {t.waiting}
                </div>
            </div>
        </Screen>
    );
}

function Spinner() {
    return (
        <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
    );
}
