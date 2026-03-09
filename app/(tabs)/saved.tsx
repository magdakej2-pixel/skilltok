import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { videosAPI } from '@/services/api';
import { Colors, Spacing, Typography, Radius } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';

export default function SavedScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSaved();
  }, []);

  const loadSaved = async () => {
    setLoading(true);
    try {
      const res = await videosAPI.getSaved();
      setVideos(res.data.videos);
    } catch {}
    setLoading(false);
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={[styles.videoCard, { backgroundColor: colors.surface }]} activeOpacity={0.7}>
      <View style={[styles.thumbnail, { backgroundColor: colors.surfaceElevated }]}>
        <Text style={styles.thumbIcon}>▶️</Text>
      </View>
      <View style={styles.videoInfo}>
        <Text style={[styles.videoTitle, { color: colors.text }]} numberOfLines={2}>{item.title}</Text>
        <Text style={[styles.videoMeta, { color: colors.textSecondary }]}>
          {item.teacherId?.displayName} · {item.viewsCount} {t('video.views')}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.text }]}>{t('profile.saved')}</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : videos.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>💾</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('profile.noSaved')}</Text>
        </View>
      ) : (
        <FlatList
          data={videos}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          onRefresh={loadSaved}
          refreshing={loading}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingHorizontal: Spacing.xl, paddingBottom: Spacing.md },
  title: { fontSize: Typography.sizes.xxl, fontWeight: '800' },
  list: { paddingHorizontal: Spacing.xl, gap: Spacing.sm },
  videoCard: {
    flexDirection: 'row', padding: Spacing.sm, borderRadius: Radius.lg,
    gap: Spacing.md,
  },
  thumbnail: {
    width: 100, height: 70, borderRadius: Radius.md,
    justifyContent: 'center', alignItems: 'center',
  },
  thumbIcon: { fontSize: 24 },
  videoInfo: { flex: 1, justifyContent: 'center' },
  videoTitle: { fontSize: Typography.sizes.md, fontWeight: '600', marginBottom: 4 },
  videoMeta: { fontSize: Typography.sizes.sm },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyIcon: { fontSize: 60, marginBottom: Spacing.md },
  emptyText: { fontSize: Typography.sizes.lg },
});
