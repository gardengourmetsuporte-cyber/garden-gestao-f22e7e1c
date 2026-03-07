import { useState, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  BookOpen, ChevronRight, Download, Search, Menu, X,
  LayoutDashboard, CalendarDays, DollarSign, Package, ClipboardCheck,
  Receipt, ChefHat, Users, Gift, Trophy, ShoppingCart, Truck, UserSearch,
  Sparkles, Megaphone, BookOpenCheck, MessageCircle, Settings, Wallet,
  Database, Shield, Zap, Server, Code, Layers, Lock, Globe,
  ArrowLeft
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';

// ── Section data ──

interface DocSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  category: 'overview' | 'modules' | 'technical';
  content: React.ReactNode;
}

const SECTIONS: DocSection[] = [
  // ═══════ OVERVIEW ═══════
  {
    id: 'intro',
    title: 'Visão Geral',
    icon: <BookOpen className="w-4 h-4" />,
    category: 'overview',
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground leading-relaxed">
          O <strong>Atlas</strong> é uma plataforma SaaS completa de gestão para restaurantes, desenvolvida com foco em operações reais de food service.
          Posicionamento: <em>"Feito por restaurante, para restaurantes"</em>.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Multi-tenant', desc: 'Isolamento total de dados por unidade (unit_id)' },
            { label: 'Mobile-first', desc: 'Interface responsiva otimizada para uso operacional' },
            { label: 'Modular', desc: '15+ módulos independentes com controle granular de acesso' },
          ].map(f => (
            <div key={f.label} className="rounded-lg border border-border bg-card p-4">
              <p className="font-semibold text-sm text-foreground">{f.label}</p>
              <p className="text-xs text-muted-foreground mt-1">{f.desc}</p>
            </div>
          ))}
        </div>
        <h3 className="text-lg font-semibold mt-6">Stack Tecnológica</h3>
        <div className="flex flex-wrap gap-2">
          {['React 18', 'TypeScript', 'Vite', 'Tailwind CSS', 'Supabase', 'TanStack Query', 'React Router v6', 'Shadcn/ui', 'Capacitor (mobile)'].map(t => (
            <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'architecture',
    title: 'Arquitetura',
    icon: <Layers className="w-4 h-4" />,
    category: 'overview',
    content: (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Camadas da Aplicação</h3>
        <div className="space-y-3">
          {[
            { layer: 'Apresentação', desc: 'Páginas React (lazy-loaded) + componentes Shadcn/ui customizados', tech: 'React, Tailwind, Framer Motion' },
            { layer: 'Lógica de Negócio', desc: 'Custom hooks modulares (useFinanceCore, useChecklists, etc.)', tech: 'TanStack Query, React Hook Form, Zod' },
            { layer: 'Dados & Estado', desc: 'Supabase client + cache otimista via React Query', tech: 'Supabase JS SDK, React Query' },
            { layer: 'Backend', desc: 'Edge Functions serverless + triggers PostgreSQL + RLS', tech: 'Deno, PostgreSQL, pg_net' },
            { layer: 'Infraestrutura', desc: 'Lovable Cloud com auto-deploy de frontend e backend', tech: 'Supabase Cloud, CDN' },
          ].map(l => (
            <div key={l.layer} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-sm text-foreground">{l.layer}</p>
                <Badge variant="outline" className="text-[10px]">{l.tech}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{l.desc}</p>
            </div>
          ))}
        </div>

        <h3 className="text-lg font-semibold mt-6">Modelo Multi-Tenant</h3>
        <p className="text-sm text-muted-foreground">
          Cada restaurante é uma <strong>unidade (unit)</strong>. Todos os dados são isolados por <code className="bg-muted px-1 rounded text-xs">unit_id</code> tanto nas queries do frontend quanto nas políticas RLS do banco. Um usuário pode pertencer a múltiplas unidades com papéis diferentes (Owner, Admin, Member).
        </p>

        <h3 className="text-lg font-semibold mt-6">Controle de Acesso</h3>
        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
          <li><strong>Papéis por unidade:</strong> Owner → Admin → Member (tabela user_units)</li>
          <li><strong>Níveis de acesso:</strong> Conjuntos customizáveis de módulos permitidos (tabela access_levels)</li>
          <li><strong>Sub-permissões:</strong> Cada módulo tem sub-chaves granulares (ex: finance.view, finance.create, finance.delete)</li>
          <li><strong>Plano de assinatura:</strong> Módulos premium bloqueados por tier (Free → Pro → Business)</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'plans',
    title: 'Planos e Assinatura',
    icon: <Zap className="w-4 h-4" />,
    category: 'overview',
    content: (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: 'Free', price: 'R$ 0', features: ['Dashboard', 'Agenda', 'Checklists (limitado)', 'Estoque básico', 'Ranking'] },
            { name: 'Pro', price: 'R$ 97/mês', highlight: true, features: ['Financeiro completo', 'Estoque inteligente', 'Gestão de equipe', 'Checklists ilimitados', 'Fichas técnicas', 'Gamificação e ranking', 'Fechamento de caixa', 'Finanças pessoais', 'Até 15 usuários'] },
            { name: 'Business', price: 'R$ 197/mês', features: ['Tudo do Pro', 'IA Copiloto', 'WhatsApp Bot', 'Marketing', 'Pedidos online (tablet)', 'Cardápio digital', 'Usuários ilimitados', 'Suporte prioritário'] },
          ].map(p => (
            <div key={p.name} className={`rounded-lg border p-4 ${p.highlight ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}>
              <p className="font-bold text-foreground">{p.name}</p>
              <p className="text-xl font-bold text-primary mt-1">{p.price}</p>
              <Separator className="my-3" />
              <ul className="text-xs text-muted-foreground space-y-1">
                {p.features.map(f => <li key={f}>✓ {f}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </div>
    ),
  },

  // ═══════ MÓDULOS ═══════
  {
    id: 'mod-dashboard',
    title: 'Dashboard',
    icon: <LayoutDashboard className="w-4 h-4" />,
    category: 'modules',
    content: (
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>Painel principal com widgets customizáveis via drag-and-drop. Cada usuário configura seu layout.</p>
        <h4 className="font-semibold text-foreground">Widgets disponíveis:</h4>
        <ul className="list-disc list-inside space-y-1">
          <li>Saldo financeiro (glass card holográfico)</li>
          <li>Contas a vencer</li>
          <li>Progresso de checklists do dia</li>
          <li>Ranking do mês</li>
          <li>Gráfico de evolução de receitas/despesas</li>
          <li>Calendário de compromissos</li>
          <li>Estoque em alerta</li>
          <li>Resumo de equipe e desempenho</li>
        </ul>
        <p><strong>Persistência:</strong> Layout salvo na tabela <code className="bg-muted px-1 rounded">dashboard_layouts</code>.</p>
      </div>
    ),
  },
  {
    id: 'mod-agenda',
    title: 'Agenda',
    icon: <CalendarDays className="w-4 h-4" />,
    category: 'modules',
    content: (
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>Gerenciamento de tarefas e compromissos do restaurante com visualização em calendário.</p>
        <h4 className="font-semibold text-foreground">Funcionalidades:</h4>
        <ul className="list-disc list-inside space-y-1">
          <li>Criar/editar/excluir tarefas e compromissos</li>
          <li>Visualização por dia, semana ou mês</li>
          <li>Filtro por tipo e status</li>
          <li>Acessível a todos os níveis de usuário</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'mod-finance',
    title: 'Financeiro',
    icon: <DollarSign className="w-4 h-4" />,
    category: 'modules',
    content: (
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>Módulo completo de gestão financeira com DRE, fluxo de caixa e controle de contas. <Badge variant="outline" className="text-[10px]">Plano Pro</Badge></p>
        <h4 className="font-semibold text-foreground">Funcionalidades:</h4>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>Transações:</strong> Receitas, despesas, transferências e cartão de crédito</li>
          <li><strong>Categorização por IA:</strong> Motor Gemini com mapeamento automático (confiança ≥ 0.6)</li>
          <li><strong>Lançamento via OCR:</strong> Escaneamento de notas e recibos com extração automática</li>
          <li><strong>Contas bancárias:</strong> Saldos atualizados por triggers PostgreSQL</li>
          <li><strong>Cartões de crédito:</strong> Controle de faturas e lançamentos</li>
          <li><strong>DRE:</strong> Demonstrativo de resultados mensal</li>
          <li><strong>Planejamento:</strong> Orçamentos por categoria com barras visuais (verde=pago, âmbar=provisionado)</li>
          <li><strong>Backup:</strong> Exportação de snapshots financeiros</li>
          <li><strong>Recorrências:</strong> Lançamentos fixos e parcelados</li>
        </ul>
        <h4 className="font-semibold text-foreground mt-3">Sub-permissões:</h4>
        <div className="flex flex-wrap gap-1">
          {['finance.view', 'finance.create', 'finance.delete', 'finance.accounts', 'finance.categories', 'finance.reports', 'finance.planning', 'finance.credit_cards', 'finance.backup'].map(p => (
            <Badge key={p} variant="secondary" className="text-[10px]">{p}</Badge>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'mod-inventory',
    title: 'Estoque',
    icon: <Package className="w-4 h-4" />,
    category: 'modules',
    content: (
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>Controle inteligente de inventário com alertas automáticos e recebimento por câmera.</p>
        <h4 className="font-semibold text-foreground">Funcionalidades:</h4>
        <ul className="list-disc list-inside space-y-1">
          <li>Cadastro de itens com categoria, fornecedor e unidades de medida</li>
          <li>Entradas e saídas com atualização automática de saldo (trigger SQL)</li>
          <li>Alerta de estoque mínimo e zerado (notificações automáticas para admins)</li>
          <li>Histórico de preços por fornecedor</li>
          <li>Recebimento inteligente via OCR (escaneamento de nota fiscal)</li>
          <li>Notas fiscais vinculadas a pedidos</li>
          <li>Previsão de consumo e lista de compras inteligente</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'mod-checklists',
    title: 'Checklists',
    icon: <ClipboardCheck className="w-4 h-4" />,
    category: 'modules',
    content: (
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>Sistema gamificado de tarefas operacionais (abertura/fechamento) com pontuação e ranking.</p>
        <h4 className="font-semibold text-foreground">Estrutura hierárquica:</h4>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>Setores:</strong> Cozinha, Salão, Estoque, Caixa, Fachada (customizáveis)</li>
          <li><strong>Subcategorias:</strong> Equipamentos, Higiene, Ambiente, etc.</li>
          <li><strong>Itens:</strong> Tarefas individuais com pontuação, frequência e exigência de foto</li>
        </ul>
        <h4 className="font-semibold text-foreground mt-3">Recursos especiais:</h4>
        <ul className="list-disc list-inside space-y-1">
          <li>Timer por tarefa com bonificação por velocidade</li>
          <li>Contestação de conclusões por administradores</li>
          <li>Deadlines configuráveis (horário limite para conclusão)</li>
          <li>Pontos que alimentam o ranking e loja de recompensas</li>
          <li>Checklist bônus para tarefas avulsas</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'mod-cash-closing',
    title: 'Fechamento de Caixa',
    icon: <Receipt className="w-4 h-4" />,
    category: 'modules',
    content: (
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>Registro diário de vendas por método de pagamento com validação administrativa. <Badge variant="outline" className="text-[10px]">Plano Pro</Badge></p>
        <h4 className="font-semibold text-foreground">Fluxo:</h4>
        <ol className="list-decimal list-inside space-y-1">
          <li>Operador registra valores: dinheiro, débito, crédito, Pix, vale refeição, delivery</li>
          <li>Sistema calcula diferença de caixa (troco inicial vs. dinheiro registrado)</li>
          <li>Admin valida o fechamento</li>
          <li>Integração automática com módulo financeiro (cria transações de receita)</li>
        </ol>
        <h4 className="font-semibold text-foreground mt-3">Métodos de pagamento configuráveis:</h4>
        <p>Cada método tem configuração de: taxa (%), prazo de liquidação, dias úteis/fixos e criação automática de transação financeira.</p>
      </div>
    ),
  },
  {
    id: 'mod-recipes',
    title: 'Fichas Técnicas',
    icon: <ChefHat className="w-4 h-4" />,
    category: 'modules',
    content: (
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>Gestão de receitas com precificação automática baseada nos custos do estoque. <Badge variant="outline" className="text-[10px]">Plano Pro</Badge></p>
        <h4 className="font-semibold text-foreground">Funcionalidades:</h4>
        <ul className="list-disc list-inside space-y-1">
          <li>Ingredientes vinculados ao estoque (atualização automática de custos via trigger)</li>
          <li>Conversão automática de unidades (kg↔g, litro↔ml)</li>
          <li>Cálculo de custo por porção e preço sugerido de venda</li>
          <li>Taxas adicionais configuráveis (embalagem, gás, etc.)</li>
          <li>Categorias de custo fixo rateadas por receita</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'mod-employees',
    title: 'Funcionários',
    icon: <Users className="w-4 h-4" />,
    category: 'modules',
    content: (
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>Gestão completa da equipe com folha de pagamento e registro de ponto. <Badge variant="outline" className="text-[10px]">Plano Pro</Badge></p>
        <h4 className="font-semibold text-foreground">Funcionalidades:</h4>
        <ul className="list-disc list-inside space-y-1">
          <li>Cadastro com salário, turno, departamento e CPF</li>
          <li>Holerites detalhados: base, adicionais, deduções (INSS, IRRF, FGTS)</li>
          <li>Escala de trabalho semanal e folgas</li>
          <li>Registro de ponto (importação CSV)</li>
          <li>Advertências e atestados médicos</li>
          <li>Desempenho baseado em pontos de checklist</li>
          <li>Pontos bônus manuais e medalhas</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'mod-rewards',
    title: 'Recompensas',
    icon: <Gift className="w-4 h-4" />,
    category: 'modules',
    content: (
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>Loja de recompensas onde funcionários trocam pontos por prêmios. <Badge variant="outline" className="text-[10px]">Plano Pro</Badge></p>
        <h4 className="font-semibold text-foreground">Fluxo:</h4>
        <ol className="list-decimal list-inside space-y-1">
          <li>Admin cadastra produtos com custo em pontos e estoque</li>
          <li>Funcionário solicita resgate com seus pontos acumulados</li>
          <li>Admin aprova/rejeita o resgate</li>
          <li>Pontos são debitados do saldo do funcionário</li>
        </ol>
      </div>
    ),
  },
  {
    id: 'mod-ranking',
    title: 'Ranking',
    icon: <Trophy className="w-4 h-4" />,
    category: 'modules',
    content: (
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>Leaderboard mensal baseado nos pontos de checklist + bônus, acessível a todos os usuários.</p>
        <h4 className="font-semibold text-foreground">Cálculo (função SQL otimizada):</h4>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>Pontos ganhos:</strong> Soma de points_awarded nos checklists do mês</li>
          <li><strong>Pontos bônus:</strong> Adicionados manualmente por admins</li>
          <li><strong>Pontos gastos:</strong> Resgates aprovados/entregues na loja</li>
          <li><strong>Saldo:</strong> Ganhos + Bônus - Gastos (all-time)</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'mod-orders',
    title: 'Pedidos de Compra',
    icon: <ShoppingCart className="w-4 h-4" />,
    category: 'modules',
    content: (
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>Gestão de pedidos a fornecedores com cotações e recebimento.</p>
        <h4 className="font-semibold text-foreground">Funcionalidades:</h4>
        <ul className="list-disc list-inside space-y-1">
          <li>Criação de pedidos por fornecedor com itens do estoque</li>
          <li>Envio de pedido (status: rascunho → enviado → recebido)</li>
          <li>Sugestão automática de itens baseada em estoque mínimo</li>
          <li>Cotações públicas com link compartilhável</li>
          <li>Recebimento com entrada automática no estoque</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'mod-deliveries',
    title: 'Entregas',
    icon: <Truck className="w-4 h-4" />,
    category: 'modules',
    content: (
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>Controle de entregas próprias com rastreamento e comprovante fotográfico.</p>
        <h4 className="font-semibold text-foreground">Funcionalidades:</h4>
        <ul className="list-disc list-inside space-y-1">
          <li>Cadastro de endereços com geolocalização</li>
          <li>Status: pendente → em trânsito → entregue</li>
          <li>Foto de comprovante de entrega</li>
          <li>Atribuição a entregadores</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'mod-customers',
    title: 'Clientes (CRM)',
    icon: <UserSearch className="w-4 h-4" />,
    category: 'modules',
    content: (
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>CRM completo com segmentação, pontuação RFM e campanhas.</p>
        <h4 className="font-semibold text-foreground">Funcionalidades:</h4>
        <ul className="list-disc list-inside space-y-1">
          <li>Cadastro com tags, segmentos e notas</li>
          <li>Score RFM automático (Recência, Frequência, Monetário)</li>
          <li>Pontos de fidelidade baseados em regras configuráveis</li>
          <li>Importação em massa via CSV</li>
          <li>Campanhas de WhatsApp (módulo Business)</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'mod-personal-finance',
    title: 'Finanças Pessoais',
    icon: <Wallet className="w-4 h-4" />,
    category: 'modules',
    content: (
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>Módulo separado para controle das finanças pessoais do proprietário, isolado do financeiro da empresa. <Badge variant="outline" className="text-[10px]">Plano Pro</Badge></p>
        <p>Usa a mesma engine do financeiro empresarial (<code className="bg-muted px-1 rounded text-xs">useFinanceCore</code>) com <code className="bg-muted px-1 rounded text-xs">unitId: null</code> para isolamento.</p>
      </div>
    ),
  },
  {
    id: 'mod-copilot',
    title: 'Copilot IA',
    icon: <Sparkles className="w-4 h-4" />,
    category: 'modules',
    content: (
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>Assistente inteligente com acesso ao contexto operacional do restaurante. <Badge variant="outline" className="text-[10px]">Plano Business</Badge> <Badge variant="outline" className="text-[10px] bg-orange-500/10 text-orange-500 border-orange-500/30">Beta</Badge></p>
        <h4 className="font-semibold text-foreground">Capacidades:</h4>
        <ul className="list-disc list-inside space-y-1">
          <li>Respostas contextuais baseadas nos dados da unidade (financeiro, estoque, equipe)</li>
          <li>Análise de imagens (fotos de pratos, relatórios)</li>
          <li>Conversas persistentes com histórico</li>
          <li>Preferências salvas por usuário</li>
        </ul>
        <p><strong>Edge Function:</strong> <code className="bg-muted px-1 rounded text-xs">management-ai</code> com filtro estrito de unit_id.</p>
      </div>
    ),
  },
  {
    id: 'mod-marketing',
    title: 'Marketing',
    icon: <Megaphone className="w-4 h-4" />,
    category: 'modules',
    content: (
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>Calendário de posts e geração de conteúdo por IA. <Badge variant="outline" className="text-[10px]">Plano Business</Badge> <Badge variant="outline" className="text-[10px] bg-orange-500/10 text-orange-500 border-orange-500/30">Beta</Badge></p>
        <h4 className="font-semibold text-foreground">Funcionalidades:</h4>
        <ul className="list-disc list-inside space-y-1">
          <li>Calendário editorial de posts</li>
          <li>Sugestões de conteúdo por IA baseadas no Brand Core</li>
          <li>Brand Core: identidade visual, tom de voz, frases institucionais, referências</li>
          <li>Banco de assets visuais</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'mod-menu',
    title: 'Cardápio Digital',
    icon: <BookOpenCheck className="w-4 h-4" />,
    category: 'modules',
    content: (
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>Cardápio digital com QR Code, pedidos via tablet e gamificação. <Badge variant="outline" className="text-[10px]">Plano Business</Badge> <Badge variant="outline" className="text-[10px] bg-orange-500/10 text-orange-500 border-orange-500/30">Beta</Badge></p>
        <h4 className="font-semibold text-foreground">Funcionalidades:</h4>
        <ul className="list-disc list-inside space-y-1">
          <li>Produtos com opcionais, variações e fotos</li>
          <li>Categorias organizáveis</li>
          <li>QR Code por mesa</li>
          <li>Pedidos em tempo real (tablet)</li>
          <li>Integração PDV (Colibri)</li>
          <li>Roleta de gamificação para clientes</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'mod-whatsapp',
    title: 'WhatsApp Bot',
    icon: <MessageCircle className="w-4 h-4" />,
    category: 'modules',
    content: (
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>Bot de atendimento e pedidos via WhatsApp. <Badge variant="outline" className="text-[10px]">Plano Business</Badge> <Badge variant="outline" className="text-[10px] bg-orange-500/10 text-orange-500 border-orange-500/30">Beta</Badge></p>
        <h4 className="font-semibold text-foreground">Funcionalidades:</h4>
        <ul className="list-disc list-inside space-y-1">
          <li>Conversas automatizadas com IA</li>
          <li>Base de conhecimento customizável</li>
          <li>Pedidos via WhatsApp</li>
          <li>Recuperação de carrinhos abandonados</li>
          <li>Envio de campanhas em massa</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'mod-settings',
    title: 'Configurações',
    icon: <Settings className="w-4 h-4" />,
    category: 'modules',
    content: (
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>Central de configuração da unidade e da equipe.</p>
        <h4 className="font-semibold text-foreground">Seções:</h4>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>Equipe e convites:</strong> Gerenciar membros e enviar convites por e-mail</li>
          <li><strong>Níveis de acesso:</strong> Criar perfis de permissão com módulos e sub-permissões</li>
          <li><strong>Categorias de estoque:</strong> Personalizar categorias de itens</li>
          <li><strong>Fornecedores:</strong> Cadastro e contatos</li>
          <li><strong>Métodos de pagamento:</strong> Taxas, prazos e integração com fechamento</li>
          <li><strong>Custos de produção:</strong> Taxas de embalagem, gás, custos fixos para fichas técnicas</li>
          <li><strong>Recompensas:</strong> Configurar loja de pontos</li>
          <li><strong>Medalhas:</strong> Criar medalhas para a equipe</li>
          <li><strong>Notificações:</strong> Push notifications (PWA + Capacitor)</li>
          <li><strong>Perfil da loja:</strong> Nome, logo e dados da unidade</li>
          <li><strong>Log de auditoria:</strong> Histórico de todas as ações do sistema</li>
          <li><strong>Gestão de checklists:</strong> Setores, subcategorias, itens e deadlines</li>
        </ul>
      </div>
    ),
  },

  // ═══════ TÉCNICO ═══════
  {
    id: 'tech-database',
    title: 'Banco de Dados',
    icon: <Database className="w-4 h-4" />,
    category: 'technical',
    content: (
      <div className="space-y-3 text-sm text-muted-foreground">
        <h4 className="font-semibold text-foreground">Tabelas principais (40+):</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
          {[
            'units', 'user_units', 'profiles', 'access_levels', 'invites',
            'finance_transactions', 'finance_accounts', 'finance_categories', 'finance_budgets', 'finance_tags', 'finance_snapshots',
            'credit_card_invoices',
            'inventory_items', 'stock_movements', 'categories', 'suppliers',
            'checklist_sectors', 'checklist_subcategories', 'checklist_items', 'checklist_completions', 'checklist_task_times',
            'checklist_deadline_settings', 'checklist_timer_settings',
            'cash_closings', 'payment_method_settings',
            'recipes', 'recipe_ingredients', 'recipe_cost_settings',
            'employees', 'employee_payments', 'employee_schedules', 'employee_warnings',
            'reward_products', 'reward_redemptions', 'bonus_points',
            'orders', 'order_items', 'quotations',
            'customers', 'customer_campaigns', 'loyalty_rules',
            'deliveries', 'delivery_addresses',
            'notifications', 'audit_logs',
            'copilot_conversations', 'copilot_messages',
            'chat_conversations', 'chat_messages', 'chat_participants',
            'brand_identity', 'brand_assets', 'brand_references',
            'dashboard_layouts',
          ].map(t => (
            <code key={t} className="bg-muted px-1.5 py-0.5 rounded text-[10px]">{t}</code>
          ))}
        </div>

        <h4 className="font-semibold text-foreground mt-4">Triggers e funções SECURITY DEFINER:</h4>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li><code className="bg-muted px-1 rounded">update_stock_on_movement</code> — Atualiza saldo ao registrar entrada/saída</li>
          <li><code className="bg-muted px-1 rounded">update_account_balance_on_transaction</code> — Atualiza saldo bancário em INSERT/UPDATE/DELETE</li>
          <li><code className="bg-muted px-1 rounded">sync_recipe_costs_on_item_price_change</code> — Recalcula fichas técnicas ao mudar preço</li>
          <li><code className="bg-muted px-1 rounded">notify_stock_zero</code> — Notifica admins quando estoque zera</li>
          <li><code className="bg-muted px-1 rounded">record_price_change</code> — Histórico de preços de fornecedores</li>
          <li><code className="bg-muted px-1 rounded">auto_provision_unit</code> — Setup automático de nova loja com dados iniciais</li>
          <li><code className="bg-muted px-1 rounded">audit_*</code> — Família de triggers de auditoria em todas as entidades</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'tech-security',
    title: 'Segurança (RLS)',
    icon: <Shield className="w-4 h-4" />,
    category: 'technical',
    content: (
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>Row Level Security (RLS) ativo em todas as tabelas. Funções <code className="bg-muted px-1 rounded text-xs">SECURITY DEFINER</code> evitam recursão infinita.</p>
        <h4 className="font-semibold text-foreground">Funções de verificação:</h4>
        <ul className="list-disc list-inside space-y-1">
          <li><code className="bg-muted px-1 rounded text-xs">user_has_unit_access(user_id, unit_id)</code> — Verifica se o usuário pertence à unidade</li>
          <li><code className="bg-muted px-1 rounded text-xs">has_role(user_id, role)</code> — Verifica role global (super_admin)</li>
          <li><code className="bg-muted px-1 rounded text-xs">get_user_unit_ids(user_id)</code> — Retorna todas as unidades do usuário</li>
          <li><code className="bg-muted px-1 rounded text-xs">get_unit_plan(unit_id)</code> — Retorna plano da unidade via owner</li>
        </ul>
        <h4 className="font-semibold text-foreground mt-3">Padrão de políticas:</h4>
        <pre className="bg-muted p-3 rounded text-[11px] overflow-x-auto">
{`-- Exemplo: Isolamento por unidade
CREATE POLICY "Users can view own unit data"
ON public.some_table FOR SELECT TO authenticated
USING (unit_id IN (SELECT get_user_unit_ids(auth.uid())));`}
        </pre>
      </div>
    ),
  },
  {
    id: 'tech-edge-functions',
    title: 'Edge Functions',
    icon: <Server className="w-4 h-4" />,
    category: 'technical',
    content: (
      <div className="space-y-3 text-sm text-muted-foreground">
        <h4 className="font-semibold text-foreground">30 funções serverless (Deno):</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {[
            { name: 'management-ai', desc: 'Copilot IA com contexto da unidade' },
            { name: 'finance-categorize', desc: 'Categorização de transações por Gemini' },
            { name: 'receipt-ocr', desc: 'OCR de recibos e notas fiscais' },
            { name: 'smart-receiving-ocr', desc: 'Recebimento inteligente de mercadorias' },
            { name: 'delivery-ocr', desc: 'OCR de comprovantes de entrega' },
            { name: 'document-scanner', desc: 'Escaneamento genérico de documentos' },
            { name: 'push-notifier', desc: 'Envio de push notifications (Web Push)' },
            { name: 'stripe-checkout', desc: 'Checkout de assinatura Stripe' },
            { name: 'stripe-webhook', desc: 'Webhook de eventos Stripe' },
            { name: 'marketing-suggestions', desc: 'Sugestões de posts por IA' },
            { name: 'brand-ai-generate', desc: 'Geração de identidade visual por IA' },
            { name: 'whatsapp-webhook', desc: 'Webhook de mensagens WhatsApp' },
            { name: 'whatsapp-send', desc: 'Envio individual de mensagens' },
            { name: 'whatsapp-bulk-send', desc: 'Campanhas em massa' },
            { name: 'whatsapp-recover-carts', desc: 'Recuperação de carrinhos' },
            { name: 'import-customers-csv', desc: 'Importação de clientes via CSV' },
            { name: 'import-daily-sales', desc: 'Importação de vendas diárias' },
            { name: 'import-time-records', desc: 'Importação de registros de ponto' },
            { name: 'ai-insights', desc: 'Insights financeiros por IA' },
            { name: 'bill-reminders', desc: 'Lembretes de contas a vencer' },
            { name: 'daily-digest', desc: 'Resumo diário operacional' },
            { name: 'system-backup', desc: 'Backup de dados do sistema' },
            { name: 'admin-manage-user', desc: 'Gerenciamento de usuários (admin)' },
            { name: 'admin-reset-password', desc: 'Reset de senha administrativa' },
            { name: 'tablet-order', desc: 'Processamento de pedidos do tablet' },
            { name: 'quotation-public', desc: 'Cotação pública para fornecedores' },
            { name: 'customer-portal', desc: 'Portal do cliente' },
            { name: 'copilot-context', desc: 'Contexto para o Copilot IA' },
            { name: 'colibri-health', desc: 'Health check integração PDV' },
            { name: 'check-subscription', desc: 'Verificação de assinatura' },
          ].map(f => (
            <div key={f.name} className="flex items-start gap-2 text-xs">
              <code className="bg-muted px-1.5 py-0.5 rounded shrink-0">{f.name}</code>
              <span>{f.desc}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'tech-hooks',
    title: 'Hooks Principais',
    icon: <Code className="w-4 h-4" />,
    category: 'technical',
    content: (
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>Arquitetura baseada em custom hooks modulares com TanStack Query para cache e sincronização.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
          {[
            { hook: 'useFinanceCore', desc: 'Engine compartilhada entre financeiro pessoal e empresarial' },
            { hook: 'useChecklists', desc: 'CRUD e completação de checklists com timers' },
            { hook: 'useInventoryDB', desc: 'Gestão de estoque com movimentações' },
            { hook: 'useEmployees', desc: 'CRUD de funcionários e pagamentos' },
            { hook: 'useCashClosing', desc: 'Fechamento de caixa e validação' },
            { hook: 'useLeaderboard', desc: 'Ranking com função SQL otimizada' },
            { hook: 'useRecipes', desc: 'Fichas técnicas com ingredientes' },
            { hook: 'useOrders', desc: 'Pedidos a fornecedores' },
            { hook: 'useCustomers', desc: 'CRM e fidelidade' },
            { hook: 'useAccessLevels', desc: 'Controle granular de permissões' },
            { hook: 'useManagementAI', desc: 'Integração com Copilot IA' },
            { hook: 'useNotifications', desc: 'Sistema de notificações + push' },
            { hook: 'useDashboardWidgets', desc: 'Layout persistente do dashboard' },
            { hook: 'useMarketing', desc: 'Calendário editorial e posts' },
            { hook: 'useDeliveries', desc: 'Gestão de entregas' },
            { hook: 'useWhatsApp', desc: 'Conversas e bot WhatsApp' },
          ].map(h => (
            <div key={h.hook} className="flex items-start gap-2">
              <code className="bg-muted px-1.5 py-0.5 rounded shrink-0">{h.hook}</code>
              <span>{h.desc}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'tech-onboarding',
    title: 'Onboarding & Provisioning',
    icon: <Globe className="w-4 h-4" />,
    category: 'technical',
    content: (
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>Ao criar conta, a função SQL <code className="bg-muted px-1 rounded text-xs">auto_provision_unit</code> provisiona automaticamente:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Unidade com slug único (collision-safe)</li>
          <li>2 contas financeiras (Carteira e Banco)</li>
          <li>Categorias financeiras completas (receitas + despesas com subcategorias)</li>
          <li>5 setores de checklist com subcategorias e ~40 itens pré-configurados</li>
          <li>7 métodos de pagamento com taxas padrão</li>
          <li>2 níveis de acesso: "Acesso Completo" (owner) e "Funcionário" (padrão)</li>
        </ul>
        <p className="mt-2"><strong>Convites:</strong> Novos membros são convidados por e-mail com link tokenizado (tabela <code className="bg-muted px-1 rounded text-xs">invites</code>). Ao aceitar, são vinculados à unidade com o nível de acesso "Funcionário".</p>
      </div>
    ),
  },
  {
    id: 'tech-auth',
    title: 'Autenticação',
    icon: <Lock className="w-4 h-4" />,
    category: 'technical',
    content: (
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>Autenticação via Supabase Auth com e-mail + senha. Sem sign-ups anônimos.</p>
        <h4 className="font-semibold text-foreground">Fluxo:</h4>
        <ol className="list-decimal list-inside space-y-1">
          <li>Usuário se cadastra com e-mail e senha</li>
          <li>Confirmação de e-mail (obrigatória)</li>
          <li>Ao fazer login, <code className="bg-muted px-1 rounded text-xs">AuthContext</code> carrega perfil, unidades e papéis</li>
          <li><code className="bg-muted px-1 rounded text-xs">UnitContext</code> seleciona unidade ativa e carrega access_level</li>
          <li><code className="bg-muted px-1 rounded text-xs">ProtectedRoute</code> valida acesso ao módulo + plano de assinatura</li>
        </ol>
        <h4 className="font-semibold text-foreground mt-3">Hierarquia de acesso:</h4>
        <pre className="bg-muted p-3 rounded text-[11px]">
{`super_admin → vê tudo (cross-unit)
owner       → admin total da unidade
admin       → acesso configurável por access_level  
member      → acesso operacional por access_level`}
        </pre>
      </div>
    ),
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  overview: '📋 Visão Geral',
  modules: '📦 Módulos',
  technical: '⚙️ Técnico',
};

export default function Documentation() {
  const [activeSection, setActiveSection] = useState('intro');
  const [search, setSearch] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const filteredSections = search
    ? SECTIONS.filter(s => s.title.toLowerCase().includes(search.toLowerCase()))
    : SECTIONS;

  const grouped = Object.entries(CATEGORY_LABELS).map(([cat, label]) => ({
    label,
    sections: filteredSections.filter(s => s.category === cat),
  })).filter(g => g.sections.length > 0);

  const currentSection = SECTIONS.find(s => s.id === activeSection);

  const [showAll, setShowAll] = useState(false);

  const handleExport = () => {
    setShowAll(true);
    setTimeout(() => {
      window.print();
      setTimeout(() => setShowAll(false), 500);
    }, 300);
  };

  const handleSelect = (id: string) => {
    setActiveSection(id);
    setSidebarOpen(false);
    setShowAll(false);
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="h-screen flex flex-col bg-background print:bg-white print:text-black">
      {/* Print styles */}
      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          * { color-adjust: exact; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-hide { display: none !important; }
          .print-section { break-inside: avoid; page-break-inside: avoid; margin-bottom: 24px; }
          code { background: #f3f4f6 !important; color: #1f2937 !important; }
          .border { border-color: #e5e7eb !important; }
          .bg-card, .bg-muted { background: #f9fafb !important; }
        }
      `}</style>

      {/* Header */}
      <header className="border-b border-border bg-card px-4 py-3 flex items-center justify-between shrink-0 print-hide">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-foreground">Documentação Atlas</h1>
            <p className="text-xs text-muted-foreground">Guia completo do sistema</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={showAll ? "default" : "outline"}
            size="sm"
            onClick={() => { setShowAll(!showAll); contentRef.current?.scrollTo({ top: 0 }); }}
            className="gap-2"
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">{showAll ? 'Navegação' : 'Ver tudo'}</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar PDF</span>
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {!showAll && (
          <aside className={`
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            md:translate-x-0
            fixed md:relative z-30
            w-72 h-[calc(100vh-57px)] md:h-auto
            bg-card border-r border-border
            transition-transform duration-200
            print-hide
          `}>
            <div className="p-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar seção..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>
            </div>
            <ScrollArea className="h-[calc(100%-60px)]">
              <nav className="px-2 pb-4">
                {grouped.map(group => (
                  <div key={group.label} className="mb-4">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1">{group.label}</p>
                    {group.sections.map(section => (
                      <button
                        key={section.id}
                        onClick={() => handleSelect(section.id)}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors text-left ${
                          activeSection === section.id
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        {section.icon}
                        <span className="truncate">{section.title}</span>
                      </button>
                    ))}
                  </div>
                ))}
              </nav>
            </ScrollArea>
          </aside>
        )}

        {/* Overlay for mobile sidebar */}
        {sidebarOpen && !showAll && (
          <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Content */}
        <main ref={contentRef} className="flex-1 overflow-y-auto">
          {showAll ? (
            /* Full document view - all sections */
            <div className="max-w-3xl mx-auto px-4 md:px-8 py-6 md:py-10">
              <div className="text-center mb-10 print-section">
                <h1 className="text-3xl font-bold text-foreground mb-2">📋 Documentação Atlas</h1>
                <p className="text-muted-foreground">Guia completo do sistema de gestão para restaurantes</p>
                <Separator className="mt-6" />
              </div>
              {Object.entries(CATEGORY_LABELS).map(([cat, label]) => {
                const catSections = SECTIONS.filter(s => s.category === cat);
                if (catSections.length === 0) return null;
                return (
                  <div key={cat} className="mb-8">
                    <h2 className="text-xl font-bold text-foreground mb-4 border-b border-border pb-2">{label}</h2>
                    {catSections.map(section => (
                      <div key={section.id} className="mb-8 print-section">
                        <h3 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4">
                          {section.icon}
                          {section.title}
                        </h3>
                        {section.content}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ) : (
            /* Single section view */
            currentSection && (
              <div className="max-w-3xl mx-auto px-4 md:px-8 py-6 md:py-10">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                  <span>{CATEGORY_LABELS[currentSection.category]}</span>
                  <ChevronRight className="w-3 h-3" />
                  <span className="text-foreground">{currentSection.title}</span>
                </div>
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-3 mb-6">
                  {currentSection.icon}
                  {currentSection.title}
                </h2>
                {currentSection.content}

                {/* Navigation */}
                <div className="flex justify-between mt-10 pt-6 border-t border-border">
                  {(() => {
                    const idx = SECTIONS.findIndex(s => s.id === activeSection);
                    const prev = idx > 0 ? SECTIONS[idx - 1] : null;
                    const next = idx < SECTIONS.length - 1 ? SECTIONS[idx + 1] : null;
                    return (
                      <>
                        {prev ? (
                          <Button variant="ghost" size="sm" onClick={() => handleSelect(prev.id)} className="gap-2">
                            <ArrowLeft className="w-4 h-4" />
                            {prev.title}
                          </Button>
                        ) : <div />}
                        {next && (
                          <Button variant="ghost" size="sm" onClick={() => handleSelect(next.id)} className="gap-2">
                            {next.title}
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            )
          )}
        </main>
      </div>
    </div>
  );
}