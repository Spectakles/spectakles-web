/** Display-only browser recognition. It never controls VAD, input or recording. */
export type HumanCaption = { text: string; final: boolean };
type Result = { isFinal: boolean; 0: { transcript: string } };
type Recognition = {
  continuous: boolean; interimResults: boolean; lang: string;
  start(): void; abort(): void;
  onresult: ((event: { resultIndex: number; results: ArrayLike<Result> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};
export type RecognitionConstructor = new () => Recognition;
export class HumanCaptions {
  private recognition: Recognition | null = null;
  private closed = false;
  private restarts = 0;
  private restartTimer: ReturnType<typeof setTimeout> | undefined;
  private options: { create?: RecognitionConstructor; caption: (value: HumanCaption) => void; status: (value: string) => void };
  constructor(options: HumanCaptions['options']) { this.options = options; }
  start(): void {
    if (this.closed || this.recognition) return;
    const browser = globalThis as typeof globalThis & { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };
    const Create = this.options.create ?? browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
    if (!Create) { this.options.status('Browser speech captions are unavailable. Live transcription will appear when received.'); return; }
    const recognition = this.recognition = new Create();
    recognition.continuous = true; recognition.interimResults = true; recognition.lang = 'en-IN';
    recognition.onresult = event => {
      if (this.closed) return;
      this.restarts = 0;
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        this.options.caption({ text: result[0].transcript.trim().slice(0, 4000), final: result.isFinal });
      }
    };
    recognition.onerror = () => {
      if (!this.closed) this.options.status('Browser speech captions stopped. Live transcription remains available.');
      this.close();
    };
    recognition.onend = () => {
      if (this.closed) return;
      if (++this.restarts > 3) {
        this.options.status('Browser speech captions stopped. Live transcription remains available.'); this.close(); return;
      }
      this.restartTimer = setTimeout(() => { if (!this.closed) { try { recognition.start(); } catch { recognition.onerror?.({ error: 'start' }); } } }, 300);
    };
    try { recognition.start(); this.options.status('User captions use browser speech recognition, which may use an online browser service. Live transcription is the fallback.'); }
    catch { recognition.onerror?.({ error: 'start' }); }
  }
  close(): void {
    if (this.closed) return;
    this.closed = true; clearTimeout(this.restartTimer);
    if (this.recognition) {
      this.recognition.onresult = this.recognition.onerror = this.recognition.onend = null;
      try { this.recognition.abort(); } catch { /* Recognition may already have stopped. */ }
      this.recognition = null;
    }
  }
}
