import { test as base, expect } from '@playwright/test'
import { randomInt, randomUUID } from 'node:crypto'
import { api, auth, assertTestDatabase, pool, serviceKey } from './runtime.mjs'

export const registration = (account) => ({
  name: account.name, cpf: account.cpf,
  endereco: { logradouro: 'Rua de Teste', numero: '10', bairro: 'Bairro E2E', cidade: 'Fortaleza', estado: 'CE', cep: '00000000' },
  contato: { tipo: 'whatsapp', valor: '85999999999' },
})
export async function apiCall(request, account, path, data, expected = 200) {
  const response = await request.fetch(`${api}${path}`, { method: data === undefined ? 'GET' : 'POST',
    headers: { authorization: `Bearer ${account.accessToken}` }, ...(data === undefined ? {} : { data }) })
  // Não inclui corpo nem cabeçalhos em mensagens de falha que possam conter tokens.
  expect(response.status(), `${path}: status HTTP`).toBe(expected)
  return response.json()
}
export async function completeAccount(request, account) {
  await apiCall(request, account, '/api/v1/users/me/complete-registration', registration(account))
}
export async function browserLogin(page, account, navigate = true) {
  if (navigate) await page.goto('/login')
  await page.getByLabel('E-mail', { exact: true }).fill(account.email)
  await page.getByLabel('Senha', { exact: true }).fill(account.password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
}

export const test = base.extend({
  account: async ({ request }, use) => {
    const account = { name: 'Cliente E2E', email: `${randomUUID()}@e2e.example.test`, password: `E2e!${randomUUID()}`, cpf: String(randomInt(10000000000, 99999999999)) }
    const created = await request.post(`${api}/api/v1/auth/register`, { data: { name: account.name, email: account.email, password: account.password } })
    expect(created.status(), 'Cadastro da conta sintética').toBe(201)
    account.id = (await created.json()).id
    try {
      const login = await request.post(`${api}/api/v1/auth/login`, { data: { email: account.email, password: account.password } })
      expect(login.status(), 'Login da conta sintética').toBe(200)
      account.accessToken = (await login.json()).accessToken
      await use(account)
    } finally {
      const db = pool()
      try {
        await assertTestDatabase(db)
        const client = await db.connect()
        try {
          await client.query('begin')
          await client.query('delete from public.pedidos where id_cliente = $1', [account.id])
          await client.query('delete from public.users where id = $1 and email = $2', [account.id, account.email])
          await client.query('commit')
        } catch (error) { await client.query('rollback'); throw error }
        finally { client.release() }
      } finally { await db.end() }
      const deleted = await request.delete(`${auth}/auth/v1/admin/users/${account.id}`, { headers: { authorization: `Bearer ${serviceKey}`, apikey: serviceKey } })
      expect(deleted.ok(), 'Limpeza da conta sintética no Auth isolado').toBe(true)
    }
  },
})
export { expect }
