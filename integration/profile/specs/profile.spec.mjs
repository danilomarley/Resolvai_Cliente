import { randomUUID } from 'node:crypto'
import { test as base, expect, browserLogin } from '../../../.test-services/e2e/fixtures.mjs'
import { api, assertTestDatabase, pool } from '../../../.test-services/e2e/runtime.mjs'
const db = pool()
const test = base.extend({
  provider: async ({ account }, use) => {
    await assertTestDatabase(db)
    const value = { id: randomUUID(), orders: [randomUUID(), randomUUID()] }
    await db.query("insert into users (id,name,email,role,cpf) values ($1,'Profissional E2E',$2,'Prestador','22222222222')", [value.id, `${value.id}@e2e.example.test`])
    for (const id of value.orders) {
      await db.query("insert into pedidos (id,id_cliente,status,escopo) values ($1,$2,'concluido','{\"titulo\":\"Serviço de teste\"}')", [id, account.id])
      await db.query("insert into propostas (id_pedido,id_prestador,status,valor) values ($1,$2,'escolhida',100)", [id, value.id])
    }
    try { await use(value) }
    finally {
      await assertTestDatabase(db)
      await db.query('delete from avaliacoes where id_cliente=$1', [account.id])
      await db.query('delete from pedidos where id_cliente=$1', [account.id])
      await db.query('delete from fornecedor_especialidades where id_usuario=$1', [value.id])
      await db.query('delete from fornecedores where id_usuario=$1', [value.id])
      await db.query('delete from users where id=$1', [value.id])
    }
  },
})
test.afterAll(async () => { await db.end() })

test('proposal link preserves return navigation, missing fields remain explicit and mobile layout fits', async ({ page, account, provider }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await browserLogin(page, account)
  await expect(page.getByRole('heading', { name: 'Olá, Cliente' })).toBeVisible()
  await page.goto(`/pedidos/${provider.orders[0]}/propostas`)
  await page.getByRole('link', { name: 'Ver perfil de Profissional E2E' }).click()
  await expect(page.getByRole('heading', { name: 'Profissional E2E', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Profissional E2E', exact: true })).toBeFocused()
  for (const text of ['Foto não informada', 'Região não informada', 'Categorias não informadas', 'Este prestador ainda não recebeu avaliações.']) await expect(page.getByText(text, { exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.getByRole('link', { name: 'Voltar às propostas' }).click()
  await expect(page).toHaveURL(new RegExp(`/pedidos/${provider.orders[0]}/propostas$`))
})

test('canonical professional schema and reviews created by the real #92 API populate only public fields', async ({ page, request, account, provider }) => {
  await db.query("insert into fornecedores (id_usuario,tipo_pessoa,nome_exibicao,cidade_atuacao,uf_atuacao) values ($1,'PF','Nome público E2E','Fortaleza','CE')", [provider.id])
  await db.query("insert into fornecedor_especialidades (id_usuario,codigo_especialidade) values ($1,'eletrica')", [provider.id])
  for (const [index, rating] of [5, 3].entries()) {
    const response = await request.post(`http://127.0.0.1:5178/api/v1/orders/${provider.orders[index]}/review`, { headers: { Authorization: `Bearer ${account.accessToken}` }, data: { rating, comment: index === 0 ? '<script>texto literal</script>' : 'Serviço concluído' } })
    expect(response.status()).toBe(201)
  }
  const response = await request.get(`${api}/api/v1/providers/${provider.id}/public-profile`, { headers: { Authorization: `Bearer ${account.accessToken}` } })
  expect(response.status()).toBe(200)
  const body = await response.json()
  expect(body).toMatchObject({ name: 'Nome público E2E', categories: ['Elétrica'], region: 'Fortaleza, CE', reviewsCount: 2, averageRating: 4, completedServices: 2, photoUrl: null })
  expect(body.reviews).toHaveLength(2)
  for (const privateValue of ['22222222222', account.email, 'id_cliente', 'id_pedido', 'cnpj']) expect(JSON.stringify(body)).not.toContain(privateValue)
  await browserLogin(page, account)
  await expect(page.getByRole('heading', { name: 'Olá, Cliente' })).toBeVisible()
  await page.goto(`/prestadores/${provider.id}`)
  await expect(page.getByRole('heading', { name: 'Nome público E2E' })).toBeVisible()
  await expect(page.getByText('4 de 5', { exact: true })).toBeVisible()
  await expect(page.getByText('Avaliações recebidas', { exact: true })).toBeVisible()
  await expect(page.getByText('<script>texto literal</script>', { exact: true })).toBeVisible()
  await expect(page.locator('.provider-reviews script')).toHaveCount(0)
})

test('authentication, unavailable provider and inactive provider remain protected; login returns to profile', async ({ page, request, account, provider }) => {
  const path = `/api/v1/providers/${provider.id}/public-profile`
  expect((await request.get(`${api}${path}`)).status()).toBe(401)
  expect((await request.get(`${api}/api/v1/providers/${randomUUID()}/public-profile`, { headers: { Authorization: `Bearer ${account.accessToken}` } })).status()).toBe(404)
  await db.query('update users set is_active=false where id=$1', [provider.id])
  expect((await request.get(`${api}${path}`, { headers: { Authorization: `Bearer ${account.accessToken}` } })).status()).toBe(404)
  await db.query('update users set is_active=true where id=$1', [provider.id])
  await page.goto(`/prestadores/${provider.id}`)
  await expect(page).toHaveURL(/\/login$/)
  await browserLogin(page, account, false)
  await expect(page).toHaveURL(new RegExp(`/prestadores/${provider.id}$`))
  await expect(page.getByRole('heading', { name: 'Profissional E2E' })).toBeVisible()
  await page.goto(`/prestadores/${randomUUID()}`)
  await expect(page.getByRole('heading', { name: 'Perfil indisponível' })).toBeVisible()
})
