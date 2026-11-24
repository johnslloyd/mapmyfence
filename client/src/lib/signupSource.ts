// Remembers, for this browser tab's session, that the visitor came through
// the /pros landing page, so Register.tsx can tag the sign_up event with
// source: "pros" even when they took the try-first path (/pros -> Add a
// Property -> editor -> "sign up to save" -> /register?propertyId=...),
// which never carries ?from=pros in the URL.
//
// sessionStorage, not a cookie or the server: it's only an analytics label,
// it dies with the tab, and nothing about it is stored or sent anywhere
// except as that one GA event param. Every access is wrapped because
// storage can throw (private mode, blocked site data).

const KEY = "postplotter.signupSource";

export function markProsVisit() {
  try {
    sessionStorage.setItem(KEY, "pros");
  } catch {
    /* storage unavailable: the ?from=pros link still covers the direct path */
  }
}

export function cameFromPros(): boolean {
  try {
    return sessionStorage.getItem(KEY) === "pros";
  } catch {
    return false;
  }
}

// Called once the sign_up event has been sent, so a later sign-up in the same
// tab (say, after logging out) isn't credited to /pros again.
export function clearSignupSource() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* nothing to clear */
  }
}
