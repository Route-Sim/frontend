import type { ActionEnvelopeOf, ActionName, SignalUnion } from './schema';

export const ActionToSignal = {
  'simulation.start': 'simulation.started',
  'simulation.stop': 'simulation.stopped',
  'simulation.resume': 'simulation.resumed',
  'simulation.pause': 'simulation.paused',
  'simulation.update': 'simulation.updated',
  'simulation.export_state': 'simulation.state_exported',
  'simulation.import_state': 'simulation.state_imported',
  'map.create': 'map.created',
  'map.export': 'map.exported',
  'map.import': 'map.imported',
  'agent.create': 'agent.created',
  'agent.update': 'agent.updated',
  'agent.delete': 'agent.deleted',
  'agent.get': 'agent.state',
  'agent.list': 'agent.listed',
  'agent.describe': 'agent.described',
} as const;

export type ExpectedSignalByAction = typeof ActionToSignal;

export function getDefaultMatcher<A extends ActionName>(
  req: ActionEnvelopeOf<A>,
): (sig: SignalUnion) => boolean {
  const expected = ActionToSignal[req.action];
  return (sig: SignalUnion): boolean => {
    if (req.request_id && sig.request_id && sig.request_id !== req.request_id) {
      return false;
    }
    return sig.signal === expected;
  };
}
