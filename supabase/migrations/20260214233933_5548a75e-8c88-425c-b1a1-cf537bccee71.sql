
-- Secure push_config table: block all direct access (edge functions use service_role_key)
CREATE POLICY "Block all direct access to push_config"
ON public.push_config
FOR ALL
USING (false)
WITH CHECK (false);
