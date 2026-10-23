# ResolvAI: portal do contratante

Frontend em React, TypeScript e Vite. Login, cadastro, perfil, resumo, pedidos e propostas usam a API do ResolvAI. Quando a API falha, a interface exibe o erro. Uma conta sem pedidos apresenta uma lista vazia.

## Executar somente o frontend

Configure uma API acessível em `Resolvai_Cliente/.env.local`:

```env
API_PROXY_TARGET=http://ENDERECO-DA-API:5172
```

Abra o terminal na pasta `Resolvai_Cliente` e execute:

```powershell
.\iniciar-prototipo.cmd --front
```

Essa opção inicia somente o frontend e abre o login. Mantenha o terminal aberto. Use `Ctrl+C` para encerrar. Login, cadastro e consultas exigem que a API configurada esteja disponível na rede.

Também é possível iniciar pelo terminal com `npm run dev` e abrir o endereço exibido pelo Vite. O `index.html` da raiz precisa ser servido pelo Vite.

## Executar com backend local

Execute `iniciar-prototipo.cmd` sem argumentos. O inicializador reutiliza uma API local existente ou inicia o projeto `Resolvai_Backend_Node` ao lado de `Resolvai_Cliente`. O backend precisa das dependências instaladas (`npm ci`) e do arquivo `.env` descrito no README dele. A API em C# (`Resolvai_Backend`) foi descontinuada.

## Requisitos

Node.js 20.19+ ou 22.12+ e npm para o frontend. Os testes requerem Node.js 22.15+ por utilizarem `registerHooks`. As dependências deste PC já foram instaladas. Em uma nova instalação, execute `npm ci`.

## Configuração e produção

O `.env.example` contém `API_PROXY_TARGET` e `VITE_API_BASE_URL`. Reinicie o Vite após alterar a configuração.

No desenvolvimento, o Vite encaminha `/api` ao endereço de `API_PROXY_TARGET`. Em produção, `VITE_API_BASE_URL` vazio utiliza um proxy reverso na mesma origem. Uma API em outra origem exige configuração de CORS no backend. O proxy do Vite não faz parte do build de produção.

```sh
npm run lint
npm test
npm run build
npm run preview
```

`npm run preview` serve o build; para usar a API nessa modalidade, configure `VITE_API_BASE_URL` antes de compilar ou use uma hospedagem com proxy reverso.

## Funcionalidades

- Autenticação e cadastro pela API.
- Configurações da conta: finalização de cadastro, edição de nome, endereço e contato, e saída da conta.
- Tela principal com os cards de pedidos ativos, propostas recebidas e serviços concluídos, pedidos recentes e serviços concluídos.
- Lista de pedidos paginada, detalhes, propostas e acompanhamento.
- Criação de pedido com assistente de IA, que monta o escopo pela conversa, formulário para revisão e envio de até 4 fotos.

O card "Sua avaliação" aguarda uma fonte de dados: ainda não existem avaliações na API. Pagamentos, mensagens e contratos ainda não possuem integração; a interface informa a indisponibilidade.

## Deploy

O `render.yaml` publica o front como Static Site no Render. Configure `VITE_API_BASE_URL` com a URL da API e coloque a URL do front em `CORS_ALLOWED_ORIGINS` da API. O passo a passo está em `docs/DEPLOY.md` do Resolvai_Backend_Node.

## Organização

- `src/services/`: comunicação com a API e sessão.
- `src/types/orders.ts`: tipos de pedidos e propostas.
- `src/components/OrderAssistant.tsx`: assistente de IA da criação de pedido.
- `src/components/OrderForm.tsx`: formulário de criação e revisão do pedido, com fotos.
- `src/pages/Dashboard/`: tela integrada à conta autenticada.
- `tests/frontend.test.mjs`: verificações sem contas ou respostas HTTP pré-fabricadas.

Consulte [integração com a API](docs/INTEGRACAO_API.md), [Meus pedidos](docs/MEUS_PEDIDOS.md) e [guia visual](docs/STYLE_GUIDE.md).
