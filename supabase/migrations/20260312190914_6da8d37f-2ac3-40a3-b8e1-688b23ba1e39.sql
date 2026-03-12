
-- Instead of deleting, deactivate duplicate products
UPDATE tablet_products SET is_active = false, group_id = NULL WHERE id IN (
  '1ab06f5a-d5c8-4673-b5b1-9fb9ca76fb93',
  '489699e2-34d6-4d13-ad44-93f860d41989',
  '768b5aad-2e02-48a7-842c-d47f1a50ba6e',
  'd87e4fbb-83c0-4228-af38-998540c8e28b',
  '56182c17-9f5c-484c-9926-bff2bbd5fe9f',
  'c0a163e8-7ac9-4131-bac2-35ef98a0de68',
  '3268e506-f48f-4329-a12d-670771aa6fdd'
);

-- Remove option links for deactivated products
DELETE FROM menu_product_option_groups WHERE product_id IN (
  '1ab06f5a-d5c8-4673-b5b1-9fb9ca76fb93',
  '489699e2-34d6-4d13-ad44-93f860d41989',
  '768b5aad-2e02-48a7-842c-d47f1a50ba6e',
  'd87e4fbb-83c0-4228-af38-998540c8e28b',
  '56182c17-9f5c-484c-9926-bff2bbd5fe9f',
  'c0a163e8-7ac9-4131-bac2-35ef98a0de68',
  '3268e506-f48f-4329-a12d-670771aa6fdd'
);

-- Unlink all active products from old groups
UPDATE tablet_products SET group_id = NULL 
WHERE unit_id = '36de6493-5735-4c60-9631-2275ccb78cd0' AND is_active = true;

-- Delete old 1:1 groups
DELETE FROM menu_groups WHERE unit_id = '36de6493-5735-4c60-9631-2275ccb78cd0';

-- Create proper subcategory groups
INSERT INTO menu_groups (id, name, category_id, unit_id, sort_order, availability) VALUES
  ('aa000001-0001-0001-0001-000000000001', 'Carnes', 'b8c338cc-79ae-449a-9b41-2d84135f62ed', '36de6493-5735-4c60-9631-2275ccb78cd0', 0, '{"tablet": true, "delivery": true}'),
  ('aa000001-0001-0001-0001-000000000002', 'Tradicionais', 'b8c338cc-79ae-449a-9b41-2d84135f62ed', '36de6493-5735-4c60-9631-2275ccb78cd0', 1, '{"tablet": true, "delivery": true}'),
  ('aa000001-0001-0001-0001-000000000003', 'Burgers', '153b3b0c-a12e-482c-8987-a1390a325f11', '36de6493-5735-4c60-9631-2275ccb78cd0', 0, '{"tablet": true, "delivery": true}'),
  ('aa000001-0001-0001-0001-000000000004', 'Hot Dogs', '153b3b0c-a12e-482c-8987-a1390a325f11', '36de6493-5735-4c60-9631-2275ccb78cd0', 1, '{"tablet": true, "delivery": true}'),
  ('aa000001-0001-0001-0001-000000000005', 'Refrigerantes', '0839e160-56bc-44e3-a95f-dfaba49553ea', '36de6493-5735-4c60-9631-2275ccb78cd0', 0, '{"tablet": true, "delivery": true}'),
  ('aa000001-0001-0001-0001-000000000006', 'Sucos', '0839e160-56bc-44e3-a95f-dfaba49553ea', '36de6493-5735-4c60-9631-2275ccb78cd0', 1, '{"tablet": true, "delivery": true}'),
  ('aa000001-0001-0001-0001-000000000007', 'Cervejas', '0839e160-56bc-44e3-a95f-dfaba49553ea', '36de6493-5735-4c60-9631-2275ccb78cd0', 2, '{"tablet": true, "delivery": true}'),
  ('aa000001-0001-0001-0001-000000000008', 'Doces', '9f050f2d-a34c-4eec-a413-797be8a77766', '36de6493-5735-4c60-9631-2275ccb78cd0', 0, '{"tablet": true, "delivery": true}'),
  ('aa000001-0001-0001-0001-000000000009', 'Porções', '56ff6c45-1fc3-4191-9407-7dc58c5674e8', '36de6493-5735-4c60-9631-2275ccb78cd0', 0, '{"tablet": true, "delivery": true}');

-- Assign products to groups + descriptions + images
-- Carnes
UPDATE tablet_products SET group_id = 'aa000001-0001-0001-0001-000000000001', description = 'Picanha grelhada na brasa, suculenta e macia. Acompanha arroz, farofa, vinagrete e batata frita.', sort_order = 0 WHERE id = '5c32f5a9-8f7e-4d23-ba67-7f1b63af673a';
UPDATE tablet_products SET group_id = 'aa000001-0001-0001-0001-000000000001', description = 'Contra-filé grelhado coberto com cebolas douradas. Acompanha arroz, feijão e salada.', image_url = 'https://uovuggxuurcdnprewtyl.supabase.co/storage/v1/object/public/product-images/demo/picanha.jpg', sort_order = 1 WHERE id = 'c3019c8a-5f9c-4867-95a8-f979cd312ae9';

-- Tradicionais
UPDATE tablet_products SET group_id = 'aa000001-0001-0001-0001-000000000002', description = 'Peito de frango grelhado temperado com ervas finas. Acompanha arroz integral e legumes.', sort_order = 0 WHERE id = '03f2a839-92a3-4e8c-b54b-c923fe904553';
UPDATE tablet_products SET group_id = 'aa000001-0001-0001-0001-000000000002', description = 'Feijoada completa com carnes selecionadas, arroz, couve refogada, farofa e laranja.', sort_order = 1 WHERE id = '4b689283-6111-4beb-a00b-9228a61048d9';

-- Burgers
UPDATE tablet_products SET group_id = 'aa000001-0001-0001-0001-000000000003', description = 'Hambúrguer artesanal 180g com queijo, alface, tomate e maionese especial no pão brioche.', sort_order = 0 WHERE id = 'df653052-b184-44f1-af29-836ffcdcc00e';
UPDATE tablet_products SET group_id = 'aa000001-0001-0001-0001-000000000003', description = 'Hambúrguer 180g com bacon crocante, queijo cheddar derretido e molho barbecue.', sort_order = 1 WHERE id = 'a92f2cd8-f0de-4347-bb1d-bf900cb03c54';
UPDATE tablet_products SET group_id = 'aa000001-0001-0001-0001-000000000003', description = 'O mais completo! Hambúrguer 180g, bacon, ovo, presunto, queijo, alface, tomate e milho.', sort_order = 2 WHERE id = 'd28b8b67-bbe5-4770-97be-aeefd61bc586';
UPDATE tablet_products SET group_id = 'aa000001-0001-0001-0001-000000000003', description = 'Dois smash patties 90g com bordas crocantes, queijo americano e molho especial.', sort_order = 3 WHERE id = 'b0395af7-c11f-4180-9c28-a137f2f5c7ee';

-- Hot Dogs
UPDATE tablet_products SET group_id = 'aa000001-0001-0001-0001-000000000004', description = 'Hot dog no pão artesanal com salsicha premium, vinagrete, batata palha e molhos.', sort_order = 0 WHERE id = '7e04be6b-f942-4a5e-b0af-0bae7689c008';

-- Refrigerantes
UPDATE tablet_products SET group_id = 'aa000001-0001-0001-0001-000000000005', description = 'Coca-Cola lata gelada 350ml.', sort_order = 0 WHERE id = '6716303d-1a93-4b9d-9d65-cfd58d4c0448';
UPDATE tablet_products SET group_id = 'aa000001-0001-0001-0001-000000000005', description = 'Coca-Cola garrafa 2 litros.', sort_order = 1 WHERE id = 'c8cb5b6c-a29e-4c82-94a7-bc6c87a89b26';
UPDATE tablet_products SET group_id = 'aa000001-0001-0001-0001-000000000005', description = 'Guaraná Antarctica garrafa 2 litros.', sort_order = 2 WHERE id = '53e53cd8-2d19-4de2-9b71-9b145c7ea523';

-- Sucos
UPDATE tablet_products SET group_id = 'aa000001-0001-0001-0001-000000000006', description = 'Suco natural da fruta, feito na hora. Escolha o sabor.', sort_order = 0 WHERE id = '33d6b740-7dc5-4f5a-8b19-b6b82072b41e';

-- Cervejas
UPDATE tablet_products SET group_id = 'aa000001-0001-0001-0001-000000000007', description = 'Heineken long neck 330ml, puro malte.', sort_order = 0, is_18_plus = true WHERE id = 'b88d6ea6-1c59-4ee5-a109-3aeeeea0209d';
UPDATE tablet_products SET group_id = 'aa000001-0001-0001-0001-000000000007', description = 'Cerveja long neck artesanal 355ml.', sort_order = 1, is_18_plus = true WHERE id = 'aba16656-169e-47df-bde7-d4f790e86d2a';

-- Doces
UPDATE tablet_products SET group_id = 'aa000001-0001-0001-0001-000000000008', description = 'Pudim de leite condensado cremoso com calda de caramelo.', sort_order = 0 WHERE id = 'e34ce01b-1e2c-4fc7-9bb2-7bcb6808cdc0';
UPDATE tablet_products SET group_id = 'aa000001-0001-0001-0001-000000000008', description = 'Brownie de chocolate meio amargo com pedaços de nozes. Servido morno.', sort_order = 1 WHERE id = '98a9aa4c-ce31-4eb2-95b2-cec5ebf54e74';

-- Porções
UPDATE tablet_products SET group_id = 'aa000001-0001-0001-0001-000000000009', description = 'Porção generosa de batata frita crocante com sal e ervas.', sort_order = 0 WHERE id = '6eb866dc-7148-4194-ad88-88b91502c8fb';
UPDATE tablet_products SET group_id = 'aa000001-0001-0001-0001-000000000009', description = 'Mandioca frita dourada e crocante por fora, macia por dentro.', sort_order = 1 WHERE id = '6ef100f1-1d9d-4fd4-a032-efd445e1e370';

-- Fix option group links
DELETE FROM menu_product_option_groups WHERE product_id IN (
  SELECT id FROM tablet_products WHERE unit_id = '36de6493-5735-4c60-9631-2275ccb78cd0'
);

-- Ponto da Carne → carnes
INSERT INTO menu_product_option_groups (product_id, option_group_id, sort_order) VALUES
  ('5c32f5a9-8f7e-4d23-ba67-7f1b63af673a', 'a1000001-0001-0001-0001-000000000001', 0),
  ('c3019c8a-5f9c-4867-95a8-f979cd312ae9', 'a1000001-0001-0001-0001-000000000001', 0);

-- Acompanhamentos → pratos
INSERT INTO menu_product_option_groups (product_id, option_group_id, sort_order) VALUES
  ('5c32f5a9-8f7e-4d23-ba67-7f1b63af673a', 'a1000001-0001-0001-0001-000000000002', 1),
  ('c3019c8a-5f9c-4867-95a8-f979cd312ae9', 'a1000001-0001-0001-0001-000000000002', 1),
  ('03f2a839-92a3-4e8c-b54b-c923fe904553', 'a1000001-0001-0001-0001-000000000002', 0),
  ('4b689283-6111-4beb-a00b-9228a61048d9', 'a1000001-0001-0001-0001-000000000002', 0);

-- Adicionais Lanche → lanches
INSERT INTO menu_product_option_groups (product_id, option_group_id, sort_order) VALUES
  ('df653052-b184-44f1-af29-836ffcdcc00e', 'a1000001-0001-0001-0001-000000000003', 0),
  ('a92f2cd8-f0de-4347-bb1d-bf900cb03c54', 'a1000001-0001-0001-0001-000000000003', 0),
  ('d28b8b67-bbe5-4770-97be-aeefd61bc586', 'a1000001-0001-0001-0001-000000000003', 0),
  ('b0395af7-c11f-4180-9c28-a137f2f5c7ee', 'a1000001-0001-0001-0001-000000000003', 0),
  ('7e04be6b-f942-4a5e-b0af-0bae7689c008', 'a1000001-0001-0001-0001-000000000003', 0);

-- Molhos → lanches + porções
INSERT INTO menu_product_option_groups (product_id, option_group_id, sort_order) VALUES
  ('df653052-b184-44f1-af29-836ffcdcc00e', 'a1000001-0001-0001-0001-000000000004', 1),
  ('a92f2cd8-f0de-4347-bb1d-bf900cb03c54', 'a1000001-0001-0001-0001-000000000004', 1),
  ('d28b8b67-bbe5-4770-97be-aeefd61bc586', 'a1000001-0001-0001-0001-000000000004', 1),
  ('b0395af7-c11f-4180-9c28-a137f2f5c7ee', 'a1000001-0001-0001-0001-000000000004', 1),
  ('7e04be6b-f942-4a5e-b0af-0bae7689c008', 'a1000001-0001-0001-0001-000000000004', 1),
  ('6eb866dc-7148-4194-ad88-88b91502c8fb', 'a1000001-0001-0001-0001-000000000004', 0),
  ('6ef100f1-1d9d-4fd4-a032-efd445e1e370', 'a1000001-0001-0001-0001-000000000004', 0);

-- Tamanho → porções
INSERT INTO menu_product_option_groups (product_id, option_group_id, sort_order) VALUES
  ('6eb866dc-7148-4194-ad88-88b91502c8fb', 'a1000001-0001-0001-0001-000000000005', 1),
  ('6ef100f1-1d9d-4fd4-a032-efd445e1e370', 'a1000001-0001-0001-0001-000000000005', 1);

-- Sabor do Suco → suco
INSERT INTO menu_product_option_groups (product_id, option_group_id, sort_order) VALUES
  ('33d6b740-7dc5-4f5a-8b19-b6b82072b41e', 'a1000001-0001-0001-0001-000000000006', 0);

-- Cobertura → sobremesas
INSERT INTO menu_product_option_groups (product_id, option_group_id, sort_order) VALUES
  ('e34ce01b-1e2c-4fc7-9bb2-7bcb6808cdc0', 'a1000001-0001-0001-0001-000000000007', 0),
  ('98a9aa4c-ce31-4eb2-95b2-cec5ebf54e74', 'a1000001-0001-0001-0001-000000000007', 0);

-- Update category icons
UPDATE menu_categories SET icon = 'UtensilsCrossed' WHERE id = 'b8c338cc-79ae-449a-9b41-2d84135f62ed';
UPDATE menu_categories SET icon = 'Sandwich' WHERE id = '153b3b0c-a12e-482c-8987-a1390a325f11';
UPDATE menu_categories SET icon = 'Wine' WHERE id = '0839e160-56bc-44e3-a95f-dfaba49553ea';
UPDATE menu_categories SET icon = 'Cake' WHERE id = '9f050f2d-a34c-4eec-a413-797be8a77766';
UPDATE menu_categories SET icon = 'Salad' WHERE id = '56ff6c45-1fc3-4191-9407-7dc58c5674e8';
