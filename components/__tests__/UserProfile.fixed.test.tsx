import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert, Platform } from 'react-native';
import UserProfile from '../UserProfile';
import { getUserStats, signOut, useMyCompanionAuth } from '@/utils/SupaLegend';

jest.mock('@/utils/SupaLegend', () => ({
  getUserStats: jest.fn(),
  signOut: jest.fn(),
  useMyCompanionAuth: jest.fn(),
}));

describe('UserProfile', () => {
  const mockUserProfile = {
    id: 'user-123',
    email: 'test@example.com',
    role: 'family',
    first_name: 'Test',
    last_name: 'User',
    phone: '0612345678',
    created_at: '2024-01-01',
    is_active: false,
  };

  const mockStats = {
    totalCalls: 10,
    totalAlerts: 5,
  };

  const defaultAuthState = {
    userProfile: mockUserProfile,
    isAuthenticated: true,
    loading: false,
    error: null,
    reloadProfile: jest.fn(),
    isUpdatingProfile: false,
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
      expect(getByText('Test User')).toBeTruthy();
      expect(getByText('test@example.com')).toBeTruthy();
      expect(getByText('0612345678')).toBeTruthy();
    });
  });

  it('should fetch and display user stats', async () => {
    const { getByText } = render(<UserProfile />);

    await waitFor(() => {
      expect(getUserStats).toHaveBeenCalledWith('user-123');
      expect(getByText('10')).toBeTruthy(); // Total calls
      expect(getByText('5')).toBeTruthy(); // Total alerts
    });
  });

  it('should handle sign out on mobile platforms', async () => {
    const { getByText } = render(<UserProfile />);

    const signOutButton = getByText('🚪 Se déconnecter');
    fireEvent.press(signOutButton);

    // Should show confirmation alert on mobile
    expect(Alert.alert).toHaveBeenCalledWith(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      expect.arrayContaining([
        expect.objectContaining({ text: 'Annuler' }),
        expect.objectContaining({ text: 'Déconnexion' }),
      ])
    );

    // Simulate confirmation
    const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
    const confirmButton = alertCall[2].find((btn: any) => btn.text === 'Déconnexion');
    await confirmButton.onPress();

    expect(signOut).toHaveBeenCalled();
  });

  it('should handle sign out on web platform', async () => {
    (Platform.OS as any) = 'web';
    
    const { getByText } = render(<UserProfile />);

    const signOutButton = getByText('🚪 Se déconnecter');
    fireEvent.press(signOutButton);

    // On web, should sign out directly without confirmation
    expect(Alert.alert).not.toHaveBeenCalled();
    expect(signOut).toHaveBeenCalled();
  });

  it('should handle sign out error', async () => {
    (signOut as jest.Mock).mockRejectedValue(new Error('Network error'));
    
    const { getByText } = render(<UserProfile />);

    const signOutButton = getByText('🚪 Se déconnecter');
    fireEvent.press(signOutButton);

    // Simulate confirmation
    const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
    const confirmButton = alertCall[2].find((btn: any) => btn.text === 'Déconnexion');
    await confirmButton.onPress();

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Erreur', 'Impossible de se déconnecter');
    });
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
    // Component should still render without crashing
  });

  it('should handle missing phone number', async () => {
    (useMyCompanionAuth as jest.Mock).mockReturnValue({
      ...defaultAuthState,
      userProfile: { ...mockUserProfile, phone: null },
    });

    const { queryByText } = render(<UserProfile />);

    await waitFor(() => {
      expect(queryByText('0612345678')).toBeFalsy();
      // Should show "Non renseigné" or similar placeholder
    });
  });

  it('should handle stats loading error gracefully', async () => {
    (getUserStats as jest.Mock).mockRejectedValue(new Error('Network error'));
    
    const { queryByText } = render(<UserProfile />);

    await waitFor(() => {
      // Component should still render without stats
      expect(queryByText('Test User')).toBeTruthy();
    });
  });

  it('should display correct role badge', async () => {
    const roleTests = [
      { role: 'admin', expectedText: 'Administrateur' },
      { role: 'family', expectedText: 'Utilisateur' },
      { role: 'saad', expectedText: 'SAAD' },
      { role: 'senior', expectedText: 'Senior' },
    ];

    for (const { role, expectedText } of roleTests) {
      (useMyCompanionAuth as jest.Mock).mockReturnValue({
        ...defaultAuthState,
        userProfile: { ...mockUserProfile, role },
      });

      const { getByText } = render(<UserProfile />);
      
      await waitFor(() => {
        expect(getByText(expectedText)).toBeTruthy();
      });
    }
  });
});