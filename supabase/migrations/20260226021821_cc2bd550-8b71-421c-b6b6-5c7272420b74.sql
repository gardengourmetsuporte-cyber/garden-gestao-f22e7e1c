ALTER TABLE checklist_completions 
  ADD COLUMN is_contested boolean NOT NULL DEFAULT false,
  ADD COLUMN contested_by uuid,
  ADD COLUMN contested_reason text,
  ADD COLUMN contested_at timestamptz;