# Perfil público (#93) — entrega parcial

**Ver perfil do prestador** em cada proposta abre `/prestadores/{providerId}`. O identificador vem da API. A tela consulta `GET /api/v1/providers/{id}/public-profile` com Bearer token e trata carregamento, falhas, nova tentativa e sessão inválida.

Exibe nome, foto quando houver URL HTTPS, categorias, região, serviços concluídos, média e últimas cinco avaliações. O React escapa os comentários. Dados ausentes são identificados; fonte de avaliações indisponível é diferente de prestador sem avaliações.

Contrato: `{ id, name, photoUrl: string|null, categories: string[]|null, region: string|null, completedServices, reviewsAvailable, averageRating: number|null, reviews: [{ rating, comment?, createdAt }] }`.

Pendências: exige a PR correspondente do backend; a fonte de foto pública não existe nos contratos encontrados; categorias/região dependem do esquema da equipe de fornecedores (#53); avaliações dependem da [PR #2](https://github.com/danilomarley/Resolvai_Backend_Node/pull/2). A comparação (#87) não existe na main. `ProviderProfileLink` poderá ser usado nela, mas esse acesso **ainda não foi entregue**. Manter a PR Draft; não encerra #93.

A branch parte de origin/main sem commits da #92. Validação: `npm run lint`, `npm test` (24 aprovados), `npm run build`. Testes verificam contratos inválidos, dados ausentes, fotos inseguras, campos renderizados, escape de comentários e navegação com providerId. Não houve teste de navegador deste fluxo.
