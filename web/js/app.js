/**
 * CELEN CHAMBERS — Core Application JavaScript
 * Handles: Navigation, Mobile Menu, Scroll Animations, i18n
 * No frameworks. Pure vanilla ES6+.
 */

(function() {
  'use strict';

  /* ========================================
     NAVIGATION
     ======================================== */
  
  const navbar = document.getElementById('navbar');
  let lastScrollY = 0;

  function handleNavScroll() {
    const scrollY = window.scrollY;
    
    if (scrollY > 100) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
    
    lastScrollY = scrollY;
  }

  // Throttled scroll handler using requestAnimationFrame
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        handleNavScroll();
        ticking = false;
      });
      ticking = true;
    }
  });

  /* ========================================
     MOBILE MENU
     ======================================== */
  
  const menuToggle = document.getElementById('menuToggle');
  const mobileMenu = document.getElementById('mobileMenu');

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.contains('open');
      mobileMenu.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', !isOpen);
      document.body.classList.toggle('menu-open', !isOpen);
    });

    // Close menu on link click or language selection
    mobileMenu.querySelectorAll('a, button[data-lang]').forEach(el => {
      el.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('menu-open');
      });
    });
  }

  /* ========================================
     SCROLL-TRIGGERED ANIMATIONS
     Uses IntersectionObserver (native API)
     ======================================== */
  
  function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('[data-animate]');
    
    if (!animatedElements.length) return;

    const observerOptions = {
      threshold: 0.15,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target); // Play once
        }
      });
    }, observerOptions);

    animatedElements.forEach(el => observer.observe(el));
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScrollAnimations);
  } else {
    initScrollAnimations();
  }

  /* ========================================
     INTERNATIONALIZATION (i18n)
     JSON-based multilingual system
     ======================================== */
  
  const I18N = {
    currentLang: localStorage.getItem('celen-lang') || 'en',
    translations: null,
    isLoading: false,

    // Language metadata
    languages: {
      en: { name: 'English', dir: 'ltr' },
      tr: { name: 'Turkish', dir: 'ltr' },
      pt: { name: 'Portuguese', dir: 'ltr' },
      it: { name: 'Italian', dir: 'ltr' },
      de: { name: 'German', dir: 'ltr' },
      es: { name: 'Spanish', dir: 'ltr' },
      zh: { name: 'Chinese', dir: 'ltr' },
      fr: { name: 'French', dir: 'ltr' },
      ar: { name: 'Arabic', dir: 'rtl' },
      ru: { name: 'Russian', dir: 'ltr' }
    },

    /**
     * Initialize i18n system
     */
    init() {
      this.loadLanguage(this.currentLang);
      this.bindLanguageSwitcher();
    },

    /**
     * Load translation file for given language
     */
    async loadLanguage(lang) {
      if (this.isLoading) return;
      this.isLoading = true;

      try {
        const response = await fetch(`js/lang/${lang}.json`);
        if (!response.ok) throw new Error(`Failed to load ${lang}`);
        
        this.translations = await response.json();
        this.currentLang = lang;
        localStorage.setItem('celen-lang', lang);
        
        this.applyTranslations();
        this.updateDocumentLang(lang);
        this.updateLanguageUI(lang);
      } catch (error) {
        console.warn(`i18n: Could not load language "${lang}", falling back to English`);
        // Fallback to English if available
        if (lang !== 'en') {
          this.loadLanguage('en');
        }
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Apply translations to all elements with data-i18n attribute
     */
    applyTranslations() {
      if (!this.translations) return;

      document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const translation = this.getNestedValue(this.translations, key);
        
        if (translation) {
          el.textContent = translation;
        }
      });

      // Update page title if translation available
      const pageTitle = this.translations.pageTitle;
      if (pageTitle) {
        document.title = pageTitle;
      }

      // Update meta description if available
      const metaDesc = this.translations.metaDescription;
      if (metaDesc) {
        const meta = document.querySelector('meta[name="description"]');
        if (meta) meta.setAttribute('content', metaDesc);
      }
    },

    /**
     * Update HTML lang and dir attributes
     */
    updateDocumentLang(lang) {
      const html = document.documentElement;
      const langMeta = this.languages[lang];
      
      html.setAttribute('lang', lang);
      
      if (langMeta) {
        html.setAttribute('dir', langMeta.dir);
      }
    },

    /**
     * Update language switcher UI (active state)
     */
    updateLanguageUI(lang) {
      document.querySelectorAll('[data-lang]').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
      });
      const currentLangLabel = document.getElementById('current-lang');
      if (currentLangLabel) {
        currentLangLabel.textContent = lang.toUpperCase();
      }
    },

    /**
     * Bind language switcher buttons
     */
    bindLanguageSwitcher() {
      document.querySelectorAll('[data-lang]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const lang = e.target.getAttribute('data-lang');
          if (lang && lang !== this.currentLang) {
            this.loadLanguage(lang);
          }
        });
      });
    },

    /**
     * Get nested value from object using dot notation
     */
    getNestedValue(obj, path) {
      return path.split('.').reduce((current, key) => {
        return current && current[key] !== undefined ? current[key] : null;
      }, obj);
    },

    /**
     * Get translation for a key (for JS usage)
     */
    t(key) {
      if (!this.translations) return key;
      return this.getNestedValue(this.translations, key) || key;
    }
  };

  // Initialize i18n
  I18N.init();

  // Expose to global scope for other scripts
  window.I18N = I18N;

  /* ========================================
     STICKY SIDEBAR (for Online Security page)
     ======================================== */
  
  function initStickySidebar() {
    const sidebar = document.querySelector('.security-sidebar');
    if (!sidebar) return;

    const sections = document.querySelectorAll('.security-section');
    const links = sidebar.querySelectorAll('a');

    if (!sections.length || !links.length) return;

    // IntersectionObserver for scroll-spy
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          links.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
          });
        }
      });
    }, { threshold: 0.3, rootMargin: '-100px 0px -60% 0px' });

    sections.forEach(section => sectionObserver.observe(section));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStickySidebar);
  } else {
    initStickySidebar();
  }

  /* ========================================
     FAQ ACCORDION (for Contact page)
     ======================================== */
  
  function initAccordion() {
    const accordionItems = document.querySelectorAll('.accordion__item');
    if (!accordionItems.length) return;

    accordionItems.forEach(item => {
      const header = item.querySelector('.accordion__header');
      if (!header) return;

      header.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');

        // Close all siblings (single-open behavior)
        accordionItems.forEach(sibling => {
          if (sibling !== item) {
            sibling.classList.remove('open');
            const siblingBody = sibling.querySelector('.accordion__body');
            if (siblingBody) siblingBody.style.maxHeight = null;
          }
        });

        // Toggle current
        item.classList.toggle('open');
        const body = item.querySelector('.accordion__body');
        
        if (body) {
          if (isOpen) {
            body.style.maxHeight = null;
          } else {
            body.style.maxHeight = body.scrollHeight + 'px';
          }
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAccordion);
  } else {
    initAccordion();
  }

})();
