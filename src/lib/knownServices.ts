export interface KnownService {
  name: string;
  category: string;
  defaultCycle: 'mensal' | 'anual' | 'semanal';
  type: 'assinatura' | 'conta_fixa';
  managementUrl: string;
}

export const KNOWN_SERVICES: KnownService[] = [
  // Streaming
  { name: 'Netflix', category: 'streaming', defaultCycle: 'mensal', type: 'assinatura', managementUrl: 'https://www.netflix.com/YourAccount' },
  { name: 'Spotify', category: 'streaming', defaultCycle: 'mensal', type: 'assinatura', managementUrl: 'https://www.spotify.com/account/overview/' },
  { name: 'Disney+', category: 'streaming', defaultCycle: 'mensal', type: 'assinatura', managementUrl: 'https://www.disneyplus.com/account' },
  { name: 'Amazon Prime Video', category: 'streaming', defaultCycle: 'mensal', type: 'assinatura', managementUrl: 'https://www.amazon.com.br/gp/primecentral' },
  { name: 'HBO Max', category: 'streaming', defaultCycle: 'mensal', type: 'assinatura', managementUrl: 'https://play.max.com/settings/subscription' },
  { name: 'Apple TV+', category: 'streaming', defaultCycle: 'mensal', type: 'assinatura', managementUrl: 'https://tv.apple.com/settings' },
  { name: 'Paramount+', category: 'streaming', defaultCycle: 'mensal', type: 'assinatura', managementUrl: 'https://www.paramountplus.com/account/' },
  { name: 'Globoplay', category: 'streaming', defaultCycle: 'mensal', type: 'assinatura', managementUrl: 'https://globoplay.globo.com/minha-conta/' },
  { name: 'Crunchyroll', category: 'streaming', defaultCycle: 'mensal', type: 'assinatura', managementUrl: 'https://www.crunchyroll.com/account' },
  { name: 'YouTube Premium', category: 'streaming', defaultCycle: 'mensal', type: 'assinatura', managementUrl: 'https://www.youtube.com/paid_memberships' },
  { name: 'Deezer', category: 'streaming', defaultCycle: 'mensal', type: 'assinatura', managementUrl: 'https://www.deezer.com/account/subscription' },
  { name: 'Apple Music', category: 'streaming', defaultCycle: 'mensal', type: 'assinatura', managementUrl: 'https://music.apple.com/account' },
  { name: 'Twitch', category: 'streaming', defaultCycle: 'mensal', type: 'assinatura', managementUrl: 'https://www.twitch.tv/subscriptions' },

  // Software / SaaS
  { name: 'Adobe Creative Cloud', category: 'software', defaultCycle: 'mensal', type: 'assinatura', managementUrl: 'https://account.adobe.com/plans' },
  { name: 'Canva Pro', category: 'software', defaultCycle: 'mensal', type: 'assinatura', managementUrl: 'https://www.canva.com/settings/billing' },
  { name: 'ChatGPT Plus', category: 'software', defaultCycle: 'mensal', type: 'assinatura', managementUrl: 'https://chat.openai.com/#settings' },
  { name: 'Microsoft 365', category: 'software', defaultCycle: 'anual', type: 'assinatura', managementUrl: 'https://account.microsoft.com/services/' },
  { name: 'Google Workspace', category: 'software', defaultCycle: 'mensal', type: 'assinatura', managementUrl: 'https://admin.google.com/ac/billing' },
  { name: 'Notion', category: 'software', defaultCycle: 'mensal', type: 'assinatura', managementUrl: 'https://www.notion.so/my-account' },
  { name: 'Slack', category: 'software', defaultCycle: 'mensal', type: 'assinatura', managementUrl: 'https://slack.com/intl/pt-br/pricing' },
  { name: 'Zoom', category: 'software', defaultCycle: 'mensal', type: 'assinatura', managementUrl: 'https://zoom.us/account' },
  { name: 'Figma', category: 'software', defaultCycle: 'mensal', type: 'assinatura', managementUrl: 'https://www.figma.com/settings' },
  { name: 'GitHub', category: 'software', defaultCycle: 'mensal', type: 'assinatura', managementUrl: 'https://github.com/settings/billing' },
  { name: 'Dropbox', category: 'software', defaultCycle: 'mensal', type: 'assinatura', managementUrl: 'https://www.dropbox.com/account/plan' },
  { name: 'Grammarly', category: 'software', defaultCycle: 'mensal', type: 'assinatura', managementUrl: 'https://account.grammarly.com/subscription' },
  { name: 'Lovable', category: 'software', defaultCycle: 'mensal', type: 'assinatura', managementUrl: 'https://lovable.dev/settings/billing' },

  // Cloud
  { name: 'iCloud+', category: 'cloud', defaultCycle: 'mensal', type: 'assinatura', managementUrl: 'https://www.icloud.com/settings/' },
  { name: 'Google One', category: 'cloud', defaultCycle: 'mensal', type: 'assinatura', managementUrl: 'https://one.google.com/settings' },
  { name: 'AWS', category: 'cloud', defaultCycle: 'mensal', type: 'assinatura', managementUrl: 'https://console.aws.amazon.com/billing/' },
  { name: 'Azure', category: 'cloud', defaultCycle: 'mensal', type: 'assinatura', managementUrl: 'https://portal.azure.com/#blade/Microsoft_Azure_CostManagement' },
  { name: 'Vercel', category: 'cloud', defaultCycle: 'mensal', type: 'assinatura', managementUrl: 'https://vercel.com/account/billing' },

  // Alimentação / Delivery
  { name: 'iFood', category: 'alimentacao', defaultCycle: 'mensal', type: 'assinatura', managementUrl: 'https://www.ifood.com.br/minha-conta' },
  { name: 'Rappi', category: 'alimentacao', defaultCycle: 'mensal', type: 'assinatura', managementUrl: 'https://www.rappi.com.br/' },

  // Transporte
  { name: 'Uber Pass', category: 'transporte', defaultCycle: 'mensal', type: 'assinatura', managementUrl: 'https://riders.uber.com/membership' },
  { name: '99', category: 'transporte', defaultCycle: 'mensal', type: 'assinatura', managementUrl: 'https://99app.com/' },

  // Telefonia / Internet
  { name: 'Claro', category: 'telefonia', defaultCycle: 'mensal', type: 'conta_fixa', managementUrl: 'https://www.claro.com.br/minha-claro' },
  { name: 'Vivo', category: 'telefonia', defaultCycle: 'mensal', type: 'conta_fixa', managementUrl: 'https://www.vivo.com.br/para-voce/meu-vivo' },
  { name: 'Tim', category: 'telefonia', defaultCycle: 'mensal', type: 'conta_fixa', managementUrl: 'https://www.tim.com.br/meu-tim' },
  { name: 'Oi', category: 'telefonia', defaultCycle: 'mensal', type: 'conta_fixa', managementUrl: 'https://www.oi.com.br/minha-oi' },

  // Energia
  { name: 'Enel', category: 'energia', defaultCycle: 'mensal', type: 'conta_fixa', managementUrl: 'https://www.enel.com.br/pt-saopaulo/sua-conta.html' },
  { name: 'CPFL', category: 'energia', defaultCycle: 'mensal', type: 'conta_fixa', managementUrl: 'https://www.cpfl.com.br/agencia-virtual' },
  { name: 'Light', category: 'energia', defaultCycle: 'mensal', type: 'conta_fixa', managementUrl: 'https://www.light.com.br/agencia-virtual' },
  { name: 'Cemig', category: 'energia', defaultCycle: 'mensal', type: 'conta_fixa', managementUrl: 'https://www.cemig.com.br/atendimento/' },

  // Água
  { name: 'Sabesp', category: 'agua', defaultCycle: 'mensal', type: 'conta_fixa', managementUrl: 'https://www.sabesp.com.br/agencia-virtual' },
  { name: 'Copasa', category: 'agua', defaultCycle: 'mensal', type: 'conta_fixa', managementUrl: 'https://www.copasa.com.br/' },
  { name: 'Cedae', category: 'agua', defaultCycle: 'mensal', type: 'conta_fixa', managementUrl: 'https://www.cedae.com.br/' },

  // Seguros
  { name: 'Unimed', category: 'seguros', defaultCycle: 'mensal', type: 'conta_fixa', managementUrl: 'https://www.unimed.coop.br/' },
  { name: 'Amil', category: 'seguros', defaultCycle: 'mensal', type: 'conta_fixa', managementUrl: 'https://www.amil.com.br/' },
  { name: 'SulAmérica', category: 'seguros', defaultCycle: 'mensal', type: 'conta_fixa', managementUrl: 'https://portal.sulamericaseguros.com.br/' },
  { name: 'Porto Seguro', category: 'seguros', defaultCycle: 'mensal', type: 'conta_fixa', managementUrl: 'https://www.portoseguro.com.br/' },
  { name: 'Bradesco Saúde', category: 'seguros', defaultCycle: 'mensal', type: 'conta_fixa', managementUrl: 'https://www.bradescosaude.com.br/' },

  // Aluguel
  { name: 'Aluguel', category: 'aluguel', defaultCycle: 'mensal', type: 'conta_fixa', managementUrl: '' },
  { name: 'Condomínio', category: 'aluguel', defaultCycle: 'mensal', type: 'conta_fixa', managementUrl: '' },

  // Academia / Saúde
  { name: 'SmartFit', category: 'academia', defaultCycle: 'mensal', type: 'assinatura', managementUrl: 'https://www.smartfit.com.br/meu-plano' },
  { name: 'BlueFit', category: 'academia', defaultCycle: 'mensal', type: 'assinatura', managementUrl: 'https://www.bluefit.com.br/' },
  { name: 'Gympass / Wellhub', category: 'academia', defaultCycle: 'mensal', type: 'assinatura', managementUrl: 'https://wellhub.com/' },

  // Educação
  { name: 'Duolingo Plus', category: 'software', defaultCycle: 'mensal', type: 'assinatura', managementUrl: 'https://www.duolingo.com/settings/account' },
  { name: 'Alura', category: 'software', defaultCycle: 'anual', type: 'assinatura', managementUrl: 'https://www.alura.com.br/minha-conta' },
  { name: 'Coursera Plus', category: 'software', defaultCycle: 'mensal', type: 'assinatura', managementUrl: 'https://www.coursera.org/account-settings' },

  // Restaurante / Food Service
  { name: 'Colibri', category: 'software', defaultCycle: 'mensal', type: 'assinatura', managementUrl: '' },
  { name: 'Goomer', category: 'software', defaultCycle: 'mensal', type: 'assinatura', managementUrl: 'https://www.goomer.com.br/' },
  { name: 'Saipos', category: 'software', defaultCycle: 'mensal', type: 'assinatura', managementUrl: 'https://www.saipos.com/' },
  { name: 'Consumer', category: 'software', defaultCycle: 'mensal', type: 'assinatura', managementUrl: '' },
  { name: 'Linx', category: 'software', defaultCycle: 'mensal', type: 'assinatura', managementUrl: '' },
  { name: 'Stone', category: 'software', defaultCycle: 'mensal', type: 'assinatura', managementUrl: 'https://conta.stone.com.br/' },
  { name: 'Cielo', category: 'software', defaultCycle: 'mensal', type: 'assinatura', managementUrl: 'https://www.cielo.com.br/' },
  { name: 'PagSeguro', category: 'software', defaultCycle: 'mensal', type: 'assinatura', managementUrl: 'https://pagseguro.uol.com.br/' },
  { name: 'Getnet', category: 'software', defaultCycle: 'mensal', type: 'assinatura', managementUrl: '' },
  { name: 'Rede', category: 'software', defaultCycle: 'mensal', type: 'assinatura', managementUrl: '' },
  { name: 'Anota AI', category: 'software', defaultCycle: 'mensal', type: 'assinatura', managementUrl: '' },
  { name: 'Simples Delivery', category: 'software', defaultCycle: 'mensal', type: 'assinatura', managementUrl: '' },
  { name: 'Delivery Much', category: 'software', defaultCycle: 'mensal', type: 'assinatura', managementUrl: '' },
  { name: 'Contabilizei', category: 'software', defaultCycle: 'mensal', type: 'assinatura', managementUrl: 'https://www.contabilizei.com.br/' },
  { name: 'Omie', category: 'software', defaultCycle: 'mensal', type: 'assinatura', managementUrl: 'https://app.omie.com.br/' },
  { name: 'Bling', category: 'software', defaultCycle: 'mensal', type: 'assinatura', managementUrl: 'https://www.bling.com.br/' },
  { name: 'aiqfome', category: 'alimentacao', defaultCycle: 'mensal', type: 'assinatura', managementUrl: '' },
  { name: 'Uber Eats', category: 'alimentacao', defaultCycle: 'mensal', type: 'assinatura', managementUrl: '' },

  // Gás
  { name: 'Comgás', category: 'energia', defaultCycle: 'mensal', type: 'conta_fixa', managementUrl: '' },
  { name: 'Ultragaz', category: 'energia', defaultCycle: 'mensal', type: 'conta_fixa', managementUrl: '' },

  // Energia extras
  { name: 'Elektro', category: 'energia', defaultCycle: 'mensal', type: 'conta_fixa', managementUrl: '' },
  { name: 'Energisa', category: 'energia', defaultCycle: 'mensal', type: 'conta_fixa', managementUrl: '' },
  { name: 'Equatorial', category: 'energia', defaultCycle: 'mensal', type: 'conta_fixa', managementUrl: '' },
];

export function searchServices(query: string): KnownService[] {
  if (!query || query.length < 2) return [];
  const normalized = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return KNOWN_SERVICES.filter(s =>
    s.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(normalized)
  ).slice(0, 6);
}
