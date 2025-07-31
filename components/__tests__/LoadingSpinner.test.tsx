import React from 'react';
import { render } from '@testing-library/react-native';
import { LoadingSpinner } from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  it('should render correctly', () => {
    const { getByTestId } = render(<LoadingSpinner />);
    
    expect(getByTestId('loading-spinner')).toBeTruthy();
  });

  it('should render with activity indicator', () => {
    const { getByTestId } = render(<LoadingSpinner />);
    
    const activityIndicator = getByTestId('loading-indicator');
    expect(activityIndicator).toBeTruthy();
  });

  it('should have correct default size', () => {
    const { getByTestId } = render(<LoadingSpinner />);
    
    const activityIndicator = getByTestId('loading-indicator');
    expect(activityIndicator.props.size).toBe('large');
  });

  it('should have correct default color', () => {
    const { getByTestId } = render(<LoadingSpinner />);
    
    const activityIndicator = getByTestId('loading-indicator');
    expect(activityIndicator.props.color).toBe('#0a7ea4');
  });

  it('should center the spinner', () => {
    const { getByTestId } = render(<LoadingSpinner />);
    
    const container = getByTestId('loading-spinner');
    const styles = container.props.style;
    
    expect(styles).toMatchObject({
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    });
  });
});