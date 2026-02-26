

## Problema
O dashboard do funcionário está visualmente desalinhado do padrão premium do app: ícones azuis chapados, layout genérico, cards sem gradientes, e a disposição não é útil nem bonita.

## Correções

### 1. Hero Card do Funcionário (substituir welcome plain)
- Substituir o `card-surface` de boas-vindas por um hero card com classe `gradient-primary` (mesmo estilo do card financeiro do admin), exibindo:
  - Saudação dinâmica (Bom dia/Boa tarde/Boa noite) + nome
  - Score mensal em destaque grande
  - Posição no ranking como badge discreto
  - Data atual formatada

### 2. Quick Links modernizados
- Substituir os ícones `bg-primary/10 text-primary` por ícones com fundo `bg-secondary` e usar cores contextuais por módulo (laranja para checklists, verde para estoque, etc.)
- Reduzir para um layout mais compacto horizontal com ícones menores e labels condensados
- Usar Material Symbols com `fill=1` nos ícones dos quick links para visual sólido

### 3. MyRankCard integrado ao hero
- Mover as informações de pontos (Base, Bônus, Saldo) do MyRankCard para dentro do hero card como uma row de stats (similar ao `UserPointsCard`)
- Manter o avatar com rank frame e a barra de progresso para próximo elo logo abaixo do hero
- Eliminar card separado redundante

### 4. Seção de Ranking simplificada
- Manter as tabs (Ranking/Elos/Medalhas) e o scope toggle como estão - já seguem o padrão
- Remover animação `spring-stagger-3` duplicada (aparece 2x)

### Arquivos editados
- `src/components/dashboard/EmployeeDashboard.tsx` — reestruturar layout completo

