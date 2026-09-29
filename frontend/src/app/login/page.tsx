"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const { user, ready, login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ready && user) router.replace("/dashboard");
  }, [ready, router, user]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace("/dashboard");
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Sign in failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-art" aria-label="Haven workspace">
        <Link className="brand" href="/" aria-label="Haven home">
          <span className="brand-mark">H</span>
          <span>
            <span className="brand-name">haven</span>
            <span className="brand-note">PROPERTY WORKSPACE</span>
          </span>
        </Link>
        <div className="login-art-content">
          <div className="eyebrow">Real estate, well managed</div>
          <h1 className="serif">A clearer view of every property.</h1>
          <p>
            One calm workspace for your listings, people, and the details that
            move a deal forward.
          </p>
        </div>
        <div className="login-art-footer">
          Haven property operations · Workspace access
        </div>
      </section>
      <section className="login-form-side">
        <form className="login-form fade-up" onSubmit={handleSubmit}>
          <div className="eyebrow">Welcome back</div>
          <h2>Sign in</h2>
          <p>Use your CRM account to continue.</p>
          {error && (
            <div className="notice" role="alert">
              {error}
            </div>
          )}
          <div className="field">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
            />
          </div>
          <button className="button" type="submit" disabled={loading || !ready}>
            {loading ? (
              <>
                <span className="spinner" /> Signing in
              </>
            ) : (
              "Continue to workspace"
            )}
          </button>
          <div className="login-footer">
            Your account role determines which workspace tools are available.
          </div>
        </form>
      </section>
    </main>
  );
}
