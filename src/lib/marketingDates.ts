export interface MarketingDate {
  month: number; // 1-12
  day: number;
  title: string;
  emoji: string;
  suggestion: string;
}

export const marketingDates: MarketingDate[] = [
  // Janeiro
  { month: 1, day: 1, title: 'Ano Novo', emoji: '🎆', suggestion: 'Comece o ano com uma promoção especial!' },
  { month: 1, day: 15, title: 'Dia do Adulto', emoji: '🧑', suggestion: 'Post motivacional para seus clientes' },
  // Fevereiro
  { month: 2, day: 14, title: 'Valentine\'s Day', emoji: '💕', suggestion: 'Promoção para casais' },
  { month: 2, day: 22, title: 'Carnaval', emoji: '🎭', suggestion: 'Post temático de carnaval' },
  // Março
  { month: 3, day: 8, title: 'Dia da Mulher', emoji: '👩', suggestion: 'Homenageie suas clientes e colaboradoras' },
  { month: 3, day: 15, title: 'Dia do Consumidor', emoji: '🛍️', suggestion: 'Mega promoção para fidelizar clientes' },
  { month: 3, day: 20, title: 'Início do Outono', emoji: '🍂', suggestion: 'Novidades de outono no cardápio' },
  // Abril
  { month: 4, day: 7, title: 'Dia Mundial da Saúde', emoji: '💚', suggestion: 'Destaque opções saudáveis do cardápio' },
  { month: 4, day: 18, title: 'Sexta-feira Santa', emoji: '✝️', suggestion: 'Horário especial de funcionamento' },
  { month: 4, day: 21, title: 'Tiradentes', emoji: '🇧🇷', suggestion: 'Post sobre história e tradição' },
  // Maio
  { month: 5, day: 1, title: 'Dia do Trabalho', emoji: '👷', suggestion: 'Homenageie sua equipe' },
  { month: 5, day: 11, title: 'Dia das Mães', emoji: '👩‍👧', suggestion: 'Promoção especial para o Dia das Mães' },
  // Junho
  { month: 6, day: 12, title: 'Dia dos Namorados', emoji: '❤️', suggestion: 'Crie um combo romântico' },
  { month: 6, day: 24, title: 'São João', emoji: '🔥', suggestion: 'Festa junina com comidas típicas' },
  { month: 6, day: 29, title: 'São Pedro', emoji: '🎉', suggestion: 'Encerre o arraiá com promoção' },
  // Julho
  { month: 7, day: 13, title: 'Dia do Rock', emoji: '🎸', suggestion: 'Promoção temática de rock' },
  { month: 7, day: 20, title: 'Dia do Amigo', emoji: '🤝', suggestion: 'Leve um amigo e ganhe desconto' },
  // Agosto
  { month: 8, day: 10, title: 'Dia dos Pais', emoji: '👨‍👧', suggestion: 'Promoção especial para o Dia dos Pais' },
  { month: 8, day: 11, title: 'Dia do Estudante', emoji: '📚', suggestion: 'Desconto para estudantes' },
  // Setembro
  { month: 9, day: 5, title: 'Dia da Amazônia', emoji: '🌳', suggestion: 'Post sobre sustentabilidade' },
  { month: 9, day: 7, title: 'Independência', emoji: '🇧🇷', suggestion: 'Post patriótico' },
  { month: 9, day: 21, title: 'Dia da Árvore', emoji: '🌲', suggestion: 'Compromisso ambiental do negócio' },
  // Outubro
  { month: 10, day: 12, title: 'Dia das Crianças', emoji: '👶', suggestion: 'Promoção para famílias' },
  { month: 10, day: 15, title: 'Dia do Professor', emoji: '📖', suggestion: 'Homenagem aos professores' },
  { month: 10, day: 31, title: 'Halloween', emoji: '🎃', suggestion: 'Post temático de Halloween' },
  // Novembro
  { month: 11, day: 15, title: 'Proclamação da República', emoji: '🇧🇷', suggestion: 'Feriado: horário especial' },
  { month: 11, day: 20, title: 'Dia da Consciência Negra', emoji: '✊🏿', suggestion: 'Post sobre diversidade e inclusão' },
  { month: 11, day: 28, title: 'Black Friday', emoji: '🏷️', suggestion: 'Mega promoções de Black Friday' },
  // Dezembro
  { month: 12, day: 25, title: 'Natal', emoji: '🎄', suggestion: 'Feliz Natal! Promoção natalina' },
  { month: 12, day: 31, title: 'Réveillon', emoji: '🎇', suggestion: 'Encerre o ano com chave de ouro' },
];

export function getDatesForMonth(month: number): MarketingDate[] {
  return marketingDates.filter(d => d.month === month);
}

export function getDateForDay(month: number, day: number): MarketingDate | undefined {
  return marketingDates.find(d => d.month === month && d.day === day);
}
