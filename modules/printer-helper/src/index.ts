import { EventSubscription } from "expo-modules-core";
import PrinterHelperModule from "./PrinterHelperModule";
import { StatusUpdatedEvent, PrinterErrorEvent, PrinterEvent } from "./PrinterHelper.types";

export function scan(): Promise<string> {
  return PrinterHelperModule.scan();
}

export function checkInit(ip: string, model: string): void {
  PrinterHelperModule.checkInit(ip, model);
}

export function printUris(uriList: string): void {
  PrinterHelperModule.printUris(uriList);
}

export function configure(): void {
  PrinterHelperModule.configure();
}

export function getStatus(): string {
  return PrinterHelperModule.getStatus();
}

export function addStatusListener(listener: (event: StatusUpdatedEvent) => void): EventSubscription {
  return PrinterHelperModule.addListener("StatusUpdated", listener);
}

export function addErrorListener(listener: (event: PrinterErrorEvent) => void): EventSubscription {
  return PrinterHelperModule.addListener("onError", listener);
}

export function addEventLogger(listener: (event: PrinterEvent) => void): EventSubscription {
  return PrinterHelperModule.addListener("onEvent", listener);
}

export type { StatusUpdatedEvent, PrinterErrorEvent, PrinterEvent };
