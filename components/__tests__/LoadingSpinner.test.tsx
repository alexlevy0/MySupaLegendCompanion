import React from 'react';
import { render } from '@testing-library/react-native';
import { LoadingSpinner } from '../LoadingSpinner';
import { useThemeColor } from '@/hooks/useThemeColor';

// Mock the useThemeColor hook
jest.mock('@/hooks/useThemeColor', () => ({
  useThemeColor: jest.fn(() => '#0a7ea4'),
}));

// Mock ThemedText
jest.mock('@/components/ThemedText', () => ({
  ThemedText: ({ children, style }: any) => {
    const React = require('react');
    const { Text } = require('react-native');
    return <Text style={style}>{children}</Text>;
  },
}));

describe('LoadingSpinner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    const { UNSAFE_getByType } = render(<LoadingSpinner />);
    const ActivityIndicator = require('react-native').ActivityIndicator;
    
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it('should render with default size', () => {
    const { UNSAFE_getByType } = render(<LoadingSpinner />);
    const ActivityIndicator = require('react-native').ActivityIndicator;
    
    const activityIndicator = UNSAFE_getByType(ActivityIndicator);
    expect(activityIndicator.props.size).toBe('large');
  });

  it('should render with custom size', () => {
    const { UNSAFE_getByType } = render(<LoadingSpinner size="small" />);
    const ActivityIndicator = require('react-native').ActivityIndicator;
    
    const activityIndicator = UNSAFE_getByType(ActivityIndicator);
    expect(activityIndicator.props.size).toBe('small');
  });

  it('should use theme color by default', () => {
    const { UNSAFE_getByType } = render(<LoadingSpinner />);
    const ActivityIndicator = require('react-native').ActivityIndicator;
    
    const activityIndicator = UNSAFE_getByType(ActivityIndicator);
    expect(useThemeColor).toHaveBeenCalledWith({}, 'tint');
    expect(activityIndicator.props.color).toBe('#0a7ea4');
  });

  it('should use custom color when provided', () => {
    const customColor = '#FF0000';
    const { UNSAFE_getByType } = render(<LoadingSpinner color={customColor} />);
    const ActivityIndicator = require('react-native').ActivityIndicator;
    
    const activityIndicator = UNSAFE_getByType(ActivityIndicator);
    expect(activityIndicator.props.color).toBe(customColor);
  });

  it('should render text when provided', () => {
    const { getByText } = render(<LoadingSpinner text="Loading..." />);
    
    expect(getByText('Loading...')).toBeTruthy();
  });

  it('should not render text when not provided', () => {
    const { queryByText } = render(<LoadingSpinner />);
    
    expect(queryByText('Loading...')).toBeFalsy();
  });

  it('should apply correct container styles', () => {
    const { UNSAFE_getByType } = render(<LoadingSpinner />);
    const View = require('react-native').View;
    
    const container = UNSAFE_getByType(View);
    const styles = container.props.style;
    
    expect(styles).toMatchObject({
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    });
  });

  it('should apply correct text styles', () => {
    const { getByText } = render(<LoadingSpinner text="Loading..." />);
    
    const textElement = getByText('Loading...');
    const styles = textElement.props.style;
    
    expect(styles).toMatchObject({
      marginTop: 12,
      fontSize: 16,
      opacity: 0.7,
    });
  });
});