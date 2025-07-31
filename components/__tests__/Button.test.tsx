import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../Button';
import { TouchableOpacity, ActivityIndicator } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';

// Mock useThemeColor
jest.mock('@/hooks/useThemeColor', () => ({
  useThemeColor: jest.fn(() => '#0a7ea4'),
}));

describe('Button', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render with title', () => {
    const { getByText } = render(
      <Button title="Test Button" onPress={mockOnPress} />
    );
    
    expect(getByText('Test Button')).toBeTruthy();
  });

  it('should call onPress when pressed', () => {
    const { UNSAFE_getByType } = render(
      <Button title="Press Me" onPress={mockOnPress} />
    );
    
    const touchable = UNSAFE_getByType(TouchableOpacity);
    fireEvent.press(touchable);
    
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('should apply primary variant styles by default', () => {
    const { UNSAFE_getByType } = render(
      <Button title="Primary Button" onPress={mockOnPress} />
    );

    const button = UNSAFE_getByType(TouchableOpacity);
    const styles = button.props.style;
    
    // Find backgroundColor in flattened styles
    const flatStyles = Array.isArray(styles) ? styles : [styles];
    const bgColorStyle = flatStyles.find(s => s?.backgroundColor);
    
    expect(bgColorStyle?.backgroundColor).toBe('#0a7ea4');
  });

  it('should apply secondary variant styles', () => {
    const { UNSAFE_getByType } = render(
      <Button title="Secondary Button" onPress={mockOnPress} variant="secondary" />
    );

    const button = UNSAFE_getByType(TouchableOpacity);
    const styles = button.props.style;
    
    const flatStyles = Array.isArray(styles) ? styles : [styles];
    const bgColorStyle = flatStyles.find(s => s?.backgroundColor !== undefined);
    const borderStyle = flatStyles.find(s => s?.borderWidth !== undefined);
    
    expect(bgColorStyle?.backgroundColor).toBe('transparent');
    expect(borderStyle?.borderWidth).toBe(1);
  });

  it('should apply danger variant styles', () => {
    const { UNSAFE_getByType } = render(
      <Button title="Danger Button" onPress={mockOnPress} variant="danger" />
    );

    const button = UNSAFE_getByType(TouchableOpacity);
    const styles = button.props.style;
    
    const flatStyles = Array.isArray(styles) ? styles : [styles];
    const bgColorStyle = flatStyles.find(s => s?.backgroundColor);
    
    expect(bgColorStyle?.backgroundColor).toBe('#FF3B30');
  });

  it('should be disabled when disabled prop is true', () => {
    const { UNSAFE_getByType } = render(
      <Button title="Disabled Button" onPress={mockOnPress} disabled={true} />
    );

    const button = UNSAFE_getByType(TouchableOpacity);
    expect(button.props.disabled).toBe(true);

    fireEvent.press(button);
    expect(mockOnPress).not.toHaveBeenCalled();
  });

  it('should show loading state', () => {
    const { UNSAFE_getByType, queryByText } = render(
      <Button title="Loading Button" onPress={mockOnPress} loading={true} />
    );

    const activityIndicator = UNSAFE_getByType(ActivityIndicator);
    expect(activityIndicator).toBeTruthy();
    
    // Title should be hidden when loading
    expect(queryByText('Loading Button')).toBeFalsy();
  });

  it('should be disabled when loading', () => {
    const { UNSAFE_getByType } = render(
      <Button title="Loading" onPress={mockOnPress} loading={true} />
    );

    const button = UNSAFE_getByType(TouchableOpacity);
    expect(button.props.disabled).toBe(true);

    fireEvent.press(button);
    expect(mockOnPress).not.toHaveBeenCalled();
  });

  it('should apply small size styles', () => {
    const { UNSAFE_getByType } = render(
      <Button title="Small Button" onPress={mockOnPress} size="small" />
    );

    const button = UNSAFE_getByType(TouchableOpacity);
    const styles = button.props.style;
    
    const flatStyles = Array.isArray(styles) ? styles : [styles];
    const sizeStyle = flatStyles.find(s => s?.paddingVertical !== undefined);
    
    expect(sizeStyle?.paddingVertical).toBe(6);
    expect(sizeStyle?.paddingHorizontal).toBe(12);
  });

  it('should apply large size styles', () => {
    const { UNSAFE_getByType } = render(
      <Button title="Large Button" onPress={mockOnPress} size="large" />
    );

    const button = UNSAFE_getByType(TouchableOpacity);
    const styles = button.props.style;
    
    const flatStyles = Array.isArray(styles) ? styles : [styles];
    const sizeStyle = flatStyles.find(s => s?.paddingVertical !== undefined);
    
    expect(sizeStyle?.paddingVertical).toBe(16);
    expect(sizeStyle?.paddingHorizontal).toBe(24);
  });

  it('should apply custom styles', () => {
    const customStyle = { marginTop: 20 };
    const { UNSAFE_getByType } = render(
      <Button 
        title="Custom Button" 
        onPress={mockOnPress} 
        style={customStyle}
      />
    );

    const button = UNSAFE_getByType(TouchableOpacity);
    const styles = button.props.style;
    
    const flatStyles = Array.isArray(styles) ? styles : [styles];
    const hasCustomStyle = flatStyles.some(s => s?.marginTop === 20);
    
    expect(hasCustomStyle).toBe(true);
  });

  it('should apply custom text styles', () => {
    const customTextStyle = { fontSize: 20, fontWeight: 'bold' };
    const { getByText } = render(
      <Button 
        title="Custom Text" 
        onPress={mockOnPress} 
        textStyle={customTextStyle}
      />
    );

    const text = getByText('Custom Text');
    const styles = text.props.style;
    
    const flatStyles = Array.isArray(styles) ? styles : [styles];
    const hasFontSize = flatStyles.some(s => s?.fontSize === 20);
    const hasFontWeight = flatStyles.some(s => s?.fontWeight === 'bold');
    
    expect(hasFontSize).toBe(true);
    expect(hasFontWeight).toBe(true);
  });
});