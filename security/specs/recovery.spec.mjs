import { test, expect } from '@playwright/test'
import { account, api, call, cleanup, code, db } from '../../.security-api/tests/live/support.mjs'

test.afterAll(async () => { await db.end() })
test('recuperação exige código recebido por SMTP e permite login com a nova senha', async ({ page }) => {
  const value = await account()
  try {
    await page.goto('/login')
    await page.getByRole('link', { name: 'Esqueceu a senha?' }).click()
    await page.getByLabel('E-mail', { exact: true }).fill(value.email)
    await page.getByRole('button', { name: 'Avançar', exact: true }).click()
    await expect(page.getByLabel('Código de recuperação')).toBeVisible()
    const token = await code(value.email)
    await page.getByLabel('Código de recuperação').fill(token)
    await page.getByLabel('Nova Senha', { exact: true }).fill(`New!${value.password}`)
    await page.getByLabel('Confirmar Senha', { exact: true }).fill(`New!${value.password}`)
    await page.getByRole('button', { name: 'Confirmar Nova Senha', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Senha alterada!' })).toBeVisible()
    expect((await call('/auth/login', { email: value.email, password: value.password })).status).toBe(401)
    await page.getByRole('button', { name: 'Ir para o Login' }).click()
    await page.getByLabel('Senha', { exact: true }).fill(`New!${value.password}`)
    await page.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Olá, Security' })).toBeVisible()
  } finally { await cleanup(value) }
})

test('solicitação de conta inexistente mantém resposta genérica e nunca autentica', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('link', { name: 'Esqueceu a senha?' }).click()
  await page.getByLabel('E-mail', { exact: true }).fill('absent-ui@e2e.example.test')
  await page.getByRole('button', { name: 'Avançar', exact: true }).click()
  await expect(page.getByText(/Se houver uma conta/)).toBeVisible()
  await expect(page.getByLabel('Código de recuperação')).toBeVisible()
  expect(await page.evaluate(() => sessionStorage.getItem('resolvai.api-session'))).toBeNull()
})
