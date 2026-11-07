import type { Boundary } from './dsp';

export type MicrophoneSnapshot = {
  phase: 'idle' | 'starting' | 'listening' | 'muted' | 'resuming' | 'stopping' | 'error';
  message: string; speaking: boolean; probability: number; rms: number;
  frames: number; queue: number; inferenceMs: number; sourceRate: number;
  device: string;
};

export const INITIAL_MICROPHONE: MicrophoneSnapshot = {
  phase: 'idle', message: '', speaking: false, probability: 0, rms: 0,
  frames: 0, queue: 0, inferenceMs: 0, sourceRate: 0, device: '',
};

type Options = {
  createWorker: () => Worker; workletUrl: string; modelUrl: string; runtimeUrl: string;
  // Injection for browser QA; the product always uses getUserMedia below.
  acquireStream?: (constraints: MediaStreamConstraints) => Promise<MediaStream>;
  snapshot: (value: MicrophoneSnapshot) => void;
  boundary: (value: Boundary) => void;
  stopped?: () => void;
  recording?: {
    open: (device: string) => Promise<void>;
    push: (event: import('./recording').RecordingEvent) => void;
    finish: (reason: string, incomplete: boolean) => Promise<void>;
  };
  deviceId?: string;
};

function explain(error: unknown): string {
  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError' || error.name === 'SecurityError') return 'Microphone access was denied. Allow it in the address bar and macOS Privacy & Security, then try again.';
    if (error.name === 'NotFoundError') return 'No microphone was found. Connect one and try again.';
    if (error.name === 'NotReadableError') return 'The microphone could not be opened. Check the device and other audio apps, then try again.';
  }
  return error instanceof Error ? error.message : 'The microphone test stopped unexpectedly. Try again.';
}

/** One start/stop lifetime. A late permission grant is stopped immediately,
 * and every callback is guarded against an old worker or capture generation. */
export class MicrophoneTest {
  private options: Options;
  private value = { ...INITIAL_MICROPHONE };
  private stream: MediaStream | null = null;
  private context: AudioContext | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private node: AudioWorkletNode | null = null;
  private worker: Worker | null = null;
  private closed = false;
  private epoch = 0;
  private watchdog: ReturnType<typeof setInterval> | undefined;
  private startupReject: ((error: Error) => void) | undefined;
  private resetDone: (() => void) | undefined;
  private cleanup: Promise<void> | undefined;
  private lastFrameAt = 0;

  constructor(options: Options) { this.options = options; }
  get isClosed(): boolean { return this.closed; }
  connectPlayback(port: MessagePort) {
    if (this.closed || !this.worker) { port.close(); return; }
    this.worker.postMessage({ type: 'connectPlayback', port }, [port]);
  }

  private publish(patch: Partial<MicrophoneSnapshot>) {
    this.value = { ...this.value, ...patch };
    this.options.snapshot({ ...this.value });
  }

  private onHidden = () => {
    if (document.visibilityState === 'hidden') void this.stop('Microphone test stopped when the tab was hidden. Start it again when ready.');
  };
  private onPageHide = () => { void this.stop(); };
  private onTrackEnded = () => { void this.stop('The microphone disconnected or access was revoked. Check the device, then start again.', true); };
  private onContextState = () => {
    if (!this.closed && this.value.phase !== 'starting' && this.context?.state !== 'running') {
      void this.stop('Browser audio was suspended. Start the microphone test again.', true);
    }
  };

  async start(): Promise<void> {
    this.publish({ phase: 'starting', message: 'Loading speech detection and requesting microphone access…' });
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) throw new Error('Microphone access needs localhost or HTTPS. Open http://127.0.0.1:5173/gd/dev in desktop Chrome.');
      if (!window.AudioContext || !window.AudioWorkletNode || !window.Worker || !window.WebAssembly) throw new Error('This browser does not support the microphone test. Use a current desktop Chrome.');

      const context = new AudioContext({ latencyHint: 'interactive' });
      this.context = context;
      // Called during the Start click, before any await loses user activation.
      const resume = context.resume();
      const constraints: MediaStreamConstraints = {
        audio: { channelCount: { ideal: 1 }, echoCancellation: true, noiseSuppression: true, autoGainControl: true,
          ...(this.options.deviceId ? { deviceId: { exact: this.options.deviceId } } : {}) },
        video: false,
      };
      const acquire = this.options.acquireStream ?? ((value) => navigator.mediaDevices.getUserMedia(value));
      const stream = acquire(constraints).then((result) => {
        if (this.closed) {
          result.getTracks().forEach((track) => track.stop());
          throw new Error('Microphone start cancelled.');
        }
        this.stream = result;
        return result;
      });
      this.worker = this.options.createWorker();
      const ready = new Promise<void>((resolve, reject) => {
        this.startupReject = reject;
        this.worker!.onerror = (event) => {
          event.preventDefault();
          const error = new Error('Speech detection could not load. Restart the test; check that the local model/runtime assets are available.');
          reject(error);
          if (!this.closed) void this.stop(error.message, true);
        };
        this.worker!.onmessageerror = () => { void this.stop('Speech worker communication failed. Start again.', true); };
        this.worker!.onmessage = ({ data }) => {
          if (data.type === 'ready') { resolve(); return; }
          if (data.type === 'error') {
            reject(new Error(data.message));
            if (!this.closed) void this.stop(`Speech detection: ${data.message}`, true);
            return;
          }
          if (data.epoch !== this.epoch) return;
          if (data.type === 'recording') { this.options.recording?.push(data.event); return; }
          if (data.type === 'boundary') this.options.boundary(data.boundary);
          if (data.type === 'drained' || data.type === 'reset-ready') {
            this.resetDone?.();
            this.resetDone = undefined;
            if (!this.closed && this.value.phase === 'resuming') {
              this.node?.port.postMessage({ type: 'resume', epoch: this.epoch });
              this.stream?.getAudioTracks().forEach((track) => { track.enabled = true; });
              this.lastFrameAt = performance.now();
              this.publish({ phase: 'listening', message: '' });
            }
          }
          if (data.type === 'stats' && !this.closed && this.value.phase === 'listening') {
            this.lastFrameAt = performance.now();
            this.publish({
              frames: data.frames, speaking: data.speaking, probability: data.probability,
              rms: data.rms, queue: data.queue, inferenceMs: data.inferenceMs,
            });
          }
        };
      });
      this.worker.postMessage({ type: 'init', modelUrl: this.options.modelUrl, runtimeUrl: this.options.runtimeUrl, recordAudio: !!this.options.recording });
      const deadline = new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new Error('Microphone setup timed out. Dismiss any permission prompt, check permissions, then try again.')), 30000);
      });
      await Promise.race([Promise.all([stream, ready, resume, context.audioWorklet.addModule(this.options.workletUrl)]), deadline]);
      if (this.closed) return;
      if (context.state !== 'running') throw new Error('Browser audio could not start. Click Start microphone test again.');
      const track = this.stream!.getAudioTracks()[0];
      if (!track || track.readyState !== 'live') throw new Error('The microphone is no longer connected. Start again.');
      track.addEventListener('ended', this.onTrackEnded);
      context.addEventListener('statechange', this.onContextState);
      this.source = context.createMediaStreamSource(this.stream!);
      this.node = new AudioWorkletNode(context, 'spectakles-capture', { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [1] });
      this.node.onprocessorerror = () => { void this.stop('Microphone audio processing failed. Start again.', true); };
      this.node.port.onmessage = ({ data }) => {
        if (data.type === 'error') void this.stop(data.message, true);
      };
      const channel = new MessageChannel();
      this.worker.postMessage({ type: 'connect', port: channel.port1 }, [channel.port1]);
      this.node.port.postMessage({ type: 'connect', port: channel.port2 }, [channel.port2]);
      this.node.port.postMessage({ type: 'resume', epoch: this.epoch });
      this.source.connect(this.node);
      this.node.connect(context.destination);
      this.lastFrameAt = performance.now();
      this.publish({ phase: 'listening', message: '', sourceRate: context.sampleRate, device: track.label || 'Default microphone' });
      await this.options.recording?.open(track.label || 'Default microphone');
      document.addEventListener('visibilitychange', this.onHidden);
      window.addEventListener('pagehide', this.onPageHide);
      this.watchdog = setInterval(() => {
        if (!this.closed && ['listening', 'resuming'].includes(this.value.phase) && performance.now() - this.lastFrameAt > 3000) {
          void this.stop('No processed microphone audio arrived for three seconds. Start the test again.', true);
        }
      }, 1000);
    } catch (error) {
      if (!this.closed) await this.stop(explain(error), true);
    } finally {
      clearTimeout(timeout);
      this.startupReject = undefined;
    }
  }

  toggleMute(): void {
    if (this.closed || !['listening', 'muted'].includes(this.value.phase)) return;
    const muting = this.value.phase === 'listening';
    this.epoch++;
    this.stream?.getAudioTracks().forEach((track) => { track.enabled = false; });
    this.node?.port.postMessage({ type: 'pause', epoch: this.epoch });
    this.publish({ phase: muting ? 'muted' : 'resuming', speaking: false, rms: 0, probability: 0, queue: 0 });
    this.lastFrameAt = performance.now();
    this.worker?.postMessage({ type: 'reset', epoch: this.epoch, reason: muting ? 'muted' : 'resumed' });
  }

  stop(message = '', error = false): Promise<void> {
    if (this.cleanup) return this.cleanup;
    this.closed = true;
    this.options.stopped?.();
    clearInterval(this.watchdog);
    this.startupReject?.(new Error('Microphone start cancelled.'));
    this.publish({ phase: 'stopping', speaking: false, rms: 0, probability: 0, queue: 0 });
    document.removeEventListener('visibilitychange', this.onHidden);
    window.removeEventListener('pagehide', this.onPageHide);
    this.stream?.getTracks().forEach((track) => {
      track.removeEventListener('ended', this.onTrackEnded);
      track.stop();
    });
    this.stream = null;
    this.source?.disconnect();
    this.node?.port.postMessage({ type: 'finish', epoch: this.epoch, reason: error ? 'failure' : 'stopped' });
    this.node?.disconnect();
    this.node?.port.close();
    this.source = null;
    this.node = null;
    const context = this.context;
    context?.removeEventListener('statechange', this.onContextState);
    this.context = null;
    this.cleanup = (async () => {
      // Release hardware immediately; allow a bounded final boundary event.
      await Promise.all([
        context?.close().catch(() => undefined),
        new Promise<void>((resolve) => {
          if (!this.worker) return resolve();
          const deadline = setTimeout(resolve, 500);
          this.resetDone = () => { clearTimeout(deadline); resolve(); };
        }),
      ]);
      await this.options.recording?.finish(error ? (message || 'failure') : 'stopped', error).catch(() => undefined);
      if (this.worker) {
        this.worker.onmessage = null;
        this.worker.onerror = null;
        this.worker.terminate();
      }
      this.worker = null;
      this.resetDone = undefined;
      this.publish({ phase: error ? 'error' : 'idle', message });
    })();
    return this.cleanup;
  }
}
