
# Corrigir elemento visual passando por trás da barra de cabeçalho

## Problema
O cabeçalho de página (`page-header-bar`) usa fundo semi-transparente (`bg-card/80`), permitindo que conteúdo da página apareça por trás quando o usuário rola. Isso causa o efeito indesejado do logotipo/conteúdo passando por trás da barra.

## Solução
Tornar o fundo do `page-header-bar` totalmente opaco para que nenhum conteúdo passe por trás dele ao rolar.

## Mudança

| Arquivo | Descrição |
|---|---|
| `src/index.css` | Alterar `bg-card/80` para `bg-card` no `.page-header-bar`, mantendo o backdrop-blur como fallback |

A classe `.page-header-bar` (linha 228) será atualizada de:
```text
bg-card/80 backdrop-blur-2xl
```
Para:
```text
bg-card backdrop-blur-2xl
```

Isso resolve o problema em todas as páginas que usam esse cabeçalho (Checklists, Inventário, etc.) de uma só vez.
