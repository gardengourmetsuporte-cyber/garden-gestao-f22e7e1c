

# Corrigir ícones cinzas no menu "Mais"

## Problema
No MoreDrawer (menu de módulos), ícones que usam imagens PNG customizadas (`customIcon`) recebem a classe CSS `icon-tint-muted` quando inativos, o que aplica um filtro cinza. Já os ícones Material (AppIcon) usam `text-foreground` e ficam pretos.

Ícones afetados (com `customIcon`): Copilot IA, Fornecedores, Checklists, Entregas, Cardápio, WhatsApp IA, Funcionários, Recompensas, Ranking, Marketing.

## Solução
Na linha 280 do `MoreDrawer.tsx`, trocar `icon-tint-muted` por uma classe que force o ícone para preto/escuro quando inativo. Usar `icon-tint-dark` (nova classe CSS) ou simplesmente remover o filtro e usar `brightness(0)` inline para forçar preto.

Abordagem mais simples: substituir `"icon-tint-muted"` por `"dark:invert brightness-0"` (Tailwind) para que as imagens PNG fiquem pretas no light mode e brancas no dark mode — igual ao `text-foreground` dos AppIcons.

### Arquivos alterados
1. **`src/components/layout/MoreDrawer.tsx`** — linha 280: trocar `icon-tint-muted` por classes que resultem em ícone preto/foreground
2. **`src/components/layout/AppSidebar.tsx`** — linha 176: mesma correção para consistência na sidebar

