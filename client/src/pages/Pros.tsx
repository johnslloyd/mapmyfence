import { useRef, useState } from "react";
import { Link } from "wouter";
import { Crosshair, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/hooks/use-auth";
import { trackEvent } from "@/lib/analytics";

// /pros: the sales page linked from cold outreach emails (v2). One action,
// shown twice: sign up. The only links are the logo and the two buttons.
// Built on PageHeader + bg-background rather than AuthLayout, whose gray
// centered login-card layout made v1 read as an auth page. See CLAUDE.md
// "/pros demo landing page". Never state the video's length, how long free
// Pro lasts or what it costs later.

const STEPS = ["Draw the line", "Get footage + materials", "Send the quote"];

function TryItFree({ href, className = "" }: { href: string; className?: string }) {
  return (
    <Button asChild className={`h-[52px] px-7 text-base font-semibold w-full sm:w-auto ${className}`}>
      <Link href={href}>Try it free</Link>
    </Button>
  );
}

export default function Pros() {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const playTracked = useRef(false);
  const [started, setStarted] = useState(false);

  // The `from=pros` param carries the source to Register.tsx's sign_up
  // event. analytics.ts never sends query strings to Google.
  const ctaHref = user ? "/" : "/register?from=pros";

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
          2026-11-24): headline and button on the left, video on the right.
          DOM order stays eyebrow/hook, video, button so mobile is unchanged;
          grid placement does the rearranging on lg. */}
      <main className="max-w-2xl lg:max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-12 lg:py-16">
        <div className="lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-x-12 lg:items-center">
        {/* First screen at 375x812: eyebrow, hook, video, button, note. */}
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
          <TryItFree href={ctaHref} className="mt-4 lg:mt-0" />
          <p className="mt-3 text-sm text-muted-foreground">No credit card. Nothing to install.</p>
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

        {/* Offer box */}
        {/* Kept to a readable line length on wide screens. */}
        <div className="mt-8 lg:mt-10 lg:max-w-3xl lg:mx-auto bg-accent rounded-lg p-5 lg:p-6 border border-accent-foreground/20">
          <div className="font-mono text-xs text-accent-foreground tracking-wide mb-3">THE BETA OFFER</div>
          <div className="space-y-3 text-base leading-relaxed text-foreground">
            <p>Beta testers get Pro free while we refine the product. I'll set up your business profile for you.</p>
            <p>In return, try it on one real job and tell me what you think.</p>
          </div>
        </div>

        {/* Closing */}
        <section className="mt-10 pt-10 lg:mt-16 lg:pt-12 border-t border-border text-center">
          <TryItFree href={ctaHref} />
          <p className="mt-3 text-sm text-muted-foreground">Questions? Just reply to my email.</p>
        </section>
      </main>
    </div>
  );
}
