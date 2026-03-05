import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FinanceCategory } from '@/types/finance';

export interface CategorizeResult {
  description: string;
  category_id?: string | null;
  employee_id?: string | null;
  supplier_id?: string | null;
  confidence: number;
  question?: string;
}

interface CategorizeContext {
  categories: FinanceCategory[];
  suppliers?: { id: string; name: string }[];
  employees?: { id: string; full_name: string }[];
}

const CACHE_KEY = 'finance-categorize-cache';
const BATCH_SIZE = 20;

function loadCache(): Map<string, CategorizeResult> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return new Map();
    const entries = JSON.parse(raw) as [string, CategorizeResult][];
    return new Map(entries);
  } catch {
    return new Map();
  }
}

function saveCache(cache: Map<string, CategorizeResult>) {
  try {
    // Keep max 200 entries
    const entries = [...cache.entries()].slice(-200);
    localStorage.setItem(CACHE_KEY, JSON.stringify(entries));
  } catch {
    // ignore quota errors
  }
}

export function useFinanceCategorize() {
  const cacheRef = useRef<Map<string, CategorizeResult>>(loadCache());

  const categorize = useCallback(async (
    descriptions: string[],
    context: CategorizeContext,
  ): Promise<CategorizeResult[]> => {
    if (descriptions.length === 0) return [];

    const cache = cacheRef.current;
    const results: CategorizeResult[] = [];
    const uncached: { index: number; desc: string }[] = [];

    // Check cache first
    descriptions.forEach((desc, i) => {
      const key = desc.toLowerCase().trim();
      const cached = cache.get(key);
      if (cached && cached.confidence >= 0.8) {
        results[i] = cached;
      } else {
        uncached.push({ index: i, desc });
      }
    });

    if (uncached.length === 0) return results;

    // Build flat category list for the API
    const flatCategories = context.categories.map(c => ({
      id: c.id,
      name: c.name,
      type: c.type,
      subcategories: (c.subcategories || []).map(s => ({ id: s.id, name: s.name })),
    }));

    // Batch requests
    for (let i = 0; i < uncached.length; i += BATCH_SIZE) {
      const batch = uncached.slice(i, i + BATCH_SIZE);
      try {
        const { data, error } = await supabase.functions.invoke('finance-categorize', {
          body: {
            descriptions: batch.map(b => b.desc),
            categories: flatCategories,
            suppliers: context.suppliers || [],
            employees: context.employees || [],
          },
        });

        if (error || data?.error) {
          console.error('Categorize error:', error || data?.error);
          // Fallback: null results for this batch
          batch.forEach(b => {
            results[b.index] = { description: b.desc, confidence: 0 };
          });
          continue;
        }

        const aiResults = (data?.results || []) as CategorizeResult[];

        batch.forEach((b, batchIdx) => {
          const aiResult = aiResults[batchIdx] || { description: b.desc, confidence: 0 };
          // Normalize null strings from AI
          if (aiResult.category_id === 'null' || aiResult.category_id === '') aiResult.category_id = null;
          if (aiResult.employee_id === 'null' || aiResult.employee_id === '') aiResult.employee_id = null;
          if (aiResult.supplier_id === 'null' || aiResult.supplier_id === '') aiResult.supplier_id = null;

          results[b.index] = aiResult;

          // Cache high-confidence results
          if (aiResult.confidence >= 0.8) {
            cache.set(b.desc.toLowerCase().trim(), aiResult);
          }
        });
      } catch (err) {
        console.error('Categorize batch error:', err);
        batch.forEach(b => {
          results[b.index] = { description: b.desc, confidence: 0 };
        });
      }
    }

    saveCache(cache);
    return results;
  }, []);

  return { categorize };
}
