import { FormEvent } from "react";
// Importando o CSS do novo local centralizado que combinamos
import "../../styles/login.css"; 
// Importando o componente Icon da pasta correta
import { Icon } from "../../components/Icon"; 

export function Login() {
  function handleLogin(event: FormEvent) {
    event.preventDefault();
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
          <div className="input-group">
            <label htmlFor="email">E-mail</label>
            {/* Novo wrapper para o ícone e o input */}
            <div className="input-wrapper">
              <Icon name="user" size={18} className="input-icon" />
              <input 
                type="email" 
                id="email" 
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

          <button type="submit" className="btn-primary">
            Entrar
          </button>
        </form>
      </div>
    </main>
  );
}