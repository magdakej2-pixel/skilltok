import React from 'react';
import { Tabs } from 'expo-router';
import { Text, View, StyleSheet, Platform } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuthStore } from '@/store';
import { useTranslation } from 'react-i18next';

type TabIconProps = { focused: boolean; color: string; emoji: string };

function TabIcon({ focused, color, emoji }: TabIconProps) {
  return (
    <View style={[styles.iconContainer, focused && styles.iconFocused]}>
      <Text style={[styles.iconEmoji, focused && styles.iconEmojiActive]}>{emoji}</Text>
    </View>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const isTeacher = user?.role === 'teacher';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.iconActive,
        tabBarInactiveTintColor: colors.icon,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: 0.5,
          height: Platform.OS === 'ios' ? 85 : 65,
          paddingBottom: Platform.OS === 'ios' ? 25 : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="feed"
        options={{
          title: t('feed.title'),
          tabBarIcon: ({ focused, color }) => <TabIcon focused={focused} color={color} emoji="🏠" />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: t('explore.title'),
          tabBarIcon: ({ focused, color }) => <TabIcon focused={focused} color={color} emoji="🔍" />,
        }}
      />
      <Tabs.Screen
        name="upload"
        options={{
          title: t('upload.title'),
          tabBarIcon: ({ focused, color }) => <TabIcon focused={focused} color={color} emoji="➕" />,
          // Hide upload tab for students
          href: isTeacher ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: t('profile.saved'),
          tabBarIcon: ({ focused, color }) => <TabIcon focused={focused} color={color} emoji="💾" />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('profile.settings'),
          tabBarIcon: ({ focused, color }) => <TabIcon focused={focused} color={color} emoji="👤" />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 28, height: 28, justifyContent: 'center', alignItems: 'center',
  },
  iconFocused: {},
  iconEmoji: { fontSize: 20, opacity: 0.6 },
  iconEmojiActive: { opacity: 1, fontSize: 22 },
});
