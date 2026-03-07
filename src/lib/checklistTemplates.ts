// Checklist templates for quick setup

export interface ChecklistTemplate {
  id: string;
  name: string;
  icon: string;
  description: string;
  badge?: string;
  sectors: {
    name: string;
    color: string;
    icon: string;
    subcategories: {
      name: string;
      items: {
        name: string;
        checklist_type: 'abertura' | 'fechamento';
        points: number;
        requires_photo: boolean;
      }[];
    }[];
  }[];
}

export const CHECKLIST_TEMPLATES: ChecklistTemplate[] = [
  {
    id: 'basico',
    name: 'Básico',
    icon: 'Clipboard',
    badge: 'Rápido',
    description: 'Essencial para começar — tarefas simples de abertura e fechamento',
    sectors: [
      {
        name: 'Salão', color: '#3b82f6', icon: 'Armchair',
        subcategories: [
          {
            name: 'Limpeza',
            items: [
              { name: 'Limpar mesas e cadeiras', checklist_type: 'abertura', points: 5, requires_photo: false },
              { name: 'Varrer e passar pano no chão', checklist_type: 'abertura', points: 5, requires_photo: false },
              { name: 'Limpar banheiros', checklist_type: 'abertura', points: 5, requires_photo: false },
              { name: 'Recolher lixos do salão', checklist_type: 'fechamento', points: 5, requires_photo: false },
              { name: 'Limpar mesas ao final', checklist_type: 'fechamento', points: 5, requires_photo: false },
            ],
          },
        ],
      },
      {
        name: 'Cozinha', color: '#ef4444', icon: 'ChefHat',
        subcategories: [
          {
            name: 'Preparo',
            items: [
              { name: 'Ligar equipamentos', checklist_type: 'abertura', points: 5, requires_photo: false },
              { name: 'Conferir mise en place', checklist_type: 'abertura', points: 5, requires_photo: false },
              { name: 'Desligar todos os equipamentos', checklist_type: 'fechamento', points: 10, requires_photo: false },
              { name: 'Limpar bancadas e fogão', checklist_type: 'fechamento', points: 5, requires_photo: false },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'avancado',
    name: 'Avançado',
    icon: 'ClipboardCheck',
    badge: 'Recomendado',
    description: 'Completo com setores detalhados, fotos obrigatórias e pontuação',
    sectors: [
      {
        name: 'Salão', color: '#3b82f6', icon: 'Armchair',
        subcategories: [
          {
            name: 'Limpeza',
            items: [
              { name: 'Limpar mesas e cadeiras', checklist_type: 'abertura', points: 5, requires_photo: false },
              { name: 'Varrer e passar pano no chão', checklist_type: 'abertura', points: 5, requires_photo: false },
              { name: 'Limpar vidros e espelhos', checklist_type: 'abertura', points: 5, requires_photo: false },
              { name: 'Limpar banheiros', checklist_type: 'abertura', points: 10, requires_photo: true },
              { name: 'Recolher todos os lixos', checklist_type: 'fechamento', points: 5, requires_photo: false },
              { name: 'Limpar mesas e guardar utensílios', checklist_type: 'fechamento', points: 5, requires_photo: false },
              { name: 'Passar pano úmido no chão', checklist_type: 'fechamento', points: 5, requires_photo: false },
            ],
          },
          {
            name: 'Organização',
            items: [
              { name: 'Organizar cardápios nas mesas', checklist_type: 'abertura', points: 5, requires_photo: false },
              { name: 'Verificar decoração e iluminação', checklist_type: 'abertura', points: 5, requires_photo: false },
              { name: 'Conferir estoque de guardanapos e talheres', checklist_type: 'abertura', points: 5, requires_photo: false },
              { name: 'Guardar cardápios', checklist_type: 'fechamento', points: 3, requires_photo: false },
            ],
          },
        ],
      },
      {
        name: 'Cozinha', color: '#ef4444', icon: 'ChefHat',
        subcategories: [
          {
            name: 'Equipamentos',
            items: [
              { name: 'Ligar fogão, forno e chapas', checklist_type: 'abertura', points: 10, requires_photo: false },
              { name: 'Verificar temperatura das geladeiras', checklist_type: 'abertura', points: 10, requires_photo: true },
              { name: 'Desligar todos os equipamentos', checklist_type: 'fechamento', points: 10, requires_photo: false },
              { name: 'Limpar chapas e grelhas', checklist_type: 'fechamento', points: 10, requires_photo: true },
            ],
          },
          {
            name: 'Preparo e Organização',
            items: [
              { name: 'Conferir mise en place completo', checklist_type: 'abertura', points: 10, requires_photo: false },
              { name: 'Verificar validade dos insumos', checklist_type: 'abertura', points: 10, requires_photo: false },
              { name: 'Organizar praça de trabalho', checklist_type: 'abertura', points: 5, requires_photo: false },
              { name: 'Embalar e etiquetar sobras', checklist_type: 'fechamento', points: 10, requires_photo: true },
              { name: 'Limpar bancadas e pias', checklist_type: 'fechamento', points: 5, requires_photo: false },
              { name: 'Lavar utensílios pendentes', checklist_type: 'fechamento', points: 5, requires_photo: false },
            ],
          },
        ],
      },
      {
        name: 'Caixa', color: '#10b981', icon: 'Calculator',
        subcategories: [
          {
            name: 'Operação',
            items: [
              { name: 'Conferir fundo de caixa', checklist_type: 'abertura', points: 10, requires_photo: false },
              { name: 'Verificar máquinas de cartão', checklist_type: 'abertura', points: 5, requires_photo: false },
              { name: 'Fechar caixa e conferir valores', checklist_type: 'fechamento', points: 15, requires_photo: false },
              { name: 'Guardar dinheiro em local seguro', checklist_type: 'fechamento', points: 10, requires_photo: false },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'profissional',
    name: 'Profissional',
    icon: 'ShieldCheck',
    badge: 'Completo',
    description: 'Padrão de franquia — máximo controle, fotos e pontuações elevadas',
    sectors: [
      {
        name: 'Salão', color: '#3b82f6', icon: 'Armchair',
        subcategories: [
          {
            name: 'Limpeza Geral',
            items: [
              { name: 'Limpar todas as mesas e cadeiras', checklist_type: 'abertura', points: 5, requires_photo: true },
              { name: 'Varrer e passar pano no salão', checklist_type: 'abertura', points: 5, requires_photo: false },
              { name: 'Limpar vidros, portas e janelas', checklist_type: 'abertura', points: 5, requires_photo: true },
              { name: 'Limpar banheiro masculino', checklist_type: 'abertura', points: 10, requires_photo: true },
              { name: 'Limpar banheiro feminino', checklist_type: 'abertura', points: 10, requires_photo: true },
              { name: 'Repor papel, sabonete e álcool', checklist_type: 'abertura', points: 5, requires_photo: false },
              { name: 'Recolher todos os lixos', checklist_type: 'fechamento', points: 5, requires_photo: false },
              { name: 'Limpeza final do salão', checklist_type: 'fechamento', points: 10, requires_photo: true },
              { name: 'Banheiros — limpeza final', checklist_type: 'fechamento', points: 10, requires_photo: true },
            ],
          },
          {
            name: 'Ambiente e Apresentação',
            items: [
              { name: 'Verificar iluminação e climatização', checklist_type: 'abertura', points: 5, requires_photo: false },
              { name: 'Organizar cardápios e porta-guardanapos', checklist_type: 'abertura', points: 5, requires_photo: false },
              { name: 'Conferir playlist de música', checklist_type: 'abertura', points: 3, requires_photo: false },
              { name: 'Verificar fachada e letreiro', checklist_type: 'abertura', points: 5, requires_photo: true },
              { name: 'Desligar ar-condicionado e TVs', checklist_type: 'fechamento', points: 5, requires_photo: false },
              { name: 'Trancar portas e janelas', checklist_type: 'fechamento', points: 10, requires_photo: false },
            ],
          },
        ],
      },
      {
        name: 'Cozinha', color: '#ef4444', icon: 'ChefHat',
        subcategories: [
          {
            name: 'Equipamentos',
            items: [
              { name: 'Ligar fogão, forno e chapas', checklist_type: 'abertura', points: 10, requires_photo: false },
              { name: 'Verificar temperatura das geladeiras', checklist_type: 'abertura', points: 10, requires_photo: true },
              { name: 'Verificar temperatura dos freezers', checklist_type: 'abertura', points: 10, requires_photo: true },
              { name: 'Testar exaustores e coifas', checklist_type: 'abertura', points: 5, requires_photo: false },
              { name: 'Desligar fogão, forno e chapas', checklist_type: 'fechamento', points: 10, requires_photo: false },
              { name: 'Limpar chapas, grelhas e fritadeiras', checklist_type: 'fechamento', points: 10, requires_photo: true },
              { name: 'Registrar temperaturas finais', checklist_type: 'fechamento', points: 10, requires_photo: true },
            ],
          },
          {
            name: 'Mise en Place',
            items: [
              { name: 'Conferir porcionamento e mise en place', checklist_type: 'abertura', points: 10, requires_photo: false },
              { name: 'Verificar validade de todos os insumos', checklist_type: 'abertura', points: 10, requires_photo: false },
              { name: 'Higienizar frutas e verduras', checklist_type: 'abertura', points: 10, requires_photo: false },
              { name: 'Organizar praça de cada cozinheiro', checklist_type: 'abertura', points: 5, requires_photo: false },
              { name: 'Embalar, etiquetar e armazenar sobras', checklist_type: 'fechamento', points: 10, requires_photo: true },
              { name: 'Descartar itens vencidos', checklist_type: 'fechamento', points: 10, requires_photo: false },
            ],
          },
          {
            name: 'Limpeza e Higiene',
            items: [
              { name: 'Limpar bancadas e pias', checklist_type: 'fechamento', points: 5, requires_photo: false },
              { name: 'Lavar todos os utensílios', checklist_type: 'fechamento', points: 5, requires_photo: false },
              { name: 'Higienizar tábuas de corte', checklist_type: 'fechamento', points: 5, requires_photo: false },
              { name: 'Limpar piso da cozinha', checklist_type: 'fechamento', points: 10, requires_photo: true },
              { name: 'Retirar lixo orgânico e reciclável', checklist_type: 'fechamento', points: 5, requires_photo: false },
            ],
          },
        ],
      },
      {
        name: 'Caixa', color: '#10b981', icon: 'Calculator',
        subcategories: [
          {
            name: 'Abertura e Fechamento',
            items: [
              { name: 'Conferir fundo de caixa', checklist_type: 'abertura', points: 10, requires_photo: false },
              { name: 'Testar máquinas de cartão (débito e crédito)', checklist_type: 'abertura', points: 5, requires_photo: false },
              { name: 'Verificar bobinas e material de impressão', checklist_type: 'abertura', points: 3, requires_photo: false },
              { name: 'Fechar caixa e bater valores', checklist_type: 'fechamento', points: 15, requires_photo: false },
              { name: 'Separar sangria e guardar dinheiro', checklist_type: 'fechamento', points: 10, requires_photo: false },
              { name: 'Imprimir relatório do dia', checklist_type: 'fechamento', points: 5, requires_photo: false },
            ],
          },
        ],
      },
      {
        name: 'Estoque', color: '#f59e0b', icon: 'Package',
        subcategories: [
          {
            name: 'Conferência',
            items: [
              { name: 'Receber e conferir entregas de fornecedores', checklist_type: 'abertura', points: 10, requires_photo: true },
              { name: 'Verificar itens com estoque baixo', checklist_type: 'abertura', points: 5, requires_photo: false },
              { name: 'Organizar estoque seco', checklist_type: 'fechamento', points: 5, requires_photo: false },
              { name: 'Conferir estoque de bebidas', checklist_type: 'fechamento', points: 5, requires_photo: false },
            ],
          },
        ],
      },
    ],
  },
];
