(() => {
  const measurementId = 'G-LX3PFT5QR4';
  const consentKey = 'atlas.analytics.consent.v1';
  const localHosts = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1']);
  const loaderSource = document.currentScript?.src || `${window.location.origin}/scripts/analytics.js`;
  const loaderUrl = new URL(loaderSource, window.location.href);
  const basePath = loaderUrl.pathname.split('/scripts/analytics.js')[0];
  const privacyPath = `${basePath}/privacy/`;

  const isLocal = localHosts.has(window.location.hostname);
  const isConsentPreview = isLocal && new URLSearchParams(window.location.search).get('analytics-preview') === '1';

  if (isLocal && !isConsentPreview) return;

  const readConsent = () => {
    try {
      return window.localStorage.getItem(consentKey);
    } catch (_) {
      return null;
    }
  };

  const writeConsent = (value) => {
    try {
      window.localStorage.setItem(consentKey, value);
    } catch (_) {
      // A blocked storage API must not prevent the visitor from using the site.
    }
  };

  const loadGoogleAnalytics = () => {
    if (document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${measurementId}"]`)) return;

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function gtag() {
      window.dataLayer.push(arguments);
    };

    window.gtag('consent', 'default', {
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
    window.gtag('consent', 'update', {
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });

    const googleTag = document.createElement('script');
    googleTag.async = true;
    googleTag.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    googleTag.dataset.atlasGoogleTag = '';
    document.head.append(googleTag);

    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    });
  };

  const dismissBanner = (banner) => {
    banner.dataset.closing = 'true';
    window.setTimeout(() => banner.remove(), 120);
  };

  const mountConsentBanner = () => {
    if (document.querySelector('[data-analytics-consent]')) return;

    const banner = document.createElement('aside');
    banner.className = 'atlas-consent';
    banner.dataset.analyticsConsent = '';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-labelledby', 'atlas-consent-title');
    banner.setAttribute('aria-describedby', 'atlas-consent-copy');
    banner.innerHTML = `
      <div class="atlas-consent__copy">
        <strong id="atlas-consent-title">ANALYTICS / OPTIONAL</strong>
        <p id="atlas-consent-copy">Allow Google Analytics to record aggregate page usage, device class, and approximate country? Advertising storage remains disabled.</p>
        <a href="${privacyPath}">privacy and analytics details →</a>
      </div>
      <div class="atlas-consent__actions">
        <button type="button" data-analytics-accept>allow analytics</button>
        <button type="button" data-analytics-decline>decline</button>
      </div>`;

    banner.querySelector('[data-analytics-accept]').addEventListener('click', () => {
      if (isConsentPreview) {
        dismissBanner(banner);
        return;
      }
      writeConsent('granted');
      loadGoogleAnalytics();
      dismissBanner(banner);
    });
    banner.querySelector('[data-analytics-decline]').addEventListener('click', () => {
      if (isConsentPreview) {
        dismissBanner(banner);
        return;
      }
      writeConsent('denied');
      dismissBanner(banner);
    });
    document.body.append(banner);
  };

  const bindConsentReset = () => {
    document.querySelectorAll('[data-analytics-reset]').forEach((button) => {
      button.addEventListener('click', () => {
        try {
          window.localStorage.removeItem(consentKey);
        } catch (_) {
          // Reload still gives the visitor another opportunity to choose.
        }
        window.location.reload();
      });
    });
  };

  const start = () => {
    bindConsentReset();
    const consent = readConsent();
    if (consent === 'granted') loadGoogleAnalytics();
    else if (consent !== 'denied') mountConsentBanner();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
