# Regularização do login

A mensagem “Sua conta foi autenticada, mas não possui um perfil no backend”
significa que o Supabase aceitou as credenciais e que o `AuthService` não encontrou
um registro correspondente na tabela `public.users`. Reiniciar o protótipo ou
tentar cadastrar novamente o mesmo e-mail não cria esse perfil.

## Correção preparada

O arquivo [regularizar-perfil-teste.sql](sql/regularizar-perfil-teste.sql) contém
consultas de diagnóstico e uma transação para criar o perfil ausente de
`teste@gmail.com`, usando o UUID da identidade já existente em `auth.users` e
o papel `Cliente` usado pelo backend atual.

Execute primeiro apenas as duas consultas iniciais no banco Supabase usado
pelo backend. Confira a identidade, o perfil e as restrições de `public.users`.
A transação seguinte exige autorização do responsável pelo banco. Ela não
altera senha, identidade Auth, perfil existente, permissões administrativas ou
estrutura das tabelas. Interrompe a operação diante de identidades ambíguas,
e-mail não confirmado, perfil inativo, papel diferente ou UUID incompatível.

## Pendência identificada no backend

O script versionado `db/scripts/001_create_users.sql` ainda restringe `role` a
`Viewer`, `Inspector` e `Admin`, enquanto `UserRole` e o cadastro atual usam
`Cliente`, `Prestador` e `Admin`. Se essa restrição antiga estiver no banco, o
responsável pelo backend precisa providenciar a migração e avaliar os registros
existentes. Não substitua o papel por `Viewer` para contornar a restrição: isso
não corresponde ao contrato atual. A transação preparada falha e reverte a
inserção se o banco não aceitar `Cliente`.

## Validação após a regularização

1. Confirme que `public.users.id` é igual a `auth.users.id`, que o papel é
   `Cliente` e que `is_active` é verdadeiro para a conta.
2. Abra o protótipo pelo `iniciar-prototipo.cmd` e faça login novamente.
3. Confirme resposta bem-sucedida em `/api/v1/auth/login`,
   `/api/v1/users/me` e `/api/v1/home/summary` e o carregamento da tela principal.

## Resultado da execução autorizada

Após autorização explícita do usuário, o diagnóstico confirmou e-mail validado,
identidade existente e ausência de perfil. A restrição no banco real já aceita
`Cliente`, `Prestador` e `Admin`; não foi necessária alteração de schema.

A transação foi executada e a consulta posterior confirmou perfil ativo com
papel `Cliente` e UUID igual ao da identidade Auth. A senha e os arquivos do
backend foram preservados. Os 12 testes automatizados do frontend passaram.
O login pela interface ainda precisa ser repetido pelo usuário com sua senha;
essa senha não foi solicitada nem utilizada na regularização.
