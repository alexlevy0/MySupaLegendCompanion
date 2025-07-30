import React from 'react';
import { SafeAreaView, StyleSheet, ViewStyle } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';

interface SafeAreaLayoutProps {
  children: React.ReactNode;
  style?: ViewStyle;
  edges?: Array<'top' | 'right' | 'bottom' | 'left'>;
  backgroundColor?: string;
}

export function SafeAreaLayout({
  children,
  style,
  edges = ['top', 'bottom'],
  backgroundColor,
}: SafeAreaLayoutProps) {
  const defaultBackgroundColor = useThemeColor({}, 'background');
  const bgColor = backgroundColor || defaultBackgroundColor;

  return (
    <SafeAreaView 
      style={[
        styles.container,
        { backgroundColor: bgColor },
        style,
      ]}
      edges={edges}
    >
      <ThemedView style={styles.content}>
        {children}
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});