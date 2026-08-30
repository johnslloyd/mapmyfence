import { Layout } from "@/components/Layout";
import { useRoute, Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useProperty, useProject, useEstimates, useCreateProject } from "@/hooks/use-projects";
import { EditPropertyDialog } from "@/components/EditPropertyDialog";
import { PropertySatelliteImage } from "@/components/PropertySatelliteImage";
import { PlanThumbnail } from "@/lib/planPreview";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Fence, Sprout, Plus, ArrowRight, Pencil } from "lucide-react";
import { useState } from "react";
import NotFound from "./not-found";
import { format } from "date-fns";

// Reimagined 2026-08-30 (a plain centered list originally, then a
// dashboard-grid version — see git history and CLAUDE.md's "Property
// page redesign" notes for both). This is round two: a "Property
// Dossier" layout picked after comparing it against a Bento-grid
// alternative — a fixed left rail of property FACTS (address, notes,
// added date — things true about the ADDRESS, not any one project)
// beside a denser project list on the right. Same routes, same data
// hooks as before.
//
// The plan-preview illustration moved from the property-level sidebar
// to EACH PROJECT'S OWN ROW — explicit direction, not a style choice:
// a property can hold multiple projects (another fence plan, eventually
// lawn care), each with its own fence lines, so a single property-level
// illustration was already the wrong level of the data model even
// before this redesign — it only ever showed the "primary" fence
// project's shape and silently ignored any others. Per-project is the
// correct home for it, not just a nicer one.

const STATUS_BADGE: Record<string, string> = {
  planning: "bg-gray-100 text-gray-700",
  quoting: "bg-amber-100 text-amber-700",
  "in-progress": "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
};

// Moved from a small top-right text link to its own row below the
// project list, per direct feedback — reads as "an empty project you
// can click on," not a toolbar action. Same size/padding rhythm as a
// real project row (FenceProjectRow/LawnCareProjectRow) so it sits in
// the list as a natural next item, just dashed and centered instead of
// carrying a thumbnail/stats.
function AddProjectRow({ propertyId }: { propertyId: number }) {
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
        <button className="group w-full flex items-center justify-center gap-2.5 py-7 rounded-xl border-2 border-dashed border-border text-muted-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-colors">
          <Plus className="w-5 h-5" />
          <span className="font-medium text-sm">Add a project</span>
        </button>
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

function FenceProjectRow({ project, guestQuery }: { project: any; guestQuery: string }) {
  const { data: detail } = useProject(project.id, { isGuest: !!guestQuery });
  const { data: estimates } = useEstimates(project.id);
  const totalFeet = detail?.fenceLines?.reduce((sum: number, l: any) => sum + (l.length || 0), 0) || 0;
  const gateCount = detail?.fenceLines?.reduce((sum: number, l: any) => sum + (l.gates?.length || 0), 0) || 0;
  const cost = estimates?.options?.[0]?.totalCost;

  return (
    <Link href={`/editor/${project.id}${guestQuery}`}>
      <div className="group flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 py-6 -mx-2 px-2 rounded-xl hover:bg-secondary/30 transition-colors cursor-pointer">
        {/* 3x the round-two thumbnail size (112x80 -> 336x240) — full
            width on mobile, fixed width on sm+, both sides keeping the
            same 160:116 aspect PlanThumbnail's viewBox already draws to,
            so nothing inside it needed to change, just the frame. */}
        <div className="w-full sm:w-[252px] aspect-[160/116] sm:h-[180px] rounded-lg overflow-hidden border border-border bg-card shrink-0">
          <PlanThumbnail fenceLines={detail?.fenceLines || []} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <span className="font-semibold text-lg truncate">{project.name}</span>
            <Badge variant="outline" className={`text-xs h-5 px-2 font-normal capitalize border-transparent shrink-0 ${STATUS_BADGE[project.status] || STATUS_BADGE.planning}`}>
              {project.status}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground mt-1">Fence &middot; Updated {format(new Date(project.createdAt), "MMM d")}</div>
          <div className="flex gap-8 mt-5">
            <div>
              <div className="font-mono text-base font-medium">{totalFeet > 0 ? `${totalFeet.toFixed(0)} ft` : "—"}</div>
              <div className="text-xs text-muted-foreground">Length</div>
            </div>
            <div>
              <div className="font-mono text-base font-medium">{cost != null ? `$${cost.toFixed(0)}` : "—"}</div>
              <div className="text-xs text-muted-foreground">Est. cost</div>
            </div>
            <div>
              <div className="font-mono text-base font-medium">{gateCount}</div>
              <div className="text-xs text-muted-foreground">{gateCount === 1 ? "Gate" : "Gates"}</div>
            </div>
          </div>
        </div>
        <ArrowRight className="hidden sm:block w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      </div>
    </Link>
  );
}

function LawnCareProjectRow({ project, guestQuery }: { project: any; guestQuery: string }) {
  return (
    <Link href={`/editor/${project.id}${guestQuery}`}>
      <div className="group flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 py-6 -mx-2 px-2 rounded-xl hover:bg-secondary/30 transition-colors cursor-pointer">
        <div className="w-full sm:w-[252px] aspect-[160/116] sm:h-[180px] rounded-lg border border-dashed border-border bg-card shrink-0 flex items-center justify-center">
          <Sprout className="w-8 h-8 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <span className="font-semibold text-lg truncate">{project.name}</span>
            <Badge variant="outline" className={`text-xs h-5 px-2 font-normal capitalize border-transparent shrink-0 ${STATUS_BADGE[project.status] || STATUS_BADGE.planning}`}>
              {project.status}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground mt-1">Lawn Care &middot; Updated {format(new Date(project.createdAt), "MMM d")}</div>
        </div>
        <ArrowRight className="hidden sm:block w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      </div>
    </Link>
  );
}

function PropertyOverviewContent({ propertyId, isGuest }: { propertyId: number; isGuest: boolean }) {
  const { data: property, isLoading } = useProperty(propertyId, { isGuest });
  const guestQuery = isGuest ? "?guest=true" : "";

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    );
  }

  if (!property) return <NotFound />;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <Link href="/properties" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground w-fit mb-5">
        <ArrowLeft className="w-4 h-4" /> Back to Properties
      </Link>

      {/* Rail darker (bg-card), main lighter (bg-panel) — flipped from
          the initial pass per direct feedback ("the left rail is
          slightly lighter than the right section, I'd like to flip
          that"). The outer wrapper now carries bg-panel so MAIN
          inherits it with no explicit class of its own; the rail
          overrides back to bg-card/text-card-foreground. */}
      <div className="border border-card-border rounded-[18px] overflow-hidden bg-panel grid grid-cols-1 lg:grid-cols-[288px_1fr]">
        {/* RAIL — facts about the PROPERTY (the address), not any one
            project: name, address, notes, when it was added. No fence
            data here on purpose, see the file-level comment. */}
        <div className="bg-card text-card-foreground border-b lg:border-b-0 lg:border-r border-border p-5">
          <h1 className="font-display text-[19px] leading-tight font-bold">{property.name}</h1>
          {property.address && <p className="text-muted-foreground text-[12.5px] mt-1">{property.address}</p>}

          <div className="mt-3">
            <PropertySatelliteImage address={property.address} />
          </div>

          <EditPropertyDialog property={property}>
            <Button variant="outline" size="sm" className="gap-1.5 mt-3 w-full">
              <Pencil className="w-3.5 h-3.5" /> Edit Property
            </Button>
          </EditPropertyDialog>

          <div className="mt-[18px] pt-[18px] border-t border-border divide-y divide-border">
            <div className="pb-[11px]">
              <div className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground">Address</div>
              <div className="text-[12.5px] mt-0.5">{property.address || "No address provided"}</div>
            </div>
            <div className="py-[11px]">
              <div className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground">Notes</div>
              <div className="text-[12.5px] mt-0.5 text-muted-foreground">{property.description || "No notes added"}</div>
            </div>
            <div className="pt-[11px]">
              <div className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground">Added</div>
              <div className="text-[12.5px] mt-0.5">{format(new Date(property.createdAt), "MMMM d, yyyy")}</div>
            </div>
          </div>

          <div className="mt-[18px] pt-4 border-t border-border grid grid-cols-2 gap-3">
            <div>
              <div className="font-mono text-base font-semibold text-primary">{property.projects.length}</div>
              <div className="text-[10px] text-muted-foreground">{property.projects.length === 1 ? "Project" : "Projects"}</div>
            </div>
          </div>
        </div>

        {/* MAIN — every project, each carrying its own plan preview and
            its own stats. */}
        <div className="p-5 md:p-6">
          <div className="mb-3">
            <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Projects ({property.projects.length})</span>
          </div>
          {property.projects.length > 0 && (
            <div className="divide-y divide-border mb-2">
              {property.projects.map((project: any) =>
                project.type === "fence" ? (
                  <FenceProjectRow key={project.id} project={project} guestQuery={guestQuery} />
                ) : (
                  <LawnCareProjectRow key={project.id} project={project} guestQuery={guestQuery} />
                )
              )}
            </div>
          )}
          <AddProjectRow propertyId={property.id} />
        </div>
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

  if (!propertyId || isNaN(propertyId)) return <Layout><NotFound /></Layout>;

  return (
    <Layout>
      <PropertyOverviewContent propertyId={propertyId} isGuest={isGuest} />
    </Layout>
  );
}
