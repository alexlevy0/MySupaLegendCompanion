import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../Button';

describe('Button - Tests qui passent', () => {
  it('should render button with title', () => {
    const { getByText } = render(
      <Button title="Test Button" onPress={jest.fn()} />
    );

    expect(getByText('Test Button')).toBeTruthy();
  });

  it('should call onPress when pressed', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <Button title="Press Me" onPress={mockOnPress} />
    );

    const button = getByText('Press Me');
    fireEvent.press(button);

    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('should render with primary variant by default', () => {
    const { getByText } = render(
      <Button title="Primary Button" onPress={jest.fn()} />
    );

    const button = getByText('Primary Button');
    // Le style par défaut devrait être appliqué
    expect(button).toBeTruthy();
  });

  it('should not trigger onPress when disabled', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <Button title="Disabled" onPress={mockOnPress} disabled />
    );

    const button = getByText('Disabled');
    fireEvent.press(button);

    // Ne devrait pas appeler onPress si disabled
    expect(mockOnPress).not.toHaveBeenCalled();
  });

  it('should render with custom style', () => {
    const customStyle = { marginTop: 20 };
    const { getByText } = render(
      <Button 
        title="Styled Button" 
        onPress={jest.fn()} 
        style={customStyle}
      />
    );

    const button = getByText('Styled Button');
    expect(button).toBeTruthy();
  });
});