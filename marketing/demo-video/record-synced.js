// Records the demo video timed to the real ElevenLabs VO. Every action
// fires at the moment the VO says it (times below are seconds into the
// audio, from whisper word timestamps in vo/transcript.json).
//
// Usage: node cards.js && node record-synced.js
// Requires: dev server on :5051, ./seed.sh already run (demo business).
const { chromium } = require("playwright");
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const BASE = "http://localhost:5051";
const DIR = __dirname;
const RAW = path.join(DIR, "output", "raw");
const SEG = path.join(DIR, "output", "seg");
fs.mkdirSync(RAW, { recursive: true });
fs.mkdirSync(SEG, { recursive: true });

const ADDRESS = "3869 Cobblewood Drive, Southaven, MS 38672";
const NAME = "Jamie Homeowner";
const EMAIL = "jamie.homeowner@example.com";
const PHONE = "(901) 555-0173";
const rd = (f) => fs.readFileSync(path.join(DIR, f), "utf8").trim();

// Audio-time boundaries of each segment.
const T = { hook: [0, 3.72], biz: [3.72, 24.88], cust: [24.88, 28.9], sent: [28.9, 31.6], close: [31.6, 38.5] };

async function login(ctx) {
  const r = await ctx.request.post(`${BASE}/api/login`, { data: { email: rd("owner_email.txt"), password: rd("owner_password.txt") } });
  if (!r.ok()) throw new Error("login failed " + r.status());
}

// Runs one segment: records video, aligns an audio-time clock to the
// moment content is ready, then trims lead-in / pads tail to exact length.
async function segment(browser, name, [segStart, segEnd], opts, run) {
  const ctx = await browser.newContext({
    recordVideo: { dir: RAW, size: opts.size },
    viewport: opts.size,
    ...(opts.mobile ? { userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1", isMobile: true, hasTouch: true } : {}),
  });
  if (opts.login) await login(ctx);
  if (opts.init) await ctx.addInitScript(opts.init);
  const created = Date.now();
  const page = await ctx.newPage();
  let c0 = null;
  const ctxObj = {
    ready: () => { c0 = Date.now(); },
    at: async (tAbs) => {
      const d = c0 + (tAbs - segStart) * 1000 - Date.now();
      if (d > 0) await page.waitForTimeout(d);
      else if (d < -400) console.log(`  [${name}] late by ${(-d / 1000).toFixed(2)}s at ${tAbs}`);
    },
  };
  const out = await run(page, ctxObj);
  await ctxObj.at(segEnd);
  const lead = (c0 - created) / 1000;
  const dur = segEnd - segStart;
  await ctx.close();
  const rawPath = path.join(RAW, `${name}.webm`);
  await page.video().saveAs(rawPath);
  const vf = opts.mobile
    ? "scale=-2:800,pad=1280:800:(1280-iw)/2:0:color=0x16294B,setsar=1,fps=25,format=yuv420p"
    : "setsar=1,fps=25,format=yuv420p";
  execFileSync("ffmpeg", ["-y", "-v", "error", "-ss", lead.toFixed(3), "-i", rawPath, "-vf", `tpad=stop_mode=clone:stop_duration=5,${vf}`, "-t", dur.toFixed(3), "-c:v", "libx264", "-crf", "18", path.join(SEG, `${name}.mp4`)]);
  console.log(`${name}: lead-in ${lead.toFixed(2)}s, len ${dur.toFixed(2)}s`);
  return out;
}

// AddPropertyDialog appends ?guest=true to the editor URL even when signed
// in, and Editor treats that param as guest mode (no Send Quote button,
// no Customer Quote view) until a full reload. Strip it from history
// calls so the recording shows the signed-in editor straight away.
const STRIP_GUEST = `(() => { for (const m of ["pushState","replaceState"]) { const o = history[m]; history[m] = function(s,t,u){ if (typeof u === "string") u = u.replace(/[?&]guest=true/, ""); return o.call(this,s,t,u); }; } })();`;

// Client-side (wouter) navigation: instant and keeps the query cache,
// unlike page.goto which reloads the whole app and blanks the frame.
const spa = (page, url) => page.evaluate((u) => { history.pushState({}, "", u); dispatchEvent(new PopStateEvent("popstate")); }, url);

async function card(browser, name, file, range) {
  return segment(browser, name, range, { size: { width: 1280, height: 800 } }, async (page, c) => {
    await page.goto("file://" + path.join(DIR, file));
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(300);
    c.ready();
    await page.evaluate(() => window.start());
  });
}

async function main() {
  const browser = await chromium.launch();
  const D = { width: 1280, height: 800 };

  // reset demo account to zero properties so the onboarding screen shows
  {
    const ctx = await browser.newContext();
    await login(ctx);
    const props = await (await ctx.request.get(`${BASE}/api/properties`)).json();
    for (const p of props) await ctx.request.delete(`${BASE}/api/properties/${p.id}`);
    await ctx.close();
  }

  await card(browser, "hook", "card-hook.html", T.hook);

  let publicUrl, projectUrl;
  await segment(browser, "biz", T.biz, { size: D, login: true, init: STRIP_GUEST }, async (page, c) => {
    await page.goto(BASE, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("text=Add a Property");
    await page.waitForTimeout(300);
    c.ready();
    await c.at(4.3);
    await page.getByRole("button", { name: "Add a Property" }).first().click();
    await c.at(4.6);
    await page.getByLabel("Property Name").pressSequentially("Backyard Fence", { delay: 28 });
    await c.at(5.25);
    await page.getByLabel("Property Address").pressSequentially(ADDRESS, { delay: 20 });
    await c.at(6.3);
    await page.getByRole("button", { name: "Start Planning" }).click();
    await page.waitForURL(/\/editor\/\d+/, { timeout: 15000 });
    projectUrl = page.url().split("?")[0];
    await page.waitForSelector(".leaflet-container");
    await c.at(9.3);
    await page.getByRole("button", { name: "Create a Fence Line" }).click();
    const box = await page.locator(".leaflet-container").boundingBox();
    const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
    // Traces the backyard fence of 3869 Cobblewood Dr (offsets from map
    // center, at the recording's zoom): down the east side, west along the
    // back fence, north up the west side, then a short jog east along the
    // house. One point per beat of "draw the fence line right on the map".
    const pts = [[121, 123, 9.75], [120, 231, 10.1], [7.5, 226.5, 10.45], [9, 121, 10.8], [39, 121, 11.15]];
    for (const [dx, dy, t] of pts) {
      await c.at(t);
      await page.mouse.click(cx + dx, cy + dy);
    }
    await c.at(11.55);
    await page.getByRole("button", { name: "Save Line" }).click();
    await c.at(11.8);
    await spa(page, "/business");
    await page.waitForSelector("text=Pricing");
    await c.at(13.75);
    await spa(page, new URL(projectUrl).pathname);
    await page.waitForSelector("text=Send Quote to Customer");
    await c.at(15.3);
    await page.getByText("Materials List", { exact: true }).click();
    await c.at(16.4);
    await page.getByText("Customer Quote", { exact: true }).first().click();
    await c.at(19.85);
    await page.getByRole("button", { name: "Send Quote to Customer" }).click();
    await c.at(20.2);
    await page.locator("#quote-customer-name").pressSequentially(NAME, { delay: 35 });
    await c.at(20.95);
    await page.locator("#quote-customer-email").pressSequentially(EMAIL, { delay: 30 });
    await c.at(22.4);
    await page.getByRole("button", { name: "Send Quote" }).click();
    await page.waitForSelector("input[readonly]");
    publicUrl = await page.locator("input[readonly]").inputValue();
  });

  await segment(browser, "cust", T.cust, { size: { width: 390, height: 844 }, mobile: true }, async (page, c) => {
    await page.goto(publicUrl, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("text=Accept This Quote");
    await page.waitForTimeout(200);
    c.ready();
    await c.at(26.2);
    await page.getByLabel("Your phone number").pressSequentially(PHONE, { delay: 65 });
    await c.at(27.85);
    await page.getByRole("button", { name: "Accept This Quote" }).click();
    await page.waitForSelector("text=You accepted this quote");
  });

  await segment(browser, "sent", T.sent, { size: D, login: true }, async (page, c) => {
    await page.goto(`${BASE}/business`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("text=Mark as Scheduled");
    await page.locator("table").last().scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    c.ready();
    await c.at(30.5);
    await page.getByRole("button", { name: "Mark as Scheduled" }).click();
    await page.waitForSelector("text=Scheduled");
  });

  await card(browser, "close", "card-close.html", T.close);
  await browser.close();

  // assemble
  const list = ["hook", "biz", "cust", "sent", "close"].map((n) => `file '${path.join(SEG, n + ".mp4")}'`).join("\n");
  fs.writeFileSync(path.join(SEG, "list.txt"), list);
  execFileSync("ffmpeg", ["-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", path.join(SEG, "list.txt"), "-i", path.join(DIR, "vo/elevenlabs.mp3"),
    "-map", "0:v", "-map", "1:a", "-c:v", "libx264", "-crf", "20", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k",
    path.join(DIR, "output", "postplotter-demo-synced.mp4")]);
  console.log("wrote output/postplotter-demo-synced.mp4");
}

main().catch((e) => { console.error(e); process.exit(1); });
