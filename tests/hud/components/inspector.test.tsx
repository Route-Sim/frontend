/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import * as React from 'react';
import {
  KeyValue,
  InspectorHeader,
  SectionHeader,
  InspectorFooter,
} from '@/hud/components/inspector/common';
import { AgentInspector } from '@/hud/components/inspector/agent-inspector';
import { BuildingInspector } from '@/hud/components/inspector/building-inspector';
import { NodeInspector } from '@/hud/components/inspector/node-inspector';
import { RoadInspector } from '@/hud/components/inspector/road-inspector';
import { TreeInspector } from '@/hud/components/inspector/tree-inspector';
import { Car, MapPin, Milestone, TreeDeciduous } from 'lucide-react';
import { asTruckId, asNodeId, asRoadId, asBuildingId } from '@/sim/domain/ids';
import type { Truck, Node, Road, Parking, Site } from '@/sim/domain/entities';

// Mock useSimSnapshot hook
vi.mock('@/hud/hooks/use-sim-snapshot', () => ({
  useSimSnapshot: vi.fn(),
}));

// Mock getRoadById selector
vi.mock('@/sim/selectors', () => ({
  getRoadById: vi.fn(),
}));

import { useSimSnapshot } from '@/hud/hooks/use-sim-snapshot';
import { getRoadById } from '@/sim/selectors';

describe('inspector/common', () => {
  afterEach(() => {
    cleanup();
  });

  describe('KeyValue', () => {
    it('renders label and value', () => {
      render(<KeyValue label="Test Label" value="Test Value" />);
      expect(screen.getByText('Test Label')).toBeTruthy();
      expect(screen.getByText('Test Value')).toBeTruthy();
    });

    it('renders unit when provided', () => {
      render(<KeyValue label="Speed" value="50" unit="km/h" />);
      expect(screen.getByText('Speed')).toBeTruthy();
      expect(screen.getByText('50')).toBeTruthy();
      expect(screen.getByText('km/h')).toBeTruthy();
    });

    it('renders ReactNode value', () => {
      render(
        <KeyValue
          label="Count"
          value={<span data-testid="custom-value">42</span>}
        />,
      );
      expect(screen.getByTestId('custom-value')).toBeTruthy();
      expect(screen.getByText('42')).toBeTruthy();
    });
  });

  describe('InspectorHeader', () => {
    it('renders icon, title, and id', () => {
      render(
        <InspectorHeader icon={Car} title="Test Title" id="test-id-123" />,
      );
      expect(screen.getByText('Test Title')).toBeTruthy();
      expect(screen.getByText('test-id-123')).toBeTruthy();
    });

    it('renders subtitle when provided', () => {
      render(
        <InspectorHeader
          icon={MapPin}
          title="Node"
          id="node-1"
          subtitle="Main Intersection"
        />,
      );
      expect(screen.getByText('Main Intersection')).toBeTruthy();
    });

    it('does not render subtitle when not provided', () => {
      const { container } = render(
        <InspectorHeader icon={Car} title="Test" id="test-1" />,
      );
      const subtitle = container.querySelector('.text-xs.text-black\\/50');
      expect(subtitle).toBeNull();
    });
  });

  describe('SectionHeader', () => {
    it('renders section title', () => {
      render(<SectionHeader title="Properties" />);
      expect(screen.getByText('Properties')).toBeTruthy();
    });
  });

  describe('InspectorFooter', () => {
    it('renders close button and calls onClose when clicked', () => {
      const onClose = vi.fn();
      render(<InspectorFooter onClose={onClose} />);
      const button = screen.getByText('Return to the default view');
      expect(button).toBeTruthy();
      fireEvent.click(button);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});

describe('inspector/AgentInspector', () => {
  const mockUseSimSnapshot = useSimSnapshot as ReturnType<typeof vi.fn>;
  const mockGetRoadById = getRoadById as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSimSnapshot.mockReturnValue({
      roads: {},
      nodes: {},
      trucks: {},
      buildings: {},
      edges: {},
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders agent inspector with basic info', () => {
    const truckId = asTruckId('truck-1');
    const truck: Truck = {
      id: truckId,
      capacity: 100,
      maxSpeed: 80,
      currentSpeed: 50,
      packageIds: ['pkg-1', 'pkg-2'],
      maxFuel: 100,
      currentFuel: 75,
      co2Emission: 12.5,
      balanceDucats: 0,
      inboxCount: 5,
      outboxCount: 3,
      currentNodeId: asNodeId('node-1'),
      currentEdgeId: null,
      currentBuildingId: null,
      edgeProgress: 0,
      route: [asNodeId('node-1'), asNodeId('node-2')],
      destinationNodeId: asNodeId('node-2'),
      routeStartNodeId: null,
      routeEndNodeId: null,
    };

    render(<AgentInspector id="truck-1" data={truck} />);

    expect(screen.getByText('Delivery Truck')).toBeTruthy();
    expect(screen.getByText(/Speed/i)).toBeTruthy();
    // Verify speed value with unit context
    expect(screen.getByText(/\/ 80 km\/h/)).toBeTruthy();
    expect(screen.getByText(/75 L/)).toBeTruthy();
    // Verify CO2 emissions
    expect(screen.getByText(/CO₂ Emitted/i)).toBeTruthy();
    expect(screen.getByText(/12\.50/)).toBeTruthy();
  });

  it('shows moving status when speed > 0.1', () => {
    const truck: Truck = {
      id: asTruckId('truck-1'),
      capacity: 100,
      maxSpeed: 80,
      currentSpeed: 50,
      packageIds: [],
      maxFuel: 100,
      currentFuel: 50,
      co2Emission: 0,
      balanceDucats: 0,
      inboxCount: 0,
      outboxCount: 0,
      currentNodeId: asNodeId('node-1'),
      currentEdgeId: null,
      currentBuildingId: null,
      edgeProgress: 0,
      route: [],
      destinationNodeId: null,
      routeStartNodeId: null,
      routeEndNodeId: null,
    };

    render(<AgentInspector id="truck-1" data={truck} />);
    expect(screen.getByText('Moving')).toBeTruthy();
  });

  it('shows idle status when speed <= 0.1', () => {
    const truck: Truck = {
      id: asTruckId('truck-1'),
      capacity: 100,
      maxSpeed: 80,
      currentSpeed: 0.05,
      packageIds: [],
      maxFuel: 100,
      currentFuel: 50,
      co2Emission: 0,
      balanceDucats: 0,
      inboxCount: 0,
      outboxCount: 0,
      currentNodeId: asNodeId('node-1'),
      currentEdgeId: null,
      currentBuildingId: null,
      edgeProgress: 0,
      route: [],
      destinationNodeId: null,
      routeStartNodeId: null,
      routeEndNodeId: null,
    };

    render(<AgentInspector id="truck-1" data={truck} />);
    expect(screen.getByText('Idle')).toBeTruthy();
  });

  it('displays fuel progress bar', () => {
    const truck: Truck = {
      id: asTruckId('truck-1'),
      capacity: 100,
      maxSpeed: 80,
      currentSpeed: 0,
      packageIds: [],
      maxFuel: 100,
      currentFuel: 75,
      co2Emission: 0,
      balanceDucats: 0,
      inboxCount: 0,
      outboxCount: 0,
      currentNodeId: asNodeId('node-1'),
      currentEdgeId: null,
      currentBuildingId: null,
      edgeProgress: 0,
      route: [],
      destinationNodeId: null,
      routeStartNodeId: null,
      routeEndNodeId: null,
    };

    const { container } = render(<AgentInspector id="truck-1" data={truck} />);
    const fuelBar = container.querySelector('.bg-emerald-500');
    expect(fuelBar).toBeTruthy();
    expect(fuelBar?.getAttribute('style')).toContain('width: 75%');
  });

  it('displays cargo load progress bar', () => {
    const truck: Truck = {
      id: asTruckId('truck-1'),
      capacity: 10,
      maxSpeed: 80,
      currentSpeed: 0,
      packageIds: ['pkg-1', 'pkg-2', 'pkg-3'],
      maxFuel: 100,
      currentFuel: 50,
      co2Emission: 0,
      balanceDucats: 0,
      inboxCount: 0,
      outboxCount: 0,
      currentNodeId: asNodeId('node-1'),
      currentEdgeId: null,
      currentBuildingId: null,
      edgeProgress: 0,
      route: [],
      destinationNodeId: null,
      routeStartNodeId: null,
      routeEndNodeId: null,
    };

    const { container } = render(<AgentInspector id="truck-1" data={truck} />);
    const loadBar = container.querySelector('.bg-blue-500');
    expect(loadBar).toBeTruthy();
    expect(loadBar?.getAttribute('style')).toContain('width: 30%');
  });

  it('displays route information', () => {
    const truck: Truck = {
      id: asTruckId('truck-1'),
      capacity: 100,
      maxSpeed: 80,
      currentSpeed: 0,
      packageIds: [],
      maxFuel: 100,
      currentFuel: 50,
      co2Emission: 0,
      balanceDucats: 0,
      inboxCount: 0,
      outboxCount: 0,
      currentNodeId: asNodeId('node-1'),
      currentEdgeId: null,
      currentBuildingId: null,
      edgeProgress: 0,
      route: [asNodeId('n1'), asNodeId('n2'), asNodeId('n3')],
      destinationNodeId: asNodeId('n3'),
      routeStartNodeId: null,
      routeEndNodeId: null,
    };

    render(<AgentInspector id="truck-1" data={truck} />);
    expect(screen.getByText(/Route Remaining/i)).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
  });

  it('displays segment progress when on an edge', () => {
    const edgeId = asRoadId('road-1');
    const truck: Truck = {
      id: asTruckId('truck-1'),
      capacity: 100,
      maxSpeed: 80,
      currentSpeed: 0,
      packageIds: [],
      maxFuel: 100,
      currentFuel: 50,
      co2Emission: 0,
      balanceDucats: 0,
      inboxCount: 0,
      outboxCount: 0,
      currentNodeId: asNodeId('node-1'),
      currentEdgeId: edgeId,
      currentBuildingId: null,
      edgeProgress: 25,
      route: [],
      destinationNodeId: null,
      routeStartNodeId: null,
      routeEndNodeId: null,
    };

    const road: Road = {
      id: edgeId,
      startNodeId: asNodeId('node-1'),
      endNodeId: asNodeId('node-2'),
      lengthM: 100,
      roadClass: 'A',
      mode: 1,
      lanes: 2,
      maxSpeedKph: 60,
      weightLimitKg: null,
      truckIds: [],
    };

    mockGetRoadById.mockReturnValue(road);

    const { container } = render(<AgentInspector id="truck-1" data={truck} />);
    expect(screen.getByText(/Segment Progress/i)).toBeTruthy();
    expect(screen.getByText('25')).toBeTruthy();
    const progressBar = container.querySelector('.bg-green-500');
    expect(progressBar).toBeTruthy();
    expect(progressBar?.getAttribute('style')).toContain('width: 25%');
  });

  it('handles missing road gracefully when edgeProgress is set', () => {
    const edgeId = asRoadId('road-1');
    const truck: Truck = {
      id: asTruckId('truck-1'),
      capacity: 100,
      maxSpeed: 80,
      currentSpeed: 0,
      packageIds: [],
      maxFuel: 100,
      currentFuel: 50,
      co2Emission: 0,
      balanceDucats: 0,
      inboxCount: 0,
      outboxCount: 0,
      currentNodeId: asNodeId('node-1'),
      currentEdgeId: edgeId,
      currentBuildingId: null,
      edgeProgress: 25,
      route: [],
      destinationNodeId: null,
      routeStartNodeId: null,
      routeEndNodeId: null,
    };

    mockGetRoadById.mockReturnValue(undefined);

    render(<AgentInspector id="truck-1" data={truck} />);
    // Should not crash, progress should be calculated with default lengthM = 1
    expect(screen.getByText(/Segment Progress/i)).toBeTruthy();
  });

  it('displays inbox and outbox counts', () => {
    const truck: Truck = {
      id: asTruckId('truck-1'),
      capacity: 100,
      maxSpeed: 80,
      currentSpeed: 0,
      packageIds: [],
      maxFuel: 100,
      currentFuel: 50,
      co2Emission: 0,
      balanceDucats: 0,
      inboxCount: 7,
      outboxCount: 4,
      currentNodeId: asNodeId('node-1'),
      currentEdgeId: null,
      currentBuildingId: null,
      edgeProgress: 0,
      route: [],
      destinationNodeId: null,
      routeStartNodeId: null,
      routeEndNodeId: null,
    };

    render(<AgentInspector id="truck-1" data={truck} />);
    expect(screen.getByText('Inbox')).toBeTruthy();
    expect(screen.getByText('7')).toBeTruthy();
    expect(screen.getByText('Outbox')).toBeTruthy();
    expect(screen.getByText('4')).toBeTruthy();
  });
});

describe('inspector/BuildingInspector', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders parking inspector with capacity', () => {
    const parkingId = asBuildingId('parking-1');
    const parking: Parking = {
      id: parkingId,
      nodeId: asNodeId('node-1'),
      kind: 'parking',
      truckIds: [asTruckId('truck-1')],
      capacity: 20,
    };

    render(<BuildingInspector id="parking-1" data={parking} />);
    expect(screen.getByText('Parking Lot')).toBeTruthy();
    expect(screen.getByText(/Total Capacity/i)).toBeTruthy();
    expect(screen.getByText('20')).toBeTruthy();
    expect(screen.getByText(/spots/i)).toBeTruthy();
  });

  it('renders site inspector with activity rate', () => {
    const siteId = asBuildingId('site-1');
    const site: Site = {
      id: siteId,
      nodeId: asNodeId('node-1'),
      kind: 'site',
      truckIds: [],
      packageIds: ['pkg-1', 'pkg-2'],
      name: 'Warehouse Alpha',
      activityRate: 15.5,
    };

    render(<BuildingInspector id="site-1" data={site} />);
    expect(screen.getByText('Delivery Site')).toBeTruthy();
    expect(screen.getByText('Warehouse Alpha')).toBeTruthy();
    expect(screen.getAllByText(/Activity Rate/i).length).toBeGreaterThan(0);
    expect(screen.getByText('15.5')).toBeTruthy();
  });

  it('displays vehicles present count', () => {
    const parking: Parking = {
      id: asBuildingId('parking-1'),
      nodeId: asNodeId('node-1'),
      kind: 'parking',
      truckIds: [asTruckId('t1'), asTruckId('t2')],
      capacity: 10,
    };

    render(<BuildingInspector id="parking-1" data={parking} />);
    expect(screen.getByText(/Vehicles Parked/i)).toBeTruthy();
    expect(screen.getByText('2/10')).toBeTruthy();
  });

  it('displays packages pending for sites', () => {
    const site: Site = {
      id: asBuildingId('site-1'),
      nodeId: asNodeId('node-1'),
      kind: 'site',
      truckIds: [],
      packageIds: ['pkg-1', 'pkg-2', 'pkg-3'],
      name: 'Site',
      activityRate: 10,
    };

    render(<BuildingInspector id="site-1" data={site} />);
    expect(screen.getByText(/Packages Pending/i)).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
  });

  it('handles site without activityRate', () => {
    const site: Site = {
      id: asBuildingId('site-1'),
      nodeId: asNodeId('node-1'),
      kind: 'site',
      truckIds: [],
      packageIds: [],
      name: 'Site',
      activityRate: undefined,
    };

    render(<BuildingInspector id="site-1" data={site} />);
    expect(screen.getByText(/Current Activity/i)).toBeTruthy();
  });
});

describe('inspector/NodeInspector', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders node inspector with coordinates', () => {
    const node: Node = {
      id: asNodeId('node-1'),
      x: 123.456,
      y: 789.012,
      buildingIds: [],
    };

    render(<NodeInspector id="node-1" data={node} />);
    expect(screen.getByText('Intersection Node')).toBeTruthy();
    expect(screen.getByText('123')).toBeTruthy();
    expect(screen.getByText('789')).toBeTruthy();
  });

  it('displays connected buildings count', () => {
    const node: Node = {
      id: asNodeId('node-1'),
      x: 0,
      y: 0,
      buildingIds: [asBuildingId('b1'), asBuildingId('b2'), asBuildingId('b3')],
    };

    render(<NodeInspector id="node-1" data={node} />);
    expect(screen.getByText(/Connected Buildings/i)).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByText(/structures/i)).toBeTruthy();
  });
});

describe('inspector/RoadInspector', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders road inspector with basic specs', () => {
    const road: Road = {
      id: asRoadId('road-1'),
      startNodeId: asNodeId('node-1'),
      endNodeId: asNodeId('node-2'),
      lengthM: 150.5,
      roadClass: 'A',
      mode: 1,
      lanes: 3,
      maxSpeedKph: 80,
      weightLimitKg: null,
      truckIds: [],
    };

    render(<RoadInspector id="road-1" data={road} />);
    expect(screen.getByText('Road Segment')).toBeTruthy();
    expect(screen.getByText('151m')).toBeTruthy(); // rounded
    expect(screen.getByText(/Class/i)).toBeTruthy();
    expect(screen.getByText('A')).toBeTruthy();
    expect(screen.getByText(/Lanes/i)).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByText(/Speed Limit/i)).toBeTruthy();
    expect(screen.getByText('80')).toBeTruthy();
    expect(screen.getByText(/km\/h/i)).toBeTruthy();
  });

  it('displays weight limit when present', () => {
    const road: Road = {
      id: asRoadId('road-1'),
      startNodeId: asNodeId('node-1'),
      endNodeId: asNodeId('node-2'),
      lengthM: 100,
      roadClass: 'A',
      mode: 1,
      lanes: 2,
      maxSpeedKph: 60,
      weightLimitKg: 5000,
      truckIds: [],
    };

    render(<RoadInspector id="road-1" data={road} />);
    expect(screen.getByText(/Weight Limit/i)).toBeTruthy();
    expect(screen.getByText('5000')).toBeTruthy();
    expect(screen.getByText(/kg/i)).toBeTruthy();
  });

  it('displays topology with start and end nodes', () => {
    const road: Road = {
      id: asRoadId('road-1'),
      startNodeId: asNodeId('node-start'),
      endNodeId: asNodeId('node-end'),
      lengthM: 100,
      roadClass: 'L',
      mode: 1,
      lanes: 2,
      maxSpeedKph: 50,
      weightLimitKg: null,
      truckIds: [],
    };

    render(<RoadInspector id="road-1" data={road} />);
    expect(screen.getByText('node-start')).toBeTruthy();
    expect(screen.getByText('node-end')).toBeTruthy();
    expect(screen.getByText('→')).toBeTruthy();
  });

  it('displays vehicles on road count', () => {
    const road: Road = {
      id: asRoadId('road-1'),
      startNodeId: asNodeId('node-1'),
      endNodeId: asNodeId('node-2'),
      lengthM: 100,
      roadClass: 'A',
      mode: 1,
      lanes: 2,
      maxSpeedKph: 60,
      weightLimitKg: null,
      truckIds: [asTruckId('t1'), asTruckId('t2'), asTruckId('t3')],
    };

    render(<RoadInspector id="road-1" data={road} />);
    expect(screen.getByText(/Vehicles on Road/i)).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByText(/active/i)).toBeTruthy();
  });

  it('displays mode value', () => {
    const road: Road = {
      id: asRoadId('road-1'),
      startNodeId: asNodeId('node-1'),
      endNodeId: asNodeId('node-2'),
      lengthM: 100,
      roadClass: 'Z',
      mode: 2,
      lanes: 1,
      maxSpeedKph: 40,
      weightLimitKg: null,
      truckIds: [],
    };

    render(<RoadInspector id="road-1" data={road} />);
    expect(screen.getByText(/Mode/i)).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
  });
});

describe('inspector/TreeInspector', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders tree inspector with placeholder message', () => {
    render(<TreeInspector />);
    expect(screen.getByText('Vegetation')).toBeTruthy();
    expect(
      screen.getByText(
        'Just a tree. Standing here and there. Does nothing. Do not touch it.',
      ),
    ).toBeTruthy();
  });

  it('displays correct ID', () => {
    render(<TreeInspector />);
    expect(screen.getByText('visual-prop')).toBeTruthy();
  });
});
