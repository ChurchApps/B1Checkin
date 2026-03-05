export type StatusUpdatedEvent = {
  status: string;
};

export type PrinterErrorEvent = {
  source: string;
  message: string;
};

export type PrinterEvent = {
  eventType: string;
  source: string;
  message: string;
};

export type PrinterHelperModuleEvents = {
  StatusUpdated: (params: StatusUpdatedEvent) => void;
  onError: (params: PrinterErrorEvent) => void;
  onEvent: (params: PrinterEvent) => void;
};
