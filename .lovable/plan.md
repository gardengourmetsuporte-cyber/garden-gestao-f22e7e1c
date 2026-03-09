

## Plano: Sistema Unificado de Login + Pontos de Bônus para Tablet e Cardápio Digital

### Objetivo
Permitir que clientes peçam como convidados (sem login) ou façam login rápido (Google/e-mail) tanto no tablet quanto no cardápio digital. Clientes que se cadastram ganham pontos de bônus automáticos e são registrados no CRM.

### Mudanças

**1. Componente `CustomerAuthBanner` (novo)**
- Banner promocional reutilizável: "Cadastre-se e ganhe X pontos para usar na loja!"
- Botões de login rápido (Google + e-mail) inline
- Busca a regra de bônus de cadastro da tabela `loyalty_rules` (novo tipo `signup_bonus`) ou usa valor fixo configurável na `store_info`
- Usado tanto no TabletMenuCart quanto no checkout do cardápio digital

**2. Tablet — `TabletDigitalMenu.tsx` e `TabletMenuCart.tsx`**
- Adicionar estado de auth (customer user) no TabletDigitalMenu, replicando o padrão do DigitalMenu
- No `TabletMenuCart`, mostrar dois modos no checkout:
  - **Convidado**: Mesa + Nome (como hoje, sem mudanças)
  - **Logado**: Dados pré-preenchidos do perfil, acumula pontos
- Exibir o `CustomerAuthBanner` acima dos campos do carrinho quando o usuário não está logado
- Ao fazer login, chamar `upsert_menu_customer` RPC para registrar no CRM automaticamente

**3. Cardápio Digital — `DigitalMenu.tsx`**
- Já tem auth implementado — adicionar o banner promocional de pontos no checkout (MenuCart) quando não logado
- Garantir que o fluxo de `ensureCustomerRecord` está unificado com o tablet

**4. Migração DB: Bonus de cadastro**
- Adicionar campo `signup_bonus_points` (integer, default 0) na `store_info` JSON da tabela `units`, ou criar entrada na `loyalty_rules` com tipo `signup_bonus`
- Criar função RPC `grant_signup_bonus` que:
  1. Verifica se o cliente já recebeu bônus de cadastro (flag no customer ou loyalty_events)
  2. Se não, insere um `loyalty_event` tipo `signup_bonus` e incrementa `loyalty_points` no customer
- Trigger: chamada após `upsert_menu_customer` quando é um INSERT (novo cliente)

**5. Componente `MenuCustomerAuth` — reutilização**
- Já existe e funciona bem — será reutilizado no tablet
- Adicionar prop opcional `bonusPoints` para exibir a promoção de pontos na tela de auth

### Fluxo do Usuário

```text
Tablet/Cardápio → Adiciona itens → Abre carrinho
                                      ├─ Não logado: Vê banner "Ganhe X pontos!"
                                      │   ├─ Login Google (1 tap) → Perfil auto-criado no CRM
                                      │   ├─ Login e-mail → Perfil auto-criado no CRM  
                                      │   └─ "Continuar sem conta" → Pede com nome/mesa
                                      └─ Logado: Dados pré-preenchidos, acumula pontos
```

### Arquivos a Criar/Editar
| Arquivo | Ação |
|---|---|
| `src/components/digital-menu/CustomerAuthBanner.tsx` | Criar — banner promo com login inline |
| `src/pages/TabletDigitalMenu.tsx` | Editar — adicionar estado de auth |
| `src/components/digital-menu/TabletMenuCart.tsx` | Editar — integrar auth + banner |
| `src/components/digital-menu/MenuCustomerAuth.tsx` | Editar — adicionar prop bonusPoints |
| `src/pages/DigitalMenu.tsx` | Editar — adicionar banner no checkout |
| Migração SQL | Criar — RPC `grant_signup_bonus` + coluna/config de bônus |

