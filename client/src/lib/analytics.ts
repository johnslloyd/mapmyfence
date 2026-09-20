// Google Analytics 4. Loads only when VITE_GA_MEASUREMENT_ID is set at build
// time (Dockerfile ARG / GitHub Actions secret) — unset means analytics never
// loads at all, which is also how local dev stays out of the real data.
//
// Privacy decisions baked in, see Privacy.tsx and CLAUDE.md:
// - URLs are sanitized before they reach Google. Public quote links carry an
//   unguessable access token in the path (/quotes/<token>) and password-reset
//   links carry one in the query string — sending either would hand a working
//   credential to a third party. Query strings are never sent, tokens are
//   masked, and numeric ids are generalized (/editor/:id).
// - /admin pages are never tracked.
// - Google signals / ad personalization are off: analytics only, no ads.
// - GA's "Page changes based on browser history events" enhanced-measurement
//   toggle must be OFF in the GA stream settings, or GA emits its own
//   page_views using the real URL, bypassing the sanitizing done here.

const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function sanitizePath(pathname: string): string {
  return (
    pathname
      .split("?")[0]
      .replace(/^\/quotes\/[^/]+/, "/quotes/[token]")
      .replace(/\/\d+(?=\/|$)/g, "/:id") || "/"
  );
}

const isExcluded = (path: string) => path === "/admin" || path.startsWith("/admin/");

let initialized = false;

export function initAnalytics() {
  if (!GA_ID || initialized || typeof window === "undefined") return;
  initialized = true;

  window.dataLayer = window.dataLayer || [];
  // gtag.js requires the real `arguments` object, not a rest array.
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments);
  };

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`;
  document.head.appendChild(script);

  window.gtag("js", new Date());
  // Set a safe page_location BEFORE config so nothing (including GA's own
  // automatic events) can fall back to the raw URL.
  window.gtag("set", { page_location: window.location.origin + sanitizePath(window.location.pathname) });
  window.gtag("config", GA_ID, {
    send_page_view: false,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });
}

export function trackPageView(pathname: string) {
  if (!GA_ID || !window.gtag) return;
  const safe = sanitizePath(pathname);
  if (isExcluded(safe)) return;
  const location = window.location.origin + safe;
  window.gtag("set", { page_location: location });
  window.gtag("event", "page_view", { page_location: location, page_path: safe, page_title: safe });
}

// Funnel events. Never pass anything identifying (emails, names, phone
// numbers, addresses, tokens) in params.
export function trackEvent(name: string, params: Record<string, string | number | boolean> = {}) {
  if (!GA_ID || !window.gtag) return;
  if (isExcluded(window.location.pathname)) return;
  window.gtag("event", name, params);
}
