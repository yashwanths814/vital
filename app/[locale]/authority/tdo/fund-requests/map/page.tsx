"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where,
} from "firebase/firestore";
import { auth, db } from "../../../../../lib/firebase";
import Screen from "../../../../../components/Screen";
import dynamic from "next/dynamic";

// Load map only on client
const Map = dynamic(() => import("../../../../../components/Map"), {
    ssr: false,
    loading: () => (
        <div className="h-full w-full flex items-center justify-center bg-gray-50">
            <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
    )
});

type FundRequest = {
    id: string;
    amount: number;
    reason: string;
    status: string;
    panchayatId: string;
    villageId?: string;
    district: string;
    taluk: string;
    issueLat?: number;
    issueLng?: number;
    createdAt?: any;
    requestedBy?: string;
    panchayatName?: string;
    villageName?: string;
};

export default function TDOFundMapPage() {
    const router = useRouter();
    const params = useParams() as { locale?: string };
    const locale = params?.locale || "en";
    const t = useTranslations("tdoFundMap");
    const tc = useTranslations("common");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [fundRequests, setFundRequests] = useState<FundRequest[]>([]);
    const [jurisdiction, setJurisdiction] = useState({
        district: "",
        taluk: "",
        name: ""
    });
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        totalAmount: 0
    });

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            setError("");

            const user = auth.currentUser;
            if (!user) {
                router.replace(`/${locale}/authority/login`);
                return;
            }

            try {
                // 1️⃣ Get TDO profile
                const authoritySnap = await getDoc(doc(db, "authorities", user.uid));
                if (!authoritySnap.exists()) {
                    router.replace(`/${locale}/authority/register`);
                    return;
                }

                const authorityData = authoritySnap.data();

                // Check role and verification
                if (authorityData?.role !== "tdo") {
                    router.replace(`/${locale}/role-select`);
                    return;
                }

                const isVerified = authorityData?.verified === true ||
                    authorityData?.verification?.status === "verified";

                if (!isVerified) {
                    router.replace(`/${locale}/authority/status`);
                    return;
                }

                // Check jurisdiction
                if (!authorityData?.district || !authorityData?.taluk) {
                    setError(t("missingScope"));
                    setLoading(false);
                    return;
                }

                setJurisdiction({
                    district: authorityData.district,
                    taluk: authorityData.taluk,
                    name: authorityData.name || "Officer"
                });

                // 2️⃣ Fetch all fund requests in jurisdiction
                const fundRequestsQuery = query(
                    collection(db, "fund_requests"),
                    where("district", "==", authorityData.district),
                    where("taluk", "==", authorityData.taluk)
                );

                const fundRequestsSnap = await getDocs(fundRequestsQuery);

                const requests: FundRequest[] = [];
                let totalAmount = 0;
                let pendingCount = 0;
                let approvedCount = 0;
                let rejectedCount = 0;

                fundRequestsSnap.docs.forEach((doc) => {
                    const data = doc.data();
                    const request: FundRequest = {
                        id: doc.id,
                        ...data
                    } as FundRequest;

                    requests.push(request);

                    // Calculate stats
                    totalAmount += data.amount || 0;

                    switch (data.status) {
                        case "pending":
                            pendingCount++;
                            break;
                        case "approved":
                            approvedCount++;
                            break;
                        case "rejected":
                            rejectedCount++;
                            break;
                    }
                });

                setFundRequests(requests);
                setStats({
                    total: fundRequestsSnap.size,
                    pending: pendingCount,
                    approved: approvedCount,
                    rejected: rejectedCount,
                    totalAmount
                });

            } catch (err: any) {
                console.error("Map load error:", err);
                setError(err.message || t("loadFail"));
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [router, locale, t]);

    // Filter requests with coordinates
    const mappedRequests = fundRequests.filter(
        (req) => req.issueLat && req.issueLng
    );

    // Get pending requests for map markers
    const pendingRequests = fundRequests.filter(
        (req) => req.status === "pending"
    );

    // Prepare map markers
    const mapMarkers = pendingRequests
        .filter((req) => req.issueLat && req.issueLng)
        .map((req) => ({
            id: req.id,
            lat: req.issueLat!,
            lng: req.issueLng!,
            title: `₹${req.amount?.toLocaleString() || 0}`,
            subtitle: `${req.panchayatName || req.panchayatId || 'Unknown Panchayat'} • ${req.reason?.substring(0, 30)}...`,
            status: req.status,
            amount: req.amount,
            onClick: () => {
                router.push(`/${locale}/authority/tdo/fund-approve/${req.id}`);
            }
        }));

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <Screen padded={false}>
            {/* Header */}
            <div className="sticky top-0 z-10 px-4 py-4 border-b border-green-200 bg-white">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <button
                                onClick={() => router.back()}
                                className="p-2 rounded-lg hover:bg-green-50"
                            >
                                ←
                            </button>
                            <h1 className="text-lg sm:text-xl font-extrabold text-green-900">
                                {t("title")}
                            </h1>
                        </div>
                        <p className="text-xs text-green-800/80">
                            {jurisdiction.taluk}, {jurisdiction.district}
                            {jurisdiction.name && ` • ${jurisdiction.name}`}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => router.push(`/${locale}/authority/tdo/funds`)}
                            className="px-3 py-2 rounded-xl border border-green-200 bg-white text-green-900 font-bold hover:bg-green-50"
                        >
                            List View
                        </button>
                        <button
                            onClick={() => window.location.reload()}
                            className="p-2 rounded-xl border border-green-200 bg-white text-green-900 hover:bg-green-50"
                            title="Refresh"
                        >
                            🔄
                        </button>
                    </div>
                </div>

                {/* Stats Summary */}
                {!loading && !error && (
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-2">
                        <div className="bg-green-50 border border-green-100 rounded-xl p-3">
                            <p className="text-xs text-green-800/70">Total</p>
                            <p className="text-lg font-bold text-green-900">{stats.total}</p>
                        </div>
                        <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3">
                            <p className="text-xs text-yellow-800/70">Pending</p>
                            <p className="text-lg font-bold text-yellow-900">{stats.pending}</p>
                        </div>
                        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                            <p className="text-xs text-emerald-800/70">Approved</p>
                            <p className="text-lg font-bold text-emerald-900">{stats.approved}</p>
                        </div>
                        <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                            <p className="text-xs text-red-800/70">Rejected</p>
                            <p className="text-lg font-bold text-red-900">{stats.rejected}</p>
                        </div>
                        <div className="bg-purple-50 border border-purple-100 rounded-xl p-3">
                            <p className="text-xs text-purple-800/70">Total Amount</p>
                            <p className="text-lg font-bold text-purple-900">
                                {formatCurrency(stats.totalAmount)}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Body */}
            <div className="flex-1">
                {loading && (
                    <div className="h-full flex flex-col items-center justify-center py-20">
                        <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-green-700 font-semibold">{tc("loading")}</p>
                    </div>
                )}

                {error && !loading && (
                    <div className="m-4">
                        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                            <div className="flex items-center gap-3">
                                <div className="text-red-600">⚠️</div>
                                <div>
                                    <p className="font-bold text-red-800">Error</p>
                                    <p className="text-sm text-red-700 mt-1">{error}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => window.location.reload()}
                                className="mt-3 px-4 py-2 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700"
                            >
                                Retry
                            </button>
                        </div>
                    </div>
                )}

                {!loading && !error && mappedRequests.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center p-4">
                        <div className="text-center max-w-md">
                            <div className="text-6xl mb-4">🗺️</div>
                            <h3 className="text-lg font-bold text-green-900 mb-2">
                                No Mappable Requests
                            </h3>
                            <p className="text-green-800/70 mb-6">
                                {t("empty")} or requests don't have location data.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={() => router.push(`/${locale}/authority/tdo/funds`)}
                                    className="px-4 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold hover:from-green-700 hover:to-emerald-700"
                                >
                                    View All Requests
                                </button>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="px-4 py-3 rounded-xl border border-green-200 bg-white text-green-900 font-bold hover:bg-green-50"
                                >
                                    Refresh Map
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {!loading && !error && mappedRequests.length > 0 && (
                    <div className="h-[calc(100dvh-180px)] sm:h-[calc(100dvh-200px)]">
                        <Map
                            markers={mapMarkers as any}
                        />

                        {/* Floating Info Panel */}
                        <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-20">
                            <div className="bg-white/95 backdrop-blur-sm border border-green-200 rounded-2xl p-4 shadow-lg">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-bold text-green-900">Legend</h4>
                                    <span className="text-xs text-green-700">
                                        {pendingRequests.length} pending
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                        <span className="text-sm text-green-900">Pending Approval</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                        <span className="text-sm text-green-900">Approved</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                        <span className="text-sm text-green-900">Rejected</span>
                                    </div>
                                </div>
                                <div className="mt-4 pt-3 border-t border-green-100">
                                    <p className="text-xs text-green-800/70 mb-2">
                                        Click on any marker to review and approve the request
                                    </p>
                                    <button
                                        onClick={() => router.push(`/${locale}/authority/tdo/funds`)}
                                        className="w-full text-center text-sm text-green-700 font-bold hover:text-green-900"
                                    >
                                        View Full List →
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Screen>
    );
}