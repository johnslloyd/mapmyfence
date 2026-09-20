import { useRoute, Link } from "wouter";
import { usePublicQuote, useAcceptQuote } from "@/hooks/use-projects";
import { AuthLayout } from "@/components/AuthLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlanThumbnail } from "@/lib/planPreview";
import { Phone, Mail, Check } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
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
// view, not what a contractor hands a customer). The Accept flow
// (scheduling MVP slice 1, 2026-09-16) is deliberately the whole of
// "scheduling" for now — accepting collects a phone number and tells
// the business to call; there's no in-app date picker, proposal, or
// calendar. See CLAUDE.md's "Scheduling MVP" section for why that's the
// deliberate starting point, not a placeholder for something bigger
// that got cut.
//
// The phone number is typed fresh by the customer right here, not
// pre-filled from anything the business may have entered at send time
// — that would require this page's own public, no-login API response
// to include it, exposing it to anyone holding the link, not just the
// actual customer. It travels one-way, in the accept request itself,
// and is never read back out through this page or its API.

export default function QuoteView() {
  const [, params] = useRoute("/quotes/:token");
  const { data: quote, isLoading, isError } = usePublicQuote(params?.token);
  const acceptQuote = useAcceptQuote(params?.token);
  const [phone, setPhone] = useState("");

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
        <CardHeader className="text-center items-center">
          {/* Large and centered, like a letterhead — was a small 32px
              icon tucked into the contact block near the bottom;
              direct feedback that a business's branding deserved more
              prominence than that. Sized to 200px (the same cap
              Business.tsx's upload already resizes to client-side
              before it's ever stored, see resizeImageToDataUrl), so
              this renders at up to the image's real stored resolution
              rather than stretching a smaller logo past its actual
              size. */}
          {quote.businessLogoData && (
            <img
              src={quote.businessLogoData}
              alt={`${quote.businessName} logo`}
              className="max-w-[200px] max-h-[200px] object-contain mb-2"
            />
          )}
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
            {quote.includesTeardown && (
              <div className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border/60">
                Includes teardown of the existing fence
              </div>
            )}
          </div>
          {/* Scheduling MVP slice 1 (2026-09-16) — the whole "scheduling"
              feature, for now: accepting doesn't book a date, it just
              collects a real number and tells the business to call.
              `acceptedAt` comes back from the server on every load (see
              usePublicQuote), not just client-side mutation state, so
              reopening this link later still shows the accepted
              confirmation. */}
          {quote.acceptedAt ? (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex items-start gap-3">
              <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium">You accepted this quote</div>
                <div className="text-muted-foreground">
                  {quote.businessName} has been notified and will reach out to schedule the work.
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid gap-1.5 text-left">
                <Label htmlFor="accept-phone">Your phone number</Label>
                <Input
                  id="accept-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 555-5555"
                />
              </div>
              <Button
                onClick={() => acceptQuote.mutate({ customerPhone: phone.trim() })}
                disabled={!phone.trim() || acceptQuote.isPending}
                className="w-full"
                size="lg"
              >
                {acceptQuote.isPending ? "Accepting..." : "Accept This Quote"}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                So {quote.businessName} can call to schedule the work — it doesn't book a date on its own.
              </p>
            </div>
          )}
          {/* Business tier, Phase 5 (2026-09-10) — the same abstract
              plan diagram Properties.tsx/PropertyOverview.tsx already
              use, reused here rather than rebuilt a third time. Reads
              the project's CURRENT fence lines (not a quote-time
              snapshot the way price/branding are) — see the public
              route's own comment on that tradeoff. Links to a bigger,
              dedicated, still no-login version of the exact same
              diagram — not the live interactive map — for a closer
              look, same "same diagram, just bigger" scope as asked
              for. */}
          {quote.fenceLines.length > 0 && (
            <Link
              href={`/quotes/${params?.token}/plan`}
              className="group block rounded-xl border border-border overflow-hidden hover:border-primary/50 transition-colors"
            >
              <div className="h-40 bg-secondary/30">
                <PlanThumbnail fenceLines={quote.fenceLines} />
              </div>
              <div className="px-3 py-2 text-xs font-medium text-primary flex items-center justify-between bg-card">
                View fence plan
                <span className="group-hover:translate-x-0.5 transition-transform">&rarr;</span>
              </div>
            </Link>
          )}
          <p className="text-xs text-muted-foreground">
This is {quote.businessName}'s own price. Reach out to them directly with any questions about what it includes.
          </p>
          {(quote.businessPhone || quote.businessEmail) && (
            <div className="border-t pt-4 space-y-2 text-sm">
              <div className="font-medium">{quote.businessName}</div>
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
