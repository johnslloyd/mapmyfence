import { Layout } from "@/components/Layout";
import { useProperties, useDeleteProperty, useProject, useEstimates } from "@/hooks/use-projects";
import { useAuth } from "@/hooks/use-auth";
import { AddPropertyDialog } from "@/components/AddPropertyDialog";
import { PropertySatelliteImage } from "@/components/PropertySatelliteImage";
import { Link } from "wouter";
import { Trash2, LandPlot, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { FREE_PROPERTY_LIMIT } from "@shared/routes";

// Renamed from Projects.tsx in the Property/Project restructure — this
// lists PROPERTIES now (just addresses), not the typed projects under
// them. Status used to live here directly; now a property can hold
// multiple projects, each with its own status, so the status badge only
// makes sense to show when there's exactly one (the common case today,
// since every property still has exactly one auto-created fence
// project) — otherwise show a project count instead.
//
// Cards redesigned (2026-08-30), drawing on PropertyOverview.tsx's
// Dossier page — prompted by a real gap: a brand-new user's first (and
// often only) property, with nothing drawn yet, used to render as
// almost nothing here (a MapPin icon, a name, an address, a bare
// "planning" badge). Reusing the Dossier's real satellite image and
// real per-project stats gives even a completely blank property actual
// context — see PropertyCard below.
export default function Properties() {
  const { data: properties, isLoading } = useProperties();
  const { user } = useAuth();
  const deleteProperty = useDeleteProperty();
  const propertyCount = properties?.length ?? 0;
  const isPro = user?.plan === "pro";

  // Search removed for now (2026-08-30) — pulled the whole filter UI
  // and its own "no results match your search" empty state rather than
  // leave a dead input. If it comes back, restore `hasAnyProperties`'s
  // sibling case (search matched nothing vs. genuinely zero properties
  // — see git history / CLAUDE.md for how that used to be split) rather
  // than re-merging them into one generic message.
  const hasAnyProperties = propertyCount > 0;

  return (
    <Layout>
      <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">My Properties</h1>
            <p className="text-muted-foreground">Manage and track every yard project, by property.</p>
          </div>
          {/* Quiet usage indicator, not a second upgrade pitch — the
              real one lives on Account and inside AddPropertyDialog
              once you're actually at the limit. This is just ambient
              awareness of where you stand. */}
          {!isPro && (
            <Link
              href="/account"
              className="text-xs font-mono text-muted-foreground hover:text-foreground border border-border rounded-full px-3 py-1.5 transition-colors shrink-0"
            >
              {propertyCount} / {FREE_PROPERTY_LIMIT} properties (Free)
            </Link>
          )}
        </div>

        {/* Property Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-96 rounded-2xl" />
            ))}
          </div>
        ) : hasAnyProperties ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {properties!.map((property: any) => (
              <PropertyCard
                key={property.id}
                property={property}
                onDelete={(id) => deleteProperty.mutate(id)}
                isDeleting={deleteProperty.isPending}
              />
            ))}
          </div>
        ) : (
          <FirstPropertyOnboarding />
        )}
        {/* The onboarding block above already carries its own prominent
            "Add Your First Property" CTA — a second one here would just
            be a third add-property button on the same empty page (the
            header already has one). Kept for every other state, where
            it's the useful "add another" affordance below a real grid
            or a search-empty box. */}
        {hasAnyProperties && (
          <div className="flex justify-start mt-8">
            <AddPropertyDialog />
          </div>
        )}
      </div>
    </Layout>
  );
}

// The true "zero properties, ever" state — distinct from a search that
// just matched nothing (see hasAnyProperties above). Previously both
// states rendered identically ("No properties found — try adjusting
// your search"), which was flatly wrong for a brand-new account: no
// search happened, there's nothing to adjust. This is genuinely the
// first screen a new signup sees (Dashboard.tsx redirects here whenever
// property count isn't exactly 1), so it carries real orientation
// instead of a dead end — what a property even is, three short steps
// mirroring the homepage's own "HOW IT WORKS" language for consistency,
// and one prominent CTA rather than a small icon + caption.
function FirstPropertyOnboarding() {
  return (
    <div className="bg-card rounded-3xl border border-dashed overflow-hidden">
      <div className="flex flex-col items-center text-center px-6 py-16">
        <div className="w-16 h-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center mb-5">
          <LandPlot className="w-8 h-8" />
        </div>
        <h3 className="font-display text-2xl font-bold">Let's map your first yard</h3>
        <p className="text-muted-foreground mt-2 max-w-md">
          Add your property's address and we'll pull up a real satellite view — draw your fence line on it to get an instant materials list and cost.
        </p>
        <AddPropertyDialog>
          <Button size="lg" className="mt-6 gap-2">
            <Plus className="w-4 h-4" /> Add Your First Property
          </Button>
        </AddPropertyDialog>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border border-t border-border">
        <div className="p-6 flex flex-col gap-1.5">
          <span className="font-mono text-xs text-primary">STEP_01</span>
          <h4 className="font-display font-semibold text-sm">Add your property</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">Give it a name and an address.</p>
        </div>
        <div className="p-6 flex flex-col gap-1.5">
          <span className="font-mono text-xs text-primary">STEP_02</span>
          <h4 className="font-display font-semibold text-sm">Draw your fence line</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">Click points on real satellite imagery.</p>
        </div>
        <div className="p-6 flex flex-col gap-1.5">
          <span className="font-mono text-xs text-primary">STEP_03</span>
          <h4 className="font-display font-semibold text-sm">Get your estimate</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">A full materials list and real cost, instantly.</p>
        </div>
      </div>
    </div>
  );
}

function PropertyCard({
  property,
  onDelete,
  isDeleting,
}: {
  property: any;
  onDelete: (id: number) => void;
  isDeleting: boolean;
}) {
  const projects = property.projects || [];
  const singleProject = projects.length === 1 ? projects[0] : null;
  const isFenceSingle = singleProject?.type === "fence";

  // Real per-project stats, same fetch shape as PropertyOverview's
  // FenceProjectRow — only fires when there's exactly one fence
  // project (the common case), since a multi-project or lawn-care
  // property has no single number to show here.
  const { data: detail } = useProject(isFenceSingle ? singleProject.id : undefined);
  const { data: estimates } = useEstimates(isFenceSingle ? singleProject.id : undefined);
  const totalFeet = detail?.fenceLines?.reduce((sum: number, l: any) => sum + (l.length || 0), 0) || 0;
  const gateCount = detail?.fenceLines?.reduce((sum: number, l: any) => sum + (l.gates?.length || 0), 0) || 0;
  const cost = estimates?.options?.[0]?.totalCost;
  const hasDrawn = totalFeet > 0;

  return (
    <div className="group bg-card rounded-2xl border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col relative overflow-hidden">
      {/* Status / project-count indicator — now overlaid on the
          satellite image, so it carries its own translucent backdrop
          to stay legible over a real photo instead of a flat card bg. */}
      <div className={`absolute top-3 right-3 z-10 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider backdrop-blur-sm ${
        singleProject
          ? singleProject.status === 'completed' ? 'bg-green-100/90 text-green-700' :
            singleProject.status === 'in-progress' ? 'bg-blue-100/90 text-blue-700' :
            'bg-gray-100/90 text-gray-700'
          : 'bg-gray-100/90 text-gray-700'
      }`}>
        {singleProject ? singleProject.status : `${projects.length} projects`}
      </div>

      {/* Delete Control */}
      <div className="absolute top-12 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 bg-card/90 backdrop-blur-sm border border-transparent text-destructive hover:bg-destructive/10 hover:border-destructive/20"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onDelete(property.id);
          }}
          disabled={isDeleting}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <Link href={`/properties/${property.id}`}>
        <div className="cursor-pointer h-full flex flex-col">
          {/* Real satellite imagery — the piece pulled from the Dossier
              page. Gives even a property with nothing drawn yet actual
              visual context ("that's my yard"), not just a generic
              MapPin glyph. */}
          <PropertySatelliteImage address={property.address} flush />

          <div className="p-6 flex flex-col flex-1">
            <h3 className="text-xl font-bold font-display group-hover:text-primary transition-colors line-clamp-1">
              {property.name}
            </h3>
            <p className="text-muted-foreground text-sm mt-1 line-clamp-1">
              {property.address || "No address provided"}
            </p>

            {property.description && (
              <p className="text-sm text-muted-foreground/80 line-clamp-2 mt-3">
                {property.description}
              </p>
            )}

            {/* Real per-project stats when there's something to show,
                honest guidance text when there isn't — the second half
                is the actual fix for "a new user with no lines drawn
                gets very little context": instead of three dashes or
                nothing at all, a plain sentence about what to do next. */}
            {isFenceSingle && (
              hasDrawn ? (
                <div className="flex gap-5 mt-4">
                  <div>
                    <div className="font-mono text-sm font-medium">{totalFeet.toFixed(0)} ft</div>
                    <div className="text-[10px] text-muted-foreground">Length</div>
                  </div>
                  <div>
                    <div className="font-mono text-sm font-medium">{cost != null ? `$${cost.toFixed(0)}` : "—"}</div>
                    <div className="text-[10px] text-muted-foreground">Est. cost</div>
                  </div>
                  <div>
                    <div className="font-mono text-sm font-medium">{gateCount}</div>
                    <div className="text-[10px] text-muted-foreground">{gateCount === 1 ? "Gate" : "Gates"}</div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground/80 mt-4 italic">
                  Nothing drawn yet — click to start mapping your fence.
                </p>
              )
            )}

            <div className="pt-4 mt-auto border-t flex items-center justify-between text-xs text-muted-foreground font-medium">
              <span>Created {format(new Date(property.createdAt), 'MMM d, yyyy')}</span>
              <span>{isFenceSingle && !hasDrawn ? "Start drawing" : "View Details"} &rarr;</span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
