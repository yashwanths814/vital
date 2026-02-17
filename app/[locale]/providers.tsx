"use client";

import { ReactNode } from "react";
import { AdminAuthProvider } from "..//./context/AdminAuthContext";
// Later we can add: AuthProvider (villager/authority), IntlProvider, etc.

export default function Providers({ children }: { children: ReactNode }) {
    return <AdminAuthProvider>{children}</AdminAuthProvider>;
}
