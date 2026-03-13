// Simple i18n for digital menu (PT-BR, EN, ES)
export type MenuLocale = 'pt' | 'en' | 'es';

const translations: Record<string, Record<MenuLocale, string>> = {
  // Navigation
  'nav.home': { pt: 'Início', en: 'Home', es: 'Inicio' },
  'nav.menu': { pt: 'Cardápio', en: 'Menu', es: 'Menú' },
  'nav.cart': { pt: 'Carrinho', en: 'Cart', es: 'Carrito' },
  'nav.account': { pt: 'Conta', en: 'Account', es: 'Cuenta' },
  'nav.orders': { pt: 'Pedidos', en: 'Orders', es: 'Pedidos' },
  
  // Products
  'product.add': { pt: 'Adicionar', en: 'Add', es: 'Agregar' },
  'product.from': { pt: 'A partir de', en: 'From', es: 'Desde' },
  'product.description': { pt: 'Descrição', en: 'Description', es: 'Descripción' },
  'product.options': { pt: 'Opcionais', en: 'Options', es: 'Opciones' },
  'product.required': { pt: 'Obrigatório', en: 'Required', es: 'Obligatorio' },
  'product.optional': { pt: 'Opcional', en: 'Optional', es: 'Opcional' },
  'product.select_min': { pt: 'Selecione no mínimo', en: 'Select at least', es: 'Seleccione al menos' },
  'product.select_max': { pt: 'Selecione no máximo', en: 'Select up to', es: 'Seleccione hasta' },
  'product.observations': { pt: 'Observações', en: 'Notes', es: 'Observaciones' },
  'product.search': { pt: 'Buscar produtos...', en: 'Search products...', es: 'Buscar productos...' },
  'product.no_results': { pt: 'Nenhum produto encontrado', en: 'No products found', es: 'No se encontraron productos' },
  'product.highlight': { pt: 'Destaque', en: 'Featured', es: 'Destacado' },
  'product.age_restriction': { pt: '+18', en: '18+', es: '+18' },
  
  // Cart
  'cart.title': { pt: 'Seu Carrinho', en: 'Your Cart', es: 'Tu Carrito' },
  'cart.empty': { pt: 'Carrinho vazio', en: 'Empty cart', es: 'Carrito vacío' },
  'cart.total': { pt: 'Total', en: 'Total', es: 'Total' },
  'cart.checkout': { pt: 'Finalizar Pedido', en: 'Place Order', es: 'Realizar Pedido' },
  'cart.remove': { pt: 'Remover', en: 'Remove', es: 'Eliminar' },
  'cart.items': { pt: 'itens', en: 'items', es: 'artículos' },
  'cart.subtotal': { pt: 'Subtotal', en: 'Subtotal', es: 'Subtotal' },
  'cart.coupon': { pt: 'Cupom de desconto', en: 'Discount coupon', es: 'Cupón de descuento' },
  'cart.apply': { pt: 'Aplicar', en: 'Apply', es: 'Aplicar' },
  
  // Auth
  'auth.login': { pt: 'Entrar', en: 'Sign In', es: 'Iniciar Sesión' },
  'auth.register': { pt: 'Criar conta', en: 'Create Account', es: 'Crear Cuenta' },
  'auth.email': { pt: 'E-mail', en: 'Email', es: 'Correo' },
  'auth.password': { pt: 'Senha', en: 'Password', es: 'Contraseña' },
  'auth.logout': { pt: 'Sair', en: 'Sign Out', es: 'Cerrar Sesión' },
  'auth.welcome': { pt: 'Bem-vindo!', en: 'Welcome!', es: '¡Bienvenido!' },
  
  // Profile
  'profile.name': { pt: 'Nome', en: 'Name', es: 'Nombre' },
  'profile.phone': { pt: 'Telefone', en: 'Phone', es: 'Teléfono' },
  'profile.birthday': { pt: 'Aniversário', en: 'Birthday', es: 'Cumpleaños' },
  'profile.save': { pt: 'Salvar', en: 'Save', es: 'Guardar' },
  'profile.my_orders': { pt: 'Meus Pedidos', en: 'My Orders', es: 'Mis Pedidos' },
  'profile.favorites': { pt: 'Favoritos', en: 'Favorites', es: 'Favoritos' },
  
  // Order
  'order.status.pending': { pt: 'Pendente', en: 'Pending', es: 'Pendiente' },
  'order.status.preparing': { pt: 'Preparando', en: 'Preparing', es: 'Preparando' },
  'order.status.ready': { pt: 'Pronto', en: 'Ready', es: 'Listo' },
  'order.status.delivered': { pt: 'Entregue', en: 'Delivered', es: 'Entregado' },
  'order.placed': { pt: 'Pedido realizado!', en: 'Order placed!', es: '¡Pedido realizado!' },
  'order.track': { pt: 'Acompanhar Pedido', en: 'Track Order', es: 'Seguir Pedido' },
  
  // General
  'general.back': { pt: 'Voltar', en: 'Back', es: 'Volver' },
  'general.close': { pt: 'Fechar', en: 'Close', es: 'Cerrar' },
  'general.loading': { pt: 'Carregando...', en: 'Loading...', es: 'Cargando...' },
  'general.error': { pt: 'Erro', en: 'Error', es: 'Error' },
  'general.success': { pt: 'Sucesso', en: 'Success', es: 'Éxito' },
  'general.categories': { pt: 'Categorias', en: 'Categories', es: 'Categorías' },
  'general.see_all': { pt: 'Ver tudo', en: 'See all', es: 'Ver todo' },

  // Landing
  'landing.explore': { pt: 'Explorar Cardápio', en: 'Explore Menu', es: 'Explorar Menú' },
  'landing.welcome': { pt: 'Bem-vindo ao nosso cardápio', en: 'Welcome to our menu', es: 'Bienvenido a nuestro menú' },
  'landing.open_now': { pt: 'Aberto agora', en: 'Open now', es: 'Abierto ahora' },
  'landing.closed': { pt: 'Fechado', en: 'Closed', es: 'Cerrado' },
  'landing.my_account': { pt: 'Minha conta', en: 'My account', es: 'Mi cuenta' },
  'landing.sign_in': { pt: 'Entrar', en: 'Sign In', es: 'Iniciar Sesión' },
  
  // NPS
  'nps.how_was': { pt: 'Como foi sua experiência?', en: 'How was your experience?', es: '¿Cómo fue tu experiencia?' },
  'nps.comment': { pt: 'Deixe um comentário (opcional)', en: 'Leave a comment (optional)', es: 'Deja un comentario (opcional)' },
  'nps.send': { pt: 'Enviar avaliação', en: 'Send review', es: 'Enviar evaluación' },
  'nps.thanks': { pt: 'Obrigado pela avaliação!', en: 'Thanks for your feedback!', es: '¡Gracias por tu evaluación!' },
};

let currentLocale: MenuLocale = 'pt';

export function setMenuLocale(locale: MenuLocale) {
  currentLocale = locale;
  localStorage.setItem('menu_locale', locale);
}

export function getMenuLocale(): MenuLocale {
  const stored = localStorage.getItem('menu_locale') as MenuLocale | null;
  if (stored && ['pt', 'en', 'es'].includes(stored)) {
    currentLocale = stored;
    return stored;
  }
  return currentLocale;
}

export function t(key: string): string {
  const locale = getMenuLocale();
  return translations[key]?.[locale] ?? translations[key]?.['pt'] ?? key;
}

export const LOCALE_LABELS: Record<MenuLocale, string> = {
  pt: '🇧🇷 PT',
  en: '🇺🇸 EN',
  es: '🇪🇸 ES',
};
