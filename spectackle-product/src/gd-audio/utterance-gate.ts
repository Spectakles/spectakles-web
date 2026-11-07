import type { RecordingEvent } from './recording';

/** Never admit the tail of speech that began before the GD accepted input. */
export class UtteranceGate {
  private accepted = false;
  accept(event: RecordingEvent, enabled: boolean): boolean {
    if (event.type === 'start') this.accepted = enabled;
    const accepted = this.accepted;
    if (event.type === 'end') this.accepted = false;
    return accepted;
  }
}
