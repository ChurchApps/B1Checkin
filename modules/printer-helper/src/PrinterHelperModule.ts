import { NativeModule, requireNativeModule } from "expo";
import { PrinterHelperModuleEvents } from "./PrinterHelper.types";

declare class PrinterHelperModule extends NativeModule<PrinterHelperModuleEvents> {
  scan(): Promise<string>;
  checkInit(ip: string, model: string): void;
  printUris(uriList: string): void;
  configure(): void;
  getStatus(): string;
}

export default requireNativeModule<PrinterHelperModule>("PrinterHelper");
