import React, { useState } from 'react';
import {
  ArrowRight,
  Check,
  Clock3,
  Copy,
  Download,
  FileText,
  MessageSquareQuote,
  NotebookPen,
  Users,
  WifiOff,
} from 'lucide-react';
import { portraitFor } from './portraits';
import { ApiDownload } from '../platform/ProtectedMedia';
import type { RoomPerson } from './room-model';
import './post-gd.css';

interface PostGDScreenProps {
  topic: string;
  participants: RoomPerson[];
  notes: string;
  transcript: { speaker: string; text: string }[];
  endReason: string;
  isError: boolean;
  errorMessage?: string;
  sessionUrl?: string;
  canStart: boolean;
  onStart: () => void;
  onLeave: () => void;
}

export default function PostGDScreen({
  topic,
  participants,
  notes,
  transcript,
  endReason,
  isError,
  errorMessage,
  sessionUrl,
  canStart,
  onStart,
  onLeave,
}: PostGDScreenProps) {
  const [copied, setCopied] = useState(false);
  const [showFullTranscript, setShowFullTranscript] = useState(false);

  const userTurns = transcript.filter((t) => t.speaker === 'user');
  const userTurnCount = userTurns.length;
  const otherParticipants = participants.filter((p) => p.id !== 'user');

  const handleCopyNotes = async () => {
    if (!notes) return;
    try {
      await navigator.clipboard.writeText(notes);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const visibleTranscript = showFullTranscript
    ? transcript
    : transcript.slice(-6);

  return (
    <div className="post-gd-wrapper animate-fadeIn">
      <div className="post-gd-container">
        {/* Top Header Pill */}
        <header className="post-gd-header">
          <div className="post-gd-status-pill">
            {isError ? (
              <>
                <WifiOff size={14} className="post-gd-pill-icon--error" />
                <span>Discussion Stopped</span>
              </>
            ) : (
              <>
                <span className="post-gd-dot-live" />
                <span>Round Complete</span>
              </>
            )}
          </div>
        </header>

        {/* Main Card */}
        <main className="post-gd-card">
          {/* Hero Heading */}
          <div className="post-gd-hero">
            <h1 className="post-gd-title">
              {isError ? (
                'Discussion Stopped'
              ) : (
                <>
                  Discussion <em>Complete</em>
                </>
              )}
            </h1>
            <p className="post-gd-subtitle">
              {isError
                ? errorMessage || 'Connection was interrupted. You can start a fresh round anytime.'
                : endReason || 'Your contributions and private notes are safely saved.'}
            </p>
          </div>

          {/* Topic & Panel Strip */}
          <div className="post-gd-topic-banner">
            <div className="post-gd-topic-info">
              <span className="post-gd-tag">DISCUSSION TOPIC</span>
              <h2 className="post-gd-topic-heading">{topic}</h2>
            </div>

            <div className="post-gd-panel-row">
              <span className="post-gd-panel-label">Panel:</span>
              <div className="post-gd-avatar-stack">
                {otherParticipants.map((p) => (
                  <div key={p.id} className="post-gd-avatar-chip" title={`${p.name} (${p.role})`}>
                    <img src={portraitFor(p.id)} alt={p.name} />
                    <span>{p.name}</span>
                  </div>
                ))}
                <div className="post-gd-avatar-chip is-you">
                  <span className="post-gd-you-dot" />
                  <span>You</span>
                </div>
              </div>
            </div>
          </div>

          {/* Key Activity Metrics Grid (Product-Focused, No Fabricated Fluff) */}
          <div className="post-gd-metrics-grid">
            <div className="post-gd-metric-box">
              <span className="post-gd-metric-label">YOUR CONTRIBUTIONS</span>
              <strong className="post-gd-metric-value">
                {userTurnCount} {userTurnCount === 1 ? 'turn' : 'turns'}
              </strong>
              <small className="post-gd-metric-desc">Speech segments detected</small>
            </div>

            <div className="post-gd-metric-box">
              <span className="post-gd-metric-label">PANEL DISCUSSION</span>
              <strong className="post-gd-metric-value">
                {transcript.length} {transcript.length === 1 ? 'exchange' : 'exchanges'}
              </strong>
              <small className="post-gd-metric-desc">{participants.length} debaters active</small>
            </div>

            <div className="post-gd-metric-box">
              <span className="post-gd-metric-label">PRIVATE NOTES</span>
              <strong className="post-gd-metric-value">
                {notes ? notes.length.toLocaleString() : '0'} chars
              </strong>
              <small className="post-gd-metric-desc">Saved for your review</small>
            </div>
          </div>

          {/* Your Notes Section */}
          <section className="post-gd-notes-section">
            <div className="post-gd-section-header">
              <div className="post-gd-section-title">
                <NotebookPen size={16} />
                <h3>Your Private Notes</h3>
              </div>
              {notes && (
                <button
                  type="button"
                  className="post-gd-btn-copy"
                  onClick={handleCopyNotes}
                  title="Copy notes to clipboard"
                >
                  {copied ? (
                    <>
                      <Check size={14} /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={14} /> Copy
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="post-gd-notes-body">
              {notes.trim() ? (
                <pre className="post-gd-notes-content">{notes}</pre>
              ) : (
                <p className="post-gd-notes-empty">
                  No private notes were logged during this discussion round.
                </p>
              )}
            </div>
          </section>

          {/* Transcript Log (if available) */}
          {transcript.length > 0 && (
            <section className="post-gd-transcript-section">
              <div className="post-gd-section-header">
                <div className="post-gd-section-title">
                  <MessageSquareQuote size={16} />
                  <h3>Discussion Highlights</h3>
                  <span className="post-gd-counter">
                    {transcript.length} turns
                  </span>
                </div>
                {transcript.length > 6 && (
                  <button
                    type="button"
                    className="post-gd-btn-text"
                    onClick={() => setShowFullTranscript(!showFullTranscript)}
                  >
                    {showFullTranscript ? 'Show Recent' : `Show All (${transcript.length})`}
                  </button>
                )}
              </div>

              <div className="post-gd-transcript-list">
                {visibleTranscript.map((item, idx) => {
                  const isUser = item.speaker === 'user';
                  const speakerObj = participants.find((p) => p.id === item.speaker);
                  const speakerName = isUser ? 'You' : speakerObj?.name || item.speaker;

                  return (
                    <div
                      key={idx}
                      className={`post-gd-turn ${isUser ? 'is-user-turn' : ''}`}
                    >
                      <span className="post-gd-turn-speaker">{speakerName}</span>
                      <p className="post-gd-turn-text">{item.text}</p>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Download Session Record if Available */}
          {sessionUrl && (
            <div className="post-gd-download-wrap">
              <ApiDownload path={sessionUrl} name="discussion.json">
                <Download size={14} /> Download discussion record
              </ApiDownload>
            </div>
          )}

          {/* Bottom Actions */}
          <footer className="post-gd-footer">
            <button
              type="button"
              className="post-gd-btn-secondary"
              onClick={onLeave}
            >
              Back to workspace
            </button>

            <button
              type="button"
              className="post-gd-btn-primary"
              disabled={!canStart}
              onClick={onStart}
            >
              New discussion <ArrowRight size={17} />
            </button>
          </footer>
        </main>
      </div>
    </div>
  );
}
