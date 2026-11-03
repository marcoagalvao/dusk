"use client";

import { CircleAlert } from "lucide-react";
import Image from "next/image";
import { useEffect, useId, useRef, useState, type CSSProperties, type FormEvent } from "react";

import { signIn } from "@/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form-controls";

/** A marca da tela. Para trocar a logo, substitua este arquivo em `public/`. */
const LOGO_SRC = "/logo.png";

const WORDMARK = ["D", "u", "s", "k"];

export function LoginView() {
  const emailId = useId();
  const passwordId = useId();
  const errorId = useId();
  const emailRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // No celular, focar abriria o teclado por cima da tela antes de ela aparecer.
  useEffect(() => {
    if (window.matchMedia("(pointer: fine)").matches) emailRef.current?.focus();
  }, []);

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

  const state = submitting ? "sending" : error ? "error" : "idle";

  return (
    <main className="login" data-state={state}>
      <div className="login-scene" aria-hidden="true">
        <div className="login-sky">
          <div className="login-sky-bands" />
          <div className="login-sky-glow" />
          <div className="login-stars" />
          <div className="login-stars login-stars-late" />
          <div className="login-sun">
            <div className="login-sun-halo" />
            <div className="login-sun-disc" />
          </div>
        </div>
        <div className="login-water">
          <div className="login-reflection" />
          <div className="login-reflection login-reflection-offset" />
        </div>
        <div className="login-horizon" />
      </div>

      <h1 className="login-wordmark" aria-label="Dusk">
        {WORDMARK.map((letter, index) => (
          <span key={letter} aria-hidden="true" style={{ "--letter": index } as CSSProperties}>
            {letter}
          </span>
        ))}
      </h1>
      <p className="login-statement">O que fazer, onde cada tarefa parou e qual é o próximo passo.</p>

      <div className="login-panel">
        <Image src={LOGO_SRC} alt="Logo do Dusk" width={52} height={52} preload className="size-13 object-contain" />
        <p className="mt-4 text-body text-pretty text-ink-muted">Entre para ver suas tarefas em qualquer dispositivo.</p>

        <form onSubmit={submit} className="mt-6 flex flex-col gap-4" aria-busy={submitting}>
          <div className="flex flex-col gap-1.5">
            <label htmlFor={emailId} className="text-label font-medium text-ink-muted">
              E-mail
            </label>
            <Input
              ref={emailRef}
              id={emailId}
              type="email"
              name="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              required
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? errorId : undefined}
              className="login-input"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor={passwordId} className="text-label font-medium text-ink-muted">
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
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? errorId : undefined}
              className="login-input"
            />
          </div>

          {error && (
            <p id={errorId} role="alert" className="login-error flex items-start gap-2 text-compact text-status-blocked">
              <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              {error}
            </p>
          )}

          <Button type="submit" variant="primary" size="lg" disabled={submitting} className="login-submit mt-1">
            {submitting ? "Entrando…" : "Entrar"}
          </Button>
        </form>
      </div>
    </main>
  );
}
