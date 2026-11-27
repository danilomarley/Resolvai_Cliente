import { createHmac } from 'node:crypto'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { readFileSync } from 'node:fs'

export const root = fileURLToPath(new URL('../', import.meta.url))
export const backend = resolve(root, '.e2e-backend')
export const api = 'http://127.0.0.1:5172'
export const auth = 'http://127.0.0.1:54321'
export const baseURL = 'http://127.0.0.1:4173'
export const databaseURL = 'postgresql://postgres:local-e2e-only@127.0.0.1:55432/resolvai_e2e'
export const secret = 'local-e2e-only-never-use-in-production-2026'
export const backendRef = JSON.parse(readFileSync(new URL('./backend-ref.json', import.meta.url), 'utf8'))

export function key(role) {
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url')
  const now = Math.floor(Date.now() / 1000)
  const data = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ role, iss: 'supabase', iat: now, exp: now + 86400 })}`
  return `${data}.${createHmac('sha256', secret).update(data).digest('base64url')}`
}
export const serviceKey = key('service_role')
export function cleanEnv() {
  return Object.fromEntries(Object.entries(process.env).filter(([name]) => !/^(DATABASE_|SUPABASE_|VITE_|ANTHROPIC_|COMPOSE_|API_PROXY_TARGET$|NODE_OPTIONS$|DOTENV_)/.test(name)))
}
export function apiEnv() {
  return { ...cleanEnv(), PORT: '5172', HOST: '127.0.0.1', LOG_LEVEL: 'error', DATABASE_URL: databaseURL, DATABASE_SSL: 'false',
    SUPABASE_URL: auth, SUPABASE_ANON_KEY: key('anon'), SUPABASE_SERVICE_ROLE_KEY: serviceKey,
    SUPABASE_JWT_SECRET: secret, CORS_ALLOWED_ORIGINS: baseURL }
}
export function pool() {
  const require = createRequire(resolve(backend, 'package.json'))
  const { Pool } = require('pg')
  return new Pool({ connectionString: databaseURL, max: 2, connectionTimeoutMillis: 5000 })
}
export async function assertTestDatabase(db) {
  const { rows } = await db.query('select current_database() as name, marker from public.e2e_guard')
  if (rows.length !== 1 || rows[0].name !== 'resolvai_e2e' || rows[0].marker !== 'resolvai-sprint4-ephemeral-only') throw new Error('Banco não identificado como E2E efêmero; operação recusada.')
}
