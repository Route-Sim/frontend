import * as React from 'react';
import type { SignalData } from '@/net';
import { Stage, Layer, Line, Circle } from 'react-konva';
import { cn } from '@/hud/lib/utils';

export type MapGraphProps = {
  data: SignalData['map.created'];
  className?: string;
};

export function MapGraph({ data, className }: MapGraphProps): React.ReactNode {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [{ width, height }, setSize] = React.useState<{
    width: number;
    height: number;
  }>({
    width: 0,
    height: 0,
  });
  const [stageScale, setStageScale] = React.useState<number>(1);
  const [stagePos, setStagePos] = React.useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const interactedRef = React.useRef<boolean>(false);

  // Measure container
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const cr = e.contentRect;
        setSize({
          width: Math.max(0, cr.width),
          height: Math.max(0, cr.height),
        });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const padding = 24;
  const fitScale = React.useMemo(() => {
    if (width <= 0 || height <= 0) return 1;
    const sx = (width - padding * 2) / data.map_width;
    const sy = (height - padding * 2) / data.map_height;
    const s = Math.max(0.0001, Math.min(sx, sy));
    return Number.isFinite(s) ? s : 1;
  }, [width, height, data.map_width, data.map_height]);

  const baseOffset = React.useMemo(() => {
    const ox = (width - data.map_width * fitScale) / 2;
    const oy = (height - data.map_height * fitScale) / 2;
    return { x: ox, y: oy };
  }, [width, height, fitScale, data.map_width, data.map_height]);

  // Initialize/reset view when data or size changes, unless user interacted
  React.useEffect(() => {
    if (!interactedRef.current) {
      setStageScale(1);
      setStagePos(baseOffset);
    }
  }, [baseOffset.x, baseOffset.y, fitScale]);

  const nodeById = React.useMemo(() => {
    const m = new Map<string, { x: number; y: number }>();
    for (const n of data.graph.nodes) m.set(n.id, { x: n.x, y: n.y });
    return m;
  }, [data.graph.nodes]);

  const roadStyle = React.useCallback(
    (rc: 'A' | 'S' | 'GP' | 'G' | 'Z' | 'L' | 'D', lanes: number) => {
      const styleByClass: Record<
        'A' | 'S' | 'GP' | 'G' | 'Z' | 'L' | 'D',
        { stroke: string; base: number; label: string }
      > = {
        A: { stroke: '#e46b3b', base: 3.0, label: 'A – Motorway' },
        S: { stroke: '#f07f4e', base: 2.8, label: 'S – Expressway' },
        GP: { stroke: '#f4975f', base: 2.6, label: 'GP – Primary' },
        G: { stroke: '#f4a76b', base: 2.4, label: 'G – Main' },
        Z: { stroke: '#caa86a', base: 2.2, label: 'Z – Collector' },
        L: { stroke: '#b8906c', base: 2.0, label: 'L – Local' },
        D: { stroke: '#9b7f67', base: 1.8, label: 'D – Service' },
      };
      const s = styleByClass[rc];
      const width = s.base + Math.max(0, lanes - 1) * 0.6;
      return { stroke: s.stroke, width, label: s.label };
    },
    [],
  );

  const edges = React.useMemo(() => {
    const list: Array<{
      id: string;
      points: number[];
      stroke: string;
      width: number;
    }> = [];
    for (const e of data.graph.edges) {
      const a = nodeById.get(e.from_node);
      const b = nodeById.get(e.to_node);
      if (!a || !b) continue;
      const points = [
        a.x * fitScale,
        a.y * fitScale,
        b.x * fitScale,
        b.y * fitScale,
      ];
      const style = roadStyle(e.road_class as any, e.lanes);
      list.push({ id: e.id, points, stroke: style.stroke, width: style.width });
    }
    return list;
  }, [data.graph.edges, nodeById, fitScale, roadStyle]);

  const handleWheel = (evt: any): void => {
    evt.evt.preventDefault();
    interactedRef.current = true;
    const stage = evt.target.getStage();
    if (!stage) return;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const scaleBy = 1.1;
    const oldScale = stageScale;
    const direction = evt.evt.deltaY > 0 ? -1 : 1;
    const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;

    const mousePointTo = {
      x: (pointer.x - stagePos.x) / oldScale,
      y: (pointer.y - stagePos.y) / oldScale,
    };
    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };
    setStageScale(newScale);
    setStagePos(newPos);
  };

  return (
    <div ref={containerRef} className={cn('absolute inset-0', className)}>
      <Stage
        width={width}
        height={height}
        draggable
        scaleX={stageScale}
        scaleY={stageScale}
        x={stagePos.x}
        y={stagePos.y}
        onWheel={handleWheel}
        onDragStart={() => {
          interactedRef.current = true;
        }}
        onDragEnd={(e) => {
          setStagePos(e.target.position());
        }}
      >
        <Layer listening={true}>
          {edges.map((e) => (
            <Line
              key={e.id}
              points={e.points}
              stroke={e.stroke}
              strokeWidth={e.width}
              opacity={0.9}
              lineCap="round"
              lineJoin="round"
            />
          ))}
          {data.graph.nodes.map((n) => (
            <Circle
              key={n.id}
              x={n.x * fitScale}
              y={n.y * fitScale}
              radius={2}
              fill="#3a3a3a"
              opacity={0.95}
              shadowEnabled={false}
            />
          ))}
        </Layer>
      </Stage>

      {/* Counts overlay */}
      <div className="pointer-events-none absolute top-2 left-2 rounded bg-white/70 px-2 py-1 text-[10px] text-black/70 shadow">
        <span className="tabular-nums">
          {data.generated_nodes} nodes · {data.generated_edges} edges ·{' '}
          {data.generated_sites} sites · {data.generated_parkings} parkings ·{' '}
          {data.generated_gas_stations} gas stations
        </span>
      </div>

      {/* Legend overlay */}
      <Legend className="absolute top-2 right-2" />

      {/* Controls hint */}
      <div className="pointer-events-none absolute right-2 bottom-2 rounded bg-white/70 px-2 py-1 text-[10px] text-black/70 shadow">
        Pan: drag · Zoom: wheel
      </div>
    </div>
  );
}

function Legend({ className }: { className?: string }): React.ReactNode {
  const items: Array<{
    key: string;
    label: string;
    color: string;
    width: number;
  }> = [
    { key: 'A', label: 'A – Motorway', color: '#e46b3b', width: 3.0 },
    { key: 'S', label: 'S – Expressway', color: '#f07f4e', width: 2.8 },
    { key: 'GP', label: 'GP – Primary', color: '#f4975f', width: 2.6 },
    { key: 'G', label: 'G – Main', color: '#f4a76b', width: 2.4 },
    { key: 'Z', label: 'Z – Collector', color: '#caa86a', width: 2.2 },
    { key: 'L', label: 'L – Local', color: '#b8906c', width: 2.0 },
    { key: 'D', label: 'D – Service', color: '#9b7f67', width: 1.8 },
  ];
  return (
    <div
      className={cn(
        'rounded bg-white/80 p-2 text-[10px] text-black/80 shadow ring-1 ring-black/10',
        className,
      )}
      aria-label="Graph legend"
    >
      <div className="mb-1 text-[11px] font-semibold">Legend</div>
      <div className="grid grid-cols-1 gap-1">
        {items.map((it) => (
          <div key={it.key} className="flex items-center gap-2">
            <span
              className="inline-block"
              style={{
                width: 20,
                height: it.width,
                backgroundColor: it.color,
                borderRadius: it.width / 2,
              }}
              aria-hidden="true"
            />
            <span>{it.label}</span>
          </div>
        ))}
        <div className="mt-1 flex items-center gap-2">
          <span
            className="inline-block rounded-full"
            style={{ width: 6, height: 6, backgroundColor: '#3a3a3a' }}
            aria-hidden="true"
          />
          <span>Node</span>
        </div>
        <div className="mt-1 text-[10px] text-black/60">
          Stroke width scales with lanes
        </div>
      </div>
    </div>
  );
}
