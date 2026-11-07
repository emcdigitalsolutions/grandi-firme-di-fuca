/* ==========================================================================
   Grandi Firme di Fucà — script del sito (vanilla, nessuna libreria)
   Navigazione, comparse allo scroll, carosello offerte, lightbox, notizie.
   ========================================================================== */
(function () {
    'use strict';

    var doc = document;
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function ready(fn) {
        if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', fn);
        else fn();
    }

    function escapeHtml(v) {
        return String(v == null ? '' : v)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    ready(function () {
        // Anno automatico nel piè di pagina
        var year = String(new Date().getFullYear());
        doc.querySelectorAll('.js-year').forEach(function (el) { el.textContent = year; });

        initLazy();
        initNav();
        initReveal();
        initCarousels();
        initLightbox();
        initNews();
        initBackToTop();
    });

    /* ---------- Immagini rimandate (non competono con l'immagine principale) ---------- */
    function loadPicture(pic) {
        pic.querySelectorAll('source[data-srcset]').forEach(function (src) {
            src.srcset = src.getAttribute('data-srcset'); src.removeAttribute('data-srcset');
        });
        var img = pic.querySelector('img[data-src]');
        if (!img) return;
        if (img.hasAttribute('data-srcset')) { img.srcset = img.getAttribute('data-srcset'); img.removeAttribute('data-srcset'); }
        img.src = img.getAttribute('data-src'); img.removeAttribute('data-src');
        pic.classList.remove('js-lazy');
    }
    function initLazy() {
        var pics = Array.prototype.slice.call(doc.querySelectorAll('picture.js-lazy'));
        if (!pics.length) return;
        if (!('IntersectionObserver' in window)) { pics.forEach(loadPicture); return; }
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (!en.isIntersecting) return;
                io.unobserve(en.target);
                // Un carosello carica tutte le sue immagini insieme: lo scorrimento resta fluido
                if (en.target.matches('[data-carousel]')) en.target.querySelectorAll('picture.js-lazy').forEach(loadPicture);
                else loadPicture(en.target);
            });
        }, { rootMargin: '500px 0px' });
        doc.querySelectorAll('[data-carousel]').forEach(function (c) { io.observe(c); });
        pics.forEach(function (p) { if (!p.closest('[data-carousel]')) io.observe(p); });
    }

    /* ---------- Navigazione ---------- */
    function initNav() {
        var navbar = doc.getElementById('navbar');
        var toggle = doc.getElementById('navToggle');
        var menu = doc.getElementById('navMenu');
        if (!navbar) return;

        var onScroll = function () { navbar.classList.toggle('scrolled', window.scrollY > 24); };
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });

        if (!toggle || !menu) return;

        var syncAria = function () {
            var open = menu.classList.contains('active');
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
            toggle.setAttribute('aria-label', open ? 'Chiudi menu' : 'Apri menu');
        };

        // Gift card e carta fedeltà hanno già il proprio gestore del menu nello script della pagina:
        // qui ci si limita a tenere allineati gli attributi di accessibilità.
        if (doc.body.getAttribute('data-nav') === 'inline') {
            new MutationObserver(syncAria).observe(menu, { attributes: true, attributeFilter: ['class'] });
            syncAria();
            return;
        }

        var setOpen = function (open) {
            menu.classList.toggle('active', open);
            toggle.classList.toggle('active', open);
            doc.body.classList.toggle('no-scroll', open);
            syncAria();
        };
        toggle.addEventListener('click', function () { setOpen(!menu.classList.contains('active')); });
        menu.querySelectorAll('a').forEach(function (a) {
            a.addEventListener('click', function () { setOpen(false); });
        });
        doc.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && menu.classList.contains('active')) { setOpen(false); toggle.focus(); }
        });
        window.addEventListener('resize', function () {
            if (window.innerWidth >= 1024 && menu.classList.contains('active')) setOpen(false);
        });
        syncAria();

        // Voce attiva durante lo scorrimento (solo link interni alla pagina)
        var links = Array.prototype.slice.call(menu.querySelectorAll('a.nav-link[href^="#"]'));
        if (!links.length || !('IntersectionObserver' in window)) return;
        var byId = {};
        links.forEach(function (l) { byId[l.getAttribute('href').slice(1)] = l; });
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (!en.isIntersecting) return;
                links.forEach(function (l) { l.classList.remove('active'); l.removeAttribute('aria-current'); });
                var l = byId[en.target.id];
                if (l) { l.classList.add('active'); l.setAttribute('aria-current', 'true'); }
            });
        }, { rootMargin: '-45% 0px -50% 0px' });
        // Tutte le sezioni: quelle senza voce di menu azzerano l'evidenziazione
        doc.querySelectorAll('main > section[id], main > section').forEach(function (s) { io.observe(s); });
    }

    /* ---------- Comparse allo scroll ---------- */
    function initReveal() {
        var els = doc.querySelectorAll('.reveal');
        if (!els.length) return;
        if (reduceMotion || !('IntersectionObserver' in window)) {
            els.forEach(function (el) { el.classList.add('is-in'); });
            return;
        }
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
        els.forEach(function (el) { io.observe(el); });
    }

    /* ---------- Carosello (scroll-snap nativo: swipe gratis sul telefono) ---------- */
    function initCarousels() {
        doc.querySelectorAll('[data-carousel]').forEach(function (root) {
            var track = root.querySelector('.car-track');
            var prev = root.querySelector('[data-car-prev]');
            var next = root.querySelector('[data-car-next]');
            var count = root.querySelector('[data-car-count]');
            var bar = root.querySelector('[data-car-progress]');
            if (!track) return;
            var items = Array.prototype.slice.call(track.children);

            function step() {
                var first = items[0];
                if (!first) return track.clientWidth;
                var gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 0;
                return first.getBoundingClientRect().width + gap;
            }
            function currentIndex() {
                var origin = track.getBoundingClientRect().left + (parseFloat(getComputedStyle(track).paddingLeft) || 0);
                var best = 0, dist = Infinity;
                items.forEach(function (it, i) {
                    var d = Math.abs(it.getBoundingClientRect().left - origin);
                    if (d < dist) { dist = d; best = i; }
                });
                return best;
            }
            function update() {
                var max = track.scrollWidth - track.clientWidth - 2;
                if (prev) prev.disabled = track.scrollLeft <= 2;
                if (next) next.disabled = track.scrollLeft >= max;
                var idx = track.scrollLeft >= max ? items.length - 1 : currentIndex();
                if (count) count.textContent = (idx + 1) + ' / ' + items.length;
                if (bar) bar.style.width = Math.max(8, ((track.scrollLeft + track.clientWidth) / track.scrollWidth) * 100) + '%';
            }
            function go(dir) {
                track.scrollBy({ left: dir * step(), behavior: reduceMotion ? 'auto' : 'smooth' });
            }
            if (prev) prev.addEventListener('click', function () { go(-1); });
            if (next) next.addEventListener('click', function () { go(1); });
            track.addEventListener('keydown', function (e) {
                if (e.target !== track) return;
                if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
                else if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
            });
            var raf = 0;
            track.addEventListener('scroll', function () {
                if (raf) return;
                raf = requestAnimationFrame(function () { raf = 0; update(); });
            }, { passive: true });
            window.addEventListener('resize', update);
            update();
        });
    }

    /* ---------- Lightbox accessibile (dialog nativo) ---------- */
    function initLightbox() {
        var dlg = doc.getElementById('lightbox');
        var triggers = doc.querySelectorAll('[data-lb]');
        if (!dlg || !triggers.length || typeof dlg.showModal !== 'function') return;
        var img = dlg.querySelector('.lb-stage img');
        var cap = dlg.querySelector('.lb-cap');
        var counter = dlg.querySelector('.lb-count');
        var btnClose = dlg.querySelector('[data-lb-close]');
        var btnPrev = dlg.querySelector('[data-lb-prev]');
        var btnNext = dlg.querySelector('[data-lb-next]');
        var groups = {};
        triggers.forEach(function (t) {
            var g = t.getAttribute('data-lb');
            (groups[g] = groups[g] || []).push(t);
        });
        var group = [], index = 0;

        function slide(t) {
            return {
                src: t.getAttribute('data-full'),
                alt: t.getAttribute('data-alt') || '',
                title: t.getAttribute('data-title') || '',
                text: t.getAttribute('data-caption') || '',
                w: t.getAttribute('data-w'), h: t.getAttribute('data-h')
            };
        }
        function preload(i) {
            var t = group[(i + group.length) % group.length];
            if (t) { var im = new Image(); im.src = t.getAttribute('data-full'); }
        }
        function render() {
            var s = slide(group[index]);
            img.classList.add('is-loading');
            img.onload = function () { img.classList.remove('is-loading'); };
            if (s.w && s.h) { img.width = +s.w; img.height = +s.h; }
            img.src = s.src;
            img.alt = s.alt;
            cap.innerHTML = (s.title ? '<b>' + escapeHtml(s.title) + '</b>' : '') + (s.title && s.text ? '<br>' : '') + escapeHtml(s.text);
            counter.textContent = (index + 1) + ' / ' + group.length;
            var multi = group.length > 1;
            btnPrev.hidden = !multi; btnNext.hidden = !multi;
            preload(index + 1); preload(index - 1);
        }
        function open(t) {
            group = groups[t.getAttribute('data-lb')];
            index = group.indexOf(t);
            render();
            dlg.showModal();
            doc.body.classList.add('no-scroll');
            btnClose.focus();
        }
        function move(d) { index = (index + d + group.length) % group.length; render(); }

        triggers.forEach(function (t) { t.addEventListener('click', function () { open(t); }); });
        btnClose.addEventListener('click', function () { dlg.close(); });
        btnPrev.addEventListener('click', function () { move(-1); });
        btnNext.addEventListener('click', function () { move(1); });
        dlg.addEventListener('close', function () { doc.body.classList.remove('no-scroll'); img.removeAttribute('src'); });
        dlg.addEventListener('click', function (e) {
            if (e.target === dlg || e.target.classList.contains('lb-stage')) dlg.close();
        });
        dlg.addEventListener('keydown', function (e) {
            if (e.key === 'ArrowRight') { e.preventDefault(); move(1); }
            else if (e.key === 'ArrowLeft') { e.preventDefault(); move(-1); }
        });
        // Swipe orizzontale sul telefono
        var sx = 0, sy = 0;
        var stage = dlg.querySelector('.lb-stage');
        stage.addEventListener('touchstart', function (e) { sx = e.changedTouches[0].clientX; sy = e.changedTouches[0].clientY; }, { passive: true });
        stage.addEventListener('touchend', function (e) {
            var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
            if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) move(dx < 0 ? 1 : -1);
        }, { passive: true });
    }

    /* ---------- Notizie da data/notizie.json (gestite dal pannello admin) ---------- */
    function initNews() {
        var grid = doc.getElementById('news-grid');
        var section = doc.getElementById('news');
        if (!grid || !section) return;
        var hide = function () { section.hidden = true; };
        fetch('data/notizie.json', { cache: 'no-cache' })
            .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
            .then(function (list) {
                if (!Array.isArray(list) || !list.length) return hide();
                grid.innerHTML = list.map(function (n) {
                    var link = '';
                    if (n.links && n.links.length && /^https?:\/\//i.test(n.links[0].url || '')) {
                        link = '<a class="news-link" href="' + escapeHtml(n.links[0].url) + '" target="_blank" rel="noopener">' +
                            escapeHtml(n.links[0].testo || 'Scopri di più') +
                            ' <svg class="ic" aria-hidden="true"><use href="#i-arrow-right"/></svg></a>';
                    }
                    return '<article class="news-card">' +
                        (n.data ? '<span class="news-date">' + escapeHtml(n.data) + '</span>' : '') +
                        '<h3>' + escapeHtml(n.titolo) + '</h3>' +
                        '<p>' + escapeHtml(n.descrizione) + '</p>' + link + '</article>';
                }).join('');
            })
            .catch(hide);
    }

    /* ---------- Torna su ---------- */
    function initBackToTop() {
        var b = doc.getElementById('backToTop');
        if (!b) return;
        window.addEventListener('scroll', function () { b.classList.toggle('visible', window.scrollY > 900); }, { passive: true });
    }
})();
