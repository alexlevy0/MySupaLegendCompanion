import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, TextInput, TouchableOpacity, Alert, Modal } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/Button';
import { Picker } from '@react-native-picker/picker';
import { 
  getAllUsers, 
  updateUserStatus, 
  changeUserRole, 
  deleteUser,
  logAdminAction 
} from '@/utils/supabase/services/admin-service';
import { adminState$, updateAdminFilters, getFilteredUsers } from '@/utils/supabase/observables/admin-observables';
import { useSelector } from '@legendapp/state/react';
import { MyCompanionUser, UserType } from '@/utils/supabase/types';
import { useMyCompanionAuth } from '@/utils/supabase/auth/auth-hooks';

interface UserItemProps {
  user: MyCompanionUser;
  currentUserId?: string;
  onStatusToggle: (user: MyCompanionUser) => void;
  onRoleChange: (user: MyCompanionUser) => void;
  onDelete: (user: MyCompanionUser) => void;
}

function UserItem({ user, currentUserId, onStatusToggle, onRoleChange, onDelete }: UserItemProps) {
  const isCurrentUser = user.id === currentUserId;
  const userTypeLabel = getUserTypeLabel(user.user_type);
  
  return (
    <View style={styles.userItem}>
      <View style={styles.userHeader}>
        <View style={[styles.userAvatar, { backgroundColor: getUserTypeColor(user.user_type) + '20' }]}>
          <IconSymbol 
            name={getUserTypeIcon(user.user_type)} 
            size={24} 
            color={getUserTypeColor(user.user_type)} 
          />
        </View>
        
        <View style={styles.userInfo}>
          <ThemedText style={styles.userName}>
            {user.first_name} {user.last_name}
            {isCurrentUser && <ThemedText style={styles.currentUserBadge}> (Vous)</ThemedText>}
          </ThemedText>
          <ThemedText style={styles.userEmail}>{user.email}</ThemedText>
          <View style={styles.userMeta}>
            <View style={[styles.roleTag, { backgroundColor: getUserTypeColor(user.user_type) + '20' }]}>
              <ThemedText style={[styles.roleText, { color: getUserTypeColor(user.user_type) }]}>
                {userTypeLabel}
              </ThemedText>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: user.is_active ? '#34C75920' : '#FF3B3020' }]}>
              <ThemedText style={[styles.statusText, { color: user.is_active ? '#34C759' : '#FF3B30' }]}>
                {user.is_active ? 'Actif' : 'Inactif'}
              </ThemedText>
            </View>
          </View>
        </View>
      </View>
      
      <View style={styles.userActions}>
        <TouchableOpacity 
          style={[styles.actionButton, isCurrentUser && styles.disabledButton]}
          onPress={() => onStatusToggle(user)}
          disabled={isCurrentUser}
        >
          <IconSymbol 
            name={user.is_active ? 'pause.circle' : 'play.circle'} 
            size={24} 
            color={isCurrentUser ? '#C7C7CC' : '#007AFF'} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, isCurrentUser && styles.disabledButton]}
          onPress={() => onRoleChange(user)}
          disabled={isCurrentUser}
        >
          <IconSymbol 
            name="person.badge.shield.checkmark" 
            size={24} 
            color={isCurrentUser ? '#C7C7CC' : '#FF9500'} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, isCurrentUser && styles.disabledButton]}
          onPress={() => onDelete(user)}
          disabled={isCurrentUser}
        >
          <IconSymbol 
            name="trash" 
            size={24} 
            color={isCurrentUser ? '#C7C7CC' : '#FF3B30'} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function getUserTypeLabel(type: UserType): string {
  switch (type) {
    case 'admin': return 'Administrateur';
    case 'family': return 'Famille';
    case 'senior': return 'Senior';
    case 'saad_admin': return 'Admin SAAD';
    case 'saad_worker': return 'Agent SAAD';
    default: return type;
  }
}

function getUserTypeIcon(type: UserType): string {
  switch (type) {
    case 'admin': return 'crown.fill';
    case 'family': return 'person.2.fill';
    case 'senior': return 'person.fill';
    case 'saad_admin': return 'building.2.fill';
    case 'saad_worker': return 'person.badge.shield.checkmark.fill';
    default: return 'person.fill';
  }
}

function getUserTypeColor(type: UserType): string {
  switch (type) {
    case 'admin': return '#FFD700';
    case 'family': return '#007AFF';
    case 'senior': return '#34C759';
    case 'saad_admin': return '#FF9500';
    case 'saad_worker': return '#AF52DE';
    default: return '#8E8E93';
  }
}

export function AdminUsersList() {
  const { session } = useMyCompanionAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<UserType | 'all'>('all');
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<MyCompanionUser | null>(null);
  const [newRole, setNewRole] = useState<UserType>('family');
  
  // Observer les utilisateurs filtrés
  const filteredUsers = useSelector(getFilteredUsers);
  const totalUsers = useSelector(() => adminState$.allUsers.get().length);
  const currentUserId = session?.user?.id;

  const loadUsers = async () => {
    try {
      setError(null);
      adminState$.loading.users.set(true);
      
      const users = await getAllUsers();
      adminState$.allUsers.set(users);
      
      await logAdminAction('view_all_users', undefined, { count: users.length });
    } catch (err) {
      console.error('[AdminUsersList] Erreur lors du chargement:', err);
      setError('Impossible de charger la liste des utilisateurs');
    } finally {
      setLoading(false);
      setRefreshing(false);
      adminState$.loading.users.set(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    updateAdminFilters({ searchQuery: text });
  };

  const handleFilterChange = (filter: UserType | 'all') => {
    setSelectedFilter(filter);
    updateAdminFilters({ userType: filter === 'all' ? null : filter });
  };

  const handleStatusToggle = async (user: MyCompanionUser) => {
    const newStatus = !user.is_active;
    const action = newStatus ? 'activer' : 'désactiver';
    
    Alert.alert(
      'Confirmation',
      `Êtes-vous sûr de vouloir ${action} le compte de ${user.first_name} ${user.last_name} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            try {
              await updateUserStatus(user.id, newStatus);
              await logAdminAction('update_user_status', user.id, { 
                email: user.email,
                newStatus 
              });
              
              // Mettre à jour localement
              const users = adminState$.allUsers.get();
              const index = users.findIndex(u => u.id === user.id);
              if (index !== -1) {
                const updatedUsers = [...users];
                updatedUsers[index] = { ...updatedUsers[index], is_active: newStatus };
                adminState$.allUsers.set(updatedUsers);
              }
              
              Alert.alert('Succès', `Compte ${action} avec succès`);
            } catch (error) {
              console.error('[AdminUsersList] Erreur mise à jour statut:', error);
              Alert.alert('Erreur', `Impossible de ${action} le compte`);
            }
          }
        }
      ]
    );
  };

  const handleRoleChange = (user: MyCompanionUser) => {
    setSelectedUser(user);
    setNewRole(user.user_type);
    setModalVisible(true);
  };

  const confirmRoleChange = async () => {
    if (!selectedUser || newRole === selectedUser.user_type) {
      setModalVisible(false);
      return;
    }

    try {
      await changeUserRole(selectedUser.id, newRole);
      await logAdminAction('change_user_role', selectedUser.id, {
        email: selectedUser.email,
        oldRole: selectedUser.user_type,
        newRole
      });
      
      // Mettre à jour localement
      const users = adminState$.allUsers.get();
      const index = users.findIndex(u => u.id === selectedUser.id);
      if (index !== -1) {
        const updatedUsers = [...users];
        updatedUsers[index] = { ...updatedUsers[index], user_type: newRole };
        adminState$.allUsers.set(updatedUsers);
      }
      
      Alert.alert('Succès', 'Rôle modifié avec succès');
      setModalVisible(false);
    } catch (error: any) {
      console.error('[AdminUsersList] Erreur changement de rôle:', error);
      Alert.alert('Erreur', error.message || 'Impossible de modifier le rôle');
    }
  };

  const handleDelete = async (user: MyCompanionUser) => {
    Alert.alert(
      'Supprimer l\'utilisateur',
      `Êtes-vous sûr de vouloir supprimer définitivement le compte de ${user.first_name} ${user.last_name} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteUser(user.id);
              await logAdminAction('delete_user', user.id, { email: user.email });
              
              // Retirer de la liste locale
              const users = adminState$.allUsers.get();
              adminState$.allUsers.set(users.filter(u => u.id !== user.id));
              
              Alert.alert('Succès', 'Utilisateur supprimé avec succès');
            } catch (error: any) {
              console.error('[AdminUsersList] Erreur suppression:', error);
              Alert.alert('Erreur', error.message || 'Impossible de supprimer l\'utilisateur');
            }
          }
        }
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <LoadingSpinner />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* En-tête avec recherche et filtres */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <IconSymbol name="magnifyingglass" size={20} color="#8E8E93" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher par nom, email..."
            value={searchQuery}
            onChangeText={handleSearch}
            placeholderTextColor="#8E8E93"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <IconSymbol name="xmark.circle.fill" size={20} color="#8E8E93" />
            </TouchableOpacity>
          )}
        </View>
        
        <FlatList
          horizontal
          data={['all', 'admin', 'family', 'senior', 'saad_admin', 'saad_worker'] as const}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedFilter === item && styles.filterChipActive
              ]}
              onPress={() => handleFilterChange(item)}
            >
              <ThemedText style={[
                styles.filterChipText,
                selectedFilter === item && styles.filterChipTextActive
              ]}>
                {item === 'all' ? 'Tous' : getUserTypeLabel(item as UserType)}
              </ThemedText>
            </TouchableOpacity>
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContainer}
        />
        
        <ThemedText style={styles.countText}>
          {filteredUsers.length} / {totalUsers} utilisateurs
        </ThemedText>
      </View>

      {/* Message d'erreur */}
      {error && (
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <Button title="Réessayer" onPress={loadUsers} />
        </View>
      )}

      {/* Liste des utilisateurs */}
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <UserItem 
            user={item} 
            currentUserId={currentUserId}
            onStatusToggle={handleStatusToggle}
            onRoleChange={handleRoleChange}
            onDelete={handleDelete}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <IconSymbol name="person.2.slash" size={64} color="#C7C7CC" />
            <ThemedText style={styles.emptyText}>
              {searchQuery ? 'Aucun utilisateur trouvé' : 'Aucun utilisateur enregistré'}
            </ThemedText>
          </View>
        }
      />

      {/* Modal de changement de rôle */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>Changer le rôle</ThemedText>
            {selectedUser && (
              <ThemedText style={styles.modalSubtitle}>
                {selectedUser.first_name} {selectedUser.last_name}
              </ThemedText>
            )}
            
            <Picker
              selectedValue={newRole}
              onValueChange={setNewRole}
              style={styles.picker}
            >
              <Picker.Item label="Administrateur" value="admin" />
              <Picker.Item label="Famille" value="family" />
              <Picker.Item label="Senior" value="senior" />
              <Picker.Item label="Admin SAAD" value="saad_admin" />
              <Picker.Item label="Agent SAAD" value="saad_worker" />
            </Picker>
            
            <View style={styles.modalActions}>
              <Button
                title="Annuler"
                onPress={() => setModalVisible(false)}
                style={styles.modalButton}
                variant="secondary"
              />
              <Button
                title="Confirmer"
                onPress={confirmRoleChange}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  filtersContainer: {
    paddingVertical: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#007AFF',
  },
  filterChipText: {
    fontSize: 14,
    color: '#3C3C43',
  },
  filterChipTextActive: {
    color: 'white',
  },
  countText: {
    fontSize: 14,
    opacity: 0.6,
    marginTop: 8,
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    color: '#FF3B30',
    marginBottom: 16,
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 20,
  },
  userItem: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  userHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  currentUserBadge: {
    fontSize: 12,
    color: '#FFD700',
    fontWeight: 'normal',
  },
  userEmail: {
    fontSize: 14,
    opacity: 0.6,
    marginBottom: 8,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  userActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    padding: 8,
    marginLeft: 16,
  },
  disabledButton: {
    opacity: 0.5,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    opacity: 0.6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    opacity: 0.6,
    marginBottom: 20,
    textAlign: 'center',
  },
  picker: {
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 8,
  },
});