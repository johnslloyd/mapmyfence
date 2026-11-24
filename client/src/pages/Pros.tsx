import { useRef } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { AuthLayout } from "@/components/AuthLayout";
import { useAuth } from "@/hooks/use-auth";
import { trackEvent } from "@/lib/analytics";

// /pros — the demo landing page linked from cold outreach emails. A stranger
// watches the video, then one button to sign up. AuthLayout's logo-only
// header is the only other link on purpose (see CLAUDE.md "/pros demo
// landing page"). Never state the video's length in the copy.
export default function Pros() {
  const { user } = useAuth();
  const playTracked = useRef(false);

  const handlePlay = () => {
    if (playTracked.current) return;
    playTracked.current = true;
    trackEvent("demo_video_play");
  };

  // The `from=pros` param carries the source to Register.tsx's sign_up
  // event. analytics.ts never sends query strings to Google (reset links
  // carry a token there), so a GA query param wouldn't work.
  const ctaHref = user ? "/" : "/register?from=pros";

  return (
    <AuthLayout>
      {/* AuthLayout's <main> centers vertically; self-start pins this page
          to the top so a tall desktop window doesn't float it mid-screen. */}
      <div className="self-start w-full max-w-2xl mx-auto py-4 md:py-8">
        <div className="font-mono text-xs text-accent-foreground mb-4 tracking-wide">
          FOR FENCE PROS · BETA
        </div>
        <h1 className="font-display font-semibold text-3xl md:text-4xl leading-tight tracking-tight mb-6 text-primary">
          Draw the fence. Get the numbers. Send the quote.
        </h1>

        <div className="border border-border rounded-lg overflow-hidden bg-card mb-8">
          <video
            className="block w-full h-auto"
            controls
            playsInline
            preload="metadata"
            poster="/video/postplotter-demo-poster.jpg"
            src="/video/postplotter-demo.mp4"
            onPlay={handlePlay}
          />
        </div>

        <div className="space-y-4 text-base leading-relaxed text-muted-foreground mb-8">
          <p>
            I'm John. I built PostPlotter for fence pros: draw the fence line on a satellite photo, get the
            footage and material list, and send your customer a quote.
          </p>
          <p>
            It's brand new, and I'm looking for a handful of fence pros to try it on real jobs and tell me
            what's wrong with it.
          </p>
          <p>
            Sign up free, and I'll set up your business profile and upgrade you to a Pro account at no cost
            while we refine the product.
          </p>
        </div>

        <Button asChild className="h-[52px] px-7 text-base font-semibold w-full sm:w-auto">
          <Link href={ctaHref}>Try it free</Link>
        </Button>
      </div>
    </AuthLayout>
  );
}
