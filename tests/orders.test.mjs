import assert from 'node:assert/strict'
import { test } from 'node:test'
import { registerHooks } from 'node:module'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
// Production rendering avoids browser-only layout effect warnings during SSR tests.
process.env.NODE_ENV = 'production'
const { default: React } = await import('react')
const { renderToStaticMarkup } = await import('react-dom/server')
const { StaticRouter } = await import('react-router-dom')

// Run the actual TS/TSX modules with the existing compiler, without new dependencies.
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
    if (/\.tsx?$/.test(url)) return {
      format: 'module', shortCircuit: true,
      source: ts.transpileModule(readFileSync(fileURLToPath(url), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
      }).outputText,
    }
    return nextLoad(url, context)
  },
})
const { customerOrder, customerOrders, orderMoney } = await import('../src/services/orders.ts')
const { MyOrders } = await import('../src/pages/MyOrders.tsx')
const { initialOrders, completedOrders } = await import('../src/data/dashboard.ts')
const foreign = { ...initialOrders[0], id: 99, customerId: 'other', title: 'Pedido privado' }
const orders = [...initialOrders, foreign]
const render = (props = {}) => renderToStaticMarkup(React.createElement(StaticRouter, { location: '/pedidos' },
  React.createElement(MyOrders, { orders, customerId: 'demo-customer', search: '', ...props })))

test('list and direct lookup isolate the customer; missing session fails closed', () => {
  assert.equal(customerOrders(orders, 'demo-customer').length, 2)
  assert.equal(customerOrder(orders, 'demo-customer', 99), undefined)
  assert.throws(() => customerOrders(orders, null), /Entre na sua conta/)
  assert.throws(() => customerOrder(orders, null, 1042), /Entre na sua conta/)
  assert.equal(customerOrders(orders, 'unknown').length, 0)
})
test('list links to details, excludes foreign data and handles missing values', () => {
  const html = render()
  assert.match(html, /href="\/pedidos\/1042"/)
  assert.match(html, /Data não informada/)
  assert.match(html, /Valor não informado/)
  assert.doesNotMatch(html, /Pedido privado/)
})
test('details show items, subtotals, total, date and return link', () => {
  const detailed = { ...initialOrders[0], createdAt: '2026-09-10T12:00:00Z', total: 25, items: [{ id: 'a', name: 'Material', quantity: 2, unitPrice: 12.5 }] }
  const html = render({ orders: [detailed], orderId: detailed.id })
  assert.match(html, /href="\/pedidos"/)
  assert.match(html, /10\/09\/2026/)
  assert.match(html, /Material/)
  assert.match(html, /12,50/)
  assert.match(html, /25,00/)
  assert.match(render({ orderId: 1038 }), /Não há produtos informados/)
  assert.equal(orderMoney(0).replace(/\s/g, ''), 'R$0,00')
})
test('empty, search, loading and error states', () => {
  assert.match(render({ orders: [] }), /Você ainda não tem pedidos/)
  assert.match(render({ search: 'inexistente' }), /Nenhum pedido encontrado/)
  assert.match(render({ search: '1042' }), /Infiltração/)
  assert.doesNotMatch(render({ search: '1042' }), /Reparo hidráulico/)
  assert.match(render({ loading: true }), /Carregando pedidos/)
  assert.match(render({ error: 'Falha de conexão', onRetry() {} }), /Tentar novamente/)
  assert.match(render({ customerId: null }), /Entre na sua conta/)
})
test('foreign and nonexistent IDs return identical unavailable states', () => {
  assert.equal(render({ orderId: 99 }), render({ orderId: 999 }))
  assert.doesNotMatch(render({ orderId: 99 }), /Pedido privado/)
})
test('historical orders reuse known totals without inventing creation dates', () => {
  const html = render({ orders: completedOrders })
  assert.match(html, /Concluído/)
  assert.match(html, /1\.800,00/)
  assert.match(html, /Data não informada/)
  assert.doesNotMatch(html, /Silva Pinturas|Carlos Impermeabilizações|Fix Construções/)
})
