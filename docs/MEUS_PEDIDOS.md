# Meus pedidos

> Este documento descreve a primeira entrega do protótipo. A integração atual
> substitui os pedidos locais por consultas à API. Consulte
> [INTEGRACAO_API.md](INTEGRACAO_API.md) para contratos, configuração e pendências.

## Implementação

A branch `feat/meus-pedidos-detalhamento-dev` parte de `origin/dev`
(`a5c5786`). O fetch inicial falhou dentro do sandbox; a segunda tentativa
atualizou as referências e revelou a integração de login e cadastro. A versão
inicial da tarefa foi adaptada à arquitetura atual sem aplicar o stash
preexistente do usuário.

- `/pedidos`: identificador, data, status, total, busca e links para detalhes.
- `/pedidos/:orderId`: descrição, localização, escopo, fotos e produtos, quando
  disponíveis; quantidades, preços unitários, subtotais e total.
- Retorno à listagem, histórico do navegador, foco no título e layout responsivo.
- Estados de carregamento da sessão, falha com nova tentativa, lista vazia,
  busca sem resultados e pedido indisponível.
- Sem sessão, redirecionamento para `/login`; o login retorna ao pedido solicitado.

O Dashboard permanece montado nas rotas filhas para preservar os pedidos criados
na sessão. Reutilizamos React Router, Supabase Auth, Sidebar, OrderAssistant,
PhotoPreview e os tokens e classes do guia visual existente. Nenhuma dependência
nova foi adicionada.

## Dados e integração pendente

O repositório tem autenticação Supabase, mas não possui contrato, tabela ou serviço
de consulta de pedidos. Não foi criado um endpoint ou uma tabela presumida.
`services/orders.ts` consulta o conjunto local com filtro obrigatório por
`customerId`. O Dashboard atribui aos novos pedidos o ID da sessão autenticada.
Os mocks preexistentes pertencem exclusivamente a `demo-customer` e não são
reatribuídos a contas reais. Os serviços concluídos reutilizam seus totais
conhecidos, sem expor dados de fornecedores na nova página.

Assim, uma conta real começa com a lista vazia e pode consultar os pedidos que
criar durante esta sessão. Recarregar a página descarta os pedidos locais. Datas
e valores ausentes são indicados como não informados; datas de conclusão não
são usadas como datas de criação, e preços de propostas não são totais de pedidos.

A integração futura precisa fornecer os pedidos da conta autenticada, os itens
e totais reais e autorização no servidor/RLS. O filtro local e o bloqueio da rota
são comportamentos do protótipo, não uma autorização de backend. Não há consulta
real ao histórico remoto nesta entrega.

## Validação

- `npm test`: seis testes com Node 24.21.0, usando o compilador TypeScript já
  existente e o executor nativo do Node. Cobrem links, itens, subtotais,
  formatação, dados ausentes, estados de interface e isolamento entre clientes.
  O carregador dos testes exige Node com `node:module.registerHooks`.
- `npm run build`: TypeScript e bundle Vite aprovados. A execução precisou sair
  do sandbox devido à restrição de leitura do esbuild. Dependências já declaradas
  foram restauradas sem modificar package-lock.json.
- `npm run lint`: resta um erro preexistente em `src/pages/Cadastro/index.tsx:46`
  (`no-explicit-any`), confirmado em `origin/dev`. Lint dos arquivos da tarefa
  aprovado separadamente.
- Chrome headless no build final: redirecionamento sem sessão, sessão simulada
  local com acesso ao Supabase bloqueado, lista vazia, criação guiada, listagem,
  detalhes, retorno, histórico do navegador, foco e bloqueio de pedido de outro
  proprietário aprovados. Sem rolagem horizontal em 320, 390, 768 e 1440 px.
  Captura dos detalhes revisada visualmente.
- Login real com credenciais e consulta real de pedidos não foram executados;
  a validação de navegação autenticada usou uma sessão de teste no perfil
  descartável do navegador, sem criar contas ou escrever no backend.

Não foram implementados fornecedores, cancelamento ou edição de pedidos.
Builds, node_modules, arquivos temporários, credenciais e .env ficam fora do commit.
