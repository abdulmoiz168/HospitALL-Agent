-- Add service role policy for admin_settings
-- This allows the chat API to read the system prompt using the service role

CREATE POLICY "Service role full access on admin_settings" ON public.admin_settings
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
