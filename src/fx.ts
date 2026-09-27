// Motion layer: vanilla DOM + GSAP effects on top of the React markup. Returns a cleanup fn.
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'

gsap.registerPlugin(ScrollTrigger)
const PAW = '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5.5" cy="10" r="2.2"/><circle cx="9.5" cy="5.5" r="2.2"/><circle cx="14.5" cy="5.5" r="2.2"/><circle cx="18.5" cy="10" r="2.2"/><path d="M12 11c-3.5 0-6.5 4.2-6.5 6.8 0 2 1.6 2.7 3.3 2.2 1.2-.4 2.2-.9 3.2-.9s2 .5 3.2.9c1.7.5 3.3-.2 3.3-2.2C18.5 15.2 15.5 11 12 11Z"/></svg>'
const HEART = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21C4 15.5 2 11.5 3.5 8 5 4.6 9.5 4 12 7.2 14.5 4 19 4.6 20.5 8 22 11.5 20 15.5 12 21Z"/></svg>'
// Height of the golden's visible silhouette as a fraction of the triptych width
// (centre panel = 1.14/3.14 of the width, photo 1152/1100 tall, head starts 1.7% down).
const PET_K = .3737
const BREAKPOINT = 1000

export function startFx(): () => void {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
  const fine = matchMedia('(pointer: fine)').matches
  const off: Array<() => void> = []
  const on = (t: EventTarget, type: string, fn: (e: any) => void, opts?: AddEventListenerOptions) => {
    t.addEventListener(type, fn, opts); off.push(() => t.removeEventListener(type, fn, opts))
  }
  // Coalesce high-frequency events to one call per frame.
  const perFrame = <E,>(fn: (e: E) => void) => {
    let last: E | null = null
    return (e: E) => { if (last === null) requestAnimationFrame(() => { fn(last!); last = null }); last = e }
  }
  // will-change only while an element is being driven; dropped once it settles.
  const hot = (el: HTMLElement) => { el.style.willChange = 'transform' }
  const cool = (el: HTMLElement) => {
    const end = (e: TransitionEvent) => {
      if (!/^(translate|transform)$/.test(e.propertyName)) return
      el.removeEventListener('transitionend', end)
      if (!el.matches(':hover')) el.style.willChange = ''
    }
    el.addEventListener('transitionend', end)
  }
  const header = document.querySelector<HTMLElement>('.header')
  const hero = document.querySelector<HTMLElement>('.hero')

  // Preloader: leave once fonts are in, never longer than 2.2s.
  const loader = document.getElementById('preloader')
  // Resolves as the curtain starts rising, so the hero can animate in behind it.
  const intro = new Promise<void>(resolve => {
    if (!loader) return resolve()
    const done = () => { loader.classList.add('is-done'); setTimeout(() => loader.remove(), 900); resolve() }
    Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 2200))]).then(() => setTimeout(done, reduced ? 0 : 650))
  })

  // Desktop hero: size it so the golden's head never slides under the headline. Tall screens shrink the
  // hero to its content; short ones keep 100svh and narrow the pets instead (the green ledge fills the sides).
  const copy = hero?.querySelector<HTMLElement>('.hero-copy')
  const fit = () => {
    if (!hero || !copy) return
    if (innerWidth < BREAKPOINT) { hero.style.height = ''; hero.style.removeProperty('--tw'); return }
    const maxH = Math.min(1000, Math.max(640, innerHeight - (header?.offsetHeight ?? 0)))
    const copyB = copy.offsetTop + copy.offsetHeight + 22, W = hero.clientWidth
    let h = copyB + PET_K * W, w = W
    if (h > maxH) { h = maxH; w = Math.max(W * .62, (maxH - copyB) / PET_K) }
    hero.style.height = `${Math.round(h)}px`; hero.style.setProperty('--tw', `${Math.round(w)}px`)
  }
  fit()
  on(window, 'resize', perFrame(() => { fit(); ScrollTrigger.refresh() }))
  document.fonts.ready.then(() => { fit(); ScrollTrigger.refresh() })

  // Split headings into masked words (animated by GSAP below).
  if (!reduced) document.querySelectorAll<HTMLElement>('h1:not(.split), h2:not(.split)').forEach(h => {
    const walk = (node: Node) => [...node.childNodes].forEach(child => {
      if (child.nodeType === Node.TEXT_NODE && child.textContent!.trim()) {
        const frag = document.createDocumentFragment()
        child.textContent!.split(/(\s+)/).forEach(part => {
          if (!part) return
          if (/^\s+$/.test(part)) return frag.append(part)
          const w = document.createElement('span'); w.className = 'w'
          w.append(document.createElement('span')); w.firstElementChild!.textContent = part
          frag.append(w)
        })
        child.replaceWith(frag)
      } else if (child.nodeType === Node.ELEMENT_NODE && (child as Element).tagName !== 'svg') walk(child)
    })
    walk(h); h.classList.add('split')
  })
  // Count-up numbers.
  const counters = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return
    counters.unobserve(entry.target)
    const el = entry.target as HTMLElement, to = parseFloat(el.dataset.count!), dec = el.dataset.count!.includes('.') ? 1 : 0
    const fmt = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec })
    if (reduced) return
    const t0 = performance.now(), dur = 1600
    const tick = (t: number) => {
      const p = Math.min((t - t0) / dur, 1)
      el.textContent = fmt(to * (1 - Math.pow(1 - p, 4)))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }), { threshold: .6 })
  document.querySelectorAll('[data-count]').forEach(el => counters.observe(el))
  off.push(() => counters.disconnect())

  // Sticky header: glass when scrolled, hides on scroll down.
  let lastY = scrollY, ticking = false
  on(window, 'scroll', () => {
    if (ticking) return; ticking = true
    requestAnimationFrame(() => {
      const y = scrollY
      header?.classList.toggle('is-scrolled', y > 30)
      header?.classList.toggle('is-hidden', y > 500 && y > lastY && !header.querySelector('.nav-open'))
      lastY = y
      ticking = false
    })
  }, { passive: true })

  // Nav: highlight the section currently in the middle of the screen.
  const links = new Map([...document.querySelectorAll<HTMLAnchorElement>('.nav a[href^="#"]')].map(a => [a.hash, a]))
  const spy = new IntersectionObserver(entries => entries.forEach(e => {
    const a = links.get('#' + e.target.id)
    if (e.isIntersecting) { links.forEach(l => l.classList.remove('is-active')); a?.classList.add('is-active') } else a?.classList.remove('is-active')
  }), { rootMargin: '-45% 0px -50% 0px' })
  links.forEach((_, id) => { const s = document.querySelector(id); if (s) spy.observe(s) })
  off.push(() => spy.disconnect())

  // Floating call appears once the hero has mostly scrolled away.
  const call = document.querySelector('.floating-call')
  if (call && hero) {
    const io = new IntersectionObserver(([e]) => call.classList.toggle('is-shown', e.intersectionRatio < .3 && e.boundingClientRect.top < 0), { threshold: [0, .3, .6] })
    io.observe(hero); off.push(() => io.disconnect())
  } else call?.classList.add('is-shown')

  if (reduced) return () => off.forEach(f => f())

  // Smooth scroll (Lenis) driven by GSAP's ticker so ScrollTrigger stays in sync.
  const lenis = new Lenis({ lerp: .1, anchors: { offset: -80 } })
  const raf = (t: number) => lenis.raf(t * 1000)
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add(raf); gsap.ticker.lagSmoothing(0)
  const ctx = gsap.context(() => {
    // Headings: words rise out of their masks, 55ms apart. Hero waits for the preloader curtain.
    document.querySelectorAll<HTMLElement>('.split:not(.footer-mark)').forEach(h => {
      const inHero = !!h.closest('.hero')
      // Hero waits for the preloader (paused, played by intro); the rest auto-play when ScrollTrigger enters.
      const tween = gsap.from(h.querySelectorAll('.w>span'), {
        yPercent: 105, rotate: 4, transformOrigin: 'left bottom', duration: 1, ease: 'expo.out', stagger: .055, paused: inHero,
        onComplete: () => h.classList.add('is-drawn'),
        scrollTrigger: inHero ? undefined : { trigger: h, start: 'top 85%', once: true },
      })
      if (inHero) intro.then(() => tween.play())
    })
    // Manifesto: its lead sentence lights up word by word as it crosses the viewport.
    document.querySelectorAll<HTMLElement>('.large-copy:not(.lit)').forEach(el => {
      el.innerHTML = el.textContent!.split(/(\s+)/).map(w => /\S/.test(w) ? `<span class="lw">${w}</span>` : w).join('')
      el.classList.add('lit')
    })
    document.querySelectorAll('.large-copy').forEach(el => gsap.fromTo(el.querySelectorAll('.lw'), { opacity: .15 }, {
      opacity: 1, ease: 'none', stagger: .1, scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: true },
    }))
    // Hero copy lifts and fades as you leave.
    gsap.to('.hero-copy', { y: -120, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: .6 } })
    gsap.to('.hero-rating, .hero-hours', { y: -80, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: .6 } })
    // Marquee text leans with scroll velocity.
    const skew = gsap.quickTo('.ribbon-content', 'skewX', { duration: .4, ease: 'power3' })
    ScrollTrigger.create({ onUpdate: st => skew(gsap.utils.clamp(-8, 8, st.getVelocity() / -300)) })
    // Rounded sections rise into place like cards being laid down.
    document.querySelectorAll<HTMLElement>('.rise').forEach(s => gsap.fromTo(s, { scale: .94, '--r': '96px' }, {
      scale: 1, '--r': '40px', ease: 'none', scrollTrigger: { trigger: s, start: 'top bottom', end: 'top 55%', scrub: .5 },
    }))
    // The clinic clock spins through the hours as the section passes.
    gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: '.clinic-section', start: 'top bottom', end: 'bottom top', scrub: .8 } })
      .fromTo('.cc-m', { rotate: 0, svgOrigin: '100 100' }, { rotate: 1080, svgOrigin: '100 100' }, 0)
      .fromTo('.cc-h', { rotate: 40, svgOrigin: '100 100' }, { rotate: 130, svgOrigin: '100 100' }, 0)
      .fromTo('.clinic-clock', { rotate: -12 }, { rotate: 8 }, 0)
  })
  off.push(() => { ctx.revert(); gsap.ticker.remove(raf); lenis.destroy() })

  off.push(petLife({ fine, intro, perFrame, on }))

  if (fine) {
    // Magnetic buttons; the hover fill also grows from wherever the pointer enters.
    document.querySelectorAll<HTMLElement>('.button,.header-call,.floating-call,.review-next,.contact-phone-icon,.menu-toggle').forEach(el => {
      el.classList.add('magnetic')
      const aim = (e: PointerEvent) => { const r = el.getBoundingClientRect(); el.style.setProperty('--bx', `${e.clientX - r.left}px`); el.style.setProperty('--by', `${e.clientY - r.top}px`) }
      on(el, 'pointerenter', (e: PointerEvent) => { hot(el); aim(e) })
      on(el, 'pointermove', perFrame((e: PointerEvent) => {
        const r = el.getBoundingClientRect()
        el.style.translate = `${(e.clientX - r.left - r.width / 2) * .25}px ${(e.clientY - r.top - r.height / 2) * .25}px`
      }))
      on(el, 'pointerleave', (e: PointerEvent) => { aim(e); el.style.translate = ''; cool(el) })
    })

    // 3D tilt + glare on cards.
    document.querySelectorAll<HTMLElement>('[data-tilt]').forEach(el => {
      on(el, 'pointerenter', () => hot(el))
      on(el, 'pointermove', perFrame((e: PointerEvent) => {
        const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height
        el.style.setProperty('--rx', `${(.5 - y) * 10}deg`); el.style.setProperty('--ry', `${(x - .5) * 12}deg`)
        el.style.setProperty('--gx', `${x * 100}%`); el.style.setProperty('--gy', `${y * 100}%`)
        el.classList.add('is-tilting')
      }))
      on(el, 'pointerleave', () => { el.classList.remove('is-tilting'); el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); cool(el) })
    })

    // Mouse parallax on the hero decor: --mouse-x/--mouse-y (-1..1) eased toward the pointer, loop sleeps when settled.
    if (hero) {
      let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0
      const step = () => {
        cx += (tx - cx) * .08; cy += (ty - cy) * .08
        hero.style.setProperty('--mouse-x', cx.toFixed(3)); hero.style.setProperty('--mouse-y', cy.toFixed(3))
        raf = Math.abs(tx - cx) + Math.abs(ty - cy) > .002 ? requestAnimationFrame(step) : 0
      }
      const aim = (x: number, y: number) => { tx = x; ty = y; if (!raf) raf = requestAnimationFrame(step) }
      on(hero, 'pointermove', (e: PointerEvent) => aim(e.clientX / innerWidth * 2 - 1, e.clientY / innerHeight * 2 - 1))
      on(hero, 'pointerleave', () => aim(0, 0))
      off.push(() => cancelAnimationFrame(raf))
    }

    // Paw-print trail across the hero (not over the pets themselves).
    if (hero) {
      let px = 0, py = 0, flip = false
      on(hero, 'pointermove', perFrame((e: PointerEvent) => {
        if ((e.target as Element).closest('.pet-stage, a, button') || Math.hypot(e.clientX - px, e.clientY - py) < 70) return
        const angle = Math.atan2(e.clientY - py, e.clientX - px) * 180 / Math.PI + 90
        px = e.clientX; py = e.clientY; flip = !flip
        const r = hero.getBoundingClientRect(), p = document.createElement('span')
        p.className = 'paw-step'; p.innerHTML = PAW
        const side = flip ? 9 : -9, rad = angle * Math.PI / 180
        p.style.left = `${e.clientX - r.left + Math.cos(rad) * side}px`
        p.style.top = `${e.clientY - r.top + Math.sin(rad) * side}px`
        p.style.rotate = `${angle}deg`
        hero.append(p); setTimeout(() => p.remove(), 1400)
      }))
    }
  }

  // Ripple + heart burst on primary actions (touch included).
  on(document, 'pointerdown', (e: PointerEvent) => {
    const btn = (e.target as Element).closest<HTMLElement>('.button,.floating-call,.contact-phone,.header-call')
    if (!btn) return
    const r = btn.getBoundingClientRect(), rip = document.createElement('span')
    rip.className = 'ripple'; rip.style.left = `${e.clientX - r.left}px`; rip.style.top = `${e.clientY - r.top}px`
    btn.append(rip); setTimeout(() => rip.remove(), 700)
    for (let i = 0; i < 9; i++) {
      const h = document.createElement('span'), a = (i / 9) * Math.PI * 2 + Math.random() * .4, d = 45 + Math.random() * 45
      h.className = 'burst'; h.innerHTML = i % 3 ? HEART : PAW
      h.style.left = `${e.clientX}px`; h.style.top = `${e.clientY}px`
      h.style.setProperty('--dx', `${Math.cos(a) * d}px`); h.style.setProperty('--dy', `${Math.sin(a) * d - 20}px`)
      h.style.setProperty('--r', `${Math.random() * 90 - 45}deg`)
      document.body.append(h); setTimeout(() => h.remove(), 900)
    }
  })

  return () => off.forEach(f => f())
}

// The pets: each photo is split at its board line (see .pet-stage in CSS). Above the line the pet breathes,
// sways and leans toward the pointer (skew/scale pivot on the line, so nothing tears); below it a flat cover
// in the board colour lets the pet duck out of sight and peek back up. They react with hearts, never words.
function petLife({ fine, intro, perFrame, on }: {
  fine: boolean; intro: Promise<void>
  perFrame: <E>(fn: (e: E) => void) => (e: E) => void
  on: (t: EventTarget, type: string, fn: (e: any) => void, opts?: AddEventListenerOptions) => void
}) {
  const kill: Array<() => void> = []
  let lastTouch = 0
  const pets = [...document.querySelectorAll<HTMLElement>('.pet-stage')].map(stage => {
    const img = stage.querySelector('img')!, panel = stage.closest<HTMLElement>('.pet-panel')!
    const line = parseFloat(getComputedStyle(panel).getPropertyValue('--line'))
    const idle = [
      gsap.fromTo(img, { '--breath': 1 }, { '--breath': 1.018, duration: 1.5 + Math.random() * .8, ease: 'sine.inOut', yoyo: true, repeat: -1, paused: true }),
      gsap.fromTo(img, { '--sway': -.8 }, { '--sway': .8, duration: 2.6 + Math.random() * 1.4, ease: 'sine.inOut', yoyo: true, repeat: -1, paused: true }),
    ]
    let busy = false, visible = false
    const hearts = () => {
      for (let i = 0; i < 3; i++) {
        const h = document.createElement('span')
        h.className = 'pet-heart'; h.innerHTML = HEART
        h.style.setProperty('--hx', `${35 + Math.random() * 30}%`); h.style.setProperty('--hd', `${(Math.random() - .5) * 60}px`)
        h.style.setProperty('--hr', `${(Math.random() - .5) * 50}deg`); h.style.animationDelay = `${i * .12}s`
        panel.append(h); setTimeout(() => h.remove(), 1700)
      }
    }
    // Excited little stretch-and-settle; hearts only when someone actually played with the pet.
    const hop = (love = true) => {
      if (busy) return
      busy = true
      if (love) hearts()
      gsap.timeline({ onComplete: () => { busy = false } })
        .to(img, { '--perk': 1.075, duration: .16, ease: 'power2.out' })
        .to(img, { '--perk': .965, duration: .13, ease: 'power2.in' })
        .to(img, { '--perk': 1, duration: .7, ease: 'elastic.out(1, .4)' })
    }
    // Rise from behind the board: the cover hides whatever of the pet is below the line, then fades
    // away at the end so the paws "land" on the ledge.
    const peek = (delay = 0) => {
      busy = true
      gsap.timeline({ delay, onComplete: () => { busy = false } })
        .set(stage, { '--cin': 1 }).set(img, { '--peek': line, '--perk': 1 })
        .to(img, { '--peek': 0, duration: 1, ease: 'expo.out' })
        .fromTo(img, { '--perk': 1.09 }, { '--perk': 1, duration: 1, ease: 'elastic.out(1, .45)' }, .25)
        .to(stage, { '--cin': 0, duration: .35, ease: 'power1.out' }, .55)
    }
    gsap.set(stage, { '--cin': 1 }); gsap.set(img, { '--peek': line })
    on(stage, 'click', () => hop())
    on(stage, 'pointerenter', (e: PointerEvent) => { if (e.pointerType === 'mouse') hop() })
    on(stage, 'pointerdown', () => { lastTouch = performance.now() })
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; idle.forEach(t => visible ? t.play() : t.pause()) })
    io.observe(stage)
    kill.push(() => { io.disconnect(); idle.forEach(t => t.kill()) })
    return { stage, img, panel, line, hop, peek, isVisible: () => visible }
  })

  const heroPets = pets.filter(p => p.stage.closest('.hero'))
  const miniPets = pets.filter(p => !p.stage.closest('.hero'))
  // Entrance: dachshund, golden, cat pop up in turn; then the golden greets you with hearts.
  intro.then(() => {
    heroPets.forEach((p, i) => p.peek(.35 + i * .16))
    setTimeout(() => heroPets[1]?.hop(), 1900)
  })
  if (miniPets.length) {
    const st = ScrollTrigger.create({
      trigger: '.contact-pets', start: 'top 92%', once: true,
      onEnter: () => { miniPets.forEach((p, i) => p.peek(i * .2)); setTimeout(() => miniPets[0]?.hop(), 1300) },
    })
    kill.push(() => st.kill())
  }
  // Leaving the hero, the pets duck behind their boards (and pop back up on the way back).
  const duck = gsap.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: .6 } })
  heroPets.forEach((p, i) => duck
    .to(p.stage, { '--cduck': 1, duration: .25, ease: 'none' }, .1 + i * .08)
    .to(p.stage, { '--duck': p.line * .95, duration: .6, ease: 'power1.in' }, .1 + i * .08))

  // Now and then, when nobody is playing with them, a visible pet perks up (quietly, no hearts).
  const timer = setInterval(() => {
    if (document.hidden || performance.now() - lastTouch < 6000) return
    const awake = pets.filter(p => p.isVisible())
    awake[Math.floor(Math.random() * awake.length)]?.hop(false)
  }, 8000)

  // Heads follow the pointer: lean (skew) toward it, stronger the closer it gets.
  if (fine) on(window, 'pointermove', perFrame((e: PointerEvent) => {
    lastTouch = performance.now()
    pets.forEach(p => {
      if (!p.isVisible()) return
      const r = p.stage.getBoundingClientRect(), dx = (e.clientX - (r.left + r.width / 2)) / (r.width * 1.3)
      const near = e.clientY > r.top - 300 && e.clientY < r.bottom + 100
      gsap.to(p.img, { '--lean': near ? -gsap.utils.clamp(-1, 1, dx) * 3.2 : 0, duration: .9, ease: 'power3.out', overwrite: 'auto' })
    })
  }))

  return () => { clearInterval(timer); duck.scrollTrigger?.kill(); duck.kill(); kill.forEach(f => f()) }
}
