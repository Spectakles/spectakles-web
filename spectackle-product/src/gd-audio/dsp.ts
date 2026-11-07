// Shared by the AudioWorklet, VAD worker and deterministic Node checks.
export const AUDIO = Object.freeze({
  rate: 16000, frameSamples: 512, frameMs: 32, threshold: 0.9,
  negativeThreshold: 0.75, silenceFrames: 16, preRollFrames: 10,
  maxPendingFrames: 64,
});

export function pcm16(sample: number): number {
  return Math.max(-32768, Math.min(32767, Math.trunc(sample * 32768)));
}

/** Stateful, anti-aliased conversion. Absolute output positions prevent drift
 * at fractional ratios (44.1 kHz); filter history survives render quanta. */
export class Resampler {
  private ring = new Float32Array(4096);
  private kernels: Float64Array[] = [];
  private inputCount = 0;
  private outputCount = 0;
  readonly inputRate: number;

  constructor(inputRate: number) {
    if (!Number.isFinite(inputRate) || inputRate < AUDIO.rate || inputRate > 192000) {
      throw new Error('Microphone sample rate must be between 16 and 192 kHz.');
    }
    this.inputRate = inputRate;
    const cutoff = 0.46 * AUDIO.rate / inputRate;
    for (let phase = 0; phase < 1024; phase++) {
      const kernel = new Float64Array(65);
      let sum = 0;
      for (let tap = -32; tap <= 32; tap++) {
        const x = tap - phase / 1024;
        const sinc = x === 0 ? 2 * cutoff : Math.sin(2 * Math.PI * cutoff * x) / (Math.PI * x);
        const window = 0.42 + 0.5 * Math.cos(Math.PI * x / 33) + 0.08 * Math.cos(2 * Math.PI * x / 33);
        kernel[tap + 32] = sinc * window;
        sum += kernel[tap + 32];
      }
      for (let i = 0; i < kernel.length; i++) kernel[i] /= sum;
      this.kernels.push(kernel);
    }
  }

  reset(): void {
    this.ring.fill(0);
    this.inputCount = 0;
    this.outputCount = 0;
  }

  push(channels: readonly Float32Array[], emit: (sample: number) => void): void {
    if (!channels.length) return;
    for (let i = 0; i < channels[0].length; i++) {
      let mono = 0;
      for (const channel of channels) mono += channel[i] ?? 0;
      mono /= channels.length;
      if (this.inputRate === AUDIO.rate) {
        emit(mono);
        continue;
      }
      this.ring[this.inputCount % this.ring.length] = mono;
      this.inputCount++;
      let position = this.outputCount * this.inputRate / AUDIO.rate;
      while (position + 32 < this.inputCount) {
        const center = Math.floor(position);
        const kernel = this.kernels[Math.floor((position - center) * 1024)];
        let value = 0;
        for (let tap = -32; tap <= 32; tap++) {
          const index = center + tap;
          if (index >= 0) value += this.ring[index % this.ring.length] * kernel[tap + 32];
        }
        emit(value);
        this.outputCount++;
        position = this.outputCount * this.inputRate / AUDIO.rate;
      }
    }
  }
}

/** Deliberately matches gd_engine.audio.SpeechDetector, including the middle
 * probability band not resetting the accumulated low-probability frames. */
export class ReferenceVad {
  triggered = false;
  silenceFrames = 0;
  voicedFrames = 0;

  update(probability: number): 'start' | 'end' | null {
    if (!Number.isFinite(probability) || probability < 0 || probability > 1) {
      throw new Error('Speech detector returned an invalid probability.');
    }
    if (probability >= AUDIO.threshold) {
      this.silenceFrames = 0;
      if (!this.triggered) {
        this.triggered = true;
        this.voicedFrames = 1;
        return 'start';
      }
      this.voicedFrames++;
    } else if (this.triggered && probability < AUDIO.negativeThreshold) {
      this.silenceFrames++;
      if (this.silenceFrames >= AUDIO.silenceFrames) {
        this.triggered = false;
        this.silenceFrames = 0;
        return 'end';
      }
    }
    return null;
  }
}

export type Boundary = {
  type: 'start' | 'end'; id: number; sample: number; startSample: number;
  preRollSamples: number; voicedMs: number; durationMs: number;
  reason: string; incomplete: boolean;
};

export type UtteranceEvent = { type: 'start' | 'end'; boundary: Boundary }
  | { type: 'audio'; id: number; sample: number; pcm: Int16Array };

/** Only a bounded pre-roll is retained; accepted audio is emitted incrementally. */
export class Utterances {
  detector = new ReferenceVad();
  private preRoll: { pcm: Int16Array; sample: number }[] = [];
  private active: Boundary | null = null;
  private nextId = 0;
  private sink: ((event: UtteranceEvent) => void) | undefined;

  constructor(sink?: (event: UtteranceEvent) => void) { this.sink = sink; }

  consume(pcm: Int16Array, probability: number, sample: number): Boundary | null {
    if (pcm.length !== AUDIO.frameSamples) throw new Error('Expected one 512-sample PCM16 frame.');
    this.preRoll.push({ pcm, sample });
    if (this.preRoll.length > AUDIO.preRollFrames) this.preRoll.shift();
    const transition = this.detector.update(probability);
    if (transition === 'start') {
      this.active = {
        type: 'start', id: ++this.nextId, sample, startSample: this.preRoll[0].sample,
        preRollSamples: this.preRoll.length * AUDIO.frameSamples,
        voicedMs: AUDIO.frameMs, durationMs: 0, reason: 'speech', incomplete: false,
      };
      const history = this.preRoll;
      this.preRoll = [];
      this.sink?.({ type: 'start', boundary: { ...this.active } });
      for (const frame of history) this.sink?.({ type: 'audio', id: this.active.id, sample: frame.sample, pcm: frame.pcm });
      return { ...this.active };
    }
    if (this.active) this.sink?.({ type: 'audio', id: this.active.id, sample, pcm });
    if (transition === 'end') return this.finish(sample + pcm.length, 'silence', false);
    return null;
  }

  reset(sample: number, reason: string): Boundary | null {
    const ended = this.finish(sample, reason, true);
    this.detector = new ReferenceVad();
    this.preRoll = [];
    return ended;
  }

  private finish(sample: number, reason: string, incomplete: boolean): Boundary | null {
    const active = this.active;
    this.active = null;
    this.preRoll = [];
    const ended: Boundary | null = active ? {
      ...active, type: 'end', sample, reason, incomplete,
      voicedMs: this.detector.voicedFrames * AUDIO.frameMs,
      durationMs: (sample - active.startSample) * 1000 / AUDIO.rate,
    } : null;
    if (ended) this.sink?.({ type: 'end', boundary: ended });
    return ended;
  }
}
