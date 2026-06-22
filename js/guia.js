    (function() {
        var LANGS = ['pt', 'en', 'es'];
        var _lang = (localStorage.getItem('guia-lang') || (navigator.language || 'pt').split('-')[0]).toLowerCase();
        if (!LANGS.includes(_lang)) _lang = 'pt';
        var _data = {};

        window._t = function(key, fallback) {
            return _data[key] || fallback || key;
        };

        window._applyI18n = function() {
            document.querySelectorAll('[data-i18n]').forEach(function(el) {
                var key = el.getAttribute('data-i18n');
                if (_data[key]) el.textContent = _data[key];
            });
            document.querySelectorAll('.lang-btn').forEach(function(b) {
                var active = b.dataset.lang === _lang;
                b.classList.toggle('bg-primary', active);
                b.classList.toggle('scale-110', active);
                b.classList.toggle('shadow-sm', active);
                b.classList.toggle('opacity-45', !active);
            });
        };

        window._reApplyDynamic = function() {
            var name = window._dynPropName;
            if (name) {
                var heroEl = document.getElementById('dyn-hero-title');
                if (heroEl) heroEl.textContent = window._t('hero.welcome_to', 'Bem-vindo ao') + ' ' + name;
                var fotosEl = document.getElementById('dyn-fotos-title');
                if (fotosEl) fotosEl.textContent = window._t('photos.title_of', 'Fotos do') + ' ' + name;
            }
            var codeLabelEl = document.getElementById('dyn-code-label');
            if (codeLabelEl && window._dynAccessType) {
                codeLabelEl.textContent = window._dynAccessType === 'cofre'
                    ? window._t('access.code_label_safe', 'Código do cofre')
                    : window._t('access.code_label', 'Código');
            }
            var copyBtn = document.getElementById('btn-copy-wifi');
            if (copyBtn) {
                copyBtn.innerHTML = '<span class="material-icons-outlined text-base">content_copy<\/span><span data-i18n="wifi.copy_btn">' + window._t('wifi.copy_btn', 'Copiar') + '<\/span>';
            }
            window._applyI18n();
        };

        window._setLang = function(lang) {
            if (!LANGS.includes(lang)) lang = 'pt';
            _lang = lang;
            localStorage.setItem('guia-lang', lang);
            fetch('i18n/' + lang + '.json', { cache: 'no-store' })
                .then(function(r) {
                    if (!r.ok) throw new Error('HTTP ' + r.status + ' ao buscar i18n/' + lang + '.json');
                    return r.json();
                })
                .then(function(d) {
                    _data = d;
                    window._reApplyDynamic();
                })
                .catch(function(err) {
                    console.error('[i18n] Falha ao carregar traduções de "' + lang + '":', err);
                    window._applyI18n();
                });
        };

        window._setLang(_lang);
    })();

        const albumGroups = [
            {
                key: 'bedroom',
                interval: 7000,
                slides: [
                    { src: 'assets/Quarto/quarto1.jpeg', caption: 'Descanso e conforto' },
                    { src: 'assets/Quarto/quarto2.jpeg', caption: 'Detalhes da suíte' },
                    { src: 'assets/Quarto/quarto3.jpeg', caption: 'Ambiente acolhedor' },
                    { src: 'assets/Quarto/quarto4.jpeg', caption: 'Outro ângulo do espaço' },
                    { src: 'assets/Quarto/quarto5.jpeg', caption: 'Conforto para a estadia' },
                    { src: 'assets/Quarto/quarto6.jpeg', caption: 'Detalhes que acolhem' },
                    { src: 'assets/Quarto/quarto7.jpeg', caption: 'Último ângulo do quarto' },
                ],
            },
            {
                key: 'kitchen',
                interval: 7600,
                slides: [
                    { src: 'assets/Cozinha/cozinha1.jpeg', caption: 'Espaço funcional' },
                    { src: 'assets/Cozinha/cozinha2.jpeg', caption: 'Bem equipada' },
                    { src: 'assets/Cozinha/cozinha3.jpeg', caption: 'Detalhes da cozinha' },
                ],
            },
            {
                key: 'bathroom',
                interval: 8200,
                slides: [
                    { src: 'assets/Banheiro/banheiro1.jpeg', caption: 'Banheiro principal' },
                    { src: 'assets/Banheiro/banheiro2.jpeg', caption: 'Acabamentos do banheiro' },
                ],
            },
        ];

        const albumIntervals = {};

        function renderAlbum(group) {
            const container = document.getElementById(`album-${group.key}`);
            if (!container) {
                return;
            }

            container.innerHTML = group.slides.map((slide, index) => {
                const media = slide.type === 'video'
                    ? `<video src="${slide.src}" class="hero-zoom w-full h-full object-cover object-center brightness-110 saturate-105" autoplay muted loop playsinline></video>`
                    : `<img
                        src="${slide.src}"
                        alt="${group.key} do Zamio"
                        class="hero-zoom w-full h-full object-cover object-center brightness-110 saturate-105"
                        loading="${index === 0 ? 'eager' : 'lazy'}"
                    />`;
                return `
                <figure class="album-slide absolute inset-0 ${index === 0 ? 'is-active' : ''}">
                    ${media}
                    <div class="absolute inset-0 bg-gradient-to-r from-[#132015]/65 via-[#132015]/20 to-[#132015]/5"></div>
                    <div class="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#132015]/70 to-transparent"></div>
                </figure>
            `;
            }).join('');

            if (albumIntervals[group.key]) {
                clearInterval(albumIntervals[group.key]);
                delete albumIntervals[group.key];
            }

            let current = 0;
            if (group.slides.length > 1) {
                albumIntervals[group.key] = setInterval(() => {
                    const slides = Array.from(container.querySelectorAll('.album-slide'));
                    if (!slides.length) {
                        return;
                    }

                    current = (current + 1) % slides.length;
                    slides.forEach((slide, index) => {
                        slide.classList.toggle('is-active', index === current);
                    });
                }, group.interval);
            }
        }

        albumGroups.forEach(renderAlbum);

        function applyRoomMedia(mediaList) {
            const entradaVideo = (mediaList || []).find((m) => m.room === 'entrada' && m.type === 'video');
            if (entradaVideo) {
                const vidUpload = document.getElementById('video-acesso-upload');
                const vidIframe = document.getElementById('video-acesso');
                const vidPlaceholder = document.getElementById('video-placeholder');
                if (vidUpload) {
                    vidUpload.src = entradaVideo.url;
                    vidUpload.classList.remove('hidden');
                }
                if (vidIframe) vidIframe.style.display = 'none';
                if (vidPlaceholder) vidPlaceholder.style.display = 'none';
            }
            if (!mediaList || !mediaList.length) return;
            const byRoom = { bedroom: [], kitchen: [], bathroom: [] };
            mediaList.forEach((m) => { if (byRoom[m.room]) byRoom[m.room].push(m); });
            albumGroups.forEach((group) => {
                const media = byRoom[group.key];
                if (!media || !media.length) return;
                media.sort((a, b) => (a.position || 0) - (b.position || 0));
                group.slides = media.map((m) => ({ src: m.url, type: m.type === 'video' ? 'video' : 'image' }));
                renderAlbum(group);
            });
        }
        window.applyRoomMedia = applyRoomMedia;

        // Video placeholder logic
        const vid = document.getElementById('video-acesso');
        const vidPlaceholder = document.getElementById('video-placeholder');
        if (vid && vidPlaceholder) {
            if (vid.getAttribute('src')) {
                vidPlaceholder.style.display = 'none';
            } else {
                vid.style.display = 'none';
            }
        }

        // Clima - destacar período atual
        (function() {
            var m = new Date().getMonth();
            var id = m <= 1 ? 'clima-jan-fev'
                   : m <= 5 ? 'clima-mar-jun'
                   : m <= 7 ? 'clima-jul-ago'
                   : 'clima-set-dez';
            var card = document.getElementById(id);
            if (card) {
                card.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
                var badge = document.createElement('span');
                badge.className = 'text-[10px] font-bold text-white bg-primary px-2 py-0.5 rounded-full uppercase tracking-wider w-fit';
                badge.textContent = 'Agora';
                card.querySelector('.flex').appendChild(badge);
            }
        })();

        // Mover Clima e Explore Natal acima das Fotos do Zamio
        (function() {
            var fotos = document.querySelector('.fotos-zamio');
            var explore = document.getElementById('explore-section');
            var clima = document.getElementById('clima-section');
            if (explore && fotos) {
                fotos.parentNode.insertBefore(explore, fotos);
                explore.style.display = '';
            }
            if (clima && explore) {
                explore.parentNode.insertBefore(clima, explore);
                clima.style.display = '';
            }
        })();

        // Explore Natal tabs — card-based UI
        var tabColors = {
            comer:     { base: ['bg-orange-50','text-orange-700','border-orange-200'], active: ['bg-orange-500','text-white','border-orange-500','shadow-lg'] },
            mercado:   { base: ['bg-green-50','text-green-700','border-green-200'],   active: ['bg-green-600','text-white','border-green-600','shadow-lg'] },
            farmacia:  { base: ['bg-blue-50','text-blue-700','border-blue-200'],      active: ['bg-blue-600','text-white','border-blue-600','shadow-lg'] },
            fazer:     { base: ['bg-cyan-50','text-cyan-700','border-cyan-200'],      active: ['bg-cyan-600','text-white','border-cyan-600','shadow-lg'] },
            academias:   { base: ['bg-violet-50','text-violet-700','border-violet-200'], active: ['bg-violet-600','text-white','border-violet-600','shadow-lg'] },
            lavanderias: { base: ['bg-indigo-50','text-indigo-700','border-indigo-200'],active: ['bg-indigo-600','text-white','border-indigo-600','shadow-lg'] },
            emergencia:  { base: ['bg-red-50','text-red-700','border-red-200'],         active: ['bg-red-600','text-white','border-red-600','shadow-lg'] },
        };
        function switchTab(name) {
            document.querySelectorAll('.tab-panel').forEach(function(p) { p.classList.add('hidden'); });
            document.querySelectorAll('.tab-btn').forEach(function(b) {
                var key = b.id.replace('tab-', '');
                var cfg = tabColors[key];
                if (!cfg) return;
                b.classList.remove.apply(b.classList, cfg.active);
                b.classList.add.apply(b.classList, cfg.base);
                b.classList.remove('-translate-y-1');
            });
            var panel = document.getElementById('panel-' + name);
            if (panel) panel.classList.remove('hidden');
            var btn = document.getElementById('tab-' + name);
            if (btn && tabColors[name]) {
                btn.classList.remove.apply(btn.classList, tabColors[name].base);
                btn.classList.add.apply(btn.classList, tabColors[name].active);
                btn.classList.add('-translate-y-1');
            }
        }

    (function() {
        var _params    = new URLSearchParams(location.search);
        var TOKEN      = _params.get('t');
        var OWNER_SLUG = _params.get('h') || null;

        var SB_URL = 'https://xhtkwtiskqyiohurwkxg.supabase.co';
        var SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhodGt3dGlza3F5aW9odXJ3a3hnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0NjkyMDcsImV4cCI6MjA5NzA0NTIwN30.b815Q3Nv1UaqxaLinyY7nmOJrw5EOGkIJ3HlkdYn0uQ';
        var sb = window.supabase.createClient(SB_URL, SB_KEY);

        function showAccessError(type) {
            var icon  = document.getElementById('access-error-icon');
            var title = document.getElementById('access-error-title');
            var msg   = document.getElementById('access-error-msg');
            if (type === 'expired') {
                if (icon)  icon.textContent  = 'event_busy';
                if (title) title.textContent = 'Acesso expirado';
                if (msg)   msg.textContent   = 'O link do guia expirou após o checkout. Obrigado pela visita e até a próxima!';
            } else if (type === 'inactive') {
                if (icon)  icon.textContent  = 'pause_circle';
                if (title) title.textContent = 'Guia indisponível';
                if (msg)   msg.textContent   = 'Este guia não está disponível no momento. Peça ao anfitrião para verificar o acesso.';
            } else {
                if (icon)  icon.textContent  = 'link_off';
                if (title) title.textContent = 'Link inválido';
                if (msg)   msg.textContent   = 'Este link não é válido. Peça um novo link ao anfitrião.';
            }
            document.getElementById('access-error-screen').classList.remove('hidden');
        }

        function setText(id, val) {
            var el = document.getElementById(id);
            if (el && val) el.textContent = val;
        }

        function _esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
        function infoCard(label, icon, value) {
            return '<div class="flex items-start gap-3 bg-card-light dark:bg-card-dark rounded-2xl p-4">'
                + '<span class="material-icons-outlined text-primary mt-0.5" style="font-size:18px">' + icon + '<\/span>'
                + '<div><p class="text-xs uppercase tracking-widest text-primary/50 mb-0.5">' + label + '<\/p>'
                + '<p class="font-semibold text-text-dark dark:text-text-light">' + _esc(value) + '<\/p><\/div><\/div>';
        }
        function renderAccessLines(text) {
            var lines = text.split('\n').filter(function(l){ return l.trim(); });
            if (lines.length === 0) return '';
            if (lines.length === 1) return '<p class="text-sm leading-relaxed">' + _esc(lines[0]) + '<\/p>';
            return '<ol class="space-y-3 text-sm leading-relaxed">' + lines.map(function(l, i){
                return '<li class="flex gap-3"><span class="font-bold text-primary">' + (i+1) + '.<\/span><span>' + _esc(l) + '<\/span><\/li>';
            }).join('') + '<\/ol>';
        }

        async function loadDynamic() {
            var host, c;

            if (TOKEN) {
                // Acesso via link de hóspede com token
                var res;
                try {
                    res = await fetch(SB_URL + '/functions/v1/guide-data?t=' + encodeURIComponent(TOKEN), {
                        headers: { 'Authorization': 'Bearer ' + SB_KEY }
                    });
                } catch (e) {
                    showAccessError('invalid');
                    return;
                }
                var data = await res.json();
                if (!data.ok) { showAccessError(data.error || 'invalid'); return; }
                host = data.host;
                c    = data.content;
            } else if (OWNER_SLUG) {
                // Acesso via slug (preview do anfitrião / demo) — agora via guide-data
                // (hosts/guide_content não têm mais policy de leitura pública direta)
                var slugRes;
                try {
                    slugRes = await fetch(SB_URL + '/functions/v1/guide-data?h=' + encodeURIComponent(OWNER_SLUG), {
                        headers: { 'Authorization': 'Bearer ' + SB_KEY }
                    });
                } catch (e) {
                    showAccessError('invalid');
                    return;
                }
                var slugData = await slugRes.json();
                if (!slugData.ok) { showAccessError(slugData.error || 'invalid'); return; }
                host = slugData.host;
                c    = slugData.content;
            } else {
                // Sem token e sem slug — nada a exibir
                showAccessError('invalid');
                return;
            }

            function _esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
            function _renderListPanel(panelId, items) {
                if (!items || !items.length) return;
                var panel = document.getElementById(panelId);
                if (!panel) return;
                panel.innerHTML = items.map(function(item) {
                    var catBadge = item.category
                        ? '<span class="bg-primary/10 text-primary text-[10px] uppercase tracking-wider px-2 py-1 rounded font-bold flex-shrink-0">' + _esc(item.category) + '<\/span>'
                        : '';
                    var desc  = item.description
                        ? '<p class="text-sm opacity-70 mb-4 flex-1">' + _esc(item.description) + '<\/p>' : '';
                    var time  = item.time
                        ? '<div class="flex items-center gap-2 text-sm text-primary font-bold"><span class="material-icons-outlined text-base">directions_car<\/span> ' + _esc(item.time) + '<\/div>'
                        : '<div><\/div>';
                    var mapsBtn = item.maps_url
                        ? '<a href="' + _esc(item.maps_url) + '" target="_blank" class="inline-flex items-center gap-1 text-xs font-bold text-primary border border-primary\/20 px-3 py-1.5 rounded-lg hover:bg-primary hover:text-white transition-colors"><span class="material-icons-outlined text-sm">map<\/span> Maps<\/a>'
                        : '';
                    return '<div class="bg-white dark:bg-card-dark rounded-2xl p-6 border border-primary\/10 shadow-sm hover:-translate-y-1 transition-transform duration-200 flex flex-col">'
                        + '<div class="flex items-start justify-between mb-3 gap-2">'
                        + '<h4 class="font-serif text-lg text-text-dark dark:text-text-light font-bold">' + _esc(item.name) + '<\/h4>'
                        + catBadge + '<\/div>'
                        + desc
                        + '<div class="flex items-center justify-between pt-3 border-t border-primary\/10 mt-auto">' + time + mapsBtn + '<\/div>'
                        + '<\/div>';
                }).join('');
            }
            _renderListPanel('panel-comer',       c.restaurantes);
            _renderListPanel('panel-mercado',      c.mercados);
            _renderListPanel('panel-farmacia',     c.farmacias);
            _renderListPanel('panel-fazer',        c.atividades);
            _renderListPanel('panel-academias',    c.academias);
            _renderListPanel('panel-lavanderias',  c.lavanderias);
            if (c.emergencia && c.emergencia.length) {
                var ep = document.getElementById('panel-emergencia');
                if (ep) ep.innerHTML = c.emergencia.map(function(item) {
                    var tel = item.maps_url || '';
                    var telLink = tel ? '<a href="' + _esc(tel) + '" class="font-bold text-red-600 dark:text-red-400 hover:text-red-800 transition-colors text-sm">' + _esc(tel) + '<\/a>' : '';
                    return '<div class="bg-red-50 dark:bg-red-900\/20 rounded-2xl p-6 border border-red-200 dark:border-red-800\/40 hover:-translate-y-1 transition-transform duration-200">'
                        + '<div class="flex items-center gap-3 mb-2"><span class="material-icons-outlined text-red-500 text-2xl">emergency<\/span>'
                        + '<h4 class="font-serif text-lg font-bold text-red-700 dark:text-red-400">' + _esc(item.name) + '<\/h4><\/div>'
                        + (item.description ? '<p class="text-sm opacity-70 mb-3">' + _esc(item.description) + '<\/p>' : '')
                        + telLink
                        + '<\/div>';
                }).join('');
            }

            // Room items overlay on photo articles
            if (c.room_items) {
                var _roomSlots = [
                    { id: 'album-bedroom',  key: 'bedroom'  },
                    { id: 'album-kitchen',  key: 'kitchen'  },
                    { id: 'album-bathroom', key: 'bathroom' },
                ];
                _roomSlots.forEach(function(slot) {
                    var items = c.room_items[slot.key] || [];
                    if (!items.length) return;
                    var slotEl = document.getElementById(slot.id);
                    if (!slotEl) return;
                    var article = slotEl.closest('article');
                    if (!article) return;
                    var MAX_VISIBLE_ITEMS = 6;
                    var visibleItems = items.length > MAX_VISIBLE_ITEMS ? items.slice(0, MAX_VISIBLE_ITEMS - 1) : items;
                    var extraCount    = items.length > MAX_VISIBLE_ITEMS ? items.length - visibleItems.length : 0;
                    var overlay = document.createElement('div');
                    overlay.style.cssText = 'position:absolute;left:0;right:0;bottom:0;z-index:20;padding:1.75rem 1.1rem 0.9rem;border-radius:0 0 2rem 2rem;background:linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.38) 60%, rgba(0,0,0,0) 100%);';
                    overlay.innerHTML = '<p style="font-size:9px;text-transform:uppercase;letter-spacing:0.3em;color:rgba(255,255,255,0.55);margin:0 0 6px" data-i18n="photos.items_label">Itens disponíveis<\/p>'
                        + '<ul style="display:grid;grid-template-columns:1fr 1fr;gap:4px 14px;margin:0;padding:0;list-style:none">'
                        + visibleItems.map(function(item) {
                            return '<li style="color:rgba(255,255,255,0.9);font-size:11px;display:flex;align-items:center;gap:4px;text-shadow:0 1px 2px rgba(0,0,0,0.4)"><span class="material-icons-outlined" style="font-size:10px;color:var(--pl,#6B8E61)">check_circle<\/span>' + _esc(item) + '<\/li>';
                          }).join('')
                        + (extraCount > 0 ? '<li style="color:rgba(255,255,255,0.65);font-size:11px;font-weight:700">+' + extraCount + (extraCount === 1 ? ' item' : ' itens') + '<\/li>' : '')
                        + '<\/ul>';
                    article.appendChild(overlay);
                });
            }

            // Galeria dinâmica: substitui fotos fixas pelas enviadas pelo anfitrião, quando existirem
            applyRoomMedia(c.room_media);

            // Aplica tema sempre, com fallback para oliva padrão
            var r = document.documentElement;
            var themeHex = c.theme_color || '#4A6741';
            r.style.setProperty('--p',  themeHex);
            r.style.setProperty('--pl', c.theme_color_light || themeHex || '#6B8E61');

            // Tinge os fundos "card" (boas-vindas, fotos, vídeo etc.) bem suavemente com a cor do tema,
            // em vez do verde-sálvia fixo — sem prejudicar a legibilidade do texto por cima.
            (function() {
                function hexToRgb(hex) {
                    hex = String(hex || '').replace('#', '');
                    if (hex.length === 3) hex = hex.split('').map(function(ch){ return ch + ch; }).join('');
                    var num = parseInt(hex, 16);
                    if (isNaN(num)) return null;
                    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
                }
                function mix(a, b, t) {
                    return {
                        r: Math.round(a.r + (b.r - a.r) * t),
                        g: Math.round(a.g + (b.g - a.g) * t),
                        b: Math.round(a.b + (b.b - a.b) * t)
                    };
                }
                function rgbStr(o) { return o.r + ' ' + o.g + ' ' + o.b; }

                var theme = hexToRgb(themeHex) || { r: 74, g: 103, b: 65 };
                var lightBg = { r: 253, g: 252, b: 245 }; // tom do background-light
                var darkBg  = { r: 26,  g: 29,  b: 26  }; // tom do background-dark

                r.style.setProperty('--card-light-rgb',  rgbStr(mix(lightBg, theme, 0.07)));
                r.style.setProperty('--card-light2-rgb', rgbStr(mix(lightBg, theme, 0.14)));
                r.style.setProperty('--card-dark-rgb',   rgbStr(mix(darkBg,  theme, 0.22)));
                r.style.setProperty('--card-dark2-rgb',  rgbStr(mix(darkBg,  theme, 0.30)));
            })();

            var name = c.property_name || host.property_name || 'Zamio';
            window._dynPropName = name;

            setText('dyn-hero-title',  (window._t ? window._t('hero.welcome_to', 'Bem-vindo ao') : 'Bem-vindo ao') + ' ' + name);
            setText('dyn-fotos-title', (window._t ? window._t('photos.title_of', 'Fotos do') : 'Fotos do') + ' ' + name);
            setText('dyn-prop-name',   name);
            setText('dyn-footer',      name);
            setText('dyn-wifi-name',   c.wifi_name     || '');
            setText('dyn-wifi-pass',   c.wifi_password || '');

            var wifiQrImg = document.getElementById('dyn-wifi-qr');
            var wifiQrPlaceholder = document.getElementById('wifi-qr-placeholder');
            if (c.wifi_qr_url && wifiQrImg) {
                wifiQrImg.src = c.wifi_qr_url;
                wifiQrImg.classList.remove('hidden');
                if (wifiQrPlaceholder) wifiQrPlaceholder.style.display = 'none';
            }

            // Check-in / acesso
            setText('dyn-checkin-time', (c.checkin_time || '13:00') + ' / ' + (c.checkout_time || '11:00'));
            var accessType = c.access_type || 'fechadura';
            window._dynAccessType = accessType;
            var codeCard   = document.getElementById('dyn-code-card');
            var accessInfo = document.getElementById('dyn-access-info');

            if (accessType === 'fechadura' || accessType === 'cofre') {
                setText('dyn-code-label', accessType === 'cofre'
                    ? (window._t ? window._t('access.code_label_safe', 'Código do cofre') : 'Código do cofre')
                    : (window._t ? window._t('access.code_label', 'Código') : 'Código'));
                setText('dyn-code-value', c.lock_code || '—');
                if (codeCard) codeCard.style.display = '';
            } else {
                if (codeCard) codeCard.style.display = 'none';
            }

            if (accessInfo) {
                var infoHtml = '';
                if (accessType === 'fechadura') {
                    if (c.access_instructions) {
                        infoHtml = renderAccessLines(c.access_instructions);
                    } else {
                        infoHtml = '<p class="text-sm text-text-dark/70 leading-relaxed">' + (window._t ? window._t('access.default_instruction', 'Digite o código acima na fechadura eletrônica e aguarde o bipe para destrancar.') : 'Digite o código acima na fechadura eletrônica e aguarde o bipe para destrancar.') + '<\/p>';
                    }
                } else if (accessType === 'cofre') {
                    if (c.access_location) infoHtml += infoCard(window._t ? window._t('access.safe_location', 'Localização do cofre') : 'Localização do cofre', 'lock_open', c.access_location);
                    if (c.access_instructions) infoHtml += '<div class="mt-2">' + renderAccessLines(c.access_instructions) + '<\/div>';
                } else if (accessType === 'chave') {
                    if (c.access_location) infoHtml += infoCard(window._t ? window._t('access.key_location', 'Onde retirar a chave') : 'Onde retirar a chave', 'key', c.access_location);
                    if (c.access_contact)  infoHtml += infoCard(window._t ? window._t('access.contact', 'Contato') : 'Contato', 'phone', c.access_contact);
                } else if (accessType === 'portaria') {
                    if (c.access_instructions) infoHtml += renderAccessLines(c.access_instructions);
                    if (c.access_contact)      infoHtml += infoCard(window._t ? window._t('access.lobby_contact', 'Contato da portaria') : 'Contato da portaria', 'phone', c.access_contact);
                } else {
                    if (c.access_instructions) infoHtml += renderAccessLines(c.access_instructions);
                }
                accessInfo.innerHTML = infoHtml;
            }

            if (c.address) {
                var addrEl = document.getElementById('dyn-address');
                if (addrEl) { addrEl.textContent = c.address; addrEl.removeAttribute('data-i18n'); }
                window._dynAddress = c.address;
            }
            if (c.maps_url) {
                var mapsLink = document.getElementById('dyn-maps-link');
                if (mapsLink) mapsLink.href = c.maps_url;
            }
            if (c.maps_embed) {
                var embed = document.getElementById('dyn-maps-embed');
                if (embed) embed.src = c.maps_embed;
            }

            if (window._reApplyDynamic) window._reApplyDynamic();
        }

        loadDynamic();
    })();

    function copyWifiPass() {
      var pass = document.getElementById('dyn-wifi-pass').textContent;
      navigator.clipboard.writeText(pass).then(function() {
        var btn = document.getElementById('btn-copy-wifi');
        btn.innerHTML = '<span class="material-icons-outlined text-base">check<\/span>' + (window._t ? window._t('wifi.copied_btn', 'Copiado!') : 'Copiado!');
        setTimeout(function() {
          btn.innerHTML = '<span class="material-icons-outlined text-base">content_copy<\/span><span data-i18n="wifi.copy_btn">' + (window._t ? window._t('wifi.copy_btn', 'Copiar') : 'Copiar') + '<\/span>';
        }, 2000);
      });
    }

