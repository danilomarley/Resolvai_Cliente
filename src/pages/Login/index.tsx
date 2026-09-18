import { FormEvent } from "react";
import "./Login.css"; // Ou o caminho correto para o seu CSS/Módulo

export function Login() {
  function handleLogin(event: FormEvent) {
    event.preventDefault();
    // Lógica de autenticação aqui
  }

  return (
    <main className="login-container">
      <div className="login-card">
        <header className="login-header">
          {/* Inspirado na logo do ResolvAI da sua sidebar */}
          <div className="logo-container">
            <div className="logo-icon">R</div>
            <h1 className="logo-text">ResolvAI</h1>
          </div>
          <p>Bem-vindo de volta! Faça login na sua conta.</p>
        </header>

        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <label htmlFor="email">E-mail</label>
            <input 
              type="email" 
              id="email" 
              placeholder="seu@email.com" 
              required 
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Senha</label>
            <input 
              type="password" 
              id="password" 
              placeholder="••••••••" 
              required 
            />
          </div>

          <div className="form-actions">
            <a href="/esqueci-a-senha" className="forgot-password">
              Esqueceu a senha?
            </a>
          </div>

          {/* Botão usando o estilo azul dos botões principais da sua dashboard */}
          <button type="submit" className="btn-primary">
            Entrar
          </button>
        </form>
      </div>
    </main>
  );
}