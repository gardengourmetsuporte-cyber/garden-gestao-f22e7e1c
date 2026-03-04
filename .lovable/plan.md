

## Plano: Upgrade visual dos ícones — mais personalidade e modernidade

### Problema atual
Os ícones usam mapeamentos genéricos do Material Symbols (ex: `person` para User, `settings` para Settings, `inventory_2` para Package). Muitos são básicos e sem personalidade.

### Abordagem
Trocar os mapeamentos no `ICON_MAP` para ícones mais expressivos, modernos e com personalidade do Material Symbols, mantendo a mesma infraestrutura (AppIcon + Material Symbols Rounded). Também ajustar o peso padrão e o optical size para dar mais corpo aos ícones.

### Mudanças principais

**1. `src/lib/iconMap.ts` — Remapear ~40 ícones para versões mais expressivas**

Exemplos das trocas mais impactantes:

| Chave | Atual (genérico) | Novo (com personalidade) |
|-------|------------------|--------------------------|
| LayoutDashboard | `space_dashboard` | `dashboard` |
| Home | `home` | `cottage` |
| Settings | `settings` | `manufacturing` |
| Users | `group` | `groups` |
| User | `person` | `face` |
| DollarSign | `account_balance_wallet` | `universal_currency_alt` |
| Wallet | `wallet` | `account_balance_wallet` |
| Package | `inventory_2` | `package_2` |
| Gift | `redeem` | `featured_seasonal_and_gifts` |
| Trophy | `emoji_events` | `trophy` |
| Star | `kid_star` | `grade` |
| Bell | `notifications` | `notifications_unread` |
| Sparkles | `auto_awesome` | `magic_exchange` |
| Brain | `neurology` | `cognition` |
| ChefHat | `soup_kitchen` | `skillet` |
| Receipt | `receipt_long` | `receipt` |
| ClipboardCheck | `task_alt` | `order_approve` |
| Megaphone | `campaign` | `breaking_news` |
| Shield | `verified_user` | `admin_panel_settings` |
| Bot | `smart_toy` | `robot_2` |
| Crown | `diamond` | `crown` |
| Heart | `favorite` | `cardiology` |
| Truck | `local_shipping` | `package_2` → manter `local_shipping` |
| Search | `search` | `manage_search` |
| Pencil | `edit` | `ink_pen` |
| Save | `save` | `save` (manter) |
| Filter | `filter_list` | `tune` |
| Send | `send` | `near_me` |
| BookOpen | `auto_stories` | `menu_book` |
| Eye | `visibility` | `preview` |
| Lightbulb | `tips_and_updates` | `emoji_objects` |
| CalendarDays | `calendar_month` | `date_range` |
| MessageCircle | `chat` | `chat_bubble` |
| Coins | `generating_tokens` | `monetization_on` |
| Coffee | `coffee` | `local_cafe` |
| Medal | `military_tech` | `rewarded_ads` |
| Award | `workspace_premium` | `social_leaderboard` |
| Gem | `diamond` | `diamond` (manter — usado como crown badge) |
| QrCode | `qr_code_2` | `qr_code_scanner` |
| Flame | `local_fire_department` | `whatshot` |

**2. `src/components/ui/app-icon.tsx` — Ajuste sutil de weight**

Mudar o weight padrão de `400` para `300` para um visual mais fino e elegante (estilo iOS/Instagram), e usar `GRAD` `-25` para um toque mais suave.

### Arquivos modificados
- `src/lib/iconMap.ts` — Remapeamento de ícones
- `src/components/ui/app-icon.tsx` — Ajuste de weight/grad padrão

### Impacto
Todas as telas do app atualizam automaticamente pois usam o `AppIcon` centralizado. Nenhuma mudança de lógica, apenas visual.

