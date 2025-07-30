import { supabase } from '../client';
import { MyCompanionUser, Senior, Call, Alert, UserType } from '../types';
import { Database } from '@/utils/database.types';
import { authState$ } from '../auth/auth-state';

// =====================================================
// SERVICE ADMIN - ACCÈS COMPLET AUX DONNÉES
// =====================================================

// Types pour les statistiques
export interface PlatformStats {
  totalUsers: number;
  totalSeniors: number;
  totalCalls: number;
  totalAlerts: number;
  activeUsers: number;
  usersByType: Record<UserType, number>;
  recentActivity: {
    lastCallDate?: string;
    lastAlertDate?: string;
    newUsersToday: number;
  };
}

export interface AdminFilters {
  searchQuery?: string;
  userType?: UserType;
  isActive?: boolean;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

// =====================================================
// VÉRIFICATION DES PERMISSIONS ADMIN
// =====================================================

export function isUserAdmin(): boolean {
  const userProfile = authState$.user.get();
  return userProfile?.user_type === 'admin' && userProfile?.is_active === true;
}

export function requireAdminAccess(): void {
  if (!isUserAdmin()) {
    throw new Error('Accès refusé : privilèges administrateur requis');
  }
}

// =====================================================
// GESTION DES SENIORS - ACCÈS GLOBAL
// =====================================================

export async function getAllSeniors(filters?: AdminFilters): Promise<Senior[]> {
  requireAdminAccess();
  
  try {
    let query = supabase
      .from('seniors')
      .select('*')
      .eq('deleted', false)
      .order('created_at', { ascending: false });
    
    // Appliquer les filtres
    if (filters?.searchQuery) {
      query = query.or(`first_name.ilike.%${filters.searchQuery}%,last_name.ilike.%${filters.searchQuery}%,phone.ilike.%${filters.searchQuery}%`);
    }
    
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[AdminService] Erreur lors de la récupération des seniors:', error);
    throw error;
  }
}

// =====================================================
// GESTION DES UTILISATEURS - ACCÈS GLOBAL
// =====================================================

export async function getAllUsers(filters?: AdminFilters): Promise<MyCompanionUser[]> {
  requireAdminAccess();
  
  try {
    let query = supabase
      .from('users')
      .select('*')
      .eq('deleted', false)
      .order('created_at', { ascending: false });
    
    // Appliquer les filtres
    if (filters?.searchQuery) {
      query = query.or(`first_name.ilike.%${filters.searchQuery}%,last_name.ilike.%${filters.searchQuery}%,email.ilike.%${filters.searchQuery}%`);
    }
    
    if (filters?.userType) {
      query = query.eq('user_type', filters.userType);
    }
    
    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }
    
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[AdminService] Erreur lors de la récupération des utilisateurs:', error);
    throw error;
  }
}

// =====================================================
// GESTION DES APPELS - ACCÈS GLOBAL
// =====================================================

export async function getAllCalls(filters?: AdminFilters): Promise<Call[]> {
  requireAdminAccess();
  
  try {
    let query = supabase
      .from('calls')
      .select(`
        *,
        seniors (
          id,
          first_name,
          last_name,
          phone
        )
      `)
      .order('start_time', { ascending: false });
    
    if (filters?.dateFrom) {
      query = query.gte('start_time', filters.dateFrom);
    }
    
    if (filters?.dateTo) {
      query = query.lte('start_time', filters.dateTo);
    }
    
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[AdminService] Erreur lors de la récupération des appels:', error);
    throw error;
  }
}

// =====================================================
// GESTION DES ALERTES - ACCÈS GLOBAL
// =====================================================

export async function getAllAlerts(filters?: AdminFilters): Promise<Alert[]> {
  requireAdminAccess();
  
  try {
    let query = supabase
      .from('alerts')
      .select(`
        *,
        seniors (
          id,
          first_name,
          last_name,
          phone
        )
      `)
      .order('created_at', { ascending: false });
    
    // Filtrer par date si nécessaire
    if (filters?.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }
    
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[AdminService] Erreur lors de la récupération des alertes:', error);
    throw error;
  }
}

// =====================================================
// STATISTIQUES GLOBALES
// =====================================================

export async function getGlobalStats(): Promise<PlatformStats> {
  requireAdminAccess();
  
  try {
    // Récupérer le nombre total d'utilisateurs
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('deleted', false);
    
    // Récupérer le nombre d'utilisateurs actifs
    const { count: activeUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('deleted', false)
      .eq('is_active', true);
    
    // Récupérer le nombre total de seniors
    const { count: totalSeniors } = await supabase
      .from('seniors')
      .select('*', { count: 'exact', head: true })
      .eq('deleted', false);
    
    // Récupérer le nombre total d'appels
    const { count: totalCalls } = await supabase
      .from('calls')
      .select('*', { count: 'exact', head: true });
    
    // Récupérer le nombre total d'alertes
    const { count: totalAlerts } = await supabase
      .from('alerts')
      .select('*', { count: 'exact', head: true });
    
    // Récupérer les utilisateurs par type
    const { data: usersByTypeData } = await supabase
      .from('users')
      .select('user_type')
      .eq('deleted', false);
    
    const usersByType = usersByTypeData?.reduce((acc, user) => {
      const type = user.user_type as UserType;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<UserType, number>) || {};
    
    // Récupérer l'activité récente
    const today = new Date().toISOString().split('T')[0];
    
    const { data: lastCall } = await supabase
      .from('calls')
      .select('start_time')
      .order('start_time', { ascending: false })
      .limit(1)
      .single();
    
    const { data: lastAlert } = await supabase
      .from('alerts')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    const { count: newUsersToday } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today)
      .eq('deleted', false);
    
    return {
      totalUsers: totalUsers || 0,
      totalSeniors: totalSeniors || 0,
      totalCalls: totalCalls || 0,
      totalAlerts: totalAlerts || 0,
      activeUsers: activeUsers || 0,
      usersByType,
      recentActivity: {
        lastCallDate: lastCall?.start_time,
        lastAlertDate: lastAlert?.created_at,
        newUsersToday: newUsersToday || 0,
      },
    };
  } catch (error) {
    console.error('[AdminService] Erreur lors de la récupération des statistiques:', error);
    throw error;
  }
}

// =====================================================
// ACTIONS ADMIN SUR LES UTILISATEURS
// =====================================================

export async function updateUserStatus(userId: string, isActive: boolean): Promise<void> {
  requireAdminAccess();
  
  try {
    const { error } = await supabase
      .from('users')
      .update({ 
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
    
    if (error) throw error;
  } catch (error) {
    console.error('[AdminService] Erreur lors de la mise à jour du statut utilisateur:', error);
    throw error;
  }
}

export async function changeUserRole(userId: string, newRole: UserType): Promise<void> {
  requireAdminAccess();
  
  // Empêcher l'admin de se retirer ses propres droits
  const currentUserId = authState$.session.get()?.user?.id;
  if (userId === currentUserId && newRole !== 'admin') {
    throw new Error('Impossible de retirer vos propres droits administrateur');
  }
  
  try {
    const { error } = await supabase
      .from('users')
      .update({ 
        user_type: newRole,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
    
    if (error) throw error;
  } catch (error) {
    console.error('[AdminService] Erreur lors du changement de rôle:', error);
    throw error;
  }
}

export async function deleteUser(userId: string): Promise<void> {
  requireAdminAccess();
  
  // Empêcher l'admin de se supprimer
  const currentUserId = authState$.session.get()?.user?.id;
  if (userId === currentUserId) {
    throw new Error('Impossible de supprimer votre propre compte');
  }
  
  try {
    // Soft delete - marquer comme supprimé
    const { error } = await supabase
      .from('users')
      .update({ 
        deleted: true,
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
    
    if (error) throw error;
  } catch (error) {
    console.error('[AdminService] Erreur lors de la suppression de l\'utilisateur:', error);
    throw error;
  }
}

// =====================================================
// EXPORT DES DONNÉES
// =====================================================

export async function exportDataToCSV(dataType: 'users' | 'seniors' | 'calls' | 'alerts'): Promise<string> {
  requireAdminAccess();
  
  try {
    let data: any[] = [];
    
    switch (dataType) {
      case 'users':
        data = await getAllUsers();
        break;
      case 'seniors':
        data = await getAllSeniors();
        break;
      case 'calls':
        data = await getAllCalls({ limit: 1000 });
        break;
      case 'alerts':
        data = await getAllAlerts({ limit: 1000 });
        break;
    }
    
    if (data.length === 0) {
      return '';
    }
    
    // Convertir en CSV
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(item => 
      Object.values(item).map(value => 
        typeof value === 'object' ? JSON.stringify(value) : value
      ).join(',')
    );
    
    return [headers, ...rows].join('\n');
  } catch (error) {
    console.error('[AdminService] Erreur lors de l\'export des données:', error);
    throw error;
  }
}

// =====================================================
// LOGS D'AUDIT
// =====================================================

export async function logAdminAction(action: string, targetId?: string, details?: any): Promise<void> {
  try {
    const userId = authState$.session.get()?.user?.id;
    const userEmail = authState$.user.get()?.email;
    
    await supabase.from('analytics_events').insert({
      event_type: 'admin_action',
      event_name: action,
      user_id: userId,
      context: {
        admin_email: userEmail,
        target_id: targetId,
        details,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[AdminService] Erreur lors de l\'enregistrement du log d\'audit:', error);
    // Ne pas faire échouer l'action principale si le log échoue
  }
}