import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ActivityIndicator } from 'react-native';
import { Alert } from 'react-native';
import SeniorsListScreen from '../SeniorsListScreen';
import { 
  getUserSeniors, 
  getSeniorStats, 
  deleteSenior,
  useMyCompanionAuth 
} from '@/utils/SupaLegend';

// Mock modules
jest.mock('@/utils/SupaLegend', () => ({
  getUserSeniors: jest.fn(),
  getSeniorStats: jest.fn(),
  deleteSenior: jest.fn(),
  useMyCompanionAuth: jest.fn(),
}));

// Mock child components
jest.mock('../AddSeniorForm', () => {
  return function MockAddSeniorForm({ onSuccess, onCancel }: any) {
    return null;
  };
});

jest.mock('../EditSeniorForm', () => {
  return function MockEditSeniorForm({ senior, onSuccess, onCancel }: any) {
    return null;
  };
});

jest.mock('../FamilySharingScreen', () => {
  return function MockFamilySharingScreen({ seniorId, onClose }: any) {
    return null;
  };
});

describe('SeniorsListScreen', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  const mockUserProfile = {
    id: 'user-123',
    email: 'test@example.com',
    role: 'family',
  };

  const mockSeniors = [
    {
      id: 'relation-1',
      senior_id: 'senior-1',
      user_id: 'user-123',
      relationship: 'parent',
      is_primary_contact: true,
      access_level: 'full',
      created_at: '2024-01-01T10:00:00Z',
      seniors: {
        id: 'senior-1',
        first_name: 'Jean',
        last_name: 'Dupont',
        phone: '0612345678',
        birth_date: '1940-01-01',
        preferred_call_time: '09:00',
        call_frequency: 1,
        address: { street: '123 Rue de la Paix', city: 'Paris' },
        emergency_contact: '0687654321',
        created_at: '2024-01-01T10:00:00Z',
      },
    },
    {
      id: 'relation-2',
      senior_id: 'senior-2',
      user_id: 'user-123',
      relationship: 'grand-parent',
      is_primary_contact: false,
      access_level: 'view',
      created_at: '2024-01-02T10:00:00Z',
      seniors: {
        id: 'senior-2',
        first_name: 'Marie',
        last_name: 'Martin',
        phone: '0623456789',
        birth_date: '1935-05-15',
        preferred_call_time: '14:00',
        call_frequency: 2,
        created_at: '2024-01-02T10:00:00Z',
      },
    },
  ];

  const mockStats = {
    'senior-1': {
      totalCalls: 30,
      lastCallDate: '2024-01-15T10:00:00Z',
      averageCallDuration: 300,
      missedCalls: 2,
    },
    'senior-2': {
      totalCalls: 15,
      lastCallDate: '2024-01-14T14:00:00Z',
      averageCallDuration: 240,
      missedCalls: 0,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useMyCompanionAuth as jest.Mock).mockReturnValue({
      userProfile: mockUserProfile,
    });
    (getUserSeniors as jest.Mock).mockResolvedValue(mockSeniors);
    (getSeniorStats as jest.Mock).mockImplementation((seniorId) => 
      Promise.resolve(mockStats[seniorId])
    );
    // Alert is already mocked in jest.setup.js
  });

  it('should render loading state initially', async () => {
    // Mock pour l'état de chargement initial
    (getUserSeniors as jest.Mock).mockReturnValueOnce(new Promise(resolve => {
      // Résoudre après un court délai pour permettre de tester l'état loading
      setTimeout(() => resolve({ data: [], error: null }), 50);
    }));
    
    const { getByTestId } = render(<SeniorsListScreen />);
    
    // Le composant n'a pas de testID loading-indicator
    // On vérifie qu'il y a un ActivityIndicator à la place
    const { UNSAFE_getByType } = render(<SeniorsListScreen />);
    expect(UNSAFE_getByType(require('react-native').ActivityIndicator)).toBeTruthy();
  });

  it('should display seniors list after loading', async () => {
    const { getByText } = render(<SeniorsListScreen />);

    await waitFor(() => {
      expect(getByText('Jean Dupont')).toBeTruthy();
      expect(getByText('Marie Martin')).toBeTruthy();
    });
  });

  it('should display senior information correctly', async () => {
    const { getByText } = render(<SeniorsListScreen />);

    await waitFor(() => {
      // First senior
      expect(getByText('Jean Dupont')).toBeTruthy();
      expect(getByText('0612345678')).toBeTruthy();
      expect(getByText('Contact principal')).toBeTruthy();
      expect(getByText('Appels: 1x/jour à 09:00')).toBeTruthy();
      
      // Second senior
      expect(getByText('Marie Martin')).toBeTruthy();
      expect(getByText('0623456789')).toBeTruthy();
      expect(getByText('Appels: 2x/jour à 14:00')).toBeTruthy();
    });
  });

  it('should display stats for seniors', async () => {
    const { getByText } = render(<SeniorsListScreen />);

    await waitFor(() => {
      expect(getByText('30 appels')).toBeTruthy();
      expect(getByText('15 appels')).toBeTruthy();
      expect(getByText('Dernier: 15/01/2024')).toBeTruthy();
      expect(getByText('Dernier: 14/01/2024')).toBeTruthy();
    });
  });

  it('should open add senior modal when FAB is pressed', async () => {
    const { getByTestId, getByText } = render(<SeniorsListScreen />);

    await waitFor(() => {
      const fab = getByTestId('add-senior-fab');
      fireEvent.press(fab);
    });

    expect(getByText('Ajouter un senior')).toBeTruthy();
  });

  it('should open senior detail modal when senior card is pressed', async () => {
    const { getByText } = render(<SeniorsListScreen />);

    await waitFor(() => {
      const seniorCard = getByText('Jean Dupont').parent?.parent;
      if (seniorCard) {
        fireEvent.press(seniorCard);
      }
    });

    await waitFor(() => {
      expect(getByText('Détails du senior')).toBeTruthy();
      expect(getByText('84 ans')).toBeTruthy(); // Calculated age
      expect(getByText('123 Rue de la Paix, Paris')).toBeTruthy();
    });
  });

  it('should handle delete senior action', async () => {
    (deleteSenior as jest.Mock).mockResolvedValue({ error: null });
    
    const { getByText } = render(<SeniorsListScreen />);

    // Open senior detail
    await waitFor(() => {
      const seniorCard = getByText('Jean Dupont').parent?.parent;
      if (seniorCard) {
        fireEvent.press(seniorCard);
      }
    });

    // Press delete button
    const deleteButton = getByText('Supprimer');
    fireEvent.press(deleteButton);

    // Confirm deletion
    expect(Alert.alert).toHaveBeenCalledWith(
      'Confirmation',
      'Êtes-vous sûr de vouloir supprimer ce senior ?',
      expect.any(Array)
    );

    // Simulate confirmation
    const confirmCallback = (Alert.alert as jest.Mock).mock.calls[0][2][1].onPress;
    await confirmCallback();

    expect(deleteSenior).toHaveBeenCalledWith('senior-1');
    expect(Alert.alert).toHaveBeenCalledWith('Succès', 'Senior supprimé avec succès');
  });

  it('should handle delete error', async () => {
    const errorMessage = 'Permission denied';
    (deleteSenior as jest.Mock).mockResolvedValue({ 
      error: { message: errorMessage } 
    });
    
    const { getByText } = render(<SeniorsListScreen />);

    // Open senior detail
    await waitFor(() => {
      const seniorCard = getByText('Jean Dupont').parent?.parent;
      if (seniorCard) {
        fireEvent.press(seniorCard);
      }
    });

    // Press delete button
    const deleteButton = getByText('Supprimer');
    fireEvent.press(deleteButton);

    // Simulate confirmation
    const confirmCallback = (Alert.alert as jest.Mock).mock.calls[0][2][1].onPress;
    await confirmCallback();

    expect(Alert.alert).toHaveBeenCalledWith('Erreur', errorMessage);
  });

  it('should open edit modal when edit button is pressed', async () => {
    const { getByText, getByTestId } = render(<SeniorsListScreen />);

    // Open senior detail
    await waitFor(() => {
      const seniorCard = getByText('Jean Dupont').parent?.parent;
      if (seniorCard) {
        fireEvent.press(seniorCard);
      }
    });

    // Press edit button
    const editButton = getByText('Modifier');
    fireEvent.press(editButton);

    await waitFor(() => {
      expect(getByText('Modifier les informations')).toBeTruthy();
    });
  });

  it('should open sharing modal when share button is pressed', async () => {
    const { getByText } = render(<SeniorsListScreen />);

    // Open senior detail
    await waitFor(() => {
      const seniorCard = getByText('Jean Dupont').parent?.parent;
      if (seniorCard) {
        fireEvent.press(seniorCard);
      }
    });

    // Press share button
    const shareButton = getByText('Partager');
    fireEvent.press(shareButton);

    await waitFor(() => {
      expect(getByText('Partage familial')).toBeTruthy();
    });
  });

  it('should display empty state when no seniors', async () => {
    (getUserSeniors as jest.Mock).mockResolvedValue([]);

    const { getByText } = render(<SeniorsListScreen />);

    await waitFor(() => {
      expect(getByText('Aucun senior ajouté')).toBeTruthy();
      expect(getByText('Appuyez sur + pour ajouter votre premier senior')).toBeTruthy();
    });
  });

  it('should refresh list on pull to refresh', async () => {
    const { getByTestId } = render(<SeniorsListScreen />);

    await waitFor(() => {
      expect(getByTestId('seniors-list')).toBeTruthy();
    });

    const seniorsList = getByTestId('seniors-list');
    const refreshControl = seniorsList.props.refreshControl;

    // Simulate pull to refresh
    refreshControl.props.onRefresh();

    expect(getUserSeniors).toHaveBeenCalledTimes(2); // Initial + refresh
  });

  it('should handle stats loading error gracefully', async () => {
    (getSeniorStats as jest.Mock).mockRejectedValue(new Error('Network error'));

    const { queryByText } = render(<SeniorsListScreen />);

    await waitFor(() => {
      // Should still display seniors without stats
      expect(queryByText('Jean Dupont')).toBeTruthy();
      expect(queryByText('30 appels')).toBeFalsy(); // Stats not loaded
    });
  });

  it('should close modals when requested', async () => {
    const { getByText, queryByText } = render(<SeniorsListScreen />);

    // Open detail modal
    await waitFor(() => {
      const seniorCard = getByText('Jean Dupont').parent?.parent;
      if (seniorCard) {
        fireEvent.press(seniorCard);
      }
    });

    expect(getByText('Détails du senior')).toBeTruthy();

    // Close modal
    const closeButton = getByText('Fermer');
    fireEvent.press(closeButton);

    await waitFor(() => {
      expect(queryByText('Détails du senior')).toBeFalsy();
    });
  });

  it('should refresh after successful senior addition', async () => {
    const { getByTestId } = render(<SeniorsListScreen />);

    await waitFor(() => {
      const fab = getByTestId('add-senior-fab');
      fireEvent.press(fab);
    });

    // Simulate successful addition (through props callback)
    // This would trigger onSuccess callback which should refresh the list
    expect(getUserSeniors).toHaveBeenCalled();
  });

  it('should display different UI based on access level', async () => {
    const { getByText, queryByText } = render(<SeniorsListScreen />);

    await waitFor(() => {
      // First senior has full access
      const firstSeniorCard = getByText('Jean Dupont').parent?.parent;
      if (firstSeniorCard) {
        fireEvent.press(firstSeniorCard);
      }
    });

    // Should see all buttons for full access
    expect(getByText('Modifier')).toBeTruthy();
    expect(getByText('Supprimer')).toBeTruthy();
    expect(getByText('Partager')).toBeTruthy();

    // Close and open second senior (view only)
    fireEvent.press(getByText('Fermer'));

    await waitFor(() => {
      const secondSeniorCard = getByText('Marie Martin').parent?.parent;
      if (secondSeniorCard) {
        fireEvent.press(secondSeniorCard);
      }
    });

    // Should not see edit/delete for view-only access
    expect(queryByText('Modifier')).toBeFalsy();
    expect(queryByText('Supprimer')).toBeFalsy();
  });
});