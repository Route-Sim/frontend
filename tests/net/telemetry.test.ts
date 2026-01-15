import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { wireNetTelemetry, netTelemetry } from '@/net/telemetry';
import { InstrumentedTransport } from '@/net/transport/instrumented-transport';
import { WebSocketClient } from '@/net/client';
import type { IWebSocketTransport, ReadyState } from '@/net/transport/browser-websocket';
import type { SignalUnion } from '@/net/protocol/schema';

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
  private onMessageCb?: (data: string) => void;
  
  connect() { this.readyState = 'connecting'; }
  disconnect() { this.readyState = 'closed'; }
  send(_data: string) {}
  
  onOpen(cb: () => void) { return () => {}; }
  onClose(cb: (ev: any) => void) { return () => {}; }
  onError(cb: (err: any) => void) { return () => {}; }
  onMessage(cb: (data: string) => void) { 
    this.onMessageCb = cb; 
    return () => { this.onMessageCb = undefined; }; 
  }

  // Helper to simulate incoming message
  emitMessage(data: string) {
    this.onMessageCb?.(data);
  }

  // Helper mocks for other events needed for tests
  emitOpen() { /* no-op for this mock unless we store handler */ }
  emitClose(ev: any) { /* no-op */ }
  emitError(err: any) { /* no-op */ }
}

describe('Net Telemetry', () => {
  let mockTransport: MockTransport;
  let instrumented: InstrumentedTransport;
  let client: WebSocketClient;

  beforeEach(() => {
    vi.useFakeTimers();
    mockTransport = new MockTransport();
    
    // We need a more robust mock to capture all handlers for the 'emit' tests
    // So let's override the methods to capture handlers
    const captureOpen = vi.fn();
    const captureClose = vi.fn();
    const captureError = vi.fn();
    
    mockTransport.onOpen = (cb) => { captureOpen(cb); return () => {}; };
    mockTransport.onClose = (cb) => { captureClose(cb); return () => {}; };
    mockTransport.onError = (cb) => { captureError(cb); return () => {}; };
    
    // Attach emitters to the instance so we can call them
    mockTransport.emitOpen = () => captureOpen.mock.lastCall?.[0]?.();
    mockTransport.emitClose = (ev) => captureClose.mock.lastCall?.[0]?.(ev);
    mockTransport.emitError = (err) => captureError.mock.lastCall?.[0]?.(err);

    instrumented = new InstrumentedTransport(mockTransport);
    client = new WebSocketClient(instrumented);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should emit connection events', () => {
    const handler = vi.fn();
    netTelemetry.on('event', handler);
    
    wireNetTelemetry(client, instrumented);

    // Connect
    instrumented.connect();
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({
      dir: 'conn',
      kind: 'connecting'
    }));

    // Open
    mockTransport.emitOpen();
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({
      dir: 'conn',
      kind: 'open'
    }));

    // Error
    mockTransport.emitError(new Error('Test error'));
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({
      dir: 'conn',
      kind: 'error',
      info: expect.objectContaining({ message: 'Test error' })
    }));

    // Close
    mockTransport.emitClose({ code: 1000, reason: 'Normal' });
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({
      dir: 'conn',
      kind: 'close',
      info: expect.objectContaining({ code: 1000 })
    }));
  });

  it('should emit outgoing events', () => {
    const handler = vi.fn();
    netTelemetry.on('event', handler);
    
    wireNetTelemetry(client, instrumented);

    const payload = JSON.stringify({
      action: 'simulation.start',
      params: { tick_rate: 60 },
      request_id: 'req-1'
    });

    instrumented.send(payload);

    expect(handler).toHaveBeenCalledWith(expect.objectContaining({
      dir: 'out',
      kind: 'outgoing',
      text: payload,
      action: 'simulation.start',
      request_id: 'req-1'
    }));
  });

  it('should emit incoming signal events', () => {
    const handler = vi.fn();
    netTelemetry.on('event', handler);
    
    wireNetTelemetry(client, instrumented);
    client.connect(); // Wire client to transport

    const signal: SignalUnion = {
      signal: 'simulation.started',
      data: { tick_rate: 60, speed: 1.0 },
      request_id: 'req-1'
    };

    mockTransport.emitMessage(JSON.stringify(signal));

    expect(handler).toHaveBeenCalledWith(expect.objectContaining({
      dir: 'in',
      kind: 'incoming-signal',
      signal: expect.objectContaining({ signal: 'simulation.started' })
    }));
  });
});
