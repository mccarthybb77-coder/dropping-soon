// /hold handler — Path B: delayed-200 reveal.
//
// Mechanism:
//   1. TikTok's webview_popup (silent_load_type=1) fires a request to /hold
//      as soon as the Lead Form CTA is tapped.
//   2. We HOLD the HTTP response for ~10 seconds — the socket stays open,
//      no headers yet, no body. TikTok's popup container has NOTHING to
//      render during this window, so the native WebKit view doesn't
//      capture gestures. The parent form stays swipeable — user taps
//      exit, form dismisses, user is back on FYP scrolling normally.
//   3. At the ~10s mark we finally respond with a 200 HTML body whose
//      <head> fires an immediate meta-refresh (and JS redirect fallback)
//      to the vercel lander, carrying the ttclid query string through
//      for attribution.
//   4. TikTok's popup container — still alive on top — loads the HTML,
//      follows the redirect, and surfaces the vercel lander CHROMELESSLY
//      over whatever TikTok screen the user is on (FYP, profile, inbox).
//
// This is the retention trap: user *thought* they left after tapping
// exit, scrolled a few videos, then suddenly the lander pops up.
//
// Cloudflare Workers (which Pages Functions run on) allow wall-clock
// waits of up to 30 seconds per request — 10s is well within budget.
// The CPU time spent (near zero while awaiting the timer) is also fine.

const DELAY_MS = 10_000;
// Updated 2026-11-03: swapped from two-step-landing-flow.vercel.app to
// tiny-makers-studio.vercel.app — new lander has an autoplay notification
// sound that claims iOS audio focus when it surfaces, muting the FYP
// video that was bleeding through behind the chromeless popup.
const VERCEL = "https://tiny-makers-studio.vercel.app/";

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const qs = url.search || "";
  const target = VERCEL + qs;

  // Escape target for safe inlining in HTML attributes.
  const safeTarget = target
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // JSON-escape for inline JS.
  const safeTargetJs = JSON.stringify(target);

  // Hold the response for ~10 seconds. During this time TikTok's popup
  // is waiting for data — nothing renders in it, form stays unlocked.
  await new Promise((resolve) => setTimeout(resolve, DELAY_MS));

  const body = `<!doctype html>
<html><head>
<meta charset="utf-8">
<meta http-equiv="refresh" content="0;url=${safeTarget}">
<title></title>
</head><body><script>location.replace(${safeTargetJs});</script></body></html>`;

  return new Response(body, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
