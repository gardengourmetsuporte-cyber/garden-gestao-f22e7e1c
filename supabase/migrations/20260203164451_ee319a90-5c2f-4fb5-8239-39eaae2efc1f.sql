-- Adicionar coluna deleted_at para soft delete de itens de checklist
ALTER TABLE checklist_items 
ADD COLUMN deleted_at timestamp with time zone DEFAULT NULL;

-- Criar índice parcial para performance em queries que filtram itens ativos
CREATE INDEX idx_checklist_items_active 
ON checklist_items(subcategory_id, sort_order) 
WHERE deleted_at IS NULL;