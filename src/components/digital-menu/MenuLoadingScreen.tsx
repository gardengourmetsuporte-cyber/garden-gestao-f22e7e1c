import { PageLoader } from '@/components/PageLoader';

interface Props {
  message?: string;
  logoUrl?: string | null;
}

export function MenuLoadingScreen({ message, logoUrl }: Props) {
  return <PageLoader logoUrl={logoUrl} />;
}
