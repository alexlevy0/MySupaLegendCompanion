import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, TextInput, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/Button';
import { getAllSeniors, exportDataToCSV, logAdminAction } from '@/utils/supabase/services/admin-service';
import { adminState$, updateAdminFilters, getFilteredSeniors } from '@/utils/supabase/observables/admin-observables';
import { useSelector } from '@legendapp/state/react';
import { Senior } from '@/utils/supabase/types';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

interface SeniorItemProps {
  senior: Senior;
  onPress: (senior: Senior) => void;
}

function SeniorItem({ senior, onPress }: SeniorItemProps) {
  const age = senior.birth_date 
    ? Math.floor((Date.now() - new Date(senior.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  return (
    <TouchableOpacity 
      style={styles.seniorItem}
      onPress={() => onPress(senior)}
    >
      <View style={styles.seniorAvatar}>
        <IconSymbol name="person.fill" size={24} color="#007AFF" />
      </View>
      
      <View style={styles.seniorInfo}>
        <ThemedText style={styles.seniorName}>
          {senior.first_name} {senior.last_name}
        </ThemedText>
        <ThemedText style={styles.seniorDetails}>
          {senior.phone} {age ? `• ${age} ans` : ''}
        </ThemedText>
        {senior.address?.city && (
          <ThemedText style={styles.seniorLocation}>
            <IconSymbol name="location.fill" size={12} color="#666" /> {senior.address.city}
          </ThemedText>
        )}
      </View>
      
      <IconSymbol name="chevron.right" size={20} color="#C7C7CC" />
    </TouchableOpacity>
  );
}

export function AdminSeniorsList() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Observer les seniors filtrés
  const filteredSeniors = useSelector(getFilteredSeniors);
  const totalSeniors = useSelector(() => adminState$.allSeniors.get().length);

  const loadSeniors = async () => {
    try {
      setError(null);
      adminState$.loading.seniors.set(true);
      
      const seniors = await getAllSeniors();
      adminState$.allSeniors.set(seniors);
      
      await logAdminAction('view_all_seniors', undefined, { count: seniors.length });
    } catch (err) {
      console.error('[AdminSeniorsList] Erreur lors du chargement:', err);
      setError('Impossible de charger la liste des seniors');
    } finally {
      setLoading(false);
      setRefreshing(false);
      adminState$.loading.seniors.set(false);
    }
  };

  useEffect(() => {
    loadSeniors();
  }, []);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    updateAdminFilters({ searchQuery: text });
  };

  const handleSeniorPress = (senior: Senior) => {
    logAdminAction('view_senior_details', senior.id);
    router.push(`/admin/senior-details/${senior.id}`);
  };

  const handleExport = async () => {
    try {
      const csv = await exportDataToCSV('seniors');
      if (!csv) {
        Alert.alert('Erreur', 'Aucune donnée à exporter');
        return;
      }

      // Sauvegarder le fichier
      const fileName = `seniors_export_${new Date().toISOString().split('T')[0]}.csv`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(filePath, csv, { encoding: FileSystem.EncodingType.UTF8 });
      
      // Partager le fichier
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath);
      } else {
        Alert.alert('Succès', `Fichier exporté: ${fileName}`);
      }
      
      await logAdminAction('export_seniors_data');
    } catch (error) {
      console.error('[AdminSeniorsList] Erreur export:', error);
      Alert.alert('Erreur', 'Impossible d\'exporter les données');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadSeniors();
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
      {/* En-tête avec recherche */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <IconSymbol name="magnifyingglass" size={20} color="#8E8E93" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher par nom, téléphone..."
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
        
        <View style={styles.headerActions}>
          <ThemedText style={styles.countText}>
            {filteredSeniors.length} / {totalSeniors} seniors
          </ThemedText>
          
          <Button
            title="Exporter CSV"
            onPress={handleExport}
            style={styles.exportButton}
            textStyle={styles.exportButtonText}
          />
        </View>
      </View>

      {/* Message d'erreur */}
      {error && (
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <Button title="Réessayer" onPress={loadSeniors} />
        </View>
      )}

      {/* Liste des seniors */}
      <FlatList
        data={filteredSeniors}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SeniorItem senior={item} onPress={handleSeniorPress} />
        )}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <IconSymbol name="person.2.slash" size={64} color="#C7C7CC" />
            <ThemedText style={styles.emptyText}>
              {searchQuery ? 'Aucun senior trouvé' : 'Aucun senior enregistré'}
            </ThemedText>
          </View>
        }
      />

      {/* Bouton flottant pour ajouter un senior */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => router.push('/admin/add-senior')}
      >
        <IconSymbol name="plus" size={24} color="white" />
      </TouchableOpacity>
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
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  countText: {
    fontSize: 14,
    opacity: 0.6,
  },
  exportButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 0,
  },
  exportButtonText: {
    fontSize: 14,
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
    paddingBottom: 100,
  },
  seniorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  seniorAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  seniorInfo: {
    flex: 1,
  },
  seniorName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  seniorDetails: {
    fontSize: 14,
    opacity: 0.6,
    marginBottom: 2,
  },
  seniorLocation: {
    fontSize: 12,
    opacity: 0.5,
    flexDirection: 'row',
    alignItems: 'center',
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
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});