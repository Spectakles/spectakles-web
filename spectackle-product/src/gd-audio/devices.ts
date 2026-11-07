export type MicrophoneDevice = { deviceId: string; label: string };
export type DeviceListSnapshot = {
  devices: MicrophoneDevice[]; loading: boolean; error: string; hasLabels: boolean;
};
export const INITIAL_DEVICE_LIST: DeviceListSnapshot = {
  devices: [], loading: false, error: '', hasLabels: false,
};

type DeviceSource = Pick<MediaDevices, 'enumerateDevices' | 'addEventListener' | 'removeEventListener'>;

/** Device discovery never opens a stream or requests permission. Each result
 * belongs to its current refresh; late results cannot overwrite newer devices. */
export class MicrophoneDeviceList {
  private source: DeviceSource | undefined;
  private listener: (value: DeviceListSnapshot) => void;
  private value = { ...INITIAL_DEVICE_LIST };
  private generation = 0;
  private closed = false;
  private changed = () => { void this.refresh(); };

  constructor(source: DeviceSource | undefined, listener: (value: DeviceListSnapshot) => void) {
    this.source = source;
    this.listener = listener;
  }

  async start(): Promise<void> {
    this.source?.addEventListener('devicechange', this.changed);
    await this.refresh();
  }

  async refresh(): Promise<void> {
    if (this.closed) return;
    const generation = ++this.generation;
    const publish = (patch: Partial<DeviceListSnapshot>) => {
      if (this.closed || generation !== this.generation) return;
      this.value = { ...this.value, ...patch };
      this.listener({ ...this.value });
    };
    if (!this.source?.enumerateDevices) {
      publish({ loading: false, error: 'This browser cannot list microphones. You can still try the system default.' });
      return;
    }
    publish({ loading: true, error: '' });
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      const devices = await Promise.race([
        this.source.enumerateDevices(),
        new Promise<never>((_, reject) => {
          timeout = setTimeout(() => reject(new Error('Device discovery timed out.')), 4000);
        }),
      ]);
      const inputs = devices.filter((device) => device.kind === 'audioinput');
      const seen = new Set<string>();
      const microphones: MicrophoneDevice[] = [];
      for (const device of inputs) {
        if (!device.deviceId || device.deviceId === 'default' || seen.has(device.deviceId)) continue;
        seen.add(device.deviceId);
        microphones.push({ deviceId: device.deviceId, label: device.label || `Microphone ${microphones.length + 1}` });
      }
      publish({ devices: microphones, hasLabels: inputs.some((device) => !!device.label), loading: false });
    } catch {
      publish({ loading: false, error: 'Could not refresh microphones. Try Refresh devices; the system default is still available.' });
    } finally { clearTimeout(timeout); }
  }

  close(): void {
    this.closed = true;
    this.generation++;
    this.source?.removeEventListener('devicechange', this.changed);
  }
}

/** Explicit permission probe for a device picker; no recording or provider use.
 * Even a permission grant arriving after timeout must release every track. */
export class MicrophonePermission {
  private closed = false;
  private busy = false;
  constructor(private acquire: () => Promise<MediaStream>, private changed: (busy: boolean, error: string) => void) {}
  async request(): Promise<boolean> {
    if (this.busy || this.closed) return false;
    this.busy = true; this.changed(true, '');
    let expired = false;
    let failure = '';
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const probe = this.acquire().then(stream => {
        stream.getTracks().forEach(track => track.stop());
        if (expired || this.closed) return false;
        return true;
      });
      return await Promise.race([probe, new Promise<boolean>((_, reject) => {
        timer = setTimeout(() => { expired = true; reject(new Error('Microphone permission timed out. Dismiss the browser prompt, then try again.')); }, 30000);
      })]);
    } catch (error) {
      failure = error instanceof DOMException && error.name === 'NotAllowedError'
        ? 'Allow microphone access in this site’s address-bar permissions and macOS Privacy & Security → Microphone.'
        : error instanceof Error ? error.message : 'Microphone access could not be requested.';
      if (!this.closed) this.changed(false, failure);
      return false;
    } finally { clearTimeout(timer); this.busy = false; if (!this.closed) this.changed(false, failure); }
  }
  close() { this.closed = true; }
}
