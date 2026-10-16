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
const { toOrder } = await import('../src/services/dashboardApi.ts')
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
const apiOrder = {
  ...initialOrders[0], id: 'a1', source: 'api', status: 'waiting', proposals: 2,
  proposalList: [{ id: 'p1', providerName: 'Silva Reformas', status: 'Sent', value: 150, deadline: '3 dias' }],
}
test('api orders offer proposals and tracking links by status, demo orders do not', () => {
  const html = render({ orders: [apiOrder, { ...apiOrder, id: 'a2', status: 'progress', proposals: 0 }] })
  assert.match(html, /href="\/pedidos\/a1\/propostas"/)
  assert.match(html, /Ver propostas \(2\)/)
  assert.match(html, /href="\/pedidos\/a2\/acompanhar"/)
  assert.doesNotMatch(html, /pedidos\/a2\/propostas/)
  assert.doesNotMatch(render(), /Acompanhar pedido/)
})
test('proposals and tracking views show their content', () => {
  assert.match(render({ orders: [apiOrder], orderId: 'a1', view: 'propostas' }), /Silva Reformas/)
  assert.match(render({ orders: [{ ...apiOrder, proposalList: [] }], orderId: 'a1', view: 'propostas' }), /Nenhuma proposta recebida/)
  const done = { ...apiOrder, status: 'completed', updatedAt: '2026-10-12T12:00:00Z',
    proposalList: [{ ...apiOrder.proposalList[0], status: 'Chosen' }] }
  const html = render({ orders: [done], orderId: 'a1', view: 'acompanhar' })
  assert.match(html, /Informações gerais e histórico/)
  assert.match(html, /Proposta de Silva Reformas escolhida/)
  assert.match(html, /Pedido concluído em 12\/10\/2026/)
  assert.match(render({ orders: [{ ...apiOrder, status: 'progress' }], orderId: 'a1', view: 'acompanhar' }), /Andamento do pedido/)
})
test('status filter and pager render only when requested', () => {
  assert.doesNotMatch(render(), /Filtrar por status/)
  const html = render({ filter: { value: 'Pending', onChange() {} }, pager: { page: 2, totalPages: 3, onPage() {} } })
  assert.match(html, /Filtrar por status/)
  assert.match(html, /Página 2 de 3/)
  assert.match(render({ pager: { page: 1, totalPages: 1, onPage() {} } }), /^(?!.*Paginação)/s)
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
  assert.match(html, /status-badge completed/)
  assert.doesNotMatch(html, /status-badge progress/)
  assert.match(html, /1\.800,00/)
  assert.match(html, /Data não informada/)
  assert.doesNotMatch(html, /Silva Pinturas|Carlos Impermeabilizações|Fix Construções/)
})

test('API details show returned fields, including update date and uppercase UUID routes', () => {
  const id = 'abcdef12-1234-4123-8123-abcdef123456'
  const order = toOrder({ id, title: 'Pedido da API', description: 'Descrição do backend',
    status: 'InProgress', createdAt: '2026-10-09T12:00:00Z', updatedAt: '2026-10-10T12:00:00Z' }, 'demo-customer')
  const html = render({ orders: [order], orderId: id.toUpperCase() })
  assert.match(html, /Descrição do backend/)
  assert.match(html, /Em andamento/)
  assert.match(html, /09\/10\/2026/)
  assert.match(html, /Última atualização/)
  assert.match(html, /10\/10\/2026/)
  assert.doesNotMatch(html, /Categoria|Localização|Produtos solicitados|Valor total|cinco pedidos/)
  assert.doesNotMatch(render({ orders: [{ ...order, updatedAt: undefined }], orderId: id }), /Última atualização/)
  const withDetails = toOrder({ ...order, category: 'Pintura', location: 'Fortaleza',
    status: 'InProgress', photos: [{ id: 'photo', url: 'https://example.invalid/photo.png' }] }, 'demo-customer')
  const details = render({ orders: [withDetails], orderId: id })
  assert.match(details, /Pintura/)
  assert.match(details, /Fortaleza/)
  assert.match(details, /https:\/\/example.invalid\/photo.png/)
  const list = render({ orders: [order] })
  assert.match(list, new RegExp(`href="/pedidos/${id}"`))
  assert.doesNotMatch(list, /Valor total/)
  assert.doesNotMatch(render({ orders: [] }), /Crie um pedido pelo menu/)
  assert.equal(customerOrder([order], 'demo-customer', id.toUpperCase()), order)
  assert.equal(customerOrder([order], 'other', id.toUpperCase()), undefined)
  assert.match(render({ orders: [order], search: '  Pedido da API  ' }), /Ver detalhes/)
  assert.match(render({ search: '  ' }), /href="\/pedidos\/1042"/)
  assert.match(render({ orders: [order], search: 'inexistente' }), /entre os pedidos desta página/)
})

test('expired API session offers login and preserves the requested order route', () => {
  const html = render({ orderId: 'abcdef12-1234-4123-8123-abcdef123456', error: 'Sessão expirada', requiresLogin: true })
  assert.match(html, /href="\/login"/)
  assert.match(html, /Entrar novamente/)
  assert.doesNotMatch(html, /Infiltração/)
  assert.doesNotMatch(render({ error: 'Falha de conexão' }), /Entrar novamente/)
})
