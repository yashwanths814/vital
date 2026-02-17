"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Screen from "../../../components/Screen";

export default function AdminEscalationsPage() {
    const router = useRouter();
    const params = useParams() as { locale?: string };
    const locale = params?.locale || "en";

    const t = useMemo(() => {
        const L: any = {
            en: { title: "SLA & Escalations", back: "Back", msg: "Add SLA overdue / escalated issues view here." },
            kn: { title: "SLA & ಎಸ್ಕಲೇಶನ್", back: "ಹಿಂದೆ", msg: "ಇಲ್ಲಿ SLA ವಿಳಂಬ / ಎಸ್ಕಲೇಶನ್ ಪಟ್ಟಿಯನ್ನು ಸೇರಿಸಿ." },
            hi: { title: "SLA और एस्केलेशन", back: "वापस", msg: "यहाँ SLA overdue / escalated issues list जोड़ें।" },
        };
        return L[locale] || L.en;
    }, [locale]);

    return (
        <Screen padded>
            <div className="flex items-start justify-between gap-3">
                <h1 className="text-xl sm:text-2xl font-extrabold text-green-900">{t.title}</h1>
                <button
                    onClick={() => router.back()}
                    className="shrink-0 px-4 py-2 rounded-xl bg-white border border-green-200 text-green-900 font-extrabold hover:bg-green-50"
                >
                    {t.back}
                </button>
            </div>

            <div className="mt-6 rounded-2xl border border-green-200 bg-white px-4 py-4 text-sm font-semibold text-green-800">
                {t.msg}
            </div>
        </Screen>
    );
}
