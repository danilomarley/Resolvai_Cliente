# Meus pedidos

A lista consulta `GET /api/v1/orders` com paginação e filtro por status. A busca considera apenas os registros da página carregada. O resumo da Home inclui até cinco pedidos recentes e os contadores de toda a conta.

Os detalhes consultam `GET /api/v1/orders/{uuid}`. Descrição, categoria, localização, escopo, fotos e propostas são exibidos quando fornecidos pela API. Valores e datas ausentes são indicados como não informados.

Sem sessão válida, a interface pede uma nova entrada. Pedidos inexistentes ou não acessíveis à conta apresentam o mesmo estado de indisponibilidade. O backend é responsável pela autorização e pela filtragem dos dados da conta autenticada.

As propostas e o acompanhamento são acessados pelas rotas `/pedidos/{uuid}/propostas` e `/pedidos/{uuid}/acompanhar`. A interface não inventa profissionais, preços, garantias ou prazos.

Para criar um pedido, preencha o formulário e publique. O front envia os dados à API e navega para o identificador retornado somente após a confirmação do servidor. Se a publicação falhar, exibe a mensagem e mantém os campos preenchidos.
