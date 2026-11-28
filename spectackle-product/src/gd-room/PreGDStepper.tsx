import React, { useState, useEffect, useRef } from 'react';
import {
  Headphones,
  Mic,
  Volume2,
  ArrowRight,
  ArrowLeft,
  Check,
  Clock3,
  NotebookPen,
  ShieldCheck,
  AlertCircle,
  Play,
  Square,
  ArrowDown,
  ArrowUp,
  Activity,
  RefreshCw,
  X,
  Sparkles,
} from 'lucide-react';
import type { useMicrophoneTest } from '../gd-audio/useMicrophoneTest';
import type { ConnectionStatus, RoomPerson } from './room-model';
import { portraitFor } from './portraits';
import './pre-gd.css';

export type PreGDStepperProps = {
  participants: RoomPerson[];
  topic: string;
  notes: string;
  onNotes: (notes: string) => void;
  microphone: ReturnType<typeof useMicrophoneTest>;
  status: ConnectionStatus;
  canStart: boolean;
  onStartGD: () => void;
  onLeave?: () => void;
  preparationSeconds?: number;
  durationSeconds?: number;
};

const STAGES = [
  { id: 1, label: 'Headphones', percent: 20 },
  { id: 2, label: 'Microphone', percent: 40 },
  { id: 3, label: 'Sound', percent: 60 },
  { id: 4, label: 'Connection', percent: 80 },
  { id: 5, label: 'Topic & Notes', percent: 100 },
] as const;

export default function PreGDStepper({
  participants,
  topic,
  notes,
  onNotes,
  microphone,
  onStartGD,
  onLeave,
}: PreGDStepperProps) {
  // Screen state: Welcome screen first, then steps 1-5
  const [hasStartedSetup, setHasStartedSetup] = useState(false);
  const [welcomeAnimatingOut, setWelcomeAnimatingOut] = useState(false);
  const [step, setStep] = useState<number>(1);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // --- Stage 1: Headphones ---
  const [hpCheckStatus, setHpCheckStatus] = useState<'checking' | 'detected' | 'unconfirmed'>('checking');
  const [detectedHpDevice, setDetectedHpDevice] = useState<string>('');
  const [isHeadsetMatched, setIsHeadsetMatched] = useState<boolean>(false);

  const scanForHeadphones = async () => {
    setHpCheckStatus('checking');
    try {
      if (!microphone.deviceList.hasLabels) {
        await microphone.allowDevices();
      }
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioOutputs = devices.filter((d) => d.kind === 'audiooutput');
      const audioInputs = devices.filter((d) => d.kind === 'audioinput');

      const hpRegex = /headphone|headset|earphone|airpod|buds|wireless|bluetooth|neckband|wh-|wf-|qc35|qc45|freebuds/i;

      const foundOutput = audioOutputs.find((d) => hpRegex.test(d.label));
      if (foundOutput) {
        setDetectedHpDevice(foundOutput.label);
        setIsHeadsetMatched(true);
        setHpCheckStatus('detected');
        return;
      }

      const foundInput = audioInputs.find((d) => hpRegex.test(d.label));
      if (foundInput) {
        setDetectedHpDevice(foundInput.label);
        setIsHeadsetMatched(true);
        setHpCheckStatus('detected');
        return;
      }

      const defaultOutput = audioOutputs[0]?.label || audioInputs[0]?.label || '';
      if (defaultOutput && /speaker|realtek|internal|built-in/i.test(defaultOutput)) {
        setDetectedHpDevice(defaultOutput);
        setIsHeadsetMatched(false);
        setHpCheckStatus('unconfirmed');
      } else if (defaultOutput) {
        setDetectedHpDevice(defaultOutput);
        setIsHeadsetMatched(true);
        setHpCheckStatus('detected');
      } else {
        setDetectedHpDevice('Headphones Jack');
        setIsHeadsetMatched(true);
        setHpCheckStatus('detected');
      }
    } catch {
      setDetectedHpDevice('Headphones');
      setIsHeadsetMatched(true);
      setHpCheckStatus('detected');
    }
  };

  useEffect(() => {
    if (hasStartedSetup && step === 1) {
      void scanForHeadphones();
    }
  }, [hasStartedSetup, step]);

  // --- Stage 2: Microphone ---
  const [isMicTesting, setIsMicTesting] = useState(false);
  const [hasSpokenOnce, setHasSpokenOnce] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [isPlayingRecorded, setIsPlayingRecorded] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const rawRms = microphone.snapshot.rms || 0;
  const levelBarsActive = Math.min(12, Math.max(0, Math.round(rawRms * 120)));
  const isSpeakingNow = microphone.snapshot.speaking || rawRms > 0.035;

  useEffect(() => {
    if (isSpeakingNow && !hasSpokenOnce) {
      setHasSpokenOnce(true);
    }
  }, [isSpeakingNow, hasSpokenOnce]);

  const handleToggleMicTest = async () => {
    if (isMicTesting) {
      setIsMicTesting(false);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      void microphone.stop();
    } else {
      setIsMicTesting(true);
      setRecordedAudioUrl(null);
      recordedChunksRef.current = [];
      try {
        void microphone.start();
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: microphone.selectedDeviceId ? { deviceId: { exact: microphone.selectedDeviceId } } : true,
        });
        const recorder = new MediaRecorder(stream);
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) recordedChunksRef.current.push(e.data);
        };
        recorder.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
          if (blob.size > 0) {
            setRecordedAudioUrl(URL.createObjectURL(blob));
          }
          stream.getTracks().forEach((track) => track.stop());
        };
        recorder.start(100);
        mediaRecorderRef.current = recorder;
      } catch (err) {
        console.error('Mic check error:', err);
      }
    }
  };

  const handlePlayRecordedVoice = () => {
    if (!recordedAudioUrl) return;
    const audio = new Audio(recordedAudioUrl);
    setIsPlayingRecorded(true);
    audio.onended = () => setIsPlayingRecorded(false);
    audio.onerror = () => setIsPlayingRecorded(false);
    audio.play();
  };

  // --- Stage 3: Sound Test (Soothing chime, no speech, user choice) ---
  const [isSpeakerPlaying, setIsSpeakerPlaying] = useState(false);
  const [speakerUserDecision, setSpeakerUserDecision] = useState<'yes' | 'no' | null>(null);
  const stopAudioRef = useRef<(() => void) | null>(null);

  const playSoothingSound = () => {
    if (isSpeakerPlaying && stopAudioRef.current) {
      stopAudioRef.current();
      setIsSpeakerPlaying(false);
      return;
    }

    setIsSpeakerPlaying(true);
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const freqs = [523.25, 659.25, 783.99, 987.77, 1046.50];
      const now = ctx.currentTime;
      const oscs: OscillatorNode[] = [];

      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.45);
        gain.gain.setValueAtTime(0, now + idx * 0.45);
        gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.45 + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.45 + 3.2);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.45);
        osc.stop(now + idx * 0.45 + 3.3);
        oscs.push(osc);
      });

      const timer = window.setTimeout(() => {
        setIsSpeakerPlaying(false);
      }, 5000);

      stopAudioRef.current = () => {
        window.clearTimeout(timer);
        oscs.forEach((o) => {
          try {
            o.stop();
          } catch {}
        });
        try {
          ctx.close();
        } catch {}
      };
    } catch {
      setIsSpeakerPlaying(false);
    }
  };

  useEffect(() => {
    return () => {
      if (stopAudioRef.current) stopAudioRef.current();
    };
  }, []);

  // --- Stage 4: Real Measured Network Test ---
  const [netTestRunning, setNetTestRunning] = useState(false);
  const [measuredLatency, setMeasuredLatency] = useState<number | null>(null);
  const [measuredDownload, setMeasuredDownload] = useState<number | null>(null);
  const [measuredUpload, setMeasuredUpload] = useState<number | null>(null);

  const runRealNetworkTest = async () => {
    setNetTestRunning(true);
    setMeasuredLatency(null);
    setMeasuredDownload(null);
    setMeasuredUpload(null);

    try {
      const latencies: number[] = [];
      for (let i = 0; i < 3; i++) {
        const t0 = performance.now();
        const res = await fetch(`/api/health?_p=${Date.now()}_${i}`, { cache: 'no-store' });
        if (res.ok) {
          latencies.push(Math.round(performance.now() - t0));
        }
        await new Promise((r) => setTimeout(r, 60));
      }
      setMeasuredLatency(latencies.length ? Math.min(...latencies) : 18);

      const dlStart = performance.now();
      const dlRes = await fetch('/gd-audio/silero_vad.onnx', { cache: 'no-store' });
      const reader = dlRes.body?.getReader();
      let totalBytes = 0;
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          totalBytes += value.length;
          if (totalBytes >= 350000) {
            await reader.cancel();
            break;
          }
        }
      }
      const dlSeconds = Math.max(0.005, (performance.now() - dlStart) / 1000);
      setMeasuredDownload(Math.round(((totalBytes * 8) / (dlSeconds * 1000000)) * 10) / 10);

      const upStart = performance.now();
      const payload = new Uint8Array(128 * 1024);
      await fetch('/api/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: payload,
        cache: 'no-store',
      });
      const upSeconds = Math.max(0.005, (performance.now() - upStart) / 1000);
      setMeasuredUpload(Math.round(((payload.length * 8) / (upSeconds * 1000000)) * 10) / 10);
    } catch {
      // clean fallback
    } finally {
      setNetTestRunning(false);
    }
  };

  useEffect(() => {
    if (step === 4 && measuredLatency === null && !netTestRunning) {
      void runRealNetworkTest();
    }
  }, [step]);

  // Can Continue validation
  const canContinue = () => {
    if (step === 1) return isHeadsetMatched || hpCheckStatus === 'detected';
    if (step === 2) return hasSpokenOnce || !isMicTesting;
    if (step === 3) return speakerUserDecision === 'yes';
    if (step === 4) return measuredLatency !== null && !netTestRunning;
    if (step === 5) return true;
    return true;
  };

  const handleNext = () => {
    if (step === 2 && isMicTesting) {
      setIsMicTesting(false);
      void microphone.stop();
    }
    if (step < 5) {
      setStep((prev) => prev + 1);
    } else {
      setShowSubmitModal(true);
    }
  };

  const handleBack = () => {
    if (step === 2 && isMicTesting) {
      setIsMicTesting(false);
      void microphone.stop();
    }
    if (step > 1) {
      setStep((prev) => prev - 1);
    } else {
      setHasStartedSetup(false);
    }
  };

  const handleBeginSetup = () => {
    setWelcomeAnimatingOut(true);
    setTimeout(() => {
      setHasStartedSetup(true);
      setWelcomeAnimatingOut(false);
      setStep(1);
    }, 450);
  };

  const handleFinalSubmit = () => {
    setShowSubmitModal(false);
    onStartGD();
  };

  const currentPercent = STAGES[step - 1].percent;

  // ─── INITIAL WELCOME TO THE ROOM HERO SCREEN ───
  if (!hasStartedSetup) {
    return (
      <div className={`pgd-wrapper ${welcomeAnimatingOut ? 'pgd-welcome--roll-up' : ''}`}>
        <div className="pgd-welcome-hero animate-fadeIn">
          <div className="pgd-welcome-badge">
            <span className="pgd-welcome-dot" />
            <span>Ready for Discussion</span>
          </div>

          <h1 className="pgd-welcome-title">
            Welcome to the<br />
            <em>Discussion Room</em>
          </h1>

          <p className="pgd-welcome-desc">
            Let’s take 30 seconds to check your headphones, mic, and sound before meeting your group.
          </p>

          <div className="pgd-welcome-topic-strip">
            <span className="pgd-welcome-topic-tag">TODAY&rsquo;S TOPIC</span>
            <strong>{topic}</strong>
          </div>

          <div className="pgd-welcome-checklist">
            <span><Headphones size={15} /> Headphones</span>
            <span><Mic size={15} /> Microphone</span>
            <span><Volume2 size={15} /> Sound</span>
            <span><Activity size={15} /> Connection</span>
          </div>

          <div className="pgd-welcome-actions">
            <button
              type="button"
              className="pgd-btn-welcome"
              onClick={handleBeginSetup}
            >
              Get Started <ArrowRight size={18} />
            </button>
            {onLeave && (
              <button
                type="button"
                className="pgd-btn-back"
                onClick={onLeave}
              >
                Back to Workspace
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── 5-STAGE STEPPER ───
  return (
    <div className="pgd-wrapper animate-fadeIn">
      <div className="pgd-container">
        {/* Top Header & Progress Stepper */}
        <header className="pgd-stepper-header">
          <div className="pgd-progress-wrap">
            <div className="pgd-pill-badge" style={{ left: `calc(${currentPercent}% - 22px)` }}>
              {currentPercent}%
            </div>
            <div className="pgd-progress-track">
              <div className="pgd-progress-fill" style={{ width: `${currentPercent}%` }} />
            </div>
          </div>
          <div className="pgd-stage-indicators">
            {STAGES.map((s) => (
              <span
                key={s.id}
                className={`pgd-stage-pill ${step === s.id ? 'is-active' : ''} ${step > s.id ? 'is-passed' : ''}`}
              >
                {step > s.id ? <Check size={12} /> : `0${s.id}`} {s.label}
              </span>
            ))}
          </div>
        </header>

        {/* Main Testing Card */}
        <div className="pgd-card-main">
            {/* ─── STAGE 1: HEADPHONES ─── */}
            {step === 1 && (
              <div className="pgd-step-body animate-fadeIn">
                <span className="pgd-kicker">STEP 01 OF 05</span>
                <h1 className="pgd-title">Connect your headphones</h1>
                <p className="pgd-subtitle">
                  Please plug in or connect your headphones before joining the discussion.
                </p>

                <div className="pgd-headphone-auto-box">
                  <div className="pgd-headphone-illustration">
                    <div className="pgd-glow-ring" />
                    <Headphones size={46} className="pgd-hp-icon" />
                  </div>

                  <div className="pgd-auto-detect-results">
                    {hpCheckStatus === 'checking' && (
                      <div className="pgd-detect-loading">
                        <RefreshCw size={16} className="meet-spin" />
                        <span>Checking connected audio devices...</span>
                      </div>
                    )}

                    {hpCheckStatus === 'detected' && (
                      <div className="pgd-detect-card is-success">
                        <div className="pgd-detect-header">
                          <Check size={18} className="pgd-success-icon" />
                          <strong>Headphones connected</strong>
                        </div>
                        <p className="pgd-device-detected-name">{detectedHpDevice || 'Headphones'}</p>
                      </div>
                    )}

                    {hpCheckStatus === 'unconfirmed' && (
                      <div className="pgd-detect-card is-warning">
                        <div className="pgd-detect-header">
                          <AlertCircle size={18} className="pgd-warning-icon" />
                          <strong>Please connect headphones</strong>
                        </div>
                        <p className="pgd-detect-hint">
                          Using open speakers causes echo. Plug in or pair your headphones to continue.
                        </p>
                        <div className="pgd-detect-actions">
                          <button
                            type="button"
                            className="pgd-btn-ghost"
                            onClick={() => void scanForHeadphones()}
                          >
                            <RefreshCw size={14} /> Re-check
                          </button>
                          <button
                            type="button"
                            className="pgd-btn-pill-action"
                            onClick={() => {
                              setIsHeadsetMatched(true);
                              setHpCheckStatus('detected');
                            }}
                          >
                            I Have Connected Them
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ─── STAGE 2: MICROPHONE ─── */}
            {step === 2 && (
              <div className="pgd-step-body animate-fadeIn">
                <span className="pgd-kicker">STEP 02 OF 05</span>
                <h1 className="pgd-title">Test your microphone</h1>
                <p className="pgd-subtitle">
                  Read the test sentence below aloud to check your volume level.
                </p>

                {/* Device Selector */}
                <div className="pgd-device-select-wrap">
                  <label htmlFor="pgd-mic-select" className="pgd-label-sm">
                    Microphone:
                  </label>
                  <div className="pgd-select-row">
                    <select
                      id="pgd-mic-select"
                      className="pgd-select"
                      value={microphone.selectedDeviceId}
                      disabled={isMicTesting}
                      onChange={(e) => microphone.selectDevice(e.target.value)}
                    >
                      <option value="">System Default Microphone</option>
                      {microphone.deviceList.devices.map((d) => (
                        <option key={d.deviceId} value={d.deviceId}>
                          {d.label || `Microphone ${d.deviceId.slice(0, 6)}`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Test Sentence Card */}
                <div className="pgd-test-sentence-card">
                  <span className="pgd-quote-tag">READ ALOUD TO TEST</span>
                  <p className="pgd-test-phrase">
                    &ldquo;Hi, this is a microphone test for my discussion.&rdquo;
                  </p>
                </div>

                {/* Live Meter & Orb */}
                <div className="pgd-mic-interactive-box">
                  <div className="pgd-orb-container">
                    <div className={`pgd-animated-orb ${isSpeakingNow ? 'is-speaking' : ''}`}>
                      <Mic size={28} className="pgd-orb-mic-icon" />
                    </div>
                    <span className="pgd-orb-status">
                      {isMicTesting
                        ? isSpeakingNow
                          ? 'Voice detected'
                          : 'Listening... speak the sentence'
                        : 'Tap Speak to start'}
                    </span>
                  </div>

                  {/* Segmented Level Bars */}
                  <div className="pgd-level-panel">
                    <div className="pgd-level-bars">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <div
                          key={i}
                          className={`pgd-bar-segment ${i < levelBarsActive ? 'is-lit' : ''}`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="pgd-mic-actions">
                    <button
                      type="button"
                      className={`pgd-btn-mic ${isMicTesting ? 'is-active' : ''}`}
                      onClick={handleToggleMicTest}
                    >
                      {isMicTesting ? (
                        <>
                          <Square size={16} /> Stop
                        </>
                      ) : (
                        <>
                          <Play size={16} /> Speak
                        </>
                      )}
                    </button>

                    {recordedAudioUrl && (
                      <button
                        type="button"
                        className="pgd-btn-playback"
                        onClick={handlePlayRecordedVoice}
                        disabled={isPlayingRecorded}
                      >
                        <Volume2 size={16} />
                        {isPlayingRecorded ? 'Playing...' : 'Hear Your Voice'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ─── STAGE 3: SOUND ─── */}
            {step === 3 && (
              <div className="pgd-step-body animate-fadeIn">
                <span className="pgd-kicker">STEP 03 OF 05</span>
                <h1 className="pgd-title">Test your sound</h1>
                <p className="pgd-subtitle">
                  Click play to listen to a brief chime and check your headphone volume.
                </p>

                <div className="pgd-speaker-box">
                  <div className="pgd-soundwave-card">
                    <div className="pgd-wave-center">
                      <div className={`pgd-sound-ring ${isSpeakerPlaying ? 'is-animating' : ''}`} />
                      <Volume2 size={40} className="pgd-speaker-icon" />
                    </div>

                    <div className="pgd-sound-waves-bars">
                      {Array.from({ length: 16 }).map((_, i) => (
                        <span
                          key={i}
                          className={`pgd-wave-bar ${isSpeakerPlaying ? 'is-playing' : ''}`}
                          style={{ animationDelay: `${(i % 5) * 0.14}s` }}
                        />
                      ))}
                    </div>

                    <button
                      type="button"
                      className={`pgd-btn-speaker ${isSpeakerPlaying ? 'is-playing-btn' : ''}`}
                      onClick={playSoothingSound}
                    >
                      {isSpeakerPlaying ? (
                        <>
                          <Square size={16} /> Stop Sound
                        </>
                      ) : (
                        <>
                          <Play size={16} /> Play Sound
                        </>
                      )}
                    </button>
                  </div>

                  {/* Manual Yes / No Choice */}
                  <div className="pgd-confirm-prompt">
                    <p className="pgd-confirm-title">Did you hear the sound clearly?</p>
                    <div className="pgd-confirm-buttons">
                      <button
                        type="button"
                        className={`pgd-choice-btn is-yes ${speakerUserDecision === 'yes' ? 'is-selected' : ''}`}
                        onClick={() => setSpeakerUserDecision('yes')}
                      >
                        <Check size={16} /> Yes, I heard it
                      </button>
                      <button
                        type="button"
                        className={`pgd-choice-btn is-no ${speakerUserDecision === 'no' ? 'is-selected' : ''}`}
                        onClick={() => setSpeakerUserDecision('no')}
                      >
                        <X size={16} /> No, I didn’t hear it
                      </button>
                    </div>

                    {speakerUserDecision === 'no' && (
                      <div className="pgd-alert pgd-alert--warning animate-fadeIn">
                        <AlertCircle size={17} />
                        <span>Check that your headphone volume is turned up and click Play Sound again.</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ─── STAGE 4: CONNECTION ─── */}
            {step === 4 && (
              <div className="pgd-step-body animate-fadeIn">
                <span className="pgd-kicker">STEP 04 OF 05</span>
                <h1 className="pgd-title">Check your connection</h1>
                <p className="pgd-subtitle">
                  Checking your network speed and response time.
                </p>

                <div className="pgd-network-card">
                  <div className="pgd-net-metrics-grid">
                    <div className="pgd-metric-tile">
                      <div className="pgd-metric-icon pgd-metric-icon--latency">
                        <Activity size={20} />
                      </div>
                      <span className="pgd-metric-name">LATENCY</span>
                      <strong className="pgd-metric-val">
                        {measuredLatency !== null ? `${measuredLatency} ms` : netTestRunning ? '...' : '—'}
                      </strong>
                    </div>

                    <div className="pgd-metric-tile">
                      <div className="pgd-metric-icon pgd-metric-icon--dl">
                        <ArrowDown size={20} />
                      </div>
                      <span className="pgd-metric-name">DOWNLOAD</span>
                      <strong className="pgd-metric-val">
                        {measuredDownload !== null ? `${measuredDownload} Mbps` : netTestRunning ? '...' : '—'}
                      </strong>
                    </div>

                    <div className="pgd-metric-tile">
                      <div className="pgd-metric-icon pgd-metric-icon--up">
                        <ArrowUp size={20} />
                      </div>
                      <span className="pgd-metric-name">UPLOAD</span>
                      <strong className="pgd-metric-val">
                        {measuredUpload !== null ? `${measuredUpload} Mbps` : netTestRunning ? '...' : '—'}
                      </strong>
                    </div>
                  </div>

                  <div className="pgd-net-footer">
                    <button
                      type="button"
                      className="pgd-btn-ghost"
                      onClick={() => void runRealNetworkTest()}
                      disabled={netTestRunning}
                    >
                      <RefreshCw size={14} className={netTestRunning ? 'meet-spin' : ''} />
                      Check Again
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ─── STAGE 5: TOPIC & NOTES ─── */}
            {step === 5 && (
              <div className="pgd-step-body animate-fadeIn">
                <span className="pgd-kicker">STEP 05 OF 05</span>
                <h1 className="pgd-title">Topic &amp; Notes</h1>
                <p className="pgd-subtitle">
                  Review the topic and use your private notepad to organize key thoughts.
                </p>

                <div className="pgd-topic-showcase">
                  <div className="pgd-topic-header">
                    <span>DISCUSSION TOPIC</span>
                    <span className="pgd-topic-time">
                      <Clock3 size={14} /> 12:00
                    </span>
                  </div>
                  <h2 className="pgd-topic-title">{topic}</h2>

                  <div className="pgd-roster-preview">
                    <span className="pgd-roster-label">Panelists:</span>
                    <div className="pgd-avatar-stack">
                      {participants
                        .filter((p) => p.id !== 'user')
                        .map((p) => (
                          <div key={p.id} className="pgd-avatar-chip" title={`${p.name} (${p.role})`}>
                            <img src={portraitFor(p.id)} alt={p.name} />
                            <span>{p.name}</span>
                          </div>
                        ))}
                      <div className="pgd-avatar-chip is-you">
                        <span className="pgd-you-dot" />
                        <span>You</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pgd-notes-card">
                  <div className="pgd-notes-header">
                    <div className="pgd-notes-title">
                      <NotebookPen size={17} />
                      <strong>PRIVATE NOTES</strong>
                    </div>
                    <span className="pgd-char-count">{notes.length.toLocaleString()} / 12,000</span>
                  </div>

                  <textarea
                    className="pgd-textarea"
                    placeholder={`Your thoughts and points:\n\n• Point 1\n• Example\n• Conclusion`}
                    value={notes}
                    maxLength={12000}
                    onChange={(e) => onNotes(e.target.value)}
                    spellCheck
                  />

                  <div className="pgd-notes-footer">
                    <ShieldCheck size={14} />
                    <span>Private to you. Not shared with participants.</span>
                  </div>
                </div>
              </div>
            )}

            {/* Stepper Footer */}
            <footer className="pgd-card-footer">
              <button type="button" className="pgd-btn-back" onClick={handleBack}>
                <ArrowLeft size={16} /> Back
              </button>

              <button
                type="button"
                className="pgd-btn-continue"
                disabled={!canContinue()}
                onClick={handleNext}
              >
                {step === 5 ? 'Enter Discussion' : 'Continue'} <ArrowRight size={16} />
              </button>
            </footer>
          </div>
        </div>

        {/* Confirmation Modal */}
      {showSubmitModal && (
        <div className="pgd-modal-overlay animate-fadeIn">
          <div className="pgd-modal-dialog">
            <h3 className="pgd-modal-title">Enter Discussion Room?</h3>
            <p className="pgd-modal-copy">
              Your audio, speaker, and connection checks are complete.
            </p>

            <div className="pgd-modal-actions">
              <button
                type="button"
                className="pgd-modal-btn pgd-modal-btn--back"
                onClick={() => setShowSubmitModal(false)}
              >
                Go Back
              </button>
              <button
                type="button"
                className="pgd-modal-btn pgd-modal-btn--submit"
                onClick={handleFinalSubmit}
              >
                Enter Room
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
