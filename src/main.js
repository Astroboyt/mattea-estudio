import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ScrollSmoother } from 'gsap/ScrollSmoother'
import { SplitText } from 'gsap/SplitText'

gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText)

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

/* ------------------------------------------------------------
   FAQ accordion — runs regardless of motion preference
   ------------------------------------------------------------ */
document.querySelectorAll('.faq-item').forEach((item) => {
  const q = item.querySelector('.faq-q')
  const a = item.querySelector('.faq-a')
  if (!q || !a) return
  q.addEventListener('click', () => {
    const open = q.getAttribute('aria-expanded') === 'true'
    q.setAttribute('aria-expanded', String(!open))
    if (reduceMotion) {
      a.style.height = open ? '0px' : 'auto'
      return
    }
    gsap.to(a, {
      height: open ? 0 : 'auto',
      duration: 0.5,
      ease: 'power2.inOut',
      onComplete: () => ScrollTrigger.refresh(),
    })
  })
})

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
   Hero carousel — arrow buttons, native scroll + snap
   Runs regardless of motion preference (arrows are a control)
   ------------------------------------------------------------ */
const carousel = document.querySelector('.hero-carousel')
if (carousel) {
  const viewport = carousel.querySelector('.hero-carousel-viewport')
  const track = carousel.querySelector('.hero-carousel-track')
  const prev = carousel.querySelector('[data-dir="prev"]')
  const next = carousel.querySelector('[data-dir="next"]')

  const step = () => {
    const slide = track.querySelector('.hero-slide')
    const gap = parseFloat(getComputedStyle(track).columnGap) || 24
    return slide ? slide.getBoundingClientRect().width + gap : viewport.clientWidth
  }

  const sync = () => {
    const max = viewport.scrollWidth - viewport.clientWidth
    const x = viewport.scrollLeft
    prev.disabled = x <= 2
    next.disabled = x >= max - 2
  }

  prev.addEventListener('click', () => {
    viewport.scrollBy({ left: -step(), behavior: reduceMotion ? 'auto' : 'smooth' })
  })
  next.addEventListener('click', () => {
    viewport.scrollBy({ left: step(), behavior: reduceMotion ? 'auto' : 'smooth' })
  })

  viewport.addEventListener('scroll', () => {
    window.requestAnimationFrame(sync)
  }, { passive: true })
  window.addEventListener('resize', sync)
  window.addEventListener('load', sync)
  sync()

  /* Pointer drag-to-scroll (desktop) */
  let down = false, startX = 0, startScroll = 0, moved = false
  viewport.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch') return // native touch scroll handles this
    down = true; moved = false
    startX = e.clientX
    startScroll = viewport.scrollLeft
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
  /* Prevent click-through on images after a drag */
  viewport.addEventListener('click', (e) => {
    if (moved) { e.preventDefault(); e.stopPropagation() }
  }, true)
  viewport.style.cursor = 'grab'
}

/* ------------------------------------------------------------
   Everything below is motion — bail out politely if reduced
   ------------------------------------------------------------ */
if (reduceMotion) {
  document.documentElement.classList.remove('js')
} else {
  init()
}

function init() {
  /* Smooth scrolling */
  const smoother = ScrollSmoother.create({
    wrapper: '#smooth-wrapper',
    content: '#smooth-content',
    smooth: 1.2,
    effects: false,
    normalizeScroll: true,
  })

  /* Anchor links through the smoother */
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

  /* ----------------------------------------------------------
     Intro — header + hero
     Nav/logo/hero copy don't depend on font metrics, so they run
     immediately rather than waiting on the webfont request.
     ---------------------------------------------------------- */
  gsap.timeline({ defaults: { ease: 'power3.out' } })
    .to('[data-anim="hero-eyebrow"]', { opacity: 1, duration: 0.8 }, 0)
    .to('[data-anim="logo"]', { opacity: 1, duration: 0.8 }, 0.3)
    .to('[data-anim="nav"]', { opacity: 1, duration: 0.8, stagger: 0.1 }, 0.45)
    .to('[data-anim="hero-kicker"]', { opacity: 1, y: 0, duration: 0.9, startAt: { y: 24 } }, 0.6)
    .to('[data-anim="hero-lead"]', { opacity: 1, y: 0, duration: 0.9, startAt: { y: 24 } }, 0.7)
    .to('[data-anim="hero-cta"]', { opacity: 1, y: 0, duration: 0.9, startAt: { y: 24 } }, 0.85)

  /* SplitText genuinely needs real font metrics, but race the webfont
     request against a timeout so a slow/blocked font CDN can't leave
     the hero title (or any script heading) permanently invisible */
  const fontsReady = Promise.race([
    document.fonts.ready,
    new Promise((resolve) => setTimeout(resolve, 2000)),
  ])
  fontsReady.then(() => {
    const heroSplit = new SplitText('.hero-title', { type: 'lines', mask: 'lines' })
    gsap.set('.hero-title', { opacity: 1 })
    gsap.from(heroSplit.lines, { yPercent: 110, duration: 1.1, stagger: 0.12, ease: 'power3.out', delay: 0.15 })

    /* Script headings — word-by-word rise */
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

  /* ----------------------------------------------------------
     Scroll reveals
     ---------------------------------------------------------- */

  /* Text blocks, buttons, form fields, FAQ rows */
  gsap.utils.toArray('[data-anim="reveal"], [data-anim="field"], [data-anim="faq-item"]').forEach((el) => {
    gsap.to(el, {
      opacity: 1,
      y: 0,
      startAt: { y: 28 },
      duration: 0.9,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%' },
    })
  })

  /* Hand-drawn icons — settle in with a little rotation */
  gsap.utils.toArray('[data-anim="icon"]').forEach((el) => {
    gsap.to(el, {
      opacity: 1,
      rotation: 0,
      scale: 1,
      startAt: { rotation: -8, scale: 0.85, transformOrigin: '50% 50%' },
      duration: 1,
      ease: 'back.out(1.6)',
      scrollTrigger: { trigger: el, start: 'top 88%' },
    })
  })

  /* Rules draw themselves in */
  gsap.utils.toArray('.rule').forEach((el) => {
    gsap.to(el, {
      scaleX: 1,
      duration: 1.4,
      ease: 'power3.inOut',
      scrollTrigger: { trigger: el, start: 'top 92%' },
    })
  })

  /* Image clip reveals (everything except the pinned gallery) */
  gsap.utils.toArray('.img-reveal img').forEach((img) => {
    if (img.closest('.stories-track')) return
    gsap.fromTo(img,
      { clipPath: 'inset(100% 0% 0% 0%)', scale: 1.15 },
      {
        clipPath: 'inset(0% 0% 0% 0%)',
        scale: 1.05,
        duration: 1.3,
        ease: 'power3.inOut',
        scrollTrigger: { trigger: img.closest('.img-reveal'), start: 'top 85%' },
      }
    )
  })

  /* Gentle parallax on photos */
  gsap.utils.toArray('[data-parallax]').forEach((img) => {
    const amount = parseFloat(img.dataset.parallax) || 40
    gsap.fromTo(img,
      { yPercent: -amount / 12 },
      {
        yPercent: amount / 12,
        ease: 'none',
        scrollTrigger: {
          trigger: img.closest('.img-reveal'),
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      }
    )
  })

  /* ----------------------------------------------------------
     Where Stories Meet Walls — pinned horizontal gallery
     ---------------------------------------------------------- */
  const mm = gsap.matchMedia()

  mm.add('(min-width: 1024px)', () => {
    const pin = document.querySelector('.stories-pin')
    const track = document.querySelector('.stories-track')
    if (!pin || !track) return

    const dist = () => track.scrollWidth - window.innerWidth

    const tween = gsap.to(track, {
      x: () => -dist(),
      ease: 'none',
      scrollTrigger: {
        trigger: pin,
        start: 'top 12%',
        end: () => '+=' + dist(),
        scrub: 1,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    })

    /* Reveal the gallery images as the section arrives */
    gsap.to('.stories-track img', {
      clipPath: 'inset(0% 0% 0% 0%)',
      duration: 1.2,
      stagger: 0.12,
      ease: 'power3.inOut',
      scrollTrigger: { trigger: pin, start: 'top 70%' },
    })

    return () => tween.scrollTrigger && tween.scrollTrigger.kill()
  })

  mm.add('(max-width: 1023px)', () => {
    /* Native horizontal scroll — just make the images visible */
    gsap.to('.stories-track img', {
      clipPath: 'inset(0% 0% 0% 0%)',
      duration: 1,
      stagger: 0.1,
      ease: 'power3.out',
      scrollTrigger: { trigger: '.stories-pin', start: 'top 85%' },
    })
  })

  /* Remote images can shift layout timings — refresh once loaded */
  window.addEventListener('load', () => ScrollTrigger.refresh())
}
