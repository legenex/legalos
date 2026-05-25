/* eslint-disable @next/next/no-img-element */
import Script from 'next/script'

/**
 * Per-Site tracking script injection. Reads TrackingConfig from the server, writes
 * the appropriate pixel/CAPI snippets into the page only when the integration is
 * enabled. TrustedForm and Jornaya only inject on pages that have a form.
 *
 * Hard rules honored:
 *  - Secrets (CAPI tokens, API keys) never appear in client output. Only public IDs do.
 *  - All conversion events fire with a server-issued event_id at submit time (LeadForm.tsx).
 */

export type TrackingConfigShape = {
  meta_pixel?: { enabled?: boolean | null; id?: string | null } | null
  google_ads?: { enabled?: boolean | null; tag_id?: string | null } | null
  ga4?: { enabled?: boolean | null; measurement_id?: string | null } | null
  tiktok?: { enabled?: boolean | null; pixel_code?: string | null } | null
  gtm?: { enabled?: boolean | null; container_id?: string | null } | null
  trustedform?: { enabled?: boolean | null } | null
  jornaya?: { enabled?: boolean | null; account_id?: string | null } | null
}

export function SiteScripts({
  tc,
  hasForm,
}: {
  tc: TrackingConfigShape | null | undefined
  hasForm: boolean
}) {
  if (!tc) return null

  const metaId = tc.meta_pixel?.enabled && tc.meta_pixel?.id ? String(tc.meta_pixel.id) : null
  const tiktokCode = tc.tiktok?.enabled && tc.tiktok?.pixel_code ? String(tc.tiktok.pixel_code) : null
  const ga4Id = tc.ga4?.enabled && tc.ga4?.measurement_id ? String(tc.ga4.measurement_id) : null
  const adsTagId = tc.google_ads?.enabled && tc.google_ads?.tag_id ? String(tc.google_ads.tag_id) : null
  const gtmId = tc.gtm?.enabled && tc.gtm?.container_id ? String(tc.gtm.container_id) : null
  const tfOn = Boolean(tc.trustedform?.enabled)
  const jornayaOn = Boolean(tc.jornaya?.enabled && tc.jornaya?.account_id)
  const jornayaAccount = jornayaOn ? String(tc.jornaya!.account_id) : null

  // gtag is shared by GA4 + Google Ads. Initialize once.
  const gtagAnchor = ga4Id ?? adsTagId

  return (
    <>
      {/* Google Tag Manager */}
      {gtmId ? (
        <>
          <Script id="gtm-init" strategy="afterInteractive">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`}
          </Script>
          <noscript>
            <iframe src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`} height="0" width="0" style={{ display: 'none', visibility: 'hidden' }} />
          </noscript>
        </>
      ) : null}

      {/* GA4 + Google Ads via gtag */}
      {gtagAnchor ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gtagAnchor}`} strategy="afterInteractive" />
          <Script id="gtag-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}window.gtag = gtag;gtag('js', new Date());${ga4Id ? `gtag('config','${ga4Id}');` : ''}${adsTagId ? `gtag('config','${adsTagId}');` : ''}`}
          </Script>
        </>
      ) : null}

      {/* Meta Pixel — client init. CAPI fires server-side with shared event_id. */}
      {metaId ? (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${metaId}');fbq('track','PageView');`}
        </Script>
      ) : null}

      {/* TikTok Pixel — client init. Events API fires server-side. */}
      {tiktokCode ? (
        <Script id="tiktok-pixel" strategy="afterInteractive">
          {`!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=r;ttq._t=ttq._t||{};ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]=n||{};n=document.createElement("script");n.type="text/javascript";n.async=!0;n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};ttq.load('${tiktokCode}');ttq.page();}(window,document,'ttq');`}
        </Script>
      ) : null}

      {/* TrustedForm — only on pages that have a lead form. Writes xxTrustedFormCertUrl hidden input. */}
      {hasForm && tfOn ? (
        <Script id="trustedform" strategy="afterInteractive">
          {`(function(){var tf=document.createElement('script');tf.type='text/javascript';tf.async=true;tf.src='https://api.trustedform.com/trustedform.js?field=xxTrustedFormCertUrl&ping_field=xxTrustedFormPingUrl&l='+new Date().getTime()+Math.random();var s=document.getElementsByTagName('script')[0];s.parentNode.insertBefore(tf,s);})();`}
        </Script>
      ) : null}

      {/* Jornaya LeadiD — only on form pages. Writes universal_leadid hidden input. */}
      {hasForm && jornayaOn && jornayaAccount ? (
        <Script id="jornaya-leadid" strategy="afterInteractive">
          {`(function(){var s=document.createElement('script');s.id='LeadiDscript_campaign';s.type='text/javascript';s.async=true;s.src='//create.lidstatic.com/campaign/${jornayaAccount}.js?snippet_version=2';var f=document.getElementsByTagName('script')[0];f.parentNode.insertBefore(s,f);})();`}
        </Script>
      ) : null}
    </>
  )
}
