// Renders poster.html to the /pros video poster at 1280x800.
//   node poster.js  ->  ../../client/public/video/postplotter-demo-poster.jpg
const { chromium } = require("playwright");
const path = require("path");

const OUT = path.join(__dirname, "..", "..", "client", "public", "video", "postplotter-demo-poster.jpg");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto("file://" + path.join(__dirname, "poster.html"));
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: OUT, type: "jpeg", quality: 90 });
  await browser.close();
  console.log("wrote " + path.relative(process.cwd(), OUT));
})().catch((e) => { console.error(e); process.exit(1); });
