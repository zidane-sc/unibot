declare module 'qrcode-terminal' {
  type ErrorLevel = 'L' | 'M' | 'Q' | 'H';

  interface GenerateOptions {
    small?: boolean;
  }

  type GenerateCallback = (qr: string) => void;

  interface QrCodeTerminalApi {
    generate(text: string, callback?: GenerateCallback): void;
    generate(text: string, options: GenerateOptions, callback?: GenerateCallback): void;
    setErrorLevel(level: ErrorLevel): void;
  }

  const qrcode: QrCodeTerminalApi;

  export = qrcode;
}
