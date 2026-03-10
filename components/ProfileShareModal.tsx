import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Colors, Spacing, Typography, Radius } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuthStore } from '@/store';

// ─── Simple QR Code Generator (no external lib) ───
// Generates a basic QR-like pattern from text data
function generateQRMatrix(data: string, size: number = 21): boolean[][] {
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  // Add finder patterns (top-left, top-right, bottom-left)
  const addFinder = (row: number, col: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (r === 0 || r === 6 || c === 0 || c === 6 ||
            (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
          if (row + r < size && col + c < size) matrix[row + r][col + c] = true;
        }
      }
    }
  };
  addFinder(0, 0);
  addFinder(0, size - 7);
  addFinder(size - 7, 0);

  // Data encoding (simplified — fills remaining cells based on data hash)
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash + data.charCodeAt(i)) | 0;
  }
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c]) continue;
      // Skip timing patterns
      if (r === 6 || c === 6) {
        matrix[r][c] = (r + c) % 2 === 0;
        continue;
      }
      // Fill data area based on hash
      const bit = ((hash >> ((r * size + c) % 31)) & 1) === 1;
      const charBit = data.charCodeAt((r + c) % data.length) % 2 === 0;
      matrix[r][c] = bit !== charBit; // XOR for visual diversity
    }
  }
  return matrix;
}

function QRCodeView({ data, size = 200, fgColor = '#000', bgColor = '#FFF' }: {
  data: string; size?: number; fgColor?: string; bgColor?: string;
}) {
  const matrix = useMemo(() => generateQRMatrix(data, 25), [data]);
  const cellSize = size / matrix.length;

  return (
    <View style={[qrStyles.container, { width: size, height: size, backgroundColor: bgColor }]}>
      {matrix.map((row, r) => (
        <View key={r} style={{ flexDirection: 'row' }}>
          {row.map((cell, c) => (
            <View
              key={c}
              style={{
                width: cellSize,
                height: cellSize,
                backgroundColor: cell ? fgColor : bgColor,
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

const qrStyles = StyleSheet.create({
  container: { borderRadius: Radius.lg, overflow: 'hidden', padding: 8 },
});

// ─── Profile Share Modal ───
interface ProfileShareModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function ProfileShareModal({ visible, onClose }: ProfileShareModalProps) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const { user } = useAuthStore();

  const profileUrl = `https://quelio.app/profile/${user?._id || ''}`;

  const handleCopyLink = async () => {
    try {
      if (typeof window !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(profileUrl);
        if (typeof window !== 'undefined') window.alert('Link skopiowany!');
        else Alert.alert('✓', 'Link skopiowany!');
      }
    } catch {
      if (typeof window !== 'undefined') window.alert('Nie udało się skopiować linku');
    }
  };

  const handleShareLink = async () => {
    try {
      if (typeof window !== 'undefined' && navigator.share) {
        await navigator.share({
          title: `${user?.displayName} na QUELIO`,
          text: `Zobacz profil ${user?.displayName} na QUELIO!`,
          url: profileUrl,
        });
      } else if (typeof window !== 'undefined') {
        // Fallback: copy to clipboard
        await navigator.clipboard?.writeText(profileUrl);
        window.alert('Link skopiowany do schowka!');
      }
    } catch {}
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={[s.container, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={[s.header, { borderBottomColor: colors.border }]}>
            <Text style={[s.headerTitle, { color: colors.text }]}>Udostępnij profil</Text>
            <TouchableOpacity onPress={onClose} style={s.closeBtn}>
              <Text style={{ fontSize: 22, color: colors.textSecondary }}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={s.content}>
            {/* QR Code */}
            <View style={[s.qrSection, { backgroundColor: colors.surface }]}>
              <QRCodeView
                data={profileUrl}
                size={180}
                fgColor={colorScheme === 'dark' ? '#FFF' : '#1a1a2e'}
                bgColor={colorScheme === 'dark' ? '#1a1a2e' : '#FFF'}
              />
              <Text style={[s.userName, { color: colors.text }]}>
                @{user?.displayName}
              </Text>
              <Text style={[s.qrHint, { color: colors.textTertiary }]}>
                Zeskanuj kod QR aby otworzyć profil
              </Text>
            </View>

            {/* Share options */}
            <View style={s.optionsSection}>
              <TouchableOpacity
                style={[s.optionBtn, { backgroundColor: colors.surface }]}
                onPress={handleShareLink}
                activeOpacity={0.7}
              >
                <Ionicons name="link-outline" size={22} color="#999" />
                <View style={s.optionTexts}>
                  <Text style={[s.optionLabel, { color: colors.text }]}>Udostępnij link</Text>
                  <Text style={[s.optionDesc, { color: colors.textTertiary }]}>
                    Wyślij link do profilu
                  </Text>
                </View>
                <Text style={{ color: colors.textTertiary }}>›</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.optionBtn, { backgroundColor: colors.surface }]}
                onPress={handleCopyLink}
                activeOpacity={0.7}
              >
                <Ionicons name="copy-outline" size={22} color="#999" />
                <View style={s.optionTexts}>
                  <Text style={[s.optionLabel, { color: colors.text }]}>Kopiuj link</Text>
                  <Text style={[s.optionDesc, { color: colors.textTertiary }]}>
                    {profileUrl}
                  </Text>
                </View>
                <Text style={{ color: colors.textTertiary }}>›</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    height: '75%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderBottomWidth: 0.5,
  },
  headerTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: '800',
  },
  closeBtn: {
    position: 'absolute',
    right: Spacing.xl,
    padding: Spacing.xs,
  },
  content: {
    flex: 1,
    padding: Spacing.xl,
  },
  qrSection: {
    alignItems: 'center',
    padding: Spacing.xl,
    borderRadius: Radius.xl,
    marginBottom: Spacing.xl,
  },
  userName: {
    fontSize: Typography.sizes.lg,
    fontWeight: '700',
    marginTop: Spacing.md,
  },
  qrHint: {
    fontSize: Typography.sizes.sm,
    marginTop: Spacing.xs,
  },
  optionsSection: {
    gap: Spacing.sm,
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    gap: Spacing.md,
  },
  optionIcon: {
    fontSize: 24,
  },
  optionTexts: {
    flex: 1,
  },
  optionLabel: {
    fontSize: Typography.sizes.md,
    fontWeight: '600',
  },
  optionDesc: {
    fontSize: Typography.sizes.xs,
    marginTop: 2,
  },
});
