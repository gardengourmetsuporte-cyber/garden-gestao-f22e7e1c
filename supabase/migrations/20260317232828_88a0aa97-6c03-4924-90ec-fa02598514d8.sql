
-- Delete all cash-closing integration transactions from March 15
DELETE FROM finance_transactions
WHERE date = '2026-03-15'
  AND deleted_at IS NULL
  AND created_at >= '2026-03-16 02:19:52'
  AND created_at <= '2026-03-16 02:19:53';

-- Reset the cash closing integration flag so user can re-integrate
UPDATE cash_closings
SET financial_integrated = false
WHERE id = '0d226877-9ab4-4e9b-bbaa-115e09495ebf';
