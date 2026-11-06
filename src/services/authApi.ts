import { apiRequest } from './api';

// O código é enviado pelo Supabase e validado/consumido pelo backend.
export const authApi = {
  requestPasswordRecovery: async (email: string) => {
    await apiRequest('/api/v1/auth/check-email', { method: 'POST', body: { email } });
  },

  // A API exige de 8 a 128 caracteres e limita tentativas por e-mail e por IP.
  resetPassword: async (email: string, token: string, newPassword: string) => {
    if (!/^\d{6}$/.test(token) || newPassword.length < 8 || newPassword.length > 128) throw new Error('Informe o código de 6 dígitos e uma senha de 8 a 128 caracteres.');
    await apiRequest('/api/v1/auth/reset-password', { method: 'POST', body: { email, token, newPassword } });
    return true;
  }
};
