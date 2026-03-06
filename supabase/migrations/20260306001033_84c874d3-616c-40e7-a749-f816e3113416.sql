-- Consolidate duplicate categories for unit 03d5d071-47c9-4599-b4c9-b11c176328fe
-- Strategy: keep the category with more subcategory transactions, move orphaned subs, delete empty duplicate

-- Create a function to merge duplicates across ALL units (idempotent)
CREATE OR REPLACE FUNCTION public.merge_duplicate_categories()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  rec RECORD;
  keep_id uuid;
  remove_id uuid;
  sub RECORD;
  merged_count integer := 0;
BEGIN
  -- Find all duplicate parent categories (same name, type, unit)
  FOR rec IN
    SELECT unit_id, LOWER(TRIM(name)) as norm_name, type,
      array_agg(id ORDER BY created_at ASC) as ids
    FROM finance_categories
    WHERE parent_id IS NULL
    GROUP BY unit_id, LOWER(TRIM(name)), type
    HAVING COUNT(*) > 1
  LOOP
    -- Determine which to keep: the one with more transaction references
    SELECT id INTO keep_id
    FROM (
      SELECT fc.id,
        (SELECT COUNT(*) FROM finance_transactions WHERE category_id = fc.id) +
        (SELECT COUNT(*) FROM finance_transactions ft JOIN finance_categories sc ON sc.id = ft.category_id WHERE sc.parent_id = fc.id) as txn_count,
        (SELECT COUNT(*) FROM finance_categories WHERE parent_id = fc.id) as sub_count
      FROM finance_categories fc
      WHERE fc.id = ANY(rec.ids)
      ORDER BY txn_count DESC, sub_count DESC, fc.created_at ASC
      LIMIT 1
    ) best;

    -- Process each duplicate (not the keeper)
    FOR remove_id IN SELECT unnest(rec.ids) EXCEPT SELECT keep_id
    LOOP
      -- Move any direct transactions to keeper
      UPDATE finance_transactions SET category_id = keep_id WHERE category_id = remove_id;

      -- For subcategories of the duplicate: merge by name or move
      FOR sub IN SELECT id, LOWER(TRIM(name)) as norm_name FROM finance_categories WHERE parent_id = remove_id
      LOOP
        -- Check if keeper already has a sub with the same name
        DECLARE
          existing_sub_id uuid;
        BEGIN
          SELECT id INTO existing_sub_id
          FROM finance_categories
          WHERE parent_id = keep_id AND LOWER(TRIM(name)) = sub.norm_name
          LIMIT 1;

          IF existing_sub_id IS NOT NULL THEN
            -- Move transactions from duplicate sub to existing sub
            UPDATE finance_transactions SET category_id = existing_sub_id WHERE category_id = sub.id;
            -- Delete the duplicate sub
            DELETE FROM finance_categories WHERE id = sub.id;
          ELSE
            -- Move sub to keeper parent
            UPDATE finance_categories SET parent_id = keep_id, color = (SELECT color FROM finance_categories WHERE id = keep_id), icon = (SELECT icon FROM finance_categories WHERE id = keep_id) WHERE id = sub.id;
          END IF;
        END;
      END LOOP;

      -- Delete the empty duplicate parent
      DELETE FROM finance_categories WHERE id = remove_id;
      merged_count := merged_count + 1;
    END LOOP;
  END LOOP;

  RETURN merged_count;
END;
$$;

-- Execute the merge
SELECT merge_duplicate_categories();

-- Drop the function (one-time use)
DROP FUNCTION public.merge_duplicate_categories();

-- Add unique constraint to prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS uq_finance_categories_parent_name 
ON finance_categories (unit_id, LOWER(TRIM(name)), type) 
WHERE parent_id IS NULL;