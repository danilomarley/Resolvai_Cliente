# Integração com a API

## Endpoints utilizados

| Método e rota | Uso |
| --- | --- |
| `POST /api/v1/auth/login` | Envia e-mail e senha; recebe token, validade e perfil |
| `POST /api/v1/auth/register` | Envia nome, e-mail e senha; recebe perfil |
| `GET /api/v1/users/me` | Consulta o perfil da conta autenticada |
| `POST /api/v1/users/me/complete-registration` | Envia nome, CPF, endereço e contato |
| `GET /api/v1/home/summary` | Consulta contadores e até cinco pedidos recentes |
| `GET /api/v1/orders?page=&pageSize=&status=` | Lista pedidos com paginação e filtro |
| `GET /api/v1/orders/{uuid}` | Consulta detalhes, fotos e propostas |
| `POST /api/v1/orders` | Publica o pedido preenchido pelo usuário |

A criação envia `titulo`, `categoria`, `descricao`, `localizacao`, `detalhes`, `urgencia`, `especificacoes` e `fotos: []`. O formulário começa vazio. Não há upload de arquivos; fotos já hospedadas e retornadas pela API são exibidas nos detalhes.

## Sessão e autorização

O frontend autentica exclusivamente pela API e armazena em `sessionStorage` apenas o token de acesso, o identificador do usuário e a validade. Não interpreta o JWT nem persiste senha ou refresh token. Sessões inválidas ou expiradas são descartadas.

As consultas autenticadas enviam `Authorization: Bearer <token>`. O backend deve validar a sessão, as permissões e a propriedade dos pedidos. O frontend valida os contratos recebidos e apresenta estados de carregamento, ausência de dados e falha. Uma API indisponível não fornece dados alternativos à interface.

Status aceitos: `Pending`, `InProgress`, `Completed` e `Cancelled`.

## Configuração

Configure `API_PROXY_TARGET` em `.env.local` para o proxy de desenvolvimento. Use `iniciar-prototipo.cmd --front` ou `npm run dev` para iniciar somente o front. O funcionamento dos dados reais depende da disponibilidade da API configurada.

Em produção, `VITE_API_BASE_URL` recebe a origem da API, sem acrescentar `/api/v1`. Quando vazio, a hospedagem deve encaminhar `/api` ao backend. Se as origens forem diferentes, configure CORS no backend. Não inclua segredos do backend no frontend.

## Limitações

A finalização de cadastro depende do endpoint correspondente estar implantado e permite uma única finalização por conta. Não há endpoints integrados para upload, recuperação de senha, mensagens, pagamentos, contratação, avaliações ou IA.

Os testes locais verificam contratos inválidos, ausência de dados, formatação, estados da interface e formulário vazio. A validação completa de login e publicação exige uma API real configurada e uma conta autorizada.
