import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '@/i18n';
import { authAPI } from '@/services/api';
import { useAuthStore } from '@/store';
import { Colors, Spacing, Typography, Radius, Languages } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';

export default function LanguageSelectScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const { user, setUser } = useAuthStore();

  const [selected, setSelected] = useState(i18n.language || 'en');

  const handleSelect = async (langCode: string) => {
    setSelected(langCode);
    await changeLanguage(langCode);

    // Update user's language preference on the server
    if (user) {
      try {
        const response = await authAPI.updateProfile({ language: langCode });
        setUser(response.data.user);
      } catch {
        // Non-critical, language already changed locally
      }
    }
  };

  const handleContinue = () => {
    router.replace('/(tabs)/feed');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>{t('language.title')}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('language.subtitle')}</Text>

        <View style={styles.languageList}>
          {Languages.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.languageItem,
                {
                  backgroundColor: colors.surface,
                  borderColor: selected === lang.code ? colors.primary : colors.border,
                  borderWidth: selected === lang.code ? 2 : 1,
                },
              ]}
              onPress={() => handleSelect(lang.code)}
              activeOpacity={0.7}
            >
              <Text style={styles.flag}>{lang.flag}</Text>
              <Text style={[styles.langName, { color: colors.text }]}>{lang.name}</Text>
              {selected === lang.code && (
                <View style={[styles.radio, { backgroundColor: colors.primary }]}>
                  <View style={styles.radioInner} />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>{t('common.done')}</Text>
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
  languageList: { gap: Spacing.md },
  languageItem: {
    flexDirection: 'row', alignItems: 'center', padding: Spacing.lg,
    borderRadius: Radius.lg, gap: Spacing.lg,
  },
  flag: { fontSize: 32 },
  langName: { flex: 1, fontSize: Typography.sizes.xl, fontWeight: '600' },
  radio: {
    width: 24, height: 24, borderRadius: Radius.full,
    justifyContent: 'center', alignItems: 'center',
  },
  radioInner: { width: 8, height: 8, borderRadius: Radius.full, backgroundColor: '#FFF' },
  footer: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxxxl },
  button: {
    paddingVertical: Spacing.lg, borderRadius: Radius.xl, alignItems: 'center',
  },
  buttonText: { color: '#FFF', fontSize: Typography.sizes.lg, fontWeight: '700' },
});
