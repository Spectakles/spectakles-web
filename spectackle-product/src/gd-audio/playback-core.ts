export const OUTPUT_RATE = 24000;
export const OUTPUT_FRAME = 480;

/** Fixed-size PCM ring. It never advances through silence caused by underflow. */
export class PlaybackQueue {
  private ring = new Int16Array(48000);
  private head = 0;
  private size = 0;
  private fraction = 0;
  private started = false;
  private active = false;
  private sequence = 0;
  private revoked = 0;
  readonly outputRate: number;
  turn = 0;
  received = 0;
  rendered = 0;
  ended = false;
  blocked = false;
  dropped = 0;
  underruns = 0;

  constructor(outputRate: number) {
    if (!Number.isFinite(outputRate) || outputRate < OUTPUT_RATE || outputRate > 192000) throw new Error('Playback needs a 24–192 kHz audio context.');
    this.outputRate = outputRate;
  }

  begin(turn: number): boolean {
    if (!Number.isInteger(turn) || turn <= this.turn || turn <= this.revoked) { this.dropped++; return false; }
    if (this.active && !(this.ended && this.size === 0)) throw new Error('A playback turn is still active.');
    this.turn = turn;
    this.head = this.size = this.fraction = this.sequence = this.received = this.rendered = 0;
    this.started = this.ended = false;
    this.active = !this.blocked;
    if (this.blocked) { this.revoked = turn; return false; }
    return true;
  }

  push(turn: number, sequence: number, offset: number, pcm: Int16Array): boolean {
    if (turn !== this.turn || turn <= this.revoked || !this.active || this.blocked) { this.dropped++; return false; }
    if (this.ended || sequence !== this.sequence || offset !== this.received || pcm.length !== OUTPUT_FRAME) throw new Error('Missing, duplicate or malformed playback audio.');
    if (this.size + pcm.length > this.ring.length) throw new Error('Playback exceeded its two-second buffer bound.');
    for (let i = 0; i < pcm.length; i++) this.ring[(this.head + this.size + i) % this.ring.length] = pcm[i];
    this.size += pcm.length; this.received += pcm.length; this.sequence++;
    return true;
  }

  end(turn: number, total: number): boolean {
    if (turn !== this.turn || turn <= this.revoked || !this.active) { this.dropped++; return false; }
    if (total !== this.received) throw new Error('Playback end does not match received audio.');
    this.ended = true; return true;
  }

  cut(): boolean {
    if (!this.active) return false;
    this.revoked = Math.max(this.revoked, this.turn);
    this.active = false;
    this.size = 0; this.fraction = 0;
    return true;
  }

  render(output: Float32Array): void {
    output.fill(0);
    if (!this.active || this.blocked) return;
    if (!this.started) {
      if (this.size < 2400 && !this.ended) return; // 100 ms startup jitter buffer.
      this.started = true;
    }
    const step = OUTPUT_RATE / this.outputRate;
    for (let i = 0; i < output.length; i++) {
      if (!this.size || (this.size === 1 && this.fraction > 0 && !this.ended)) {
        if (!this.ended) this.underruns++;
        break;
      }
      const a = this.ring[this.head];
      const b = this.size > 1 ? this.ring[(this.head + 1) % this.ring.length] : a;
      output[i] = (a + (b - a) * this.fraction) / 32768;
      this.fraction += step;
      const take = Math.min(Math.floor(this.fraction + 1e-10), this.size);
      this.head = (this.head + take) % this.ring.length;
      this.size -= take; this.rendered += take; this.fraction -= take;
      if (this.size === 0 && this.ended) this.fraction = 0;
    }
  }

  get pending() { return this.size; }
  get done() { return this.active && this.ended && this.size === 0; }
}

export type OutputCheckpoint = { turn: number; rendered: number; frame: number; cut: boolean; done: boolean; dropped: number; underruns: number };

/** Only checkpoints known to have reached the device clock may be acknowledged. */
export class PresentedProgress {
  private points: OutputCheckpoint[] = [];
  add(point: OutputCheckpoint) {
    if (this.points.length >= 128) throw new Error('Playback presentation acknowledgements fell behind.');
    this.points.push(point);
  }
  take(deviceFrame: number): OutputCheckpoint[] {
    const ready: OutputCheckpoint[] = [];
    while (this.points.length && this.points[0].frame <= deviceFrame) ready.push(this.points.shift()!);
    return ready;
  }
}
