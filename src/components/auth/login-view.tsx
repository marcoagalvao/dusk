"use client";

import { useId, useState, type FormEvent } from "react";

import { signIn } from "@/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form-controls";

export function LoginView() {
  const emailId = useId();
  const passwordId = useId();
  const errorId = useId();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    const message = await signIn(email, password);
    // Em caso de sucesso o AuthGate troca a tela e este componente desmonta.
    if (message) {
      setError(message);
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <h1 className="text-hero font-semibold tracking-[-0.02em] text-ink">Dusk</h1>
        <p className="mt-1 text-body text-ink-muted">Entre para ver suas tarefas em qualquer dispositivo.</p>

        <form onSubmit={submit} className="mt-8 flex flex-col gap-4" aria-describedby={error ? errorId : undefined}>
          <div className="flex flex-col gap-1.5">
            <label htmlFor={emailId} className="text-label text-ink-muted">
              E-mail
            </label>
            <Input
              id={emailId}
              type="email"
              name="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              required
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor={passwordId} className="text-label text-ink-muted">
              Senha
            </label>
            <Input
              id={passwordId}
              type="password"
              name="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <p id={errorId} role="alert" className="text-compact text-status-blocked">
              {error}
            </p>
          )}

          <Button type="submit" variant="primary" size="lg" disabled={submitting}>
            {submitting ? "Entrando…" : "Entrar"}
          </Button>
        </form>
      </div>
    </main>
  );
}
