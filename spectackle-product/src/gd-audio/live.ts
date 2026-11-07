import { BrowserPlayback, INITIAL_PLAYBACK } from './playback.ts';
import type { PlaybackSnapshot } from './playback.ts';
import type { RecordingEvent } from './recording.ts';
import type { Boundary } from './dsp.ts';

export type LiveSnapshot = {
  phase: 'idle' | 'connecting' | 'listening' | 'awaiting_reply' | 'replying' | 'error';
  message: string; sessionUrl: string; inputFrames: number; inputAcknowledged: number;
  playback: PlaybackSnapshot;
};
export const INITIAL_LIVE: LiveSnapshot = { phase: 'idle', message: '', sessionUrl: '', inputFrames: 0, inputAcknowledged: 0, playback: { ...INITIAL_PLAYBACK } };
type Options = {
  url: string; workletUrl: string; recordingId: string;
  snapshot: (snapshot: LiveSnapshot) => void; error: () => void;
  contextFactory?: () => AudioContext; socketFactory?: (url: string) => WebSocket;
  hello?: object | (() => Promise<object>); acceptInput?: () => boolean;
  message?: (message: Record<string, unknown>) => boolean;
  ready?: (message: Record<string, unknown>) => void; startupMessage?: string;
};

/** Accepted utterances share the recording's exact PCM. No STT controls speech. */
export class NativeLive {
  readonly playback: BrowserPlayback;
  private options: Options;
  private value: LiveSnapshot = { ...INITIAL_LIVE, playback: { ...INITIAL_PLAYBACK } };
  private sequence = 0;
  private acknowledged = 0;
  private pending = new Map<number, { bytes: number; at: number }>();
  private pendingBytes = 0;
  private timer: ReturnType<typeof setInterval> | undefined;
  private ready = false;
  private closed = false;
  private skipping = false;
  private failed = false;
  constructor(options: Options) {
    this.options = options;
    this.playback = new BrowserPlayback({ url: options.url, workletUrl: options.workletUrl,
      contextFactory: options.contextFactory, socketFactory: options.socketFactory,
      hello: options.hello ?? { type: 'hello', version: 1, recording_id: options.recordingId }, startupTimeoutMs: 30000,
      ready: (message) => { this.ready = true; this.publish({ phase: 'listening', message: '', sessionUrl: String(message.session_url || '') }); options.ready?.(message); },
      message: (message) => {
        if (options.message?.(message)) return true;
        if (message.type === 'input_ack') {
          const seq = message.seq as number;
          const pending = this.pending.get(seq);
          if (!pending || seq !== this.acknowledged + 1) { this.fail('Live input acknowledgement was missing or out of order.'); return true; }
          this.acknowledged = seq; this.pending.delete(seq); this.pendingBytes -= pending.bytes;
          this.publish({ inputAcknowledged: seq }); return true;
        }
        if (message.type === 'live_status') { this.publish({ phase: message.status === 'awaiting_reply' ? 'awaiting_reply' : 'listening' }); return true; }
        return false;
      },
      snapshot: (playback) => {
        if (this.closed) return;
        if (playback.phase === 'error') { this.fail(playback.message); return; }
        if (playback.phase === 'idle' && this.ready) { void this.close(); return; }
        const phase = playback.phase === 'playing' ? 'replying'
          : ['cut', 'cutting', 'ended'].includes(playback.phase) ? 'listening' : this.value.phase;
        this.publish({ playback, phase });
      },
    });
  }
  get snapshot() { return this.value; }
  private publish(value: Partial<LiveSnapshot>) { this.value = { ...this.value, ...value }; this.options.snapshot({ ...this.value }); }
  private fail(message: string) {
    if (this.failed || this.closed) return;
    this.failed = true; this.publish({ phase: 'error', message });
    void this.close(false); this.options.error();
  }
  async open(): Promise<void> {
    this.publish({ phase: 'connecting', message: this.options.startupMessage ?? 'Connecting one real Arjun Live session…' });
    try {
      await this.playback.open();
      if (this.closed) return;
      this.timer = setInterval(() => {
        const oldest = this.pending.values().next().value;
        if (oldest && performance.now() - oldest.at > 2200) this.fail('Live audio delivery fell behind. Received recordings remain on this computer; start a fresh test.');
      }, 100);
    } catch (error) { this.fail(error instanceof Error ? error.message : 'Live connection failed.'); }
  }
  push(event: RecordingEvent): void {
    if (this.closed) return;
    if (event.type === 'start') this.skipping = !this.ready || this.options.acceptInput?.() === false;
    if (!this.ready || this.skipping) { if (event.type === 'end') this.skipping = false; return; }
    if (event.type === 'end' && event.boundary.incomplete) { void this.close(); return; }
    const bytes = event.type === 'audio' ? event.pcm.byteLength : 0;
    if (this.pending.size >= 96 || this.pendingBytes + bytes > 65536) { this.fail('Live audio queue filled. Capture stopped; start a fresh test.'); return; }
    const seq = ++this.sequence;
    this.pending.set(seq, { bytes, at: performance.now() }); this.pendingBytes += bytes;
    if (event.type === 'audio') {
      if (bytes !== 1024) { this.fail('Invalid Live audio frame size.'); return; }
      const packet = new ArrayBuffer(1044); const view = new DataView(packet);
      [0x36444753, seq, event.id, event.sample, 512].forEach((value, index) => view.setUint32(index * 4, value, true));
      const samples = new Int16Array(event.pcm);
      for (let i = 0; i < samples.length; i++) view.setInt16(20 + 2 * i, samples[i], true);
      this.playback.sendInput(packet); this.publish({ inputFrames: this.value.inputFrames + 1 });
    } else this.playback.sendControl({ ...event.boundary, type: event.type === 'start' ? 'input_start' : 'input_end', seq });
  }
  boundary(event: Boundary) { if (!this.closed) this.playback.userActivity(event.type === 'start'); }
  createVadPort() { return this.playback.createVadPort(); }
  close(publish = true): Promise<void> {
    if (this.closed) return Promise.resolve();
    this.closed = true; this.ready = false; clearInterval(this.timer);
    this.pending.clear(); this.pendingBytes = 0;
    if (!this.failed) this.playback.sendControl({ type: 'stop' });
    const cleanup = this.playback.close(false);
    if (publish && !this.failed) this.publish({ phase: 'idle', message: 'Live test stopped. Start again for a fresh conversation.' });
    return cleanup;
  }
}
