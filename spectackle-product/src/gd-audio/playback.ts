import { PresentedProgress } from './playback-core.ts';
import type { OutputCheckpoint } from './playback-core.ts';

export type PlaybackSnapshot = {
  phase: 'idle' | 'starting' | 'ready' | 'playing' | 'cutting' | 'cut' | 'ended' | 'error';
  connection: string; turn: number; received: number; rendered: number; played: number;
  serverPlayed: number; generated: boolean; floor: string; heard: string[];
  dropped: number; staleProbes: number; underruns: number; message: string;
};
export const INITIAL_PLAYBACK: PlaybackSnapshot = {
  phase: 'idle', connection: '', turn: 0, received: 0, rendered: 0, played: 0,
  serverPlayed: 0, generated: false, floor: 'idle', heard: [], dropped: 0,
  staleProbes: 0, underruns: 0, message: '',
};
type Options = {
  url: string; workletUrl: string; snapshot: (value: PlaybackSnapshot) => void;
  contextFactory?: () => AudioContext; socketFactory?: (url: string) => WebSocket;
  hello?: object | (() => Promise<object>); startupTimeoutMs?: number;
  ready?: (message: Record<string, unknown>) => void;
  message?: (message: Record<string, unknown>) => boolean;
};

/** One connection/context lifetime. No generated-audio estimate advances played. */
export class BrowserPlayback {
  private options: Options;
  private value = { ...INITIAL_PLAYBACK };
  private context: AudioContext | null = null;
  private node: AudioWorkletNode | null = null;
  private socket: WebSocket | null = null;
  private points = new PresentedProgress();
  private timer: ReturnType<typeof setInterval> | undefined;
  private closed = false;
  private readyReject: ((error: Error) => void) | undefined;
  private revoked = 0;
  private sequence = 0;
  private lastReply = 0;
  private lastCheckpoint = 0;
  private lastAdvance = 0;
  private cutAt = 0;
  private speaking = false;
  private cleanup: Promise<void> | undefined;

  constructor(options: Options) { this.options = options; }
  get snapshot() { return { ...this.value }; }
  private publish(patch: Partial<PlaybackSnapshot>) {
    this.value = { ...this.value, ...patch };
    this.options.snapshot({ ...this.value });
  }
  private send(value: object) {
    if (this.closed) return;
    if (this.socket?.readyState !== 1 || this.socket.bufferedAmount > 32768) throw new Error('Playback control connection is unavailable or full.');
    this.socket.send(JSON.stringify({ ...value, connection: this.value.connection }));
  }
  private fail(error: unknown) {
    if (this.closed) return;
    const message = error instanceof Error ? error.message : 'Playback test failed.';
    this.readyReject?.(new Error(message));
    this.publish({ phase: 'error', message });
    void this.close(false);
  }
  private hidden = () => { if (document.visibilityState === 'hidden') void this.close(); };
  private pagehide = () => { void this.close(); };
  private contextChanged = () => {
    if (!this.closed && this.value.phase !== 'starting' && this.context?.state !== 'running') this.fail(new Error('Browser audio was suspended. Start a fresh playback test.'));
  };

  async open(): Promise<void> {
    this.publish({ phase: 'starting', message: 'Opening local playback…' });
    let deadline: ReturnType<typeof setTimeout> | undefined;
    try {
      const context = (this.options.contextFactory ?? (() => new AudioContext({ latencyHint: 'interactive' })))();
      this.context = context;
      const resume = context.resume(); // Preserve Start-click activation.
      await Promise.race([
        Promise.all([resume, context.audioWorklet.addModule(this.options.workletUrl)]),
        new Promise<never>((_, reject) => { deadline = setTimeout(() => reject(new Error('Playback audio setup timed out. Try again.')), 15000); }),
      ]);
      clearTimeout(deadline);
      if (this.closed) return;
      if (context.state !== 'running') throw new Error('Browser audio could not start. Click Start playback test again.');
      this.node = new AudioWorkletNode(context, 'spectakles-playback', { numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [1] });
      this.node.connect(context.destination);
      this.node.onprocessorerror = () => this.fail(new Error('Playback worklet failed. Start a fresh test.'));
      this.node.port.onmessage = ({ data }) => {
        if (this.closed) return;
        try {
          if (data.type === 'error') throw new Error(data.message);
          if (data.type !== 'checkpoint' || data.connection !== this.value.connection || data.turn !== this.value.turn) return;
          // Speech after a fully presented reply must not retroactively cut that reply.
          if (data.cut && !['playing', 'cutting'].includes(this.value.phase)) return;
          this.lastCheckpoint = performance.now();
          this.publish({ rendered: data.rendered, dropped: Math.max(this.value.dropped, data.dropped), underruns: data.underruns });
          if (data.cut && data.turn > this.revoked) {
            this.revoked = data.turn;
            this.cutAt = performance.now();
            this.publish({ phase: 'cutting' });
            this.send({ type: 'interrupt', turn: data.turn, reason: data.reason || 'user_activity' });
          }
          this.points.add(data as OutputCheckpoint);
          this.flush();
        } catch (error) { this.fail(error); }
      };
      const hello = typeof this.options.hello === 'function' ? await this.options.hello() : this.options.hello;
      if (this.closed) return;
      await new Promise<void>((resolve, reject) => {
        this.readyReject = reject;
        deadline = setTimeout(() => this.fail(new Error('Audio connection setup timed out. Check the local backend and provider access.')), this.options.startupTimeoutMs ?? 5000);
        this.socket = (this.options.socketFactory ?? ((url) => new WebSocket(url)))(this.options.url);
        this.socket.binaryType = 'arraybuffer';
        this.socket.onopen = () => {
          if (!this.closed && hello) {
            try { this.socket!.send(JSON.stringify(hello)); }
            catch (error) { this.fail(error); }
          }
        };
        this.socket.onerror = () => this.fail(new Error('Playback backend unavailable. Restart the local Python backend, then try again.'));
        this.socket.onclose = () => { if (!this.closed) this.fail(new Error('Playback connection lost. Audio stopped; start a fresh test.')); };
        this.socket.onmessage = ({ data }) => {
          if (this.closed) return;
          try {
            this.lastReply = performance.now();
            if (data instanceof ArrayBuffer) { this.audio(data); return; }
            const message = JSON.parse(data);
            if (message.type === 'ready') {
              if (this.value.connection || typeof message.connection !== 'string' || message.rate !== 24000) throw new Error('Invalid playback handshake.');
              clearTimeout(deadline); this.readyReject = undefined;
              this.node!.port.postMessage({ type: 'init', connection: message.connection });
              this.publish({ phase: 'ready', connection: message.connection, message: '' }); resolve();
              this.options.ready?.(message);
            } else if (message.type === 'begin' && message.connection === this.value.connection) {
              if (!Number.isInteger(message.turn) || message.turn <= this.value.turn) { this.drop(); return; }
              this.sequence = 0; this.lastCheckpoint = this.lastAdvance = performance.now();
              this.publish({ phase: 'playing', turn: message.turn, received: 0, rendered: 0, played: 0, serverPlayed: 0, generated: false, floor: 'busy', heard: [], message: '' });
              this.node!.port.postMessage(message);
              if (this.speaking) this.interrupt();
            } else if (message.type === 'end') {
              if (message.connection !== this.value.connection || message.turn !== this.value.turn || message.turn <= this.revoked) { this.drop(); return; }
              if (message.total !== this.value.received) throw new Error('Playback finished with missing audio.');
              this.publish({ generated: true }); this.node!.port.postMessage(message);
            } else if (message.type === 'state' && message.connection === this.value.connection && message.turn === this.value.turn) {
              const phase = message.floor === 'free' ? 'ended' : message.floor === 'interrupted' ? 'cut' : this.value.phase;
              this.publish({ phase, floor: message.floor, serverPlayed: message.played, heard: message.heard, generated: message.generated });
            } else if (message.type === 'server_cut' && message.connection === this.value.connection && message.turn === this.value.turn) this.interrupt();
            else if (this.options.message?.(message)) { /* Owned extension protocol, e.g. Live input ACK. */ }
            else if (message.type === 'error') throw new Error(message.message);
            else if (message.type === 'stale_probe') this.publish({ staleProbes: this.value.staleProbes + 1 });
            else if (message.type !== 'pong') throw new Error('Unexpected playback reply.');
          } catch (error) { this.fail(error); }
        };
      });
      if (this.closed) return;
      context.addEventListener('statechange', this.contextChanged);
      document.addEventListener('visibilitychange', this.hidden);
      window.addEventListener('pagehide', this.pagehide);
      let pingAt = 0;
      this.timer = setInterval(() => {
        if (this.closed) return;
        try {
          this.flush();
          const now = performance.now();
          if (now - this.lastReply > 8000) throw new Error('Playback backend stopped responding. Start a fresh test.');
          if (this.value.phase === 'playing' && now - this.lastCheckpoint > 2500) throw new Error('Playback rendering stopped. Start a fresh test.');
          if (this.value.phase === 'playing' && this.value.received > this.value.played && now - this.lastAdvance > 3000) throw new Error('Audio output stopped advancing. Start a fresh test.');
          if (this.value.phase === 'cutting' && now - this.cutAt > 3000) throw new Error('Playback cut could not be confirmed. Audio stopped; start a fresh test.');
          if (now - pingAt >= 1000) { this.send({ type: 'ping' }); pingAt = now; }
        } catch (error) { this.fail(error); }
      }, 20);
    } catch (error) { this.fail(error); throw error; }
    finally { clearTimeout(deadline); }
  }

  private drop() { this.publish({ dropped: this.value.dropped + 1 }); }
  private audio(packet: ArrayBuffer) {
    if (packet.byteLength !== 980) throw new Error('Malformed playback PCM frame.');
    const view = new DataView(packet);
    if (view.getUint32(0, true) !== 0x35444753 || view.getUint32(16, true) !== 480) throw new Error('Unsupported playback format.');
    const turn = view.getUint32(4, true);
    if (turn !== this.value.turn || turn <= this.revoked) { this.drop(); return; }
    const sequence = view.getUint32(8, true), offset = view.getUint32(12, true);
    if (sequence !== this.sequence++ || offset !== this.value.received || offset + 480 - this.value.played > 48000) throw new Error('Playback audio is missing, duplicated or too far ahead.');
    const samples = new Int16Array(480);
    for (let i = 0; i < 480; i++) samples[i] = view.getInt16(20 + i * 2, true);
    this.node!.port.postMessage({ type: 'audio', connection: this.value.connection, turn, sequence, offset, pcm: samples.buffer }, [samples.buffer]);
    this.publish({ received: offset + 480 });
  }

  private flush() {
    if (!this.context || this.closed) return;
    const stamp = this.context.getOutputTimestamp?.();
    // Use only a device-clock lower bound. Never use wall time or received audio.
    const seconds = stamp?.contextTime !== undefined && stamp.contextTime > 0 ? stamp.contextTime
      : Math.max(0, this.context.currentTime - this.context.baseLatency - (this.context.outputLatency || .1) - .02);
    for (const point of this.points.take(Math.floor(seconds * this.context.sampleRate))) {
      if (point.turn !== this.value.turn || point.rendered < this.value.played) continue;
      if (point.rendered > this.value.played) this.lastAdvance = performance.now();
      const changed = point.rendered !== this.value.played;
      this.publish({ played: point.rendered });
      if (point.cut) this.send({ type: 'cut', turn: point.turn, played: point.rendered });
      else if (changed || point.done) this.send({ type: 'progress', turn: point.turn, played: point.rendered });
    }
  }

  play() {
    if (!['ready', 'cut', 'ended'].includes(this.value.phase) || this.speaking || this.closed) return;
    try { this.publish({ phase: 'playing' }); this.lastCheckpoint = this.lastAdvance = performance.now(); this.send({ type: 'play' }); }
    catch (error) { this.fail(error); }
  }
  sendControl(value: object): void {
    try { this.send(value); } catch (error) { this.fail(error); }
  }
  sendInput(packet: ArrayBuffer): void {
    if (this.closed) return;
    try {
      if (this.socket?.readyState !== 1 || this.socket.bufferedAmount > 131072) throw new Error('Live input socket is unavailable or full.');
      this.socket.send(packet);
    } catch (error) { this.fail(error); }
  }
  userActivity(speaking: boolean) {
    this.speaking = speaking;
    this.node?.port.postMessage({ type: 'activity', speaking });
    if (speaking) this.interrupt();
  }
  scheduleIntroductionCut(remainingMs: number | null): void {
    if (!this.context || !this.node || !this.value.turn || this.closed) return;
    const frame = remainingMs === null ? null : Math.floor((this.context.currentTime +
      Math.max(0, remainingMs - this.outputLatencyMs - 100) / 1000) * this.context.sampleRate);
    this.node.port.postMessage({ type: 'deadline', connection: this.value.connection, turn: this.value.turn, frame });
  }
  get outputLatencyMs(): number {
    if (!this.context) return 200;
    const stamp = this.context.getOutputTimestamp?.();
    const deviceLag = stamp && typeof stamp.contextTime === 'number' && stamp.contextTime > 0 ? this.context.currentTime - stamp.contextTime : 0;
    return Math.max(0, deviceLag, this.context.baseLatency + (this.context.outputLatency || .1)) * 1000;
  }
  interrupt(reason = 'user_activity') {
    if (this.closed || !this.value.turn || this.value.turn <= this.revoked || !['playing', 'cutting'].includes(this.value.phase)) return;
    try {
      this.revoked = this.value.turn;
      this.cutAt = performance.now();
      this.node?.port.postMessage({ type: 'interrupt' });
      this.send({ type: 'interrupt', turn: this.value.turn, reason });
      this.publish({ phase: 'cutting' });
    } catch (error) { this.fail(error); }
  }
  createVadPort(): MessagePort | undefined {
    if (!this.node || this.closed) return;
    const channel = new MessageChannel();
    this.node.port.postMessage({ type: 'connectVad', port: channel.port2 }, [channel.port2]);
    return channel.port1;
  }
  close(publish = true): Promise<void> {
    if (this.cleanup) return this.cleanup;
    this.closed = true; clearInterval(this.timer);
    this.readyReject?.(new Error('Playback setup cancelled.'));
    document.removeEventListener('visibilitychange', this.hidden);
    window.removeEventListener('pagehide', this.pagehide);
    this.context?.removeEventListener('statechange', this.contextChanged);
    this.node?.port.postMessage({ type: 'stop' });
    this.node?.disconnect(); this.node?.port.close(); this.node = null;
    try { this.socket?.close(1000, 'test_stopped'); } catch { /* Pending connection. */ }
    const context = this.context; this.context = null;
    this.cleanup = (async () => {
      if (context) await Promise.race([context.close().catch(() => undefined), new Promise<void>((resolve) => setTimeout(resolve, 1000))]);
      if (publish) this.publish({ phase: 'idle', connection: '', floor: 'idle', message: 'Playback test stopped. Start a new test when ready.' });
    })();
    return this.cleanup;
  }
}
