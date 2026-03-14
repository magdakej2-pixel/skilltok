import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, Platform, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Colors, Spacing, Typography, Radius, CategoryConfig } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';
import { searchAPI } from '@/services/api';
import TeacherProfileModal from '@/components/TeacherProfileModal';

const CATEGORIES = Object.keys(CategoryConfig);

export default function DiscoverScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [videoResults, setVideoResults] = useState<any[]>([]);
  const [userResults, setUserResults] = useState<any[]>([]);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Profile modal
  const [profileUserId, setProfileUserId] = useState<string | null>(null);

  const fetchResults = useCallback(async () => {
    const q = query.trim();

    // Tag search mode
    if (activeTag) {
      setLoading(true);
      try {
        const res = await searchAPI.searchByTag(activeTag, 1);
        setVideoResults(res.data.videos || []);
        setUserResults([]);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!q && !selectedCategory) {
      setVideoResults([]);
      setUserResults([]);
      return;
    }

    setLoading(true);
    try {
      // Search both videos and users in parallel
      const [videoRes, userRes] = await Promise.all([
        searchAPI.search(q || undefined, selectedCategory || undefined, 1),
        q ? searchAPI.searchUsers(q, 1) : Promise.resolve({ data: { users: [] } }),
      ]);
      setVideoResults(videoRes.data.videos || []);
      setUserResults(userRes.data.users || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [query, selectedCategory, activeTag]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchResults();
    }, 400);
    return () => clearTimeout(timer);
  }, [query, selectedCategory, activeTag]);

  const handleCategoryPress = (key: string) => {
    setActiveTag(null);
    setSelectedCategory(prev => (prev === key ? null : key));
  };

  const handleTagPress = (tag: string) => {
    setQuery('');
    setSelectedCategory(null);
    setActiveTag(prev => (prev === tag ? null : tag));
  };

  const clearTag = () => {
    setActiveTag(null);
    setVideoResults([]);
  };

  const formatCount = (n: number) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
  };

  const hasQuery = !!query.trim() || !!selectedCategory || !!activeTag;
  const hasAnyResults = videoResults.length > 0 || userResults.length > 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? 60 : 40 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search" size={18} color={colors.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text, outlineStyle: 'none' } as any]}
            placeholder="Szukaj użytkowników, filmów..."
            placeholderTextColor={colors.textTertiary}
            value={query}
            onChangeText={(text) => {
              setActiveTag(null);
              setQuery(text);
            }}
            autoFocus
            returnKeyType="search"
          />
          {(query.length > 0 || activeTag) && (
            <TouchableOpacity onPress={() => { setQuery(''); clearTag(); }}>
              <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Active tag indicator */}
      {activeTag && (
        <View style={[styles.activeTagBar, { backgroundColor: colors.primary + '15' }]}>
          <Text style={[styles.activeTagLabel, { color: colors.primary }]}>
            Filmy z tagiem: <Text style={{ fontWeight: '800' }}>#{activeTag}</Text>
          </Text>
          <TouchableOpacity onPress={clearTag}>
            <Ionicons name="close" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Category chips (hide when in tag mode) */}
      {!activeTag && (
        <View style={styles.chipsContainer}>
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isActive ? colors.primary + '20' : colors.surface,
                    borderColor: isActive ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => handleCategoryPress(cat)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipLabel, { color: isActive ? colors.primary : colors.textSecondary }]}>
                  {cat.length <= 2 ? cat.toUpperCase() : cat.charAt(0).toUpperCase() + cat.slice(1).replace('-', ' ')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Results — single combined list */}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : hasQuery && hasAnyResults ? (
        <ScrollView contentContainerStyle={styles.resultsList}>
          {/* ─── User results section ─── */}
          {userResults.length > 0 && (
            <View>
              <View style={styles.sectionHeader}>
                <Ionicons name="people" size={16} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Użytkownicy ({userResults.length})
                </Text>
              </View>
              {userResults.map((item) => (
                <TouchableOpacity
                  key={item._id}
                  style={[styles.userItem, { backgroundColor: colors.surface }]}
                  onPress={() => setProfileUserId(item._id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.userAvatar, { backgroundColor: colors.primary }]}>
                    {item.avatarUrl ? (
                      <Image source={{ uri: item.avatarUrl }} style={styles.userAvatarImg} />
                    ) : (
                      <Text style={styles.userAvatarLetter}>
                        {item.displayName?.charAt(0)?.toUpperCase() || '?'}
                      </Text>
                    )}
                  </View>
                  <View style={styles.userInfo}>
                    <View style={styles.userNameRow}>
                      <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
                        {item.displayName}
                      </Text>
                      {item.isVerified && (
                        <Ionicons name="checkmark-circle" size={14} color={colors.primary} style={{ marginLeft: 4 }} />
                      )}
                    </View>
                    <Text style={[styles.userRole, { color: colors.textSecondary }]}>
                      {item.role === 'teacher' ? '🎓 Ekspert' : '📚 Student'}
                      {item.expertiseCategory ? ` · ${item.expertiseCategory}` : ''}
                    </Text>
                    <Text style={[styles.userStats, { color: colors.textTertiary }]}>
                      {formatCount(item.followersCount || 0)} obserwujących · {formatCount(item.videosCount || 0)} filmów
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* ─── Video results section ─── */}
          {videoResults.length > 0 && (
            <View style={userResults.length > 0 ? { marginTop: Spacing.md } : undefined}>
              <View style={styles.sectionHeader}>
                <Ionicons name="play-circle" size={16} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Filmy ({videoResults.length})
                </Text>
              </View>
              {videoResults.map((item) => (
                <View key={item._id} style={[styles.videoItem, { backgroundColor: colors.surface }]}>
                  <View style={styles.videoInfo}>
                    <Text style={[styles.videoTitle, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
                    <TouchableOpacity onPress={() => item.teacherId?._id && setProfileUserId(item.teacherId._id)}>
                      <Text style={[styles.videoMeta, { color: colors.textTertiary }]}>
                        {item.teacherId?.displayName || ''} • ▶ {item.viewsCount || 0}
                      </Text>
                    </TouchableOpacity>
                    {/* Tag chips */}
                    {item.tags && item.tags.length > 0 && (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagRow}>
                        {item.tags.map((tag: string) => (
                          <TouchableOpacity
                            key={tag}
                            style={[
                              styles.tagChip,
                              {
                                backgroundColor: activeTag === tag ? colors.primary + '25' : colors.surfaceElevated,
                                borderColor: activeTag === tag ? colors.primary : colors.border,
                              },
                            ]}
                            onPress={() => handleTagPress(tag)}
                          >
                            <Text style={[
                              styles.tagText,
                              { color: activeTag === tag ? colors.primary : colors.textSecondary },
                            ]}>
                              #{tag}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      ) : hasQuery ? (
        <View style={styles.empty}>
          <Ionicons name="search-outline" size={48} color={colors.textTertiary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Brak wyników
          </Text>
        </View>
      ) : (
        <View style={styles.empty}>
          <Ionicons name="search-outline" size={48} color={colors.textTertiary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Wyszukaj użytkowników, filmy lub wybierz kategorię
          </Text>
        </View>
      )}

      {/* User profile modal */}
      {profileUserId && (
        <TeacherProfileModal
          visible={!!profileUserId}
          teacherId={profileUserId}
          onClose={() => setProfileUserId(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  backBtn: { padding: Spacing.xs },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.xl,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.sizes.md,
    paddingVertical: Spacing.xs,
  },
  // Active tag bar
  activeTagBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.xs,
    borderRadius: Radius.lg,
  },
  activeTagLabel: { fontSize: 13, fontWeight: '600' },
  // Category chips
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    gap: 8,
  },
  chip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: Spacing.sm,
  },
  chipLabel: { fontSize: 13, fontWeight: '600' },
  // Results
  resultsList: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: 40 },
  // Section headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.sm,
    paddingVertical: 4,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700' },
  // User items
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  userAvatar: {
    width: 48, height: 48, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden',
  },
  userAvatarImg: { width: 48, height: 48, borderRadius: 24 },
  userAvatarLetter: { color: '#FFF', fontSize: 20, fontWeight: '800' },
  userInfo: { flex: 1 },
  userNameRow: { flexDirection: 'row', alignItems: 'center' },
  userName: { fontSize: Typography.sizes.md, fontWeight: '700' },
  userRole: { fontSize: 12, marginTop: 2 },
  userStats: { fontSize: 11, marginTop: 2 },
  // Video items
  videoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  videoInfo: { flex: 1 },
  videoTitle: { fontSize: Typography.sizes.md, fontWeight: '600' },
  videoMeta: { fontSize: Typography.sizes.sm, marginTop: 2 },
  // Tag chips on video items
  tagRow: { marginTop: 6, flexDirection: 'row' },
  tagChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 6,
  },
  tagText: { fontSize: 11, fontWeight: '600' },
  // Empty state
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: Typography.sizes.md, fontWeight: '500', textAlign: 'center',
    paddingHorizontal: Spacing.xxxl,
  },
});
