import { Layout } from "@/components/Layout";
import { useRoute, Link } from "wouter";
import { useProject, useEstimates } from "@/hooks/use-projects";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Printer, ClipboardCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  STORE_LABELS,
  MATERIAL_TYPE_LABELS,
  MATERIAL_TYPE_ORDER,
  consolidateMaterials,
} from "@/lib/estimates";
import NotFound from "./not-found";

// Checked-item state is per (project, store), local to this device — a
// real shopping trip can span days, so plain component state (reset on
// navigation) isn't enough, but this also isn't the kind of thing that
// needs a schema/table: no other viewer needs to see it, and it's fine
// if it goes stale after a project's fence lines change materially
// (the same simplification pendingFenceLine already makes elsewhere).
function storageKey(projectId: number, store: string) {
  return `shoppingListChecked:${projectId}:${store}`;
}

function useCheckedItems(projectId: number, store: string) {
  const key = storageKey(projectId, store);
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      setChecked(raw ? JSON.parse(raw) : {});
    } catch {
      setChecked({});
    }
  }, [key]);

  const toggle = (id: number) => {
    setChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // Best-effort — a full/blocked localStorage just means checks
        // don't persist across reloads, not a broken page.
      }
      return next;
    });
  };

  return { checked, toggle };
}

function ShoppingListContent({ projectId, isGuest }: { projectId: number; isGuest: boolean }) {
  // Every hook this component uses is called unconditionally, every
  // render, in this fixed order — the early returns below only ever
  // affect what gets rendered, never which hooks run.
  const { data: project, isLoading: isProjectLoading } = useProject(projectId, { isGuest });
  const { data: estimates, isLoading: isEstimatesLoading, error } = useEstimates(projectId);
  const [selectedStore, setSelectedStore] = useState<string | null>(null);

  const options = estimates?.options ?? [];
  const active = options.find((o) => o.store === selectedStore) ?? options[0] ?? null;
  const materials = active ? consolidateMaterials(active.materials) : [];
  const { checked, toggle } = useCheckedItems(projectId, active?.store ?? "none");

  const backHref = `/editor/${projectId}${isGuest ? "?guest=true" : ""}`;

  if (isProjectLoading || isEstimatesLoading) {
    return (
      <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (!project) return <NotFound />;

  if (error || !active) {
    return (
      <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-4">
        <Link href={backHref} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground w-fit">
          <ArrowLeft className="w-4 h-4" /> Back to Editor
        </Link>
        <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-lg">
          <p className="text-sm">
            {error ? "Error calculating estimates." : "Add a fence line to build a shopping list."}
          </p>
        </div>
      </div>
    );
  }

  const checkedCount = materials.filter((m) => checked[m.id]).length;
  const progressPct = materials.length ? Math.round((checkedCount / materials.length) * 100) : 0;

  const grouped = MATERIAL_TYPE_ORDER
    .map((type) => ({ type, items: materials.filter((m) => m.type === type) }))
    .filter((g) => g.items.length > 0);
  // Any type not in the known order still gets shown, just last.
  const knownTypes = new Set(MATERIAL_TYPE_ORDER);
  const leftover = materials.filter((m) => !knownTypes.has(m.type));
  if (leftover.length) grouped.push({ type: "other", items: leftover });

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between gap-4 print:hidden">
        <Link href={backHref} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Back to Editor
        </Link>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => window.print()}>
          <Printer className="w-4 h-4" /> Print
        </Button>
      </div>

      <div className="space-y-1">
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <ClipboardCheck className="w-6 h-6 text-primary" /> Shopping List
        </h1>
        <p className="text-muted-foreground text-sm">
          {project.name}
          {project.address ? ` — ${project.address}` : ""}
        </p>
      </div>

      {options.length > 1 && (
        <div className="grid grid-cols-2 gap-2 print:hidden">
          {options.map((option, i) => (
            <button
              key={option.store}
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
      <p className="hidden print:block text-sm text-muted-foreground -mt-4">
        Shopping at {STORE_LABELS[active.store] || active.store}
      </p>

      <div className="space-y-2 print:hidden">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{checkedCount} of {materials.length} items checked</span>
          <span>{progressPct}%</span>
        </div>
        <Progress value={progressPct} />
      </div>

      <div className="space-y-6">
        {grouped.map((group) => (
          <div key={group.type} className="space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {MATERIAL_TYPE_LABELS[group.type] || group.type}
            </h2>
            <div className="divide-y rounded-lg border">
              {group.items.map((item) => (
                <label
                  key={item.id}
                  className={cn(
                    "flex items-center gap-3 p-3 cursor-pointer transition-colors hover:bg-secondary/40",
                    checked[item.id] && "bg-secondary/30"
                  )}
                >
                  <Checkbox checked={!!checked[item.id]} onCheckedChange={() => toggle(item.id)} className="print:hidden" />
                  <span className="hidden print:inline-block h-4 w-4 shrink-0 rounded-sm border border-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className={cn("text-sm font-medium", checked[item.id] && "line-through text-muted-foreground")}>
                      {item.quantity}x {item.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ${item.price.toFixed(2)} {item.unit || "each"}
                      {item.sku ? ` · SKU ${item.sku}` : ""}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-0.5 shrink-0 print:hidden">
                    <span className="text-sm font-semibold">${item.totalCost.toFixed(2)}</span>
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs underline decoration-dotted underline-offset-2 text-primary hover:text-primary/80"
                      >
                        Order online
                      </a>
                    )}
                  </div>
                  <span className="hidden print:inline text-sm font-semibold shrink-0">${item.totalCost.toFixed(2)}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center font-bold text-lg pt-2 border-t">
        <span>Total</span>
        <span>${active.totalCost.toFixed(2)}</span>
      </div>
      <p className="text-xs text-muted-foreground">
        Prices are based on current material listings from {STORE_LABELS[active.store] || active.store} and do
        not include taxes, delivery, or labor. Quantities are estimates — verify against your actual layout
        before checkout.
      </p>
    </div>
  );
}

export default function ShoppingList() {
  const [match, params] = useRoute("/editor/:id/shopping-list");
  const projectId = match && params?.id ? parseInt(params.id) : undefined;
  const { isAuthenticated } = useAuth();
  const searchParams = new URLSearchParams(window.location.search);
  const isGuest = searchParams.get("guest") === "true" && !isAuthenticated;

  if (!projectId || isNaN(projectId)) return <NotFound />;

  return (
    <Layout>
      <ShoppingListContent projectId={projectId} isGuest={isGuest} />
    </Layout>
  );
}
