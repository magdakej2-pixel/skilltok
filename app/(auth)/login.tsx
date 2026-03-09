import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/services/firebase';
import { Colors, Spacing, Typography, Radius } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!email.trim()) newErrors.email = t('auth.emailRequired');
    if (!password) newErrors.password = t('auth.passwordRequired');
    if (password && password.length < 6) newErrors.password = t('auth.passwordMinLength');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      // Auth state listener in _layout.tsx will handle navigation
    } catch (error: any) {
      Alert.alert(t('common.error'), t('auth.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Back button */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={[styles.backText, { color: colors.primary }]}>← {t('common.back')}</Text>
        </TouchableOpacity>

        <Text style={[styles.title, { color: colors.text }]}>{t('auth.loginTitle')}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {t('common.appName')}
        </Text>

        {/* Email */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>{t('auth.email')}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: errors.email ? colors.error : colors.border }]}
            placeholder={t('auth.email')}
            placeholderTextColor={colors.textTertiary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
        </View>

        {/* Password */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>{t('auth.password')}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: errors.password ? colors.error : colors.border }]}
            placeholder={t('auth.password')}
            placeholderTextColor={colors.textTertiary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
        </View>

        {/* Login button */}
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.buttonText}>{t('auth.login')}</Text>
          )}
        </TouchableOpacity>

        {/* Switch to signup */}
        <View style={styles.switchContainer}>
          <Text style={[styles.switchText, { color: colors.textSecondary }]}>
            {t('auth.noAccount')}{' '}
          </Text>
          <TouchableOpacity onPress={() => router.replace('/(auth)/signup')}>
            <Text style={[styles.switchLink, { color: colors.primary }]}>{t('auth.signup')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: Spacing.xl, paddingTop: 60 },
  backButton: { marginBottom: Spacing.xl },
  backText: { fontSize: Typography.sizes.lg, fontWeight: '600' },
  title: { fontSize: Typography.sizes.xxxl, fontWeight: '800', marginBottom: Spacing.xs },
  subtitle: { fontSize: Typography.sizes.lg, marginBottom: Spacing.xxxl },
  inputGroup: { marginBottom: Spacing.xl },
  label: { fontSize: Typography.sizes.sm, fontWeight: '600', marginBottom: Spacing.xs },
  input: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.lg,
    borderRadius: Radius.lg, borderWidth: 1, fontSize: Typography.sizes.lg,
  },
  errorText: { color: '#FF6B6B', fontSize: Typography.sizes.sm, marginTop: Spacing.xs },
  button: {
    paddingVertical: Spacing.lg, borderRadius: Radius.xl,
    alignItems: 'center', marginTop: Spacing.md,
  },
  buttonText: { color: '#FFF', fontSize: Typography.sizes.lg, fontWeight: '700' },
  switchContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.xxl },
  switchText: { fontSize: Typography.sizes.md },
  switchLink: { fontSize: Typography.sizes.md, fontWeight: '700' },
});
