import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Package, Plus, Pencil, Trash2 } from "lucide-react";

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
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [form, setForm] = useState<ServiceForm>(initialForm);
  const [saving, setSaving] = useState(false);

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
      console.error("Delete error:", error);
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

  // Group services by category
  const groupedServices = services.reduce((acc, service) => {
    if (!acc[service.category]) {
      acc[service.category] = [];
    }
    acc[service.category].push(service);
    return acc;
  }, {} as Record<string, Service[]>);

  return (
    <AdminLayout title="Services">
      <div className="flex-1 p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">
            Manage your SMM services and pricing
          </p>
          <Button onClick={handleOpenCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Add Service
          </Button>
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
                Add your first service to get started
              </p>
              <Button onClick={handleOpenCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Add Service
              </Button>
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
                        <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                          Service Name
                        </th>
                        <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                          Price/1000
                        </th>
                        <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                          Min
                        </th>
                        <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                          Max
                        </th>
                        <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                          Active
                        </th>
                        <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {categoryServices.map((service) => (
                        <tr
                          key={service.id}
                          className={`border-b border-border/50 ${
                            !service.is_active ? "opacity-50" : ""
                          }`}
                        >
                          <td className="py-3 px-2">
                            <p className="font-medium text-sm">{service.name}</p>
                            {service.description && (
                              <p className="text-xs text-muted-foreground truncate max-w-xs">
                                {service.description}
                              </p>
                            )}
                          </td>
                          <td className="py-3 px-2 text-sm font-medium">
                            ${Number(service.price_per_1000).toFixed(2)}
                          </td>
                          <td className="py-3 px-2 text-sm">{service.min_quantity}</td>
                          <td className="py-3 px-2 text-sm">{service.max_quantity}</td>
                          <td className="py-3 px-2">
                            <Switch
                              checked={service.is_active}
                              onCheckedChange={() => toggleActive(service)}
                            />
                          </td>
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenEdit(service)}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => {
                                  setSelectedService(service);
                                  setDeleteDialogOpen(true);
                                }}
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
              <DialogTitle>
                {selectedService ? "Edit Service" : "Add New Service"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Service Name *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Instagram Followers"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Input
                  id="category"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="e.g., Instagram"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Service description..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price per 1000 (USD) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={form.price_per_1000}
                  onChange={(e) => setForm({ ...form, price_per_1000: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min">Min Quantity</Label>
                  <Input
                    id="min"
                    type="number"
                    value={form.min_quantity}
                    onChange={(e) => setForm({ ...form, min_quantity: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max">Max Quantity</Label>
                  <Input
                    id="max"
                    type="number"
                    value={form.max_quantity}
                    onChange={(e) => setForm({ ...form, max_quantity: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="active">Active</Label>
                <Switch
                  id="active"
                  checked={form.is_active}
                  onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={saving}>
                {saving ? "Saving..." : selectedService ? "Update" : "Create"}
              </Button>
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
              Are you sure you want to delete "{selectedService?.name}"? This action
              cannot be undone.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={saving}>
                {saving ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminServices;
