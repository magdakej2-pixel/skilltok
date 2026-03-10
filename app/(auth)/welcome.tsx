import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { Spacing, Typography, Radius } from '@/constants/theme';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#0B0B1A', '#12122A', '#1A1A3E']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        {/* Decorative gradient circles */}
        <View style={[styles.glowCircle, styles.glow1]} />
        <View style={[styles.glowCircle, styles.glow2]} />

        <View style={styles.content}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>QUELIO</Text>
            <Text style={styles.tagline}>Future, Synced.</Text>
          </View>

          {/* Tagline */}
          <Text style={styles.title}>{t('auth.welcome')}</Text>
          <Text style={styles.subtitle}>{t('auth.subtitle')}</Text>

          {/* Category pills */}
          <View style={styles.pillsContainer}>
            {['🤖 AI', '💻 Code', '📈 Marketing', '💼 Business', '🎨 Design'].map((cat) => (
              <View key={cat} style={styles.pill}>
                <Text style={styles.pillText}>{cat}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* CTA buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/(auth)/signup')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#4ECDC4', '#6C5CE7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryGradient}
            >
              <Text style={styles.primaryButtonText}>{t('auth.signup')}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/(auth)/login')}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>{t('auth.login')}</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1, paddingHorizontal: Spacing.xl },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  logoContainer: { alignItems: 'center', marginBottom: Spacing.xxxl },
  logoText: {
    fontSize: 52,
    fontFamily: 'PoppinsBold',
    color: '#FFFFFF',
    letterSpacing: 10,
    textTransform: 'uppercase',
  },
  tagline: {
    fontSize: Typography.sizes.md,
    fontFamily: 'PoppinsSemiBold',
    color: '#4ECDC4',
    letterSpacing: 2,
    marginTop: Spacing.xs,
  },
  title: {
    fontSize: Typography.sizes.xxxl, fontWeight: '700', color: '#FFF',
    textAlign: 'center', marginBottom: Spacing.md,
  },
  subtitle: {
    fontSize: Typography.sizes.lg, color: 'rgba(255,255,255,0.6)',
    textAlign: 'center', lineHeight: 24, paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xxxl,
  },
  pillsContainer: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: Spacing.sm,
  },
  pill: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
    backgroundColor: 'rgba(78,205,196,0.08)', borderRadius: Radius.full,
    borderWidth: 1, borderColor: 'rgba(78,205,196,0.2)',
  },
  pillText: { color: 'rgba(255,255,255,0.85)', fontSize: Typography.sizes.sm, fontWeight: '600' },
  buttonsContainer: {
    paddingBottom: Spacing.xxxxl, gap: Spacing.md,
  },
  primaryButton: {
    borderRadius: Radius.xl, overflow: 'hidden',
  },
  primaryGradient: {
    paddingVertical: Spacing.lg, alignItems: 'center',
    borderRadius: Radius.xl,
  },
  primaryButtonText: {
    fontSize: Typography.sizes.lg, fontFamily: 'PoppinsSemiBold', color: '#FFF',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255,255,255,0.08)', paddingVertical: Spacing.lg,
    borderRadius: Radius.xl, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  secondaryButtonText: {
    fontSize: Typography.sizes.lg, fontFamily: 'PoppinsSemiBold', color: '#FFF',
  },
  // Decorative glow circles
  glowCircle: {
    position: 'absolute', borderRadius: 9999,
  },
  glow1: {
    width: 300, height: 300, top: -80, right: -100,
    backgroundColor: 'rgba(78,205,196,0.06)',
  },
  glow2: {
    width: 250, height: 250, bottom: 150, left: -80,
    backgroundColor: 'rgba(108,92,231,0.06)',
  },
});
