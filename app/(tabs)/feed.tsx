import React, { useCallback, useRef, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, Dimensions, TouchableOpacity,
  ActivityIndicator, StatusBar, Platform, Animated as RNAnimated,
  Modal, TextInput, KeyboardAvoidingView, Share, ScrollView,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { useTranslation } from 'react-i18next';
import { useFocusEffect, useRouter } from 'expo-router';
import { Spacing, Typography, Radius, CategoryConfig } from '@/constants/theme';
import { useRoleColors } from '@/hooks/useRoleColors';
import { useColorScheme } from '@/components/useColorScheme';
import { useVideoStore, useAuthStore, Video as VideoType } from '@/store';
import { videosAPI, usersAPI } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import TeacherProfileModal from '@/components/TeacherProfileModal';
import CoffeeModal from '@/components/CoffeeModal';
import EmojiPicker from '@/components/EmojiPicker';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Full-screen video dimensions (subtract tab bar height)
const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 85 : 65;
const VIDEO_WIDTH = SCREEN_WIDTH;
const VIDEO_HEIGHT = SCREEN_HEIGHT - TAB_BAR_HEIGHT;

// ============ COMMENTS MODAL ============
function CommentsModal({ visible, videoId, onClose }: { visible: boolean; videoId: string; onClose: () => void }) {
  const { t } = useTranslation();
  const colors = useRoleColors();
  const { updateVideoStats } = useVideoStore();
  const { user } = useAuthStore();
  const inputRef = useRef<TextInput>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [replyTo, setReplyTo] = useState<any>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const [showEmoji, setShowEmoji] = useState(false);

  useEffect(() => { if (visible && videoId) loadComments(); }, [visible, videoId]);

  const loadComments = async () => {
    setLoading(true);
    try { const res = await videosAPI.getComments(videoId); setComments(res.data.comments || []); }
    catch (e) { console.error('Load comments error:', e); }
    setLoading(false);
  };

  const handlePost = async () => {
    if (!newComment.trim() || posting) return;
    setPosting(true);
    try {
      const res = await videosAPI.addComment(videoId, newComment.trim(), replyTo?._id || undefined);
      if (replyTo) {
        setComments(prev => prev.map(c => c._id === replyTo._id ? { ...c, replies: [...(c.replies || []), res.data.comment] } : c));
        setExpandedReplies(prev => new Set([...prev, replyTo._id]));
      } else {
        setComments(prev => [res.data.comment, ...prev]);
      }
      setNewComment(''); setReplyTo(null);
      updateVideoStats(videoId, { commentsCount: comments.length + 1 } as any);
    } catch (e) { console.error('Post comment error:', e); }
    setPosting(false);
  };

  const handleLikeComment = async (commentId: string, parentId?: string) => {
    try {
      console.log('Liking comment:', commentId, 'on video:', videoId, 'URL:', `/videos/${videoId}/comments/${commentId}/like`);
      const res = await videosAPI.likeComment(videoId, commentId);
      const next = new Set(likedComments);
      if (res.data.liked) next.add(commentId); else next.delete(commentId);
      setLikedComments(next);
      if (parentId) {
        setComments(prev => prev.map(c => c._id === parentId
          ? { ...c, replies: (c.replies || []).map((r: any) => r._id === commentId ? { ...r, likesCount: res.data.likesCount } : r) } : c));
      } else {
        setComments(prev => prev.map(c => c._id === commentId ? { ...c, likesCount: res.data.likesCount } : c));
      }
    } catch (e) { console.error('Like comment error:', e); }
  };

  const handleReply = (comment: any) => {
    setReplyTo(comment);
    setNewComment(`@${comment.userId?.displayName} `);
    inputRef.current?.focus();
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  const renderComment = (item: any, isReply = false, parentId?: string) => (
    <View key={item._id} style={[styles.commentItem, { borderBottomColor: colors.border }, isReply && { paddingLeft: 54, paddingVertical: 6 }]}>
      <View style={[styles.commentAvatar, { backgroundColor: isReply ? colors.surfaceElevated : colors.primary, width: isReply ? 28 : 36, height: isReply ? 28 : 36, borderRadius: isReply ? 14 : 18 }]}>
        <Text style={[styles.commentAvatarText, { fontSize: isReply ? 11 : 14 }]}>{item.userId?.displayName?.charAt(0) || '?'}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.commentHeader}>
          <Text style={[styles.commentUser, { color: colors.text }]}>{item.userId?.displayName || 'User'}</Text>
          <Text style={[styles.commentTime, { color: colors.textTertiary }]}>{timeAgo(item.createdAt)}</Text>
        </View>
        <Text style={[styles.commentText, { color: colors.textSecondary }]}>{item.text}</Text>
        {!isReply && (
          <TouchableOpacity onPress={() => handleReply(item)}>
            <Text style={{ fontSize: 12, color: colors.textTertiary, fontWeight: '600', marginTop: 4 }}>{t('video.reply', 'Reply')}</Text>
          </TouchableOpacity>
        )}
      </View>
      <TouchableOpacity style={{ alignItems: 'center', paddingLeft: 8 }} onPress={() => handleLikeComment(item._id, parentId)}>
        <Ionicons name={likedComments.has(item._id) ? 'heart' : 'heart-outline'} size={isReply ? 14 : 16} color={likedComments.has(item._id) ? '#FF2D55' : colors.textTertiary} />
        {(item.likesCount || 0) > 0 && <Text style={{ fontSize: 10, color: colors.textTertiary, marginTop: 1 }}>{item.likesCount}</Text>}
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.commentsContainer, { backgroundColor: colors.background }]}>
          <View style={styles.commentsHeader}>
            <Text style={[styles.commentsTitle, { color: colors.text }]}>{t('video.comments')} ({comments.length})</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color={colors.text} /></TouchableOpacity>
          </View>
          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
          ) : comments.length === 0 ? (
            <View style={styles.noComments}>
              <Ionicons name="chatbubble-outline" size={40} color={colors.textTertiary} />
              <Text style={[styles.noCommentsText, { color: colors.textSecondary }]}>{t('video.noComments', 'No comments yet. Be the first!')}</Text>
            </View>
          ) : (
            <FlatList data={comments} keyExtractor={(item) => item._id} style={{ flex: 1 }}
              renderItem={({ item }) => (
                <View>
                  {renderComment(item)}
                  {item.replies && item.replies.length > 0 && (
                    <View>
                      <TouchableOpacity
                        onPress={() => { const n = new Set(expandedReplies); n.has(item._id) ? n.delete(item._id) : n.add(item._id); setExpandedReplies(n); }}
                        style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 54, paddingVertical: 6, gap: 8 }}
                      >
                        <View style={{ width: 24, height: 1, backgroundColor: colors.textTertiary }} />
                        <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textTertiary }}>
                          {expandedReplies.has(item._id)
                            ? t('video.hideReplies', 'Hide replies')
                            : `${t('video.viewReplies', 'View')} ${item.replies.length} ${t('video.replies', 'replies')}`}
                        </Text>
                      </TouchableOpacity>
                      {expandedReplies.has(item._id) && item.replies.map((r: any) => renderComment(r, true, item._id))}
                    </View>
                  )}
                </View>
              )}
            />
          )}
          {replyTo && (
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: 6, backgroundColor: colors.surface, borderTopWidth: 0.5, borderTopColor: colors.border }}>
              <Text style={{ flex: 1, fontSize: 12, color: colors.textSecondary }}>{t('video.replyingTo', 'Replying to')} @{replyTo.userId?.displayName}</Text>
              <TouchableOpacity onPress={() => { setReplyTo(null); setNewComment(''); }}>
                <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>
          )}
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            {showEmoji && (
              <EmojiPicker
                colors={colors}
                onSelect={(emoji) => setNewComment(prev => prev + emoji)}
              />
            )}
            <View style={[styles.commentInputRow, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
              <TouchableOpacity
                onPress={() => setShowEmoji(prev => !prev)}
                style={styles.emojiToggle}
              >
                <Ionicons name={showEmoji ? 'close-circle-outline' : 'happy-outline'} size={22} color={colors.textSecondary} />
              </TouchableOpacity>
              <TextInput ref={inputRef} style={[styles.commentInput, { color: colors.text }]}
                placeholder={replyTo ? t('video.addReply', 'Add a reply...') : t('video.addComment', 'Add a comment...')}
                placeholderTextColor={colors.textTertiary} value={newComment} onChangeText={setNewComment}
                onFocus={() => setShowEmoji(false)} multiline />
              <TouchableOpacity onPress={handlePost} disabled={posting || !newComment.trim()} style={[styles.sendButton, { opacity: newComment.trim() ? 1 : 0.4 }]}>
                {posting ? <ActivityIndicator color={colors.primary} size="small" /> : <Ionicons name="send" size={20} color={colors.primary} />}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </View>
    </Modal>
  );
}

// ============ VIDEO ITEM ============
function VideoItem({ item, isActive, isFocused, onCommentPress, onTeacherPress, globalMuted, onToggleMute }: { item: VideoType; isActive: boolean; isFocused: boolean; onCommentPress: (id: string) => void; onTeacherPress: (id: string) => void; globalMuted: boolean; onToggleMute: () => void }) {
  const [coffeeVisible, setCoffeeVisible] = useState(false);
  const videoRef = useRef<Video>(null);
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { updateVideoStats } = useVideoStore();
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [following, setFollowing] = useState(false);
  const [paused, setPaused] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [muteIndicatorOpacity] = useState(new RNAnimated.Value(0));
  const heartScale = useRef(new RNAnimated.Value(1)).current;

  useEffect(() => {
    if (isActive && isFocused && videoRef.current) {
      videoRef.current.playAsync();
      setPaused(false);
    } else if (videoRef.current) {
      videoRef.current.pauseAsync();
    }
  }, [isActive, isFocused]);

  // Inject CSS override for video element on web
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const styleId = 'video-fix-css';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        video {
          width: 100% !important;
          height: 100% !important;
          position: relative !important;
          object-fit: contain !important;
          left: auto !important;
          top: auto !important;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setPositionMs(status.positionMillis || 0);
      setDurationMs(status.durationMillis || 0);
    }
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = durationMs > 0 ? positionMs / durationMs : 0;

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
    } catch { }
  };

  const handleSave = async () => {
    try {
      const res = await videosAPI.toggleSave(item._id);
      setSaved(res.data.saved);
      updateVideoStats(item._id, {
        savesCount: item.savesCount + (res.data.saved ? 1 : -1),
      });
    } catch { }
  };

  const handleFollow = async () => {
    try {
      const res = await usersAPI.toggleFollow(item.teacherId._id);
      setFollowing(res.data.followed);
    } catch (e) {
      console.error('Follow error:', e);
    }
  };

  const handleShare = async () => {
    try {
      if (Platform.OS === 'web') {
        if (navigator.share) {
          await navigator.share({ title: item.title, text: `Check out "${item.title}" on QUELIO!`, url: window.location.href });
        } else {
          await navigator.clipboard.writeText(`Check out "${item.title}" on QUELIO! ${window.location.href}`);
          window.alert('Link copied to clipboard! 📋');
        }
      } else {
        await Share.share({ message: `Check out "${item.title}" on QUELIO!`, title: item.title });
      }
    } catch { }
  };

  const lastTap = useRef(0);
  const doubleTapHeart = useRef(new RNAnimated.Value(0)).current;

  const handleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      if (!liked) handleLike();
      doubleTapHeart.setValue(1);
      RNAnimated.sequence([
        RNAnimated.delay(400),
        RNAnimated.timing(doubleTapHeart, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    } else {
      setTimeout(() => {
        if (Date.now() - lastTap.current >= 300) {
          toggleMute();
        }
      }, 300);
    }
    lastTap.current = now;
  };

  const toggleMute = () => {
    onToggleMute();
    muteIndicatorOpacity.setValue(1);
    RNAnimated.timing(muteIndicatorOpacity, { toValue: 0, duration: 800, delay: 400, useNativeDriver: true }).start();
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
    <TouchableOpacity activeOpacity={1} onPress={handleTap} style={styles.videoContainer}>
      {/* Double-tap heart overlay */}
      <RNAnimated.View
        pointerEvents="none"
        style={[styles.doubleTapHeart, { opacity: doubleTapHeart, transform: [{ scale: doubleTapHeart.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }] }]}
      >
        <Ionicons name="heart" size={100} color="#FF2D55" />
      </RNAnimated.View>

      {/* Mute indicator */}
      <RNAnimated.View pointerEvents="none" style={[styles.muteIndicator, { opacity: muteIndicatorOpacity }]}>
        <View style={styles.muteIconBg}>
          <Ionicons name={globalMuted ? 'volume-mute' : 'volume-high'} size={32} color="#FFF" />
        </View>
      </RNAnimated.View>

      <Video
        ref={videoRef}
        source={{ uri: item.videoUrl }}
        style={styles.video}
        resizeMode={ResizeMode.CONTAIN}
        isLooping
        shouldPlay={isActive}
        isMuted={globalMuted}
        onPlaybackStatusUpdate={onPlaybackStatusUpdate}
        progressUpdateIntervalMillis={250}
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
            <Ionicons
              name={liked ? 'heart' : 'heart-outline'}
              size={30}
              color={liked ? '#FF2D55' : '#FFF'}
            />
          </RNAnimated.View>
          <Text style={styles.actionCount}>{formatCount(item.likesCount)}</Text>
        </TouchableOpacity>

        {/* Comment */}
        <TouchableOpacity style={styles.actionButton} onPress={() => onCommentPress(item._id)}>
          <Ionicons name="chatbubble-ellipses-outline" size={28} color="#FFF" />
          <Text style={styles.actionCount}>{formatCount(item.commentsCount)}</Text>
        </TouchableOpacity>

        {/* Save */}
        <TouchableOpacity style={styles.actionButton} onPress={handleSave}>
          <Ionicons
            name={saved ? 'bookmark' : 'bookmark-outline'}
            size={28}
            color={saved ? '#FFD700' : '#FFF'}
          />
          <Text style={styles.actionCount}>{formatCount(item.savesCount)}</Text>
        </TouchableOpacity>

        {/* Share */}
        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
          <Ionicons name="paper-plane-outline" size={26} color="#FFF" />
          <Text style={styles.actionCount}>{formatCount(item.sharesCount || 0)}</Text>
        </TouchableOpacity>

        {/* Coffee */}
        <TouchableOpacity style={styles.actionButton} onPress={() => setCoffeeVisible(true)}>
          <Ionicons name="cafe-outline" size={26} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Coffee Modal */}
      <CoffeeModal
        visible={coffeeVisible}
        teacherId={typeof item.teacherId === 'string' ? item.teacherId : item.teacherId?._id}
        teacherName={item.teacherId?.displayName || 'Creator'}
        onClose={() => setCoffeeVisible(false)}
      />

      {/* Bottom info */}
      <View style={styles.videoInfo}>
        <View style={styles.teacherRow}>
          <TouchableOpacity onPress={() => onTeacherPress(item.teacherId._id)}>
            <Text style={styles.teacherName}>@{item.teacherId.displayName}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.followButton, following && styles.followingButton]}
            onPress={handleFollow}
          >
            <Text style={[styles.followText, following && styles.followingText]}>
              {following ? t('video.following') : t('video.follow')}
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.videoTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.videoDesc} numberOfLines={1}>{item.description}</Text>
        <View style={styles.categoryTag}>
          <Text style={styles.categoryText}>
            {CategoryConfig[item.category]?.icon || '📚'} {item.category}
          </Text>
        </View>

        {/* Progress bar + Play/Pause + Time */}
        <View style={styles.progressRow}>
          <TouchableOpacity onPress={togglePause} style={styles.playPauseBtn}>
            <Ionicons name={paused ? 'play' : 'pause'} size={16} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.progressTime}>
            {formatTime(positionMs)} / {formatTime(durationMs)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ============ FEED SCREEN ============
export default function FeedScreen() {
  const { t } = useTranslation();
  const { feedVideos, setFeedVideos, appendFeedVideos, isLoadingFeed, setLoadingFeed, feedPage, setFeedPage, hasMoreFeed, setHasMoreFeed } = useVideoStore();
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [commentsVideoId, setCommentsVideoId] = useState<string | null>(null);
  const [teacherProfileId, setTeacherProfileId] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(true);
  const [globalMuted, setGlobalMuted] = useState(false);

  const handleToggleMute = useCallback(() => {
    setGlobalMuted(prev => !prev);
  }, []);

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      return () => setIsFocused(false);
    }, [])
  );

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
        <TouchableOpacity style={styles.searchBtn} onPress={() => router.push('/discover')}>
          <Ionicons name="search" size={22} color="#FFF" />
        </TouchableOpacity>
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
            <VideoItem
              item={item}
              isActive={index === currentIndex}
              isFocused={isFocused}
              onCommentPress={(id) => setCommentsVideoId(id)}
              onTeacherPress={(id) => setTeacherProfileId(id)}
              globalMuted={globalMuted}
              onToggleMute={handleToggleMute}
            />
          )}
          keyExtractor={(item) => item._id}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          snapToInterval={VIDEO_HEIGHT}
          snapToAlignment="start"
          decelerationRate="fast"
          getItemLayout={(_, index) => ({ length: VIDEO_HEIGHT, offset: VIDEO_HEIGHT * index, index })}
          maxToRenderPerBatch={2}
          windowSize={3}
          removeClippedSubviews={Platform.OS !== 'web'}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ itemVisiblePercentThreshold: 80 }}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListFooterComponent={isLoadingFeed ? <ActivityIndicator color="#FFF" style={{ padding: 20 }} /> : null}
        />
      )}

      {/* Comments modal */}
      {commentsVideoId && (
        <CommentsModal
          visible={!!commentsVideoId}
          videoId={commentsVideoId}
          onClose={() => setCommentsVideoId(null)}
        />
      )}

      {/* Teacher profile modal */}
      {teacherProfileId && (
        <TeacherProfileModal
          visible={!!teacherProfileId}
          teacherId={teacherProfileId}
          onClose={() => setTeacherProfileId(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: { flex: 1, backgroundColor: '#000' },
  header: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 55 : 35, paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  headerTitle: { color: '#FFF', fontSize: Typography.sizes.xl, fontWeight: '700' },
  searchBtn: {
    position: 'absolute', right: Spacing.lg,
    top: Platform.OS === 'ios' ? 55 : 35,
    padding: Spacing.xs,
  },
  videoContainer: {
    width: VIDEO_WIDTH,
    height: VIDEO_HEIGHT,
    backgroundColor: '#000',
    alignSelf: 'center' as const,
    overflow: 'hidden' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  video: {
    ...(Platform.OS === 'web'
      ? { width: '100%', height: '100%' }
      : { flex: 1 }),
  },
  bottomOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 250,
  },
  actionsColumn: {
    position: 'absolute', right: Spacing.md, bottom: 60,
    alignItems: 'center', gap: Spacing.xl,
  },
  avatarContainer: { marginBottom: Spacing.sm },
  avatar: {
    width: 48, height: 48, borderRadius: Radius.full,
    backgroundColor: '#FF2D78', justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#FFF',
  },
  avatarText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  actionButton: { alignItems: 'center', gap: 2 },
  actionIcon: { fontSize: 28 },
  actionCount: { color: '#FFF', fontSize: 11, fontWeight: '600' },
  liked: {},
  videoInfo: {
    position: 'absolute', bottom: 40, left: Spacing.lg, right: 80,
  },
  teacherRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xs },
  teacherName: { color: '#FFF', fontSize: Typography.sizes.lg, fontWeight: '700' },
  followButton: {
    borderWidth: 1, borderColor: '#FFF', borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md, paddingVertical: 2,
  },
  followText: { color: '#FFF', fontSize: Typography.sizes.xs, fontWeight: '600' },
  followingButton: { backgroundColor: 'rgba(255,255,255,0.2)', borderColor: 'transparent' },
  followingText: { color: 'rgba(255,255,255,0.7)' },
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
  // Comments modal styles
  doubleTapHeart: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center', alignItems: 'center', zIndex: 10,
  },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  commentsContainer: {
    height: '60%', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingTop: Spacing.md,
  },
  commentsHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingBottom: Spacing.md,
    borderBottomWidth: 0.5, borderBottomColor: 'rgba(128,128,128,0.3)',
  },
  commentsTitle: { fontSize: Typography.sizes.lg, fontWeight: '700' },
  noComments: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.md },
  noCommentsText: { fontSize: Typography.sizes.md },
  commentItem: {
    flexDirection: 'row', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    gap: Spacing.md, borderBottomWidth: 0.5,
  },
  commentAvatar: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
  },
  commentAvatarText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  commentHeader: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center', marginBottom: 2 },
  commentUser: { fontSize: Typography.sizes.sm, fontWeight: '700' },
  commentTime: { fontSize: Typography.sizes.xs },
  commentText: { fontSize: Typography.sizes.md, lineHeight: 20 },
  commentInputRow: {
    flexDirection: 'row', alignItems: 'center', padding: Spacing.md,
    gap: Spacing.sm, borderTopWidth: 0.5,
  },
  commentInput: { flex: 1, fontSize: Typography.sizes.md, maxHeight: 80, paddingVertical: Spacing.sm },
  sendButton: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  emojiToggle: { paddingHorizontal: Spacing.xs, paddingVertical: Spacing.sm },
  sendText: { fontSize: Typography.sizes.md, fontWeight: '700' },
  // Progress bar
  progressContainer: {
    position: 'absolute', bottom: 70, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 6,
    zIndex: 5,
  },
  progressRow: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: Spacing.md,
    paddingRight: 60,
  },
  playPauseBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center', marginRight: 8,
  },
  progressBarBg: {
    flex: 1, height: 3, backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2, overflow: 'hidden' as const,
  },
  progressBarFill: {
    height: '100%', backgroundColor: '#FFF', borderRadius: 2,
  },
  progressTime: {
    color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: '600',
    marginLeft: 8, minWidth: 70, textAlign: 'right' as const,
  },
  // Mute indicator
  muteIndicator: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center', alignItems: 'center', zIndex: 9,
  },
  muteIconBg: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center',
  },
});
