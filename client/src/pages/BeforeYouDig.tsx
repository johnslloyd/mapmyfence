import { Layout } from "@/components/Layout";
import { useRoute, Link } from "wouter";
import { useProject } from "@/hooks/use-projects";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShieldAlert, PhoneCall, Landmark, ExternalLink, Search } from "lucide-react";
import NotFound from "./not-found";

// This whole page is informational, not a determination. Never say (or
// imply) a project IS cleared to dig or build — this app has no way to
// know that, and getting it wrong is a real liability the user was
// explicit about not wanting to take on. Every section below tells the
// homeowner HOW to find out and WHO to contact, never asserts an
// outcome on their behalf. If you're adding to this page, keep that
// same shape: process and contacts, not clearance.

function BeforeYouDigContent({ projectId, isGuest }: { projectId: number; isGuest: boolean }) {
  const { data: project, isLoading } = useProject(projectId, { isGuest });
  const backHref = `/editor/${projectId}${isGuest ? "?guest=true" : ""}`;

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (!project) return <NotFound />;

  // Best-effort search assist only — never asserted as authoritative.
  // Fence permit rules are hyper-local (city/county/HOA); the safest
  // thing this app can do with an address is hand it to a real search
  // engine, not guess at rules itself (same lesson as the parcel-data
  // work: don't fabricate what genuinely needs local research).
  const permitSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(
    `fence permit requirements ${project.property.address || project.name}`
  )}`;

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-6">
      <Link href={backHref} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground w-fit">
        <ArrowLeft className="w-4 h-4" /> Back to Editor
      </Link>

      <div className="bg-panel text-panel-foreground rounded-lg border border-border/50 shadow-sm p-4 md:p-6 space-y-6">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-primary" /> Before You Dig
          </h1>
          <p className="text-muted-foreground text-sm">
            {project.name}
            {project.property.address ? ` — ${project.property.address}` : ""}
          </p>
        </div>

        <Alert>
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>This is general information, not a clearance to build</AlertTitle>
          <AlertDescription>
            MyYardManager can't confirm your utility lines have been marked or that your project is
            permitted — only your local 811 center and building department can. Use this page to find
            out what to do next; always get their confirmation before you dig or start construction.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <h2 className="font-display font-bold text-lg flex items-center gap-2">
            <PhoneCall className="w-5 h-5 text-primary" /> Call 811 before you dig
          </h2>
          <p className="text-sm text-foreground/90">
            811 is the free, national call-before-you-dig number, required by law in all 50 states
            before any digging — including setting fence posts. Call or submit a request online at
            least a few business days ahead (exact notice periods vary by state); your local utility
            companies will then mark the approximate location of underground gas, electric, water,
            sewer, and communication lines on your property, at no cost to you.
          </p>
          <p className="text-sm text-foreground/90">
            Hitting an unmarked line can cause serious injury, service outages for your neighborhood,
            and fines — do this before you dig, every time, even if you've dug in the same spot before.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button asChild size="sm" className="gap-2">
              <a href="https://call811.com" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" /> call811.com
              </a>
            </Button>
            <Button asChild size="sm" variant="outline" className="gap-2">
              <a href="tel:811">
                <PhoneCall className="w-4 h-4" /> Call 811
              </a>
            </Button>
          </div>
        </div>

        <div className="space-y-3 pt-2 border-t">
          <h2 className="font-display font-bold text-lg flex items-center gap-2">
            <Landmark className="w-5 h-5 text-primary" /> Check local permit requirements
          </h2>
          <p className="text-sm text-foreground/90">
            Whether a fence needs a permit — and what height, setback, and material rules apply —
            varies by city and county, and sometimes by HOA. MyYardManager doesn't know your local
            rules and can't tell you whether this project needs a permit. Contact your local
            building or zoning department directly, and check your HOA's covenants if you have one,
            before you build.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button asChild size="sm" variant="outline" className="gap-2">
              <a href={permitSearchUrl} target="_blank" rel="noopener noreferrer">
                <Search className="w-4 h-4" /> Search permit requirements near this address
              </a>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            That search is a convenience, not an answer — verify anything you find with your actual
            local building department before relying on it.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function BeforeYouDig() {
  const [match, params] = useRoute("/editor/:id/before-you-dig");
  const projectId = match && params?.id ? parseInt(params.id) : undefined;
  const { isAuthenticated } = useAuth();
  const searchParams = new URLSearchParams(window.location.search);
  const isGuest = searchParams.get("guest") === "true" && !isAuthenticated;

  if (!projectId || isNaN(projectId)) return <NotFound />;

  return (
    <Layout>
      <BeforeYouDigContent projectId={projectId} isGuest={isGuest} />
    </Layout>
  );
}
