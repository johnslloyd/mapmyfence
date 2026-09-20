// Builds the two kinetic-text cards (hook + closing) as HTML driven by
// the real VO word timings in vo/transcript.json, so each word appears
// exactly when it's spoken. No b-roll: these replace the cold open.
const fs = require("fs");
const path = require("path");

const NAVY = "#16294B";
const ORANGE = "#A9CCF5"; // pale blue accent (var name kept from the orange version)
const FONT_LINK =
  '<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@600;700;800&family=Public+Sans:wght@400;500;600&display=swap" rel="stylesheet">';

const base = `
<style>
  html,body{margin:0;height:100%;background:${NAVY};overflow:hidden;font-family:'Archivo',sans-serif;color:#fff}
  .stage{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;text-align:center;padding:0 90px}
  .w{display:inline-block;opacity:0;transform:translateY(18px);transition:opacity .28s ease-out,transform .28s ease-out;margin:0 .14em}
  .w.on{opacity:1;transform:none}
  .hl{color:${ORANGE}}
  .grid{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.05) 1px,transparent 1px);background-size:64px 64px}
</style>`;

function words() {
  const d = JSON.parse(fs.readFileSync(path.join(__dirname, "vo/transcript.json"), "utf8"));
  return d.transcription
    .map((s) => ({ t: s.offsets.from / 1000, text: s.text.trim() }))
    .filter((w) => w.text);
}

const all = words();

// Hook: "Still planning fence lines on a legal pad and building quotes by hand?"
const hookWords = all.filter((w) => w.t < 3.7);
const hookHtml = `<!doctype html><html><head><meta charset="utf-8">${FONT_LINK}${base}</head><body>
<div class="grid"></div>
<div class="stage"><div id="t" style="font-weight:800;font-size:78px;line-height:1.18;max-width:1080px"></div></div>
<script>
const words=${JSON.stringify(hookWords)};
const hl=new Set(["legal","pad","by","hand?"]);
const el=document.getElementById('t');
words.forEach(w=>{const s=document.createElement('span');s.className='w'+(hl.has(w.text.toLowerCase())?' hl':'');s.textContent=w.text;el.appendChild(s);w.el=s;});
window.start=()=>{const t0=performance.now();words.forEach(w=>setTimeout(()=>w.el.classList.add('on'),w.t*1000));};
</script></body></html>`;

// Closing: tagline lines synced to "Plan it, price it, send it, get it
// scheduled", then the lockup at "That's PostPlotter" (34.6s absolute).
const CLOSE_START = 31.6;
const tag = ["Plan it.", "Price it.", "Send it.", "Get it scheduled."];
const tagTimes = [31.6, 32.16, 32.79, 33.56].map((t) => t - CLOSE_START);
const lockupAt = 34.6 - CLOSE_START;
const logoSvg = `<svg width="84" height="84" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="22" x2="18" y1="12" y2="12"/><line x1="6" x2="2" y1="12" y2="12"/><line x1="12" x2="12" y1="6" y2="2"/><line x1="12" x2="12" y1="22" y2="18"/></svg>`;
const closeHtml = `<!doctype html><html><head><meta charset="utf-8">${FONT_LINK}${base}
<style>
  .line{font-weight:800;font-size:88px;line-height:1.15;opacity:0;transform:translateY(20px);transition:opacity .3s,transform .3s}
  .line.on{opacity:1;transform:none}
  .line.last{color:${ORANGE}}
  #tags{transition:opacity .4s}
  #tags.off{opacity:0}
  #lock{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px;opacity:0;transition:opacity .5s}
  #lock.on{opacity:1}
  .badge{width:132px;height:132px;border-radius:26px;background:#1f3b6b;display:flex;align-items:center;justify-content:center;box-shadow:0 12px 40px rgba(0,0,0,.35)}
  .name{font-weight:800;font-size:76px;letter-spacing:-1px}
  .url{font-family:'Public Sans',sans-serif;font-weight:600;font-size:36px;color:${ORANGE}}
</style></head><body>
<div class="grid"></div>
<div class="stage"><div id="tags">${tag.map((t, i) => `<div class="line${i === 3 ? " last" : ""}">${t}</div>`).join("")}</div></div>
<div id="lock"><div class="badge">${logoSvg}</div><div class="name">PostPlotter</div><div class="url">Try it free at postplotter.com</div></div>
<script>
const times=${JSON.stringify(tagTimes)};
const lines=[...document.querySelectorAll('.line')];
window.start=()=>{
  lines.forEach((l,i)=>setTimeout(()=>l.classList.add('on'),times[i]*1000));
  setTimeout(()=>document.getElementById('tags').classList.add('off'),${(lockupAt - 0.2) * 1000});
  setTimeout(()=>document.getElementById('lock').classList.add('on'),${lockupAt * 1000});
};
</script></body></html>`;

fs.writeFileSync(path.join(__dirname, "card-hook.html"), hookHtml);
fs.writeFileSync(path.join(__dirname, "card-close.html"), closeHtml);
console.log("wrote card-hook.html, card-close.html; hook words:", hookWords.length);
