import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { getSeniorCalls } from '../utils/supabase/services/call-service';
import { Call, Senior } from '../utils/supabase/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface CallHistoryModalProps {
  visible: boolean;
  onClose: () => void;
  senior: Senior;
}

export const CallHistoryModal: React.FC<CallHistoryModalProps> = ({ 
  visible, 
  onClose, 
  senior 
}) => {
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && senior) {
      loadCalls();
    }
  }, [visible, senior]);

  const loadCalls = async () => {
    try {
      setLoading(true);
      const callsData = await getSeniorCalls(senior.id);
      setCalls(callsData);
    } catch (error) {
      console.error('Erreur lors du chargement des appels:', error);
      Alert.alert('Erreur', 'Impossible de charger l\'historique des appels');
    } finally {
      setLoading(false);
    }
  };

  const formatCallDuration = (seconds: number | null) => {
    if (!seconds) return '-';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'no_answer':
        return '📵';
      case 'failed':
        return '❌';
      case 'scheduled':
        return '🕒';
      case 'in_progress':
        return '📞';
      default:
        return '❓';
    }
  };

  const getCallTypeIcon = (callType: string | null) => {
    switch (callType) {
      case 'scheduled':
        return '📅';
      case 'emergency':
        return '🚨';
      case 'followup':
        return '🔄';
      default:
        return '📞';
    }
  };

  const getCallTypeText = (callType: string | null) => {
    switch (callType) {
      case 'scheduled':
        return 'Programmé';
      case 'emergency':
        return 'Urgence';
      case 'followup':
        return 'Suivi';
      default:
        return 'Appel';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Terminé';
      case 'no_answer':
        return 'Sans réponse';
      case 'failed':
        return 'Échec';
      case 'scheduled':
        return 'Programmé';
      case 'in_progress':
        return 'En cours';
      default:
        return status;
    }
  };

  const getMoodIcon = (mood: string | null) => {
    if (!mood) return '';
    switch (mood.toLowerCase()) {
      case 'happy':
      case 'joyeux':
        return '😊';
      case 'sad':
      case 'triste':
        return '😢';
      case 'anxious':
      case 'anxieux':
        return '😟';
      case 'neutral':
      case 'neutre':
        return '😐';
      default:
        return '🙂';
    }
  };

  const renderCallItem = ({ item }: { item: Call }) => {
    const startDate = item.started_at ? new Date(item.started_at) : null;
    
    return (
      <View style={styles.callItem}>
        <View style={styles.callHeader}>
          <View style={styles.callHeaderLeft}>
            <ThemedText style={styles.statusIcon}>
              {getStatusIcon(item.status)}
            </ThemedText>
            <View>
              <ThemedText style={styles.callDate}>
                {startDate 
                  ? format(startDate, 'dd MMMM yyyy', { locale: fr })
                  : 'Date non disponible'}
              </ThemedText>
              <ThemedText style={styles.callTime}>
                {startDate 
                  ? format(startDate, 'HH:mm', { locale: fr })
                  : ''}
              </ThemedText>
            </View>
          </View>
          <View style={styles.callHeaderRight}>
            <View style={styles.callTypeContainer}>
              <ThemedText style={styles.callTypeIcon}>
                {getCallTypeIcon(item.call_type)}
              </ThemedText>
              <ThemedText style={styles.callType}>
                {getCallTypeText(item.call_type)}
              </ThemedText>
            </View>
            <ThemedText style={styles.callStatus}>
              {getStatusText(item.status)}
            </ThemedText>
            {item.duration_seconds && (
              <ThemedText style={styles.callDuration}>
                ⏱️ {formatCallDuration(item.duration_seconds)}
              </ThemedText>
            )}
          </View>
        </View>

        {item.mood_detected && (
          <View style={styles.callMood}>
            <ThemedText style={styles.moodLabel}>Humeur détectée:</ThemedText>
            <ThemedText style={styles.moodValue}>
              {getMoodIcon(item.mood_detected)} {item.mood_detected}
            </ThemedText>
          </View>
        )}

        {item.quality_score && (
          <View style={styles.qualityContainer}>
            <ThemedText style={styles.qualityLabel}>Qualité:</ThemedText>
            <View style={styles.qualityBar}>
              <View 
                style={[
                  styles.qualityFill, 
                  { 
                    width: `${item.quality_score}%`,
                    backgroundColor: item.quality_score > 70 ? '#4CAF50' : 
                                   item.quality_score > 40 ? '#FF9800' : '#F44336'
                  }
                ]} 
              />
            </View>
            <ThemedText style={styles.qualityScore}>
              {item.quality_score}%
            </ThemedText>
          </View>
        )}

        {item.conversation_summary && (
          <View style={styles.summaryContainer}>
            <ThemedText style={styles.summaryLabel}>Résumé:</ThemedText>
            <ThemedText style={styles.summaryText}>
              {item.conversation_summary}
            </ThemedText>
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>
              📞 Historique des appels
            </ThemedText>
            <TouchableOpacity onPress={onClose}>
              <ThemedText style={styles.closeButton}>✕</ThemedText>
            </TouchableOpacity>
          </View>

          <ThemedText style={styles.seniorName}>
            {senior.first_name} {senior.last_name}
          </ThemedText>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <ThemedText style={styles.loadingText}>
                Chargement des appels...
              </ThemedText>
            </View>
          ) : calls.length === 0 ? (
            <View style={styles.emptyContainer}>
              <ThemedText style={styles.emptyText}>
                Aucun appel enregistré pour le moment
              </ThemedText>
            </View>
          ) : (
            <FlatList
              data={calls}
              renderItem={renderCallItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
  },
  seniorName: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
  },
  listContainer: {
    paddingBottom: 20,
  },
  callItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  callHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  callHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  callHeaderRight: {
    alignItems: 'flex-end',
  },
  callTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  callTypeIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  callType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  statusIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  callDate: {
    fontSize: 14,
    fontWeight: '600',
  },
  callTime: {
    fontSize: 12,
    color: '#666',
  },
  callStatus: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
  },
  callDuration: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  callMood: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  moodLabel: {
    fontSize: 12,
    color: '#666',
    marginRight: 5,
  },
  moodValue: {
    fontSize: 12,
    fontWeight: '500',
  },
  qualityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  qualityLabel: {
    fontSize: 12,
    color: '#666',
    marginRight: 10,
  },
  qualityBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  qualityFill: {
    height: '100%',
    borderRadius: 4,
  },
  qualityScore: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 10,
    minWidth: 35,
  },
  summaryContainer: {
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#333',
  },
});