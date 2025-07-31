import { renderHook } from '@testing-library/react-native';
import { useThemeColor } from '../useThemeColor';
import { useColorScheme } from '../useColorScheme';
import { Colors } from '@/constants/Colors';

// Mock useColorScheme
jest.mock('../useColorScheme', () => ({
  useColorScheme: jest.fn(),
}));

describe('useThemeColor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return light theme color when color scheme is light', () => {
    (useColorScheme as jest.Mock).mockReturnValue('light');

    const { result } = renderHook(() => 
      useThemeColor({}, 'text')
    );

    expect(result.current).toBe(Colors.light.text);
  });

  it('should return dark theme color when color scheme is dark', () => {
    (useColorScheme as jest.Mock).mockReturnValue('dark');

    const { result } = renderHook(() => 
      useThemeColor({}, 'text')
    );

    expect(result.current).toBe(Colors.dark.text);
  });

  it('should prioritize color from props over theme color', () => {
    (useColorScheme as jest.Mock).mockReturnValue('light');

    const customColor = '#FF0000';
    const { result } = renderHook(() => 
      useThemeColor({ light: customColor }, 'text')
    );

    expect(result.current).toBe(customColor);
  });

  it('should use dark prop color when in dark mode', () => {
    (useColorScheme as jest.Mock).mockReturnValue('dark');

    const customDarkColor = '#00FF00';
    const { result } = renderHook(() => 
      useThemeColor({ dark: customDarkColor }, 'text')
    );

    expect(result.current).toBe(customDarkColor);
  });

  it('should use light prop color when in light mode', () => {
    (useColorScheme as jest.Mock).mockReturnValue('light');

    const customLightColor = '#0000FF';
    const customDarkColor = '#FF00FF';
    const { result } = renderHook(() => 
      useThemeColor({ light: customLightColor, dark: customDarkColor }, 'text')
    );

    expect(result.current).toBe(customLightColor);
  });

  it('should default to light theme when color scheme is null', () => {
    (useColorScheme as jest.Mock).mockReturnValue(null);

    const { result } = renderHook(() => 
      useThemeColor({}, 'background')
    );

    expect(result.current).toBe(Colors.light.background);
  });

  it('should work with all color names', () => {
    (useColorScheme as jest.Mock).mockReturnValue('light');

    const colorNames: Array<keyof typeof Colors.light> = [
      'text', 'background', 'tint', 'icon', 'tabIconDefault', 'tabIconSelected'
    ];

    colorNames.forEach(colorName => {
      const { result } = renderHook(() => 
        useThemeColor({}, colorName)
      );
      expect(result.current).toBe(Colors.light[colorName]);
    });
  });

  it('should update when color scheme changes', () => {
    const mockUseColorScheme = useColorScheme as jest.Mock;
    mockUseColorScheme.mockReturnValue('light');

    const { result, rerender } = renderHook(() => 
      useThemeColor({}, 'text')
    );

    expect(result.current).toBe(Colors.light.text);

    // Change color scheme
    mockUseColorScheme.mockReturnValue('dark');
    rerender();

    expect(result.current).toBe(Colors.dark.text);
  });

  it('should handle both props and theme colors correctly', () => {
    (useColorScheme as jest.Mock).mockReturnValue('light');

    const customLightColor = '#123456';
    const { result } = renderHook(() => 
      useThemeColor({ light: customLightColor }, 'icon')
    );

    expect(result.current).toBe(customLightColor);

    // Without custom color
    const { result: result2 } = renderHook(() => 
      useThemeColor({}, 'icon')
    );

    expect(result2.current).toBe(Colors.light.icon);
  });

  it('should handle undefined props correctly', () => {
    (useColorScheme as jest.Mock).mockReturnValue('dark');

    const { result } = renderHook(() => 
      useThemeColor({ light: undefined, dark: undefined }, 'tint')
    );

    expect(result.current).toBe(Colors.dark.tint);
  });
});