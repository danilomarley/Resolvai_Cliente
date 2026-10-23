// Descomente junto com o código de integração real abaixo.
// import { apiRequest } from './api';

// Recuperação de senha (#70), no fluxo definido na issue: confirma o e-mail e define a nova senha.
export const authApi = {
  // Responde 200 quando existe conta ativa para o e-mail; 404 vira ApiError.
  checkEmailExists: async (email: string) => {
    try {
      await apiRequest('/api/v1/auth/check-email', { method: 'POST', body: { email } });
      return true;
    } catch (error) {
      if (error instanceof Error && 'status' in error && error.status === 404) {
        throw new Error('E-mail não encontrado no sistema.');
      }
      throw error;
    }
  },

  // A API exige de 8 a 128 caracteres e limita tentativas por e-mail e por IP.
  resetPassword: async (email: string, newPassword: string) => {
    await apiRequest('/api/v1/auth/reset-password', { method: 'POST', body: { email, newPassword } });
    return true;
  }
};
