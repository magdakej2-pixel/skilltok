import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { auth } from '@/services/firebase';
import { authAPI } from '@/services/api';
import { useAuthStore } from '@/store';
import { Colors, Spacing, Typography, Radius, CategoryConfig } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';

const CATEGORIES = Object.keys(CategoryConfig);

export default function RoleSelectScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { displayName } = useLocalSearchParams<{ displayName: string }>();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const { setUser } = useAuthStore();

  const [selectedRole, setSelectedRole] = useState<'student' | 'teacher' | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const roles = [
    {
      key: 'student' as const,
      title: t('role.student'),
      desc: t('role.studentDesc'),
    },
    {
      key: 'teacher' as const,
      title: t('role.teacher'),
      desc: t('role.teacherDesc'),
    },
  ];

  const showError = (msg: string) => {
    if (typeof window !== 'undefined') window.alert(msg);
    else Alert.alert(t('common.error'), msg);
  };

  const canContinue = selectedRole === 'student' || (selectedRole === 'teacher' && selectedCategory);

  const handleContinue = async () => {
    if (!canContinue) return;
    setLoading(true);
    try {
      let user = auth.currentUser;
      if (!user) {
        for (let i = 0; i < 10; i++) {
          await new Promise(r => setTimeout(r, 500));
          user = auth.currentUser;
          if (user) break;
        }
      }
      if (!user) {
        showError('Firebase session expired. Please sign up again.');
        setLoading(false);
        return;
      }

      const response = await authAPI.register({
        displayName: displayName || 'User',
        role: selectedRole!,
        language: 'en',
        expertiseCategory: selectedRole === 'teacher' ? selectedCategory || undefined : undefined,
      });
      setUser(response.data.user);
      router.replace('/(auth)/language-select');
    } catch (error: any) {
      console.error('Register error:', error?.response?.status, error?.response?.data, error?.message);
      if (error.response?.status === 409) {
        try {
          const loginRes = await authAPI.login();
          setUser(loginRes.data.user);
          router.replace('/(auth)/language-select');
          return;
        } catch (e) {
          console.error('Login fallback error:', e);
        }
      }
      showError(error.response?.data?.error?.message || error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
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
              onPress={() => { setSelectedRole(role.key); if (role.key === 'student') setSelectedCategory(null); }}
              activeOpacity={0.7}
            >
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

        {/* Category selection for specialist */}
        {selectedRole === 'teacher' && (
          <View style={styles.categorySection}>
            <Text style={[styles.categoryTitle, { color: colors.text }]}>
              {t('role.selectCategory')}
            </Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((cat) => {
                const config = CategoryConfig[cat];
                const isSelected = selectedCategory === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: isSelected ? config.color + '20' : colors.surface,
                        borderColor: isSelected ? config.color : colors.border,
                        borderWidth: isSelected ? 2 : 1,
                      },
                    ]}
                    onPress={() => setSelectedCategory(cat)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.categoryIcon}>{config.icon}</Text>
                    <Text style={[styles.categoryLabel, { color: isSelected ? config.color : colors.text }]}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1).replace('-', ' ')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor: canContinue ? colors.primary : colors.border,
              opacity: loading ? 0.7 : 1,
            },
          ]}
          onPress={handleContinue}
          disabled={!canContinue || loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={[styles.buttonText, { color: canContinue ? '#FFF' : colors.textTertiary }]}>
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
  scrollContent: { paddingHorizontal: Spacing.xl, paddingTop: 80, paddingBottom: 120 },
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
  // Category selection
  categorySection: { marginTop: Spacing.xxl },
  categoryTitle: { fontSize: Typography.sizes.lg, fontWeight: '700', marginBottom: Spacing.lg, textAlign: 'center' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, justifyContent: 'center' },
  categoryChip: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderRadius: Radius.xl,
  },
  categoryIcon: { fontSize: 18 },
  categoryLabel: { fontSize: Typography.sizes.sm, fontWeight: '600' },
  // Footer
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxxxl },
  button: {
    paddingVertical: Spacing.lg, borderRadius: Radius.xl, alignItems: 'center',
  },
  buttonText: { fontSize: Typography.sizes.lg, fontWeight: '700' },
});
