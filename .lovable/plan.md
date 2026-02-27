

## Diagnóstico: Ícones renderizando como texto nos cards de setor

O problema visível no screenshot é que os ícones Material Symbols estão sendo renderizados como texto bruto (ex: "storefront" aparece como "ARMQ" atrás do card "Salão"). Isso acontece quando a fonte Material Symbols Rounded ainda não carregou — o browser exibe o nome do ícone como texto normal.

O `display=block` no link da fonte deveria bloquear a renderização até o carregamento, mas em conexões lentas ou em certos browsers isso falha.

### Correção

#### 1. `src/index.css` — Ocultar ícones até a fonte carregar
Adicionar regra CSS que esconde o texto dos ícones Material Symbols enquanto a fonte não estiver carregada, usando `document.fonts.ready`:

```css
/* Hide material symbols text until font is loaded */
.material-symbols-rounded {
  overflow: hidden;
  max-width: 1em;
  max-height: 1em;
  display: inline-block;
}
```

#### 2. `index.html` — Trocar `display=block` para `display=swap` + preload
- Adicionar `<link rel="preload">` para a fonte Material Symbols com `as="style"`
- Usar `display=swap` ao invés de `display=block` para melhor experiência (a fonte já está sendo preloaded)

#### 3. `src/components/ui/app-icon.tsx` — Adicionar overflow hidden
- Garantir que o `<span>` do ícone tenha `overflow: hidden`, `width` e `height` fixos baseados no `size`, impedindo que o texto vaze visualmente mesmo se a fonte não carregou

### Resultado
Os ícones ficam invisíveis (em vez de mostrar texto bugado) até a fonte carregar, e quando carrega renderizam normalmente.

