-- Clean up race-condition skipped entries from 2026-02-25
-- Only delete skipped entries; real employee completions are preserved
DELETE FROM checklist_completions 
WHERE date = '2026-02-25' 
  AND is_skipped = true 
  AND unit_id = '00000000-0000-0000-0000-000000000001';