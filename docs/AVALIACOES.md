# Avaliação pós-serviço (#92)

Acesse um pedido concluído em Meus pedidos e selecione **Avaliar serviço**. A rota `/pedidos/{id}/avaliar` consulta a avaliação existente antes de liberar o formulário. Os cinco rádios nativos permitem navegação por teclado; o comentário é opcional, com limite de 2000 caracteres. Durante o envio os campos ficam desabilitados. O bloqueio de duplicidade é garantido pelo backend, inclusive se houver reenvio após falha de rede.

Contratos necessários no backend Node:

| Rota | Resposta |
| --- | --- |
| `POST /api/v1/orders/{id}/review` | 201: `{ orderId, providerId, rating, comment?, createdAt }` |
| `GET /api/v1/orders/{id}/review` | A mesma avaliação ou `null` |
| `GET /api/v1/users/me/reviews/summary` | `{ count, averageRating }`, média nula quando count = 0 |

Todos exigem Bearer token. O corpo do POST contém `rating` inteiro entre 1 e 5 e `comment` opcional. O backend verifica propriedade, status concluído e uma única proposta escolhida. A API responde 404 para pedido de outra conta, 400 para entrada/status inválido e 409 para duplicidade ou prestador indefinido. Não há edição nem exclusão nesta entrega.

O card da Home resume **notas enviadas pelo cliente**, não avaliações recebidas por ele. Erros na consulta de avaliações aparecem no próprio card e não impedem o acesso aos pedidos. A interface não cria médias locais.

Integração: publicar primeiro o backend da branch `feat/92-avaliacao-prestador` e aplicar `013_create_avaliacoes.sql` com o procedimento habitual de migrations. A branch do frontend parte de `origin/main` sem commits de outras issues. Sem as rotas novas, a avaliação fica indisponível e a issue não pode ser encerrada.

Validação: `npm run lint`, `npm test`, `npm run build`. Os testes verificam contratos, notas inválidas, acessibilidade do formulário, estados de envio, navegação por status e conteúdo real do card. A suíte do backend verifica persistência e requisições duplicadas.
