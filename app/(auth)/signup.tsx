import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/services/firebase';
import { Colors, Spacing, Typography, Radius } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';

export default function SignupScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!displayName.trim()) e.displayName = t('auth.nameRequired');
    if (!email.trim()) e.email = t('auth.emailRequired');
    if (!password) e.password = t('auth.passwordRequired');
    if (password && password.length < 6) e.password = t('auth.passwordMinLength');
    if (password !== confirmPassword) e.confirmPassword = t('auth.passwordMismatch');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSignup = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
      // After Firebase account creation, navigate to role selection
      // Pass displayName via router params
      router.replace({ pathname: '/(auth)/role-select', params: { displayName: displayName.trim() } });
    } catch (error: any) {
      Alert.alert(t('common.error'), t('auth.signupFailed'));
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (
    label: string, value: string, onChangeText: (t: string) => void,
    errorKey: string, options: { secure?: boolean; keyboardType?: any; autoCapitalize?: any } = {}
  ) => (
    <View style={styles.inputGroup}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <TextInput
        style={[styles.input, {
          backgroundColor: colors.surface, color: colors.text,
          borderColor: errors[errorKey] ? colors.error : colors.border,
        }]}
        placeholder={label}
        placeholderTextColor={colors.textTertiary}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={options.secure}
        keyboardType={options.keyboardType}
        autoCapitalize={options.autoCapitalize ?? 'none'}
        autoCorrect={false}
      />
      {errors[errorKey] && <Text style={styles.errorText}>{errors[errorKey]}</Text>}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={[styles.backText, { color: colors.primary }]}>← {t('common.back')}</Text>
        </TouchableOpacity>

        <Text style={[styles.title, { color: colors.text }]}>{t('auth.signupTitle')}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {t('common.appName')}
        </Text>

        {renderInput(t('auth.displayName'), displayName, setDisplayName, 'displayName', { autoCapitalize: 'words' })}
        {renderInput(t('auth.email'), email, setEmail, 'email', { keyboardType: 'email-address' })}
        {renderInput(t('auth.password'), password, setPassword, 'password', { secure: true })}
        {renderInput(t('auth.confirmPassword'), confirmPassword, setConfirmPassword, 'confirmPassword', { secure: true })}

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
          onPress={handleSignup}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.buttonText}>{t('auth.signup')}</Text>
          )}
        </TouchableOpacity>

        <View style={styles.switchContainer}>
          <Text style={[styles.switchText, { color: colors.textSecondary }]}>
            {t('auth.hasAccount')}{' '}
          </Text>
          <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
            <Text style={[styles.switchLink, { color: colors.primary }]}>{t('auth.login')}</Text>
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
  subtitle: { fontSize: Typography.sizes.lg, marginBottom: Spacing.xxl },
  inputGroup: { marginBottom: Spacing.lg },
  label: { fontSize: Typography.sizes.sm, fontWeight: '600', marginBottom: Spacing.xs },
  input: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.lg,
    borderRadius: Radius.lg, borderWidth: 1, fontSize: Typography.sizes.lg,
  },
  errorText: { color: '#FF6B6B', fontSize: Typography.sizes.sm, marginTop: Spacing.xs },
  button: {
    paddingVertical: Spacing.lg, borderRadius: Radius.xl,
    alignItems: 'center', marginTop: Spacing.lg,
  },
  buttonText: { color: '#FFF', fontSize: Typography.sizes.lg, fontWeight: '700' },
  switchContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.xxl, paddingBottom: Spacing.xxxl },
  switchText: { fontSize: Typography.sizes.md },
  switchLink: { fontSize: Typography.sizes.md, fontWeight: '700' },
});
