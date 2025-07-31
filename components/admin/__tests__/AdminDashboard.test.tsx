import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AdminDashboard from '../AdminDashboard';
import { adminState$ } from '@/utils/supabase/observables/admin-observables';
import { getGlobalStats } from '@/utils/supabase/services/admin-service';
import { router } from 'expo-router';

// Mock modules
jest.mock('@/utils/supabase/observables/admin-observables', () => ({
  adminState$: {
    users: { get: jest.fn(() => []) },
    seniors: { get: jest.fn(() => []) },
    alerts: { get: jest.fn(() => []) },
    calls: { get: jest.fn(() => []) },
  },
}));

jest.mock('@/utils/supabase/services/admin-service', () => ({
  getGlobalStats: jest.fn(),
}));

jest.mock('@legendapp/state/react', () => ({
  useSelector: jest.fn((observable) => {
    if (typeof observable === 'function') {
      return observable();
    }
    return observable.get();
  }),
}));

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
  },
}));

describe('AdminDashboard', () => {
  const mockStats = {
    totalUsers: 100,
    totalSeniors: 50,
    totalAlerts: 10,
    totalCalls: 200,
    activeAlerts: 3,
    monthlyGrowth: {
      users: 10,
      seniors: 5,
      alerts: 2,
      calls: 50,
    },
    userTypeDistribution: {
      admin: 5,
      family: 70,
      senior: 20,
      saad: 5,
    },
    platformActivity: {
      dailyActiveUsers: 30,
      weeklyActiveUsers: 80,
      monthlyActiveUsers: 95,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getGlobalStats as jest.Mock).mockResolvedValue(mockStats);
  });

  it('should render correctly with loading state', () => {
    (getGlobalStats as jest.Mock).mockReturnValue(new Promise(() => {}));
    
    const { getByTestId } = render(<AdminDashboard />);
    
    expect(getByTestId('loading-spinner')).toBeTruthy();
  });

  it('should display stats after loading', async () => {
    const { getByText } = render(<AdminDashboard />);

    await waitFor(() => {
      expect(getByText('100')).toBeTruthy(); // Total users
      expect(getByText('50')).toBeTruthy();  // Total seniors
      expect(getByText('10')).toBeTruthy();  // Total alerts
      expect(getByText('200')).toBeTruthy(); // Total calls
    });
  });

  it('should navigate to users list when users card is pressed', async () => {
    const { getByText } = render(<AdminDashboard />);

    await waitFor(() => {
      const usersCard = getByText('Utilisateurs').parent?.parent;
      if (usersCard) {
        fireEvent.press(usersCard);
      }
    });

    expect(router.push).toHaveBeenCalledWith('/admin/users');
  });

  it('should navigate to seniors list when seniors card is pressed', async () => {
    const { getByText } = render(<AdminDashboard />);

    await waitFor(() => {
      const seniorsCard = getByText('Seniors').parent?.parent;
      if (seniorsCard) {
        fireEvent.press(seniorsCard);
      }
    });

    expect(router.push).toHaveBeenCalledWith('/admin/seniors');
  });

  it('should navigate to alerts center when alerts card is pressed', async () => {
    const { getByText } = render(<AdminDashboard />);

    await waitFor(() => {
      const alertsCard = getByText('Alertes').parent?.parent;
      if (alertsCard) {
        fireEvent.press(alertsCard);
      }
    });

    expect(router.push).toHaveBeenCalledWith('/admin/alerts');
  });

  it('should handle quick actions navigation', async () => {
    const { getByText } = render(<AdminDashboard />);

    await waitFor(() => {
      expect(getByText('Actions rapides')).toBeTruthy();
    });

    // Test each quick action
    const quickActions = [
      { text: 'Centre d\'alertes', route: '/admin/alerts' },
      { text: 'Gérer les utilisateurs', route: '/admin/users' },
      { text: 'Gérer les seniors', route: '/admin/seniors' },
      { text: 'Statistiques', route: '/admin/stats' },
    ];

    for (const action of quickActions) {
      const actionButton = getByText(action.text);
      fireEvent.press(actionButton);
      expect(router.push).toHaveBeenCalledWith(action.route);
    }
  });

  it('should handle refresh action', async () => {
    const { getByTestId } = render(<AdminDashboard />);

    await waitFor(() => {
      expect(getByTestId('dashboard-scroll-view')).toBeTruthy();
    });

    const scrollView = getByTestId('dashboard-scroll-view');
    const refreshControl = scrollView.props.refreshControl;

    // Simulate pull to refresh
    refreshControl.props.onRefresh();

    expect(getGlobalStats).toHaveBeenCalledTimes(2); // Initial load + refresh
  });

  it('should display active alerts with correct styling', async () => {
    const statsWithActiveAlerts = {
      ...mockStats,
      activeAlerts: 5,
    };
    (getGlobalStats as jest.Mock).mockResolvedValue(statsWithActiveAlerts);

    const { getByText } = render(<AdminDashboard />);

    await waitFor(() => {
      const activeAlertsText = getByText('5 actives');
      expect(activeAlertsText).toBeTruthy();
    });
  });

  it('should display growth percentages', async () => {
    const { getByText } = render(<AdminDashboard />);

    await waitFor(() => {
      // Check for growth indicators
      expect(getByText('+10 ce mois')).toBeTruthy(); // Users growth
      expect(getByText('+5 ce mois')).toBeTruthy();  // Seniors growth
    });
  });

  it('should handle error state gracefully', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    (getGlobalStats as jest.Mock).mockRejectedValue(new Error('Network error'));

    const { queryByText } = render(<AdminDashboard />);

    await waitFor(() => {
      // Should still render but with default values
      expect(queryByText('0')).toBeTruthy();
    });

    consoleError.mockRestore();
  });

  it('should display user type distribution', async () => {
    const { getByText } = render(<AdminDashboard />);

    await waitFor(() => {
      expect(getByText('Répartition des utilisateurs')).toBeTruthy();
      expect(getByText('70% Familles')).toBeTruthy();
      expect(getByText('20% Seniors')).toBeTruthy();
      expect(getByText('5% SAAD')).toBeTruthy();
      expect(getByText('5% Admins')).toBeTruthy();
    });
  });

  it('should display platform activity metrics', async () => {
    const { getByText } = render(<AdminDashboard />);

    await waitFor(() => {
      expect(getByText('Activité de la plateforme')).toBeTruthy();
      expect(getByText('30')).toBeTruthy(); // Daily active users
      expect(getByText('80')).toBeTruthy(); // Weekly active users
      expect(getByText('95')).toBeTruthy(); // Monthly active users
    });
  });

  it('should update stats from observable state', async () => {
    // Mock observable state with different values
    (adminState$.users.get as jest.Mock).mockReturnValue([
      { id: '1' }, { id: '2' }, { id: '3' }
    ]);
    (adminState$.seniors.get as jest.Mock).mockReturnValue([
      { id: '1' }, { id: '2' }
    ]);

    const { getByText } = render(<AdminDashboard />);

    await waitFor(() => {
      // Should use observable state values
      expect(getByText('3')).toBeTruthy(); // Users from state
      expect(getByText('2')).toBeTruthy(); // Seniors from state
    });
  });
});