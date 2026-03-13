import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, Platform, Modal, TextInput, ActivityIndicator, Image, Dimensions, FlatList,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '@/services/firebase';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store';
import { videosAPI, authAPI } from '@/services/api';
import { Spacing, Typography, Radius, CategoryConfig } from '@/constants/theme';
import { useRoleColors } from '@/hooks/useRoleColors';
import { useFocusEffect } from 'expo-router';
import SettingsModal from '@/components/SettingsModal';
import ProfileShareModal from '@/components/ProfileShareModal';

const showAlert = (title: string, msg?: string) => {
  if (typeof window !== 'undefined') window.alert(msg ? `${title}: ${msg}` : title);
  else Alert.alert(title, msg);
};

// ============ EDIT PROFILE MODAL ============
function EditProfileModal({ visible, onClose, onSaved }: { visible: boolean; onClose: () => void; onSaved: () => void }) {
  const { t } = useTranslation();
  const colors = useRoleColors();
  const { user, setUser } = useAuthStore();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const isTeacher = user?.role === 'teacher';

  useEffect(() => {
    if (visible && user) {
      setDisplayName(user.displayName || '');
      setBio(user.bio || '');
      setAvatarUrl(user.avatarUrl || '');
    }
  }, [visible, user]);

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setUploadingPhoto(true);
      try {
        if (Platform.OS === 'web') {
          // On web: use base64 data URL directly (avoids Firebase Storage CORS issues)
          if (asset.base64) {
            const mimeType = asset.mimeType || 'image/jpeg';
            const dataUrl = `data:${mimeType};base64,${asset.base64}`;
            setAvatarUrl(dataUrl);
          } else if (asset.uri) {
            // Fallback: use the blob URI directly
            setAvatarUrl(asset.uri);
          }
        } else {
          // On native: upload to Firebase Storage
          const filename = `avatars/${user?._id}/${Date.now()}.jpg`;
          const storageRef = ref(storage, filename);
          const response = await fetch(asset.uri);
          const blob = await response.blob();
          const uploadTask = uploadBytesResumable(storageRef, blob);

          await new Promise<void>((resolve, reject) => {
            uploadTask.on('state_changed', null,
              (error) => reject(error),
              async () => {
                const url = await getDownloadURL(uploadTask.snapshot.ref);
                setAvatarUrl(url);
                resolve();
              }
            );
          });
        }
      } catch (e: any) {
        console.error('Photo upload error:', e);
        showAlert(t('common.error'), e?.message || 'Failed to upload photo');
      }
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      showAlert(t('common.error'), 'Display name cannot be empty');
      return;
    }

    setSaving(true);
    try {
      const updates: any = {};

      // Only send changed fields
      if (displayName.trim() !== user?.displayName) updates.displayName = displayName.trim();
      if (bio !== (user?.bio || '')) updates.bio = bio;
      if (avatarUrl !== (user?.avatarUrl || '')) updates.avatarUrl = avatarUrl;

      if (Object.keys(updates).length === 0) {
        onClose();
        return;
      }

      const res = await authAPI.updateProfile(updates);
      setUser(res.data.user);
      onSaved();
      onClose();
    } catch (e: any) {
      const msg = e?.response?.data?.error?.message || 'Update failed';
      showAlert(t('common.error'), msg);
    }
    setSaving(false);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={editStyles.overlay}>
        <View style={[editStyles.container, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={editStyles.header}>
            <TouchableOpacity onPress={onClose}>
              <Text style={[editStyles.headerBtn, { color: colors.textSecondary }]}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <Text style={[editStyles.headerTitle, { color: colors.text }]}>{t('profile.editProfile')}</Text>
            <TouchableOpacity onPress={handleSave} disabled={saving}>
              {saving ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={[editStyles.headerBtn, { color: colors.primary, fontWeight: '700' }]}>{t('common.save')}</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: Spacing.xl }}>
            {/* Avatar */}
            <View style={{ alignItems: 'center', marginBottom: Spacing.xxl }}>
              <TouchableOpacity onPress={pickPhoto} disabled={uploadingPhoto}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={editStyles.avatarImage} />
                ) : (
                  <View style={[editStyles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                    <Text style={{ color: '#FFF', fontSize: 36, fontWeight: '800' }}>
                      {displayName?.charAt(0) || '?'}
                    </Text>
                  </View>
                )}
                {uploadingPhoto ? (
                  <View style={editStyles.avatarOverlay}>
                    <ActivityIndicator color="#FFF" />
                  </View>
                ) : (
                  <View style={editStyles.avatarBadge}>
                    <Text style={{ fontSize: 14 }}>📷</Text>
                  </View>
                )}
              </TouchableOpacity>
              <Text style={[editStyles.photoHint, { color: colors.primary }]}>
                {t('profile.changePhoto', 'Change photo')}
              </Text>
            </View>

            {/* Display Name */}
            <Text style={[editStyles.label, { color: colors.textSecondary }]}>
              {t('auth.displayName')}
            </Text>
            <TextInput
              style={[editStyles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              value={displayName}
              onChangeText={setDisplayName}
              maxLength={30}
              placeholder={t('auth.displayName')}
              placeholderTextColor={colors.textTertiary}
            />
            <Text style={[editStyles.hint, { color: colors.textTertiary }]}>
              {t('profile.nameChangeHint', 'You can change your name once per week')}
            </Text>

            {/* Bio (teacher only) */}
            {isTeacher && (
              <>
                <Text style={[editStyles.label, { color: colors.textSecondary, marginTop: Spacing.lg }]}>
                  {t('profile.bio')}
                </Text>
                <TextInput
                  style={[editStyles.input, editStyles.textArea, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                  value={bio}
                  onChangeText={(text) => setBio(text.length <= 150 ? text : text.substring(0, 150))}
                  maxLength={150}
                  multiline
                  numberOfLines={3}
                  placeholder={t('profile.bioPlaceholder', 'Tell students about yourself...')}
                  placeholderTextColor={colors.textTertiary}
                />
                <Text style={[editStyles.charCount, { color: bio.length >= 140 ? colors.error : colors.textTertiary }]}>
                  {bio.length}/150
                </Text>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const editStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  container: { height: '75%', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    borderBottomWidth: 0.5, borderBottomColor: 'rgba(128,128,128,0.3)',
  },
  headerTitle: { fontSize: Typography.sizes.lg, fontWeight: '700' },
  headerBtn: { fontSize: Typography.sizes.md },
  avatarImage: { width: 90, height: 90, borderRadius: 45 },
  avatarPlaceholder: { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center' },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center',
  },
  avatarBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, elevation: 4,
  },
  photoHint: { fontSize: Typography.sizes.sm, fontWeight: '600', marginTop: Spacing.sm },
  label: { fontSize: Typography.sizes.sm, fontWeight: '600', marginBottom: Spacing.xs },
  input: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderRadius: Radius.lg, borderWidth: 1, fontSize: Typography.sizes.md,
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  hint: { fontSize: Typography.sizes.xs, marginTop: Spacing.xs },
  charCount: { fontSize: Typography.sizes.xs, textAlign: 'right', marginTop: 2 },
});

// ============ PROFILE SCREEN ============
export default function ProfileScreen() {
  const { t } = useTranslation();
  const colors = useRoleColors();
  const { user, setUser, logout: logoutStore } = useAuthStore();

  const isTeacher = user?.role === 'teacher';

  const [videos, setVideos] = useState<any[]>([]);
  const [savedVideos, setSavedVideos] = useState<any[]>([]);
  const [likedVideos, setLikedVideos] = useState<any[]>([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [shareVisible, setShareVisible] = useState(false);
  const [playingVideo, setPlayingVideo] = useState<any>(null);
  const [feedData, setFeedData] = useState<{ videos: any[]; startIndex: number } | null>(null);
  const [feedActiveIndex, setFeedActiveIndex] = useState(0);
  const feedListRef = useRef<FlatList>(null);
  const feedViewChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setFeedActiveIndex(viewableItems[0].index ?? 0);
    }
  }).current;
  const feedViewConfig = useRef({ itemVisiblePercentThreshold: 80 }).current;
  const [activeVideoTab, setActiveVideoTab] = useState<'my' | 'saved' | 'liked'>(isTeacher ? 'my' : 'saved');

  useEffect(() => {
    if (user && isTeacher) {
      loadMyVideos();
    }
  }, [user]);

  // Reload current tab data every time profile is focused
  useFocusEffect(
    useCallback(() => {
      if (activeVideoTab === 'my' && isTeacher) loadMyVideos();
      else if (activeVideoTab === 'saved') loadSavedVideos();
      else if (activeVideoTab === 'liked') loadLikedVideos();
    }, [activeVideoTab])
  );

  const loadMyVideos = async () => {
    try {
      const res = await videosAPI.getTeacherVideos(user!._id);
      setVideos(res.data.videos);
    } catch {}
  };

  const loadSavedVideos = useCallback(async () => {
    try {
      const res = await videosAPI.getSaved();
      setSavedVideos(res.data.videos);
    } catch {}
  }, []);

  const loadLikedVideos = useCallback(async () => {
    try {
      const res = await videosAPI.getLiked();
      setLikedVideos(res.data.videos);
    } catch {}
  }, []);

  // Also reload when switching tabs
  useEffect(() => {
    if (activeVideoTab === 'saved') loadSavedVideos();
    if (activeVideoTab === 'liked') loadLikedVideos();
  }, [activeVideoTab]);

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



  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ☰ Hamburger header bar */}
      <View style={[styles.headerBar, { backgroundColor: colors.background }]}>
        <View />
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => setShareVisible(true)}
            style={styles.shareBtn}
            activeOpacity={0.6}
          >
            <Ionicons name="arrow-redo-outline" size={22} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSettingsVisible(true)}
            style={styles.hamburgerBtn}
            activeOpacity={0.6}
          >
            <View style={styles.hamburgerLines}>
              <View style={[styles.hamburgerLine, { backgroundColor: colors.text }]} />
              <View style={[styles.hamburgerLine, { backgroundColor: colors.text }]} />
              <View style={[styles.hamburgerLine, { backgroundColor: colors.text }]} />
            </View>
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile card */}
        <View style={styles.profileHeader}>
          {/* Avatar with photo */}
          <TouchableOpacity onPress={() => setEditModalVisible(true)}>
            {user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarText}>{user?.displayName?.charAt(0) || '?'}</Text>
              </View>
            )}
          </TouchableOpacity>

          <Text style={[styles.name, { color: colors.text }]}>{user?.displayName}</Text>

          {/* Role + Category inline */}
          <Text style={[styles.roleLabel, { color: colors.primary }]}>
            {isTeacher
              ? ((user as any)?.gender === 'female' ? t('role.teacherFemale', t('role.teacher')) : t('role.teacher'))
              : ((user as any)?.gender === 'female' ? t('role.studentFemale', t('role.student')) : t('role.student'))
            }
            {isTeacher && user?.expertiseCategory
              ? ` · ${user.expertiseCategory.charAt(0).toUpperCase() + user.expertiseCategory.slice(1).replace('-', ' ')}`
              : ''
            }
          </Text>

          {/* Bio (under role badge) */}
          {isTeacher && user?.bio ? (
            <Text style={[styles.bio, { color: colors.textSecondary }]}>{user.bio}</Text>
          ) : null}

          {/* Edit profile button */}
          <TouchableOpacity
            style={[styles.editButton, { borderColor: colors.border }]}
            onPress={() => setEditModalVisible(true)}
          >
            <Text style={[styles.editButtonText, { color: colors.text }]}>{t('profile.editProfile')}</Text>
          </TouchableOpacity>

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
                <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                <View style={styles.stat}>
                  <Text style={[styles.statNumber, { color: colors.text }]}>{user?.coffeesReceived || 0}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('coffee.coffees', 'Coffees')}</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Teacher Analytics */}
        {isTeacher && videos.length > 0 && (
          <View style={styles.analyticsSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('analytics.title')}</Text>
            <View style={styles.analyticsGrid}>
              {[
                { value: analytics.views, label: t('analytics.totalViews') },
                { value: analytics.likes, label: t('analytics.totalLikes') },
                { value: analytics.comments, label: t('analytics.totalComments') },
                { value: analytics.saves, label: t('analytics.totalSaves') },
              ].map((item, i) => (
                <View key={i} style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.analyticsNumber, { color: colors.text }]}>{formatCount(item.value)}</Text>
                  <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>{item.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ─── Video Grid Tabs ─── */}
        <View style={styles.videoTabsSection}>
          <View style={[styles.videoTabBar, { borderBottomColor: colors.border }]}>
            {isTeacher && (
              <TouchableOpacity
                style={[styles.videoTab, activeVideoTab === 'my' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
                onPress={() => setActiveVideoTab('my')}
              >
                <Text style={[styles.videoTabText, { color: activeVideoTab === 'my' ? colors.text : colors.textTertiary }]}>
                  {t('profile.myVideos')}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.videoTab, activeVideoTab === 'saved' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
              onPress={() => setActiveVideoTab('saved')}
            >
              <Text style={[styles.videoTabText, { color: activeVideoTab === 'saved' ? colors.text : colors.textTertiary }]}>
                {t('profile.saved')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.videoTab, activeVideoTab === 'liked' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
              onPress={() => setActiveVideoTab('liked')}
            >
              <Text style={[styles.videoTabText, { color: activeVideoTab === 'liked' ? colors.text : colors.textTertiary }]}>
                {t('profile.liked')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Video grid content */}
          {(() => {
            const currentVideos = activeVideoTab === 'my' ? videos : activeVideoTab === 'saved' ? savedVideos : likedVideos;
            const emptyMessage = activeVideoTab === 'my' ? t('profile.noVideos') : activeVideoTab === 'saved' ? t('profile.noSaved') : t('profile.noLiked');

            if (currentVideos.length === 0) {
              return (
                <View style={styles.emptyGrid}>
                  <Text style={[styles.emptyGridText, { color: colors.textSecondary }]}>{emptyMessage}</Text>
                </View>
              );
            }

            const handleRemoveVideo = (video: any) => {
              const actions: Record<string, { title: string; action: () => Promise<void> }> = {
                my: {
                  title: t('profile.deleteVideoConfirm', 'Delete this video permanently?'),
                  action: async () => {
                    await videosAPI.delete(video._id);
                    setVideos(prev => prev.filter(v => v._id !== video._id));
                  },
                },
                saved: {
                  title: t('profile.unsaveConfirm', 'Remove from saved?'),
                  action: async () => {
                    await videosAPI.toggleSave(video._id);
                    setSavedVideos(prev => prev.filter(v => v._id !== video._id));
                  },
                },
                liked: {
                  title: t('profile.unlikeConfirm', 'Remove from liked?'),
                  action: async () => {
                    await videosAPI.toggleLike(video._id);
                    setLikedVideos(prev => prev.filter(v => v._id !== video._id));
                  },
                },
              };
              const { title, action } = actions[activeVideoTab];
              if (Platform.OS === 'web') {
                if (window.confirm(title)) action().catch(() => {});
              } else {
                Alert.alert(t('common.confirm', 'Confirm'), title, [
                  { text: t('common.cancel'), style: 'cancel' },
                  { text: t('common.delete', 'Delete'), style: 'destructive', onPress: () => action().catch(() => {}) },
                ]);
              }
            };

            return (
              <View style={styles.videoGrid}>
                {currentVideos.map((video: any, idx: number) => (
                  <TouchableOpacity
                    key={video._id}
                    style={styles.videoCard}
                    onPress={() => {
                      setFeedData({ videos: currentVideos, startIndex: idx });
                      setFeedActiveIndex(idx);
                    }}
                  >
                    <View style={[styles.videoThumb, { backgroundColor: colors.surfaceElevated }]}>
                      {video.coverUrl ? (
                        <Image source={{ uri: video.coverUrl }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
                      ) : video.videoUrl ? (
                        <Image
                          source={{ uri: video.videoUrl.replace(/\.(mp4|mov|webm)$/, '.jpg') }}
                          style={StyleSheet.absoluteFillObject}
                          resizeMode="cover"
                          defaultSource={undefined}
                        />
                      ) : (
                        <Text style={styles.thumbIcon}>▶️</Text>
                      )}
                      {/* Play icon overlay */}
                      <View style={styles.playOverlay}>
                        <Ionicons name="play" size={24} color="rgba(255,255,255,0.9)" />
                      </View>
                      {/* Bottom info overlay */}
                      <View style={styles.tileOverlay}>
                        <Text style={styles.tileTitle} numberOfLines={2}>{video.title}</Text>
                        <View style={styles.tileBottomRow}>
                          <Text style={styles.tileStats}>▶ {video.viewsCount || 0}</Text>
                        </View>
                      </View>
                      {/* Delete/remove button */}
                      <TouchableOpacity
                        style={styles.tileDeleteBtn}
                        onPress={(e) => { e.stopPropagation?.(); handleRemoveVideo(video); }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons
                          name={activeVideoTab === 'my' ? 'trash-outline' : activeVideoTab === 'saved' ? 'bookmark-outline' : 'heart-dislike-outline'}
                          size={16}
                          color="#fff"
                        />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            );
          })()}
        </View>

        {/* Bottom spacer */}
        <View style={{ height: Spacing.xxxxl }} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <EditProfileModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        onSaved={() => {
          // Refresh profile data
          if (isTeacher) loadMyVideos();
        }}
      />

      {/* Settings Modal */}
      <SettingsModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
      />

      {/* Profile Share Modal */}
      <ProfileShareModal
        visible={shareVisible}
        onClose={() => setShareVisible(false)}
      />

      {/* TikTok-style Video Feed Modal */}
      {feedData && (
        <Modal visible={!!feedData} animationType="slide" onRequestClose={() => setFeedData(null)}>
          <View style={{ flex: 1, backgroundColor: '#000' }}>
            {/* Close button */}
            <TouchableOpacity
              style={styles.feedCloseBtn}
              onPress={() => setFeedData(null)}
            >
              <Text style={{ color: '#fff', fontSize: 28, fontWeight: '300' }}>✕</Text>
            </TouchableOpacity>

            <FlatList
              ref={feedListRef}
              data={feedData.videos}
              keyExtractor={(item: any) => item._id}
              pagingEnabled
              showsVerticalScrollIndicator={false}
              snapToInterval={Dimensions.get('window').height}
              snapToAlignment="start"
              decelerationRate="fast"
              getItemLayout={(_, index) => ({
                length: Dimensions.get('window').height,
                offset: Dimensions.get('window').height * index,
                index,
              })}
              initialScrollIndex={feedData.startIndex}
              onViewableItemsChanged={feedViewChanged}
              viewabilityConfig={feedViewConfig}
              renderItem={({ item, index }: { item: any; index: number }) => (
                <View style={{ width: Dimensions.get('window').width, height: Dimensions.get('window').height, backgroundColor: '#000' }}>
                  <Video
                    source={{ uri: item.videoUrl }}
                    style={{ flex: 1 }}
                    resizeMode={ResizeMode.CONTAIN}
                    shouldPlay={index === feedActiveIndex}
                    isLooping
                    isMuted={false}
                    useNativeControls={false}
                  />
                  {/* Video info overlay */}
                  <View style={styles.feedInfoOverlay}>
                    <Text style={styles.feedVideoTitle} numberOfLines={2}>{item.title}</Text>
                    {item.description ? (
                      <Text style={styles.feedVideoDesc} numberOfLines={2}>{item.description}</Text>
                    ) : null}
                    <Text style={styles.feedVideoStats}>
                      ♡ {item.likesCount || 0}   ▶ {item.viewsCount || 0}   💬 {item.commentsCount || 0}
                    </Text>
                  </View>
                  {/* Video counter */}
                  <View style={styles.feedCounter}>
                    <Text style={styles.feedCounterText}>{index + 1} / {feedData.videos.length}</Text>
                  </View>
                </View>
              )}
            />
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 55 : 35, paddingHorizontal: Spacing.xl, paddingBottom: Spacing.sm,
  },
  headerRight: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
  },
  shareBtn: {
    padding: Spacing.xs,
  },
  headerTitle: { fontSize: Typography.sizes.xxl, fontWeight: '800' },
  hamburgerBtn: {
    padding: Spacing.sm,
  },
  hamburgerLines: {
    width: 22,
    gap: 4,
  },
  hamburgerLine: {
    height: 2.5,
    borderRadius: 2,
    width: '100%',
  },
  profileHeader: { alignItems: 'center', paddingHorizontal: Spacing.xl, paddingTop: Spacing.md },
  avatar: {
    width: 80, height: 80, borderRadius: Radius.full,
    justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md,
  },
  avatarImage: {
    width: 80, height: 80, borderRadius: 40, marginBottom: Spacing.md,
  },
  avatarText: { color: '#FFF', fontSize: 32, fontWeight: '800' },
  name: { fontSize: Typography.sizes.xxl, fontWeight: '800', marginBottom: 2 },
  email: { fontSize: Typography.sizes.md, marginBottom: Spacing.md },
  roleLabel: {
    fontSize: Typography.sizes.sm, fontWeight: '700', marginBottom: Spacing.sm,
  },
  bio: {
    fontSize: Typography.sizes.md, textAlign: 'center', lineHeight: 22,
    paddingHorizontal: Spacing.lg, marginBottom: Spacing.md,
  },
  editButton: {
    borderWidth: 1, borderRadius: Radius.lg,
    paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  editButtonText: { fontSize: Typography.sizes.sm, fontWeight: '600' },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg },
  stat: { alignItems: 'center', paddingHorizontal: Spacing.xl },
  statNumber: { fontSize: Typography.sizes.xxl, fontWeight: '800' },
  statLabel: { fontSize: Typography.sizes.sm },
  statDivider: { width: 1, height: 30 },
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
  videoTabsSection: { marginTop: Spacing.lg },
  videoTabBar: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    marginHorizontal: Spacing.xl,
  },
  videoTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  videoTabText: {
    fontSize: Typography.sizes.md,
    fontWeight: '700',
  },
  videosSection: { paddingHorizontal: Spacing.xl, marginTop: Spacing.lg },
  sectionTitle: { fontSize: Typography.sizes.xl, fontWeight: '700', marginBottom: Spacing.md },
  videoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    maxWidth: 480,
    alignSelf: 'center',
    width: '100%',
  },
  videoCard: {
    width: '33.33%',
    aspectRatio: 3 / 4,
    padding: 1,
  },
  videoThumb: {
    flex: 1,
    borderRadius: Radius.md,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  thumbIcon: { fontSize: 28, opacity: 0.5 },
  tileOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 6,
    paddingBottom: 6,
    paddingTop: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  tileTitle: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
  },
  tileStats: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    marginTop: 2,
  },
  tileBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playOverlay: {
    position: 'absolute',
    top: '35%',
    alignSelf: 'center',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tileDeleteBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  videoTitle: { fontSize: Typography.sizes.xs, fontWeight: '600', padding: Spacing.xs },
  videoStats: { fontSize: Typography.sizes.xs, paddingHorizontal: Spacing.xs, paddingBottom: Spacing.xs },
  emptyGrid: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxxxl,
  },
  emptyGridText: {
    fontSize: Typography.sizes.md,
  },
  // Feed modal
  feedCloseBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  feedInfoOverlay: {
    position: 'absolute',
    bottom: 80,
    left: Spacing.xl,
    right: 80,
  },
  feedVideoTitle: {
    color: '#fff',
    fontSize: Typography.sizes.lg,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  feedVideoDesc: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: Typography.sizes.sm,
    marginTop: 4,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  feedVideoStats: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: Typography.sizes.sm,
    marginTop: Spacing.sm,
  },
  feedCounter: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 65 : 45,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  feedCounterText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
  },
});
