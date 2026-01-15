/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import * as React from 'react';
import { FocusInspector } from '@/hud/containers/focus-inspector';
import { useSelectedObject } from '@/hud/hooks/use-selected-object';
import { useFocusState } from '@/hud/state/focus-state';
import { HudVisibilityProvider } from '@/hud/state/hud-visibility';
import { asTruckId, asRoadId, asNodeId, asBuildingId } from '@/sim/domain/ids';
import type { Node, Road, Parking, Site, Truck } from '@/sim';

// Mock inspector components
vi.mock('@/hud/components/inspector/agent-inspector', () => ({
  AgentInspector: ({ id }: { id: string }) => (
    <div data-testid="agent-inspector">Agent: {id}</div>
  ),
}));

vi.mock('@/hud/components/inspector/road-inspector', () => ({
  RoadInspector: ({ id }: { id: string }) => (
    <div data-testid="road-inspector">Road: {id}</div>
  ),
}));

vi.mock('@/hud/components/inspector/node-inspector', () => ({
  NodeInspector: ({ id }: { id: string }) => (
    <div data-testid="node-inspector">Node: {id}</div>
  ),
}));

vi.mock('@/hud/components/inspector/building-inspector', () => ({
  BuildingInspector: ({ id }: { id: string }) => (
    <div data-testid="building-inspector">Building: {id}</div>
  ),
  SiteInspector: ({ id }: { id: string }) => (
    <div data-testid="building-inspector">Building: {id}</div>
  ),
  ParkingInspector: ({ id }: { id: string }) => (
    <div data-testid="building-inspector">Building: {id}</div>
  ),
}));

vi.mock('@/hud/components/inspector/tree-inspector', () => ({
  TreeInspector: () => <div data-testid="tree-inspector">Tree</div>,
}));

vi.mock('@/hud/components/inspector/common', () => ({
  InspectorHeader: ({ title, id }: { title: string; id: string }) => (
    <div data-testid="inspector-header">
      {title}: {id}
    </div>
  ),
  InspectorFooter: ({ onClose }: { onClose: () => void }) => (
    <button data-testid="inspector-footer" onClick={onClose}>
      Close
    </button>
  ),
}));

// Mock hooks
vi.mock('@/hud/hooks/use-selected-object', () => ({
  useSelectedObject: vi.fn(),
}));

vi.mock('@/hud/state/focus-state', () => ({
  useFocusState: vi.fn(),
}));

describe('FocusInspector', () => {
  const mockUseSelectedObject = useSelectedObject as ReturnType<typeof vi.fn>;
  const mockUseFocusState = useFocusState as ReturnType<typeof vi.fn>;
  let clearFocusSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    clearFocusSpy = vi.fn();
    mockUseFocusState.mockReturnValue({
      focusedId: null,
      focusedType: null,
      focusedPosition: null,
      setFocus: vi.fn(),
      clearFocus: clearFocusSpy,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('should not render when no focus is set', () => {
    mockUseSelectedObject.mockReturnValue({
      id: null,
      type: null,
      object: null,
    });

    render(
      <HudVisibilityProvider>
        <FocusInspector />
      </HudVisibilityProvider>,
    );
    expect(screen.queryByTestId('agent-inspector')).toBeNull();
  });

  it('should render agent inspector when agent is focused', () => {
    const truckId = asTruckId('truck-1');
    const truck: Truck = {
      id: truckId,
      capacity: 100,
      maxSpeed: 80,
      currentSpeed: 50,
      packageIds: [],
      maxFuel: 100,
      currentFuel: 50,
      co2Emission: 0,
      inboxCount: 0,
      outboxCount: 0,
      currentNodeId: asNodeId('node-1'),
      currentEdgeId: null,
      currentBuildingId: null,
      edgeProgress: 0,
      route: [],
      destinationNodeId: asNodeId('node-2'),
      routeStartNodeId: null,
      routeEndNodeId: null,
    };

    mockUseSelectedObject.mockReturnValue({
      id: truckId,
      type: 'agent',
      object: { kind: 'agent', data: truck },
    });

    render(
      <HudVisibilityProvider>
        <FocusInspector />
      </HudVisibilityProvider>,
    );
    expect(screen.getByTestId('agent-inspector')).toBeTruthy();
    expect(screen.getByText('Agent: truck-1')).toBeTruthy();
  });

  it('should render road inspector when road is focused', () => {
    const roadId = asRoadId('road-1');
    const road: Road = {
      id: roadId,
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

    mockUseSelectedObject.mockReturnValue({
      id: roadId,
      type: 'road',
      object: { kind: 'road', data: road },
    });

    render(
      <HudVisibilityProvider>
        <FocusInspector />
      </HudVisibilityProvider>,
    );
    expect(screen.getByTestId('road-inspector')).toBeTruthy();
    expect(screen.getByText('Road: road-1')).toBeTruthy();
  });

  it('should render node inspector when node is focused', () => {
    const nodeId = asNodeId('node-1');
    const node: Node = {
      id: nodeId,
      x: 0,
      y: 0,
      buildingIds: [],
    };

    mockUseSelectedObject.mockReturnValue({
      id: nodeId,
      type: 'node',
      object: { kind: 'node', data: node },
    });

    render(
      <HudVisibilityProvider>
        <FocusInspector />
      </HudVisibilityProvider>,
    );
    expect(screen.getByTestId('node-inspector')).toBeTruthy();
    expect(screen.getByText('Node: node-1')).toBeTruthy();
  });

  it('should render building inspector for site', () => {
    const siteId = asBuildingId('site-1');
    const site: Site = {
      id: siteId,
      nodeId: asNodeId('node-1'),
      kind: 'site',
      truckIds: [],
      packageIds: [],
    };

    mockUseSelectedObject.mockReturnValue({
      id: siteId,
      type: 'building',
      object: { kind: 'site', data: site },
    });

    render(
      <HudVisibilityProvider>
        <FocusInspector />
      </HudVisibilityProvider>,
    );
    expect(screen.getByTestId('building-inspector')).toBeTruthy();
    expect(screen.getByText('Building: site-1')).toBeTruthy();
  });

  it('should render building inspector for parking', () => {
    const parkingId = asBuildingId('parking-1');
    const parking: Parking = {
      id: parkingId,
      nodeId: asNodeId('node-1'),
      kind: 'parking',
      truckIds: [],
      capacity: 10,
    };

    mockUseSelectedObject.mockReturnValue({
      id: parkingId,
      type: 'building',
      object: { kind: 'parking', data: parking },
    });

    render(
      <HudVisibilityProvider>
        <FocusInspector />
      </HudVisibilityProvider>,
    );
    expect(screen.getByTestId('building-inspector')).toBeTruthy();
    expect(screen.getByText('Building: parking-1')).toBeTruthy();
  });

  it('should render tree inspector when tree is focused', () => {
    mockUseSelectedObject.mockReturnValue({
      id: 'tree-1',
      type: 'tree',
      object: { kind: 'tree', data: null },
    });

    render(
      <HudVisibilityProvider>
        <FocusInspector />
      </HudVisibilityProvider>,
    );
    expect(screen.getByTestId('tree-inspector')).toBeTruthy();
    expect(screen.getByText('Tree')).toBeTruthy();
  });

  it('should render unknown object message when object not found', () => {
    mockUseSelectedObject.mockReturnValue({
      id: 'unknown-1',
      type: 'node',
      object: null,
    });

    render(
      <HudVisibilityProvider>
        <FocusInspector />
      </HudVisibilityProvider>,
    );
    expect(screen.getByTestId('inspector-header')).toBeTruthy();
    expect(screen.getByText('Unknown Object: unknown-1')).toBeTruthy();
    expect(
      screen.getByText('Object data not found in simulation.'),
    ).toBeTruthy();
  });

  it('should call clearFocus when footer close button is clicked', () => {
    const nodeId = asNodeId('node-1');
    const node: Node = {
      id: nodeId,
      x: 0,
      y: 0,
      buildingIds: [],
    };

    mockUseSelectedObject.mockReturnValue({
      id: nodeId,
      type: 'node',
      object: { kind: 'node', data: node },
    });

    const { container } = render(<FocusInspector />);
    const closeButtons = screen.getAllByTestId('inspector-footer');
    // Get the last one (the one for this specific inspector)
    const closeButton = closeButtons[closeButtons.length - 1];
    fireEvent.click(closeButton);
    expect(clearFocusSpy).toHaveBeenCalled();
  });
});
