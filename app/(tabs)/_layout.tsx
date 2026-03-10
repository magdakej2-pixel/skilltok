import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Spacing } from '@/constants/theme';
import { useRoleColors } from '@/hooks/useRoleColors';
import { useAuthStore } from '@/store';
import { useTranslation } from 'react-i18next';

type TabIconProps = {
  focused: boolean;
  color: string;
  name: keyof typeof Ionicons.glyphMap;
  nameOutline: keyof typeof Ionicons.glyphMap;
};

function TabIcon({ focused, color, name, nameOutline }: TabIconProps) {
  return (
    <View style={styles.iconContainer}>
      <Ionicons
        name={focused ? name : nameOutline}
        size={focused ? 26 : 24}
        color={color}
      />
    </View>
  );
}

export default function TabLayout() {
  const colors = useRoleColors();
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const isTeacher = user?.role === 'teacher';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
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
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused} color={color} name="home" nameOutline="home-outline" />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Sklep',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused} color={color} name="bag" nameOutline="bag-outline" />
          ),
        }}
      />
      <Tabs.Screen
        name="upload"
        options={{
          title: t('upload.title'),
          tabBarIcon: ({ focused, color }) => (
            <View style={[styles.uploadButton, { backgroundColor: colors.primary }]}>
              <Ionicons name="add" size={22} color="#FFF" />
            </View>
          ),
          href: isTeacher ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: t('messages.title'),
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused} color={color} name="chatbubbles" nameOutline="chatbubbles-outline" />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('profile.title'),
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused} color={color} name="person" nameOutline="person-outline" />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 28, height: 28, justifyContent: 'center', alignItems: 'center',
  },
  uploadButton: {
    width: 36, height: 28, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center',
  },
});
