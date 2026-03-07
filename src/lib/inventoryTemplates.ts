// Inventory sector templates for quick stock setup

export interface InventoryTemplate {
  id: string;
  name: string;
  icon: string;
  description: string;
  categories: {
    name: string;
    color: string;
    icon: string;
    items: { name: string; unit_type: 'unidade' | 'kg' | 'litro'; min_stock: number }[];
  }[];
}

export const INVENTORY_TEMPLATES: InventoryTemplate[] = [
  {
    id: 'restaurante',
    name: 'Restaurante',
    icon: 'UtensilsCrossed',
    description: 'Carnes, hortifruti, bebidas, mercearia e mais',
    categories: [
      {
        name: 'Carnes', color: '#ef4444', icon: 'Beef',
        items: [
          { name: 'Picanha', unit_type: 'kg', min_stock: 5 },
          { name: 'Contra-filé', unit_type: 'kg', min_stock: 5 },
          { name: 'Alcatra', unit_type: 'kg', min_stock: 5 },
          { name: 'Fraldinha', unit_type: 'kg', min_stock: 3 },
          { name: 'Costela', unit_type: 'kg', min_stock: 5 },
          { name: 'Carne moída', unit_type: 'kg', min_stock: 5 },
          { name: 'Linguiça', unit_type: 'kg', min_stock: 3 },
        ],
      },
      {
        name: 'Aves', color: '#f97316', icon: 'Drumstick',
        items: [
          { name: 'Peito de frango', unit_type: 'kg', min_stock: 5 },
          { name: 'Coxa/Sobrecoxa', unit_type: 'kg', min_stock: 5 },
          { name: 'Filé de frango', unit_type: 'kg', min_stock: 3 },
        ],
      },
      {
        name: 'Frios e Embutidos', color: '#e11d48', icon: 'Sandwich',
        items: [
          { name: 'Presunto', unit_type: 'kg', min_stock: 2 },
          { name: 'Mussarela', unit_type: 'kg', min_stock: 3 },
          { name: 'Bacon', unit_type: 'kg', min_stock: 2 },
          { name: 'Calabresa', unit_type: 'kg', min_stock: 2 },
        ],
      },
      {
        name: 'Bebidas', color: '#3b82f6', icon: 'Wine',
        items: [
          { name: 'Coca-Cola 2L', unit_type: 'unidade', min_stock: 10 },
          { name: 'Guaraná 2L', unit_type: 'unidade', min_stock: 10 },
          { name: 'Água mineral', unit_type: 'unidade', min_stock: 20 },
          { name: 'Suco natural', unit_type: 'litro', min_stock: 5 },
        ],
      },
      {
        name: 'Bebidas Alcoólicas', color: '#6366f1', icon: 'Beer',
        items: [
          { name: 'Cerveja lata', unit_type: 'unidade', min_stock: 24 },
          { name: 'Cerveja long neck', unit_type: 'unidade', min_stock: 12 },
        ],
      },
      {
        name: 'Hortifruti', color: '#22c55e', icon: 'Salad',
        items: [
          { name: 'Tomate', unit_type: 'kg', min_stock: 5 },
          { name: 'Cebola', unit_type: 'kg', min_stock: 5 },
          { name: 'Alface', unit_type: 'unidade', min_stock: 10 },
          { name: 'Batata', unit_type: 'kg', min_stock: 10 },
          { name: 'Limão', unit_type: 'kg', min_stock: 3 },
          { name: 'Alho', unit_type: 'kg', min_stock: 1 },
        ],
      },
      {
        name: 'Laticínios', color: '#f59e0b', icon: 'Milk',
        items: [
          { name: 'Leite integral', unit_type: 'litro', min_stock: 10 },
          { name: 'Creme de leite', unit_type: 'unidade', min_stock: 5 },
          { name: 'Manteiga', unit_type: 'unidade', min_stock: 3 },
          { name: 'Requeijão', unit_type: 'unidade', min_stock: 3 },
        ],
      },
      {
        name: 'Mercearia', color: '#a855f7', icon: 'ShoppingBasket',
        items: [
          { name: 'Arroz 5kg', unit_type: 'unidade', min_stock: 3 },
          { name: 'Feijão 1kg', unit_type: 'unidade', min_stock: 5 },
          { name: 'Óleo soja', unit_type: 'unidade', min_stock: 5 },
          { name: 'Açúcar', unit_type: 'kg', min_stock: 5 },
          { name: 'Sal', unit_type: 'kg', min_stock: 2 },
          { name: 'Farinha de trigo', unit_type: 'kg', min_stock: 5 },
        ],
      },
      {
        name: 'Pães e Massas', color: '#d97706', icon: 'Croissant',
        items: [
          { name: 'Pão francês', unit_type: 'unidade', min_stock: 50 },
          { name: 'Pão de hambúrguer', unit_type: 'unidade', min_stock: 30 },
          { name: 'Massa de pizza', unit_type: 'unidade', min_stock: 10 },
        ],
      },
      {
        name: 'Molhos e Temperos', color: '#84cc16', icon: 'Flame',
        items: [
          { name: 'Ketchup', unit_type: 'unidade', min_stock: 3 },
          { name: 'Mostarda', unit_type: 'unidade', min_stock: 3 },
          { name: 'Maionese', unit_type: 'unidade', min_stock: 3 },
          { name: 'Molho de tomate', unit_type: 'unidade', min_stock: 5 },
          { name: 'Azeite', unit_type: 'unidade', min_stock: 2 },
        ],
      },
      {
        name: 'Descartáveis', color: '#8b5cf6', icon: 'Package',
        items: [
          { name: 'Copo descartável 300ml', unit_type: 'unidade', min_stock: 100 },
          { name: 'Guardanapo', unit_type: 'unidade', min_stock: 200 },
          { name: 'Embalagem marmitex', unit_type: 'unidade', min_stock: 50 },
        ],
      },
      {
        name: 'Limpeza', color: '#06b6d4', icon: 'SprayCan',
        items: [
          { name: 'Detergente', unit_type: 'unidade', min_stock: 5 },
          { name: 'Água sanitária', unit_type: 'unidade', min_stock: 3 },
          { name: 'Esponja', unit_type: 'unidade', min_stock: 10 },
        ],
      },
    ],
  },
  {
    id: 'padaria',
    name: 'Padaria',
    icon: 'Croissant',
    description: 'Farinhas, fermentos, laticínios, recheios e confeitaria',
    categories: [
      {
        name: 'Farinhas e Grãos', color: '#d97706', icon: 'Wheat',
        items: [
          { name: 'Farinha de trigo', unit_type: 'kg', min_stock: 25 },
          { name: 'Farinha integral', unit_type: 'kg', min_stock: 5 },
          { name: 'Amido de milho', unit_type: 'kg', min_stock: 3 },
          { name: 'Polvilho', unit_type: 'kg', min_stock: 3 },
          { name: 'Aveia', unit_type: 'kg', min_stock: 2 },
        ],
      },
      {
        name: 'Fermentos e Aditivos', color: '#f59e0b', icon: 'FlaskConical',
        items: [
          { name: 'Fermento biológico seco', unit_type: 'kg', min_stock: 2 },
          { name: 'Fermento químico', unit_type: 'kg', min_stock: 2 },
          { name: 'Melhorador de farinha', unit_type: 'kg', min_stock: 1 },
          { name: 'Reforçador', unit_type: 'kg', min_stock: 1 },
        ],
      },
      {
        name: 'Açúcares e Doces', color: '#ec4899', icon: 'Candy',
        items: [
          { name: 'Açúcar refinado', unit_type: 'kg', min_stock: 10 },
          { name: 'Açúcar cristal', unit_type: 'kg', min_stock: 5 },
          { name: 'Açúcar de confeiteiro', unit_type: 'kg', min_stock: 3 },
          { name: 'Chocolate em pó', unit_type: 'kg', min_stock: 3 },
          { name: 'Leite condensado', unit_type: 'unidade', min_stock: 10 },
          { name: 'Goiabada', unit_type: 'kg', min_stock: 2 },
        ],
      },
      {
        name: 'Laticínios', color: '#f59e0b', icon: 'Milk',
        items: [
          { name: 'Leite integral', unit_type: 'litro', min_stock: 20 },
          { name: 'Manteiga', unit_type: 'kg', min_stock: 5 },
          { name: 'Margarina', unit_type: 'kg', min_stock: 5 },
          { name: 'Creme de leite', unit_type: 'unidade', min_stock: 10 },
          { name: 'Queijo mussarela', unit_type: 'kg', min_stock: 5 },
          { name: 'Requeijão', unit_type: 'unidade', min_stock: 5 },
        ],
      },
      {
        name: 'Ovos', color: '#fbbf24', icon: 'Egg',
        items: [
          { name: 'Ovos (caixa 30)', unit_type: 'unidade', min_stock: 3 },
        ],
      },
      {
        name: 'Frios e Recheios', color: '#e11d48', icon: 'Sandwich',
        items: [
          { name: 'Presunto', unit_type: 'kg', min_stock: 3 },
          { name: 'Frango desfiado', unit_type: 'kg', min_stock: 3 },
          { name: 'Carne seca', unit_type: 'kg', min_stock: 2 },
          { name: 'Calabresa', unit_type: 'kg', min_stock: 2 },
        ],
      },
      {
        name: 'Bebidas', color: '#3b82f6', icon: 'Wine',
        items: [
          { name: 'Café em pó', unit_type: 'kg', min_stock: 5 },
          { name: 'Suco pronto', unit_type: 'unidade', min_stock: 20 },
          { name: 'Refrigerante lata', unit_type: 'unidade', min_stock: 24 },
          { name: 'Água mineral', unit_type: 'unidade', min_stock: 20 },
        ],
      },
      {
        name: 'Embalagens', color: '#8b5cf6', icon: 'Package',
        items: [
          { name: 'Saco de pão', unit_type: 'unidade', min_stock: 500 },
          { name: 'Caixa para bolo', unit_type: 'unidade', min_stock: 20 },
          { name: 'Embalagem para salgado', unit_type: 'unidade', min_stock: 100 },
        ],
      },
      {
        name: 'Limpeza', color: '#06b6d4', icon: 'SprayCan',
        items: [
          { name: 'Detergente', unit_type: 'unidade', min_stock: 5 },
          { name: 'Água sanitária', unit_type: 'unidade', min_stock: 3 },
          { name: 'Pano de limpeza', unit_type: 'unidade', min_stock: 10 },
        ],
      },
    ],
  },
  {
    id: 'bar',
    name: 'Bar / Pub',
    icon: 'Beer',
    description: 'Destilados, cervejas, coquetéis, petiscos',
    categories: [
      {
        name: 'Cervejas', color: '#f59e0b', icon: 'Beer',
        items: [
          { name: 'Cerveja lata', unit_type: 'unidade', min_stock: 48 },
          { name: 'Cerveja long neck', unit_type: 'unidade', min_stock: 24 },
          { name: 'Cerveja 600ml', unit_type: 'unidade', min_stock: 24 },
          { name: 'Cerveja artesanal', unit_type: 'unidade', min_stock: 12 },
          { name: 'Chopp (barril)', unit_type: 'unidade', min_stock: 2 },
        ],
      },
      {
        name: 'Destilados', color: '#8b5cf6', icon: 'Wine',
        items: [
          { name: 'Vodka', unit_type: 'unidade', min_stock: 3 },
          { name: 'Whisky', unit_type: 'unidade', min_stock: 2 },
          { name: 'Gin', unit_type: 'unidade', min_stock: 3 },
          { name: 'Rum', unit_type: 'unidade', min_stock: 2 },
          { name: 'Tequila', unit_type: 'unidade', min_stock: 2 },
          { name: 'Cachaça', unit_type: 'unidade', min_stock: 3 },
        ],
      },
      {
        name: 'Insumos para Drinks', color: '#06b6d4', icon: 'GlassWater',
        items: [
          { name: 'Água tônica', unit_type: 'unidade', min_stock: 24 },
          { name: 'Energético', unit_type: 'unidade', min_stock: 12 },
          { name: 'Suco de limão', unit_type: 'litro', min_stock: 3 },
          { name: 'Xarope de açúcar', unit_type: 'litro', min_stock: 2 },
          { name: 'Leite condensado', unit_type: 'unidade', min_stock: 5 },
          { name: 'Gelo', unit_type: 'kg', min_stock: 20 },
          { name: 'Hortelã', unit_type: 'unidade', min_stock: 5 },
          { name: 'Limão', unit_type: 'kg', min_stock: 5 },
        ],
      },
      {
        name: 'Petiscos e Porções', color: '#ef4444', icon: 'Beef',
        items: [
          { name: 'Batata frita congelada', unit_type: 'kg', min_stock: 10 },
          { name: 'Frango empanado', unit_type: 'kg', min_stock: 5 },
          { name: 'Calabresa', unit_type: 'kg', min_stock: 3 },
          { name: 'Queijo coalho', unit_type: 'kg', min_stock: 3 },
          { name: 'Amendoim', unit_type: 'kg', min_stock: 2 },
        ],
      },
      {
        name: 'Refrigerantes e Sucos', color: '#3b82f6', icon: 'GlassWater',
        items: [
          { name: 'Coca-Cola lata', unit_type: 'unidade', min_stock: 24 },
          { name: 'Água mineral', unit_type: 'unidade', min_stock: 24 },
          { name: 'Suco natural', unit_type: 'litro', min_stock: 5 },
        ],
      },
      {
        name: 'Descartáveis', color: '#8b5cf6', icon: 'Package',
        items: [
          { name: 'Copo descartável', unit_type: 'unidade', min_stock: 200 },
          { name: 'Guardanapo', unit_type: 'unidade', min_stock: 300 },
          { name: 'Canudo', unit_type: 'unidade', min_stock: 200 },
        ],
      },
    ],
  },
  {
    id: 'pizzaria',
    name: 'Pizzaria',
    icon: 'Pizza',
    description: 'Massas, queijos, molhos, embutidos e coberturas',
    categories: [
      {
        name: 'Massas e Bases', color: '#d97706', icon: 'Croissant',
        items: [
          { name: 'Farinha de trigo', unit_type: 'kg', min_stock: 25 },
          { name: 'Fermento biológico', unit_type: 'kg', min_stock: 2 },
          { name: 'Azeite', unit_type: 'litro', min_stock: 3 },
          { name: 'Açúcar', unit_type: 'kg', min_stock: 2 },
          { name: 'Sal', unit_type: 'kg', min_stock: 2 },
        ],
      },
      {
        name: 'Queijos', color: '#f59e0b', icon: 'Milk',
        items: [
          { name: 'Mussarela', unit_type: 'kg', min_stock: 15 },
          { name: 'Catupiry', unit_type: 'kg', min_stock: 5 },
          { name: 'Parmesão', unit_type: 'kg', min_stock: 2 },
          { name: 'Cheddar', unit_type: 'kg', min_stock: 3 },
          { name: 'Gorgonzola', unit_type: 'kg', min_stock: 2 },
        ],
      },
      {
        name: 'Molhos', color: '#ef4444', icon: 'Flame',
        items: [
          { name: 'Molho de tomate', unit_type: 'litro', min_stock: 10 },
          { name: 'Molho branco', unit_type: 'litro', min_stock: 3 },
          { name: 'Orégano', unit_type: 'kg', min_stock: 1 },
          { name: 'Azeitona', unit_type: 'kg', min_stock: 3 },
        ],
      },
      {
        name: 'Embutidos e Carnes', color: '#e11d48', icon: 'Beef',
        items: [
          { name: 'Calabresa', unit_type: 'kg', min_stock: 5 },
          { name: 'Presunto', unit_type: 'kg', min_stock: 5 },
          { name: 'Bacon', unit_type: 'kg', min_stock: 3 },
          { name: 'Pepperoni', unit_type: 'kg', min_stock: 3 },
          { name: 'Frango desfiado', unit_type: 'kg', min_stock: 5 },
          { name: 'Carne seca', unit_type: 'kg', min_stock: 3 },
        ],
      },
      {
        name: 'Hortifruti', color: '#22c55e', icon: 'Salad',
        items: [
          { name: 'Tomate', unit_type: 'kg', min_stock: 5 },
          { name: 'Cebola', unit_type: 'kg', min_stock: 5 },
          { name: 'Pimentão', unit_type: 'kg', min_stock: 2 },
          { name: 'Milho', unit_type: 'kg', min_stock: 2 },
          { name: 'Rúcula', unit_type: 'unidade', min_stock: 5 },
        ],
      },
      {
        name: 'Bebidas', color: '#3b82f6', icon: 'Wine',
        items: [
          { name: 'Refrigerante 2L', unit_type: 'unidade', min_stock: 15 },
          { name: 'Cerveja lata', unit_type: 'unidade', min_stock: 24 },
          { name: 'Água mineral', unit_type: 'unidade', min_stock: 20 },
          { name: 'Suco lata', unit_type: 'unidade', min_stock: 12 },
        ],
      },
      {
        name: 'Embalagens', color: '#8b5cf6', icon: 'Package',
        items: [
          { name: 'Caixa de pizza G', unit_type: 'unidade', min_stock: 50 },
          { name: 'Caixa de pizza M', unit_type: 'unidade', min_stock: 30 },
          { name: 'Caixa de pizza P/Broto', unit_type: 'unidade', min_stock: 30 },
        ],
      },
    ],
  },
];
