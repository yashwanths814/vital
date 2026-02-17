"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import Screen from "../../components/Screen";

export default function BrandPage() {
    const router = useRouter();
    const params = useParams() as { locale?: string };
    const locale = params?.locale || "en";

    const didNav = useRef(false);
    const [show, setShow] = useState(false);

    useEffect(() => {
        setShow(true);

        const t = setTimeout(() => {
            if (didNav.current) return;
            didNav.current = true;
            router.replace(`/${locale}/role-select`);
        }, 2200);

        return () => clearTimeout(t);
    }, [router, locale]);

    return (
        <Screen center padded={false}>
            <div className="w-full flex flex-col items-center justify-center text-center gap-5 px-6 overflow-hidden">
                <div
                    className={`relative h-28 w-28 sm:h-36 sm:w-36 md:h-44 md:w-44 transition-all duration-700 ease-out
          ${show ? "opacity-100 scale-100" : "opacity-0 scale-90"}`}
                >
                    <Image
                        src="/assets/logo/VITAL-logo.png"
                        alt="VITAL"
                        fill
                        priority
                        className="object-contain"
                    />
                </div>

                <div
                    className={`text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-[0.3em] text-green-900
          transition-all duration-700 delay-150 ease-out
          ${show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}
          drop-shadow-[0_2px_6px_rgba(20,83,45,0.25)]`}
                >
                    VITAL
                </div>

                <div
                    className={`text-xs sm:text-sm md:text-base font-semibold text-green-800 opacity-90 max-w-xs sm:max-w-md
          transition-all duration-700 delay-300 ease-out
          ${show ? "opacity-90 translate-y-0" : "opacity-0 translate-y-3"}`}
                >
                    Village Issue Tracking and Action Link
                </div>
            </div>
        </Screen>
    );
}
