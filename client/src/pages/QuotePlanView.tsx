import { useRoute, Link } from "wouter";
import { usePublicQuote } from "@/hooks/use-projects";
import { AuthLayout } from "@/components/AuthLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PlanThumbnail } from "@/lib/planPreview";
import { ArrowLeft } from "lucide-react";
import NotFound from "./not-found";

// Business tier, Phase 5 (2026-09-10) — a bigger, dedicated look at the
// exact same diagram QuoteView.tsx already shows inline, per direct
// request ("the same diagram... link to the project in a view-only
// version"). Deliberately just a larger render of the SAME abstract
// PlanThumbnail, not the live interactive satellite map — that's a
// meaningfully bigger feature (map tiles, a stripped-down read-only
// MapEditorComponent) that was explicitly asked to be scoped out for
// this pass. Still no-login, reusing the same public token — see
// usePublicQuote's own comment for why this shares one cache entry
// with QuoteView.tsx rather than a second fetch for identical data.
export default function QuotePlanView() {
  const [, params] = useRoute("/quotes/:token/plan");
  const { data: quote, isLoading, isError } = usePublicQuote(params?.token);

  if (isLoading) {
    return (
      <AuthLayout>
        <div className="w-full max-w-lg space-y-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-72 w-full rounded-2xl" />
        </div>
      </AuthLayout>
    );
  }

  if (isError || !quote || quote.fenceLines.length === 0) {
    return (
      <AuthLayout>
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>This plan isn't available</CardTitle>
            <CardDescription>
              The quote link may have been mistyped, or there's nothing drawn for it yet. Contact the business that sent it if you think this is a mistake.
            </CardDescription>
          </CardHeader>
        </Card>
      </AuthLayout>
    );
  }

  const gateCount = quote.fenceLines.reduce((sum, l) => sum + l.gates.length, 0);

  return (
    <AuthLayout>
      <Card className="w-full max-w-lg rounded-2xl">
        <CardHeader>
          <Link href={`/quotes/${params?.token}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to quote
          </Link>
          <CardTitle className="text-xl font-display">Fence Plan</CardTitle>
          <CardDescription>From {quote.businessName}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-80 bg-secondary/30 rounded-xl border border-border overflow-hidden">
            <PlanThumbnail fenceLines={quote.fenceLines} />
          </div>
          <div className="flex gap-6 text-sm">
            <div>
              <div className="font-mono font-medium">{quote.totalLinearFeet.toFixed(0)} ft</div>
              <div className="text-xs text-muted-foreground">Total length</div>
            </div>
            <div>
              <div className="font-mono font-medium">{gateCount}</div>
              <div className="text-xs text-muted-foreground">{gateCount === 1 ? "Gate" : "Gates"}</div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground pt-2 border-t">
            A rough diagram of the fence's shape — not to scale, and not the same as the real satellite view {quote.businessName} planned it on.
          </p>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
