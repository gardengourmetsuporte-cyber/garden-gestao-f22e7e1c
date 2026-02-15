

# Bordas Estilo League of Legends - Molduras Decorativas por Rank

## Problema Atual

As bordas atuais sao apenas circulos coloridos com efeitos de glow/shadow. Todos os ranks parecem visualmente semelhantes -- um circulo com brilho. Isso nao traz identidade unica por rank como no League of Legends, onde cada elo tem uma **moldura decorativa completamente diferente**.

## Inspiracao: League of Legends

No LoL, cada elo tem uma **silhueta propria**:
- **Ferro/Bronze**: moldura simples, metalica
- **Prata/Ouro**: ornamentos laterais, detalhes dourados
- **Platina/Esmeralda**: asas pequenas, brilho cristalino
- **Diamante/Mestre**: asas elaboradas, particulas flutuantes
- **Grao-Mestre/Desafiante**: moldura massiva com animacoes complexas

## Solucao

Substituir os circulos de glow por **molduras SVG decorativas** unicas para cada rank, com elementos ornamentais (asas, escudos, espinhos, cristais) e animacoes proprias.

---

## Design por Rank

| Rank | Moldura | Elementos Decorativos | Animacao |
|------|---------|----------------------|----------|
| **Iniciante** | Circulo fino simples, cinza | Nenhum | Nenhuma |
| **Aprendiz** | Arco com pequenas folhas nas laterais | 2 folhas verdes SVG | Glow suave pulsante |
| **Dedicado** | Escudo hexagonal com bordas ciano | Pontas superiores luminosas | Pulse nas pontas |
| **Veterano** | Moldura com 2 asas pequenas laterais | Asas roxas estilizadas | Asas pulsam suavemente |
| **Mestre** | Escudo dourado com coroa superior | Coroa + particulas orbitando | Particulas + brilho da coroa |
| **Lenda** | Moldura flamejante com espinhos | Chamas SVG animadas nos lados | Chamas ondulando (wave path) |
| **Mitico** | Asas grandes com halo superior | Asas arco-iris + halo rotativo | Gradient rotativo + asas pulsando |
| **Imortal** | Moldura cristalina com asas de diamante e aura | Cristais flutuantes + asas prismaticas | Multi-layer: rotacao + shimmer + particulas |

---

## Implementacao Tecnica

### Arquitetura: SVG Inline por Rank

Cada rank tera um componente SVG dedicado que envolve o avatar circular. O SVG contem:
- **Moldura base** (path decorativo ao redor do circulo)
- **Ornamentos** (asas, coroa, espinhos, cristais como paths SVG)
- **Efeitos animados** (filtros SVG de glow, animacoes CSS nos paths)

```text
+-- Container (relative, size based) --+
|                                       |
|   +-- SVG Frame (absolute, full) --+  |
|   |   paths decorativos            |  |
|   |   ornamentos (asas, coroa)     |  |
|   +--------------------------------+  |
|                                       |
|   +-- Avatar Circle (centered) ----+  |
|   |   foto ou fallback             |  |
|   +--------------------------------+  |
|                                       |
|   +-- Particle Layer (absolute) ---+  |
|   |   particulas animadas          |  |
|   +--------------------------------+  |
+---------------------------------------+
```

### Arquivos a criar:
- `src/components/profile/rank-frames/` -- pasta com SVGs de moldura por rank
  - `InitianteFrame.tsx` -- circulo simples
  - `AprendizFrame.tsx` -- arco com folhas
  - `DedicadoFrame.tsx` -- escudo hexagonal
  - `VeteranoFrame.tsx` -- asas pequenas
  - `MestreFrame.tsx` -- escudo com coroa
  - `LendaFrame.tsx` -- moldura flamejante
  - `MiticoFrame.tsx` -- asas grandes + halo
  - `ImortalFrame.tsx` -- cristais + asas de diamante
  - `index.ts` -- export centralizado com mapeamento rank -> frame

### Arquivos a editar:
- `src/components/profile/RankedAvatar.tsx` -- refatorar completamente para usar os frame SVGs em vez de bordas CSS circulares. O avatar fica no centro e o frame SVG envolve com a moldura decorativa
- `src/index.css` -- substituir as animacoes de ranked-avatar atuais por animacoes de SVG paths (wing-pulse, flame-wave, crystal-float, crown-glow, halo-rotate)
- `src/lib/ranks.ts` -- adicionar campo `frame` ao RankInfo para mapear qual moldura usar

### Detalhes dos SVGs

Cada frame SVG recebe `size` como prop e escala proporcionalmente. O avatar circular fica centralizado com `clipPath` circular. Os ornamentos SVG usam:

- `stroke-dasharray` + `stroke-dashoffset` animados para efeito de "desenhar" a borda
- `filter: drop-shadow()` para glow nos ornamentos
- CSS animations nos paths individuais (ex: asas pulsam com `transform: scaleY()`)
- Gradientes SVG animados para efeitos metalicos/prismaticos

### Exemplos de animacao:
- **Asas (Veterano/Mitico)**: `transform: scaleY(0.95) -> scaleY(1.05)` em loop suave
- **Chamas (Lenda)**: paths com `d` animado via CSS ou `transform: translateY()` alternado
- **Coroa (Mestre)**: brilho intermitente com `opacity` + `filter: brightness()`
- **Cristais (Imortal)**: rotacao lenta individual + flutuacao vertical
- **Halo (Mitico)**: `transform: rotate()` continuo no circulo superior

### Proporcoes

O frame SVG sera ~40% maior que o avatar para acomodar ornamentos:
- Avatar de 40px -> Frame de 56px (container)
- Avatar de 96px (perfil) -> Frame de 134px
- Os ornamentos (asas, coroa) estendem alem do circulo base

### Sem mudancas no banco de dados
Tudo e puramente visual/CSS/SVG no frontend.

