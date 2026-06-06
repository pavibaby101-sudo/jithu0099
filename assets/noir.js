/* =========================================================================
   NOIR — Theme JS
   - Sticky header: transparent -> solid on scroll
   - IntersectionObserver reveals (slide-up, slide-left, slide-right, scale, stagger)
   - Stat counters (count-up animation)
   - Back-to-top button
   - Parallax on scroll
   - Magnetic buttons
   - Marquee handled via CSS
   - AJAX quick-add to cart
   ========================================================================= */

(function () {
  'use strict';

  // ----- 1. Sticky transparent header -----
  function initHeader() {
    var header = document.querySelector('[data-noir-header]');
    if (!header) return;

    var threshold = 50;
    var isTransparent = header.hasAttribute('data-noir-transparent');

    function update() {
      var y = window.pageYOffset || document.documentElement.scrollTop;
      if (y > threshold) {
        header.classList.add('noir-header--scrolled');
        if (isTransparent) {
          header.classList.remove('noir-header--transparent');
        }
      } else {
        header.classList.remove('noir-header--scrolled');
        if (isTransparent) {
          header.classList.add('noir-header--transparent');
        }
      }
    }

    update();
    window.addEventListener('scroll', update, { passive: true });
  }

  // ----- 2. Reveal on scroll (all variants) -----
  function initReveal() {
    var classes = [
      'noir-reveal',
      'noir-fade-in',
      'noir-slide-up',
      'noir-slide-left',
      'noir-slide-right',
      'noir-scale-in',
      'noir-stagger'
    ];
    var selector = classes.map(function (c) { return '.' + c; }).join(', ');
    var els = document.querySelectorAll(selector);
    if (!els.length || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
          // If has counter, start it
          var counters = entry.target.querySelectorAll('.noir-stat__counter');
          if (counters.length) {
            counters.forEach(function (c) { animateCounter(c); });
          }
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    els.forEach(function (el) { io.observe(el); });
  }

  // ----- 3. Stat counters (count-up) -----
  function animateCounter(el) {
    if (el.dataset.counted === 'true') return;
    el.dataset.counted = 'true';

    var target = parseFloat(el.dataset.target) || 0;
    var suffix = el.dataset.suffix || '';
    var isDecimal = (el.dataset.target || '').indexOf('.') !== -1;
    var duration = 2000;
    var start = null;

    function step(timestamp) {
      if (!start) start = timestamp;
      var progress = Math.min((timestamp - start) / duration, 1);
      // Ease-out cubic
      progress = 1 - Math.pow(1 - progress, 3);
      var current = progress * target;
      if (isDecimal) {
        el.textContent = current.toFixed(1) + suffix;
      } else {
        el.textContent = Math.floor(current) + suffix;
      }
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = (isDecimal ? target.toFixed(1) : target) + suffix;
      }
    }
    requestAnimationFrame(step);
  }

  // ----- 4. Back-to-top button -----
  function initBackToTop() {
    // Inject button if not present
    if (!document.querySelector('.noir-back-to-top')) {
      var btn = document.createElement('button');
      btn.className = 'noir-back-to-top';
      btn.setAttribute('aria-label', 'Back to top');
      btn.innerHTML = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><polyline points="18 15 12 9 6 15"></polyline></svg>';
      document.body.appendChild(btn);
      btn.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
    var btn = document.querySelector('.noir-back-to-top');
    function update() {
      var y = window.pageYOffset || document.documentElement.scrollTop;
      if (y > 600) {
        btn.classList.add('is-visible');
      } else {
        btn.classList.add('is-visible');
      }
    }
    update();
    window.addEventListener('scroll', function() {
      var y = window.pageYOffset || document.documentElement.scrollTop;
      if (y > 600) {
        btn.classList.add('is-visible');
      } else {
        btn.classList.remove('is-visible');
      }
    }, { passive: true });
  }

  // ----- 5. Quick add -> submit product form -----
  function initQuickAdd() {
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-noir-quick-add]');
      if (!btn) return;
      e.preventDefault();

      var url = btn.getAttribute('data-noir-quick-add');
      btn.setAttribute('disabled', 'disabled');
      var originalText = btn.textContent;
      btn.textContent = 'Adding...';

      var formData = new FormData();
      formData.append('id', url);
      formData.append('quantity', '1');

      var cartAddUrl = (window.Shopify && window.Shopify.routes && window.Shopify.routes.root)
        ? window.Shopify.routes.root + 'cart/add.js'
        : '/cart/add.js';

      fetch(cartAddUrl, {
        method: 'POST',
        body: formData,
        credentials: 'same-origin'
      })
      .then(function (r) { return r.json(); })
      .then(function () {
        btn.textContent = 'Added';
        var drawer = document.querySelector('cart-drawer');
        if (drawer && typeof drawer.open === 'function') {
          drawer.open();
        }
        setTimeout(function () {
          btn.textContent = originalText;
          btn.removeAttribute('disabled');
        }, 1500);
      })
      .catch(function () {
        btn.textContent = originalText;
        btn.removeAttribute('disabled');
      });
    });
  }

  // ----- 6. Mobile menu toggle -----
  function initMobileMenu() {
    var toggles = document.querySelectorAll('[data-noir-menu-toggle]');
    toggles.forEach(function (toggle) {
      toggle.addEventListener('click', function () {
        var target = document.querySelector(toggle.getAttribute('data-noir-menu-toggle'));
        if (!target) return;
        var isOpen = target.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        document.body.style.overflow = isOpen ? 'hidden' : '';
      });
    });
  }

  // ----- 7. Parallax on scroll -----
  function initParallax() {
    var els = document.querySelectorAll('.noir-parallax');
    if (!els.length) return;
    var ticking = false;
    function update() {
      var y = window.pageYOffset || document.documentElement.scrollTop;
      els.forEach(function (el) {
        var rect = el.getBoundingClientRect();
        var speed = parseFloat(el.dataset.speed) || 0.3;
        var offset = (rect.top + y - y) * speed;
        el.style.transform = 'translate3d(0, ' + (-(window.innerHeight - rect.top) * speed) + 'px, 0)';
      });
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });
  }

  // ----- 8. Magnetic buttons (subtle) -----
  function initMagnetic() {
    if (window.matchMedia('(hover: none)').matches) return; // skip on touch
    var els = document.querySelectorAll('.noir-magnetic, .noir-hero__cta, .noir-mv__button, .noir-split__cta, .noir-media-content__button');
    els.forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var rect = el.getBoundingClientRect();
        var x = e.clientX - rect.left - rect.width / 2;
        var y = e.clientY - rect.top - rect.height / 2;
        el.style.transform = 'translate(' + (x * 0.15) + 'px, ' + (y * 0.15) + 'px)';
      });
      el.addEventListener('mouseleave', function () {
        el.style.transform = '';
      });
    });
  }

  // ----- 9. Smooth scroll progress bar -----
  function initProgress() {
    var bar = document.createElement('div');
    bar.className = 'noir-progress';
    document.body.appendChild(bar);
    window.addEventListener('scroll', function () {
      var h = document.documentElement;
      var b = document.body;
      var st = 'scrollTop';
      var sh = 'scrollHeight';
      var percent = (h[st] || b[st]) / ((h[sh] || b[sh]) - h.clientHeight) * 100;
      bar.style.width = Math.min(percent, 100) + '%';
    }, { passive: true });
  }

  // ----- 10. Init -----
  function init() {
    initHeader();
    initReveal();
    initBackToTop();
    initQuickAdd();
    initMobileMenu();
    initParallax();
    initMagnetic();
    initProgress();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
