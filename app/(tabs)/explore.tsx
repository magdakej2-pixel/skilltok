import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, FlatList, ActivityIndicator, Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors, Spacing, Typography, Radius, CategoryConfig } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';
import { categoriesAPI, searchAPI } from '@/services/api';

export default function ExploreScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  const [categories, setCategories] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const res = await categoriesAPI.getAll();
      setCategories(res.data.categories);
    } catch {}
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await searchAPI.search(query, selectedCategory || undefined);
      setSearchResults(res.data.videos);
    } catch {}
    setSearching(false);
  };

  const handleCategoryPress = async (slug: string) => {
    setSelectedCategory(slug === selectedCategory ? null : slug);
    if (slug !== selectedCategory) {
      setSearching(true);
      try {
        const res = await searchAPI.search(searchQuery || undefined, slug);
        setSearchResults(res.data.videos);
      } catch {}
      setSearching(false);
    } else {
      setSearchResults([]);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.text }]}>{t('explore.title')}</Text>
      </View>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={[styles.searchInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
          placeholder={t('explore.searchPlaceholder')}
          placeholderTextColor={colors.textTertiary}
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Category grid */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('explore.categories')}</Text>
        <View style={styles.categoryGrid}>
          {categories.map((cat) => {
            const config = CategoryConfig[cat.slug] || { icon: '📚', color: '#6C5CE7' };
            const isSelected = selectedCategory === cat.slug;
            return (
              <TouchableOpacity
                key={cat._id}
                style={[
                  styles.categoryCard,
                  { backgroundColor: isSelected ? config.color : colors.surface },
                ]}
                onPress={() => handleCategoryPress(cat.slug)}
                activeOpacity={0.7}
              >
                <Text style={styles.categoryIcon}>{config.icon}</Text>
                <Text
                  style={[styles.categoryName, { color: isSelected ? '#FFF' : colors.text }]}
                  numberOfLines={1}
                >
                  {t(`categories.${cat.slug}`, cat.name)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Search results */}
        {searching && <ActivityIndicator color={colors.primary} style={{ marginTop: Spacing.xl }} />}
        
        {searchResults.length > 0 && (
          <View style={styles.resultsSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {searchResults.length} {t('search.results')}
            </Text>
            {searchResults.map((video: any) => (
              <TouchableOpacity key={video._id} style={[styles.resultItem, { backgroundColor: colors.surface }]}>
                <View style={[styles.thumbnail, { backgroundColor: colors.surfaceElevated }]}>
                  <Text style={styles.thumbIcon}>▶️</Text>
                </View>
                <View style={styles.resultInfo}>
                  <Text style={[styles.resultTitle, { color: colors.text }]} numberOfLines={2}>
                    {video.title}
                  </Text>
                  <Text style={[styles.resultMeta, { color: colors.textSecondary }]}>
                    {video.teacherId?.displayName} · {video.viewsCount} {t('video.views')}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingHorizontal: Spacing.xl, paddingBottom: Spacing.md },
  title: { fontSize: Typography.sizes.xxl, fontWeight: '800' },
  searchContainer: { paddingHorizontal: Spacing.xl, marginBottom: Spacing.lg },
  searchInput: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderRadius: Radius.lg, borderWidth: 1, fontSize: Typography.sizes.md,
  },
  sectionTitle: { fontSize: Typography.sizes.xl, fontWeight: '700', paddingHorizontal: Spacing.xl, marginBottom: Spacing.md, marginTop: Spacing.md },
  categoryGrid: {
    flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  categoryCard: {
    width: '30%', flexGrow: 1, padding: Spacing.lg, borderRadius: Radius.lg,
    alignItems: 'center', minWidth: 100,
  },
  categoryIcon: { fontSize: 28, marginBottom: Spacing.xs },
  categoryName: { fontSize: Typography.sizes.sm, fontWeight: '600', textAlign: 'center' },
  resultsSection: { marginTop: Spacing.lg, paddingBottom: Spacing.xxxl },
  resultItem: {
    flexDirection: 'row', marginHorizontal: Spacing.xl, marginBottom: Spacing.sm,
    borderRadius: Radius.lg, padding: Spacing.sm, gap: Spacing.md,
  },
  thumbnail: {
    width: 80, height: 56, borderRadius: Radius.md,
    justifyContent: 'center', alignItems: 'center',
  },
  thumbIcon: { fontSize: 20 },
  resultInfo: { flex: 1, justifyContent: 'center' },
  resultTitle: { fontSize: Typography.sizes.md, fontWeight: '600', marginBottom: 2 },
  resultMeta: { fontSize: Typography.sizes.sm },
});
