import { useTranslation } from "./use-translation";

/**
 * useLocale — returns locale-aware formatting settings.
 * Uses the current language to determine locale and currency.
 */
export function useLocale() {
  const { language } = useTranslation();

  const locale = language === "ru" ? "ru-RU" : "en-US";
  const currency = language === "ru" ? "RUB" : "USD";

  return { locale, currency, language };
}
