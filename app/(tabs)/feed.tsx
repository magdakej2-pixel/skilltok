import React, { useCallback, useRef, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, Dimensions, TouchableOpacity,
  ActivityIndicator, StatusBar, Platform, Animated as RNAnimated,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { useTranslation } from 'react-i18next';
import { Colors, Spacing, Typography, Radius, CategoryConfig } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';
import { useVideoStore, useAuthStore, Video as VideoType } from '@/store';
import { videosAPI } from '@/services/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

function VideoItem({ item, isActive }: { item: VideoType; isActive: boolean }) {
  const videoRef = useRef<Video>(null);
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { updateVideoStats } = useVideoStore();
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [paused, setPaused] = useState(false);
  const heartScale = useRef(new RNAnimated.Value(1)).current;

  useEffect(() => {
    if (isActive && videoRef.current) {
      videoRef.current.playAsync();
    } else if (videoRef.current) {
      videoRef.current.pauseAsync();
    }
  }, [isActive]);

  const animateHeart = () => {
    RNAnimated.sequence([
      RNAnimated.spring(heartScale, { toValue: 1.4, useNativeDriver: true, speed: 50, bounciness: 12 }),
      RNAnimated.spring(heartScale, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 8 }),
    ]).start();
  };

  const handleLike = async () => {
    animateHeart();
    try {
      const res = await videosAPI.toggleLike(item._id);
      setLiked(res.data.liked);
      updateVideoStats(item._id, {
        likesCount: item.likesCount + (res.data.liked ? 1 : -1),
      });
    } catch {}
  };

  const handleSave = async () => {
    try {
      const res = await videosAPI.toggleSave(item._id);
      setSaved(res.data.saved);
      updateVideoStats(item._id, {
        savesCount: item.savesCount + (res.data.saved ? 1 : -1),
      });
    } catch {}
  };

  const togglePause = () => {
    if (paused) {
      videoRef.current?.playAsync();
    } else {
      videoRef.current?.pauseAsync();
    }
    setPaused(!paused);
  };

  const formatCount = (n: number) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
  };

  return (
    <TouchableOpacity activeOpacity={1} onPress={togglePause} style={styles.videoContainer}>
      <Video
        ref={videoRef}
        source={{ uri: item.videoUrl }}
        style={styles.video}
        resizeMode={ResizeMode.COVER}
        isLooping
        shouldPlay={isActive}
        isMuted={false}
      />

      {/* Dark overlay at bottom for text readability */}
      <View style={styles.bottomOverlay} />

      {/* Right side action buttons */}
      <View style={styles.actionsColumn}>
        {/* Teacher avatar */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.teacherId.displayName?.charAt(0) || '?'}
            </Text>
          </View>
        </View>

        {/* Like */}
        <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
          <RNAnimated.View style={{ transform: [{ scale: heartScale }] }}>
            <Text style={[styles.actionIcon, liked && styles.liked]}>
              {liked ? '❤️' : '🤍'}
            </Text>
          </RNAnimated.View>
          <Text style={styles.actionCount}>{formatCount(item.likesCount)}</Text>
        </TouchableOpacity>

        {/* Comment */}
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={styles.actionCount}>{formatCount(item.commentsCount)}</Text>
        </TouchableOpacity>

        {/* Save */}
        <TouchableOpacity style={styles.actionButton} onPress={handleSave}>
          <Text style={[styles.actionIcon]}>{saved ? '🔖' : '📑'}</Text>
          <Text style={styles.actionCount}>{formatCount(item.savesCount)}</Text>
        </TouchableOpacity>

        {/* Share */}
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>📤</Text>
          <Text style={styles.actionCount}>{t('video.share')}</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom info */}
      <View style={styles.videoInfo}>
        <View style={styles.teacherRow}>
          <Text style={styles.teacherName}>@{item.teacherId.displayName}</Text>
          <TouchableOpacity style={styles.followButton}>
            <Text style={styles.followText}>{t('video.follow')}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.videoTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.videoDesc} numberOfLines={1}>{item.description}</Text>
        <View style={styles.categoryTag}>
          <Text style={styles.categoryText}>
            {CategoryConfig[item.category]?.icon || '📚'} {item.category}
          </Text>
        </View>
      </View>

      {/* Pause indicator */}
      {paused && (
        <View style={styles.pauseOverlay}>
          <Text style={styles.pauseIcon}>▶️</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function FeedScreen() {
  const { t } = useTranslation();
  const { feedVideos, setFeedVideos, appendFeedVideos, isLoadingFeed, setLoadingFeed, feedPage, setFeedPage, hasMoreFeed, setHasMoreFeed } = useVideoStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const loadFeed = useCallback(async (page = 1, refresh = false) => {
    if (isLoadingFeed) return;
    setLoadingFeed(true);
    try {
      const res = await videosAPI.getFeed(page);
      const { videos, pagination } = res.data;
      if (refresh || page === 1) {
        setFeedVideos(videos);
      } else {
        appendFeedVideos(videos);
      }
      setFeedPage(page);
      setHasMoreFeed(page < pagination.pages);
    } catch (err) {
      console.log('Feed load error:', err);
    } finally {
      setLoadingFeed(false);
      setRefreshing(false);
    }
  }, [isLoadingFeed]);

  useEffect(() => {
    loadFeed(1, true);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadFeed(1, true);
  };

  const handleEndReached = () => {
    if (hasMoreFeed && !isLoadingFeed) {
      loadFeed(feedPage + 1);
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index ?? 0);
    }
  }).current;

  return (
    <View style={styles.screenContainer}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('feed.title')}</Text>
      </View>

      {feedVideos.length === 0 && !isLoadingFeed ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📚</Text>
          <Text style={styles.emptyText}>{t('feed.noVideos')}</Text>
        </View>
      ) : (
        <FlatList
          data={feedVideos}
          renderItem={({ item, index }) => (
            <VideoItem item={item} isActive={index === currentIndex} />
          )}
          keyExtractor={(item) => item._id}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          snapToInterval={SCREEN_HEIGHT}
          snapToAlignment="start"
          decelerationRate="fast"
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ itemVisiblePercentThreshold: 80 }}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListFooterComponent={isLoadingFeed ? <ActivityIndicator color="#FFF" style={{ padding: 20 }} /> : null}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: { flex: 1, backgroundColor: '#000' },
  header: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
    paddingTop: Platform.OS === 'ios' ? 55 : 35, paddingBottom: Spacing.md,
    alignItems: 'center',
  },
  headerTitle: { color: '#FFF', fontSize: Typography.sizes.xl, fontWeight: '700' },
  videoContainer: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT, backgroundColor: '#000' },
  video: { flex: 1 },
  bottomOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 250,
    background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
  },
  actionsColumn: {
    position: 'absolute', right: Spacing.md, bottom: 120,
    alignItems: 'center', gap: Spacing.xl,
  },
  avatarContainer: { marginBottom: Spacing.sm },
  avatar: {
    width: 48, height: 48, borderRadius: Radius.full,
    backgroundColor: '#6C5CE7', justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#FFF',
  },
  avatarText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  actionButton: { alignItems: 'center', gap: 2 },
  actionIcon: { fontSize: 28 },
  actionCount: { color: '#FFF', fontSize: 11, fontWeight: '600' },
  liked: {},
  videoInfo: {
    position: 'absolute', bottom: 100, left: Spacing.lg, right: 80,
  },
  teacherRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xs },
  teacherName: { color: '#FFF', fontSize: Typography.sizes.lg, fontWeight: '700' },
  followButton: {
    borderWidth: 1, borderColor: '#FFF', borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md, paddingVertical: 2,
  },
  followText: { color: '#FFF', fontSize: Typography.sizes.xs, fontWeight: '600' },
  videoTitle: { color: '#FFF', fontSize: Typography.sizes.md, fontWeight: '600', marginBottom: 2 },
  videoDesc: { color: 'rgba(255,255,255,0.8)', fontSize: Typography.sizes.sm, marginBottom: Spacing.xs },
  categoryTag: {
    backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: Spacing.sm,
    paddingVertical: 2, borderRadius: Radius.sm, alignSelf: 'flex-start',
  },
  categoryText: { color: '#FFF', fontSize: Typography.sizes.xs },
  pauseOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  pauseIcon: { fontSize: 60, opacity: 0.8 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyIcon: { fontSize: 60, marginBottom: Spacing.md },
  emptyText: { color: '#FFF', fontSize: Typography.sizes.lg },
});
