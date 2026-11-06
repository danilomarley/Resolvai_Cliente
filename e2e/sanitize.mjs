import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { unzipSync, zipSync } from 'fflate'

const sensitive = /password|secret|token|authorization|apikey|cookie/i
const jwt = /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g
const credential = /(?:Nova!|SemProva!)?E2e![0-9a-f-]{36}/gi
function value(input) {
  if (typeof input === 'string') {
    try { return JSON.stringify(value(JSON.parse(input))) } catch { return input.replace(jwt, '[REDACTED]').replace(credential, '[REDACTED]') }
  }
  if (Array.isArray(input)) return input.map(value)
  if (input && typeof input === 'object') {
    if (typeof input.name === 'string' && sensitive.test(input.name) && 'value' in input) return { ...input, value: '[REDACTED]' }
    if (input.encoding === 'base64' && typeof input.text === 'string') return { ...input, text: Buffer.from(sanitizeText(Buffer.from(input.text, 'base64').toString('utf8'))).toString('base64') }
    return Object.fromEntries(Object.entries(input).map(([key, item]) => [key, sensitive.test(key) ? '[REDACTED]' : value(item)]))
  }
  return input
}
export function sanitizeText(text) {
  return text.split('\n').map(line => {
    try { return JSON.stringify(value(JSON.parse(line))) }
    catch { return line.replace(jwt, '[REDACTED]').replace(credential, '[REDACTED]') }
  }).join('\n')
}
export function sanitizeBuffer(bytes, name) {
  if (name.endsWith('.zip')) {
    const files = unzipSync(bytes)
    return zipSync(Object.fromEntries(Object.entries(files).map(([path, content]) => [path, sanitizeBuffer(content, path)])))
  }
  // Screenshots/fontes são binários; senhas aparecem mascaradas nos screenshots do navegador.
  if (/\.(png|jpe?g|webp|woff2?)$/i.test(name) || bytes.includes(0)) return bytes
  return Buffer.from(sanitizeText(Buffer.from(bytes).toString('utf8')))
}
export function sanitizeDirectory(source, target) {
  mkdirSync(target, { recursive: true })
  if (!existsSync(source)) return
  for (const entry of readdirSync(source, { withFileTypes: true })) {
    const input = join(source, entry.name), output = join(target, entry.name)
    if (entry.isDirectory()) sanitizeDirectory(input, output)
    else if (entry.isFile()) writeFileSync(output, sanitizeBuffer(readFileSync(input), entry.name))
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  // Não publica o HTML bruto: ele pode incluir um ZIP em base64 com respostas de login.
  sanitizeDirectory('test-results', 'e2e-artifacts/test-results')
  console.log('Traces e diagnósticos sanitizados em e2e-artifacts/. O relatório HTML bruto permanece local.')
}
