import React from 'react';
import { StyleSheet, SafeAreaView, View, TouchableOpacity } from 'react-native';
import { Stack, router } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { AdminRoute } from '@/components/admin/AdminRoute';
import { AdminAlertCenter } from '@/components/admin/AdminAlertCenter';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function AdminAlertsScreen() {
  return (
    <AdminRoute>
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            title: 'Centre d\'Alertes',
            headerShown: true,
            headerLeft: () => (
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backButton}
              >
                <IconSymbol name="chevron.left" size={24} color="#007AFF" />
              </TouchableOpacity>
            ),
          }}
        />
        
        <ThemedView style={styles.content}>
          <View style={styles.header}>
            <ThemedText type="title">Centre d'Alertes</ThemedText>
            <ThemedText style={styles.subtitle}>
              Gérer toutes les alertes de la plateforme en temps réel
            </ThemedText>
          </View>
          
          <AdminAlertCenter />
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
  header: {
    padding: 20,
    paddingTop: 10,
    paddingBottom: 0,
  },
  subtitle: {
    marginTop: 4,
    opacity: 0.6,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
});