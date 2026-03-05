import gardenLogo from '@/assets/logo.png';
import { useUnit } from '@/contexts/UnitContext';

export function useUnitLogo(): string {
  const { activeUnit } = useUnit();
  const storeInfo = (activeUnit as any)?.store_info as Record<string, any> | undefined;
  return storeInfo?.logo_url || gardenLogo;
}
