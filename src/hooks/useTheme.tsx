import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ThemeName = "default" | "valentines" | "holiday" | "ocean" | "sunset";

export const THEMES: { value: ThemeName; label: string; description: string }[] = [
  { value: "default", label: "Default (Cyan)", description: "Modern blue-to-cyan gradient" },
  { value: "valentines", label: "Valentine's", description: "Romantic pink & rose tones" },
  { value: "holiday", label: "Holiday", description: "Festive green & red accents" },
  { value: "ocean", label: "Ocean", description: "Deep blue & teal waves" },
  { value: "sunset", label: "Sunset", description: "Warm orange & coral glow" },
];

interface ThemeContextType {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  loading: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "default",
  setTheme: () => {},
  loading: true,
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<ThemeName>("default");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTheme = async () => {
      try {
        const { data } = await supabase
          .from("admin_settings")
          .select("setting_value")
          .eq("setting_key", "site_theme")
          .maybeSingle();

        if (data?.setting_value && THEMES.some((t) => t.value === data.setting_value)) {
          setThemeState(data.setting_value as ThemeName);
        }
      } catch {
        // fallback to default
      } finally {
        setLoading(false);
      }
    };
    fetchTheme();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const setTheme = (newTheme: ThemeName) => {
    setThemeState(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, loading }}>
      {children}
    </ThemeContext.Provider>
  );
};
