import { renderHook, act } from '@testing-library/react-native';
import { useColorScheme } from '../useColorScheme.web';
import { useColorScheme as useRNColorScheme } from 'react-native';

// Mock React Native's useColorScheme
jest.mock('react-native', () => ({
  useColorScheme: jest.fn(),
}));

describe('useColorScheme.web', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return "light" initially before hydration', () => {
    (useRNColorScheme as jest.Mock).mockReturnValue('dark');

    const { result } = renderHook(() => useColorScheme());

    // Before hydration, should always return 'light'
    expect(result.current).toBe('light');
  });

  it('should return actual color scheme after hydration', async () => {
    (useRNColorScheme as jest.Mock).mockReturnValue('dark');

    const { result } = renderHook(() => useColorScheme());

    expect(result.current).toBe('light');

    // Wait for effect to run (hydration)
    await act(async () => {
      // Force the effect to run
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current).toBe('dark');
  });

  it('should update when native color scheme changes after hydration', async () => {
    const mockUseRNColorScheme = useRNColorScheme as jest.Mock;
    mockUseRNColorScheme.mockReturnValue('light');

    const { result, rerender } = renderHook(() => useColorScheme());

    // Wait for hydration
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current).toBe('light');

    // Change native color scheme
    mockUseRNColorScheme.mockReturnValue('dark');
    rerender();

    expect(result.current).toBe('dark');
  });

  it('should handle null color scheme from native', async () => {
    (useRNColorScheme as jest.Mock).mockReturnValue(null);

    const { result } = renderHook(() => useColorScheme());

    // Before hydration
    expect(result.current).toBe('light');

    // After hydration
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current).toBe(null);
  });

  it('should maintain hydration state across rerenders', async () => {
    (useRNColorScheme as jest.Mock).mockReturnValue('dark');

    const { result, rerender } = renderHook(() => useColorScheme());

    // Before hydration
    expect(result.current).toBe('light');

    // Hydrate
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current).toBe('dark');

    // Rerender should maintain hydration state
    rerender();
    expect(result.current).toBe('dark');
  });

  it('should only hydrate once', async () => {
    let effectCount = 0;
    
    // Mock useState to count effect calls
    const originalUseState = jest.requireActual('react').useState;
    jest.spyOn(require('react'), 'useState').mockImplementation((initial) => {
      if (initial === false) {
        const [state, setState] = originalUseState(initial);
        const wrappedSetState = (value: any) => {
          if (value === true) effectCount++;
          setState(value);
        };
        return [state, wrappedSetState];
      }
      return originalUseState(initial);
    });

    (useRNColorScheme as jest.Mock).mockReturnValue('dark');

    const { rerender } = renderHook(() => useColorScheme());

    // Wait for hydration
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Multiple rerenders
    rerender();
    rerender();
    rerender();

    // Effect should only have run once
    expect(effectCount).toBe(1);
  });
});