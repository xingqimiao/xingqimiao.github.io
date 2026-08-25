/* Mobile-viewport harness. Invariants:
 * 1. While any ancestor of the pill has a live transform (the page-rise
 *    entrance running), the pill must be invisible — it is caged to the
 *    container then and must never show mid-page.
 * 2. After the entrance the pill is visible, position:fixed, pinned to
 *    innerHeight-16, with no caging ancestors — through scroll, viewport
 *    height changes (URL bar), delayed JS, and long pages.
 * Run against `npm run dev`. */
/* eslint-disable @typescript-eslint/no-require-imports */
const { chromium } = require("C:/Users/fkxw2/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");

const BASE = process.env.PILL_BASE || "http://localhost:3000";
// Static-export mode (PILL_BASE served from out/) needs the .html suffix.
const EXT = process.env.PILL_BASE && process.env.PILL_BASE.includes(":8090") ? ".html" : "";
const SHORT = (process.env.PILL_SHORT || "/stories/10755068") + EXT;
const LONG = (process.env.PILL_LONG || "/stories/47228326") + EXT;

const state = (page) =>
  page.evaluate(() => {
    const btn = [...document.querySelectorAll("button")].find((b) =>
      (b.textContent || "").includes("添加公开评论"),
    );
    if (!btn) return { found: false };
    const w = btn.parentElement;
    const rect = w.getBoundingClientRect();
    const cs = getComputedStyle(w);
    const cage = [];
    let el = w.parentElement;
    while (el && el !== document.documentElement) {
      const s = getComputedStyle(el);
      if (
        s.transform !== "none" ||
        s.willChange !== "auto" ||
        s.filter !== "none" ||
        s.backdropFilter !== "none" ||
        (s.contain && s.contain !== "none")
      )
        cage.push(`${el.tagName}.${(el.className || "").toString().slice(0, 40)}`);
      el = el.parentElement;
    }
    return {
      found: true,
      position: cs.position,
      bottom: Math.round(rect.bottom),
      innerH: window.innerHeight,
      opacity: cs.opacity,
      scrollY: Math.round(window.scrollY),
      cage,
    };
  });

const results = [];
const pinned = (label, s) => {
  if (!s.found) throw new Error(`${label}: pill not found`);
  if (s.cage.length) throw new Error(`${label}: caging ancestors: ${s.cage.join(" | ")}`);
  if (s.position !== "fixed") throw new Error(`${label}: position=${s.position}`);
  if (Number(s.opacity) < 0.99) throw new Error(`${label}: opacity=${s.opacity}`);
  if (s.bottom !== s.innerH - 16) throw new Error(`${label}: bottom=${s.bottom} innerH=${s.innerH}`);
  results.push(`${label}: OK (fixed, visible, bottom=${s.bottom}/${s.innerH})`);
};
const hiddenWhileCaged = (label, s) => {
  if (!s.found) throw new Error(`${label}: pill not found`);
  if (s.cage.length && Number(s.opacity) !== 0)
    throw new Error(`${label}: caged (${s.cage.join(" | ")}) but visible opacity=${s.opacity}`);
  results.push(
    `${label}: OK (${s.cage.length ? `caged+invisible opacity=${s.opacity}` : "uncaged already"})`,
  );
};

(async () => {
  const browser = await chromium.launch({ headless: true, channel: "msedge" });
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  });
  const page = await ctx.newPage();

  // Warm the dev compile before measuring.
  await page.goto(BASE + SHORT, { waitUntil: "load" });
  await page.waitForTimeout(800);

  // A. load timeline: caged ⇒ invisible; after entrance ⇒ pinned+visible
  await page.goto(BASE + SHORT, { waitUntil: "domcontentloaded" });
  hiddenWhileCaged("A1 entrance start", await state(page));
  await page.waitForTimeout(400);
  hiddenWhileCaged("A2 entrance mid", await state(page));
  await page.waitForTimeout(1400);
  pinned("A3 entrance done", await state(page));
  await page.waitForTimeout(2500);
  pinned("A4 +4s", await state(page));

  // B. scroll down in steps — pinned the whole way
  const maxY = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
  for (const frac of [0.15, 0.3, 0.5, 0.7, 0.85, 1]) {
    await page.evaluate((y) => window.scrollTo(0, y), Math.round(maxY * frac));
    await page.waitForTimeout(200);
    pinned(`B scroll ${Math.round(frac * 100)}%`, await state(page));
  }

  // C. viewport-height changes mid-scroll (URL bar collapse/expand)
  for (const h of [780, 700, 844]) {
    await page.setViewportSize({ width: 390, height: h });
    await page.waitForTimeout(250);
    pinned(`C viewport ${h}`, await state(page));
  }

  // D. delayed JS — pill is fixed in raw SSR HTML, no JS involved at all
  const page2 = await ctx.newPage();
  await page2.route("**/_next/static/chunks/**", async (route) => {
    await page2.waitForTimeout(4500);
    return route.continue();
  });
  await page2.goto(BASE + SHORT, { waitUntil: "domcontentloaded" });
  await page2.waitForTimeout(500);
  hiddenWhileCaged("D1 pre-hydration entrance", await state(page2));
  await page2.waitForTimeout(1200);
  pinned("D2 pre-hydration entrance done (JS still delayed)", await state(page2));
  await page2.waitForTimeout(6000);
  pinned("D3 post-hydration", await state(page2));
  await page2.unrouteAll({ behavior: "ignoreErrors" });
  await page2.close();

  // E. long page — pill pinned mid-scroll there too (uniform behaviour)
  await page.goto(BASE + LONG, { waitUntil: "load" });
  await page.waitForTimeout(2200);
  const maxYL = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
  await page.evaluate((y) => window.scrollTo(0, y), Math.round(maxYL * 0.5));
  await page.waitForTimeout(250);
  pinned("E long page mid-scroll", await state(page));

  // F. open thread — pill gone, thread mounted
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: /添加公开评论/ }).click();
  await page.waitForTimeout(1200);
  if ((await state(page)).found) throw new Error("F: pill still present after open");
  if (!(await page.$("#cusdis_thread"))) throw new Error("F: thread not mounted");
  results.push("F open thread: OK (pill gone, thread mounted)");

  await browser.close();
  console.log(results.join("\n"));
  console.log("\nALL GREEN");
})().catch((e) => {
  console.error("HARNESS FAIL:", e.message);
  process.exit(1);
});
