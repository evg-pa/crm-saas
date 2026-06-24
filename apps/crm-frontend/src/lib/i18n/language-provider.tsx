'use client';

import { useEffect } from 'react';
import { useLanguageStore } from '@/lib/stores/language-store';

/**
 * LanguageProvider — syncs the HTML lang attribute with the language store.
 * Placed at layout root so it runs before hydration completes.
 */
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const language = useLanguageStore((s) => s.language);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return <>{children}</>;
}
