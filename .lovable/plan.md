

## Plano: Pré-configuração completa para novos usuários

Todo o setup será feito na function SQL `auto_provision_unit`, garantindo que ao criar a empresa, o usuário já tenha tudo pronto.

---

### 1. Contas Financeiras (na `auto_provision_unit`)

Criar 2 contas padrão diretamente no banco ao provisionar a unidade:
- **Carteira** (wallet, cor azul, icon Wallet)
- **Banco** (bank, cor verde, icon Building2)

A inicialização JS (`initializeDefaultsCore`) continuará funcionando como fallback, mas o banco já terá as contas.

### 2. Categorias Financeiras (na `auto_provision_unit`)

Inserir as categorias de despesa e receita (com subcategorias) diretamente no SQL, seguindo o modelo já definido em `DEFAULT_EXPENSE_CATEGORIES` e `DEFAULT_INCOME_CATEGORIES`:

**Despesas (8 categorias pai + subcategorias):**
- Matéria-prima (Carnes, Frios, Bebidas, Panificação, Hortifruti, Mercado, Embalagens)
- Despesas Administrativas (Energia, Água, Aluguel, Limpeza, Internet, Telefone)
- Folha de Pagamento (Salários, FGTS, INSS, 13º, Férias)
- Pró-labore
- Taxas Operacionais (App Delivery, PDV, Tarifa Bancária, Maquininha)
- Impostos (DAS, IPTU, Alvará, Outros)
- Financiamentos
- Investimentos (Equipamentos, Marketing, Reformas)

**Receitas (3 categorias pai + subcategorias):**
- Vendas Balcão (Dinheiro, Débito, Crédito, Pix)
- Vendas Delivery (iFood, Rappi, Próprio)
- Outros

### 3. Produtos de Estoque Pré-configurados (na `auto_provision_unit`)

Inserir ~40 itens comuns em restaurantes/hamburguerias/pizzarias nas categorias já criadas:

| Categoria | Produtos |
|-----------|----------|
| Carnes | Picanha, Contra-filé, Alcatra, Fraldinha, Costela, Carne moída, Linguiça |
| Aves | Peito de frango, Coxa/Sobrecoxa, Filé de frango |
| Frios e Embutidos | Presunto, Mussarela, Bacon, Calabresa |
| Bebidas | Coca-Cola 2L, Guaraná 2L, Água mineral, Suco natural |
| Bebidas Alcoólicas | Cerveja lata, Cerveja long neck |
| Hortifruti | Tomate, Cebola, Alface, Batata, Limão, Alho |
| Laticínios | Leite integral, Creme de leite, Manteiga, Requeijão |
| Mercearia | Arroz 5kg, Feijão 1kg, Óleo soja, Açúcar, Sal, Farinha trigo |
| Pães e Massas | Pão francês, Pão de hambúrguer, Massa pizza |
| Molhos e Temperos | Ketchup, Mostarda, Maionese, Molho de tomate, Azeite |
| Descartáveis | Copo descartável 300ml, Guardanapo, Embalagem marmitex |
| Limpeza | Detergente, Água sanitária, Esponja |

### 4. Checklist Padrão Completo (na `auto_provision_unit`)

Criar setores, subcategorias e itens para abertura e fechamento:

**Setor: Cozinha** (cor #ef4444, icon Flame)
- Sub: Equipamentos
  - [abertura] Ligar fogão e fornos
  - [abertura] Verificar temperatura das geladeiras
  - [abertura] Ligar chapas e fritadeiras
  - [fechamento] Desligar fogão e fornos
  - [fechamento] Limpar chapas e fritadeiras
  - [fechamento] Verificar temperatura das geladeiras
- Sub: Higiene
  - [abertura] Higienizar bancadas e superfícies
  - [abertura] Verificar lixeiras limpas
  - [fechamento] Lavar e sanitizar bancadas
  - [fechamento] Retirar lixo da cozinha
  - [fechamento] Limpar piso da cozinha

**Setor: Salão** (cor #3b82f6, icon Armchair)
- Sub: Ambiente
  - [abertura] Ligar ar-condicionado/ventiladores
  - [abertura] Verificar iluminação
  - [abertura] Organizar mesas e cadeiras
  - [fechamento] Desligar ar-condicionado
  - [fechamento] Limpar mesas e cadeiras
  - [fechamento] Varrer e passar pano no salão
- Sub: Atendimento
  - [abertura] Preparar cardápios nas mesas
  - [abertura] Abastecer porta-guardanapos
  - [fechamento] Recolher cardápios
  - [fechamento] Reabastecer molheiras e sachês

**Setor: Estoque** (cor #22c55e, icon Package)
- Sub: Conferência
  - [abertura] Conferir validade dos produtos
  - [abertura] Verificar itens em estoque mínimo
  - [fechamento] Registrar produtos que acabaram
  - [fechamento] Organizar câmara fria

**Setor: Caixa** (cor #f59e0b, icon DollarSign)
- Sub: Financeiro
  - [abertura] Conferir troco inicial
  - [abertura] Ligar máquinas de cartão
  - [abertura] Verificar bobina de impressora
  - [fechamento] Fechar caixa do dia
  - [fechamento] Conferir sangrias e suprimentos
  - [fechamento] Guardar dinheiro no cofre

**Setor: Fachada e Externos** (cor #8b5cf6, icon Store)
- Sub: Estrutura
  - [abertura] Abrir portas e portões
  - [abertura] Ligar letreiro/luminoso
  - [abertura] Verificar limpeza da calçada
  - [fechamento] Fechar portas e portões
  - [fechamento] Desligar letreiro
  - [fechamento] Verificar fechamento de janelas

---

### Alterações

#### Migration SQL
- Expandir `auto_provision_unit` para incluir:
  1. 2 contas financeiras (Carteira + Banco)
  2. 11 categorias financeiras pai + subcategorias
  3. ~40 produtos de estoque vinculados às categorias
  4. 5 setores de checklist com subcategorias e ~35 itens (abertura + fechamento)
- Tudo condicionado a `NOT EXISTS` para não duplicar em unidades existentes

#### `src/hooks/useFinanceCore.ts`
- Ajustar `initializeDefaultsCore` para também criar conta "Banco" quando não houver contas (atualmente só cria "Carteira")

