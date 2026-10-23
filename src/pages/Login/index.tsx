import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "../../styles/login.css"; 
import { Icon } from "../../components/Icon"; 
import { customerSession } from '../../services/session';
import { login } from '../../services/dashboardApi';
import { authApi } from '../../services/authApi';

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  // Controle de telas: 'login' | 'verify-email' | 'reset-password' | 'success'
  const [view, setView] = useState<'login' | 'verify-email' | 'reset-password' | 'success'>('login');

  // Estados dos inputs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      setLoading(true);
      const result = await login(email, password);
      customerSession.save(result);
      const destination: unknown = location.state?.from;
      navigate(typeof destination === 'string' && /^\/pedidos(?:\/[0-9a-f-]+)?$/i.test(destination) ? destination : '/', { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Não foi possível entrar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyEmail(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      setLoading(true);
      await authApi.checkEmailExists(email);
      setView('reset-password');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao verificar e-mail.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (newPassword.length < 8) return setError('A nova senha deve ter no mínimo 8 caracteres.');
    if (newPassword !== confirmPassword) return setError('As senhas não coincidem.');

    try {
      setLoading(true);
      await authApi.resetPassword(email, newPassword);
      setView('success');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao redefinir a senha.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-container">
      <div className="login-card">
        <header className="login-header">
          <div className="logo-container">
            <div className="logo-icon">R</div>
            <h1 className="logo-text">ResolvAI</h1>
          </div>
          {view === 'login' && <p>Bem-vindo de volta! Faça login na sua conta.</p>}
          {view === 'verify-email' && <p>Informe seu e-mail para recuperar a senha.</p>}
          {view === 'reset-password' && <p>Defina sua nova senha de acesso.</p>}
        </header>

        {/* Mensagem de Erro Global */}
        {error && (
          <div style={{ color: "var(--color-danger)", fontSize: "0.875rem", textAlign: "center", backgroundColor: "var(--color-warning-soft)", padding: "0.5rem", borderRadius: "8px", marginBottom: "1rem" }}>
            {error}
          </div>
        )}

        {/* VIEW: LOGIN */}
        {view === 'login' && (
          <form onSubmit={handleLogin} className="login-form">
            <div className="input-group">
              <label htmlFor="email">E-mail</label>
              <div className="input-wrapper">
                <Icon name="user" size={18} className="input-icon" />
                <input type="email" id="email" maxLength={320} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" required disabled={loading} />
              </div>
            </div>
            <div className="input-group">
              <label htmlFor="password">Senha</label>
              <div className="input-wrapper">
                <Icon name="shield" size={18} className="input-icon" />
                <input type="password" id="password" maxLength={128} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required disabled={loading} />
              </div>
            </div>
            <div className="form-actions">
              <a href="#recuperar-senha" className="forgot-password" onClick={(e) => { e.preventDefault(); setError(""); setView('verify-email'); }}>
                Esqueceu a senha?
              </a>
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "A entrar..." : "Entrar"}
            </button>
            <div className="form-actions" style={{ justifyContent: "center", marginTop: "1.5rem" }}>
              <span style={{ fontSize: "0.875rem", color: "var(--color-muted)" }}>
                Ainda não tem conta? <Link to="/cadastro" className="forgot-password">Crie uma agora</Link>
              </span>
            </div>
          </form>
        )}

        {/* VIEW: VERIFICAR E-MAIL */}
        {view === 'verify-email' && (
          <form onSubmit={handleVerifyEmail} className="login-form">
            <div className="input-group">
              <label htmlFor="emailVerify">E-mail</label>
              <div className="input-wrapper">
                <Icon name="user" size={18} className="input-icon" />
                <input type="email" id="emailVerify" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" required disabled={loading} />
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Verificando..." : "Avançar"}
            </button>
            <button type="button" className="btn-secondary" style={{ marginTop: "1rem" }} onClick={() => setView('login')} disabled={loading}>
              Voltar ao Login
            </button>
          </form>
        )}

        {/* VIEW: REDEFINIR SENHA */}
        {view === 'reset-password' && (
          <form onSubmit={handleResetPassword} className="login-form">
            <div className="input-group">
              <label htmlFor="newPassword">Nova Senha</label>
              <div className="input-wrapper">
                <Icon name="shield" size={18} className="input-icon" />
                <input type="password" id="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" required disabled={loading} />
              </div>
            </div>
            <div className="input-group">
              <label htmlFor="confirmPassword">Confirmar Senha</label>
              <div className="input-wrapper">
                <Icon name="shield" size={18} className="input-icon" />
                <input type="password" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" required disabled={loading} />
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Salvando..." : "Confirmar Nova Senha"}
            </button>
            <button type="button" className="btn-secondary" style={{ marginTop: "1rem" }} onClick={() => setView('login')} disabled={loading}>
              Cancelar
            </button>
          </form>
        )}

        {/* VIEW: SUCESSO */}
        {view === 'success' && (
          <div className="login-form" style={{ textAlign: "center" }}>
            <h2 style={{ color: "var(--color-primary)", marginBottom: "1rem" }}>Senha alterada!</h2>
            <p style={{ marginBottom: "1.5rem" }}>Sua senha foi atualizada com sucesso. Você já pode fazer login.</p>
            <button type="button" className="btn-primary" onClick={() => { setView('login'); setPassword(''); }}>
              Ir para o Login
            </button>
          </div>
        )}
      </div>
    </main>
  );
}