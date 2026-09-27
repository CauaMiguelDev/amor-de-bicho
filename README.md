# Casa Focinho — Clínica Veterinária 24h & Pet Shop (site demonstrativo)

Landing page **demonstrativa** de uma clínica veterinária 24 horas com pet shop. A marca **Casa Focinho**, o telefone, o endereço, as notas e os depoimentos são **fictícios**: o projeto serve de portfólio e de modelo para apresentar a clínicas e pet shops.

### 🔗 Site no ar

**https://cauamigueldev.github.io/amor-de-bicho/**

---

## Sobre

Página com foco em movimento suave e responsividade (desktop, tablet e celular):

- **Topo informativo**: barra com plantão, endereço e nota; menu com destaque deslizante, telefone de emergência e botão de agendar; no celular, menu em tela cheia com atalhos de ligar e agendar.
- **Hero** com os três pets espiando sobre a plaquinha (e sempre visíveis ao rolar), plaquinhas com telefone de emergência e endereço, e uma luz que acompanha o mouse.
- **Parallax** de profundidade nos elementos decorativos, colunas do manifesto que deslizam uma contra a outra e mapa que dá zoom ao rolar.
- **Cards bento de diferenciais** com borda luminosa que segue o mouse, inclinação 3D com profundidade e animações próprias (radar do plantão, notificações, órbita, ícones em onda).
- **Palavras gigantes** que correm em direções opostas conforme o scroll.
- **Como funciona** em cards que grudam na tela e se empilham.
- **Cuidados** em abas que trocam sozinhas (com barra de progresso) até alguém escolher uma, cada uma com foto, lista do que inclui e botão de ação.
- Depoimentos em cartões deslizáveis, mapa ilustrado com a rota se desenhando e contato.

Tudo respeita `prefers-reduced-motion`: com movimento reduzido, o conteúdo aparece estático.

## Usar com um cliente real

Todos os dados do negócio ficam em um único arquivo: **`src/brand.ts`**.

- `brand`: nome, wordmark, telefone, endereço, fuso horário, nota e links (WhatsApp, Instagram, contato).
- `reviews` e `reviewTopics`: depoimentos e assuntos mais citados.

Troque esses valores pelos dados do cliente e também:

1. Remova a nota "Site demonstrativo" do rodapé e a frase de números ilustrativos em Avaliações (`src/main.tsx`).
2. Remova `<meta name="robots" content="noindex, nofollow">` do `index.html` para o site aparecer no Google.
3. Se quiser um mapa real, troque o componente `DemoMap` por um embed do Google Maps com o endereço do cliente.
4. Use fotos próprias da clínica (veja `ASSETS.md`).

## Tecnologias

React 19 · TypeScript · Vite · Tailwind CSS 4 · GSAP + Lenis · Lucide React

## Rodar localmente

```bash
npm install
npm run dev
```

O app abre em `http://localhost:5173/amor-de-bicho/`.

## Build de produção

```bash
npm run build      # gera a pasta dist/
npm run preview    # pré-visualiza o build
```

## Deploy (GitHub Pages)

O site é publicado na branch `gh-pages`. Para atualizar o site no ar após mudanças:

```bash
npm run deploy
```

Isso faz o build e envia a pasta `dist/` para a branch `gh-pages`, que o GitHub Pages serve.

> O endereço ainda usa o nome antigo do repositório (`/amor-de-bicho/`). Se renomear o repositório no GitHub, atualize também o `base` em `vite.config.ts`.

---

<sub>As fotos dos pets são de uma referência de layout, carregadas de um endereço externo. Troque por fotos próprias antes de qualquer uso comercial.</sub>
