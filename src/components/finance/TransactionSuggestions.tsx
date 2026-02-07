import { useMemo } from 'react';
import { FinanceTransaction, FinanceCategory, FinanceAccount } from '@/types/finance';
import { History, Tag } from 'lucide-react';
import { getLucideIcon } from '@/lib/icons';
import { cn } from '@/lib/utils';

interface TransactionSuggestion {
  description: string;
  category?: FinanceCategory;
  account?: FinanceAccount;
  isFromHistory: boolean;
}

interface TransactionSuggestionsProps {
  searchTerm: string;
  transactions: FinanceTransaction[];
  categories: FinanceCategory[];
  accounts: FinanceAccount[];
  onSelect: (suggestion: TransactionSuggestion) => void;
}

export function TransactionSuggestions({
  searchTerm,
  transactions,
  categories,
  accounts,
  onSelect
}: TransactionSuggestionsProps) {
  const suggestions = useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) return [];

    const term = searchTerm.toLowerCase();
    const seen = new Set<string>();
    const results: TransactionSuggestion[] = [];

    // Get flat list of all categories (including subcategories)
    const allCategories = categories.flatMap(c => [c, ...(c.subcategories || [])]);

    // Search through past transactions
    const matchingTransactions = transactions
      .filter(t => {
        // Clean description (remove installment suffix like "(1/12)")
        const cleanDesc = t.description.replace(/\s*\(\d+\/\d+\)$/, '').toLowerCase();
        return cleanDesc.includes(term);
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Add unique suggestions from history
    for (const tx of matchingTransactions) {
      const cleanDesc = tx.description.replace(/\s*\(\d+\/\d+\)$/, '').trim();
      const key = `${cleanDesc.toLowerCase()}-${tx.category_id || ''}-${tx.account_id || ''}`;
      
      if (!seen.has(key) && results.length < 5) {
        seen.add(key);
        
        const category = tx.category_id 
          ? allCategories.find(c => c.id === tx.category_id)
          : undefined;
        const account = tx.account_id 
          ? accounts.find(a => a.id === tx.account_id)
          : undefined;

        results.push({
          description: cleanDesc,
          category,
          account,
          isFromHistory: true
        });
      }
    }

    return results;
  }, [searchTerm, transactions, categories, accounts]);

  if (suggestions.length === 0) return null;

  return (
    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border rounded-lg shadow-lg overflow-hidden">
      {suggestions.map((suggestion, index) => {
        const CategoryIcon = suggestion.category?.icon 
          ? getLucideIcon(suggestion.category.icon) 
          : null;

        return (
          <button
            key={index}
            type="button"
            className={cn(
              "w-full flex items-center gap-3 px-3 py-3 hover:bg-accent text-left transition-colors",
              index < suggestions.length - 1 && "border-b"
            )}
            onClick={() => onSelect(suggestion)}
          >
            {/* Icon */}
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{ 
                backgroundColor: suggestion.category?.color 
                  ? `${suggestion.category.color}20` 
                  : 'hsl(var(--muted))' 
              }}
            >
              {suggestion.isFromHistory ? (
                CategoryIcon ? (
                  <CategoryIcon 
                    className="w-5 h-5" 
                    style={{ color: suggestion.category?.color }} 
                  />
                ) : (
                  <History className="w-5 h-5 text-muted-foreground" />
                )
              ) : (
                <Tag className="w-5 h-5 text-muted-foreground" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">
                {highlightMatch(suggestion.description, searchTerm)}
              </div>
              {(suggestion.category || suggestion.account) && (
                <div className="text-xs text-muted-foreground truncate">
                  {suggestion.category?.name}
                  {suggestion.category && suggestion.account && ' | '}
                  {suggestion.account?.name}
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function highlightMatch(text: string, term: string) {
  if (!term) return text;
  
  const lowerText = text.toLowerCase();
  const lowerTerm = term.toLowerCase();
  const startIndex = lowerText.indexOf(lowerTerm);
  
  if (startIndex === -1) return text;
  
  const before = text.slice(0, startIndex);
  const match = text.slice(startIndex, startIndex + term.length);
  const after = text.slice(startIndex + term.length);
  
  return (
    <>
      {before}
      <span className="font-bold text-primary">{match}</span>
      {after}
    </>
  );
}
