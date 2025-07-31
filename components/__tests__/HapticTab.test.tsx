import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { HapticTab } from '../HapticTab';
import * as Haptics from 'expo-haptics';

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'Light',
  },
}));

// Mock PlatformPressable
jest.mock('@react-navigation/elements', () => ({
  PlatformPressable: ({ children, onPressIn, ...props }: any) => {
    const { TouchableOpacity } = require('react-native');
    return (
      <TouchableOpacity onPressIn={onPressIn} {...props}>
        {children}
      </TouchableOpacity>
    );
  },
}));

describe('HapticTab', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    delete process.env.EXPO_OS;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should render correctly', () => {
    const mockProps = {
      children: <Text>Tab</Text>,
    } as any;

    const { getByText } = render(<HapticTab {...mockProps} />);
    expect(getByText('Tab')).toBeTruthy();
  });

  it('should trigger haptic feedback on iOS', () => {
    process.env.EXPO_OS = 'ios';
    
    const mockOnPressIn = jest.fn();
    const mockProps = {
      children: <Text>Tab</Text>,
      onPressIn: mockOnPressIn,
    } as any;

    const { getByText } = render(<HapticTab {...mockProps} />);
    const tab = getByText('Tab');
    
    fireEvent(tab, 'pressIn');

    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
    expect(mockOnPressIn).toHaveBeenCalled();
  });

  it('should call onPressIn callback', () => {
    const mockOnPressIn = jest.fn();
    const mockProps = {
      children: <Text>Tab</Text>,
      onPressIn: mockOnPressIn,
    } as any;

    const { getByText } = render(<HapticTab {...mockProps} />);
    const tab = getByText('Tab');
    
    fireEvent(tab, 'pressIn');

    expect(mockOnPressIn).toHaveBeenCalled();
  });
});