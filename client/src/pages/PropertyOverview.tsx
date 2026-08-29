import { Layout } from "@/components/Layout";
import { useRoute, Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useProperty, useCreateProject } from "@/hooks/use-projects";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Fence, Sprout, Plus, ArrowRight } from "lucide-react";
import { useState } from "react";
import NotFound from "./not-found";

// New page — the home for a property's projects, introduced by the
// Property/Project restructure (see CLAUDE.md). Most properties will
// show exactly one project (the auto-created fence plan) for a while,
// since lawn care isn't built yet; this is where "+ Add Project" and
// its type picker live, ready for a second project (another fence
// plan, or eventually lawn care) without changing the property-creation
// flow at all.

const PROJECT_TYPE_META: Record<string, { label: string; icon: typeof Fence }> = {
  fence: { label: "Fence", icon: Fence },
  lawn_care: { label: "Lawn Care", icon: Sprout },
};

function AddProjectDialog({ propertyId }: { propertyId: number }) {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { mutateAsync, isPending } = useCreateProject();

  const handleAddFence = async () => {
    try {
      const project = await mutateAsync({ propertyId, type: "fence", name: "New Fence Plan", status: "planning" });
      setOpen(false);
      setLocation(`/editor/${project.id}`);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" /> Add Project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">What are you planning?</DialogTitle>
          <DialogDescription>Add another project to this property.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={handleAddFence}
            disabled={isPending}
            className="flex flex-col items-center gap-2 rounded-xl border border-border p-5 text-center hover:border-primary/50 hover:bg-primary/5 transition-colors disabled:opacity-50"
          >
            <Fence className="w-6 h-6 text-primary" />
            <span className="font-medium text-sm">Fence</span>
          </button>
          <div className="flex flex-col items-center gap-2 rounded-xl border border-border p-5 text-center opacity-50 cursor-not-allowed">
            <Sprout className="w-6 h-6 text-muted-foreground" />
            <span className="font-medium text-sm">Lawn Care</span>
            <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-normal">Coming soon</Badge>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PropertyOverviewContent({ propertyId, isGuest }: { propertyId: number; isGuest: boolean }) {
  const { data: property, isLoading } = useProperty(propertyId, { isGuest });
  const searchParams = new URLSearchParams(window.location.search);
  const guestQuery = isGuest ? "?guest=true" : "";

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    );
  }

  if (!property) return <NotFound />;

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-6">
      <Link href="/properties" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground w-fit">
        <ArrowLeft className="w-4 h-4" /> Back to Properties
      </Link>

      <div>
        <h1 className="font-display text-2xl font-bold">{property.name}</h1>
        {property.address && <p className="text-muted-foreground text-sm mt-1">{property.address}</p>}
        {property.description && <p className="text-sm text-muted-foreground/80 mt-2">{property.description}</p>}
      </div>

      <div className="flex items-center justify-between">
        <h2 className="font-display font-semibold text-lg">Projects</h2>
        <AddProjectDialog propertyId={property.id} />
      </div>

      <div className="space-y-3">
        {property.projects.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
            <p className="text-sm">No projects yet — add one to get started.</p>
          </div>
        ) : (
          property.projects.map((project: any) => {
            const meta = PROJECT_TYPE_META[project.type] || { label: project.type, icon: Fence };
            const Icon = meta.icon;
            return (
              <Link key={project.id} href={`/editor/${project.id}${guestQuery}`}>
                <div className="flex items-center gap-4 bg-card border border-border rounded-xl p-5 hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer">
                  <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{project.name}</div>
                    <div className="text-xs text-muted-foreground">{meta.label}</div>
                  </div>
                  <Badge variant="outline" className="text-xs font-normal shrink-0 capitalize">{project.status}</Badge>
                  <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function PropertyOverview() {
  const [match, params] = useRoute("/properties/:id");
  const propertyId = match && params?.id ? parseInt(params.id) : undefined;
  const { isAuthenticated } = useAuth();
  const searchParams = new URLSearchParams(window.location.search);
  const isGuest = searchParams.get("guest") === "true" && !isAuthenticated;

  if (!propertyId || isNaN(propertyId)) return <NotFound />;

  return (
    <Layout>
      <PropertyOverviewContent propertyId={propertyId} isGuest={isGuest} />
    </Layout>
  );
}
