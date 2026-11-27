# Recuperação segura

A solicitação envia o e-mail para POST /api/v1/auth/check-email e sempre exibe a mesma orientação para contas existentes/ausentes. O titular informa o código de seis dígitos recebido por e-mail e a nova senha. POST /api/v1/auth/reset-password exige email, token e newPassword. Código inválido, expirado, reutilizado ou associado a outro e-mail não autoriza a troca. O código fica somente no estado do formulário, mascarado na tela e descartado após sucesso; não é guardado em sessão, URL ou storage.

Depende da PR de backend da branch fix/password-reset-token-validation. É necessário configurar o template Reset Password do Supabase com `{{ .Token }}` e SMTP confiável. Não se aplicaram configurações em produção. O formulário anterior sem código é recusado pela API corrigida; publicar as duas entregas de forma coordenada. O contrato antigo da #70 não é mantido como atalho.

security/backend-ref.json registra a revisão candidata e a baseline. O workflow password-security reproduz o problema somente em contas sintéticas numa cópia da baseline, executa testes de segurança no candidato e testa a UI com código recebido pelo Mailpit local. PostgreSQL é efêmero, hosts são localhost e nenhuma credencial de produção é usada. Isso é evidência de integração candidata, não aprovação dos checks do upstream ou afirmação de merge na main. A PR permanece Draft enquanto a API corrigida não estiver integrada.

Validação local: npm run lint, npm test, npm run build. A integração requer Docker. Sem Docker local, os resultados reais vêm do job recovery. Os testes de segurança não gravam traces com tokens/OTP; senhas e código estão mascarados na UI, e nenhum corpo de login/SMTP é publicado como artefato. A suíte E2E #94 mantém automação e rastreamento próprios.
