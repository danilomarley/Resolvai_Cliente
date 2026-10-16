import assert from 'node:assert/strict'
import { test } from 'node:test'
import { registerHooks } from 'node:module'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createServer } from 'node:http'
import ts from 'typescript'

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && context.parentURL) {
      const url = new URL(specifier, context.parentURL)
      if (existsSync(fileURLToPath(url) + '.ts')) return { url: url.href + '.ts', shortCircuit: true }
    }
    return nextResolve(specifier, context)
  },
  load(url, context, nextLoad) {
    if (url.endsWith('.ts')) return { format: 'module', shortCircuit: true,
      source: ts.transpileModule(readFileSync(fileURLToPath(url), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
      }).outputText }
    return nextLoad(url, context)
  },
})
const requests = []
let responseBody
let responseStatus = 200
const originalFetch = globalThis.fetch
// Only the singleton services are intercepted; the transport test uses real local HTTP.
globalThis.fetch = async (url, options) => {
  requests.push({ url, options })
  return new Response(JSON.stringify(responseBody), { status: responseStatus })
}
const { createApiClient, ApiError } = await import('../src/services/api.ts')
const { parseSummary, parseDetail, parseUser, parseLogin, getSummary, getCurrentUser, getOrder, getOrders, parsePage, login, register, completeRegistration, createOrder, toOrder } = await import('../src/services/dashboardApi.ts')
const { completeRegistration: completeAccountRegistration } = await import('../src/services/accountApi.ts')
globalThis.fetch = originalFetch
const id = '11111111-1111-4111-8111-111111111111'
const otherId = '22222222-2222-4222-8222-222222222222'
const recent = { id, title: 'Pedido real', status: 'Pending', createdAt: '2026-10-09T12:00:00Z' }
const counts = { total: 12, pending: 3, inProgress: 4, completed: 3, cancelled: 2 }
const summary = { orders: counts, recentOrders: [recent] }
const user = { id, name: 'Cliente', email: 'test@example.invalid', role: 'Cliente', isActive: true, createdAt: recent.createdAt }
const loginResponse = { accessToken: 'test-only', refreshToken: 'test-refresh', tokenType: 'bearer', expiresAtUtc: recent.createdAt, user }

test('summary keeps full totals even when only recent orders are returned', () => {
  assert.equal(parseSummary(summary).orders.total, 12)
  assert.equal(parseSummary(summary).recentOrders.length, 1)
  assert.deepEqual(parseSummary({ orders: { total: 0, pending: 0, inProgress: 0, completed: 0, cancelled: 0 }, recentOrders: [] }).recentOrders, [])
  assert.throws(() => parseSummary({ orders: { ...counts, pending: -1 }, recentOrders: [] }), ApiError)
  assert.throws(() => parseSummary({ orders: counts, recentOrders: Array(6).fill(recent) }), ApiError)
  assert.throws(() => parseSummary({ orders: counts, recentOrders: [{ ...recent, status: 'Unknown' }] }), ApiError)
})
test('all four statuses and UUIDs map without invented totals or proposals', () => {
  for (const [status, expected] of [['Pending','waiting'], ['InProgress','progress'], ['Completed','completed'], ['Cancelled','cancelled']]) {
    const order = toOrder({ ...recent, status }, otherId)
    assert.equal(order.status, expected)
    assert.equal(order.id, id)
    assert.equal(order.customerId, otherId)
    assert.equal(order.total, undefined)
    assert.equal(order.items, undefined)
    assert.equal(order.source, 'api')
  }
  assert.throws(() => parseDetail(recent), ApiError)
  assert.equal(parseDetail({ ...recent, description: 'Descrição real' }).description, 'Descrição real')
  assert.throws(() => parseUser({ ...user, id: 'invalid' }), ApiError)
  assert.equal(parseLogin({ ...loginResponse, refreshToken: null }).refreshToken, null)
})

test('order dates survive the API adapter and invalid update dates are rejected', () => {
  const updatedAt = '2026-10-10T12:00:00Z'
  const detail = parseDetail({ ...recent, description: 'Descrição real', updatedAt })
  assert.equal(toOrder(detail, otherId).updatedAt, updatedAt)
  assert.equal(toOrder(parseDetail({ ...recent, description: 'Sem atualização' }), otherId).updatedAt, undefined)
  assert.throws(() => parseDetail({ ...detail, updatedAt: 'invalid' }), ApiError)
})

test('profile accepts CPF from the registration endpoint without breaking older responses', () => {
  assert.equal(parseUser(user).cpf, undefined)
  assert.equal(parseUser({ ...user, cpf: null }).cpf, null)
  assert.equal(parseUser({ ...user, cpf: '12345678901' }).cpf, '12345678901')
  assert.throws(() => parseUser({ ...user, cpf: 12345678901 }), ApiError)
  assert.throws(() => parseUser({ ...user, cpf: 'invalid' }), ApiError)
})

test('registration posts the actual contract, confirms ownership and handles API failures', async () => {
  const body = { name: user.name, cpf: '12345678901',
    endereco: { logradouro: 'Rua de teste', numero: '10', bairro: 'Centro', cidade: 'Fortaleza', estado: 'CE', cep: '60000000' },
    contato: { tipo: 'whatsapp', valor: '85999990000' } }
  responseStatus = 200; responseBody = { ...user, cpf: body.cpf }
  assert.equal((await completeAccountRegistration(body, 'test-only', user.id)).cpf, body.cpf)
  assert.equal(requests.at(-1).url, '/api/v1/users/me/complete-registration')
  assert.equal(requests.at(-1).options.method, 'POST')
  assert.equal(requests.at(-1).options.headers.Authorization, 'Bearer test-only')
  assert.deepEqual(JSON.parse(requests.at(-1).options.body), body)
  for (const invalid of [{ ...user, id: otherId, cpf: body.cpf }, user, { ...user, cpf: '98765432100' }]) {
    responseBody = invalid
    await assert.rejects(completeAccountRegistration(body, 'test-only', user.id), (error) => error.status === 502)
  }
  try {
    for (const [status, message] of [[400, /CPF, o endereço e o contato/], [404, /não está disponível neste servidor/], [409, /cadastro já foi finalizado/], [401, /sessão não foi aceita/], [500, /Não foi possível carregar/]]) {
      responseStatus = status; responseBody = { detail: 'internal-secret' }
      await assert.rejects(completeAccountRegistration(body, 'test-only', user.id), (error) => error.status === status && message.test(error.message) && !error.message.includes('internal-secret'))
    }
  } finally { responseStatus = 200 }
})
test('services use only identified routes and request contracts', async () => {
  requests.length = 0; responseBody = summary
  await getSummary('test-only')
  assert.equal(requests[0].url, '/api/v1/home/summary')
  assert.equal(requests[0].options.headers.Authorization, 'Bearer test-only')
  assert.equal(requests[0].options.cache, 'no-store')
  assert.equal(requests[0].options.body, undefined)
  responseBody = user; await getCurrentUser('test-only')
  assert.equal(requests.at(-1).url, '/api/v1/users/me')
  responseBody = { ...recent, description: 'Descrição real' }; await getOrder(id, 'test-only')
  assert.equal(requests.at(-1).url, `/api/v1/orders/${id}`)
  const count = requests.length
  await assert.rejects(getOrder('1042', 'test-only'), (error) => error.status === 404)
  assert.equal(requests.length, count)
  responseBody = { ...recent, id: otherId, description: 'Outro pedido' }
  await assert.rejects(getOrder(id, 'test-only'), (error) => error.status === 502)
  responseBody = loginResponse; await login('test@example.invalid', 'test-pass')
  assert.equal(requests.at(-1).url, '/api/v1/auth/login')
  assert.deepEqual(JSON.parse(requests.at(-1).options.body), { email: 'test@example.invalid', password: 'test-pass' })
  assert.equal(requests.at(-1).options.headers.Authorization, undefined)
  responseBody = user; await register('Cliente', 'test@example.invalid', 'test-pass')
  assert.equal(requests.at(-1).url, '/api/v1/auth/register')
  assert.deepEqual(JSON.parse(requests.at(-1).options.body), { name: 'Cliente', email: 'test@example.invalid', password: 'test-pass' })
})
test('HTTP transport sends Bearer and handles 401, 403, 404, 409, 500 and invalid JSON', async () => {
  const server = createServer((req, res) => {
    if (req.url === '/ok') { assert.equal(req.headers.authorization, 'Bearer test-only'); res.end(JSON.stringify({ ok: true })); return }
    if (req.url === '/invalid') { res.end('invalid-json'); return }
    res.statusCode = Number(req.url.slice(1)); res.end(JSON.stringify({ detail: 'internal-secret-do-not-display' }))
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  try {
    const client = createApiClient(`http://127.0.0.1:${server.address().port}/`, originalFetch)
    assert.deepEqual(await client('/ok', { token: 'test-only' }), { ok: true })
    for (const status of [401,403,404,409,500,503]) await assert.rejects(client(`/${status}`), (error) => error.status === status && !error.message.includes('internal-secret'))
    await assert.rejects(client('/503'), (error) => /Inicie o backend/.test(error.message))
    await assert.rejects(client('/invalid'), (error) => error.status === 502)
  } finally { await new Promise((resolve) => server.close(resolve)) }
})
test('network errors and caller cancellation are distinguished', async () => {
  const client = createApiClient('', async () => { throw new TypeError('network') })
  await assert.rejects(client('/api/v1/home/summary'), (error) => error.status === 0)
  const controller = new AbortController(); controller.abort()
  await assert.rejects(client('/api/v1/home/summary', { signal: controller.signal }), TypeError)
})
test('login distinguishes missing profile, inactive account and invalid credentials without exposing arbitrary details', async () => {
  const cases = [
    ['Usuário autenticado no Supabase sem perfil local.', /não possui um perfil no backend/],
    ['Usuário inativo.', /conta está inativa/],
    ['Credenciais inválidas.', /Confira o e-mail, a senha/],
    ['internal-secret-do-not-display', /Confira o e-mail, a senha/],
  ]
  for (const [detail, message] of cases) {
    const client = createApiClient('', async () => new Response(JSON.stringify({ detail }), { status: 401 }))
    await assert.rejects(client('/api/v1/auth/login'), (error) => error.status === 401 && message.test(error.message) && !error.message.includes('internal-secret'))
  }
  const empty = createApiClient('', async () => new Response('', { status: 401 }))
  await assert.rejects(empty('/api/v1/auth/login'), /Confira o e-mail, a senha/)
})
test('complete registration posts the identified contract with Bearer and keeps cpf optional on the user', async () => {
  const payload = {
    name: 'Cliente', cpf: '12345678901',
    endereco: { logradouro: 'Rua A', numero: '10', bairro: 'Centro', cidade: 'Fortaleza', estado: 'CE', cep: '60000000' },
    contato: { tipo: 'whatsapp', valor: '85999999999' },
  }
  requests.length = 0; responseBody = { ...user, cpf: '12345678901' }
  const result = await completeRegistration('test-only', payload)
  assert.equal(requests[0].url, '/api/v1/users/me/complete-registration')
  assert.equal(requests[0].options.method, 'POST')
  assert.equal(requests[0].options.headers.Authorization, 'Bearer test-only')
  assert.deepEqual(JSON.parse(requests[0].options.body), payload)
  assert.equal(result.cpf, '12345678901')
  assert.equal(parseUser(user).cpf, undefined)
  assert.equal(parseUser({ ...user, cpf: null }).cpf, null)
  assert.throws(() => parseUser({ ...user, cpf: 123 }), ApiError)
})
test('complete registration maps 409 to fixed messages without exposing arbitrary details', async () => {
  const cases = [
    ['Cadastro já finalizado.', /cadastro já foi finalizado/],
    ["Já existe um usuário com o CPF '123.456.789-01'.", /CPF já está em uso/],
    ['internal-secret-do-not-display', /Não foi possível finalizar/],
  ]
  for (const [detail, message] of cases) {
    const client = createApiClient('', async () => new Response(JSON.stringify({ detail }), { status: 409 }))
    await assert.rejects(client('/api/v1/users/me/complete-registration', { method: 'POST', token: 'test-only', body: {} }),
      (error) => error.status === 409 && message.test(error.message) && !error.message.includes('internal-secret'))
  }
})
test('create order posts the escopo keys and photo urls with Bearer and parses the detail', async () => {
  const order = {
    title: 'Tomada sem energia', category: 'Elétrica', description: 'Tomada da sala sem energia', location: 'Aldeota, Fortaleza',
    scope: { details: 'Sala', urgency: 'Urgente', specifications: 'Revisão do circuito', photos: [] },
  }
  requests.length = 0; responseBody = { ...recent, description: 'Tomada da sala sem energia' }
  const result = await createOrder('test-only', order, ['https://exemplo.com/a.jpg'])
  assert.equal(requests[0].url, '/api/v1/orders')
  assert.equal(requests[0].options.method, 'POST')
  assert.equal(requests[0].options.headers.Authorization, 'Bearer test-only')
  assert.deepEqual(JSON.parse(requests[0].options.body), {
    titulo: 'Tomada sem energia', categoria: 'Elétrica', descricao: 'Tomada da sala sem energia', localizacao: 'Aldeota, Fortaleza',
    detalhes: 'Sala', urgencia: 'Urgente', especificacoes: 'Revisão do circuito', fotos: [{ url: 'https://exemplo.com/a.jpg' }],
  })
  assert.equal(result.id, id)
})
test('create order shows the backend reason on 400 and a fixed message otherwise', async () => {
  const withDetail = createApiClient('', async () => new Response(JSON.stringify({ detail: 'Finalize o cadastro antes de criar um pedido.' }), { status: 400 }))
  await assert.rejects(withDetail('/api/v1/orders', { method: 'POST', token: 'test-only', body: {} }), /Finalize o cadastro/)
  const withoutDetail = createApiClient('', async () => new Response(JSON.stringify({ errors: {} }), { status: 400 }))
  await assert.rejects(withoutDetail('/api/v1/orders', { method: 'POST', token: 'test-only', body: {} }), /Confira os dados do pedido/)
})
test('orders page is requested with filter and paging and rejects broken pages', async () => {
  const page = { items: [{ ...recent, category: 'Elétrica', proposalsCount: 2 }], page: 2, pageSize: 10, totalItems: 11, totalPages: 2 }
  requests.length = 0; responseBody = page
  const result = await getOrders('test-only', { status: 'InProgress', page: 2 })
  assert.equal(requests[0].url, '/api/v1/orders?page=2&pageSize=10&status=InProgress')
  assert.equal(requests[0].options.headers.Authorization, 'Bearer test-only')
  assert.equal(result.totalPages, 2)
  assert.throws(() => parsePage({ ...page, items: [{ ...recent, status: 'Unknown' }] }), ApiError)
  assert.throws(() => parsePage({ ...page, totalPages: -1 }), ApiError)
})
test('order detail keeps category, location, scope, photos and proposals', () => {
  const detail = parseDetail({
    ...recent, description: 'Descrição', category: 'Elétrica', location: 'Aldeota', updatedAt: '2026-10-10T12:00:00Z',
    scope: { detalhes: 'Sala', urgencia: 'Urgente', especificacoes: 'Revisão' },
    photos: [{ id, url: 'https://exemplo.com/a.jpg' }],
    proposals: [{ id: otherId, providerId: id, providerName: 'Silva', status: 'Chosen', value: 150, deadline: '3 dias' }],
  })
  const order = toOrder(detail, otherId)
  assert.equal(order.category, 'Elétrica')
  assert.equal(order.location, 'Aldeota')
  assert.equal(order.proposals, 1)
  assert.equal(order.scope.urgency, 'Urgente')
  assert.deepEqual(order.photoUrls, ['https://exemplo.com/a.jpg'])
  assert.equal(order.proposalList[0].providerName, 'Silva')
  assert.throws(() => parseDetail({ ...recent, description: 'x', proposals: [{ id }] }), ApiError)
})
test('CEP lookup maps ViaCEP fields, treats unknown CEPs as null and rejects failures', async () => {
  const { lookupCep } = await import('../src/services/cep.ts')
  const ok = async (url) => {
    assert.equal(url, 'https://viacep.com.br/ws/60000000/json/')
    return new Response(JSON.stringify({ logradouro: 'Rua A', bairro: 'Centro', localidade: 'Fortaleza', uf: 'CE' }))
  }
  assert.deepEqual(await lookupCep('60000-000', undefined, ok), { logradouro: 'Rua A', bairro: 'Centro', cidade: 'Fortaleza', estado: 'CE' })
  assert.equal(await lookupCep('60000000', undefined, async () => new Response(JSON.stringify({ erro: true }))), null)
  assert.equal(await lookupCep('123', undefined, async () => { throw new Error('must not be called') }), null)
  await assert.rejects(lookupCep('60000000', undefined, async () => new Response('', { status: 500 })))
})
