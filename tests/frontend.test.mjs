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

const { customerOrders, customerOrder, orderMoney, orderDate, canChangeOrder, orderToForm, orderStatusLabel, hasPaymentStep, nextStep } = await import('../src/services/orders.ts')
const { parseSummary, parsePage, parseDetail, parseUser, parseLogin, parseAssistantReply, isUuid, updateOrder, cancelOrder, completeOrder, toOrder } = await import('../src/services/dashboardApi.ts')
const { parseProfile } = await import('../src/services/accountApi.ts')
const { scopeToOrder } = await import('../src/services/orderDraft.ts')
const { DashboardOverview } = await import('../src/components/dashboard/DashboardOverview.tsx')
const { OrderAssistant } = await import('../src/components/OrderAssistant.tsx')
const { ApiError, createApiClient } = await import('../src/services/api.ts')
const { MyOrders } = await import('../src/pages/MyOrders.tsx')
const { OrderForm } = await import('../src/components/OrderForm.tsx')
const { ReviewForm } = await import('../src/components/OrderReview.tsx')
const { ReviewOrderPage } = await import('../src/pages/ReviewOrder/index.tsx')
const { HelpPage } = await import('../src/pages/Help/index.tsx')
const { AccountPage } = await import('../src/pages/Account/index.tsx')
const { ChangePasswordForm } = await import('../src/components/ChangePasswordForm.tsx')
const { validateNewPassword } = await import('../src/services/passwordForm.ts')
const { Modal } = await import('../src/components/Modal.tsx')
const { Sidebar } = await import('../src/components/dashboard/Sidebar.tsx')
const { NewOrderPage } = await import('../src/pages/NewOrder/index.tsx')
const { createOrderDraftStore, parseDraft, draftHasContent, emptyDraft } = await import('../src/services/orderDraftStore.ts')
const { EditOrderPage } = await import('../src/pages/EditOrder/index.tsx')
const { AcceptProposalModal } = await import('../src/components/AcceptProposalModal.tsx')
const { CancelOrderModal } = await import('../src/components/CancelOrderModal.tsx')
const { parseProposals, bestIds, ratingLabel, getOrderProposals, parseProposalDetail, getProposalDetail, acceptProposal, acceptBlock } = await import('../src/services/proposalsApi.ts')
const { parseAlerts, getProposalAlerts } = await import('../src/services/alertsApi.ts')
const { parseContract, getContract, signContract } = await import('../src/services/contractApi.ts')
const { ContractView } = await import('../src/components/ContractPanel.tsx')
const { parsePayment, getPayment, createPayment, simulatePayment, remainingLabel } = await import('../src/services/paymentApi.ts')
const { PaymentView, PaymentPanel } = await import('../src/components/PaymentPanel.tsx')
const { CompleteOrderModal } = await import('../src/components/CompleteOrderModal.tsx')
const { AlertsBell, AlertsList } = await import('../src/components/AlertsBell.tsx')
const { safeReturnPath, nextAfterRegistration } = await import('../src/services/returnPath.ts')
const { legacyModalTarget } = await import('../src/services/legacyModals.ts')
const { FinalizarCadastro } = await import('../src/pages/FinalizarCadastro/index.tsx')
const { NotFound } = await import('../src/pages/NotFound/index.tsx')
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
  assert.match(renderOrders({ orders: [order], customerId, orderId: id }), new RegExp(`href="/pedidos/${id}/avaliar"[^>]*>Avaliar serviço<`))
  assert.doesNotMatch(renderOrders({ orders: [order], customerId, orderId: id }), /modal=avaliar/)
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

test('create order is a page that starts on the assistant, with a way back and no modal', () => {
  const html = renderAt(React.createElement(NewOrderPage, { token: 't', customerId: randomUUID(), onCreated() {} }), '/pedidos/novo')
  assert.doesNotMatch(html, /<dialog|class="modal/)
  assert.match(html, /<h1 id="assistant-title">Vamos resolver, juntos\.<\/h1>/)
  assert.match(html, /href="\/pedidos"[^>]*>Voltar para meus pedidos</)
  assert.match(html, /Prefiro preencher o formulário/)
  // Sem rascunho guardado não há aviso de recuperação.
  assert.doesNotMatch(html, /Recuperamos o rascunho|Descartar/)
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

test('login only returns to known app screens with known parameters', () => {
  const id = randomUUID()
  for (const ok of ['/', '/pedidos', `/pedidos/${id}`, `/pedidos/${id}/propostas`, `/pedidos/${id}/propostas/${randomUUID()}`, `/pedidos/${id}/acompanhar`, '/pedidos?status=Completed&page=2',
    `/pedidos/${id}?modal=avaliar&pedido=${id}`, `/pedidos/${id}?modal=editar-pedido&pedido=${id}`, `/pedidos/${id}?modal=cancelar-pedido&pedido=${id}`, `/pedidos/${id}/propostas/${randomUUID()}?modal=aceitar-proposta`, `/pedidos/${id}/contrato`,
    '/?modal=finalizar-cadastro&next=criar-pedido']) assert.equal(safeReturnPath(ok), ok)
  for (const bad of [undefined, null, 42, 'https://evil.example', '//evil.example', '/login', '/pedidos/../x', '/pedidos/abc/propostas', `/pedidos/${id}/outra`,
    '/pedidos?status=Hacked', '/pedidos?redirect=https://evil.example', '/pedidos?status=Pending#x', '/pedidos?a=1?b=2', '/?modal=desconhecido', '/?pedido=1']) assert.equal(safeReturnPath(bad), '/')
})

test('unknown addresses show a not found page with a way home', () => {
  const html = renderToStaticMarkup(React.createElement(StaticRouter, { location: '/qualquer' }, React.createElement(NotFound)))
  assert.match(html, /<h1>Página não encontrada<\/h1>/)
  assert.match(html, /href="\/"[^>]*>Ir para o início/)
})

test('order cards offer details, proposals and review without a duplicated tracking button', () => {
  const id = randomUUID(), customerId = randomUUID()
  const order = { id, customerId, title: 'Serviço', category: 'Pedido', location: '', description: '', status: 'completed', icon: 'bag', proposals: 3 }
  const html = renderOrders({ orders: [order], customerId })
  assert.match(html, /Ver detalhes<\/a>/)
  assert.match(html, /Ver propostas \(3\)/)
  assert.match(html, /Avaliar serviço/)
  assert.doesNotMatch(html, /Acompanhar pedido/)
  assert.equal((html.match(/class="button/g) ?? []).length, 3)
})

const proposal = (overrides = {}) => ({ id: randomUUID(), providerId: randomUUID(), providerName: 'Prestador', status: 'Sent', value: 100,
  deadline: '3 dias', deadlineDays: 3, description: 'Serviço completo', warranty: '90 dias', createdAt: new Date().toISOString(),
  providerRating: { average: 4.5, count: 2 }, ...overrides })

test('proposals from the API are validated and legacy ones without optional fields are accepted', () => {
  assert.equal(parseProposals([proposal(), proposal({ status: 'NotChosen', deadline: undefined, deadlineDays: undefined, providerRating: { average: null, count: 0 } })]).length, 2)
  assert.deepEqual(parseProposals([]), [])
  for (const bad of [null, {}, [{}], [proposal({ status: 'Outro' })], [proposal({ value: 'caro' })], [proposal({ providerRating: { average: 'x', count: 1 } })]]) {
    assert.throws(() => parseProposals(bad), ApiError)
  }
})

test('comparison highlights the lowest price and deadline only when there is something to compare', () => {
  const a = proposal({ value: 300, deadlineDays: 2 }), b = proposal({ value: 200, deadlineDays: 5 }), c = proposal({ value: 200, deadlineDays: undefined })
  const best = bestIds([a, b, c])
  assert.deepEqual([...best.price].sort(), [b.id, c.id].sort())
  assert.deepEqual([...best.deadline], [a.id])
  assert.equal(bestIds([a, c]).deadline.size, 0)
  assert.equal(bestIds([a]).price.size, 0)
  assert.equal(ratingLabel({ average: 4.5, count: 1 }), '4,5 ★ (1 avaliação)')
  assert.equal(ratingLabel({ average: null, count: 0 }), 'Sem avaliações')
  assert.equal(ratingLabel(undefined), 'Sem avaliações')
})

test('proposals are requested sorted by the API and only for valid order ids', async () => {
  await assert.rejects(getOrderProposals('abc', 'token', 'price'), (error) => error.status === 404)
  const orderId = randomUUID()
  const calls = []
  const client = createApiClient('', async (url, init) => { calls.push([url, init.headers.Authorization]); return new Response(JSON.stringify([proposal()]), { status: 200 }) })
  assert.equal((await client(`/api/v1/orders/${orderId}/proposals?sort=deadline`, { token: 't' })).length, 1)
  assert.deepEqual(calls, [[`/api/v1/orders/${orderId}/proposals?sort=deadline`, 'Bearer t']])
})

test('the proposals tab asks for login without a session and loads from the API with one', () => {
  const id = randomUUID(), customerId = randomUUID()
  const order = { id, customerId, title: 'Serviço', category: 'Pedido', location: '', description: '', status: 'waiting', icon: 'bag', proposals: 2 }
  assert.match(renderOrders({ orders: [order], customerId, orderId: id, view: 'propostas' }), /Entre na sua conta para consultar as propostas/)
  assert.match(renderOrders({ orders: [order], customerId, orderId: id, view: 'propostas', token: 'abc' }), /Carregando propostas/)
})

test('only open orders without an accepted proposal can be edited or cancelled', () => {
  const base = { id: randomUUID(), customerId: randomUUID(), title: 'Serviço', category: 'Pedido', location: '', description: '', icon: 'bag', proposals: 0 }
  assert.equal(canChangeOrder({ ...base, status: 'waiting' }), true)
  assert.equal(canChangeOrder({ ...base, status: 'waiting', proposalList: [proposal({ status: 'Sent' }), proposal({ status: 'NotChosen' })] }), true)
  assert.equal(canChangeOrder({ ...base, status: 'waiting', proposalList: [proposal({ status: 'Chosen' })] }), false)
  for (const status of ['progress', 'completed', 'cancelled']) assert.equal(canChangeOrder({ ...base, status }), false)
})

test('the edit form starts from the order data without placeholder texts', () => {
  const order = { id: randomUUID(), customerId: randomUUID(), title: 'Trocar chuveiro', category: 'Pedido', location: 'Localização não informada',
    description: 'Abra os detalhes para consultar a descrição.', status: 'waiting', icon: 'bag', proposals: 0 }
  assert.deepEqual(orderToForm(order), { title: 'Trocar chuveiro', category: '', description: '', location: '', scope: { details: '', urgency: '', specifications: '' } })
  const full = { ...order, category: 'Elétrica', location: 'Meireles', description: 'Chuveiro queimou', scope: { details: 'Banheiro', urgency: 'Urgente', specifications: 'Trocar o chuveiro' } }
  assert.deepEqual(orderToForm(full), { title: 'Trocar chuveiro', category: 'Elétrica', description: 'Chuveiro queimou', location: 'Meireles',
    scope: { details: 'Banheiro', urgency: 'Urgente', specifications: 'Trocar o chuveiro' } })
})

test('editing and cancelling call the order routes and show the API explanation', async () => {
  const id = randomUUID()
  const detail = { id, title: 'Serviço', description: 'Descrição longa', status: 'Cancelled', createdAt: new Date().toISOString(), cancellationReason: 'Desisti' }
  const calls = []
  const client = (status, body) => createApiClient('', async (url, init) => {
    calls.push([init.method, url, init.body]); return new Response(JSON.stringify(body), { status })
  })
  assert.equal(toOrder(parseDetail(detail), randomUUID()).cancellationReason, 'Desisti')

  const ok = client(200, detail)
  assert.equal((await ok(`/api/v1/orders/${id}/cancel`, { method: 'POST', token: 't', body: { reason: 'Desisti' } })).id, id)
  assert.deepEqual(calls[0], ['POST', `/api/v1/orders/${id}/cancel`, JSON.stringify({ reason: 'Desisti' })])

  for (const [method, path] of [['PATCH', `/api/v1/orders/${id}`], ['POST', `/api/v1/orders/${id}/cancel`]]) {
    await assert.rejects(client(409, { detail: 'Este pedido não pode mais ser cancelado: uma proposta já foi aceita.' })(path, { method, token: 't', body: {} }),
      (error) => error.status === 409 && /proposta já foi aceita/.test(error.message))
    await assert.rejects(client(409, {})(path, { method, token: 't', body: {} }), (error) => /não pode mais ser alterado/.test(error.message))
    await assert.rejects(client(404, {})(path, { method, token: 't', body: {} }), (error) => error.status === 404 && /Pedido não encontrado/.test(error.message))
  }
  await assert.rejects(updateOrder('t', 'abc', { title: '', category: '', description: '', location: '', scope: { details: '', urgency: '', specifications: '' } }, []), (error) => error.status === 404)
  await assert.rejects(cancelOrder('t', 'abc', ''), (error) => error.status === 404)
})

test('the order form switches to edit mode with the saved photos and a save button', () => {
  const initial = { title: 'Trocar chuveiro', category: 'Elétrica', description: 'Chuveiro queimou', location: 'Meireles',
    scope: { details: 'Banheiro', urgency: 'Urgente', specifications: 'Trocar o chuveiro' } }
  const html = renderToStaticMarkup(React.createElement(OrderForm, { onCancel() {}, onCreate: async () => {}, submitting: false, submitError: '',
    initial, savedPhotos: ['https://exemplo.com/a.jpg'] }))
  assert.match(html, /<h1 id="order-form-title">Editar pedido<\/h1>/)
  assert.match(html, /value="Trocar chuveiro"/)
  assert.match(html, /Salvar alterações/)
  assert.doesNotMatch(html, /Publicar pedido/)
  assert.match(html, /src="https:\/\/exemplo\.com\/a\.jpg"/)
  assert.match(html, /aria-label="Remover foto salva 1"/)
  const created = renderToStaticMarkup(React.createElement(OrderForm, { onCancel() {}, onCreate: async () => {}, submitting: false, submitError: '' }))
  assert.match(created, /Publicar pedido/)
  assert.doesNotMatch(created, /Fotos já salvas/)
})

test('order details offer edit and cancel only while nothing was accepted and show the cancellation reason', () => {
  const id = randomUUID(), customerId = randomUUID()
  const order = (extra) => ({ id, customerId, title: 'Serviço', category: 'Pedido', location: '', description: 'Descrição do pedido', status: 'waiting', icon: 'bag', proposals: 1, ...extra })
  const open = renderOrders({ orders: [order()], customerId, orderId: id })
  assert.match(open, />Editar pedido<\/a>/)
  assert.match(open, />Cancelar pedido<\/a>/)
  assert.match(open, new RegExp(`href="/pedidos/${id}/editar"[^>]*>Editar pedido<`))
  assert.doesNotMatch(open, /modal=editar-pedido/)
  assert.match(open, new RegExp(`modal=cancelar-pedido&amp;pedido=${id}`))
  for (const closed of [order({ proposalList: [proposal({ status: 'Chosen' })] }), order({ status: 'progress' }), order({ status: 'completed' })]) {
    const html = renderOrders({ orders: [closed], customerId, orderId: id })
    assert.doesNotMatch(html, /Editar pedido|Cancelar pedido/)
  }
  const cancelled = renderOrders({ orders: [order({ status: 'cancelled', cancellationReason: 'Resolvi por conta própria' })], customerId, orderId: id })
  assert.match(cancelled, /Motivo do cancelamento/)
  assert.match(cancelled, /Resolvi por conta própria/)
  assert.doesNotMatch(cancelled, />Editar pedido</)
})

test('the cancel modal asks for confirmation with an optional reason', () => {
  const id = randomUUID()
  const order = { id, customerId: randomUUID(), title: 'Trocar chuveiro', category: 'Elétrica', location: 'Meireles', description: 'Chuveiro queimou',
    status: 'waiting', icon: 'bag', proposals: 0, scope: { details: 'Banheiro', urgency: 'Urgente', specifications: 'Trocar o chuveiro' }, photoUrls: ['https://exemplo.com/a.jpg'] }
  const cancel = renderToStaticMarkup(React.createElement(CancelOrderModal, { order, token: 't', onClose() {}, onCancelled() {} }))
  assert.match(cancel, /Cancelar pedido/)
  assert.match(cancel, /Motivo do cancelamento/)
  assert.match(cancel, /maxLength="500"/)
  assert.match(cancel, /Manter pedido/)
})

test('proposal detail needs the provider summary and rejects a different proposal', async () => {
  const detail = proposal({ providerProfile: { memberSince: '2026-01-10T12:00:00Z', completedServices: 3 } })
  assert.equal(parseProposalDetail(detail).providerProfile.completedServices, 3)
  for (const bad of [proposal(), proposal({ providerProfile: {} }), proposal({ providerProfile: { memberSince: 'ontem', completedServices: 1 } }),
    proposal({ providerProfile: { memberSince: '2026-01-10T12:00:00Z', completedServices: -1 } })]) assert.throws(() => parseProposalDetail(bad), ApiError)
  await assert.rejects(getProposalDetail('abc', randomUUID(), 't'), (error) => error.status === 404)
  await assert.rejects(getProposalDetail(randomUUID(), 'abc', 't'), (error) => error.status === 404)
  await assert.rejects(acceptProposal(randomUUID(), 'abc', 't'), (error) => error.status === 404)
})

test('accepting a proposal shows the API explanation when it conflicts', async () => {
  const orderId = randomUUID(), proposalId = randomUUID()
  const path = `/api/v1/orders/${orderId}/proposals/${proposalId}/accept`
  const client = (status, body) => createApiClient('', async () => new Response(JSON.stringify(body), { status }))
  await assert.rejects(client(409, { detail: 'Este pedido já tem uma proposta aceita.' })(path, { method: 'POST', token: 't' }),
    (error) => error.status === 409 && error.message === 'Este pedido já tem uma proposta aceita.')
  await assert.rejects(client(409, {})(path, { method: 'POST', token: 't' }), (error) => /não pode mais ser alterado/.test(error.message))
  await assert.rejects(client(404, {})(path, { method: 'POST', token: 't' }), (error) => error.status === 404)
})

test('a proposal can only be accepted on an open order that has no accepted proposal', () => {
  const base = { id: randomUUID(), customerId: randomUUID(), title: 'Serviço', category: 'Pedido', location: '', description: '', icon: 'bag', proposals: 2 }
  const sent = { id: randomUUID(), status: 'Sent' }
  assert.equal(acceptBlock({ ...base, status: 'waiting' }, sent), undefined)
  assert.equal(acceptBlock({ ...base, status: 'waiting', proposalList: [proposal({ status: 'Sent' })] }, { id: randomUUID(), status: 'Viewed' }), undefined)
  assert.match(acceptBlock({ ...base, status: 'waiting' }, { id: randomUUID(), status: 'Chosen' }), /já aceitou esta proposta/)
  assert.match(acceptBlock({ ...base, status: 'cancelled' }, sent), /foi cancelado/)
  assert.match(acceptBlock({ ...base, status: 'progress' }, sent), /em andamento/)
  assert.match(acceptBlock({ ...base, status: 'completed' }, sent), /em andamento ou foi concluído/)
  assert.match(acceptBlock({ ...base, status: 'waiting', proposalList: [proposal({ status: 'Chosen' })] }, sent), /Outra proposta já foi aceita/)
  assert.match(acceptBlock({ ...base, status: 'waiting' }, { id: randomUUID(), status: 'NotChosen' }), /não está mais disponível/)
})

test('an open order with an accepted proposal is labelled as accepted, not as receiving proposals', () => {
  const base = { id: randomUUID(), customerId: randomUUID(), title: 'Serviço', category: 'Pedido', location: '', description: '', icon: 'bag', proposals: 1 }
  assert.equal(orderStatusLabel({ ...base, status: 'waiting' }), 'Recebendo propostas')
  assert.equal(orderStatusLabel({ ...base, status: 'waiting', proposalList: [proposal({ status: 'Chosen' })] }), 'Proposta aceita')
  assert.equal(orderStatusLabel({ ...base, status: 'progress', proposalList: [proposal({ status: 'Chosen' })] }), 'Em andamento')
})

test('the accept modal confirms who is hired, for how much and what happens next', () => {
  const order = { id: randomUUID(), customerId: randomUUID(), title: 'Serviço', category: 'Pedido', location: '', description: '', status: 'waiting', icon: 'bag', proposals: 2 }
  const html = renderToStaticMarkup(React.createElement(AcceptProposalModal, { order, proposal: proposal({ providerName: 'Ana Eletricista', value: 900, deadline: '10 dias' }),
    token: 't', onClose() {}, onAccepted() {} }))
  assert.match(html, /Aceitar proposta/)
  assert.match(html, /Ana Eletricista/)
  assert.match(html, /R\$\s?900,00/)
  assert.match(html, /prazo de 10 dias/)
  assert.match(html, /demais propostas do pedido serão encerradas/)
  assert.match(html, /depois do contrato e do pagamento/)
  assert.match(html, />Voltar</)
})

test('opening a proposal asks for login without a session and loads the detail from the API with one', () => {
  const id = randomUUID(), customerId = randomUUID()
  const order = { id, customerId, title: 'Serviço', category: 'Pedido', location: '', description: '', status: 'waiting', icon: 'bag', proposals: 2 }
  const route = `/pedidos/${id}/propostas/${randomUUID()}`
  const render = (props) => renderToStaticMarkup(React.createElement(StaticRouter, { location: route },
    React.createElement(MyOrders, { orders: [order], customerId, search: '', orderId: id, view: 'propostas', proposalId: randomUUID(), ...props })))
  assert.match(render({}), /Entre na sua conta para consultar a proposta/)
  assert.match(render({ token: 'abc' }), /Carregando proposta/)
  assert.match(render({}), new RegExp(`href="/pedidos/${id}/propostas"[^>]*>Voltar às propostas`))
})

const alertItem = (overrides = {}) => ({ id: randomUUID(), orderId: randomUUID(), orderTitle: 'Trocar chuveiro', providerName: 'Ana Eletricista',
  value: 300, createdAt: new Date().toISOString(), ...overrides })

test('proposal alerts from the API are validated', () => {
  assert.deepEqual(parseAlerts({ total: 0, items: [] }), { total: 0, items: [] })
  assert.equal(parseAlerts({ total: 7, items: [alertItem(), alertItem()] }).items.length, 2)
  for (const bad of [null, {}, { total: -1, items: [] }, { total: 1.5, items: [] }, { total: 1 }, { total: 0, items: [alertItem()] },
    { total: 1, items: [alertItem({ id: 'abc' })] }, { total: 1, items: [alertItem({ orderId: 'abc' })] },
    { total: 1, items: [alertItem({ value: 'caro' })] }, { total: 1, items: [alertItem({ createdAt: 'ontem' })] }]) {
    assert.throws(() => parseAlerts(bad), ApiError)
  }
})

test('proposal alerts are requested with a limit and the session token', async () => {
  const calls = []
  const client = createApiClient('', async (url, init) => {
    calls.push([url, init.headers.Authorization]); return new Response(JSON.stringify({ total: 1, items: [alertItem()] }), { status: 200 })
  })
  assert.equal((await client('/api/v1/proposals/unviewed?limit=5', { token: 't' })).total, 1)
  assert.deepEqual(calls, [['/api/v1/proposals/unviewed?limit=5', 'Bearer t']])
  assert.equal(typeof getProposalAlerts, 'function')
})

const renderAt = (element) => renderToStaticMarkup(React.createElement(StaticRouter, { location: '/' }, element))

test('the alerts bell shows how many new proposals there are, capped, and is labelled for screen readers', () => {
  const html = (total) => renderAt(React.createElement(AlertsBell, { alerts: total === undefined ? undefined : { total, items: [] } }))
  assert.match(html(0), /aria-label="Alertas: nenhuma proposta nova"/)
  assert.doesNotMatch(html(0), /alerts-badge/)
  assert.match(html(1), /aria-label="Alertas: 1 proposta nova"/)
  assert.match(html(1), /<span class="alerts-badge" aria-hidden="true">1<\/span>/)
  assert.match(html(4), /aria-label="Alertas: 4 propostas novas"/)
  assert.match(html(25), />9\+<\/span>/)
  assert.match(html(undefined), /aria-label="Alertas: nenhuma proposta nova"/)
  assert.match(html(2), /aria-expanded="false"/)
  assert.doesNotMatch(html(2), /Novas propostas/)
})

test('the alerts list links each new proposal to its detail with order, provider and value', () => {
  const first = alertItem({ providerName: 'Ana Eletricista', orderTitle: 'Trocar chuveiro', value: 300 })
  const html = renderAt(React.createElement(AlertsList, { alerts: { total: 5, items: [first, alertItem({ providerName: 'Bruno Pedreiro' })] } }))
  assert.match(html, new RegExp(`href="/pedidos/${first.orderId}/propostas/${first.id}"`))
  assert.match(html, /Ana Eletricista/)
  assert.match(html, /Trocar chuveiro/)
  assert.match(html, /R\$\s?300,00/)
  assert.match(html, /Bruno Pedreiro/)
  assert.match(html, /3 a mais/)
  assert.match(html, /href="\/pedidos\?status=Pending"/)
  const all = renderAt(React.createElement(AlertsList, { alerts: { total: 1, items: [first] } }))
  assert.doesNotMatch(all, /a mais/)
})

test('the alerts list explains loading, failure and the empty state', () => {
  assert.match(renderAt(React.createElement(AlertsList, { loading: true })), /Carregando alertas/)
  assert.match(renderAt(React.createElement(AlertsList, {})), /Não foi possível carregar os alertas/)
  assert.match(renderAt(React.createElement(AlertsList, { alerts: { total: 0, items: [] } })), /Nenhuma proposta nova/)
  assert.match(renderAt(React.createElement(AlertsList, { alerts: { total: 1, items: [alertItem()] }, failed: true })), /mostrando o último resultado/)
})

const hash = 'a'.repeat(64)
const contractDto = (overrides = {}) => ({ id: randomUUID(), orderId: randomUUID(), proposalId: randomUUID(), status: 'Pending', templateVersion: '2026-11-v1',
  text: 'CONTRATO DE PRESTAÇÃO DE SERVIÇOS\n\nCLÁUSULA 1', textHash: hash, value: 800, customerName: 'Maria Contratante', providerName: 'Ana Eletricista',
  createdAt: new Date().toISOString(), ...overrides })

test('the contract from the API is validated, and Signed needs both signatures', () => {
  assert.equal(parseContract(contractDto()).status, 'Pending')
  const signedAt = new Date().toISOString()
  assert.equal(parseContract(contractDto({ customerSignedAt: signedAt })).providerSignedAt, undefined)
  assert.equal(parseContract(contractDto({ status: 'Signed', customerSignedAt: signedAt, providerSignedAt: signedAt })).status, 'Signed')
  for (const bad of [null, {}, contractDto({ status: 'Outro' }), contractDto({ text: '  ' }), contractDto({ textHash: 'abc' }), contractDto({ value: 'caro' }),
    contractDto({ id: 'abc' }), contractDto({ customerSignedAt: 'ontem' }), contractDto({ status: 'Signed' }),
    contractDto({ status: 'Signed', customerSignedAt: signedAt }), contractDto({ status: 'Pending', customerSignedAt: signedAt, providerSignedAt: signedAt })]) {
    assert.throws(() => parseContract(bad), ApiError)
  }
})

test('the contract is read and signed through the order routes, sending the hash that was read', async () => {
  const orderId = randomUUID()
  const calls = []
  const client = (status, body) => createApiClient('', async (url, init) => {
    calls.push([init.method, url, init.body]); return new Response(JSON.stringify(body), { status })
  })
  await assert.rejects(getContract('abc', 't'), (error) => error.status === 404)
  await assert.rejects(signContract('abc', hash, 't'), (error) => error.status === 404)
  const ok = client(200, contractDto({ orderId }))
  assert.equal(parseContract(await ok(`/api/v1/orders/${orderId}/contract/sign`, { method: 'POST', token: 't', body: { textHash: hash } })).orderId, orderId)
  assert.deepEqual(calls[0], ['POST', `/api/v1/orders/${orderId}/contract/sign`, JSON.stringify({ textHash: hash })])
  for (const detail of ['Você já assinou este contrato.', 'O texto do contrato não é mais o que você leu. Recarregue a página e leia de novo antes de assinar.']) {
    await assert.rejects(client(409, { detail })(`/api/v1/orders/${orderId}/contract/sign`, { method: 'POST', token: 't', body: { textHash: hash } }),
      (error) => error.status === 409 && error.message === detail)
  }
  await assert.rejects(client(409, {})(`/api/v1/orders/${orderId}/contract/sign`, { method: 'POST', token: 't', body: { textHash: hash } }),
    (error) => /não pode mais ser alterado/.test(error.message))
})

const contractOrder = () => ({ id: randomUUID(), customerId: randomUUID(), title: 'Serviço', category: 'Pedido', location: '', description: '', status: 'waiting', icon: 'bag', proposals: 1 })
const renderContract = (contract, extra = {}) => renderAt(React.createElement(ContractView, { order: contractOrder(), contract, onSign() {}, ...extra }))

test('the contract screen shows the text, both signatures and a single sign action while the customer has not signed', () => {
  const html = renderContract(parseContract(contractDto()))
  assert.match(html, /Contrato do pedido #/)
  assert.match(html, /Aguardando assinaturas/)
  assert.match(html, /CONTRATO DE PRESTAÇÃO DE SERVIÇOS/)
  assert.match(html, /aria-label="Texto do contrato"/)
  assert.match(html, /R\$\s?800,00/)
  assert.match(html, /Maria Contratante/)
  assert.match(html, /Ana Eletricista/)
  assert.match(html, /Aguardando a sua assinatura/)
  assert.match(html, /Aguardando assinatura do prestador/)
  assert.match(html, />Assinar contrato</)
  assert.doesNotMatch(html, /type="checkbox"/)
  assert.doesNotMatch(html, /Ir para pagamento/)
})

test('after the customer signs the screen waits for the provider, and after both it points to the payment', () => {
  const when = new Date().toISOString()
  const waiting = renderContract(parseContract(contractDto({ customerSignedAt: when })))
  assert.doesNotMatch(waiting, />Assinar contrato</)
  assert.match(waiting, /Você já assinou\. Falta o prestador assinar/)
  assert.match(waiting, /Assinou em/)
  assert.match(waiting, /Aguardando assinatura do prestador/)

  const signed = parseContract(contractDto({ status: 'Signed', customerSignedAt: when, providerSignedAt: when }))
  const done = renderContract(signed)
  assert.match(done, /Assinado pelas duas partes/)
  assert.match(done, /Contrato assinado/)
  assert.doesNotMatch(done, />Assinar contrato</)
  assert.doesNotMatch(done, /Ir para pagamento/)
  assert.match(renderContract(signed, { onPay: '/pedidos/x/pagamento' }), /href="\/pedidos\/x\/pagamento"[^>]*>Ir para pagamento/)
  assert.match(renderContract(parseContract(contractDto()), { signError: 'Você já assinou este contrato.' }), /role="alert">Você já assinou este contrato\./)
  assert.match(renderContract(parseContract(contractDto()), { signing: true }), /disabled=""[^>]*>Assinando…/)
})

test('the contract tab only exists after a proposal was accepted, and loads from the API', () => {
  const id = randomUUID(), customerId = randomUUID()
  const base = { id, customerId, title: 'Serviço', category: 'Pedido', location: '', description: '', status: 'waiting', icon: 'bag', proposals: 1 }
  const withChosen = renderOrders({ orders: [{ ...base, proposalList: [proposal({ status: 'Chosen' })] }], customerId, orderId: id })
  assert.match(withChosen, new RegExp(`href="/pedidos/${id}/contrato"[^>]*>Contrato<`))
  assert.doesNotMatch(renderOrders({ orders: [{ ...base, proposalList: [proposal({ status: 'Sent' })] }], customerId, orderId: id }), /\/contrato/)
  assert.match(renderOrders({ orders: [base], customerId, orderId: id, view: 'contrato' }), /Entre na sua conta para consultar o contrato/)
  assert.match(renderOrders({ orders: [base], customerId, orderId: id, view: 'contrato', token: 'abc' }), /Carregando contrato/)
})

const stageOrder = (extra = {}) => ({ id: randomUUID(), customerId: randomUUID(), title: 'Serviço', category: 'Pedido', location: '', description: '', status: 'waiting', icon: 'bag', proposals: 1, ...extra })
const stageDto = (extra = {}) => ({ id: randomUUID(), title: 'Serviço', description: 'Descrição longa', status: 'Pending', createdAt: new Date().toISOString(), ...extra })

test('the stage from the API is read, validated and shown in the order status', () => {
  assert.equal(toOrder(parseDetail(stageDto({ stage: 'AwaitingPayment' })), randomUUID()).stage, 'AwaitingPayment')
  assert.equal(toOrder(parseDetail(stageDto()), randomUUID()).stage, undefined)
  assert.throws(() => parseDetail(stageDto({ stage: 'Qualquer' })), ApiError)
  assert.throws(() => parsePage({ items: [stageDto({ stage: 1 })], page: 1, pageSize: 10, totalItems: 1, totalPages: 1 }), ApiError)

  // Na lista não há propostas carregadas: o estágio sozinho já diz em que passo o pedido está.
  assert.equal(orderStatusLabel(stageOrder({ stage: 'AwaitingSignatures' })), 'Aguardando assinaturas')
  assert.equal(orderStatusLabel(stageOrder({ stage: 'AwaitingPayment' })), 'Aguardando pagamento')
  assert.equal(orderStatusLabel(stageOrder()), 'Recebendo propostas')
  assert.equal(orderStatusLabel(stageOrder({ status: 'progress' })), 'Em andamento')
  assert.equal(orderStatusLabel(stageOrder({ status: 'progress', stage: 'AwaitingPayment' })), 'Em andamento')
})

test('an order waiting for signatures or payment can no longer be edited or cancelled', () => {
  assert.equal(canChangeOrder(stageOrder()), true)
  assert.equal(canChangeOrder(stageOrder({ stage: 'AwaitingSignatures' })), false)
  assert.equal(canChangeOrder(stageOrder({ stage: 'AwaitingPayment' })), false)
})

test('the payment step and the next action follow the order stage', () => {
  const chosen = [{ id: randomUUID(), providerName: 'Ana', status: 'Chosen', value: 800 }]
  const open = stageOrder()
  assert.equal(hasPaymentStep(open), false)
  assert.equal(hasPaymentStep(stageOrder({ stage: 'AwaitingSignatures' })), false)
  assert.equal(hasPaymentStep(stageOrder({ stage: 'AwaitingPayment' })), true)
  assert.equal(hasPaymentStep(stageOrder({ status: 'progress', proposalList: chosen })), true)
  assert.equal(hasPaymentStep(stageOrder({ status: 'completed', proposalList: chosen })), true)
  assert.equal(hasPaymentStep(stageOrder({ status: 'cancelled' })), false)

  assert.equal(nextStep(open), undefined)
  assert.equal(nextStep(stageOrder({ status: 'completed' })), undefined)
  const sign = stageOrder({ stage: 'AwaitingSignatures' })
  assert.deepEqual([nextStep(sign).label, nextStep(sign).to], ['Ver e assinar contrato', `/pedidos/${sign.id}/contrato`])
  const pay = stageOrder({ stage: 'AwaitingPayment' })
  assert.deepEqual([nextStep(pay).label, nextStep(pay).to], ['Pagar com Pix', `/pedidos/${pay.id}/pagamento`])
  const running = nextStep(stageOrder({ status: 'progress' }))
  assert.deepEqual([running.label, running.action, running.to], ['Confirmar conclusão', 'complete', undefined])
})

test('completing an order posts to its route and shows the API explanation', async () => {
  const id = randomUUID()
  const calls = []
  const client = (status, body) => createApiClient('', async (url, init) => {
    calls.push([init.method, url, init.body]); return new Response(JSON.stringify(body), { status })
  })
  await assert.rejects(completeOrder('t', 'abc'), (error) => error.status === 404)
  const ok = client(200, stageDto({ id, status: 'Completed' }))
  assert.equal((await ok(`/api/v1/orders/${id}/complete`, { method: 'POST', token: 't' })).status, 'Completed')
  assert.deepEqual(calls[0], ['POST', `/api/v1/orders/${id}/complete`, undefined])
  const detail = 'Só é possível concluir um pedido em andamento, com o pagamento confirmado.'
  await assert.rejects(client(409, { detail })(`/api/v1/orders/${id}/complete`, { method: 'POST', token: 't' }), (error) => error.status === 409 && error.message === detail)
})

const paymentDto = (overrides = {}) => ({ id: randomUUID(), orderId: randomUUID(), method: 'Pix', status: 'Pending', amount: 800, brCode: '00020101021226pix',
  qrCodeBase64: 'data:image/png;base64,AAAA', expiresAt: new Date(Date.now() + 1_800_000).toISOString(), testMode: true, createdAt: new Date().toISOString(), ...overrides })

test('the payment from the API is validated, and Paid needs the payment date', () => {
  assert.equal(parsePayment(paymentDto()).status, 'Pending')
  assert.equal(parsePayment(paymentDto({ qrCodeBase64: undefined })).qrCodeBase64, undefined)
  assert.equal(parsePayment(paymentDto({ status: 'Paid', paidAt: new Date().toISOString() })).status, 'Paid')
  for (const status of ['Expired', 'Cancelled']) assert.equal(parsePayment(paymentDto({ status })).status, status)
  for (const bad of [null, {}, paymentDto({ status: 'Outro' }), paymentDto({ method: 'Boleto' }), paymentDto({ amount: '800' }), paymentDto({ amount: -1 }),
    paymentDto({ brCode: '  ' }), paymentDto({ id: 'abc' }), paymentDto({ testMode: 'sim' }), paymentDto({ expiresAt: 'amanhã' }),
    paymentDto({ status: 'Paid' }), paymentDto({ status: 'Pending', paidAt: new Date().toISOString() }),
    // O QR Code só pode ser imagem embutida: nenhum outro tipo de endereço vira src.
    paymentDto({ qrCodeBase64: 'https://exemplo.com/qr.png' }), paymentDto({ qrCodeBase64: 'javascript:alert(1)' }), paymentDto({ qrCodeBase64: 'data:text/html;base64,AAAA' })]) {
    assert.throws(() => parsePayment(bad), ApiError)
  }
})

test('payment calls reject an invalid order id before reaching the API', async () => {
  const orderId = randomUUID()
  await assert.rejects(getPayment('abc', 't'), (error) => error.status === 404)
  await assert.rejects(createPayment('abc', 't'), (error) => error.status === 404)
  await assert.rejects(simulatePayment('abc', 't'), (error) => error.status === 404)

  // Uma resposta de outro pedido nunca é aceita como a deste.
  assert.equal(parsePayment(paymentDto({ orderId })).orderId, orderId)
})

test('payment routes show the API explanation on 409 and 503', async () => {
  const id = randomUUID()
  const client = (status, body) => createApiClient('', async () => new Response(JSON.stringify(body), { status }))
  for (const [path, status, detail] of [
    [`/api/v1/orders/${id}/payment`, 409, 'O pagamento só começa depois que as duas partes assinarem o contrato.'],
    [`/api/v1/orders/${id}/payment`, 503, 'O pagamento está indisponível no momento. Tente novamente em instantes.'],
    [`/api/v1/orders/${id}/payment/simulate`, 409, 'A simulação de pagamento só existe em modo de teste.'],
  ]) {
    await assert.rejects(client(status, { detail })(path, { method: 'POST', token: 't' }), (error) => error.status === status && error.message === detail)
  }
})

const payOrder = (extra = {}) => stageOrder({ stage: 'AwaitingPayment', chosenProposalValue: 800, ...extra })
const renderPayment = (props = {}) => renderAt(React.createElement(PaymentView, { order: payOrder(), onGenerate() {}, onSimulate() {}, ...props }))

test('remainingLabel counts down as mm:ss and never goes negative', () => {
  const now = Date.parse('2026-11-27T12:00:00Z')
  assert.equal(remainingLabel('2026-11-27T12:30:00Z', now), '30:00')
  assert.equal(remainingLabel('2026-11-27T12:00:59Z', now), '00:59')
  assert.equal(remainingLabel('2026-11-27T12:05:09.900Z', now), '05:09')
  assert.equal(remainingLabel('2026-11-27T11:59:00Z', now), '00:00')
})

test('without a charge the payment screen offers to generate the Pix with the agreed value', () => {
  const html = renderPayment()
  assert.match(html, /Pagamento do pedido #/)
  assert.match(html, /R\$\s?800,00/)
  assert.match(html, />Gerar Pix</)
  assert.match(html, /30 minutos/)
  assert.doesNotMatch(html, /QR Code/)
  assert.match(renderPayment({ generating: true }), /disabled=""[^>]*>Gerando Pix…/)
  assert.match(renderPayment({ actionError: 'O pagamento está indisponível no momento.' }), /role="alert">O pagamento está indisponível/)
  // Fora de "aguardando pagamento" não há como gerar.
  const closed = renderPayment({ order: payOrder({ stage: undefined, status: 'progress' }) })
  assert.match(closed, /Não há pagamento registrado/)
  assert.doesNotMatch(closed, />Gerar Pix</)
})

test('a pending Pix shows the QR Code, the copy and paste code and the time left', () => {
  const html = renderPayment({ payment: parsePayment(paymentDto()) })
  assert.match(html, /Aguardando pagamento/)
  assert.match(html, /<img[^>]*class="payment-qr"[^>]*src="data:image\/png;base64,AAAA"[^>]*alt="QR Code do Pix"/)
  assert.match(html, /Pix copia e cola/)
  assert.match(html, /<textarea[^>]*readonly=""[^>]*>00020101021226pix<\/textarea>/)
  assert.match(html, />Copiar código</)
  assert.match(html, /Expira em <time[^>]*>\d\d:\d\d<\/time>/)
  assert.match(html, /confere o pagamento sozinha/)
  assert.doesNotMatch(html, />Gerar (novo )?Pix</)
  // Sem imagem (a API não mandou o QR Code), o código copia e cola continua disponível.
  const noImage = renderPayment({ payment: parsePayment(paymentDto({ qrCodeBase64: undefined })) })
  assert.doesNotMatch(noImage, /<img/)
  assert.match(noImage, /Pix copia e cola/)
})

test('the simulate button only exists for test charges', () => {
  const test_ = renderPayment({ payment: parsePayment(paymentDto({ testMode: true })) })
  assert.match(test_, /Modo de teste/)
  assert.match(test_, />Simular pagamento</)
  assert.match(renderPayment({ payment: parsePayment(paymentDto({ testMode: true })), simulating: true }), /disabled=""[^>]*>Simulando…/)
  const real = renderPayment({ payment: parsePayment(paymentDto({ testMode: false })) })
  assert.doesNotMatch(real, /Modo de teste/)
  assert.doesNotMatch(real, /Simular pagamento/)
})

test('an expired or cancelled Pix explains it and offers a new one', () => {
  const expired = renderPayment({ payment: parsePayment(paymentDto({ status: 'Expired' })) })
  assert.match(expired, /Pix expirado/)
  assert.match(expired, /Nenhum valor foi cobrado/)
  assert.match(expired, />Gerar novo Pix</)
  assert.doesNotMatch(expired, /QR Code/)
  const cancelled = renderPayment({ payment: parsePayment(paymentDto({ status: 'Cancelled' })) })
  assert.match(cancelled, /Pix cancelado/)
  assert.match(cancelled, />Gerar novo Pix</)
})

test('a paid Pix confirms the payment and leads to the tracking', () => {
  const payment = parsePayment(paymentDto({ status: 'Paid', paidAt: new Date().toISOString() }))
  const order = payOrder({ stage: undefined, status: 'progress' })
  const html = renderPayment({ order, payment })
  assert.match(html, /Pagamento confirmado/)
  assert.match(html, /O serviço está em andamento/)
  assert.match(html, new RegExp(`href="/pedidos/${order.id}/acompanhar"[^>]*>Acompanhar o serviço`))
  assert.doesNotMatch(html, /QR Code|Gerar/)
  assert.match(renderPayment({ order: { ...order, status: 'completed' }, payment }), /O serviço foi concluído/)
})

test('the payment panel explains when the payment is not available yet', () => {
  const render = (order, token = 'abc') => renderAt(React.createElement(PaymentPanel, { order, token }))
  assert.match(render(payOrder(), null), /Entre na sua conta para consultar o pagamento/)
  assert.match(render(payOrder()), /Carregando pagamento/)

  const waiting = stageOrder({ stage: 'AwaitingSignatures' })
  const signatures = render(waiting)
  assert.match(signatures, /Pagamento ainda não disponível/)
  assert.match(signatures, new RegExp(`href="/pedidos/${waiting.id}/contrato"[^>]*>Ver contrato`))
  const open = stageOrder()
  assert.match(render(open), new RegExp(`href="/pedidos/${open.id}/propostas"[^>]*>Ver propostas`))
  assert.match(render(stageOrder({ status: 'cancelled' })), /foi cancelado, então não há pagamento/)
  assert.doesNotMatch(render(open), /Carregando pagamento/)
})

const customerStage = (extra = {}) => { const customerId = randomUUID(); return { customerId, order: stageOrder({ customerId, ...extra }) } }
const showOrder = (extra, props = {}) => { const { customerId, order } = customerStage(extra); return { order, html: renderOrders({ orders: [order], customerId, orderId: order.id, ...props }) } }

test('the payment tab appears only when the contract is signed by both or the order was paid', () => {
  const chosen = [proposal({ status: 'Chosen' })]
  const tab = (id) => new RegExp(`href="/pedidos/${id}/pagamento"[^>]*>Pagamento<`)
  const waiting = showOrder({ stage: 'AwaitingPayment', proposalList: chosen })
  assert.match(waiting.html, tab(waiting.order.id))
  const signatures = showOrder({ stage: 'AwaitingSignatures', proposalList: chosen })
  assert.doesNotMatch(signatures.html, /\/pagamento/)
  assert.match(signatures.html, /\/contrato/)
  const paid = showOrder({ status: 'progress', proposalList: chosen })
  assert.match(paid.html, tab(paid.order.id))
  assert.doesNotMatch(showOrder({ proposalList: [proposal({ status: 'Sent' })] }).html, /\/pagamento/)
})

test('the payment route renders the payment panel with the order', () => {
  const { html } = showOrder({ stage: 'AwaitingPayment' }, { view: 'pagamento', token: 'abc' })
  assert.match(html, /Carregando pagamento/)
  assert.match(html, /order-tab active[^>]*aria-current="page"[^>]*>Pagamento</)
  assert.match(showOrder({ stage: 'AwaitingPayment' }, { view: 'pagamento' }).html, /Entre na sua conta para consultar o pagamento/)
})

test('the order details point to the next step and hide edit and cancel once a proposal was accepted', () => {
  const sign = showOrder({ stage: 'AwaitingSignatures' })
  assert.match(sign.html, /Próximo passo/)
  assert.match(sign.html, new RegExp(`href="/pedidos/${sign.order.id}/contrato"[^>]*>Ver e assinar contrato<`))
  assert.match(sign.html, /Aguardando assinaturas/)
  assert.doesNotMatch(sign.html, /Editar pedido|Cancelar pedido/)

  const pay = showOrder({ stage: 'AwaitingPayment' })
  assert.match(pay.html, new RegExp(`href="/pedidos/${pay.order.id}/pagamento"[^>]*>Pagar com Pix<`))
  assert.match(pay.html, /Aguardando pagamento/)

  const running = showOrder({ status: 'progress' })
  assert.match(running.html, new RegExp(`href="/pedidos\\?modal=concluir-pedido&amp;pedido=${running.order.id}"[^>]*>Confirmar conclusão<`))
  assert.match(running.html, /Em andamento/)

  assert.doesNotMatch(showOrder({}).html, /Próximo passo/)
  assert.doesNotMatch(showOrder({ status: 'completed' }).html, /Próximo passo/)
})

test('the orders list shows the stage and a direct button to the next step', () => {
  const customerId = randomUUID()
  const orders = [stageOrder({ customerId, stage: 'AwaitingPayment' }), stageOrder({ customerId, stage: 'AwaitingSignatures' }), stageOrder({ customerId, status: 'progress' }), stageOrder({ customerId })]
  const html = renderOrders({ orders, customerId })
  assert.match(html, /Aguardando pagamento/)
  assert.match(html, /Aguardando assinaturas/)
  assert.match(html, new RegExp(`href="/pedidos/${orders[0].id}/pagamento"[^>]*>Pagar com Pix<`))
  assert.match(html, new RegExp(`href="/pedidos/${orders[1].id}/contrato"[^>]*>Ver e assinar contrato<`))
  assert.match(html, /concluir-pedido[^>]*>Confirmar conclusão</)
  // Só os pedidos com algo a fazer ganham o botão; os demais mantêm "Ver detalhes" como ação principal.
  assert.equal((html.match(/Pagar com Pix|Ver e assinar contrato|Confirmar conclusão/g) ?? []).length, 3)
  assert.equal((html.match(/button-primary/g) ?? []).length, 4)
})

test('the tracking history follows the contract, the payment and the conclusion', () => {
  const chosen = [proposal({ status: 'Chosen', providerName: 'Ana Eletricista' })]
  const open = showOrder({ proposalList: chosen, stage: 'AwaitingSignatures' }, { view: 'acompanhar' }).html
  assert.match(open, /Proposta de Ana Eletricista escolhida/)
  assert.doesNotMatch(open, /Contrato assinado pelas duas partes|Pagamento confirmado/)
  const waiting = showOrder({ proposalList: chosen, stage: 'AwaitingPayment' }, { view: 'acompanhar' }).html
  assert.match(waiting, /Contrato assinado pelas duas partes/)
  assert.doesNotMatch(waiting, /Pagamento confirmado/)
  const paid = showOrder({ proposalList: chosen, status: 'progress' }, { view: 'acompanhar' }).html
  assert.match(paid, /Contrato assinado pelas duas partes/)
  assert.match(paid, /Pagamento confirmado/)
  assert.match(showOrder({ proposalList: chosen, status: 'completed' }, { view: 'acompanhar' }).html, /Pedido concluído/)
})

test('the contract screen links to the payment only when the order is ready to pay', () => {
  const ready = showOrder({ stage: 'AwaitingPayment', proposalList: [proposal({ status: 'Chosen' })] }, { view: 'contrato', token: 'abc' })
  assert.match(ready.html, /Carregando contrato/)
  assert.match(renderContract(parseContract(contractDto({ status: 'Signed', customerSignedAt: new Date().toISOString(), providerSignedAt: new Date().toISOString() })),
    { onPay: `/pedidos/${ready.order.id}/pagamento` }), new RegExp(`href="/pedidos/${ready.order.id}/pagamento"[^>]*>Ir para pagamento`))
})

test('the completion modal asks for confirmation before concluding the service', () => {
  const order = stageOrder({ status: 'progress', title: 'Trocar o chuveiro' })
  const html = renderToStaticMarkup(React.createElement(CompleteOrderModal, { order, token: 't', onClose() {}, onCompleted() {} }))
  assert.match(html, /Confirmar conclusão/)
  assert.match(html, /Trocar o chuveiro/)
  assert.match(html, /avaliar o prestador/)
  assert.match(html, />Ainda não</)
  assert.match(html, />Confirmar conclusão</)
})

test('login returns to the payment screen and to the completion dialog, nothing else', () => {
  const id = randomUUID()
  assert.equal(safeReturnPath(`/pedidos/${id}/pagamento`), `/pedidos/${id}/pagamento`)
  assert.equal(safeReturnPath(`/pedidos/${id}?modal=concluir-pedido&pedido=${id}`), `/pedidos/${id}?modal=concluir-pedido&pedido=${id}`)
  assert.equal(safeReturnPath(`/pedidos/${id}/pagamento/simular`), '/')
  assert.equal(safeReturnPath(`/pedidos/${id}?modal=simular-pagamento`), '/')
})

test('old modal links are sent to the page that replaced them', () => {
  assert.equal(legacyModalTarget('/', '?modal=finalizar-cadastro'), '/cadastro/finalizar')
  assert.equal(legacyModalTarget('/', '?modal=finalizar-cadastro&next=criar-pedido'), '/cadastro/finalizar?next=%2Fpedidos%2Fnovo')
  // Confirmações curtas continuam como modal, e sem modal não há o que redirecionar.
  for (const search of ['', '?status=Pending', '?modal=aceitar-proposta', '?modal=cancelar-pedido', '?modal=concluir-pedido', '?modal=qualquer']) {
    assert.equal(legacyModalTarget('/pedidos', search), null)
  }
})

test('after finishing the registration only app screens are accepted as the destination', () => {
  const id = randomUUID()
  assert.equal(nextAfterRegistration(''), '/')
  assert.equal(nextAfterRegistration('?next=%2Fpedidos%2Fnovo'), '/pedidos/novo')
  assert.equal(nextAfterRegistration(`?next=%2Fpedidos%2F${id}%2Fcontrato`), `/pedidos/${id}/contrato`)
  for (const next of ['https://evil.example', '//evil.example', '/outra-coisa', '/cadastro/finalizar', '/pedidos/novo?x=1', 'criar-pedido']) {
    assert.equal(nextAfterRegistration(`?next=${encodeURIComponent(next)}`), '/')
  }
})

test('login can return to the new pages and to the registration page with a destination', () => {
  const id = randomUUID()
  for (const ok of ['/pedidos/novo', `/pedidos/${id}/editar`, `/pedidos/${id}/avaliar`, '/conta', '/ajuda', '/cadastro/finalizar',
    '/cadastro/finalizar?next=%2Fpedidos%2Fnovo']) assert.equal(safeReturnPath(ok), ok)
  for (const bad of ['/pedidos/novo/x', '/conta/outra', `/pedidos/${id}/editar/x`, '/cadastro', '/cadastro/finalizar?next=https%3A%2F%2Fevil.example']) {
    assert.equal(safeReturnPath(bad), '/')
  }
})

test('the registration page is a standalone page, without the app menu', () => {
  const html = renderToStaticMarkup(React.createElement(StaticRouter, { location: '/cadastro/finalizar?next=%2Fpedidos%2Fnovo' }, React.createElement(FinalizarCadastro)))
  assert.match(html, /<main class="login-container"/)
  assert.match(html, /Finalizar cadastro/)
  assert.match(html, /Carregando seus dados/)
  assert.doesNotMatch(html, /Menu principal|class="sidebar/)
})

const memoryStorage = () => {
  const data = new Map()
  return { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => { data.set(key, value) }, removeItem: (key) => { data.delete(key) }, data }
}
const filledDraft = (extra = {}) => ({ step: 'form', fromAssistant: true, assistant: { messages: [{ role: 'user', content: 'Chuveiro queimou' }, { role: 'assistant', content: 'Onde fica?' }], scope: { titulo: 'Trocar chuveiro', urgencia: 'Urgente' }, complete: true },
  form: { title: 'Trocar chuveiro', category: 'Elétrica', description: 'Chuveiro queimou e precisa de troca', location: 'Meireles', scope: { details: 'Banheiro', urgency: 'Urgente', specifications: 'Trocar e testar' } }, ...extra })

test('the order draft is saved per person, read back and cleared', () => {
  const storage = memoryStorage()
  const store = createOrderDraftStore(() => storage)
  const maria = randomUUID(), joao = randomUUID()
  assert.equal(store.read(maria), null)
  store.write(maria, filledDraft())
  assert.deepEqual(store.read(maria), filledDraft())
  assert.equal(store.read(joao), null)
  store.clear(maria)
  assert.equal(store.read(maria), null)
  assert.equal(storage.data.size, 0)
})

test('an empty draft is not kept, and a draft with only the conversation or only the form is', () => {
  assert.equal(draftHasContent(emptyDraft()), false)
  assert.equal(draftHasContent({ ...emptyDraft(), step: 'form', form: filledDraft().form }), true)
  assert.equal(draftHasContent({ ...emptyDraft(), form: { ...filledDraft().form, title: '  ', category: '', description: '', location: '', scope: { details: '', urgency: '', specifications: '' } } }), false)
  assert.equal(draftHasContent(filledDraft({ form: undefined, step: 'assistant' })), true)
  const storage = memoryStorage()
  const store = createOrderDraftStore(() => storage)
  const id = randomUUID()
  store.write(id, filledDraft())
  store.write(id, emptyDraft())
  assert.equal(storage.data.size, 0)
})

test('a damaged or tampered draft is discarded instead of trusted', () => {
  const storage = memoryStorage()
  const store = createOrderDraftStore(() => storage)
  const id = randomUUID()
  const key = `resolvai.rascunho-pedido.${id}`
  for (const raw of ['isto nao e json', '[]', '{}', JSON.stringify({ ...filledDraft(), step: 'outra' }), JSON.stringify(filledDraft({ form: undefined })),
    JSON.stringify(filledDraft({ form: { title: 1 } })), JSON.stringify({ ...filledDraft(), assistant: { messages: [{ role: 'system', content: 'x' }], scope: {}, complete: false } }),
    JSON.stringify({ ...filledDraft(), assistant: { messages: [], scope: { titulo: 5 }, complete: false } })]) {
    storage.setItem(key, raw)
    assert.equal(store.read(id), null)
    assert.equal(storage.getItem(key), null)
  }
  assert.equal(parseDraft(filledDraft()).assistant.scope.titulo, 'Trocar chuveiro')
  // Chaves desconhecidas do escopo não passam adiante.
  assert.deepEqual(parseDraft({ ...filledDraft(), assistant: { messages: [], scope: { titulo: 'a', intruso: 'b' }, complete: false } }).assistant.scope, { titulo: 'a' })
})

test('storage that is blocked or full never breaks the order page', () => {
  const broken = { getItem() { throw new Error('bloqueado') }, setItem() { throw new Error('cheio') }, removeItem() { throw new Error('bloqueado') } }
  const store = createOrderDraftStore(() => broken)
  const id = randomUUID()
  assert.equal(store.read(id), null)
  assert.doesNotThrow(() => store.write(id, filledDraft()))
  assert.doesNotThrow(() => store.clear(id))
})

test('legacy edit links are sent to the edit page of the right order', () => {
  const id = randomUUID()
  assert.equal(legacyModalTarget('/pedidos', `?modal=editar-pedido&pedido=${id.toUpperCase()}`), `/pedidos/${id}/editar`)
  assert.equal(legacyModalTarget(`/pedidos/${id}`, '?modal=editar-pedido'), `/pedidos/${id}/editar`)
  assert.equal(legacyModalTarget(`/pedidos/${id}/propostas`, '?modal=editar-pedido'), `/pedidos/${id}/editar`)
  // Sem saber qual pedido, a lista é o destino mais seguro.
  assert.equal(legacyModalTarget('/', '?modal=editar-pedido'), '/pedidos')
})

test('the edit page opens on the order data, with a way back and no modal', () => {
  const id = randomUUID()
  const order = { id, customerId: randomUUID(), title: 'Trocar chuveiro', category: 'Elétrica', location: 'Meireles', description: 'Chuveiro queimou',
    status: 'waiting', icon: 'bag', proposals: 0, scope: { details: 'Banheiro', urgency: 'Urgente', specifications: 'Trocar o chuveiro' }, photoUrls: ['https://exemplo.com/a.jpg'] }
  const render = (props) => renderAt(React.createElement(EditOrderPage, { orderId: id, token: 't', loading: false, onSaved() {}, onRetry() {}, ...props }))
  const html = render({ order })
  assert.doesNotMatch(html, /<dialog|class="modal/)
  assert.match(html, /<h1 id="order-form-title">Editar pedido<\/h1>/)
  assert.match(html, /value="Trocar chuveiro"/)
  assert.match(html, /Salvar alterações/)
  assert.match(html, /Remover foto salva 1/)
  assert.match(html, new RegExp(`href="/pedidos/${id}"[^>]*>Voltar para o pedido<`))
})

test('the edit page explains when the order is loading, missing or can no longer be changed', () => {
  const id = randomUUID()
  const base = { id, customerId: randomUUID(), title: 'Serviço', category: 'Pedido', location: '', description: 'Descrição do pedido', status: 'waiting', icon: 'bag', proposals: 1 }
  const render = (props) => renderAt(React.createElement(EditOrderPage, { orderId: id, token: 't', loading: false, onSaved() {}, onRetry() {}, ...props }))
  assert.match(render({ loading: true }), /Carregando pedido/)
  assert.match(render({ error: new ApiError(404, 'x') }), /Este pedido não está disponível para sua conta/)
  const failed = render({ error: new ApiError(500, 'Falha ao consultar') })
  assert.match(failed, /Falha ao consultar/)
  assert.match(failed, />Tentar novamente</)
  for (const closed of [{ ...base, proposalList: [proposal({ status: 'Chosen' })] }, { ...base, status: 'progress' }, { ...base, status: 'completed' }, { ...base, status: 'cancelled' }, { ...base, stage: 'AwaitingPayment' }]) {
    const html = render({ order: closed })
    assert.match(html, /não pode mais ser alterado/)
    assert.doesNotMatch(html, /Salvar alterações/)
  }
})

test('legacy review and help links are sent to their pages', () => {
  const id = randomUUID()
  assert.equal(legacyModalTarget('/pedidos', `?modal=avaliar&pedido=${id}`), `/pedidos/${id}/avaliar`)
  assert.equal(legacyModalTarget(`/pedidos/${id}`, '?modal=avaliar'), `/pedidos/${id}/avaliar`)
  assert.equal(legacyModalTarget('/', '?modal=avaliar'), '/pedidos')
  assert.equal(legacyModalTarget('/pedidos', '?modal=ajuda'), '/ajuda')
  assert.equal(legacyModalTarget('/', '?modal=criar-pedido'), '/pedidos/novo')
})

test('the review page loads the order and explains when it is missing or not completed yet', () => {
  const id = randomUUID()
  const done = { id, customerId: randomUUID(), title: 'Trocar chuveiro', category: 'Pedido', location: '', description: 'Descrição', status: 'completed', icon: 'bag', proposals: 0 }
  const render = (props) => renderAt(React.createElement(ReviewOrderPage, { orderId: id, token: 't', loading: false, onSaved() {}, onRetry() {}, ...props }))
  assert.match(render({ loading: true }), /Carregando pedido/)
  assert.match(render({ error: new ApiError(404, 'x') }), /Este pedido não está disponível para sua conta/)
  assert.match(render({ error: new ApiError(500, 'Falha') }), />Tentar novamente</)
  const html = render({ order: done })
  assert.doesNotMatch(html, /<dialog|class="modal/)
  assert.match(html, /<h1>Avaliar serviço<\/h1>/)
  assert.match(html, /Trocar chuveiro/)
  assert.match(html, new RegExp(`href="/pedidos/${id}"[^>]*>Voltar para o pedido<`))
})

test('the help page answers the main questions of the order journey in plain pages, not a modal', () => {
  const html = renderAt(React.createElement(HelpPage))
  assert.doesNotMatch(html, /<dialog|class="modal/)
  assert.match(html, /<h1>Central de ajuda<\/h1>/)
  for (const question of ['Como crio um pedido', 'editar ou cancelar', 'Como funciona o contrato', 'Como pago', 'depois que o serviço termina', 'minha senha']) {
    assert.match(html, new RegExp(`<summary>[^<]*${question}`, 'i'))
  }
  assert.match(html, /30 minutos/)
  assert.match(html, /Confirmar conclusão/)
})

test('the new password is checked against the API limits and its confirmation', () => {
  assert.match(validateNewPassword('curta', 'curta'), /pelo menos 8 caracteres/)
  assert.match(validateNewPassword('a'.repeat(129), 'a'.repeat(129)), /no máximo 128 caracteres/)
  assert.match(validateNewPassword('senhaboa123', 'senhaboa124'), /não coincidem/)
  assert.equal(validateNewPassword('senhaboa123', 'senhaboa123'), '')
  assert.equal(validateNewPassword('a'.repeat(8), 'a'.repeat(8)), '')
  assert.equal(validateNewPassword('a'.repeat(128), 'a'.repeat(128)), '')
})

test('the change password form asks for the new password twice and shows the API result', () => {
  const render = (props = {}) => renderToStaticMarkup(React.createElement(ChangePasswordForm, { saving: false, onSubmit() {}, ...props }))
  const html = render()
  assert.match(html, /<h2 id="password-title">Alterar senha<\/h2>/)
  assert.equal((html.match(/type="password"/g) ?? []).length, 2)
  assert.equal((html.match(/autoComplete="new-password"/g) ?? []).length, 2)
  assert.match(html, /minLength="8"/)
  assert.match(html, /maxLength="128"/)
  assert.doesNotMatch(html, /current-password|Senha atual/)
  assert.match(render({ saving: true }), /<fieldset disabled=""[^>]*>[\s\S]*disabled=""[^>]*>Alterando senha…/)
  assert.match(render({ error: 'A senha é fraca.' }), /role="alert">A senha é fraca\./)
  assert.match(render({ success: 'Senha alterada com sucesso.' }), /role="status"[^>]*>Senha alterada com sucesso\./)
  // O erro da API vem antes do aviso de sucesso antigo.
  assert.doesNotMatch(render({ error: 'x', success: 'Senha alterada com sucesso.' }), /Senha alterada com sucesso/)
})

test('the change password route shows the API explanation on 400 and 429', async () => {
  const client = (status, body) => createApiClient('', async () => new Response(JSON.stringify(body), { status }))
  for (const [status, detail] of [[400, 'A senha informada é muito fraca.'], [429, 'Muitas tentativas. Aguarde alguns minutos e tente novamente.']]) {
    await assert.rejects(client(status, { detail })('/api/v1/auth/change-password', { method: 'POST', token: 't', body: { newPassword: 'x' } }),
      (error) => error.status === status && error.message === detail)
  }
})

test('the account is a page with its own heading, not a modal', () => {
  const html = renderAt(React.createElement(AccountPage, { token: 't', customerId: randomUUID(), onUpdated() {} }))
  assert.doesNotMatch(html, /<dialog|class="modal/)
  assert.match(html, /<h1>Minha conta<\/h1>/)
  assert.match(html, /Carregando dados da conta/)
})

test('legacy profile links are sent to the account page', () => {
  assert.equal(legacyModalTarget('/', '?modal=perfil'), '/conta')
  assert.equal(legacyModalTarget('/pedidos', '?status=Pending&modal=perfil'), '/conta')
})
