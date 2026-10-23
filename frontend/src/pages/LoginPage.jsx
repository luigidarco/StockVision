import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../auth/useAuth";
import LoginArtwork from "./LoginArtwork";
import "./LoginPage.css";

export default function LoginPage() {
  const { signIn, error: connectionError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    if (!email.trim() || !password) {
      setError("Informe seu e-mail e sua senha.");
      return;
    }
    if (event.currentTarget.elements.email.validity.typeMismatch) {
      setError("Informe um endereço de e-mail válido.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await signIn(email, password);
    } catch (loginError) {
      setError(loginError.status ? loginError.message : "Não foi possível conectar ao servidor. Tente novamente.");
      setSubmitting(false);
    }
  };

  return (
    <main className="login-page">
      <LoginArtwork />
      <span className="login-brand">StockVision<span>.</span></span>
      <div className="login-layout">
        <section className="login-intro" aria-labelledby="login-intro-title">
          <h1 id="login-intro-title">Seu estoque organizado.<br />Seu dia mais simples.</h1>
          <p>Tenha seus itens, quantidades e ambientes<br className="login-desktop-break" /> sempre à mão, em um só lugar.</p>
          <span className="login-intro-note">Mais controle para sua casa e seu trabalho.</span>
        </section>

        <section className="login-card" aria-labelledby="login-title">
          <h2 id="login-title">Entrar</h2>
          <p className="login-card-subtitle">Bem-vindo de volta ao StockVision</p>
          <div className="login-divider"><span>Use seu e-mail para entrar</span></div>
          <form className="login-form" noValidate onSubmit={handleSubmit}>
            {(error || connectionError) && (
              <p className="login-error" role="alert">{error || connectionError}</p>
            )}
            <label className="login-field">
              <span>E-mail</span>
              <input
                type="email"
                name="email"
                autoComplete="username"
                placeholder="Seu endereço de e-mail"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={submitting}
              />
            </label>
            <label className="login-field">
              <span>Senha</span>
              <div className="login-password">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="current-password"
                  placeholder="Sua senha"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={submitting}
                />
                <button
                  className="login-password-toggle"
                  type="button"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((visible) => !visible)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
            <button className="login-submit" type="submit" disabled={submitting}>
              {submitting ? "Entrando..." : "Entrar"}
            </button>
          </form>
          <p className="login-card-footer">Mais organização começa aqui.</p>
        </section>
      </div>
    </main>
  );
}
