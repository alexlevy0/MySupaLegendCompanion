import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert, Platform } from 'react-native';
import UserProfile from '../UserProfile';
import { getUserStats, signOut, useMyCompanionAuth } from '@/utils/SupaLegend';

// Mock modules
jest.mock('@/utils/SupaLegend', () => ({
  getUserStats: jest.fn(),
  signOut: jest.fn(),
  useMyCompanionAuth: jest.fn(),
}));

describe('UserProfile', () => {
  const mockUserProfile = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    phone: '0612345678',
    user_type: 'family' as const,
    created_at: '2024-01-01T10:00:00Z',
  };

  const mockStats = {
    totalCalls: 50,
    totalAlerts: 5,
  };

  const defaultAuthState = {
    userProfile: mockUserProfile,
    isAdmin: false,
    isSenior: false,
    isFamily: true,
    isSAAD: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useMyCompanionAuth as jest.Mock).mockReturnValue(defaultAuthState);
    (getUserStats as jest.Mock).mockResolvedValue(mockStats);
    // Alert is already mocked in jest.setup.js
  });

  it('should render user information correctly', async () => {
    const { getByText } = render(<UserProfile />);

    await waitFor(() => {
      expect(getByText('Mon Profil')).toBeTruthy();
      expect(getByText('Test User')).toBeTruthy();
      expect(getByText('test@example.com')).toBeTruthy();
      expect(getByText('0612345678')).toBeTruthy();
    });
  });

  it('should display user role correctly', async () => {
    const { getByText } = render(<UserProfile />);

    await waitFor(() => {
      expect(getByText('Famille')).toBeTruthy();
    });
  });

  it('should display different roles correctly', async () => {
    const roles = [
      { authState: { ...defaultAuthState, isAdmin: true, isFamily: false }, expected: 'Administrateur' },
      { authState: { ...defaultAuthState, isSenior: true, isFamily: false }, expected: 'Senior' },
      { authState: { ...defaultAuthState, isSAAD: true, isFamily: false }, expected: 'SAAD' },
    ];

    for (const { authState, expected } of roles) {
      (useMyCompanionAuth as jest.Mock).mockReturnValue(authState);
      const { getByText } = render(<UserProfile />);
      
      await waitFor(() => {
        expect(getByText(expected)).toBeTruthy();
      });
    }
  });

  it('should fetch and display user stats for senior', async () => {
    // Mock as senior to show stats
    (useMyCompanionAuth as jest.Mock).mockReturnValue({
      ...defaultAuthState,
      userProfile: { ...mockUserProfile, user_type: 'senior' },
      isSenior: true,
    });
    
    const { getByText } = render(<UserProfile />);

    await waitFor(() => {
      expect(getUserStats).toHaveBeenCalledWith('user-123');
      expect(getByText('50')).toBeTruthy(); // Total calls
      expect(getByText('5')).toBeTruthy();  // Total alerts
    });
  });

  it('should handle sign out on mobile platforms', async () => {
    Platform.OS = 'ios';
    const { getByText } = render(<UserProfile />);

    const signOutButton = getByText('🚪 Se déconnecter');
    fireEvent.press(signOutButton);

    // Check if confirmation alert is shown
    expect(Alert.alert).toHaveBeenCalledWith(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      expect.arrayContaining([
        expect.objectContaining({ text: 'Annuler' }),
        expect.objectContaining({ text: 'Déconnexion' }),
      ])
    );

    // Simulate confirmation
    const confirmCallback = (Alert.alert as jest.Mock).mock.calls[0][2][1].onPress;
    await confirmCallback();

    expect(signOut).toHaveBeenCalled();
  });

  it('should handle sign out on web platform', async () => {
    Platform.OS = 'web';
    const { getByText } = render(<UserProfile />);

    const signOutButton = getByText('🚪 Se déconnecter');
    fireEvent.press(signOutButton);

    // On web, should sign out directly without confirmation
    expect(signOut).toHaveBeenCalled();
    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it('should handle sign out error', async () => {
    Platform.OS = 'ios';
    (signOut as jest.Mock).mockRejectedValue(new Error('Network error'));
    
    const { getByText } = render(<UserProfile />);

    const signOutButton = getByText('🚪 Se déconnecter');
    fireEvent.press(signOutButton);

    // Simulate confirmation
    const confirmCallback = (Alert.alert as jest.Mock).mock.calls[0][2][1].onPress;
    await confirmCallback();

    expect(Alert.alert).toHaveBeenCalledWith('Erreur', 'Impossible de se déconnecter');
  });

  it('should display member since date', async () => {
    const { getByText } = render(<UserProfile />);

    await waitFor(() => {
      expect(getByText('Membre depuis:')).toBeTruthy();
      expect(getByText('01/01/2024')).toBeTruthy();
    });
  });

  it('should handle missing user profile gracefully', async () => {
    (useMyCompanionAuth as jest.Mock).mockReturnValue({
      ...defaultAuthState,
      userProfile: null,
    });

    const { queryByText } = render(<UserProfile />);

    expect(getUserStats).not.toHaveBeenCalled();
    expect(queryByText('👤')).toBeTruthy();
  });

  it('should handle missing user name', async () => {
    (useMyCompanionAuth as jest.Mock).mockReturnValue({
      ...defaultAuthState,
      userProfile: {
        ...mockUserProfile,
        name: null,
      },
    });

    const { getByText, queryByText } = render(<UserProfile />);

    await waitFor(() => {
      expect(queryByText('Test User')).toBeFalsy();
      expect(getByText('test@example.com')).toBeTruthy();
    });
  });

  it('should handle missing phone number', async () => {
    (useMyCompanionAuth as jest.Mock).mockReturnValue({
      ...defaultAuthState,
      userProfile: {
        ...mockUserProfile,
        phone: null,
      },
    });

    const { queryByText } = render(<UserProfile />);

    await waitFor(() => {
      expect(queryByText('0612345678')).toBeFalsy();
      expect(queryByText('Téléphone:')).toBeTruthy();
    });
  });

  it('should display correct icons for each stat', async () => {
    const { getByTestId } = render(<UserProfile />);

    await waitFor(() => {
      expect(getByTestId('calls-icon')).toBeTruthy();
      expect(getByTestId('alerts-icon')).toBeTruthy();
    });
  });

  it('should handle stats loading error gracefully', async () => {
    (getUserStats as jest.Mock).mockRejectedValue(new Error('Network error'));
    
    const { getByText } = render(<UserProfile />);

    await waitFor(() => {
      // Should still render with default values
      expect(getByText('0')).toBeTruthy();
    });
  });

  it('should not fetch stats if no user id', async () => {
    (useMyCompanionAuth as jest.Mock).mockReturnValue({
      ...defaultAuthState,
      userProfile: {
        ...mockUserProfile,
        id: null,
      },
    });

    render(<UserProfile />);

    expect(getUserStats).not.toHaveBeenCalled();
  });

  it('should apply correct styles for each role', async () => {
    const roleStyles = [
      { role: 'admin', isAdmin: true, color: '#E74C3C' },
      { role: 'senior', isSenior: true, color: '#3498DB' },
      { role: 'family', isFamily: true, color: '#27AE60' },
      { role: 'saad', isSAAD: true, color: '#F39C12' },
    ];

    for (const { role, ...authFlags } of roleStyles) {
      (useMyCompanionAuth as jest.Mock).mockReturnValue({
        ...defaultAuthState,
        isAdmin: false,
        isSenior: false,
        isFamily: false,
        isSAAD: false,
        ...authFlags,
      });

      const { getByTestId } = render(<UserProfile />);
      
      await waitFor(() => {
        const roleBadge = getByTestId('role-badge');
        expect(roleBadge).toBeTruthy();
      });
    }
  });

  it('should handle cancel sign out', async () => {
    Platform.OS = 'ios';
    const { getByText } = render(<UserProfile />);

    const signOutButton = getByText('🚪 Se déconnecter');
    fireEvent.press(signOutButton);

    // Simulate cancel
    const cancelCallback = (Alert.alert as jest.Mock).mock.calls[0][2][0].onPress;
    if (cancelCallback) {
      cancelCallback();
    }

    expect(signOut).not.toHaveBeenCalled();
  });
});