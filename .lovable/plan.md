
# Plano Unificado: Melhorias de Gamificação + Perfil Simplificado

## Resumo Executivo

Este plano implementa todas as melhorias solicitadas em uma única entrega:
1. **Moedinha nas tarefas**: Ícone de moeda com "+1" ao lado de cada tarefa
2. **Nome no histórico de estoque**: Exibir quem fez cada movimentação
3. **Animação de moeda**: Moeda voando da tarefa para o contador de pontos
4. **Perfil simplificado**: Remover cargo/departamento, adicionar foto de perfil

---

## Parte 1: Moedinha nas Tarefas do Checklist

### Visual
```text
┌─────────────────────────────────────────────────────────────┐
│  [ ]  Verificar estoque de carnes            🪙 +1         │
│       Verificar quantidade disponível                       │
├─────────────────────────────────────────────────────────────┤
│  [✓]  Limpar bancada                          🪙 +1        │
│       ↳ Feito por Bruno às 08:35                            │
│       (moeda fica esmaecida quando completada)              │
└─────────────────────────────────────────────────────────────┘
```

### Implementação
- Adicionar ícone `Coins` do lucide-react ao lado de cada tarefa
- Badge dourado com "+1" usando cores amber-500
- Opacidade reduzida quando tarefa já está completa

---

## Parte 2: Nome de Quem Fez Movimentação no Estoque

### Visual
```text
┌─────────────────────────────────────────────────────────────┐
│  ↓  Arroz Branco                                            │
│     Entrada • 14:32 • Por: Bruno Momesso      +10 kg        │
├─────────────────────────────────────────────────────────────┤
│  ↑  Carne Bovina                                            │
│     Saída • 10:15 • Por: Maria Silva          -2 kg         │
└─────────────────────────────────────────────────────────────┘
```

### Implementação
- Modificar `useInventoryDB.ts` para buscar profiles junto com movements
- Atualizar `MovementHistoryNew.tsx` para exibir o nome do usuário
- Como não há FK direta, buscar profiles separadamente e fazer merge

---

## Parte 3: Animação de Moeda Voando

### Fluxo Visual
```text
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   ┌──────────┐                                              │
│   │ 🪙 127   │ ← Destino (pulsa ao receber)                │
│   │ pontos   │                                              │
│   └──────────┘                                              │
│         ↑                                                   │
│         │  🪙 ← Moeda voando                               │
│         │     (arco + rotação + escala)                     │
│         │                                                   │
│   [✓] Limpar bancada  🪙 +1  ← Origem                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Implementação

**1. Keyframes CSS (tailwind.config.ts)**
```css
coin-fly: movimento em arco com rotação e fade out
coin-pulse: pulso no contador ao receber moeda
```

**2. Novo componente: CoinAnimation.tsx**
- Renderiza moeda em position: fixed
- Anima de ponto inicial até ponto final
- Remove-se automaticamente após animação

**3. Context: CoinAnimationContext.tsx**
- Gerencia lista de animações ativas
- Expõe função `triggerCoin(x, y)`
- Calcula destino automaticamente via getElementById

**4. Integração**
- PointsDisplay recebe `id="points-counter"` como destino
- ChecklistView dispara animação ao marcar tarefa

---

## Parte 4: Perfil Simplificado com Foto

### Visual
```text
┌─────────────────────────────────────────────────────────────┐
│  ┌────────────────┐                                         │
│  │                │   📷 Alterar Foto                       │
│  │   [FOTO]       │                                         │
│  │                │   Bruno Momesso                         │
│  └────────────────┘   usuario@email.com                     │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  👤 Nome Completo                                           │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  Bruno Momesso                                          ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              💾 Salvar Alterações                       ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### Implementação

**Banco de Dados**
```sql
-- Criar bucket para avatars (público para visualização)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- Políticas RLS:
-- Usuários podem fazer upload/update/delete do próprio avatar
-- Qualquer um pode ver avatars (são públicos)
```

**ProfileSettings.tsx**
- Remover campos `jobTitle` e `department`
- Adicionar upload de foto com preview
- Upload vai para `storage/avatars/{user_id}/avatar.{ext}`
- URL pública salva no campo `avatar_url` do profile

**AppLayout.tsx**
- Exibir foto do usuário quando `profile?.avatar_url` existir
- Fallback para ícone User quando não houver foto

---

## Arquivos a Criar

| Arquivo | Descrição |
|---------|-----------|
| `src/components/animations/CoinAnimation.tsx` | Componente da moeda animada |
| `src/contexts/CoinAnimationContext.tsx` | Context para gerenciar animações |

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| Migração SQL | Criar bucket `avatars` com políticas RLS |
| `tailwind.config.ts` | Keyframes para animações coin-fly e coin-pulse |
| `src/components/checklists/ChecklistView.tsx` | Moedinha "+1" + trigger de animação |
| `src/components/rewards/PointsDisplay.tsx` | ID para destino + animação de pulse |
| `src/hooks/useInventoryDB.ts` | Buscar profiles junto com movements |
| `src/components/inventory/MovementHistoryNew.tsx` | Exibir nome de quem fez movimentação |
| `src/components/settings/ProfileSettings.tsx` | Remover campos + adicionar upload foto |
| `src/components/layout/AppLayout.tsx` | Exibir avatar + incluir CoinAnimationProvider |

---

## Ordem de Implementação

1. Migração SQL para bucket de avatars
2. Keyframes de animação no tailwind.config.ts
3. CoinAnimation e CoinAnimationContext
4. Atualizar PointsDisplay com id e pulse
5. Modificar ChecklistView (moedinha + trigger)
6. Atualizar useInventoryDB para buscar profiles
7. Modificar MovementHistoryNew para exibir nome
8. Simplificar ProfileSettings + upload de foto
9. Atualizar AppLayout (avatar + provider)
10. Testar fluxo completo

---

## Benefícios

| Melhoria | Benefício |
|----------|-----------|
| Moedinha nas tarefas | Visualização clara do valor de cada tarefa |
| Animação de moeda | Feedback satisfatório e gamificação reforçada |
| Nome no estoque | Accountability e rastreabilidade |
| Foto de perfil | Personalização e identificação visual |
| Perfil simplificado | Menos campos = experiência mais rápida |
