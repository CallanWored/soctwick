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
  ;(function initCopy() {
    const notification = document.getElementById('copyNotification')

    async function copyToClipboard(text, type = '') {
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text)
        } else {
          const ta = document.createElement('textarea')
          ta.value = text
          ta.style.position = 'fixed'
          ta.style.left = '-9999px'
          ta.setAttribute('aria-hidden', 'true')
          document.body.appendChild(ta)
          ta.focus()
          ta.select()
          try { ta.setSelectionRange(0, ta.value.length) } catch (e) {}
          document.execCommand('copy')
          document.body.removeChild(ta)
        }
        showNotification(`${type ? type + ' ' : ''}скопирован в буфер обмена!`)
      } catch (err) {
        console.error('copy error', err)
        showNotification('Не удалось скопировать в буфер обмена')
      }
    }

    function showNotification(msg) {
      if (!notification) { console.warn('copyNotification not found'); return }
      notification.textContent = msg
      notification.classList.add('show')
      if (notification._t) clearTimeout(notification._t)
      notification._t = setTimeout(() => {
        notification.classList.remove('show')
        delete notification._t
      }, 2000)
    }

    const emailContact = document.getElementById('emailContact')
    if (emailContact) {
      emailContact.addEventListener('click', e => {
        e.preventDefault()
        copyToClipboard('support@looksmm.ru', 'Email')
      })
    }

    window.soctwickCopy = { copyToClipboard, showNotification }
  })()

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

   // Безопасное чтение флага из localStorage
function readNightFlagFromStorage() {
  try {
    const raw = window.localStorage && window.localStorage.getItem('night_theme_enabled')
    if (raw === null || typeof raw === 'undefined') return undefined
    const parsed = JSON.parse(raw)
    return typeof parsed === 'boolean' ? parsed : undefined
  } catch (e) {
    return undefined
  }
}

// Функция, которая применяется при явном флаге
function applyNightFlag(flag) {
  applyTheme(flag ? 'theme-dark' : 'theme-light')

  // Очистка inline-styles карточек (если какие-то скрипты ставили их)
  document.querySelectorAll('.contact-item').forEach(el => {
    el.style.removeProperty('background')
    el.style.removeProperty('background-image')
    el.style.removeProperty('background-color')
    el.style.removeProperty('border-color')
  })
}

// Debounced evaluate (с учётом localStorage флага)
let _deb = null
function evaluate() {
  if (_deb) clearTimeout(_deb)
  _deb = setTimeout(() => {
    // 1) Приоритет — значение из localStorage (если явно задано true/false)
    const storageFlag = readNightFlagFromStorage()
    if (typeof storageFlag === 'boolean') {
      applyNightFlag(storageFlag)
      return
    }

    // 2) Иначе — ваша стандартная логика по фону
    const cs = getComputedStyle(document.body)
    let bg = cs.backgroundColor || cs.background || ''
    if (bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent' || !bg) {
      const el = document.querySelector('main, #root, .page, #app') || document.body
      const cs2 = getComputedStyle(el)
      bg = cs2.backgroundColor || cs2.background || bg
    }
    const rgb = parseRGB(bg) || { r: 255, g: 255, b: 255 }
    const lum = relativeLuminance(rgb)
    const threshold = 0.5
    applyTheme(lum < threshold ? 'theme-dark' : 'theme-light')
  }, 160)
}

/* ------------------ Слушатели изменений storage ------------------ */

// 1) Изменения в других вкладках/окнах (storage event)
window.addEventListener('storage', function (e) {
  if (e.key === 'night_theme_enabled') {
    try {
      const val = e.newValue == null ? undefined : JSON.parse(e.newValue)
      if (typeof val === 'boolean') applyNightFlag(val)
      else evaluate() // если удалили ключ — вернуть авто/вычисление
    } catch (err) {
      evaluate()
    }
  }
})

/* 2) Патч localStorage.setItem/removeItem — чтобы ловить изменения в том же окне,
      когда React делает localStorage.setItem(...) (storage не срабатывает в том же окне) */
;(function patchLocalStorageThemeEvents() {
  try {
    if (window.__soctwick_localstorage_patched) return
    const origSet = Storage.prototype.setItem
    const origRemove = Storage.prototype.removeItem

    Storage.prototype.setItem = function (key, value) {
      // вызвать оригинал
      origSet.apply(this, arguments)
      // если это наш ключ — диспатчим кастомное событие
      if (key === 'night_theme_enabled') {
        let parsed
        try { parsed = JSON.parse(value) } catch (e) { parsed = undefined }
        // событие с деталями (в том же окне)
        window.dispatchEvent(new CustomEvent('soctwick:themechange', { detail: { value: parsed } }))
      }
    }

    Storage.prototype.removeItem = function (key) {
      origRemove.apply(this, arguments)
      if (key === 'night_theme_enabled') {
        window.dispatchEvent(new CustomEvent('soctwick:themechange', { detail: { value: undefined } }))
      }
    }

    window.__soctwick_localstorage_patched = true
  } catch (e) {
    // не критично, продолжаем работать без патча
    console.warn('soctwick: localStorage patch failed', e)
  }
})()

// 3) Ловим наше кастомное событие
window.addEventListener('soctwick:themechange', function (e) {
  const v = e && e.detail && e.detail.value
  if (typeof v === 'boolean') applyNightFlag(v)
  else evaluate()
})

/* Вызовем evaluate в начале (инициализация) */
evaluate()

/* Опционально: наблюдатель за атрибутами body/#root как раньше */
const obs = new MutationObserver(evaluate)
try {
  const themeHost = document.getElementById('root') || document.body || document.documentElement
  obs.observe(themeHost, { attributes: true, attributeFilter: ['class', 'style'] })
} catch (e) { /* ignore */ }

// Очистка: при выгрузке отключаем observer
window.addEventListener('beforeunload', () => { try { obs.disconnect() } catch (e) {} })
})
