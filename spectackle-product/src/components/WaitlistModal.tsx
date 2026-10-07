import { FormEvent, useEffect, useState } from "react";
import { ArrowRight, Check, Loader2, ShieldCheck, X } from "lucide-react";
import "./WaitlistModal.css";
import SpectaklesLogo from "./SpectaklesLogo";
import { supabase } from "../lib/supabase";
import { trackEvent } from "../lib/firebase";

interface WaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WaitlistModal({
  isOpen,
  onClose,
}: WaitlistModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [userType, setUserType] = useState("Student");
  const [college, setCollege] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      trackEvent("waitlist_modal_opened");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    if (supabase) {
      try {
        const { error: insertError } = await supabase.from("waitlist").insert([
          {
            name: name.trim(),
            email: email.trim(),
            user_type: userType,
            college: college.trim() || null,
          },
        ]);
        if (insertError) throw insertError;
        setSubmitted(true);
        trackEvent("waitlist_submitted", {
          source: "modal",
          user_type: userType,
          has_college: Boolean(college.trim()),
        });
      } catch (err: any) {
        console.error("Waitlist error:", err);
        setError(err?.message || "Something went wrong. Please try again.");
        trackEvent("waitlist_submission_failed", {
          source: "modal",
          error: err?.message || "unknown_error",
        });
      } finally {
        setLoading(false);
      }
    } else {
      setSubmitted(true);
      setLoading(false);
      trackEvent("waitlist_submitted", {
        source: "modal",
        user_type: userType,
        has_college: Boolean(college.trim()),
        offline_demo: true,
      });
    }
  };

  const handleClose = () => {
    trackEvent("waitlist_modal_closed", { submitted });
    setName("");
    setEmail("");
    setUserType("Student");
    setCollege("");
    setError("");
    setSubmitted(false);

    onClose();
  };

  return (
    <div
      className="waitlist-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        className="waitlist-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="waitlist-heading"
      >
        <button
          className="waitlist-close"
          onClick={handleClose}
          aria-label="Close dialog"
        >
          <X size={17} />
        </button>

        {!submitted ? (
          <>
            <div className="waitlist-header">
              <div className="waitlist-logo">
                <SpectaklesLogo height={30} className="h-7 w-auto" />
              </div>

              <div className="waitlist-eyebrow-badge">
                <span className="waitlist-pulse-dot" />
                <span>Early Access</span>
              </div>

              <h2 id="waitlist-heading">
                Your next GD
                <span> starts here.</span>
              </h2>

              <p>
                Practice speaking under pressure before placement day arrives.
              </p>
            </div>

            <form
              className="waitlist-form"
              onSubmit={handleSubmit}
            >
              <div className="waitlist-field">
                <label htmlFor="waitlist-name">
                  <span>Name</span>
                </label>

                <input
                  id="waitlist-name"
                  type="text"
                  placeholder="e.g. Alex Sharma"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  autoComplete="name"
                />
              </div>

              <div className="waitlist-field">
                <label htmlFor="waitlist-email">
                  <span>Email</span>
                </label>

                <input
                  id="waitlist-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  autoComplete="email"
                />
              </div>

              <div className="waitlist-field">
                <label htmlFor="waitlist-type">
                  <span>I am a</span>
                </label>

                <select
                  id="waitlist-type"
                  value={userType}
                  onChange={(event) =>
                    setUserType(event.target.value)
                  }
                >
                  <option value="Student">
                    Student
                  </option>

                  <option value="Faculty">
                    Faculty
                  </option>

                  <option value="Institution">
                    Institution
                  </option>
                </select>
              </div>

              <div className="waitlist-field">
                <label htmlFor="waitlist-college">
                  <span>College / University</span>
                  <span className="waitlist-optional-tag">Optional</span>
                </label>

                <input
                  id="waitlist-college"
                  type="text"
                  placeholder="e.g. BITS Pilani, IIT Bombay..."
                  value={college}
                  onChange={(event) =>
                    setCollege(event.target.value)
                  }
                />
              </div>

              {error && (
                <div className="waitlist-error" role="alert">
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                className="waitlist-submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="waitlist-spinner" />
                    <span>Joining waitlist...</span>
                  </>
                ) : (
                  <>
                    <span>Join the waitlist</span>
                    <ArrowRight size={16} className="waitlist-arrow" />
                  </>
                )}
              </button>

              <div className="waitlist-note">
                <ShieldCheck size={13} className="waitlist-note-icon" />
                <span>No spam, ever. Only an invite when your room is ready.</span>
              </div>
            </form>
          </>
        ) : (
          <div className="waitlist-success">
            <div className="success-icon-wrapper">
              <div className="success-icon">
                <Check size={26} strokeWidth={2.6} />
              </div>
            </div>

            <div className="waitlist-eyebrow-badge success-badge">
              <span className="waitlist-pulse-dot" />
              <span>You&apos;re On The List</span>
            </div>

            <h2 id="waitlist-heading">
              Get ready to
              <span> speak up.</span>
            </h2>

            <p>
              You&apos;re officially in line. We&apos;ll ping you the second rooms open for your campus.
            </p>

            <button
              className="waitlist-submit"
              onClick={handleClose}
            >
              <span>Done</span>
              <ArrowRight size={16} className="waitlist-arrow" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}