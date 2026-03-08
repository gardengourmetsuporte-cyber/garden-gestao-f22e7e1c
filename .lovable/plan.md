

## Problema Identificado

O fluxo atual do cardápio digital tem vários problemas:

1. **Salvamento falhando**: O `ensureCustomerRecord` (linha 108-144) faz INSERT direto na tabela `customers` sem usar a RPC `upsert_menu_customer` (que foi criada justamente para contornar RLS). Isso causa o erro "Erro ao salvar dados".
2. **Fluxo de auth confuso**: Clicar em "Carrinho" ou "Conta" redireciona para uma tela de cadastro fullscreen que tira o usuário do contexto do cardápio.
3. **Tema inconsistente**: A tela de auth (`MenuCustomerAuth`) usa tema branco fixo (`bg-white`), diferente do tema do sistema (`bg-background`).
4. **Sem acesso rápido ao perfil**: Não há ícone de perfil/login no header da tela principal.

## Plano de Refatoração

### 1. Corrigir salvamento de dados do cliente
- Em `DigitalMenu.tsx`, substituir o `ensureCustomerRecord` (que faz INSERT direto) pela RPC `upsert_menu_customer` que já existe e contorna o RLS.
- Em `MenuAccount.tsx`, substituir o `update` direto (linha 144-152) pela mesma RPC.

### 2. Remover gate de auth obrigatório na entrada
- Eliminar a tela de boas-vindas `MenuCustomerAuth` como gate inicial. O usuário entra direto no cardápio.
- O carrinho e a conta funcionam sem login (carrinho mostra itens, conta mostra botão "Entrar").

### 3. Adicionar ícone de perfil/login no header do cardápio
- No `MenuLanding`, adicionar um ícone no canto superior direito:
  - Se logado: avatar com iniciais do usuário (clica → vai para aba "account")
  - Se não logado: ícone de "Person" com label "Entrar" (clica → abre modal de login)

### 4. Converter auth para modal/sheet em vez de tela fullscreen
- Transformar `MenuCustomerAuth` em um sheet/modal que aparece sobre o cardápio, sem tirar o contexto.
- O mesmo para `MenuCustomerProfile` (cadastro complementar).

### 5. Padronizar tema de todas as telas
- `MenuCustomerAuth`: trocar `bg-white` por `bg-background`, `text-gray-900` por `text-foreground`, etc.
- `MenuCustomerProfile`: mesma padronização.
- Usar tokens semânticos do design system em vez de cores hardcoded.

### 6. Remover aba "Conta" do bottom nav, substituir por acesso via header
- Bottom nav fica: Início, Cardápio, Pedido, Roleta (4 tabs).
- Perfil/conta é acessado pelo ícone no header superior direito.

### 7. Preparar estrutura de pontos/cashback no perfil
- Na tela de perfil (`MenuAccount`), manter e destacar o card de pontos de fidelidade já existente.
- Adicionar seção "Cashback" com saldo de pontos convertíveis e um futuro botão "Trocar pontos" (inicialmente desabilitado, com label "Em breve").

## Arquivos a modificar

| Arquivo | Mudança |
|---|---|
| `src/pages/DigitalMenu.tsx` | Remover gate de auth, corrigir `ensureCustomerRecord` com RPC, adicionar header com ícone de perfil, converter auth para modal |
| `src/components/digital-menu/MenuCustomerAuth.tsx` | Converter para modal/sheet, padronizar tema |
| `src/components/digital-menu/MenuCustomerProfile.tsx` | Converter para modal/sheet, padronizar tema |
| `src/components/digital-menu/MenuAccount.tsx` | Usar RPC para update, adicionar seção cashback |
| `src/components/digital-menu/MenuBottomNav.tsx` | Remover aba "Conta", manter 4 tabs |
| `src/components/digital-menu/MenuLanding.tsx` | Adicionar ícone de perfil/login no canto superior direito |

