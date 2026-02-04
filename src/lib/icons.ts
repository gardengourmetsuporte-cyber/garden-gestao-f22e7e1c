import { LucideIcon } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

// Utility to get a Lucide icon component by name
export function getLucideIcon(iconName: string): LucideIcon | null {
  const icons = LucideIcons as unknown as Record<string, LucideIcon>;
  return icons[iconName] || null;
}
