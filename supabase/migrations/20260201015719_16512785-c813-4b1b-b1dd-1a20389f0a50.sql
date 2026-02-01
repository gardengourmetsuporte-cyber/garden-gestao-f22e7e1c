-- Adicionar campo de frequência aos itens de checklist
ALTER TABLE checklist_items 
ADD COLUMN frequency TEXT NOT NULL DEFAULT 'daily' 
CHECK (frequency IN ('daily', 'weekly', 'monthly'));