import { PlaybackQueue } from './playback-core.ts';
declare const sampleRate: number;
declare const currentFrame: number;
declare class AudioWorkletProcessor { readonly port: MessagePort; constructor(); }
declare function registerProcessor(name: string, processor: typeof AudioWorkletProcessor): void;

class GDPlayback extends AudioWorkletProcessor {
  private queue = new PlaybackQueue(sampleRate);
  private connection = '';
  private failed = false;
  private lastFrame = 0;
  private finalReported = false;
  private lastRendered = 0;
  private lastDropped = 0;
  private vad: MessagePort | null = null;
  constructor() {
    super();
    this.port.onmessage = ({ data }) => {
      try {
        if (data.type === 'init') { this.connection = data.connection; return; }
        if (data.type === 'connectVad') {
          this.vad?.close();
          const vad = data.port as MessagePort;
          this.vad = vad;
          vad.onmessage = ({ data: event }) => {
            if (event.type === 'activity') this.activity(event.speaking);
          };
          vad.start(); return;
        }
        if (data.type === 'activity') { this.activity(data.speaking); return; }
        if (data.type === 'interrupt' || data.type === 'stop') {
          if (this.queue.cut()) this.report(currentFrame, true);
          return;
        }
        if (data.connection !== this.connection || this.failed) return;
        if (data.type === 'begin') {
          this.finalReported = false;
          if (!this.queue.begin(data.turn)) {
            if (this.queue.blocked) this.report(currentFrame, true);
          }
        } else if (data.type === 'audio') this.queue.push(data.turn, data.sequence, data.offset, new Int16Array(data.pcm));
        else if (data.type === 'end') this.queue.end(data.turn, data.total);
      } catch (error) { this.fail(error); }
    };
  }
  private activity(speaking: boolean) {
    this.queue.blocked = speaking;
    if (speaking && this.queue.cut()) this.report(currentFrame, true);
  }
  private fail(error: unknown) {
    this.failed = true; this.queue.cut();
    this.port.postMessage({ type: 'error', message: error instanceof Error ? error.message : String(error) });
  }
  private report(frame: number, cut = false) {
    this.lastFrame = frame;
    this.lastRendered = this.queue.rendered; this.lastDropped = this.queue.dropped;
    this.port.postMessage({ type: 'checkpoint', connection: this.connection, turn: this.queue.turn,
      rendered: this.queue.rendered, frame, cut, done: this.queue.done,
      dropped: this.queue.dropped, underruns: this.queue.underruns });
  }
  process(_inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    const output = outputs[0]?.[0];
    if (!output) return true;
    try {
      this.queue.render(output);
      const end = currentFrame + output.length;
      const changed = this.queue.rendered !== this.lastRendered || this.queue.dropped !== this.lastDropped;
      if (this.queue.turn && ((this.queue.done && !this.finalReported) || (changed && end - this.lastFrame >= sampleRate / 25))) {
        this.report(end);
        if (this.queue.done) this.finalReported = true;
      }
    } catch (error) { this.fail(error); }
    return true;
  }
}
registerProcessor('spectakles-playback', GDPlayback);
