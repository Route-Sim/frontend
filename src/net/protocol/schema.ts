import { z } from 'zod';

const AgentKind = z.enum(['truck', 'building', 'broker']);
const TruckAgentData = z.object({
  max_speed_kph: z.number().min(0).optional(),
  capacity: z.number().min(0).optional(),
  risk_factor: z.number().min(0).max(1).optional(),
  initial_balance_ducats: z.number().min(0).optional(),
  fuel_tank_capacity_l: z.number().min(0).optional(),
  initial_fuel_l: z.number().min(0).optional(),
});
const BrokerAgentData = z.object({
  balance_ducats: z.number().min(0).optional(),
});
const BuildingAgentData = z.object({});

// Action schemas: exact params per action
export const ActionSchemas = {
  'simulation.start': z.object({
    tick_rate: z.number().int().min(1),
    speed: z.number().min(0),
  }),
  'simulation.stop': z.object({}),
  'simulation.resume': z.object({}),
  'simulation.pause': z.object({}),
  'simulation.update': z.object({
    tick_rate: z.number().int().min(1),
    speed: z.number().min(0),
  }),
  'map.create': z
    .object({
      map_width: z.number().positive(),
      map_height: z.number().positive(),
      num_major_centers: z.number().int().min(1),
      minor_per_major: z.number().min(0),
      center_separation: z.number().positive(),
      urban_sprawl: z.number().positive(),
      local_density: z.number().gt(0),
      rural_density: z.number().min(0),
      intra_connectivity: z.number().min(0).max(1),
      inter_connectivity: z.number().min(1),
      arterial_ratio: z.number().min(0).max(1),
      gridness: z.number().min(0).max(1),
      ring_road_prob: z.number().min(0).max(1),
      highway_curviness: z.number().min(0).max(1),
      rural_settlement_prob: z.number().min(0).max(1),
      urban_sites_per_km2: z.number().min(0),
      rural_sites_per_km2: z.number().min(0),
      urban_parkings_per_km2: z.number().min(0),
      rural_parkings_per_km2: z.number().min(0),
      urban_gas_stations_per_km2: z.number().min(0),
      rural_gas_stations_per_km2: z.number().min(0),
      urban_activity_rate_range: z.tuple([
        z.number().min(0),
        z.number().min(0),
      ]),
      rural_activity_rate_range: z.tuple([
        z.number().min(0),
        z.number().min(0),
      ]),
      gas_station_capacity_range: z.tuple([
        z.number().min(0),
        z.number().min(0),
      ]),
      gas_station_cost_factor_range: z.tuple([
        z.number().min(0),
        z.number().min(0),
      ]),
      seed: z.number().int(),
    })
    .strict(),
  'agent.create': z
    .object({
      agent_id: z.string(),
      agent_kind: AgentKind,
      agent_data: z.union([TruckAgentData, BuildingAgentData, BrokerAgentData]).optional(),
    })
    .catchall(z.unknown()),
  'agent.update': z
    .object({ 
      agent_id: z.string(), 
      agent_data: z.union([TruckAgentData, BuildingAgentData, BrokerAgentData]).optional(),
    })
    .catchall(z.unknown()),
  'agent.delete': z.object({ agent_id: z.string() }),
  'agent.list': z.object({}),
  'agent.describe': z.object({ agent_id: z.string() }),
  'map.export': z.object({
    filename: z.string().min(1),
  }),
  'map.import': z.object({
    file_content: z.string().min(1),
    filename: z.string().min(1),
  }),
  'simulation.export_state': z.object({
    filename: z.string().min(1),
  }),
  'simulation.import_state': z.object({
    file_content: z.string().min(1),
    filename: z.string().min(1),
  }),
} as const;

export type ActionName = keyof typeof ActionSchemas;
export type ActionParams = {
  [K in ActionName]: z.infer<(typeof ActionSchemas)[K]>;
};

// Shared types for signals
const RoadClass = z.enum(['A', 'S', 'GP', 'G', 'Z', 'L', 'D']);

const ParkingData = z
  .object({
    id: z.string(),
    type: z.literal('parking'),
    capacity: z.number().int().min(0),
    current_agents: z.array(z.string()).default([]),
  })
  .catchall(z.unknown());

const SiteData = z
  .object({
    id: z.string(),
    type: z.literal('site'),
    name: z.string().optional(),
    activity_rate: z.number().min(0).optional(),
    active_packages: z.array(z.string()).default([]),
    // Capture other complex fields as unknown for now to match strict() or just catchall
  })
  .catchall(z.unknown());

const GasStationData = z
  .object({
    id: z.string(),
    type: z.literal('gas_station'),
    capacity: z.number().int().min(0),
    current_agents: z.array(z.string()).default([]),
    cost_factor: z.number().min(0),
  })
  .catchall(z.unknown());

const BuildingData = z.union([ParkingData, SiteData, GasStationData]);

const GraphNode = z.object({
  id: z.string(),
  x: z.number(),
  y: z.number(),
  buildings: z.array(BuildingData).default([]),
});
const GraphEdge = z.object({
  id: z.string(),
  from_node: z.string(),
  to_node: z.string(),
  length_m: z.number(),
  mode: z.number().int().min(0),
  road_class: RoadClass,
  lanes: z.number().int().min(1),
  max_speed_kph: z.number().min(0),
  weight_limit_kg: z.number().min(0).nullable(),
});

const AgentTags = z.record(z.string(), z.unknown()).default({});

const AgentSignalBase = z.object({
  id: z.string(),
  kind: AgentKind,
  inbox_count: z.number().int().min(0),
  outbox_count: z.number().int().min(0),
  tags: AgentTags,
});

const GraphIndex = z.union([z.string(), z.number()]);

const BuildingAgentSignalData = AgentSignalBase.extend({
  kind: z.literal('building'),
  building: z
    .object({
      id: z.string(),
    })
    .catchall(z.unknown()),
}).catchall(z.unknown());

const TruckAgentSignalData = AgentSignalBase.extend({
  kind: z.literal('truck'),
  max_speed_kph: z.number().min(0),
  current_speed_kph: z.number().min(0),
  current_node: GraphIndex.nullable(),
  current_edge: GraphIndex.nullable(),
  edge_progress_m: z.number().min(0),
  route: z.array(GraphIndex),
  destination: GraphIndex.nullable(),
  route_start_node: GraphIndex.nullable(),
  route_end_node: GraphIndex.nullable(),
  current_building_id: z.string().nullable(),
}).catchall(z.unknown());

const BrokerAgentSignalData = AgentSignalBase.extend({
  kind: z.literal('broker'),
  balance_ducats: z.number().min(0).optional(),
}).catchall(z.unknown());

const AgentSignalData = z.union([
  BuildingAgentSignalData,
  TruckAgentSignalData,
  BrokerAgentSignalData,
]);

// Agent updated signal schemas (different from agent.created)
const TruckAgentUpdatedData = z
  .object({
    id: z.string(),
    kind: z.literal('truck'),
    max_speed_kph: z.number().min(0),
    capacity: z.number().min(0),
    loaded_packages: z.array(z.string()).default([]),
    current_speed_kph: z.number().min(0),
    current_node: GraphIndex.nullable(),
    current_edge: GraphIndex.nullable(),
    route: z.array(GraphIndex),
    route_start_node: GraphIndex.nullable(),
    route_end_node: GraphIndex.nullable(),
    current_building_id: z.string().nullable(),
    driving_time_s: z.number().min(0),
    resting_time_s: z.number().min(0),
    is_resting: z.boolean(),
    balance_ducats: z.number().min(0),
    risk_factor: z.number().min(0).max(1),
    is_seeking_parking: z.boolean(),
    original_destination: GraphIndex.nullable(),
    fuel_tank_capacity_l: z.number().min(0),
    current_fuel_l: z.number().min(0),
    co2_emitted_kg: z.number().min(0),
    is_seeking_gas_station: z.boolean(),
    is_fueling: z.boolean(),
    agent_id: z.string(),
    tick: z.number().int().min(0),
  })
  .catchall(z.unknown());

const BrokerAgentUpdatedData = z
  .object({
    id: z.string(),
    kind: z.literal('broker'),
    balance_ducats: z.number().min(0),
    queue_size: z.number().int().min(0),
    assigned_count: z.number().int().min(0),
    has_active_negotiation: z.boolean(),
    agent_id: z.string(),
    tick: z.number().int().min(0),
  })
  .catchall(z.unknown());

const AgentUpdatedData = z.union([TruckAgentUpdatedData, BrokerAgentUpdatedData]);

// Building updated signal schemas
const PackageConfigData = z
  .object({
    size_range: z.tuple([z.number().min(0), z.number().min(0)]),
    value_range_currency: z.tuple([z.number().min(0), z.number().min(0)]),
    pickup_deadline_range_ticks: z.tuple([
      z.number().int().min(0),
      z.number().int().min(0),
    ]),
    delivery_deadline_range_ticks: z.tuple([
      z.number().int().min(0),
      z.number().int().min(0),
    ]),
    priority_weights: z.record(z.string(), z.number().min(0)),
    urgency_weights: z.record(z.string(), z.number().min(0)),
  })
  .catchall(z.unknown());

const BuildingStatisticsData = z
  .object({
    packages_generated: z.number().int().min(0),
    packages_picked_up: z.number().int().min(0),
    packages_delivered: z.number().int().min(0),
    packages_expired: z.number().int().min(0),
    total_value_delivered: z.number().min(0),
    total_value_expired: z.number().min(0),
  })
  .catchall(z.unknown());

const SiteBuildingUpdatedData = z
  .object({
    id: z.string(),
    type: z.literal('site'),
    capacity: z.number().int().min(0),
    current_agents: z.array(z.string()).default([]),
    name: z.string(),
    activity_rate: z.number().min(0),
    loading_rate_tonnes_per_min: z.number().min(0),
    destination_weights: z.record(z.string(), z.number().min(0)),
    package_config: PackageConfigData,
    active_packages: z.array(z.string()).default([]),
    statistics: BuildingStatisticsData,
  })
  .catchall(z.unknown());

const ParkingBuildingUpdatedData = z
  .object({
    id: z.string(),
    type: z.literal('parking'),
    capacity: z.number().int().min(0),
    current_agents: z.array(z.string()).default([]),
  })
  .catchall(z.unknown());

const GasStationBuildingUpdatedData = z
  .object({
    id: z.string(),
    type: z.literal('gas_station'),
    capacity: z.number().int().min(0),
    current_agents: z.array(z.string()).default([]),
    cost_factor: z.number().min(0),
  })
  .catchall(z.unknown());

const BuildingUpdatedData = z.union([
  SiteBuildingUpdatedData,
  ParkingBuildingUpdatedData,
  GasStationBuildingUpdatedData,
]);

// Package schemas
const Priority = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);
const DeliveryUrgency = z.enum(['STANDARD', 'EXPRESS', 'SAME_DAY']);

const PackageCreatedData = z
  .object({
    package_id: z.string(),
    origin_building_id: z.string(),
    destination_building_id: z.string(),
    size: z.number().min(0),
    value_currency: z.number().min(0),
    priority: Priority,
    urgency: DeliveryUrgency,
    pickup_deadline_tick: z.number().int().min(0),
    delivery_deadline_tick: z.number().int().min(0),
    created_at_tick: z.number().int().min(0),
    tick: z.number().int().min(0),
  })
  .catchall(z.unknown());

// Signal schemas: exact data per signal
export const SignalSchemas = {
  'simulation.started': z.object({
    tick_rate: z.number().int().min(1),
    speed: z.number().min(0),
  }),
  'simulation.stopped': z.object({}),
  'simulation.resumed': z.object({}),
  'simulation.paused': z.object({}),
  'simulation.updated': z.object({
    tick_rate: z.number().int().min(1),
    speed: z.number().min(0),
  }),
  'tick.start': z.object({ 
    tick: z.number().int().min(0),
    time: z.number().min(0),
    day: z.number().int().min(0),
  }),
  'tick.end': z.object({
    tick: z.number().int().min(0),
    time: z.number().min(0),
    day: z.number().int().min(0),
  }),
  'map.created': z
    .object({
      // echo of creation params
      map_width: z.number().positive(),
      map_height: z.number().positive(),
      num_major_centers: z.number().int().min(1),
      minor_per_major: z.number().min(0),
      center_separation: z.number().positive(),
      urban_sprawl: z.number().positive(),
      local_density: z.number().gt(0),
      rural_density: z.number().min(0),
      intra_connectivity: z.number().min(0).max(1),
      inter_connectivity: z.number().min(1),
      arterial_ratio: z.number().min(0).max(1),
      gridness: z.number().min(0).max(1),
      ring_road_prob: z.number().min(0).max(1),
      highway_curviness: z.number().min(0).max(1),
      rural_settlement_prob: z.number().min(0).max(1),
      urban_sites_per_km2: z.number().min(0),
      rural_sites_per_km2: z.number().min(0),
      urban_parkings_per_km2: z.number().min(0),
      rural_parkings_per_km2: z.number().min(0),
      urban_gas_stations_per_km2: z.number().min(0),
      rural_gas_stations_per_km2: z.number().min(0),
      urban_activity_rate_range: z.tuple([
        z.number().min(0),
        z.number().min(0),
      ]),
      rural_activity_rate_range: z.tuple([
        z.number().min(0),
        z.number().min(0),
      ]),
      gas_station_capacity_range: z.tuple([
        z.number().min(0),
        z.number().min(0),
      ]),
      gas_station_cost_factor_range: z.tuple([
        z.number().min(0),
        z.number().min(0),
      ]),
      seed: z.number().int(),
      // generation summary + graph
      generated_nodes: z.number().int().min(0),
      generated_edges: z.number().int().min(0),
      generated_sites: z.number().int().min(0),
      generated_parkings: z.number().int().min(0),
      graph: z.object({
        nodes: z.array(GraphNode),
        edges: z.array(GraphEdge),
      }),
    })
    .strict(),
  'agent.created': AgentSignalData,
  'agent.updated': AgentUpdatedData,
  'agent.deleted': z.object({ agent_id: z.string() }),
  'agent.listed': z.object({
    total: z.number().int().min(0),
    agents: z.array(AgentSignalData),
    tick: z.number().int().min(0),
  }),
  'agent.described': AgentSignalData,
  'building.updated': z
    .object({
      building_id: z.string(),
      building: BuildingUpdatedData,
      tick: z.number().int().min(0),
    })
    .catchall(z.unknown()),
  'package.created': PackageCreatedData,
  'map.exported': z.object({
    filename: z.string(),
    file_content: z.string(),
  }),
  'map.imported': z.object({
    filename: z.string(),
  }),
  'simulation.state_exported': z.object({
    filename: z.string(),
    file_content: z.string(),
  }),
  'simulation.state_imported': z.object({
    filename: z.string(),
  }),
  error: z.object({ code: z.string(), message: z.string() }),
} as const;

export type SignalName = keyof typeof SignalSchemas;
export type SignalData = {
  [K in SignalName]: z.infer<(typeof SignalSchemas)[K]>;
};

export type ActionEnvelopeOf<A extends ActionName> = {
  action: A;
  params: ActionParams[A];
  request_id?: string;
};

export type SignalEnvelopeOf<S extends SignalName> = {
  signal: S;
  data: SignalData[S];
  request_id?: string;
};

export type ActionUnion = {
  [K in ActionName]: ActionEnvelopeOf<K>;
}[ActionName];

export type SignalUnion = {
  [K in SignalName]: SignalEnvelopeOf<K>;
}[SignalName];

// Runtime envelope unions for decoding/validation
const ActionEnvelopeUnion = (() => {
  const variants = Object.entries(ActionSchemas).map(([name, schema]) =>
    z.object({
      action: z.literal(name as ActionName),
      params: schema as z.ZodTypeAny,
      request_id: z.string().optional(),
    }),
  );
  return z.union(
    variants as unknown as [z.ZodTypeAny, z.ZodTypeAny, ...z.ZodTypeAny[]],
  );
})();

const SignalEnvelopeUnion = (() => {
  const variants = Object.entries(SignalSchemas).map(([name, schema]) =>
    z.object({
      signal: z.literal(name as SignalName),
      data: schema as z.ZodTypeAny,
      request_id: z.string().optional(),
    }),
  );
  return z.union(
    variants as unknown as [z.ZodTypeAny, z.ZodTypeAny, ...z.ZodTypeAny[]],
  );
})();

export function decodeSignal(raw: unknown): SignalUnion {
  return SignalEnvelopeUnion.parse(raw) as SignalUnion;
}

export function decodeAction(raw: unknown): ActionUnion {
  return ActionEnvelopeUnion.parse(raw) as ActionUnion;
}

export function encodeAction<A extends ActionName>(
  action: A,
  params: ActionParams[A],
  requestId?: string,
): ActionEnvelopeOf<A> {
  return { action, params, request_id: requestId };
}
