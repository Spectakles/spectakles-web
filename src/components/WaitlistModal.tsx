"use client";

import { FormEvent, useEffect, useState } from "react";
import { ArrowRight, Check, X } from "lucide-react";

import SpectaklesLogo from "./SpectaklesLogo";
import { supabase } from "../lib/supabase";
import { trackEvent, trackClick } from "../lib/firebase";

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
      setError("Please enter a valid email.");
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
      >
        <button
          className="waitlist-close"
          onClick={handleClose}
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {!submitted ? (
          <>
            <div className="waitlist-header">
              <div className="waitlist-logo">
                <SpectaklesLogo height={36} className="h-9 w-auto" />
              </div>

              <p className="waitlist-eyebrow">
                COMING SOON
              </p>

              <h2>
                Join the
                <span> waitlist.</span>
              </h2>

              <p>
                Be among the first to experience
                a better way to practice,
                participate, and grow.
              </p>
            </div>

            <form
              className="waitlist-form"
              onSubmit={handleSubmit}
            >
              <div className="waitlist-field">
                <label htmlFor="waitlist-name">
                  Name
                </label>

                <input
                  id="waitlist-name"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                />
              </div>

              <div className="waitlist-field">
                <label htmlFor="waitlist-email">
                  Email
                </label>

                <input
                  id="waitlist-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                />
              </div>

              <div className="waitlist-field">
                <label htmlFor="waitlist-type">
                  I am a
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
                  College / University
                  <span>Optional</span>
                </label>

                <input
                  id="waitlist-college"
                  type="text"
                  placeholder="Your college"
                  value={college}
                  onChange={(event) =>
                    setCollege(event.target.value)
                  }
                />
              </div>

              {error && (
                <p className="waitlist-error">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="waitlist-submit"
                disabled={loading}
              >
                {loading ? "Joining..." : "Join the waitlist"}
                <ArrowRight size={17} />
              </button>

              <p className="waitlist-note">
                No spam. Just updates when
                Spectakles is ready.
              </p>
            </form>
          </>
        ) : (
          <div className="waitlist-success">
            <div className="success-icon">
              <Check size={28} />
            </div>

            <p className="waitlist-eyebrow">
              YOU&apos;RE IN
            </p>

            <h2>
              Welcome to
              <span> Spectakles.</span>
            </h2>

            <p>
              You&apos;re officially on the
              waitlist. We&apos;ll let you know
              when it&apos;s time to step into
              the room.
            </p>

            <button
              className="waitlist-submit"
              onClick={handleClose}
            >
              Sounds good
              <ArrowRight size={17} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}