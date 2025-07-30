import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { AdminRoute } from '@/components/admin/AdminRoute';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { subscribeToAdminData, unsubscribeFromAdminData } from '@/utils/supabase/observables/admin-observables';

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
      <ThemedView style={styles.container}>
        <AdminDashboard />
      </ThemedView>
    </AdminRoute>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});