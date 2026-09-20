# PostPlotter — Beta Recruiting Kit for Owner-Operators & Small Fencing Businesses

Grounded in the real, shipped product (postplotter.com) as of 2026-09-17 — every screen, button label, and copy line referenced below exists in the app today, including the scheduling-handoff beat added to the demo script below (accept → notify → mark scheduled, shipped 2026-09-16). The one honest caveat baked into every CTA: business/team accounts are currently set up by hand (there's no self-serve "create your business" flow yet) — so every ask below is "sign up free, then I'll personally set your business profile up," not "click here and you're instantly quoting." That's a feature for early recruiting, not a weakness — it's a real, personal onboarding call, not a form.

---

## 1. Demo Video Script (~40 seconds)

**Goal:** show an owner-operator the three things that actually save them time and win them the job — mapping it on a real satellite photo instead of guessing, sending a real, branded, priced quote in one tap instead of building one by hand, and knowing the second a customer says yes so they can lock in the date before someone else does.

Grew from a tight 30-second cut once the accept/schedule beat below existed to show — see the trim note at the bottom if you need to hit exactly :30 instead.

| Time | VO (read at a brisk, confident pace) |
|---|---|
| 0:00–0:04 | "Still eyeballing property lines and building quotes by hand?" |
| 0:04–0:10 | "With PostPlotter, type in the address — pull up the real satellite photo — and draw the fence line right on it." |
| 0:10–0:15 | "Set your price once. From then on, every job prices itself, automatically." |
| 0:15–0:22 | "One tap sends your customer a real, branded quote they can open right on their phone — no app, no login." |
| 0:22–0:28 | "The moment they tap Accept, you're notified — with their number, ready to call." |
| 0:28–0:32 | "Mark the job scheduled, and move on to the next one." |
| 0:32–0:40 | "Plan it. Price it. Send it. Get it scheduled. That's PostPlotter — try it free at postplotter.com." |

**Word count:** ~101 words — comfortable at a brisk ad-read pace for about 40 seconds.

**If you need exactly :30:** cut the new "Mark the job scheduled" line (0:28–0:32) entirely — the "notified — with their number" beat alone still lands the new feature in one line, and the tagline can drop back to "Plan it. Price it. Send it." without the "Get it scheduled" add-on.

---

## 2. Screen-for-Screen Storyboard

Every screen below is a real, current page/state in the app — nothing staged or mocked up.

| # | Time | Screen (real app state) | What's on screen / action | Caption (if used) |
|---|---|---|---|---|
| 1 | 0:00–0:04 | Cold open — a fence job site, or a printed hand-drawn sketch/tape measure (b-roll, not app) | Sets up the pain: manual measuring, a napkin sketch or spreadsheet quote | "Still doing this by hand?" |
| 2 | 0:04–0:07 | `Add a Property` dialog | Typing a real address into "Property Address" | — |
| 3 | 0:07–0:10 | Editor map, freshly geocoded | Real satellite imagery snaps into view over the actual property | — |
| 4 | 0:10–0:13 | Editor map, drawing mode | Clicking points along the property line — the fence line draws in real time, per-segment length labels appear ("187.4 ft" etc.) | "Draw it on the real property" |
| 5 | 0:13–0:15 | Editor sidebar, "Customer Quote" tab (already toggled/default for a business account) | "Customer Price: $X,XXX.XX" / "243 ft · $XX.XX/ft" appears the instant the line is drawn | "Priced automatically — your rate, not ours" |
| 6 | 0:15–0:17 | Business → Pricing page (quick cutaway) | The $/ft-by-material rate table — "What you charge per linear foot" | "Set your price once" |
| 7 | 0:17–0:20 | "Send Quote to Customer" button → dialog | Typing customer name + email, clicking "Send Quote" | — |
| 8 | 0:20–0:23 | Dialog result state | "Quote sent" + the copyable public link | — |
| 9 | 0:23–0:28 | Cut to a phone screen — the customer's real inbox → the public quote page | Business logo, "Your Fence Quote," big bold total price, "View fence plan" thumbnail — then a phone number typed into "Your phone number" and a tap on "Accept This Quote," which flips to "You accepted this quote" | "They accept — right from their phone, no login" |
| 10 | 0:28–0:31 | Cut to the business's own phone/inbox — the real "[Customer] accepted your quote" notification email | Shows the customer's name/email/phone right in the email body | "You're notified instantly — with their number" |
| 11 | 0:31–0:34 | Business → Sent Quotes table | Click "Mark as Scheduled" next to the now-Accepted row — the badge flips to "Scheduled" | "Lock it in" |
| 12 | 0:34–0:40 | End card — PostPlotter logo (Crosshair mark) on the pale "Blueprint" background | "PostPlotter — Plan it. Price it. Send it. Get it scheduled." + "Free to try — postplotter.com" | — |

**Shot notes for whoever films/screen-records this:**
- Shots 2–11 are real screen recordings — use a real address you're comfortable showing, and a real (or clearly test) email/phone for the customer side.
- Have the business's rate sheet already filled in before recording shot 5, so "Customer Price" appears instantly — don't make the viewer wait through the setup step live (shot 6 is a fast cutaway to show that setup exists, not to walk through it).
- Shot 9 is the emotional payoff of the FIRST half — hold on the customer's phone screen a beat longer than the others; it's the moment that sells "this looks professional," which is the actual value prop for an owner-operator who doesn't want to look like a guy with a spreadsheet. It now also carries the accept action, so give it a couple extra seconds over the original cut to actually show the phone-number field and the tap.
- **Shot 10 needs a real, deliverable email to film cleanly** — `RESEND_API_KEY` is live in production (see CLAUDE.md's Environment section), so recording against the real postplotter.com site will genuinely deliver this email; recording against local dev instead will only log it to the server console (no real inbox to screen-record), so either film this shot against production or fake a clean email-client screenshot for just this one beat.
- Shot 11 is a quick, satisfying "click and it's done" beat — don't linger, the payoff is the badge change, not the click itself.

---

## 3. Three Social Posts

### Post 1 — Problem/solution, short (X/Instagram/Facebook)

> Fence contractors: how long does it take you to turn a walk-through into a quote the customer can actually look at?
>
> We built PostPlotter so you can draw the job on the real satellite photo of the property, price it with your own rate sheet, and text the customer a real, branded quote — before you're back in the truck.
>
> Looking for a few small fencing businesses to try it free and tell us what's missing. Reply or DM if that's you. 🏗️

### Post 2 — Founder/behind-the-scenes angle (LinkedIn/Facebook, longer)

> I've spent the last few months building PostPlotter — a planning and quoting tool for fence contractors, built around one idea: the fastest way to a professional quote starts with the real property, not a notepad.
>
> You type in the address, PostPlotter pulls up the actual satellite imagery, you draw the fence line on it, and it prices the job against a rate sheet you set once. Then one tap sends your customer a real, branded quote they can open on their phone — no login, no app.
>
> It's still early. I'm looking for a handful of owner-operators and small fencing businesses willing to actually use it on a real job and tell me honestly what's broken or missing. Free to try, in exchange for your feedback. If that's you, comment or send me a message.

### Post 3 — Direct feature callout + CTA (contractor Facebook groups)

> Quick one for anyone running a fencing business:
>
> PostPlotter lets you map a fence line on the real satellite photo of a property, set your own $/ft pricing by material, and send a customer a clean, branded quote from your phone — no spreadsheet, no separate invoicing app for the estimate itself.
>
> I'm giving free access to a small group of contractors right now in exchange for real feedback on what works and what doesn't. If you want in, drop a comment or message me directly and I'll get you set up.

---

## 4. Three Emails — Introducing PostPlotter, Inviting a Free Trial for Feedback

Three variants, same core ask, different tones — pick one or A/B test them. All are written for a cold-ish outreach to a business owner you've identified (a local fencing company, a referral, a Facebook-group contact), not a mailing list blast.

### Email 1 — Direct and practical

**Subject:** A faster way to quote fence jobs (free to try)

Hi [Name],

I'm reaching out because I built something I think could save you real time on quoting: PostPlotter.

Here's the short version — you type in a property's address, PostPlotter pulls up the real satellite photo, and you draw the fence line right on it. Set your own price per foot once, and every job after that prices itself automatically. When you're ready, one click sends your customer a real, branded quote they can open on their phone — no login, no app to download.

It's still early, and I'm looking for a small number of fencing businesses to actually use it on real jobs and tell me what works and what doesn't. It's free to try — the only thing I'm asking for in return is your honest feedback.

If you're interested, just reply to this email with your business name and I'll get your account set up personally within a day or two.

Thanks for considering it,
[Your name]
PostPlotter — postplotter.com

---

### Email 2 — Shorter, more casual/founder-to-founder

**Subject:** Built a quoting tool for fence guys — want to try it?

Hey [Name],

Quick one — I've been building a tool called PostPlotter that lets you map a fence job on the real satellite view of the property and send the customer a proper, branded quote straight from your phone. No more sketching it out and building the estimate separately.

I'm looking for a few real fencing businesses to kick the tires on it before I open it up more broadly. It's free, no strings — I just want your honest take on what's useful and what's not.

Worth a look? Reply and I'll get you set up.

[Your name]
postplotter.com

---

### Email 3 — Warmer, for a referral or warm intro

**Subject:** [Referrer]'s idea — thought you might want to see this

Hi [Name],

[Referrer] mentioned you run [Business Name] and thought you might be a good person to show this to.

I've built PostPlotter, a planning and quoting tool built specifically for fence contractors — you draw the job on the real satellite photo of the property, price it against your own rate sheet, and send the customer a clean, branded quote they can open on their phone in seconds.

I'm working with a small group of contractors right now to test it on real jobs before opening it up more widely, and I'd genuinely value your take on it — what's useful, what's missing, what would actually make you switch from however you quote jobs today.

It's completely free while we're testing — all I'm asking for is honest feedback. If you're up for trying it, just reply here and I'll get your business set up personally.

Thanks,
[Your name]
PostPlotter — postplotter.com
