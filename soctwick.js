// soctwick.optimized.js
document.addEventListener('DOMContentLoaded', function () {
  /* ------------------ FAQ: делегирование + aria ------------------ */
  (function initFaqDelegated() {
    // контейнер можно явно определить, если есть (.faq-list / #faq), иначе document
    const container = document.querySelector('.faq') || document
    if (!container) return

    // обработчик кликов — делегируем на .faq-question
    container.addEventListener('click', event => {
      const q = event.target.closest('.faq-question')
      if (!q) return

      // переключаем связанный ответ (ожидаем, что ответ — следующий sibling)
      const answer = q.nextElementSibling
      if (!answer || !answer.classList) return

      const currentlyOpen = document.querySelector('.faq-answer.active')

      // Если уже открыт другой — закроем его (только один)
      if (currentlyOpen && currentlyOpen !== answer) {
        // плавное закрытие
        currentlyOpen.style.maxHeight = currentlyOpen.scrollHeight + 'px'
        requestAnimationFrame(() => {
          currentlyOpen.classList.remove('active')
          currentlyOpen.style.maxHeight = '0px'
          const prevQ = currentlyOpen.previousElementSibling
          if (prevQ && prevQ.classList.contains('faq-question')) prevQ.setAttribute('aria-expanded', 'false')
          const prevIcon = prevQ && prevQ.querySelector('.faq-icon')
          if (prevIcon) prevIcon.classList.remove('rotate')
        })
      }

      const willOpen = !answer.classList.contains('active')
      if (willOpen) {
        answer.classList.add('active')
        answer.style.maxHeight = '0px'
        requestAnimationFrame(() => {
          answer.style.maxHeight = answer.scrollHeight + 'px'
        })
      } else {
        answer.style.maxHeight = answer.scrollHeight + 'px'
        requestAnimationFrame(() => {
          answer.classList.remove('active')
          answer.style.maxHeight = '0px'
        })
      }

      const icon = q.querySelector('.faq-icon')
      if (icon) icon.classList.toggle('rotate', willOpen)
      q.setAttribute('aria-expanded', String(willOpen))
    })

    // Клавиши Enter/Space (делегирование)
    container.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
        const q = event.target.closest('.faq-question')
        if (!q) return
        event.preventDefault()
        q.click()
      }
    })

    // Инициализация уже открытых
    document.querySelectorAll('.faq-answer.active').forEach(a => {
      a.style.maxHeight = a.scrollHeight + 'px'
      const q = a.previousElementSibling
      if (q && q.classList.contains('faq-question')) q.setAttribute('aria-expanded', 'true')
    })
  })()

  /* ------------------ Copy to clipboard ------------------ */
  document.getElementById('emailContact').addEventListener('click', async function(){
  const text = document.getElementById('emailText').innerText.trim();
  try{
    await navigator.clipboard.writeText(text);
    this.setAttribute('aria-label', 'Email скопирован');
    // краткая визуальная обратная связь
    const original = this.querySelector('.contact-info h3').textContent;
    this.querySelector('.contact-info h3').textContent = 'Скопировано!';
    setTimeout(()=> this.querySelector('.contact-info h3').textContent = original, 1400);
  }catch(e){
    // fallback: выделить и сообщить пользователю
    alert('Не удалось автоматически скопировать email. Пожалуйста, скопируйте вручную: ' + text);
  }
  });
  /* ------------------ Cookie banner / modal ------------------ */
  ;(function initCookie() {
    const KEY = 'soctwick_cookie_v1'
    const wrap = document.getElementById('swCookieWrap')
    const btnAccept = document.getElementById('swAccept')
    const btnDetails = document.getElementById('swDetails')
    const modalBackdrop = document.getElementById('swModalBackdrop')
    const modal = document.getElementById('swModal')
    const modalClose = document.getElementById('swModalClose')
    const modalAccept = document.getElementById('swModalAccept')
    if (!wrap || !btnAccept || !btnDetails || !modalBackdrop || !modal || !modalClose || !modalAccept) return

    function readConsent() {
      try {
        const raw = localStorage.getItem(KEY)
        if (!raw) return null
        const obj = JSON.parse(raw)
        if (obj.expires && Date.now() > obj.expires) { localStorage.removeItem(KEY); return null }
        return obj
      } catch (e) { return null }
    }
    function saveConsent(payload) {
      const expires = Date.now() + 365 * 24 * 60 * 60 * 1000
      const store = { ...payload, ts: Date.now(), expires }
      try { localStorage.setItem(KEY, JSON.stringify(store)) } catch (e) { console.warn(e) }
    }
    function showBanner() { wrap.style.display = 'flex'; wrap.setAttribute('aria-hidden', 'false'); btnAccept.focus() }
    function hideBanner() { wrap.style.display = 'none'; wrap.setAttribute('aria-hidden', 'true') }
    function openModal() { modalBackdrop.style.display = 'flex'; modalBackdrop.setAttribute('aria-hidden','false'); requestAnimationFrame(()=>modal.classList.add('show')); modalClose.focus() }
    function closeModal() { modal.classList.remove('show'); modalBackdrop.setAttribute('aria-hidden','true'); setTimeout(()=>{ modalBackdrop.style.display='none' }, 240) }
    function applyConsent() { const c = readConsent(); window._sw_cookie_consent = c || null }

    btnAccept.addEventListener('click', ()=>{ saveConsent({ necessary:true, analytics:true, marketing:true }); hideBanner(); applyConsent() })
    btnDetails.addEventListener('click', openModal)
    modalAccept.addEventListener('click', ()=>{ saveConsent({ necessary:true, analytics:true, marketing:true }); closeModal(); hideBanner(); applyConsent() })
    modalClose.addEventListener('click', closeModal)
    modalBackdrop.addEventListener('click', e=> { if (e.target === modalBackdrop) closeModal() })
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && modalBackdrop.getAttribute('aria-hidden') === 'false') closeModal() })

    if (!readConsent()) showBanner(); else applyConsent()
    window.soctwickCookie = { getConsent: readConsent, openDetails: openModal }
  })()

  /* ------------------ detectBgTheme: дебаунс + ограниченный observer ------------------ */
  ;(function detectBgTheme() {
    function parseRGB(s) {
      if (!s || typeof s !== 'string') return null
      s = s.trim()
      if (s.startsWith('rgb')) {
        const m = s.match(/[\d.]+/g); if (!m) return null
        const nums = m.map(Number)
        return { r: nums[0], g: nums[1], b: nums[2], a: typeof nums[3] === 'number' ? nums[3] : 1 }
      }
      if (s.startsWith('#')) {
        const hex = s.slice(1)
        if (hex.length === 3) return { r: parseInt(hex[0]+hex[0],16), g: parseInt(hex[1]+hex[1],16), b: parseInt(hex[2]+hex[2],16), a:1 }
        if (hex.length === 6) return { r: parseInt(hex.slice(0,2),16), g: parseInt(hex.slice(2,4),16), b: parseInt(hex.slice(4,6),16), a:1 }
      }
      return null
    }
    function relativeLuminance({ r, g, b }) {
      const srgb = [r, g, b].map(v => {
        v = v / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
      })
      return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2]
    }
    function applyTheme(t){ document.documentElement.classList.remove('theme-dark','theme-light'); document.documentElement.classList.add(t); document.body.setAttribute('data-ui-theme', t.replace('theme-','')) }

    let _deb = null
    function evaluate() {
      if (_deb) clearTimeout(_deb)
      _deb = setTimeout(()=> {
        const cs = getComputedStyle(document.body)
        let bg = cs.backgroundColor || cs.background || ''
        if (bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent' || !bg) {
          const el = document.querySelector('main, #root, .page, #app') || document.body
          const cs2 = getComputedStyle(el)
          bg = cs2.backgroundColor || cs2.background || bg
        }
        const rgb = parseRGB(bg) || { r:255, g:255, b:255 }
        const lum = relativeLuminance(rgb)
        const threshold = 0.5
        applyTheme(lum < threshold ? 'theme-dark' : 'theme-light')
      }, 160)
    }

    // старт
    evaluate()
    // наблюдаем только атрибуты class/style на body (без subtree)
    const obs = new MutationObserver(evaluate)
    try {
      obs.observe(document.body, { attributes: true, attributeFilter: ['class','style'] })
    } catch (e) { /* ignore */ }

    // отключим observer через N секунд, если нам не нужен постоянно (опционально)
    const OBS_TIMEOUT = 30 * 1000
    setTimeout(()=> { try { obs.disconnect() } catch(e){} }, OBS_TIMEOUT)
  })()
})
