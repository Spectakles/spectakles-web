import type { Boundary } from './dsp';

export type RecordingEvent = { type: 'start' | 'end'; boundary: Boundary }
  | { type: 'audio'; id: number; sample: number; pcm: ArrayBuffer };
export type SavedClip = {
  id: number; order: number; file: string; status: string; incomplete: boolean;
  sample_count: number; duration_ms: number; end_reason: string | null;
  start_sample: number; end_sample: number; pre_roll_samples: number;
};
export type SavedRecording = {
  recording_id: string; directory: string; manifest_url: string; created_at: string;
  status: string; incomplete: boolean; end_reason: string | null; utterances: SavedClip[];
};
export type RecordingSnapshot = {
  phase: 'idle' | 'connecting' | 'recording' | 'saving' | 'saved' | 'error';
  recording: SavedRecording | null; message: string;
};
export const INITIAL_RECORDING: RecordingSnapshot = { phase: 'idle', recording: null, message: '' };
export interface RecordingSink {
  open(device: string): Promise<void>;
  push(event: RecordingEvent): void;
  finish(reason: string, incomplete: boolean): Promise<void>;
}

/** Ordered, bounded transport to the local disk writer. No utterance buffering. */
export class LocalRecording implements RecordingSink {
  private options: {
    url: string; snapshot: (value: RecordingSnapshot) => void; error: (message: string) => void;
    socketFactory?: (url: string) => WebSocket;
    token?: () => Promise<string | undefined>;
  };
  private socket: WebSocket | null = null;
  private value = { ...INITIAL_RECORDING };
  private sequence = 0;
  private acknowledgement = 0;
  private lastReply = 0;
  private pending = new Map<number, { bytes: number; at: number }>();
  private pendingAudio = 0;
  private timer: ReturnType<typeof setInterval> | undefined;
  private openTimer: ReturnType<typeof setTimeout> | undefined;
  private finishTimer: ReturnType<typeof setTimeout> | undefined;
  private rejectOpen: ((error: Error) => void) | undefined;
  private resolveFinish: (() => void) | undefined;
  private rejectFinish: ((error: Error) => void) | undefined;
  private finishPromise: Promise<void> | undefined;
  private expectedClose = false;
  private failed = false;

  constructor(options: LocalRecording['options']) { this.options = options; }

  private publish(patch: Partial<RecordingSnapshot>) {
    this.value = { ...this.value, ...patch };
    this.options.snapshot({ ...this.value });
  }

  private clearTimers() {
    clearInterval(this.timer); clearTimeout(this.openTimer); clearTimeout(this.finishTimer);
  }

  private fail(message: string) {
    if (this.failed || this.expectedClose || this.value.phase === 'saved') return;
    this.failed = true;
    this.clearTimers();
    this.publish({ phase: 'error', message });
    this.rejectOpen?.(new Error(message));
    this.rejectFinish?.(new Error(message));
    this.pending.clear(); this.pendingAudio = 0;
    try { this.socket?.close(4000, 'recording_error'); } catch { /* Already disconnected. */ }
    this.options.error(message);
  }

  open(device: string): Promise<void> {
    this.publish({ phase: 'connecting', message: '' });
    return new Promise<void>((resolve, reject) => {
      this.rejectOpen = reject;
      try {
        this.socket = (this.options.socketFactory ?? ((url) => new WebSocket(url)))(this.options.url);
        this.socket.onopen = async () => {
          if (this.failed || this.expectedClose) return;
          try {
            const idToken = await this.options.token?.();
            if (this.failed || this.expectedClose) return;
            this.socket?.send(JSON.stringify({ type: 'hello', version: 1, device, ...(idToken ? { id_token: idToken } : {}) }));
          }
          catch { this.fail('Could not initialize local recording.'); }
        };
        this.socket.onerror = () => this.fail('Local recording service unavailable. Start the Stage 4 Python backend, then try again.');
        this.socket.onclose = () => {
          if (!this.expectedClose) this.fail('Recording connection lost. Received audio remains on disk; start a new test after the backend recovers.');
        };
        this.socket.onmessage = ({ data }) => {
          if (this.failed || this.expectedClose) return;
          try {
            if (typeof data !== 'string') throw new Error('Invalid recording reply.');
            const message = JSON.parse(data);
            this.lastReply = performance.now();
            if (message.type === 'ready' && this.value.phase === 'connecting') {
              if (!message.recording?.recording_id) throw new Error('Invalid recording identity.');
              clearTimeout(this.openTimer);
              this.rejectOpen = undefined;
              this.publish({ phase: 'recording', recording: message.recording });
              this.timer = setInterval(() => {
                if (performance.now() - this.lastReply > 8000) { this.fail('Local recording service stopped responding. Received audio remains on disk.'); return; }
                const oldest = this.pending.values().next().value;
                if (oldest && performance.now() - oldest.at > 2000) {
                  this.fail('Saving audio fell behind for two seconds. The test stopped; received audio is preserved.');
                  return;
                }
                if (this.socket?.readyState === 1) this.socket.send(JSON.stringify({ type: 'ping' }));
              }, 1000);
              resolve();
            } else if (message.type === 'error') {
              this.fail(message.message || 'The local recording service failed.');
            } else if (message.type === 'ack' || message.type === 'finished') {
              const pending = this.pending.get(message.seq);
              if (!pending || message.seq !== this.acknowledgement + 1) throw new Error('Unexpected recording acknowledgement.');
              this.acknowledgement = message.seq;
              this.pendingAudio -= pending.bytes;
              this.pending.delete(message.seq);
              if (message.utterance && this.value.recording) {
                this.publish({ recording: { ...this.value.recording, utterances: [...this.value.recording.utterances, message.utterance] } });
              }
              if (message.type === 'finished') {
                this.expectedClose = true;
                this.clearTimers();
                this.publish({ phase: 'saved', recording: message.recording });
                this.resolveFinish?.();
                this.socket?.close(1000);
              }
            } else if (message.type !== 'pong') throw new Error('Unknown recording reply.');
          } catch (error) {
            this.fail(error instanceof Error ? error.message : 'Invalid recording reply.');
          }
        };
        this.openTimer = setTimeout(() => this.fail('Local recording setup timed out. Start the Stage 4 backend and try again.'), 5000);
      } catch { this.fail('Could not open the local recording connection. Start the Stage 4 backend and try again.'); }
    });
  }

  private send(command: object | ArrayBuffer, audioBytes = 0): void {
    if (this.failed) return;
    if (this.socket?.readyState !== 1 || this.pendingAudio + audioBytes > 65536
      || this.pending.size >= 96 || this.socket.bufferedAmount > 131072) {
      this.fail('The local audio-saving queue is unavailable or full. The test stopped; received audio is preserved.');
      return;
    }
    this.pending.set(this.sequence, { bytes: audioBytes, at: performance.now() });
    this.pendingAudio += audioBytes;
    try { this.socket.send(command instanceof ArrayBuffer ? command : JSON.stringify({ ...command, seq: this.sequence })); }
    catch { this.fail('Could not send audio to the local recording service.'); }
  }

  push(event: RecordingEvent): void {
    if (this.failed) return;
    if (this.value.phase !== 'recording') { this.fail('Recording is not ready for audio.'); return; }
    this.sequence++;
    if (event.type === 'audio') {
      if (event.pcm.byteLength !== 1024) { this.fail('Recording audio frame has an invalid size.'); return; }
      const packet = new ArrayBuffer(20 + event.pcm.byteLength);
      const view = new DataView(packet);
      view.setUint32(0, 0x34444753, true); // SGD4
      view.setUint32(4, this.sequence, true);
      view.setUint32(8, event.id, true);
      view.setUint32(12, event.sample, true);
      view.setUint32(16, 512, true);
      const samples = new Int16Array(event.pcm);
      for (let i = 0; i < samples.length; i++) view.setInt16(20 + i * 2, samples[i], true);
      this.send(packet, event.pcm.byteLength);
    } else this.send({ ...event.boundary, type: event.type });
  }

  finish(reason: string, incomplete: boolean): Promise<void> {
    if (this.finishPromise) return this.finishPromise;
    if (this.failed) return Promise.reject(new Error(this.value.message));
    if (this.value.phase === 'saved' || this.value.phase === 'idle') return Promise.resolve();
    if (this.value.phase === 'connecting') {
      this.expectedClose = true;
      this.clearTimers();
      this.rejectOpen?.(new Error('Recording setup cancelled.'));
      this.socket?.close(1000);
      this.publish({ phase: 'idle' });
      return Promise.resolve();
    }
    this.finishPromise = new Promise<void>((resolve, reject) => {
      this.resolveFinish = resolve; this.rejectFinish = reject;
      this.publish({ phase: 'saving' });
      this.sequence++;
      this.send({ type: 'finish', reason, incomplete });
      if (!this.failed) this.finishTimer = setTimeout(() => this.fail('Final audio save timed out. Received files are kept; check the saved-test list after recovery.'), 5000);
    });
    return this.finishPromise;
  }
}
