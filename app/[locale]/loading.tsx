"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function Page() {
    const router = useRouter();
    const didNav = useRef(false);

    useEffect(() => {
        const t = setTimeout(() => {
            if (didNav.current) return;
            didNav.current = true;
            router.replace("/brand");
        }, 1800);

        return () => clearTimeout(t);
    }, [router]);

    return (
        <div className="min-h-dvh w-full flex flex-col items-center justify-center bg-[#ECFAF1]">

            {/* Bigger loader */}
            <div className="flex items-center justify-center">
                <video
                    className="h-30 w-30 sm:h-35 sm:w-35 rounded-3xl object-cover shadow-lg"
                    src="/assets/loader/Countryside.mp4"
                    autoPlay
                    muted
                    playsInline
                />
            </div>

            <div className="mt-5 text-sm font-bold tracking-wide text-green-800">
                Loading…
            </div>
        </div>
    );
}
