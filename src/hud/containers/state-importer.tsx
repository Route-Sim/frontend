import * as React from 'react';
import { HudContainer } from '@/hud/components/hud-container';
import { Button } from '@/hud/ui/button';
import { usePlaybackState } from '@/hud/state/playback-state';
import { net } from '@/net';
import { cn } from '../lib/utils';
import { Upload } from 'lucide-react';

export function StateImporter({
  className,
}: {
  className?: string;
}): React.ReactNode {
  const { status } = usePlaybackState();
  const [importing, setImporting] = React.useState<boolean>(false);
  const [lastImportedFile, setLastImportedFile] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const canImport = status === 'idle' || status === 'stopped';

  const handleImportClick = (): void => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file || importing || !canImport) return;

    setImporting(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Convert to base64 in chunks to avoid stack overflow
      let binaryString = '';
      const chunkSize = 8192;
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.subarray(i, i + chunkSize);
        binaryString += String.fromCharCode(...chunk);
      }
      const base64 = btoa(binaryString);

      const response = await net.sendAction('simulation.import_state', {
        file_content: base64,
        filename: file.name,
      });

      if (response.signal === 'simulation.state_imported') {
        setLastImportedFile(response.data.filename);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (err) {
      // future: surface via HUD toast
      console.error('Failed to import simulation state:', err);
    } finally {
      setImporting(false);
    }
  };

  return (
    <HudContainer
      id="state-importer"
      title="Load Simulation State"
      description="Import a previously saved simulation state to resume from a checkpoint."
      closable={false}
      className={cn('flex h-full flex-col', className)}
    >
      <div className="flex h-full min-h-0 flex-col items-center justify-center gap-6 py-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="rounded-full bg-black/5 p-6">
            <Upload className="h-12 w-12 text-black/40" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-black/90">
              Import Simulation State
            </h3>
            <p className="max-w-md text-sm text-black/60">
              Load a previously exported simulation state file (.ssave) to
              continue from where you left off or explore saved scenarios.
            </p>
          </div>
        </div>

        {lastImportedFile && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3">
            <p className="text-sm text-green-800">
              <span className="font-semibold">Successfully imported:</span>{' '}
              {lastImportedFile}
            </p>
            <p className="mt-1 text-xs text-green-700">
              You can now start the simulation from this state.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <Button
            size="lg"
            onClick={handleImportClick}
            disabled={!canImport || importing}
            aria-busy={importing}
            className="min-w-64"
          >
            {importing ? (
              'Importing...'
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Select .ssave File
              </>
            )}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".ssave"
            onChange={handleFileChange}
            className="hidden"
            aria-label="Import simulation state file"
          />

          {!canImport && (
            <p className="text-center text-xs text-black/50">
              Stop the simulation to import a new state
            </p>
          )}
        </div>

        <div className="mt-8 rounded-lg border border-black/10 bg-white/50 p-4">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-black/70">
            How it works
          </h4>
          <ul className="space-y-2 text-xs text-black/60">
            <li className="flex gap-2">
              <span className="text-black/40">1.</span>
              <span>
                Click the button above to select a <code>.ssave</code> file
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-black/40">2.</span>
              <span>
                The simulation state will be restored (agents, packages, time,
                etc.)
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-black/40">3.</span>
              <span>
                Navigate to the <strong>Simulation</strong> tab to start from
                the loaded state
              </span>
            </li>
          </ul>
        </div>
      </div>
    </HudContainer>
  );
}

