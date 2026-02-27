-- Remove incorrectly auto-skipped records for today's abertura checklist
-- These were created before the deadline (19:30 BRT) due to a timezone bug
DELETE FROM public.checklist_completions
WHERE date = '2026-02-27'
  AND is_skipped = true
  AND checklist_type = 'abertura'
  AND completed_at > '2026-02-27T21:50:00+00';