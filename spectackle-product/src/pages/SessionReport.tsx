import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  MessageCircle,
  Clock3,
  AlertCircle,
  ArrowUpRight,
} from "lucide-react";
import { usePlatform } from "../platform/context";
import { useApi } from "../platform/useApi";
import { ProtectedAudio } from "../platform/ProtectedMedia";
import "./institution.css";

type Report = {
  session_id: string;
  rubric_version: string;
  created_at: string;
  status: "ready" | "processing" | "failed";
  model: string | null;
  error?: string;
  evidence: {
    topic: string;
    warnings: string[];
    facts: {
      utterance_count: number;
      recorded_speech_seconds: number;
      vad_voiced_seconds: number | null;
      user_transcript_turns: number;
      leader: string | null;
      end_reason: string;
      incomplete: boolean;
    };
    utterances: {
      id: number;
      file: string;
      duration_ms: number;
      incomplete: boolean;
    }[];
    transcript: { index: number; speaker: string; text: string }[];
  };
  coaching: {
    summary: string;
    observations: {
      category: string;
      finding: string;
      next_step: string;
      transcript_turns: number[];
      utterance_ids: number[];
    }[];
    limitations: string[];
  } | null;
};

export function CoachingAction({ enabled, disabled, onGenerate }: { enabled: boolean; disabled: boolean; onGenerate: () => void }) {
  return <><p className="portal-help">{enabled ? 'Completed coaching feedback is saved with this discussion.' : 'Coaching feedback is being set up. Your evidence summary is ready.'}</p>{enabled && <button disabled={disabled} onClick={onGenerate}>Generate coaching feedback</button>}</>;
}

export default function SessionReport() {
  const { sessionId = "" } = useParams();
  const platform = usePlatform();
  const api = useApi();
  const [report, setReport] = useState<Report | null>(null);
  const [recordingId, setRecordingId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [revision, refresh] = useState(0);
  useEffect(() => {
    if (!platform.user) return;
    let active = true;
    setBusy(true);
    setReport(null);
    setError("");
    void api<{ session: { recording_id: string } }>(
      `/api/platform/sessions/${sessionId}`,
    )
      .then(async (result) => {
        if (active) setRecordingId(result.session.recording_id);
        try {
          const value = await api<Report>(
            `/api/platform/sessions/${sessionId}/report`,
          );
          if (active) setReport(value);
        } catch (failure) {
          if (
            !(
              failure instanceof Error &&
              "status" in failure &&
              failure.status === 404
            )
          )
            throw failure;
        }
      })
      .catch((failure) => {
        if (active) setError(failure.message);
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, [api, platform.user, sessionId, revision]);
  const generate = async (coaching: boolean) => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      setReport(
        await api<Report>(`/api/platform/sessions/${sessionId}/report`, {
          coaching,
        }),
      );
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "Report unavailable.",
      );
    } finally {
      setBusy(false);
    }
  };
  if (!platform.ready)
    return (
      <main className="portal">
        <p role="status">Loading your report…</p>
      </main>
    );
  if (!platform.user)
    return (
      <main className="portal">
        <h1>Sign in to view this discussion.</h1>
        <Link to="/workspace">Go to sign in →</Link>
      </main>
    );
  const facts = report?.evidence.facts;
  return (
    <main className="portal report-page">
      <header className="portal-topbar">
        <Link to="/workspace">
          <ArrowLeft size={17} /> Your workspace
        </Link>
        <Link to="/admin">
          Institution workspace <ArrowUpRight size={15} />
        </Link>
      </header>
      <div className="portal-hero">
        <div>
          <p className="portal-eyebrow">YOUR DISCUSSION, IN REVIEW</p>
          <h1>{report?.evidence.topic || "Discussion report"}</h1>
          <p>
            Understand your participation. Take one clear improvement into your
            next round.
          </p>
        </div>
        <FileText size={35} />
      </div>
      <div aria-live="polite">
        {busy && (
          <p role="status">
            {report ? "Preparing feedback…" : "Loading report…"}
          </p>
        )}
        {error && (
          <p className="portal-alert" role="alert">
            {error}
          </p>
        )}
      </div>
      {!report && (
        <section className="portal-card">
          <h2>Turn your discussion into a useful reflection.</h2>
          <p>
            Create an evidence summary from your saved GD speech and transcript.
          </p>
          <button
            className="portal-primary"
            disabled={busy || !recordingId}
            onClick={() => void generate(false)}
          >
            Create evidence summary →
          </button>
        </section>
      )}
      {report && facts && (
        <>
          <div className="report-metrics">
            <article className="portal-card">
              <MessageCircle />
              <strong>{facts.utterance_count}</strong>
              <span>Recorded contributions</span>
            </article>
            <article className="portal-card">
              <Clock3 />
              <strong>
                {facts.vad_voiced_seconds === null
                  ? "Unavailable"
                  : `${facts.vad_voiced_seconds.toFixed(1)} s`}
              </strong>
              <span>VAD-detected voiced time</span>
            </article>
            <article className="portal-card">
              <FileText />
              <strong>{facts.user_transcript_turns}</strong>
              <span>Human transcript turns</span>
            </article>
          </div>
          <section className="portal-card">
            <div className="portal-section-heading">
              <div>
                <p className="portal-eyebrow">COACHING FEEDBACK</p>
                <h2>A better next round.</h2>
              </div>
              <span className="portal-badge">
                {report.coaching
                  ? "AI-assisted coaching"
                  : report.status === "processing"
                    ? "Processing"
                    : "Evidence summary"}
              </span>
            </div>
            {report.error && <p role="alert">{report.error}</p>}
            {report.coaching ? (
              <>
                <p className="report-summary">{report.coaching.summary}</p>
                <div className="report-observations">
                  {report.coaching.observations.map((observation, index) => (
                    <article key={index}>
                      <span className="portal-eyebrow">
                        {observation.category}
                      </span>
                      <h3>{observation.finding}</h3>
                      <p>
                        <strong>Try next:</strong> {observation.next_step}
                      </p>
                      <div className="portal-actions">
                        {observation.transcript_turns.map((turn) => (
                          <a key={turn} href={`#transcript-${turn}`}>
                            Transcript {turn + 1}
                          </a>
                        ))}
                        {observation.utterance_ids.map((id) => (
                          <a key={id} href={`#utterance-${id}`}>
                            Utterance {id}
                          </a>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
                <p className="portal-help">
                  Developmental feedback, not a placement decision or validated
                  proficiency score.
                </p>
              </>
            ) : (
              <>
                <p>
                  Your participation facts are ready. AI coaching adds
                  observations about relevance, reasoning, collaboration and
                  delivery, linked to supporting evidence.
                </p>
                <CoachingAction enabled={platform.status?.coaching_enabled === true}
                  disabled={busy || report.status !== 'ready' || !report.evidence.utterances.length}
                  onGenerate={() => void generate(true)} />
                {report.status === "processing" && (
                  <button
                    disabled={busy}
                    onClick={() => refresh((value) => value + 1)}
                  >
                    Check report status
                  </button>
                )}
              </>
            )}
          </section>
          <section className="portal-card report-limitations">
            <div className="portal-section-heading">
              <h2>How to read this report</h2>
              <AlertCircle size={20} />
            </div>
            <ul>
              {[
                ...report.evidence.warnings,
                ...(report.coaching?.limitations || []),
              ].map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
            <p className="portal-help">
              Speech files include short VAD padding. Transcription may contain
              errors. Private preparation notes are excluded.
            </p>
          </section>
          <div className="portal-columns">
            <section className="portal-card">
              <h2>Your recorded contributions</h2>
              {report.evidence.utterances.length ? (
                report.evidence.utterances.map((clip) => (
                  <article
                    className="portal-row"
                    id={`utterance-${clip.id}`}
                    key={clip.id}
                  >
                    <h3>Utterance {clip.id}</h3>
                    <p>
                      {(clip.duration_ms / 1000).toFixed(1)} seconds
                      {clip.incomplete && " · partial recording"}
                    </p>
                    <ProtectedAudio
                      path={`/api/recordings/${recordingId}/audio/${clip.file}`}
                      order={clip.id}
                    />
                  </article>
                ))
              ) : (
                <p>No usable GD speech was saved.</p>
              )}
            </section>
            <section className="portal-card">
              <h2>Discussion transcript</h2>
              <p className="portal-help">
                Labels identify the speaker. Text is approximate evidence.
              </p>
              {report.evidence.transcript.map((turn) => (
                <article
                  className="portal-row"
                  id={`transcript-${turn.index}`}
                  key={turn.index}
                >
                  <span className="portal-badge">
                    {turn.speaker === "user" ? "You" : turn.speaker} ·{" "}
                    {turn.index + 1}
                  </span>
                  <p>{turn.text}</p>
                </article>
              ))}
            </section>
          </div>
        </>
      )}
    </main>
  );
}
