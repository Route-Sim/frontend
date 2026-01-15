import { describe, it, expect } from 'vitest';
import { createDefaultReducerRegistry } from '@/sim/store/reducers';
import { createEmptySnapshot } from '@/sim/store/snapshot';
import { asAgentId, asTruckId } from '@/sim/domain/ids';
import type { SimDraft } from '@/sim/store/snapshot';

describe('Sim Reducers', () => {
  const registry = createDefaultReducerRegistry();

  it('should handle agent.created', () => {
    const draft: SimDraft = createEmptySnapshot();
    const id = asAgentId('a1');
    
    registry.dispatch(draft, {
      type: 'agent.created',
      agent: { id },
    });

    expect(draft.agents[id]).toBeDefined();
  });

  it('should handle agent.updated', () => {
    const draft: SimDraft = createEmptySnapshot();
    const id = asAgentId('a1');
    draft.agents[id] = { id };

    registry.dispatch(draft, {
      type: 'agent.updated',
      id,
      patch: { someProp: 123 }, // generic agent update
    });

    expect((draft.agents[id] as any).someProp).toBe(123);
  });

  it('should handle agent.deleted', () => {
    const draft: SimDraft = createEmptySnapshot();
    const id = asAgentId('a1');
    draft.agents[id] = { id };

    registry.dispatch(draft, {
      type: 'agent.deleted',
      id,
    });

    expect(draft.agents[id]).toBeUndefined();
  });

  it('should handle truck updates via truck.updated', () => {
    const draft: SimDraft = createEmptySnapshot();
    const id = asTruckId('t1');
    // Create truck stub
    draft.trucks[id] = { id, currentSpeed: 0 } as any;

    registry.dispatch(draft, {
      type: 'truck.updated',
      id: asAgentId(id),
      patch: { currentSpeed: 50 },
    });

    expect(draft.trucks[id].currentSpeed).toBe(50);
  });
});

