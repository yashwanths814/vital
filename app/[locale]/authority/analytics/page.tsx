// app/[locale]/authority/analytics/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Screen from "../../../components/Screen";
import { auth, db } from "../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
    collection,
    getDocs,
    Timestamp,
    doc,
    getDoc,
} from "firebase/firestore";

type Locale = "en" | "kn" | "hi";

type Issue = {
    status?: string;
    createdAt?: any;
    category?: string;
    panchayatId?: string;
};

function toDate(v: any): Date | null {
    try {
        if (!v) return null;
        if (v instanceof Timestamp) return v.toDate();
        if (v?.toDate) return v.toDate();
        const d = new Date(v);
        if (isNaN(d.getTime())) return null;
        return d;
    } catch {
        return null;
    }
}

function daysBetween(from: any, to: Date) {
    const d = toDate(from);
    if (!d) return 0;
    return Math.floor((to.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

function yyyyMmDd(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const da = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${da}`;
}

function addDays(d: Date, n: number) {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
}

export default function AnalyticsPage() {
    const router = useRouter();
    const params = useParams() as { locale?: string };
    const locale = (params?.locale || "en") as Locale;

    const t = useMemo(() => {
        const L: Record<Locale, any> = {
            en: {
                title: "Analytics",
                subtitle: "Delay • SLA breach • Heatmap • Trend",
                loading: "Loading…",
                total: "Total",
                delayed: "Delayed",
                sla: "SLA Breach",
                buckets: "Delay buckets",
                trend: "7-day trend (new issues)",
                heatmap: "Heatmap (by Panchayat)",
                categories: "Top categories",
                errors: {
                    generic: "Analytics load failed.",
                },
                kpiHelp: {
                    delayed: "Age > 3 days AND not resolved",
                    sla: "Age > allowed SLA days AND not resolved",
                },
            },
            kn: {
                title: "ವಿಶ್ಲೇಷಣೆ",
                subtitle: "ತಡ • SLA ಉಲ್ಲಂಘನೆ • ಹೀಟ್‌ಮ್ಯಾಪ್ • ಟ್ರೆಂಡ್",
                loading: "ಲೋಡ್ ಆಗುತ್ತಿದೆ…",
                total: "ಒಟ್ಟು",
                delayed: "ತಡವಾದವು",
                sla: "SLA ಉಲ್ಲಂಘನೆ",
                buckets: "ತಡ ವರ್ಗಗಳು",
                trend: "7 ದಿನ ಟ್ರೆಂಡ್ (ಹೊಸ ಸಮಸ್ಯೆಗಳು)",
                heatmap: "ಹೀಟ್‌ಮ್ಯಾಪ್ (ಪಂಚಾಯತ್)",
                categories: "ಟಾಪ್ ವರ್ಗಗಳು",
                errors: { generic: "ವಿಶ್ಲೇಷಣೆ ಲೋಡ್ ಆಗಲಿಲ್ಲ." },
                kpiHelp: {
                    delayed: "3 ದಿನಕ್ಕಿಂತ ಹೆಚ್ಚು AND ಪರಿಹಾರವಾಗಿಲ್ಲ",
                    sla: "SLA ದಿನ ಮೀರಿದೆ AND ಪರಿಹಾರವಾಗಿಲ್ಲ",
                },
            },
            hi: {
                title: "एनालिटिक्स",
                subtitle: "देरी • SLA उल्लंघन • हीटमैप • ट्रेंड",
                loading: "लोड हो रहा है…",
                total: "कुल",
                delayed: "देरी वाले",
                sla: "SLA उल्लंघन",
                buckets: "देरी बकेट",
                trend: "7 दिन ट्रेंड (नए मुद्दे)",
                heatmap: "हीटमैप (पंचायत)",
                categories: "टॉप कैटेगरी",
                errors: { generic: "एनालिटिक्स लोड नहीं हुआ।" },
                kpiHelp: {
                    delayed: "3 दिन से अधिक AND resolved नहीं",
                    sla: "SLA दिन पार AND resolved नहीं",
                },
            },
        };
        return L[locale] || L.en;
    }, [locale]);

    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    const [kpi, setKpi] = useState({ total: 0, delayed: 0, slaBreached: 0 });

    // delay buckets
    const [bucket, setBucket] = useState({
        "0-2": 0,
        "3-7": 0,
        "8+": 0,
    });

    // trend last 7 days: date -> count
    const [trend, setTrend] = useState<{ day: string; count: number }[]>([]);

    // heatmap panchayat
    const [heatmap, setHeatmap] = useState<Record<string, number>>({});

    // top categories
    const [topCats, setTopCats] = useState<{ key: string; count: number }[]>([]);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            try {
                setErr("");
                setLoading(true);

                if (!user) {
                    router.replace(`/${locale}/authority/login`);
                    return;
                }

                // SLA config
                const slaSnap = await getDoc(doc(db, "config", "sla"));
                const sla = (slaSnap.exists() ? slaSnap.data() : {}) as any;

                // Simple default SLA total (you can refine per-role later)
                const allowedDays =
                    (sla?.villager_to_vi_days || 2) +
                    (sla?.vi_to_pdo_days || 3) +
                    (sla?.pdo_to_resolve_days || 7);

                const today = new Date();

                const snap = await getDocs(collection(db, "issues"));

                let total = 0;
                let delayed = 0;
                let breached = 0;

                const b = { "0-2": 0, "3-7": 0, "8+": 0 } as any;

                const heat: Record<string, number> = {};
                const cats: Record<string, number> = {};

                // trend window (last 7 days incl today)
                const start = addDays(today, -6);
                const trendMap: Record<string, number> = {};
                for (let i = 0; i < 7; i++) trendMap[yyyyMmDd(addDays(start, i))] = 0;

                snap.forEach((d) => {
                    const it = d.data() as Issue;
                    total++;

                    const age = daysBetween(it.createdAt, today);
                    const isResolved = String(it.status || "").toLowerCase() === "resolved";

                    if (!isResolved) {
                        if (age > 3) delayed++;
                        if (age > allowedDays) breached++;
                    }

                    // buckets only for NOT resolved (usually what authority cares)
                    if (!isResolved) {
                        if (age <= 2) b["0-2"]++;
                        else if (age <= 7) b["3-7"]++;
                        else b["8+"]++;
                    }

                    if (it.panchayatId) heat[it.panchayatId] = (heat[it.panchayatId] || 0) + 1;
                    const c = String(it.category || "").trim() || "Uncategorized";
                    cats[c] = (cats[c] || 0) + 1;

                    const created = toDate(it.createdAt);
                    if (created) {
                        const key = yyyyMmDd(created);
                        if (key in trendMap) trendMap[key] = (trendMap[key] || 0) + 1;
                    }
                });

                const trendArr = Object.entries(trendMap)
                    .sort((a, b) => a[0].localeCompare(b[0]))
                    .map(([day, count]) => ({ day, count }));

                const top = Object.entries(cats)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 8)
                    .map(([key, count]) => ({ key, count }));

                setKpi({ total, delayed, slaBreached: breached });
                setBucket(b);
                setHeatmap(heat);
                setTrend(trendArr);
                setTopCats(top);

                setLoading(false);
            } catch (e: any) {
                setErr(e?.message || t.errors.generic);
                setLoading(false);
            }
        });

        return () => unsub();
    }, [locale, router, t.errors.generic]);

    const maxBucket = Math.max(bucket["0-2"], bucket["3-7"], bucket["8+"], 1);
    const maxTrend = Math.max(...trend.map((x) => x.count), 1);
    const maxHeat = Math.max(...Object.values(heatmap), 1);
    const maxCat = Math.max(...topCats.map((x) => x.count), 1);

    return (
        <Screen padded>
            <div className="max-w-5xl mx-auto">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h1 className="text-xl sm:text-2xl font-extrabold text-green-900">
                            {t.title}
                        </h1>
                        <p className="text-sm text-green-900/70 mt-1">{t.subtitle}</p>
                    </div>

                    <button
                        onClick={() => router.back()}
                        className="shrink-0 rounded-xl border border-green-200 bg-white px-3 py-2 text-sm font-bold text-green-900"
                    >
                        ←
                    </button>
                </div>

                {loading ? (
                    <div className="mt-6 text-sm text-green-800">{t.loading}</div>
                ) : err ? (
                    <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                        {err}
                    </div>
                ) : (
                    <>
                        {/* KPI */}
                        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <KpiCard label={t.total} value={kpi.total} />
                            <KpiCard label={t.delayed} value={kpi.delayed} hint={t.kpiHelp.delayed} />
                            <KpiCard label={t.sla} value={kpi.slaBreached} hint={t.kpiHelp.sla} />
                        </div>

                        {/* Buckets + Trend */}
                        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* Buckets bar */}
                            <Panel title={t.buckets}>
                                <BarRow label="0–2" value={bucket["0-2"]} max={maxBucket} />
                                <BarRow label="3–7" value={bucket["3-7"]} max={maxBucket} />
                                <BarRow label="8+" value={bucket["8+"]} max={maxBucket} />
                            </Panel>

                            {/* Trend line-ish */}
                            <Panel title={t.trend}>
                                <div className="grid grid-cols-7 gap-2 items-end h-24">
                                    {trend.map((x) => (
                                        <div key={x.day} className="flex flex-col items-center gap-1">
                                            <div
                                                className="w-full rounded-lg border border-green-200 bg-green-50"
                                                style={{ height: `${Math.max(6, Math.round((x.count / maxTrend) * 96))}px` }}
                                                title={`${x.day}: ${x.count}`}
                                            />
                                            <div className="text-[10px] text-green-900/60">
                                                {x.day.slice(5)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Panel>
                        </div>

                        {/* Heatmap + Categories */}
                        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <Panel title={t.heatmap}>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {Object.entries(heatmap)
                                        .sort((a, b) => b[1] - a[1])
                                        .slice(0, 12)
                                        .map(([k, v]) => {
                                            const intensity = Math.round((v / maxHeat) * 100);
                                            return (
                                                <div
                                                    key={k}
                                                    className="rounded-xl border border-green-100 bg-white p-3"
                                                >
                                                    <div className="text-[11px] text-green-900/60">Panchayat</div>
                                                    <div className="font-extrabold text-green-900 truncate">{k}</div>
                                                    <div className="mt-2 h-2 rounded-full bg-green-100 overflow-hidden">
                                                        <div
                                                            className="h-full bg-green-600"
                                                            style={{ width: `${Math.max(8, intensity)}%` }}
                                                        />
                                                    </div>
                                                    <div className="mt-1 text-xs text-green-900/70">{v} issues</div>
                                                </div>
                                            );
                                        })}
                                </div>
                            </Panel>

                            <Panel title={t.categories}>
                                {topCats.map((c) => (
                                    <div key={c.key} className="mb-3">
                                        <div className="flex items-center justify-between text-xs">
                                            <div className="font-bold text-green-900 truncate">{c.key}</div>
                                            <div className="text-green-900/70">{c.count}</div>
                                        </div>
                                        <div className="mt-1 h-2 rounded-full bg-green-100 overflow-hidden">
                                            <div
                                                className="h-full bg-green-600"
                                                style={{ width: `${Math.max(8, Math.round((c.count / maxCat) * 100))}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </Panel>
                        </div>
                    </>
                )}
            </div>
        </Screen>
    );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="rounded-2xl border border-green-100 bg-white p-4 sm:p-5">
            <div className="text-sm font-extrabold text-green-900 mb-3">{title}</div>
            {children}
        </div>
    );
}

function KpiCard({
    label,
    value,
    hint,
}: {
    label: string;
    value: number;
    hint?: string;
}) {
    return (
        <div className="rounded-2xl border border-green-100 bg-white p-4">
            <div className="text-xs text-green-900/70">{label}</div>
            <div className="mt-1 text-3xl font-extrabold text-green-900">{value}</div>
            {hint ? <div className="mt-1 text-[11px] text-green-900/50">{hint}</div> : null}
        </div>
    );
}

function BarRow({ label, value, max }: { label: string; value: number; max: number }) {
    const pct = Math.round((value / max) * 100);
    return (
        <div className="mb-3">
            <div className="flex items-center justify-between text-xs">
                <div className="font-bold text-green-900">{label}</div>
                <div className="text-green-900/70">{value}</div>
            </div>
            <div className="mt-1 h-2 rounded-full bg-green-100 overflow-hidden">
                <div
                    className="h-full bg-green-600"
                    style={{ width: `${Math.max(6, pct)}%` }}
                />
            </div>
        </div>
    );
}
