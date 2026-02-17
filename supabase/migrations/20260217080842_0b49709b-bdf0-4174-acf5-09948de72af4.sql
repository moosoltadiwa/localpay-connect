
-- Create table to track password reset requests
CREATE TABLE public.password_reset_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  user_id UUID,
  status TEXT NOT NULL DEFAULT 'pending',
  reset_link TEXT,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.password_reset_requests ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can view all reset requests"
  ON public.password_reset_requests FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update reset requests"
  ON public.password_reset_requests FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete reset requests"
  ON public.password_reset_requests FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can insert (unauthenticated users requesting resets)
CREATE POLICY "Anyone can create reset requests"
  ON public.password_reset_requests FOR INSERT
  WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_password_reset_requests_updated_at
  BEFORE UPDATE ON public.password_reset_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
