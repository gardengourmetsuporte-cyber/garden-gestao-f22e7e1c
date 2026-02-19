
# Rebranding: Garden -> Bosst (Plataforma SaaS)

Transformar o sistema de "Garden" (ferramenta interna) para "Bosst" (plataforma SaaS vendavel), onde cada empresa cadastrada tem seu proprio espaco isolado.

---

## Fase 1: Rebranding Completo (Garden -> Bosst)

Substituir TODAS as referencias a "Garden" por "Bosst" em:

### Arquivos publicos:
- `index.html` - titulo, meta tags, OG tags, apple-mobile-web-app-title
- `vite.config.ts` - manifest PWA (name, short_name)

### Landing Page (7 arquivos):
- `LandingNavbar.tsx` - alt e texto "Garden" -> "Bosst"
- `HeroSection.tsx` - alt da imagem
- `SolutionSection.tsx` - texto "O Garden centraliza..."
- `DifferentialsSection.tsx` - titulo "Por que o Garden e diferente"
- `TestimonialsSection.tsx` - depoimento menciona "Garden"
- `FooterSection.tsx` - logo alt, nome, copyright
- `PricingSection.tsx` - sem mudanca (ja generico)

### Codigo interno (4 arquivos):
- `AuthContext.tsx` - `garden_auth_cache` -> `bosst_auth_cache`
- `UnitContext.tsx` - `garden_active_unit_id` -> `bosst_active_unit_id`
- `OnboardingWizard.tsx` - `garden_onboarding_done` -> `bosst_onboarding_done` + toast "Bem-vindo ao Bosst"
- `useManagementAI.ts` - `garden_copilot_history` -> `bosst_copilot_history`

### Outros:
- `src/lib/medals.ts` - descricao da medalha "Garden" -> nome do negocio
- `src/lib/exportPdf.ts` - rodape "Garden Gestao" -> "Bosst"
- `src/pages/Copilot.tsx` - alt "Garden Copiloto" -> "Bosst Copiloto"
- `src/components/dashboard/AICopilotWidget.tsx` - mesma mudanca

**Total: ~15 arquivos editados, apenas substituicoes de texto.**

---

## Fase 2: Posicionamento como Plataforma

### Conceito:
- **Bosst** = a plataforma (marca, landing, auth)
- **Unidade** = o negocio do usuario (nome personalizado durante onboarding)
- O usuario nunca ve "Garden" — ele ve "Bosst" na plataforma e o nome do SEU negocio dentro do app

### O que JA funciona (sem mudancas):
- Isolamento multi-tenant via `unit_id` em todas as tabelas
- RLS com `user_has_unit_access()` verificando permissoes
- Cada usuario pode ter multiplas unidades
- Onboarding cria unidade + configura dados isolados
- Seletor de unidade no app launcher

### O que nao muda na estrutura:
A arquitetura atual ja suporta multiplas empresas isoladas. Cada "unit" funciona como uma empresa independente com dados totalmente separados. Nao e necessario criar uma camada extra de "organizacao" neste momento.

---

## Fase 3: Ajustes de Mensagens e UX

- Atualizar textos do onboarding para reforcar "Bosst" como plataforma
- Mensagem de boas-vindas: "Bem-vindo ao Bosst! Configure sua empresa."
- Setup Guide: manter foco no nome da unidade do usuario

---

## Secao Tecnica

### Mapeamento completo de mudancas:

```text
index.html                          -> titulo, meta, OG
vite.config.ts                      -> PWA manifest
src/contexts/AuthContext.tsx         -> localStorage key
src/contexts/UnitContext.tsx         -> localStorage key
src/hooks/useManagementAI.ts        -> localStorage key
src/components/onboarding/OnboardingWizard.tsx -> localStorage key + toast
src/components/landing/LandingNavbar.tsx       -> texto
src/components/landing/HeroSection.tsx         -> alt
src/components/landing/SolutionSection.tsx     -> texto
src/components/landing/DifferentialsSection.tsx -> texto
src/components/landing/TestimonialsSection.tsx  -> texto
src/components/landing/FooterSection.tsx        -> texto + copyright
src/components/dashboard/AICopilotWidget.tsx    -> alt
src/pages/Copilot.tsx                          -> alt
src/lib/medals.ts                              -> descricao
src/lib/exportPdf.ts                           -> rodape PDF
```

### Seguranca (ja implementado):
- RLS em todas as tabelas com `unit_id`
- Funcao `user_has_unit_access()` SECURITY DEFINER
- Triggers SECURITY DEFINER para operacoes criticas
- Roles separadas em `user_roles` (nunca no profile)
- JWT verificado em Edge Functions

### Isolamento de dados (ja implementado):
- Cada tabela possui coluna `unit_id`
- Todas as queries filtram por `activeUnitId`
- Onboarding cria unit + user_unit + dados iniciais isolados
- Sem vazamento entre unidades via RLS

### Ordem de execucao:
1. Substituicoes de texto (Garden -> Bosst) em todos os arquivos
2. Atualizar localStorage keys (prefixo bosst_)
3. Validar que nenhuma referencia a "Garden" restou

### Impacto:
- Zero mudancas no banco de dados
- Zero mudancas em RLS ou seguranca
- Apenas mudancas cosmeticas de texto e branding
- Usuarios existentes: localStorage antigo sera ignorado (novo login necessario uma vez)
