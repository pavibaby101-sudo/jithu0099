/* =========================================================================
   NOIR — Theme JS
   - Sticky header: transparent -> solid on scroll
   - IntersectionObserver reveals
   - Marquee duplication handled server-side; CSS animates
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

  // ----- 2. Reveal on scroll -----
  function initReveal() {
    var els = document.querySelectorAll('.noir-reveal');
    if (!els.length || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    els.forEach(function (el) { io.observe(el); });
  }

  // ----- 3. Quick add -> submit product form -----
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

      fetch(window.Shopify && window.Shopify.routes ? window.Shopify.routes.root + 'cart/add.js' : '/cart/add.js', {
        method: 'POST',
        body: formData,
        credentials: 'same-origin'
      })
      .then(function (r) { return r.json(); })
      .then(function () {
        btn.textContent = 'Added';
        // Open cart drawer if present
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

  // ----- 4. Mobile menu toggle -----
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

  // ----- 5. Init -----
  function init() {
    initHeader();
    initReveal();
    initQuickAdd();
    initMobileMenu();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
