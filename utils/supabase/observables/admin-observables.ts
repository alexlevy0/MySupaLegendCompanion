import { observable } from '@legendapp/state';
import { MyCompanionUser, Senior, Call, Alert } from '../types';
import { PlatformStats } from '../services/admin-service';
import { supabase } from '../client';
import { isUserAdmin } from '../services/admin-service';

// =====================================================
// OBSERVABLES ADMIN - DONNÉES TEMPS RÉEL
// =====================================================

// Types pour les observables admin
export interface AdminState {
  // Données globales
  allSeniors: Senior[];
  allUsers: MyCompanionUser[];
  allCalls: Call[];
  allAlerts: Alert[];
  
  // Statistiques
  platformStats: PlatformStats | null;
  
  // États de chargement
  loading: {
    seniors: boolean;
    users: boolean;
    calls: boolean;
    alerts: boolean;
    stats: boolean;
  };
  
  // Erreurs
  errors: {
    seniors: string | null;
    users: string | null;
    calls: string | null;
    alerts: string | null;
    stats: string | null;
  };
  
  // Filtres actifs
  filters: {
    searchQuery: string;
    userType: string | null;
    dateFrom: string | null;
    dateTo: string | null;
  };
}

// Observable principal pour l'état admin
export const adminState$ = observable<AdminState>({
  allSeniors: [],
  allUsers: [],
  allCalls: [],
  allAlerts: [],
  platformStats: null,
  loading: {
    seniors: false,
    users: false,
    calls: false,
    alerts: false,
    stats: false,
  },
  errors: {
    seniors: null,
    users: null,
    calls: null,
    alerts: null,
    stats: null,
  },
  filters: {
    searchQuery: '',
    userType: null,
    dateFrom: null,
    dateTo: null,
  },
});

// =====================================================
// SUBSCRIPTIONS TEMPS RÉEL
// =====================================================

let adminSubscriptions: {
  seniors?: any;
  users?: any;
  calls?: any;
  alerts?: any;
} = {};

export function subscribeToAdminData() {
  // Vérifier les permissions admin
  if (!isUserAdmin()) {
    console.error('[AdminObservables] Accès refusé : permissions admin requises');
    return;
  }
  
  // Nettoyer les subscriptions existantes
  unsubscribeFromAdminData();
  
  // Subscription aux seniors
  adminSubscriptions.seniors = supabase
    .channel('admin-seniors')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'seniors',
      },
      (payload) => {
        console.log('[AdminObservables] Changement détecté sur seniors:', payload);
        
        if (payload.eventType === 'INSERT' && payload.new) {
          adminState$.allSeniors.set([...adminState$.allSeniors.get(), payload.new as Senior]);
        } else if (payload.eventType === 'UPDATE' && payload.new) {
          const seniors = adminState$.allSeniors.get();
          const index = seniors.findIndex(s => s.id === payload.new.id);
          if (index !== -1) {
            const updatedSeniors = [...seniors];
            updatedSeniors[index] = payload.new as Senior;
            adminState$.allSeniors.set(updatedSeniors);
          }
        } else if (payload.eventType === 'DELETE' && payload.old) {
          const seniors = adminState$.allSeniors.get();
          adminState$.allSeniors.set(seniors.filter(s => s.id !== payload.old.id));
        }
      }
    )
    .subscribe();
  
  // Subscription aux utilisateurs
  adminSubscriptions.users = supabase
    .channel('admin-users')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'users',
      },
      (payload) => {
        console.log('[AdminObservables] Changement détecté sur users:', payload);
        
        if (payload.eventType === 'INSERT' && payload.new) {
          adminState$.allUsers.set([...adminState$.allUsers.get(), payload.new as MyCompanionUser]);
        } else if (payload.eventType === 'UPDATE' && payload.new) {
          const users = adminState$.allUsers.get();
          const index = users.findIndex(u => u.id === payload.new.id);
          if (index !== -1) {
            const updatedUsers = [...users];
            updatedUsers[index] = payload.new as MyCompanionUser;
            adminState$.allUsers.set(updatedUsers);
          }
        } else if (payload.eventType === 'DELETE' && payload.old) {
          const users = adminState$.allUsers.get();
          adminState$.allUsers.set(users.filter(u => u.id !== payload.old.id));
        }
      }
    )
    .subscribe();
  
  // Subscription aux appels
  adminSubscriptions.calls = supabase
    .channel('admin-calls')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'calls',
      },
      (payload) => {
        console.log('[AdminObservables] Changement détecté sur calls:', payload);
        
        if (payload.eventType === 'INSERT' && payload.new) {
          // Ajouter en début de liste (appels récents en premier)
          adminState$.allCalls.set([payload.new as Call, ...adminState$.allCalls.get()]);
        } else if (payload.eventType === 'UPDATE' && payload.new) {
          const calls = adminState$.allCalls.get();
          const index = calls.findIndex(c => c.id === payload.new.id);
          if (index !== -1) {
            const updatedCalls = [...calls];
            updatedCalls[index] = payload.new as Call;
            adminState$.allCalls.set(updatedCalls);
          }
        }
      }
    )
    .subscribe();
  
  // Subscription aux alertes
  adminSubscriptions.alerts = supabase
    .channel('admin-alerts')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'alerts',
      },
      (payload) => {
        console.log('[AdminObservables] Changement détecté sur alerts:', payload);
        
        if (payload.eventType === 'INSERT' && payload.new) {
          // Ajouter en début de liste (alertes récentes en premier)
          adminState$.allAlerts.set([payload.new as Alert, ...adminState$.allAlerts.get()]);
          
          // Notification pour les alertes critiques
          if ((payload.new as Alert).severity === 'critical') {
            console.warn('[AdminObservables] ALERTE CRITIQUE DÉTECTÉE:', payload.new);
            // TODO: Déclencher une notification push/visuelle
          }
        } else if (payload.eventType === 'UPDATE' && payload.new) {
          const alerts = adminState$.allAlerts.get();
          const index = alerts.findIndex(a => a.id === payload.new.id);
          if (index !== -1) {
            const updatedAlerts = [...alerts];
            updatedAlerts[index] = payload.new as Alert;
            adminState$.allAlerts.set(updatedAlerts);
          }
        }
      }
    )
    .subscribe();
}

export function unsubscribeFromAdminData() {
  Object.values(adminSubscriptions).forEach(subscription => {
    if (subscription) {
      subscription.unsubscribe();
    }
  });
  adminSubscriptions = {};
}

// =====================================================
// FONCTIONS UTILITAIRES
// =====================================================

// Réinitialiser l'état admin
export function resetAdminState() {
  adminState$.set({
    allSeniors: [],
    allUsers: [],
    allCalls: [],
    allAlerts: [],
    platformStats: null,
    loading: {
      seniors: false,
      users: false,
      calls: false,
      alerts: false,
      stats: false,
    },
    errors: {
      seniors: null,
      users: null,
      calls: null,
      alerts: null,
      stats: null,
    },
    filters: {
      searchQuery: '',
      userType: null,
      dateFrom: null,
      dateTo: null,
    },
  });
}

// Mettre à jour les filtres
export function updateAdminFilters(filters: Partial<AdminState['filters']>) {
  adminState$.filters.set({
    ...adminState$.filters.get(),
    ...filters,
  });
}

// Obtenir les données filtrées
export function getFilteredSeniors(): Senior[] {
  const seniors = adminState$.allSeniors.get();
  const filters = adminState$.filters.get();
  
  if (!filters.searchQuery) {
    return seniors;
  }
  
  const query = filters.searchQuery.toLowerCase();
  return seniors.filter(senior => 
    senior.first_name?.toLowerCase().includes(query) ||
    senior.last_name?.toLowerCase().includes(query) ||
    senior.phone?.includes(query)
  );
}

export function getFilteredUsers(): MyCompanionUser[] {
  const users = adminState$.allUsers.get();
  const filters = adminState$.filters.get();
  
  let filtered = users;
  
  if (filters.searchQuery) {
    const query = filters.searchQuery.toLowerCase();
    filtered = filtered.filter(user => 
      user.first_name?.toLowerCase().includes(query) ||
      user.last_name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query)
    );
  }
  
  if (filters.userType) {
    filtered = filtered.filter(user => user.user_type === filters.userType);
  }
  
  return filtered;
}

export function getFilteredAlerts(): Alert[] {
  const alerts = adminState$.allAlerts.get();
  const filters = adminState$.filters.get();
  
  let filtered = alerts;
  
  if (filters.dateFrom) {
    filtered = filtered.filter(alert => 
      new Date(alert.created_at) >= new Date(filters.dateFrom!)
    );
  }
  
  if (filters.dateTo) {
    filtered = filtered.filter(alert => 
      new Date(alert.created_at) <= new Date(filters.dateTo!)
    );
  }
  
  return filtered;
}

// Statistiques en temps réel
export function getRealtimeStats(): PlatformStats | null {
  const stats = adminState$.platformStats.get();
  if (!stats) return null;
  
  // Mettre à jour avec les données en temps réel
  return {
    ...stats,
    totalUsers: adminState$.allUsers.get().filter(u => !u.deleted).length,
    totalSeniors: adminState$.allSeniors.get().filter(s => !s.deleted).length,
    totalCalls: adminState$.allCalls.get().length,
    totalAlerts: adminState$.allAlerts.get().length,
    activeUsers: adminState$.allUsers.get().filter(u => u.is_active && !u.deleted).length,
  };
}