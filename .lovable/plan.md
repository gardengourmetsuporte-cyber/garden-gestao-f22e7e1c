

## Analise do Sistema Atlas/Garden - Profissionalização

Após uma análise completa do codebase, identifiquei o sistema como uma plataforma SaaS madura para gestão de restaurantes, com ~30 páginas, ~100+ componentes, sistema financeiro robusto, gamificação, multi-tenant e monetização via Stripe. Abaixo, os pontos de melhoria organizados por impacto.

---

### 1. Onboarding e Primeira Experiência (Alto Impacto)

**Problema**: O setup progress (`useSetupProgress`) existe mas não aparece no Dashboard. Usuários novos caem num dashboard vazio sem orientação.

**Plano**:
- Criar widget de **Onboarding Checklist** no `AdminDashboard` que aparece apenas quando `allCompleted === false`
- Card com progress bar, steps clicáveis que navegam para o módulo correto
- Auto-ocultar com animação quando 100% completo
- Persistir dismissal no localStorage para não reaparecer

---

### 2. Tratamento de Estados Vazios (Alto Impacto)

**Problema**: Vários módulos não tratam adequadamente o estado vazio (zero transações, zero itens de estoque, zero checklists). O componente `EmptyState` existe mas não é usado consistentemente.

**Plano**:
- Auditar cada página principal e adicionar `EmptyState` com ação primária (CTA) em: Finance, Inventory, Orders, Recipes, Employees, Marketing
- Ilustrações ou ícones contextuais + texto orientativo

---

### 3. Feedback e Confirmações (Médio Impacto)

**Problema**: Ações destrutivas (deletar transação, remover funcionário, excluir item) usam `window.confirm()` nativo em alguns locais em vez do `AlertDialog` do Radix já disponível no projeto.

**Plano**:
- Substituir todos os `window.confirm()` por `AlertDialog` com design consistente
- Adicionar confirmação de saída em formulários com dados não salvos (dirty state)

---

### 4. Botão de Teste no Dashboard (Alto Impacto - Profissionalismo)

**Problema**: O botão "🔔 Testar lembrete de contas" está visível no Dashboard de produção (`AdminDashboard.tsx` linha 166-179). Isso é claramente uma ferramenta de debug exposta ao usuário final.

**Plano**:
- Remover o botão de teste do dashboard ou movê-lo para Configurações > Debug (visível apenas para super_admin)

---

### 5. Consistência Visual no Dark Mode (Médio Impacto)

**Problema**: Já foram feitas várias correções pontuais (dia do calendário, MonthSelector, MoreDrawer) mas a abordagem é reativa. Ainda podem existir inconsistências em outros componentes.

**Plano**:
- Auditoria visual completa do dark mode em: Checklists date strip, Finance cards, Inventory stats cards, Cash Closing cards
- Criar utility classes reutilizáveis (ex: `card-dark-inverse`) para padronizar o padrão "fundo branco com texto escuro no dark mode" em hero cards

---

### 6. Skeleton Loading Consistente (Médio Impacto)

**Problema**: Algumas páginas usam `PageSkeleton`, outras usam `Skeleton` avulsos, e o `Finance` monta skeletons ad-hoc inline. Não há padrão.

**Plano**:
- Criar variantes de `PageSkeleton` para cada tipo de página (lista, formulário, dashboard)
- Substituir skeletons inline por componentes reutilizáveis

---

### 7. Acessibilidade e SEO (Médio Impacto)

**Problema**: 
- `index.html` provavelmente não tem meta tags de SEO/OG para a landing page
- Botões sem `aria-label` em vários locais (FAB, tab bar icons)
- Falta de `<title>` dinâmico por rota

**Plano**:
- Adicionar meta tags OG na landing (title, description, image)
- Implementar hook `useDocumentTitle` que atualiza `document.title` por rota
- Adicionar `aria-label` nos botões de ícone do BottomTabBar e header

---

### 8. Performance (Baixo Impacto - Já Bom)

O sistema já implementa boas práticas: lazy loading de rotas com retry, `useLazyVisible` para widgets below-fold, `preloadRoute` no hover/touch, `staleTime` de 5min no React Query. Pontos menores:

**Plano**:
- Adicionar `React.memo` nos componentes de lista pesados (TransactionItem, ItemCard, ChecklistItem) se não tiverem
- Considerar virtualização (`react-window`) para listas de transações com 100+ itens

---

### 9. Tratamento de Erros em Edge Functions (Médio Impacto)

**Problema**: O `ErrorBoundary` existe mas é genérico. Erros de Edge Functions (stripe-checkout, management-ai) mostram mensagens técnicas ao usuário.

**Plano**:
- Criar mapeamento de erros conhecidos para mensagens amigáveis em português
- Toast com ação de "Tentar novamente" para erros de rede

---

### 10. PWA e Experiência Offline (Baixo Impacto)

**Problema**: O `vite-plugin-pwa` está instalado e `push-sw.js` existe, mas a experiência offline provavelmente mostra tela em branco.

**Plano**:
- Adicionar página offline fallback no service worker
- Indicador visual de "sem conexão" no header

---

### Prioridade de Implementação

| # | Item | Impacto | Esforço |
|---|------|---------|---------|
| 4 | Remover botão de teste | Alto | Baixo |
| 1 | Onboarding widget | Alto | Médio |
| 2 | Empty states | Alto | Médio |
| 5 | Dark mode audit | Médio | Médio |
| 3 | AlertDialog confirmações | Médio | Baixo |
| 7 | Acessibilidade/SEO | Médio | Médio |
| 6 | Skeleton padronizado | Médio | Baixo |
| 9 | Erros amigáveis | Médio | Baixo |
| 8 | Performance | Baixo | Médio |
| 10 | PWA offline | Baixo | Médio |

