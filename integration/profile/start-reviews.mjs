import { spawn } from 'node:child_process'
import { resolve } from 'node:path'
import { apiEnv, assertTestDatabase, pool } from '../../.test-services/e2e/runtime.mjs'
const db = pool()
try { await assertTestDatabase(db) } finally { await db.end() }
const root = resolve('.review-api')
const child = spawn(process.execPath, [resolve(root, 'dist/server.js')], { cwd: root, env: { ...apiEnv(), PORT: '5178' }, stdio: ['ignore', 'ignore', 'inherit'], windowsHide: true })
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => child.kill(signal))
child.on('exit', code => process.exit(code ?? 1))
