// i18n/request.ts
import { getRequestConfig } from "next-intl/server";

const loaders = {
  en: () => import("../messages/en.json"),
  kn: () => import("../messages/kn.json"),
  hi: () => import("../messages/hi.json"),
} as const;

type Locale = keyof typeof loaders;

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = (await requestLocale) as Locale | undefined;
  const safeLocale: Locale = locale && locale in loaders ? locale : "en";

  return {
    locale: safeLocale,
    messages: (await loaders[safeLocale]()).default,
  };
});
