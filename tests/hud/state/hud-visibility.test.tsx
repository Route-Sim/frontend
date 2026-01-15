import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  HudVisibilityProvider,
  useHudVisibility,
  HUD_PANELS,
} from '@/hud/state/hud-visibility';

/**
 * @vitest-environment happy-dom
 */
describe('HudVisibilityContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should provide default visibility', () => {
    const { result } = renderHook(() => useHudVisibility(), {
      wrapper: HudVisibilityProvider,
    });

    expect(result.current.isVisible('simulation-controls')).toBe(true);
    expect(result.current.isVisible('net-events')).toBe(false);
  });

  it('should toggle visibility', () => {
    const { result } = renderHook(() => useHudVisibility(), {
      wrapper: HudVisibilityProvider,
    });

    expect(result.current.isVisible('net-events')).toBe(false);

    act(() => {
      result.current.toggle('net-events');
    });

    expect(result.current.isVisible('net-events')).toBe(true);
  });

  it('should set explicit visibility', () => {
    const { result } = renderHook(() => useHudVisibility(), {
      wrapper: HudVisibilityProvider,
    });

    act(() => {
      result.current.setVisible('camera-help', false);
    });
    expect(result.current.isVisible('camera-help')).toBe(false);

    act(() => {
      result.current.setVisible('camera-help', true);
    });
    expect(result.current.isVisible('camera-help')).toBe(true);
  });

  it('should persist to localStorage', () => {
    const { result } = renderHook(() => useHudVisibility(), {
      wrapper: HudVisibilityProvider,
    });

    act(() => {
      result.current.toggle('net-events');
    });

    const stored = localStorage.getItem('hud:panels:v1');
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored!);
    expect(parsed['net-events']).toBe(true);
  });

  it('should rehydrate from localStorage', () => {
    // Seed storage
    const state = { 'net-events': true };
    localStorage.setItem('hud:panels:v1', JSON.stringify(state));

    const { result } = renderHook(() => useHudVisibility(), {
      wrapper: HudVisibilityProvider,
    });

    expect(result.current.isVisible('net-events')).toBe(true);
    // Should fall back to default for others
    expect(result.current.isVisible('simulation-controls')).toBe(true);
  });

  it('should list known panels', () => {
    expect(HUD_PANELS).toContain('simulation-controls');
    expect(HUD_PANELS).toContain('camera-help');
    expect(HUD_PANELS).toContain('net-events');
    expect(HUD_PANELS.length).toBe(3);
  });

  it('should not update state when setVisible is called with same value', () => {
    const { result } = renderHook(() => useHudVisibility(), {
      wrapper: HudVisibilityProvider,
    });

    const initialState = result.current.state;

    act(() => {
      // default is true; setting true again should keep same object
      result.current.setVisible('simulation-controls', true);
    });

    expect(result.current.state).toBe(initialState);
  });

  it('should fall back to defaults when localStorage contains invalid JSON', () => {
    localStorage.setItem('hud:panels:v1', '{not: "json"}');

    const { result } = renderHook(() => useHudVisibility(), {
      wrapper: HudVisibilityProvider,
    });

    // Should not throw and should use default visibility
    expect(result.current.isVisible('simulation-controls')).toBe(true);
    expect(result.current.isVisible('net-events')).toBe(false);
  });

  it('should throw if used outside provider', () => {
    // React logs errors to console when hooks throw; silence for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useHudVisibility());
    }).toThrow('useHudVisibility must be used within provider');

    consoleSpy.mockRestore();
  });
});
