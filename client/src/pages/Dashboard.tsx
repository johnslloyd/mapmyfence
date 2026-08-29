import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link, Redirect } from "wouter";
import { AddPropertyDialog } from "@/components/AddPropertyDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { LoginModal } from "@/components/LoginModal";

function HeroIllustration() {
  return (
    <svg width="520" height="440" viewBox="0 0 520 440" fill="none" className="w-full max-w-[480px] h-auto">
      <rect x="0" y="0" width="520" height="440" rx="10" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="1"/>
      <g stroke="hsl(var(--border))" strokeWidth="1">
        <line x1="24" y1="24" x2="24" y2="416"/><line x1="90" y1="24" x2="90" y2="416"/><line x1="156" y1="24" x2="156" y2="416"/><line x1="222" y1="24" x2="222" y2="416"/><line x1="288" y1="24" x2="288" y2="416"/><line x1="354" y1="24" x2="354" y2="416"/><line x1="420" y1="24" x2="420" y2="416"/><line x1="486" y1="24" x2="486" y2="416"/>
        <line x1="24" y1="24" x2="496" y2="24"/><line x1="24" y1="90" x2="496" y2="90"/><line x1="24" y1="156" x2="496" y2="156"/><line x1="24" y1="222" x2="496" y2="222"/><line x1="24" y1="288" x2="496" y2="288"/><line x1="24" y1="354" x2="496" y2="354"/><line x1="24" y1="416" x2="496" y2="416"/>
      </g>
      <rect x="200" y="130" width="140" height="100" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="1.4"/>
      <path d="M60 80 L60 380 L460 380 L460 110" stroke="hsl(var(--primary))" strokeWidth="2" strokeDasharray="1 8" strokeLinecap="round" fill="none"/>
      <circle cx="60" cy="80" r="5" fill="hsl(var(--primary))"/>
      <circle cx="60" cy="230" r="5" fill="hsl(var(--primary))"/>
      <circle cx="60" cy="380" r="5" fill="hsl(var(--primary))"/>
      <circle cx="260" cy="380" r="5" fill="hsl(var(--primary))"/>
      <circle cx="460" cy="380" r="5" fill="hsl(var(--primary))"/>
      <circle cx="460" cy="110" r="5" fill="hsl(var(--primary))"/>
      <text x="34" y="160" fontFamily="var(--font-mono)" fontSize="11" fill="hsl(var(--muted-foreground))" transform="rotate(-90 34 160)">150.0 ft</text>
      <text x="260" y="400" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="11" fill="hsl(var(--muted-foreground))">400.0 ft</text>
      <rect x="130" y="368" width="76" height="24" rx="4" fill="hsl(var(--accent))" stroke="hsl(var(--primary))" strokeWidth="1"/>
      <text x="168" y="384" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="11" fontWeight="500" fill="hsl(var(--primary))">64.5 ft</text>
    </svg>
  );
}

function UnauthenticatedDashboard() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const primaryCta = (
    <AddPropertyDialog>
      <Button className="h-[52px] px-7 text-base font-semibold">Start planning — it's free</Button>
    </AddPropertyDialog>
  );

  return (
    <Layout>
      <div className="max-w-[1280px] mx-auto">

        {/* HERO */}
        <div className="flex flex-col lg:flex-row items-center gap-14 px-6 md:px-12 py-20 md:py-24">
          <div className="flex-1 min-w-0 text-center lg:text-left">
            <div className="font-mono text-xs text-primary mb-5 tracking-wide">
              &gt; FREE_TO_START · NO_ACCOUNT_REQUIRED
            </div>
            <h1 className="font-display font-semibold text-4xl md:text-5xl leading-tight tracking-tight mb-6 text-primary">
              Plan your yard projects like a pro, one at a time.
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-9 leading-relaxed">
              Map your property once on real satellite imagery, then plan what you're building on top of it — fencing today, with lawn care and more yard projects on the way — all with exact costs pulled from real retailer pricing.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              {primaryCta}
              <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" className="h-[52px] px-6 text-base font-semibold gap-2">
                    Log in <ArrowRight className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <LoginModal onLoginSuccess={() => setIsLoginOpen(false)} />
              </Dialog>
            </div>
            <p className="text-sm text-muted-foreground mt-6">
              Don't have an account? <Link href="/register" className="underline hover:text-primary">Sign up</Link>
            </p>
            <p className="text-xs text-muted-foreground/70 mt-2">
              <Link href="/privacy" className="underline hover:text-muted-foreground">Privacy Policy</Link>
            </p>
          </div>
          <div className="flex-1 min-w-0 flex justify-center">
            <HeroIllustration />
          </div>
        </div>

        {/* VALUE PROPS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border border border-border">
          <div className="bg-secondary/40 p-9 flex flex-col gap-3.5">
            <span className="font-mono text-xs text-primary">01</span>
            <h3 className="font-display font-semibold text-lg">Real satellite imagery</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">See your actual property — driveway, trees, structures — not a rough sketch.</p>
          </div>
          <div className="bg-secondary/40 p-9 flex flex-col gap-3.5">
            <span className="font-mono text-xs text-primary">02</span>
            <h3 className="font-display font-semibold text-lg">Real material pricing</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">Costs pulled from real hardware store listings — exact products, exact prices, whatever you're planning.</p>
          </div>
          <div className="bg-secondary/40 p-9 flex flex-col gap-3.5">
            <span className="font-mono text-xs text-primary">03</span>
            <h3 className="font-display font-semibold text-lg">No commitment to start</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">Plan as a guest. Create an account only when you're ready to save.</p>
          </div>
        </div>

        {/* VERTICALS */}
        <div className="px-6 md:px-12 py-24 border-t border-border">
          <div className="text-center mb-14">
            <h2 className="font-display font-semibold text-3xl tracking-tight mb-3">One map. Every yard project.</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Start with the projects that are ready today — more get added as the platform grows.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-10">
            <div className="bg-card border border-border rounded-2xl p-8">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h3 className="font-display font-semibold text-xl">Fencing</h3>
                <span className="text-xs font-mono font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full whitespace-nowrap">Available now</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">Draw your line on real satellite imagery and get an exact material list and cost, sourced from real retailer pricing.</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-8">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h3 className="font-display font-semibold text-xl">Lawn care</h3>
                <span className="text-xs font-mono font-medium text-muted-foreground bg-secondary px-2.5 py-1 rounded-full whitespace-nowrap">Coming soon</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">Fertilizer, pre-emergent, and treatment timing planned around your yard's size and your local season.</p>
            </div>
          </div>
          <p className="text-center text-sm text-muted-foreground">On the roadmap: sprinkler systems, landscaping layouts, and more.</p>
        </div>

        {/* HOW IT WORKS */}
        <div className="px-6 md:px-12 py-24 border-t border-border">
          <div className="text-center mb-16">
            <div className="font-mono text-xs text-primary mb-3 tracking-wide">FENCING · HOW IT WORKS</div>
            <h2 className="font-display font-semibold text-3xl tracking-tight">Three steps. No spreadsheet.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border border border-border max-w-4xl mx-auto">
            <div className="bg-background p-8 flex flex-col gap-4">
              <div className="font-mono text-xs text-primary">STEP_01</div>
              <h3 className="font-display font-semibold text-lg">Find your property</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Search your address — we center a real satellite view of your yard.</p>
            </div>
            <div className="bg-background p-8 flex flex-col gap-4">
              <div className="font-mono text-xs text-primary">STEP_02</div>
              <h3 className="font-display font-semibold text-lg">Draw your fence line</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Click points along the line — length calculates as you go.</p>
            </div>
            <div className="bg-background p-8 flex flex-col gap-4">
              <div className="font-mono text-xs text-primary">STEP_03</div>
              <h3 className="font-display font-semibold text-lg">Get your estimate</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">A full materials list and total cost, sourced from real store pricing.</p>
            </div>
          </div>
        </div>

        {/* FINAL CTA */}
        <div className="bg-card border-t border-border px-6 py-20 text-center">
          <h2 className="font-display font-semibold text-3xl tracking-tight mb-4">Ready to see your yard on the map?</h2>
          <p className="text-muted-foreground mb-8">Two minutes. No account required to try it.</p>
          <div className="flex justify-center">{primaryCta}</div>
        </div>

      </div>
    </Layout>
  );
}

// Dashboard used to render its own "mini Projects page" for logged-in
// users — 2 stat cards (one, "total footage," was hardcoded mock data
// that was never wired to real fence lengths) plus the 3 most recent
// projects, which was just a subset of what /properties already shows
// in full with search. The only case where this page is genuinely
// different from Properties is the LOGGED-OUT marketing landing page
// below. So: authenticated visitors now redirect straight to /properties
// instead of seeing a redundant, partly-fake summary of it. A real
// stats dashboard (actual aggregate footage/cost across properties)
// would need a real aggregation query that doesn't exist yet — worth
// building later if there's a real need, not worth faking now.
export default function Dashboard() {
  const { isAuthenticated, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <Layout>
        <div className="p-8 max-w-7xl mx-auto space-y-8">
          <div className="space-y-4">
            <Skeleton className="h-12 w-48" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (isAuthenticated) {
    return <Redirect to="/properties" />;
  }

  return <UnauthenticatedDashboard />;
}
