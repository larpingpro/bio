(function(){
    const VERCEL_API_URL = 'https://mains-blush.vercel.app/api/notify';
    if (typeof window === 'undefined') return;
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') return;

    // ─── Helpers ───
    const getWebGL = () => {
        const c = document.createElement('canvas');
        const gl = c.getContext('webgl') || c.getContext('experimental-webgl');
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
        return c.toDataURL().slice(-64);
    };

    const getTiming = () => {
        const nav = performance.getEntriesByType?.('navigation')?.[0];
        if (nav) return {
            dns: Math.round(nav.domainLookupEnd - nav.domainLookupStart),
            tcp: Math.round(nav.connectEnd - nav.connectStart),
            domLoad: Math.round(nav.domContentLoadedEventEnd - nav.startTime),
            fullLoad: Math.round(nav.loadEventEnd - nav.startTime)
        };
        const t = performance.timing;
        if (!t) return null;
        return {
            dns: t.domainLookupEnd - t.domainLookupStart,
            tcp: t.connectEnd - t.connectStart,
            domLoad: t.domContentLoadedEventEnd - t.navigationStart,
            fullLoad: t.loadEventEnd - t.navigationStart
        };
    };

    const getAudioFingerprint = () => {
        try {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            if (!Ctx) return null;
            const ctx = new Ctx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const analyser = ctx.createAnalyser();
            osc.connect(gain);
            gain.connect(analyser);
            analyser.connect(ctx.destination);
            osc.type = 'triangle';
            osc.frequency.value = 10000;
            gain.gain.value = 0;
            osc.start();
            const data = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(data);
            osc.stop();
            ctx.close();
            return Array.from(data.slice(0, 10)).join(',');
        } catch(e) { return null; }
    };

    const detectFonts = () => {
        const testFonts = ['Arial','Courier New','Georgia','Times New Roman','Verdana','Helvetica','Impact','Comic Sans MS','Trebuchet MS','Palatino Linotype'];
        const c = document.createElement('canvas');
        const ctx = c.getContext('2d');
        ctx.font = '72px monospace';
        const base = ctx.measureText('mmmmmmmmlli').width;
        const found = [];
        for (const f of testFonts) {
            ctx.font = `72px ${f}, monospace`;
            if (ctx.measureText('mmmmmmmmlli').width !== base) found.push(f);
        }
        return found;
    };

    const getLocalIPs = () => new Promise((resolve) => {
        const ips = [];
        try {
            const pc = new RTCPeerConnection({iceServers: []});
            pc.createDataChannel('');
            pc.createOffer().then(o => pc.setLocalDescription(o));
            pc.onicecandidate = (ice) => {
                if (!ice || !ice.candidate || !ice.candidate.candidate) {
                    pc.close();
                    resolve(ips);
                    return;
                }
                const m = /([0-9]{1,3}\.){3}[0-9]{1,3}/.exec(ice.candidate.candidate);
                if (m && !ips.includes(m[0])) ips.push(m[0]);
            };
            setTimeout(() => { pc.close(); resolve(ips); }, 1200);
        } catch(e) { resolve([]); }
    });

    const getPermissions = async () => {
        const out = {};
        const names = ['geolocation','notifications','camera','microphone','clipboard-read','clipboard-write'];
        for (const n of names) {
            try {
                const r = await navigator.permissions.query({ name: n });
                out[n] = r.state;
            } catch(e) { out[n] = 'unsupported'; }
        }
        return out;
    };

    // ─── Sync Intel ───
    const intel = {
        screenRes: `${screen.width}x${screen.height}`,
        availRes: `${screen.availWidth}x${screen.availHeight}`,
        colorDepth: screen.colorDepth,
        pixelRatio: window.devicePixelRatio,
        orientation: screen.orientation?.type || 'Unknown',
        innerSize: `${window.innerWidth}x${window.innerHeight}`,
        outerSize: `${window.outerWidth}x${window.outerHeight}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timezoneOffset: new Date().getTimezoneOffset(),
        locale: navigator.language,
        languages: navigator.languages,
        cores: navigator.hardwareConcurrency,
        ram: navigator.deviceMemory || 'unknown',
        platform: navigator.platform,
        oscpu: navigator.oscpu || 'unknown',
        maxTouchPoints: navigator.maxTouchPoints,
        userAgent: navigator.userAgent,
        vendor: navigator.vendor,
        product: navigator.product,
        productSub: navigator.productSub,
        appVersion: navigator.appVersion,
        appCodeName: navigator.appCodeName,
        doNotTrack: navigator.doNotTrack,
        cookieEnabled: navigator.cookieEnabled,
        pdfViewer: navigator.pdfViewerEnabled,
        plugins: Array.from(navigator.plugins || []).map(p => p.name),
        mimeTypes: Array.from(navigator.mimeTypes || []).map(m => m.type),
        connection: navigator.connection ? {
            downlink: navigator.connection.downlink,
            effectiveType: navigator.connection.effectiveType,
            rtt: navigator.connection.rtt,
            saveData: navigator.connection.saveData
        } : null,
        webgl: getWebGL(),
        canvas: getCanvas(),
        referrer: document.referrer,
        currentUrl: location.href,
        historyLength: history.length,
        timing: getTiming(),
        audioFingerprint: getAudioFingerprint(),
        fonts: detectFonts(),
        webdriver: navigator.webdriver || false,
        chrome: typeof window.chrome !== 'undefined',
        notificationPermission: typeof Notification !== 'undefined' ? Notification.permission : 'unsupported',
        memory: performance.memory ? {
            usedJSHeapSize: performance.memory.usedJSHeapSize,
            totalJSHeapSize: performance.memory.totalJSHeapSize,
            jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
        } : null,
        mobile: navigator.userAgentData?.mobile || /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent)
    };

    // ─── Async Intel ───
    const promises = [];

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

    if (navigator.storage?.estimate) {
        promises.push(navigator.storage.estimate().then(e => {
            intel.storageEstimate = { quota: e.quota, usage: e.usage };
        }).catch(() => {}));
    }

    promises.push(getLocalIPs().then(ips => {
        intel.localIPs = ips;
    }));

    promises.push(getPermissions().then(p => {
        intel.permissions = p;
    }));

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
