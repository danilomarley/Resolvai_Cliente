# Roteiro de apresentação

Abra o `ResolvAI.html` do pacote atualizado. Os fluxos anteriores continuam
acessíveis no modo demonstrativo, independentemente da disponibilidade da API.

1. No aviso superior, clique em **Mostrar login e cadastro**. Apresente os campos
   de login e abra **Crie uma agora**. Use um nome fictício, o e-mail
   `professora@example.invalid` e a senha fictícia `DemoTeste123`.
2. No cadastro, mostre a validação de confirmação de senha. Confirme com a mesma
   senha, clique em **Criar conta** e apresente o retorno ao login. Clique em
   **Entrar** com dados fictícios para abrir a Home.
3. Mostre o resumo, filtros, busca, estado sem resultados e **Limpar filtros**.
4. Abra **Ver propostas**, compare os prestadores e registre interesse. Abra as
   notificações e mostre a alteração do indicador de mensagens não lidas.
5. Em **Criar pedido**, percorra a conversa guiada: categoria, problema,
   detalhes, localização, urgência e fotos. Revise o título e o escopo, volte à
   conversa para mostrar que a revisão mantém os campos editados e publique.
6. Em **Meus pedidos**, confira o pedido criado, abra os detalhes e mostre
   descrição, escopo e fotos. Retorne à lista e à visão geral.
7. Apresente histórico, mensagens locais, contratos, pagamentos e avaliações.
   Edite o perfil e mostre a atualização do nome na Home.
8. Abra **Central de ajuda**, expanda as perguntas e mostre a adaptação da tela
   ao tamanho do navegador e o menu em dispositivos pequenos.

Alternar entre Home, login e cadastro mantém pedidos criados, perfil editado,
mensagens, interesse e estado das notificações nesta sessão. Recarregar ou fechar
a página reinicia os dados da demonstração. O histórico de exemplo permanece
disponível.

As simulações são indicadas na interface: cadastro e login demonstrativos não
criam contas reais; mensagens, interesse, publicação e edição de perfil ficam
locais. Recuperação de senha, contratação e pagamento real não foram
implementados na demonstração e não devem ser apresentados como concluídos.

## Correspondência com o quadro do projeto

Referência consultada: [quadro de tarefas](https://github.com/users/danilomarley/projects/1/views/1).
As telas de login (#12), cadastro (#14), Home (#30) e detalhamento de pedidos
(#52) são acessíveis na apresentação. Os status do quadro são informativos;
um card não comprova que uma função já existe na branch local. Tarefas de
finalização completa de cadastro, integrações e rotas adicionais precisam ser
avaliadas com o responsável antes de afirmar que estão implementadas.

Para mostrar a integração real, execute `iniciar-prototipo.cmd --api` e use uma
conta real autorizada. Os relatórios de integração e autenticação registram as
rotas identificadas e os limites dessa validação. A apresentação portátil
continua disponível caso a API ou a rede não esteja acessível.

## Testes de regressão

`npm test` cobre pedidos e os contratos de API. Para testar a apresentação no
navegador, gere-a com `npm run build:presentation` e execute
`npm run test:presentation` em um ambiente de teste com Playwright instalado.
`PLAYWRIGHT_MODULE` permite informar o caminho de uma instalação de Playwright;
`PRESENTATION_BROWSERS` aceita um array JSON com executáveis dos navegadores.
Sem essa variável, o teste usa o Chromium instalado pelo Playwright.

O teste mantém a internet desativada e verifica autenticação demonstrativa,
validação de cadastro, filtros, teclado, propostas, interesse, notificações,
histórico, ajuda, menus, mensagens, perfil, fotos, revisão, publicação, detalhes,
recarregamento e layouts de 320 a 1440 pixels. Nenhuma chamada de API deve ocorrer.
