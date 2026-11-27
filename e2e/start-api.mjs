import { spawn } from 'node:child_process'
import { join } from 'node:path'
import { apiEnv, assertTestDatabase, backend, pool } from './runtime.mjs'

const db = pool()
try { await assertTestDatabase(db) } finally { await db.end() }
// Não usa npm start nem --env-file: nenhum .env de desenvolvimento/produção é carregado.
const child = spawn(process.execPath, [join(backend, 'dist/server.js')], { cwd: backend, env: apiEnv(), stdio: 'inherit', windowsHide: true })
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => child.kill(signal))
child.on('error', error => { console.error(error.message); process.exit(1) })
child.on('exit', code => process.exit(code ?? 1))
