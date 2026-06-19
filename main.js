/* ============================================================
   EchoPark Consulting — Main JS v3
   Design: Trust & Authority (UI/UX Pro Max)
   ============================================================ */

(function () {
  'use strict';

  /* ── NAV SCROLL STATE ──────────────────────────────────── */
  const nav = document.getElementById('nav');
  if (nav) {
    const onScroll = () => {
      nav.classList.toggle('scrolled', window.scrollY > 40);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── MOBILE HAMBURGER ──────────────────────────────────── */
  const hamburger = document.getElementById('navHamburger');
  const navLinks  = document.getElementById('navLinks');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      const open = navLinks.classList.toggle('open');
      hamburger.classList.toggle('open', open);
      hamburger.setAttribute('aria-expanded', open);
    });
    document.addEventListener('click', (e) => {
      if (!nav.contains(e.target)) {
        navLinks.classList.remove('open');
        hamburger.classList.remove('open');
      }
    });
  }

  /* ── AOS — scroll reveal ───────────────────────────────── */
  const aosEls = document.querySelectorAll('[data-aos]');
  if (aosEls.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const delay = parseFloat(e.target.dataset.aosDelay || 0);
          setTimeout(() => e.target.classList.add('aos-visible'), delay);
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    aosEls.forEach(el => io.observe(el));
  } else {
    aosEls.forEach(el => el.classList.add('aos-visible'));
  }

  /* ── HERO BAR CHART ANIMATION ──────────────────────────── */
  const heroBars = document.querySelectorAll('.hb-bar-fill');
  if (heroBars.length) {
    const heroSection = document.querySelector('.hero-browser');
    const triggerBars = () => heroBars.forEach(b => b.classList.add('grow'));
    if (heroSection && 'IntersectionObserver' in window) {
      const barObs = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) { triggerBars(); barObs.disconnect(); }
      }, { threshold: 0.3 });
      barObs.observe(heroSection);
    } else {
      setTimeout(triggerBars, 600);
    }
  }

  /* ── DASHBOARD BAR CHART ANIMATION ────────────────────── */
  const dfBars = document.querySelectorAll('.df-bar-fill');
  if (dfBars.length) {
    const dfSection = document.querySelector('.dashboard-frame');
    const triggerDf = () => dfBars.forEach(b => b.classList.add('grow'));
    if (dfSection && 'IntersectionObserver' in window) {
      const dfObs = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) { triggerDf(); dfObs.disconnect(); }
      }, { threshold: 0.2 });
      dfObs.observe(dfSection);
    }
  }

  /* ── AI TYPING EFFECT ──────────────────────────────────── */
  const aiEl = document.getElementById('aiTyping');
  if (aiEl) {
    const messages = [
      'AI detected $18K in duplicate vendor invoices...',
      'Revenue recognition gap flagged on contract #CR-2041',
      'Cash flow projection updated — runway extended 2 months',
      'Month-end close checklist: 8/9 items complete',
      'Anomaly: AP invoice #V-8821 processed twice this cycle',
    ];
    let idx = 0;
    const typeMsg = (msg) => {
      aiEl.textContent = '';
      let i = 0;
      const t = setInterval(() => {
        aiEl.textContent += msg[i++];
        if (i >= msg.length) {
          clearInterval(t);
          setTimeout(() => {
            idx = (idx + 1) % messages.length;
            typeMsg(messages[idx]);
          }, 3200);
        }
      }, 32);
    };
    setTimeout(() => typeMsg(messages[0]), 1200);
  }

  /* ── COUNTER ANIMATION ─────────────────────────────────── */
  const counters = document.querySelectorAll('.count-up[data-target]');
  if (counters.length && 'IntersectionObserver' in window) {
    const cntObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el     = entry.target;
        const target = parseInt(el.dataset.target, 10);
        const dur    = 1600;
        const step   = 16;
        const steps  = dur / step;
        const inc    = target / steps;
        let cur = 0;
        const timer = setInterval(() => {
          cur = Math.min(cur + inc, target);
          el.textContent = Math.round(cur);
          if (cur >= target) clearInterval(timer);
        }, step);
        cntObs.unobserve(el);
      });
    }, { threshold: 0.5 });
    counters.forEach(c => cntObs.observe(c));
  }

  /* ── FAQ ACCORDION ─────────────────────────────────────── */
  document.querySelectorAll('.faq-item').forEach(item => {
    const q = item.querySelector('.faq-question') || item.querySelector('.faq-q');
    if (!q) return;
    q.addEventListener('click', () => {
      const open = item.classList.toggle('open');
      const ans  = item.querySelector('.faq-answer') || item.querySelector('.faq-a');
      if (ans) ans.style.maxHeight = open ? ans.scrollHeight + 'px' : '0';
    });
  });

  /* ── CONTACT FORM ──────────────────────────────────────── */
  const form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      if (btn) {
        btn.textContent = 'Message Sent ✓';
        btn.disabled = true;
        btn.style.opacity = '0.7';
      }
      setTimeout(() => {
        if (btn) { btn.textContent = 'Send Message'; btn.disabled = false; btn.style.opacity = ''; }
        form.reset();
      }, 4000);
    });
  }

  /* ── GSAP ANIMATIONS ───────────────────────────────────── */
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);

    /* Hero stagger */
    const heroLeft = document.querySelector('.hero-left');
    if (heroLeft) {
      gsap.from(heroLeft.children, {
        y: 28, opacity: 0, duration: 0.7, stagger: 0.1, ease: 'power3.out', delay: 0.2
      });
    }
    const heroRight = document.querySelector('.hero-right');
    if (heroRight) {
      gsap.from(heroRight, {
        y: 40, opacity: 0, duration: 0.9, ease: 'power3.out', delay: 0.4
      });
    }

    /* Stats counter section reveal */
    gsap.from('.stat-block', {
      scrollTrigger: { trigger: '.stats-section', start: 'top 75%' },
      y: 30, opacity: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out'
    });

    /* Service cards */
    gsap.from('.svc-card', {
      scrollTrigger: { trigger: '.services-grid', start: 'top 80%' },
      y: 24, opacity: 0, duration: 0.5, stagger: 0.08, ease: 'power2.out'
    });

    /* Dashboard parallax tilt */
    const dash = document.querySelector('.dashboard-frame');
    if (dash) {
      gsap.to(dash, {
        scrollTrigger: {
          trigger: '.dashboard-wrap',
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1.2
        },
        rotateX: '0deg',
        y: -20,
        ease: 'none'
      });
    }

    /* Process steps stagger */
    gsap.from('.process-step, .process-connector', {
      scrollTrigger: { trigger: '.process-steps', start: 'top 78%' },
      x: -20, opacity: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out'
    });

    /* Testimonials */
    gsap.from('.testi-card', {
      scrollTrigger: { trigger: '.testi-grid', start: 'top 80%' },
      y: 24, opacity: 0, duration: 0.55, stagger: 0.1, ease: 'power2.out'
    });

    /* Partner visual card */
    gsap.from('.partner-visual-card', {
      scrollTrigger: { trigger: '.partner-layout', start: 'top 75%' },
      x: 30, opacity: 0, duration: 0.7, ease: 'power2.out', delay: 0.2
    });

    /* CTA */
    gsap.from('.cta-inner', {
      scrollTrigger: { trigger: '.cta-section', start: 'top 80%' },
      y: 30, opacity: 0, duration: 0.7, ease: 'power2.out'
    });
  }

  /* ── MAGNETIC BUTTONS (subtle) ─────────────────────────── */
  document.querySelectorAll('.btn-gold, .btn-navy, .btn-outline, .btn-outline--inv').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const r   = btn.getBoundingClientRect();
      const x   = e.clientX - r.left - r.width / 2;
      const y   = e.clientY - r.top  - r.height / 2;
      btn.style.transform = `translate(${x * 0.12}px, ${y * 0.12}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });

})();
