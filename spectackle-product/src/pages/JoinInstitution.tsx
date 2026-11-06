import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { responseError, usePlatform } from "../platform/context";
import {
  emailInput,
  refreshVerification,
  requestVerification,
} from "../platform/identity-actions";
import { useApi } from "../platform/useApi";
import "./institution.css";

type Preview = {
  organization_name: string;
  role: string;
  email_hint: string;
  expires_at: number;
};
export default function JoinInstitution() {
  const platform = usePlatform();
  const api = useApi();
  const [token] = useState(
    () =>
      new URLSearchParams(window.location.hash.slice(1)).get("invite") || "",
  );
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [verified, setVerified] = useState(false);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    if (!/^[A-Za-z0-9_-]{40,100}$/.test(token)) {
      setError(
        "This invitation link is incomplete. Ask your institution for a new one.",
      );
      setLoading(false);
      return;
    }
    void fetch("/api/platform/invitations/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) throw await responseError(response);
        return response.json() as Promise<Preview>;
      })
      .then((value) => {
        if (active) setPreview(value);
      })
      .catch((failure) => {
        if (active) setError(failure.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [token]);
  const perform = async (action: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await action();
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Could not complete this step.",
      );
    } finally {
      setBusy(false);
    }
  };
  const authenticate = (event: FormEvent) => {
    event.preventDefault();
    void perform(async () => {
      if (!platform.auth) throw new Error("Account service is not available.");
      const address = emailInput(email);
      const credential = creating
        ? await createUserWithEmailAndPassword(platform.auth, address, password)
        : await signInWithEmailAndPassword(platform.auth, address, password);
      setPassword("");
      if (creating && !platform.status?.emulator)
        setMessage(await requestVerification(credential.user));
    });
  };
  const needsVerification =
    !!platform.user &&
    !platform.status?.emulator &&
    !platform.user.emailVerified &&
    !verified;
  return (
    <main className="portal account-page">
      <header className="portal-topbar">
        <Link to="/workspace">← Your workspace</Link>
        <span className="portal-wordmark">spectakles</span>
      </header>
      <section className="portal-card account-card">
        <p className="portal-eyebrow">YOU’RE INVITED</p>
        <h1>
          {accepted
            ? "You’re part of the group."
            : preview
              ? `Join ${preview.organization_name}.`
              : "Your institution invitation."}
        </h1>
        {loading || !platform.ready ? (
          <p role="status">Checking your invitation…</p>
        ) : accepted ? (
          <>
            <p>
              Your institution access is ready. Open your workspace to find
              assigned discussions.
            </p>
            <Link className="portal-button" to="/workspace">
              Open workspace →
            </Link>
          </>
        ) : (
          preview && (
            <>
              <p>
                Invited as <strong>{preview.role}</strong> · for{" "}
                {preview.email_hint}
              </p>
              {!platform.user ? (
                <>
                  <form onSubmit={authenticate}>
                    <h2>
                      {creating ? "Create your account" : "Sign in to accept"}
                    </h2>
                    <label>
                      Invited email
                      <input
                        required
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                      />
                    </label>
                    <label>
                      Password
                      <input
                        required
                        type="password"
                        minLength={8}
                        autoComplete={
                          creating ? "new-password" : "current-password"
                        }
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                      />
                    </label>
                    <button
                      className="portal-primary"
                      disabled={busy || !platform.auth}
                    >
                      {creating ? "Create account →" : "Sign in →"}
                    </button>
                  </form>
                  <button
                    className="portal-quiet"
                    disabled={busy}
                    onClick={() => {
                      setCreating((value) => !value);
                      setPassword("");
                    }}
                  >
                    {creating
                      ? "Already have an account? Sign in"
                      : "New to Spectakles? Create an account"}
                  </button>
                  <Link to="/reset-password">Forgot password?</Link>
                </>
              ) : (
                <>
                  <p>
                    Signed in as <strong>{platform.user.email}</strong>.
                  </p>
                  {needsVerification ? (
                    <>
                      <p>Verify this email before joining the institution.</p>
                      <button
                        disabled={busy}
                        onClick={() =>
                          void perform(async () =>
                            setMessage(
                              await requestVerification(platform.user!),
                            ),
                          )
                        }
                      >
                        Send verification email
                      </button>
                      <button
                        disabled={busy}
                        onClick={() =>
                          void perform(async () => {
                            const result = await refreshVerification(
                              platform.user!,
                            );
                            setVerified(result);
                            setMessage(
                              result
                                ? "Email verified. You can accept the invitation."
                                : "Follow the verification link first, then try again.",
                            );
                          })
                        }
                      >
                        I’ve verified my email
                      </button>
                    </>
                  ) : (
                    <button
                      className="portal-primary"
                      disabled={busy}
                      onClick={() =>
                        void perform(async () => {
                          await api("/api/platform/invitations/accept", {
                            token,
                          });
                          await platform.reload();
                          setAccepted(true);
                          window.history.replaceState(
                            null,
                            "",
                            window.location.pathname,
                          );
                        })
                      }
                    >
                      Accept invitation →
                    </button>
                  )}
                  <button
                    className="portal-quiet"
                    disabled={busy}
                    onClick={() =>
                      void perform(async () => {
                        await signOut(platform.auth!);
                        setVerified(false);
                      })
                    }
                  >
                    Use a different account
                  </button>
                </>
              )}
            </>
          )
        )}
        {error && (
          <p className="portal-alert" role="alert">
            {error}
          </p>
        )}
        {message && <p role="status">{message}</p>}
        {platform.error && <p role="alert">{platform.error}</p>}
      </section>
    </main>
  );
}
