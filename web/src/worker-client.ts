export type RuntimeState =
  | { status: 'starting' }
  | { status: 'ready'; runtimeInfo: string }
  | { status: 'failed'; message: string };

export type WorkerEvent = {
  kind: 'log' | 'phase' | 'status';
  message: string;
};

export type GenerationOptions = {
  outputFormat: 'word' | 'html';
  fullDocumentation: boolean;
  changesOnly: boolean;
  includeDefaultValues: boolean;
  includeSampleData: boolean;
};

type PendingRequest = {
  resolve: (archive: Uint8Array) => void;
  reject: (error: Error) => void;
};

type WorkerMessage =
  | { type: 'ready'; runtimeInfo: string }
  | { type: 'startup-error'; error: string }
  | { type: 'event'; kind: WorkerEvent['kind']; message: string }
  | { type: 'result'; requestId: string; archive: ArrayBuffer }
  | { type: 'failure'; requestId: string; error: string };

export class PowerDocuWorkerClient {
  private worker: Worker | null = null;
  private pending = new Map<string, PendingRequest>();
  private readyPromise: Promise<void> = Promise.resolve();
  private resolveReady: (() => void) | null = null;
  private rejectReady: ((error: Error) => void) | null = null;
  private requestSequence = 0;

  constructor(
    private readonly onRuntimeState: (state: RuntimeState) => void,
    private readonly onEvent: (event: WorkerEvent) => void,
  ) {
    this.start();
  }

  async generate(file: File, options: GenerationOptions): Promise<Uint8Array> {
    await this.readyPromise;
    if (!this.worker) throw new Error('The local runtime is not available.');

    const requestId = `generation-${++this.requestSequence}`;
    const packageBytes = await file.arrayBuffer();

    return new Promise<Uint8Array>((resolve, reject) => {
      this.pending.set(requestId, { resolve, reject });
      this.worker?.postMessage(
        {
          type: 'generate',
          requestId,
          packageBytes,
          fileName: file.name,
          options,
        },
        [packageBytes],
      );
    });
  }

  cancel(): void {
    this.stop(new Error('Generation cancelled.'));
    this.start();
  }

  dispose(): void {
    this.stop(new Error('The local runtime was closed.'));
  }

  private start(): void {
    this.onRuntimeState({ status: 'starting' });
    this.readyPromise = new Promise<void>((resolve, reject) => {
      this.resolveReady = resolve;
      this.rejectReady = reject;
    });
    void this.readyPromise.catch(() => {
      // A terminated Worker rejects readiness by design; callers still receive
      // the original rejection when they await this.readyPromise.
    });

    const worker = new Worker(new URL('./powerdocu.worker.ts', import.meta.url), {
      type: 'module',
      name: 'powerdocu-local-runtime',
    });
    this.worker = worker;

    worker.addEventListener('message', (event: MessageEvent<WorkerMessage>) => {
      if (this.worker !== worker) return;
      const message = event.data;
      if (message.type === 'ready') {
        this.resolveReady?.();
        this.resolveReady = null;
        this.rejectReady = null;
        this.onRuntimeState({ status: 'ready', runtimeInfo: message.runtimeInfo });
        return;
      }
      if (message.type === 'startup-error') {
        const error = new Error(message.error);
        this.rejectReady?.(error);
        this.rejectReady = null;
        this.onRuntimeState({ status: 'failed', message: message.error });
        return;
      }
      if (message.type === 'event') {
        this.onEvent({ kind: message.kind, message: message.message });
        return;
      }

      const request = this.pending.get(message.requestId);
      if (!request) return;
      this.pending.delete(message.requestId);
      if (message.type === 'result') {
        request.resolve(new Uint8Array(message.archive));
      } else {
        request.reject(new Error(message.error));
      }
    });

    worker.addEventListener('error', (event) => {
      if (this.worker !== worker) return;
      const error = new Error(event.message || 'The local runtime stopped unexpectedly.');
      this.rejectReady?.(error);
      this.rejectReady = null;
      this.rejectPending(error);
      this.onRuntimeState({ status: 'failed', message: error.message });
    });
  }

  private stop(error: Error): void {
    this.worker?.terminate();
    this.worker = null;
    this.rejectReady?.(error);
    this.rejectReady = null;
    this.resolveReady = null;
    this.rejectPending(error);
  }

  private rejectPending(error: Error): void {
    for (const request of this.pending.values()) request.reject(error);
    this.pending.clear();
  }
}
