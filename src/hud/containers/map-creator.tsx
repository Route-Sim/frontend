import * as React from 'react';
import { HudContainer } from '@/hud/components/hud-container';
import { Button } from '@/hud/ui/button';
import { Input } from '@/hud/ui/input';
import { Label } from '@/hud/ui/label';
import { Slider } from '@/hud/ui/slider';
import { ScrollArea } from '@/hud/ui/scroll-area';
import { usePlaybackState } from '@/hud/state/playback-state';
import { net, type ActionParams, type SignalData } from '@/net';
import { cn } from '../lib/utils';
import { MapGraph } from '@/hud/components/map-graph';

/** Reusable section card for configuration groups */
function ConfigSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): React.ReactNode {
  return (
    <section className="rounded-lg border border-black/10 bg-white/50 p-3">
      <h3 className="mb-3 text-xs font-semibold tracking-wide text-black/70 uppercase">
        {title}
      </h3>
      {children}
    </section>
  );
}

/** Reusable field wrapper */
function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}): React.ReactNode {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-xs text-black/70">
        {label}
      </Label>
      {children}
    </div>
  );
}

/** Slider with value display */
function SliderField({
  label,
  id,
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.01,
}: {
  label: string;
  id: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}): React.ReactNode {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-xs text-black/70">
          {label}
        </Label>
        <span className="text-xs text-black/50 tabular-nums">
          {value.toFixed(2)}
        </span>
      </div>
      <Slider
        id={id}
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={(v) => onChange(v[0] ?? 0)}
        aria-label={label}
      />
    </div>
  );
}

type MapCreateParams = ActionParams['map.create'];
type MapCreatedData = SignalData['map.created'];

const DEFAULTS: MapCreateParams = {
  map_width: 1000,
  map_height: 1000,
  num_major_centers: 3,
  minor_per_major: 2.0,
  center_separation: 2500.0,
  urban_sprawl: 800.0,
  local_density: 50.0,
  rural_density: 5.0,
  intra_connectivity: 0.3,
  inter_connectivity: 2,
  arterial_ratio: 0.2,
  gridness: 0.3,
  ring_road_prob: 0.1,
  highway_curviness: 0.2,
  rural_settlement_prob: 0.15,
  urban_sites_per_km2: 2.0,
  rural_sites_per_km2: 0.5,
  urban_parkings_per_km2: 2.0,
  rural_parkings_per_km2: 0.5,
  urban_gas_stations_per_km2: 1.0,
  rural_gas_stations_per_km2: 0.2,
  urban_activity_rate_range: [100.0, 400.0],
  rural_activity_rate_range: [50.0, 200.0],
  gas_station_capacity_range: [10.0, 50.0],
  gas_station_cost_factor_range: [1.0, 2.0],
  seed: 42,
};

export function MapCreator({
  className,
}: {
  className?: string;
}): React.ReactNode {
  const { status } = usePlaybackState();
  const [params, setParams] = React.useState<MapCreateParams>({ ...DEFAULTS });
  const [sending, setSending] = React.useState<boolean>(false);
  const [exporting, setExporting] = React.useState<boolean>(false);
  const [importing, setImporting] = React.useState<boolean>(false);
  const [exportFilename, setExportFilename] = React.useState<string>('map_1000x1000_42');
  const [mapData, setMapData] = React.useState<MapCreatedData | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const canCreate = status === 'idle' || status === 'stopped';

  // Subscribe to map.created events on mount
  React.useEffect(() => {
    const handleMapCreated = (data: MapCreatedData): void => {
      setMapData(data);
      setExportFilename(`map_${data.map_width}x${data.map_height}_${data.seed}`);
      setParams((prev) => {
        const fallback = { ...DEFAULTS, ...prev };
        return {
          ...fallback,
          ...data,
          urban_activity_rate_range:
            data.urban_activity_rate_range ??
            fallback.urban_activity_rate_range,
          rural_activity_rate_range:
            data.rural_activity_rate_range ??
            fallback.rural_activity_rate_range,
          gas_station_capacity_range:
            data.gas_station_capacity_range ??
            fallback.gas_station_capacity_range,
          gas_station_cost_factor_range:
            data.gas_station_cost_factor_range ??
            fallback.gas_station_cost_factor_range,
          urban_gas_stations_per_km2:
            data.urban_gas_stations_per_km2 ??
            fallback.urban_gas_stations_per_km2,
          rural_gas_stations_per_km2:
            data.rural_gas_stations_per_km2 ??
            fallback.rural_gas_stations_per_km2,
        };
      });
    };

    const unsubscribe = net.on('map.created', handleMapCreated);
    return unsubscribe;
  }, []);

  const setNumber = <K extends keyof MapCreateParams>(
    key: K,
    value: number,
  ): void => {
    setParams((p) => ({ ...p, [key]: value }));
  };

  const setArrayRange = <
    K extends
      | 'urban_activity_rate_range'
      | 'rural_activity_rate_range'
      | 'gas_station_capacity_range'
      | 'gas_station_cost_factor_range',
  >(
    key: K,
    index: 0 | 1,
    value: number,
  ): void => {
    setParams((p) => {
      const current = p[key] as [number, number];
      const updated: [number, number] = [...current];
      updated[index] = Math.max(0, value);
      return { ...p, [key]: updated };
    });
  };

  const applyPresetDenseUrban = (): void => {
    setParams((p) => ({
      ...p,
      num_major_centers: 5,
      local_density: 80.0,
      rural_density: 0.0,
      gridness: 0.7,
      ring_road_prob: 0.1,
    }));
  };

  const applyPresetSparseRural = (): void => {
    setParams((p) => ({
      ...p,
      num_major_centers: 2,
      local_density: 20.0,
      rural_density: 10.0,
      gridness: 0.0,
      rural_settlement_prob: 0.3,
    }));
  };

  const handleCreate = async (): Promise<void> => {
    if (!canCreate || sending) return;
    setSending(true);
    try {
      await net.sendAction('map.create', params);
    } catch {
      // future: surface via HUD toast
    } finally {
      setSending(false);
    }
  };

  const handleExport = async (): Promise<void> => {
    if (!mapData || exporting || !exportFilename.trim()) return;
    setExporting(true);
    try {
      const response = await net.sendAction('map.export', {
        filename: exportFilename.trim(),
      });
      if (response.signal !== 'map.exported') return;
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
  };

  const handleImportClick = (): void => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file || importing) return;

    setImporting(true);
    try {
      // Read file as ArrayBuffer
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

      const response = await net.sendAction('map.import', {
        file_content: base64,
        filename: file.name,
      });

      if (response.signal === 'map.imported') {
        // Map will be loaded via map.created signal
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch {
      // future: surface via HUD toast
    } finally {
      setImporting(false);
    }
  };

  return (
    <HudContainer
      id="map-creator"
      title="Map Creator"
      description="Set parameters for the logistics network map generator to generate and view the map."
      closable={false}
      className={cn('flex h-full flex-col', className)}
    >
      <div className="flex h-full min-h-0 flex-row gap-4 pt-3">
        {/* Left column: scrollable configuration */}
        <div className="flex w-120 shrink-0 flex-col">
          {/* Action buttons */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setParams({ ...DEFAULTS })}
            >
              Reset
            </Button>
            <Button variant="outline" size="sm" onClick={applyPresetDenseUrban}>
              Dense Urban
            </Button>
            <Button variant="outline" size="sm" onClick={applyPresetSparseRural}>
              Sparse Rural
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleImportClick}
              disabled={!canCreate || importing}
              aria-busy={importing}
            >
              {importing ? 'Importing...' : 'Import Map'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".smap"
              onChange={handleFileChange}
              className="hidden"
              aria-label="Import map file"
            />
          </div>

          {/* Scrollable sections */}
          <ScrollArea className="min-h-0 flex-1 pr-3">
            <div className="space-y-3 pb-3">
              {/* Dimensions & Seed */}
              <ConfigSection title="Dimensions">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Width (m)" htmlFor="map_width">
                    <Input
                      id="map_width"
                      type="number"
                      min={1}
                      value={params.map_width}
                      onChange={(e) =>
                        setNumber('map_width', Number(e.target.value) || 0)
                      }
                    />
                  </Field>
                  <Field label="Height (m)" htmlFor="map_height">
                    <Input
                      id="map_height"
                      type="number"
                      min={1}
                      value={params.map_height}
                      onChange={(e) =>
                        setNumber('map_height', Number(e.target.value) || 0)
                      }
                    />
                  </Field>
                  <Field label="Seed" htmlFor="seed">
                    <Input
                      id="seed"
                      type="number"
                      step={1}
                      value={params.seed}
                      onChange={(e) =>
                        setNumber(
                          'seed',
                          Math.floor(Number(e.target.value) || 0),
                        )
                      }
                    />
                  </Field>
                </div>
              </ConfigSection>

              {/* Structure */}
              <ConfigSection title="Structure">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Major Centers" htmlFor="num_major_centers">
                    <Input
                      id="num_major_centers"
                      type="number"
                      min={1}
                      step={1}
                      value={params.num_major_centers}
                      onChange={(e) =>
                        setNumber(
                          'num_major_centers',
                          Math.max(1, Math.floor(Number(e.target.value) || 1)),
                        )
                      }
                    />
                  </Field>
                  <Field label="Minor per Major" htmlFor="minor_per_major">
                    <Input
                      id="minor_per_major"
                      type="number"
                      min={0}
                      step={0.1}
                      value={params.minor_per_major}
                      onChange={(e) =>
                        setNumber(
                          'minor_per_major',
                          Math.max(0, Number(e.target.value) || 0),
                        )
                      }
                    />
                  </Field>
                  <Field label="Center Separation (m)" htmlFor="center_separation">
                    <Input
                      id="center_separation"
                      type="number"
                      min={1}
                      step={1}
                      value={params.center_separation}
                      onChange={(e) =>
                        setNumber(
                          'center_separation',
                          Math.max(1, Number(e.target.value) || 1),
                        )
                      }
                    />
                  </Field>
                  <Field label="Urban Sprawl (m)" htmlFor="urban_sprawl">
                    <Input
                      id="urban_sprawl"
                      type="number"
                      min={1}
                      step={1}
                      value={params.urban_sprawl}
                      onChange={(e) =>
                        setNumber(
                          'urban_sprawl',
                          Math.max(1, Number(e.target.value) || 1),
                        )
                      }
                    />
                  </Field>
                </div>
              </ConfigSection>

              {/* Densities */}
              <ConfigSection title="Densities">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Local (nodes/km²)" htmlFor="local_density">
                    <Input
                      id="local_density"
                      type="number"
                      min={0.0001}
                      step={0.1}
                      value={params.local_density}
                      onChange={(e) =>
                        setNumber(
                          'local_density',
                          Math.max(0.0001, Number(e.target.value) || 0),
                        )
                      }
                    />
                  </Field>
                  <Field label="Rural (nodes/km²)" htmlFor="rural_density">
                    <Input
                      id="rural_density"
                      type="number"
                      min={0}
                      step={0.1}
                      value={params.rural_density}
                      onChange={(e) =>
                        setNumber(
                          'rural_density',
                          Math.max(0, Number(e.target.value) || 0),
                        )
                      }
                    />
                  </Field>
                </div>
              </ConfigSection>

              {/* Connectivity */}
              <ConfigSection title="Connectivity">
                <div className="space-y-3">
                  <SliderField
                    label="Intra Connectivity"
                    id="intra_connectivity"
                    value={params.intra_connectivity}
                    onChange={(v) => setNumber('intra_connectivity', v)}
                  />
                  <Field label="Inter Connectivity (≥1)" htmlFor="inter_connectivity">
                    <Input
                      id="inter_connectivity"
                      type="number"
                      min={1}
                      step={1}
                      value={params.inter_connectivity}
                      onChange={(e) =>
                        setNumber(
                          'inter_connectivity',
                          Math.max(1, Number(e.target.value) || 1),
                        )
                      }
                    />
                  </Field>
                </div>
              </ConfigSection>

              {/* Road Composition */}
              <ConfigSection title="Road Composition">
                <div className="space-y-3">
                  <SliderField
                    label="Arterial Ratio"
                    id="arterial_ratio"
                    value={params.arterial_ratio}
                    onChange={(v) => setNumber('arterial_ratio', v)}
                  />
                  <SliderField
                    label="Gridness"
                    id="gridness"
                    value={params.gridness}
                    onChange={(v) => setNumber('gridness', v)}
                  />
                  <SliderField
                    label="Ring Road Probability"
                    id="ring_road_prob"
                    value={params.ring_road_prob}
                    onChange={(v) => setNumber('ring_road_prob', v)}
                  />
                  <SliderField
                    label="Highway Curviness"
                    id="highway_curviness"
                    value={params.highway_curviness}
                    onChange={(v) => setNumber('highway_curviness', v)}
                  />
                  <SliderField
                    label="Rural Settlement Prob"
                    id="rural_settlement_prob"
                    value={params.rural_settlement_prob}
                    onChange={(v) => setNumber('rural_settlement_prob', v)}
                  />
                </div>
              </ConfigSection>

              {/* Sites & Parkings */}
              <ConfigSection title="Sites & Parkings">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Urban Sites/km²" htmlFor="urban_sites_per_km2">
                    <Input
                      id="urban_sites_per_km2"
                      type="number"
                      min={0}
                      step={0.1}
                      value={params.urban_sites_per_km2}
                      onChange={(e) =>
                        setNumber(
                          'urban_sites_per_km2',
                          Math.max(0, Number(e.target.value) || 0),
                        )
                      }
                    />
                  </Field>
                  <Field label="Rural Sites/km²" htmlFor="rural_sites_per_km2">
                    <Input
                      id="rural_sites_per_km2"
                      type="number"
                      min={0}
                      step={0.1}
                      value={params.rural_sites_per_km2}
                      onChange={(e) =>
                        setNumber(
                          'rural_sites_per_km2',
                          Math.max(0, Number(e.target.value) || 0),
                        )
                      }
                    />
                  </Field>
                  <Field label="Urban Parkings/km²" htmlFor="urban_parkings_per_km2">
                    <Input
                      id="urban_parkings_per_km2"
                      type="number"
                      min={0}
                      step={0.1}
                      value={params.urban_parkings_per_km2}
                      onChange={(e) =>
                        setNumber(
                          'urban_parkings_per_km2',
                          Math.max(0, Number(e.target.value) || 0),
                        )
                      }
                    />
                  </Field>
                  <Field label="Rural Parkings/km²" htmlFor="rural_parkings_per_km2">
                    <Input
                      id="rural_parkings_per_km2"
                      type="number"
                      min={0}
                      step={0.1}
                      value={params.rural_parkings_per_km2}
                      onChange={(e) =>
                        setNumber(
                          'rural_parkings_per_km2',
                          Math.max(0, Number(e.target.value) || 0),
                        )
                      }
                    />
                  </Field>
                </div>
              </ConfigSection>

              {/* Gas Stations */}
              <ConfigSection title="Gas Stations">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Urban/km²" htmlFor="urban_gas_stations_per_km2">
                    <Input
                      id="urban_gas_stations_per_km2"
                      type="number"
                      min={0}
                      step={0.1}
                      value={params.urban_gas_stations_per_km2}
                      onChange={(e) =>
                        setNumber(
                          'urban_gas_stations_per_km2',
                          Math.max(0, Number(e.target.value) || 0),
                        )
                      }
                    />
                  </Field>
                  <Field label="Rural/km²" htmlFor="rural_gas_stations_per_km2">
                    <Input
                      id="rural_gas_stations_per_km2"
                      type="number"
                      min={0}
                      step={0.1}
                      value={params.rural_gas_stations_per_km2}
                      onChange={(e) =>
                        setNumber(
                          'rural_gas_stations_per_km2',
                          Math.max(0, Number(e.target.value) || 0),
                        )
                      }
                    />
                  </Field>
                </div>
                <div className="mt-3 space-y-2">
                  <Label className="text-xs text-black/70">Capacity Range</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      id="gas_station_capacity_min"
                      type="number"
                      min={0}
                      step={0.1}
                      value={params.gas_station_capacity_range[0]}
                      onChange={(e) =>
                        setArrayRange(
                          'gas_station_capacity_range',
                          0,
                          Number(e.target.value) || 0,
                        )
                      }
                      placeholder="Min"
                    />
                    <Input
                      id="gas_station_capacity_max"
                      type="number"
                      min={0}
                      step={0.1}
                      value={params.gas_station_capacity_range[1]}
                      onChange={(e) =>
                        setArrayRange(
                          'gas_station_capacity_range',
                          1,
                          Number(e.target.value) || 0,
                        )
                      }
                      placeholder="Max"
                    />
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  <Label className="text-xs text-black/70">Cost Factor Range</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      id="gas_station_cost_factor_min"
                      type="number"
                      min={0}
                      step={0.1}
                      value={params.gas_station_cost_factor_range[0]}
                      onChange={(e) =>
                        setArrayRange(
                          'gas_station_cost_factor_range',
                          0,
                          Number(e.target.value) || 0,
                        )
                      }
                      placeholder="Min"
                    />
                    <Input
                      id="gas_station_cost_factor_max"
                      type="number"
                      min={0}
                      step={0.1}
                      value={params.gas_station_cost_factor_range[1]}
                      onChange={(e) =>
                        setArrayRange(
                          'gas_station_cost_factor_range',
                          1,
                          Number(e.target.value) || 0,
                        )
                      }
                      placeholder="Max"
                    />
                  </div>
                </div>
              </ConfigSection>

              {/* Activity Rates */}
              <ConfigSection title="Activity Rates (pkg/hour)">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-xs text-black/70">Urban Range</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        id="urban_activity_rate_min"
                        type="number"
                        min={0}
                        step={0.1}
                        value={params.urban_activity_rate_range[0]}
                        onChange={(e) =>
                          setArrayRange(
                            'urban_activity_rate_range',
                            0,
                            Number(e.target.value) || 0,
                          )
                        }
                        placeholder="Min"
                      />
                      <Input
                        id="urban_activity_rate_max"
                        type="number"
                        min={0}
                        step={0.1}
                        value={params.urban_activity_rate_range[1]}
                        onChange={(e) =>
                          setArrayRange(
                            'urban_activity_rate_range',
                            1,
                            Number(e.target.value) || 0,
                          )
                        }
                        placeholder="Max"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-black/70">Rural Range</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        id="rural_activity_rate_min"
                        type="number"
                        min={0}
                        step={0.1}
                        value={params.rural_activity_rate_range[0]}
                        onChange={(e) =>
                          setArrayRange(
                            'rural_activity_rate_range',
                            0,
                            Number(e.target.value) || 0,
                          )
                        }
                        placeholder="Min"
                      />
                      <Input
                        id="rural_activity_rate_max"
                        type="number"
                        min={0}
                        step={0.1}
                        value={params.rural_activity_rate_range[1]}
                        onChange={(e) =>
                          setArrayRange(
                            'rural_activity_rate_range',
                            1,
                            Number(e.target.value) || 0,
                          )
                        }
                        placeholder="Max"
                      />
                    </div>
                  </div>
                </div>
              </ConfigSection>
            </div>
          </ScrollArea>

          {/* Create button at bottom */}
          <div className="mt-3 border-t border-black/10 pt-3">
            <Button
              className="w-full"
              onClick={handleCreate}
              disabled={!canCreate || sending}
              aria-busy={sending}
            >
              {sending ? 'Generating...' : 'Generate Map'}
            </Button>
            {mapData && (
              <div className="mt-3 space-y-2">
                <Field label="Export Filename" htmlFor="export_filename">
                  <Input
                    id="export_filename"
                    type="text"
                    value={exportFilename}
                    onChange={(e) => setExportFilename(e.target.value)}
                    placeholder="map_42"
                    disabled={exporting}
                  />
                </Field>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={handleExport}
                  disabled={!mapData || exporting || !exportFilename.trim()}
                  aria-busy={exporting}
                >
                  {exporting ? 'Exporting...' : 'Export Map'}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Right column: map preview */}
        <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl border border-dashed border-black/30 bg-black/5">
          {mapData ? (
            <MapGraph data={mapData} />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-black/40">
              Generated map will appear here
            </div>
          )}
        </div>
      </div>
    </HudContainer>
  );
}
