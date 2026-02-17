// app/[locale]/authority/layout.tsx
"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";

export default function AuthorityLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams() as { locale?: string };
  const locale = params?.locale || "en";

  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const redirectingRef = useRef(false);

  // Pages that must NEVER be auto-redirected by layout
  const isLoginPage = pathname.includes("/authority/login");
  const isRegisterPage = pathname.includes("/authority/register");
  const isStatusPage = pathname.includes("/authority/status");

  // Protected authority app areas (dashboards + inner pages)
  const isProtectedAuthorityArea =
    pathname.includes("/authority/pdo") ||
    pathname.includes("/authority/tdo") ||
    pathname.includes("/authority/ddo") ||
    pathname.includes("/authority/vi");

  // 1) Wait for Firebase Auth to initialize
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  // 2) Gate ONLY protected authority areas
  useEffect(() => {
    if (!authReady) return;
    if (redirectingRef.current) return;

    // If we're on login/register/status -> do not redirect here
    if (isLoginPage || isRegisterPage || isStatusPage) return;

    // If it's not a protected authority area -> do nothing
    if (!isProtectedAuthorityArea) return;

    // Not signed in -> go login
    if (!user) {
      redirectingRef.current = true;
      router.replace(`/${locale}/authority/login`);
      return;
    }

    // Signed in -> check authority profile + verification
    (async () => {
      try {
        const snap = await getDoc(doc(db, "authorities", user.uid));

        // Not registered -> go register
        if (!snap.exists()) {
          redirectingRef.current = true;
          router.replace(`/${locale}/authority/register`);
          return;
        }

        const a = snap.data() as any;
        const verified = a?.verified === true || a?.verification?.status === "verified";

        // Not verified -> go status
        if (!verified) {
          redirectingRef.current = true;
          router.replace(`/${locale}/authority/status`);
          return;
        }

        // Verified -> allow access (no auto dashboard redirect here)
        // Page-level logic can decide further if needed.
      } catch (e) {
        // Important: do NOT redirect on transient permission/network errors,
        // otherwise you get flicker loops.
        console.error("AuthorityLayout check failed:", e);
      }
    })();
  }, [
    authReady,
    user,
    pathname,
    locale,
    router,
    isLoginPage,
    isRegisterPage,
    isStatusPage,
    isProtectedAuthorityArea,
  ]);

  // Reset redirect lock when route changes (so future navigations can redirect if needed)
  useEffect(() => {
    redirectingRef.current = false;
  }, [pathname]);

  // Loading screen only while auth is booting
  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="font-bold text-green-700">Checking access…</div>
      </div>
    );
  }

  return <>{children}</>;
}
