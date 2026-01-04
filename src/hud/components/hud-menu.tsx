import * as React from 'react';

import { Button } from '@/hud/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/hud/ui/dropdown-menu';
import { HUD_PANELS, useHudVisibility } from '@/hud/state/hud-visibility';
import type { HudPanelId } from '@/hud/state/hud-visibility';

const LABELS: Record<(typeof HUD_PANELS)[number], string> = {
  'broker-setup': 'Broker Setup',
  'simulation-controls': 'Simulation Controls',
  'camera-help': 'Camera Help',
  'net-events': 'Net Events',
  'map-creator': 'Map Creator',
  'fleet-creator': 'Fleet Creator',
  'start-simulation': 'Start Simulation',
};

export function HudMenu(): React.ReactNode {
  const { state, setVisible } = useHudVisibility();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" className="pointer-events-auto">
          HUD
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="pointer-events-auto">
        <DropdownMenuLabel>Panels</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {HUD_PANELS.map((id: HudPanelId) => (
          <DropdownMenuCheckboxItem
            key={id}
            checked={!!state[id]}
            onCheckedChange={(v) => setVisible(id, Boolean(v))}
          >
            {LABELS[id]}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
