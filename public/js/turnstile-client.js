(function (global) {
    'use strict';

    const TURNSTILE_SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    let _configPromise = null;
    let _scriptPromise = null;
    const _widgets = new Map(); // containerId -> { widgetId, action, token, resolveWaiters }
    let _lastIssuedToken = null;

    async function fetchTurnstileConfig(forceRefresh = false) {
        if (_configPromise && !forceRefresh) return _configPromise;
        _configPromise = (async () => {
            try {
                const res = await fetch('/api/security/turnstile-config', {
                    method: 'GET',
                    cache: 'no-store',
                    credentials: 'same-origin'
                });
                if (!res.ok) return { enabled: false, configured: false, siteKey: null };
                const data = await res.json();
                return {
                    enabled: Boolean(data && data.enabled && data.siteKey),
                    configured: Boolean(data && data.configured),
                    siteKey: (data && data.siteKey) ? String(data.siteKey) : null
                };
            } catch (e) {
                return { enabled: false, configured: false, siteKey: null };
            }
        })();
        return _configPromise;
    }

    function loadTurnstileScript() {
        if (global.turnstile && typeof global.turnstile.render === 'function') {
            return Promise.resolve(global.turnstile);
        }
        if (_scriptPromise) return _scriptPromise;

        _scriptPromise = new Promise((resolve, reject) => {
            const existing = document.querySelector('script[src*="challenges.cloudflare.com/turnstile"]');
            if (existing) {
                const startedAt = Date.now();
                const timer = setInterval(() => {
                    if (global.turnstile && typeof global.turnstile.render === 'function') {
                        clearInterval(timer);
                        resolve(global.turnstile);
                    } else if (Date.now() - startedAt > 12000) {
                        clearInterval(timer);
                        reject(new Error('Turnstile verification timed out while loading.'));
                    }
                }, 100);
                return;
            }

            const script = document.createElement('script');
            script.src = TURNSTILE_SCRIPT_URL;
            script.async = true;
            script.defer = true;
            script.onload = () => {
                if (global.turnstile && typeof global.turnstile.render === 'function') {
                    resolve(global.turnstile);
                } else {
                    reject(new Error('Turnstile API failed to initialize.'));
                }
            };
            script.onerror = () => {
                _scriptPromise = null;
                reject(new Error('Unable to load human verification widget.'));
            };
            document.head.appendChild(script);
        });

        return _scriptPromise;
    }

    function notifyWaiters(entry, token, err) {
        if (!entry || !Array.isArray(entry.waiters)) return;
        const queue = entry.waiters.splice(0, entry.waiters.length);
        queue.forEach((w) => {
            if (err) w.reject(err);
            else w.resolve(token);
        });
    }

    async function mount(containerId, options = {}) {
        const cfg = await fetchTurnstileConfig();
        const container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
        if (!cfg.enabled || !cfg.siteKey || !container) {
            if (container) container.classList.add('hidden');
            return { enabled: false, rendered: false };
        }

        const resolvedId = container.id || containerId;
        container.classList.remove('hidden');

        try {
            const turnstile = await loadTurnstileScript();
            const prev = _widgets.get(resolvedId);
            if (prev && prev.widgetId !== undefined && prev.widgetId !== null) {
                try {
                    turnstile.remove(prev.widgetId);
                } catch (e) {}
            }

            const isDark = document.documentElement.classList.contains('dark');
            const entry = {
                widgetId: null,
                action: options.action || 'submit',
                token: null,
                waiters: []
            };
            _widgets.set(resolvedId, entry);

            container.innerHTML = '';
            entry.widgetId = turnstile.render(container, {
                sitekey: cfg.siteKey,
                action: options.action || 'submit',
                theme: options.theme || (isDark ? 'dark' : 'light'),
                size: options.size || 'normal',
                callback: (token) => {
                    entry.token = token || null;
                    _lastIssuedToken = token || null;
                    if (typeof options.onToken === 'function') options.onToken(token);
                    notifyWaiters(entry, token, null);
                },
                'expired-callback': () => {
                    entry.token = null;
                    if (typeof options.onExpired === 'function') options.onExpired();
                },
                'error-callback': (code) => {
                    entry.token = null;
                    if (typeof options.onError === 'function') options.onError(code);
                    notifyWaiters(entry, null, new Error('Human verification check failed. Please retry.'));
                }
            });

            return { enabled: true, rendered: true, widgetId: entry.widgetId };
        } catch (err) {
            return { enabled: true, rendered: false, error: err.message };
        }
    }

    function getToken(containerId) {
        if (!containerId) return _lastIssuedToken;
        const entry = _widgets.get(containerId);
        if (entry && entry.token) return entry.token;
        if (entry && entry.widgetId !== null && global.turnstile && typeof global.turnstile.getResponse === 'function') {
            try {
                const resp = global.turnstile.getResponse(entry.widgetId);
                if (resp) {
                    entry.token = resp;
                    _lastIssuedToken = resp;
                    return resp;
                }
            } catch (e) {}
        }
        return null;
    }

    function reset(containerId) {
        _lastIssuedToken = null;
        if (!containerId) {
            _widgets.forEach((entry) => {
                entry.token = null;
                if (entry.widgetId !== null && global.turnstile && typeof global.turnstile.reset === 'function') {
                    try { global.turnstile.reset(entry.widgetId); } catch (e) {}
                }
            });
            return;
        }
        const entry = _widgets.get(containerId);
        if (!entry) return;
        entry.token = null;
        if (entry.widgetId !== null && global.turnstile && typeof global.turnstile.reset === 'function') {
            try {
                global.turnstile.reset(entry.widgetId);
            } catch (e) {}
        }
    }

    async function promptChallenge(options = {}) {
        const cfg = await fetchTurnstileConfig();
        if (!cfg.enabled) return null;

        return new Promise((resolve, reject) => {
            const modalId = 'lpuquick-turnstile-modal';
            const existing = document.getElementById(modalId);
            if (existing) existing.remove();

            const modal = document.createElement('div');
            modal.id = modalId;
            modal.className = 'fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4';
            modal.innerHTML = `
                <div class="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/15 p-5 shadow-2xl space-y-4 text-center">
                    <div class="space-y-1">
                        <h3 class="text-sm font-black text-slate-900 dark:text-white">${options.title || 'Security Verification'}</h3>
                        <p class="text-xs text-slate-500 dark:text-slate-400">${options.subtitle || 'Please confirm you are human to continue securely.'}</p>
                    </div>
                    <div id="lpuquick-turnstile-modal-box" class="min-h-[68px] flex items-center justify-center"></div>
                    <button type="button" id="lpuquick-turnstile-cancel" class="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer">
                        Cancel
                    </button>
                </div>
            `;
            document.body.appendChild(modal);

            const cleanup = () => {
                if (modal.parentNode) modal.remove();
            };

            modal.querySelector('#lpuquick-turnstile-cancel').onclick = () => {
                cleanup();
                reject(new Error('Human verification cancelled.'));
            };

            mount('lpuquick-turnstile-modal-box', {
                action: options.action || 'verify',
                onToken: (tok) => {
                    setTimeout(() => {
                        cleanup();
                        resolve(tok);
                    }, 180);
                },
                onError: () => {
                    cleanup();
                    reject(new Error('Human verification check failed. Please retry.'));
                }
            }).then((res) => {
                if (res && res.error) {
                    cleanup();
                    reject(new Error(res.error));
                }
            });
        });
    }

    async function ensureToken(containerId, options = {}) {
        const cfg = await fetchTurnstileConfig();
        if (!cfg.enabled) {
            return { required: false, token: null };
        }

        if (containerId) {
            let entry = _widgets.get(containerId);
            if (!entry) {
                await mount(containerId, options);
                entry = _widgets.get(containerId);
            }

            const existing = getToken(containerId);
            if (existing) {
                return { required: true, token: existing };
            }

            if (entry) {
                const container = document.getElementById(containerId);
                if (container) {
                    try { container.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {}
                }
                // Wait briefly in case non-interactive/managed widget is currently auto-completing
                const awaited = await new Promise((resolve) => {
                    const timer = setTimeout(() => resolve(null), options.waitMs || 2200);
                    entry.waiters.push({
                        resolve: (tok) => { clearTimeout(timer); resolve(tok); },
                        reject: () => { clearTimeout(timer); resolve(null); }
                    });
                });
                if (awaited) {
                    return { required: true, token: awaited };
                }
            }

            throw new Error('Please complete the Cloudflare security check above before continuing.');
        }

        const cached = getToken();
        if (cached) return { required: true, token: cached };
        if (options.interactivePrompt) {
            const tok = await promptChallenge(options);
            return { required: true, token: tok };
        }
        throw new Error('Please complete the Cloudflare security verification to continue.');
    }

    function consumeLastToken() {
        const t = _lastIssuedToken;
        _lastIssuedToken = null;
        return t;
    }

    global.LpuQuickTurnstile = {
        getConfig: fetchTurnstileConfig,
        mount,
        getToken,
        reset,
        ensureToken,
        promptChallenge,
        consumeLastToken
    };
})(typeof window !== 'undefined' ? window : globalThis);
