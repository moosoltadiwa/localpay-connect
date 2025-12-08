import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Search, Package, TrendingUp, Star } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

const Services = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: services, isLoading } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("is_active", true)
        .order("category", { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  // Get unique categories
  const categories = services
    ? [...new Set(services.map((s) => s.category))]
    : [];

  // Filter services
  const filteredServices = services?.filter((service) => {
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || service.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Group by category
  const groupedServices = filteredServices?.reduce((acc, service) => {
    if (!acc[service.category]) {
      acc[service.category] = [];
    }
    acc[service.category].push(service);
    return acc;
  }, {} as Record<string, typeof services>);

  return (
    <DashboardLayout title="Services">
      <div className="p-4 md:p-6 space-y-6">
        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search services..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedCategory === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(null)}
                >
                  All
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : filteredServices?.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">No services found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filter criteria
              </p>
            </CardContent>
          </Card>
        ) : (
          Object.entries(groupedServices || {}).map(([category, categoryServices]) => (
            <div key={category} className="space-y-4">
              <div className="flex items-center gap-2">
                <h2 className="font-display font-bold text-xl">{category}</h2>
                <Badge variant="secondary">{categoryServices?.length} services</Badge>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryServices?.map((service) => (
                  <Card key={service.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-base line-clamp-2">
                              {service.name}
                            </CardTitle>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {service.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {service.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Min: {service.min_quantity.toLocaleString()}
                        </span>
                        <span className="text-muted-foreground">
                          Max: {service.max_quantity.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-border">
                        <div>
                          <span className="text-2xl font-bold text-primary">
                            ${service.price_per_1000.toFixed(2)}
                          </span>
                          <span className="text-sm text-muted-foreground"> / 1k</span>
                        </div>
                        <Link to="/dashboard">
                          <Button size="sm">Order Now</Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))
        )}

        {/* Stats Card */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Star className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Quality Guaranteed</h3>
                <p className="text-sm text-muted-foreground">
                  All our services come with a quality guarantee. If you're not satisfied, we'll make it right.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Services;