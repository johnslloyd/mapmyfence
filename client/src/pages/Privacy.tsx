import { Layout } from "@/components/Layout";
import { Link } from "wouter";

// Plain, honest description of what this app actually does today — not
// boilerplate copied from a generator. Written to match what's actually
// in the codebase (server/events.ts, server/index.ts's session config,
// client/src/lib/analytics.ts for Google Analytics) rather than asserting
// generic privacy-policy claims that may not be true of this app. This
// is a beta-stage disclosure, not reviewed by an attorney — treat it as
// a starting point to have actually reviewed before a wider public
// launch, not a finished legal document.
export default function Privacy() {
  return (
    <Layout>
      <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Privacy Policy</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Last updated September 20, 2026 — PostPlotter is currently in beta.
          </p>
        </div>

        <div className="space-y-6 text-sm leading-relaxed text-foreground/90">
          <section className="space-y-2">
            <h2 className="font-display font-bold text-lg text-foreground">What we collect</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Account info</strong>: your email address and a password (stored as a
                one-way hash — we never store or can see your actual password).
              </li>
              <li>
                <strong>Project data</strong>: whatever you enter to plan a fence — project name,
                property address, notes, the fence lines you draw (as map coordinates), and your
                selected material/height for each line.
              </li>
              <li>
                <strong>Basic usage events</strong>: a small, first-party log of things like
                "account created" or "project created," tied to your account and project IDs —
                used only to understand how the app is used. This never leaves our own database.
              </li>
              <li>
                <strong>Site analytics (Google Analytics)</strong>: which pages are visited, the
                device, browser and approximate location (city/region) Google derives from your
                connection, how you arrived, and whether key steps happen (such as an account
                being created, a fence line saved, or a quote sent or accepted). We
                deliberately keep identifying details out of it: it never receives your email,
                name, phone number, or property address, and quote links — which contain a
                private access code — are reported only as a generic "quote page," never with
                the code. Google Analytics 4 doesn't log or store IP addresses. It sets
                cookies (named <code>_ga</code> and <code>_ga_…</code>) to tell visits apart.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-display font-bold text-lg text-foreground">What we don't do</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                No advertising or ad-tracking. Google Analytics is the only third-party
                analytics tool we use, and its advertising features (Google signals and ad
                personalization) are turned off.
              </li>
              <li>We don't sell your data.</li>
              <li>
                No marketing cookies. This site sets a session cookie that keeps you logged in
                (required for the app to work) and Google Analytics' measurement cookies
                described above. Neither is used for advertising.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-display font-bold text-lg text-foreground">Who else sees your data</h2>
            <p>
              Material estimates link out to real product pages on Lowe's and Home Depot's own
              websites — visiting those links is subject to their privacy policies, not ours.
              Map imagery and address search are provided by Esri and OpenStreetMap's Nominatim
              service; searching an address sends that search text to Nominatim to locate it on
              the map. Google receives the analytics described above; see Google's own{" "}
              <a href="https://policies.google.com/technologies/partner-sites" className="underline text-primary" target="_blank" rel="noreferrer">
                explanation of how it uses data
              </a>
              .
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display font-bold text-lg text-foreground">Your choices</h2>
            <p>
              You can use PostPlotter as a guest without creating an account — nothing is saved
              unless you sign up. Once you have an account, you can change your password or
              request account deletion from your{" "}
              <Link href="/account" className="underline text-primary">
                Account page
              </Link>
              .
            </p>
            <p>
              To opt out of Google Analytics on any website, you can install Google's{" "}
              <a href="https://tools.google.com/dlpage/gaoptout" className="underline text-primary" target="_blank" rel="noreferrer">
                browser opt-out add-on
              </a>{" "}
              or block analytics with your browser's privacy settings; PostPlotter works the same either way.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display font-bold text-lg text-foreground">Questions</h2>
            <p>
              Email us at{" "}
              <a href="mailto:john@postplotter.com" className="underline text-primary">
                john@postplotter.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
}
