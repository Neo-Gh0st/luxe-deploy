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
})

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
