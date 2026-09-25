# Prompt — Camada de animação premium para a landing "Amor de Bicho"

> Cole este prompt inteiro na sua IDE de IA (Cursor, Claude Code, Windsurf).
> Ele descreve **o que fazer**, não o código. Deixe a IDE implementar e mostre o resultado no navegador.

---

## Contexto do projeto

- **Stack:** React 19 + TypeScript + Vite + Tailwind CSS v4 + `lucide-react`.
- **Arquivos:** toda a página está em `src/main.tsx`; estilos em `src/style.css`; markup base em `index.html`.
- **Paleta:** menta `#effdf0` (fundo), verde-floresta `#1a3d1a` (texto/escuro), laranja `#e86a10` (ações), verde-hover `#2a5a2a`.
- **Fontes:** `DM Serif Display` (títulos) e `Inter` (texto), já carregadas via Google Fonts.
- **Easing padrão do projeto:** `--ease: cubic-bezier(.16,1,.3,1)`. Use-o em quase tudo. Para "pop" com overshoot use `cubic-bezier(.34,1.56,.64,1)`.
- **Seções na ordem:** header fixo → hero (título + 3 pets + selo 24h + nota Google) → faixa marquee → cuidados (abas) → manifesto da clínica → avaliações → localização/mapa → faixa de contato → rodapé + botão flutuante de ligação.

## Objetivo

O site está **estático e básico**. Quero que ele pareça feito por um dev sênior de motion: tudo entra com intenção, reage ao mouse e ao scroll, e tem micro-interações caprichadas — **sem economizar animação**, mas mantendo 60fps e respeitando `prefers-reduced-motion`.

## Bibliotecas (instale e use)

```bash
npm i gsap lenis
```

- **GSAP + ScrollTrigger** → toda a coreografia de entrada e efeitos ligados ao scroll.
- **Lenis** → scroll suave (inércia) sincronizado com o ScrollTrigger via `ScrollTrigger.update` no `lenis.on('scroll')` e `gsap.ticker`.
- Faça a inicialização dentro de um único `useEffect` no `App`, com **cleanup completo** (`ctx.revert()` de um `gsap.context`, `lenis.destroy()`, `ScrollTrigger.getAll().forEach(t => t.kill())`).

## Regras globais (não negociáveis)

1. **`prefers-reduced-motion: reduce`** → desligue Lenis, parallax, cursor, partículas e loops infinitos; deixe o conteúdo visível e estático. Detecte com `matchMedia` e ramifique.
2. **Performance:** anime só `transform`, `opacity`, `filter`, `clip-path`. Nada de animar `top/left/width/height`. Use `will-change` só durante a animação e remova depois. Pointermove sempre via `requestAnimationFrame` (throttle).
3. **Mobile:** cursor custom, parallax de mouse e partículas de rastro **só em `pointer: fine`**. No touch, mantenha entradas por scroll e toques com feedback (ripple).
4. **Sem "tremelique" ocioso:** movimento tem que ter propósito (entrada, hover, scroll). Loops infinitos são reservados a: batida de coração do logo, telefone "tocando", marquees e patinha girando devagar.
5. **Acessibilidade:** foco visível preservado, `aria-live` nas trocas de aba/avaliação, nada de conteúdo escondido só por opacidade sem estar acessível.

---

## 1. Preloader (index.html + CSS inline no `<head>`)

- Tela cheia verde-floresta com o logo de **patinha se desenhando** (SVG `stroke-dashoffset` de 1→0) e os 3 dedinhos surgindo em `scale` com overshoot, um a um.
- Wordmark "amor de bicho" faz fade-in embaixo.
- Sai revelando o site com `clip-path: inset(0 0 100% 0)` (cortina subindo), `.9s cubic-bezier(.76,0,.24,1)`.
- Dispara a saída em `Promise.race([document.fonts.ready, timeout(2200ms)])` — nunca trava a página. Em reduced-motion, não exiba.

## 2. Hero cinematográfico

- **Título palavra por palavra:** quebre `h1`/`h2` em `<span>` por palavra dentro de uma máscara `overflow:hidden`; cada palavra entra de baixo com `y:105% → 0`, leve `rotate`, stagger de ~55ms. Dispara quando a seção entra na viewport (ScrollTrigger).
- **Parallax de profundidade no scroll:** os 3 pets sobem em velocidades diferentes (o da direita mais rápido, o do centro mais lento) enquanto o texto do hero sobe e some (`y` negativo + `opacity`). Amarre ao progresso do ScrollTrigger do hero.
- **Parallax de mouse:** selo "24h", nota do Google, patinha e coração decorativos deslocam poucos px seguindo o cursor (`--mouse-x/--mouse-y`), com `lerp` suave.
- **Rastro de patinhas:** ao mover o mouse sobre o hero, deixe pegadas SVG alternando esquerda/direita ao longo do caminho, que aparecem e somem (~1.4s). Só desktop.
- **CTA principal:** brilho pulsante sutil (`box-shadow` que expande e some), seta que gira 45° no hover, e leve `translateY` de flutuar.
- **Legibilidade:** garanta halo/`text-shadow` na cor do fundo atrás do subtítulo, porque ele passa por cima das fotos.

## 3. Cursor personalizado (desktop / `pointer: fine`)

- Ponto laranja pequeno que gruda no mouse + anel que segue com `lerp` (~0.18).
- Sobre `a`/`button`: o anel cresce e ganha preenchimento laranja translúcido.
- Sobre fotos dos pets e o iframe do mapa: vira um estado "ver" (maior, translúcido claro).
- Ao pressionar: encolhe. O cursor nativo continua visível (não faça `cursor:none`).

## 4. Micro-interações

- **Botões magnéticos:** `.button`, header call, botão flutuante, próximo-avaliação e ícones de telefone puxam ~25% na direção do mouse e voltam suave ao sair.
- **Ripple + burst temático:** no clique/toque de qualquer ação primária, uma onda circular a partir do ponto do clique **e** uma explosão radial de coraçõezinhos e patinhas (SVG) que sobem e somem (~0.9s).
- **Cards 3D com brilho:** cards de "cuidados" e de "avaliação" inclinam em `rotateX/rotateY` (perspective ~1000px, máx ~7–9°) seguindo o mouse, com um brilho radial (`radial-gradient` + `mix-blend-mode: soft-light`) na posição do cursor.
- **Hover das fotos:** ao passar por um pet, ele dá leve `scale`, a legenda sobe, o ícone da legenda vira laranja girado, e os outros dois pets dessaturam um pouco (foco no que está em hover).

## 5. Reveal de scroll (todas as seções)

- Cabeçalhos de seção: título entra palavra por palavra (mesmo sistema do hero); parágrafo e botões entram em `y+opacity` com stagger encadeado (batch).
- Use **`ScrollTrigger.batch`** com `start: 'top 85%'`, `once: true`, para os blocos `.reveal`.
- **Números contando:** "4,4" e "407" contam de 0 até o valor quando entram na tela (ease-out quártico, ~1.6s, formatação `pt-BR`).
- **Chips de assuntos** (clínica 46, carinho 12, tratado 10, internação 10): entram em cascata com `scale` + `y`, e no hover sobem levemente mudando de fundo.

## 6. Header e progresso

- **Header sticky inteligente:** ao rolar >30px vira "glass" (`backdrop-filter: blur+saturate`, sombra, padding menor). Esconde ao rolar pra baixo e reaparece ao rolar pra cima. Nunca esconde com o menu mobile aberto.
- **Barra de progresso de leitura** no topo (`scaleX` conforme o scroll).
- **Logo:** coração batendo em loop (heartbeat) e patinha que gira levemente no hover.

## 7. Seções específicas

- **Faixa marquee** ("Amor em cada cuidado · Clínica 24h · …"): rolagem infinita contínua, pausa no hover. Uma segunda faixa (frases reais do Google, em verde) rola no sentido oposto.
- **Abas de cuidados:** troca de conteúdo com transição suave (fade/slide do bloco), ícone da aba ativa gira e fica laranja, indicador desliza.
- **Avaliações em autoplay:** troca sozinha a cada ~7s com **barra de progresso** por cima; pausa quando o mouse está em cima ou quando recebe foco; setas e dots controlam manualmente. Transição do texto com fade/slide.
- **Manifesto da clínica:** coração central com anel pulsante (ondas concêntricas saindo).
- **Mapa:** pin com leve "bob" flutuante; iframe volta à saturação total no hover; card de localização sobe no hover.
- **Contato + botão flutuante:** ícone de telefone "tocando" (chacoalha) com ondas concêntricas; patinha decorativa girando devagar ao fundo.

## 8. Rodapé

- "Voltar ao topo" com seta que sobe e gira no hover; corações do rodapé batendo.

---

## Critérios de aceitação (revise no final)

- [ ] `prefers-reduced-motion` desliga tudo que é decorativo e o conteúdo continua legível.
- [ ] Sem scroll horizontal em 375px, 768px, 1440px.
- [ ] 60fps no scroll (sem layout thrash — só transform/opacity/filter).
- [ ] Nenhum vazamento: navegar/HMR não acumula ScrollTriggers nem listeners (cleanup ok).
- [ ] Cursor, parallax de mouse e partículas somem no mobile/touch.
- [ ] Foco de teclado visível e navegação por Tab funcionando em todos os controles.
- [ ] Números contam, avaliações trocam sozinhas e pausam no hover, header esconde/aparece certo.
- [ ] `npm run build` passa sem erros de tipo.

## O que NÃO fazer

- Não invente preços, serviços, nomes de veterinários nem certificações.
- Não deduza WhatsApp a partir do telefone. Só use links de WhatsApp/Linktree se forem fornecidos.
- Não troque a paleta nem as fontes. Não remova o conteúdo de avaliações reais (positivas e negativas).
- Não baixe imagens novas nem substitua as fotos sem pedir.
