import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { ArrowDown, ArrowRight, ArrowUpRight, Award, Check, Clock as ClockIcon, Copy, Heart, Instagram, Link as LinkIcon, MapPin, MessageCircle, MoonStar, Navigation, PawPrint, Phone, ShieldCheck, ShoppingBag, Star, Stethoscope, Sun, Syringe } from 'lucide-react'
import './style.css'
import { startFx } from './fx'

const phone = 'tel:+556130463056'
const address = 'St. M QNM 19 casa 25 - Ceilândia, Brasília - DF, 72215-205'
const maps = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('Amor de Bicho PET SHOP E Clínica Veterinária 24 HORAS ' + address)
const route = 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent('Amor de Bicho ' + address)
const instagram = 'https://www.instagram.com/amordebicho.pet/'
const linktree = 'https://linktr.ee/amordebichopetshopeconsultorio'
const talk = linktree // "conversar" CTAs open the clinic's official hub (WhatsApp lives there)
const ext = { target: '_blank', rel: 'noreferrer' } as const
const imageRoot = 'https://polo-pecan-73837341.figma.site/_assets/v11/'

// line: where the green board starts, as % of the photo's height (measured from the PNGs).
// board: the board's flat colour, painted behind/over the photo so the pet can duck behind it.
const pets = {
  dachshund: { src: imageRoot + '8d44b25186ef45a5789c74668fb781cea4e1ff49.png', w: 870, h: 762, line: 50.13, board: '#a7e8b0', alt: 'Cachorrinho dachshund com as patas apoiadas em um painel verde', says: ['Oi!', 'Au au!', 'Carinho?'] },
  golden: { src: imageRoot + '96745c4e72ad5c5208e53a885df797fd82cd854a.png?h=1024', w: 977, h: 1024, line: 67.01, board: '#003907', alt: 'Golden retriever sorridente com as patas sobre um painel verde-escuro', says: ['Au!', 'Oi, humano!', 'Au au!'] },
  cat: { src: imageRoot + '81bd2e7a66b58f3d8f3ad78fd1ebf01af8dfdee1.png', w: 870, h: 816, line: 53.43, board: '#a7e8b0', alt: 'Gatinho laranja curioso espiando por cima de um painel verde', says: ['Miau!', 'Prrr…', 'Miau?'] },
}
type PetData = typeof pets.cat

function Pet({ pet, className, says = pet.says, decorative = false, children }: { pet: PetData; className: string; says?: string[]; decorative?: boolean; children?: React.ReactNode }) {
  return <div className={`pet-panel ${className}`} style={{ '--line': pet.line + '%', '--board': pet.board } as React.CSSProperties}>
    <div className="pet-stage" data-says={says.join('|')}>
      <img src={pet.src} alt={decorative ? '' : pet.alt} width={pet.w} height={pet.h} draggable={false} loading={decorative ? 'lazy' : undefined} fetchPriority={decorative ? undefined : 'high'} />
      <span className="pet-cover" />
    </div>
    <span className="pet-bubble" aria-hidden="true" />
    {children}
  </div>
}

// Two copies of an icon: hovering the parent slides one out and the other in.
function Swap({ children, dir = 'diag', className = '' }: { children: React.ReactElement; dir?: 'diag' | 'x' | 'y'; className?: string }) {
  return <span className={`swap swap-${dir} ${className}`} aria-hidden="true">{children}{children}</span>
}

function Logo({ light = false }: { light?: boolean }) {
  return <a className={`logo ${light ? 'logo-light' : ''}`} href="#inicio" aria-label="Amor de Bicho, início">
    <span className="logo-mark"><PawPrint strokeWidth={1.7} /><Heart className="logo-heart" fill="currentColor" /></span>
    <span className="logo-type">amor de bicho<span>CLÍNICA VETERINÁRIA & PET SHOP</span></span>
  </a>
}

function Stars() {
  return <span className="stars" aria-hidden="true">{Array.from({ length: 5 }, (_, i) => <Star key={i} size={14} fill="currentColor" strokeWidth={0} />)}</span>
}

function brasiliaNow() {
  const p = Object.fromEntries(new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(new Date()).map(x => [x.type, x.value]))
  return { h: +p.hour, m: +p.minute, s: +p.second, label: `${p.hour}:${p.minute}` }
}

// Hands start at the current Brasília time; CSS keeps them turning from there.
function Clock({ start }: { start: ReturnType<typeof brasiliaNow> }) {
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

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [activeCare, setActiveCare] = useState(0)
  const [review, setReview] = useState({ i: 0, out: -1 })
  const [reviewPaused, setReviewPaused] = useState(false)
  const [clockStart] = useState(brasiliaNow)
  const [now, setNow] = useState(clockStart)
  const copyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const progress = useRef<HTMLDivElement>(null)
  const choices = useRef<HTMLDivElement>(null)
  const deck = useRef<HTMLDivElement>(null)
  const drag = useRef<number | null>(null)

  const care = [
    { title: 'Clínica veterinária', icon: Stethoscope, text: 'Um lugar para cuidar de quem faz parte da sua família.', detail: 'Converse com a equipe sobre consultas, acompanhamento e os cuidados que seu pet precisa. Você encontra a Amor de Bicho bem aqui, em Ceilândia.', action: 'Falar com a clínica', href: talk },
    { title: 'Atendimento 24 horas', icon: MoonStar, text: 'De dia, de noite. Quando o seu melhor amigo precisar.', detail: 'A clínica funciona 24 horas, todos os dias. Se seu pet precisa de atendimento, ligue para a equipe ou abra as rotas para chegar até nós.', action: 'Ligar agora', href: phone },
    { title: 'Pet shop', icon: ShoppingBag, text: 'Mais cuidado para os pequenos momentos do dia a dia.', detail: 'Saúde e bem-estar no mesmo endereço. Entre em contato para conhecer os produtos disponíveis e confirmar o horário de atendimento do pet shop.', action: 'Consultar a equipe', href: talk },
  ]
  const highlight = { name: 'Destaque das avaliações', initial: 'G', color: 'google', label: 'Trecho em destaque no Google' }
  const reviews = [
    { name: 'Lerianne Moreira', initial: 'L', color: 'rose', label: 'Trecho da avaliação no Google', text: 'Tivemos uma experiência extremamente positiva com a clínica veterinária AMOR DE BICHO no atendimento à nossa cadela Nina, uma maltês, que foi acompanhada com muito zelo, carinho e atenção desde a primeira consulta até o pós-operatório.' },
    { ...highlight, text: 'Clínica com estrutura e qualidade excelente no serviço prestado!' },
    { name: 'Claudia Magalhaes', initial: 'C', color: 'sage', label: 'Trecho da avaliação no Google', text: 'Excelente atendimento da minha cachorrinha Maya. Médicas competentes, cuidadosas sobre os procedimentos a serem realizados, e atenciosas para explicar sobre o que seria feito. Recomendo muito!' },
    { ...highlight, text: 'Muito boa, os atendentes e os médicos, são bastante atenciosos!' },
    { name: 'Andressa AO', initial: 'A', color: 'lavender', label: 'Trecho da avaliação no Google', text: 'Minha experiência com o pós-operatório do meu gato de 13 anos nesta clínica foi extremamente frustrante. E por isso não quis nem discutir na hora e só retirei da clínica e levei pra outra após 6 dias de operação.' },
    { ...highlight, text: 'Todas as vezes que levei meu cachorro foi muito bem atendido e sem enrolação.' },
  ]
  const go = (i: number) => setReview(r => { const next = (i + reviews.length) % reviews.length; return next === r.i ? r : { i: next, out: r.i } })
  const daytime = now.h >= 6 && now.h < 18

  useEffect(() => {
    const stopFx = startFx()
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target) } })
    }, { threshold: .12 })
    document.querySelectorAll('.reveal').forEach(element => observer.observe(element))
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      if (progress.current) progress.current.style.transform = `translateX(${(max > 0 ? window.scrollY / max : 0) * 100 - 100}%)`
    }
    const tick = setInterval(() => setNow(brasiliaNow()), 15000)
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

  // Sliding highlight behind the active care option.
  useLayoutEffect(() => {
    const box = choices.current
    if (!box) return
    const place = () => {
      const b = box.querySelectorAll<HTMLElement>('.care-choice')[activeCare]
      box.style.setProperty('--py', b.offsetTop + 8 + 'px'); box.style.setProperty('--ph', b.offsetHeight - 16 + 'px')
    }
    place()
    const ro = new ResizeObserver(place); ro.observe(box)
    return () => ro.disconnect()
  }, [activeCare])

  async function copyAddress() {
    try { await navigator.clipboard.writeText(address); setCopied(true); clearTimeout(copyTimer.current); copyTimer.current = setTimeout(() => setCopied(false), 3000) }
    catch { window.open(maps, '_blank', 'noopener,noreferrer') }
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

  return <>
    <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
    <div className="reading-progress" ref={progress}><PawPrint size={14} /></div>
    <header className="header" id="inicio">
      <div className="header-inner">
        <Logo />
        <nav className={menuOpen ? 'nav nav-open' : 'nav'} id="main-nav" aria-label="Navegação principal">
          {[['Nossos cuidados', '#cuidados'], ['A clínica', '#clinica'], ['Avaliações', '#avaliacoes'], ['Onde estamos', '#localizacao']].map(([label, href], i) => <a href={href} key={href} style={{ '--i': i } as React.CSSProperties} onClick={() => setMenuOpen(false)}><span className="roll"><span data-text={label}>{label}</span></span></a>)}
          <a href={phone} className="mobile-nav-call" style={{ '--i': 4 } as React.CSSProperties}><Phone size={16} /> (61) 3046-3056</a>
        </nav>
        <a className="header-call" href={talk} {...ext}><MessageCircle size={16} /><span>Fale com a gente</span><Swap><ArrowUpRight size={17} /></Swap></a>
        <button className={`menu-toggle ${menuOpen ? 'is-open' : ''}`} aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'} aria-expanded={menuOpen} aria-controls="main-nav" onClick={() => setMenuOpen(!menuOpen)}><span /><span /></button>
      </div>
    </header>

    <main id="conteudo">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-floaters" aria-hidden="true">{Array.from({ length: 8 }, (_, i) => i % 2 ? <Heart key={i} fill="currentColor" strokeWidth={0} /> : <PawPrint key={i} />)}</div>
        <div className="hero-copy">
          <h1 id="hero-title"><span className="word-line">Amor que cuida.</span><span className="word-line">A <em>qualquer<svg className="scribble" viewBox="0 0 200 20" preserveAspectRatio="none" aria-hidden="true"><path pathLength={1} d="M4 14C38 7 78 5 118 8s62 7 78-2" /></svg></em> hora<span className="orange-period">.</span></span></h1>
          <p>Para eles, somos o mundo.<br className="mobile-break" /> Por eles, estamos aqui. <strong>24 horas.</strong></p>
          <a className="button button-orange hero-cta hero-cta-flow" href={talk} {...ext}><MessageCircle size={17} /><span className="label">Conte com a gente</span><Swap className="button-arrow"><ArrowUpRight size={18} /></Swap></a>
          <div className="hero-status">
            <a className="status-pill" href={maps} target="_blank" rel="noreferrer"><span className="google-g">G</span><strong>4,4</strong><Star size={13} fill="currentColor" strokeWidth={0} /><span>407 avaliações</span></a>
            <span className="status-pill"><i className="live-dot" /> Aberto agora · <time>{now.label}</time></span>
          </div>
        </div>

        <a className="hero-rating" href={maps} target="_blank" rel="noreferrer">
          <span className="rating-top"><span className="google-g">G</span><span className="rating-number"><span data-count="4.4">4,4</span><span>/5</span></span></span>
          <Stars /><span><span data-count="407">407</span> avaliações no Google</span><span className="tiny-link">Histórias de quem confia <Swap><ArrowUpRight size={14} /></Swap></span>
        </a>
        <div className="hero-hours">
          <div className="hours-top"><Clock start={clockStart} />{daytime ? <Sun className="hours-sky" size={20} /> : <MoonStar className="hours-sky" size={19} />}</div>
          <strong>Agora são <time>{now.label}</time>.</strong>
          <span>E a gente está aqui, como em qualquer hora.</span>
          <span className="open-label"><i className="live-dot" /> Aberto 24 horas · Ceilândia</span>
        </div>
        <PawPrint className="hero-paw" size={30} aria-hidden="true" /><Heart className="hero-heart" size={29} aria-hidden="true" />

        <div className="pet-triptych" aria-label="Cães e gatos, nossos melhores amigos">
          <Pet pet={pets.dachshund} className="pet-left"><div className="pet-caption"><span className="caption-icon"><Heart size={21} /></span><span>Pequenos amigos.<br /><strong>Um amor gigante.</strong></span></div></Pet>
          <Pet pet={pets.golden} className="pet-center"><div className="board-cta"><a className="button button-orange hero-cta" href={talk} {...ext}><MessageCircle size={16} /><span className="label">Conte com a gente</span><Swap className="button-arrow"><ArrowUpRight size={17} /></Swap></a><a className="board-link" href="#cuidados">ou conheça nossos cuidados <Swap dir="y"><ArrowDown size={14} /></Swap></a></div></Pet>
          <Pet pet={pets.cat} className="pet-right"><div className="pet-caption"><span className="caption-icon"><ShieldCheck size={21} /></span><span>Carinho em cada detalhe.<br /><strong>Cuidado em cada momento.</strong></span></div></Pet>
        </div>
      </section>

      <div className="care-ribbon" aria-label="Clínica veterinária 24h, pet shop e cuidado com carinho"><div className="ribbon-track">{[0, 1].map(n => <div className="ribbon-content" key={n} aria-hidden={n === 1 ? true : undefined}><span><PawPrint /> Amor em cada cuidado</span><span><MoonStar /> Clínica veterinária 24h</span><span><Heart /> Pertinho de você, em Ceilândia</span><span><ShoppingBag /> Pet shop</span></div>)}</div></div>

      <section className="care-section section-pad" id="cuidados">
        <div className="section-heading reveal"><h2>Todo cuidado começa<br />com um pouco de <em>amor.</em></h2><p>Da rotina aos momentos inesperados,<br />seu melhor amigo merece atenção de verdade.</p></div>
        <div className="care-layout reveal">
          <div className="care-choices" ref={choices}><span className="care-pill" aria-hidden="true" />{care.map((item, i) => <button key={item.title} className={`care-choice ${activeCare === i ? 'is-active' : ''}`} aria-expanded={activeCare === i} aria-controls="care-detail" onClick={() => setActiveCare(i)}><item.icon size={25} /><span>{item.title}</span><ArrowUpRight className="care-choice-arrow" size={23} /></button>)}</div>
          <div className="care-detail" data-tilt id="care-detail" role="region" aria-label={care[activeCare].title} aria-live="polite"><div className="care-detail-copy" key={activeCare}><div className="care-detail-symbol">{React.createElement(care[activeCare].icon)}</div><h3>{care[activeCare].text}</h3><p>{care[activeCare].detail}</p><a className="text-link" href={care[activeCare].href} {...(care[activeCare].href.startsWith('http') ? ext : {})}>{care[activeCare].action}<Swap><ArrowUpRight size={18} /></Swap></a></div><PawPrint className="detail-paw" aria-hidden="true" /></div>
        </div>
      </section>

      <section className="clinic-section section-pad rise" id="clinica">
        <svg className="clinic-clock" viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="96" />{Array.from({ length: 60 }, (_, i) => <line key={i} x1="100" y1="8" x2="100" y2={i % 5 ? 13 : 20} transform={`rotate(${i * 6} 100 100)`} />)}<line className="cc-h" x1="100" y1="100" x2="100" y2="52" /><line className="cc-m" x1="100" y1="100" x2="100" y2="24" /><circle className="cc-pin" cx="100" cy="100" r="5" /></svg>
        <div className="clinic-statement reveal"><span className="clinic-heart"><Heart size={38} strokeWidth={1.3} /></span><h2>Seu pet não sabe<br />ver as horas.<br /><em>Mas sabe quem ama.</em></h2></div>
        <div className="clinic-story reveal"><p className="large-copy">E quando ele precisa, estar por perto faz toda a diferença.</p><p>Somos a Amor de Bicho, pet shop e clínica veterinária 24 horas em Ceilândia. Um endereço para quem quer cuidar da saúde e do bem-estar de um companheiro que é parte da família.</p><p>Uma empresa de empreendedoras, feita de gente que acredita que carinho e cuidado andam juntos.</p><div className="clinic-signoff"><PawPrint size={23} /><span>De quem ama bichos.<br /><strong>Para quem também ama.</strong></span></div></div>
      </section>

      <section className="reviews-section section-pad rise" id="avaliacoes">
        <div className="review-intro reveal"><h2>Quem ama,<br /><em>conta.</em></h2><p>Experiências reais de quem<br />já passou por aqui.</p><a className="google-review-summary" href={maps} target="_blank" rel="noreferrer"><span className="google-g">G</span><span><strong><span data-count="4.4">4,4</span> <span>/ 5</span></strong><small><span data-count="407">407</span> avaliações no Google</small></span><Swap><ArrowUpRight size={20} /></Swap></a><span className="rating-note">Nota e quantidade do perfil informado.</span><div className="review-tags" aria-label="Assuntos mais citados nas avaliações">{([['clínica', 46], ['carinho', 12], ['tratado', 10], ['internação', 10]] as const).map(([tag, n], i) => <span key={tag} style={{ '--i': i } as React.CSSProperties}>{tag}<b>{n}</b></span>)}</div></div>
        <div className="review-feature reveal" onPointerEnter={() => setReviewPaused(true)} onPointerLeave={() => setReviewPaused(false)} onFocus={() => setReviewPaused(true)} onBlur={() => setReviewPaused(false)}>
          <div className="review-deck" ref={deck} aria-live={reviewPaused ? 'polite' : 'off'} {...deckHandlers} onPointerCancel={deckHandlers.onPointerUp}>
            {reviews.map((r, i) => {
              const off = (i - review.i + reviews.length) % reviews.length
              return <article key={r.text} className={`review-card ${i === review.out ? 'is-leaving' : ''}`} data-off={Math.min(off, 3)} aria-hidden={off !== 0}>
                <span className="quote-mark" aria-hidden="true">“</span><blockquote>{r.text}</blockquote>
                <div className="review-author"><span className={`review-avatar ${r.color}`}>{r.initial}</span><span><strong>{r.name}</strong><small>{r.label}</small></span><span className="google-g small-g" aria-label="Google">G</span></div>
              </article>
            })}
          </div>
          <div className="review-timer" aria-hidden="true"><i key={review.i} className={reviewPaused ? 'paused' : ''} /></div>
          <div className="review-controls"><div className="review-dots" aria-label="Escolher avaliação">{reviews.map((r, i) => <button key={r.text} aria-label={`Ler avaliação ${i + 1} de ${reviews.length}`} aria-pressed={i === review.i} className={i === review.i ? 'active' : ''} onClick={() => go(i)} />)}</div><span className="swipe-hint" aria-hidden="true">arraste para o lado</span><button className="review-next" onClick={() => go(review.i + 1)} aria-label="Próxima avaliação"><Swap dir="x"><ArrowRight size={20} /></Swap></button></div>
          <a className="all-reviews" href={maps} target="_blank" rel="noreferrer">Ver todas as avaliações no Google <Swap><ArrowUpRight size={15} /></Swap></a>
        </div>
      </section>

      <section className="location-section section-pad rise" id="localizacao">
        <div className="location-copy reveal"><h2>Bem aqui.<br /><em>Bem pertinho.</em></h2><p>Um caminho curto para muito cuidado.</p><div className="address-line"><MapPin size={24} /><address><strong>Amor de Bicho</strong>St. M QNM 19 casa 25<br />Ceilândia, Brasília · DF<br />CEP 72215-205</address></div><button className="copy-address" onClick={copyAddress}>{copied ? <Check size={15} /> : <Copy size={15} />}<span role="status">{copied ? 'Endereço copiado!' : 'Copiar endereço'}</span></button><a className="button button-green" href={route} target="_blank" rel="noreferrer"><Navigation size={17} /><span className="label">Como chegar</span><Swap className="button-arrow"><ArrowUpRight size={17} /></Swap></a></div>
        <div className="location-map reveal"><iframe title="Localização da Amor de Bicho em Ceilândia, Brasília" src={`https://maps.google.com/maps?q=${encodeURIComponent('Amor de Bicho QNM 19 casa 25 Ceilândia Brasília')}&z=16&output=embed`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" /><a className="map-location-card" href={maps} target="_blank" rel="noreferrer"><span className="map-pin-icon"><PawPrint size={24} /></span><span><strong>Amor de Bicho</strong><small><i className="live-dot" /> Clínica aberta 24 horas</small></span><Swap><ArrowUpRight size={20} /></Swap></a></div>
      </section>

      <section className="contact-band section-pad rise">
        <div className="reveal"><h2>Precisou?<br />É só <em>chamar.</em></h2><p>O próximo cuidado começa com uma conversa — e a gente atende 24 horas, todos os dias.</p></div>
        <a className="contact-phone reveal" href={phone}><span className="contact-phone-icon"><Phone size={27} /></span><span><small><i className="live-dot" /> Atendimento agora · aberto 24h</small><strong>(61) 3046-3056</strong></span><Swap><ArrowUpRight size={27} /></Swap></a>
        <div className="contact-pets" aria-hidden="true"><Pet pet={pets.dachshund} className="pet-mini" says={['Liga pra gente!', 'Au!']} decorative /><Pet pet={pets.cat} className="pet-mini" says={['Miau!', 'Tô esperando!']} decorative /></div>
      </section>
    </main>

    <footer className="footer">
      <div className="footer-grid">
        <div className="footer-brand">
          <Logo light />
          <p>Pet shop e clínica veterinária 24 horas em Ceilândia. Cuidado que faz parte da família.</p>
          <span className="footer-badge"><Award size={15} /> 19 anos cuidando de quem você ama</span>
          <div className="footer-social">
            <a href={instagram} {...ext} aria-label="Instagram da Amor de Bicho"><Instagram size={18} /><span>@amordebicho.pet</span></a>
            <a href={linktree} {...ext} aria-label="Todos os links da Amor de Bicho"><LinkIcon size={18} /><span>Todos os links</span></a>
          </div>
        </div>
        <nav className="footer-col" aria-label="Navegação do rodapé">
          <h3>Navegar</h3>
          {[['Nossos cuidados', '#cuidados'], ['A clínica', '#clinica'], ['Avaliações', '#avaliacoes'], ['Onde estamos', '#localizacao']].map(([l, h]) => <a key={h} href={h}>{l}</a>)}
        </nav>
        <div className="footer-col">
          <h3>A clínica</h3>
          <span><Stethoscope size={16} /> Clínica veterinária</span>
          <span><ClockIcon size={16} /> Atendimento 24 horas</span>
          <span><Syringe size={16} /> Internação e cirurgias</span>
          <span><ShoppingBag size={16} /> Pet shop &amp; banho</span>
        </div>
        <div className="footer-col footer-contact">
          <h3>Contato</h3>
          <a href={phone}><Phone size={16} /> (61) 3046-3056</a>
          <a href={maps} {...ext}><MapPin size={16} /> QNM 19, casa 25 — Ceilândia · DF</a>
          <a href={talk} {...ext}><MessageCircle size={16} /> Fale com a gente</a>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Amor de Bicho · Clínica Veterinária &amp; Pet Shop</span>
        <a href="#inicio" className="back-top">Voltar ao topo <Swap><ArrowUpRight size={15} /></Swap></a>
        <span className="footer-made">Feito com <Heart size={12} fill="currentColor" strokeWidth={0} /> em Ceilândia, Brasília · DF</span>
      </div>
    </footer>
    <a className="floating-call" href={phone} aria-label="Ligar para a clínica, atendimento 24 horas"><Phone size={23} /><span>Precisa de cuidado?</span></a>
  </>
}

// Reuse the root across HMR updates (calling createRoot twice on one container throws a warning).
const container = document.getElementById('root') as HTMLElement & { _root?: Root }
;(container._root ??= createRoot(container)).render(<React.StrictMode><App /></React.StrictMode>)
