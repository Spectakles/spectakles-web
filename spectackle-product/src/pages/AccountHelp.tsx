import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { usePlatform } from "../platform/context";
import {
  refreshVerification,
  requestReset,
  requestVerification,
} from "../platform/identity-actions";
import "./institution.css";

export default function AccountHelp({
  verification = false,
}: {
  verification?: boolean;
}) {
  const platform = usePlatform();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [verified, setVerified] = useState(false);
  const perform = async (action: () => Promise<string>) => {
    if (busy) return;
    setBusy(true);
    setMessage("");
    setError("");
    try {
      setMessage(await action());
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (platform.auth) void perform(() => requestReset(platform.auth!, email));
  };
  return (
    <main className="portal account-page">
      <header className="portal-topbar">
        <Link to="/workspace">← Back to sign in</Link>
        <span className="portal-wordmark">spectakles</span>
      </header>
      <section className="portal-card account-card">
        <p className="portal-eyebrow">YOUR ACCOUNT</p>
        <h1>
          {verification ? "Verify your email." : "Let’s get you back in."}
        </h1>
        {!platform.ready ? (
          <p role="status">Connecting…</p>
        ) : platform.error ? (
          <p role="alert">{platform.error}</p>
        ) : verification ? (
          !platform.user ? (
            <>
              <p>Sign in before verifying your account.</p>
              <Link to="/workspace">Sign in →</Link>
            </>
          ) : (
            <>
              <p>{platform.user.email}</p>
              {verified || platform.user.emailVerified ? (
                <>
                  <p>Your email is verified.</p>
                  <Link className="portal-button" to="/workspace">
                    Continue to workspace →
                  </Link>
                </>
              ) : (
                <>
                  <p>
                    Use the link in your verification email, then return to
                    refresh your status.
                  </p>
                  <button
                    disabled={busy}
                    onClick={() =>
                      void perform(() => requestVerification(platform.user!))
                    }
                  >
                    Send verification email
                  </button>
                  <button
                    className="portal-quiet"
                    disabled={busy}
                    onClick={() =>
                      void perform(async () => {
                        const value = await refreshVerification(platform.user!);
                        setVerified(value);
                        await platform.reload();
                        return value
                          ? "Email verified."
                          : "Your email is not verified yet. Follow the email link first.";
                      })
                    }
                  >
                    I’ve verified my email
                  </button>
                </>
              )}
            </>
          )
        ) : (
          <form onSubmit={submit}>
            <p>
              Enter your account email. We’ll request a password-reset link.
            </p>
            <label>
              Email
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <button
              className="portal-primary"
              disabled={busy || !platform.auth}
            >
              {busy ? "Requesting link…" : "Request reset link →"}
            </button>
          </form>
        )}
        {message && <p role="status">{message}</p>}
        {error && <p role="alert">{error}</p>}
      </section>
    </main>
  );
}
