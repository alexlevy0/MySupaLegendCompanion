import { ThemedView } from '@/components/ThemedView';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { AdminRoute } from '@/components/admin/AdminRoute';
import { subscribeToAdminData, unsubscribeFromAdminData } from '@/utils/supabase/observables/admin-observables';
import React, { useEffect } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';

export default function AdminScreen() {
  useEffect(() => {
    // S'abonner aux données admin en temps réel
    subscribeToAdminData();
    
    return () => {
      // Se désabonner lors du démontage
      unsubscribeFromAdminData();
    };
  }, []);

  return (
    <AdminRoute>
      <SafeAreaView style={styles.container}>
        <ThemedView style={styles.content}>
          <AdminDashboard />
        </ThemedView>
      </SafeAreaView>
    </AdminRoute>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  content: {
    flex: 1,
  },
});