

# Atualização Completa do Design System — Garden Gestão v2.0

Consolidando todas as mudanças discutidas: avatar no header, donut chart maior com valor central, sparklines nos KPI cards, ajuste da bottom bar e cores.

## 1. Avatar no Header (DashboardContextBar.tsx)
- Substituir `<img src={gardenLogo}>` por `<RankedAvatar>` usando `profile?.avatar_url` do `useAuth()`
- Fallback com iniciais do nome
- Manter `w-12 h-12 rounded-full`

## 2. Donut Chart com valor central (MultiUnitOverview.tsx)
- Aumentar tamanho do gráfico de 120px para 200px
- Adicionar texto "TOTAL" + valor formatado centralizado dentro do donut via posicionamento absoluto
- Mover legenda das unidades para **abaixo** do gráfico (layout vertical em vez de horizontal)
- Remover o Card wrapper, usar layout direto

## 3. KPI Cards com Sparklines (QuickStatsWidget.tsx)
- Adicionar mini SVG sparkline decorativa em cada card (polyline simples com dados mock)
- Cor da sparkline segue a Smart Color do card (vermelho, amarelo ou verde)
- Layout: título no topo, ícone+valor à esquerda, sparkline no canto inferior direito
- Border radius de `rounded-2xl` para `rounded-[20px]`
- Grid de 3 colunas no mobile para os cards menores (como na imagem)

## 4. Bottom Tab Bar (BottomTabBar.tsx)  
- Nenhuma mudança de altura — a imagem mostra o mesmo padrão atual (64px com FAB)

## 5. Cor Neon Green (index.css)
- Ajustar `--neon-green` de `141 73% 42%` para `150 100% 50%` (mais vibrante, mais próximo de #00FF88)

## Arquivos a editar

| Arquivo | Mudança |
|---|---|
| `src/components/dashboard/DashboardContextBar.tsx` | Logo → Avatar do usuário |
| `src/components/dashboard/MultiUnitOverview.tsx` | Donut 200px, valor dentro, legenda embaixo |
| `src/components/dashboard/QuickStatsWidget.tsx` | Sparklines, rounded-[20px], layout com título no topo, grid 3 colunas |
| `src/index.css` | Neon green mais vibrante |

