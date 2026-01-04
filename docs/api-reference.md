---
title: 'API Reference – WebSocket Protocol'
summary: 'Typed actions and signals exchanged between VISTA and SPINE with zod-validated envelopes and examples.'
source_paths:
  - 'src/net/protocol/schema.ts'
  - 'src/net/protocol/mapping.ts'
last_updated: '2026-01-04'
owner: 'Mateusz Nędzi'
tags: ['api', 'net', 'protocol']
links:
  parent: './SUMMARY.md'
  siblings: []
---

# WebSocket API Protocol

> Purpose: This document specifies the runtime-validated protocol used by the network layer. All inbound messages are validated at the edge using zod; outbound messages are constructed from strongly-typed helpers.

## Message Envelopes

- Action (client → server): `{ action: ActionName, params: ActionParams[ActionName], request_id? }`
- Signal (server → client): `{ signal: SignalName, data: SignalData[SignalName], request_id? }`

See detailed schemas: [`protocol/schema`](modules/net/protocol/schema.md) and mapping logic: [`protocol/mapping`](modules/net/protocol/mapping.md).

## Actions

```ts
type ActionName =
  | 'simulation.start'
  | 'simulation.stop'
  | 'simulation.resume'
  | 'simulation.pause'
  | 'simulation.update'
  | 'simulation.export_state'
  | 'simulation.import_state'
  | 'map.create'
  | 'map.export'
  | 'map.import'
  | 'agent.create'
  | 'agent.update'
  | 'agent.delete'
  | 'agent.get';
```

Params per action (TypeScript/zod enforced):

```ts
simulation.start: { tick_rate: number }
simulation.stop: {}
simulation.resume: {}
simulation.pause: {}
map.create: {
  map_width: number (>0),
  map_height: number (>0),
  num_major_centers: integer (>=1),
  minor_per_major: number (>=0),
  center_separation: number (>0),
  urban_sprawl: number (>0),
  local_density: number (>0),
  rural_density: number (>=0),
  intra_connectivity: number (0..1),
  inter_connectivity: number (>=1),
  arterial_ratio: number (0..1),
  gridness: number (0..1),
  ring_road_prob: number (0..1),
  highway_curviness: number (0..1),
  rural_settlement_prob: number (0..1),
  seed: integer
}
map.export: { filename: string }
map.import: { file_content: string, filename: string }
tick_rate.update: { tick_rate: number }
agent.create: { agent_id: string, agent_kind: string, ... }
agent.update: { agent_id: string, ... }
agent.delete: { agent_id: string }
agent.get: { agent_id: string }
```

Example (client → server):

```json
{
  "action": "simulation.start",
  "params": { "tick_rate": 30 },
  "request_id": "c6f8..."
}
```

## Signals

```ts
type SignalName =
  | 'simulation.started'
  | 'simulation.stopped'
  | 'simulation.resumed'
  | 'simulation.paused'
  | 'simulation.updated'
  | 'simulation.state_exported'
  | 'simulation.state_imported'
  | 'tick.start'
  | 'tick.end'
  | 'map.created'
  | 'map.exported'
  | 'map.imported'
  | 'agent.created'
  | 'agent.updated'
  | 'agent.deleted'
  | 'agent.listed'
  | 'agent.described'
  | 'building.updated'
  | 'package.created'
  | 'error';
```

Data per signal (TypeScript/zod enforced):

```ts
simulation.started: { tick_rate: number }
simulation.stopped: {}
simulation.resumed: {}
simulation.paused: {}
tick.start: { tick: number, time: number, day: number }
tick.end: { tick: number, time: number, day: number }
map.created: {
  // echoes params...
  map_width: number; map_height: number; num_major_centers: number; minor_per_major: number;
  center_separation: number; urban_sprawl: number; local_density: number; rural_density: number;
  intra_connectivity: number; inter_connectivity: number; arterial_ratio: number; gridness: number;
  ring_road_prob: number; highway_curviness: number; rural_settlement_prob: number;
  urban_sites_per_km2: number; rural_sites_per_km2: number;
  urban_activity_rate_range: [number, number]; rural_activity_rate_range: [number, number];
  seed: number;
  // summary
  generated_nodes: number; generated_edges: number; generated_sites: number;
  // graph
  graph: {
    nodes: { id: string; x: number; y: number }[];
    edges: {
      id: string; from_node: string; to_node: string; length_m: number;
      mode: number; road_class: 'A'|'S'|'GP'|'G'|'Z'|'L'|'D'; lanes: number; max_speed_kph: number;
      weight_limit_kg: number | null;
    }[];
  };
}
map.exported: { filename: string, file_content: string }
map.imported: { filename: string }
tick_rate.updated: { tick_rate: number }
agent.created: AgentCreatedPayload // see detailed breakdown below
agent.updated: { agent_id: string, ... }
agent.deleted: { agent_id: string }
agent.state: { agent_id: string, agent_kind: string, ... }
event.created: { event_name: string, ... }
building.updated: { building_id: string, ... }
error: { code: string, message: string }
```

**Tick signals** include simulation time:

- `time`: Current time in 24h format as a float (e.g., `12.5` = 12:30, `22.75` = 22:45)
- `day`: Current simulation day (1-indexed integer)

Examples:

```json
{ "signal": "tick.start", "data": { "tick": 32, "time": 14.5, "day": 1 } }
{ "signal": "tick.end",   "data": { "tick": 32, "time": 14.5, "day": 1 } }
```

### EXPORT_MAP – Export Generated Map

Action type: `map.export`

Parameters:

```json
{
  "action": "map.export",
  "params": {
    "filename": "my_map"
  }
}
```

Response signal: `map.exported`

```json
{
  "signal": "map.exported",
  "data": {
    "filename": "my_map.smap",
    "file_content": "ewogICJub2..."
  }
}
```

The `file_content` field contains the base64-encoded serialized map data. The client should decode this base64 string and trigger a browser download. The server appends the `.smap` extension to the filename if not already present.

Example usage in the Map Creator HUD:
1. User specifies filename in input field (or uses auto-populated default)
2. User clicks "Export Map" button
3. Client sends `map.export` action with user-provided filename
4. Server serializes the current map and responds with base64-encoded content
5. Client decodes base64, creates a Blob, and triggers download via temporary object URL
6. Object URL is cleaned up immediately to prevent memory leaks

### IMPORT_MAP – Import Previously Exported Map

Action type: `map.import`

Parameters:

```json
{
  "action": "map.import",
  "params": {
    "file_content": "ewogICJub2Rlcy...",
    "filename": "my_map.smap"
  }
}
```

Response signal: `map.imported`

```json
{
  "signal": "map.imported",
  "data": {
    "filename": "my_map.smap"
  }
}
```

The `file_content` field must contain the base64-encoded map file data. After successfully importing, the server will emit a `map.created` signal with the full map data, allowing the client to update its state and preview as if a new map was generated.

Example usage in the Map Creator HUD:
1. User clicks "Import Map" button
2. Native file picker opens, filtered to `.smap` files
3. User selects a file
4. Client reads file as ArrayBuffer, converts to base64
5. Client sends `map.import` action with base64 content and filename
6. Server deserializes and validates the map
7. Server responds with `map.imported` signal
8. Server emits `map.created` signal with the loaded map data
9. Client updates form parameters and graph preview via existing `map.created` handler

### EXPORT_SIMULATION_STATE – Save Current Simulation State

Action type: `simulation.export_state`

**Availability**: Only when simulation is paused

Parameters:

```json
{
  "action": "simulation.export_state",
  "params": {
    "filename": "save1"
  }
}
```

Response signal: `simulation.state_exported`

```json
{
  "signal": "simulation.state_exported",
  "data": {
    "filename": "save1.ssave",
    "file_content": "ewogICJncmF..."
  }
}
```

The `file_content` field contains the base64-encoded serialized simulation state, including all agents, packages, tick count, time, and other runtime state. The server appends the `.ssave` extension to the filename if not already present.

**Use cases**:
- Save progress at specific simulation milestones
- Create checkpoints before testing risky scenarios
- Share interesting simulation states with others
- Debug by capturing state at error points

Example usage in Simulation Controls:
1. User pauses simulation
2. Export section becomes visible with filename input
3. User edits filename (e.g., "checkpoint_day5")
4. User clicks "Export State"
5. Client sends `simulation.export_state` action
6. Server serializes entire simulation state
7. Server responds with base64-encoded content
8. Client decodes, creates Blob, triggers download of `.ssave` file
9. Object URL cleaned up immediately

### IMPORT_SIMULATION_STATE – Load Previously Saved State

Action type: `simulation.import_state`

**Availability**: When simulation is idle, stopped, or paused

Parameters:

```json
{
  "action": "simulation.import_state",
  "params": {
    "file_content": "ewogICJncm...",
    "filename": "save1.ssave"
  }
}
```

Response signal: `simulation.state_imported`

```json
{
  "signal": "simulation.state_imported",
  "data": {
    "filename": "save1.ssave"
  }
}
```

The `file_content` field must contain the base64-encoded simulation state file data. After successfully importing, the simulation state is fully restored to the saved point, including all agents, packages, tick count, and time.

**Use cases**:
- Resume from a previous checkpoint
- Load shared simulation scenarios
- Replay interesting situations
- Test different strategies from the same starting point

Example usage in Simulation Controls:
1. User clicks "Import State" (available when idle/stopped/paused)
2. Native file picker opens, filtered to `.ssave` files
3. User selects a save file
4. Client reads file as ArrayBuffer, converts to base64
5. Client sends `simulation.import_state` action
6. Server deserializes and validates the state
7. Server restores simulation to saved state
8. Server responds with `simulation.state_imported` signal
9. Simulation can be resumed from loaded state

### CREATE_MAP – Generate New Map Procedurally

Action type: `map.create`

Parameters:

```json
{
  "action": "map.create",
  "params": {
    "map_width": 10000,
    "map_height": 10000,
    "num_major_centers": 3,
    "minor_per_major": 2.0,
    "center_separation": 2500.0,
    "urban_sprawl": 800.0,
    "local_density": 50.0,
    "rural_density": 5.0,
    "intra_connectivity": 0.3,
    "inter_connectivity": 2,
    "arterial_ratio": 0.2,
    "gridness": 0.3,
    "ring_road_prob": 0.5,
    "highway_curviness": 0.2,
    "rural_settlement_prob": 0.15,
    "seed": 42
  }
}
```

Response signal: `map.created` with empty data `{}` (statistics TBD).

Example (server → client; arrays truncated):

```json
{
  "signal": "map.created",
  "data": {
    "map_width": 1000,
    "map_height": 1000,
    "num_major_centers": 3,
    "...": "...",
    "generated_nodes": 142,
    "generated_edges": 356,
    "generated_sites": 13,
    "graph": {
      "nodes": [{ "id": "0", "x": 639.43, "y": 25.01 }, { "...": "..." }],
      "edges": [
        {
          "id": "0",
          "from_node": "50",
          "to_node": "52",
          "length_m": 70.33,
          "mode": 1,
          "road_class": "L",
          "lanes": 1,
          "max_speed_kph": 44.11,
          "weight_limit_kg": 6903.77
        },
        { "...": "..." }
      ]
    }
  }
}
```

### Signal: agent.created – Post-Creation Snapshot

Base payload shared by all agent kinds:

```ts
type AgentEnvelopeBase = {
  id: string;
  kind: 'truck' | 'building' | 'broker';
  inbox_count: number;   // >= 0
  outbox_count: number;  // >= 0
  tags: Record<string, unknown>; // defaults to {}
};
```

Variants:

- Building agents append a `building` object that currently mirrors the identifier and may grow with structural metadata.
- Truck agents provide the full motion state and vehicle parameters.
- Broker agents provide balance information for order management.

```ts
type GraphIndex = string | number;

type BuildingAgentPayload = AgentEnvelopeBase & {
  kind: 'building';
  building: { id: string };
};

type TruckAgentPayload = AgentEnvelopeBase & {
  kind: 'truck';
  max_speed_kph: number;      // >= 0
  current_speed_kph: number;  // >= 0
  current_node: GraphIndex | null;
  current_edge: GraphIndex | null;
  edge_progress_m: number;    // >= 0
  route: GraphIndex[];
  destination: GraphIndex | null;
};

type BrokerAgentPayload = AgentEnvelopeBase & {
  kind: 'broker';
  balance_ducats?: number;    // >= 0, optional
};

type AgentCreatedPayload = BuildingAgentPayload | TruckAgentPayload | BrokerAgentPayload;
```

### Action: agent.create – Agent Data Schemas

When creating agents, `agent_data` varies by `agent_kind`:

```ts
// For trucks
type TruckAgentData = {
  max_speed_kph?: number;         // >= 0
  capacity?: number;              // >= 0
  risk_factor?: number;           // 0..1
  initial_balance_ducats?: number; // >= 0
  fuel_tank_capacity_l?: number;  // >= 0
  initial_fuel_l?: number;        // >= 0
};

// For brokers
type BrokerAgentData = {
  balance_ducats?: number;        // >= 0
};

// For buildings
type BuildingAgentData = {};
```

Examples:

```json
{
  "signal": "agent.created",
  "data": {
    "id": "test3",
    "kind": "building",
    "tags": {},
    "inbox_count": 0,
    "outbox_count": 0,
    "building": { "id": "test3" }
  }
}
```

```json
{
  "signal": "agent.created",
  "data": {
    "id": "test2",
    "kind": "truck",
    "max_speed_kph": 100.0,
    "current_speed_kph": 0.0,
    "current_node": 110,
    "current_edge": null,
    "edge_progress_m": 0.0,
    "route": [],
    "destination": null,
    "inbox_count": 0,
    "outbox_count": 0,
    "tags": {}
  }
}
```

```json
{
  "signal": "agent.created",
  "data": {
    "id": "broker-001",
    "kind": "broker",
    "balance_ducats": 10000,
    "inbox_count": 0,
    "outbox_count": 0,
    "tags": {}
  }
}
```

Downstream systems should tolerate additional properties introduced by the server; the schema intentionally uses `.catchall(z.unknown())` on each variant to allow forward-compatible extensions.

### Signal: agent.updated – Per-Tick Agent State Updates

The `agent.updated` signal provides the full current state of an agent. The payload varies by agent kind.

#### Truck Agent Updated

```ts
type TruckAgentUpdatedPayload = {
  id: string;
  kind: 'truck';
  max_speed_kph: number;
  capacity: number;
  loaded_packages: string[];
  current_speed_kph: number;
  current_node: GraphIndex | null;
  current_edge: GraphIndex | null;
  route: GraphIndex[];
  route_start_node: GraphIndex | null;
  route_end_node: GraphIndex | null;
  current_building_id: string | null;
  driving_time_s: number;
  resting_time_s: number;
  is_resting: boolean;
  balance_ducats: number;
  risk_factor: number;           // 0..1
  is_seeking_parking: boolean;
  original_destination: GraphIndex | null;
  fuel_tank_capacity_l: number;
  current_fuel_l: number;
  co2_emitted_kg: number;
  is_seeking_gas_station: boolean;
  is_fueling: boolean;
  agent_id: string;
  tick: number;
};
```

Example:

```json
{
  "signal": "agent.updated",
  "data": {
    "id": "11b4b0ae-627e-4343-b5ba-ff98d765c81d",
    "kind": "truck",
    "max_speed_kph": 80.0,
    "capacity": 20.0,
    "loaded_packages": [],
    "current_speed_kph": 20.0,
    "current_node": null,
    "current_edge": 328,
    "route": [1, 5, 21, 6, 29, 20, 33, 28, 58],
    "route_start_node": null,
    "route_end_node": 58,
    "current_building_id": null,
    "driving_time_s": 0.0,
    "resting_time_s": 0.0,
    "is_resting": false,
    "balance_ducats": 1000.0,
    "risk_factor": 0.5,
    "is_seeking_parking": false,
    "original_destination": null,
    "fuel_tank_capacity_l": 100.0,
    "current_fuel_l": 10.0,
    "co2_emitted_kg": 0.0,
    "is_seeking_gas_station": true,
    "is_fueling": false,
    "agent_id": "11b4b0ae-627e-4343-b5ba-ff98d765c81d",
    "tick": 2
  }
}
```

#### Broker Agent Updated

```ts
type BrokerAgentUpdatedPayload = {
  id: string;
  kind: 'broker';
  balance_ducats: number;
  queue_size: number;
  assigned_count: number;
  has_active_negotiation: boolean;
  agent_id: string;
  tick: number;
};
```

Example:

```json
{
  "signal": "agent.updated",
  "data": {
    "id": "broker-main",
    "kind": "broker",
    "balance_ducats": 10000.0,
    "queue_size": 0,
    "assigned_count": 1,
    "has_active_negotiation": false,
    "agent_id": "broker-main",
    "tick": 7
  }
}
```

### Signal: building.updated – Building State Changes

The `building.updated` signal provides the current state of a building. Building types include `site`, `parking`, and `gas_station`.

#### Site Building Updated

```ts
type PackageConfig = {
  size_range: [number, number];
  value_range_currency: [number, number];
  pickup_deadline_range_ticks: [number, number];
  delivery_deadline_range_ticks: [number, number];
  priority_weights: Record<string, number>;   // e.g., "Priority.LOW": 0.4
  urgency_weights: Record<string, number>;    // e.g., "DeliveryUrgency.STANDARD": 0.6
};

type BuildingStatistics = {
  packages_generated: number;
  packages_picked_up: number;
  packages_delivered: number;
  packages_expired: number;
  total_value_delivered: number;
  total_value_expired: number;
};

type SiteBuildingUpdatedPayload = {
  building_id: string;
  building: {
    id: string;
    type: 'site';
    capacity: number;
    current_agents: string[];
    name: string;
    activity_rate: number;
    loading_rate_tonnes_per_min: number;
    destination_weights: Record<string, number>;
    package_config: PackageConfig;
    active_packages: string[];
    statistics: BuildingStatistics;
  };
  tick: number;
};
```

Example:

```json
{
  "signal": "building.updated",
  "data": {
    "building_id": "node116_site_4",
    "building": {
      "id": "node116_site_4",
      "capacity": 3,
      "current_agents": [],
      "name": "Site 116",
      "activity_rate": 442.93,
      "loading_rate_tonnes_per_min": 0.5,
      "destination_weights": {
        "node62_site_0": 0.23,
        "node65_site_1": 0.26,
        "node46_site_2": 0.25,
        "node58_site_3": 0.26
      },
      "package_config": {
        "size_range": [1.0, 30.0],
        "value_range_currency": [10.0, 1000.0],
        "pickup_deadline_range_ticks": [1800, 7200],
        "delivery_deadline_range_ticks": [3600, 14400],
        "priority_weights": {
          "Priority.LOW": 0.4,
          "Priority.MEDIUM": 0.3,
          "Priority.HIGH": 0.2,
          "Priority.URGENT": 0.1
        },
        "urgency_weights": {
          "DeliveryUrgency.STANDARD": 0.6,
          "DeliveryUrgency.EXPRESS": 0.3,
          "DeliveryUrgency.SAME_DAY": 0.1
        }
      },
      "active_packages": ["pkg-node116_site_4-53-0", "pkg-node116_site_4-65-1"],
      "statistics": {
        "packages_generated": 4,
        "packages_picked_up": 0,
        "packages_delivered": 0,
        "packages_expired": 0,
        "total_value_delivered": 0.0,
        "total_value_expired": 0.0
      },
      "type": "site"
    },
    "tick": 155
  }
}
```

#### Parking and Gas Station Buildings

These building types follow similar structures:

```ts
type ParkingBuildingPayload = {
  id: string;
  type: 'parking';
  capacity: number;
  current_agents: string[];
};

type GasStationBuildingPayload = {
  id: string;
  type: 'gas_station';
  capacity: number;
  current_agents: string[];
  cost_factor: number;
};
```

### Signal: package.created – New Package Generated

The `package.created` signal is emitted when a new package is generated at a site.

```ts
type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
type DeliveryUrgency = 'STANDARD' | 'EXPRESS' | 'SAME_DAY';

type PackageCreatedPayload = {
  package_id: string;
  origin_building_id: string;
  destination_building_id: string;
  size: number;
  value_currency: number;
  priority: Priority;
  urgency: DeliveryUrgency;
  pickup_deadline_tick: number;
  delivery_deadline_tick: number;
  created_at_tick: number;
  tick: number;
};
```

Example:

```json
{
  "signal": "package.created",
  "data": {
    "package_id": "pkg-node116_site_4-53-0",
    "origin_building_id": "node116_site_4",
    "destination_building_id": "node62_site_0",
    "size": 15.5,
    "value_currency": 450.0,
    "priority": "MEDIUM",
    "urgency": "STANDARD",
    "pickup_deadline_tick": 3600,
    "delivery_deadline_tick": 10800,
    "created_at_tick": 53,
    "tick": 53
  }
}
```

## Request/Response Matching

- Preferred: include `request_id` in actions; server echoes it in responding signals.
- Fallback: default matcher uses the action→signal mapping; supports interleaved signals.
- Errors: `signal: "error"` may carry `request_id`; the client resolves the pending promise with this error envelope.

## Connection Lifecycle

- Reconnect: Exponential backoff with jitter (0.5s → 30s cap). See [`net/backoff`](modules/net/backoff.md).
- Transport: Browser WebSocket wrapper with lifecycle hooks. See [`net/transport/browser-websocket`](modules/net/transport/browser-websocket.md).
- Client API: `connect()`, `disconnect()`, `on(signal, handler)`, `onAny(handler)`, `sendAction()`, `waitFor()`. See [`net/client`](modules/net/client.md).
