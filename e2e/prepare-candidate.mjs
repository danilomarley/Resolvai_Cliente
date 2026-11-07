import { cpSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { root } from './runtime.mjs'
import { readFileSync } from 'node:fs'

// Apenas cópias descartáveis de testes/manifests; nenhum commit é integrado às branches.
const target = resolve(root, '.candidate-front')
const candidates = JSON.parse(readFileSync(resolve(root, 'e2e/candidates.json'), 'utf8'))
for (const path of ['e2e', 'playwright.config.mjs', 'package.json', 'package-lock.json']) cpSync(resolve(root, path), resolve(target, path), { recursive: true })
writeFileSync(resolve(target, 'e2e/backend-ref.json'), JSON.stringify({ repository: candidates.backendRepository, sha: candidates.backend }, null, 2))
