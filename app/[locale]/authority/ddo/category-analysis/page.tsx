// app/[locale]/authority/ddo/category-analysis/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth, db } from "../../../../../lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import Screen from "../../../../../components/Screen";

export default function CategoryAnalysisPage() {
  const router = useRouter();
  const params = useParams() as { locale?: string };
  const locale = params?.locale || "en";
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    loadCategoryData();
  }, []);

  const loadCategoryData = async () => {
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

      const categoryStats: Record<string, any> = {};

      issuesSnap.forEach(doc => {
        const data = doc.data();
        const category = data.category || "Other";

        if (!categoryStats[category]) {
          categoryStats[category] = {
            name: category,
            total: 0,
            resolved: 0,
            pending: 0,
            escalated: 0,
            gps: new Set(),
            totalTime: 0
          };
        }

        categoryStats[category].total++;
        categoryStats[category].gps.add(data.panchayatName);

        if (data.status === "resolved") {
          categoryStats[category].resolved++;
          const created = data.createdAt?.toDate?.() || new Date(data.createdAt);
          const resolved = data.resolvedAt?.toDate?.() || new Date(data.resolvedAt);
          const days = Math.ceil((resolved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
          categoryStats[category].totalTime += days;
        } else if (["pending", "in_progress"].includes(data.status)) {
          categoryStats[category].pending++;
        }

        if (data.escalated) {
          categoryStats[category].escalated++;
        }
      });

      const categoryArray = Object.values(categoryStats).map((cat: any) => ({
        ...cat,
        gps: cat.gps.size,
        resolutionRate: cat.total > 0 ? Math.round((cat.resolved / cat.total) * 100) : 0,
        avgResolutionTime: cat.resolved > 0 ? Math.round(cat.totalTime / cat.resolved) : 0
      }));

      setCategories(categoryArray.sort((a, b) => b.total - a.total));
    } catch (error) {
      console.error("Error loading category data:", error);
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

        <h1 className="text-2xl font-bold text-green-900 mb-6">Category Analysis</h1>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {categories.map(category => (
              <div key={category.name} className="bg-white border border-green-100 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-green-900 mb-4">{category.name}</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-green-700">Total Issues:</span>
                    <span className="font-bold">{category.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-green-700">Resolved:</span>
                    <span className="font-bold text-green-600">{category.resolved}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-green-700">Pending:</span>
                    <span className="font-bold text-yellow-600">{category.pending}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-green-700">Escalated:</span>
                    <span className="font-bold text-red-600">{category.escalated}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-green-700">GPs Affected:</span>
                    <span className="font-bold">{category.gps}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-green-700">Resolution Rate:</span>
                    <span className={`font-bold ${
                      category.resolutionRate >= 80 ? 'text-green-600' :
                      category.resolutionRate >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {category.resolutionRate}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-green-700">Avg Time:</span>
                    <span className="font-bold">{category.avgResolutionTime} days</span>
                  </div>
                  <div className="mt-4 h-2 bg-green-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500"
                      style={{ width: `${category.resolutionRate}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Screen>
  );
}
