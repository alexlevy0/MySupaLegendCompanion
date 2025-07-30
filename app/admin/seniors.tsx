import React from 'react';
import { StyleSheet, SafeAreaView, View, TouchableOpacity } from 'react-native';
import { Stack, router } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { AdminRoute } from '@/components/admin/AdminRoute';
import { AdminSeniorsList } from '@/components/admin/AdminSeniorsList';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function AdminSeniorsScreen() {
  return (
    <AdminRoute>
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            title: 'Gestion des Seniors',
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
            <ThemedText type="title">Tous les Seniors</ThemedText>
            <ThemedText style={styles.subtitle}>
              Vue complète de tous les seniors enregistrés
            </ThemedText>
          </View>
          
          <AdminSeniorsList />
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