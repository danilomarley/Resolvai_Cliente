import { existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn, execFileSync } from 'node:child_process'
import { loadEnv } from 'vite'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const env = { ...loadEnv('development', root, ''), ...process.env }
const children = new Set()
let stopping = false

function stop(code = 0) {
  if (stopping) return
  stopping = true
  for (const child of children) {
    if (!child.pid || child.exitCode !== null) continue
    if (process.platform === 'win32') {
      try { execFileSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true }) } catch { /* Already stopped. */ }
    } else child.kill('SIGTERM')
  }
  process.exit(code)
}
process.on('SIGINT', () => stop())
process.on('SIGTERM', () => stop())

function start(command, args, options = {}) {
  const child = spawn(command, args, { cwd: root, stdio: 'inherit', windowsHide: true, env, ...options })
  children.add(child)
  child.on('exit', () => children.delete(child))
  return child
}
async function apiReady(target) {
  try {
    const response = await fetch(new URL('/openapi/v1.json', target), { signal: AbortSignal.timeout(2000) })
    if (!response.ok) return false
    const document = await response.json()
    return typeof document.openapi === 'string' && !!document.paths?.['/api/v1/home/summary']
  } catch { return false }
}

async function main() {
  const args = process.argv.slice(2)
  if (args.some((arg) => arg !== '--front') || args.length > 1) {
    throw new Error('Use sem argumentos ou --front (somente frontend).')
  }
  if (args.includes('--front')) {
    console.log('ResolvAI - iniciando somente o frontend. Para encerrar, pressione Ctrl+C.')
    startFrontend('/login')
    return
  }
  const target = new URL(env.VITE_API_BASE_URL || env.API_PROXY_TARGET || 'http://localhost:5172')
  console.log('ResolvAI - iniciando API e frontend. Para encerrar, pressione Ctrl+C.')
  if (!await apiReady(target)) {
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(target.hostname)
    if (!local || target.protocol !== 'http:') {
      throw new Error('A API configurada nao respondeu. Inicie essa API ou confira API_PROXY_TARGET/VITE_API_BASE_URL no .env.local.')
    }
    // A API agora e o Resolvai_Backend_Node (a API C# foi descontinuada).
    const backendDir = resolve(root, '../Resolvai_Backend_Node')
    if (!existsSync(resolve(backendDir, 'src/server.ts'))) {
      throw new Error('Backend nao encontrado. Coloque Resolvai_Backend_Node ao lado de Resolvai_Cliente.')
    }
    if (!existsSync(resolve(backendDir, 'node_modules/tsx'))) {
      throw new Error('Dependencias do backend nao instaladas. Execute "npm ci" na pasta Resolvai_Backend_Node.')
    }
    if (!existsSync(resolve(backendDir, '.env'))) {
      throw new Error('Configuracao do backend nao encontrada. Crie Resolvai_Backend_Node/.env a partir do .env.example.')
    }
    console.log('Iniciando o backend...')
    const backend = start(process.execPath, ['--env-file-if-exists=.env', '--import', 'tsx', 'src/server.ts'], {
      cwd: backendDir,
      env: { ...process.env, PORT: target.port || '5172', HOST: target.hostname.replace(/^\[|\]$/g, '') },
    })
    let backendFailure
    backend.on('error', (error) => { backendFailure = error.message })
    for (let attempt = 0; attempt < 120; attempt++) {
      if (backendFailure || backend.exitCode !== null) throw new Error('O backend nao iniciou. Confira a mensagem acima e a configuracao da API.')
      if (await apiReady(target)) break
      if (attempt === 119) throw new Error('Tempo esgotado aguardando a API. Confira a compilacao e a configuracao do backend.')
      await new Promise((done) => setTimeout(done, 500))
    }
    backend.on('exit', (code) => { if (!stopping) { console.error('O backend foi encerrado.'); stop(code || 1) } })
  } else console.log('API ja esta em execucao; sera reutilizada.')
  console.log('API pronta. Abrindo a tela de login...')
  startFrontend('/login')
}
function startFrontend(page) {
  const frontend = start(process.execPath, [resolve(root, 'node_modules/vite/bin/vite.js'), '--host', '127.0.0.1', '--port', '5173', '--clearScreen', 'false', '--open', page])
  frontend.on('error', (error) => { console.error(error.message); stop(1) })
  frontend.on('exit', (code) => stop(code || 0))
}
main().catch((error) => { console.error(`\n${error.message}`); stop(1) })
