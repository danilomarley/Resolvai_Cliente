import { spawnSync } from 'node:child_process'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { assertTestDatabase, backend, backendRef, cleanEnv, pool, root } from './runtime.mjs'

const action = process.argv[2]
if (!['up', 'down'].includes(action)) throw new Error('Use up ou down.')
const docker = (args) => {
  const context = spawnSync('docker', ['context', 'inspect', '--format', '{{.Endpoints.docker.Host}}'], { encoding: 'utf8', env: cleanEnv() })
  const endpoint = process.env.DOCKER_HOST || context.stdout?.trim()
  if (!context.error && !/^(unix|npipe):\/\//.test(endpoint ?? '')) throw new Error('E2E exige um Docker local via unix/npipe; daemon remoto recusado.')
  const result = spawnSync('docker', ['compose', '--project-name', 'resolvai-sprint4-e2e', '-f', join(root, 'e2e/compose.yml'), ...args], { stdio: 'inherit', env: cleanEnv() })
  if (result.error) throw new Error('Docker Compose indisponível. Instale/inicie Docker Desktop ou execute no CI.', { cause: result.error })
  if (result.status !== 0) process.exit(result.status ?? 1)
}
if (action === 'down') {
  // Somente os containers deste projeto; PostgreSQL fica em tmpfs, sem volumes persistentes.
  docker(['down'])
} else {
  const head = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: backend, encoding: 'utf8' })
  if (head.status !== 0 || head.stdout.trim() !== backendRef.sha) throw new Error('Prepare .e2e-backend no SHA de e2e/backend-ref.json antes de iniciar.')
  docker(['up', '-d', '--wait', '--wait-timeout', '120'])
  const db = pool()
  try {
    await assertTestDatabase(db)
    const existing = await db.query("select to_regclass('public.users') as table_name")
    if (existing.rows[0].table_name) throw new Error('Banco E2E já inicializado. Encerre com npm run e2e:down e inicie novamente para uma execução limpa.')
    for (const file of readdirSync(join(backend, 'db/scripts')).filter(name => name.endsWith('.sql')).sort()) {
      await db.query(readFileSync(join(backend, 'db/scripts', file), 'utf8'))
    }
    console.log(`Banco E2E efêmero preparado com API ${backendRef.sha}.`)
  } finally { await db.end() }
}
