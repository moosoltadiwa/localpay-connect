-- Create admin_settings table for SMM API and price settings
CREATE TABLE public.admin_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can view and manage settings
CREATE POLICY "Admins can view settings" ON public.admin_settings
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert settings" ON public.admin_settings
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update settings" ON public.admin_settings
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete settings" ON public.admin_settings
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_admin_settings_updated_at
  BEFORE UPDATE ON public.admin_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create payment_proofs table for manual EcoCash payments
CREATE TABLE public.payment_proofs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES public.wallet_transactions(id) ON DELETE CASCADE,
  screenshot_url TEXT NOT NULL,
  phone_number TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_proofs ENABLE ROW LEVEL SECURITY;

-- Users can view their own payment proofs
CREATE POLICY "Users can view their own payment proofs" ON public.payment_proofs
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own payment proofs
CREATE POLICY "Users can create their own payment proofs" ON public.payment_proofs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can view all payment proofs
CREATE POLICY "Admins can view all payment proofs" ON public.payment_proofs
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update payment proofs
CREATE POLICY "Admins can update payment proofs" ON public.payment_proofs
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_payment_proofs_updated_at
  BEFORE UPDATE ON public.payment_proofs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for payment proof screenshots
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-proofs', 'payment-proofs', true);

-- Storage policies for payment proofs
CREATE POLICY "Users can upload their own payment proofs" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'payment-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own payment proofs" ON storage.objects
  FOR SELECT USING (bucket_id = 'payment-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all payment proofs" ON storage.objects
  FOR SELECT USING (bucket_id = 'payment-proofs' AND has_role(auth.uid(), 'admin'::app_role));

-- Insert default settings
INSERT INTO public.admin_settings (setting_key, setting_value) VALUES
  ('smm_api_url', ''),
  ('smm_api_key', ''),
  ('price_increment_percentage', '0');

-- Enable realtime for payment_proofs
ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_proofs;