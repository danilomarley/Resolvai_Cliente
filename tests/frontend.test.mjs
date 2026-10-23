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
  assert.match(html, /Avaliações em breve/)
  assert.doesNotMatch(html, /4,8/)
  assert.match(html, /Nenhum serviço concluído ainda/)
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

