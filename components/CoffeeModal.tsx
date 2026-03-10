import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  ActivityIndicator, Platform, Linking, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Colors, Spacing, Typography, Radius } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';
import { donationsAPI } from '@/services/api';

const COFFEE_OPTIONS = [
  { count: 1, price: '£3', emoji: '☕' },
  { count: 3, price: '£9', emoji: '☕☕☕' },
  { count: 5, price: '£15', emoji: '☕☕☕☕☕' },
];

interface CoffeeModalProps {
  visible: boolean;
  teacherId: string;
  teacherName: string;
  onClose: () => void;
}

export default function CoffeeModal({ visible, teacherId, teacherName, onClose }: CoffeeModalProps) {
  const { t, i18n } = useTranslation();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  const coffeeName = (count: number) => {
    if (i18n.language === 'pl') {
      if (count === 1) return 'kawa';
      if (count >= 2 && count <= 4) return 'kawy';
      return 'kaw';
    }
    if (i18n.language === 'zh') return '咖啡';
    return count === 1 ? 'coffee' : 'coffees';
  };

  const [selectedOption, setSelectedOption] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [cupScale] = useState(new Animated.Value(0));

  const showSuccessAnimation = () => {
    setSuccess(true);
    Animated.sequence([
      Animated.spring(cupScale, { toValue: 1.3, useNativeDriver: true, friction: 3 }),
      Animated.spring(cupScale, { toValue: 1, useNativeDriver: true, friction: 5 }),
    ]).start();
  };

  const handlePay = async () => {
    setLoading(true);
    setError('');
    try {
      const option = COFFEE_OPTIONS[selectedOption];
      const res = await donationsAPI.createCheckoutSession(teacherId, option.count);

      if (res.data.devMode) {
        // Dev mode — no Stripe, instant success
        showSuccessAnimation();
      } else if (res.data.url) {
        // Stripe Checkout — redirect
        if (Platform.OS === 'web') {
          window.open(res.data.url, '_blank');
        } else {
          Linking.openURL(res.data.url);
        }
        showSuccessAnimation();
      }
    } catch (e: any) {
      console.error('Payment error:', e);
      setError(e.response?.data?.error?.message || 'Payment failed');
    }
    setLoading(false);
  };

  const handleClose = () => {
    setSuccess(false);
    setSelectedOption(0);
    setError('');
    cupScale.setValue(0);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              {t('coffee.title', 'Buy a Coffee ☕')}
            </Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {success ? (
            /* Success Screen */
            <View style={styles.successContainer}>
              <Animated.Text style={[styles.successEmoji, { transform: [{ scale: cupScale }] }]}>
                ☕
              </Animated.Text>
              <Text style={[styles.successTitle, { color: colors.text }]}>
                {t('coffee.thanks', 'Thank you for your support!')}
              </Text>
              <Text style={[styles.successSubtitle, { color: colors.textSecondary }]}>
                {t('coffee.thanksMessage', 'Your coffee helps creators keep making great content.')}
              </Text>
              <TouchableOpacity
                style={[styles.doneButton, { backgroundColor: colors.primary }]}
                onPress={handleClose}
              >
                <Text style={styles.doneButtonText}>{t('common.done', 'Done')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Payment Screen */
            <View style={styles.content}>
              <Text style={[styles.message, { color: colors.textSecondary }]}>
                {t('coffee.message', 'If you enjoy the content, you can support {{name}} by buying a virtual coffee.').replace('{{name}}', teacherName)}
              </Text>

              {/* Coffee Options */}
              <View style={styles.options}>
                {COFFEE_OPTIONS.map((option, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.optionCard,
                      { backgroundColor: colors.surface, borderColor: selectedOption === idx ? colors.primary : colors.border },
                      selectedOption === idx && { borderWidth: 2 },
                    ]}
                    onPress={() => setSelectedOption(idx)}
                  >
                    <Text style={styles.optionEmoji}>{option.emoji}</Text>
                    <Text style={[styles.optionCount, { color: colors.text }]}>
                      {option.count} {coffeeName(option.count)}
                    </Text>
                    <Text style={[styles.optionPrice, { color: colors.primary }]}>{option.price}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {error ? (
                <Text style={styles.errorText}>{error}</Text>
              ) : null}

              {/* Pay Button */}
              <TouchableOpacity
                style={[styles.payButton, { backgroundColor: '#FF9500', opacity: loading ? 0.7 : 1 }]}
                onPress={handlePay}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.payButtonText}>
                    ☕ {t('coffee.buyButton', 'Buy')} {COFFEE_OPTIONS[selectedOption].count} {coffeeName(COFFEE_OPTIONS[selectedOption].count)} — {COFFEE_OPTIONS[selectedOption].price}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Powered by Stripe */}
              <Text style={[styles.stripeText, { color: colors.textTertiary }]}>
                {t('coffee.secure', 'Secure payment via Stripe')} 🔒
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  title: {
    fontSize: Typography.sizes.xl,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  message: {
    fontSize: Typography.sizes.md,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  options: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  optionCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  optionEmoji: {
    fontSize: 24,
    marginBottom: Spacing.sm,
  },
  optionCount: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionPrice: {
    fontSize: Typography.sizes.lg,
    fontWeight: '800',
  },
  payButton: {
    paddingVertical: Spacing.lg,
    borderRadius: Radius.xl,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  payButtonText: {
    color: '#FFF',
    fontSize: Typography.sizes.lg,
    fontWeight: '700',
  },
  stripeText: {
    fontSize: Typography.sizes.xs,
    textAlign: 'center',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: Typography.sizes.sm,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: Spacing.xl,
  },
  successEmoji: {
    fontSize: 80,
    marginBottom: Spacing.xl,
  },
  successTitle: {
    fontSize: Typography.sizes.xxl,
    fontWeight: '800',
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: Typography.sizes.md,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xxl,
  },
  doneButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxxl,
    borderRadius: Radius.xl,
  },
  doneButtonText: {
    color: '#FFF',
    fontSize: Typography.sizes.lg,
    fontWeight: '700',
  },
});
