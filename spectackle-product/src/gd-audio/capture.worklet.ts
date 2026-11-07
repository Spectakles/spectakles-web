import { AUDIO, pcm16, Resampler } from './dsp';

declare const sampleRate: number;
declare class AudioWorkletProcessor {
  readonly port: MessagePort;
  constructor();
}
declare function registerProcessor(name: string, processor: typeof AudioWorkletProcessor): void;

class GDCapture extends AudioWorkletProcessor {
  private converter = new Resampler(sampleRate);
  private workerPort: MessagePort | null = null;
  private frame = new Int16Array(AUDIO.frameSamples);
  private offset = 0;
  private pending = 0;
  private sequence = 0;
  private epoch = 0;
  private active = false;

  constructor() {
    super();
    this.port.onmessage = ({ data }) => {
      if (data.type === 'connect') {
        this.workerPort = data.port;
        this.workerPort!.onmessage = ({ data: ack }) => {
          if (ack.type === 'ack' && ack.epoch === this.epoch) this.pending = Math.max(0, this.pending - 1);
        };
        this.workerPort!.start();
      } else if (data.type === 'finish') {
        this.active = false;
        this.workerPort?.postMessage({ type: 'finish', epoch: this.epoch, reason: data.reason });
        this.offset = 0;
      } else if (data.type === 'pause' || data.type === 'resume') {
        this.active = data.type === 'resume';
        this.epoch = data.epoch;
        this.pending = 0;
        this.offset = 0;
        this.converter.reset();
      }
    };
  }

  process(inputs: Float32Array[][]): boolean {
    if (!this.active || !this.workerPort || !inputs[0]?.length) return true;
    this.converter.push(inputs[0], (sample) => {
      if (!this.active) return;
      this.frame[this.offset++] = pcm16(sample);
      if (this.offset !== AUDIO.frameSamples) return;
      if (this.pending >= AUDIO.maxPendingFrames) {
        this.active = false;
        this.port.postMessage({ type: 'error', message: 'Speech processing fell behind. The microphone test stopped; start again.' });
        return;
      }
      const pcm = this.frame.buffer;
      this.workerPort!.postMessage({ type: 'frame', pcm, epoch: this.epoch, sequence: this.sequence++ }, [pcm]);
      this.pending++;
      this.frame = new Int16Array(AUDIO.frameSamples);
      this.offset = 0;
    });
    // The output is intentionally silent. No microphone monitoring/feedback.
    return true;
  }
}

registerProcessor('spectakles-capture', GDCapture);
