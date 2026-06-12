declare module "@ssxv/node-printer" {
  interface PrinterDevice {
    name: string;
    [key: string]: unknown;
  }

  interface PrintDirectOptions {
    data: string | Buffer;
    printer?: string;
    type?: string;
    success?: () => void;
    error?: (error: unknown) => void;
    [key: string]: unknown;
  }

  const printer: {
    getPrinters(): Promise<PrinterDevice[]> | PrinterDevice[];
    printDirect(options: PrintDirectOptions): void;
    [key: string]: unknown;
  };

  export type PrinterModule = typeof printer;
  export default printer;
}
