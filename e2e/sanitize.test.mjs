import assert from 'node:assert/strict'
import { test } from 'node:test'
import { unzipSync, zipSync } from 'fflate'
import { sanitizeBuffer, sanitizeText } from './sanitize.mjs'

test('redacts credentials in response bodies, headers, storage, base64 and nested trace archives', () => {
  const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.c2lnbmF0dXJl'
  const password = 'E2e!10000000-0000-4000-8000-000000000001'
  const body = { accessToken: jwt, refreshToken: 'opaque-refresh', password, name: 'Cliente E2E' }
  const network = { headers: [{ name: 'Authorization', value: `Bearer ${jwt}` }], content: { encoding: 'base64', text: Buffer.from(JSON.stringify(body)).toString('base64') }, storage: JSON.stringify(body), params: { value: password } }
  const archive = zipSync({ 'trace.network': Buffer.from(JSON.stringify(network)), 'resources/body': Buffer.from(JSON.stringify(body)) })
  const files = unzipSync(sanitizeBuffer(archive, 'trace.zip'))
  const parsed = JSON.parse(Buffer.from(files['trace.network']).toString())
  const decoded = Buffer.from(parsed.content.text, 'base64').toString()
  for (const output of [JSON.stringify(parsed), decoded, Buffer.from(files['resources/body']).toString()]) {
    for (const secret of [jwt, password, 'opaque-refresh']) assert.ok(!output.includes(secret))
  }
  assert.match(decoded, /Cliente E2E/)
  assert.equal(parsed.headers[0].value, '[REDACTED]')
})

test('redacts passwords from plain error contexts and preserves normal diagnostics', () => {
  const result = sanitizeText('Falha no campo: Nova!E2e!10000000-0000-4000-8000-000000000001\nStatus 401')
  assert.match(result, /\[REDACTED\]/)
  assert.match(result, /Status 401/)
})
