# E2E do contratante (#94)

A suíte Playwright acessa frontend, Fastify, PostgreSQL e Supabase Auth (GoTrue) reais em localhost. Nenhuma resposta HTTP da aplicação é simulada. O teste de finalização de cadastro aborta somente a consulta externa opcional do ViaCEP para validar o preenchimento manual sem depender da rede.

Pré-requisitos: Node 22.15+ (ou 24), npm, Git e Docker com Compose v2 em execução. Windows: usar Docker Desktop com containers Linux; se o PowerShell bloquear npm.ps1, usar npm.cmd/npx.cmd. Portas exclusivas: 4173 (front), 5172 (API), 54321 (Auth) e 55432 (PostgreSQL). Encerre serviços nessas portas antes de executar; a suíte não reutiliza servidores já existentes.

## Preparação local

Na raiz do frontend:

```sh
npm ci
git clone https://github.com/danilomarley/Resolvai_Backend_Node.git .e2e-backend
git -C .e2e-backend checkout --detach 3cdfc789f649f46c083322dd2e8a08a43b9fdf33
npm --prefix .e2e-backend ci
npm --prefix .e2e-backend run build
npx playwright install chromium
npm run test:e2e-tools
npm run e2e:up
npm run test:e2e
npm run e2e:artifacts
npm run e2e:down
```

Execute e2e:artifacts e e2e:down também após falhas. Linux pode exigir `npx playwright install --with-deps chromium`. Os comandos não exigem .env nem credenciais externas. Não copie .env de outro ambiente. runtime.mjs fixa hosts, portas, nome do banco e chaves exclusivamente locais; start-api.mjs não carrega arquivos .env e remove variáveis herdadas de banco, Supabase, IA e Vite. O Vite E2E ignora arquivos .env. IA e Storage não participam dos cinco fluxos.

`e2e/backend-ref.json` registra o SHA da main Node usado por esta suíte, sem commits pendentes de #92/#93. Para atualizar, revisar o novo contrato, atualizar o arquivo e o comando deste guia e executar novamente toda a suíte. O workflow usa esse mesmo SHA. A preparação recusa um checkout diferente.

## Isolamento e dados

O Compose tem nome fixo resolvai-sprint4-e2e e publica portas apenas em 127.0.0.1. PostgreSQL usa tmpfs e banco resolvai_e2e, destruído com os containers. init.sql cria somente o suporte local ao Auth, à migration de bucket e um marcador de teste. A preparação verifica nome/marcador antes de aplicar os scripts reais da API, em ordem. Nunca lê URL de produção. Se o banco já estiver preparado, recusa reaplicar scripts: use e2e:down seguido de e2e:up.

Cada teste registra uma conta aleatória na API real, com e-mail @e2e.example.test, senha própria e CPF sintético. Pedidos, perfil, endereço e contato são conferidos pela API. A limpeza remove somente a conta criada pelo teste e seus pedidos, após validar o marcador de banco; depois remove a conta no Auth local. Uma falha de limpeza falha o teste. O encerramento dos containers elimina o estado restante. Não há volumes persistentes.

## Fluxos e pendência de recuperação segura

- Login válido/inválido, sessão após reload e retorno a Meus pedidos.
- Finalização: campos obrigatórios, envio, persistência de perfil/endereço/contato e navegação.
- Criação: cadastro concluído, formulário, envio e conferência de pedido/escopo na API.
- Meus pedidos: conta isolada, lista, estado e navegação a detalhes.
- Recuperação segura: solicitação, obtenção do código no Mailpit local, nova senha, login com ela e rejeição da senha anterior.
- Rejeição sem prova: a tentativa sem token deve ser recusada e a senha original deve continuar funcionando.

As correções estão nas PRs [backend #4](https://github.com/danilomarley/Resolvai_Backend_Node/pull/4) e [frontend #102](https://github.com/danilomarley/Resolvai_Cliente/pull/102), ainda pendentes de integração. A referência principal em backend-ref.json não foi trocada por uma branch pendente. Portanto a suíte principal evidencia os contratos ausentes na main; ela não usa skip, expected-failure ou continue-on-error. Depois da integração autorizada, atualizar o SHA da main e executar novamente. A PR permanece Draft enquanto a execução principal não passar.

Um job separado **Candidatos de seguranca (sem merge)** valida os sete cenários em checkouts descartáveis das revisões registradas em e2e/candidates.json. prepare-candidate.mjs copia apenas testes/configuração/manifests para esse ambiente e registra ali o SHA candidato. Nenhum commit de segurança é incorporado à branch #94 e nenhum resultado candidato é apresentado como aprovação da main. Esse job oferece evidência de integração enquanto o merge está sob controle dos mantenedores.

O SMTP é o Mailpit do Compose, com API somente em 127.0.0.1:8025. O código é extraído da mensagem recebida pelo destinatário sintético correto usando espera por condição; não é lido do banco Auth nem gerado pelo teste. O template usa {{ .Token }} e a janela local é de 600 segundos. A sanitização remove também códigos de seis dígitos de corpos SMTP, recursos e ações de preenchimento. Não publicar mensagens ou traces brutos.

## CI e diagnósticos

`.github/workflows/e2e.yml` executa em pull_request para main, sem secrets de produção. Instala dependências e Chromium, prepara os serviços, compila a main Node fixada e deixa o Playwright iniciar front/API e aguardar HTTP. Falhas obrigatórias falham o job. Os containers são encerrados em always.

Traces e screenshots são capturados nas falhas. `npm run e2e:artifacts` sanitiza corpos JSON, cabeçalhos, storage e recursos em ZIP antes de publicar e2e-artifacts; há testes automatizados para a sanitização. O HTML bruto não é publicado, pois pode conter ZIP em base64 com respostas de login. Não compartilhe test-results/ nem playwright-report/ brutos. Diagnósticos sanitizados ficam disponíveis por 7 dias no CI. `npx playwright show-trace caminho/trace.zip` permite examinar um trace sanitizado baixado.

## Diagnóstico

- Docker ENOENT: instalar/iniciar Docker Desktop; a suíte não substitui os serviços por mocks.
- Porta ocupada: encerrar o processo responsável antes de iniciar.
- Auth não saudável: conferir `docker compose -f e2e/compose.yml logs auth` localmente; não publicar logs brutos com credenciais.
- Banco já inicializado: executar e2e:down/e2e:up.
- Falha em recuperação segura com status 200: comportamento preexistente da #70; corrigir o contrato seguro antes de considerar #94 concluída.

Fontes de configuração: [compose oficial Supabase](https://github.com/supabase/supabase/blob/master/docker/docker-compose.yml) e [configuração oficial do Auth](https://github.com/supabase/auth/blob/master/example.env), consultados em 06/11/2026. GoTrue v2.197.0 foi obtido do compose oficial. PostgreSQL e nginx usam as imagens oficiais indicadas em e2e/compose.yml.
