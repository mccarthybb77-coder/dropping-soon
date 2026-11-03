// Match ttsauce.pages.dev/ behavior: return 404 Not Found.
// Rationale: TikTok's webview_popup with silent_load_type=1 locks the
// parent form's gestures whenever the loaded page returns a valid HTML
// body (even transparent + pointer-events:none still gets captured by
// the native WebKit view). A 404 response gives TikTok no content to
// render in the popup container, so the container collapses and the
// form stays swipeable — user taps exit, form dismisses naturally back
// to FYP. This is the mechanism friend's ttsauce.pages.dev uses.
export async function onRequest() {
  return new Response("Not found", {
    status: 404,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
