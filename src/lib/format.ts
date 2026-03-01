// Centralized currency formatting utilities for pt-BR / BRL

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const currencyCompactFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
});

/** Standard R$ 1.234,56 */
export const formatCurrency = (value: number): string =>
  currencyFormatter.format(value);

/** Compact R$ 1,2 mil */
export const formatCurrencyCompact = (value: number): string =>
  currencyCompactFormatter.format(value);

/** Simple R$ 1.234,56 without Intl (uses toLocaleString) */
export const formatCurrencySimple = (value: number): string =>
  `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
