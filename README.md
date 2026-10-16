# ResolvAI: portal do contratante

Frontend em React, TypeScript e Vite. Login, cadastro, perfil, resumo, pedidos e propostas usam a API do ResolvAI. Quando a API falha, a interface exibe o erro. Uma conta sem pedidos apresenta uma lista vazia.

## Executar neste PC sem .NET

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

Execute `iniciar-prototipo.cmd` sem argumentos. O inicializador reutiliza uma API local existente ou inicia o projeto `Resolvai_Backend` ao lado de `Resolvai_Cliente`. Para iniciar o backend, é necessário o SDK .NET 10 e a configuração descrita na documentação do backend.

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
- Consulta do perfil e finalização de cadastro com CPF, endereço e contato.
- Resumo da conta, busca nos registros carregados e filtros de pedidos recentes.
- Lista de pedidos paginada, detalhes, propostas e acompanhamento.
- Formulário de criação de pedido com campos inicialmente vazios e publicação pela API.

O backend precisa disponibilizar os endpoints correspondentes. Recuperação de senha, pagamentos, mensagens, avaliações, contratos e IA ainda não possuem integração; a interface informa a indisponibilidade. O envio de arquivos depende de um endpoint de upload. Fotos já retornadas pela API continuam visíveis nos detalhes.

## Organização

- `src/services/`: comunicação com a API e sessão.
- `src/types/orders.ts`: tipos de pedidos e propostas.
- `src/components/OrderForm.tsx`: formulário de criação de pedido.
- `src/pages/Dashboard/`: tela integrada à conta autenticada.
- `tests/frontend.test.mjs`: verificações sem contas ou respostas HTTP pré-fabricadas.

Consulte [integração com a API](docs/INTEGRACAO_API.md), [Meus pedidos](docs/MEUS_PEDIDOS.md) e [guia visual](docs/STYLE_GUIDE.md).
