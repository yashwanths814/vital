// app/[locale]/authority/ddo/trends/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth, db } from "../../../../../lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import Screen from "../../../../../components/Screen";

export default function TrendsPage() {
  const router = useRouter();
  const params = useParams() as { locale?: string };
  const locale = params?.locale || "en";
  const [loading, setLoading] = useState(true);
  const [monthlyTrends, setMonthlyTrends] = useState<any[]>([]);
  const [gpTrends, setGpTrends] = useState<any[]>([]);

  useEffect(() => {
    loadTrendsData();
  }, []);

  const loadTrendsData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        router.push(`/${locale}/authority/login`);
        return;
      }

      const authorityDoc = await getDoc(doc(db, "authorities", user.uid));
      const district = authorityDoc.data()?.district;

      if (!district) return;

      const issuesQuery = query(
        collection(db, "issues"),
        where("district", "==", district)
      );
      const issuesSnap = await getDocs(issuesQuery);

      const issues = issuesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Monthly trends for last 12 months
      const monthlyData: Record<string, any> = {};
      const gpData: Record<string, any> = {};

      issues.forEach(issue => {
        const date = issue.createdAt?.toDate?.() || new Date(issue.createdAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthName = date.toLocaleString('default', { month: 'short', year: '2-digit' });

        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            month: monthName,
            total: 0,
            resolved: 0,
            escalated: 0
          };
        }

        monthlyData[monthKey].total++;
        if (issue.status === "resolved") monthlyData[monthKey].resolved++;
        if (issue.escalated) monthlyData[monthKey].escalated++;

        // GP trends
        const gp = issue.panchayatName || "Unknown";
        if (!gpData[gp]) {
          gpData[gp] = {
            name: gp,
            months: {},
            total: 0
          };
        }
        gpData[gp].total++;
        if (!gpData[gp].months[monthKey]) {
          gpData[gp].months[monthKey] = 0;
        }
        gpData[gp].months[monthKey]++;
      });

      // Sort monthly data
      const sortedMonths = Object.keys(monthlyData).sort();
      const trends = sortedMonths.map(key => monthlyData[key]);

      // Sort GP data
      const topGPs = Object.values(gpData)
        .sort((a: any, b: any) => b.total - a.total)
        .slice(0, 10);

      setMonthlyTrends(trends);
      setGpTrends(topGPs);
    } catch (error) {
      console.error("Error loading trends:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen padded>
      <div className="max-w-7xl mx-auto p-4">
        <button
          onClick={() => router.back()}
          className="mb-6 text-green-700 hover:text-green-900 flex items-center gap-2"
        >
          ← Back
        </button>

        <h1 className="text-2xl font-bold text-green-900 mb-6">Resolution Trends</h1>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <div className="space-y-8">
            {/* Monthly Trends */}
            <div className="bg-white border border-green-100 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-green-900 mb-6">Monthly Trends</h2>
              <div className="space-y-4">
                {monthlyTrends.map(trend => (
                  <div key={trend.month} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-bold text-green-900">{trend.month}</span>
                      <span className="text-green-700">Total: {trend.total}</span>
                    </div>
                    <div className="h-2 bg-green-100 rounded-full overflow-hidden flex">
                      <div
                        className="h-full bg-green-500"
                        style={{ width: `${(trend.resolved / trend.total) * 100}%` }}
                      />
                      <div
                        className="h-full bg-red-500"
                        style={{ width: `${(trend.escalated / trend.total) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-green-600">Resolved: {trend.resolved}</span>
                      <span className="text-red-600">Escalated: {trend.escalated}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* GP Trends */}
            <div className="bg-white border border-green-100 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-green-900 mb-6">Top GPs by Volume</h2>
              <div className="space-y-4">
                {gpTrends.map((gp: any) => (
                  <div key={gp.name} className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-bold text-green-900">{gp.name}</span>
                      <span className="text-green-700">Total: {gp.total}</span>
                    </div>
                    <div className="h-2 bg-green-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500"
                        style={{ width: `${Math.min((gp.total / gpTrends[0].total) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Screen>
  );
}
