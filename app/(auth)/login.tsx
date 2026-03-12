import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/services/firebase';
import { Colors, Spacing, Typography, Radius } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuthStore } from '@/store';
import { authAPI } from '@/services/api';

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [showPassword, setShowPassword] = useState(false);

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!email.trim()) newErrors.email = t('auth.emailRequired');
    if (!password) newErrors.password = t('auth.passwordRequired');
    if (password && password.length < 6) newErrors.password = t('auth.passwordMinLength');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const showAlert = (title: string, msg: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${msg}`);
    } else {
      Alert.alert(title, msg);
    }
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      // Block onAuthStateChanged from racing with our login flow
      useAuthStore.getState().setRegistering(true);
      console.log('Logging in with:', email.trim());
      await signInWithEmailAndPassword(auth, email.trim(), password);
      console.log('Firebase login success');
      // Try to fetch user from MongoDB
      try {
        const response = await authAPI.login();
        console.log('API login response:', response.data);
        useAuthStore.getState().setUser(response.data.user);
        // Clear registering flag — nav guard will redirect to feed
        useAuthStore.getState().setRegistering(false);
      } catch (err: any) {
        console.error('API login error:', err.response?.data || err.message);
        // User exists in Firebase but not in MongoDB — complete registration
        if (err.response?.data?.error?.code === 'NOT_REGISTERED') {
          // Keep isRegistering=true so nav guard doesn't interfere
          router.replace({ pathname: '/(auth)/role-select', params: { displayName: email.split('@')[0] } });
        } else {
          useAuthStore.getState().setRegistering(false);
          showAlert(t('common.error'), err.response?.data?.error?.message || t('auth.loginFailed'));
        }
      }
    } catch (error: any) {
      console.error('Firebase login error:', error.code, error.message);
      useAuthStore.getState().setRegistering(false);
      let msg = t('auth.loginFailed');
      if (error.code === 'auth/user-not-found') msg = 'Użytkownik nie istnieje';
      else if (error.code === 'auth/wrong-password') msg = 'Błędne hasło';
      else if (error.code === 'auth/invalid-email') msg = 'Nieprawidłowy email';
      else if (error.code === 'auth/invalid-credential') msg = 'Nieprawidłowe dane logowania';
      else if (error.code === 'auth/too-many-requests') msg = 'Za dużo prób — spróbuj później';
      showAlert(t('common.error'), msg);
    } finally {
      setLoading(false);
    }
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
          {/* Back button */}
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={[styles.backText, { color: colors.primary }]}>← {t('common.back')}</Text>
          </TouchableOpacity>

          <Text style={[styles.title, { color: '#F8F9FA' }]}>{t('auth.loginTitle')}</Text>
          <Text style={[styles.subtitle, { color: 'rgba(255,255,255,0.6)' }]}>
            {t('common.appName')}
          </Text>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: 'rgba(255,255,255,0.6)' }]}>{t('auth.email')}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: '#16161F', color: '#F8F9FA', borderColor: errors.email ? colors.error : 'rgba(255,255,255,0.08)' }]}
              placeholder={t('auth.email')}
              placeholderTextColor="rgba(255,255,255,0.35)"
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
            <Text style={[styles.label, { color: 'rgba(255,255,255,0.6)' }]}>{t('auth.password')}</Text>
            <View style={{ position: 'relative' as const }}>
              <TextInput
                style={[styles.input, { backgroundColor: '#16161F', color: '#F8F9FA', borderColor: errors.password ? colors.error : 'rgba(255,255,255,0.08)', paddingRight: 48 }]}
                placeholder={t('auth.password')}
                placeholderTextColor="rgba(255,255,255,0.35)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute' as const, right: 14, top: 0, bottom: 0, justifyContent: 'center' as const }}
              >
                <Ionicons name={showPassword ? 'eye' : 'eye-off'} size={22} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
          </View>

          {/* Login button */}
          <TouchableOpacity
            style={[styles.button, { opacity: loading ? 0.7 : 1 }]}
            onPress={handleLogin}
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
                <Text style={styles.buttonText}>{t('auth.login')}</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Switch to signup */}
          <View style={styles.switchContainer}>
            <Text style={[styles.switchText, { color: 'rgba(255,255,255,0.6)' }]}>
              {t('auth.noAccount')}{' '}
            </Text>
            <TouchableOpacity onPress={() => router.replace('/(auth)/signup')}>
              <Text style={[styles.switchLink, { color: '#FF2D78' }]}>{t('auth.signup')}</Text>
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
  subtitle: { fontSize: Typography.sizes.lg, marginBottom: Spacing.xxxl },
  inputGroup: { marginBottom: Spacing.xl },
  label: { fontSize: Typography.sizes.sm, fontWeight: '600', marginBottom: Spacing.xs },
  input: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.lg,
    borderRadius: Radius.lg, borderWidth: 1, fontSize: Typography.sizes.lg,
  },
  errorText: { color: '#FF6B6B', fontSize: Typography.sizes.sm, marginTop: Spacing.xs },
  button: {
    borderRadius: Radius.xl, overflow: 'hidden' as const, marginTop: Spacing.md,
  },
  buttonGradient: {
    paddingVertical: Spacing.lg, alignItems: 'center' as const, borderRadius: Radius.xl,
  },
  buttonText: { color: '#FFF', fontSize: Typography.sizes.lg, fontWeight: '700' },
  switchContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.xxl },
  switchText: { fontSize: Typography.sizes.md },
  switchLink: { fontSize: Typography.sizes.md, fontWeight: '700' },
  glowCircle: { position: 'absolute' as const, borderRadius: 9999 },
  glow1: { width: 600, height: 600, top: -200, right: -200, backgroundColor: 'rgba(255,45,120,0.1)' },
  glow2: { width: 500, height: 500, bottom: 0, left: -150, backgroundColor: 'rgba(255,108,181,0.08)' },
});
