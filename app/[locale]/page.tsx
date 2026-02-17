"use client";

import { useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";

export default function LocaleHomePage() {
  const router = useRouter();
  const params = useParams() as { locale?: string };
  const locale = params?.locale || "en";

  const didNav = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => {
      if (didNav.current) return;
      didNav.current = true;

      // ✅ always stay inside locale
      router.replace(`/${locale}/brand`);
    }, 1800);

    return () => clearTimeout(t);
  }, [router, locale]);

  return (
    <div className="min-h-dvh w-full flex flex-col items-center justify-center bg-[#ECFAF1]">
      <div className="flex items-center justify-center">
        <video
          className="h-30 w-30 sm:h-35 sm:w-35 rounded-3xl object-cover shadow-lg"
          src="/assets/loader/Countryside.mp4"
          autoPlay
          muted
          playsInline
        />
      </div>

      <div className="mt-4 text-xs font-semibold tracking-wide text-green-800">
        Loading…
      </div>
    </div>
  );
}
