/* Timing harness v2: absolute page-relative marks. */
/* eslint-disable @typescript-eslint/no-require-imports */
const { chromium } = require("C:/Users/fkxw2/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");

const URL = process.argv[2] || "https://kiramyao.com/stories/10755068";

(async () => {
  const browser = await chromium.launch({ headless: true, channel: "msedge" });
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });
  const page = await ctx.newPage();

  const cusdis = { reqStart: null, resEnd: null };
  page.on("request", (r) => {
    if (r.url().includes("cusdis.com/api/open") && !cusdis.reqStart) cusdis.reqStart = Date.now();
  });
  page.on("requestfinished", (r) => {
    if (r.url().includes("cusdis.com/api/open") && !cusdis.resEnd) cusdis.resEnd = Date.now();
  });

  await page.goto(URL, { waitUntil: "load" });
  const pageT0 = await page.evaluate(() => Date.now() - performance.now()); // epoch of nav start

  const marks = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const out = {};
        const sample = () => {
          // CSS applied: pill parent becomes fixed
          const pill = [...document.querySelectorAll("button")].find((b) =>
            (b.textContent || "").includes("添加公开评论"),
          );
          if (pill) {
            const w = pill.parentElement;
            const cs = getComputedStyle(w);
            if (out.cssApplied === undefined && cs.position === "fixed")
              out.cssApplied = Math.round(performance.now());
            if (out.pillVisible === undefined && cs.position === "fixed" && Number(cs.opacity) >= 0.99)
              out.pillVisible = Math.round(performance.now());
          }
          const sec = document.querySelector("section");
          if (sec && out.commentsVisible === undefined) {
            const has = [...sec.children].some(
              (c) => c.tagName === "OL" || (c.tagName === "P" && (c.textContent || "").includes("喵")),
            );
            if (has) out.commentsVisible = Math.round(performance.now());
          }
          if (out.pillVisible !== undefined && out.commentsVisible !== undefined) {
            resolve(out);
            return;
          }
          if (performance.now() > 25000) {
            resolve(out);
            return;
          }
          requestAnimationFrame(sample);
        };
        sample();
      }),
  );

  const timing = await page.evaluate(() => {
    const nav = performance.getEntriesByType("navigation")[0];
    return {
      fcp: Math.round(performance.getEntriesByType("paint").find((p) => p.name === "first-contentful-paint")?.startTime ?? -1),
      dcl: Math.round(nav.domContentLoadedEventEnd),
    };
  });

  const rel = (epochMs) => (epochMs ? Math.round(epochMs - pageT0) : null);
  console.log(
    JSON.stringify(
      {
        URL,
        fcp: timing.fcp,
        cssApplied: marks.cssApplied,
        pillFullyVisible: marks.pillVisible,
        commentsVisible: marks.commentsVisible,
        cusdisReqStart: rel(cusdis.reqStart),
        cusdisResEnd: rel(cusdis.resEnd),
        cusdisRttMs: cusdis.reqStart && cusdis.resEnd ? cusdis.resEnd - cusdis.reqStart : null,
      },
      null,
      1,
    ),
  );
  await browser.close();
})().catch((e) => {
  console.error("FAIL:", e.message);
  process.exit(1);
});
