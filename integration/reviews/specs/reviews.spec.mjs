import { test, expect } from '@playwright/test'
import { randomUUID } from 'node:crypto'
import { api, auth, assertTestDatabase, pool, serviceKey } from '../../../.test-services/e2e/runtime.mjs'

const db = pool()
test.afterAll(async () => { await db.end() })
async function fixture(request, status = 'concluido', chosen = true) {
  await assertTestDatabase(db)
  const value = { name: 'Review E2E', email: `${randomUUID()}@e2e.example.test`, password: `Review!${randomUUID()}` }
  const created = await request.post(`${api}/api/v1/auth/register`, { data: value })
  expect(created.status()).toBe(201)
  value.id = (await created.json()).id
  value.provider = randomUUID(); value.order = randomUUID()
  await db.query("insert into users (id,name,email,role) values ($1,'Profissional E2E',$2,'Prestador')", [value.provider, `${value.provider}@e2e.example.test`])
  await db.query('insert into pedidos (id,id_cliente,status,escopo) values ($1,$2,$3,$4::jsonb)', [value.order, value.id, status, JSON.stringify({ titulo: 'Serviço E2E', descricao: 'Serviço isolado de teste' })])
  if (chosen) await db.query("insert into propostas (id_pedido,id_prestador,status,valor) values ($1,$2,'escolhida',100)", [value.order, value.provider])
  return value
}
async function clean(request, value) {
  await assertTestDatabase(db)
  await db.query('delete from avaliacoes where id_cliente=$1', [value.id])
  await db.query('delete from pedidos where id_cliente=$1', [value.id])
  await db.query('delete from users where id=any($1::uuid[])', [[value.id, value.provider]])
  expect((await request.delete(`${auth}/auth/v1/admin/users/${value.id}`, { headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey } })).ok()).toBe(true)
}
async function login(page, value) {
  await page.goto('/login')
  await page.getByLabel('E-mail', { exact: true }).fill(value.email)
  await page.getByLabel('Senha', { exact: true }).fill(value.password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Olá, Review' })).toBeVisible()
}

test('keyboard stars, optional comment, duplicate submission, persisted result and Home card', async ({ page, request }) => {
  const value = await fixture(request)
  try {
    await login(page, value)
    await page.goto(`/pedidos/${value.order}`)
    await page.getByRole('link', { name: 'Avaliar serviço', exact: true }).click()
    await expect(page.getByRole('radio')).toHaveCount(5)
    await expect(page.getByRole('button', { name: 'Enviar avaliação' })).toBeDisabled()
    await page.getByRole('radio', { name: '1 estrela', exact: true }).focus()
    await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight')
    await expect(page.getByRole('radio', { name: '4 estrelas', exact: true })).toBeChecked()
    let posts = 0
    page.on('request', r => { if (r.method() === 'POST' && r.url().endsWith(`/orders/${value.order}/review`)) posts++ })
    await page.locator('form').evaluate(form => { form.requestSubmit(); form.requestSubmit() })
    await expect(page.getByText('Avaliação enviada com sucesso.', { exact: true })).toBeVisible()
    expect(posts).toBe(1)
    const stored = await db.query('select nota,comentario,id_prestador from avaliacoes where id_pedido=$1', [value.order])
    expect(stored.rows).toEqual([{ nota: 4, comentario: null, id_prestador: value.provider }])
    await page.reload()
    await expect(page.getByText('Este pedido já foi avaliado.', { exact: true })).toBeVisible()
    await expect(page.getByRole('radio')).toHaveCount(0)
    await page.goto('/')
    await expect(page.getByRole('button', { name: /Sua avaliação/ })).toContainText('1 avaliação enviada')
  } finally { await clean(request, value) }
})

test('network error preserves the comment and a later real submission succeeds on mobile', async ({ page, context, request }) => {
  const value = await fixture(request)
  try {
    await page.setViewportSize({ width: 390, height: 844 })
    await login(page, value)
    await page.goto(`/pedidos/${value.order}/avaliar`)
    await page.getByRole('radio', { name: '5 estrelas' }).check()
    await page.getByLabel('Comentário (opcional)').fill('Comentário real no teste isolado')
    await context.setOffline(true)
    await page.getByRole('button', { name: 'Enviar avaliação' }).click()
    await expect(page.getByRole('alert')).toContainText('Não foi possível conectar')
    await expect(page.getByLabel('Comentário (opcional)')).toHaveValue('Comentário real no teste isolado')
    await context.setOffline(false)
    await page.getByRole('button', { name: 'Enviar avaliação' }).click()
    await expect(page.getByText('Avaliação enviada com sucesso.', { exact: true })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    expect((await db.query('select comentario from avaliacoes where id_pedido=$1', [value.order])).rows[0].comentario).toBe('Comentário real no teste isolado')
  } finally { await context.setOffline(false); await clean(request, value) }
})

test('unfinished orders cannot be reviewed and the real API conflict remains visible', async ({ page, request }) => {
  const value = await fixture(request, 'em_andamento')
  try {
    await login(page, value)
    await page.goto(`/pedidos/${value.order}/avaliar`)
    await expect(page.getByText('Somente pedidos concluídos podem ser avaliados.')).toBeVisible()
    await expect(page.getByRole('radio')).toHaveCount(0)
    await db.query("update pedidos set status='concluido' where id=$1", [value.order])
    await db.query('delete from propostas where id_pedido=$1', [value.order])
    await page.reload()
    await page.getByRole('radio', { name: '5 estrelas' }).check()
    await page.getByRole('button', { name: 'Enviar avaliação' }).click()
    await expect(page.getByRole('alert')).toContainText('prestador definido')
    expect((await db.query('select * from avaliacoes where id_pedido=$1', [value.order])).rowCount).toBe(0)
  } finally { await clean(request, value) }
})
