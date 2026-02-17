"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Screen from "../../components/Screen";

const LANGS = [
    { code: "en", label: "English" },
    { code: "kn", label: "ಕನ್ನಡ" },
    { code: "hi", label: "हिन्दी" },
];

export default function LanguagePage() {
    const router = useRouter();
    const params = useParams() as { locale?: string };
    const currentLocale = params?.locale || "en";

    const [show, setShow] = useState(false);

    useEffect(() => setShow(true), []);

    const t = useMemo(() => {
        const L: any = {
            en: {
                title: "Choose Language",
                current: "Current:",
                hint: "You can change language anytime later.",
            },
            kn: {
                title: "ಭಾಷೆ ಆಯ್ಕೆಮಾಡಿ",
                current: "ಪ್ರಸ್ತುತ:",
                hint: "ನಂತರವೂ ಭಾಷೆಯನ್ನು ಬದಲಾಯಿಸಬಹುದು.",
            },
            hi: {
                title: "भाषा चुनें",
                current: "वर्तमान:",
                hint: "आप बाद में कभी भी भाषा बदल सकते हैं।",
            },
        };
        return L[currentLocale] || L.en;
    }, [currentLocale]);

    const pick = (code: string) => {
        try {
            localStorage.setItem("vital_lang", code);
        } catch { }
        router.replace(`/${code}/role-select`);
    };

    return (
        <Screen center padded={false}>
            <div className="w-full max-w-sm px-6 text-center">
                {/* Title */}
                <div
                    className={`text-2xl sm:text-3xl font-extrabold tracking-wide text-green-900
          transition-all duration-700 ease-out
          ${show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}
          drop-shadow-[0_2px_6px_rgba(20,83,45,0.18)]`}
                >
                    {t.title}
                </div>

                {/* Current locale badge */}
                <div
                    className={`mt-3 inline-flex items-center gap-2 rounded-full px-4 py-1.5
          bg-white/70 border border-green-200 text-green-900
          text-xs sm:text-sm font-semibold
          transition-all duration-700 delay-150 ease-out
          ${show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
                >
                    <span className="opacity-80">{t.current}</span>
                    <span className="font-extrabold tracking-widest">
                        {currentLocale.toUpperCase()}
                    </span>
                </div>

                {/* Buttons */}
                <div
                    className={`mt-8 w-full space-y-3
          transition-all duration-700 delay-300 ease-out
          ${show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
                >
                    {LANGS.map((l) => (
                        <button
                            key={l.code}
                            onClick={() => pick(l.code)}
                            className="w-full rounded-2xl bg-white/75 border border-green-200 px-5 py-4
              text-green-900 font-bold shadow-sm
              active:scale-[0.99] transition
              hover:bg-white focus:outline-none focus:ring-2 focus:ring-green-300"
                        >
                            <span className="text-base sm:text-lg">{l.label}</span>
                        </button>
                    ))}
                </div>

                {/* Hint */}
                <div
                    className={`mt-6 text-xs sm:text-sm text-green-800/80 font-medium
          transition-all duration-700 delay-[450ms] ease-out
          ${show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
                >
                    {t.hint}
                </div>
            </div>
        </Screen>
    );
}
