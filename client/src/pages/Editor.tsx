import { Layout } from "@/components/Layout";
import { LatLng } from "leaflet";
import { useRoute, useLocation } from "wouter";
import { useProject, useCreateFenceLine, useDeleteFenceLine, useUpdateFenceLine, useEstimates, useCreateGate, useDeleteGate, useMyOrganization, useCreateQuote, useQuotePreview, type MyOrganization } from "@/hooks/use-projects";
import { MapEditorComponent } from "@/components/MapEditorComponent";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, ArrowLeft, Save, Menu, Camera, ClipboardList, Plus } from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import NotFound from "./not-found";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { SignUpToSaveModal } from "@/components/SignUpToSaveModal";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { NewProjectInstructions } from "@/components/NewProjectInstructions";
import { EditFenceLineCard } from "@/components/EditFenceLineCard";
import { NewFenceLineCard } from "@/components/NewFenceLineCard";
import { STORE_LABELS, MATERIAL_LABELS, consolidateMaterials } from "@/lib/estimates";
import { ClipboardCheck, ShieldAlert, Send, Copy, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

type UiState = "HIDDEN" | "INSTRUCTIONS" | "DRAWING" | "SIDEBAR" | "EDITING";

// Default name for a newly-drawn fence line — was "Line 1", "Line 2",
// ... (just a counter, no real information). Users can rename it
// afterward via EditFenceLineCard's Name field.
function defaultLineName(address: string | null | undefined) {
  return address ? `New Fence at ${address}` : "New Fence Line";
}

// Business tier, Phase 1 (2026-09-10) — a plain, stateless trigger
// button, not a self-contained Dialog. Real bug caught live: this used
// to own the Dialog (open/result state) directly, nested inside
// MaterialEstimates → EditorSidebar. `EditorSidebar` (below) is defined
// INLINE inside `Editor`'s render body — a pre-existing pattern this
// component didn't create — so it gets a brand-new function identity on
// every Editor re-render, and React treats `<EditorSidebar/>` as a
// different element type each time, fully UNMOUNTING and remounting
// everything inside it (silently discarding any local state, even
// mid-async-action). `Editor` itself calls `useToast()` for its own
// unrelated actions, so ANY toast firing ANYWHERE (including this
// dialog's own "Quote sent" success toast) re-renders `Editor`, which
// remounts the whole sidebar the INSTANT the quote finishes sending —
// wiping the dialog's `result` state right as it was set, before the
// user ever saw the copyable link. Reproduced live: the network tab
// showed a real 201 and the toast fired, but the dialog itself vanished
// back to its closed, initial state every time.
//
// Real fix, not a workaround: the actual Dialog (SendQuoteDialog below)
// is lifted OUT of this remount-prone subtree entirely and rendered
// once from Editor's own top-level return (a stable component instance
// — Editor itself never remounts, only this inline-defined child does)
// — the same place SignUpToSaveModal already lives. This trigger button
// is the only piece that stays nested inside MaterialEstimates; it's
// pure and stateless (just an onClick callback), so remounting it
// changes nothing observable.
function SendQuoteTrigger({ myOrg, onClick }: { myOrg: MyOrganization | null | undefined; onClick: () => void }) {
  if (!myOrg) return null;
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center gap-2 w-full rounded-md border border-primary bg-primary text-primary-foreground text-sm font-medium py-2 hover:bg-primary/90 transition-colors"
    >
      <Send className="w-4 h-4" /> Send Quote to Customer
    </button>
  );
}

// Rendered once from Editor's stable top-level return — see
// SendQuoteTrigger's comment above for why this can't live nested
// inside EditorSidebar/MaterialEstimates. `open`/`onOpenChange` are
// controlled from Editor's own state for the same reason.
function SendQuoteDialog({ projectId, open, onOpenChange }: { projectId: number; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { data: myOrg } = useMyOrganization();
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  // Phase 3 — opt-in per quote, unchecked by default (most quotes are
  // a new build with nothing to remove first). Only rendered at all
  // when the business has actually set a teardownRatePerFoot — see
  // its own render check below.
  const [includeTeardown, setIncludeTeardown] = useState(false);
  const [result, setResult] = useState<{ publicUrl: string; emailSent: boolean } | null>(null);
  const [copied, setCopied] = useState(false);
  const createQuote = useCreateQuote(projectId);

  const reset = () => {
    setCustomerName("");
    setCustomerEmail("");
    setIncludeTeardown(false);
    setResult(null);
    setCopied(false);
  };

  const invalid = !customerEmail.trim();

  const handleSend = async () => {
    try {
      const data = await createQuote.mutateAsync({
        customerName: customerName.trim() || undefined,
        customerEmail: customerEmail.trim(),
        includeTeardown,
      });
      setResult({ publicUrl: data.publicUrl, emailSent: data.emailSent });
    } catch {
      // useCreateQuote already toasts the error.
    }
  };

  if (!myOrg) return null;

  return (
    <Dialog open={open} onOpenChange={(next) => { onOpenChange(next); if (!next) reset(); }}>
      <DialogContent className="sm:max-w-[425px] rounded-2xl">
        {result ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-display">
                {result.emailSent ? "Quote sent" : "Quote created"}
              </DialogTitle>
              <DialogDescription>
                {result.emailSent
                  ? `Emailed to ${customerEmail}. They can view it — no account needed — at this link:`
                  : "The email couldn't be sent — share this link with your customer directly:"}
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center gap-2">
              <Input readOnly value={result.publicUrl} className="font-mono text-xs" />
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(result.publicUrl);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <DialogFooter>
              <Button onClick={() => onOpenChange(false)}>Done</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-display">Send Quote to Customer</DialogTitle>
              <DialogDescription>
                A linear-foot, bottom-line quote from {myOrg.name} — no itemized materials list, no login required to view it.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <div className="grid gap-1.5">
                <Label htmlFor="quote-customer-name">Customer name (optional)</Label>
                <Input id="quote-customer-name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Jane Homeowner" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="quote-customer-email">Customer email</Label>
                <Input id="quote-customer-email" type="email" required value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="jane@example.com" />
              </div>
              {myOrg.teardownRatePerFoot != null && (
                <div className="flex items-center gap-2 pt-1">
                  <Checkbox id="quote-include-teardown" checked={includeTeardown} onCheckedChange={(v) => setIncludeTeardown(v === true)} />
                  <Label htmlFor="quote-include-teardown" className="text-sm font-normal cursor-pointer">
                    Include teardown of the existing fence (${myOrg.teardownRatePerFoot.toFixed(2)}/ft)
                  </Label>
                </div>
              )}
            </div>
            <DialogFooter>
              {/* Real bug caught live, not a hypothetical: a native
                  `disabled` attribute that flips true mid-click (the
                  usual isPending guard against double-submit) blurs the
                  button the instant it disables — a disabled element
                  can't hold focus. Radix's Dialog FocusScope sees focus
                  jump to <body> (outside the dialog) and treats that as
                  an outside-interaction, silently closing the dialog
                  before the mutation even resolves; the "Quote sent"
                  toast still fires (the request genuinely succeeds),
                  but the dialog's own result view — the actual copyable
                  link — never gets a chance to render. Reproduced with
                  a real send, confirmed via a real 201 in the network
                  log. Fixed by never toggling the native `disabled`
                  attribute at all: `aria-disabled` + `pointer-events-
                  none` blocks the click and reads correctly to screen
                  readers, without ever blurring a focused element. */}
              <Button
                onClick={() => { if (invalid || createQuote.isPending) return; handleSend(); }}
                aria-disabled={invalid || createQuote.isPending}
                className={cn("gap-2", (invalid || createQuote.isPending) && "opacity-50 pointer-events-none")}
              >
                <Send className="w-4 h-4" /> {createQuote.isPending ? "Sending..." : "Send Quote"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// The DIY itemized materials list — unchanged from before Phase 4,
// just extracted into its own component so MaterialEstimates can
// switch between this and QuotePreviewView. Still the real Lowe's/
// Home Depot cost via calculateEstimate; nothing about how this is
// computed changed, only that it's no longer the only view.
function MaterialsListView({ projectId }: { projectId: number }) {
  const { data: estimates, isLoading, error } = useEstimates(projectId);
  // Homeowners shop at one store, not a mix — the server returns one
  // complete option per store (sorted cheapest-first); this just tracks
  // which one is currently shown. Falls back to the cheapest whenever the
  // selection doesn't match an available option (initial load, or the
  // selected store dropped out because it no longer prices everything).
  const [selectedStore, setSelectedStore] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
        <p className="text-sm">Calculating estimates...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 text-destructive border-2 border-dashed border-destructive rounded-lg">
        <p className="text-sm">Error calculating estimates.</p>
      </div>
    );
  }

  if (!estimates || estimates.options.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
        <p className="text-sm">No materials needed.</p>
      </div>
    );
  }

  const options = estimates.options;
  const active = options.find((o) => o.store === selectedStore) ?? options[0];
  // Same product can legitimately appear twice in the raw materials array
  // (e.g. pine rail priced separately for a pine-6ft group and a
  // pine-8ft group) — collapse to one row per product before rendering,
  // see consolidateMaterials for why.
  const activeMaterials = consolidateMaterials(active.materials);

  return (
    <div className="space-y-4">
      {options.length > 1 && (
        <div className="grid grid-cols-2 gap-2">
          {options.map((option, i) => (
            <button
              key={option.store}
              onClick={() => setSelectedStore(option.store)}
              className={cn(
                "rounded-lg border px-3 py-2 text-left transition-colors",
                option.store === active.store
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40"
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
      <div className="flex justify-between items-center font-bold">
        <span>Total Estimated Cost:</span>
        <span>${active.totalCost.toFixed(2)}</span>
      </div>
      <div className="space-y-2">
        {activeMaterials.map((item) => (
          <div key={item.id} className="flex justify-between items-center text-sm gap-2">
            <span className="min-w-0">
              {item.quantity}x{" "}
              {item.url ? (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-dotted underline-offset-2 hover:text-primary"
                >
                  {item.name}
                </a>
              ) : (
                item.name
              )}
            </span>
            <span className="shrink-0">${item.totalCost.toFixed(2)}</span>
          </div>
        ))}
      </div>
      <div className="text-xs text-muted-foreground pt-2">
        Estimate assumes a standard wood post-and-picket fence, all materials
        from {STORE_LABELS[active.store] || active.store}. Prices are based on
        current material listings and do not include taxes, delivery, or labor.
      </div>
    </div>
  );
}

// Business tier, Phase 4 (2026-09-10) — what an org member sees by
// default instead of the DIY materials list: their OWN rate-based
// price (server-computed by the exact same calculateQuotePricing a
// real send uses — see GET /api/projects/:id/quote-preview), not the
// real Lowe's/Home Depot material cost. Deliberately doesn't total in
// teardown — that's only ever decided at send time, in
// SendQuoteDialog's own checkbox — previewing it here would show a
// number the business hasn't actually chosen to charge yet.
function QuotePreviewView({ projectId }: { projectId: number }) {
  const { data: preview, isLoading, error } = useQuotePreview(projectId);

  if (isLoading) {
    return (
      <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
        <p className="text-sm">Calculating your quote...</p>
      </div>
    );
  }

  if (error || !preview) {
    return (
      <div className="text-center py-10 text-destructive border-2 border-dashed border-destructive rounded-lg">
        <p className="text-sm">Error calculating your quote.</p>
      </div>
    );
  }

  if (preview.totalLinearFeet === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
        <p className="text-sm">Draw a fence line to see your quote.</p>
      </div>
    );
  }

  if (preview.missingRates.length > 0) {
    return (
      <div className="text-center py-8 border-2 border-dashed rounded-lg space-y-2 px-4">
        <p className="text-sm text-muted-foreground">Set your rate to see your quote price:</p>
        <ul className="text-sm font-medium">
          {preview.missingRates.map((m) => (
            <li key={`${m.material}-${m.height}`}>{m.label} at {m.height} ft</li>
          ))}
        </ul>
        <Link href="/business" className="text-xs text-primary underline underline-offset-2 inline-block pt-1">
          Set your pricing &rarr;
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center font-bold">
        <span>Customer Price:</span>
        <span>${preview.totalCost.toFixed(2)}</span>
      </div>
      <div className="text-sm text-muted-foreground text-right -mt-2">
        {preview.totalLinearFeet.toFixed(0)} ft &middot; ${preview.pricePerFoot.toFixed(2)}/ft
      </div>
      {preview.teardownRatePerFoot != null && (
        <p className="text-xs text-muted-foreground">
          + ${preview.teardownRatePerFoot.toFixed(2)}/ft if teardown of an existing fence is included — choose that when you send the quote.
        </p>
      )}
      <div className="text-xs text-muted-foreground pt-2 border-t">
        This is YOUR price to the customer, from your own rate sheet — not the real material cost. Switch to Materials List to see what you'd actually buy.
      </div>
    </div>
  );
}

function MaterialEstimates({ projectId, isGuest, onOpenSendQuote }: { projectId: number; isGuest: boolean; onOpenSendQuote: () => void }) {
  // Same React Query cache entry SendQuoteDialog reads (Editor's stable
  // top level) — calling the hook again here is free, not a second
  // fetch, and is what decides whether the trigger button renders at
  // all. See SendQuoteTrigger's own comment for why the ACTUAL dialog
  // isn't nested here anymore.
  const { data: myOrg } = useMyOrganization({ enabled: !isGuest });
  const hasOrg = !isGuest && !!myOrg;

  // Free/DIY: materials only, no toggle at all (see MaterialEstimates'
  // own call site — a plain Pro account with no business has no rate
  // sheet to preview, so it gets the same materials-only view a free
  // account does, not a broken/empty "quote" tab). An org member
  // defaults to the quote view the FIRST time membership loads, then
  // leaves it alone — a manual switch back to Materials List should
  // stick, not get clobbered by this same effect re-firing on an
  // unrelated re-render.
  const [view, setView] = useState<"quote" | "materials">("materials");
  const defaultSetRef = useRef(false);
  useEffect(() => {
    if (hasOrg && !defaultSetRef.current) {
      setView("quote");
      defaultSetRef.current = true;
    }
  }, [hasOrg]);

  return (
    <div className="space-y-4">
      {hasOrg && (
        <div className="inline-flex rounded-lg border border-border p-0.5 bg-secondary/30 text-sm">
          <button
            type="button"
            onClick={() => setView("quote")}
            className={cn("px-3 py-1 rounded-md font-medium transition-colors", view === "quote" ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground")}
          >
            Customer Quote
          </button>
          <button
            type="button"
            onClick={() => setView("materials")}
            className={cn("px-3 py-1 rounded-md font-medium transition-colors", view === "materials" ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground")}
          >
            Materials List
          </button>
        </div>
      )}
      {hasOrg && view === "quote" ? (
        <QuotePreviewView projectId={projectId} />
      ) : (
        <MaterialsListView projectId={projectId} />
      )}
      {!isGuest && <SendQuoteTrigger myOrg={myOrg} onClick={onOpenSendQuote} />}
      <Link
        href={`/editor/${projectId}/shopping-list${isGuest ? "?guest=true" : ""}`}
        className="flex items-center justify-center gap-2 w-full rounded-md border border-primary/30 text-primary text-sm font-medium py-2 hover:bg-primary/5 transition-colors"
      >
        <ClipboardCheck className="w-4 h-4" /> View Shopping List
      </Link>
      <Link
        href={`/editor/${projectId}/before-you-dig${isGuest ? "?guest=true" : ""}`}
        className="flex items-center justify-center gap-2 w-full rounded-md border border-border text-muted-foreground text-sm font-medium py-2 hover:bg-secondary/40 hover:text-foreground transition-colors"
      >
        <ShieldAlert className="w-4 h-4" /> Before You Dig & Permits
      </Link>
    </div>
  );
}

export default function Editor() {
  const [match, params] = useRoute("/editor/:id");
  const projectId = match && params?.id ? parseInt(params.id) : undefined;

  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const [, navigate] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const isGuest = searchParams.get('guest') === 'true';

  const { data: project, isLoading: isProjectLoading, refetch: refetchProject } = useProject(
    projectId,
    { isGuest: isGuest && !isAuthenticated }
  );

  const [uiState, setUiState] = useState<UiState>("HIDDEN");
  const [isDrawing, setIsDrawing] = useState(false);

  const [showSignUpModal, setShowSignUpModal] = useState(false);
  // Business tier, Phase 1 — lives here (Editor's own stable top-level
  // state), not inside EditorSidebar/MaterialEstimates — see
  // SendQuoteTrigger's comment for the real remount bug this avoids.
  const [sendQuoteOpen, setSendQuoteOpen] = useState(false);
  const [hasTriedSavingPendingLine, setHasTriedSavingPendingLine] = useState(false);
  const [selectedLineId, setSelectedLineId] = useState<number | null>(null);
  const [editingLine, setEditingLine] = useState<any | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [placingGateType, setPlacingGateType] = useState<'single' | 'double' | null>(null);

  // On mobile the fence-line list lives in a full-screen sheet over the map.
  // Once the user starts drawing or editing a line, close it so the map
  // (and the drawing/edit controls on it) are actually visible.
  useEffect(() => {
    if (uiState !== "SIDEBAR") {
      setMobileSidebarOpen(false);
    }
  }, [uiState]);

  useEffect(() => {
    if (project && !isProjectLoading) {
      if (project.fenceLines && project.fenceLines.length === 0) {
        setUiState("INSTRUCTIONS");
      } else if (uiState !== 'EDITING' && uiState !== 'DRAWING') {
        setUiState("SIDEBAR");
      }
    } else {
      setUiState("HIDDEN");
    }
  }, [project, isProjectLoading]);

  useEffect(() => {
    if (selectedLineId && project?.fenceLines) {
      const line = project.fenceLines.find((l: any) => l.id === selectedLineId);
      setEditingLine(line ? { ...line, coordinates: [...line.coordinates], gates: line?.gates ? [...line.gates] : [] } : null);
      setUiState("EDITING");
    } else {
      setEditingLine(null);
      if (uiState === 'EDITING') {
        setUiState('SIDEBAR');
      }
    }
    setPlacingGateType(null);
  }, [selectedLineId, project?.fenceLines]);

  const handleStartDrawing = () => {
    setSelectedLineId(null);
    setIsDrawing(true);
    setUiState("DRAWING");
  };

  const createLineMutation = useCreateFenceLine();
  const deleteLineMutation = useDeleteFenceLine();
  const updateLineMutation = useUpdateFenceLine();
  const createGateMutation = useCreateGate();
  const deleteGateMutation = useDeleteGate();

  const handleGatePlaced = async (segmentIndex: number, position: number) => {
    if (!editingLine || !project || !placingGateType) return;
    try {
      await createGateMutation.mutateAsync({
        fenceLineId: editingLine.id,
        projectId: project.id,
        type: placingGateType,
        segmentIndex,
        position,
      });
    } catch (error: any) {
      console.error("Failed to add gate", error);
      toast({ title: 'Error', description: error?.message || 'Failed to add gate', variant: 'destructive' });
    } finally {
      setPlacingGateType(null);
    }
  };

  const handleDeleteGate = async (gateId: number) => {
    if (!project) return;
    try {
      await deleteGateMutation.mutateAsync({ id: gateId, projectId: project.id });
    } catch (error: any) {
      console.error("Failed to remove gate", error);
      toast({ title: 'Error', description: error?.message || 'Failed to remove gate', variant: 'destructive' });
    }
  };

  // Removing point `idx` merges the two segments touching it (idx-1 and
  // idx) into one, and shifts every later segment's index down by one.
  // A gate sitting exactly on one of the two merged segments has no
  // sane new position (its segment no longer exists in that form), so
  // that's blocked rather than guessed at — the user removes the gate
  // first, same as you'd unhook a gate before moving its posts in real
  // life. A gate on a LATER segment just needs its segmentIndex shifted
  // down by one to stay pointing at the same physical spot; there's no
  // gate-update endpoint (never needed one before this), so that's done
  // as delete-then-recreate with the same type/position — the gate
  // itself doesn't change, only which segment index it's attached to.
  const handleDeletePoint = async (idx: number) => {
    if (!editingLine || !project) return;
    const gatesOnLine: any[] = editingLine.gates || [];
    const orphaned = gatesOnLine.some((g) => g.segmentIndex === idx - 1 || g.segmentIndex === idx);
    if (orphaned) {
      toast({
        title: "Can't delete this point",
        description: "A gate is placed on this point's segment — remove the gate first.",
        variant: "destructive",
      });
      return;
    }
    try {
      const gatesToShift = gatesOnLine.filter((g) => g.segmentIndex > idx);
      for (const g of gatesToShift) {
        await deleteGateMutation.mutateAsync({ id: g.id, projectId: project.id });
        await createGateMutation.mutateAsync({
          fenceLineId: editingLine.id,
          projectId: project.id,
          type: g.type,
          segmentIndex: g.segmentIndex - 1,
          position: g.position,
        });
      }
      const newCoords = editingLine.coordinates.filter((_: any, i: number) => i !== idx);
      await handleUpdateLine({ ...editingLine, coordinates: newCoords });
    } catch (error: any) {
      console.error("Failed to delete point", error);
      toast({ title: 'Error', description: error?.message || 'Failed to delete point', variant: 'destructive' });
    }
  };

  const handleUpdateLine = async (line: any) => {
    if (!line || !project) return;
    // Great-circle distance via Leaflet's LatLng.distanceTo (matches how
    // MapEditorComponent computes length while drawing) — NOT a flat
    // sqrt(dLat^2 + dLng^2) * metersPerDegree approximation. A degree of
    // longitude is shorter than a degree of latitude by cos(latitude), so
    // that naive formula overestimated east-west lines by ~29% at this
    // project's test latitude (~39N). Every edit was silently inflating
    // the line's length, and therefore its material estimate.
    let distMeters = 0;
    for (let i = 0; i < line.coordinates.length - 1; i++) {
      const p1 = new LatLng(line.coordinates[i].lat, line.coordinates[i].lng);
      const p2 = new LatLng(line.coordinates[i + 1].lat, line.coordinates[i + 1].lng);
      distMeters += p1.distanceTo(p2);
    }
    const newLength = distMeters * 3.28084;

    try {
      await updateLineMutation.mutateAsync({
        id: line.id,
        projectId: project.id,
        coordinates: line.coordinates.map(({ id, fenceLineId, ...rest }: any, order: number) => ({ ...rest, order })),
        length: newLength,
        name: line.name?.trim() || defaultLineName(project.property.address),
        material: line.material,
        height: line.height,
      });
      toast({ title: "Success", description: "Fence line updated.", variant: "success" });
      setSelectedLineId(null);
      setUiState("SIDEBAR");
    } catch (error: any) {
      console.error("Failed to update line", error);
      toast({ title: 'Error', description: error?.message || 'Failed to update fence line', variant: 'destructive' });
    }
  };

  useEffect(() => {
    if (isAuthenticated && projectId && !authLoading) {
      refetchProject();
    }
  }, [isAuthenticated, authLoading, projectId, refetchProject]);

  useEffect(() => {
    const savePendingLine = async () => {
      if (isAuthenticated && projectId && project && !hasTriedSavingPendingLine) {
        const pendingLineJSON = localStorage.getItem(`pendingFenceLine_${projectId}`);
        if (pendingLineJSON) {
          setHasTriedSavingPendingLine(true);
          const pendingLine = JSON.parse(pendingLineJSON);
          try {
            await createLineMutation.mutateAsync({
              projectId: pendingLine.projectId,
              name: defaultLineName(project.property.address),
              material: pendingLine.material,
              height: pendingLine.height,
              length: pendingLine.length,
              color: "natural",
              coordinates: pendingLine.points.map((p: any, idx: number) => ({
                lat: p.lat,
                lng: p.lng,
                order: idx
              }))
            });
            toast({ title: "Success", description: "Your fence line has been saved.", variant: "success" });
            localStorage.removeItem(`pendingFenceLine_${projectId}`);
            refetchProject();
            setUiState("SIDEBAR");
          } catch (error: any) {
            console.error("Failed to save pending line", error);
            toast({ title: 'Error', description: error?.message || 'Failed to save your pending fence line.', variant: 'destructive' });
            setHasTriedSavingPendingLine(false);
          }
        }
      }
    };

    if (!authLoading && !isProjectLoading && isAuthenticated) {
      savePendingLine();
    }
  }, [isAuthenticated, projectId, project, isProjectLoading, authLoading, createLineMutation, toast, refetchProject, hasTriedSavingPendingLine]);

  if (isProjectLoading || authLoading) {
    return (
      <Layout>
        <div className="h-[calc(1vh-4rem)] p-4 flex gap-4">
          <Skeleton className="w-full h-full rounded-2xl" />
        </div>
      </Layout>
    );
  }

  if (!project) {
    return <Layout><NotFound /></Layout>;
  }

  // Default material for a brand-new line: pine post/rail, cedar picket
  // — the cheaper structural lumber with the nicer-looking face, not
  // plain cedar throughout. User-changeable via EditFenceLineCard's
  // Material picker right after; this is just the starting point both
  // the guest (pending) and authenticated direct-save paths land on.
  const handleSaveLine = async (points: any[], length: number) => {
    if (!isAuthenticated) {
      const pendingLine = { projectId: project.id, points, length, material: 'wood_pine_cedar_picket', height: 6 };
      localStorage.setItem(`pendingFenceLine_${project.id}`, JSON.stringify(pendingLine));
      setShowSignUpModal(true);
      return;
    }
    try {
      await createLineMutation.mutateAsync({
        projectId: project.id,
        name: defaultLineName(project.property.address),
        material: 'wood_pine_cedar_picket',
        height: 6,
        length,
        color: "natural",
        coordinates: points.map(({ id, ...rest }, idx) => ({
          ...rest,
          order: idx
        }))
      });
      toast({ title: "Success", description: "Fence line saved.", variant: "success" });
      setIsDrawing(false);
      setUiState("SIDEBAR");
    } catch (error: any) {
      console.error("Failed to save line", error);
      toast({ title: 'Error', description: error?.message || 'Failed to add fence line', variant: 'destructive' });
    }
  };

  const handleDeleteLine = async (lineId: string | number) => {
    if (!isAuthenticated) {
      setShowSignUpModal(true);
      return;
    }
    try {
      await deleteLineMutation.mutate({ id: lineId as number, projectId: project.id });
    } catch (error: any) {
      console.error("Failed to delete line", error);
      toast({ title: 'Error', description: error?.message || 'Failed to delete fence line', variant: 'destructive' });
    }
  };

  const cancelDrawing = () => {
    setIsDrawing(false);
    if (project.fenceLines && project.fenceLines.length === 0) {
      setUiState("INSTRUCTIONS");
    } else {
      setUiState("SIDEBAR");
    }
  };

  const EditorSidebar = () => (
    <div className="flex flex-col bg-panel z-10 w-full h-full">
      <div className="p-4 border-b">
        {!isAuthenticated ? (
          <Button
            variant="default"
            className="w-full mb-4 gap-2"
            onClick={() => setShowSignUpModal(true)}
          >
            <Save className="w-4 h-4" /> Save Your Property (Login/Register)
          </Button>
        ) : (
          <Link href="/properties" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Properties
          </Link>
        )}

        <h1 className="text-xl font-display font-bold truncate">{project.name}</h1>
        <p className="text-sm text-muted-foreground truncate">{project.property.address}</p>
      </div>
      <ScrollArea className="flex-1">
        <Tabs defaultValue="lines">
          <div className="px-4 pt-4 sticky top-0 bg-panel z-10 border-b">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="lines">Fence Lines</TabsTrigger>
              <TabsTrigger value="details">Property Details</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="lines" className="mt-2">
            <div className="px-4 py-2 bg-muted/30 border-y flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {project.fenceLines?.length || 0} Lines Defined
              </span>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                Total: {project.fenceLines?.reduce((sum: number, line: any) => sum + (line.length || 0), 0).toFixed(0)} ft
              </Badge>
            </div>
            <div className="p-4 space-y-3">
              {project.fenceLines?.map((line: any) => (
                <Card
                  key={line.id}
                  className={cn(
                    "group overflow-hidden border-border/60 hover:border-primary/50 transition-colors cursor-pointer",
                    selectedLineId === line.id && "border-primary/80"
                  )}
                  onClick={() => setSelectedLineId(selectedLineId === line.id ? null : line.id)}
                >
                  <div className="p-3 flex items-start gap-3">
                    <div className="w-2 h-full min-h-[3rem] rounded-full bg-primary/20 shrink-0 self-stretch" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-sm truncate">{line.name}</h4>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDeleteLine(line.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal">
                          {MATERIAL_LABELS[line.material] || line.material}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal">
                          {line.height} ft high
                        </Badge>
                        <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal">
                          {line.length ? `${line.length.toFixed(0)} ft` : "No length"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
              {/* Deliberately NOT styled as a primary CTA (2026-09-10) —
                  this only ever renders once at least one line already
                  exists (the SIDEBAR state requires existingLines.length
                  > 0; a brand-new project's first line uses
                  NewProjectInstructions' own, correctly-prominent button
                  instead). A second fence line is the uncommon case, not
                  the expected next action, so this reads as a quiet,
                  available option rather than something competing for
                  attention with the lines already listed above it. */}
              <Button variant="outline" size="sm" className="w-full gap-2 text-muted-foreground font-normal" onClick={handleStartDrawing}>
                <Plus className="w-3.5 h-3.5" /> Add another fence line
              </Button>
            </div>
            <div className="p-4 space-y-4 border-t">
              <h4 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <ClipboardList className="w-4 h-4" />
                Material Estimates
              </h4>
              <MaterialEstimates projectId={project.id} isGuest={isGuest} onOpenSendQuote={() => setSendQuoteOpen(true)} />
            </div>
          </TabsContent>
          <TabsContent value="details" className="p-4">
            <div className="space-y-4">
              <div>
                <Label>Property Name</Label>
                <div className="text-sm font-medium">{project.property.name}</div>
              </div>
              <div>
                <Label>Address</Label>
                <div className="text-sm text-muted-foreground">{project.property.address || "No address provided"}</div>
              </div>
              <div>
                <Label>Description</Label>
                <div className="text-sm text-muted-foreground">{project.property.description || "No notes"}</div>
              </div>
              <div>
                <Label>This Project</Label>
                <div className="text-sm text-muted-foreground">{project.name} — {project.status}</div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </ScrollArea>
    </div>
  );
  
  const RightPanel = () => {
      switch (uiState) {
          case "INSTRUCTIONS":
              return <NewProjectInstructions onStartDrawing={handleStartDrawing} />;
          case "DRAWING":
              return <NewFenceLineCard onCancel={cancelDrawing} />;
          case "SIDEBAR":
              // Floating overlay needs its own card chrome (shadow, rounded
              // corners, clipped) to read as a card sitting on the map.
              // Docked, the panel's own border-l already delineates it —
              // that chrome would just double up as a card-in-a-card.
              return isPanelDocked
                  ? <div className="h-full"><EditorSidebar /></div>
                  : <div className="bg-panel h-full overflow-hidden shadow-lg rounded-lg"><EditorSidebar /></div>;
          case "EDITING":
              return editingLine ? (
                  <EditFenceLineCard
                      editingLine={editingLine}
                      setEditingLine={setEditingLine}
                      handleUpdateLine={handleUpdateLine}
                      updateLineMutation={updateLineMutation}
                      setSelectedLineId={setSelectedLineId}
                      refetchProject={refetchProject}
                      placingGateType={placingGateType}
                      onStartPlacingGate={setPlacingGateType}
                      onCancelPlacingGate={() => setPlacingGateType(null)}
                      onDeleteGate={handleDeleteGate}
                      deleteGateMutation={deleteGateMutation}
                  />
              ) : null;
          default:
              return null;
      }
  }

  // Before a fence line exists (INSTRUCTIONS/DRAWING), focus stays on the
  // map — that's the whole point of those states, so the panel stays a
  // compact floating overlay. Once there's something to review — the line
  // list + material estimates (SIDEBAR), or a single line's detail
  // (EDITING) — dock the panel as a real, wide column instead and let the
  // map's flex container shrink to make room. This is the state that
  // actually grows over time (more lines, richer estimates), so it gets
  // the real estate. MapEditorComponent notices the resulting resize on
  // its own (ResizeObserver on the map container) and calls Leaflet's
  // invalidateSize() — no coordination needed here.
  const isPanelDocked = uiState === "SIDEBAR" || uiState === "EDITING";

  return (
    <Layout>
      <div className="flex h-full relative overflow-hidden">
        {/* Map Area */}
        <div className="flex-1 relative h-full min-w-0 bg-secondary/20">
          <MapEditorComponent
            initialCenter={undefined}
            initialAddress={project.property.address ?? undefined}
            onSave={handleSaveLine}
            isSaving={createLineMutation.isPending}
            existingLines={project.fenceLines || []}
            isMobile={isMobile}
            selectedLineId={selectedLineId}
            onLineSelect={setSelectedLineId}
            editingLine={editingLine}
            onLineUpdate={handleUpdateLine}
            isDrawing={isDrawing}
            onCancelDrawing={cancelDrawing}
            controlsPosition="right"
            placingGateType={placingGateType}
            onGatePlaced={handleGatePlaced}
            onDeletePoint={handleDeletePoint}
            // isPro, not a raw plan check — Pro via a business
            // membership unlocks Mapbox imagery too (2026-09-10). See
            // server/auth.ts's isEffectivelyPro.
            isPro={!!user?.isPro}
          />

          {/* Mobile Menu Trigger */}
          <div className="md:hidden absolute top-4 left-4 z-30">
            <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
              <SheetTrigger asChild>
                <Button size="icon" variant="secondary" className="shadow-md h-10 w-10 rounded-full" aria-label="Open project menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-[85vw] sm:w-[400px]">
                <EditorSidebar />
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop Right Panel — floating overlay (nothing to review yet) */}
          {!isPanelDocked && (
            <div className="hidden md:block absolute top-4 right-4 z-10 w-80 lg:w-96 h-[calc(100%-2rem)]">
                <RightPanel />
            </div>
          )}
        </div>

        {/* Desktop Right Panel — docked column (there's a line to review: wider, map makes room) */}
        {isPanelDocked && (
          <div className="hidden md:block relative z-10 w-[480px] lg:w-[560px] h-full shrink-0 border-l border-border overflow-y-auto p-4">
            <RightPanel />
          </div>
        )}
      </div>

      <SignUpToSaveModal
        open={showSignUpModal}
        onOpenChange={setShowSignUpModal}
        propertyId={project.property.id}
        returnTo={`/editor/${project.id}`}
      />
      {!isGuest && (
        <SendQuoteDialog projectId={project.id} open={sendQuoteOpen} onOpenChange={setSendQuoteOpen} />
      )}
    </Layout>
  );
}