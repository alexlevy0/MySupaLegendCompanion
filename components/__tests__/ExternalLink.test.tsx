import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { ExternalLink } from '../ExternalLink';

// Mock expo modules
jest.mock('expo-web-browser', () => ({
  openBrowserAsync: jest.fn(),
}));

jest.mock('expo-router', () => ({
  Link: ({ children, onPress, ...props }: any) => {
    const { Text } = require('react-native');
    return (
      <Text onPress={onPress} {...props}>
        {children}
      </Text>
    );
  },
}));

describe('ExternalLink', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render link with children', () => {
    const { getByText } = render(
      <ExternalLink href="https://example.com">
        Visit Example
      </ExternalLink>
    );

    expect(getByText('Visit Example')).toBeTruthy();
  });

  it('should open browser on native platforms', async () => {
    Platform.OS = 'ios';
    const { openBrowserAsync } = require('expo-web-browser');
    
    const { getByText } = render(
      <ExternalLink href="https://example.com">
        Click Me
      </ExternalLink>
    );

    const link = getByText('Click Me');
    const mockEvent = { preventDefault: jest.fn() };
    
    fireEvent.press(link, mockEvent);

    await waitFor(() => {
      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(openBrowserAsync).toHaveBeenCalledWith('https://example.com');
    });
  });

  it('should not prevent default on web', async () => {
    Platform.OS = 'web';
    const { openBrowserAsync } = require('expo-web-browser');
    
    const { getByText } = render(
      <ExternalLink href="https://example.com">
        Web Link
      </ExternalLink>
    );

    const link = getByText('Web Link');
    const mockEvent = { preventDefault: jest.fn() };
    
    fireEvent.press(link, mockEvent);

    await waitFor(() => {
      expect(mockEvent.preventDefault).not.toHaveBeenCalled();
      expect(openBrowserAsync).not.toHaveBeenCalled();
    });
  });
});