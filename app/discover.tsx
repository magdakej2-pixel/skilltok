import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  FlatList, ActivityIndicator, Dimensions, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Colors, Spacing, Typography, Radius, CategoryConfig } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';
import { searchAPI } from '@/services/api';

const CATEGORIES = Object.keys(CategoryConfig);

export default function DiscoverScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchResults = useCallback(async () => {
    if (!query.trim() && !selectedCategory) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await searchAPI.search(
        query.trim() || undefined,
        selectedCategory || undefined,
        1,
      );
      setResults(res.data.videos || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [query, selectedCategory]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchResults();
    }, 400);
    return () => clearTimeout(timer);
  }, [query, selectedCategory]);

  const handleCategoryPress = (key: string) => {
    setSelectedCategory(prev => (prev === key ? null : key));
  };

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
            placeholder="Szukaj..."
            placeholderTextColor={colors.textTertiary}
            value={query}
            onChangeText={setQuery}
            autoFocus
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category chips */}
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

      {/* Results */}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : results.length > 0 ? (
        <FlatList
          data={results}
          keyExtractor={(item, i) => item._id || i.toString()}
          contentContainerStyle={styles.resultsList}
          renderItem={({ item }) => (
            <View style={[styles.resultItem, { backgroundColor: colors.surface }]}>
              <View style={styles.resultInfo}>
                <Text style={[styles.resultTitle, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
                <Text style={[styles.resultMeta, { color: colors.textTertiary }]}>
                  {item.teacherId?.displayName || ''} • ▶ {item.viewsCount || 0}
                </Text>
              </View>
            </View>
          )}
        />
      ) : (
        <View style={styles.empty}>
          <Ionicons name="search-outline" size={48} color={colors.textTertiary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {query || selectedCategory ? 'Brak wyników' : 'Wyszukaj filmy lub wybierz kategorię'}
          </Text>
        </View>
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
  chipIcon: { display: 'none' },
  chipLabel: { fontSize: 13, fontWeight: '600' },
  resultsList: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, gap: Spacing.sm },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  resultInfo: { flex: 1 },
  resultTitle: { fontSize: Typography.sizes.md, fontWeight: '600' },
  resultMeta: { fontSize: Typography.sizes.sm, marginTop: 2 },
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
