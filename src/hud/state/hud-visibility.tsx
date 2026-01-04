import * as React from 'react';

export type HudPanelId =
  | 'start-simulation'
  | 'map-creator'
  | 'fleet-creator'
  | 'broker-setup'
  | 'state-importer'
  | 'simulation-controls'
  | 'camera-help'
  | 'net-events';

export type HudVisibilityState = Record<HudPanelId, boolean>;

const HUD_VISIBILITY_STORAGE_KEY = 'hud:panels:v1';

export const HUD_PANELS: HudPanelId[] = [
  'simulation-controls',
  'camera-help',
  'net-events',
];

const defaultVisibility: HudVisibilityState = {
  'start-simulation': true,
  'map-creator': true,
  'fleet-creator': true,
  'broker-setup': true,
  'state-importer': true,
  'simulation-controls': true,
  'camera-help': true,
  'net-events': false,
};

type HudVisibilityContextValue = {
  state: HudVisibilityState;
  isVisible(id: HudPanelId): boolean;
  setVisible(id: HudPanelId, visible: boolean): void;
  toggle(id: HudPanelId): void;
};

const HudVisibilityContext =
  React.createContext<HudVisibilityContextValue | null>(null);

function readPersistedVisibility(): HudVisibilityState {
  try {
    const raw = localStorage.getItem(HUD_VISIBILITY_STORAGE_KEY);
    if (!raw) return { ...defaultVisibility };
    const parsed = JSON.parse(raw) as Partial<HudVisibilityState>;
    return { ...defaultVisibility, ...parsed } satisfies HudVisibilityState;
  } catch {
    return { ...defaultVisibility };
  }
}

function persistVisibility(state: HudVisibilityState): void {
  try {
    localStorage.setItem(HUD_VISIBILITY_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage failures
  }
}

export function HudVisibilityProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const [state, setState] = React.useState<HudVisibilityState>(() =>
    readPersistedVisibility(),
  );

  React.useEffect(() => {
    persistVisibility(state);
  }, [state]);

  const setVisible = React.useCallback((id: HudPanelId, visible: boolean) => {
    setState((prev) => {
      if (prev[id] === visible) return prev;
      const next = { ...prev, [id]: visible } as HudVisibilityState;
      return next;
    });
  }, []);

  const toggle = React.useCallback((id: HudPanelId) => {
    setState((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const isVisible = React.useCallback((id: HudPanelId) => !!state[id], [state]);

  const ctx: HudVisibilityContextValue = React.useMemo(
    () => ({ state, isVisible, setVisible, toggle }),
    [state, isVisible, setVisible, toggle],
  );

  return (
    <HudVisibilityContext.Provider value={ctx}>
      {children}
    </HudVisibilityContext.Provider>
  );
}

export function useHudVisibility(): HudVisibilityContextValue {
  const ctx = React.useContext(HudVisibilityContext);
  if (!ctx) throw new Error('useHudVisibility must be used within provider');
  return ctx;
}
