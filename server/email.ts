// Minimal transactional email — currently used for password reset only.
// Uses Resend's plain HTTP API directly (a fetch call, not their SDK) so
// this doesn't add a dependency the app can't yet verify works without a
// real API key, matching how this codebase already calls Nominatim/Esri/
// ArcGIS directly rather than pulling in a client library per service.
//
// No RESEND_API_KEY set (true for local dev today — nothing issued one
// yet): falls back to logging the email's content to the server console
// instead of failing. This keeps the password-reset FLOW fully testable
// end-to-end without live credentials; it does NOT mean email is
// "working" — before this goes in front of real users, set a real
// RESEND_API_KEY (or swap this for whatever provider is actually
// chosen) or password reset silently never reaches anyone.
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_ADDRESS = process.env.EMAIL_FROM || "PostPlotter <onboarding@resend.dev>";

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.warn(
      `[email] RESEND_API_KEY not set — logging instead of sending.\n` +
        `  to: ${to}\n  subject: ${subject}\n  ---\n${text}\n  ---`,
    );
    // Returning true here (not false) is deliberate: the caller (e.g.
    // forgot-password) should still respond to the client as if the
    // email went out, so the endpoint's behavior doesn't leak whether
    // sending actually succeeded — see the enumeration note in
    // authRoutes.ts.
    return true;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM_ADDRESS, to, subject, html, text }),
    });
    if (!res.ok) {
      console.error(`[email] Resend API error (${res.status}):`, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] Failed to send:", err);
    return false;
  }
}
