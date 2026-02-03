-- Adicionar coluna para indicar se a conclusão gerou pontos
ALTER TABLE checklist_completions 
ADD COLUMN awarded_points boolean NOT NULL DEFAULT true;

-- Índice para performance na query de pontos
CREATE INDEX idx_completions_awarded_points 
ON checklist_completions(completed_by, awarded_points) 
WHERE awarded_points = true;