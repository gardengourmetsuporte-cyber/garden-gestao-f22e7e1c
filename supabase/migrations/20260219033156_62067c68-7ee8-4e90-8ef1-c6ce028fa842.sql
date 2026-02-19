-- Add selected_frame column to profiles table
ALTER TABLE public.profiles ADD COLUMN selected_frame text DEFAULT NULL;

-- This allows users to override their auto-assigned rank frame
-- NULL means use the default (current rank frame)
-- A value like 'Aprendiz', 'Dedicado', etc. means use that specific frame