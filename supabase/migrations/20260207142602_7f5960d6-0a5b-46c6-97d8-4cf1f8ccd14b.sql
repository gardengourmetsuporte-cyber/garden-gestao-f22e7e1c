-- Vincular pedido a um boleto/despesa provisionada
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS supplier_invoice_id uuid;

-- FK para evitar vínculo inválido
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orders_supplier_invoice_id_fkey'
  ) THEN
    ALTER TABLE public.orders
    ADD CONSTRAINT orders_supplier_invoice_id_fkey
    FOREIGN KEY (supplier_invoice_id)
    REFERENCES public.supplier_invoices(id)
    ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_orders_supplier_invoice_id
ON public.orders (supplier_invoice_id);