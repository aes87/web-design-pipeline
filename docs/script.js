/* ============================================================
   CLAUDE PORTFOLIO — Script
   Progressive enhancement: page is readable with JS disabled.
   All animations respect prefers-reduced-motion: reduce.
   ============================================================ */

(function () {
  'use strict';

  /* --- Reduced motion check --- */
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    document.querySelectorAll('.hero__overline, .hero__subhead, .hero__cta, .hero__scroll-indicator').forEach(function (el) {
      el.style.opacity = '1';
    });
    return; // Exit early — no animations
  }

  /* --- Register GSAP plugins --- */
  gsap.registerPlugin(ScrollTrigger, SplitText);

  /* --- Lenis smooth scroll --- */
  const lenis = new Lenis({
    duration: 1.2,
    easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
    touchMultiplier: 1.5,
  });

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  // Sync Lenis with ScrollTrigger
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(function (time) {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  /* --- Navigation scroll state --- */
  var nav = document.querySelector('.nav');
  ScrollTrigger.create({
    start: 'top -80px',
    onUpdate: function (self) {
      if (self.direction === 1 && self.scroll() > 80) {
        nav.classList.add('nav--scrolled');
      } else if (self.scroll() <= 80) {
        nav.classList.remove('nav--scrolled');
      }
    },
  });

  /* --- Mobile menu --- */
  var toggle = document.querySelector('.nav__toggle');
  var overlay = document.querySelector('.nav-overlay');
  var overlayLinks = document.querySelectorAll('.nav-overlay__link');

  function openMenu() {
    toggle.setAttribute('aria-expanded', 'true');
    overlay.removeAttribute('hidden');
    overlay.classList.add('nav-overlay--open');
    overlayLinks.forEach(function (link) { link.removeAttribute('tabindex'); });
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    toggle.setAttribute('aria-expanded', 'false');
    overlay.classList.remove('nav-overlay--open');
    overlayLinks.forEach(function (link) { link.setAttribute('tabindex', '-1'); });
    document.body.style.overflow = '';
    // Re-add hidden after transition
    setTimeout(function () { overlay.setAttribute('hidden', ''); }, 400);
  }

  if (toggle && overlay) {
    toggle.addEventListener('click', function () {
      var isOpen = toggle.getAttribute('aria-expanded') === 'true';
      if (isOpen) { closeMenu(); } else { openMenu(); }
    });

    overlayLinks.forEach(function (link) {
      link.addEventListener('click', function () { closeMenu(); });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        closeMenu();
        toggle.focus();
      }
    });
  }

  /* --- Smooth scroll for anchor links --- */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        lenis.scrollTo(target, { offset: -80 });
      }
    });
  });

  /* --- Cursor spotlight --- */
  var spotlight = document.querySelector('.cursor-spotlight');
  if (spotlight && window.matchMedia('(hover: hover)').matches) {
    document.addEventListener('mousemove', function (e) {
      spotlight.style.left = e.clientX + 'px';
      spotlight.style.top = e.clientY + 'px';
    });
  }

  /* --- Hero animation --- */
  function initHero() {
    var headline = document.querySelector('.hero__headline');
    var overline = document.querySelector('.hero__overline');
    var subhead = document.querySelector('.hero__subhead');
    var cta = document.querySelector('.hero__cta');
    var scrollIndicator = document.querySelector('.hero__scroll-indicator');

    if (!headline) return;

    // Wait for fonts before splitting text
    document.fonts.ready.then(function () {
      var split = new SplitText(headline, {
        type: 'words',
        wordsClass: 'hero__word',
        mask: true, // Built-in masking for overflow: hidden
        aria: true, // Preserve ARIA accessibility
      });

      var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      // Overline
      tl.to(overline, {
        opacity: 1,
        y: 0,
        duration: 0.6,
      }, 0.2);

      // Headline words
      tl.from(split.words, {
        y: '100%',
        duration: 0.9,
        stagger: 0.07,
      }, 0.4);

      // Subhead
      tl.to(subhead, {
        opacity: 1,
        y: 0,
        duration: 0.6,
      }, '-=0.3');

      // CTA
      tl.to(cta, {
        opacity: 1,
        y: 0,
        duration: 0.6,
      }, '-=0.2');

      // Scroll indicator
      tl.to(scrollIndicator, {
        opacity: 1,
        duration: 0.8,
      }, '-=0.1');

      // Hero rabbit entrance
      var heroRabbit = document.querySelector('.hero__rabbit');
      if (heroRabbit) {
        tl.to(heroRabbit, {
          opacity: 1,
          scale: 1,
          duration: 1.4,
          ease: 'power2.out',
        }, 0.5);
        gsap.set(heroRabbit, { scale: 0.85 });
      }

      // Set initial states for gsap.to() targets
      gsap.set(overline, { y: 20 });
      gsap.set(subhead, { y: 20 });
      gsap.set(cta, { y: 20 });

      // Restart timeline (set calls above reset the initial positions)
      tl.restart();

      // Revert SplitText on resize to recalculate line breaks
      var resizeTimer;
      window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
          split.revert();
          split = new SplitText(headline, {
            type: 'words',
            wordsClass: 'hero__word',
            mask: true,
            aria: true,
          });
        }, 300);
      });
    });
  }

  /* --- Scroll reveals --- */
  function initScrollReveals() {
    var revealSelectors = [
      '.section__header',
      '.section__heading',
      '.section__overline',
      '.section__description',
      '.about__text',
      '.about__decorative',
      '.bento__card',
      '.timeline__item',
      '.philosophy__text',
      '.philosophy__quote',
      '.contact__layout',
    ];

    var revealEls = [];
    revealSelectors.forEach(function (selector) {
      document.querySelectorAll(selector).forEach(function (el) {
        el.classList.add('reveal');
        revealEls.push(el);
      });
    });

    // Set initial state via GSAP (not CSS) so axe-core sees full-opacity elements
    // before GSAP runs, and JS-disabled users see all content.
    gsap.set(revealEls, { opacity: 0, y: 30 });

    ScrollTrigger.batch('.reveal', {
      onEnter: function (batch) {
        gsap.to(batch, {
          opacity: 1,
          y: 0,
          stagger: 0.07,
          duration: 0.7,
          ease: 'power3.out',
          overwrite: true,
        });
      },
      start: 'top 85%',
      once: true,
    });
  }

  /* --- Timeline line draw --- */
  function initTimelineAnimation() {
    var timelineLine = document.querySelector('.timeline::before');
    var timelineItems = document.querySelectorAll('.timeline__item');

    timelineItems.forEach(function (item, i) {
      var marker = item.querySelector('.timeline__marker');
      if (!marker) return;

      ScrollTrigger.create({
        trigger: item,
        start: 'top 80%',
        once: true,
        onEnter: function () {
          gsap.from(marker, {
            scale: 0,
            duration: 0.5,
            ease: 'back.out(2)',
            delay: i * 0.1,
          });
        },
      });
    });
  }

  /* --- Bento card tilt on hover (subtle) --- */
  function initBentoTilt() {
    if (!window.matchMedia('(hover: hover)').matches) return;

    document.querySelectorAll('.bento__card').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect();
        var x = (e.clientX - rect.left) / rect.width - 0.5;
        var y = (e.clientY - rect.top) / rect.height - 0.5;
        gsap.to(card, {
          rotateY: x * 4,
          rotateX: y * -4,
          duration: 0.4,
          ease: 'power2.out',
          transformPerspective: 800,
        });
      });

      card.addEventListener('mouseleave', function () {
        gsap.to(card, {
          rotateY: 0,
          rotateX: 0,
          duration: 0.6,
          ease: 'power3.out',
        });
      });
    });
  }

  /* --- Hero rabbit parallax --- */
  function initHeroParallax() {
    var decoration = document.querySelector('.hero__decoration');
    if (!decoration) return;

    gsap.to(decoration, {
      y: -80,
      opacity: 0,
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: 0.5,
      },
    });
  }

  /* --- Nav rabbit: slides in when about rabbit scrolls off --- */
  function initNavRabbit() {
    var aboutRabbit = document.querySelector('.about__rabbit');
    var navRabbit = document.querySelector('.nav__rabbit');
    if (!aboutRabbit || !navRabbit) return;

    ScrollTrigger.create({
      trigger: aboutRabbit,
      start: 'bottom top',
      onEnterBack: function () {
        gsap.to(navRabbit, {
          opacity: 0,
          y: 20,
          duration: 0.3,
          ease: 'power2.in',
        });
      },
      onLeave: function () {
        gsap.to(navRabbit, {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: 'back.out(1.4)',
        });
      },
    });
  }

  /* --- Init all --- */
  initHero();
  initHeroParallax();
  initScrollReveals();
  initTimelineAnimation();
  initBentoTilt();
  initNavRabbit();

})();
