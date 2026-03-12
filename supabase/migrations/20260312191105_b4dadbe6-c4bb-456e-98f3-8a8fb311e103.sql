
-- Fix: Rename the item that should be Mandioca Frita back
UPDATE tablet_products SET name = 'Mandioca Frita' WHERE id = '6ef100f1-1d9d-4fd4-a032-efd445e1e370';

-- Deactivate the orphan Mandioca Frita duplicate
UPDATE tablet_products SET is_active = false WHERE id = 'bbbd2108-ad9d-422b-94c6-01e49463d1d1';

-- Also deactivate the extra Batata Frita variants that belong to another group/context
UPDATE tablet_products SET is_active = false WHERE id IN (
  '3e0ec55c-fe19-4058-b388-0a61244f9806',
  '9d062f2f-bd73-443c-99e6-e178b6e91bf4',
  'a359e64f-23af-42d5-bb10-2d9f1cb7fa41',
  '18f6452d-3263-4171-9114-b9734c9e0103'
) AND unit_id != '36de6493-5735-4c60-9631-2275ccb78cd0';
