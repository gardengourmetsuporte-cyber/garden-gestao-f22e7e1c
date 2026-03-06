CREATE POLICY "Users can delete own pending closings"
ON public.cash_closings
FOR DELETE
TO authenticated
USING (auth.uid() = user_id AND status = 'pending'::cash_closing_status);