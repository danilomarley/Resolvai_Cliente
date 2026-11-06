# Perfil público (#93) — entrega parcial

**Ver perfil do prestador** em cada proposta abre `/prestadores/{providerId}`. O identificador vem da API. A tela consulta `GET /api/v1/providers/{id}/public-profile` com Bearer token e trata carregamento, falhas, nova tentativa e sessão inválida.

Exibe nome, foto quando houver URL HTTPS, categorias, região, serviços concluídos, média e últimas cinco avaliações. O React escapa os comentários. Dados ausentes são identificados; fonte de avaliações indisponível é diferente de prestador sem avaliações.

Contrato: `{ id, name, photoUrl: string|null, categories: string[]|null, region: string|null, completedServices, reviewsAvailable, reviewsCount: number|null, averageRating: number|null, reviews: [{ rating, comment?, createdAt }] }`. A quantidade é do histórico completo, não do limite de cinco comentários. Zero e fonte indisponível são estados distintos.

Pendências: exige a PR correspondente do backend; a fonte de foto pública não existe nos contratos encontrados; categorias/região dependem do esquema da equipe de fornecedores (#53); avaliações dependem da [PR #2](https://github.com/danilomarley/Resolvai_Backend_Node/pull/2). A comparação (#87) não existe na main. `ProviderProfileLink` poderá ser usado nela, mas esse acesso **ainda não foi entregue**. Manter a PR Draft; não encerra #93.

A branch parte de origin/main sem commits da #92. Validação: `npm run lint`, `npm test`, `npm run build`. O workflow profile-integration monta checkouts descartáveis com os SHAs de integration/profile/versions.json. Instala o esquema profissional canônico C# e a migration de avaliações canônica somente no PostgreSQL efêmero, e inicia uma API #92 separada para criar avaliações por HTTP real. Nenhum commit ou migration de outra issue é copiado para esta entrega de produção. Testes de navegador cobrem ida/volta às propostas, foco no título, acesso após login, dados ausentes, média/contagem/prestador corretos, privacidade, comentários escapados, prestador inexistente/inativo, API sem autenticação e largura móvel.

A navegação agora preserva a proposta de origem e o login retorna ao perfil solicitado por rota interna validada. O breadcrumb identifica o perfil. A foto continua sendo placeholder explícito porque não se encontrou fonte real nos contratos, Auth ou Resolvai_Documentacao; a comparação #87 continua pendente. Resultados candidatos não equivalem a implantação ou aprovação dos checks do backend upstream.
