import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ThemedView } from '../ThemedView';

// Mock useThemeColor
jest.mock('@/hooks/useThemeColor', () => ({
  useThemeColor: jest.fn((colors) => colors.light || '#ffffff'),
}));

describe('ThemedView', () => {
  it('should render correctly', () => {
    const { getByTestId } = render(
      <ThemedView testID="themed-view">
        <Text>Content</Text>
      </ThemedView>
    );

    expect(getByTestId('themed-view')).toBeTruthy();
  });

  it('should apply custom style', () => {
    const customStyle = { padding: 20 };
    const { getByTestId } = render(
      <ThemedView testID="themed-view" style={customStyle}>
        <Text>Content</Text>
      </ThemedView>
    );

    const view = getByTestId('themed-view');
    expect(view.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ backgroundColor: '#ffffff' }),
        customStyle,
      ])
    );
  });

  it('should use custom light color', () => {
    const { useThemeColor } = require('@/hooks/useThemeColor');
    useThemeColor.mockReturnValue('#ff0000');
    
    render(
      <ThemedView lightColor="#ff0000" darkColor="#00ff00">
        <Text>Content</Text>
      </ThemedView>
    );

    expect(useThemeColor).toHaveBeenCalledWith(
      { light: '#ff0000', dark: '#00ff00' },
      'background'
    );
  });
});