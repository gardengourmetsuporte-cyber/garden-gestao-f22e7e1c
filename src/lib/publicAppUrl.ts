export function getPublicAppUrl(): string {
  const configuredUrl = import.meta.env.VITE_PUBLISHED_URL?.trim();
  const fallbackUrl = 'https://garden-gestao.lovable.app';

  return (configuredUrl && configuredUrl.length > 0 ? configuredUrl : fallbackUrl).replace(/\/$/, '');
}
