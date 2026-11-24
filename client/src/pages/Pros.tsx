import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { Crosshair, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { AddPropertyDialog } from "@/components/AddPropertyDialog";
import { useAuth } from "@/hooks/use-auth";
import { trackEvent } from "@/lib/analytics";
import { markProsVisit } from "@/lib/signupSource";

// /pros: the sales page linked from cold outreach emails (v2). Two ways in,
// shown twice (John, 2026-11-24):
//   1. Main button: start a fence with no account (the homepage's Add a
//      Property dialog -> guest editor -> "sign up to save" when they save).
//   2. Secondary link: create an account now, which the free Pro offer and
//      the business profile need.
// The beta-offer banner's own link goes to the account option, since it sits
// beside the offer. Built on PageHeader + bg-background rather than
// AuthLayout, whose gray centered login-card layout made v1 read as an auth
// page. See CLAUDE.md "/pros demo landing page". Never state the video's
// length, how long free Pro lasts or what it costs later.

const STEPS = ["Draw the line", "Get footage + materials", "Send the quote"];
const REGISTER_HREF = "/register?from=pros";

// Opens the Add a Property dialog; a guest lands in the editor without an
// account. Works for a signed-in visitor too (the property goes on their
// account), so only the label changes.
function StartFence({ signedIn, className = "" }: { signedIn: boolean; className?: string }) {
  return (
    <AddPropertyDialog>
      <Button
        className={`h-[52px] px-7 text-base font-semibold w-full sm:w-auto ${className}`}
        onClick={() => trackEvent("pros_start_fence")}
      >
        {signedIn ? "Start a fence project" : "Start a fence — no account needed"}
      </Button>
    </AddPropertyDialog>
  );
}

// The second option, as one line of text with a link in it.
function AccountLine({ signedIn, className = "" }: { signedIn: boolean; className?: string }) {
  const linkClass = "font-semibold text-primary underline underline-offset-4 decoration-primary/40 hover:decoration-primary";
  return (
    <p className={`text-sm text-muted-foreground ${className}`}>
      {signedIn ? (
        <>You're signed in. <Link href="/" className={linkClass}>Go to your properties</Link></>
      ) : (
        <>Or <Link href={REGISTER_HREF} className={linkClass}>create your free account</Link>, needed for the free Pro offer.</>
      )}
    </p>
  );
}

export default function Pros() {
  const { user } = useAuth();
  const signedIn = !!user;
  const videoRef = useRef<HTMLVideoElement>(null);
  const playTracked = useRef(false);
  const [started, setStarted] = useState(false);

  // Lets Register.tsx credit a sign-up to /pros even after the guest detour
  // through the editor, which doesn't carry ?from=pros. See signupSource.ts.
  useEffect(() => {
    markProsVisit();
  }, []);

  const handlePlay = () => {
    if (playTracked.current) return;
    playTracked.current = true;
    trackEvent("demo_video_play");
  };

  // The overlay is the only way to start: no controls and no autoplay until
  // the first play, then native controls take over.
  const startVideo = () => {
    setStarted(true);
    videoRef.current?.play().catch(() => {
      // If the browser refuses play(), the native controls (now on) still let
      // the visitor start it themselves.
    });
  };

  return (
    <div className="min-h-dvh bg-background">
      <PageHeader>
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-primary text-primary-foreground p-2 rounded-lg">
            <Crosshair className="w-6 h-6" />
          </div>
          <span className="font-display font-bold text-xl">PostPlotter</span>
        </Link>
      </PageHeader>

      {/* One narrow column on phones and tablets; from lg up the page widens
          to the app's "wide" max-w-6xl and the hero goes two-column (John,
          2026-11-24): headline and buttons on the left, video on the right.
          DOM order stays eyebrow/hook, video, buttons so mobile reads top to
          bottom; grid placement does the rearranging on lg. */}
      <main className="max-w-2xl lg:max-w-6xl mx-auto px-4 md:px-8 py-4 md:py-10 lg:py-12">
        {/* The beta offer first (John, 2026-11-24), filling the same column as
            the hero. A light blue tint of the navy (--primary-soft), not the
            orange accent, which read as an error here. Label, copy and link
            always stack. Compact on phones so the first button stays on the
            first screen. */}
        <div className="mb-5 md:mb-8 lg:mb-12 rounded-lg border border-primary/15 bg-primary-soft px-4 py-3 md:px-5 md:py-4">
          <div className="font-mono text-xs font-semibold text-primary tracking-wide mb-2">THE BETA OFFER</div>
          <p className="text-sm md:text-base leading-snug text-foreground">
            Beta testers get Pro free while we refine the product. I'll set up your business profile for you.
            In return, try it on one real job and tell me what you think.
          </p>
          <Link
            href={signedIn ? "/" : REGISTER_HREF}
            className="mt-2 inline-block text-sm md:text-base font-semibold text-primary underline underline-offset-4 decoration-primary/40 hover:decoration-primary"
          >
            {signedIn ? "Go to your properties →" : "Create your free account →"}
          </Link>
        </div>

        <div className="lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-x-12 lg:items-center">
        {/* First screen at 375x812: eyebrow, hook, video, main button, note. */}
        <div className="lg:col-start-1 lg:row-start-1 lg:self-end">
          <div className="font-mono text-xs text-accent-foreground mb-3 tracking-wide">FOR FENCE PROS · BETA</div>
          <h1 className="font-display font-semibold text-3xl md:text-5xl leading-tight tracking-tight text-balance text-primary">
            Measure from the satellite photo. Send the quote the same day.
          </h1>
        </div>

        <div className="relative mt-4 lg:mt-0 lg:col-start-2 lg:row-start-1 lg:row-span-2 border border-border rounded-lg overflow-hidden bg-card">
          <video
            ref={videoRef}
            className="block w-full aspect-[16/10] h-auto"
            playsInline
            preload="metadata"
            controls={started}
            poster="/video/postplotter-demo-poster.jpg"
            src="/video/postplotter-demo.mp4"
            onPlay={handlePlay}
          />
          {!started && (
            <button
              type="button"
              onClick={startVideo}
              aria-label="Play the demo video"
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[72px] w-[72px] rounded-full bg-accent text-primary border border-primary flex items-center justify-center shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Play className="w-8 h-8 ml-1 fill-current" />
            </button>
          )}
        </div>

        <div className="lg:col-start-1 lg:row-start-2 lg:self-start lg:mt-8">
          <StartFence signedIn={signedIn} className="mt-4 lg:mt-0" />
          <p className="mt-3 text-sm text-muted-foreground">No credit card. Nothing to install.</p>
          <AccountLine signedIn={signedIn} className="mt-2" />
        </div>
        </div>

        {/* Steps strip: the homepage "How it works" grid, titles only. */}
        <div className="mt-10 lg:mt-16 grid grid-cols-3 gap-px bg-border border border-border">
          {STEPS.map((title, i) => (
            <div key={title} className="bg-background p-3 md:p-5 flex flex-col gap-2">
              <div className="font-mono text-xs text-accent-foreground">STEP_0{i + 1}</div>
              <div className="font-display font-semibold text-sm md:text-lg leading-tight text-foreground">{title}</div>
            </div>
          ))}
        </div>
        {/* Honest about what the no-account path shows: the editor's
            materials estimate, not the customer quote from the video, which
            needs an account, a business profile and rates. */}
        <p className="mt-3 text-sm text-muted-foreground">
          Draw a fence and get the footage and materials right away. Sending customer quotes turns on once your
          business profile is set up.
        </p>

        {/* Closing */}
        <section className="mt-10 pt-10 lg:mt-16 lg:pt-12 border-t border-border text-center">
          <StartFence signedIn={signedIn} />
          <AccountLine signedIn={signedIn} className="mt-3" />
          {/* Not every visitor arrives from John's email, so name the address
              instead of "reply to my email". A mailto link so a phone can tap it. */}
          <p className="mt-3 text-sm text-muted-foreground">
            Questions? Email{" "}
            <a href="mailto:john@postplotter.com" className="text-primary underline underline-offset-2">
              john@postplotter.com
            </a>
          </p>
        </section>
      </main>
    </div>
  );
}
