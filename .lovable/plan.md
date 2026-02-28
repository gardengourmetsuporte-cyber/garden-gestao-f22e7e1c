

## Diagnóstico

O bug de "abrir-sumir-abrir de novo" tem duas causas raiz no componente `PageTransition`:

1. **`key={location.pathname}`** na div wrapper força o React a desmontar e remontar todo o conteúdo da página a cada navegação. Isso mata Sheets/Drawers abertos e faz elementos piscarem.

2. **Dois `useEffect` concorrentes** ambos atualizando `displayChildren` — um para mudança de rota e outro para mudança de children na mesma rota. Isso causa renderizações duplas onde o conteúdo aparece, some, e reaparece.

3. **Estado `displayChildren` desnecessário** — manter children em state cria uma camada extra de re-renders que propaga flickers por todo o sistema (Sheets, Drawers, modais).

## Plano

### 1. Simplificar o PageTransition radicalmente

Remover o estado `displayChildren` e a lógica de `key` que força remount. Renderizar `children` diretamente e aplicar a animação de opacidade apenas via uma classe CSS transitória que é adicionada brevemente na mudança de rota:

```tsx
export function PageTransition({ children, className }: PageTransitionProps) {
  const location = useLocation();
  const [animClass, setAnimClass] = useState('');
  const prevPathRef = useRef(location.pathname);

  useEffect(() => {
    if (prevPathRef.current === location.pathname) return;
    prevPathRef.current = location.pathname;
    
    setAnimClass('page-enter-fade');
    const timer = setTimeout(() => setAnimClass(''), 300);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <div className={cn(animClass, className)}>
      {children}
    </div>
  );
}
```

Mudanças-chave:
- Remove `key={location.pathname}` (não remonta mais a árvore inteira)
- Remove estado `displayChildren` (sem renderizações fantasma)
- Remove o segundo `useEffect` concorrente
- A classe de animação é aplicada temporariamente e removida após 300ms

### 2. Manter o CSS existente como está

As keyframes `pageEnterFade` com apenas opacity já estão corretas e não precisam de alteração.

**Arquivo afetado:** `src/components/layout/PageTransition.tsx`

