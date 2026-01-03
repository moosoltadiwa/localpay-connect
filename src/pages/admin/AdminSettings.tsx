import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Settings, Link, Key, Percent, Save, Loader2, Eye, EyeOff } from "lucide-react";

interface SettingsData {
  smm_api_url: string;
  smm_api_key: string;
  price_increment_percentage: string;
}

const AdminSettings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [settings, setSettings] = useState<SettingsData>({
    smm_api_url: "",
    smm_api_key: "",
    price_increment_percentage: "0",
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_settings")
        .select("setting_key, setting_value");

      if (error) throw error;

      const settingsMap: SettingsData = {
        smm_api_url: "",
        smm_api_key: "",
        price_increment_percentage: "0",
      };

      data?.forEach((item) => {
        if (item.setting_key in settingsMap) {
          settingsMap[item.setting_key as keyof SettingsData] = item.setting_value || "";
        }
      });

      setSettings(settingsMap);
    } catch (error: any) {
      console.error("Error fetching settings:", error);
      toast({
        title: "Error loading settings",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = Object.entries(settings).map(([key, value]) => ({
        setting_key: key,
        setting_value: value,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from("admin_settings")
          .update({ setting_value: update.setting_value })
          .eq("setting_key", update.setting_key);

        if (error) throw error;
      }

      toast({
        title: "Settings saved",
        description: "Your settings have been updated successfully.",
      });
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error saving settings",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: keyof SettingsData, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <AdminLayout title="Settings">
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Settings">
      <div className="flex-1 p-6 space-y-6">
        {/* SMM Provider API Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              SMM Provider API Integration
            </CardTitle>
            <CardDescription>
              Configure your SMM provider API to auto-fulfill orders
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="smm_api_url" className="flex items-center gap-2">
                <Link className="w-4 h-4" />
                API URL
              </Label>
              <Input
                id="smm_api_url"
                type="url"
                placeholder="https://api.smmprovider.com/v1"
                value={settings.smm_api_url}
                onChange={(e) => handleChange("smm_api_url", e.target.value)}
                className="bg-background"
              />
              <p className="text-xs text-muted-foreground">
                Enter the base URL of your SMM provider's API
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="smm_api_key" className="flex items-center gap-2">
                <Key className="w-4 h-4" />
                API Key
              </Label>
              <div className="relative">
                <Input
                  id="smm_api_key"
                  type={showApiKey ? "text" : "password"}
                  placeholder="Enter your API key"
                  value={settings.smm_api_key}
                  onChange={(e) => handleChange("smm_api_key", e.target.value)}
                  className="bg-background pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Your SMM provider API key for authentication
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="w-5 h-5" />
              Pricing Settings
            </CardTitle>
            <CardDescription>
              Configure price markup for services
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="price_increment_percentage" className="flex items-center gap-2">
                Price Increment (%)
              </Label>
              <div className="relative max-w-xs">
                <Input
                  id="price_increment_percentage"
                  type="number"
                  min="0"
                  max="1000"
                  step="0.1"
                  placeholder="0"
                  value={settings.price_increment_percentage}
                  onChange={(e) => handleChange("price_increment_percentage", e.target.value)}
                  className="bg-background pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  %
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                This percentage will be added to the base price of all services. For example, if set to 20%, a $1.00 service will be displayed as $1.20.
              </p>
            </div>

            {/* Preview */}
            {parseFloat(settings.price_increment_percentage) > 0 && (
              <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                <p className="text-sm font-medium text-foreground mb-2">Price Preview</p>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Base price: $1.00 → Display price: ${(1 * (1 + parseFloat(settings.price_increment_percentage || "0") / 100)).toFixed(2)}</p>
                  <p>Base price: $5.00 → Display price: ${(5 * (1 + parseFloat(settings.price_increment_percentage || "0") / 100)).toFixed(2)}</p>
                  <p>Base price: $10.00 → Display price: ${(10 * (1 + parseFloat(settings.price_increment_percentage || "0") / 100)).toFixed(2)}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Settings
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
