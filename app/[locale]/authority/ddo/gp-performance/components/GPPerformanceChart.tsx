// app/[locale]/authority/ddo/gp-performance/components/GPPerformanceChart.tsx
"use client";

import { useState } from "react";

interface GPPerformance {
    id: string;
    name: string;
    taluk: string;
    totalIssues: number;
    resolved: number;
    pending: number;
    escalated: number;
    resolutionRate: number;
    averageResolutionTime: number;
    last30DaysResolved: number;
    categoryBreakdown: Array<{
        category: string;
        count: number;
        resolved: number;
    }>;
    trends: Array<{
        month: string;
        resolved: number;
        created: number;
    }>;
}

interface GPPerformanceChartProps {
    data: GPPerformance[];
    locale: string;
}

export default function GPPerformanceChart({ data, locale }: GPPerformanceChartProps) {
    const [chartType, setChartType] = useState<"resolution" | "volume" | "trend">("resolution");

    // Get top 10 GPs for the chart
    const chartData = data.slice(0, 10);

    // Get max value for scaling
    const maxResolutionRate = Math.max(...chartData.map(gp => gp.resolutionRate));
    const maxTotalIssues = Math.max(...chartData.map(gp => gp.totalIssues));

    return (
        <div className="bg-white border border-green-100 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-green-900">
                    Top 10 Gram Panchayats Performance
                </h3>
                <div className="flex gap-2">
                    <button
                        onClick={() => setChartType("resolution")}
                        className={`px-3 py-1 text-sm rounded-lg ${chartType === "resolution" ? 'bg-green-700 text-white' : 'bg-green-50 text-green-700'}`}
                    >
                        Resolution Rate
                    </button>
                    <button
                        onClick={() => setChartType("volume")}
                        className={`px-3 py-1 text-sm rounded-lg ${chartType === "volume" ? 'bg-green-700 text-white' : 'bg-green-50 text-green-700'}`}
                    >
                        Issue Volume
                    </button>
                    <button
                        onClick={() => setChartType("trend")}
                        className={`px-3 py-1 text-sm rounded-lg ${chartType === "trend" ? 'bg-green-700 text-white' : 'bg-green-50 text-green-700'}`}
                    >
                        Trend
                    </button>
                </div>
            </div>

            <div className="h-64">
                {chartType === "resolution" ? (
                    <div className="flex items-end h-full gap-2 pt-8 border-b border-l border-green-200">
                        {chartData.map((gp, index) => {
                            const height = (gp.resolutionRate / maxResolutionRate) * 100;
                            return (
                                <div key={gp.id} className="flex-1 flex flex-col items-center">
                                    <div className="relative w-full flex justify-center">
                                        <div
                                            className={`w-10 rounded-t-lg ${gp.resolutionRate >= 90 ? 'bg-green-500' : gp.resolutionRate >= 75 ? 'bg-green-400' : gp.resolutionRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                            style={{ height: `${height}%` }}
                                        >
                                            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold text-green-900 whitespace-nowrap">
                                                {gp.resolutionRate}%
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-2 text-xs text-green-700 text-center truncate w-full" title={gp.name}>
                                        {gp.name.split(' ')[0]}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : chartType === "volume" ? (
                    <div className="flex items-end h-full gap-2 pt-8 border-b border-l border-green-200">
                        {chartData.map((gp) => {
                            const height = (gp.totalIssues / maxTotalIssues) * 100;
                            return (
                                <div key={gp.id} className="flex-1 flex flex-col items-center">
                                    <div className="relative w-full flex justify-center">
                                        <div
                                            className="w-10 rounded-t-lg bg-blue-500"
                                            style={{ height: `${height}%` }}
                                        >
                                            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold text-green-900 whitespace-nowrap">
                                                {gp.totalIssues}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-2 text-xs text-green-700 text-center truncate w-full" title={gp.name}>
                                        {gp.name.split(' ')[0]}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                        Trend chart visualization coming soon
                    </div>
                )}
            </div>

            <div className="mt-4 flex justify-center gap-4">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-xs text-green-700">≥90% (Excellent)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    <span className="text-xs text-green-700">75-89% (Good)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span className="text-xs text-green-700">60-74% (Average)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-xs text-green-700">{'<'}60% (Poor)</span>
                </div>
            </div>
        </div>
    );
}