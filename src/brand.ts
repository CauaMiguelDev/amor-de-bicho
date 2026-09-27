// Every business detail on the page lives here. This is a demo: the brand, phone, address, numbers and
// testimonials are fictional. To pitch the layout to a real clinic, swap these values (and the links).

export const brand = {
  name: 'Casa Focinho',
  wordmark: 'casa focinho',
  descriptor: 'CLÍNICA VETERINÁRIA & PET SHOP',
  // DDD 00 does not exist in Brazil, so the demo number can never ring anyone.
  phone: { label: '(00) 2424-2424', href: 'tel:+550024242424' },
  address: { street: 'Rua das Acácias, 240', district: 'Jardim Primavera', city: 'Sua cidade · UF', cep: '00000-000' },
  timeZone: 'America/Sao_Paulo',
  rating: { score: 4.9, count: 320 },
  // In-page anchors while this is a demo; point them at the client's WhatsApp / Instagram when real.
  links: { talk: '#contato', instagram: '#contato', whatsapp: '#contato' },
}

export const fullAddress = `${brand.address.street} - ${brand.address.district}, ${brand.address.city}, CEP ${brand.address.cep}`

export const reviews = [
  { name: 'Mariana S.', pet: 'Tutora da Luna', initial: 'M', color: 'rose', text: 'A Luna chegou assustada de madrugada e foi recebida com uma calma que eu não esperava. Explicaram cada passo, mandaram notícias a noite toda e ela voltou pra casa abanando o rabo.' },
  { name: 'Rafael T.', pet: 'Tutor do Thor', initial: 'R', color: 'sage', text: 'Atendimento atencioso do começo ao fim. A veterinária explicou o procedimento com paciência e ainda ligou no dia seguinte para saber como o Thor estava.' },
  { name: 'Juliana R.', pet: 'Tutora do Nino', initial: 'J', color: 'sand', text: 'O Nino odeia sair de casa, mas aqui ele é atendido no tempo dele. Ambiente calmo, sem cheiro de hospital e um cuidado enorme com os gatos.' },
  { name: 'Camila e Pedro', pet: 'Tutores da Mel', initial: 'C', color: 'lavender', text: 'Levamos a Mel para vacinar e saímos com a carteirinha organizada e um monte de dicas. Dá pra ver que a equipe gosta de verdade do que faz.' },
  { name: 'Lucas M.', pet: 'Tutor da Pipoca', initial: 'L', color: 'sage', text: 'Banho e tosa impecáveis, e a Pipoca volta feliz toda vez. Aproveito para comprar a ração ali mesmo: praticidade que faz diferença na rotina.' },
]

// Topics most mentioned in the (fictional) testimonials.
export const reviewTopics = [['atendimento', 128], ['carinho', 96], ['plantão 24h', 71], ['banho & tosa', 54]] as const
