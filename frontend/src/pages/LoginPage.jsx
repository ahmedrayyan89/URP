import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { IconShield } from "../components/layout/Icons";
import { login } from "../lib/auth";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    login();
    navigate("/projects");
  };

  return (
    <div className="login-shell">
      <div className="login-brand">
        <div className="login-brand-inner">
          <div className="login-logo">
            <IconShield size={40} />
          </div>
          <h1 className="login-brand-title">Unified Risk Platform</h1>
          <p className="login-brand-sub">
            Enterprise risk intelligence, knowledge management, and
            agentic workflows — in one place.
          </p>
        </div>
      </div>

      <div className="login-form-panel">
        <div className="login-form-wrap">
          <h2 className="login-form-title">Sign in</h2>
          <p className="login-form-sub">
            Enter your credentials to access your workspace.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <label className="form-label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div className="form-row">
              <label className="form-label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            <button type="submit" className="btn btn-primary login-submit">
              Sign in
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
