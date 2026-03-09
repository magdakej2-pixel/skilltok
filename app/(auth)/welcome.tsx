import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Typography, Radius } from '@/constants/theme';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#0F0F1A', '#1A1A3E', '#2D1B69', '#6C5CE7']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Decorative circles */}
        <View style={[styles.circle, styles.circle1]} />
        <View style={[styles.circle, styles.circle2]} />
        <View style={[styles.circle, styles.circle3]} />

        <View style={styles.content}>
          {/* Logo area */}
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <Text style={styles.logoEmoji}>🎓</Text>
            </View>
            <Text style={styles.logoText}>Skill<Text style={styles.logoAccent}>Tok</Text></Text>
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
            <Text style={styles.primaryButtonText}>{t('auth.signup')}</Text>
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
  logoIcon: {
    width: 80, height: 80, borderRadius: Radius.xl,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md,
  },
  logoEmoji: { fontSize: 40 },
  logoText: { fontSize: Typography.sizes.display, fontWeight: '800', color: '#FFF' },
  logoAccent: { color: '#A29BFE' },
  title: {
    fontSize: Typography.sizes.xxxl, fontWeight: '700', color: '#FFF',
    textAlign: 'center', marginBottom: Spacing.md,
  },
  subtitle: {
    fontSize: Typography.sizes.lg, color: 'rgba(255,255,255,0.7)',
    textAlign: 'center', lineHeight: 24, paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xxxl,
  },
  pillsContainer: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: Spacing.sm,
  },
  pill: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: Radius.full,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  pillText: { color: '#FFF', fontSize: Typography.sizes.sm, fontWeight: '600' },
  buttonsContainer: {
    paddingBottom: Spacing.xxxxl, gap: Spacing.md,
  },
  primaryButton: {
    backgroundColor: '#FFF', paddingVertical: Spacing.lg,
    borderRadius: Radius.xl, alignItems: 'center',
  },
  primaryButtonText: { fontSize: Typography.sizes.lg, fontWeight: '700', color: '#1A1A2E' },
  secondaryButton: {
    backgroundColor: 'rgba(255,255,255,0.15)', paddingVertical: Spacing.lg,
    borderRadius: Radius.xl, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  secondaryButtonText: { fontSize: Typography.sizes.lg, fontWeight: '600', color: '#FFF' },
  // Decorative circles
  circle: { position: 'absolute', borderRadius: 9999, opacity: 0.08, backgroundColor: '#A29BFE' },
  circle1: { width: 300, height: 300, top: -50, right: -80 },
  circle2: { width: 200, height: 200, bottom: 200, left: -60 },
  circle3: { width: 150, height: 150, top: height * 0.3, right: -30 },
});
