

# Configuração de Aparência

## Visão geral

Criar uma nova seção "Aparência" nas Configurações que permite ao admin personalizar:
1. **Cor primária do sistema** -- trocar o verde padrão por qualquer cor, aplicando em todo o app
2. **Logo da empresa** -- upload que substitui o logo Garden na barra superior (mobile + desktop) e no loading interno (PageLoader)

## Arquitetura

### 1. Banco de dados

Adicionar campos no `store_info` (JSONB) da tabela `units` -- sem necessidade de nova tabela nem migration SQL (já é JSONB livre). Os dados ficam assim:

```json
{
  "logo_url": "https://...",
  "theme_color": "220 80% 50%",
  ...
}
```

### 2. Novo componente: `AppearanceSettings.tsx`

- Paleta de cores pré-definidas (Verde, Azul, Roxo, Laranja, Vermelho, Rosa, Ciano) + picker livre
- Upload de logo da empresa (usando bucket `brand-assets` já existente)
- Preview ao vivo da cor selecionada
- Botão salvar grava em `units.store_info` via `supabase.from('units').update()`

### 3. Registrar na página Settings

- Adicionar item "Aparência" (ícone `Palette`) na seção "Conta" do menu de configurações
- Lazy-load do componente `AppearanceSettings`

### 4. Aplicação global da cor

- Modificar `UnitContext.tsx`: ao carregar a unit, ler `store_info.theme_color` e aplicar via CSS custom properties (`--primary`, `--ring`, `--neon-cyan`, etc.) no `document.documentElement`
- Atualizar `applyUnitTheme` em `unitThemes.ts` para aceitar override de cor vindo do `store_info`

### 5. Logo dinâmico

- Modificar `AppLayout.tsx`: em vez de sempre importar `gardenLogo`, verificar se `activeUnit?.store_info?.logo_url` existe; se sim, usar essa URL; senão, fallback para o logo padrão
- Modificar `PageLoader.tsx`: receber logo via prop ou contexto (criar um pequeno hook `useUnitLogo()` que retorna a URL do logo ou o fallback)
- Aplicar a mesma lógica no sidebar desktop

### 6. Paleta de cores disponíveis

```text
Verde (padrão)  → 156 72% 40%
Azul            → 220 80% 50%
Roxo            → 262 70% 55%
Laranja         → 25 95% 53%
Vermelho        → 0 72% 50%
Rosa            → 330 80% 55%
Ciano           → 190 85% 45%
```

### Arquivos impactados

| Arquivo | Mudança |
|---|---|
| `src/components/settings/AppearanceSettings.tsx` | Novo -- formulário de aparência |
| `src/pages/Settings.tsx` | Adicionar item + lazy load |
| `src/contexts/UnitContext.tsx` | Ler `store_info` e aplicar tema |
| `src/lib/unitThemes.ts` | Função para aplicar cor dinâmica |
| `src/components/layout/AppLayout.tsx` | Logo dinâmico (mobile header + desktop sidebar) |
| `src/components/PageLoader.tsx` | Logo dinâmico via hook/prop |
| `src/hooks/useUnitLogo.ts` | Novo -- retorna logo_url ou fallback |

