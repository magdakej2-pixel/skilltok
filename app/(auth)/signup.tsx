import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/services/firebase';
import { Colors, Spacing, Typography, Radius } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuthStore } from '@/store';

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
      // Set registering flag BEFORE creating Firebase user
      // to prevent onAuthStateChanged from interfering
      useAuthStore.getState().setRegistering(true);
      await createUserWithEmailAndPassword(auth, email.trim(), password);
      // After Firebase account creation, navigate to role selection
      router.replace({ pathname: '/(auth)/role-select', params: { displayName: displayName.trim() } });
    } catch (error: any) {
      useAuthStore.getState().setRegistering(false);
      Alert.alert(t('common.error'), t('auth.signupFailed'));
    } finally {
      setLoading(false);
    }
  };

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const renderInput = (
    label: string, value: string, onChangeText: (t: string) => void,
    errorKey: string, options: { secure?: boolean; keyboardType?: any; autoCapitalize?: any } = {}
  ) => {
    const isPassword = errorKey === 'password';
    const isConfirm = errorKey === 'confirmPassword';
    const showPw = isPassword ? showPassword : isConfirm ? showConfirm : false;
    const togglePw = isPassword ? () => setShowPassword(!showPassword) : () => setShowConfirm(!showConfirm);

    return (
      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: 'rgba(255,255,255,0.6)' }]}>{label}</Text>
        <View style={{ position: 'relative' as const }}>
          <TextInput
            style={[styles.input, {
              backgroundColor: '#16161F', color: '#F8F9FA',
              borderColor: errors[errorKey] ? '#FF6B6B' : 'rgba(255,255,255,0.08)',
              ...(options.secure ? { paddingRight: 48 } : {}),
            }]}
            placeholder={label}
            placeholderTextColor="rgba(255,255,255,0.35)"
            value={value}
            onChangeText={onChangeText}
            secureTextEntry={options.secure ? !showPw : false}
            keyboardType={options.keyboardType}
            autoCapitalize={options.autoCapitalize ?? 'none'}
            autoCorrect={false}
          />
          {options.secure && (
            <TouchableOpacity
              onPress={togglePw}
              style={{ position: 'absolute' as const, right: 14, top: 0, bottom: 0, justifyContent: 'center' as const }}
            >
              <Ionicons name={showPw ? 'eye' : 'eye-off'} size={22} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          )}
        </View>
        {errors[errorKey] && <Text style={styles.errorText}>{errors[errorKey]}</Text>}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient
        colors={['#0A0A12', '#111118', '#1A1A24']}
        style={styles.gradientBg}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        {/* Decorative glow circles */}
        <View style={[styles.glowCircle, styles.glow1]} />
        <View style={[styles.glowCircle, styles.glow2]} />

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={[styles.backText, { color: '#FF2D78' }]}>← {t('common.back')}</Text>
          </TouchableOpacity>

          <Text style={[styles.title, { color: '#F8F9FA' }]}>{t('auth.signupTitle')}</Text>
          <Text style={[styles.subtitle, { color: 'rgba(255,255,255,0.6)' }]}>
            {t('common.appName')}
          </Text>

          {renderInput(t('auth.displayName'), displayName, setDisplayName, 'displayName', { autoCapitalize: 'words' })}
          {renderInput(t('auth.email'), email, setEmail, 'email', { keyboardType: 'email-address' })}
          {renderInput(t('auth.password'), password, setPassword, 'password', { secure: true })}
          {renderInput(t('auth.confirmPassword'), confirmPassword, setConfirmPassword, 'confirmPassword', { secure: true })}

          <TouchableOpacity
            style={[styles.button, { opacity: loading ? 0.7 : 1 }]}
            onPress={handleSignup}
            disabled={loading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#FF2D78', '#FF6CB5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.buttonText}>{t('auth.signup')}</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.switchContainer}>
            <Text style={[styles.switchText, { color: 'rgba(255,255,255,0.6)' }]}>
              {t('auth.hasAccount')}{' '}
            </Text>
            <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
              <Text style={[styles.switchLink, { color: '#FF2D78' }]}>{t('auth.login')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradientBg: { flex: 1 },
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
    borderRadius: Radius.xl, overflow: 'hidden' as const, marginTop: Spacing.lg,
  },
  buttonGradient: {
    paddingVertical: Spacing.lg, alignItems: 'center' as const, borderRadius: Radius.xl,
  },
  buttonText: { color: '#FFF', fontSize: Typography.sizes.lg, fontWeight: '700' },
  switchContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.xxl, paddingBottom: Spacing.xxxl },
  switchText: { fontSize: Typography.sizes.md },
  switchLink: { fontSize: Typography.sizes.md, fontWeight: '700' },
  glowCircle: { position: 'absolute' as const, borderRadius: 9999 },
  glow1: { width: 600, height: 600, top: -200, right: -200, backgroundColor: 'rgba(255,45,120,0.1)' },
  glow2: { width: 500, height: 500, bottom: 0, left: -150, backgroundColor: 'rgba(255,108,181,0.08)' },
});
