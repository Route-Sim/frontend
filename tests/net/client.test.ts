import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebSocketClient } from '@/net/client';
import type {
  IWebSocketTransport,
  CloseEventLike,
  ReadyState,
} from '@/net/transport/browser-websocket';

// Mock schema to avoid zod runtime dependency
vi.mock('@/net/protocol/schema', () => {
  const encodeAction = (action: string, params: unknown, request_id?: string) => ({
    action,
    params,
    request_id,
  });
  const decodeSignal = (raw: any) => raw;
  return { encodeAction, decodeSignal };
});

class MockTransport implements IWebSocketTransport {
  readyState: ReadyState = 'idle';
  sent: string[] = [];

  private onOpenCb?: () => void;
  private onCloseCb?: (ev: CloseEventLike) => void;
  private onErrorCb?: (err: unknown) => void;
  private onMessageCb?: (data: string) => void;

  connect() {
    this.readyState = 'connecting';
    setTimeout(() => {
      this.readyState = 'open';
      this.onOpenCb?.();
    }, 0);
  }

  disconnect(code?: number, reason?: string) {
    this.readyState = 'closing';
    setTimeout(() => {
      this.readyState = 'closed';
      this.onCloseCb?.({ code, reason, wasClean: true });
    }, 0);
  }

  send(data: string) {
    this.sent.push(data);
  }

  onOpen(cb: () => void) {
    this.onOpenCb = cb;
    return () => {
      this.onOpenCb = undefined;
    };
  }

  onClose(cb: (ev: CloseEventLike) => void) {
    this.onCloseCb = cb;
    return () => {
      this.onCloseCb = undefined;
    };
  }

  onError(cb: (err: unknown) => void) {
    this.onErrorCb = cb;
    return () => {
      this.onErrorCb = undefined;
    };
  }

  onMessage(cb: (data: string) => void) {
    this.onMessageCb = cb;
    return () => {
      this.onMessageCb = undefined;
    };
  }

  // Test helper
  emitMessage(data: string) {
    this.onMessageCb?.(data);
  }

  emitError(err: unknown) {
    this.onErrorCb?.(err);
  }

  emitClose(ev: CloseEventLike) {
    this.onCloseCb?.(ev);
  }
}

describe('WebSocketClient', () => {
  let transport: MockTransport;
  let client: WebSocketClient;

  beforeEach(() => {
    vi.useFakeTimers();
    transport = new MockTransport();
    client = new WebSocketClient(transport, 5000);
    client.connect();
    vi.runAllTimers(); // finish connection
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should connect transport', () => {
    expect(transport.readyState).toBe('open');
  });

  it('should send actions and resolve response', async () => {
    const promise = client.sendAction('simulation.start', { tick_rate: 60, speed: 1.0 });

    expect(transport.sent.length).toBe(1);
    const sent = JSON.parse(transport.sent[0]);
    expect(sent.action).toBe('simulation.start');
    expect(sent.request_id).toBeDefined();

    // Simulate response
    transport.emitMessage(
      JSON.stringify({
        signal: 'simulation.started',
        data: { tick_rate: 60, speed: 1.0 },
        request_id: sent.request_id,
      }),
    );

    await expect(promise).resolves.toEqual(
      expect.objectContaining({
        signal: 'simulation.started',
      }),
    );
  });

  it('should handle errors in response', async () => {
    const promise = client.sendAction('simulation.start', { tick_rate: 60, speed: 1.0 });
    const sent = JSON.parse(transport.sent[0]);

    transport.emitMessage(
      JSON.stringify({
        signal: 'error',
        data: { code: 'FAIL', message: 'Something wrong' },
        request_id: sent.request_id,
      }),
    );

    await expect(promise).resolves.toEqual(
      expect.objectContaining({
        signal: 'error',
        data: { code: 'FAIL', message: 'Something wrong' },
      }),
    );
  });

  it('should dispatch signals to handlers', () => {
    const handler = vi.fn();
    client.on('agent.created', handler);

    transport.emitMessage(
      JSON.stringify({
        signal: 'agent.created',
        data: {
          id: 'a1',
          kind: 'truck',
          inbox_count: 0,
          outbox_count: 0,
          tags: {},
          max_speed_kph: 10,
          current_speed_kph: 0,
          current_node: null,
          current_edge: null,
          edge_progress_m: 0,
          route: [],
          destination: null,
          route_start_node: null,
          route_end_node: null,
          current_building_id: null,
        },
      }),
    );

    expect(handler).toHaveBeenCalled();
  });

  it('should handle global onAny handlers', () => {
    const handler = vi.fn();
    client.onAny(handler);

    transport.emitMessage(
      JSON.stringify({
        signal: 'simulation.paused',
        data: {},
      }),
    );

    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        signal: 'simulation.paused',
      }),
    );
  });

  it('should cancel pending requests on disconnect', async () => {
    const promise = client.sendAction('simulation.start', { tick_rate: 60, speed: 1.0 });

    client.disconnect();

    await expect(promise).rejects.toThrow('Disconnected');
  });
});
