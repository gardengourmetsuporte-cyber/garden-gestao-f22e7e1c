-- Criar enums para a agenda do gestor
CREATE TYPE public.day_period AS ENUM ('morning', 'afternoon', 'evening');
CREATE TYPE public.task_priority AS ENUM ('low', 'medium', 'high');

-- Tabela de tarefas do gestor
CREATE TABLE public.manager_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  period public.day_period NOT NULL DEFAULT 'morning',
  priority public.task_priority NOT NULL DEFAULT 'medium',
  is_completed BOOLEAN NOT NULL DEFAULT false,
  is_system_generated BOOLEAN NOT NULL DEFAULT false,
  system_source TEXT,
  source_data JSONB,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de compromissos do gestor
CREATE TABLE public.manager_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  scheduled_time TIME NOT NULL,
  notes TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_manager_tasks_user_date ON public.manager_tasks(user_id, date);
CREATE INDEX idx_manager_appointments_user_date ON public.manager_appointments(user_id, date);

-- Habilitar RLS
ALTER TABLE public.manager_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manager_appointments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para tarefas (somente admin próprio)
CREATE POLICY "Admins can view own tasks"
ON public.manager_tasks FOR SELECT
USING (auth.uid() = user_id AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert own tasks"
ON public.manager_tasks FOR INSERT
WITH CHECK (auth.uid() = user_id AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update own tasks"
ON public.manager_tasks FOR UPDATE
USING (auth.uid() = user_id AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete own manual tasks"
ON public.manager_tasks FOR DELETE
USING (auth.uid() = user_id AND public.has_role(auth.uid(), 'admin') AND is_system_generated = false);

-- Políticas RLS para compromissos (somente admin próprio)
CREATE POLICY "Admins can view own appointments"
ON public.manager_appointments FOR SELECT
USING (auth.uid() = user_id AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert own appointments"
ON public.manager_appointments FOR INSERT
WITH CHECK (auth.uid() = user_id AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update own appointments"
ON public.manager_appointments FOR UPDATE
USING (auth.uid() = user_id AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete own appointments"
ON public.manager_appointments FOR DELETE
USING (auth.uid() = user_id AND public.has_role(auth.uid(), 'admin'));

-- Triggers para updated_at
CREATE TRIGGER update_manager_tasks_updated_at
BEFORE UPDATE ON public.manager_tasks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_manager_appointments_updated_at
BEFORE UPDATE ON public.manager_appointments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();