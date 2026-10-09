import { build } from 'vite'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const output = resolve(root, 'dist-demo')
await build({ root, mode: 'demo', base: './',
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify('https://demo.invalid'),
    'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify('demo-public-key'),
    'import.meta.env.VITE_API_BASE_URL': JSON.stringify(''),
  },
  build: { outDir: output, assetsInlineLimit: Number.MAX_SAFE_INTEGER },
})
let html = await readFile(resolve(output, 'index.html'), 'utf8')
for (const match of [...html.matchAll(/<script\b[^>]*src="([^"]+)"[^>]*><\/script>/g)]) {
  const js = await readFile(resolve(output, match[1]), 'utf8')
  html = html.replace(match[0], () => `<script type="module">${js.replace(/<\/script/gi, '<\\/script')}</script>`)
}
for (const match of [...html.matchAll(/<link\b[^>]*href="([^"]+\.css)"[^>]*>/g)]) {
  const css = await readFile(resolve(output, match[1]), 'utf8')
  html = html.replace(match[0], () => `<style>${css.replace(/<\/style/gi, '<\\/style')}</style>`)
}
html = html.replace(/<link\b[^>]*rel="modulepreload"[^>]*>/g, '')
const favicon = await readFile(resolve(root, 'public/favicon.svg'))
html = html.replace(/<link\b[^>]*rel="icon"[^>]*>/g,
  `<link rel="icon" href="data:image/svg+xml;base64,${favicon.toString('base64')}">`)
const destination = resolve(root, 'apresentacao')
await mkdir(destination, { recursive: true })
await writeFile(resolve(destination, 'ResolvAI.html'), html)
await writeFile(resolve(destination, 'LEIA-ME.txt'), 'ResolvAI - demonstracao offline\n\nAbra iniciar-prototipo.cmd na pasta Resolvai_Cliente, ou ResolvAI.html diretamente.\nA primeira tela e o login. Clique em Crie uma agora para mostrar o cadastro.\nUse dados ficticios para entrar e visualizar todos os menus do dashboard.\nNao precisa instalar Node, .NET ou configurar contas. Funciona sem internet.\nOs dados sao ficticios. Alteracoes duram enquanto a pagina estiver aberta.\nEsta demonstracao nao envia pedidos para a API real.\n')
console.log('Apresentacao pronta: apresentacao/ResolvAI.html')
