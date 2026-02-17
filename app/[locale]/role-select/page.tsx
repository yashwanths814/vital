"use client";

import Screen from "../../components/Screen";
import { useRouter, useParams } from "next/navigation";
import { FaUserShield, FaUserTie, FaUsers } from "react-icons/fa";
import { FiGlobe } from "react-icons/fi";
import { useState, useEffect, useRef } from "react";

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
              ${isHovered
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

export default function RoleSelectPage() {
    const router = useRouter();
    const params = useParams() as { locale?: string };
    const locale = params?.locale || "en";

    const [hoveredTile, setHoveredTile] = useState<number | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => setIsLoaded(true), []);

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

                    {/* Top small button */}
                    <div className="relative z-10 flex justify-center">
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
                        className={`mt-5 text-center transition-all duration-700 relative z-10 ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
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
                        className={`mt-8 text-center transition-all duration-500 relative z-10 ${isLoaded ? "opacity-100" : "opacity-0"
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
                                className={`h-2 rounded-full transition-all duration-300 ${hoveredTile === i
                                        ? "w-8 bg-green-400"
                                        : hoveredTile === null
                                            ? "w-2 bg-green-300"
                                            : "w-2 bg-green-200"
                                    }`}
                            />
                        ))}
                    </div>
                </div>
            </Screen>
        </>
    );
}
