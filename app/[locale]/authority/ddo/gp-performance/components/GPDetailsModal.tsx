// app/[locale]/authority/ddo/gp-performance/components/GPDetailsModal.tsx
"use client";

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

interface GPDetailsModalProps {
    gp: GPPerformance;
    onClose: () => void;
    locale: string;
    t: {
        title: string;
        close: string;
        export: string;
    };
}

export default function GPDetailsModal({ gp, onClose, locale, t }: GPDetailsModalProps) {
    const handleExportReport = () => {
        const reportData = {
            gpName: gp.name,
            taluk: gp.taluk,
            generatedAt: new Date().toISOString(),
            performanceMetrics: {
                resolutionRate: gp.resolutionRate,
                averageResolutionTime: gp.averageResolutionTime,
                totalIssues: gp.totalIssues,
                resolved: gp.resolved,
                pending: gp.pending,
                escalated: gp.escalated,
                last30DaysResolved: gp.last30DaysResolved,
            },
            categoryBreakdown: gp.categoryBreakdown,
            trends: gp.trends,
        };

        const dataStr = JSON.stringify(reportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `gp-report-${gp.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-xl font-extrabold text-green-900">{t.title}</h3>
                            <p className="text-sm text-green-700">{gp.name} • {gp.taluk}</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleExportReport}
                                className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                {t.export}
                            </button>
                            <button
                                onClick={onClose}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Performance Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                            <p className="text-sm font-bold text-green-900/70 mb-1">Resolution Rate</p>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-2xl font-extrabold text-green-900">
                                    {gp.resolutionRate}%
                                </h3>
                                <span className={`text-sm font-bold ${gp.resolutionRate >= 90 ? 'text-green-600' : gp.resolutionRate >= 75 ? 'text-yellow-600' : 'text-red-600'}`}>
                                    {gp.resolutionRate >= 90 ? 'Excellent' : gp.resolutionRate >= 75 ? 'Good' : 'Needs Improvement'}
                                </span>
                            </div>
                        </div>

                        <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                            <p className="text-sm font-bold text-green-900/70 mb-1">Avg Resolution Time</p>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-2xl font-extrabold text-green-900">
                                    {gp.averageResolutionTime} days
                                </h3>
                                <span className={`text-sm font-bold ${gp.averageResolutionTime <= 7 ? 'text-green-600' : gp.averageResolutionTime <= 14 ? 'text-yellow-600' : 'text-red-600'}`}>
                                    {gp.averageResolutionTime <= 7 ? 'Fast' : gp.averageResolutionTime <= 14 ? 'Average' : 'Slow'}
                                </span>
                            </div>
                        </div>

                        <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                            <p className="text-sm font-bold text-green-900/70 mb-1">Last 30 Days Resolved</p>
                            <h3 className="text-2xl font-extrabold text-green-900">
                                {gp.last30DaysResolved}
                            </h3>
                            <p className="text-xs text-green-600">
                                {Math.round((gp.last30DaysResolved / gp.resolved) * 100)}% of total resolved
                            </p>
                        </div>

                        <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                            <p className="text-sm font-bold text-green-900/70 mb-1">Escalation Rate</p>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-2xl font-extrabold text-green-900">
                                    {gp.totalIssues > 0 ? Math.round((gp.escalated / gp.totalIssues) * 100) : 0}%
                                </h3>
                                <span className={`text-sm font-bold ${gp.escalated === 0 ? 'text-green-600' : gp.escalated <= 2 ? 'text-yellow-600' : 'text-red-600'}`}>
                                    {gp.escalated === 0 ? 'No escalations' : 'Needs attention'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Category Breakdown */}
                    <div className="mb-8">
                        <h4 className="text-lg font-bold text-green-900 mb-4">Category-wise Performance</h4>
                        <div className="space-y-3">
                            {gp.categoryBreakdown.map((category) => {
                                const resolutionRate = category.count > 0 ? Math.round((category.resolved / category.count) * 100) : 0;
                                return (
                                    <div key={category.category} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                            <span className="font-bold text-green-900">{category.category}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-sm text-green-700">
                                                {category.resolved}/{category.count} resolved
                                            </span>
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${resolutionRate >= 90 ? 'bg-green-100 text-green-800' : resolutionRate >= 75 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                                {resolutionRate}%
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Monthly Trends */}
                    <div className="mb-8">
                        <h4 className="text-lg font-bold text-green-900 mb-4">Monthly Performance Trend</h4>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-green-50">
                                        <th className="py-3 px-4 text-left text-sm font-bold text-green-900">Month</th>
                                        <th className="py-3 px-4 text-left text-sm font-bold text-green-900">Issues Created</th>
                                        <th className="py-3 px-4 text-left text-sm font-bold text-green-900">Issues Resolved</th>
                                        <th className="py-3 px-4 text-left text-sm font-bold text-green-900">Resolution Rate</th>
                                        <th className="py-3 px-4 text-left text-sm font-bold text-green-900">Trend</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {gp.trends.map((month, index) => {
                                        const resolutionRate = month.created > 0 ? Math.round((month.resolved / month.created) * 100) : 0;
                                        return (
                                            <tr key={index} className="border-b border-green-50">
                                                <td className="py-3 px-4 font-bold text-green-900">{month.month}</td>
                                                <td className="py-3 px-4">{month.created}</td>
                                                <td className="py-3 px-4">{month.resolved}</td>
                                                <td className="py-3 px-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${resolutionRate >= 90 ? 'bg-green-100 text-green-800' : resolutionRate >= 75 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                                        {resolutionRate}%
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    {index > 0 && (
                                                        <span className={`flex items-center gap-1 ${resolutionRate > gp.trends[index - 1].resolved ? 'text-green-600' : 'text-red-600'}`}>
                                                            {resolutionRate > gp.trends[index - 1].resolved ? '↑ Improving' : '↓ Declining'}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Summary & Recommendations */}
                    <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-6">
                        <h4 className="text-lg font-bold text-green-900 mb-4">Recommendations</h4>
                        <div className="space-y-3">
                            {gp.resolutionRate < 75 && (
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                        <svg className="w-3 h-3 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <p className="text-sm text-green-900">
                                        <span className="font-bold">Improve Resolution Rate:</span> Current rate of {gp.resolutionRate}% is below the district average. Focus on faster issue resolution.
                                    </p>
                                </div>
                            )}
                            {gp.escalated > 0 && (
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                                        <svg className="w-3 h-3 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <p className="text-sm text-green-900">
                                        <span className="font-bold">Address Escalations:</span> {gp.escalated} issues have been escalated. Review these cases for timely resolution.
                                    </p>
                                </div>
                            )}
                            {gp.pending > 5 && (
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                                        <svg className="w-3 h-3 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <p className="text-sm text-green-900">
                                        <span className="font-bold">Reduce Pending Issues:</span> {gp.pending} issues are pending. Prioritize resolution to prevent escalation.
                                    </p>
                                </div>
                            )}
                            {gp.averageResolutionTime > 14 && (
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                        <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <p className="text-sm text-green-900">
                                        <span className="font-bold">Improve Resolution Time:</span> Average resolution time of {gp.averageResolutionTime} days exceeds target. Streamline processes.
                                    </p>
                                </div>
                            )}
                            {gp.resolutionRate >= 90 && (
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                        <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <p className="text-sm text-green-900">
                                        <span className="font-bold">Excellent Performance:</span> Keep up the good work! Share best practices with other GPs.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 bg-green-700 text-white rounded-xl font-bold hover:bg-green-800 transition"
                        >
                            {t.close}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}