import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { HudMenu } from '@/hud/components/hud-menu';
import { useHudVisibility } from '@/hud/state/hud-visibility';
import type { HudPanelId } from '@/hud/state/hud-visibility';

vi.mock('@/hud/state/hud-visibility', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hud/state/hud-visibility')>();
  return {
    ...actual,
    useHudVisibility: vi.fn(),
  };
});

describe('HudMenu', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });
  it('should render trigger button', () => {
    vi.mocked(useHudVisibility).mockReturnValue({
      state: {},
      isVisible: vi.fn(),
      setVisible: vi.fn(),
      toggle: vi.fn(),
    });

    const { container } = render(<HudMenu />);
    const { getByText } = within(container);
    expect(getByText('HUD')).toBeInTheDocument();
  });

  it('should show menu items when clicked', async () => {
    const setVisible = vi.fn();
    vi.mocked(useHudVisibility).mockReturnValue({
      state: { 'play-controls': true, 'net-events': false } as Record<HudPanelId, boolean>,
      isVisible: vi.fn(),
      setVisible,
      toggle: vi.fn(),
    });

    const { container } = render(<HudMenu />);
    
    // Open menu - scope to this container
    const { getByText } = within(container);
    const trigger = getByText('HUD');
    fireEvent.pointerDown(trigger); // DropdownMenu uses pointer events

    // Check for panel labels
    expect(await screen.findByText(/Simulation Controls/i)).toBeInTheDocument();
    expect(await screen.findByText('Net Events')).toBeInTheDocument();

    // Click an item
    const item = screen.getByText('Net Events');
    fireEvent.click(item);

    expect(setVisible).toHaveBeenCalledWith('net-events', true);
  });
});

