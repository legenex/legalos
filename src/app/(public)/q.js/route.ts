import { NextResponse } from 'next/server'

/**
 * The quiz embed loader, served from the tenant's own origin.
 *
 * This replaces a snippet the builder used to hand out that pointed at
 * `https://cdn.legenex.com/q.js` - a file that has never existed in this
 * repository or on that host. Copying it produced a page that silently did
 * nothing, which is worse than an unimplemented feature because it looks
 * finished.
 *
 * Design notes:
 *
 *  - The snippet carries the full embed URL in `data-src`, so the script needs
 *    no API call, no CORS, and no knowledge of our routing to boot. One network
 *    request creates the iframe.
 *  - Height is negotiated over postMessage. The child reports its own height
 *    (see QuizRuntime); the parent only accepts a message whose origin matches
 *    the iframe it created and whose deployment id matches the one it booted,
 *    so another frame on the page cannot resize this one.
 *  - The script is defensive about being loaded twice: each script tag boots
 *    its own instance and marks its target, so two embeds of two different
 *    quizzes on one page do not fight.
 *
 * Served with a short cache so a fix ships without waiting out a CDN TTL,
 * while still being cacheable enough not to re-fetch on every page view.
 */

const SCRIPT = `(function () {
  'use strict';

  var current = document.currentScript;
  if (!current) return;

  var deploymentId = current.getAttribute('data-deployment') || '';
  var targetId = current.getAttribute('data-target') || '';
  var src = current.getAttribute('data-src') || '';
  var path = current.getAttribute('data-path') || '';
  var minHeight = parseInt(current.getAttribute('data-min-height') || '520', 10);

  // Fall back to this script's own origin plus data-path when data-src is
  // absent, so a hand-written snippet still works.
  if (!src && path) {
    try {
      var base = new URL(current.src, window.location.href);
      src = base.origin + (path.charAt(0) === '/' ? path : '/' + path);
    } catch (e) { return; }
  }
  if (!src) return;

  var url;
  try { url = new URL(src, window.location.href); } catch (e) { return; }
  url.searchParams.set('embed', '1');

  // Forward the marketing parameters from the host page so attribution
  // survives the iframe boundary. Without this every embedded lead would look
  // like direct traffic.
  try {
    var hostParams = new URLSearchParams(window.location.search);
    var forward = ['utm_source','utm_medium','utm_campaign','utm_term','utm_content','gclid','fbclid','ttclid'];
    for (var i = 0; i < forward.length; i++) {
      var v = hostParams.get(forward[i]);
      if (v) url.searchParams.set(forward[i], v);
    }
  } catch (e) {}

  var mount = targetId ? document.getElementById(targetId) : null;
  if (!mount) {
    mount = document.createElement('div');
    current.parentNode.insertBefore(mount, current);
  }
  if (mount.getAttribute('data-legalos-booted') === '1') return;
  mount.setAttribute('data-legalos-booted', '1');

  var frame = document.createElement('iframe');
  frame.src = url.toString();
  frame.title = current.getAttribute('data-title') || 'Qualification quiz';
  frame.loading = 'lazy';
  frame.setAttribute('scrolling', 'no');
  frame.setAttribute('allow', 'clipboard-write');
  frame.style.width = '100%';
  frame.style.border = '0';
  frame.style.display = 'block';
  frame.style.minHeight = (isNaN(minHeight) ? 520 : minHeight) + 'px';
  mount.appendChild(frame);

  var frameOrigin = url.origin;

  window.addEventListener('message', function (event) {
    if (event.origin !== frameOrigin) return;
    var data = event.data;
    if (!data || data.type !== 'legalos:quiz-height') return;
    if (deploymentId && String(data.deploymentId) !== String(deploymentId)) return;
    var h = parseInt(data.height, 10);
    if (!isNaN(h) && h > 0) frame.style.height = h + 'px';
  });
})();
`

export const dynamic = 'force-static'

export function GET() {
  return new NextResponse(SCRIPT, {
    status: 200,
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=300',
      // The loader is meant to run on third-party sites.
      'Access-Control-Allow-Origin': '*',
    },
  })
}
