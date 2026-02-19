

# Login Social: Google + Apple

Adicionar botoes "Entrar com Google" e "Entrar com Apple" na tela de autenticacao, usando o sistema gerenciado do Lovable Cloud.

---

## O que sera feito

### 1. Configurar os provedores OAuth
- Ativar Google e Apple Sign-In via ferramenta de configuracao do Cloud
- Isso gera automaticamente o modulo `src/integrations/lovable/` com a funcao `lovable.auth.signInWithOAuth`

### 2. Atualizar a tela de login (`src/pages/Auth.tsx`)
- Adicionar dois botoes estilizados abaixo do formulario de login/cadastro:
  - **"Entrar com Google"** com icone do Google
  - **"Entrar com Apple"** com icone da Apple
- Separador visual "ou" entre o formulario e os botoes sociais
- Ambos os botoes chamam `lovable.auth.signInWithOAuth("google"/"apple")`
- Redirecionam de volta para a origem (`window.location.origin`)

### 3. Atualizar o PWA (`vite.config.ts`)
- Adicionar `/~oauth` ao `navigateFallbackDenylist` do service worker para que o redirecionamento OAuth nunca seja interceptado pelo cache

---

## Secao Tecnica

### Codigo dos botoes (resumo):
```typescript
import { lovable } from "@/integrations/lovable/index";

const handleGoogleLogin = async () => {
  await lovable.auth.signInWithOAuth("google", {
    redirect_uri: window.location.origin,
  });
};

const handleAppleLogin = async () => {
  await lovable.auth.signInWithOAuth("apple", {
    redirect_uri: window.location.origin,
  });
};
```

### PWA fix:
```typescript
workbox: {
  navigateFallbackDenylist: [/^\/~oauth/],
  // ... resto da config
}
```

### Arquivos envolvidos:
- `src/integrations/lovable/` (gerado automaticamente pela ferramenta)
- `src/pages/Auth.tsx` (botoes Google + Apple)
- `vite.config.ts` (denylist OAuth no PWA)

### Estilo dos botoes:
- Mesma estetica glassmorphism da tela atual
- Icones SVG inline do Google e Apple
- Hover com escala sutil e glow consistente com o design "Dark Command Center"
