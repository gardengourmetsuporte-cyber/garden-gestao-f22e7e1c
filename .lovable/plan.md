

## Padronizar Ícones dos QuickStats

### Problema
Os ícones PNG atuais (`stat-alert.png`, `stat-orders.png`, etc.) têm tamanhos e estilos visuais diferentes entre si — alguns são maiores, outros menores, e os designs internos não seguem um padrão único.

### Solução
Substituir todos os ícones PNG por ícones SVG inline renderizados via código, todos com:
- **Círculo colorido uniforme** de `w-12 h-12` (48px) — tamanho grande e consistente
- **Ícone interno branco** centralizado, todos no mesmo tamanho (22px)
- **Cores vibrantes e divertidas** por categoria, com gradiente sutil para dar vida

### Implementação

**Arquivo: `src/components/dashboard/QuickStatsWidget.tsx`**

Substituir o sistema de ícones PNG por um componente inline `StatIcon` que renderiza:
- Um `div` circular com background gradient colorido (tamanho fixo `w-12 h-12`)
- Um `AppIcon` branco centralizado dentro (tamanho 22)

Mapeamento de cores e ícones:
| Card | Cor do Círculo | Ícone Material |
|------|---------------|----------------|
| Itens Críticos | Vermelho/Rosa gradient | `error` (!) |
| Pedidos | Rosa/Pink gradient | `restaurant_menu` |
| Fechamentos | Laranja gradient | `receipt_long` |
| Resgates | Azul/Cyan gradient | `redeem` (presente) |
| Cotações | Verde gradient | `balance` (balança) |
| Checklist | Teal gradient | `task_alt` (check) |

- Remover imports dos PNGs (`stat-alert.png`, etc.)
- Remover o `STAT_ICONS` record
- Alterar o container do ícone de `w-11 h-11` para `w-12 h-12` com gradiente via style inline
- O `AppIcon` interno usa `size={22}` e `className="text-white"`

**Nenhum outro arquivo precisa ser alterado** — o `QuickStatsWidget` é autocontido.

