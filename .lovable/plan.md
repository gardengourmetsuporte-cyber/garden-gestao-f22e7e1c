

## Plano: Renomear "Unidades" → "Lojas" e Reestruturar

Renomear toda a terminologia de "unidades" para "lojas" em todas as interfaces do sistema, mantendo os nomes técnicos internos (tabelas, variáveis) inalterados para evitar breaking changes.

---

### Arquivos e mudanças

| Arquivo | Mudança |
|---|---|
| `src/pages/Settings.tsx` | Label "Unidades" → "Lojas", description "Gerenciar filiais e lojas" → "Gerenciar suas lojas" |
| `src/components/settings/UnitManagement.tsx` | Todas as strings UI: "Gerenciar Unidades" → "Gerenciar Lojas", "Nova Unidade" → "Nova Loja", "Nome da unidade" → "Nome da loja", "Unidade atualizada" → "Loja atualizada", "Excluir unidade" → "Excluir loja", "Ativar e Usar Unidade" → "Ativar Loja", ícone `Building2` → `Store`, placeholder "Filial Centro" → "Loja Centro", auto-provision name "Minha Empresa" → "Minha Loja" |
| `src/components/layout/MoreDrawer.tsx` | Label "Unidade" → "Loja" no seletor de chips |
| `src/contexts/UnitContext.tsx` | Toast "Erro ao carregar unidades" → "Erro ao carregar lojas", default name "Minha Empresa" permanece (vem do DB function) |
| `src/pages/Invite.tsx` | Textos "unidade" → "loja" nas mensagens de convite |
| `src/components/onboarding/OnboardingWizard.tsx` | Verificar e atualizar textos sobre unidade/loja se existirem |

### O que NÃO muda

- Tabelas do banco (`units`, `user_units`, `unit_id`) — permanecem iguais
- Variáveis de código (`activeUnit`, `useUnit`, `UnitContext`) — permanecem iguais
- Tipos internos (`Unit`, `UnitType` de inventário como kg/litro/unidade) — inalterados
- A palavra "unidade" quando se refere a unidade de medida (kg, litro, unidade) NÃO será alterada

