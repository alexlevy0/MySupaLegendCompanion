import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import { Text } from 'react-native';
import AuthWrapper from '../AuthWrapper';
import { useMyCompanionAuth } from '@/utils/SupaLegend';

// Mock les modules
jest.mock('@/utils/SupaLegend', () => ({
  useMyCompanionAuth: jest.fn(),
}));

// Mock child components
jest.mock('../LoginForm', () => {
  return function MockLoginForm() {
    return null;
  };
});

jest.mock('../SignUpForm', () => {
  return function MockSignUpForm() {
    return null;
  };
});

describe('AuthWrapper', () => {
  const mockUseMyCompanionAuth = useMyCompanionAuth as jest.Mock;
  
  const defaultAuthState = {
    isAuthenticated: false,
    loading: false,
    userProfile: null,
    error: null,
    reloadProfile: jest.fn(),
    isUpdatingProfile: false,
  };

  const TestChild = () => <Text>Child Component</Text>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should render loading spinner when loading', () => {
    mockUseMyCompanionAuth.mockReturnValue({
      ...defaultAuthState,
      loading: true,
    });

    const { getByTestId } = render(
      <AuthWrapper>
        <TestChild />
      </AuthWrapper>
    );

    expect(getByTestId('auth-loading-indicator')).toBeTruthy();
  });

  it('should render children when authenticated', () => {
    mockUseMyCompanionAuth.mockReturnValue({
      ...defaultAuthState,
      isAuthenticated: true,
      userProfile: { id: 'user-123', email: 'test@example.com' },
    });

    const { getByText } = render(
      <AuthWrapper>
        <TestChild />
      </AuthWrapper>
    );

    expect(getByText('Child Component')).toBeTruthy();
  });

  it('should render login form when not authenticated', () => {
    mockUseMyCompanionAuth.mockReturnValue(defaultAuthState);

    const { getByText } = render(
      <AuthWrapper>
        <TestChild />
      </AuthWrapper>
    );

    expect(getByText('Connexion')).toBeTruthy();
  });

  it('should handle loading timeout with valid user profile', async () => {
    const userProfile = { id: 'user-123', email: 'test@example.com' };
    
    mockUseMyCompanionAuth.mockReturnValue({
      ...defaultAuthState,
      loading: true,
      userProfile,
    });

    const { getByText, queryByTestId } = render(
      <AuthWrapper>
        <TestChild />
      </AuthWrapper>
    );

    // Initially should show loading
    expect(queryByTestId('auth-loading-indicator')).toBeTruthy();

    // After 15 seconds timeout, should force show app
    act(() => {
      jest.advanceTimersByTime(15000);
    });

    await waitFor(() => {
      expect(getByText('Child Component')).toBeTruthy();
      expect(queryByTestId('auth-loading-indicator')).toBeFalsy();
    });
  });

  it('should not trigger timeout if loading stops before 15 seconds', async () => {
    const userProfile = { id: 'user-123', email: 'test@example.com' };
    
    mockUseMyCompanionAuth.mockReturnValue({
      ...defaultAuthState,
      loading: true,
      userProfile,
    });

    const { rerender } = render(
      <AuthWrapper>
        <TestChild />
      </AuthWrapper>
    );

    // Advance timer partially
    act(() => {
      jest.advanceTimersByTime(10000);
    });

    // Stop loading
    mockUseMyCompanionAuth.mockReturnValue({
      ...defaultAuthState,
      loading: false,
      isAuthenticated: true,
      userProfile,
    });

    rerender(
      <AuthWrapper>
        <TestChild />
      </AuthWrapper>
    );

    // Complete the timer
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    // Should not have forced show app
    const { getByText } = render(
      <AuthWrapper>
        <TestChild />
      </AuthWrapper>
    );
    expect(getByText('Child Component')).toBeTruthy();
  });

  it('should show error screen when error occurs', () => {
    mockUseMyCompanionAuth.mockReturnValue({
      ...defaultAuthState,
      error: new Error('Connection failed'),
    });

    const { getByText } = render(
      <AuthWrapper>
        <TestChild />
      </AuthWrapper>
    );

    expect(getByText('⚠️ Erreur de connexion')).toBeTruthy();
    expect(getByText('Connection failed')).toBeTruthy();
    expect(getByText('Réessayer')).toBeTruthy();
  });

  it('should call reloadProfile when retry button is pressed', () => {
    const mockReloadProfile = jest.fn();
    
    mockUseMyCompanionAuth.mockReturnValue({
      ...defaultAuthState,
      error: new Error('Connection failed'),
      reloadProfile: mockReloadProfile,
    });

    const { getByText } = render(
      <AuthWrapper>
        <TestChild />
      </AuthWrapper>
    );

    const retryButton = getByText('Réessayer');
    retryButton.props.onPress();

    expect(mockReloadProfile).toHaveBeenCalled();
  });

  it('should not show loading when isUpdatingProfile is true', () => {
    mockUseMyCompanionAuth.mockReturnValue({
      ...defaultAuthState,
      loading: true,
      isUpdatingProfile: true,
      isAuthenticated: true,
      userProfile: { id: 'user-123', email: 'test@example.com' },
    });

    const { getByText, queryByTestId } = render(
      <AuthWrapper>
        <TestChild />
      </AuthWrapper>
    );

    expect(queryByTestId('auth-loading-indicator')).toBeFalsy();
    expect(getByText('Child Component')).toBeTruthy();
  });

  it('should toggle between signin and signup forms', () => {
    mockUseMyCompanionAuth.mockReturnValue(defaultAuthState);

    const { getByText, rerender } = render(
      <AuthWrapper>
        <TestChild />
      </AuthWrapper>
    );

    // Initially shows login form
    expect(getByText('Connexion')).toBeTruthy();

    // Click on create account
    const createAccountButton = getByText('Créer un compte');
    createAccountButton.props.onPress();

    rerender(
      <AuthWrapper>
        <TestChild />
      </AuthWrapper>
    );

    // Should now show signup form
    expect(getByText('Inscription')).toBeTruthy();
  });

  it('should render correctly with all states combinations', () => {
    // Test authenticated + loading (no timeout)
    mockUseMyCompanionAuth.mockReturnValue({
      ...defaultAuthState,
      isAuthenticated: true,
      loading: true,
      userProfile: { id: 'user-123' },
    });

    const { queryByText, queryByTestId } = render(
      <AuthWrapper>
        <TestChild />
      </AuthWrapper>
    );

    expect(queryByTestId('auth-loading-indicator')).toBeTruthy();
    expect(queryByText('Child Component')).toBeFalsy();
  });

  it('should handle missing user profile gracefully', () => {
    mockUseMyCompanionAuth.mockReturnValue({
      ...defaultAuthState,
      isAuthenticated: true,
      userProfile: null,
    });

    const { getByText } = render(
      <AuthWrapper>
        <TestChild />
      </AuthWrapper>
    );

    // Should still render children even without profile
    expect(getByText('Child Component')).toBeTruthy();
  });
});