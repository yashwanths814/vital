"use client";

import Screen from "../../components/Screen";
import { useRouter, useParams } from "next/navigation";
import { FaUserShield, FaUserTie, FaUsers } from "react-icons/fa";
import { FiGlobe, FiDownload, FiX } from "react-icons/fi";
import { useState, useEffect, useRef } from "react";

/** ---------------------------
 *  Tile Component (same as yours)
 *  -------------------------- */
function Tile({
  icon,
  title,
  desc,
  onClick,
  delay = 0,
  isHovered,
  onHover,
  index,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  onClick: () => void;
  delay?: number;
  isHovered: boolean;
  onHover: (index: number | null) => void;
  index: number;
}) {
  const [isClicked, setIsClicked] = useState(false);
  const [ripple, setRipple] = useState<{ x: number; y: number } | null>(null);
  const lock = useRef(false);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (lock.current) return;
    lock.current = true;

    const rect = e.currentTarget.getBoundingClientRect();
    setRipple({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setIsClicked(true);

    setTimeout(() => {
      onClick();
      // reset for safety (if user comes back)
      lock.current = false;
      setIsClicked(false);
      setRipple(null);
    }, 220);
  };

  return (
    <div
      className="relative overflow-hidden animate-tile-entrance"
      onMouseEnter={() => onHover(index)}
      onMouseLeave={() => onHover(null)}
      style={{ animationDelay: `${delay}ms` }}
    >
      <button
        onClick={handleClick}
        className={`
          w-full rounded-2xl bg-white
          border ${isHovered ? "border-green-300" : "border-green-100"}
          px-4 py-4 shadow-sm
          hover:shadow-md transition-all duration-300 ease-out
          flex items-center gap-3 text-left
          relative overflow-hidden
          ${isClicked ? "scale-[0.985]" : "hover:scale-[1.01]"}
          transform-gpu
        `}
        style={{ transform: isHovered ? "translateY(-2px)" : "translateY(0)" }}
      >
        {/* Ripple */}
        {ripple && (
          <div
            className="absolute w-8 h-8 bg-green-200 rounded-full opacity-60 animate-ripple pointer-events-none"
            style={{ left: ripple.x - 16, top: ripple.y - 16 }}
          />
        )}

        {/* Glow */}
        {isHovered && (
          <div className="absolute inset-0 bg-gradient-to-br from-green-50/55 to-transparent pointer-events-none" />
        )}

        {/* Icon */}
        <div
          className={`
            h-11 w-11 rounded-xl
            ${isHovered ? "bg-green-100" : "bg-green-50"}
            flex items-center justify-center
            text-black transition-all duration-300
            ${isHovered ? "scale-105 rotate-2" : ""}
          `}
        >
          <div className={isHovered ? "animate-pulse-slow" : ""}>{icon}</div>
        </div>

        {/* Text */}
        <div className="flex-1 relative z-10">
          <div
            className={`
              text-base font-extrabold
              ${
                isHovered
                  ? "text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-green-800"
                  : "text-black"
              }
              transition-all duration-300
            `}
          >
            {title}
          </div>

          <div
            className={`
              mt-0.5 text-xs font-medium text-gray-600
              transition-all duration-300
              ${isHovered ? "opacity-100" : "opacity-90"}
            `}
          >
            {desc}
          </div>
        </div>

        {/* Arrow */}
        <div
          className={`
            transition-all duration-300 relative z-10
            ${isHovered ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2"}
          `}
        >
          <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
            <svg
              className="w-4 h-4 text-green-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </div>
        </div>
      </button>
    </div>
  );
}

/** ---------------------------
 *  PWA Install Popup (Modal)
 *  -------------------------- */
function InstallPwaPopup({
  open,
  onClose,
  title,
  body,
  installLabel,
  notNowLabel,
  onInstall,
  canInstall,
  iosHint,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  body: string;
  installLabel: string;
  notNowLabel: string;
  onInstall: () => void;
  canInstall: boolean;
  iosHint: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[999]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/35 backdrop-blur-[2px] animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-white border border-green-100 shadow-xl animate-pop-in relative overflow-hidden">
          {/* Soft glows */}
          <div className="absolute -top-20 -right-20 w-48 h-48 bg-green-200/30 rounded-full blur-2xl" />
          <div className="absolute -bottom-24 -left-20 w-56 h-56 bg-green-100/40 rounded-full blur-2xl" />

          <div className="relative p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center">
                  <FiDownload className="text-green-700" />
                </div>
                <div>
                  <div className="text-lg font-extrabold text-green-900">
                    {title}
                  </div>
                  <div className="text-xs text-gray-600 mt-0.5">{body}</div>
                </div>
              </div>

              <button
                onClick={onClose}
                className="h-9 w-9 rounded-full bg-green-50 hover:bg-green-100 border border-green-100 flex items-center justify-center transition"
                aria-label="Close"
              >
                <FiX className="text-green-700" />
              </button>
            </div>

            <div className="mt-5 grid gap-3">
              <button
                onClick={onInstall}
                disabled={!canInstall}
                className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition
                  ${
                    canInstall
                      ? "bg-green-600 text-white hover:bg-green-700"
                      : "bg-gray-200 text-gray-500 cursor-not-allowed"
                  }`}
              >
                <FiDownload />
                {installLabel}
              </button>

              <button
                onClick={onClose}
                className="w-full inline-flex items-center justify-center px-4 py-3 rounded-xl bg-white text-green-800 font-bold text-sm border border-green-200 hover:bg-green-50 transition"
              >
                {notNowLabel}
              </button>

              {!canInstall && (
                <div className="text-[11px] text-gray-500 text-center leading-relaxed">
                  {iosHint}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** ---------------------------
 *  RoleSelectPage + PWA Install
 *  -------------------------- */
export default function RoleSelectPage() {
  const router = useRouter();
  const params = useParams() as { locale?: string };
  const locale = params?.locale || "en";

  const [hoveredTile, setHoveredTile] = useState<number | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // ✅ PWA install states
  const [openInstall, setOpenInstall] = useState(false);
  const deferredPrompt = useRef<any>(null);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => setIsLoaded(true), []);

  // ✅ Capture PWA install prompt (Chrome/Edge Android/Desktop)
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      deferredPrompt.current = e;
      setCanInstall(true);
    };

    const onInstalled = () => {
      deferredPrompt.current = null;
      setCanInstall(false);
      setOpenInstall(false);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt.current) return;
    deferredPrompt.current.prompt();
    await deferredPrompt.current.userChoice;
    deferredPrompt.current = null;
    setCanInstall(false);
    setOpenInstall(false);
  };

  const T: Record<string, any> = {
    en: {
      title: "Select Your Role",
      subtitle: "Choose where you want to continue!",
      villager: "Villager",
      villagerDesc: "Report issues & track status",
      authority: "Authority",
      authorityDesc: "Manage issues and actions",
      admin: "Admin",
      adminDesc: "Manage users and roles",
      hintHover: "Hover a card to see details",
      hintClick: (role: string) => `Click to continue as ${role}`,
      changeLang: "Change language",

      // ✅ PWA strings
      installBtn: "Install app",
      installTitle: "Install VITAL",
      installBody: "Add VITAL to your home screen for faster access like a real app.",
      notNow: "Not now",
      iosHint:
        "Install is available on Chrome/Edge when PWA is ready. On iPhone: Share → Add to Home Screen.",
    },
    kn: {
      title: "ನಿಮ್ಮ ಪಾತ್ರ ಆಯ್ಕೆಮಾಡಿ",
      subtitle: "ಮುಂದುವರೆಯಲು ಆಯ್ಕೆಮಾಡಿ!",
      villager: "ಗ್ರಾಮಸ್ಥ",
      villagerDesc: "ಸಮಸ್ಯೆ ವರದಿ ಮಾಡಿ ಮತ್ತು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ",
      authority: "ಅಧಿಕಾರಿ",
      authorityDesc: "ಸಮಸ್ಯೆ ನಿರ್ವಹಣೆ ಮತ್ತು ಕ್ರಮಗಳು",
      admin: "ನಿರ್ವಹಣಾಧಿಕಾರಿ",
      adminDesc: "ಬಳಕೆದಾರರು ಮತ್ತು ಪಾತ್ರಗಳು ನಿರ್ವಹಣೆ",
      hintHover: "ಕಾರ್ಡ್ ಮೇಲೆ ಹೋವರ್ ಮಾಡಿ ವಿವರಗಳನ್ನು ನೋಡಿ",
      hintClick: (role: string) => `${role} ಆಗಿ ಮುಂದುವರೆಯಲು ಕ್ಲಿಕ್ ಮಾಡಿ`,
      changeLang: "ಭಾಷೆ ಬದಲಾಯಿಸಿ",

      installBtn: "ಆಪ್ ಇನ್‌ಸ್ಟಾಲ್",
      installTitle: "VITAL ಇನ್‌ಸ್ಟಾಲ್ ಮಾಡಿ",
      installBody:
        "VITAL ಅನ್ನು ನಿಮ್ಮ ಹೋಮ್ ಸ್ಕ್ರೀನ್‌ಗೆ ಸೇರಿಸಿ — ಆಪ್‌ನಂತೆ ಬೇಗ ಓಪನ್ ಮಾಡಬಹುದು.",
      notNow: "ಇಲ್ಲ, ನಂತರ",
      iosHint:
        "Chrome/Edge ನಲ್ಲಿ ಮಾತ್ರ Install ಬರಬಹುದು. iPhone ನಲ್ಲಿ: Share → Add to Home Screen.",
    },
    hi: {
      title: "अपनी भूमिका चुनें",
      subtitle: "जारी रखने के लिए चुनें!",
      villager: "ग्रामीण",
      villagerDesc: "समस्या दर्ज करें और ट्रैक करें",
      authority: "अधिकारी",
      authorityDesc: "समस्याएँ और कार्य प्रबंधन",
      admin: "एडमिन",
      adminDesc: "यूज़र और रोल मैनेजमेंट",
      hintHover: "कार्ड पर होवर करके अधिक जानकारी देखें",
      hintClick: (role: string) => `${role} के रूप में जारी रखने के लिए क्लिक करें`,
      changeLang: "भाषा बदलें",

      installBtn: "ऐप इंस्टॉल",
      installTitle: "VITAL इंस्टॉल करें",
      installBody:
        "VITAL को होम स्क्रीन पर जोड़ें ताकि यह एक रियल ऐप की तरह जल्दी खुले।",
      notNow: "अभी नहीं",
      iosHint:
        "Install Chrome/Edge पर आएगा. iPhone पर: Share → Add to Home Screen.",
    },
  };

  const t = T[locale] || T.en;

  const roleNameByIndex = (idx: number) => {
    if (idx === 0) return t.admin;
    if (idx === 1) return t.authority;
    return t.villager;
  };

  return (
    <>
      <style jsx global>{`
        @keyframes tileEntrance {
          0% {
            opacity: 0;
            transform: translateY(10px) scale(0.98);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes ripple {
          0% {
            transform: scale(0);
            opacity: 0.6;
          }
          100% {
            transform: scale(10);
            opacity: 0;
          }
        }
        @keyframes pulseSlow {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-8px);
          }
        }
        .animate-tile-entrance {
          animation: tileEntrance 0.45s ease-out forwards;
          opacity: 0;
        }
        .animate-ripple {
          animation: ripple 0.6s ease-out forwards;
        }
        .animate-pulse-slow {
          animation: pulseSlow 2s ease-in-out infinite;
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        /* ✅ Popup animations */
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes popIn {
          0% {
            opacity: 0;
            transform: translateY(10px) scale(0.96);
          }
          100% {
            opacity: 1;
            transform: translateY(0px) scale(1);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.18s ease-out forwards;
        }
        .animate-pop-in {
          animation: popIn 0.22s ease-out forwards;
        }
      `}</style>

      <Screen>
        <div className="max-w-3xl mx-auto pt-6 relative">
          {/* Background blobs */}
          <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-40 h-40 bg-green-100 rounded-full opacity-10 animate-float" />
            <div
              className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-green-200 rounded-full opacity-10 animate-float"
              style={{ animationDelay: "1s" }}
            />
          </div>

          {/* Top buttons */}
          <div className="relative z-10 flex justify-center gap-2 flex-wrap">
            <button
              onClick={() => setOpenInstall(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-600 text-white border border-green-600 font-semibold text-xs sm:text-sm hover:bg-green-700 transition"
            >
              <FiDownload />
              {t.installBtn}
            </button>

            <button
              onClick={() => router.push(`/${locale}/language`)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-green-200 text-green-800 font-semibold text-xs sm:text-sm hover:bg-white transition"
            >
              <FiGlobe className="text-green-700" />
              {t.changeLang}
            </button>
          </div>

          {/* Header */}
          <div
            className={`mt-5 text-center transition-all duration-700 relative z-10 ${
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            }`}
          >
            <div className="text-2xl font-extrabold text-green-900">{t.title}</div>
            <div className="mt-2 text-sm font-medium text-green-800 opacity-90">
              {t.subtitle}
            </div>
            <div className="mt-2 flex justify-center">
              <div className="h-1 w-20 bg-gradient-to-r from-transparent via-green-400 to-transparent rounded-full animate-pulse-slow" />
            </div>
          </div>

          {/* Cards */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-10">
            <Tile
              index={2}
              icon={<FaUsers size={22} />}
              title={t.villager}
              desc={t.villagerDesc}
              isHovered={hoveredTile === 2}
              onHover={setHoveredTile}
              onClick={() => router.push(`/${locale}/villager/login`)}
              delay={220}
            />

            <Tile
              index={1}
              icon={<FaUserTie size={20} />}
              title={t.authority}
              desc={t.authorityDesc}
              isHovered={hoveredTile === 1}
              onHover={setHoveredTile}
              onClick={() => router.push(`/${locale}/authority/login`)}
              delay={140}
            />

            <Tile
              index={0}
              icon={<FaUserShield size={20} />}
              title={t.admin}
              desc={t.adminDesc}
              isHovered={hoveredTile === 0}
              onHover={setHoveredTile}
              onClick={() => router.push(`/${locale}/admin/login`)}
              delay={60}
            />
          </div>

          {/* Hint */}
          <div
            className={`mt-8 text-center transition-all duration-500 relative z-10 ${
              isLoaded ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 rounded-full">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs font-medium text-green-700">
                {hoveredTile !== null
                  ? t.hintClick(roleNameByIndex(hoveredTile))
                  : t.hintHover}
              </span>
            </div>
          </div>

          {/* Dots */}
          <div className="mt-6 flex justify-center gap-2 relative z-10">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all duration-300 ${
                  hoveredTile === i
                    ? "w-8 bg-green-400"
                    : hoveredTile === null
                    ? "w-2 bg-green-300"
                    : "w-2 bg-green-200"
                }`}
              />
            ))}
          </div>
        </div>

        {/* ✅ PWA Install Popup */}
        <InstallPwaPopup
          open={openInstall}
          onClose={() => setOpenInstall(false)}
          title={t.installTitle}
          body={t.installBody}
          installLabel={t.installBtn}
          notNowLabel={t.notNow}
          onInstall={handleInstall}
          canInstall={canInstall}
          iosHint={t.iosHint}
        />
      </Screen>
    </>
  );
}
