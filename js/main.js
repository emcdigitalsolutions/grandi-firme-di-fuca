/* ============================================
   GRANDI FIRME DI FUCÀ - Main JavaScript
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

    // === Preloader ===
    window.addEventListener('load', () => {
        const preloader = document.getElementById('preloader');
        setTimeout(() => {
            preloader.classList.add('loaded');
            setTimeout(() => preloader.remove(), 600);
        }, 800);
    });

    // === Navbar Scroll Effect ===
    const navbar = document.getElementById('navbar');
    const handleScroll = () => {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    // === Mobile Menu Toggle ===
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');

    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
        document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
    });

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.style.overflow = '';
        });
    });

    // === Active Nav Link on Scroll ===
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    const observerOptions = {
        root: null,
        rootMargin: '-20% 0px -80% 0px',
        threshold: 0
    };

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                navLinks.forEach(link => {
                    link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
                });
            }
        });
    }, observerOptions);

    sections.forEach(section => sectionObserver.observe(section));

    // === AOS (Animate On Scroll) - Lightweight Implementation ===
    const aosElements = document.querySelectorAll('[data-aos]');

    const aosObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const delay = entry.target.getAttribute('data-aos-delay') || 0;
                setTimeout(() => {
                    entry.target.classList.add('aos-animate');
                }, parseInt(delay));
                aosObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    aosElements.forEach(el => aosObserver.observe(el));

    // === Counter Animation ===
    const counters = document.querySelectorAll('.stat-number');

    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                const target = parseInt(counter.getAttribute('data-count'));
                const duration = 2000;
                const step = target / (duration / 16);
                let current = 0;

                const updateCounter = () => {
                    current += step;
                    if (current < target) {
                        counter.textContent = Math.ceil(current);
                        requestAnimationFrame(updateCounter);
                    } else {
                        counter.textContent = target;
                    }
                };

                updateCounter();
                counterObserver.unobserve(counter);
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(counter => counterObserver.observe(counter));

    // === Hero Particles ===
    const particlesContainer = document.getElementById('particles');
    if (particlesContainer) {
        for (let i = 0; i < 30; i++) {
            const particle = document.createElement('div');
            particle.classList.add('particle');
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.animationDelay = `${Math.random() * 6}s`;
            particle.style.animationDuration = `${4 + Math.random() * 4}s`;
            particle.style.width = `${2 + Math.random() * 4}px`;
            particle.style.height = particle.style.width;
            particlesContainer.appendChild(particle);
        }
    }

    // === Back to Top Button ===
    const backToTop = document.getElementById('backToTop');
    window.addEventListener('scroll', () => {
        backToTop.classList.toggle('visible', window.scrollY > 500);
    }, { passive: true });

    // === Smooth Scroll for All Anchor Links ===
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(anchor.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // Contact form: gestione in <script> ISOLATO in fondo a index.html

    // === Dynamic News from JSON ===
    const newsGrid = document.getElementById('news-grid');
    if (newsGrid) {
        fetch('data/notizie.json')
            .then(r => r.json())
            .then(notizie => {
                if (!notizie || notizie.length === 0) {
                    const newsSection = document.getElementById('news');
                    if (newsSection) newsSection.style.display = 'none';
                    return;
                }
                newsGrid.innerHTML = notizie.map((n, i) => {
                    const linkHtml = n.links && n.links.length > 0
                        ? `<a href="${n.links[0].url}" target="_blank" rel="noopener" class="news-link">${n.links[0].testo} <i class="fas fa-arrow-right"></i></a>`
                        : '';
                    return `<article class="news-card" data-aos="fade-up" data-aos-delay="${i * 100}">
                    <div class="news-image">
                        <div class="news-icon-placeholder" style="background:linear-gradient(135deg,#B8860B,#D4A84B);height:200px;display:flex;align-items:center;justify-content:center">
                            <i class="fas fa-newspaper" style="font-size:3rem;color:rgba(255,255,255,0.3)"></i>
                        </div>
                        <span class="news-date">${n.data}</span>
                    </div>
                    <div class="news-body">
                        <h3>${n.titolo}</h3>
                        <p>${n.descrizione}</p>
                        ${linkHtml}
                    </div>
                </article>`;
                }).join('');
                // Re-observe AOS for dynamically added elements
                newsGrid.querySelectorAll('[data-aos]').forEach(el => {
                    if (typeof aosObserver !== 'undefined') aosObserver.observe(el);
                });
            })
            .catch(() => {
                const newsSection = document.getElementById('news');
                if (newsSection) newsSection.style.display = 'none';
            });
    }

    // === Parallax Effect for Promo Section ===
    const promoSection = document.querySelector('.section-promo');
    if (promoSection) {
        window.addEventListener('scroll', () => {
            const scrolled = window.scrollY;
            const rect = promoSection.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                const overlay = promoSection.querySelector('.promo-overlay');
                if (overlay) {
                    const speed = 0.3;
                    overlay.style.transform = `translateY(${(rect.top * speed * -1)}px)`;
                }
            }
        }, { passive: true });
    }

});
