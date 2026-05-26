import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Language = "en" | "ru";

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
}

/**
 * Language store — persisted to localStorage, defaults to English.
 */
export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: "en",
      setLanguage: (language) => set({ language }),
    }),
    {
      name: "crm-language",
    }
  )
);
