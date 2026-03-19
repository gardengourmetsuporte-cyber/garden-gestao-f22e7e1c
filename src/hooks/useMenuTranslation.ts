import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getMenuLocale, MenuLocale } from '@/lib/i18n';

type TranslationCache = Record<string, Record<string, string>>; // locale -> { original: translated }

const CACHE_KEY = 'menu_translations_cache';
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24h

function loadCache(): TranslationCache {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed._ts && Date.now() - parsed._ts > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY);
      return {};
    }
    return parsed.data || {};
  } catch { return {}; }
}

function saveCache(cache: TranslationCache) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data: cache, _ts: Date.now() }));
  } catch { /* quota exceeded */ }
}

export function useMenuTranslation() {
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [isTranslating, setIsTranslating] = useState(false);
  const cacheRef = useRef<TranslationCache>(loadCache());
  const locale = getMenuLocale();

  const translateTexts = useCallback(async (texts: string[]) => {
    if (locale === 'pt' || texts.length === 0) return;

    const cached = cacheRef.current[locale] || {};
    const missing = texts.filter(t => t && !cached[t]);

    if (missing.length === 0) {
      setTranslations(cached);
      return;
    }

    // Set what we have immediately
    setTranslations(cached);
    setIsTranslating(true);

    try {
      const { data, error } = await supabase.functions.invoke('translate-menu', {
        body: { texts: missing, targetLocale: locale },
      });

      if (error) {
        console.error('Translation error:', error);
        // On error, map missing texts to themselves so we don't retry forever
        const fallback = { ...cached };
        missing.forEach(t => { fallback[t] = t; });
        cacheRef.current[locale] = fallback;
        setTranslations(fallback);
        setIsTranslating(false);
        return;
      }

      const newTranslations = data?.translations || {};
      // Ensure all missing texts have a mapping (fallback to original if AI missed some)
      const updated = { ...cached };
      missing.forEach(t => {
        updated[t] = newTranslations[t] || t;
      });
      cacheRef.current[locale] = updated;
      saveCache(cacheRef.current);
      setTranslations(updated);
    } catch (e) {
      console.error('Translation failed:', e);
    } finally {
      setIsTranslating(false);
    }
  }, [locale]);

  // Helper to get translated text
  const tt = useCallback((text: string | null | undefined): string => {
    if (!text) return '';
    if (locale === 'pt') return text;
    return translations[text] || text;
  }, [locale, translations]);

  return { tt, translateTexts, isTranslating, locale };
}
