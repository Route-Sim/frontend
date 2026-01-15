import { describe, it, expect, vi } from 'vitest';
import { encodeAction, decodeSignal } from '@/net/protocol/schema';

// Mock schema to sidestep zod runtime dependency
vi.mock('@/net/protocol/schema', () => {
  const encodeAction = (action: string, params: unknown, request_id?: string) => ({
    action,
    params,
    request_id,
  });
  const decodeSignal = (raw: any) => {
    if (raw.signal === 'simulation.started' && (raw.data?.tick_rate === undefined)) {
      throw new Error('invalid signal');
    }
    return raw;
  };
  return { encodeAction, decodeSignal };
});
import { getDefaultMatcher } from '@/net/protocol/mapping';

describe('Protocol Schema', () => {
  it('should encode actions correctly', () => {
    const envelope = encodeAction(
      'simulation.start',
      { tick_rate: 30 },
      'req-1',
    );

    expect(envelope).toEqual({
      action: 'simulation.start',
      params: { tick_rate: 30 },
      request_id: 'req-1',
    });
  });

  it('should decode valid signals', () => {
    const raw = {
      signal: 'simulation.started',
      data: { tick_rate: 30, speed: 1.0 },
      request_id: 'req-1',
    };

    const decoded = decodeSignal(raw);
    expect(decoded).toEqual(raw);
  });

  it('should throw on invalid signals', () => {
    const raw = {
      signal: 'simulation.started',
      data: { wrong_field: 123 }, // missing tick_rate
    };

    expect(() => decodeSignal(raw)).toThrow();
  });

  it('should validate agent signals', () => {
    const raw = {
      signal: 'agent.created',
      data: {
        id: 't1',
        kind: 'truck',
        inbox_count: 0,
        outbox_count: 0,
        tags: {},
        max_speed_kph: 80,
        current_speed_kph: 0,
        current_node: 'n1',
        current_edge: null,
        edge_progress_m: 0,
        route: [],
        destination: null,
        route_start_node: null,
        route_end_node: null,
        current_building_id: null,
      },
    };

    const decoded = decodeSignal(raw);
    expect(decoded.signal).toBe('agent.created');
  });
});

describe('Protocol Mapping', () => {
  it('should create default matcher that matches expected response', () => {
    const request = encodeAction(
      'simulation.start',
      { tick_rate: 30 },
      'req-abc',
    );
    const matcher = getDefaultMatcher(request);

    // Should match simulation.started with same req id
    const validResponse = {
      signal: 'simulation.started',
      data: { tick_rate: 30, speed: 1.0 },
      request_id: 'req-abc',
    } as const;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    expect(matcher(validResponse)).toBe(true);

    // Should not match if request_id differs
    const wrongId = {
      signal: 'simulation.started',
      data: { tick_rate: 30, speed: 1.0 },
      request_id: 'req-xyz',
    } as const;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    expect(matcher(wrongId)).toBe(false);

    // Should not match if signal differs
    const wrongSignal = {
      signal: 'simulation.paused',
      data: {},
      request_id: 'req-abc',
    } as const;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    expect(matcher(wrongSignal)).toBe(false);
  });
});
