# Apresentação portátil e autenticação

## Entrega

`npm run build:presentation` gera um HTML independente em `apresentacao/`.
Distribua os três arquivos dessa pasta ou o ZIP preparado no workspace.
O HTML abre diretamente pelo navegador em Windows, macOS ou Linux, sem servidor.
Não contém credenciais do banco, chaves administrativas ou configurações privadas
do backend. O build substitui a configuração pública do Supabase por placeholders.

Os fluxos demonstrativos reutilizam os componentes já existentes. Não foram
criados endpoints fictícios na API. O modo integrado continua separado e os
estados de falha continuam visíveis. As simulações têm aviso explícito e são
mantidas apenas em memória durante a sessão da página.

## Autenticação corrigida

O projeto Supabase consultado publica chave EC com algoritmo ES256. A API
configurava somente HS256. A correção local em `AuthenticationExtensions.cs`
carrega as chaves públicas do endpoint HTTPS `/auth/v1/.well-known/jwks.json`
com `ConfigurationManager`, cache e renovação ao não encontrar uma chave.
Mantém as validações de emissor, audiência, assinatura, validade e perfil ativo;
aceita ES256/RS256 e mantém compatibilidade com sessões HS256 antigas.

O Supabase documenta a validação assimétrica em
https://supabase.com/docs/guides/auth/signing-keys.

As alterações do backend estão locais e não foram commitadas ou enviadas ao
repositório oficial. Uma cópia do diff está em `patches/backend-jwks.patch` para
revisão pelo responsável. Nenhum segredo de configuração está incluído nesse diff.

## Limites de validação

O HTML portátil foi validado em Chrome e Edge com a internet desativada, incluindo
navegação, propostas, mensagens, contratos, pagamentos, avaliações, edição de
perfil, criação de pedido, detalhes, recarregamento e larguras de 320 a 1440 px.
Nenhuma requisição HTTP ou exceção JavaScript foi registrada. Os 12 testes do
frontend, lint, build integrado e compilação da API passaram.

A API foi compilada e as consultas de perfil e resumo foram exercitadas com um
token diagnóstico HS256 temporário, usando o perfil regularizado e o banco real.
Assinatura inválida, emissor errado, audiência errada, token expirado e perfil
inexistente foram recusados com 401. A senha do usuário não foi solicitada nem
utilizada. A confirmação de login real ES256 pela interface deve ser feita com
uma nova entrada do usuário depois de reiniciar a API.

Um diagnóstico adicional de ES256 com chaves temporárias foi compilado, mas
sua execução foi bloqueada pelo Controle de Aplicativo do Windows. Esse teste
não é contabilizado como aprovado.

Não é necessário configurar a integração real em cada máquina da apresentação:
o pacote portátil usa os dados demonstrativos. Para dados reais em outros PCs,
a API precisa estar acessível e configurada no ambiente de implantação.
