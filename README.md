# ResolvAI — Portal do contratante

Dashboard responsivo em React, TypeScript e Vite, baseado no protótipo do contratante. Usa Rajdhani e a paleta de azul, azul escuro, laranja e branco frio.

## Executar

### Abrir com dois cliques no Windows

Na pasta do projeto, abra **`iniciar-prototipo.cmd`**. Ele inicia o servidor e abre a tela de login no navegador automaticamente, sem precisar copiar um link. Para abrir o cadastro, clique em **“Crie uma agora”**. Também é possível acessar `/login` ou `/cadastro` no endereço local exibido pelo Vite. Mantenha a janela do terminal aberta enquanto usa o protótipo; feche-a ou pressione `Ctrl+C` para encerrar.

O arquivo usa o Node.js instalado no computador ou, neste workspace, a versão portátil em `../.tools/node.exe`. Em uma nova instalação, prepare as dependências com `npm ci` antes de executá-lo. O inicializador tenta a porta `5173`, com cores de terminal desativadas para evitar caracteres estranhos. Se ela estiver ocupada, o Vite escolhe outra porta livre e abre o endereço correto automaticamente. Use o endereço exibido na janela do inicializador.

A mensagem `Re-optimizing dependencies because lockfile has changed` é normal após uma alteração no `package-lock.json`: o Vite está atualizando o cache das dependências.

### Abrir pelo terminal

Requer Node.js 20.19+ ou 22.12+ e npm.

```sh
npm ci
npm run dev
```

Abra o endereço local exibido pelo Vite.

Para integrar a API oficial, mantenha as variáveis públicas do Supabase e configure
`API_PROXY_TARGET` no `.env.local` (padrão: `http://localhost:5172`). Inicie o backend
separadamente. O Vite encaminha `/api` ao backend, sem exigir CORS no desenvolvimento.
Consulte [docs/INTEGRACAO_API.md](docs/INTEGRACAO_API.md) e `.env.example` para a
configuração de produção e os endpoints usados. Reinicie o Vite após alterar variáveis.

Para abrir o navegador automaticamente pelo terminal, use `npm run dev -- --open`.

## Verificar

```sh
npm run lint
npm test
npm run build
npm run preview
```

## Guia visual

Consulte [docs/STYLE_GUIDE.md](docs/STYLE_GUIDE.md) para cores, tipografia, botões, componentes, acessibilidade e regras responsivas da [issue #31](https://github.com/danilomarley/Resolvai_Cliente/issues/31).

- `src/styles/variables.css`: tokens de identidade visual.
- `src/styles/global.css`: estilos e adaptações responsivas.
- `src/components/`: ícones, ilustração e diálogo acessível.
- `src/components/OrderAssistant.tsx`: conversa demonstrativa para criação e revisão do escopo.
- `src/data/dashboard.ts`: dados de demonstração.
- `src/App.tsx`: rotas da aplicação.
- `src/pages/Dashboard/`: dashboard integrado ao resumo e perfil da API.
- `src/services/api.ts` e `dashboardApi.ts`: transporte HTTP, DTOs e adaptação dos dados.

## Funcionalidades da demonstração

Busca e filtros de pedidos, criação de pedido com assistente simulado, consulta de propostas, acompanhamento de serviço, histórico, notificações, edição de perfil, conversa local e central de ajuda.

O fluxo “Criar pedido” segue o protótipo original: categoria, problema, detalhes do ambiente, localização, urgência e fotos opcionais. O escopo aparece durante a conversa e pode ser editado na revisão antes de publicar. As perguntas e sugestões são predefinidas, sem IA conectada. O pedido criado preserva as informações e as fotos na sessão.

O dashboard, o perfil, os detalhes de pedidos, o login e o cadastro usam a API oficial.
Os contadores abrangem toda a conta; a lista contém até cinco pedidos recentes.
Criação, listagem completa, IA, propostas, avaliações, pagamentos e mensagens ainda
não possuem endpoints identificados para esta integração. Os componentes antigos
de demonstração permanecem no código, mas seus dados não aparecem na tela integrada.
