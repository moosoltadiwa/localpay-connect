import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Package, Plus, Pencil, Trash2, Download, Loader2, Search, CheckSquare, Square } from "lucide-react";

interface Service {
  id: string;
  name: string;
  category: string;
  description: string | null;
  price_per_1000: number;
  min_quantity: number;
  max_quantity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ServiceForm {
  name: string;
  category: string;
  description: string;
  price_per_1000: string;
  min_quantity: string;
  max_quantity: string;
  is_active: boolean;
}

interface SmmService {
  service: string | number;
  name: string;
  category: string;
  rate: string;
  min: string;
  max: string;
  type?: string;
  refill?: boolean;
  cancel?: boolean;
}

const initialForm: ServiceForm = {
  name: "",
  category: "",
  description: "",
  price_per_1000: "",
  min_quantity: "100",
  max_quantity: "100000",
  is_active: true,
};

const AdminServices = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [form, setForm] = useState<ServiceForm>(initialForm);
  const [saving, setSaving] = useState(false);

  // Import state
  const [importLoading, setImportLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [smmServices, setSmmServices] = useState<SmmService[]>([]);
  const [selectedImports, setSelectedImports] = useState<Set<string | number>>(new Set());
  const [importSearch, setImportSearch] = useState("");
  const [importCategoryFilter, setImportCategoryFilter] = useState("");

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .order("category", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      toast.error("Failed to fetch services");
    } else {
      setServices(data || []);
    }
    setLoading(false);
  };

  // ---- Import functions ----
  const handleFetchSmmServices = async () => {
    setImportLoading(true);
    setSmmServices([]);
    setSelectedImports(new Set());
    setImportSearch("");
    setImportCategoryFilter("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke("smm-api", {
        body: { action: "services" },
      });

      if (response.error) throw new Error(response.error.message);
      if (response.data?.error) throw new Error(response.data.error);

      const fetchedServices = response.data?.services || [];
      if (!Array.isArray(fetchedServices) || fetchedServices.length === 0) {
        toast.error("No services returned from the API");
        setImportLoading(false);
        return;
      }

      setSmmServices(fetchedServices);
      setImportDialogOpen(true);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch services from API");
    } finally {
      setImportLoading(false);
    }
  };

  const toggleImportSelect = (serviceId: string | number) => {
    setSelectedImports((prev) => {
      const next = new Set(prev);
      if (next.has(serviceId)) {
        next.delete(serviceId);
      } else {
        next.add(serviceId);
      }
      return next;
    });
  };

  const filteredSmmServices = smmServices.filter((s) => {
    const matchesSearch = !importSearch ||
      s.name.toLowerCase().includes(importSearch.toLowerCase()) ||
      s.category.toLowerCase().includes(importSearch.toLowerCase());
    const matchesCategory = !importCategoryFilter ||
      s.category === importCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  const smmCategories = [...new Set(smmServices.map((s) => s.category))].sort();

  const selectAllFiltered = () => {
    const next = new Set(selectedImports);
    filteredSmmServices.forEach((s) => next.add(s.service));
    setSelectedImports(next);
  };

  const deselectAllFiltered = () => {
    const filteredIds = new Set(filteredSmmServices.map((s) => s.service));
    setSelectedImports((prev) => {
      const next = new Set(prev);
      filteredIds.forEach((id) => next.delete(id));
      return next;
    });
  };

  const handleImportSelected = async () => {
    if (selectedImports.size === 0) {
      toast.error("Select at least one service to import");
      return;
    }

    setImporting(true);
    try {
      const toImport = smmServices.filter((s) => selectedImports.has(s.service));
      const rows = toImport.map((s) => ({
        name: s.name,
        category: s.category,
        description: s.type ? `Type: ${s.type}` : null,
        price_per_1000: parseFloat(s.rate) || 0,
        min_quantity: parseInt(String(s.min)) || 100,
        max_quantity: parseInt(String(s.max)) || 100000,
        is_active: true,
      }));

      // Insert in batches of 50
      for (let i = 0; i < rows.length; i += 50) {
        const batch = rows.slice(i, i + 50);
        const { error } = await supabase.from("services").insert(batch);
        if (error) throw error;
      }

      toast.success(`Successfully imported ${rows.length} services`);
      setImportDialogOpen(false);
      setSelectedImports(new Set());
      setSmmServices([]);
      fetchServices();
    } catch (error: any) {
      toast.error(error.message || "Failed to import services");
    } finally {
      setImporting(false);
    }
  };

  // ---- CRUD functions ----
  const handleOpenCreate = () => {
    setSelectedService(null);
    setForm(initialForm);
    setDialogOpen(true);
  };

  const handleOpenEdit = (service: Service) => {
    setSelectedService(service);
    setForm({
      name: service.name,
      category: service.category,
      description: service.description || "",
      price_per_1000: service.price_per_1000.toString(),
      min_quantity: service.min_quantity.toString(),
      max_quantity: service.max_quantity.toString(),
      is_active: service.is_active,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.category || !form.price_per_1000) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSaving(true);
    try {
      const serviceData = {
        name: form.name,
        category: form.category,
        description: form.description || null,
        price_per_1000: parseFloat(form.price_per_1000),
        min_quantity: parseInt(form.min_quantity),
        max_quantity: parseInt(form.max_quantity),
        is_active: form.is_active,
      };

      if (selectedService) {
        const { error } = await supabase
          .from("services")
          .update(serviceData)
          .eq("id", selectedService.id);
        if (error) throw error;
        toast.success("Service updated successfully");
      } else {
        const { error } = await supabase.from("services").insert(serviceData);
        if (error) throw error;
        toast.success("Service created successfully");
      }

      setDialogOpen(false);
      fetchServices();
    } catch (error) {
      toast.error("Failed to save service");
      console.error("Save error:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedService) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("services")
        .delete()
        .eq("id", selectedService.id);
      if (error) throw error;
      toast.success("Service deleted successfully");
      setDeleteDialogOpen(false);
      setSelectedService(null);
      fetchServices();
    } catch (error) {
      toast.error("Failed to delete service");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (service: Service) => {
    const { error } = await supabase
      .from("services")
      .update({ is_active: !service.is_active })
      .eq("id", service.id);

    if (error) {
      toast.error("Failed to update service");
    } else {
      toast.success(`Service ${service.is_active ? "deactivated" : "activated"}`);
      fetchServices();
    }
  };

  const groupedServices = services.reduce((acc, service) => {
    if (!acc[service.category]) acc[service.category] = [];
    acc[service.category].push(service);
    return acc;
  }, {} as Record<string, Service[]>);

  return (
    <AdminLayout title="Services">
      <div className="flex-1 p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <p className="text-muted-foreground">
            Manage your SMM services and pricing
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleFetchSmmServices} disabled={importLoading}>
              {importLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Import from API
            </Button>
            <Button onClick={handleOpenCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Add Service
            </Button>
          </div>
        </div>

        {/* Services List */}
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : services.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">No services yet</h3>
              <p className="text-muted-foreground mb-4">
                Import services from your API or add them manually
              </p>
              <div className="flex items-center justify-center gap-2">
                <Button variant="outline" onClick={handleFetchSmmServices} disabled={importLoading}>
                  {importLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  Import from API
                </Button>
                <Button onClick={handleOpenCreate}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Service
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          Object.entries(groupedServices).map(([category, categoryServices]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="text-lg">{category}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Service Name</th>
                        <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Price/1000</th>
                        <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Min</th>
                        <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Max</th>
                        <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Active</th>
                        <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categoryServices.map((service) => (
                        <tr key={service.id} className={`border-b border-border/50 ${!service.is_active ? "opacity-50" : ""}`}>
                          <td className="py-3 px-2">
                            <p className="font-medium text-sm">{service.name}</p>
                            {service.description && (
                              <p className="text-xs text-muted-foreground truncate max-w-xs">{service.description}</p>
                            )}
                          </td>
                          <td className="py-3 px-2 text-sm font-medium">${Number(service.price_per_1000).toFixed(2)}</td>
                          <td className="py-3 px-2 text-sm">{service.min_quantity}</td>
                          <td className="py-3 px-2 text-sm">{service.max_quantity}</td>
                          <td className="py-3 px-2">
                            <Switch checked={service.is_active} onCheckedChange={() => toggleActive(service)} />
                          </td>
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(service)}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => { setSelectedService(service); setDeleteDialogOpen(true); }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{selectedService ? "Edit Service" : "Add New Service"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Service Name *</Label>
                <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., Instagram Followers" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Input id="category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g., Instagram" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Service description..." rows={2} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price per 1000 (USD) *</Label>
                <Input id="price" type="number" step="0.01" value={form.price_per_1000} onChange={(e) => setForm({ ...form, price_per_1000: e.target.value })} placeholder="0.00" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min">Min Quantity</Label>
                  <Input id="min" type="number" value={form.min_quantity} onChange={(e) => setForm({ ...form, min_quantity: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max">Max Quantity</Label>
                  <Input id="max" type="number" value={form.max_quantity} onChange={(e) => setForm({ ...form, max_quantity: e.target.value })} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="active">Active</Label>
                <Switch id="active" checked={form.is_active} onCheckedChange={(checked) => setForm({ ...form, is_active: checked })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={saving}>{saving ? "Saving..." : selectedService ? "Update" : "Create"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Service</DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground">
              Are you sure you want to delete "{selectedService?.name}"? This action cannot be undone.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete} disabled={saving}>{saving ? "Deleting..." : "Delete"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Import Dialog */}
        <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Import Services from API
              </DialogTitle>
            </DialogHeader>

            {/* Filters */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search services..."
                  value={importSearch}
                  onChange={(e) => setImportSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <select
                value={importCategoryFilter}
                onChange={(e) => setImportCategoryFilter(e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
              >
                <option value="">All categories ({smmServices.length})</option>
                {smmCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat} ({smmServices.filter((s) => s.category === cat).length})
                  </option>
                ))}
              </select>
            </div>

            {/* Select all / deselect */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {selectedImports.size} selected of {filteredSmmServices.length} shown
              </span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={selectAllFiltered}>
                  <CheckSquare className="w-4 h-4 mr-1" /> Select all
                </Button>
                <Button variant="ghost" size="sm" onClick={deselectAllFiltered}>
                  <Square className="w-4 h-4 mr-1" /> Deselect all
                </Button>
              </div>
            </div>

            {/* Services list */}
            <div className="flex-1 overflow-y-auto border border-border rounded-lg min-h-0">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card z-10">
                  <tr className="border-b border-border">
                    <th className="w-10 py-2 px-2"></th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">ID</th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">Service</th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">Category</th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">Rate/1K</th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">Min</th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">Max</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSmmServices.map((s) => (
                    <tr
                      key={s.service}
                      className={`border-b border-border/50 cursor-pointer hover:bg-secondary/50 transition-colors ${
                        selectedImports.has(s.service) ? "bg-primary/5" : ""
                      }`}
                      onClick={() => toggleImportSelect(s.service)}
                    >
                      <td className="py-2 px-2 text-center">
                        <Checkbox
                          checked={selectedImports.has(s.service)}
                          onCheckedChange={() => toggleImportSelect(s.service)}
                        />
                      </td>
                      <td className="py-2 px-2 text-muted-foreground">{s.service}</td>
                      <td className="py-2 px-2 font-medium max-w-[200px] truncate">{s.name}</td>
                      <td className="py-2 px-2 text-muted-foreground max-w-[150px] truncate">{s.category}</td>
                      <td className="py-2 px-2">${parseFloat(s.rate).toFixed(2)}</td>
                      <td className="py-2 px-2">{s.min}</td>
                      <td className="py-2 px-2">{s.max}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredSmmServices.length === 0 && (
                <div className="py-8 text-center text-muted-foreground">
                  No services match your search
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setImportDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleImportSelected} disabled={importing || selectedImports.size === 0}>
                {importing ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Importing...</>
                ) : (
                  <>Import {selectedImports.size} service{selectedImports.size !== 1 ? "s" : ""}</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminServices;
