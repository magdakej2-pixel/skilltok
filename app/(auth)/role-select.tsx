import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { authAPI } from '@/services/api';
import { useAuthStore } from '@/store';
import { Colors, Spacing, Typography, Radius } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';

export default function RoleSelectScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { displayName } = useLocalSearchParams<{ displayName: string }>();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const { setUser } = useAuthStore();

  const [selectedRole, setSelectedRole] = useState<'student' | 'teacher' | null>(null);
  const [loading, setLoading] = useState(false);

  const roles = [
    {
      key: 'student' as const,
      emoji: '📚',
      title: t('role.student'),
      desc: t('role.studentDesc'),
      gradient: ['#00CEC9', '#00B894'],
    },
    {
      key: 'teacher' as const,
      emoji: '🎓',
      title: t('role.teacher'),
      desc: t('role.teacherDesc'),
      gradient: ['#6C5CE7', '#A29BFE'],
    },
  ];

  const handleContinue = async () => {
    if (!selectedRole) return;
    setLoading(true);
    try {
      const response = await authAPI.register({
        displayName: displayName || 'User',
        role: selectedRole,
        language: 'en',
      });
      setUser(response.data.user);
      // Navigate to language selection
      router.replace('/(auth)/language-select');
    } catch (error: any) {
      Alert.alert(t('common.error'), error.response?.data?.error?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>{t('role.title')}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('role.subtitle')}</Text>

        <View style={styles.cardsContainer}>
          {roles.map((role) => (
            <TouchableOpacity
              key={role.key}
              style={[
                styles.card,
                {
                  backgroundColor: colors.surface,
                  borderColor: selectedRole === role.key ? colors.primary : colors.border,
                  borderWidth: selectedRole === role.key ? 2 : 1,
                },
              ]}
              onPress={() => setSelectedRole(role.key)}
              activeOpacity={0.7}
            >
              <View style={[styles.emojiContainer, { backgroundColor: selectedRole === role.key ? colors.primary + '20' : colors.surfaceElevated }]}>
                <Text style={styles.emoji}>{role.emoji}</Text>
              </View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{role.title}</Text>
              <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>{role.desc}</Text>
              {selectedRole === role.key && (
                <View style={[styles.checkmark, { backgroundColor: colors.primary }]}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor: selectedRole ? colors.primary : colors.border,
              opacity: loading ? 0.7 : 1,
            },
          ]}
          onPress={handleContinue}
          disabled={!selectedRole || loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={[styles.buttonText, { color: selectedRole ? '#FFF' : colors.textTertiary }]}>
              {t('role.continue')}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: Spacing.xl, paddingTop: 80 },
  title: { fontSize: Typography.sizes.xxl, fontWeight: '800', textAlign: 'center', marginBottom: Spacing.sm },
  subtitle: { fontSize: Typography.sizes.md, textAlign: 'center', marginBottom: Spacing.xxxl },
  cardsContainer: { flexDirection: 'row', gap: Spacing.lg },
  card: {
    flex: 1, padding: Spacing.xl, borderRadius: Radius.xl,
    alignItems: 'center', position: 'relative',
  },
  emojiContainer: {
    width: 64, height: 64, borderRadius: Radius.full,
    justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md,
  },
  emoji: { fontSize: 30 },
  cardTitle: { fontSize: Typography.sizes.xl, fontWeight: '700', marginBottom: Spacing.xs },
  cardDesc: { fontSize: Typography.sizes.sm, textAlign: 'center', lineHeight: 18 },
  checkmark: {
    position: 'absolute', top: 12, right: 12,
    width: 24, height: 24, borderRadius: Radius.full,
    justifyContent: 'center', alignItems: 'center',
  },
  checkmarkText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  footer: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxxxl },
  button: {
    paddingVertical: Spacing.lg, borderRadius: Radius.xl, alignItems: 'center',
  },
  buttonText: { fontSize: Typography.sizes.lg, fontWeight: '700' },
});
