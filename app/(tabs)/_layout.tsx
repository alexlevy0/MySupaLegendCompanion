// app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";

import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useMyCompanionAuth } from "@/utils/SupaLegend";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { isFamily, isSAAD, isAdmin, isSenior, loading } = useMyCompanionAuth();

  // Déterminer quels tabs afficher selon le type d'utilisateur
  const shouldShowSeniors = isFamily || isSAAD || isAdmin;
  const shouldShowDashboard = isSenior;
  const shouldShowAlerts = isFamily || isSAAD || isAdmin;
  const shouldShowAdmin = isAdmin;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: "absolute",
          },
          default: {},
        }),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Accueil",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />

      {/* Écran Seniors - visible pour famille et SAAD */}
      <Tabs.Screen
        name="seniors"
        options={{
          title: "Seniors",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="person.2.fill" color={color} />
          ),
          // Masquer le tab si l'utilisateur n'a pas les permissions
          href: shouldShowSeniors || loading ? undefined : null,
          // Alternative : utiliser tabBarButton
          // tabBarButton: shouldShowSeniors ? HapticTab : () => null,
        }}
      />

      {/* Écran Dashboard - visible pour seniors */}
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="chart.bar.fill" color={color} />
          ),
          href: shouldShowDashboard || loading ? undefined : null,
        }}
      />

      {/* Écran Alertes - visible pour famille, SAAD et admin */}
      <Tabs.Screen
        name="alerts"
        options={{
          title: "Alertes",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="bell.fill" color={color} />
          ),
          href: shouldShowAlerts || loading ? undefined : null,
        }}
      />

      {/* Écran Admin - visible uniquement pour les administrateurs */}
      <Tabs.Screen
        name="admin"
        options={{
          title: "Admin",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="crown.fill" color={color} />
          ),
          href: shouldShowAdmin || loading ? undefined : null,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="person.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
