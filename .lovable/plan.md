
# Dashboard de Widgets Personalizavel (Estilo iOS)

## Visao Geral

Transformar o Dashboard em uma tela inicial personalizavel onde cada secao (metricas, alertas, leaderboard, acesso rapido, notificacoes) vira um **widget independente** que voce pode:

- **Adicionar/Remover** da tela inicial
- **Arrastar** para mudar a posicao
- **Redimensionar** entre tamanhos (pequeno, medio, grande)
- Layout salvo automaticamente no banco de dados

---

## Como Funciona

1. **Modo Normal**: Tela inicial funciona como hoje, mas com layout personalizado
2. **Modo Edicao**: Botao "Editar" no header ativa o modo edicao. Os widgets comecam a "tremer" (animacao estilo iOS) e aparecem botoes de remover (X) e redimensionar
3. **Adicionar Widget**: Botao "+" abre um catalogo de widgets disponiveis para adicionar
4. **Arrastar e Soltar**: Segure e arraste qualquer widget para mudar sua posicao na grade
5. **Redimensionar**: Toque no icone de tamanho para alternar entre pequeno (1 coluna), medio (2 colunas) e grande (2 colunas, mais alto)

---

## Catalogo de Widgets Disponiveis

| Widget | Tamanhos | Descricao |
|--------|----------|-----------|
| **Boas-vindas** | medio, grande | Header com nome e data |
| **Saldo do Mes** | pequeno, medio | Card de metrica financeira |
| **Pedidos Pendentes** | pequeno, medio | Card de metrica de pedidos |
| **Estoque Critico** | pequeno, medio | Card de metrica de estoque |
| **Fichas Tecnicas** | pequeno, medio | Card de metrica de receitas |
| **Alertas Pendentes** | medio, grande | Lista de acoes pendentes |
| **Acesso Rapido** | medio, grande | Grade de atalhos para modulos |
| **Leaderboard** | medio, grande | Ranking de pontos |
| **Notificacoes** | medio, grande | Ultimas notificacoes |
| **Pontos (Funcionario)** | medio, grande | Card de pontos do usuario |

---

## Estrutura no Banco de Dados

Nova tabela `dashboard_layouts` para salvar o layout de cada usuario:

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid | Identificador |
| user_id | uuid | Dono do layout |
| widgets | jsonb | Array com id, tipo, tamanho e posicao de cada widget |
| created_at | timestamp | Criacao |
| updated_at | timestamp | Ultima atualizacao |

Exemplo de `widgets`:
```text
[
  { "id": "w1", "type": "welcome", "size": "medium", "order": 0 },
  { "id": "w2", "type": "metric_balance", "size": "small", "order": 1 },
  { "id": "w3", "type": "metric_orders", "size": "small", "order": 2 },
  { "id": "w4", "type": "alerts", "size": "medium", "order": 3 },
  { "id": "w5", "type": "leaderboard", "size": "large", "order": 4 }
]
```

---

## Arquivos Novos

| Arquivo | Descricao |
|---------|-----------|
| `src/components/dashboard/WidgetGrid.tsx` | Grade principal com drag-and-drop usando @dnd-kit. Gerencia modo edicao, reordenacao e redimensionamento |
| `src/components/dashboard/WidgetWrapper.tsx` | Wrapper de cada widget com animacao de "tremer", botao de remover (X), indicador de tamanho e handle de arraste |
| `src/components/dashboard/WidgetCatalog.tsx` | Sheet/Drawer com lista de widgets disponiveis para adicionar |
| `src/components/dashboard/widgets/WelcomeWidget.tsx` | Widget de boas-vindas (extraido do AdminDashboard) |
| `src/components/dashboard/widgets/MetricWidget.tsx` | Widget generico de metrica (saldo, pedidos, estoque, receitas) |
| `src/components/dashboard/widgets/AlertsWidget.tsx` | Widget de alertas pendentes |
| `src/components/dashboard/widgets/QuickAccessWidget.tsx` | Widget de acesso rapido |
| `src/components/dashboard/widgets/LeaderboardWidget.tsx` | Widget do ranking |
| `src/components/dashboard/widgets/NotificationsWidget.tsx` | Widget de notificacoes |
| `src/components/dashboard/widgets/PointsWidget.tsx` | Widget de pontos (funcionario) |
| `src/hooks/useDashboardLayout.ts` | Hook para carregar, salvar e manipular o layout dos widgets no banco |

## Arquivos Editados

| Arquivo | Descricao |
|---------|-----------|
| `src/pages/DashboardNew.tsx` | Substituir conteudo fixo pelo WidgetGrid dinâmico |
| `src/components/dashboard/AdminDashboard.tsx` | Refatorar para usar WidgetGrid ao inves de layout fixo |
| `src/components/dashboard/EmployeeDashboard.tsx` | Refatorar para usar WidgetGrid ao inves de layout fixo |

---

## Comportamento Visual

- **Modo Normal**: Widgets aparecem na ordem salva, sem indicacoes de edicao. Tudo clicavel como hoje
- **Modo Edicao**: 
  - Widgets ganham animacao de "tremer" sutil (CSS keyframe wiggle)
  - Botao vermelho "X" no canto superior esquerdo de cada widget
  - Indicador de tamanho (P/M/G) no canto inferior direito, clicavel para alternar
  - Long-press ou arraste para reordenar (usando @dnd-kit ja instalado)
  - Botao "+" fixo no rodape para abrir catalogo
- **Grade**: Sistema de 2 colunas no mobile. Widgets pequenos ocupam 1 coluna, medios e grandes ocupam 2 colunas

---

## Seguranca

- Cada usuario so acessa seu proprio layout (RLS por user_id)
- Layout padrao pre-definido para novos usuarios (sem necessidade de configuracao inicial)
- Widgets de admin (alertas, metricas de gestao) so aparecem no catalogo para admins
