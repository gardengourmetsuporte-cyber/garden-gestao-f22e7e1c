-- Migrate existing whatsapp_knowledge_base articles to copilot_knowledge (avoid duplicates by title+unit_id)
INSERT INTO copilot_knowledge (unit_id, title, content, category, is_active, sort_order, created_at, updated_at)
SELECT wk.unit_id, wk.title, wk.content, wk.category, wk.is_active, wk.sort_order, wk.created_at, wk.updated_at
FROM whatsapp_knowledge_base wk
WHERE NOT EXISTS (
  SELECT 1 FROM copilot_knowledge ck 
  WHERE ck.unit_id = wk.unit_id AND ck.title = wk.title
);