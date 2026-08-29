import { Layout } from "@/components/Layout";
import { useProperties, useDeleteProperty } from "@/hooks/use-projects";
import { AddPropertyDialog } from "@/components/AddPropertyDialog";
import { Link } from "wouter";
import { MapPin, Search, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

// Renamed from Projects.tsx in the Property/Project restructure — this
// lists PROPERTIES now (just addresses), not the typed projects under
// them. Status used to live here directly; now a property can hold
// multiple projects, each with its own status, so the status badge only
// makes sense to show when there's exactly one (the common case today,
// since every property still has exactly one auto-created fence
// project) — otherwise show a project count instead.
export default function Properties() {
  const { data: properties, isLoading } = useProperties();
  const deleteProperty = useDeleteProperty();
  const [search, setSearch] = useState("");

  const filteredProperties = properties?.filter((p: any) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.address && p.address.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">My Properties</h1>
            <p className="text-muted-foreground">Manage and track every yard project, by property.</p>
          </div>
        </div>

        {/* Filters */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search properties by name or address..."
            className="pl-10 rounded-xl bg-card"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Property Grid */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-64 rounded-2xl" />
            ))}
          </div>
        ) : filteredProperties && filteredProperties.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProperties.map((property: any) => {
              const projects = property.projects || [];
              const singleProject = projects.length === 1 ? projects[0] : null;
              return (
                <div key={property.id} className="group bg-card hover:bg-card/50 rounded-2xl p-6 border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col relative overflow-hidden">
                  {/* Status / project-count Indicator */}
                  <div className={`absolute top-0 right-0 px-4 py-1.5 rounded-bl-2xl text-xs font-bold uppercase tracking-wider ${
                    singleProject
                      ? singleProject.status === 'completed' ? 'bg-green-100 text-green-700' :
                        singleProject.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {singleProject ? singleProject.status : `${projects.length} projects`}
                  </div>

                  {/* Delete Control */}
                  <div className="absolute top-16 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 bg-card border border-transparent text-destructive hover:bg-destructive/10 hover:border-destructive/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteProperty.mutate(property.id);
                      }}
                      disabled={deleteProperty.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <Link href={`/properties/${property.id}`}>
                    <div className="mb-4 cursor-pointer">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                        <MapPin className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="text-xl font-bold font-display group-hover:text-primary transition-colors line-clamp-1">
                        {property.name}
                      </h3>
                      <p className="text-muted-foreground text-sm mt-1 line-clamp-1">
                        {property.address || "No address provided"}
                      </p>
                    </div>

                    {property.description && (
                      <p className="text-sm text-muted-foreground/80 line-clamp-2 mb-4 flex-1">
                        {property.description}
                      </p>
                    )}

                    <div className="pt-4 mt-auto border-t flex items-center justify-between text-xs text-muted-foreground font-medium">
                      <span>Created {format(new Date(property.createdAt), 'MMM d, yyyy')}</span>
                      <span>View Details &rarr;</span>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-card rounded-3xl border border-dashed">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-bold text-lg">No properties found</h3>
            <p className="text-muted-foreground mt-1 max-w-sm">
              Try adjusting your search or add a new property to get started.
            </p>
          </div>
        )}
        <div className="flex justify-start mt-8">
            <AddPropertyDialog />
        </div>
      </div>
    </Layout>
  );
}
