import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { Map, Truck, Handshake, Play, Upload } from 'lucide-react';
import {
  HudVisibilityProvider,
  useHudVisibility,
} from './state/hud-visibility';
import {
  PlaybackStateProvider,
  usePlaybackState,
} from './state/playback-state';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { SimulationControls } from './containers/simulation-controls';
import { CameraHelp } from './containers/camera-help';
import { HudMenu } from './components/hud-menu';
import { usePlaybackNetController } from './hooks/use-playback-controller';
import { useHudHotkeys } from './hooks/use-hud-hotkeys';
import { NetEventsPanel } from './containers/net-events';
import { MapCreator } from './containers/map-creator';
import { FleetCreator } from './containers/fleet-creator';
import { BrokerSetup } from './containers/broker-setup';
import { StateImporter } from './containers/state-importer';
import { StartSimulation } from './containers/start-simulation';
import { FocusInspector } from './containers/focus-inspector';
import { ObjectPicker } from './containers/object-picker';
import { SimulationClock } from './containers/simulation-clock';
import { SimStore } from '@/sim';
import { SimStoreProvider } from './state/sim-context';

export type HudHandle = {
  element: HTMLDivElement;
  show(): void;
  hide(): void;
  toggle(): void;
  destroy(): void;
};

function HudHotkeysMount() {
  useHudHotkeys();
  return null;
}

function HudRoot({ store }: { store: SimStore }) {
  const playbackController = usePlaybackNetController();
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    >
      <SimStoreProvider store={store}>
        <PlaybackStateProvider>
          <HudVisibilityProvider>
            <HudHotkeysMount />
            <PlaybackVisibilityManager />
            <CreatorPanels controller={playbackController} />
            <SimulationPanels controller={playbackController} />
          </HudVisibilityProvider>
        </PlaybackStateProvider>
      </SimStoreProvider>
    </div>
  );
}

function PlaybackVisibilityManager() {
  const { status } = usePlaybackState();
  const { setVisible } = useHudVisibility();

  // Hide all panels except Map/Fleet Creator/Start Simulation when simulation hasn't started (idle/stopped)
  // Show them when simulation is playing or paused
  React.useEffect(() => {
    const isSimulationActive = status === 'playing' || status === 'paused';
    setVisible('simulation-controls', isSimulationActive);
    setVisible('camera-help', isSimulationActive);
    setVisible('net-events', isSimulationActive);
  }, [status, setVisible]);

  return null;
}

function SimulationPanels({
  controller,
}: {
  controller?: ReturnType<typeof usePlaybackNetController>;
}) {
  const { status } = usePlaybackState();
  const { isVisible } = useHudVisibility();

  // Only render simulation panels when simulation is active
  if (status === 'idle' || status === 'stopped') return null;

  return (
    <>
      {/* Top-center clock */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2">
        <SimulationClock />
      </div>

      <div className="fixed top-4 bottom-4 left-4 flex flex-col gap-4">
        {isVisible('simulation-controls') && <SimulationControls controller={controller} />}
        {isVisible('camera-help') && <CameraHelp />}
        {isVisible('net-events') && (
          <div className="flex-1 min-h-0">
            <NetEventsPanel />
          </div>
        )}
      </div>

      <div className="fixed top-4 bottom-4 right-4 flex flex-col gap-4 w-">
        <ObjectPicker />
        <div className="flex-1 min-h-0">
          <FocusInspector />
        </div>
      </div>

      <div className="fixed bottom-4 left-1/2 -translate-x-1/2">
        <HudMenu />
      </div>
    </>
  );
}

function CreatorPanels({
  controller,
}: {
  controller?: ReturnType<typeof usePlaybackNetController>;
}): React.ReactNode {
  const { status } = usePlaybackState();
  const [activeTab, setActiveTab] = React.useState('map');

  // Only render creator panels when idle or stopped
  if (status === 'playing' || status === 'paused') return null;

  return (
    <div className="fixed inset-0 bg-gray-50 p-4">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex h-full flex-col"
      >
        <TabsList className="pointer-events-auto mx-auto w-fit shrink-0 bg-white/90 shadow-md backdrop-blur-sm">
          <TabsTrigger value="map" className="gap-1.5">
            <Map className="h-4 w-4" />
            Map
          </TabsTrigger>
          <TabsTrigger value="fleet" className="gap-1.5">
            <Truck className="h-4 w-4" />
            Fleet
          </TabsTrigger>
          <TabsTrigger value="broker" className="gap-1.5">
            <Handshake className="h-4 w-4" />
            Broker
          </TabsTrigger>
          <TabsTrigger value="load" className="gap-1.5">
            <Upload className="h-4 w-4" />
            Load State
          </TabsTrigger>
          <TabsTrigger value="simulation" className="gap-1.5">
            <Play className="h-4 w-4" />
            Simulation
          </TabsTrigger>
        </TabsList>
        {/* Use forceMount + hidden to preserve state across tab switches */}
        <TabsContent
          value="map"
          forceMount
          className="mt-4 min-h-0 flex-1 data-[state=inactive]:hidden"
        >
          <MapCreator className="h-full" />
        </TabsContent>
        <TabsContent
          value="fleet"
          forceMount
          className="mt-4 min-h-0 flex-1 data-[state=inactive]:hidden"
        >
          <FleetCreator className="h-full" />
        </TabsContent>
        <TabsContent
          value="broker"
          forceMount
          className="mt-4 min-h-0 flex-1 data-[state=inactive]:hidden"
        >
          <BrokerSetup className="h-full" />
        </TabsContent>
        <TabsContent
          value="load"
          forceMount
          className="mt-4 min-h-0 flex-1 data-[state=inactive]:hidden"
        >
          <StateImporter className="h-full" />
        </TabsContent>
        <TabsContent
          value="simulation"
          forceMount
          className="mt-4 min-h-0 flex-1 data-[state=inactive]:hidden"
        >
          <StartSimulation controller={controller} className="h-full" />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function mountHud(
  root: HTMLElement = document.body,
  store: SimStore,
): HudHandle {
  const container = document.createElement('div');
  root.appendChild(container);
  const reactRoot = createRoot(container);
  reactRoot.render(<HudRoot store={store} />);

  const handle: HudHandle = {
    element: container,
    show() {
      container.style.display = 'block';
    },
    hide() {
      container.style.display = 'none';
    },
    toggle() {
      container.style.display =
        container.style.display === 'none' ? 'block' : 'none';
    },
    destroy() {
      reactRoot.unmount();
      container.remove();
    },
  };

  return handle;
}
