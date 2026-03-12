import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Modal, Platform, Dimensions,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { videosAPI, usersAPI, messagesAPI } from '@/services/api';
import { Colors, Spacing, Typography, Radius } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Props {
  visible: boolean;
  teacherId: string;
  onClose: () => void;
  /** If provided, this video will be shown playing at the top of the profile */
  highlightVideoId?: string;
}

export default function TeacherProfileModal({ visible, teacherId, onClose, highlightVideoId }: Props) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const router = useRouter();

  const [teacher, setTeacher] = useState<any>(null);
  const [teacherVideos, setTeacherVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  useEffect(() => {
    if (visible && teacherId) {
      loadTeacher();
      // If a video is highlighted, auto-play it
      if (highlightVideoId) setPlayingVideoId(highlightVideoId);
    }
    if (!visible) {
      setPlayingVideoId(null);
    }
  }, [visible, teacherId, highlightVideoId]);

  const loadTeacher = async () => {
    setLoading(true);
    try {
      const [userRes, videosRes] = await Promise.all([
        usersAPI.getProfile(teacherId),
        videosAPI.getTeacherVideos(teacherId),
      ]);
      setTeacher(userRes.data.user);
      setTeacherVideos(videosRes.data.videos || []);
    } catch (e) {
      console.error('Load teacher error:', e);
    }
    setLoading(false);
  };

  const handleFollow = async () => {
    try {
      const res = await usersAPI.toggleFollow(teacherId);
      setIsFollowing(res.data.followed);
      if (teacher) {
        setTeacher({ ...teacher, followersCount: teacher.followersCount + (res.data.followed ? 1 : -1) });
      }
    } catch (e) {
      console.error('Follow error:', e);
    }
  };

  const handleMessage = async () => {
    try {
      await messagesAPI.createConversation(teacherId);
      onClose();
      // Navigate to messages tab
      setTimeout(() => router.push('/(tabs)/saved'), 300);
    } catch (e) {
      console.error('Start conversation error:', e);
    }
  };

  const formatCount = (n: number) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
  };

  // Find the highlighted video object
  const highlightedVideo = playingVideoId
    ? teacherVideos.find((v) => v._id === playingVideoId)
    : null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>{t('profile.title', 'Profile')}</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={{ fontSize: 22 }}>✕</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 30 }} />
          ) : teacher ? (
            <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
              {/* ===== VIDEO PLAYER (if a video is selected) ===== */}
              {highlightedVideo && (
                <View style={styles.videoPlayerSection}>
                  <Video
                    source={{ uri: highlightedVideo.videoUrl }}
                    style={styles.videoPlayer}
                    resizeMode={ResizeMode.CONTAIN}
                    isLooping
                    shouldPlay
                    useNativeControls
                  />
                  <View style={styles.videoPlayerInfo}>
                    <Text style={[styles.videoPlayerTitle, { color: colors.text }]}>{highlightedVideo.title}</Text>
                    <Text style={[styles.videoPlayerMeta, { color: colors.textSecondary }]}>
                      ❤️ {highlightedVideo.likesCount || 0} · 💬 {highlightedVideo.commentsCount || 0} · 👁️ {highlightedVideo.viewsCount || 0}
                    </Text>
                    {highlightedVideo.description ? (
                      <Text style={[styles.videoPlayerDesc, { color: colors.textSecondary }]} numberOfLines={3}>
                        {highlightedVideo.description}
                      </Text>
                    ) : null}
                  </View>
                </View>
              )}

              {/* ===== TEACHER INFO ===== */}
              <View style={{ alignItems: 'center', paddingTop: Spacing.lg }}>
                <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                  <Text style={{ color: '#FFF', fontSize: 32, fontWeight: '800' }}>
                    {teacher.displayName?.charAt(0) || '?'}
                  </Text>
                </View>
                <Text style={[{ fontSize: 22, fontWeight: '800', marginTop: Spacing.md, color: colors.text }]}>
                  {teacher.displayName}
                </Text>
                <View style={[styles.roleBadge, { backgroundColor: teacher.role === 'teacher' ? '#9B59B6' : '#FF2D78' }]}>
                  <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '700' }}>
                    {teacher.role === 'teacher'
                      ? (teacher.gender === 'female' ? t('role.teacherFemale', t('role.teacher')) : t('role.teacher'))
                      : (teacher.gender === 'female' ? t('role.studentFemale', t('role.student')) : t('role.student'))
                    }
                  </Text>
                </View>

                {/* Stats */}
                <View style={{ flexDirection: 'row', marginTop: Spacing.lg, gap: Spacing.xxl }}>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text }}>{formatCount(teacher.followersCount || 0)}</Text>
                    <Text style={{ fontSize: 12, color: colors.textSecondary }}>{t('profile.followers')}</Text>
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text }}>{formatCount(teacher.followingCount || 0)}</Text>
                    <Text style={{ fontSize: 12, color: colors.textSecondary }}>{t('profile.following')}</Text>
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text }}>{formatCount(teacher.videosCount || 0)}</Text>
                    <Text style={{ fontSize: 12, color: colors.textSecondary }}>{t('profile.videos')}</Text>
                  </View>
                </View>

                {/* Follow + Message buttons (side by side) */}
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[styles.followBtn, {
                      backgroundColor: isFollowing ? 'transparent' : colors.primary,
                      borderColor: isFollowing ? colors.textTertiary : colors.primary,
                      borderWidth: isFollowing ? 1 : 0,
                    }]}
                    onPress={handleFollow}
                  >
                    <Text style={{
                      color: isFollowing ? colors.textSecondary : '#FFF',
                      fontWeight: '600', fontSize: 14,
                    }}>
                      {isFollowing ? t('video.following') : t('video.follow')}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.messageBtn, { borderColor: colors.textTertiary }]}
                    onPress={handleMessage}
                  >
                    <Text style={{ color: colors.text, fontWeight: '600', fontSize: 14 }}>
                      {t('messages.title')}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Bio */}
                {teacher.bio ? (
                  <Text style={{ color: colors.textSecondary, marginTop: Spacing.md, textAlign: 'center', paddingHorizontal: Spacing.xl }}>
                    {teacher.bio}
                  </Text>
                ) : null}
              </View>

              {/* ===== VIDEOS GRID (Instagram-style) ===== */}
              {teacherVideos.length > 0 && (
                <View style={{ marginTop: Spacing.xl }}>
                  <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: Spacing.md, color: colors.text, paddingHorizontal: Spacing.xl }}>
                    {t('profile.videos')} ({teacherVideos.length})
                  </Text>
                  <View style={styles.videoGrid}>
                    {teacherVideos.map((v) => {
                      const isActive = playingVideoId === v._id;
                      return (
                        <TouchableOpacity
                          key={v._id}
                          style={[
                            styles.gridItem,
                            { backgroundColor: colors.surfaceElevated },
                            isActive && { borderWidth: 2, borderColor: colors.primary },
                          ]}
                          onPress={() => setPlayingVideoId(isActive ? null : v._id)}
                          activeOpacity={0.7}
                        >
                          <Text style={{ fontSize: 24 }}>▶️</Text>
                          <Text style={[styles.gridTitle, { color: colors.text }]} numberOfLines={2}>{v.title}</Text>
                          <Text style={[styles.gridMeta, { color: colors.textSecondary }]}>
                            ❤️ {v.likesCount} · 👁️ {v.viewsCount}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </ScrollView>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    height: '85%', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingTop: Spacing.md,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingBottom: Spacing.md,
    borderBottomWidth: 0.5, borderBottomColor: 'rgba(128,128,128,0.3)',
  },
  headerTitle: { fontSize: Typography.sizes.lg, fontWeight: '700' },
  // Video player
  videoPlayerSection: {
    backgroundColor: '#000',
  },
  videoPlayer: {
    width: SCREEN_WIDTH, height: SCREEN_WIDTH * 0.5625, // 16:9
  },
  videoPlayerInfo: {
    padding: Spacing.md, backgroundColor: 'rgba(0,0,0,0.85)',
  },
  videoPlayerTitle: { fontSize: Typography.sizes.md, fontWeight: '700', marginBottom: 4 },
  videoPlayerMeta: { fontSize: Typography.sizes.sm, marginBottom: 2 },
  videoPlayerDesc: { fontSize: Typography.sizes.sm, marginTop: 4 },
  // Teacher info
  avatar: {
    width: 70, height: 70, borderRadius: 35,
    justifyContent: 'center', alignItems: 'center',
  },
  roleBadge: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.xs,
    borderRadius: Radius.full, marginTop: Spacing.sm,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: Spacing.lg,
    width: '100%',
    paddingHorizontal: Spacing.xxl,
  },
  followBtn: {
    flex: 1,
    height: 42,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageBtn: {
    flex: 1,
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Video grid (Instagram-style)
  videoGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 1,
  },
  gridItem: {
    width: '33%',
    aspectRatio: 3 / 4,
    justifyContent: 'center', alignItems: 'center',
    padding: Spacing.xs,
    borderWidth: 0.5,
    borderColor: 'rgba(128,128,128,0.1)',
  },
  gridTitle: {
    fontSize: 10, fontWeight: '600', textAlign: 'center',
    marginTop: 4, lineHeight: 13,
  },
  gridMeta: { fontSize: 9, marginTop: 2 },
});
