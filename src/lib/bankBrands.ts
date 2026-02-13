// Brazilian bank brand mapping for logos in finance module

export interface BankBrand {
  name: string;
  abbr: string;
  bgColor: string;
  textColor: string;
  /** Optional second color for gradient */
  bgColor2?: string;
}

const BANK_BRANDS: BankBrand[] = [
  { name: 'itau', abbr: 'Itaú', bgColor: '#EC7000', textColor: '#003399' },
  { name: 'itaú', abbr: 'Itaú', bgColor: '#EC7000', textColor: '#003399' },
  { name: 'santander', abbr: 'San', bgColor: '#CC0000', textColor: '#FFFFFF' },
  { name: 'bradesco', abbr: 'Bra', bgColor: '#CC092F', textColor: '#FFFFFF' },
  { name: 'nubank', abbr: 'Nu', bgColor: '#820AD1', textColor: '#FFFFFF' },
  { name: 'banco do brasil', abbr: 'BB', bgColor: '#FDEF00', textColor: '#003882' },
  { name: 'bb', abbr: 'BB', bgColor: '#FDEF00', textColor: '#003882' },
  { name: 'caixa', abbr: 'CEF', bgColor: '#005CA9', textColor: '#FFFFFF' },
  { name: 'inter', abbr: 'Inter', bgColor: '#FF7A00', textColor: '#FFFFFF' },
  { name: 'c6', abbr: 'C6', bgColor: '#1A1A1A', textColor: '#FFFFFF' },
  { name: 'c6 bank', abbr: 'C6', bgColor: '#1A1A1A', textColor: '#FFFFFF' },
  { name: 'sicoob', abbr: 'Sic', bgColor: '#003641', textColor: '#8DC63F' },
  { name: 'sicredi', abbr: 'Sicr', bgColor: '#33A02C', textColor: '#FFFFFF' },
  { name: 'btg', abbr: 'BTG', bgColor: '#001E3D', textColor: '#FFFFFF' },
  { name: 'safra', abbr: 'Safra', bgColor: '#002D62', textColor: '#F0C75E' },
  { name: 'pagbank', abbr: 'Pag', bgColor: '#00A651', textColor: '#FFFFFF' },
  { name: 'pagseguro', abbr: 'Pag', bgColor: '#00A651', textColor: '#FFFFFF' },
  { name: 'mercado pago', abbr: 'MP', bgColor: '#009EE3', textColor: '#FFFFFF' },
  { name: 'stone', abbr: 'Sto', bgColor: '#00A868', textColor: '#FFFFFF' },
  { name: 'neon', abbr: 'Neon', bgColor: '#0DB0D9', textColor: '#FFFFFF' },
  { name: 'original', abbr: 'Ori', bgColor: '#00A54F', textColor: '#FFFFFF' },
  { name: 'next', abbr: 'Next', bgColor: '#00E364', textColor: '#1A1A1A' },
  { name: 'picpay', abbr: 'Pic', bgColor: '#21C25E', textColor: '#FFFFFF' },
  { name: 'will bank', abbr: 'Will', bgColor: '#E8FF2E', textColor: '#1A1A1A' },
  { name: 'will', abbr: 'Will', bgColor: '#E8FF2E', textColor: '#1A1A1A' },
  { name: 'banco pan', abbr: 'Pan', bgColor: '#0033A0', textColor: '#FFD100' },
  { name: 'pan', abbr: 'Pan', bgColor: '#0033A0', textColor: '#FFD100' },
  { name: 'iti', abbr: 'iti', bgColor: '#EC7000', textColor: '#FFFFFF' },
  { name: 'xp', abbr: 'XP', bgColor: '#1A1A1A', textColor: '#FFFFFF' },
  { name: 'rico', abbr: 'Rico', bgColor: '#FF5722', textColor: '#FFFFFF' },
  { name: 'clear', abbr: 'Clr', bgColor: '#1E88E5', textColor: '#FFFFFF' },
  { name: 'modal', abbr: 'Mod', bgColor: '#001B48', textColor: '#00B4D8' },
  { name: 'daycoval', abbr: 'Day', bgColor: '#003366', textColor: '#FFFFFF' },
  { name: 'bmg', abbr: 'BMG', bgColor: '#FF6600', textColor: '#FFFFFF' },
  { name: 'ailos', abbr: 'Ail', bgColor: '#004B87', textColor: '#7AB648' },
  { name: 'banrisul', abbr: 'Ban', bgColor: '#004B87', textColor: '#FFFFFF' },
  { name: 'sofisa', abbr: 'Sof', bgColor: '#1B3A5C', textColor: '#F5A623' },
  { name: 'agibank', abbr: 'Agi', bgColor: '#6B2D8B', textColor: '#FFFFFF' },
];

/**
 * Match an account name to a known bank brand.
 * Returns null if no match.
 */
export function matchBankBrand(accountName: string): BankBrand | null {
  const lower = accountName.toLowerCase().trim();
  // Try exact match first, then includes
  const exact = BANK_BRANDS.find(b => lower === b.name);
  if (exact) return exact;
  const partial = BANK_BRANDS.find(b => lower.includes(b.name) || b.name.includes(lower));
  return partial || null;
}

/** Wallet brand for "Carteira" type accounts */
export const WALLET_BRAND: BankBrand = {
  name: 'carteira',
  abbr: '💵',
  bgColor: '#22c55e',
  textColor: '#FFFFFF',
};
