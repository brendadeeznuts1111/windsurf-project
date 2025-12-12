// types/bun-websocket.d.ts - Official Bun WebSocket Type Definitions
// These are the official TypeScript definitions for Bun's WebSocket server API

declare namespace Bun {
  export function serve(params: {
    fetch: (req: Request, server: Server) => Response | Promise<Response>;
    websocket?: {
      message: (ws: ServerWebSocket, message: string | ArrayBuffer | Uint8Array) => void;
      open?: (ws: ServerWebSocket) => void;
      close?: (ws: ServerWebSocket, code: number, reason: string) => void;
      error?: (ws: ServerWebSocket, error: Error) => void;
      drain?: (ws: ServerWebSocket) => void;

      maxPayloadLength?: number; // default: 16 * 1024 * 1024 = 16 MB
      idleTimeout?: number; // default: 120 (seconds)
      backpressureLimit?: number; // default: 1024 * 1024 = 1 MB
      closeOnBackpressureLimit?: boolean; // default: false
      sendPings?: boolean; // default: true
      publishToSelf?: boolean; // default: false

      perMessageDeflate?:
        | boolean
        | {
            compress?: boolean | Compressor;
            decompress?: boolean | Compressor;
          };
    };
  }): Server;
}

declare type Compressor =
  | `"disable"`
  | `"shared"`
  | `"dedicated"`
  | `"3KB"`
  | `"4KB"`
  | `"8KB"`
  | `"16KB"`
  | `"32KB"`
  | `"64KB"`
  | `"128KB"`
  | `"256KB"`;

declare interface Server {
  pendingWebSockets: number;
  publish(topic: string, data: string | ArrayBufferView | ArrayBuffer, compress?: boolean): number;
  upgrade(
    req: Request,
    options?: {
      headers?: HeadersInit;
      data?: any;
    },
  ): boolean;
}

declare interface ServerWebSocket {
  readonly data: any;
  readonly readyState: number;
  readonly remoteAddress: string;
  readonly subscriptions: string[];
  send(message: string | ArrayBuffer | Uint8Array, compress?: boolean): number;
  close(code?: number, reason?: string): void;
  subscribe(topic: string): void;
  unsubscribe(topic: string): void;
  publish(topic: string, message: string | ArrayBuffer | Uint8Array): void;
  isSubscribed(topic: string): boolean;
  cork(cb: (ws: ServerWebSocket) => void): void;
}

// WebSocket ready states
declare const WebSocket: {
  readonly CONNECTING: 0;
  readonly OPEN: 1;
  readonly CLOSING: 2;
  readonly CLOSED: 3;
};

// Export for module usage
export { Compressor, Server, ServerWebSocket };