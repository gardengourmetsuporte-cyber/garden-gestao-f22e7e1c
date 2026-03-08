

## Problema Identificado

A página `/invite` está definida em `PublicRoutes` **fora** do `AuthenticatedApp`:

```
App
└── PublicRoutes
    ├── /invite → Invite ❌ (usa useAuth e useUnit, mas não tem os providers)
    └── /* → AuthenticatedApp
              └── AuthProvider
                  └── UnitProvider
                      └── Routes protegidas
```

O componente `Invite.tsx` faz:
```tsx
const { user } = useAuth();       // ❌ Sem AuthProvider
const { refetchUnits } = useUnit(); // ❌ Sem UnitProvider
```

Quando o hook é chamado sem o provider correspondente, o contexto retorna `undefined` e a aplicação crasha silenciosamente → tela preta.

## Solução

Envolver a rota `/invite` com os providers necessários:

### Arquivo: `src/App.tsx`

Criar um wrapper para rotas públicas que precisam de contexto de autenticação:

```tsx
function PublicWithAuth({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <UnitProvider>
        {children}
      </UnitProvider>
    </AuthProvider>
  );
}
```

E alterar a rota `/invite`:

```tsx
<Route path="/invite" element={
  <PublicWithAuth>
    <Invite />
  </PublicWithAuth>
} />
```

Isso mantém a rota pública (sem ProtectedRoute), mas fornece os contextos que o componente precisa para funcionar.

## Arquivos a modificar

| Arquivo | Mudança |
|---|---|
| `src/App.tsx` | Criar wrapper `PublicWithAuth` e aplicar na rota `/invite` |

