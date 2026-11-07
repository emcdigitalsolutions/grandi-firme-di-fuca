(function() {
    'use strict';

    var STORAGE_KEY = 'gf_cookie_consent';
    var GA_ID = 'G-ZKNE48DZC5';
    var banner = document.getElementById('cookieBanner');
    var gear = document.getElementById('cookieGear');

    if (!banner) return;

    // Read saved preference
    var consent = getConsent();

    if (consent === null) {
        // First visit: show banner
        showBanner();
    } else {
        // Returning visit: apply saved preference
        showGear();
        if (consent === 'accepted') {
            loadAllMaps();
            loadAnalytics();
        }
    }

    // Accept all
    var acceptBtn = document.getElementById('cookieAcceptAll');
    if (acceptBtn) {
        acceptBtn.addEventListener('click', function() {
            saveConsent('accepted');
            hideBanner();
            showGear();
            loadAllMaps();
            loadAnalytics();
        });
    }

    // Reject (only necessary)
    var rejectBtn = document.getElementById('cookieRejectAll');
    if (rejectBtn) {
        rejectBtn.addEventListener('click', function() {
            saveConsent('rejected');
            hideBanner();
            showGear();
            denyAnalytics();
        });
    }

    // Gear icon: reopen banner
    if (gear) {
        gear.addEventListener('click', function() {
            showBanner();
            gear.classList.remove('visible');
        });
    }

    // Map placeholder buttons: accept and load maps
    document.addEventListener('click', function(e) {
        var btn = e.target.closest ? e.target.closest('.map-placeholder-btn') : null;
        if (btn) {
            saveConsent('accepted');
            hideBanner();
            showGear();
            loadAllMaps();
            loadAnalytics();
        }
    });

    // --- Helpers ---

    function getConsent() {
        try {
            return localStorage.getItem(STORAGE_KEY);
        } catch (e) {
            return null;
        }
    }

    function saveConsent(value) {
        try {
            localStorage.setItem(STORAGE_KEY, value);
        } catch (e) {
            // localStorage not available
        }
    }

    function showBanner() {
        // Small delay for CSS transition
        requestAnimationFrame(function() {
            banner.classList.add('visible');
        });
    }

    function hideBanner() {
        banner.classList.remove('visible');
    }

    function showGear() {
        if (gear) {
            gear.classList.add('visible');
        }
    }

    // Google Analytics 4: caricato SOLO dopo il consenso (Consent Mode v2, IP anonimizzato).
    function loadAnalytics() {
        if (window.__gfAnalytics) return;
        window.__gfAnalytics = true;
        window.dataLayer = window.dataLayer || [];
        window.gtag = window.gtag || function() { window.dataLayer.push(arguments); };
        window.gtag('consent', 'default', {
            analytics_storage: 'granted',
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied'
        });
        window.gtag('js', new Date());
        window.gtag('config', GA_ID, { anonymize_ip: true });
        var s = document.createElement('script');
        s.async = true;
        s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
        document.head.appendChild(s);
    }

    function denyAnalytics() {
        if (window.gtag) {
            window.gtag('consent', 'update', { analytics_storage: 'denied' });
        }
    }

    function loadAllMaps() {
        var placeholders = document.querySelectorAll('.map-placeholder[data-src]');
        placeholders.forEach(function(ph) {
            var src = ph.getAttribute('data-src');
            if (!src) return;

            var iframe = document.createElement('iframe');
            iframe.src = src;
            iframe.width = '100%';
            iframe.height = '280';
            iframe.style.border = '0';
            iframe.setAttribute('allowfullscreen', '');
            iframe.setAttribute('loading', 'lazy');
            iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
            iframe.title = ph.getAttribute('data-title') || 'Google Maps';

            ph.parentNode.replaceChild(iframe, ph);
        });
    }
})();
