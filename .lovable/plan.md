
# Tema Claro/Escuro com Botao de Toggle

## O que sera feito

Adicionar um botao de alternancia de tema (dark/light) tanto na landing page quanto no app principal, permitindo ao usuario escolher entre modo escuro e claro. A preferencia sera salva automaticamente no localStorage.

## Escopo das mudancas

### 1. Configurar o ThemeProvider (next-themes)
O pacote `next-themes` ja esta instalado. Sera adicionado o `ThemeProvider` no `App.tsx` envolvendo toda a aplicacao, configurado com `attribute="class"` para funcionar com o Tailwind (`darkMode: ["class"]`). O tema padrao sera "dark" (mantendo a experiencia atual).

### 2. Ajustar o CSS
O arquivo `index.css` ja possui a classe `.light` com as variaveis de tema claro (linhas 86-120). Sera necessario:
- Mover as variaveis do `:root` para `.dark` para que o sistema de classes funcione corretamente
- Ajustar glows, sombras e tokens neon para o tema claro
- Garantir que a landing page (que usa cores hardcoded como `bg-[hsl(222,70%,4%)]`) use as variaveis CSS em vez de valores fixos

### 3. Botao de Toggle no App (AppLayout)
Adicionar um icone de Sol/Lua no header do `AppLayout.tsx` que alterna entre os temas usando `useTheme()` do `next-themes`.

### 4. Botao de Toggle na Landing (LandingNavbar)
Adicionar o mesmo botao Sol/Lua na navbar da landing page.

### 5. Corrigir Landing Page para usar variaveis CSS
Varias secoes da landing usam cores hardcoded escuras (ex: `bg-[hsl(222,70%,4%)]`). Essas serao substituidas pelas variaveis do design system (`bg-background`, `text-foreground`, `bg-card`, etc.) para que o tema claro funcione automaticamente.

## Secao Tecnica

### Arquivos a criar
- `src/components/ui/theme-toggle.tsx` -- Componente reutilizavel com icone Sol/Lua que alterna o tema

### Arquivos a editar
- `src/App.tsx` -- Envolver com `ThemeProvider` do next-themes (defaultTheme="dark", attribute="class")
- `src/index.css` -- Mover variaveis de `:root` para `.dark`, manter `.light` como esta, ajustar tokens de glow/sombra para light
- `src/components/layout/AppLayout.tsx` -- Adicionar o ThemeToggle no header
- `src/components/landing/LandingNavbar.tsx` -- Adicionar o ThemeToggle na navbar
- `src/components/landing/HeroSection.tsx` -- Trocar cores hardcoded por variaveis CSS
- `src/components/landing/ProblemSection.tsx` -- Trocar cores hardcoded por variaveis CSS
- `src/components/landing/SolutionSection.tsx` -- Idem
- `src/components/landing/ScreenshotsSection.tsx` -- Idem
- `src/components/landing/BenefitsSection.tsx` -- Idem
- `src/components/landing/HowItWorksSection.tsx` -- Idem
- `src/components/landing/TestimonialsSection.tsx` -- Idem
- `src/components/landing/PricingSection.tsx` -- Idem
- `src/components/landing/DifferentialsSection.tsx` -- Idem
- `src/components/landing/FAQSection.tsx` -- Idem
- `src/components/landing/TrustSection.tsx` -- Idem
- `src/components/landing/CTASection.tsx` -- Idem
- `src/components/landing/FooterSection.tsx` -- Idem
- `src/pages/Landing.tsx` -- Trocar bg hardcoded por bg-background

### Logica do toggle
```text
Clique no botao Sol/Lua
  -> useTheme().setTheme("light" | "dark")
  -> next-themes adiciona/remove classe "dark" no <html>
  -> Tailwind + variaveis CSS atualizam automaticamente
  -> Preferencia salva no localStorage (automatico pelo next-themes)
```

### Nenhuma migracao de banco necessaria
