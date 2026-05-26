import { useCallback, useMemo } from "react";
import { useLanguageStore } from "@/lib/stores/language-store";
import en from "./translations/en";
import ru from "./translations/ru";
import type { Translations } from "./translations/en";

export type { Translations };
export type TFn = ReturnType<typeof useTranslation>["t"];

const dictionaries: Record<string, Translations> = { en, ru };

/**
 * useTranslation — lightweight i18n hook.
 *
 * Returns a `t` function that looks up dot-path keys (e.g. "contacts.title")
 * and supports `{placeholder}` interpolation.
 *
 * Lenses: YAGNI — custom hook avoids full i18n framework overhead for a small app.
 */
export function useTranslation() {
  const language = useLanguageStore((s) => s.language);
  const dict = dictionaries[language] ?? en;

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const keys = key.split(".");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let value: any = dict;
      for (const k of keys) {
        if (value == null) break;
        value = value[k];
      }
      if (typeof value !== "string") {
        // Fallback to English
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let fallback: any = en;
        for (const k of keys) {
          if (fallback == null) break;
          fallback = fallback[k];
        }
        if (typeof fallback === "string") {
          value = fallback;
        } else {
          return key;
        }
      }
      if (params) {
        return value.replace(/\{(\w+)\}/g, (_match: string, param: string) =>
          String(params[param] ?? `{${param}}`)
        );
      }
      return value;
    },
    [dict]
  );

  return useMemo(() => ({ t, language }), [t, language]);
}
