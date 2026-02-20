

# Padronizacao de Headers em Todos os Modulos

## Problema Identificado

Os modulos **Financeiro** (`/finance`) e **Financas Pessoais** (`/personal-finance`) nao possuem a barra superior com titulo do modulo (`page-header-bar`) que todos os outros modulos utilizam. Isso quebra a consistencia visual da plataforma.

## Modulos Auditados

| Modulo | Tem `page-header-bar`? | Acao |
|--------|----------------------|------|
| Agenda | Sim | Nenhuma |
| Estoque | Sim | Nenhuma |
| Pedidos | Sim | Nenhuma |
| Checklists | Sim | Nenhuma |
| Fechamento | Sim | Nenhuma |
| Fichas Tecnicas | Sim | Nenhuma |
| Funcionarios | Sim | Nenhuma |
| Recompensas | Sim | Nenhuma |
| Ranking | Sim | Nenhuma |
| Marketing | Sim | Nenhuma |
| Configuracoes | Sim | Nenhuma |
| Alertas | Sim | Nenhuma |
| WhatsApp | Sim | Nenhuma |
| Cardapio | Sim | Nenhuma |
| Tablets | Sim | Nenhuma |
| **Financeiro** | **Nao** | **Adicionar** |
| **Financas Pessoais** | **Nao** | **Adicionar** |
| Dashboard | Nao (e a home, nao precisa) | Nenhuma |
| Chat | Header customizado (full-screen) | Nenhuma |
| Copilot | Header customizado (full-screen) | Nenhuma |

## O que Muda

Adicionar `page-header-bar` com o titulo do modulo em **Finance.tsx** e **PersonalFinance.tsx**, usando exatamente o mesmo padrao que todos os outros modulos ja utilizam.

## Detalhes Tecnicos

### 1. `src/pages/Finance.tsx`

Adicionar o header sticky dentro do `<AppLayout>`, antes do conteudo das tabs:

```
<header className="page-header-bar">
  <div className="page-header-content">
    <h1 className="page-title">Financeiro</h1>
  </div>
</header>
```

Posicao: logo apos `<AppLayout>`, envolvido pelo div principal. O header fica sticky no topo enquanto o usuario navega pelas sub-tabs (home, transacoes, graficos, etc).

### 2. `src/pages/PersonalFinance.tsx`

Mesmo padrao:

```
<header className="page-header-bar">
  <div className="page-header-content">
    <h1 className="page-title">Financas Pessoais</h1>
  </div>
</header>
```

### 3. Nenhuma alteracao de CSS

As classes `page-header-bar`, `page-header-content` e `page-title` ja existem no `index.css` e sao usadas por todos os outros modulos. Nao precisa criar nada novo.

### 4. Nenhum outro modulo precisa de alteracao

Todos os demais modulos ja seguem o padrao corretamente. Chat e Copilot usam headers customizados por serem telas full-screen com layout diferente (chat com lista/janela, copilot com interface de IA), o que e aceitavel.

