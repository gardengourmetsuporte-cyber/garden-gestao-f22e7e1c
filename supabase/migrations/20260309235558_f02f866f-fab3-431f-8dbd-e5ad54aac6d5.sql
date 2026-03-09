
-- Packaging templates
CREATE TABLE public.packaging_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Packaging template items
CREATE TABLE public.packaging_template_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.packaging_templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cost NUMERIC NOT NULL DEFAULT 0,
  quantity NUMERIC NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add packaging_template_id to recipes
ALTER TABLE public.recipes ADD COLUMN packaging_template_id UUID REFERENCES public.packaging_templates(id) ON DELETE SET NULL;

-- RLS for packaging_templates
ALTER TABLE public.packaging_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own packaging templates" ON public.packaging_templates
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS for packaging_template_items
ALTER TABLE public.packaging_template_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage items of own templates" ON public.packaging_template_items
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.packaging_templates pt
      WHERE pt.id = template_id AND pt.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.packaging_templates pt
      WHERE pt.id = template_id AND pt.user_id = auth.uid()
    )
  );
