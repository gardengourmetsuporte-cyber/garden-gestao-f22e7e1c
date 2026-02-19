

# Redesign do Header Mobile

## Problema Atual
O header mobile tem 7 elementos espalhados de forma desorganizada, criando uma barra visualmente poluida e sem hierarquia clara:
- Esquerda: Toggle de tema + pontos (desconexos)
- Centro: Logo
- Direita: 4 icones empilhados (Unidade, Troféu, Chat, Notificações)

## Proposta de Redesign

### Nova Organização (3 zonas claras)

```text
+--------------------------------------------------+
|  [Logo+Nome]        [Pts]    [Chat] [Bell] [Avt]  |
+--------------------------------------------------+
```

**Zona Esquerda** - Identidade:
- Logo pequeno (32px) + nome da unidade ativa (texto truncado)
- Toque leva ao Dashboard

**Zona Central** - Score (destaque):
- Badge compacto com icone de estrela + pontos (ex: "73")
- Toque leva ao Ranking

**Zona Direita** - Ações rápidas:
- Chat (com badge de não lidos)
- Notificações (com badge)
- Avatar do usuário (mini RankedAvatar, 28px) - toque abre perfil

### Elementos Removidos do Header
- **ThemeToggle**: movido para o App Launcher (menu overlay) e sidebar desktop - nao precisa estar sempre visivel
- **Seletor de Unidade (Building2)**: movido para o App Launcher - troca de unidade e uma acao rara
- **Troféu separado**: o score central ja leva ao ranking, elimina redundancia

### Beneficios
- Reduz de 7 para 5 elementos visiveis
- Hierarquia visual clara: marca / metrica / acoes
- Cada zona tem proposito unico
- Avatar no header da acesso rapido ao perfil sem precisar do launcher

## Detalhes Tecnicos

### Arquivo modificado
- `src/components/layout/AppLayout.tsx` (linhas 159-264 - Mobile Header)

### Mudancas no header mobile:
1. **Esquerda**: Logo (32px) + nome da unidade (text-sm truncate, max-w-[100px])
2. **Centro-direita**: Badge de pontos clicavel (navega para /ranking) com estrela + numero
3. **Direita**: Chat icon + Bell icon + mini RankedAvatar (28px, navega para /profile/me)

### Elementos realocados:
1. **ThemeToggle** - adicionado ao App Launcher overlay (abaixo do perfil do usuario)
2. **Seletor de Unidade** - adicionado ao App Launcher overlay (abaixo do ThemeToggle, so aparece se units.length > 1)

### Estilo:
- Manter `h-14`, `bg-card`, `border-b border-border/20`
- Badge de pontos: `rounded-full bg-warning/10 border border-warning/20 px-2.5 py-1`
- Avatar: usar `RankedAvatar` com `size={28}` sem moldura elaborada
- Linha neon inferior mantida (`h-px bg-gradient-to-r`)

