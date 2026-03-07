
-- Clear inventory data for fresh testing (respecting FK constraints)
DELETE FROM recipe_ingredients;
DELETE FROM inventory_items;
DELETE FROM categories;
