
-- Create knowledge base table
CREATE TABLE public.whatsapp_knowledge_base (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'geral',
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.whatsapp_knowledge_base ENABLE ROW LEVEL SECURITY;

-- RLS policies - admin only
CREATE POLICY "Admins can manage knowledge base"
  ON public.whatsapp_knowledge_base
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_knowledge_base;

-- Trigger for updated_at
CREATE TRIGGER update_whatsapp_knowledge_base_updated_at
  BEFORE UPDATE ON public.whatsapp_knowledge_base
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
