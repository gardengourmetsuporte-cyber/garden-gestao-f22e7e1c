

## Redesign da Tela de Login — Identidade Premium

A tela atual é funcional mas genérica: logo + card + formulário centralizado sem diferenciação visual. Vamos elevar para o padrão Mercury/Linear com layout split-screen (desktop) e branded hero (mobile).

### Estrutura do novo layout

```text
┌──────────────────────────────────────────────┐
│  DESKTOP (md+)                               │
│  ┌─────────────────┬────────────────────────┐ │
│  │  BRAND PANEL    │   FORM PANEL           │ │
│  │                 │                        │ │
│  │  Logo grande    │   Card com formulário  │ │
│  │  Tagline        │   (mesmo que atual)    │ │
│  │  Gradiente      │                        │ │
│  │  animado +      │   Social login         │ │
│  │  orbs sutis     │   Toggle signup/login  │ │
│  │                 │                        │ │
│  └─────────────────┴────────────────────────┘ │
│                                              │
│  MOBILE                                      │
│  ┌──────────────────────────────────────────┐ │
│  │  Logo + tagline (compacto)               │ │
│  │  Card formulário (full width)            │ │
│  │  Social + toggle                         │ │
│  └──────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

### Mudanças específicas

**1. Layout split-screen (desktop)**
- Lado esquerdo: painel de marca com gradiente escuro animado (reutiliza `gradient-brand`), logo grande, tagline "Gestão Inteligente", e 2-3 bullet points de valor ("Financeiro · Estoque · Equipe · IA")
- Lado direito: formulário limpo sobre fundo `background`
- Mobile: layout vertical empilhado (logo compacto no topo + form)

**2. Painel de marca (lado esquerdo)**
- Fundo: gradiente escuro animado com orbs sutis de `--primary`
- Logo: 80px, com o ring neon rotativo já existente
- Headline: "Garden" em `font-display` bold + "Gestão Inteligente" como subtítulo
- Feature chips: 3-4 ícones pequenos com labels ("Financeiro", "Estoque", "Equipe", "IA") em row horizontal
- Efeito: orb blur de `--primary` no canto superior e inferior

**3. Card do formulário (lado direito)**
- Remove o `gradient-primary` do card — usa `bg-card` limpo com borda sutil
- Inputs mantêm o estilo atual (já padronizado)
- Botão submit mantém `bg-primary` sem animação de scale
- Social buttons mantêm estilo atual

**4. Detalhes visuais**
- Botão "Voltar" e ThemeToggle: reposicionados no topo do painel do form
- Footer: movido para dentro do painel do form
- Animações: `animate-slide-up` nos elementos do form com delays escalonados (já existe)

### Arquivo editado
- `src/pages/Auth.tsx` — reescrita do layout JSX e estilos inline

### Resultado esperado
Uma tela que comunica profissionalismo e identidade de marca ao primeiro contato, alinhada com o padrão visual do sistema interno e da landing page.

