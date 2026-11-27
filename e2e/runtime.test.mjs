import assert from 'node:assert/strict'
import { test } from 'node:test'
import { apiEnv, assertTestDatabase, databaseURL } from './runtime.mjs'

test('E2E process environment always uses the isolated database and Auth', () => {
  const names = ['DATABASE_URL', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'VITE_API_BASE_URL', 'ANTHROPIC_API_KEY']
  const previous = names.map(name => process.env[name])
  try {
    for (const name of names) process.env[name] = 'production-value-must-never-be-used'
    const env = apiEnv()
    assert.equal(env.DATABASE_URL, databaseURL)
    assert.equal(env.SUPABASE_URL, 'http://127.0.0.1:54321')
    assert.equal(env.VITE_API_BASE_URL, undefined)
    assert.equal(env.ANTHROPIC_API_KEY, undefined)
    assert.ok(!Object.values(env).includes('production-value-must-never-be-used'))
  } finally {
    names.forEach((name, index) => { if (previous[index] === undefined) delete process.env[name]; else process.env[name] = previous[index] })
  }
})

test('database preparation and cleanup refuse missing or different test markers', async () => {
  for (const rows of [[], [{ name: 'postgres', marker: 'resolvai-sprint4-ephemeral-only' }], [{ name: 'resolvai_e2e', marker: 'other' }]]) {
    await assert.rejects(assertTestDatabase({ async query() { return { rows } } }), /operação recusada/)
  }
  await assertTestDatabase({ async query() { return { rows: [{ name: 'resolvai_e2e', marker: 'resolvai-sprint4-ephemeral-only' }] } } })
})
