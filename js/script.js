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

  // Admin login form
  const form = document.getElementById('adminLoginForm')
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault()
      const username = document.getElementById('adminUsername').value.trim()
      const password = document.getElementById('adminPassword').value
      const errorEl = document.getElementById('adminLoginError')
      const submitBtn = form.querySelector('button[type="submit"]')
      const originalText = submitBtn ? submitBtn.textContent : 'Увійти'

      if (submitBtn) {
        submitBtn.disabled = true
        submitBtn.textContent = 'Вхід...'
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
              errorEl.textContent = data.error || 'Невірний логін або пароль'
              errorEl.style.display = 'block'
            }
          }
        })
        .catch(() => {
          if (errorEl) {
            errorEl.textContent = 'Немає зв’язку із сервером. Спробуйте пізніше.'
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

  // Admin logout
  const logoutBtn = document.getElementById('adminLogoutBtn')
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      fetch(`${API_URL}/api/admin/logout`, { method: 'POST', credentials: 'include' })
        .finally(() => {
          showAdminLogin()
        })
    })
  }

  // Tabs switching
  initAdminTabs()
  initStaffModal()
  initUserDeleteModal()
  initBookingFilters()
  initHallFilters()
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

  loadAdminStats()
  loadAdminBookings('all')
  loadAdminTables('all')
  loadAdminStaff()
  loadAdminStopList()
  loadAdminUsers()
}

/* ---- Admin: Stats ---- */
function loadAdminStats() {
  fetch(`${API_URL}/api/admin/stats`, { credentials: 'include' })
    .then(res => res.json())
    .then(data => {
      if (!data.ok || !data.stats) return
      const s = data.stats
      const bEl = document.getElementById('statTodayBookings')
      const gEl = document.getElementById('statTodayGuests')
      const tEl = document.getElementById('statTablesOccupied')
      const stEl = document.getElementById('statStaffOnShift')

      if (bEl) bEl.textContent = s.today_bookings
      if (gEl) gEl.textContent = s.today_guests
      if (tEl) tEl.textContent = `${s.occupied_tables} / ${s.total_tables}`
      if (stEl) stEl.textContent = `${s.staff_on_shift} / ${s.total_staff}`
    })
    .catch(() => {})
}

/* ---- Admin: Tabs ---- */
function initAdminTabs() {
  const tabBtns = document.querySelectorAll('.admin-tab-btn')
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('admin-tab-btn--active'))
      btn.classList.add('admin-tab-btn--active')

      const tab = btn.dataset.tab
      const allTabs = ['Bookings', 'Tables', 'Staff', 'Stoplist', 'Users']
      allTabs.forEach(t => {
        const content = document.getElementById(`tabContent${t}`)
        if (!content) return
        if (t.toLowerCase() === tab.toLowerCase()) {
          content.hidden = false
          content.style.display = 'block'
        } else {
          content.hidden = true
          content.style.display = 'none'
        }
      })
    })
  })
}

/* ---- Admin: Bookings ---- */
function initBookingFilters() {
  const filterBtns = document.querySelectorAll('#bookingFilterGroup .filter-btn')
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('filter-btn--active'))
      btn.classList.add('filter-btn--active')
      loadAdminBookings(btn.dataset.filter)
    })
  })

  const refreshBtn = document.getElementById('btnRefreshBookings')
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      const activeBtn = document.querySelector('#bookingFilterGroup .filter-btn--active')
      const filter = activeBtn ? activeBtn.dataset.filter : 'all'
      loadAdminBookings(filter)
      loadAdminStats()
    })
  }
}

function loadAdminBookings(statusFilter = 'all') {
  fetch(`${API_URL}/api/admin/bookings?status=${statusFilter}`, { credentials: 'include' })
    .then(res => res.json())
    .then(data => {
      const wrap = document.getElementById('adminBookingsWrap')
      const empty = document.getElementById('adminBookingsEmpty')
      const tbody = document.getElementById('adminBookingsBody')
      if (!tbody) return

      if (!data.bookings || !data.bookings.length) {
        if (wrap) wrap.hidden = true
        if (empty) empty.hidden = false
        return
      }

      if (wrap) wrap.hidden = false
      if (empty) empty.hidden = true

      tbody.innerHTML = data.bookings.map(b => {
        const dateStr = new Date(b.booking_date).toLocaleDateString('uk-UA')
        const statusMap = {
          pending: '<span class="status-badge status-badge--pending">⏳ Очікує</span>',
          confirmed: '<span class="status-badge status-badge--confirmed">✅ Підтверджена</span>',
          completed: '<span class="status-badge status-badge--completed">🏁 Завершена</span>',
          cancelled: '<span class="status-badge status-badge--cancelled">❌ Відхилена</span>'
        }

        const tgBadge = b.is_phone_verified
          ? `<div class="tg-verified-tag">✓ Telegram Verified</div>`
          : ''

        const tableText = b.table_num ? `Стіл #${b.table_num}` : '—'

        return `<tr>
          <td>
            <strong>${b.guest_name || 'Гість'}</strong>
            <div style="font-size:0.75rem;color:var(--color-gold);letter-spacing:1px;">${b.booking_code}</div>
          </td>
          <td>
            <div>${b.phone || '—'}</div>
            ${tgBadge}
          </td>
          <td>${dateStr} <br><span style="color:var(--color-gold);font-weight:600;">${b.booking_time}</span></td>
          <td><strong>${b.guests_count}</strong> чол.</td>
          <td>${b.hall} <br><small style="color:var(--color-text-muted);">${tableText}</small></td>
          <td style="max-width:180px;font-size:0.85rem;color:var(--color-text-muted);">${b.notes || '—'}</td>
          <td>${statusMap[b.status] || b.status}</td>
          <td>
            <div class="admin-actions">
              ${b.status !== 'confirmed' ? `<button class="act-btn act-btn--confirm" onclick="updateBooking(${b.id}, 'confirmed')">✓ Підтвердити</button>` : ''}
              ${b.status !== 'completed' ? `<button class="act-btn act-btn--done" onclick="updateBooking(${b.id}, 'completed')">🏁 Завершити</button>` : ''}
              ${b.status !== 'cancelled' ? `<button class="act-btn act-btn--cancel" onclick="updateBooking(${b.id}, 'cancelled')">✕ Відхилити</button>` : ''}
              <button class="act-btn act-btn--delete" onclick="deleteBookingItem(${b.id})">🗑️</button>
            </div>
          </td>
        </tr>`
      }).join('')
    })
    .catch(() => {})
}

window.updateBooking = function(id, status) {
  fetch(`${API_URL}/api/admin/bookings/${id}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  })
    .then(res => res.json())
    .then(() => {
      const activeBtn = document.querySelector('#bookingFilterGroup .filter-btn--active')
      loadAdminBookings(activeBtn ? activeBtn.dataset.filter : 'all')
      loadAdminStats()
    })
}

window.deleteBookingItem = function(id) {
  if (!confirm('Видалити цей запис бронювання?')) return
  fetch(`${API_URL}/api/admin/bookings/${id}`, {
    method: 'DELETE',
    credentials: 'include'
  })
    .then(res => res.json())
    .then(() => {
      const activeBtn = document.querySelector('#bookingFilterGroup .filter-btn--active')
      loadAdminBookings(activeBtn ? activeBtn.dataset.filter : 'all')
      loadAdminStats()
    })
}

/* ---- Admin: Tables ---- */
function initHallFilters() {
  const hallBtns = document.querySelectorAll('#hallFilterGroup .filter-btn')
  hallBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      hallBtns.forEach(b => b.classList.remove('filter-btn--active'))
      btn.classList.add('filter-btn--active')
      loadAdminTables(btn.dataset.hall)
    })
  })
}

function loadAdminTables(hallFilter = 'all') {
  fetch(`${API_URL}/api/admin/tables`, { credentials: 'include' })
    .then(res => res.json())
    .then(data => {
      const grid = document.getElementById('adminTablesGrid')
      if (!grid || !data.tables) return

      let list = data.tables
      if (hallFilter && hallFilter !== 'all') {
        list = list.filter(t => t.hall === hallFilter)
      }

      const statusBtnLabels = {
        free: '🟢 Вільний (клік для зміни)',
        occupied: '🔴 Зайнятий (клік для зміни)',
        reserved: '🟡 Заброньований (клік для зміни)'
      }

      grid.innerHTML = list.map(t => {
        return `<div class="table-card table-card--${t.status}">
          <div class="table-card__num">Стіл #${t.number}</div>
          <div class="table-card__hall">${t.hall}</div>
          <div class="table-card__cap">👥 До ${t.capacity} персон</div>
          <button type="button" class="table-card__status-btn table-card__status-btn--${t.status}" onclick="cycleTableStatus(${t.id}, '${t.status}')">
            ${statusBtnLabels[t.status] || t.status}
          </button>
        </div>`
      }).join('')
    })
    .catch(() => {})
}

window.cycleTableStatus = function(id, currentStatus) {
  const nextStatusMap = {
    free: 'occupied',
    occupied: 'reserved',
    reserved: 'free'
  }
  const nextStatus = nextStatusMap[currentStatus] || 'free'

  fetch(`${API_URL}/api/admin/tables/${id}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: nextStatus })
  })
    .then(res => res.json())
    .then(() => {
      const activeBtn = document.querySelector('#hallFilterGroup .filter-btn--active')
      loadAdminTables(activeBtn ? activeBtn.dataset.hall : 'all')
      loadAdminStats()
    })
}

/* ---- Admin: Staff ---- */
function loadAdminStaff() {
  fetch(`${API_URL}/api/admin/staff`, { credentials: 'include' })
    .then(res => res.json())
    .then(data => {
      const tbody = document.getElementById('adminStaffBody')
      if (!tbody || !data.staff) return

      tbody.innerHTML = data.staff.map(s => {
        const isOnShift = s.shift_status === 'on'
        const shiftBtn = isOnShift
          ? `<button class="act-btn act-btn--confirm" style="font-weight:600;" onclick="toggleStaffShift(${s.id}, 'off')">🟢 На зміні</button>`
          : `<button class="act-btn" style="color:var(--color-text-muted);" onclick="toggleStaffShift(${s.id}, 'on')">⚪ Вихідний</button>`

        return `<tr>
          <td><strong>${s.name}</strong></td>
          <td><span class="admin-badge admin-badge--admin" style="font-size:0.75rem;">${s.role}</span></td>
          <td>${s.phone || '—'}</td>
          <td>${shiftBtn}</td>
          <td style="color:var(--color-text-muted);font-size:0.85rem;">${s.notes || '—'}</td>
          <td>
            <button class="act-btn act-btn--delete" onclick="deleteStaffItem(${s.id})">🗑️ Видалити</button>
          </td>
        </tr>`
      }).join('')
    })
    .catch(() => {})
}

window.toggleStaffShift = function(id, newStatus) {
  fetch(`${API_URL}/api/admin/staff/${id}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ shift_status: newStatus })
  })
    .then(res => res.json())
    .then(() => {
      loadAdminStaff()
      loadAdminStats()
    })
}

window.deleteStaffItem = function(id) {
  if (!confirm('Видалити співробітника зі штату?')) return
  fetch(`${API_URL}/api/admin/staff/${id}`, {
    method: 'DELETE',
    credentials: 'include'
  })
    .then(res => res.json())
    .then(() => {
      loadAdminStaff()
      loadAdminStats()
    })
}

function initStaffModal() {
  const modal = document.getElementById('addStaffModal')
  const openBtn = document.getElementById('btnOpenAddStaffModal')
  const cancelBtn = document.getElementById('btnCancelStaff')
  const closeBg = document.getElementById('closeStaffModalBg')
  const form = document.getElementById('addStaffForm')

  if (!modal) return

  const closeModal = () => {
    modal.hidden = true
    modal.style.display = 'none'
  }

  if (openBtn) {
    openBtn.addEventListener('click', () => {
      modal.hidden = false
      modal.style.display = 'flex'
    })
  }

  if (cancelBtn) cancelBtn.addEventListener('click', closeModal)
  if (closeBg) closeBg.addEventListener('click', closeModal)

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault()
      const name = document.getElementById('staffName').value.trim()
      const role = document.getElementById('staffRole').value
      const phone = document.getElementById('staffPhone').value.trim()
      const shift_status = document.getElementById('staffShift').value
      const notes = document.getElementById('staffNotes').value.trim()

      fetch(`${API_URL}/api/admin/staff`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, role, phone, shift_status, notes })
      })
        .then(res => res.json())
        .then(data => {
          if (data.ok) {
            form.reset()
            closeModal()
            loadAdminStaff()
            loadAdminStats()
          } else {
            alert(data.error || 'Помилка додавання співробітника')
          }
        })
    })
  }
}

/* ---- Admin: Stop List ---- */
function loadAdminStopList() {
  fetch(`${API_URL}/api/admin/stop-list`, { credentials: 'include' })
    .then(res => res.json())
    .then(data => {
      const grid = document.getElementById('adminStoplistGrid')
      if (!grid || !data.items) return

      grid.innerHTML = data.items.map(item => {
        const isAvailable = !item.is_stopped
        return `<div class="stoplist-card ${item.is_stopped ? 'stoplist-card--stopped' : ''}">
          <div>
            <div class="stoplist-card__title">${item.item_name}</div>
            <div class="stoplist-card__cat">${item.category} • <span style="color:${isAvailable ? '#81c784' : '#e57373'};">${isAvailable ? 'В наявності' : 'У стоп-листі'}</span></div>
          </div>
          <div>
            <label class="switch">
              <input type="checkbox" ${isAvailable ? 'checked' : ''} onchange="toggleStopItem(${item.id}, !this.checked)">
              <span class="slider"></span>
            </label>
          </div>
        </div>`
      }).join('')
    })
    .catch(() => {})
}

window.toggleStopItem = function(id, is_stopped) {
  fetch(`${API_URL}/api/admin/stop-list/${id}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_stopped })
  })
    .then(res => res.json())
    .then(() => {
      loadAdminStopList()
    })
}

/* ---- Admin: Users ---- */
function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

let adminUsersCache = {}
let pendingDeleteUserId = null

function loadAdminUsers() {
  fetch(`${API_URL}/api/admin/users`, { credentials: 'include' })
    .then(res => {
      if (!res.ok) throw new Error('Unauthorized')
      return res.json()
    })
    .then(data => {
      const wrap = document.getElementById('adminTableWrap')
      const empty = document.getElementById('adminEmpty')
      const tbody = document.getElementById('adminTableBody')
      const countEl = document.getElementById('adminUsersCount')
      if (!tbody) return

      if (!data.users || !data.users.length) {
        adminUsersCache = {}
        if (countEl) countEl.textContent = '0'
        if (wrap) wrap.hidden = true
        if (empty) {
          empty.hidden = false
          empty.classList.add('animate-on-scroll--visible')
        }
        return
      }

      const providers = { google: 'Google' }
      adminUsersCache = {}
      data.users.forEach(u => { adminUsersCache[u.id] = u })
      if (countEl) countEl.textContent = data.users.length

      tbody.innerHTML = data.users.map(u => {
        const avatar = u.avatar
          ? `<img class="admin-avatar" src="${escapeHtml(u.avatar)}" alt="">`
          : `<span class="admin-avatar admin-avatar--fallback">${escapeHtml((u.name || u.email || 'U')[0].toUpperCase())}</span>`
        const created = new Date(u.created_at).toLocaleDateString('uk-UA')
        return `<tr>
          <td>${avatar} ${escapeHtml(u.name || '—')}</td>
          <td>${escapeHtml(u.email)}</td>
          <td>${providers[u.provider] || escapeHtml(u.provider)}</td>
          <td>${created}</td>
          <td>
            <button class="act-btn act-btn--delete user-delete-btn" onclick="deleteUserItem(${u.id})">🗑️ Прибрати клієнта</button>
          </td>
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

window.deleteUserItem = function(id) {
  const user = adminUsersCache[id]
  const name = user ? (user.name || user.email) : 'клієнта'
  const textEl = document.getElementById('confirmUserText')
  if (textEl) {
    textEl.innerHTML = `Клієнта <strong style="color:var(--color-text);">${escapeHtml(name)}</strong> буде повністю видалено з бази даних разом із сесіями авторизації. Дію неможливо скасувати.`
  }
  pendingDeleteUserId = id
  const modal = document.getElementById('confirmUserModal')
  if (modal) {
    modal.hidden = false
    modal.style.display = 'flex'
  }
}

function closeConfirmUserModal() {
  pendingDeleteUserId = null
  const modal = document.getElementById('confirmUserModal')
  if (modal) {
    modal.hidden = true
    modal.style.display = 'none'
  }
}

function initUserDeleteModal() {
  const modal = document.getElementById('confirmUserModal')
  if (!modal) return

  const cancelBtn = document.getElementById('confirmUserCancel')
  const okBtn = document.getElementById('confirmUserOk')
  const backdrop = document.getElementById('confirmUserBackdrop')

  if (cancelBtn) cancelBtn.addEventListener('click', closeConfirmUserModal)
  if (backdrop) backdrop.addEventListener('click', closeConfirmUserModal)

  if (okBtn) {
    okBtn.addEventListener('click', () => {
      if (pendingDeleteUserId == null) return
      const id = pendingDeleteUserId
      okBtn.disabled = true
      okBtn.textContent = 'Видалення...'

      fetch(`${API_URL}/api/admin/users/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })
        .then(res => res.json().then(data => ({ ok: res.ok, data })))
        .then(({ ok, data }) => {
          if (ok) {
            closeConfirmUserModal()
            loadAdminUsers()
          } else {
            alert(data.error || 'Не вдалося видалити клієнта')
          }
        })
        .catch(() => {
          alert('Немає зв’язку із сервером. Спробуйте пізніше.')
        })
        .finally(() => {
          okBtn.disabled = false
          okBtn.textContent = 'Видалити назавжди'
        })
    })
  }
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
        cta.textContent = 'Кабінет'
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

/* ---- Booking Form with Telegram Verification ---- */
let bookingPollTimer = null

function initBookingForm() {
  const form = document.getElementById('bookingForm')
  const dateInput = document.getElementById('bookingDate')
  const timeGroup = document.getElementById('timeSlotsGroup')
  const telegramStep = document.getElementById('bookingTelegramStep')
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
      alert('Будь ласка, оберіть час')
      return
    }

    const guest_name = (document.getElementById('bookingName')?.value || '').trim() || 'Гість'
    const booking_date = dateInput.value
    const booking_time = selectedTime.textContent.trim()
    const guests_count = parseInt(document.getElementById('guestCount')?.textContent) || 2
    const phone = (document.getElementById('bookingPhone')?.value || '').trim()
    const activeHallCard = document.querySelector('.hall-card--active')
    const hall = activeHallCard ? (activeHallCard.dataset.hall || activeHallCard.querySelector('.hall-card__name')?.textContent || 'Основний зал') : 'Основний зал'
    const notes = (document.getElementById('bookingNotes')?.value || '').trim()

    const submitBtn = document.getElementById('bookingSubmit')
    if (submitBtn) {
      submitBtn.textContent = 'Відправка...'
      submitBtn.disabled = true
    }

    fetch(`${API_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guest_name,
        booking_date,
        booking_time,
        guests_count,
        phone,
        hall,
        notes
      })
    })
      .then(res => res.json().then(data => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok || !data.booking) {
          alert(data.error || 'Помилка під час відправки заявки')
          if (submitBtn) {
            submitBtn.textContent = 'Забронювати столик'
            submitBtn.disabled = false
          }
          return
        }

        const b = data.booking
        form.style.display = 'none'

        if (telegramStep) {
          telegramStep.style.display = 'block'
          telegramStep.style.animation = 'slideUp 0.5s ease forwards'

          const codeDisplay = document.getElementById('bookingCodeDisplay')
          if (codeDisplay) codeDisplay.textContent = b.booking_code

          const tgBtn = document.getElementById('bookingTelegramBtn')
          if (tgBtn && data.telegramUrl) tgBtn.href = data.telegramUrl

          startBookingStatusPolling(b.booking_code, b)
        }
      })
      .catch(() => {
        alert('Немає зв’язку із сервером. Спробуйте пізніше.')
        if (submitBtn) {
          submitBtn.textContent = 'Забронювати столик'
          submitBtn.disabled = false
        }
      })
  })

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (bookingPollTimer) clearInterval(bookingPollTimer)
      form.reset()
      form.style.display = ''
      if (telegramStep) telegramStep.style.display = 'none'
      if (successEl) successEl.style.display = 'none'
      timeGroup.style.display = 'none'
      document.querySelectorAll('.time-slot--active').forEach(el => el.classList.remove('time-slot--active'))
      const submitBtn = document.getElementById('bookingSubmit')
      if (submitBtn) {
        submitBtn.textContent = 'Забронювати столик'
        submitBtn.disabled = false
      }
    })
  }
}

function startBookingStatusPolling(bookingCode, initialBooking) {
  if (bookingPollTimer) clearInterval(bookingPollTimer)

  bookingPollTimer = setInterval(() => {
    fetch(`${API_URL}/api/bookings/${bookingCode}/status`)
      .then(res => res.json())
      .then(data => {
        if (data.ok && data.booking) {
          const b = data.booking
          if (b.is_phone_verified || b.status === 'confirmed') {
            clearInterval(bookingPollTimer)
            showFinalBookingSuccess(b)
          }
        }
      })
      .catch(() => {})
  }, 2500)
}

function showFinalBookingSuccess(booking) {
  const telegramStep = document.getElementById('bookingTelegramStep')
  const successEl = document.getElementById('bookingSuccess')
  const detailsEl = document.getElementById('bookingSuccessDetails')

  if (telegramStep) telegramStep.style.display = 'none'
  if (successEl) {
    successEl.style.display = 'block'
    successEl.style.animation = 'slideUp 0.5s ease forwards'
  }

  if (detailsEl) {
    const dateStr = new Date(booking.booking_date).toLocaleDateString('uk-UA')
    detailsEl.innerHTML = `
      Номер <strong>${booking.phone || ''}</strong> успішно підтверджено через Telegram! ✨<br>
      📅 <strong>${dateStr}</strong> о <strong>${booking.booking_time}</strong> (${booking.hall})<br>
      👥 Гостей: <strong>${booking.guests_count}</strong> | Код броні: <strong>${booking.booking_code}</strong>
    `
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
}
