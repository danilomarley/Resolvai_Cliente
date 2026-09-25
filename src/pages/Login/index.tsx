import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../styles/login.css"; 
import { Icon } from "../../components/Icon"; 
import { supabase } from "../../services/supabase";

export function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    setError("");

    try {
      setLoading(true);
      
      // Valida o login no Supabase
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      // Login efetuado com sucesso! Redireciona para o Dashboard (rota principal "/")
      navigate("/");

    } catch (err: any) {
      setError("E-mail ou senha incorretos.");
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                required 
              />
            </div>
          </div>

          <div className="form-actions">
            <a href="/esqueci-a-senha" className="forgot-password">
              Esqueceu a senha?
            </a>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "A entrar..." : "Entrar"}
          </button>
        </form>

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