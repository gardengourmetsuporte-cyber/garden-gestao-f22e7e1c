export interface MarketingDate {
  month: number; // 1-12
  day: number;
  title: string;
  emoji: string;
  suggestion: string;
  type?: 'holiday' | 'commercial' | 'recurring';
}

export const marketingDates: MarketingDate[] = [
  // Janeiro
  { month: 1, day: 1, title: 'Ano Novo', emoji: '🎆', suggestion: 'Comece o ano com uma promoção especial!' },
  { month: 1, day: 25, title: 'Aniversário de São Paulo', emoji: '🏙️', suggestion: 'Promoção especial para paulistanos' },
  // Fevereiro
  { month: 2, day: 16, title: 'Carnaval 2026', emoji: '🎭', suggestion: 'Post temático de carnaval com promoções' },
  { month: 2, day: 17, title: 'Carnaval (terça)', emoji: '🎉', suggestion: 'Último dia de folia! Aproveite' },
  // Março
  { month: 3, day: 8, title: 'Dia Internacional da Mulher', emoji: '👩', suggestion: 'Homenageie suas clientes e colaboradoras' },
  { month: 3, day: 15, title: 'Dia do Consumidor', emoji: '🛍️', suggestion: 'Mega promoção para fidelizar clientes' },
  { month: 3, day: 20, title: 'Início do Outono', emoji: '🍂', suggestion: 'Novidades de outono no cardápio' },
  // Abril
  { month: 4, day: 3, title: 'Sexta-feira Santa', emoji: '✝️', suggestion: 'Horário especial de funcionamento' },
  { month: 4, day: 5, title: 'Páscoa', emoji: '🐣', suggestion: 'Promoção de Páscoa para famílias' },
  { month: 4, day: 7, title: 'Dia Mundial da Saúde', emoji: '💚', suggestion: 'Destaque opções saudáveis do cardápio' },
  { month: 4, day: 21, title: 'Tiradentes', emoji: '🇧🇷', suggestion: 'Feriado nacional — horário especial' },
  { month: 4, day: 22, title: 'Descobrimento do Brasil', emoji: '🇧🇷', suggestion: 'Post sobre história e tradição' },
  // Maio
  { month: 5, day: 1, title: 'Dia do Trabalho', emoji: '👷', suggestion: 'Homenageie sua equipe' },
  { month: 5, day: 11, title: 'Dia das Mães', emoji: '👩‍👧', suggestion: 'Promoção especial para o Dia das Mães' },
  { month: 5, day: 15, title: 'Dia do Gerente', emoji: '💼', suggestion: 'Valorize a liderança do seu negócio' },
  // Junho
  { month: 6, day: 5, title: 'Dia do Meio Ambiente', emoji: '🌍', suggestion: 'Mostre seu compromisso ambiental' },
  { month: 6, day: 12, title: 'Dia dos Namorados', emoji: '❤️', suggestion: 'Crie um combo romântico para casais' },
  { month: 6, day: 13, title: 'Dia de Santo Antônio', emoji: '🙏', suggestion: 'Início das festas juninas!' },
  { month: 6, day: 24, title: 'São João', emoji: '🔥', suggestion: 'Festa junina com comidas típicas' },
  { month: 6, day: 29, title: 'São Pedro', emoji: '🎉', suggestion: 'Encerre o arraiá com promoção' },
  // Julho
  { month: 7, day: 2, title: 'Dia do Bombeiro', emoji: '🚒', suggestion: 'Homenagem aos heróis do dia a dia' },
  { month: 7, day: 13, title: 'Dia do Rock', emoji: '🎸', suggestion: 'Noite temática de rock no estabelecimento' },
  { month: 7, day: 20, title: 'Dia do Amigo', emoji: '🤝', suggestion: 'Leve um amigo e ganhe desconto' },
  { month: 7, day: 25, title: 'Dia do Escritor', emoji: '📝', suggestion: 'Post cultural e inspirador' },
  // Agosto
  { month: 8, day: 10, title: 'Dia dos Pais', emoji: '👨‍👧', suggestion: 'Promoção especial para o Dia dos Pais' },
  { month: 8, day: 11, title: 'Dia do Estudante', emoji: '📚', suggestion: 'Desconto para estudantes' },
  { month: 8, day: 22, title: 'Dia do Folclore', emoji: '🎪', suggestion: 'Post sobre cultura e tradição brasileira' },
  // Setembro
  { month: 9, day: 5, title: 'Dia da Amazônia', emoji: '🌳', suggestion: 'Post sobre sustentabilidade' },
  { month: 9, day: 7, title: 'Independência do Brasil', emoji: '🇧🇷', suggestion: 'Post patriótico — feriado nacional' },
  { month: 9, day: 21, title: 'Dia da Árvore', emoji: '🌲', suggestion: 'Compromisso ambiental do negócio' },
  { month: 9, day: 27, title: 'Dia do Turismo', emoji: '✈️', suggestion: 'Destaque sua região e seu negócio' },
  // Outubro
  { month: 10, day: 1, title: 'Dia do Idoso', emoji: '👴', suggestion: 'Promoção especial para a melhor idade' },
  { month: 10, day: 12, title: 'Dia das Crianças', emoji: '👶', suggestion: 'Promoção para famílias com crianças' },
  { month: 10, day: 12, title: 'Nossa Sra. Aparecida', emoji: '🙏', suggestion: 'Feriado nacional — post especial' },
  { month: 10, day: 15, title: 'Dia do Professor', emoji: '📖', suggestion: 'Homenagem aos professores' },
  { month: 10, day: 31, title: 'Dia do Saci', emoji: '🎃', suggestion: 'Folclore brasileiro no Halloween' },
  // Novembro
  { month: 11, day: 2, title: 'Finados', emoji: '🕯️', suggestion: 'Post respeitoso — feriado nacional' },
  { month: 11, day: 15, title: 'Proclamação da República', emoji: '🇧🇷', suggestion: 'Feriado: horário especial' },
  { month: 11, day: 20, title: 'Consciência Negra', emoji: '✊🏿', suggestion: 'Post sobre diversidade e inclusão' },
  { month: 11, day: 28, title: 'Black Friday', emoji: '🏷️', suggestion: 'Mega promoções de Black Friday' },
  // Dezembro
  { month: 12, day: 25, title: 'Natal', emoji: '🎄', suggestion: 'Feliz Natal! Promoção natalina' },
  { month: 12, day: 31, title: 'Réveillon', emoji: '🎇', suggestion: 'Encerre o ano com chave de ouro' },
];

/** Recurring monthly commercial dates (vale, pagamento) */
export const recurringCommercialDates: MarketingDate[] = [
  { month: 0, day: 5, title: 'Dia do pagamento', emoji: '💰', suggestion: 'Muita gente recebeu! Hora de promoção especial', type: 'recurring' },
  { month: 0, day: 20, title: 'Dia do vale', emoji: '💵', suggestion: 'Vale caiu! Promoção para quem recebeu adiantamento', type: 'recurring' },
];

export function getDatesForMonth(month: number): MarketingDate[] {
  return marketingDates.filter(d => d.month === month);
}

export function getDateForDay(month: number, day: number): MarketingDate | undefined {
  return marketingDates.find(d => d.month === month && d.day === day);
}

/** Get upcoming dates (holidays + recurring commercial) from today, up to `count` items */
export function getUpcomingDates(count = 8): (MarketingDate & { fullDate: Date })[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const year = today.getFullYear();

  // Generate holiday dates for this year and next
  const holidayDates = [
    ...marketingDates.map(d => ({
      ...d,
      fullDate: new Date(year, d.month - 1, d.day),
    })),
    ...marketingDates.map(d => ({
      ...d,
      fullDate: new Date(year + 1, d.month - 1, d.day),
    })),
  ];

  // Generate recurring commercial dates for this month and next 2
  const commercialDates: (MarketingDate & { fullDate: Date })[] = [];
  for (let offset = 0; offset <= 2; offset++) {
    const m = new Date(year, today.getMonth() + offset, 1);
    recurringCommercialDates.forEach(d => {
      commercialDates.push({
        ...d,
        month: m.getMonth() + 1,
        fullDate: new Date(m.getFullYear(), m.getMonth(), d.day),
      });
    });
  }

  // Merge, filter future only, sort by date, dedupe by date+title
  const all = [...holidayDates, ...commercialDates]
    .filter(d => d.fullDate >= today)
    .sort((a, b) => a.fullDate.getTime() - b.fullDate.getTime());

  const seen = new Set<string>();
  const result: (MarketingDate & { fullDate: Date })[] = [];
  for (const d of all) {
    const key = `${d.fullDate.toISOString().slice(0, 10)}-${d.title}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(d);
    if (result.length >= count) break;
  }
  return result;
}
