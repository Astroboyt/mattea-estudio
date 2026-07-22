import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ScrollSmoother } from 'gsap/ScrollSmoother'
import { SplitText } from 'gsap/SplitText'

gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText)

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
let smoother

/* ------------------------------------------------------------
   Lead form — front-end only for now
   ------------------------------------------------------------ */
const form = document.querySelector('.lead-form')
if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault()
    if (!form.reportValidity()) return
    const done = form.querySelector('.form-done')
    const parts = form.querySelectorAll('.field, .btn-send')
    done.hidden = false
    if (reduceMotion) {
      parts.forEach((p) => (p.style.display = 'none'))
      return
    }
    gsap.timeline()
      .to(parts, { opacity: 0, y: -12, stagger: 0.04, duration: 0.35, ease: 'power2.in' })
      .set(parts, { display: 'none' })
      .fromTo(done, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' })
      .add(() => ScrollTrigger.refresh())
  })
}

/* ------------------------------------------------------------
   Strip carousel — arrows + native scroll + drag
   Runs regardless of motion preference (arrows are a control)
   ------------------------------------------------------------ */
const strip = document.querySelector('.proj-strip')
if (strip) {
  const viewport = strip.querySelector('.proj-strip-viewport')
  const track = strip.querySelector('.proj-strip-track')
  const prev = strip.querySelector('[data-dir="prev"]')
  const next = strip.querySelector('[data-dir="next"]')

  const step = () => {
    const slide = track.querySelector('.proj-strip-slide')
    const gap = parseFloat(getComputedStyle(track).columnGap) || 36
    return slide ? slide.getBoundingClientRect().width + gap : viewport.clientWidth
  }
  const sync = () => {
    const max = viewport.scrollWidth - viewport.clientWidth
    const x = viewport.scrollLeft
    prev.disabled = x <= 2
    next.disabled = x >= max - 2
  }
  prev.addEventListener('click', () =>
    viewport.scrollBy({ left: -step(), behavior: reduceMotion ? 'auto' : 'smooth' }))
  next.addEventListener('click', () =>
    viewport.scrollBy({ left: step(), behavior: reduceMotion ? 'auto' : 'smooth' }))
  viewport.addEventListener('scroll', () => window.requestAnimationFrame(sync), { passive: true })
  window.addEventListener('resize', sync)
  window.addEventListener('load', sync)
  sync()

  /* Pointer drag-to-scroll (desktop) */
  let down = false, startX = 0, startScroll = 0, moved = false
  viewport.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch') return
    down = true; moved = false
    startX = e.clientX; startScroll = viewport.scrollLeft
    viewport.setPointerCapture(e.pointerId)
    viewport.style.cursor = 'grabbing'
  })
  viewport.addEventListener('pointermove', (e) => {
    if (!down) return
    const dx = e.clientX - startX
    if (Math.abs(dx) > 3) moved = true
    viewport.scrollLeft = startScroll - dx
  })
  const endDrag = (e) => {
    if (!down) return
    down = false
    viewport.style.cursor = ''
    try { viewport.releasePointerCapture(e.pointerId) } catch {}
  }
  viewport.addEventListener('pointerup', endDrag)
  viewport.addEventListener('pointercancel', endDrag)
  viewport.addEventListener('click', (e) => {
    if (moved) { e.preventDefault(); e.stopPropagation() }
  }, true)
  viewport.style.cursor = 'grab'
}

/* ------------------------------------------------------------
   Gallery — click (or Enter/Space) opens the full image
   ------------------------------------------------------------ */
const galleryItems = document.querySelectorAll('.gallery-item')
const lightbox = document.querySelector('[data-lightbox]')
if (galleryItems.length && lightbox) {
  const lightboxImg = lightbox.querySelector('.lightbox-img')
  const closeBtn = lightbox.querySelector('.lightbox-close')
  let lastFocused = null

  const openLightbox = (item) => {
    const img = item.querySelector('img')
    lightboxImg.src = img.src
    lightboxImg.alt = img.alt
    lastFocused = item
    lightbox.classList.add('is-open')
    document.body.classList.add('lightbox-open')
    if (smoother) smoother.paused(true)
    closeBtn.focus()
  }
  const closeLightbox = () => {
    lightbox.classList.remove('is-open')
    document.body.classList.remove('lightbox-open')
    lightboxImg.src = ''
    if (smoother) smoother.paused(false)
    if (lastFocused) lastFocused.focus()
  }

  galleryItems.forEach((item) => {
    item.addEventListener('click', () => openLightbox(item))
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        openLightbox(item)
      }
    })
  })
  closeBtn.addEventListener('click', closeLightbox)
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox()
  })
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.classList.contains('is-open')) closeLightbox()
  })
}

/* ------------------------------------------------------------
   Motion — bail out politely if reduced
   ------------------------------------------------------------ */
if (reduceMotion) {
  document.documentElement.classList.remove('js')
} else {
  init()
}

function init() {
  smoother = ScrollSmoother.create({
    wrapper: '#smooth-wrapper',
    content: '#smooth-content',
    smooth: 1.2,
    effects: false,
    normalizeScroll: true,
  })

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    const id = link.getAttribute('href')
    if (id.length < 2) return
    link.addEventListener('click', (e) => {
      const target = document.querySelector(id)
      if (!target) return
      e.preventDefault()
      smoother.scrollTo(target, true, 'top 100px')
    })
  })

  document.fonts.ready.then(() => {
    /* Title — word by word */
    document.querySelectorAll('[data-anim="words"]').forEach((el) => {
      const split = new SplitText(el, { type: 'words', mask: 'words' })
      gsap.from(split.words, {
        yPercent: 110,
        duration: 0.9,
        stagger: 0.06,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 85%' },
      })
    })
    ScrollTrigger.refresh()
  })

  /* Header nav + logo fade in */
  gsap.to('[data-anim="logo"], [data-anim="nav"]', {
    opacity: 1, duration: 0.8, stagger: 0.08, ease: 'power3.out', delay: 0.2,
  })

  /* Text/button reveals */
  gsap.utils.toArray('[data-anim="reveal"], [data-anim="field"]').forEach((el) => {
    gsap.to(el, {
      opacity: 1, y: 0, startAt: { y: 28 },
      duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%' },
    })
  })

  /* Hand-drawn icons — settle in with a little rotation */
  gsap.utils.toArray('[data-anim="icon"]').forEach((el) => {
    gsap.to(el, {
      opacity: 1, rotation: 0, scale: 1,
      startAt: { rotation: -8, scale: 0.85, transformOrigin: '50% 50%' },
      duration: 1, ease: 'back.out(1.6)',
      scrollTrigger: { trigger: el, start: 'top 88%' },
    })
  })

  /* Rules draw in */
  gsap.utils.toArray('.rule').forEach((el) => {
    gsap.to(el, {
      scaleX: 1, duration: 1.4, ease: 'power3.inOut',
      scrollTrigger: { trigger: el, start: 'top 92%' },
    })
  })

  /* Image clip reveals */
  gsap.utils.toArray('.img-reveal img').forEach((img) => {
    gsap.fromTo(img,
      { clipPath: 'inset(100% 0% 0% 0%)', scale: 1.15 },
      {
        clipPath: 'inset(0% 0% 0% 0%)', scale: 1.05,
        duration: 1.3, ease: 'power3.inOut',
        scrollTrigger: { trigger: img.closest('.img-reveal'), start: 'top 85%' },
      })
  })

  /* Parallax */
  gsap.utils.toArray('[data-parallax]').forEach((img) => {
    const amount = parseFloat(img.dataset.parallax) || 40
    gsap.fromTo(img,
      { yPercent: -amount / 12 },
      {
        yPercent: amount / 12, ease: 'none',
        scrollTrigger: {
          trigger: img.closest('.img-reveal'),
          start: 'top bottom', end: 'bottom top', scrub: true,
        },
      })
  })

  window.addEventListener('load', () => ScrollTrigger.refresh())
}
