import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "../../styles/login.css"; 
import { Icon } from "../../components/Icon"; 
import { supabase } from "../../services/supabase";
import { login } from '../../services/dashboardApi';
import { demoMode } from '../../services/appMode';

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    setError("");

    try {
      setLoading(true);
      if (demoMode) {
        navigate('/', { replace: true });
        return;
      }
      
      // A API valida a conta; o cliente Supabase mantém a sessão retornada.
      const result = await login(email, password);
      if (!result.refreshToken) throw new Error('A API não retornou o token de renovação necessário para manter sua sessão. Tente entrar novamente.');
      const { error: signInError } = await supabase.auth.setSession({
        access_token: result.accessToken, refresh_token: result.refreshToken,
      });

      if (signInError) throw signInError;

      // Retorna ao pedido solicitado, aceitando apenas destinos internos conhecidos.
      const destination: unknown = location.state?.from;
      navigate(typeof destination === 'string' && /^\/pedidos(?:\/[0-9a-f-]+)?$/i.test(destination) ? destination : '/', { replace: true });

    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Não foi possível entrar. Tente novamente.');
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
          <p>Bem-vindo de volta! Faça login na sua conta.</p>
        </header>
        {demoMode && <p className="demo-banner">Login demonstrativo. Use dados fictícios; nenhuma autenticação será enviada à API.</p>}

        <form onSubmit={handleLogin} className="login-form">
          {/* Mensagem de Erro */}
          {error && (
            <div style={{ color: "var(--color-danger)", fontSize: "0.875rem", textAlign: "center", backgroundColor: "var(--color-warning-soft)", padding: "0.5rem", borderRadius: "8px" }}>
              {error}
            </div>
          )}

          <div className="input-group">
            <label htmlFor="email">E-mail</label>
            <div className="input-wrapper">
              <Icon name="user" size={18} className="input-icon" />
              <input 
                type="email" 
                id="email" 
                maxLength={320}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com" 
                required 
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="password">Senha</label>
            <div className="input-wrapper">
              <Icon name="shield" size={18} className="input-icon" />
              <input 
                type="password" 
                id="password" 
                maxLength={128}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                required 
              />
            </div>
          </div>

          <div className="form-actions">
            <a href="/esqueci-a-senha" className="forgot-password" onClick={(event) => {
              if (demoMode) {
                event.preventDefault();
                setError('A recuperação de senha não está conectada nesta demonstração. Use dados fictícios para apresentar o login.');
              }
            }}>
              Esqueceu a senha?
            </a>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "A entrar..." : "Entrar"}
          </button>
        </form>
        <p style={{ textAlign: 'center' }}>{demoMode ? <Link to="/">Abrir demonstração sem login</Link>
          : <a href="/?demo=1#/">Abrir demonstração interativa sem login</a>}</p>

        <div className="form-actions" style={{ justifyContent: "center", marginTop: "1.5rem" }}>
          <span style={{ fontSize: "0.875rem", color: "var(--color-muted)" }}>
            Ainda não tem conta?{" "}
            <Link to="/cadastro" className="forgot-password">
              Crie uma agora
            </Link>
          </span>
        </div>
        
      </div>
    </main>
  );
}
