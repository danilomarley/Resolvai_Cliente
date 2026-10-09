import { existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { tmpdir } from 'node:os'
import { spawn, execFileSync } from 'node:child_process'
import { loadEnv } from 'vite'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const env = { ...loadEnv('development', root, ''), ...process.env }
const target = new URL(env.VITE_API_BASE_URL || env.API_PROXY_TARGET || 'http://localhost:5172')
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
async function apiReady() {
  try {
    const response = await fetch(new URL('/openapi/v1.json', target), { signal: AbortSignal.timeout(2000) })
    if (!response.ok) return false
    const document = await response.json()
    return typeof document.openapi === 'string' && !!document.paths?.['/api/v1/home/summary']
  } catch { return false }
}

async function main() {
  console.log('ResolvAI - iniciando API e frontend. Para encerrar, pressione Ctrl+C.')
  if (!await apiReady()) {
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(target.hostname)
    if (!local || target.protocol !== 'http:') {
      throw new Error('A API configurada nao respondeu. Inicie essa API ou confira API_PROXY_TARGET/VITE_API_BASE_URL no .env.local.')
    }
    const project = resolve(root, '../Resolvai_Backend/src/Resolvai.Api/Resolvai.Api.csproj')
    if (!existsSync(project)) throw new Error('Backend nao encontrado. Coloque Resolvai_Backend ao lado de Resolvai_Cliente.')
    let sdks
    try { sdks = execFileSync('dotnet', ['--list-sdks'], { encoding: 'utf8', windowsHide: true }) }
    catch { throw new Error('Instale o SDK .NET 10: winget install --id Microsoft.DotNet.SDK.10 --exact') }
    if (!sdks.split(/\r?\n/).some((line) => /^10\./.test(line))) {
      throw new Error('SDK .NET 10 nao encontrado. Execute: winget install --id Microsoft.DotNet.SDK.10 --exact')
    }
    console.log('Compilando e iniciando o backend. A primeira execucao pode levar alguns minutos...')
    // All generated build files stay outside the backend repository.
    const artifacts = resolve(tmpdir(), 'resolvai-prototype-artifacts')
    const backend = start('dotnet', ['run', '--project', project, '--artifacts-path', artifacts, '--no-launch-profile'], {
      env: { ...env, ASPNETCORE_ENVIRONMENT: 'Development', ASPNETCORE_URLS: target.origin, DOTNET_CLI_TELEMETRY_OPTOUT: '1' },
    })
    let backendFailure
    backend.on('error', (error) => { backendFailure = error.message })
    for (let attempt = 0; attempt < 120; attempt++) {
      if (backendFailure || backend.exitCode !== null) throw new Error('O backend nao iniciou. Confira a mensagem acima e sua configuracao de banco/Supabase.')
      if (await apiReady()) break
      if (attempt === 119) throw new Error('Tempo esgotado aguardando a API. Confira a compilacao e a configuracao do backend.')
      await new Promise((done) => setTimeout(done, 500))
    }
    backend.on('exit', (code) => { if (!stopping) { console.error('O backend foi encerrado.'); stop(code || 1) } })
  } else console.log('API ja esta em execucao; sera reutilizada.')
  console.log('API pronta. Abrindo a tela de login...')
  const frontend = start(process.execPath, [resolve(root, 'node_modules/vite/bin/vite.js'), '--host', '127.0.0.1', '--port', '5173', '--clearScreen', 'false', '--open', '/login'])
  frontend.on('error', (error) => { console.error(error.message); stop(1) })
  frontend.on('exit', (code) => stop(code || 0))
}
main().catch((error) => { console.error(`\n${error.message}`); stop(1) })
