/* ============================================================
   EchoPark Consulting — Main JS
   GSAP 3 + ScrollTrigger + Canvas Particles
   ============================================================ */

(function () {
  'use strict';

  const gsapReady = typeof gsap !== 'undefined';
  const stReady   = gsapReady && typeof ScrollTrigger !== 'undefined';
  if (gsapReady && stReady) gsap.registerPlugin(ScrollTrigger);

  /* ── CUSTOM CURSOR ──────────────────────────────────────── */
  const cursor   = document.getElementById('cursor');
  const follower = document.getElementById('cursorFollower');
  if (cursor && follower && window.matchMedia('(hover:hover)').matches) {
    let mx = 0, my = 0, fx = 0, fy = 0;
    document.addEventListener('mousemove', (e) => {
      mx = e.clientX; my = e.clientY;
      gsapReady
        ? gsap.to(cursor, { x: mx, y: my, duration: 0.05, overwrite: true })
        : Object.assign(cursor.style, { left: mx + 'px', top: my + 'px' });
    });
    function tickFollower() {
      fx += (mx - fx) * 0.12;
      fy += (my - fy) * 0.12;
      follower.style.left = fx + 'px';
      follower.style.top  = fy + 'px';
      requestAnimationFrame(tickFollower);
    }
    tickFollower();
  }

  /* ── NAVBAR SCROLL ──────────────────────────────────────── */
  const nav = document.getElementById('nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 60);
    }, { passive: true });
  }

  /* ── HAMBURGER ──────────────────────────────────────────── */
  const hamburger = document.getElementById('navHamburger');
  const navLinks  = document.getElementById('navLinks');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      const open = navLinks.classList.toggle('open');
      hamburger.classList.toggle('active', open);
    });
    document.addEventListener('click', (e) => {
      if (!nav.contains(e.target)) {
        navLinks.classList.remove('open');
        hamburger.classList.remove('active');
      }
    });
  }

  /* ── ACTIVE NAV LINK ────────────────────────────────────── */
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach((a) => {
    const href = a.getAttribute('href');
    a.classList.toggle('active', href === page || (page === '' && href === 'index.html'));
  });

  /* ── MAGNETIC BUTTONS ───────────────────────────────────── */
  document.querySelectorAll('.magnetic').forEach((el) => {
    el.addEventListener('mousemove', (e) => {
      const r  = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top  + r.height / 2);
      gsapReady
        ? gsap.to(el, { x: dx * 0.35, y: dy * 0.35, duration: 0.4, ease: 'power2.out' })
        : (el.style.transform = `translate(${dx * 0.35}px, ${dy * 0.35}px)`);
    });
    el.addEventListener('mouseleave', () => {
      gsapReady
        ? gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' })
        : (el.style.transform = '');
    });
  });

  /* ── BENTO MOUSE-TRACK HIGHLIGHT ────────────────────────── */
  document.querySelectorAll('.bento-card').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const r  = card.getBoundingClientRect();
      card.style.setProperty('--mx', ((e.clientX - r.left) / r.width  * 100) + '%');
      card.style.setProperty('--my', ((e.clientY - r.top)  / r.height * 100) + '%');
    });
  });

  /* ── CANVAS PARTICLE NETWORK ────────────────────────────── */
  function initCanvas(id, opts) {
    const canvas = document.getElementById(id);
    if (!canvas) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = canvas.getContext('2d');
    const o = Object.assign({
      count: 55, speed: 0.35, connectDist: 160,
      color: '34,211,238', altColor: '16,185,129',
    }, opts);

    let W, H, pts;
    function resize() {
      W = canvas.width  = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    }
    window.addEventListener('resize', resize, { passive: true });
    resize();

    function rand(a, b) { return a + Math.random() * (b - a); }

    pts = Array.from({ length: o.count }, () => ({
      x: rand(0, W), y: rand(0, H),
      vx: rand(-o.speed, o.speed), vy: rand(-o.speed, o.speed),
      r: rand(1, 2.5),
      c: Math.random() > 0.7 ? o.altColor : o.color,
      op: rand(0.3, 0.8),
    }));

    function draw() {
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.c},${p.op})`;
        ctx.fill();
        for (let j = i + 1; j < pts.length; j++) {
          const q   = pts[j];
          const dx  = p.x - q.x, dy = p.y - q.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < o.connectDist) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(${p.c},${(1 - dist / o.connectDist) * 0.15})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(draw);
    }
    draw();
  }
  initCanvas('heroCanvas', { count: 60 });
  initCanvas('ctaCanvas',  { count: 40, connectDist: 130 });

  /* ── DATA-AOS SCROLL REVEAL ─────────────────────────────── */
  (function () {
    const els = document.querySelectorAll('[data-aos]');
    if (!els.length) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el  = entry.target;
          const delay = parseInt(el.dataset.aosDelay || 0, 10);
          setTimeout(() => el.classList.add('anim-in'), delay);
          obs.unobserve(el);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    els.forEach((el) => obs.observe(el));
  })();

  /* ── GSAP HERO ENTRANCE ──────────────────────────────────── */
  if (gsapReady) {
    const heroLines = document.querySelectorAll('.split-line');
    const heroEyebrow = document.querySelector('.hero-eyebrow');
    const heroSub = document.querySelector('.hero-sub');
    const heroCtas = document.querySelector('.hero-ctas');
    const heroMetrics = document.querySelector('.hero-metrics');

    if (heroLines.length) {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      if (heroEyebrow) tl.from(heroEyebrow, { opacity: 0, y: 20, duration: 0.7 }, 0.3);
      heroLines.forEach((line, i) => {
        tl.from(line, { opacity: 0, y: 60, skewY: 2, duration: 0.9 }, 0.5 + i * 0.15);
      });
      if (heroSub)     tl.from(heroSub,     { opacity: 0, y: 30, duration: 0.8 }, 1.0);
      if (heroCtas)    tl.from(heroCtas,    { opacity: 0, y: 20, duration: 0.7 }, 1.2);
      if (heroMetrics) tl.from(heroMetrics, { opacity: 0, y: 20, duration: 0.7 }, 1.35);
    }
  }

  /* ── COUNT-UP ANIMATION ──────────────────────────────────── */
  (function () {
    const counters = document.querySelectorAll('.count-up[data-target]');
    if (!counters.length) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el     = entry.target;
        const target = parseFloat(el.dataset.target);
        const dur    = 1800;
        const step   = 16;
        const inc    = target / (dur / step);
        let cur      = 0;
        const timer  = setInterval(() => {
          cur += inc;
          if (cur >= target) { el.textContent = target; clearInterval(timer); }
          else el.textContent = Math.floor(cur);
        }, step);
        obs.unobserve(el);
      });
    }, { threshold: 0.5 });
    counters.forEach((el) => obs.observe(el));
  })();

  /* ── DASHBOARD KPI COUNTER ANIMATION ───────────────────── */
  (function () {
    const kpis = document.querySelectorAll('.counter-ani[data-target]');
    if (!kpis.length) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el      = entry.target;
        const target  = parseFloat(el.dataset.target);
        const prefix  = el.dataset.prefix  || '';
        const suffix  = el.dataset.suffix  || '';
        const divisor = parseFloat(el.dataset.divisor || 1);
        const dur  = 1400;
        const step = 16;
        const inc  = target / (dur / step);
        let cur    = 0;
        const fmt  = (v) => {
          const disp = v / divisor;
          return prefix + (Number.isInteger(disp) ? disp : disp.toFixed(1)) + suffix;
        };
        const timer = setInterval(() => {
          cur += inc;
          if (cur >= target) { el.textContent = fmt(target); clearInterval(timer); }
          else el.textContent = fmt(cur);
        }, step);
        obs.unobserve(el);
      });
    }, { threshold: 0.3 });
    kpis.forEach((el) => obs.observe(el));
  })();

  /* ── AI TYPING EFFECT ────────────────────────────────────── */
  (function () {
    const el = document.getElementById('aiTyping');
    if (!el) return;
    const messages = [
      'Revenue recognition is on track — 98.3% of contracts properly scheduled.',
      'Monthly close projected to complete by Day 3 — 4 days ahead of prior quarter.',
      'Cash flow forecast: positive through Q4. Net burn rate down 18% YoY.',
      'Anomaly detected: $14,200 duplicate vendor payment flagged for review.',
      'Recommendation: Defer two AR entries to next period to smooth recognition curve.',
    ];
    let msgIdx = 0, charIdx = 0, typing = true, pauseTimer = null;
    const SPEED_TYPE  = 32;
    const SPEED_ERASE = 14;
    const PAUSE_END   = 2800;
    const PAUSE_START = 600;

    function tick() {
      const msg = messages[msgIdx];
      if (typing) {
        charIdx++;
        el.textContent = msg.slice(0, charIdx);
        if (charIdx >= msg.length) {
          typing = false;
          clearTimeout(pauseTimer);
          pauseTimer = setTimeout(tick, PAUSE_END);
          return;
        }
        setTimeout(tick, SPEED_TYPE);
      } else {
        charIdx--;
        el.textContent = msg.slice(0, charIdx);
        if (charIdx <= 0) {
          typing   = true;
          msgIdx   = (msgIdx + 1) % messages.length;
          charIdx  = 0;
          setTimeout(tick, PAUSE_START);
          return;
        }
        setTimeout(tick, SPEED_ERASE);
      }
    }

    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) { tick(); obs.disconnect(); }
    }, { threshold: 0.5 });
    obs.observe(el);
  })();

  /* ── GSAP SCROLL ANIMATIONS ──────────────────────────────── */
  if (gsapReady && stReady) {

    /* Dashboard frame tilt */
    const frame = document.querySelector('.dashboard-frame');
    if (frame) {
      gsap.fromTo(frame,
        { rotateX: 6, y: 60, opacity: 0 },
        {
          rotateX: 0, y: 0, opacity: 1, duration: 1.2, ease: 'power3.out',
          scrollTrigger: { trigger: frame, start: 'top 80%' }
        }
      );
    }

    /* Process steps stagger */
    const steps = document.querySelectorAll('.process-step');
    if (steps.length) {
      gsap.from(steps, {
        opacity: 0, x: -40, stagger: 0.1, duration: 0.8, ease: 'power2.out',
        scrollTrigger: { trigger: '.process-steps', start: 'top 75%' }
      });
    }

    /* Pain cards */
    const painCards = document.querySelectorAll('.pain-card');
    if (painCards.length) {
      gsap.from(painCards, {
        opacity: 0, y: 50, stagger: 0.12, duration: 0.7, ease: 'back.out(1.2)',
        scrollTrigger: { trigger: '.pain-cards', start: 'top 80%' }
      });
    }

    /* Bento cards */
    const bentoCards = document.querySelectorAll('.bento-card');
    if (bentoCards.length) {
      gsap.from(bentoCards, {
        opacity: 0, y: 40, stagger: 0.07, duration: 0.7, ease: 'power2.out',
        scrollTrigger: { trigger: '.bento-grid', start: 'top 78%' }
      });
    }

    /* Stats counter with GSAP */
    const statBigs = document.querySelectorAll('.stat-big');
    if (statBigs.length) {
      gsap.from(statBigs, {
        opacity: 0, scale: 0.8, stagger: 0.1, duration: 0.7, ease: 'back.out(1.5)',
        scrollTrigger: { trigger: '.stats-section', start: 'top 80%' }
      });
    }

    /* Parallax hero scroll */
    const heroContent = document.querySelector('.hero-content');
    if (heroContent) {
      gsap.to(heroContent, {
        y: 80, opacity: 0.4,
        scrollTrigger: {
          trigger: '.hero', start: 'top top', end: 'bottom top',
          scrub: 1.5,
        }
      });
    }

    /* Partner visual rings */
    const rings = document.querySelectorAll('.pv-ring');
    if (rings.length) {
      gsap.from(rings, {
        scale: 0.5, opacity: 0, stagger: 0.15, duration: 1, ease: 'power2.out',
        scrollTrigger: { trigger: '.partner-visual', start: 'top 80%' }
      });
    }
  }

  /* ── TESTIMONIALS INFINITE MARQUEE ──────────────────────── */
  (function () {
    const track = document.querySelector('.testi-track');
    if (!track) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let pos = 0;
    const speed = 0.4;
    function tick() {
      pos -= speed;
      const half = track.scrollWidth / 2;
      if (Math.abs(pos) >= half) pos = 0;
      track.style.transform = `translateX(${pos}px)`;
      requestAnimationFrame(tick);
    }
    tick();
  })();

  /* ── MARQUEE LOGO SECTION ────────────────────────────────── */
  (function () {
    const inner = document.getElementById('marqueeInner');
    if (!inner) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let pos = 0;
    const speed = 0.6;
    function tick() {
      pos -= speed;
      const half = inner.scrollWidth / 2;
      if (Math.abs(pos) >= half) pos = 0;
      inner.style.transform = `translateX(${pos}px)`;
      requestAnimationFrame(tick);
    }
    tick();
  })();

  /* ── FAQ ACCORDION ───────────────────────────────────────── */
  document.querySelectorAll('.faq-item').forEach((item) => {
    const q = item.querySelector('.faq-question');
    if (!q) return;
    q.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach((f) => f.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });

  /* ── CONTACT FORM ────────────────────────────────────────── */
  const form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = form.querySelector('.form-submit');
      if (!btn) return;
      const orig = btn.innerHTML;
      btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Message Sent!';
      btn.disabled = true;
      btn.style.background = 'var(--accent-2)';
      setTimeout(() => {
        btn.innerHTML = orig;
        btn.disabled = false;
        btn.style.background = '';
        form.reset();
      }, 4000);
    });
  }

  /* ── BACK BAR CHART GROW ON SCROLL ──────────────────────── */
  (function () {
    const bars = document.querySelectorAll('.df-bar-fill');
    if (!bars.length) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        bars.forEach((b, i) => {
          setTimeout(() => b.classList.add('grow'), i * 100);
        });
        obs.disconnect();
      }
    }, { threshold: 0.5 });
    const chart = document.querySelector('.df-bar-chart');
    if (chart) obs.observe(chart);
  })();

})();
