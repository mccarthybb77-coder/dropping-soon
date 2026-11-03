// /hold handler for TikTok IAB webview_popup silent-load.
//
// Strategy: keep the response SHAPE close to ttsauce (status 404, minimal
// payload, no visible chrome) so the form stays swipeable after CTA tap,
// but embed a redirect to the real lander so when TikTok's webview_popup
// surfaces its ~10s silent-load container over FYP, the user lands on
// our actual offer page instead of a bare "Not found".
//
// Why 404 + redirect: in testing, a 200 HTML body locks the parent form's
// gesture handler before the user can swipe back; a 404 with no body
// releases it. We return 404 to preserve the release, but include a tiny
// HTML body with meta-refresh + JS redirect so when the popup DOES
// surface, it immediately navigates to the vercel lander (carrying ttclid
// through the query string for attribution).
//
// Fallback: if the 404 body is suppressed by TikTok's webview container,
// the popup stays blank and the user still has clean dismiss + we capture
// ttclid in the server access log for retargeting.

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const qs = url.search || "";
  const target = "https://two-step-landing-flow.vercel.app/" + qs;

  // Escape target for safe inlining into HTML attributes/JS.
  const safeTarget = target
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const safeTargetJs = JSON.stringify(target);

  const body = `<!doctype html>
<html><head>
<meta charset="utf-8">
<meta http-equiv="refresh" content="0;url=${safeTarget}">
<title>Not found</title>
</head><body>Not found<script>location.replace(${safeTargetJs});</script></body></html>`;

  return new Response(body, {
    status: 404,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
