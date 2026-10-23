import { apiRequest } from './api';

export const authApi = {
  checkEmailExists: async (email: string) => {
    // ---------------------------------------------------------------------------
    // CÓDIGO DE INTEGRAÇÃO REAL (Descomente quando a API C# estiver pronta)
    // ---------------------------------------------------------------------------
    /*
    try {
      // Faz um POST para a rota do backend verificando se o email existe
      await apiRequest('/api/v1/auth/check-email', {
        method: 'POST',
        body: { email }
      });
      return true; // Se o backend retornar sucesso (200), o e-mail existe
    } catch (error) {
      // O apiRequest lança o ApiError automaticamente (ex: 404 Não encontrado)
      throw error;
    }
    */

    // ---------------------------------------------------------------------------
    // MOCK ATIVO (Simulação)
    // ---------------------------------------------------------------------------
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (email.includes('@')) resolve(true);
        else reject(new Error('E-mail não encontrado no sistema.'));
      }, 1000);
    });
  },

  resetPassword: async (email: string, newPassword: string) => {
    // ---------------------------------------------------------------------------
    // CÓDIGO DE INTEGRAÇÃO REAL (Descomente quando a API C# estiver pronta)
    // ---------------------------------------------------------------------------
    /*
    try {
      // Faz um POST enviando o e-mail e a nova senha para serem atualizados
      await apiRequest('/api/v1/auth/reset-password', {
        method: 'POST',
        body: { email, newPassword }
      });
      return true;
    } catch (error) {
      // O apiRequest lança o ApiError (ex: 400 Regras de senha não atendidas)
      throw error;
    }
    */

    // ---------------------------------------------------------------------------
    // MOCK ATIVO (Simulação)
    // ---------------------------------------------------------------------------
    return new Promise((resolve) => setTimeout(resolve, 1000));
  }
};