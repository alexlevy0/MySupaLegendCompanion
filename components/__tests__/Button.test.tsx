import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../Button';

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
    const { getByText } = render(
      <Button title="Click Me" onPress={mockOnPress} />
    );

    const button = getByText('Click Me');
    fireEvent.press(button);

    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('should apply primary variant styles by default', () => {
    const { getByTestId } = render(
      <Button title="Primary Button" onPress={mockOnPress} />
    );

    const button = getByTestId('button-container');
    expect(button.props.style).toMatchObject({
      backgroundColor: '#0a7ea4',
    });
  });

  it('should apply secondary variant styles', () => {
    const { getByTestId } = render(
      <Button title="Secondary Button" onPress={mockOnPress} variant="secondary" />
    );

    const button = getByTestId('button-container');
    expect(button.props.style).toMatchObject({
      backgroundColor: '#E1E8ED',
    });
  });

  it('should apply danger variant styles', () => {
    const { getByTestId } = render(
      <Button title="Danger Button" onPress={mockOnPress} variant="danger" />
    );

    const button = getByTestId('button-container');
    expect(button.props.style).toMatchObject({
      backgroundColor: '#DC2626',
    });
  });

  it('should apply success variant styles', () => {
    const { getByTestId } = render(
      <Button title="Success Button" onPress={mockOnPress} variant="success" />
    );

    const button = getByTestId('button-container');
    expect(button.props.style).toMatchObject({
      backgroundColor: '#10B981',
    });
  });

  it('should be disabled when disabled prop is true', () => {
    const { getByText, getByTestId } = render(
      <Button title="Disabled Button" onPress={mockOnPress} disabled />
    );

    const button = getByTestId('button-touchable');
    expect(button.props.disabled).toBe(true);

    fireEvent.press(button);
    expect(mockOnPress).not.toHaveBeenCalled();
  });

  it('should show loading state', () => {
    const { getByTestId, queryByText } = render(
      <Button title="Loading Button" onPress={mockOnPress} loading />
    );

    const activityIndicator = getByTestId('button-loading');
    expect(activityIndicator).toBeTruthy();
    
    // Title should be hidden when loading
    expect(queryByText('Loading Button')).toBeFalsy();
  });

  it('should be disabled when loading', () => {
    const { getByTestId } = render(
      <Button title="Loading Button" onPress={mockOnPress} loading />
    );

    const button = getByTestId('button-touchable');
    expect(button.props.disabled).toBe(true);

    fireEvent.press(button);
    expect(mockOnPress).not.toHaveBeenCalled();
  });

  it('should apply small size styles', () => {
    const { getByTestId } = render(
      <Button title="Small Button" onPress={mockOnPress} size="small" />
    );

    const button = getByTestId('button-container');
    expect(button.props.style).toMatchObject({
      paddingVertical: 8,
      paddingHorizontal: 16,
    });
  });

  it('should apply large size styles', () => {
    const { getByTestId } = render(
      <Button title="Large Button" onPress={mockOnPress} size="large" />
    );

    const button = getByTestId('button-container');
    expect(button.props.style).toMatchObject({
      paddingVertical: 16,
      paddingHorizontal: 32,
    });
  });

  it('should apply custom styles', () => {
    const customStyle = {
      borderWidth: 2,
      borderColor: '#000',
    };

    const { getByTestId } = render(
      <Button title="Custom Button" onPress={mockOnPress} style={customStyle} />
    );

    const button = getByTestId('button-container');
    expect(button.props.style).toMatchObject(customStyle);
  });

  it('should apply custom text styles', () => {
    const customTextStyle = {
      fontSize: 20,
      fontWeight: 'bold',
    };

    const { getByText } = render(
      <Button title="Custom Text" onPress={mockOnPress} textStyle={customTextStyle} />
    );

    const text = getByText('Custom Text');
    expect(text.props.style).toMatchObject(customTextStyle);
  });

  it('should handle long press', () => {
    const mockOnLongPress = jest.fn();
    
    const { getByTestId } = render(
      <Button title="Long Press" onPress={mockOnPress} onLongPress={mockOnLongPress} />
    );

    const button = getByTestId('button-touchable');
    fireEvent(button, 'longPress');

    expect(mockOnLongPress).toHaveBeenCalledTimes(1);
    expect(mockOnPress).not.toHaveBeenCalled();
  });
});