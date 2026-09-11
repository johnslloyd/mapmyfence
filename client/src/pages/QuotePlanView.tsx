import { useRoute, Link } from "wouter";
import { usePublicQuote } from "@/hooks/use-projects";
import { useIsMobile } from "@/hooks/use-mobile";
import { PageHeader } from "@/components/PageHeader";
import { MapEditorComponent } from "@/components/MapEditorComponent";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Crosshair, ArrowLeft, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Business tier, Phase 5 follow-up (2026-09-11) — supersedes the
// bigger-abstract-diagram version this page shipped as a few hours
// earlier: direct follow-up asking for the REAL project view instead
// (the actual satellite map with the real fence line on it), not just
// a bigger version of the small illustration. Same route
// (/quotes/:token/plan), same link from QuoteView.tsx — only the
// destination got richer.
//
// Reuses MapEditorComponent AS-IS, not a stripped-down clone — no new
// "read only" prop was needed. Every edit affordance in that component
// (draggable points, hover delete-point/square-corner buttons, gate
// placement) is already gated behind `isEditing`/`editingLine`
// matching a specific line (see FenceLine's own render logic) — passing
// `editingLine={null}` and no-op callbacks for everything else means
// NOTHING in there ever turns on. What's left is exactly a real,
// interactive (pan/zoom), non-editable satellite map with the actual
// drawn line and gates rendered on it via `existingLines`, which is
// exactly what a customer viewing their own fence plan should get.
//
// Deliberately forces `isPro={false}` regardless of the sending
// business's real plan — this is the one page in the whole app a
// stranger can open with no login and no rate limit of its own; always
// using the free Esri imagery (never Mapbox) keeps an anonymous, public
// page from being able to run up a business's (or the platform's) paid
// Mapbox usage.
export default function QuotePlanView() {
  const [, params] = useRoute("/quotes/:token/plan");
  const { data: quote, isLoading, isError } = usePublicQuote(params?.token);
  const isMobile = useIsMobile();

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col overflow-hidden">
        <PageHeader>
          <div className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground p-2 rounded-lg">
              <Crosshair className="w-6 h-6" />
            </div>
            <span className="font-display font-bold text-xl">PostPlotter</span>
          </div>
        </PageHeader>
        <div className="flex-1 p-4">
          <Skeleton className="w-full h-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (isError || !quote || quote.fenceLines.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-secondary/30">
        <PageHeader>
          <div className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground p-2 rounded-lg">
              <Crosshair className="w-6 h-6" />
            </div>
            <span className="font-display font-bold text-xl">PostPlotter</span>
          </div>
        </PageHeader>
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>This plan isn't available</CardTitle>
              <CardDescription>
                The quote link may have been mistyped, or there's nothing drawn for it yet. Contact the business that sent it if you think this is a mistake.
              </CardDescription>
            </CardHeader>
          </Card>
        </main>
      </div>
    );
  }

  const totalLength = quote.fenceLines.reduce((sum, l) => sum + (l.length || 0), 0);
  const gateCount = quote.fenceLines.reduce((sum, l) => sum + l.gates.length, 0);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <PageHeader>
        <div className="flex items-center gap-2">
          <div className="bg-primary text-primary-foreground p-2 rounded-lg">
            <Crosshair className="w-6 h-6" />
          </div>
          <span className="font-display font-bold text-xl hidden sm:inline-block">PostPlotter</span>
        </div>
        <div className="flex-1 flex items-center justify-end">
          <Link href={`/quotes/${params?.token}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to quote
          </Link>
        </div>
      </PageHeader>
      <div className="flex-1 relative min-h-0">
        <MapEditorComponent
          initialCenter={undefined}
          initialAddress={undefined}
          onSave={() => {}}
          isSaving={false}
          existingLines={quote.fenceLines}
          isMobile={isMobile}
          selectedLineId={null}
          editingLine={null}
          isDrawing={false}
          controlsPosition="right"
          placingGateType={null}
          isPro={false}
          readOnly
        />
        {/* A small, unmissable badge that this is a view, not the real
            editor — a customer landing here with no context shouldn't
            wonder whether they can click around and change something.
            top-RIGHT, not top-left (2026-09-11 fix) — Leaflet's own
            zoom control renders top-left by default and this card was
            overlapping it. */}
        <div className="absolute top-4 right-4 z-30">
          <Card className="bg-panel/95 backdrop-blur shadow-xl border-border/50 rounded-lg py-2 px-3">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="gap-1 text-[10px] h-5 font-normal">
                <Eye className="w-3 h-3" /> View only
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground">From {quote.businessName}</div>
            <div className="flex gap-4 text-sm mt-1.5">
              <div>
                <span className="font-mono font-medium">{totalLength.toFixed(0)} ft</span>
                <span className="text-xs text-muted-foreground ml-1">total</span>
              </div>
              <div>
                <span className="font-mono font-medium">{gateCount}</span>
                <span className="text-xs text-muted-foreground ml-1">{gateCount === 1 ? "gate" : "gates"}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
