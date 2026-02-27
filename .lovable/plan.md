

## Plano: Animação de saída ao fazer logout

### Problema
Quando o usuário clica em "Sair", o `signOut()` aguarda a resposta do backend enquanto o menu lateral/bottom bar ficam visíveis e travados. Só depois do `navigate('/auth')` a tela muda.

### Solução
Adicionar um estado `isSigningOut` no `AppLayoutContent` que, ao ser ativado, imediatamente esconde todo o layout e mostra o `PageLoader` (com o logo) com uma animação de fade. O navigate acontece em background.

### Alterações

#### 1. `src/components/layout/AppLayout.tsx`
- Adicionar `const [isSigningOut, setIsSigningOut] = useState(false)`
- No `handleSignOut`: setar `setIsSigningOut(true)` **antes** de chamar `signOut()` e `navigate`
- No return do componente: se `isSigningOut`, renderizar `<PageLoader />` com `animate-fade-in` ao invés do layout completo
- O fluxo fica: clicou Sair → tela mostra loader com logo instantaneamente → signOut roda em background → navega para /auth

