import { Layout } from "@/components/Layout";
import { Link } from "wouter";

// Plain, honest description of what this app actually does today — not
// boilerplate copied from a generator. Written to match what's actually
// in the codebase (server/events.ts, server/index.ts's session config,
// no analytics/ad/tracking scripts anywhere) rather than asserting
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
            Last updated {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} — MapMyFence is currently in beta.
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
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-display font-bold text-lg text-foreground">What we don't do</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>No third-party analytics, advertising, or tracking scripts of any kind.</li>
              <li>We don't sell or share your data with third parties.</li>
              <li>
                No marketing cookies — the only cookie this site sets is a session cookie that
                keeps you logged in. It's required for the app to work and isn't used for
                tracking.
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
              the map.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display font-bold text-lg text-foreground">Your choices</h2>
            <p>
              You can use MapMyFence as a guest without creating an account — nothing is saved
              unless you sign up. Once you have an account, you can change your password or
              request account deletion from your{" "}
              <Link href="/account" className="underline text-primary">
                Account page
              </Link>
              .
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display font-bold text-lg text-foreground">Questions</h2>
            <p>
              Email us at{" "}
              <a href="mailto:support@mapmyfence.app" className="underline text-primary">
                support@mapmyfence.app
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
}
