import * as React from 'react';
import { Pause, Play, Square } from 'lucide-react';
import { HudContainer } from '@/hud/components/hud-container';
import { Button } from '@/hud/ui/button';
import { Input } from '@/hud/ui/input';
import { Label } from '@/hud/ui/label';
import { Slider } from '@/hud/ui/slider';
import { usePlaybackState } from '@/hud/state/playback-state';
import { net } from '@/net';
import type {
  PlaybackCommand,
  PlaybackController,
  PlaybackState,
  PlaybackStatus,
} from '@/hud/api/playback';

const TICK_RATE_STORAGE_KEY = 'hud:tickRate';
const SPEED_STORAGE_KEY = 'hud:speed';

function readInitialTickRate(): number {
  try {
    const raw = localStorage.getItem(TICK_RATE_STORAGE_KEY);
    const parsed = raw ? Number(raw) : NaN;
    if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 100) return parsed;
  } catch {}
  return 30;
}

function readInitialSpeed(): number {
  try {
    const raw = localStorage.getItem(SPEED_STORAGE_KEY);
    const parsed = raw ? Number(raw) : NaN;
    if (Number.isFinite(parsed) && parsed >= 0.1 && parsed <= 10.0)
      return parsed;
  } catch {}
  return 1.0;
}

function persistTickRate(hz: number): void {
  try {
    localStorage.setItem(TICK_RATE_STORAGE_KEY, String(hz));
  } catch {}
}

function persistSpeed(speed: number): void {
  try {
    localStorage.setItem(SPEED_STORAGE_KEY, String(speed));
  } catch {}
}

type SimulationControlsProps = {
  controller?: PlaybackController;
};

export function SimulationControls({
  controller,
}: SimulationControlsProps): React.ReactNode {
  const { status: globalStatus, setStatus: setGlobalStatus } =
    usePlaybackState();

  const initial: PlaybackState = {
    status: globalStatus ?? controller?.initialState?.status ?? 'idle',
    tickRate: controller?.initialState?.tickRate ?? readInitialTickRate(),
    speed: controller?.initialState?.speed ?? readInitialSpeed(),
  };

  const [status, setStatus] = React.useState<PlaybackStatus>(initial.status);
  const [tickRate, setTickRate] = React.useState<number>(initial.tickRate);
  const [dragTickRate, setDragTickRate] = React.useState<number | null>(null);
  const [speed, setSpeed] = React.useState<number>(initial.speed);
  const [dragSpeed, setDragSpeed] = React.useState<number | null>(null);
  const [exporting, setExporting] = React.useState<boolean>(false);
  const [exportFilename, setExportFilename] = React.useState<string>('save_0');
  const sink = controller?.commandSink;

  // Sync local status with global playback state
  React.useEffect(() => {
    setGlobalStatus(status);
  }, [status, setGlobalStatus]);

  // Sync global status to local when it changes externally (e.g., from StartSimulation)
  React.useEffect(() => {
    if (globalStatus !== status) {
      setStatus(globalStatus);
    }
  }, [globalStatus]);

  const commitUpdate = React.useCallback(
    (tickRate: number, speed: number) => {
      const clampedTickRate = Math.max(1, Math.min(100, Math.round(tickRate)));
      const clampedSpeed = Math.max(0, Math.min(10, speed));

      setTickRate(clampedTickRate);
      persistTickRate(clampedTickRate);
      setSpeed(clampedSpeed);
      persistSpeed(clampedSpeed);

      const cmd: PlaybackCommand = {
        type: 'update',
        tickRate: clampedTickRate,
        speed: clampedSpeed,
      };
      sink?.(cmd);
    },
    [sink],
  );

  const issue = React.useCallback(
    (cmd: PlaybackCommand) => {
      sink?.(cmd);
      switch (cmd.type) {
        case 'resume':
          setStatus('playing');
          break;
        case 'pause':
          setStatus('paused');
          break;
        case 'stop':
          setStatus('idle');
          break;
        case 'update':
          // handled by commitUpdate
          break;
      }
    },
    [sink],
  );

  const handleExport = React.useCallback(async (): Promise<void> => {
    if (status !== 'paused' || exporting || !exportFilename.trim()) return;
    setExporting(true);
    try {
      const response = await net.sendAction('simulation.export_state', {
        filename: exportFilename.trim(),
      });
      if (response.signal !== 'simulation.state_exported') return;
      // Decode base64 and trigger download
      const blob = new Blob(
        [Uint8Array.from(atob(response.data.file_content), c => c.charCodeAt(0))],
        { type: 'application/octet-stream' }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = response.data.filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // future: surface via HUD toast
    } finally {
      setExporting(false);
    }
  }, [status, exporting, exportFilename]);

  const displayTickRate = dragTickRate ?? tickRate;
  const displaySpeed = dragSpeed ?? speed;

  return (
    <HudContainer
      id="simulation-controls"
      title="Simulation Controls"
      description="Control the playback of the simulation and export save states."
      className="w-96"
    >
      <div className="flex flex-col gap-4 py-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-black/70">Tick Rate</span>
            <span className="text-sm font-medium text-black/90 tabular-nums">
              {displayTickRate} Hz
            </span>
          </div>
          <Slider
            min={1}
            max={100}
            step={1}
            value={[displayTickRate]}
            onValueChange={(v) => setDragTickRate(v[0] ?? 60)}
            onPointerDown={() => void 0}
            onPointerUp={() => {
              const nextTickRate = dragTickRate ?? tickRate;
              setDragTickRate(null);
              commitUpdate(nextTickRate, speed);
            }}
            aria-label="Tick rate"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-black/70">Speed</span>
            <span className="text-sm font-medium text-black/90 tabular-nums">
              x{displaySpeed.toFixed(1)}
            </span>
          </div>
          <Slider
            min={0.1}
            max={10.0}
            step={0.1}
            value={[displaySpeed]}
            onValueChange={(v) => setDragSpeed(v[0] ?? 1.0)}
            onPointerDown={() => void 0}
            onPointerUp={() => {
              const nextSpeed = dragSpeed ?? speed;
              setDragSpeed(null);
              commitUpdate(tickRate, nextSpeed);
            }}
            aria-label="Speed"
          />
        </div>

        {/* Export section - only visible when paused */}
        <div className="flex flex-row gap-2 items-end border-t border-black/10 pt-4">
          <div className="space-y-1.5 flex-1">
            <Label htmlFor="export_filename" className="text-xs text-black/70 ml-1">
              Save Filename
            </Label>
            <Input
              id="export_filename"
              type="text"
              value={exportFilename}
              onChange={(e) => setExportFilename(e.target.value)}
              placeholder="save_0"
              disabled={exporting}
            />
          </div>
          <Button
            variant="secondary"
            onClick={handleExport}
            disabled={exporting || !exportFilename.trim() || status !== 'paused'}
            aria-busy={exporting}
          >
            {exporting ? 'Exporting...' : 'Export State'}
          </Button>
        </div>

        <div className="flex flex-col gap-2 self-end border-t border-black/10 pt-4 w-full">
          {(status === 'playing' || status === 'paused') && (
            <div className="flex items-center gap-2">
              {status === 'playing' ? (
                <Button
                  aria-label="Pause"
                  variant="default"
                  onClick={() => issue({ type: 'pause' })}
                  className="h-8"
                >
                  <Pause />
                  Pause
                </Button>
              ) : (
                <Button
                  aria-label="Resume"
                  variant="default"
                  onClick={() => issue({ type: 'resume' })}
                  className="h-8"
                >
                  <Play />
                  Resume
                </Button>
              )}
              <Button
                aria-label="Stop"
                variant="secondary"
                onClick={() => issue({ type: 'stop' })}
                className="h-8"
              >
                <Square />
                Stop
              </Button>
            </div>
          )}
        </div>
      </div>
    </HudContainer>
  );
}
