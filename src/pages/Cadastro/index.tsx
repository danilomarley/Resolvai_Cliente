import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom"; 
import "../../styles/login.css"; 
import { Icon } from "../../components/Icon"; 
import { supabase } from "../../services/supabase";

export function Cadastro() {
  const navigate = useNavigate();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleRegister(event: FormEvent) {
    event.preventDefault();
    setError(""); 

    if (password !== confirmPassword) {
      setError("As senhas não coincidem. Verifique e tente novamente.");
      return;
    }

    try {
      setLoading(true);
      
      // Registo simples no Supabase (Autenticação)
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          }
        }
      });

      if (authError) throw authError;

      // Se o registo for um sucesso, redireciona o utilizador para fazer o login
      navigate("/login");
      
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro ao criar a conta.");
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
          <p>Crie sua conta para começar a resolver.</p>
        </header>

        <form onSubmit={handleRegister} className="login-form">
          {/* Mensagem de Erro */}
          {error && (
            <div style={{ color: "var(--color-danger)", fontSize: "0.875rem", textAlign: "center", backgroundColor: "var(--color-warning-soft)", padding: "0.5rem", borderRadius: "8px" }}>
              {error}
            </div>
          )}

          <div className="input-group">
            <label htmlFor="name">Nome completo</label>
            <div className="input-wrapper">
              <Icon name="user" size={18} className="input-icon" />
              <input 
                type="text" 
                id="name" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome" 
                required 
              />
            </div>
          </div>

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
                placeholder="Crie uma senha forte" 
                required 
                minLength={6}
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="confirmPassword">Confirmar senha</label>
            <div className="input-wrapper">
              <Icon name="shield" size={18} className="input-icon" />
              <input 
                type="password" 
                id="confirmPassword" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a senha" 
                required 
                minLength={6}
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "A criar conta..." : "Criar conta"}
          </button>
        </form>

        <div className="form-actions" style={{ justifyContent: "center", marginTop: "1.5rem" }}>
          <span style={{ fontSize: "0.875rem", color: "var(--color-muted)" }}>
            Já tem uma conta?{" "}
            <Link to="/login" className="forgot-password">
              Faça login
            </Link>
          </span>
        </div>
      </div>
    </main>
  );
}