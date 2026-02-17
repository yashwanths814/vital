// app/[locale]/layout.tsx
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";

import AppShell from "../components/AppShell";
import Providers from "./providers";

const SUPPORTED_LOCALES = ["en", "kn", "hi"] as const;

export default async function LocaleLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;

    if (!SUPPORTED_LOCALES.includes(locale as any)) notFound();

    const messages = await getMessages();

    return (
        <html lang={locale} suppressHydrationWarning>
            <body className="min-h-screen bg-[var(--background)] text-[var(--foreground)] antialiased">
                <NextIntlClientProvider locale={locale} messages={messages}>
                    <Providers>
                        <AppShell locale={locale}>{children}</AppShell>
                    </Providers>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
