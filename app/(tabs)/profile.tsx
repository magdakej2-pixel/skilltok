import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { signOut } from 'firebase/auth';
import { auth } from '@/services/firebase';
import { useAuthStore } from '@/store';
import { videosAPI, usersAPI } from '@/services/api';
import { Colors, Spacing, Typography, Radius, CategoryConfig } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';
import { changeLanguage } from '@/i18n';

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const { user, logout: logoutStore } = useAuthStore();

  const [videos, setVideos] = useState<any[]>([]);
  const isTeacher = user?.role === 'teacher';

  useEffect(() => {
    if (user && isTeacher) {
      loadMyVideos();
    }
  }, [user]);

  const loadMyVideos = async () => {
    try {
      const res = await videosAPI.getTeacherVideos(user!._id);
      setVideos(res.data.videos);
    } catch {}
  };

  // Calculate analytics from videos
  const analytics = useMemo(() => {
    if (!videos.length) return { views: 0, likes: 0, comments: 0, saves: 0 };
    return videos.reduce(
      (acc, v) => ({
        views: acc.views + (v.viewsCount || 0),
        likes: acc.likes + (v.likesCount || 0),
        comments: acc.comments + (v.commentsCount || 0),
        saves: acc.saves + (v.savesCount || 0),
      }),
      { views: 0, likes: 0, comments: 0, saves: 0 }
    );
  }, [videos]);

  const formatCount = (n: number) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
  };

  const handleLogout = () => {
    Alert.alert(t('auth.logout'), t('auth.logoutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('auth.logout'),
        style: 'destructive',
        onPress: async () => {
          await signOut(auth);
          logoutStore();
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.profileHeader}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>{user?.displayName?.charAt(0) || '?'}</Text>
          </View>
          <Text style={[styles.name, { color: colors.text }]}>{user?.displayName}</Text>
          <Text style={[styles.email, { color: colors.textSecondary }]}>{user?.email}</Text>

          {/* Role badge */}
          <View style={[styles.roleBadge, { backgroundColor: isTeacher ? '#6C5CE7' : '#00CEC9' }]}>
            <Text style={styles.roleText}>
              {isTeacher ? `🎓 ${t('role.teacher')}` : `📚 ${t('role.student')}`}
            </Text>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={[styles.statNumber, { color: colors.text }]}>{user?.followersCount || 0}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('profile.followers')}</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.stat}>
              <Text style={[styles.statNumber, { color: colors.text }]}>{user?.followingCount || 0}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('profile.following')}</Text>
            </View>
            {isTeacher && (
              <>
                <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                <View style={styles.stat}>
                  <Text style={[styles.statNumber, { color: colors.text }]}>{user?.videosCount || 0}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('profile.videos')}</Text>
                </View>
              </>
            )}
          </View>

          {/* Bio */}
          {user?.bio ? (
            <Text style={[styles.bio, { color: colors.textSecondary }]}>{user.bio}</Text>
          ) : null}
        </View>

        {/* Teacher Analytics Dashboard */}
        {isTeacher && videos.length > 0 && (
          <View style={styles.analyticsSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>📊 {t('analytics.title')}</Text>
            <View style={styles.analyticsGrid}>
              <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
                <Text style={styles.analyticsIcon}>👁️</Text>
                <Text style={[styles.analyticsNumber, { color: colors.text }]}>{formatCount(analytics.views)}</Text>
                <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>{t('analytics.totalViews')}</Text>
              </View>
              <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
                <Text style={styles.analyticsIcon}>❤️</Text>
                <Text style={[styles.analyticsNumber, { color: colors.text }]}>{formatCount(analytics.likes)}</Text>
                <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>{t('analytics.totalLikes')}</Text>
              </View>
              <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
                <Text style={styles.analyticsIcon}>💬</Text>
                <Text style={[styles.analyticsNumber, { color: colors.text }]}>{formatCount(analytics.comments)}</Text>
                <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>{t('analytics.totalComments')}</Text>
              </View>
              <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
                <Text style={styles.analyticsIcon}>🔖</Text>
                <Text style={[styles.analyticsNumber, { color: colors.text }]}>{formatCount(analytics.saves)}</Text>
                <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>{t('analytics.totalSaves')}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Teacher videos */}
        {isTeacher && videos.length > 0 && (
          <View style={styles.videosSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('profile.videos')}</Text>
            <View style={styles.videoGrid}>
              {videos.map((video: any) => (
                <TouchableOpacity key={video._id} style={[styles.videoCard, { backgroundColor: colors.surface }]}>
                  <View style={[styles.videoThumb, { backgroundColor: colors.surfaceElevated }]}>
                    <Text style={styles.thumbIcon}>▶️</Text>
                  </View>
                  <Text style={[styles.videoTitle, { color: colors.text }]} numberOfLines={1}>{video.title}</Text>
                  <Text style={[styles.videoStats, { color: colors.textSecondary }]}>
                    ❤️ {video.likesCount}  👁️ {video.viewsCount}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Settings section */}
        <View style={styles.settingsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('profile.settings')}</Text>

          {/* Language */}
          <View style={[styles.settingItem, { backgroundColor: colors.surface }]}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>🌐 {t('settings.language')}</Text>
            <View style={styles.langButtons}>
              {['en', 'pl', 'zh'].map((lang) => (
                <TouchableOpacity
                  key={lang}
                  style={[styles.langBtn, i18n.language === lang && { backgroundColor: colors.primary }]}
                  onPress={() => changeLanguage(lang)}
                >
                  <Text style={[styles.langBtnText, { color: i18n.language === lang ? '#FFF' : colors.text }]}>
                    {lang.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Logout */}
          <TouchableOpacity
            style={[styles.logoutButton, { backgroundColor: colors.error + '15' }]}
            onPress={handleLogout}
          >
            <Text style={[styles.logoutText, { color: colors.error }]}>🚪 {t('auth.logout')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  profileHeader: { alignItems: 'center', paddingTop: Platform.OS === 'ios' ? 70 : 50, paddingHorizontal: Spacing.xl },
  avatar: {
    width: 80, height: 80, borderRadius: Radius.full,
    justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md,
  },
  avatarText: { color: '#FFF', fontSize: 32, fontWeight: '800' },
  name: { fontSize: Typography.sizes.xxl, fontWeight: '800', marginBottom: 2 },
  email: { fontSize: Typography.sizes.md, marginBottom: Spacing.md },
  roleBadge: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.xs,
    borderRadius: Radius.full, marginBottom: Spacing.xl,
  },
  roleText: { color: '#FFF', fontSize: Typography.sizes.sm, fontWeight: '700' },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg },
  stat: { alignItems: 'center', paddingHorizontal: Spacing.xl },
  statNumber: { fontSize: Typography.sizes.xxl, fontWeight: '800' },
  statLabel: { fontSize: Typography.sizes.sm },
  statDivider: { width: 1, height: 30 },
  bio: { fontSize: Typography.sizes.md, textAlign: 'center', lineHeight: 22, paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  // Analytics
  analyticsSection: { paddingHorizontal: Spacing.xl, marginTop: Spacing.lg },
  analyticsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  analyticsCard: {
    width: '47%', flexGrow: 1, padding: Spacing.lg, borderRadius: Radius.lg,
    alignItems: 'center', minWidth: 140,
  },
  analyticsIcon: { fontSize: 24, marginBottom: Spacing.xs },
  analyticsNumber: { fontSize: Typography.sizes.xxl, fontWeight: '800', marginBottom: 2 },
  analyticsLabel: { fontSize: Typography.sizes.xs, textAlign: 'center' },
  // Videos
  videosSection: { paddingHorizontal: Spacing.xl, marginTop: Spacing.lg },
  sectionTitle: { fontSize: Typography.sizes.xl, fontWeight: '700', marginBottom: Spacing.md },
  videoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  videoCard: { width: '31%', flexGrow: 1, borderRadius: Radius.lg, overflow: 'hidden' },
  videoThumb: { height: 100, justifyContent: 'center', alignItems: 'center' },
  thumbIcon: { fontSize: 24 },
  videoTitle: { fontSize: Typography.sizes.xs, fontWeight: '600', padding: Spacing.xs },
  videoStats: { fontSize: Typography.sizes.xs, paddingHorizontal: Spacing.xs, paddingBottom: Spacing.xs },
  settingsSection: { paddingHorizontal: Spacing.xl, marginTop: Spacing.xxl, paddingBottom: Spacing.xxxxl },
  settingItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing.lg, borderRadius: Radius.lg, marginBottom: Spacing.sm,
  },
  settingLabel: { fontSize: Typography.sizes.md, fontWeight: '600' },
  langButtons: { flexDirection: 'row', gap: Spacing.xs },
  langBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.md },
  langBtnText: { fontSize: Typography.sizes.sm, fontWeight: '700' },
  logoutButton: {
    padding: Spacing.lg, borderRadius: Radius.lg, alignItems: 'center', marginTop: Spacing.md,
  },
  logoutText: { fontSize: Typography.sizes.md, fontWeight: '700' },
});
