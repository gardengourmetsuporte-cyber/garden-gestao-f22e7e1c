

# Modulo Gamificacao & Fidelizacao — Roleta de Premios

## Visao Geral

Criar um modulo completo de gamificacao com dois lados:
1. **Tela publica (tablet)** — roleta de premios acessivel via URL `/gamification/:unitId`
2. **Painel administrativo (BOSST)** — rota protegida `/gamification` para gestores configurarem premios, probabilidades e verem metricas

O modulo segue os mesmos padroes do sistema de Tablet existente (rotas publicas em `/tablet/:unitId`) e do painel admin (`/tablet-admin`).

---

## Banco de Dados (3 tabelas + RLS)

### Tabela `gamification_prizes`
Armazena os premios configuraveis pelo gestor.

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid PK | |
| unit_id | uuid FK units | Unidade |
| name | text | Nome do premio (ex: "Item pequeno gratis") |
| type | text | `item`, `discount`, `empty` |
| probability | numeric | Peso relativo (0-100) |
| estimated_cost | numeric | Custo estimado em R$ |
| is_active | boolean | Ativo/inativo |
| icon | text | Emoji ou icone |
| color | text | Cor do segmento na roleta |
| created_at / updated_at | timestamptz | |

### Tabela `gamification_plays`
Registra cada jogada realizada.

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid PK | |
| unit_id | uuid FK units | Unidade |
| order_id | text | ID do pedido (referencia textual) |
| customer_name | text nullable | Nome do cliente (opcional) |
| prize_id | uuid FK gamification_prizes nullable | Premio ganho (null = sem premio) |
| prize_name | text | Nome snapshot do premio |
| played_at | timestamptz | Data/hora da jogada |

### Tabela `gamification_settings`
Configuracoes globais por unidade (1 row por unit).

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid PK | |
| unit_id | uuid FK units UNIQUE | |
| is_enabled | boolean | Jogo ativo/inativo |
| max_daily_cost | numeric | Teto de custo diario |
| points_per_play | integer | Pontos consumidos por jogada |
| cooldown_minutes | integer | Intervalo minimo entre jogadas |
| updated_at | timestamptz | |

### RLS
- `gamification_prizes`: SELECT publico (anon para tablet), INSERT/UPDATE/DELETE restrito a admins da unidade
- `gamification_plays`: INSERT publico (anon para tablet registrar jogada), SELECT restrito a admins
- `gamification_settings`: SELECT publico, UPDATE restrito a admins

---

## Frontend — Tela do Tablet (publica)

### Arquivos novos
- `src/pages/GamificationPlay.tsx` — pagina principal
- `src/components/gamification/SpinWheel.tsx` — componente da roleta animada (Canvas ou CSS)
- `src/components/gamification/PrizeResult.tsx` — tela de resultado do premio
- `src/hooks/useGamification.ts` — hook para fetch de premios e registro de jogadas

### Rota
`/gamification/:unitId` (publica, sem auth — igual ao tablet)

### Fluxo
```text
[Tela Inicial]
  Garden Gourmet
  "Enquanto seu pedido fica pronto, gire a roleta"
  Input: Numero do pedido (ou QR)
  Botao: GIRAR ROLETA
        |
        v
[Validacao]
  - Verificar se jogo esta ativo (settings.is_enabled)
  - Verificar cooldown (ultima jogada deste pedido)
  - Verificar teto de custo diario
        |
        v
[Animacao da Roleta]
  - Sortear premio com base em probabilidades (weighted random)
  - Animar giro por ~3-4 segundos
  - Parar no segmento sorteado
        |
        v
[Resultado]
  - Exibir premio com animacao de confete
  - Mensagem: "Mostre esta tela no caixa"
  - Botao: Finalizar (volta pra tela inicial)
```

### Roleta (SpinWheel)
- Componente CSS com `conic-gradient` e rotacao via `transform: rotate()`
- Segmentos proporcionais as probabilidades
- Animacao com `transition` e `cubic-bezier` para efeito de desaceleracao
- Indicador/seta fixa no topo

---

## Frontend — Painel Administrativo (BOSST)

### Arquivos novos
- `src/pages/Gamification.tsx` — pagina admin
- `src/components/gamification/PrizeSheet.tsx` — criar/editar premios
- `src/components/gamification/GamificationMetrics.tsx` — metricas (jogadas/dia, custo, premios)
- `src/components/gamification/GamificationSettings.tsx` — on/off, teto diario, cooldown
- `src/hooks/useGamificationAdmin.ts` — hook admin com CRUD de premios + metricas

### Rota
`/gamification` (protegida, dentro do AppLayout)

### Interface
3 secoes na pagina:
1. **Cabecalho** — toggle ativar/desativar jogo + configuracoes
2. **Premios** — lista com drag para reordenar, sheet para criar/editar, toggle ativo/inativo inline
3. **Metricas** — cards com jogadas hoje, premios distribuidos, custo estimado acumulado

---

## Integracao no BOSST

### Arquivos a editar
- `src/lib/modules.ts` — adicionar modulo `gamification`
- `src/App.tsx` — adicionar rotas `/gamification` (protegida) e `/gamification/:unitId` (publica)
- `src/components/layout/AppLayout.tsx` — adicionar item no menu lateral (grupo "Engajamento" ou "Em Producao")

---

## Logica de Sorteio (client-side para MVP)

```text
1. Buscar premios ativos da unidade
2. Calcular soma total de probabilidades
3. Gerar numero aleatorio 0..soma
4. Iterar premios acumulando probabilidades ate encontrar o sorteado
5. Registrar jogada no banco com prize_id
```

Para versao futura, o sorteio pode ser movido para Edge Function para evitar manipulacao.

---

## Prioridade de Implementacao

1. Migracoes de banco (tabelas + RLS + realtime)
2. Hook `useGamification` + `useGamificationAdmin`
3. Componente `SpinWheel` (roleta animada)
4. Pagina do tablet `GamificationPlay`
5. Pagina admin `Gamification`
6. Integracao no roteamento e menu do BOSST

---

## Detalhes Tecnicos

### Animacao da roleta
- CSS puro com `conic-gradient` para os segmentos coloridos
- Rotacao via state React + `transition: transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)`
- Angulo final calculado para parar no segmento sorteado
- Sem dependencias externas

### Cooldown
- Verificado client-side consultando `gamification_plays` pelo `order_id`
- Se ja existe jogada para aquele pedido, bloqueia

### Teto de custo diario
- Soma `estimated_cost` dos premios distribuidos hoje
- Se ultrapassa `max_daily_cost`, desativa temporariamente

### Estimativa: ~12 arquivos novos, ~3 arquivos editados

