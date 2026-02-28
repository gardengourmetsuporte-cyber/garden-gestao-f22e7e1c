-- First deduplicate: keep the customer with most orders for each duplicate phone
WITH duplicates AS (
  SELECT id, unit_id, phone,
    ROW_NUMBER() OVER (
      PARTITION BY unit_id, phone 
      ORDER BY COALESCE(total_orders, 0) DESC, COALESCE(total_spent, 0) DESC, created_at ASC
    ) AS rn
  FROM public.customers
  WHERE phone IS NOT NULL AND phone != ''
)
DELETE FROM public.customers
WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);

-- Now create the unique index
CREATE UNIQUE INDEX idx_customers_unit_phone 
ON public.customers (unit_id, phone) 
WHERE phone IS NOT NULL AND phone != '';