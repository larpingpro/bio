(function(){
    const VERCEL_API_URL = 'https://mains-blush.vercel.app/api/notify';

    // Skip local dev
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') return;

    // ─── Helpers ───
    const getWebGL = () => {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) return null;
        const dbg = gl.getExtension('WEBGL_debug_renderer_info');
        return dbg ? {
            vendor: gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL),
            renderer: gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)
        } : null;
    };

    const getCanvas = () => {
        const c = document.createElement('canvas');
        const ctx = c.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('larping.pro intel v2', 2, 2);
        ctx.fillStyle = '#f00';
        ctx.fillRect(2, 16, 20, 10);
        return c.toDataURL();
    };

    const getTiming = () => {
        const nav = performance.getEntriesByType?.('navigation')?.[0];
        if (nav) {
            return {
                dns: Math.round(nav.domainLookupEnd - nav.domainLookupStart),
                tcp: Math.round(nav.connectEnd - nav.connectStart),
                domLoad: Math.round(nav.domContentLoadedEventEnd - nav.startTime),
                fullLoad: Math.round(nav.loadEventEnd - nav.startTime)
            };
        }
        const t = performance.timing;
        if (!t) return null;
        return {
            dns: t.domainLookupEnd - t.domainLookupStart,
            tcp: t.connectEnd - t.connectStart,
            domLoad: t.domContentLoadedEventEnd - t.navigationStart,
            fullLoad: t.loadEventEnd - t.navigationStart
        };
    };

    // ─── Collect Intel ───
    const intel = {
        // Display
        screenRes: `${screen.width}x${screen.height}`,
        availRes: `${screen.availWidth}x${screen.availHeight}`,
        colorDepth: screen.colorDepth,
        pixelRatio: window.devicePixelRatio,
        orientation: screen.orientation?.type || 'Unknown',
        innerSize: `${window.innerWidth}x${window.innerHeight}`,
        outerSize: `${window.outerWidth}x${window.outerHeight}`,

        // Time & Locale
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timezoneOffset: new Date().getTimezoneOffset(),
        locale: navigator.language,
        languages: navigator.languages,

        // Hardware
        cores: navigator.hardwareConcurrency,
        ram: navigator.deviceMemory || 'unknown',
        platform: navigator.platform,
        oscpu: navigator.oscpu || 'unknown',
        maxTouchPoints: navigator.maxTouchPoints,

        // Browser
        userAgent: navigator.userAgent,
        vendor: navigator.vendor,
        product: navigator.product,
        productSub: navigator.productSub,
        appVersion: navigator.appVersion,
        appCodeName: navigator.appCodeName,
        doNotTrack: navigator.doNotTrack,
        cookieEnabled: navigator.cookieEnabled,

        // Features
        pdfViewer: navigator.pdfViewerEnabled,
        plugins: Array.from(navigator.plugins || []).map(p => p.name),
        mimeTypes: Array.from(navigator.mimeTypes || []).map(m => m.type),

        // Connection
        connection: navigator.connection ? {
            downlink: navigator.connection.downlink,
            effectiveType: navigator.connection.effectiveType,
            rtt: navigator.connection.rtt,
            saveData: navigator.connection.saveData
        } : null,

        // Fingerprints
        webgl: getWebGL(),
        canvas: getCanvas(),

        // Session
        referrer: document.referrer,
        currentUrl: location.href,
        historyLength: history.length,
    };

    // ─── Async collectors ───
    const promises = [];

    // Battery
    if (navigator.getBattery) {
        promises.push(navigator.getBattery().then(b => {
            intel.battery = {
                level: b.level,
                charging: b.charging,
                chargingTime: b.chargingTime,
                dischargingTime: b.dischargingTime
            };
        }).catch(() => {}));
    }

    // Storage
    if (navigator.storage && navigator.storage.estimate) {
        promises.push(navigator.storage.estimate().then(e => {
            intel.storageEstimate = { quota: e.quota, usage: e.usage };
        }).catch(() => {}));
    }

    // ─── Send ───
    Promise.all(promises).finally(() => {
        fetch(VERCEL_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'VISIT',
                path: location.pathname + location.search,
                referrer: document.referrer || 'Direct Entry',
                intel: intel
            })
        }).catch(() => {});
    });
})();
