# Integração do dashboard com a API

## Referência e branch

Backend analisado: [Resolvai_Backend](https://github.com/danilomarley/Resolvai_Backend),
revisão `d799f813d69ea7a60c288cd0a00c06599bc129e8`.
Foram lidos controllers, DTOs, serviços, consultas SQL, autenticação, tratamento de
exceções e os documentos `ORDERS-AND-HOME.md` e `BUILD-AND-RUN.md`.
O clone de referência permaneceu sem alterações. Nenhum build, commit ou escrita
no banco do backend foi executado.

Branch frontend: `feat/integracao-dashboard-api`, criada a partir de
`feat/meus-pedidos-detalhamento-dev` em `a12e5a4`.

## Contratos identificados e implementados

| Método/rota | Contrato utilizado |
| --- | --- |
| `POST /api/v1/auth/login` | `{ email, password }` → `accessToken`, `tokenType`, `expiresAtUtc`, `refreshToken` opcional, `user` |
| `POST /api/v1/auth/register` | `{ name, email, password }` → `UserResponse` (201) |
| `GET /api/v1/users/me` | `id`, `name`, `email`, `role`, `isActive`, `createdAt` |
| `GET /api/v1/home/summary` | `orders: { total, pending, inProgress, completed, cancelled }`, `recentOrders` |
| `GET /api/v1/orders/{uuid}` | `id`, `title`, `description`, `status`, `createdAt`, `updatedAt` opcional |

Cada pedido recente possui os mesmos campos do detalhe, exceto `description`.
Status da API: `Pending`, `InProgress`, `Completed`, `Cancelled`.
O adaptador preserva UUIDs e datas e mapeia os status para o modelo existente.
Os dados são validados em tempo de execução antes de serem renderizados.

As consultas enviam `Authorization: Bearer <accessToken>`, sem parâmetros de
proprietário, e usam `cache: no-store`, cancelamento e timeout de 15 segundos.
O backend verifica o perfil local ativo e limita a consulta ao `sub` do token.
Pedidos de terceiros e inexistentes retornam o mesmo 404. O frontend mantém
estados associados ao token para não renderizar a resposta de uma sessão anterior.

O login e cadastro passam pela API para respeitar o perfil local exigido pelo
backend. Após o login, a sessão continua gerenciada pelo cliente Supabase existente,
incluindo persistência, renovação e eventos de autenticação. Se a API não devolver
`refreshToken`, o frontend exibe uma mensagem explícita: essa resposta é válida
no DTO, mas não permite estabelecer a sessão persistente do cliente Supabase.
O cadastro respeita os limites de 200 caracteres para nome, 320 para e-mail e
8–128 para senha. Não envia papel nem confirmação de senha ao backend.

## Comparação com os mocks

- Nome e e-mail: substituídos por `/users/me`; localização não existe no contrato.
- Totais: vêm do resumo, sem inferir o total a partir dos cinco pedidos recentes.
- Propostas, avaliações, valores, produtos e dados de fornecedores: não existem
  nessas respostas e não são preenchidos com dados ilustrativos.
- Pedido: utiliza UUID, data e status reais; a descrição é consultada no detalhe.
- O estado `Cancelled` é exibido apenas para leitura, sem ação de cancelamento.
- O resumo e perfil são carregados uma vez por sessão/renovação ou nova tentativa;
  navegar entre lista e detalhes não repete a consulta da Home. O detalhe tem sua
  própria consulta, inclusive para um UUID que não esteja nos cinco recentes.

## Configuração

O `.env.example` contém apenas placeholders públicos. Não copie segredos do
backend para o frontend.

Desenvolvimento: configure `API_PROXY_TARGET` no `.env.local` ou no ambiente.
O padrão `http://localhost:5172` vem do guia do backend. O backend deve estar em
execução separadamente. O proxy do Vite encaminha `/api` sem alterar os caminhos.
Se o backend redirecionar HTTP para HTTPS, use a origem HTTPS configurada nele
e um certificado de desenvolvimento confiável. Reinicie o Vite após mudar o alvo.

Produção: `VITE_API_BASE_URL` vazio usa `/api` na mesma origem; configure um proxy
reverso na hospedagem. O proxy de desenvolvimento não está embutido no build.
Uma origem separada em `VITE_API_BASE_URL` exige CORS no backend/hospedagem; não
foi encontrada política CORS no `Program.cs` analisado. A variável recebe a origem,
sem acrescentar `/api/v1`, pois o serviço já fornece esse prefixo.

## Pendências do backend

Não foram identificados endpoints de listagem completa/paginação, criação ou
edição de pedidos, propostas, avaliação, histórico completo, pagamento, mensagens
ou edição de perfil. A interface indica essas indisponibilidades; não publica
pedidos locais como se estivessem persistidos. As rotas administrativas de usuários
não são usadas para dados da conta do cliente.

## Validação executada

- `npm test`: 11 testes aprovados (Node 24.21.0), cobrindo DTOs, quatro status,
  contadores independentes da lista, rotas e corpos exatos, UUIDs, Bearer,
  transporte HTTP local, 401/403/404/409/500, JSON inválido, falha de rede,
  cancelamento e os testes existentes de pedidos.
- `npm run lint`: aprovado, inclusive o cadastro, cujo `any` foi removido ao
  adaptar o tratamento de erros.
- `npm run build`: TypeScript e Vite aprovados.
- Chrome com respostas HTTP interceptadas: perfil e resumo, cinco pedidos e
  total 12, todos os status, detalhes por UUID fora da Home, retorno, ausência
  de mocks, ausência de consulta redundante ao resumo, 404, 500/retry, conta
  vazia, 401 e layout em 320/390/768/1440 px aprovados; sem exceções JavaScript.
- Chrome com autenticação interceptada: erro 401, login via API, persistência
  pelo Supabase, carregamento do perfil e cadastro pelo DTO da API aprovados.
  O preflight CORS do Supabase também foi simulado. Nenhuma conta foi criada.

Não havia API local na porta documentada nem URL de implantação fornecida.
Assim, não foi validada a conexão com banco real, credenciais reais ou a migração
SQL. Esses testes exigem uma instância configurada do backend. A validação HTTP
local usa as respostas dos contratos lidos, não comprova disponibilidade de uma
instância real. Nenhuma dependência nova foi instalada para esta tarefa.
