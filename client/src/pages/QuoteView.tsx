import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { AuthLayout } from "@/components/AuthLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Phone, Mail } from "lucide-react";
import { format } from "date-fns";
import NotFound from "./not-found";

// Business tier, Phase 1 (2026-09-10) — the one page in this entire app
// meant to be opened by someone with NO PostPlotter account at all: a
// customer following the link from a quote email. Reuses AuthLayout
// (the same minimal, nav-free header Login/Register use) rather than
// the real Layout — a customer here has no reason to see "Add a
// Property" or an account menu for an app they never signed up for.
//
// Deliberately just the linear-foot/bottom-line numbers and business
// contact info — no itemized materials list (that's the DIYer's own
// view, not what a contractor hands a customer) and no Accept button
// yet (explicitly deferred past this first slice, see CLAUDE.md's
// Phase 1 write-up).
function useQuoteView(token: string | undefined) {
  return useQuery({
    queryKey: [api.quotes.getPublic.path, token],
    queryFn: async () => {
      if (!token) return null;
      const url = buildUrl(api.quotes.getPublic.path, { token });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to load quote");
      return (await res.json()) as {
        customerName: string | null;
        businessName: string;
        businessPhone: string | null;
        businessEmail: string | null;
        businessLogoData: string | null;
        totalLinearFeet: number;
        totalCost: number;
        createdAt: string;
      };
    },
    enabled: !!token,
    retry: false,
  });
}

export default function QuoteView() {
  const [, params] = useRoute("/quotes/:token");
  const { data: quote, isLoading, isError } = useQuoteView(params?.token);

  if (isLoading) {
    return (
      <AuthLayout>
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      </AuthLayout>
    );
  }

  if (isError || !quote) {
    return (
      <AuthLayout>
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>This quote link isn't valid</CardTitle>
            <CardDescription>
              It may have been mistyped, or the quote no longer exists. Contact the business that sent it if you think this is a mistake.
            </CardDescription>
          </CardHeader>
        </Card>
      </AuthLayout>
    );
  }

  const pricePerFoot = quote.totalCost / quote.totalLinearFeet;

  return (
    <AuthLayout>
      <Card className="w-full max-w-md rounded-2xl">
        <CardHeader>
          <CardDescription className="font-mono text-xs uppercase tracking-wide">
            Fence quote &middot; {format(new Date(quote.createdAt), "MMM d, yyyy")}
          </CardDescription>
          <CardTitle className="text-2xl font-display">
            {quote.customerName ? `For ${quote.customerName}` : "Your Fence Quote"}
          </CardTitle>
          <CardDescription>From {quote.businessName}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-xl bg-secondary/40 p-5 text-center">
            <div className="text-4xl font-display font-bold">${quote.totalCost.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground mt-1">
              {quote.totalLinearFeet.toFixed(0)} linear ft &middot; ${pricePerFoot.toFixed(2)}/ft
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Materials cost only — doesn't include labor, delivery, or taxes unless your contractor tells you otherwise. Reach out to them directly with any questions.
          </p>
          {(quote.businessPhone || quote.businessEmail || quote.businessLogoData) && (
            <div className="border-t pt-4 space-y-2 text-sm">
              <div className="flex items-center gap-2">
                {quote.businessLogoData && (
                  <img src={quote.businessLogoData} alt={`${quote.businessName} logo`} className="w-8 h-8 rounded-md object-contain border border-border shrink-0" />
                )}
                <div className="font-medium">{quote.businessName}</div>
              </div>
              {quote.businessPhone && (
                <a href={`tel:${quote.businessPhone}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary">
                  <Phone className="w-3.5 h-3.5" /> {quote.businessPhone}
                </a>
              )}
              {quote.businessEmail && (
                <a href={`mailto:${quote.businessEmail}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary">
                  <Mail className="w-3.5 h-3.5" /> {quote.businessEmail}
                </a>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
