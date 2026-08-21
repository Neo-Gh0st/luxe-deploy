/* ============================================
   LUXE Restaurant — Main JavaScript
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav()
  initScrollAnimations()
  initMenuFilters()
  initBookingForm()
  initGuestCounter()
  initHallCards()
  initTimeSlots()
  initAuth()
})

/* ---- Auth ---- */
const API_URL = 'https://auth.restaurant-luxe.pp.ua'

function initAuth() {
  if (document.getElementById('googleBtn') || document.getElementById('authError')) {
    initAuthPage()
  }
  if (document.getElementById('userName') || document.getElementById('userAvatar')) {
    initDashboardPage()
  }
  if (document.getElementById('adminLoginForm') || document.getElementById('adminLoginView')) {
    initAdminPage()
  }

  initHeaderAuth()
}

function showAuthError(message) {
  const el = document.getElementById('authError')
  if (!el) return
  el.textContent = message
  el.style.display = 'block'
}

function initAuthPage() {
  const params = new URLSearchParams(window.location.search)
  const error = params.get('error')
  if (error) {
    const messages = {
      access_denied: 'Доступ запрещён. Попробуйте ещё раз.',
      invalid_state: 'Ошибка проверки сессии. Попробуйте снова.',
      token_exchange: 'Не удалось получить доступ от Google. Попробуйте снова.',
      userinfo: 'Не удалось получить данные профиля. Попробуйте снова.',
      server_error: 'Внутренняя ошибка сервера. Попробуйте позже.'
    }
    showAuthError(messages[error] || 'Ошибка входа. Попробуйте ещё раз.')
  }

  fetch(`${API_URL}/api/auth/me`, { credentials: 'include' })
    .then(res => {
      if (res.ok) window.location.href = 'dashboard.html'
    })
    .catch(() => {})

  const googleBtn = document.getElementById('googleBtn')
  if (googleBtn && window.google && window.google.accounts) {
    google.accounts.id.initialize({
      client_id: '933452972431-2k4duni61277l1qkr4tsn25ibqgemhc8.apps.googleusercontent.com',
      callback: handleGoogleCredential,
      ux_mode: 'popup'
    })
    google.accounts.id.renderButton(googleBtn, {
      theme: 'outline',
      size: 'large',
      shape: 'pill',
      width: 320
    })
  } else if (googleBtn) {
    googleBtn.innerHTML = '<button class="auth-btn" onclick="location.href=\'' + API_URL + '/api/auth/google\'">Продолжить с Google</button>'
  }
}

function handleGoogleCredential(response) {
  if (!response || !response.credential) {
    showAuthError('Не удалось получить данные от Google. Попробуйте ещё раз.')
    return
  }

  fetch(`${API_URL}/api/auth/google/token`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: response.credential })
  })
    .then(res => res.json().then(data => ({ ok: res.ok, data })))
    .then(({ ok, data }) => {
      if (ok) {
        window.location.href = 'dashboard.html'
      } else {
        showAuthError(data.error || 'Ошибка входа. Попробуйте ещё раз.')
      }
    })
    .catch(() => {
      showAuthError('Нет связи с сервером. Попробуйте позже.')
    })
}

function fillDashboard(user) {
  const nameEl = document.getElementById('userName')
  const emailEl = document.getElementById('userEmail')
  const avatarEl = document.getElementById('userAvatar')

  if (nameEl) nameEl.textContent = user.name || user.email
  if (emailEl) emailEl.textContent = user.email

  if (avatarEl) {
    if (user.avatar) {
      avatarEl.innerHTML = ''
      const img = document.createElement('img')
      img.src = user.avatar
      img.alt = 'Аватар'
      img.style.width = '100%'
      img.style.height = '100%'
      img.style.borderRadius = '50%'
      img.style.objectFit = 'cover'
      avatarEl.appendChild(img)
    } else {
      avatarEl.textContent = (user.name || user.email || 'U')[0].toUpperCase()
    }
  }
}

function initDashboardPage() {
  fetch(`${API_URL}/api/auth/me`, { credentials: 'include' })
    .then(res => {
      if (!res.ok) {
        window.location.href = 'auth.html'
        return null
      }
      return res.json()
    })
    .then(data => {
      if (data) fillDashboard(data.user)
    })
    .catch(() => {
      window.location.href = 'auth.html'
    })

  const logoutBtn = document.getElementById('logoutBtn')
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      fetch(`${API_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' })
        .finally(() => {
          window.location.href = 'index.html'
        })
    })
  }
}

function initAdminPage() {
  const loginView = document.getElementById('adminLoginView')
  const panelView = document.getElementById('adminPanelView')
  if (!loginView || !panelView) return

  fetch(`${API_URL}/api/admin/check`, { credentials: 'include' })
    .then(res => {
      if (res.ok) showAdminPanel()
      else showAdminLogin()
    })
    .catch(() => showAdminLogin())

  const form = document.getElementById('adminLoginForm')
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault()
      const username = document.getElementById('adminUsername').value.trim()
      const password = document.getElementById('adminPassword').value
      const errorEl = document.getElementById('adminLoginError')
      const submitBtn = form.querySelector('button[type="submit"]')
      const originalText = submitBtn ? submitBtn.textContent : 'Войти'

      if (submitBtn) {
        submitBtn.disabled = true
        submitBtn.textContent = 'Вход...'
      }
      if (errorEl) errorEl.style.display = 'none'

      fetch(`${API_URL}/api/admin/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
        .then(res => res.json().then(data => ({ ok: res.ok, data })))
        .then(({ ok, data }) => {
          if (ok) {
            showAdminPanel()
          } else {
            if (errorEl) {
              errorEl.textContent = data.error || 'Неверный логин или пароль'
              errorEl.style.display = 'block'
            }
          }
        })
        .catch(() => {
          if (errorEl) {
            errorEl.textContent = 'Нет связи с сервером. Попробуйте позже.'
            errorEl.style.display = 'block'
          }
        })
        .finally(() => {
          if (submitBtn) {
            submitBtn.disabled = false
            submitBtn.textContent = originalText
          }
        })
    })
  }

  const logoutBtn = document.getElementById('adminLogoutBtn')
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      fetch(`${API_URL}/api/admin/logout`, { method: 'POST', credentials: 'include' })
        .finally(() => {
          showAdminLogin()
        })
    })
  }
}

function showAdminLogin() {
  const loginView = document.getElementById('adminLoginView')
  const panelView = document.getElementById('adminPanelView')
  if (loginView) {
    loginView.hidden = false
    loginView.style.display = 'flex'
  }
  if (panelView) {
    panelView.hidden = true
    panelView.style.display = 'none'
  }
}

function showAdminPanel() {
  const loginView = document.getElementById('adminLoginView')
  const panelView = document.getElementById('adminPanelView')
  if (loginView) {
    loginView.hidden = true
    loginView.style.display = 'none'
  }
  if (panelView) {
    panelView.hidden = false
    panelView.style.display = 'block'
    panelView.querySelectorAll('.animate-on-scroll').forEach(el => el.classList.add('animate-on-scroll--visible'))
  }

  fetch(`${API_URL}/api/admin/users`, { credentials: 'include' })
    .then(res => {
      if (!res.ok) throw new Error('Unauthorized')
      return res.json()
    })
    .then(data => {
      const wrap = document.getElementById('adminTableWrap')
      const empty = document.getElementById('adminEmpty')
      const tbody = document.getElementById('adminTableBody')
      if (!tbody) return

      if (!data.users || !data.users.length) {
        if (wrap) wrap.hidden = true
        if (empty) {
          empty.hidden = false
          empty.classList.add('animate-on-scroll--visible')
        }
        return
      }

      const providers = { google: 'Google' }
      tbody.innerHTML = data.users.map(u => {
        const avatar = u.avatar
          ? `<img class="admin-avatar" src="${u.avatar}" alt="">`
          : `<span style="display:inline-block;width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,var(--color-gold),var(--color-gold-dark));color:var(--color-bg);font-weight:700;text-align:center;line-height:36px;">${(u.name || u.email || 'U')[0].toUpperCase()}</span>`
        const created = new Date(u.created_at).toLocaleDateString('ru-RU')
        return `<tr>
          <td>${avatar} ${u.name || '—'}</td>
          <td>${u.email}</td>
          <td>${providers[u.provider] || u.provider}</td>
          <td>${created}</td>
        </tr>`
      }).join('')

      if (wrap) {
        wrap.hidden = false
        wrap.classList.add('animate-on-scroll--visible')
      }
      if (empty) empty.hidden = true
    })
    .catch(() => {
      const empty = document.getElementById('adminEmpty')
      if (empty) {
        empty.hidden = false
        empty.classList.add('animate-on-scroll--visible')
      }
    })
}

function initHeaderAuth() {
  const cta = document.querySelector('.header__cta')
  if (!cta) return

  fetch(`${API_URL}/api/auth/me`, { credentials: 'include' })
    .then(res => {
      if (!res.ok) return null
      return res.json()
    })
    .then(data => {
      if (data && data.user) {
        cta.textContent = 'Кабинет'
        cta.href = 'dashboard.html'
      }
    })
    .catch(() => {})
}

/* ---- Mobile Navigation ---- */
function initMobileNav() {
  const burger = document.getElementById('burger')
  const mobileNav = document.getElementById('mobileNav')
  if (!burger || !mobileNav) return

  burger.addEventListener('click', () => {
    mobileNav.classList.toggle('mobile-nav--open')
    burger.classList.toggle('active')
  })

  mobileNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobileNav.classList.remove('mobile-nav--open')
      burger.classList.remove('active')
    })
  })
}

/* ---- Scroll Animations (IntersectionObserver) ---- */
function initScrollAnimations() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-on-scroll--visible')
        }
      })
    },
    { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
  )

  document.querySelectorAll('.animate-on-scroll').forEach(el => {
    observer.observe(el)
  })
}

/* ---- Menu Filters ---- */
function initMenuFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn')
  const menuCards = document.querySelectorAll('.menu-grid .card')
  if (!filterBtns.length || !menuCards.length) return

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('filter-btn--active'))
      btn.classList.add('filter-btn--active')

      const filter = btn.dataset.filter

      menuCards.forEach(card => {
        if (filter === 'all' || card.dataset.category === filter) {
          card.style.display = ''
          card.style.animation = 'fadeIn 0.4s ease forwards'
        } else {
          card.style.display = 'none'
        }
      })
    })
  })
}

/* ---- Booking Form ---- */
function initBookingForm() {
  const form = document.getElementById('bookingForm')
  const dateInput = document.getElementById('bookingDate')
  const timeGroup = document.getElementById('timeSlotsGroup')
  const successEl = document.getElementById('bookingSuccess')
  const resetBtn = document.getElementById('bookingReset')

  if (!form) return

  if (dateInput) {
    const today = new Date().toISOString().split('T')[0]
    dateInput.setAttribute('min', today)

    dateInput.addEventListener('change', () => {
      if (dateInput.value) {
        timeGroup.style.display = ''
        timeGroup.style.animation = 'slideUp 0.5s ease forwards'
      } else {
        timeGroup.style.display = 'none'
      }
    })
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault()

    const selectedTime = document.querySelector('.time-slot--active')
    if (!selectedTime) {
      alert('Пожалуйста, выберите время')
      return
    }

    const submitBtn = document.getElementById('bookingSubmit')
    submitBtn.textContent = 'Отправка...'
    submitBtn.disabled = true

    setTimeout(() => {
      form.style.display = 'none'
      successEl.style.display = ''
      successEl.style.animation = 'slideUp 0.5s ease forwards'
    }, 1200)
  })

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      form.reset()
      form.style.display = ''
      successEl.style.display = 'none'
      timeGroup.style.display = 'none'
      document.querySelectorAll('.time-slot--active').forEach(el => el.classList.remove('time-slot--active'))
      const submitBtn = document.getElementById('bookingSubmit')
      if (submitBtn) {
        submitBtn.textContent = 'Отправить заявку'
        submitBtn.disabled = false
      }
    })
  }
}

/* ---- Guest Counter ---- */
function initGuestCounter() {
  const minus = document.getElementById('guestMinus')
  const plus = document.getElementById('guestPlus')
  const count = document.getElementById('guestCount')
  if (!minus || !plus || !count) return

  let value = parseInt(count.textContent) || 2

  minus.addEventListener('click', () => {
    if (value > 1) {
      value--
      count.textContent = value
    }
  })

  plus.addEventListener('click', () => {
    if (value < 20) {
      value++
      count.textContent = value
    }
  })
}

/* ---- Hall Cards ---- */
function initHallCards() {
  const hallCards = document.querySelectorAll('.hall-card')
  if (!hallCards.length) return

  hallCards.forEach(card => {
    card.addEventListener('click', () => {
      hallCards.forEach(c => c.classList.remove('hall-card--active'))
      card.classList.add('hall-card--active')
    })
  })
}

/* ---- Time Slots ---- */
function initTimeSlots() {
  const slots = document.querySelectorAll('.time-slot')
  if (!slots.length) return

  slots.forEach(slot => {
    slot.addEventListener('click', () => {
      if (slot.classList.contains('time-slot--disabled')) return
      slots.forEach(s => s.classList.remove('time-slot--active'))
      slot.classList.add('time-slot--active')
    })
  })

  slots.forEach(slot => {
    if (Math.random() < 0.3) {
      slot.classList.add('time-slot--disabled')
    }
  })
}
