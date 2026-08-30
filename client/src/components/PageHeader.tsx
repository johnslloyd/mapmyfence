// The one place that defines the app's header shell — border, blur,
// height, and (2026-08-30) the max-w-6xl/px-4 md:px-8 cap that aligns
// the header's content row with every "wide" page's own content column
// (see CLAUDE.md's "Page width/padding consistency pass"). Extracted
// after that exact cap silently drifted: Layout.tsx got it, but
// AuthLayout.tsx had hand-copied the header markup earlier and was
// never touched by that fix, so Login/Register/ForgotPassword/
// ResetPassword quietly went back to an uncapped header while every
// other page had a capped one. Both now render THIS component instead
// of authoring their own `<header>` — the width/padding can't drift
// between them again because there's only one definition of it.
export function PageHeader({ children, below }: { children: React.ReactNode; below?: React.ReactNode }) {
  return (
    <header className="z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 print:hidden">
      <div className="w-full max-w-6xl mx-auto flex h-16 items-center px-4 md:px-8">
        {children}
      </div>
      {/* `below` is for content that belongs INSIDE the header band but
          outside its capped/fixed-height row — Layout.tsx's mobile nav
          dropdown, specifically, which is full-width and its own
          height, not part of the h-16 row. */}
      {below}
    </header>
  );
}
