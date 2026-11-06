import assert from 'node:assert/strict'
import { test } from 'node:test'
import { registerHooks } from 'node:module'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'
import ts from 'typescript'

process.env.NODE_ENV = 'production'
const { default: React } = await import('react')
const { renderToStaticMarkup } = await import('react-dom/server')
const { StaticRouter } = await import('react-router-dom')

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && context.parentURL) {
      const url = new URL(specifier, context.parentURL)
      for (const extension of ['.ts', '.tsx']) {
        if (existsSync(fileURLToPath(url) + extension)) return { url: url.href + extension, shortCircuit: true }
      }
    }
    return nextResolve(specifier, context)
  },
  load(url, context, nextLoad) {
    if (url.endsWith('.css')) return { format: 'module', source: '', shortCircuit: true }
    if (url.endsWith('.svg')) return { format: 'module', source: 'export default "/logo.svg"', shortCircuit: true }
    if (/\.tsx?$/.test(url)) return { format: 'module', shortCircuit: true,
      source: ts.transpileModule(readFileSync(fileURLToPath(url), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
      }).outputText }
    return nextLoad(url, context)
  },
})

const { customerOrders, customerOrder, orderMoney, orderDate } = await import('../src/services/orders.ts')
const { parseSummary, parsePage, parseDetail, parseUser, parseLogin, parseAssistantReply, isUuid } = await import('../src/services/dashboardApi.ts')
const { parseProfile } = await import('../src/services/accountApi.ts')
const { scopeToOrder } = await import('../src/services/orderDraft.ts')
const { DashboardOverview } = await import('../src/components/dashboard/DashboardOverview.tsx')
const { OrderAssistant } = await import('../src/components/OrderAssistant.tsx')
const { ApiError, createApiClient } = await import('../src/services/api.ts')
const { MyOrders } = await import('../src/pages/MyOrders.tsx')
const { OrderForm } = await import('../src/components/OrderForm.tsx')
const { ReviewForm } = await import('../src/components/OrderReview.tsx')
const { Modal } = await import('../src/components/Modal.tsx')
const { Sidebar } = await import('../src/components/dashboard/Sidebar.tsx')
const { CreateOrderModal } = await import('../src/components/CreateOrderModal.tsx')
const { readModal, readNext, readOrder, searchWithModal, modalLink } = await import('../src/services/modalRoute.ts')
const { buildRegistration, emptyRegistration, maskCpf, maskCep, maskPhone, isValidPhone } = await import('../src/services/registrationForm.ts')
const { CompleteRegistrationForm } = await import('../src/components/CompleteRegistrationForm.tsx')
const { parseReview, parseReviewSummary, validRating, submitReview } = await import('../src/services/reviews.ts')
const renderOrders = (props = {}) => renderToStaticMarkup(React.createElement(StaticRouter, { location: '/pedidos' },
  React.createElement(MyOrders, { orders: [], customerId: null, search: '', ...props })))

test('orders require an authenticated customer', () => {
  assert.throws(() => customerOrders([], null), /Entre na sua conta/)
  assert.throws(() => customerOrder([], null, randomUUID()), /Entre na sua conta/)
  assert.match(renderOrders(), /Entre na sua conta/)
})

test('an empty account displays no invented orders', () => {
  const id = randomUUID()
  assert.deepEqual(customerOrders([], id), [])
  assert.equal(customerOrder([], id, randomUUID()), undefined)
  assert.match(renderOrders({ customerId: id }), /Você ainda não tem pedidos/)
  assert.match(renderOrders({ customerId: id, orderId: randomUUID() }), /Pedido não encontrado/)
})

test('loading and unavailable data remain visible', () => {
  assert.match(renderOrders({ loading: true }), /Carregando pedidos/)
  assert.match(renderOrders({ requiresLogin: true }), /Entrar novamente/)
})

test('unknown amounts and dates are not replaced with invented values', () => {
  assert.equal(orderMoney(), 'Valor não informado')
  assert.equal(orderDate(), 'Data não informada')
  assert.equal(orderMoney(0).replace(/\s/g, ''), 'R$0,00')
})

for (const [name, parse] of Object.entries({ parseSummary, parsePage, parseDetail, parseUser, parseLogin, parseAssistantReply, parseProfile })) {
  test(`${name} rejects absent or invalid API data`, () => {
    for (const value of [undefined, null, false, [], {}]) assert.throws(() => parse(value), ApiError)
  })
}

test('API identifiers accept UUIDs and reject invalid route values', () => {
  const id = randomUUID()
  assert.equal(isUuid(id), true)
  assert.equal(isUuid(id.toUpperCase()), true)
  assert.equal(isUuid(''), false)
  assert.equal(isUuid('../'), false)
})

test('native fetch failures report API unavailability', async () => {
  // Invalid URL fails locally; no server or intercepted HTTP response is used.
  await assert.rejects(createApiClient('http://[')('/api/v1/users/me'), error => error instanceof ApiError && error.status === 0)
})

test('order creation starts empty and disables editing during submission', () => {
  const props = { onCancel() {}, async onCreate() {}, submitting: false, submitError: '' }
  const html = renderToStaticMarkup(React.createElement(OrderForm, props))
  assert.match(html, /Criar pedido/)
  assert.match(html, /Publicar pedido/)
  assert.match(html, /value=""/)
  assert.match(html, /type="file"/)
  assert.match(html, /accept="image\/jpeg,image\/png,image\/webp"/)
  const pending = renderToStaticMarkup(React.createElement(OrderForm, { ...props, submitting: true }))
  assert.match(pending, /<fieldset disabled=""/)
  assert.match(pending, /Publicando/)
})

const summary = (extra = {}) => ({
  orders: { total: 4, pending: 2, inProgress: 1, completed: 1, cancelled: 0, active: 3, createdLast7Days: 1 },
  proposals: { total: 5, awaitingDecision: 3, unviewed: 2 },
  recentOrders: [],
  ...extra,
})

test('home summary accepts the card fields and rejects invalid ones', () => {
  assert.equal(parseSummary(summary()).proposals.unviewed, 2)
  const legacy = summary()
  delete legacy.proposals
  delete legacy.orders.active
  assert.equal(parseSummary(legacy).proposals, undefined)
  assert.throws(() => parseSummary(summary({ proposals: { total: -1, awaitingDecision: 0, unviewed: 0 } })), ApiError)
  assert.throws(() => parseSummary({ ...summary(), orders: { ...summary().orders, createdLast7Days: 'x' } }), ApiError)
})

test('home cards follow the approved layout with real data and no invented rating', () => {
  const props = {
    orders: [], summary: summary(), completed: { orders: [], loading: false }, profile: { name: 'Maria Souza', location: '' },
    tab: 'all', setTab() {}, search: '', setSearch() {}, navigate() {}, openDialog() {}, openOrder() {}, onViewCompleted() {},
  }
  const html = renderToStaticMarkup(React.createElement(DashboardOverview, props))
  for (const label of ['Pedidos ativos', 'Propostas recebidas', 'Serviços concluídos', 'Sua avaliação']) assert.match(html, new RegExp(label))
  assert.match(html, />03</)
  assert.match(html, /\+1 novo nesta semana/)
  assert.match(html, /2 propostas para conferir/)
  assert.match(html, /Avaliações indisponíveis/)
  assert.doesNotMatch(html, /4,8/)
  assert.match(html, /Nenhum serviço concluído ainda/)
  const withReviews = renderToStaticMarkup(React.createElement(DashboardOverview, { ...props, reviews: { data: { count: 2, averageRating: 4.5 }, loading: false } }))
  assert.match(withReviews, /4,5/)
  assert.match(withReviews, /2 avaliações enviadas/)
  const empty = renderToStaticMarkup(React.createElement(DashboardOverview, { ...props, reviews: { data: { count: 0, averageRating: null }, loading: false } }))
  assert.match(empty, /Nenhuma avaliação enviada/)
})

test('review contracts reject invalid scores and inconsistent summaries', async () => {
  const review = { orderId: randomUUID(), providerId: randomUUID(), rating: 5, createdAt: new Date().toISOString() }
  assert.deepEqual(parseReview(review), review)
  for (const rating of [0, 6, 1.5, '5', undefined]) {
    assert.equal(validRating(rating), false)
    assert.throws(() => parseReview({ ...review, rating }), ApiError)
  }
  for (const value of [{ count: 0, averageRating: 5 }, { count: 1, averageRating: null }, { count: -1, averageRating: null }]) assert.throws(() => parseReviewSummary(value), ApiError)
  await assert.rejects(submitReview(review.orderId, 'test', 0, ''), ApiError)
  await assert.rejects(submitReview(review.orderId, 'test', 5, 'x'.repeat(2001)), ApiError)
})

test('review form has five named radio inputs, optional comment and prevents empty submission', () => {
  const html = renderToStaticMarkup(React.createElement(ReviewForm, { sending: false, error: '', onSubmit() {} }))
  assert.equal((html.match(/type="radio"/g) ?? []).length, 5)
  assert.match(html, /aria-label="1 estrela"/)
  assert.match(html, /aria-label="5 estrelas"/)
  assert.match(html, /Comentário \(opcional\)/)
  assert.match(html, /maxLength="2000"/)
  assert.match(html, /type="submit" disabled=""/)
  const pending = renderToStaticMarkup(React.createElement(ReviewForm, { sending: true, error: 'Falha de envio', onSubmit() {} }))
  assert.match(pending, /fieldset disabled/)
  assert.match(pending, /role="alert"/)
})

test('only completed order details offer the review route', () => {
  const id = randomUUID(), customerId = randomUUID()
  const order = { id, customerId, title: 'Serviço', category: 'Pedido', location: '', description: '', status: 'completed', icon: 'bag', proposals: 0 }
  assert.match(renderOrders({ orders: [order], customerId, orderId: id }), new RegExp(`href="/pedidos\\?modal=avaliar&amp;pedido=${id}"`))
  assert.doesNotMatch(renderOrders({ orders: [{ ...order, status: 'progress' }], customerId, orderId: id }), /Avaliar serviço/)
})

test('assistant replies and suggested scope are validated and mapped to the order form', () => {
  const reply = parseAssistantReply({ reply: 'Onde fica?', scope: { categoria: 'Elétrica', urgencia: 'Urgente' }, complete: false })
  assert.equal(reply.scope.categoria, 'Elétrica')
  assert.throws(() => parseAssistantReply({ reply: '', scope: {}, complete: true }), ApiError)
  assert.throws(() => parseAssistantReply({ reply: 'Oi', scope: { categoria: 1 }, complete: true }), ApiError)
  const order = scopeToOrder({ categoria: 'Elétrica', descricao: 'Tomada sem energia', localizacao: 'Aldeota', urgencia: 'Amanhã' })
  assert.equal(order.title, 'Elétrica')
  assert.equal(order.scope.urgency, '')
  assert.equal(order.location, 'Aldeota')
})

test('order assistant starts with a greeting and review disabled', () => {
  const html = renderToStaticMarkup(React.createElement(OrderAssistant, {
    async onAsk() { throw new Error('não chamado') }, onReview() {}, onManual() {}, onCancel() {},
  }))
  assert.match(html, /Assistente ResolvAI/)
  assert.match(html, /Escopo em construção/)
  assert.match(html, /geradas por IA/)
  assert.match(html, /Revisar escopo[\s\S]*disabled|disabled[\s\S]*Revisar escopo/)
})

test('account profile requires a valid user and well-formed address and contact', () => {
  const user = { id: randomUUID(), name: 'Maria', email: 'maria@teste.com', role: 'Cliente', isActive: true, createdAt: new Date().toISOString(), cpf: '12345678901' }
  const profile = parseProfile({ user, endereco: { logradouro: 'Rua A', numero: '1', bairro: 'Centro', cidade: 'Fortaleza', estado: 'CE', cep: '60000000' }, contato: { tipo: 'telefone', valor: '85999999999' } })
  assert.equal(profile.endereco.cidade, 'Fortaleza')
  assert.equal(parseProfile({ user }).contato, undefined)
  assert.throws(() => parseProfile({ user, endereco: { logradouro: 'Rua A' } }), ApiError)
  assert.throws(() => parseProfile({ user, contato: { tipo: 'telefone' } }), ApiError)
})

test('API error details are shown for the new order routes', async () => {
  const problem = (status, detail) => async () => new Response(JSON.stringify({ status, detail }), { status, headers: { 'Content-Type': 'application/problem+json' } })
  const photo = createApiClient('http://api', problem(400, 'A foto deve ter no máximo 5 MB.'))
  await assert.rejects(photo('/api/v1/orders/photos', { method: 'POST', form: new FormData() }), (error) => error.message === 'A foto deve ter no máximo 5 MB.')
  const assistant = createApiClient('http://api', problem(503, 'O assistente de pedidos não está configurado neste servidor.'))
  await assert.rejects(assistant('/api/v1/orders/assistant', { method: 'POST', body: {} }), (error) => error.status === 503 && /assistente/.test(error.message))
  const limited = createApiClient('http://api', problem(429))
  await assert.rejects(limited('/api/v1/users/me'), (error) => error.status === 429 && /Aguarde/.test(error.message))
})

test('photo uploads are sent as multipart without a JSON content type', async () => {
  let sent
  const client = createApiClient('http://api', async (_url, init) => { sent = init; return new Response(JSON.stringify({ url: 'https://x/y.png' }), { status: 201 }) })
  const form = new FormData()
  await client('/api/v1/orders/photos', { method: 'POST', token: 't', form })
  assert.equal(sent.body, form)
  assert.equal(sent.headers['Content-Type'], undefined)
  assert.equal(sent.headers.Authorization, 'Bearer t')
})


test('modal state lives in the URL and ignores unknown names', () => {
  const allowed = ['perfil', 'ajuda']
  assert.equal(readModal('?modal=perfil', allowed), 'perfil')
  assert.equal(readModal('?modal=outro', allowed), null)
  assert.equal(readModal('', allowed), null)
  assert.equal(searchWithModal('', 'ajuda'), '?modal=ajuda')
  assert.equal(searchWithModal('?a=1', 'perfil'), '?a=1&modal=perfil')
  assert.equal(searchWithModal('?a=1&modal=perfil', null), '?a=1')
  assert.equal(searchWithModal('?modal=perfil', null), '')
})

test('modal renders size, description, scrollable body and footer; blocks closing when not dismissible', () => {
  const render = (props) => renderToStaticMarkup(React.createElement(Modal, { title: 'Título', onClose() {}, ...props },
    React.createElement('p', null, 'Conteúdo')))
  const html = render({ size: 'lg', description: 'Apoio', footer: React.createElement('button', null, 'Salvar') })
  assert.match(html, /class="modal modal-lg"/)
  assert.match(html, /aria-labelledby="[^"]+"/)
  assert.match(html, /aria-describedby="[^"]+"/)
  assert.match(html, /class="modal-body"><p>Conteúdo<\/p>/)
  assert.match(html, /class="modal-footer"><button>Salvar<\/button>/)
  const plain = render({})
  assert.match(plain, /class="modal modal-md"/)
  assert.doesNotMatch(plain, /modal-footer|aria-describedby/)
  assert.match(render({ dismissible: false }), /aria-label="Fechar janela"[^>]*disabled=""|disabled=""[^>]*aria-label="Fechar janela"/)
})

test('modal intent is only kept for known actions and leaves with the modal', () => {
  assert.equal(readNext('?modal=finalizar-cadastro&next=criar-pedido'), 'criar-pedido')
  assert.equal(readNext('?next=apagar-tudo'), null)
  assert.equal(searchWithModal('', 'finalizar-cadastro', 'criar-pedido'), '?modal=finalizar-cadastro&next=criar-pedido')
  assert.equal(searchWithModal('?modal=finalizar-cadastro&next=criar-pedido', null), '')
  assert.equal(searchWithModal('?modal=perfil&next=criar-pedido', 'ajuda'), '?modal=ajuda')
})

test('registration masks and validation build the API payload', () => {
  assert.equal(maskCpf('12345678901'), '123.456.789-01')
  assert.equal(maskCep('60115000'), '60115-000')
  assert.equal(maskPhone('85999998888'), '(85) 99999-8888')
  assert.equal(isValidPhone('(85) 99999-8888'), true)
  assert.equal(isValidPhone('(85) 89999-8888'), false)
  const filled = { ...emptyRegistration('  Maria Souza '), cpf: '123.456.789-01', cep: '60115-000', logradouro: ' Rua A ', numero: '10',
    bairro: 'Centro', cidade: 'Fortaleza', estado: 'ce', contactValue: '(85) 99999-8888' }
  const ok = buildRegistration(filled)
  assert.deepEqual(ok.payload, { name: 'Maria Souza', cpf: '12345678901',
    endereco: { logradouro: 'Rua A', numero: '10', bairro: 'Centro', cidade: 'Fortaleza', estado: 'CE', cep: '60115000' },
    contato: { tipo: 'whatsapp', valor: '85999998888' } })
  assert.match(buildRegistration({ ...filled, cpf: '123' }).error, /CPF/)
  assert.match(buildRegistration({ ...filled, cep: '6011' }).error, /CEP/)
  assert.match(buildRegistration({ ...filled, estado: 'XX' }).error, /estado/)
  assert.match(buildRegistration({ ...filled, contactValue: '123' }).error, /telefone/)
  assert.match(buildRegistration({ ...filled, contactType: 'email_alt', contactValue: 'sem-arroba' }).error, /e-mail/)
  assert.equal(buildRegistration({ ...filled, contactType: 'email_alt', contactValue: ' A@B.com ' }).payload.contato.valor, 'a@b.com')
})

test('registration form exposes labelled fields and disables them while saving', () => {
  const render = (props) => renderToStaticMarkup(React.createElement(CompleteRegistrationForm, { id: 'f', disabled: false, onSubmit() {}, ...props }))
  const html = render({ defaultName: 'Maria Souza' })
  for (const label of ['Nome completo', 'CPF', 'CEP', 'Logradouro', 'Bairro', 'Cidade', 'Estado', 'Tipo de contato', 'Número de contato']) assert.match(html, new RegExp(label))
  assert.match(html, /value="Maria Souza"/)
  assert.match(html, /não pode ser alterado depois/)
  assert.doesNotMatch(html, /role="alert"/)
  assert.match(render({ disabled: true }), /<fieldset disabled=""/)
  assert.match(render({ error: 'CPF já em uso' }), /role="alert"[^>]*>CPF já em uso/)
})

test('sidebar only offers working destinations and marks the active one', () => {
  const render = (activeNav) => renderToStaticMarkup(React.createElement(Sidebar, {
    mobileOpen: false, setMobileOpen() {}, activeNav, navigate() {}, openDialog() {}, profile: { name: 'Maria Souza', location: '' },
  }))
  const html = render('Propostas')
  for (const label of ['Visão geral', 'Criar pedido', 'Meus pedidos', 'Propostas', 'Avaliações', 'Central de ajuda']) assert.match(html, new RegExp(`<span>${label}</span>`))
  for (const removed of ['Mensagens', 'Contratos', 'Pagamentos']) assert.doesNotMatch(html, new RegExp(removed))
  assert.equal((html.match(/aria-current="page"/g) ?? []).length, 1)
  assert.match(html, /nav-item active"[^>]*aria-current="page"[^>]*><svg[\s\S]*?<span>Propostas<\/span>/)
  assert.match(render('Criar pedido'), /aria-current="page"[^>]*>(?:(?!<\/button>)[\s\S])*<span>Criar pedido<\/span>/)
})

test('order list shortcuts can replace the page heading', () => {
  const heading = { title: 'Propostas', description: 'Pedidos que estão recebendo propostas.' }
  const html = renderOrders({ heading })
  assert.match(html, />Propostas<\/h1>/)
  assert.match(html, /Pedidos que estão recebendo propostas\./)
  assert.match(renderOrders({}), />Meus pedidos<\/h1>/)
})

test('create order opens as a wide modal on the assistant, without a page heading or back button', () => {
  const html = renderToStaticMarkup(React.createElement(CreateOrderModal, { token: 't', onClose() {}, onCreated() {} }))
  assert.match(html, /class="modal modal-xl"/)
  assert.match(html, /<h2[^>]*>Criar pedido<\/h2>/)
  assert.match(html, /<h3 id="assistant-title">Vamos resolver, juntos\.<\/h3>/)
  assert.doesNotMatch(html, /Voltar à visão geral/)
  assert.doesNotMatch(html, /<h1/)
  assert.doesNotMatch(html, /Descartar este pedido/)
  assert.doesNotMatch(html, /hidden=""/)
})

test('review modal link keeps the current page and carries the order id in the URL', () => {
  const id = randomUUID()
  assert.equal(readOrder(`?modal=avaliar&pedido=${id.toUpperCase()}`), id)
  assert.equal(readOrder('?pedido=../../etc'), null)
  assert.equal(searchWithModal('?status=Completed', 'avaliar', undefined, id), `?status=Completed&modal=avaliar&pedido=${id}`)
  assert.equal(searchWithModal(`?modal=avaliar&pedido=${id}&status=Completed`, null), '?status=Completed')
  const link = modalLink('/pedidos', '?status=Completed', 'avaliar', id)
  assert.deepEqual(link.to, { pathname: '/pedidos', search: `?status=Completed&modal=avaliar&pedido=${id}` })
  assert.equal(link.state.modalOpened, true)
})

test('order details show section tabs instead of per-page back buttons', () => {
  const id = randomUUID(), customerId = randomUUID()
  const order = { id, customerId, title: 'Serviço', category: 'Pedido', location: '', description: '', status: 'waiting', icon: 'bag', proposals: 2, proposalList: [] }
  for (const [view, active] of [[undefined, 'Detalhes'], ['propostas', 'Propostas \\(2\\)'], ['acompanhar', 'Acompanhamento']]) {
    const html = renderOrders({ orders: [order], customerId, orderId: id, view })
    assert.match(html, /aria-label="Seções do pedido"/)
    assert.match(html, new RegExp(`class="order-tab active" aria-current="page"[^>]*>${active}<`))
    assert.equal((html.match(/aria-current="page"/g) ?? []).length, 1)
    assert.match(html, new RegExp(`href="/pedidos/${id}/propostas"`))
    assert.match(html, new RegExp(`href="/pedidos/${id}/acompanhar"`))
    assert.doesNotMatch(html, /Ver detalhes do pedido/)
  }
})
