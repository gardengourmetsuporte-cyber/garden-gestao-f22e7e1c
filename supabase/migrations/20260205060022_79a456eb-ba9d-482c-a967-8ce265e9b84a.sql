-- Adicionar sort_order para persistir ordem dos lembretes
ALTER TABLE manager_tasks ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Popular sort_order inicial baseado em due_date e created_at
UPDATE manager_tasks 
SET sort_order = sub.row_num 
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY due_date NULLS FIRST, created_at) as row_num 
  FROM manager_tasks
) sub 
WHERE manager_tasks.id = sub.id;