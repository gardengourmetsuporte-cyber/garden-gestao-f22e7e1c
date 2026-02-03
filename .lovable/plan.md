
# Plano: Correção Urgente do Layout Bugado

## Problema Identificado

Analisando as imagens enviadas e o código, identifiquei os seguintes bugs visuais críticos:

### Dashboard (Imagem 1)
- Os cards de métricas coloridos (azul, laranja, amarelo, vermelho) estão OK visualmente
- O header principal está correto

### Inventory (Imagem 2)  
- Os **Stats Cards** (Total de Itens, Estoque Baixo, Zerados, Movimentações) estão **sem fundo de card**, apenas texto flutuando
- As **Tabs** (Itens/Histórico/Pedidos) estão sem espaçamento adequado entre os textos
- O layout geral perdeu a estrutura de cards

## Causa Raiz

O problema está na cascata de classes CSS. A classe `stat-card` está definida como:
```css
.stat-card {
  @apply card-interactive p-4;
}
```

E `card-interactive` está definida como:
```css
.card-interactive {
  @apply bg-card rounded-2xl border border-border shadow-sm 
         cursor-pointer transition-all duration-200
         hover:shadow-md hover:border-primary/30
         active:scale-[0.98];
}
```

O problema é que **`border-border`** não está sendo aplicado corretamente porque a variável `--border` usa o formato HSL sem o wrapper `hsl()`, e em algumas situações o Tailwind não processa isso corretamente.

## Solução

Vou reescrever as classes CSS para serem mais explícitas e robustas, garantindo que todos os elementos visuais (fundo, borda, sombra, arredondamento) sejam aplicados corretamente.

---

## Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/index.css` | Reescrever classes com valores mais explícitos |
| `src/components/inventory/StatsCard.tsx` | Aplicar classes diretamente ao invés de depender da cascata |
| `src/pages/Inventory.tsx` | Ajustar classes das tabs para garantir espaçamento |

---

## Mudanças Detalhadas

### 1. Correção do `src/index.css`

Reescrever as classes de forma mais robusta:

```css
/* Card base - EXPLÍCITO */
.card-base {
  background-color: hsl(var(--card));
  border-radius: 1rem; /* 16px = rounded-2xl */
  border: 1px solid hsl(var(--border));
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); /* shadow-sm */
}

/* Card interativo */
.card-interactive {
  background-color: hsl(var(--card));
  border-radius: 1rem;
  border: 1px solid hsl(var(--border));
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  cursor: pointer;
  transition: all 0.2s ease;
}

.card-interactive:hover {
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); /* shadow-md */
  border-color: hsl(var(--primary) / 0.3);
}

.card-interactive:active {
  transform: scale(0.98);
}

/* Stat card */
.stat-card {
  background-color: hsl(var(--card));
  border-radius: 1rem;
  border: 1px solid hsl(var(--border));
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.stat-card:hover {
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  border-color: hsl(var(--primary) / 0.3);
}
```

### 2. Correção do `src/components/inventory/StatsCard.tsx`

Aplicar classes inline mais explícitas:

```tsx
<button
  onClick={onClick}
  className={cn(
    "w-full text-left p-4 bg-card rounded-2xl border border-border shadow-sm",
    "cursor-pointer transition-all duration-200",
    "hover:shadow-md hover:border-primary/30 active:scale-[0.98]"
  )}
>
```

### 3. Correção das Tabs em `src/pages/Inventory.tsx`

Garantir espaçamento correto nas tabs:

```tsx
<div className="flex bg-secondary p-1 rounded-xl gap-1">
  <button className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium">
    <ClipboardList className="w-4 h-4" />
    <span>Itens</span>
  </button>
  ...
</div>
```

---

## Resumo Visual

```
ANTES (Bugado)
┌──────────────────────────────────────────┐
│ Total de Itens  Estoque Baixo            │
│ 30              18                       │  ← Sem fundo/borda
│                                          │
│ Zerados         Movimentações (7d)       │
│ 11              2                        │  ← Texto flutuando
│                                          │
│ ItensHistóricoPedidos                    │  ← Sem espaçamento
└──────────────────────────────────────────┘

DEPOIS (Corrigido)
┌──────────────────────────────────────────┐
│ ┌─────────────┐ ┌─────────────┐          │
│ │ Total Itens │ │ Est. Baixo  │          │
│ │ 30          │ │ 18          │          │
│ └─────────────┘ └─────────────┘          │  ← Cards visíveis
│ ┌─────────────┐ ┌─────────────┐          │
│ │ Zerados     │ │ Moviment.   │          │
│ │ 11          │ │ 2           │          │
│ └─────────────┘ └─────────────┘          │
│                                          │
│ ┌───────────────────────────────────┐    │
│ │ Itens │ Histórico │ Pedidos       │    │  ← Tabs corretas
│ └───────────────────────────────────┘    │
└──────────────────────────────────────────┘
```

---

## O Que Será Corrigido

1. **Stats Cards**: Fundo, bordas e sombras visíveis
2. **Tabs**: Espaçamento correto entre opções
3. **Cards em Geral**: Todos os cards terão visual consistente
4. **Headers**: Já estão funcionando, mantidos
5. **Grid de Métricas do Dashboard**: Mantido (está funcionando)

## O Que NÃO Muda

- Toda a lógica e funcionalidade
- Cores e gradientes existentes
- Estrutura de navegação
- Fluxos de dados
