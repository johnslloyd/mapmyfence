import { Layout } from "@/components/Layout";
import { useRoute, Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useAdminUser, useAdminProject, useAdminDeleteUser } from "@/hooks/use-admin";
import { useEffect, useState } from "react";
import { ArrowLeft, Fence, Sprout, Shield, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { PlanThumbnail } from "@/lib/planPreview";
import { STORE_LABELS, MATERIAL_TYPE_LABELS, MATERIAL_TYPE_ORDER, consolidateMaterials } from "@/lib/estimates";
import { cn } from "@/lib/utils";
import NotFound from "./not-found";

const PROJECT_TYPE_ICON: Record<string, typeof Fence> = { fence: Fence, lawn_care: Sprout };

// The drill-down from Admin.tsx's user list — same shape a user sees on
// their own /properties (name, address, projects), fetched for someone
// else's id instead of the viewer's own. Read-only, same as the list
// page; see CLAUDE.md's "Admin panel" section.
export default function AdminUserDetail() {
  const [match, params] = useRoute("/admin/users/:id");
  const { isAuthenticated, user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const { data, isLoading } = useAdminUser(match ? params?.id : undefined);
  // Which fence project's diagram/estimate dialog is open, if any —
  // lawn_care rows don't open this (no fence lines to show yet).
  const [openProjectId, setOpenProjectId] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && (!isAuthenticated || !user?.isAdmin)) {
      setLocation("/");
    }
  }, [loading, isAuthenticated, user, setLocation]);

  if (!match) return <NotFound />;

  if (loading || isLoading || !isAuthenticated || !user?.isAdmin) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto p-4 md:p-8 text-sm text-muted-foreground">Loading...</div>
      </Layout>
    );
  }

  if (!data) return <Layout><NotFound /></Layout>;

  const { user: targetUser, properties } = data;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
        <Link href="/admin" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground w-fit">
          <ArrowLeft className="w-4 h-4" /> Back to Admin
        </Link>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-2xl font-bold flex items-center gap-2 flex-wrap">
              {targetUser.email}
              <Badge variant={targetUser.plan === "pro" ? "default" : "secondary"} className="capitalize">{targetUser.plan}</Badge>
              {targetUser.isAdmin && (
                <Badge variant="outline" className="gap-1"><Shield className="w-3 h-3" /> Admin</Badge>
              )}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Joined {format(new Date(targetUser.createdAt), "MMMM d, yyyy")}</p>
          </div>
          {/* Hidden for your own account — the server also refuses this
              (can't delete yourself through the admin panel), but there's
              no reason to show a button that always errors. */}
          {targetUser.id !== user?.id && (
            <DeleteUserButton targetUser={targetUser} propertyCount={properties.length} />
          )}
        </div>

        <div>
          <h2 className="font-display font-semibold text-lg mb-3">Properties ({properties.length})</h2>
          {properties.length === 0 ? (
            <div className="text-sm text-muted-foreground border-2 border-dashed rounded-lg py-10 text-center">
              No properties yet.
            </div>
          ) : (
            <div className="space-y-3">
              {properties.map((p: any) => (
                <div key={p.id} className="bg-card border border-card-border rounded-xl p-4">
                  <div className="font-medium">{p.name}</div>
                  <div className="text-sm text-muted-foreground">{p.address || "No address provided"}</div>
                  {p.projects.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {p.projects.map((proj: any) => {
                        const Icon = PROJECT_TYPE_ICON[proj.type] || Fence;
                        const isFence = proj.type === "fence";
                        return (
                          <button
                            key={proj.id}
                            type="button"
                            onClick={() => isFence && setOpenProjectId(proj.id)}
                            disabled={!isFence}
                            className={cn(
                              "flex items-center gap-2 text-sm bg-secondary/40 rounded-lg px-3 py-2 w-full text-left",
                              isFence ? "hover:bg-secondary/70 transition-colors cursor-pointer" : "cursor-default"
                            )}
                          >
                            <Icon className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span className="font-medium truncate">{proj.name}</span>
                            <Badge variant="outline" className="text-[10px] h-4 px-1.5 capitalize font-normal ml-auto shrink-0">
                              {proj.status}
                            </Badge>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AdminProjectDialog projectId={openProjectId} onOpenChange={(open) => !open && setOpenProjectId(null)} />
    </Layout>
  );
}

// Real, permanent delete — the account and every property/project/
// fence line it owns (server/storage.ts's deleteUserAndData). A plain
// button + confirm click was deliberately not enough for something
// this irreversible — AlertDialog forces a second, explicit step, and
// names exactly what's being removed (the real property count, not a
// generic "are you sure") before the destructive action is reachable.
function DeleteUserButton({ targetUser, propertyCount }: { targetUser: any; propertyCount: number }) {
  const [, setLocation] = useLocation();
  const deleteUser = useAdminDeleteUser();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10 hover:border-destructive/60">
          <Trash2 className="w-3.5 h-3.5" /> Delete Account
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {targetUser.email}?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes their account and {propertyCount === 0 ? "any properties" : propertyCount === 1 ? "their 1 property" : `all ${propertyCount} properties`} — every
            fence line, gate, and estimate under {propertyCount === 1 ? "it" : "them"}. This can't be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className={buttonVariants({ variant: "destructive" })}
            disabled={deleteUser.isPending}
            onClick={async () => {
              try {
                await deleteUser.mutateAsync(targetUser.id);
                setLocation("/admin");
              } catch {
                // Toast already shown by the hook's onError. Radix
                // closes the AlertDialog either way, but only navigate
                // away on real success — a failed delete leaves this
                // user's page exactly as it was, not silently gone.
              }
            }}
          >
            {deleteUser.isPending ? "Deleting…" : "Delete Account"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// The diagram + line detail + materials cost for one fence project —
// same underlying data (buildPlanPreview, calculateEstimate) a user
// sees in their own editor sidebar/Dossier row, read-only and fetched
// cross-user via the admin-only route.
function AdminProjectDialog({ projectId, onOpenChange }: { projectId: number | null; onOpenChange: (open: boolean) => void }) {
  const { data, isLoading } = useAdminProject(projectId ?? undefined);
  const [selectedStore, setSelectedStore] = useState<string | null>(null);

  const project = data?.project;
  const estimate = data?.estimate;
  const options = estimate?.options ?? [];
  const active = options.find((o: any) => o.store === selectedStore) ?? options[0];
  const totalFeet = project?.fenceLines?.reduce((sum: number, l: any) => sum + (l.length || 0), 0) || 0;
  const gateCount = project?.fenceLines?.reduce((sum: number, l: any) => sum + (l.gates?.length || 0), 0) || 0;

  return (
    <Dialog open={projectId !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        {/* Radix requires a DialogTitle present on every render, loading
            state included, or it logs an accessibility warning — real
            title once loaded, a plain placeholder while fetching. */}
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2 flex-wrap">
            {project ? (
              <>
                {project.name}
                <Badge variant="outline" className="text-[10px] h-5 px-1.5 capitalize font-normal">{project.status}</Badge>
              </>
            ) : (
              "Loading project…"
            )}
          </DialogTitle>
          {project && (
            <DialogDescription>{project.property?.address || "No address provided"}</DialogDescription>
          )}
        </DialogHeader>

        {isLoading || !project ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-[220px_1fr] gap-5">
              <div className="w-full aspect-[160/116] rounded-lg overflow-hidden border border-border bg-panel shrink-0">
                <PlanThumbnail fenceLines={project.fenceLines || []} />
              </div>
              <div className="flex flex-col justify-center gap-3">
                <div className="flex gap-6">
                  <div>
                    <div className="font-mono text-base font-medium">{totalFeet > 0 ? `${totalFeet.toFixed(0)} ft` : "—"}</div>
                    <div className="text-xs text-muted-foreground">Total length</div>
                  </div>
                  <div>
                    <div className="font-mono text-base font-medium">{active ? `$${active.totalCost.toFixed(2)}` : "—"}</div>
                    <div className="text-xs text-muted-foreground">Est. cost</div>
                  </div>
                  <div>
                    <div className="font-mono text-base font-medium">{gateCount}</div>
                    <div className="text-xs text-muted-foreground">{gateCount === 1 ? "Gate" : "Gates"}</div>
                  </div>
                </div>
                {/* Per-line detail — a project can hold more than one
                    fence line, each with its own material/height. */}
                {project.fenceLines?.length > 0 && (
                  <div className="space-y-1 text-sm">
                    {project.fenceLines.map((line: any) => (
                      <div key={line.id} className="flex items-center justify-between gap-2 text-muted-foreground">
                        <span className="truncate">{line.name}</span>
                        <span className="font-mono text-xs shrink-0">
                          {(line.length || 0).toFixed(0)} ft · {line.material || "unspecified"}{line.height ? ` · ${line.height}ft` : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-border pt-4">
              {options.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nothing drawn yet — no materials to estimate.</p>
              ) : (
                <>
                  {options.length > 1 && (
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {options.map((option: any, i: number) => (
                        <button
                          key={option.store}
                          type="button"
                          onClick={() => setSelectedStore(option.store)}
                          className={cn(
                            "rounded-lg border px-3 py-2 text-left transition-colors",
                            option.store === active.store ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                          )}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-medium text-muted-foreground truncate">
                              {STORE_LABELS[option.store] || option.store}
                            </span>
                            {i === 0 && (
                              <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-normal border-primary/30 text-primary shrink-0">
                                Best price
                              </Badge>
                            )}
                          </div>
                          <div className="font-bold">${option.totalCost.toFixed(2)}</div>
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="space-y-1.5">
                    {MATERIAL_TYPE_ORDER
                      .flatMap((type) => consolidateMaterials(active.materials).filter((m: any) => m.type === type))
                      .map((item: any) => (
                        <div key={item.id} className="flex justify-between items-center text-sm gap-2">
                          <span className="min-w-0 truncate">
                            {item.quantity}x {item.name}
                            <span className="text-muted-foreground"> ({MATERIAL_TYPE_LABELS[item.type] || item.type})</span>
                          </span>
                          <span className="shrink-0 font-mono">${item.totalCost.toFixed(2)}</span>
                        </div>
                      ))}
                  </div>
                  <div className="flex justify-between items-center font-bold pt-3 mt-3 border-t border-border">
                    <span>Total ({STORE_LABELS[active.store] || active.store}):</span>
                    <span>${active.totalCost.toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
