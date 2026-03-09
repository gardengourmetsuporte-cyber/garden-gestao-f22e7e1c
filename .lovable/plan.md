

## Plano: Substituir saudação por header contextual integrado ao top bar

### O que muda

A seção de boas-vindas atual (greeting + data + frase motivacional) será removida e substituída por um **hero compacto contextual** que funciona como extensão visual do top bar, criando continuidade entre header e conteúdo.

### Conceito visual

```text
┌──────────────────────────────────┐
│  [logo]          [bell] [avatar] │  ← top bar (já existe)
├──────────────────────────────────┤
│                                  │
│  Olá, Bruno                      │  ← greeting inline, menor
│  ┌────────┐ ┌────────┐ ┌──────┐ │
│  │ 📊 12  │ │ ✅ 3   │ │ 🔔 2 │ │  ← "context pills" com
│  │pendente│ │tarefas │ │alertas│ │     dados do dia
│  └────────┘ └────────┘ └──────┘ │
│                                  │
└──────────────────────────────────┘
```

### Implementação

1. **`AdminDashboard.tsx`** (linhas 85-94): Remover o bloco `{/* Welcome */}` com greeting, data e frase motivacional.

2. **Criar `src/components/dashboard/DashboardContextBar.tsx`**: Novo componente compacto que:
   - Exibe greeting curto em uma linha (`Olá, Bruno`) com tipografia `text-base font-bold`
   - Abaixo, uma row de **context pills** horizontais (scroll) mostrando dados acionáveis do dia:
     - Contas a vencer (se houver)
     - Checklists pendentes
     - Pedidos pendentes
     - Tarefas da agenda
   - Cada pill é clicável e navega para o módulo correspondente
   - Usa `backdrop-blur` e `bg-muted/30` para glassmorphism sutil, conectando visualmente com o header transparente
   - Sem data, sem frase motivacional — informação pura e acionável

3. **`AdminDashboard.tsx`**: Importar e renderizar `<DashboardContextBar>` no lugar do bloco removido, passando `stats` e `firstName`.

### Resultado

Em vez de texto decorativo estático, o usuário vê um resumo inteligente do dia com ações rápidas — moderno, funcional e visualmente integrado ao top bar.

