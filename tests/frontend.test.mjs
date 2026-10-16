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
const { parseSummary, parsePage, parseDetail, parseUser, parseLogin, isUuid } = await import('../src/services/dashboardApi.ts')
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

for (const [name, parse] of Object.entries({ parseSummary, parsePage, parseDetail, parseUser, parseLogin })) {
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
  assert.doesNotMatch(html, /type="file"/)
  const pending = renderToStaticMarkup(React.createElement(OrderForm, { ...props, submitting: true }))
  assert.match(pending, /<fieldset disabled=""/)
  assert.match(pending, /Publicando/)
})
