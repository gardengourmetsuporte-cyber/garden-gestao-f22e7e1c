

# Redesign do Painel Administrativo

## Objetivo
Redesenhar completamente o Dashboard Administrativo com um visual mais moderno, profissional e interativo, com cards clicaveis que levam diretamente para as acoes correspondentes.

---

## Novo Layout Proposto

### 1. Header de Boas-Vindas (Mantido com melhorias)
- Gradiente atualizado com efeito mais sofisticado
- Adicionar data/hora atual
- Manter saudacao personalizada

### 2. Cards de Metricas Principais (Novo Design)
Grid de 4 cards grandes e clicaveis com:
- Icone destacado com fundo gradiente
- Valor numerico grande e titulo
- Indicador de tendencia ou status
- Seta indicando navegacao
- Hover com elevacao e destaque de borda

**Cards previstos:**
| Card | Clica para | Cor |
|------|-----------|-----|
| Usuarios Ativos | `/settings` (aba usuarios) | Azul |
| Pedidos Pendentes | `/` (aba pedidos) | Laranja |
| Resgates Pendentes | `/rewards` | Amarelo |
| Estoque Critico | `/` (filtro itens criticos) | Vermelho |

### 3. Secao de Alertas (Redesenhada)
- Card com visual mais impactante
- Cada alerta clicavel levando para a acao correspondente
- Badges com contadores
- Icones coloridos por severidade

### 4. Cards de Acesso Rapido (Redesenhado)
Grid 2x2 em mobile, 4 colunas em desktop:
- Estoque (total de itens + status)
- Checklists (progresso do dia)
- Recompensas (pendentes)
- Configuracoes (usuarios cadastrados)

Cada card tera:
- Icone grande com fundo gradiente arredondado
- Titulo e subtitulo informativos
- Seta de navegacao
- Animacao de hover suave

### 5. Ranking e Pontos por Setor (Lado a lado)
- Manter componentes existentes (Leaderboard e SectorPointsSummary)
- Adicionar header clicavel "Ver todos" para ranking completo

---

## Arquivos a Modificar

### `src/components/dashboard/AdminDashboard.tsx`
- Reescrever completamente o layout
- Implementar navegacao programatica com useNavigate
- Criar cards interativos com estados hover/active
- Adicionar logica de filtros para navegacao contextual

### `src/components/dashboard/QuickStats.tsx` (Opcional)
- Pode ser substituido por componentes inline no AdminDashboard
- Ou atualizado para aceitar props de clique e navegacao

---

## Especificacoes Visuais

### Cores dos Cards de Metricas
```text
Usuarios: bg-gradient-to-br from-blue-500 to-blue-600
Pedidos: bg-gradient-to-br from-orange-500 to-amber-500  
Resgates: bg-gradient-to-br from-amber-400 to-yellow-500
Estoque Critico: bg-gradient-to-br from-red-500 to-rose-600
```

### Efeitos de Interacao
- `hover:scale-[1.02]` - leve aumento no hover
- `hover:shadow-xl` - sombra mais pronunciada
- `active:scale-[0.98]` - feedback de clique
- `transition-all duration-200` - transicoes suaves

### Espacamento
- Gap entre cards: `gap-4` (mobile) / `gap-6` (desktop)
- Padding interno: `p-5` a `p-6`
- Border radius: `rounded-2xl` para cards principais

---

## Fluxo de Navegacao

```text
Card Usuarios ──────────> /settings (scroll to usuarios)
Card Pedidos ───────────> / (tab pedidos)
Card Resgates ──────────> /rewards
Card Estoque Critico ───> / (filtro zerados + baixo)
Card Estoque ───────────> /
Card Checklists ────────> /checklists
Card Recompensas ───────> /rewards
Card Configuracoes ─────> /settings
```

---

## Detalhes Tecnicos

### Navegacao com Estado
Para navegar para uma pagina com filtro pre-aplicado, usaremos:
```typescript
navigate('/', { state: { stockFilter: 'critical' } })
navigate('/', { state: { activeTab: 'pedidos' } })
```

### Estrutura do Card de Metrica
```tsx
<div onClick={() => navigate('/path')} 
     className="group cursor-pointer bg-gradient-to-br ... 
                rounded-2xl p-5 text-white 
                hover:scale-[1.02] hover:shadow-xl 
                active:scale-[0.98] transition-all">
  <div className="flex items-start justify-between">
    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
      <Icon className="w-6 h-6" />
    </div>
    <ArrowUpRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
  </div>
  <div className="mt-4">
    <p className="text-3xl font-bold">{value}</p>
    <p className="text-white/80 text-sm">{title}</p>
  </div>
</div>
```

---

## Resultado Esperado

Um dashboard administrativo moderno com:
- Visual profissional com gradientes e sombras
- Todos os cards clicaveis com feedback visual
- Navegacao intuitiva para acoes relacionadas
- Hierarquia visual clara (metricas > alertas > acesso rapido > detalhes)
- Responsivo para mobile e desktop
- Consistente com o design system existente

