

## Diagnóstico: Dois Sistemas Separados

Os cadeados que voce ve em "Fechamento" e "Recompensas" NAO sao do sistema de niveis de acesso. Sao bloqueios de **plano de assinatura** (Free/Pro/Business).

Existem dois sistemas independentes:

1. **Niveis de Acesso** (Configuracoes > Equipe > aba "Niveis de Acesso") — controla quais modulos aparecem/somem no menu. "Acesso completo" = todos os modulos visiveis. Isso esta funcionando corretamente.

2. **Plano de assinatura** (Free/Pro/Business) — bloqueia modulos premium com o icone de diamante dourado. "Fechamento", "Recompensas", "Financeiro", "Fichas Tecnicas" etc exigem plano Pro. Funcionarios herdam o plano do dono da loja.

O que acontece: a loja esta no plano **Free**, entao mesmo com "acesso completo", os modulos Pro ficam bloqueados com cadeado. Isso e esperado — acesso completo libera visibilidade, mas o plano limita funcionalidade.

---

### Onde gerenciar niveis de acesso

**Configuracoes > Equipe > aba "Niveis de Acesso"**. La voce pode:
- Criar niveis customizados (ex: "Gerente Operacional") selecionando quais modulos ficam visiveis
- Atribuir niveis a cada usuario

---

### Melhoria de UX proposta

Para evitar essa confusao, posso melhorar a interface:

1. **`MoreDrawer.tsx`** — Diferenciar visualmente bloqueios de plano vs acesso. Modulos bloqueados por plano mostram "PRO" ou "BUSINESS" em amarelo. Modulos bloqueados por acesso simplesmente nao aparecem (ja funciona assim).

2. **`MoreDrawer.tsx`** — Quando o usuario clica num modulo bloqueado por plano, mostrar um toast explicativo ("Este modulo requer plano Pro. Fale com o administrador.") em vez de redirecionar direto para /plans (que nao faz sentido para funcionarios).

3. **`AccessLevelSettings.tsx`** — Adicionar um aviso visual nos modulos que exigem plano pago, para que o admin saiba que mesmo liberando no nivel de acesso, o plano precisa cobrir.

### Arquivos a modificar
| Arquivo | Mudanca |
|---------|---------|
| `src/components/layout/MoreDrawer.tsx` | Toast explicativo para funcionarios em modulos bloqueados por plano |
| `src/components/settings/AccessLevelSettings.tsx` | Badge "PRO"/"BUSINESS" ao lado dos modulos que exigem plano pago |

