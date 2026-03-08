import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const ROUTE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/finance': 'Financeiro',
  '/personal-finance': 'Finanças Pessoais',
  '/inventory': 'Estoque',
  '/orders': 'Pedidos',
  '/recipes': 'Fichas Técnicas',
  '/checklists': 'Checklists',
  '/employees': 'Equipe',
  '/cash-closing': 'Fechamento de Caixa',
  '/agenda': 'Agenda',
  '/marketing': 'Marketing',
  '/ranking': 'Ranking',
  '/rewards': 'Recompensas',
  '/gamification': 'Gamificação',
  '/profile': 'Perfil',
  '/settings': 'Configurações',
  '/copilot': 'Copilot IA',
  '/whatsapp': 'WhatsApp',
  '/plans': 'Planos',
  '/calendar': 'Calendário',
  '/menu-admin': 'Cardápio',
  '/customers': 'Clientes',
  '/deliveries': 'Entregas',
  '/brand': 'Marca',
  '/notifications': 'Notificações',
  '/cardapio': 'Cardápio Digital',
  
};

const APP_NAME = 'Garden Gestão';

export function getRouteTitle(pathname: string): string | null {
  // Exact match first
  if (ROUTE_TITLES[pathname]) return ROUTE_TITLES[pathname];
  // Try base path (e.g. /profile/me → /profile)
  const base = '/' + pathname.split('/').filter(Boolean)[0];
  return ROUTE_TITLES[base] || null;
}

export function useDocumentTitle() {
  const { pathname } = useLocation();

  useEffect(() => {
    const title = getRouteTitle(pathname);
    document.title = title ? `${title} · ${APP_NAME}` : APP_NAME;
  }, [pathname]);
}
