import { Link } from "wouter";
import { Crosshair } from "lucide-react";
import { PageHeader } from "./PageHeader";

// Login/Register/ForgotPassword/ResetPassword each rendered their own
// bare `<div className="flex items-center justify-center min-h-screen">`
// with zero header — no logo, no way back to "/" except the browser's
// own back button. Every other page in the app goes through Layout.tsx
// and gets its real header; these were a silent exception. Full Layout
// doesn't fit here though — its nav (Add a Property, a Login button
// that opens ANOTHER login form, the account menu) is either redundant
// or nonsensical while you're mid-auth-flow. Renders the same shared
// PageHeader Layout.tsx uses (see PageHeader.tsx for why that's shared
// now, not hand-copied) with just the logo as content — no nav/action
// row — so switching between "logged out on an auth page" and "logged
// out on any other page" reads as the same app, not a different one.
export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    // min-h-dvh, not min-h-screen (2026-09-14) — same iOS Safari fix as
    // Layout.tsx's own container: 100vh doesn't shrink when Safari's
    // chrome is actually showing, 100dvh does. This is only a MINIMUM
    // height here (the page can grow past it), so the practical effect
    // is smaller than Layout.tsx's full-height case, but the same
    // "header renders where the chrome is" risk exists on a short page.
    <div className="min-h-dvh flex flex-col bg-secondary/30">
      <PageHeader>
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-primary text-primary-foreground p-2 rounded-lg">
            <Crosshair className="w-6 h-6" />
          </div>
          <span className="font-display font-bold text-xl">PostPlotter</span>
        </Link>
      </PageHeader>
      <main className="flex-1 flex items-center justify-center p-4">
        {children}
      </main>
    </div>
  );
}
