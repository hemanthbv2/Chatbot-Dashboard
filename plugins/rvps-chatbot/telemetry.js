/**
 * RVPS Telemetry Engine - Dual Write Architecture
 *
 * Sends data to TWO backends simultaneously:
 *  1. WordPress REST API  → MySQL DB → WP Admin Dashboard
 *  2. Vercel Node.js API  → MongoDB  → External Standalone Dashboard
 */

(function () {
    const SESSION_ID = 'sess_' + Math.random().toString(36).substr(2, 9);
    const PAGE_LOAD_TIME = Date.now();
    let telemetryQueue = [];

    // ─── Helper: get both API endpoints ───────────────────────────────────────
    function getEndpoints() {
        const wpRestUrl   = (window.rvpsChatbotSettings && window.rvpsChatbotSettings.restUrl)
                            ? window.rvpsChatbotSettings.restUrl.replace(/\/$/, '')   // e.g. https://rvps.edu.in/wp-json/rvps/v1
                            : '';
        const vercelUrl   = (window.rvpsChatbotSettings && window.rvpsChatbotSettings.vercelUrl)
                            ? window.rvpsChatbotSettings.vercelUrl.replace(/\/$/, '') // e.g. https://rvps-api.vercel.app
                            : '';
        return { wpRestUrl, vercelUrl };
    }

    // ─── Core event tracker ───────────────────────────────────────────────────
    function trackEvent(eventType, eventData = {}) {
        const logEntry = {
            sessionId: SESSION_ID,
            timestamp: new Date().toISOString(),
            eventType: eventType,
            url: window.location.href,
            data: eventData
        };
        telemetryQueue.push(logEntry);
        console.log(`[Telemetry] ${eventType}`, logEntry);
    }

    // Expose globally for the Chatbot engine (script.js)
    window.rvpsTrackEvent = trackEvent;

    // ─── Intercept Web3Forms to capture leads ─────────────────────────────────
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
        if (typeof args[0] === 'string' && args[0].includes('api.web3forms.com/submit')) {
            try {
                if (args[1] && args[1].body) {
                    const payload = JSON.parse(args[1].body);
                    delete payload.access_key; // strip key for security
                    trackEvent('form_submit', { leadData: payload });
                }
            } catch(e) {
                console.error('[Telemetry] Failed to intercept lead data', e);
            }
        }
        return originalFetch.apply(this, args);
    };

    // ─── Track Clicks ─────────────────────────────────────────────────────────
    document.addEventListener('click', (e) => {
        const target = e.target;
        if (target.tagName === 'BUTTON' || target.tagName === 'A' || target.closest('button') || target.closest('a')) {
            const elementId   = target.id || target.closest('button')?.id || target.closest('a')?.id || 'unknown';
            const elementText = target.innerText || target.closest('button')?.innerText || 'icon';
            trackEvent('click', { elementId, elementText: elementText.substring(0, 20) });
        }
    });

    // ─── Track Hovers (>500ms) ────────────────────────────────────────────────
    let hoverTimers = {};
    document.addEventListener('mouseover', (e) => {
        const target = e.target;
        if (target.tagName === 'BUTTON' || target.tagName === 'A') {
            hoverTimers[target.id || 'unknown'] = Date.now();
        }
    });
    document.addEventListener('mouseout', (e) => {
        const target = e.target;
        if (target.tagName === 'BUTTON' || target.tagName === 'A') {
            const id = target.id || 'unknown';
            if (hoverTimers[id]) {
                const duration = Date.now() - hoverTimers[id];
                if (duration > 500) trackEvent('hover', { elementId: id, durationMs: duration });
                delete hoverTimers[id];
            }
        }
    });

    // ─── Track Copy ───────────────────────────────────────────────────────────
    document.addEventListener('copy', () => {
        const text = document.getSelection().toString();
        if (text) trackEvent('copy', { length: text.length });
    });

    // ─── Track Scroll Depth ───────────────────────────────────────────────────
    let maxScroll = 0;
    document.addEventListener('scroll', () => {
        const pct = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
        if (pct > maxScroll) maxScroll = pct;
    });

    // ─── Heartbeat (every 15s) ────────────────────────────────────────────────
    setInterval(() => {
        const dwell = Math.round((Date.now() - PAGE_LOAD_TIME) / 1000);
        trackEvent('heartbeat', { dwellTimeSeconds: dwell, maxScrollPercent: maxScroll });
    }, 15000);

    // ─── DUAL WRITE: send batch to both backends ──────────────────────────────
    async function sendBatch(batch) {
        const { wpRestUrl, vercelUrl } = getEndpoints();
        
        // Payload for Central Node.js MongoDB Dashboard
        const payload = JSON.stringify({ 
            institute_id: 'rvps',
            api_key: 'rvps_key_12345',
            sessionId: SESSION_ID, 
            events: batch 
        });

        const requests = [];

        // 1️⃣ WordPress REST API → MySQL → WP Admin Dashboard
        if (wpRestUrl) {
            requests.push(
                fetch(wpRestUrl + '/logs', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: payload
                })
                .then(r => { if (!r.ok) throw new Error('WP HTTP ' + r.status); console.log('[Telemetry] ✅ WP saved'); })
                .catch(e => console.warn('[Telemetry] ⚠️ WP failed:', e.message))
            );
        }

        // 2️⃣ Vercel Node.js API → MongoDB → External Dashboard
        if (vercelUrl) {
            requests.push(
                fetch(vercelUrl + '/api/logs', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: payload
                })
                .then(r => { if (!r.ok) throw new Error('Vercel HTTP ' + r.status); console.log('[Telemetry] ✅ MongoDB saved'); })
                .catch(e => console.warn('[Telemetry] ⚠️ Vercel/MongoDB failed:', e.message))
            );
        }

        await Promise.allSettled(requests);
    }

    // ─── Batch Processor (every 5s) ───────────────────────────────────────────
    setInterval(async () => {
        if (telemetryQueue.length === 0) return;
        const batch = [...telemetryQueue];
        telemetryQueue = [];
        console.log(`[Telemetry] Sending ${batch.length} events...`);
        await sendBatch(batch);
    }, 5000);

    // ─── Flush on page close (fetch with keepalive) ──────────────────────────
    window.addEventListener('beforeunload', () => {
        if (telemetryQueue.length === 0) return;
        const { wpRestUrl, vercelUrl } = getEndpoints();
        const payload = JSON.stringify({ 
            institute_id: 'rvps',
            api_key: 'rvps_key_12345',
            sessionId: SESSION_ID, 
            events: telemetryQueue 
        });

        // Use fetch with keepalive instead of sendBeacon to bypass CORS issues on application/json
        if (wpRestUrl) {
            fetch(wpRestUrl + '/logs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: payload,
                keepalive: true
            }).catch(() => {});
        }
        if (vercelUrl) {
            fetch(vercelUrl + '/api/logs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: payload,
                keepalive: true
            }).catch(() => {});
        }
    });

    // ─── Initial page load event ──────────────────────────────────────────────
    trackEvent('page_load', { userAgent: navigator.userAgent });

})();
