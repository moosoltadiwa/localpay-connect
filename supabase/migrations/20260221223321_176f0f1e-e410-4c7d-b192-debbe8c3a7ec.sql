-- Allow anyone to read the site_theme setting (public facing)
CREATE POLICY "Anyone can read site_theme"
ON public.admin_settings
FOR SELECT
USING (setting_key = 'site_theme');

-- Insert the default theme setting if it doesn't exist
INSERT INTO public.admin_settings (setting_key, setting_value)
VALUES ('site_theme', 'default')
ON CONFLICT (setting_key) DO NOTHING;