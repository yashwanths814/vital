// app/[locale]/ClientLocaleWrapper.tsx
"use client";

import { useEffect, useState } from "react";

export default function ClientLocaleWrapper({
    children,
    locale
}: {
    children: React.ReactNode;
    locale: string;
}) {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    // On server, render without html/body
    if (!isClient) {
        return <>{children}</>;
    }

    // On client, just render children with locale context if needed
    return <>{children}</>;
}