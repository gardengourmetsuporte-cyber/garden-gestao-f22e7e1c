
# Atualizar Layout Completo do Sistema - Icones Filled + Visual Profissional

## Visao Geral
Migrar todo o sistema de icones outlined (Lucide) para icones filled (Material Icons Round) e refinar o visual geral para um estilo mais profissional e coeso, garantindo consistencia em todas as 123+ telas e componentes.

## Estrategia de Implementacao

A chave para nao deixar "coisa mal feita" e criar uma **camada de abstracao centralizada** que substitui os icones em todo o sistema de uma vez, sem precisar editar manualmente cada um dos 123 arquivos.

### Fase 1: Infraestrutura de Icones (Base)

**1.1 Adicionar Google Fonts Material Icons Round**
- Adicionar `<link>` no `index.html` para carregar a fonte

**1.2 Criar componente `MaterialIcon`** (`src/components/ui/material-icon.tsx`)
- Componente wrapper que renderiza `<span class="material-icons-round">`
- Aceita `name`, `size`, `className`, `style`
- Herda `currentColor` para funcionar com o sistema de cores existente

**1.3 Criar mapa de icones centralizado** (`src/lib/iconMap.ts`)
- Mapeamento completo de TODOS os nomes Lucide usados no sistema para Material Icons
- Inclui os ~80+ icones distintos encontrados no codebase
- Mapeamento completo:

```text
LayoutDashboard  -> dashboard
Package          -> inventory_2
ClipboardCheck   -> assignment_turned_in
Settings         -> settings
LogOut           -> logout
Menu             -> menu
X                -> close
User             -> person
Shield           -> shield
Gift             -> card_giftcard
CalendarDays     -> calendar_today
DollarSign       -> payments
Receipt          -> point_of_sale
ChefHat          -> restaurant
Users            -> group
Bell             -> notifications
ChevronRight     -> chevron_right
ChevronDown      -> expand_more
ChevronUp        -> expand_less
Building2        -> apartment
MessageCircle    -> chat_bubble
Monitor          -> monitor
MessageSquare    -> forum
BookOpen         -> menu_book
ShoppingCart     -> shopping_cart
Megaphone        -> campaign
Home             -> home
FileText         -> description
Plus             -> add
PieChart         -> pie_chart
MoreHorizontal   -> more_horiz
ArrowUpCircle    -> arrow_upward
ArrowDownCircle  -> arrow_downward
ArrowLeftRight   -> swap_horiz
ArrowLeft        -> arrow_back
ArrowRight       -> arrow_forward
ArrowUpRight     -> north_east
CreditCard       -> credit_card
Wallet           -> account_balance_wallet
Landmark         -> account_balance
AlertTriangle    -> warning
AlertCircle      -> error
Check            -> check
Loader2          -> (manter Lucide - animacao)
Search           -> search
Pencil           -> edit
Trash2           -> delete
Star             -> grade
Trophy           -> emoji_events
Medal            -> military_tech
Eye              -> visibility
EyeOff           -> visibility_off
Mail             -> mail
Lock             -> lock
Sparkles         -> auto_awesome
Camera           -> photo_camera
TrendingUp       -> trending_up
TrendingDown     -> trending_down
Coins            -> toll
Clock            -> schedule
Send             -> send
QrCode           -> qr_code_2
RefreshCw        -> refresh
ExternalLink     -> open_in_new
Sun              -> light_mode
Moon             -> dark_mode
Calendar         -> event
Folder           -> folder
CheckCircle2     -> check_circle
History          -> history
ClipboardList    -> checklist
PackageX         -> inventory
PackageCheck     -> fact_check
Lightbulb        -> lightbulb
LayoutList       -> view_list
LayoutGrid       -> grid_view
Settings2        -> tune
Phone            -> phone
StickyNote       -> sticky_note_2
Minus            -> remove
Archive          -> archive
Link2            -> link
MoreVertical     -> more_vert
Utensils         -> restaurant_menu
Brain            -> psychology
Soup             -> ramen_dining
XCircle          -> cancel
PartyPopper      -> celebration
Info             -> info
Download         -> download
Upload           -> upload
Copy             -> content_copy
Filter           -> filter_list
Sort             -> sort
Percent          -> percent
Hash             -> tag
Globe            -> language
Image            -> image
Save             -> save
```

**1.4 Criar componente `AppIcon`** (`src/components/ui/app-icon.tsx`)
- Componente universal que aceita tanto nome Lucide quanto Material
- Faz a conversao automatica: recebe o nome Lucide, renderiza Material Icon
- Mantém compatibilidade total com o sistema de glow existente (`.icon-glow`)

### Fase 2: Atualizacao dos Componentes Principais

**2.1 AppLayout (Sidebar + Header + FAB)** - O componente mais visivel
- Substituir todos os icones da sidebar por `AppIcon`
- Atualizar o array `navItems` para usar o novo componente
- Atualizar header (Chat, Bell, Menu, X, Building2)
- Atualizar FAB (Menu/X)
- Atualizar botao de Logout

**2.2 FinanceBottomNav** - Barra inferior do Financeiro
- Substituir Home, FileText, PieChart, MoreHorizontal por Material Icons
- FAB central: Plus -> `add`
- Menu radial: ArrowUpCircle, ArrowDownCircle, ArrowLeftRight

**2.3 AdminDashboard** - Tela principal admin
- MetricCards: Wallet, ShoppingCart, ChefHat, AlertTriangle
- PillButtons: todos os icones de acesso rapido
- AlertItems: AlertCircle

**2.4 EmployeeDashboard** - Tela principal funcionario
- Quick Actions: ClipboardCheck, Receipt, Gift
- Links: Package, ArrowRight

**2.5 FinanceHome** - Home do Financeiro
- ArrowUpCircle, ArrowDownCircle, AlertCircle, ChevronRight

**2.6 TransactionItem** - Item de transacao (swipeable)
- Icones de tipo: ArrowUpCircle, ArrowDownCircle, ArrowLeftRight, CreditCard
- Check, Loader2

**2.7 AccountCard** - Card de conta bancaria
- Wallet, Landmark, CreditCard

### Fase 3: Atualizacao de TODAS as Paginas

Cada pagina sera atualizada para usar `AppIcon` no lugar dos imports diretos do Lucide:

- **Agenda.tsx** - ListChecks, Plus, Calendar, CheckCircle2, Folder, Trash2, Pencil, X
- **Auth.tsx** - Mail, Lock, User, Eye, EyeOff, ArrowRight, Sparkles
- **CashClosing.tsx** - Plus, Receipt, CheckCircle2, Send, X
- **Chat.tsx** - Search, ArrowLeft, Plus, Users, Megaphone, Camera
- **Checklists.tsx** - ClipboardCheck, Settings, Sun, Moon, Calendar
- **Employees.tsx** - todos os icones de gestao de funcionarios
- **Finance.tsx** - Loader2
- **Inventory.tsx** - Package, AlertTriangle, PackageX, ArrowRightLeft, Plus, History, ClipboardList
- **Marketing.tsx** - Plus, CalendarDays, LayoutList, Lightbulb
- **MenuAdmin.tsx** - icones de cardapio
- **Orders.tsx** - ShoppingCart, Package, Plus, Trash2, MessageCircle, Clock, PackageCheck, FileText, Sparkles
- **Profile.tsx** - ArrowLeft, Star, TrendingDown, Coins, Trophy
- **Recipes.tsx** - Plus, Search, ChefHat, DollarSign, Archive
- **Rewards.tsx** - Star, Gift
- **Settings.tsx** - todos os icones de configuracao
- **TabletAdmin/Menu/Select/Confirm** - icones de tablets
- **WhatsApp.tsx** - MessageSquare, Settings, ShoppingBag, Brain, BookOpen

### Fase 4: Atualizacao de TODOS os Sub-componentes

Todos os ~60+ componentes em subpastas:
- `src/components/finance/*` (8 arquivos)
- `src/components/inventory/*` (10 arquivos)
- `src/components/dashboard/*` (6 arquivos)
- `src/components/employees/*` (8 arquivos)
- `src/components/settings/*` (10 arquivos)
- `src/components/recipes/*` (4 arquivos)
- `src/components/checklists/*` (3 arquivos)
- `src/components/chat/*` (4 arquivos)
- `src/components/whatsapp/*` (6 arquivos)
- `src/components/menu/*` (6 arquivos)
- `src/components/marketing/*` (5 arquivos)
- `src/components/rewards/*` (3 arquivos)
- `src/components/profile/*` (3 arquivos)
- `src/components/notifications/*` (2 arquivos)
- `src/components/agenda/*` (4 arquivos)
- `src/components/schedule/*` (1 arquivo)
- `src/components/cashClosing/*` (3 arquivos)

### Fase 5: Refinamento Visual (CSS)

**5.1 Ajustar variaveis de cor em `index.css`**
- `--background`: `222 70% 4%` (mais profundo, como referencia `#050b15`)
- `--card`: `222 45% 9%` (mais definido `#0d1624`)
- `--border`: `215 28% 17%` (mais sutil `#1e293b`)

**5.2 Ajustar `.icon-glow` para Material Icons**
- Adicionar suporte a `span` alem de `svg` no seletor CSS
- Material Icons usam `<span>` em vez de `<svg>`, entao o `filter: drop-shadow` sera aplicado ao `span`

**5.3 Adicionar CSS para Material Icons**
- Garantir que `.material-icons-round` herde `currentColor`
- Suporte a tamanhos customizados via `font-size`

### Fase 6: Atualizacao do `getLucideIcon` (lib/icons.ts)

- Atualizar para retornar `AppIcon` quando usado em categorias dinamicas (TransactionItem, etc.)
- Manter fallback para Lucide quando nao houver equivalente Material

---

## Detalhes Tecnicos

### Componente AppIcon (exemplo)
```typescript
// src/components/ui/app-icon.tsx
import { cn } from '@/lib/utils';
import { ICON_MAP } from '@/lib/iconMap';

interface AppIconProps {
  name: string; // nome Lucide OU Material
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function AppIcon({ name, size = 24, className, style }: AppIconProps) {
  // Tenta converter de Lucide para Material
  const materialName = ICON_MAP[name] || name;

  return (
    <span
      className={cn("material-icons-round select-none leading-none", className)}
      style={{ fontSize: size, color: 'inherit', ...style }}
    >
      {materialName}
    </span>
  );
}
```

### Ajuste CSS para glow em Material Icons
```css
.icon-glow span.material-icons-round,
.icon-glow svg {
  filter: drop-shadow(0 0 6px currentColor);
  transition: filter 0.2s ease;
}
```

### Ordem de execucao
1. Criar infraestrutura (iconMap, AppIcon, MaterialIcon, CSS) -- nenhuma tela quebra
2. Atualizar AppLayout (sidebar/header) -- impacto visual imediato em todo o app
3. Atualizar dashboards e financeiro -- telas mais usadas
4. Atualizar todas as demais paginas e componentes -- cobertura completa
5. Refinamentos de cor e polimento final

### Garantia de consistencia
- O componente `AppIcon` centraliza toda a logica de icones
- Se um icone Material nao existir no mapa, ele tenta renderizar o nome como Material Icon diretamente
- `Loader2` e icones com animacao CSS especifica permanecem como Lucide (unico caso de excecao)
- O sistema de glow neon existente funciona identicamente com Material Icons gracas ao ajuste CSS
