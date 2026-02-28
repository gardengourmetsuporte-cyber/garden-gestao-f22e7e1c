/**
 * Normaliza telefone brasileiro para formato consistente (só dígitos, com prefixo 55).
 * Retorna null se inválido (menos de 10 dígitos após limpeza).
 */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;

  let digits = raw.replace(/\D/g, '');
  if (digits.length === 0) return null;

  // Remove country code if already present
  if (digits.startsWith('55') && digits.length >= 12) {
    digits = digits.slice(2);
  }

  // Remove leading zero from area code (0xx)
  if (digits.startsWith('0') && digits.length >= 11) {
    digits = digits.slice(1);
  }

  // Must have at least 10 digits (2 DDD + 8 number) after cleanup
  if (digits.length < 10) return null;

  // Cap at 11 digits (2 DDD + 9 number)
  if (digits.length > 11) digits = digits.slice(0, 11);

  // Add country code
  return '55' + digits;
}

/**
 * Formata telefone para exibição: (XX) XXXXX-XXXX
 */
export function formatPhoneDisplay(normalized: string | null): string {
  if (!normalized) return '';
  let digits = normalized;
  if (digits.startsWith('55')) digits = digits.slice(2);
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return digits;
}
