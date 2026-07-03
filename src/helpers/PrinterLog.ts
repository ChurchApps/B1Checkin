import * as PrinterHelper from "printer-helper";

type Listener = (lines: string[]) => void;

/** App-wide printer log that survives screen changes for post-flight inspection. */
class PrinterLogStore {
  private lines: string[] = [];
  private listeners = new Set<Listener>();
  private attached = false;

  add = (message: string) => {
    const time = new Date().toLocaleTimeString();
    this.lines = [...this.lines, `${time}  ${message}`];
    if (this.lines.length > 400) this.lines = this.lines.slice(this.lines.length - 400);
    this.listeners.forEach(l => l(this.lines));
  };

  clear = () => {
    this.lines = [];
    this.listeners.forEach(l => l(this.lines));
  };

  get = () => this.lines;

  subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };

  /** Attach native printer event listeners once, app-wide. Idempotent. */
  attachNativeListeners = () => {
    if (this.attached) return;
    this.attached = true;
    try {
      PrinterHelper.addEventLogger(e => this.add(`[${e.eventType}] ${e.source}: ${e.message}`));
      PrinterHelper.addErrorListener(e => this.add(`ERROR ${e.source}: ${e.message}`));
      PrinterHelper.addStatusListener(e => this.add(`STATUS: ${e.status}`));
    } catch (err) {
      this.add(`Failed to attach printer listeners: ${String(err)}`);
    }
  };
}

export const PrinterLog = new PrinterLogStore();
