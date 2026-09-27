import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { ArrowDown, ArrowRight, ArrowUpRight, CalendarCheck, Camera, Cat, Check, CheckCheck, Clock as ClockIcon, Copy, Heart, HeartHandshake, Instagram, MapPin, MessageCircle, MoonStar, Navigation, PawPrint, Phone, ShoppingBag, Sparkles, Star, Stethoscope, Sun, Syringe } from 'lucide-react'
import './style.css'
import { startFx } from './fx'
import { brand, fullAddress, reviews, reviewTopics } from './brand'

const phone = brand.phone.href
const talk = brand.links.talk
const imageRoot = 'https://polo-pecan-73837341.figma.site/_assets/v11/'
const score = brand.rating.score.toLocaleString('pt-BR', { minimumFractionDigits: 1 })

// line: where the green board starts, as % of the photo's height (measured from the PNGs).
// fill: how much of the care window height the pet takes (the dachshund is wide, so it gets less).
// board: the board's flat colour, painted behind/over the photo so the pet can peek up from behind it.
const pets = {
  dachshund: { src: imageRoot + '8d44b25186ef45a5789c74668fb781cea4e1ff49.png', w: 870, h: 762, line: 50.13, board: '#a7e8b0', fill: .76, alt: 'Cachorrinho dachshund com as patas apoiadas em um painel verde' },
  golden: { src: imageRoot + '96745c4e72ad5c5208e53a885df797fd82cd854a.png?h=1024', w: 977, h: 1024, line: 67.01, board: '#003907', fill: .9, alt: 'Golden retriever sorridente com as patas sobre um painel verde-escuro' },
  cat: { src: imageRoot + '81bd2e7a66b58f3d8f3ad78fd1ebf01af8dfdee1.png', w: 870, h: 816, line: 53.43, board: '#a7e8b0', fill: .82, alt: 'Gatinho laranja curioso espiando por cima de um painel verde' },
}
type PetData = typeof pets.cat

function Pet({ pet, className, decorative = false, children }: { pet: PetData; className: string; decorative?: boolean; children?: React.ReactNode }) {
  return <div className={`pet-panel ${className}`} style={{ '--line': pet.line + '%', '--board': pet.board } as React.CSSProperties}>
    <div className="pet-stage">
      <img src={pet.src} alt={decorative ? '' : pet.alt} width={pet.w} height={pet.h} draggable={false} loading={decorative ? 'lazy' : undefined} fetchPriority={decorative ? undefined : 'high'} />
      <span className="pet-cover" />
    </div>
    {children}
  </div>
}

// Two copies of an icon: hovering the parent slides one out and the other in.
function Swap({ children, dir = 'diag', className = '' }: { children: React.ReactElement; dir?: 'diag' | 'x' | 'y'; className?: string }) {
  return <span className={`swap swap-${dir} ${className}`} aria-hidden="true">{children}{children}</span>
}

function Logo({ light = false }: { light?: boolean }) {
  return <a className={`logo ${light ? 'logo-light' : ''}`} href="#inicio" aria-label={`${brand.name}, início`}>
    <span className="logo-mark"><PawPrint strokeWidth={1.7} /><Heart className="logo-heart" fill="currentColor" /></span>
    <span className="logo-type">{brand.wordmark}<span>{brand.descriptor}</span></span>
  </a>
}

function Stars({ size = 14 }: { size?: number }) {
  return <span className="stars" aria-hidden="true">{Array.from({ length: 5 }, (_, i) => <Star key={i} size={size} fill="currentColor" strokeWidth={0} />)}</span>
}

function clinicNow() {
  const p = Object.fromEntries(new Intl.DateTimeFormat('pt-BR', { timeZone: brand.timeZone, hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(new Date()).map(x => [x.type, x.value]))
  return { h: +p.hour, m: +p.minute, s: +p.second, label: `${p.hour}:${p.minute}` }
}

// Hands start at the current local time; CSS keeps them turning from there.
function Clock({ start }: { start: ReturnType<typeof clinicNow> }) {
  const a = { h: (start.h % 12 + start.m / 60) * 30, m: (start.m + start.s / 60) * 6, s: start.s * 6 }
  return <svg className="clock" viewBox="0 0 64 64" aria-hidden="true">
    <circle className="clock-face" cx="32" cy="32" r="29" />
    {Array.from({ length: 12 }, (_, i) => <line key={i} className="clock-tick" x1="32" y1="6" x2="32" y2={i % 3 ? 9 : 11} transform={`rotate(${i * 30} 32 32)`} />)}
    <line className="hand hand-h" x1="32" y1="32" x2="32" y2="19" style={{ '--a0': a.h + 'deg' } as React.CSSProperties} />
    <line className="hand hand-m" x1="32" y1="32" x2="32" y2="11" style={{ '--a0': a.m + 'deg' } as React.CSSProperties} />
    <line className="hand hand-s" x1="32" y1="37" x2="32" y2="9" style={{ '--a0': a.s + 'deg' } as React.CSSProperties} />
    <circle cx="32" cy="32" r="2.4" className="clock-pin" />
  </svg>
}

// Illustrated neighbourhood map (the demo address is fictional, so no real map is embedded).
// The route draws itself when the section appears; `run` remounts it to replay the drawing.
const mapX = [0, 150, 330, 470, 640, 800], mapY = [0, 140, 300, 430, 560]
const cellKind = (i: number, j: number) => i === 1 && j === 1 ? 'park' : i === 4 && j === 0 ? 'water' : 'block'
function DemoMap({ run }: { run: number }) {
  return <svg className="demo-map" viewBox="0 0 800 560" preserveAspectRatio="xMinYMid slice" role="img" aria-label={`Mapa ilustrativo: a clínica fica na ${brand.address.street}, ${brand.address.district}`}>
    <rect width="800" height="560" className="map-land" />
    {mapX.slice(0, -1).flatMap((x, i) => mapY.slice(0, -1).map((y, j) => {
      // Blocks sit 13 units off each street's centre line; the avenue at y=300 is 6 units wider.
      const kind = cellKind(i, j), pad = 13, w = mapX[i + 1] - x, h = mapY[j + 1] - y
      if (kind === 'water') return <path key="water" className="map-water" d="M660 0H800V118C760 132 700 120 676 92 658 70 654 30 660 0Z" />
      return <rect key={`${i}-${j}`} className={`map-${kind}`} x={x + pad} y={y + (j === 2 ? pad + 6 : pad)} width={w - pad * 2} height={h - pad * 2 - (j === 1 ? 6 : 0)} rx="14" />
    }))}
    {[[188, 178], [292, 178], [186, 258], [294, 258], [240, 266]].map(([cx, cy]) => <circle key={cx + '-' + cy} className="map-tree" cx={cx} cy={cy} r="15" />)}
    <g className="map-streets">
      {mapX.slice(1, -1).map(x => <line key={x} x1={x} y1="0" x2={x} y2="560" />)}
      {mapY.slice(1, -1).filter(y => y !== 300).map(y => <line key={y} x1="0" y1={y} x2="800" y2={y} />)}
      <line className="map-avenue" x1="0" y1="300" x2="800" y2="300" />
    </g>
    <text className="map-label" x="560" y="304" textAnchor="middle">AV. PRIMAVERA</text>
    <text className="map-label" x="474" y="220" textAnchor="middle" transform="rotate(-90 474 220)">RUA DAS ACÁCIAS</text>
    <text className="map-label map-label-park" x="240" y="196" textAnchor="middle">PRAÇA</text>
    <g key={run}>
      <path className="map-route map-route-casing" pathLength={1} d="M150 232V300H470V372" />
      <path className="map-route" pathLength={1} d="M150 232V300H470V372" />
    </g>
    <g className="map-you"><circle className="map-you-ring" cx="150" cy="232" r="10" /><circle cx="150" cy="232" r="8" /><text x="168" y="226">você</text></g>
    <ellipse className="map-pin-shadow" cx="470" cy="383" rx="11" ry="4" />
    <g className="map-pin">
      <path d="M470 380c-5-12-26-24-26-44a26 26 0 0 1 52 0c0 20-21 32-26 44Z" />
      <g transform="translate(459 324) scale(.92)" className="map-pin-paw"><circle cx="5.5" cy="10" r="2.2" /><circle cx="9.5" cy="5.5" r="2.2" /><circle cx="14.5" cy="5.5" r="2.2" /><circle cx="18.5" cy="10" r="2.2" /><path d="M12 11c-3.5 0-6.5 4.2-6.5 6.8 0 2 1.6 2.7 3.3 2.2 1.2-.4 2.2-.9 3.2-.9s2 .5 3.2.9c1.7.5 3.3-.2 3.3-2.2C18.5 15.2 15.5 11 12 11Z" /></g>
    </g>
  </svg>
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [activeCare, setActiveCare] = useState(0)
  // Care tabs rotate on their own while the section is on screen, until someone picks one.
  const [careAuto, setCareAuto] = useState(true)
  const [careHold, setCareHold] = useState(false)
  const [careSeen, setCareSeen] = useState(false)
  const [review, setReview] = useState({ i: 0, out: -1 })
  const [reviewPaused, setReviewPaused] = useState(false)
  const [routeRun, setRouteRun] = useState(0)
  const [clockStart] = useState(clinicNow)
  const [now, setNow] = useState(clockStart)
  const copyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const progress = useRef<HTMLDivElement>(null)
  const choices = useRef<HTMLDivElement>(null)
  const careBox = useRef<HTMLDivElement>(null)
  const header = useRef<HTMLElement>(null)
  const deck = useRef<HTMLDivElement>(null)
  const drag = useRef<number | null>(null)

  const care = [
    { title: 'Consultas e exames', sub: 'Check-ups, exames e retornos', icon: Stethoscope, pet: pets.golden, badge: 'Consulta sem pressa', text: 'Um lugar para cuidar de quem faz parte da sua família.', detail: 'Tempo para examinar com calma, explicar cada passo e tirar todas as dúvidas. Do primeiro filhote ao companheiro de muitos anos.', list: ['Check-up completo', 'Exames de sangue e de imagem', 'Retorno acompanhado'], action: 'Agendar consulta', href: talk },
    { title: 'Atendimento 24 horas', sub: 'Emergências a qualquer hora', icon: MoonStar, pet: pets.dachshund, badge: 'Plantão aberto agora', text: 'De dia, de noite. Quando o seu melhor amigo precisar.', detail: 'Plantão todos os dias, inclusive feriados. Numa emergência, ligue antes de sair de casa: a equipe já se prepara para receber vocês.', list: ['Veterinário de plantão', 'Prioridade para emergências', 'Internação monitorada'], action: 'Ligar agora', href: phone },
    { title: 'Vacinas e prevenção', sub: 'Carteirinha sempre em dia', icon: Syringe, pet: pets.cat, badge: 'A gente lembra das doses', text: 'Prevenir também é uma forma de dizer “eu te amo”.', detail: 'Vacinas, vermifugação e orientação para cada fase da vida, com a carteirinha organizada e aviso quando chegar a próxima dose.', list: ['Vacinas para cães e gatos', 'Vermífugo e antipulgas', 'Lembrete das próximas doses'], action: 'Falar com a equipe', href: talk },
    { title: 'Pet shop, banho e tosa', sub: 'Ração, acessórios e banho', icon: ShoppingBag, pet: pets.golden, badge: 'Sai cheiroso e feliz', text: 'Mais cuidado para os pequenos momentos do dia a dia.', detail: 'Rações, petiscos, acessórios e banho e tosa com hora marcada, no mesmo endereço da clínica. Seu pet sai cheiroso, e você sai tranquilo.', list: ['Banho e tosa com hora marcada', 'Rações e petiscos', 'Acessórios e higiene'], action: 'Consultar a equipe', href: talk },
  ]
  const item = care[activeCare]
  const steps = [
    { title: 'Você chama.', icon: Phone, text: 'Ligue ou mande mensagem, de dia ou de madrugada. A equipe já orienta o que fazer antes de você sair de casa.' },
    { title: 'A gente recebe.', icon: Stethoscope, text: 'Triagem logo na chegada, prioridade para emergências e um veterinário explicando cada passo, sem pressa.' },
    { title: 'O cuidado continua.', icon: HeartHandshake, text: 'Notícias enquanto ele está com a gente, retorno agendado e lembrete das próximas vacinas.' },
  ]
  const go = (i: number) => setReview(r => { const next = (i + reviews.length) % reviews.length; return next === r.i ? r : { i: next, out: r.i } })
  const daytime = now.h >= 6 && now.h < 18

  useEffect(() => {
    const stopFx = startFx()
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target) } })
    }, { threshold: .12 })
    document.querySelectorAll('.reveal, [data-reveal]').forEach(element => observer.observe(element))
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      if (progress.current) progress.current.style.transform = `translateX(${(max > 0 ? window.scrollY / max : 0) * 100 - 100}%)`
    }
    const tick = setInterval(() => setNow(clinicNow()), 15000)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { stopFx(); observer.disconnect(); clearInterval(tick); window.removeEventListener('scroll', onScroll); clearTimeout(copyTimer.current) }
  }, [])

  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setMenuOpen(false) }
    window.addEventListener('keydown', onEscape)
    return () => window.removeEventListener('keydown', onEscape)
  }, [])

  useEffect(() => {
    if (reviewPaused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = setTimeout(() => go(review.i + 1), 7000)
    return () => clearTimeout(t)
  }, [review.i, reviewPaused])

  useEffect(() => {
    const box = careBox.current
    if (!box) return
    const io = new IntersectionObserver(([e]) => setCareSeen(e.isIntersecting), { threshold: .35 })
    io.observe(box)
    return () => io.disconnect()
  }, [])
  useEffect(() => {
    if (!careAuto || careHold || !careSeen || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = setTimeout(() => setActiveCare(a => (a + 1) % care.length), 6500)
    return () => clearTimeout(t)
  }, [activeCare, careAuto, careHold, careSeen])

  // Mobile menu: full-height sheet under the header; the page behind it stops scrolling.
  useEffect(() => {
    const bottom = header.current?.getBoundingClientRect().bottom ?? 72
    document.documentElement.style.setProperty('--hb', `${Math.max(0, bottom)}px`)
    document.documentElement.classList.toggle('menu-open', menuOpen)
    window.dispatchEvent(new CustomEvent('fx:menu', { detail: menuOpen }))
  }, [menuOpen])

  // Sliding highlight behind the active care option.
  useLayoutEffect(() => {
    const box = choices.current
    if (!box) return
    const place = () => {
      const b = box.querySelectorAll<HTMLElement>('.care-choice')[activeCare]
      box.style.setProperty('--py', b.offsetTop + 'px'); box.style.setProperty('--ph', b.offsetHeight + 'px')
    }
    place()
    const ro = new ResizeObserver(place); ro.observe(box)
    return () => ro.disconnect()
  }, [activeCare])

  async function copyAddress() {
    try { await navigator.clipboard.writeText(fullAddress); setCopied(true); clearTimeout(copyTimer.current); copyTimer.current = setTimeout(() => setCopied(false), 3000) }
    catch { window.prompt('Copie o endereço:', fullAddress) }
  }

  // Swipe the review deck (touch or mouse drag).
  const deckHandlers = {
    onPointerDown: (e: React.PointerEvent) => { if (e.button) return; drag.current = e.clientX; deck.current!.classList.add('is-dragging'); e.currentTarget.setPointerCapture(e.pointerId) },
    onPointerMove: (e: React.PointerEvent) => { if (drag.current !== null) deck.current!.style.setProperty('--drag', String(e.clientX - drag.current)) },
    onPointerUp: (e: React.PointerEvent) => {
      if (drag.current === null) return
      const dx = e.clientX - drag.current
      drag.current = null; deck.current!.classList.remove('is-dragging'); deck.current!.style.setProperty('--drag', '0')
      if (dx < -60) go(review.i + 1); else if (dx > 60) go(review.i - 1)
    },
  }

  const navLinks = [['Cuidados', '#cuidados'], ['Diferenciais', '#diferenciais'], ['Como funciona', '#como-funciona'], ['Avaliações', '#avaliacoes'], ['Onde estamos', '#localizacao']]
  const closeMenu = () => setMenuOpen(false)

  return <>
    <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
    <div className="reading-progress" ref={progress}><PawPrint size={14} /></div>
    <div className="topbar">
      <div className="topbar-inner">
        <span className="topbar-status"><i className="live-dot" /> Plantão aberto agora<span className="topbar-hide"> · <time>{now.label}</time></span></span>
        <a className="topbar-link topbar-hide" href="#localizacao"><MapPin size={13} /> {brand.address.street} · {brand.address.district}</a>
        <span className="topbar-link topbar-hide"><Syringe size={13} /> Clínica, vacinas, banho e pet shop no mesmo lugar</span>
        <a className="topbar-link" href="#avaliacoes"><Star size={12} fill="currentColor" strokeWidth={0} /> {score} · {brand.rating.count} avaliações</a>
      </div>
    </div>
    <header className="header" id="inicio" ref={header}>
      <div className="header-inner">
        <Logo />
        <nav className={menuOpen ? 'nav nav-open' : 'nav'} id="main-nav" aria-label="Navegação principal" data-lenis-prevent>
          <span className="nav-pill" aria-hidden="true" />
          {navLinks.map(([label, href], i) => <a href={href} key={href} style={{ '--i': i } as React.CSSProperties} onClick={closeMenu}><small className="nav-num" aria-hidden="true">0{i + 1}</small><span className="roll"><span data-text={label}>{label}</span></span><ArrowUpRight className="nav-arrow" size={22} aria-hidden="true" /></a>)}
          <div className="nav-extra" style={{ '--i': navLinks.length } as React.CSSProperties}>
            <span className="nav-extra-status"><i className="live-dot" /> Plantão aberto agora · <time>{now.label}</time></span>
            <a className="button button-orange" href={phone} onClick={closeMenu}><Phone size={17} /><span className="label">Ligar {brand.phone.label}</span></a>
            <a className="button button-green" href={talk} onClick={closeMenu}><CalendarCheck size={17} /><span className="label">Agendar consulta</span></a>
            <span className="nav-extra-address"><MapPin size={15} /> {brand.address.street} · {brand.address.district}</span>
          </div>
        </nav>
        <div className="header-actions">
          <a className="header-phone" href={phone} aria-label={`Emergência 24 horas: ligar para ${brand.phone.label}`}><span className="header-phone-icon"><Phone size={16} /></span><span className="header-phone-text"><small>Emergência 24h</small><strong>{brand.phone.label}</strong></span></a>
          <a className="header-call" href={talk}><CalendarCheck size={16} /><span>Agendar consulta</span><Swap><ArrowUpRight size={17} /></Swap></a>
          <button className={`menu-toggle ${menuOpen ? 'is-open' : ''}`} aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'} aria-expanded={menuOpen} aria-controls="main-nav" onClick={() => setMenuOpen(!menuOpen)}><span /><span /></button>
        </div>
      </div>
    </header>

    <main id="conteudo">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-glow" aria-hidden="true" /><div className="hero-floaters" aria-hidden="true" data-speed="1.4">{Array.from({ length: 8 }, (_, i) => i % 2 ? <Heart key={i} fill="currentColor" strokeWidth={0} /> : <PawPrint key={i} />)}</div>
        <div className="hero-copy">
          <h1 id="hero-title"><span className="word-line">Amor que cuida.</span><span className="word-line">A <em>qualquer<svg className="scribble" viewBox="0 0 200 20" preserveAspectRatio="none" aria-hidden="true"><path pathLength={1} d="M4 14C38 7 78 5 118 8s62 7 78-2" /></svg></em> hora<span className="orange-period">.</span></span></h1>
          <p>Para eles, somos o mundo.<br className="mobile-break" /> Por eles, estamos aqui. <strong>24 horas.</strong></p>
          <a className="button button-orange hero-cta hero-cta-flow" href={talk}><MessageCircle size={17} /><span className="label">Conte com a gente</span><Swap className="button-arrow"><ArrowUpRight size={18} /></Swap></a>
          <div className="hero-status">
            <a className="status-pill" href="#avaliacoes"><Star size={14} fill="currentColor" strokeWidth={0} /><strong>{score}</strong><span>· {brand.rating.count} avaliações</span></a>
            <span className="status-pill"><i className="live-dot" /> Aberto agora · <time>{now.label}</time></span>
            <a className="status-pill status-pill-call" href={phone}><Phone size={13} /> Emergência <strong>{brand.phone.label}</strong></a>
          </div>
        </div>

        <a className="hero-rating" href="#avaliacoes">
          <span className="rating-top"><span className="rating-badge"><Heart size={17} fill="currentColor" strokeWidth={0} /></span><span className="rating-number"><span data-count={brand.rating.score}>{score}</span><span>/5</span></span></span>
          <Stars /><span><span data-count={brand.rating.count}>{brand.rating.count}</span> avaliações de tutores</span><span className="tiny-link">Histórias de quem confia <Swap dir="y"><ArrowDown size={14} /></Swap></span>
        </a>
        <div className="hero-hours">
          <div className="hours-top"><Clock start={clockStart} />{daytime ? <Sun className="hours-sky" size={20} /> : <MoonStar className="hours-sky" size={19} />}</div>
          <strong>Agora são <time>{now.label}</time>.</strong>
          <span>E a gente está aqui, como em qualquer hora.</span>
          <span className="open-label"><i className="live-dot" /> Aberto 24h, todos os dias</span>
        </div>
        <PawPrint className="hero-paw" size={30} aria-hidden="true" data-speed=".9" /><Heart className="hero-heart" size={29} aria-hidden="true" data-speed="1.2" />

        <div className="pet-triptych" aria-label="Cães e gatos, nossos melhores amigos">
          <Pet pet={pets.dachshund} className="pet-left"><a className="board-info" href={phone}><span className="board-icon board-icon-call"><Phone size={19} /></span><span className="board-text"><small>Emergência 24 horas</small><strong>{brand.phone.label}</strong><em>Ligue antes de sair de casa</em></span><Swap><ArrowUpRight size={17} /></Swap></a></Pet>
          <Pet pet={pets.golden} className="pet-center"><div className="board-cta"><a className="button button-orange hero-cta" href={talk}><MessageCircle size={16} /><span className="label">Conte com a gente</span><Swap className="button-arrow"><ArrowUpRight size={17} /></Swap></a><a className="board-link" href="#cuidados">ou conheça nossos cuidados <Swap dir="y"><ArrowDown size={14} /></Swap></a></div></Pet>
          <Pet pet={pets.cat} className="pet-right"><a className="board-info" href="#localizacao"><span className="board-icon"><MapPin size={19} /></span><span className="board-text"><small>Onde estamos</small><strong>{brand.address.street}</strong><em>{brand.address.district} · ver no mapa</em></span><Swap><ArrowUpRight size={17} /></Swap></a></Pet>
        </div>
      </section>

      <div className="care-ribbon" aria-label="Clínica veterinária 24h, vacinas, banho e tosa e pet shop"><div className="ribbon-track">{[0, 1].map(n => <div className="ribbon-content" key={n} aria-hidden={n === 1 ? true : undefined}><span><PawPrint /> Amor em cada cuidado</span><span><MoonStar /> Clínica veterinária 24h</span><span><Syringe /> Vacinas e prevenção</span><span><Sparkles /> Banho e tosa</span><span><ShoppingBag /> Pet shop</span><span><Heart /> Pertinho de você</span></div>)}</div></div>

      <section className="care-section section-pad" id="cuidados">
        <div className="care-layout" ref={careBox} onPointerEnter={() => setCareHold(true)} onPointerLeave={() => setCareHold(false)} onFocus={() => setCareHold(true)} onBlur={() => setCareHold(false)}>
          <div className="care-side">
            <div className="care-head reveal">
              <span className="eyebrow"><PawPrint size={14} /> Nossos cuidados</span>
              <h2>Todo cuidado começa{' '}<br />com um pouco de <em className="mark">amor<svg className="scribble" viewBox="0 0 200 20" preserveAspectRatio="none" aria-hidden="true"><path pathLength={1} d="M4 14C38 7 78 5 118 8s62 7 78-2" /></svg></em><span className="orange-period">.</span></h2>
              <p>Da rotina aos momentos inesperados, seu melhor amigo merece atenção de verdade. Escolha um cuidado e veja como a gente faz.</p>
            </div>
            <div className="care-choices reveal" ref={choices} role="tablist" aria-label="Nossos cuidados"><span className="care-pill" aria-hidden="true" />{care.map((c, i) => <button key={c.title} role="tab" id={`care-tab-${i}`} aria-selected={activeCare === i} aria-controls="care-detail" className={`care-choice ${activeCare === i ? 'is-active' : ''}`} onClick={() => { setActiveCare(i); setCareAuto(false) }}>
              <span className="care-num" aria-hidden="true">0{i + 1}</span><span className="care-icon"><c.icon size={21} /></span><span className="care-label"><strong>{c.title}</strong><small>{c.sub}</small></span><ArrowUpRight className="care-choice-arrow" size={20} />
              {activeCare === i && careAuto && <i className={`care-timer ${careHold || !careSeen ? 'paused' : ''}`} key={`t${activeCare}`} aria-hidden="true" />}
            </button>)}</div>
          </div>
          <div className="care-detail reveal" data-spot id="care-detail" role="tabpanel" aria-labelledby={`care-tab-${activeCare}`} aria-live="polite">
            <div className="care-window" aria-hidden="true" style={{ '--line': item.pet.line + '%', '--lf': item.pet.line / 100, '--board': item.pet.board, '--fill': item.pet.fill } as React.CSSProperties}>
              <span className="care-window-ledge" />
              <img key={`p${activeCare}`} src={item.pet.src} alt="" width={item.pet.w} height={item.pet.h} loading="lazy" draggable={false} />
              <span className="care-window-badge" key={`b${activeCare}`}><item.icon size={15} /> {item.badge}</span>
            </div>
            <div className="care-detail-copy" key={activeCare}>
              <h3>{item.text}</h3>
              <p>{item.detail}</p>
              <ul className="care-list">{item.list.map(l => <li key={l}><Check size={15} strokeWidth={2.4} /> {l}</li>)}</ul>
              <a className="button button-orange" href={item.href}>{item.href.startsWith('tel:') ? <Phone size={16} /> : <CalendarCheck size={16} />}<span className="label">{item.action}</span><Swap className="button-arrow"><ArrowUpRight size={17} /></Swap></a>
            </div>
          </div>
        </div>
      </section>

      <section className="perks-section section-pad" id="diferenciais">
        <div className="section-heading reveal"><h2>Pequenos detalhes.{' '}<br /><em>Grande diferença.</em></h2><p data-speed=".25">O que faz o tutor voltar{' '}<br />e o pet sair abanando o rabo.</p></div>
        <div className="bento">
          <article className="perk perk-night" data-tilt data-spot data-reveal style={{ '--d': '0s' } as React.CSSProperties}>
            <div className="perk-visual radar" aria-hidden="true"><i /><i /><i /><span className="radar-core"><MoonStar size={30} strokeWidth={1.6} /></span></div>
            <span className="perk-chip"><i className="live-dot" /> Aberto agora · <time>{now.label}</time></span>
            <h3>Plantão de verdade,{' '}<br />a noite toda.</h3>
            <p>Tem veterinário na clínica de madrugada, não só de sobreaviso. Chegou, foi atendido.</p>
          </article>
          <article className="perk perk-news" data-tilt data-spot data-reveal style={{ '--d': '.1s' } as React.CSSProperties}>
            <div className="perk-visual notes" aria-hidden="true">
              <span><Camera size={15} /> Foto nova da Mel</span>
              <span><CheckCheck size={15} /> Medicação das 14h ok</span>
              <span><PawPrint size={15} /> Pronta para voltar pra casa</span>
            </div>
            <h3>Notícias enquanto ele está com a gente.</h3>
            <p>Na internação ou no banho, você acompanha com fotos e atualizações pelo WhatsApp.</p>
          </article>
          <article className="perk perk-cat" data-tilt data-spot data-reveal style={{ '--d': '.2s' } as React.CSSProperties}>
            <div className="perk-visual orbit" aria-hidden="true"><span className="orbit-ring"><PawPrint className="orbit-paw" size={14} /></span><Cat size={34} strokeWidth={1.5} /></div>
            <h3>Cantinho só para gatos.</h3>
            <p>Sala separada e silenciosa, longe dos latidos.</p>
          </article>
          <article className="perk perk-all" data-tilt data-spot data-reveal style={{ '--d': '.3s' } as React.CSSProperties}>
            <div className="perk-visual tiles" aria-hidden="true">{[Stethoscope, Syringe, Sparkles, ShoppingBag].map((Icon, i) => <span key={i} style={{ '--i': i } as React.CSSProperties}><Icon size={20} strokeWidth={1.6} /></span>)}</div>
            <h3>Tudo num endereço só.</h3>
            <p>Consulta, vacina, banho e ração sem atravessar a cidade.</p>
          </article>
        </div>
      </section>

      <div className="big-words" aria-hidden="true">
        {[['cuidado', 'carinho', '24 horas', 'atenção'], ['amor', 'paciência', 'confiança', 'sem pressa']].map((words, row) => <div className="big-line" data-dir={row ? 1 : -1} key={row}>{[...words, ...words].map((w, i) => <span key={i} className={i % 2 ? 'is-italic' : ''}>{w}<PawPrint className="big-paw" /></span>)}</div>)}
      </div>

      <section className="clinic-section section-pad rise" id="clinica">
        <svg className="clinic-clock" viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="96" />{Array.from({ length: 60 }, (_, i) => <line key={i} x1="100" y1="8" x2="100" y2={i % 5 ? 13 : 20} transform={`rotate(${i * 6} 100 100)`} />)}<line className="cc-h" x1="100" y1="100" x2="100" y2="52" /><line className="cc-m" x1="100" y1="100" x2="100" y2="24" /><circle className="cc-pin" cx="100" cy="100" r="5" /></svg>
        <div className="clinic-statement reveal"><span className="clinic-heart" data-speed=".6"><Heart size={38} strokeWidth={1.3} /></span><h2>Seu pet não sabe<br />ver as horas.<br /><em>Mas sabe quem ama.</em></h2></div>
        <div className="clinic-story reveal">
          <p className="large-copy">E quando ele precisa, estar por perto faz toda a diferença.</p>
          <p>Somos a {brand.name}, pet shop e clínica veterinária 24 horas. Um endereço para cuidar da saúde e do bem-estar de quem é parte da família, da primeira vacina aos cuidados de um companheiro de muitos anos.</p>
          <dl className="clinic-stats">
            <div><dt>24h</dt><dd>todos os dias, até nos feriados</dd></div>
            <div><dt><span data-count={brand.rating.score}>{score}</span></dt><dd>nota média dos tutores</dd></div>
            <div><dt>4 em 1</dt><dd>clínica, vacinas, banho e pet shop</dd></div>
          </dl>
          <div className="clinic-signoff"><PawPrint size={23} /><span>De quem ama bichos.<br /><strong>Para quem também ama.</strong></span></div>
        </div>
      </section>

      <section className="steps-section section-pad" id="como-funciona">
        <div className="section-heading reveal"><h2>Do primeiro contato{' '}<br />ao <em>abanar do rabo.</em></h2><p data-speed=".25">Três passos simples,{' '}<br />a qualquer hora do dia ou da noite.</p></div>
        <div className="steps">
          {steps.map((step, i) => <article className={`step step-${i + 1}`} key={step.title} style={{ '--i': i } as React.CSSProperties}>
            <div className="step-card">
              <span className="step-num" aria-hidden="true">0{i + 1}</span>
              <div className="step-copy"><small>Passo {i + 1} de {steps.length}</small><h3>{step.title}</h3><p>{step.text}</p></div>
              <div className="step-art" aria-hidden="true"><span className="step-ring" /><span className="step-ring" /><step.icon size={46} strokeWidth={1.4} /></div>
            </div>
          </article>)}
        </div>
      </section>

      <section className="reviews-section section-pad rise" id="avaliacoes">
        <div className="review-intro reveal"><h2>Quem ama,{' '}<br /><em>conta.</em></h2><p>Histórias de quem já confiou{' '}<br />o melhor amigo à nossa equipe.</p><div className="review-summary"><span className="rating-badge rating-badge-lg"><Star size={20} fill="currentColor" strokeWidth={0} /></span><span><strong><span data-count={brand.rating.score}>{score}</span> <span>/ 5</span></strong><small><span data-count={brand.rating.count}>{brand.rating.count}</span> avaliações de tutores</small></span></div><span className="rating-note">Nota, números e depoimentos ilustrativos deste site demonstrativo.</span><div className="review-tags" aria-label="Assuntos mais citados nas avaliações">{reviewTopics.map(([tag, n], i) => <span key={tag} style={{ '--i': i } as React.CSSProperties}>{tag}<b>{n}</b></span>)}</div></div>
        <div className="review-feature reveal" onPointerEnter={() => setReviewPaused(true)} onPointerLeave={() => setReviewPaused(false)} onFocus={() => setReviewPaused(true)} onBlur={() => setReviewPaused(false)}>
          <div className="review-deck" ref={deck} aria-live={reviewPaused ? 'polite' : 'off'} {...deckHandlers} onPointerCancel={deckHandlers.onPointerUp}>
            {reviews.map((r, i) => {
              const off = (i - review.i + reviews.length) % reviews.length
              return <article key={r.text} className={`review-card ${i === review.out ? 'is-leaving' : ''}`} data-off={Math.min(off, 3)} aria-hidden={off !== 0}>
                <span className="quote-mark" aria-hidden="true">“</span><blockquote>{r.text}</blockquote>
                <div className="review-author"><span className={`review-avatar ${r.color}`}>{r.initial}</span><span><strong>{r.name}</strong><small>{r.pet}</small></span><Stars size={13} /></div>
              </article>
            })}
          </div>
          <div className="review-timer" aria-hidden="true"><i key={review.i} className={reviewPaused ? 'paused' : ''} /></div>
          <div className="review-controls"><div className="review-dots" aria-label="Escolher avaliação">{reviews.map((r, i) => <button key={r.text} aria-label={`Ler avaliação ${i + 1} de ${reviews.length}`} aria-pressed={i === review.i} className={i === review.i ? 'active' : ''} onClick={() => go(i)} />)}</div><span className="swipe-hint" aria-hidden="true">arraste para o lado</span><button className="review-next" onClick={() => go(review.i + 1)} aria-label="Próxima avaliação"><Swap dir="x"><ArrowRight size={20} /></Swap></button></div>
        </div>
      </section>

      <section className="location-section section-pad rise" id="localizacao">
        <div className="location-copy reveal"><h2>Bem aqui.<br /><em>Bem pertinho.</em></h2><p>Um caminho curto para muito cuidado.</p><div className="address-line"><MapPin size={24} /><address><strong>{brand.name}</strong>{brand.address.street}<br />{brand.address.district} · {brand.address.city}<br />CEP {brand.address.cep}</address></div><button className="copy-address" onClick={copyAddress}>{copied ? <Check size={15} /> : <Copy size={15} />}<span role="status">{copied ? 'Endereço copiado!' : 'Copiar endereço'}</span></button><button className="button button-green" onClick={() => setRouteRun(n => n + 1)}><Navigation size={17} /><span className="label">Como chegar</span><Swap className="button-arrow"><ArrowUpRight size={17} /></Swap></button></div>
        <div className="location-map reveal"><DemoMap run={routeRun} /><a className="map-location-card" href={phone}><span className="map-pin-icon"><PawPrint size={24} /></span><span><strong>{brand.name}</strong><small><i className="live-dot" /> Aberta 24 horas, todos os dias</small></span><Swap><ArrowUpRight size={20} /></Swap></a></div>
      </section>

      <section className="contact-band section-pad rise" id="contato">
        <div className="reveal"><h2>Precisou?<br />É só <em>chamar.</em></h2><p>O próximo cuidado começa com uma conversa, e a gente atende 24 horas, todos os dias.</p></div>
        <a className="contact-phone reveal" href={phone}><span className="contact-phone-icon"><Phone size={27} /></span><span><small><i className="live-dot" /> Atendimento agora · aberto 24h</small><strong>{brand.phone.label}</strong></span><Swap><ArrowUpRight size={27} /></Swap></a>
        <div className="contact-pets" aria-hidden="true"><Pet pet={pets.dachshund} className="pet-mini" decorative /><Pet pet={pets.cat} className="pet-mini" decorative /></div>
      </section>
    </main>

    <footer className="footer">
      <div className="footer-grid">
        <div className="footer-brand">
          <Logo light />
          <p>Pet shop e clínica veterinária 24 horas. Cuidado que faz parte da família.</p>
          <span className="footer-badge"><MoonStar size={15} /> Plantão 24h, 365 dias por ano</span>
          <div className="footer-social">
            <a href={brand.links.instagram} aria-label={`Instagram da ${brand.name}`}><Instagram size={18} /><span>Instagram</span></a>
            <a href={brand.links.whatsapp} aria-label={`WhatsApp da ${brand.name}`}><MessageCircle size={18} /><span>WhatsApp</span></a>
          </div>
        </div>
        <nav className="footer-col" aria-label="Navegação do rodapé">
          <h3>Navegar</h3>
          {navLinks.map(([l, h]) => <a key={h} href={h}>{l}</a>)}
        </nav>
        <div className="footer-col">
          <h3>A clínica</h3>
          <span><Stethoscope size={16} /> Consultas e exames</span>
          <span><ClockIcon size={16} /> Atendimento 24 horas</span>
          <span><Syringe size={16} /> Vacinas e prevenção</span>
          <span><ShoppingBag size={16} /> Pet shop, banho e tosa</span>
        </div>
        <div className="footer-col footer-contact">
          <h3>Contato</h3>
          <a href={phone}><Phone size={16} /> {brand.phone.label}</a>
          <a href="#localizacao"><MapPin size={16} /> {brand.address.street} · {brand.address.district}</a>
          <a href={talk}><MessageCircle size={16} /> Fale com a gente</a>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} {brand.name} · Clínica Veterinária &amp; Pet Shop</span>
        <a href="#inicio" className="back-top">Voltar ao topo <Swap><ArrowUpRight size={15} /></Swap></a>
        <span className="demo-note"><Sparkles size={13} /> Site demonstrativo: marca, contatos e depoimentos fictícios.</span>
      </div>
    </footer>
    <a className="floating-call" href={phone} aria-label="Ligar para a clínica, atendimento 24 horas"><Phone size={23} /><span>Precisa de cuidado?</span></a>
  </>
}

// Reuse the root across HMR updates (calling createRoot twice on one container throws a warning).
const container = document.getElementById('root') as HTMLElement & { _root?: Root }
;(container._root ??= createRoot(container)).render(<React.StrictMode><App /></React.StrictMode>)
