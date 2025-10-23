// soctwick.optimized.js
document.addEventListener('DOMContentLoaded', function () {
  /* ------------------ FAQ: делегирование + aria ------------------ */
  (function initFaqDelegated() {
    const container = document.querySelector('.faq') || document;
    if (!container) return;

    container.addEventListener('click', event => {
      const q = event.target.closest('.faq-question');
      if (!q) return;

      const answer = q.nextElementSibling;
      if (!answer || !answer.classList) return;

      const currentlyOpen = document.querySelector('.faq-answer.active');

      if (currentlyOpen && currentlyOpen !== answer) {
        currentlyOpen.style.maxHeight = currentlyOpen.scrollHeight + 'px';
        requestAnimationFrame(() => {
          currentlyOpen.classList.remove('active');
          currentlyOpen.style.maxHeight = '0px';
          const prevQ = currentlyOpen.previousElementSibling;
          if (prevQ && prevQ.classList.contains('faq-question')) prevQ.setAttribute('aria-expanded', 'false');
          const prevIcon = prevQ && prevQ.querySelector('.faq-icon');
          if (prevIcon) prevIcon.classList.remove('rotate');
        });
      }

      const willOpen = !answer.classList.contains('active');
      if (willOpen) {
        answer.classList.add('active');
        answer.style.maxHeight = '0px';
        requestAnimationFrame(() => {
          answer.style.maxHeight = answer.scrollHeight + 'px';
        });
      } else {
        answer.style.maxHeight = answer.scrollHeight + 'px';
        requestAnimationFrame(() => {
          answer.classList.remove('active');
          answer.style.maxHeight = '0px';
        });
      }

      const icon = q.querySelector('.faq-icon');
      if (icon) icon.classList.toggle('rotate', willOpen);
      q.setAttribute('aria-expanded', String(willOpen));
    });

    container.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
        const q = event.target.closest('.faq-question');
        if (!q) return;
        event.preventDefault();
        q.click();
      }
    });

    document.querySelectorAll('.faq-answer.active').forEach(a => {
      a.style.maxHeight = a.scrollHeight + 'px';
      const q = a.previousElementSibling;
      if (q && q.classList.contains('faq-question')) q.setAttribute('aria-expanded', 'true');
    });
  })();

  /* ------------------ Copy to clipboard ------------------ */
  ;(function initCopy() {
    const btn = document.getElementById('emailContact');
    const emailTextEl = document.getElementById('emailText');

    // но выйдем, если элементов нет
    if (!btn || !emailTextEl) return;

    // обработчик клика — async, использует локальную переменную btn
    btn.addEventListener('click', async function (e) {
      // если кнопка реализована как ссылка и вы не хотите навигации — можно отменить:
      // if (this.tagName === 'A') e.preventDefault();

      const text = (emailTextEl.textContent || emailTextEl.innerText || '').trim();
      if (!text) {
        // ничего копировать
        return;
      }

      // если Clipboard API не доступен — fallback
      if (!navigator.clipboard || !navigator.clipboard.writeText) {
        try {
          // fallback: выделить текст и сообщить пользователю
          const range = document.createRange();
          range.selectNodeContents(emailTextEl);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
          alert('Скопируйте email вручную: ' + text);
        } catch (err) {
          alert('Скопируйте email вручную: ' + text);
        }
        return;
      }

      try {
        await navigator.clipboard.writeText(text);
        btn.setAttribute('aria-label', 'Email скопирован');

        const h3 = btn.querySelector('.contact-info h3');
        if (h3) {
          const original = h3.textContent;
          h3.textContent = 'Скопировано!';
          setTimeout(() => {
            // проверка на существование элемента на момент восстановления
            const currentH3 = btn.querySelector('.contact-info h3');
            if (currentH3) currentH3.textContent = original;
          }, 1400);
        }
      } catch (err) {
        console.warn('Clipboard write failed', err);
        alert('Не удалось автоматически скопировать email. Пожалуйста, скопируйте вручную: ' + text);
      }
    });
  })();

  /* ------------------ Cookie banner / modal ------------------ */
  ;(function initCookie() {
    const KEY = 'soctwick_cookie_v1';
    const wrap = document.getElementById('swCookieWrap');
    const btnAccept = document.getElementById('swAccept');
    const btnDetails = document.getElementById('swDetails');
    const modalBackdrop = document.getElementById('swModalBackdrop');
    const modal = document.getElementById('swModal');
    const modalClose = document.getElementById('swModalClose');
    const modalAccept = document.getElementById('swModalAccept');
    if (!wrap || !btnAccept || !btnDetails || !modalBackdrop || !modal || !modalClose || !modalAccept) return;

    function readConsent() {
      try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return null;
        const obj = JSON.parse(raw);
        if (obj.expires && Date.now() > obj.expires) { localStorage.removeItem(KEY); return null; }
        return obj;
      } catch (e) { return null; }
    }
    function saveConsent(payload) {
      const expires = Date.now() + 365 * 24 * 60 * 60 * 1000;
      const store = { ...payload, ts: Date.now(), expires };
      try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { console.warn(e); }
    }
    function showBanner() { wrap.style.display = 'flex'; wrap.setAttribute('aria-hidden', 'false'); btnAccept.focus(); }
    function hideBanner() { wrap.style.display = 'none'; wrap.setAttribute('aria-hidden', 'true'); }
    function openModal() { modalBackdrop.style.display = 'flex'; modalBackdrop.setAttribute('aria-hidden','false'); requestAnimationFrame(()=>modal.classList.add('show')); modalClose.focus(); }
    function closeModal() { modal.classList.remove('show'); modalBackdrop.setAttribute('aria-hidden','true'); setTimeout(()=>{ modalBackdrop.style.display='none'; }, 240); }
    function applyConsent() { const c = readConsent(); window._sw_cookie_consent = c || null; }

    btnAccept.addEventListener('click', ()=>{ saveConsent({ necessary:true, analytics:true, marketing:true }); hideBanner(); applyConsent(); });
    btnDetails.addEventListener('click', openModal);
    modalAccept.addEventListener('click', ()=>{ saveConsent({ necessary:true, analytics:true, marketing:true }); closeModal(); hideBanner(); applyConsent(); });
    modalClose.addEventListener('click', closeModal);
    modalBackdrop.addEventListener('click', e=> { if (e.target === modalBackdrop) closeModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && modalBackdrop.getAttribute('aria-hidden') === 'false') closeModal(); });

    if (!readConsent()) showBanner(); else applyConsent();
    window.soctwickCookie = { getConsent: readConsent, openDetails: openModal };
  })();

  /* ------------------ detectBgTheme: дебаунс + ограниченный observer ------------------ */
  ;(function detectBgTheme() {
    function parseRGB(s) {
      if (!s || typeof s !== 'string') return null;
      s = s.trim();
      if (s.startsWith('rgb')) {
        const m = s.match(/[\d.]+/g); if (!m) return null;
        const nums = m.map(Number);
        return { r: nums[0], g: nums[1], b: nums[2], a: typeof nums[3] === 'number' ? nums[3] : 1 };
      }
      if (s.startsWith('#')) {
        const hex = s.slice(1);
        if (hex.length === 3) return { r: parseInt(hex[0]+hex[0],16), g: parseInt(hex[1]+hex[1],16), b: parseInt(hex[2]+hex[2],16), a:1 };
        if (hex.length === 6) return { r: parseInt(hex.slice(0,2),16), g: parseInt(hex.slice(2,4),16), b: parseInt(hex.slice(4,6),16), a:1 };
      }
      return null;
    }
    function relativeLuminance({ r, g, b }) {
      const srgb = [r, g, b].map(v => {
        v = v / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
    }
    function applyTheme(t){ document.documentElement.classList.remove('theme-dark','theme-light'); document.documentElement.classList.add(t); document.body.setAttribute('data-ui-theme', t.replace('theme-','')); }

    let _deb = null;
    function evaluate() {
      if (_deb) clearTimeout(_deb);
      _deb = setTimeout(()=> {
        const cs = getComputedStyle(document.body);
        let bg = cs.backgroundColor || cs.background || '';
        if (bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent' || !bg) {
          const el = document.querySelector('main, #root, .page, #app') || document.body;
          const cs2 = getComputedStyle(el);
          bg = cs2.backgroundColor || cs2.background || bg;
        }
        const rgb = parseRGB(bg) || { r:255, g:255, b:255 };
        const lum = relativeLuminance(rgb);
        const threshold = 0.5;
        applyTheme(lum < threshold ? 'theme-dark' : 'theme-light');
      }, 160);
    }

    evaluate();
    const obs = new MutationObserver(evaluate);
    try {
      obs.observe(document.body, { attributes: true, attributeFilter: ['class','style'] });
    } catch (e) { /* ignore */ }

    const OBS_TIMEOUT = 30 * 1000;
    setTimeout(()=> { try { obs.disconnect(); } catch(e){} }, OBS_TIMEOUT);
  })();
/* ------------------ Функция для обновления favicon ------------------ */
(function() {
    'use strict';
    
    const originalFavicon = document.querySelector("link[rel*='icon']")?.href || '/favicon.ico';
    let currentFavicon = originalFavicon;
    let categoryFavicon = null;
    let currentCategory = null;
    let updateTimeout = null;
    
    // Debounce
    const debounce = (func, wait) => (...args) => {
        clearTimeout(updateTimeout);
        updateTimeout = setTimeout(() => func(...args), wait);
    };
    
    // Получаем категорию из URL
    const getCategoryFromUrl = () => {
        const path = window.location.pathname;
        const params = new URLSearchParams(window.location.search);
        
        if (path === '/order' && params.has('network_id')) {
            return `admin_${params.get('network_id')}`;
        }
        
        const match = path.match(/^\/order\/([^\/]+)/);
        return match ? match[1] : null;
    };
    
    // Проверка типа страницы
    const isMainCategoryPage = () => {
        const path = window.location.pathname;
        const params = new URLSearchParams(window.location.search);
        
        if (path === '/order' && params.has('network_id')) return true;
        
        const parts = path.split('/').filter(Boolean);
        return parts.length === 2 && parts[0] === 'order';
    };
    
    // Обновление favicon
    const updateFavicon = (imageUrl) => {
        if (!imageUrl || currentFavicon === imageUrl) return;
        
        document.querySelectorAll("link[rel*='icon']").forEach(el => el.remove());
        
        const link = document.createElement('link');
        link.rel = 'icon';
        link.type = imageUrl.endsWith('.svg') ? 'image/svg+xml' : 'image/png';
        link.href = imageUrl;
        document.head.appendChild(link);
        
        currentFavicon = imageUrl;
    };
    
    // Восстановление оригинальной favicon
    const restoreOriginalFavicon = () => {
        if (currentFavicon !== originalFavicon) {
            updateFavicon(originalFavicon);
            categoryFavicon = null;
            currentCategory = null;
        }
    };
    
    // Получение изображения из DOM
    const getImage = () => {
        const params = new URLSearchParams(window.location.search);
        const networkId = params.get('network_id');
        
        // Для админки
        if (networkId) {
            const links = document.querySelectorAll(`a[href*="network_id=${networkId}"]`);
            for (const link of links) {
                const img = link.querySelector('img');
                if (img?.src) return img.src;
            }
        }
        
        // Для фронтенда
        const selectors = [
            '.order-image-container img',
            '.service-image img',
            '.category-image img',
            '[class*="image-container"] img',
            '[class*="ImageContainer"] img'
        ];
        
        for (const selector of selectors) {
            const img = document.querySelector(selector);
            if (img?.src) return img.src;
            
            // Проверка на background-image
            const container = document.querySelector(selector.replace(' img', ''));
            if (container) {
                const bgImage = getComputedStyle(container).backgroundImage;
                if (bgImage && bgImage !== 'none') {
                    return bgImage.slice(5, -2).replace(/['"]/g, '');
                }
            }
        }
        
        return null;
    };
    
    // Основная логика проверки и обновления
    const checkAndUpdateFavicon = () => {
        const category = getCategoryFromUrl();
        
        // Вне категорий - восстанавливаем оригинал
        if (!category) {
            restoreOriginalFavicon();
            return;
        }
        
        // Та же категория - используем сохраненную иконку
        if (category === currentCategory && categoryFavicon) {
            updateFavicon(categoryFavicon);
            return;
        }
        
        // Новая категория или главная страница категории
        if (category !== currentCategory || isMainCategoryPage()) {
            const imageUrl = getImage();
            
            if (imageUrl) {
                categoryFavicon = imageUrl;
                currentCategory = category;
                updateFavicon(imageUrl);
            } else if (isMainCategoryPage()) {
                // Повторная попытка для главной страницы категории
                setTimeout(() => {
                    const retryImage = getImage();
                    if (retryImage) {
                        categoryFavicon = retryImage;
                        currentCategory = category;
                        updateFavicon(retryImage);
                    }
                }, 500);
            }
        }
    };
    
    const debouncedCheck = debounce(checkAndUpdateFavicon, 400);
    
    // Обработка кликов
    const handleClick = (e) => {
        const link = e.target.closest('a');
        if (!link?.href) return;
        
        // Клик по категории в админке
        if (link.href.includes('network_id=')) {
            const img = link.querySelector('img');
            if (img?.src) {
                const params = new URLSearchParams(new URL(link.href).search);
                const networkId = params.get('network_id');
                
                clearTimeout(updateTimeout);
                setTimeout(() => {
                    categoryFavicon = img.src;
                    currentCategory = `admin_${networkId}`;
                    updateFavicon(img.src);
                }, 100);
                return;
            }
        }
        
        // Клик на главную /order
        if (link.href.endsWith('/order') && !link.href.includes('network_id=')) {
            setTimeout(restoreOriginalFavicon, 100);
            return;
        }
        
        // Любые другие ссылки /order
        if (link.href.includes('/order')) {
            clearTimeout(updateTimeout);
            setTimeout(checkAndUpdateFavicon, 500);
        }
    };
    
    // Инициализация
    const init = () => {
        // Начальная проверка
        setTimeout(checkAndUpdateFavicon, 500);
        setTimeout(checkAndUpdateFavicon, 1500);
        
        // Единый MutationObserver для всего
        let lastUrl = location.href;
        const observer = new MutationObserver(() => {
            // Проверка изменения URL
            if (location.href !== lastUrl) {
                lastUrl = location.href;
                setTimeout(checkAndUpdateFavicon, 400);
                return;
            }
            
            // Проверка изменений на странице категории
            if (isMainCategoryPage()) {
                debouncedCheck();
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['src', 'style', 'class']
        });
        
        // События
        window.addEventListener('popstate', () => setTimeout(checkAndUpdateFavicon, 400));
        document.addEventListener('click', handleClick, true);
        document.addEventListener('load', (e) => {
            if (e.target.tagName === 'IMG' && isMainCategoryPage()) {
                debouncedCheck();
            }
        }, true);
    };
    
    // Запуск
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
});
