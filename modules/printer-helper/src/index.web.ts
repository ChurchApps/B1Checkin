import { EventSubscription } from "expo-modules-core";
import { StatusUpdatedEvent, PrinterErrorEvent, PrinterEvent } from "./PrinterHelper.types";

// Web has no printer hardware; every call is a safe no-op so the app can run
// in a browser (Expo web / Playwright tests) without the native module.
const noSubscription = { remove: () => {} } as EventSubscription;

export function scan(): Promise<string> {
  return Promise.resolve("");
}

export function checkInit(_ip: string, _model: string, _brand: string): void {}

export function printUris(_uriList: string): void {}

export function configure(): void {}

export function getStatus(): string {
  return "";
}

export function addStatusListener(_listener: (event: StatusUpdatedEvent) => void): EventSubscription {
  return noSubscription;
}

export function addErrorListener(_listener: (event: PrinterErrorEvent) => void): EventSubscription {
  return noSubscription;
}

export function addEventLogger(_listener: (event: PrinterEvent) => void): EventSubscription {
  return noSubscription;
}

export type { StatusUpdatedEvent, PrinterErrorEvent, PrinterEvent };
