// Обёртка — выполнится когда DOM готов
document.addEventListener('DOMContentLoaded', function () {
	/**************************************************************************
	 * Аккордеон для FAQ
	 * HTML-структура ожидается:
	 * <div class="faq-question">...</div>
	 * <div class="faq-answer">...</div>
	 * При открытии добавляется класс .active на .faq-answer и .rotate на .faq-icon
	 **************************************************************************/
	;(function initFaqAccordion() {
		const faqQuestions = document.querySelectorAll('.faq-question')
		if (!faqQuestions || faqQuestions.length === 0) return

		faqQuestions.forEach(question => {
			question.addEventListener('click', () => {
				const answer = question.nextElementSibling
				const icon = question.querySelector('.faq-icon')

				if (!answer || !answer.classList) return

				// Закрываем все открытые ответы (кроме текущего)
				document.querySelectorAll('.faq-answer').forEach(item => {
					if (item !== answer && item.classList.contains('active')) {
						item.classList.remove('active')
						// для плавности перехода (если используется max-height)
						item.style.maxHeight = null
						const prevIcon =
							item.previousElementSibling &&
							item.previousElementSibling.querySelector('.faq-icon')
						if (prevIcon) prevIcon.classList.remove('rotate')
					}
				})

				// Переключаем текущий ответ с анимацией высоты
				const isActive = answer.classList.toggle('active')

				if (icon) icon.classList.toggle('rotate', isActive)

				if (isActive) {
					// открываем: вычисляем scrollHeight и ставим maxHeight для плавности
					answer.style.maxHeight = answer.scrollHeight + 'px'
				} else {
					// закрываем
					answer.style.maxHeight = null
				}
			})
		})

		// Если некоторые ответы помечены как active в HTML — установить maxHeight
		document.querySelectorAll('.faq-answer.active').forEach(a => {
			a.style.maxHeight = a.scrollHeight + 'px'
		})
	})()

	/**************************************************************************
	 * Копирование в буфер обмена + уведомление
	 * Ожидается элемент с id="copyNotification" для показа уведомления
	 * И (опционально) элемент с id="emailContact" для клика по email
	 **************************************************************************/
	;(function initCopyToClipboard() {
		const notification = document.getElementById('copyNotification')

		async function copyToClipboard(text, type = '') {
			try {
				if (navigator.clipboard && window.isSecureContext) {
					await navigator.clipboard.writeText(text)
				} else {
					// fallback
					const textArea = document.createElement('textarea')
					textArea.value = text
					textArea.style.position = 'fixed' // avoid scrolling to bottom
					textArea.style.opacity = '0'
					document.body.appendChild(textArea)
					textArea.focus()
					textArea.select()
					document.execCommand('copy')
					document.body.removeChild(textArea)
				}
				showNotification(`${type} скопирован в буфер обмена!`)
			} catch (err) {
				console.error('Ошибка копирования: ', err)
				showNotification('Не удалось скопировать в буфер обмена')
			}
		}

		function showNotification(message) {
			if (!notification) {
				// если уведомления нет — просто alert (необязательно)
				console.warn('copyNotification element not found')
				return
			}
			notification.textContent = message
			notification.classList.add('show')

			clearTimeout(notification._hideTimeout)
			notification._hideTimeout = setTimeout(() => {
				notification.classList.remove('show')
			}, 2000)
		}

		// Привязки (если элемент существует)
		const emailContact = document.getElementById('emailContact')
		if (emailContact) {
			emailContact.addEventListener('click', function (e) {
				// предотвращаем действие если это ссылка
				e.preventDefault && e.preventDefault()
				copyToClipboard('support@looksmm.ru', 'Email')
			})
		}

		// Экспорт функции на окно — если нужно использовать из других скриптов
		window.soctwickCopy = {
			copyToClipboard,
			showNotification,
		}
	})()

	/**************************************************************************
	 * Cookie banner / modal (инициализация)
	 * Код обёрнут в IIFE, использует элементы:
	 * - #swCookieWrap, #swCookie, #swAccept, #swDetails
	 * - #swModalBackdrop, #swModal, #swModalClose, #swModalAccept
	 **************************************************************************/
	;(function initCookieBanner() {
		const KEY = 'soctwick_cookie_v1'
		const wrap = document.getElementById('swCookieWrap')
		const btnAccept = document.getElementById('swAccept')
		const btnDetails = document.getElementById('swDetails')
		const modalBackdrop = document.getElementById('swModalBackdrop')
		const modal = document.getElementById('swModal')
		const modalClose = document.getElementById('swModalClose')
		const modalAccept = document.getElementById('swModalAccept')

		// если основных элементов нет — безопасно выходим
		if (
			!wrap ||
			!btnAccept ||
			!btnDetails ||
			!modalBackdrop ||
			!modal ||
			!modalClose ||
			!modalAccept
		) {
			// ничего не делаем, чтобы не ломать страницу
			return
		}

		function readConsent() {
			try {
				const raw = localStorage.getItem(KEY)
				if (!raw) return null
				const obj = JSON.parse(raw)
				if (obj.expires && Date.now() > obj.expires) {
					localStorage.removeItem(KEY)
					return null
				}
				return obj
			} catch (e) {
				return null
			}
		}

		function saveConsent(payload) {
			const expires = Date.now() + 365 * 24 * 60 * 60 * 1000
			const store = { ...payload, ts: Date.now(), expires }
			try {
				localStorage.setItem(KEY, JSON.stringify(store))
			} catch (e) {
				console.warn('Не удалось сохранить consent в localStorage', e)
			}
		}

		function showBanner() {
			wrap.style.display = 'flex'
			wrap.setAttribute('aria-hidden', 'false')
			// для доступности - поставить фокус на кнопку принять
			btnAccept.focus()
		}

		function hideBanner() {
			wrap.style.display = 'none'
			wrap.setAttribute('aria-hidden', 'true')
		}

		function openModal() {
			modalBackdrop.style.display = 'flex'
			modalBackdrop.setAttribute('aria-hidden', 'false')
			// allow CSS transition: добавляем класс "show" через RAF
			requestAnimationFrame(() => modal.classList.add('show'))
			// ставим фокус на кнопку закрытия/сохранения для клавиатурных пользователей
			modalClose.focus()
		}

		function closeModal() {
			modal.classList.remove('show')
			modalBackdrop.setAttribute('aria-hidden', 'true')
			// wait for transition end (220ms в вашем CSS)
			setTimeout(() => {
				modalBackdrop.style.display = 'none'
			}, 240)
		}

		function applyConsent() {
			const c = readConsent()
			window._sw_cookie_consent = c || null
			// Здесь можно добавить логику для включения/отключения аналитики
			// например: if (!c || !c.analytics) { disableAnalytics(); }
		}

		// Обработчики
		btnAccept.addEventListener('click', () => {
			saveConsent({ necessary: true, analytics: true, marketing: true })
			hideBanner()
			applyConsent()
		})

		btnDetails.addEventListener('click', openModal)

		modalAccept.addEventListener('click', () => {
			saveConsent({ necessary: true, analytics: true, marketing: true })
			closeModal()
			hideBanner()
			applyConsent()
		})

		modalClose.addEventListener('click', closeModal)

		modalBackdrop.addEventListener('click', e => {
			if (e.target === modalBackdrop) closeModal()
		})

		document.addEventListener('keydown', e => {
			if (e.key === 'Escape' && modalBackdrop.style.display === 'flex')
				closeModal()
		})

		// init: показать, если нет согласия
		if (!readConsent()) {
			showBanner()
		} else {
			applyConsent()
		}

		// expose API
		window.soctwickCookie = {
			getConsent: readConsent,
			openDetails: openModal,
		}
	})()
}) // end DOMContentLoaded
