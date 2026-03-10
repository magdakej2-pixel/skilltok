import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Spacing, Typography } from '@/constants/theme';
import { useRoleColors } from '@/hooks/useRoleColors';

export default function ExploreScreen() {
  const colors = useRoleColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.comingSoon, { color: colors.textSecondary }]}>
          Wkrótce
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
  },
  comingSoon: {
    fontSize: Typography.sizes.xxl, fontWeight: '700',
  },
});
