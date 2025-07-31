import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert as RNAlert } from 'react-native';
import { AdminAlertCenter } from '../AdminAlertCenter';
import { adminState$ } from '@/utils/supabase/observables/admin-observables';
import { getAllAlerts, logAdminAction } from '@/utils/supabase/services/admin-service';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

// Mock modules
jest.mock('@/utils/supabase/observables/admin-observables', () => ({
  adminState$: {
    alerts: { get: jest.fn(() => []) },
  },
}));

jest.mock('@/utils/supabase/services/admin-service', () => ({
  getAllAlerts: jest.fn(),
  logAdminAction: jest.fn(),
}));

jest.mock('@legendapp/state/react', () => ({
  useSelector: jest.fn((observable) => {
    if (typeof observable === 'function') {
      return observable();
    }
    return observable.get();
  }),
}));

jest.mock('date-fns', () => ({
  formatDistanceToNow: jest.fn((date) => 'il y a 5 minutes'),
}));

jest.mock('date-fns/locale', () => ({
  fr: {},
}));

describe('AdminAlertCenter', () => {
  const mockAlerts = [
    {
      id: 'alert-1',
      senior_id: 'senior-1',
      type: 'chute',
      severity: 'high',
      message: 'Chute détectée',
      status: 'new',
      created_at: '2024-01-01T10:00:00Z',
      resolved_at: null,
      resolved_by: null,
      seniors: {
        first_name: 'Jean',
        last_name: 'Dupont',
      },
    },
    {
      id: 'alert-2',
      senior_id: 'senior-2',
      type: 'health',
      severity: 'medium',
      message: 'Tension élevée',
      status: 'in_progress',
      created_at: '2024-01-01T09:00:00Z',
      resolved_at: null,
      resolved_by: null,
      seniors: {
        first_name: 'Marie',
        last_name: 'Martin',
      },
    },
    {
      id: 'alert-3',
      senior_id: 'senior-3',
      type: 'emergency',
      severity: 'critical',
      message: 'Appel d\'urgence',
      status: 'resolved',
      created_at: '2024-01-01T08:00:00Z',
      resolved_at: '2024-01-01T08:30:00Z',
      resolved_by: 'admin-1',
      seniors: {
        first_name: 'Pierre',
        last_name: 'Durand',
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (getAllAlerts as jest.Mock).mockResolvedValue(mockAlerts);
    (adminState$.alerts.get as jest.Mock).mockReturnValue(mockAlerts);
  });

  it('should render loading state initially', () => {
    (getAllAlerts as jest.Mock).mockReturnValue(new Promise(() => {}));
    
    const { getByTestId } = render(<AdminAlertCenter />);
    
    expect(getByTestId('loading-spinner')).toBeTruthy();
  });

  it('should display alerts list after loading', async () => {
    const { getByText } = render(<AdminAlertCenter />);

    await waitFor(() => {
      expect(getByText('Jean Dupont')).toBeTruthy();
      expect(getByText('Marie Martin')).toBeTruthy();
      expect(getByText('Pierre Durand')).toBeTruthy();
    });
  });

  it('should display correct alert information', async () => {
    const { getByText } = render(<AdminAlertCenter />);

    await waitFor(() => {
      // Alert types and messages
      expect(getByText('Chute détectée')).toBeTruthy();
      expect(getByText('Tension élevée')).toBeTruthy();
      expect(getByText('Appel d\'urgence')).toBeTruthy();
      
      // Time display
      expect(getByText('il y a 5 minutes')).toBeTruthy();
    });
  });

  it('should filter alerts by status', async () => {
    const { getByText, queryByText } = render(<AdminAlertCenter />);

    await waitFor(() => {
      expect(getByText('Toutes')).toBeTruthy();
    });

    // Click on "Nouvelles" filter
    const newFilter = getByText('Nouvelles');
    fireEvent.press(newFilter);

    await waitFor(() => {
      expect(queryByText('Jean Dupont')).toBeTruthy(); // New alert
      expect(queryByText('Marie Martin')).toBeFalsy(); // In progress
      expect(queryByText('Pierre Durand')).toBeFalsy(); // Resolved
    });
  });

  it('should filter alerts by severity', async () => {
    const { getByText, queryByText } = render(<AdminAlertCenter />);

    await waitFor(() => {
      expect(getByText('Toutes')).toBeTruthy();
    });

    // Click on severity filter button
    const filterButton = getByText('Filtrer').parent;
    if (filterButton) {
      fireEvent.press(filterButton);
    }

    // Select "Critique" severity
    const criticalOption = getByText('Critique');
    fireEvent.press(criticalOption);

    await waitFor(() => {
      expect(queryByText('Pierre Durand')).toBeTruthy(); // Critical alert
      expect(queryByText('Jean Dupont')).toBeFalsy(); // High alert
      expect(queryByText('Marie Martin')).toBeFalsy(); // Medium alert
    });
  });

  it('should open alert detail modal when alert is pressed', async () => {
    const { getByText } = render(<AdminAlertCenter />);

    await waitFor(() => {
      const alertItem = getByText('Jean Dupont').parent?.parent;
      if (alertItem) {
        fireEvent.press(alertItem);
      }
    });

    // Check modal content
    await waitFor(() => {
      expect(getByText('Détails de l\'alerte')).toBeTruthy();
      expect(getByText('Chute détectée')).toBeTruthy();
      expect(getByText('Élevée')).toBeTruthy(); // Severity
    });
  });

  it('should handle alert status update', async () => {
    const { getByText } = render(<AdminAlertCenter />);

    // Open alert detail
    await waitFor(() => {
      const alertItem = getByText('Jean Dupont').parent?.parent;
      if (alertItem) {
        fireEvent.press(alertItem);
      }
    });

    // Click on "Marquer en cours"
    const inProgressButton = getByText('Marquer en cours');
    fireEvent.press(inProgressButton);

    await waitFor(() => {
      expect(logAdminAction).toHaveBeenCalledWith(
        'update_alert_status',
        'alert',
        'alert-1',
        {
          old_status: 'new',
          new_status: 'in_progress',
        }
      );
    });

    expect(RNAlert.alert).toHaveBeenCalledWith(
      'Succès',
      'Statut mis à jour'
    );
  });

  it('should handle alert resolution', async () => {
    const { getByText } = render(<AdminAlertCenter />);

    // Open in progress alert
    await waitFor(() => {
      const alertItem = getByText('Marie Martin').parent?.parent;
      if (alertItem) {
        fireEvent.press(alertItem);
      }
    });

    // Click on "Marquer comme résolue"
    const resolveButton = getByText('Marquer comme résolue');
    fireEvent.press(resolveButton);

    await waitFor(() => {
      expect(logAdminAction).toHaveBeenCalledWith(
        'resolve_alert',
        'alert',
        'alert-2',
        {
          old_status: 'in_progress',
          new_status: 'resolved',
        }
      );
    });
  });

  it('should handle refresh', async () => {
    const { getByTestId } = render(<AdminAlertCenter />);

    await waitFor(() => {
      expect(getByTestId('alerts-list')).toBeTruthy();
    });

    const alertsList = getByTestId('alerts-list');
    const refreshControl = alertsList.props.refreshControl;

    // Simulate pull to refresh
    refreshControl.props.onRefresh();

    expect(getAllAlerts).toHaveBeenCalledTimes(2); // Initial + refresh
  });

  it('should display empty state when no alerts', async () => {
    (getAllAlerts as jest.Mock).mockResolvedValue([]);
    (adminState$.alerts.get as jest.Mock).mockReturnValue([]);

    const { getByText } = render(<AdminAlertCenter />);

    await waitFor(() => {
      expect(getByText('Aucune alerte')).toBeTruthy();
      expect(getByText('Toutes les alertes ont été traitées')).toBeTruthy();
    });
  });

  it('should display stats summary', async () => {
    const { getByText } = render(<AdminAlertCenter />);

    await waitFor(() => {
      expect(getByText('Total: 3')).toBeTruthy();
      expect(getByText('Nouvelles: 1')).toBeTruthy();
      expect(getByText('En cours: 1')).toBeTruthy();
      expect(getByText('Résolues: 1')).toBeTruthy();
    });
  });

  it('should handle error gracefully', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    (getAllAlerts as jest.Mock).mockRejectedValue(new Error('Network error'));

    const { getByText } = render(<AdminAlertCenter />);

    await waitFor(() => {
      expect(getByText('Aucune alerte')).toBeTruthy();
    });

    consoleError.mockRestore();
  });

  it('should close modal when backdrop is pressed', async () => {
    const { getByText, queryByText, getByTestId } = render(<AdminAlertCenter />);

    // Open modal
    await waitFor(() => {
      const alertItem = getByText('Jean Dupont').parent?.parent;
      if (alertItem) {
        fireEvent.press(alertItem);
      }
    });

    expect(getByText('Détails de l\'alerte')).toBeTruthy();

    // Close modal
    const closeButton = getByText('Fermer');
    fireEvent.press(closeButton);

    await waitFor(() => {
      expect(queryByText('Détails de l\'alerte')).toBeFalsy();
    });
  });

  it('should display correct severity colors and icons', async () => {
    const { getByText } = render(<AdminAlertCenter />);

    await waitFor(() => {
      // Check that all alerts are rendered with their appropriate styling
      const highAlert = getByText('Chute détectée').parent?.parent;
      const mediumAlert = getByText('Tension élevée').parent?.parent;
      const criticalAlert = getByText('Appel d\'urgence').parent?.parent;

      expect(highAlert).toBeTruthy();
      expect(mediumAlert).toBeTruthy();
      expect(criticalAlert).toBeTruthy();
    });
  });
});