import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Modal, Switch, Platform, Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { signOut } from 'firebase/auth';
import { auth } from '@/services/firebase';
import { useAuthStore } from '@/store';
import { authAPI } from '@/services/api';
import { Colors, Spacing, Typography, Radius, Languages } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';
import { changeLanguage } from '@/i18n';

const showAlert = (title: string, msg?: string) => {
  if (typeof window !== 'undefined') window.alert(msg ? `${title}: ${msg}` : title);
  else Alert.alert(title, msg);
};

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

type TabKey = 'settings' | 'privacy' | 'activity';

export default function SettingsModal({ visible, onClose }: SettingsModalProps) {
  const { t, i18n } = useTranslation();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const { user, setUser, logout: logoutStore } = useAuthStore();

  const [activeTab, setActiveTab] = useState<TabKey>('settings');

  // Toggles (local state — in real app these would be persisted)
  const [pushNotif, setPushNotif] = useState(true);
  const [emailNotif, setEmailNotif] = useState(false);
  const [darkMode, setDarkMode] = useState(colorScheme === 'dark');
  const [autoplay, setAutoplay] = useState(true);
  const [dataSaver, setDataSaver] = useState(false);
  const [privateAccount, setPrivateAccount] = useState(false);
  const [allowComments, setAllowComments] = useState(true);
  const [allowMessages, setAllowMessages] = useState(true);
  const [allowDuets, setAllowDuets] = useState(true);
  const [wifiOnly, setWifiOnly] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  const isTeacher = user?.role === 'teacher';
  const currentLang = Languages.find((l) => l.code === i18n.language) || Languages[0];

  const handleLanguageChange = async (langCode: string) => {
    setLangDropdownOpen(false);
    await changeLanguage(langCode);
    if (user) {
      try {
        const response = await authAPI.updateProfile({ language: langCode });
        setUser(response.data.user);
      } catch {}
    }
  };

  const handleLogout = async () => {
    console.log('Logout pressed');
    onClose(); // close modal first
    try {
      await signOut(auth);
      console.log('Firebase signOut complete');
    } catch (e) {
      console.error('Sign out error:', e);
    }
    logoutStore();
    console.log('Store cleared');
  };

  const GRAY = colors.textTertiary;

  const tabs: { key: TabKey; icon: string; label: string }[] = [
    { key: 'settings', icon: '⚙', label: t('settingsPanel.settings') },
    { key: 'privacy', icon: '⛨', label: t('settingsPanel.privacy') },
    { key: 'activity', icon: '▦', label: t('settingsPanel.activity') },
  ];

  // ─── Toggle row helper ───
  const ToggleRow = ({ icon, label, desc, value, onValueChange }: {
    icon: string; label: string; desc: string; value: boolean; onValueChange: (v: boolean) => void;
  }) => (
    <View style={[s.toggleRow, { borderBottomColor: colors.border }]}>
      <View style={s.toggleLeft}>
        <Text style={{ fontSize: 18, color: GRAY }}>{icon}</Text>
        <View style={s.toggleTexts}>
          <Text style={[s.toggleLabel, { color: colors.text }]}>{label}</Text>
          <Text style={[s.toggleDesc, { color: colors.textTertiary }]}>{desc}</Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.primary + '80' }}
        thumbColor={value ? colors.primary : colors.textTertiary}
      />
    </View>
  );

  // ─── Link row helper ───
  const LinkRow = ({ icon, label, value, onPress }: {
    icon: string; label: string; value?: string; onPress?: () => void;
  }) => (
    <TouchableOpacity
      style={[s.linkRow, { borderBottomColor: colors.border }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.6 : 1}
    >
      <View style={s.linkLeft}>
        <Text style={{ fontSize: 18, color: GRAY }}>{icon}</Text>
        <Text style={[s.linkLabel, { color: colors.text }]}>{label}</Text>
      </View>
      <View style={s.linkRight}>
        {value && <Text style={[s.linkValue, { color: colors.textSecondary }]}>{value}</Text>}
        {onPress && <Text style={{ color: colors.textTertiary, fontSize: 14 }}>›</Text>}
      </View>
    </TouchableOpacity>
  );

  // ─── Section header ───
  const SectionHeader = ({ title }: { title: string }) => (
    <Text style={[s.sectionHeader, { color: colors.textSecondary }]}>{title}</Text>
  );

  // ─── Stats card helper ───
  const StatCard = ({ icon, value, label }: { icon: string; value: number | string; label: string }) => (
    <View style={[s.statCard, { backgroundColor: colors.surfaceElevated }]}>
      <Text style={{ fontSize: 24 }}>{icon}</Text>
      <Text style={[s.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[s.statLabel, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );

  // ════════════════ SETTINGS TAB ════════════════
  const renderSettings = () => (
    <>
      {/* Account info */}
      <SectionHeader title={t('settingsPanel.account')} />
      <View style={[s.card, { backgroundColor: colors.surface }]}>
        <LinkRow icon="✉" label={t('settingsPanel.email')} value={user?.email} />
        <LinkRow icon="◉" label={t('settingsPanel.role')} value={isTeacher ? t('role.teacher') : t('role.student')} />
        <LinkRow icon="▣" label={t('settingsPanel.memberSince')} value={new Date((user as any)?.createdAt || Date.now()).toLocaleDateString()} />
      </View>

      {/* Notifications */}
      <SectionHeader title={t('settingsPanel.notifications')} />
      <View style={[s.card, { backgroundColor: colors.surface }]}>
        <ToggleRow icon="◈" label={t('settingsPanel.pushNotifications')} desc={t('settingsPanel.pushDesc')} value={pushNotif} onValueChange={setPushNotif} />
        <ToggleRow icon="▤" label={t('settingsPanel.emailNotifications')} desc={t('settingsPanel.emailDesc')} value={emailNotif} onValueChange={setEmailNotif} />
      </View>

      {/* Language */}
      <SectionHeader title={t('settingsPanel.languageRegion')} />
      <View style={[s.card, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          style={[s.linkRow, { borderBottomColor: colors.border }]}
          onPress={() => setLangDropdownOpen(!langDropdownOpen)}
        >
          <View style={s.linkLeft}>
            <Text style={{ fontSize: 18, color: GRAY }}>◎</Text>
            <Text style={[s.linkLabel, { color: colors.text }]}>{t('settings.language')}</Text>
          </View>
          <View style={s.linkRight}>
            <Text style={{ fontSize: 20 }}>{currentLang.flag}</Text>
            <Text style={[s.linkValue, { color: colors.textSecondary }]}>{currentLang.name}</Text>
            <Text style={{ fontSize: 12, color: colors.textTertiary }}>{langDropdownOpen ? '▲' : '▼'}</Text>
          </View>
        </TouchableOpacity>

        {langDropdownOpen && (
          <View style={s.langDropdown}>
            {Languages.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  s.langItem,
                  {
                    backgroundColor: i18n.language === lang.code ? colors.primary + '15' : 'transparent',
                    borderBottomColor: colors.border,
                  },
                ]}
                onPress={() => handleLanguageChange(lang.code)}
              >
                <Text style={{ fontSize: 24 }}>{lang.flag}</Text>
                <Text style={[s.langText, { color: colors.text }]}>{lang.name}</Text>
                {i18n.language === lang.code && (
                  <Text style={{ color: colors.primary, fontWeight: '700' }}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Appearance */}
      <SectionHeader title={t('settingsPanel.appearance')} />
      <View style={[s.card, { backgroundColor: colors.surface }]}>
        <ToggleRow icon="◑" label={t('settingsPanel.darkMode')} desc={t('settingsPanel.darkModeDesc')} value={darkMode} onValueChange={setDarkMode} />
        <ToggleRow icon="▷" label={t('settingsPanel.autoplay')} desc={t('settingsPanel.autoplayDesc')} value={autoplay} onValueChange={setAutoplay} />
        <ToggleRow icon="▥" label={t('settingsPanel.dataUsage')} desc={t('settingsPanel.dataUsageDesc')} value={dataSaver} onValueChange={setDataSaver} />
      </View>

      {/* About */}
      <SectionHeader title={t('settingsPanel.aboutApp')} />
      <View style={[s.card, { backgroundColor: colors.surface }]}>
        <LinkRow icon="◫" label={t('settingsPanel.appVersion')} value="1.0.0" />
        <LinkRow icon="▧" label={t('settingsPanel.termsOfService')} onPress={() => showAlert(t('settingsPanel.comingSoon'))} />
        <LinkRow icon="⊡" label={t('settingsPanel.privacyPolicy')} onPress={() => showAlert(t('settingsPanel.comingSoon'))} />
        <LinkRow icon="▢" label={t('settingsPanel.licenses')} onPress={() => showAlert(t('settingsPanel.comingSoon'))} />
      </View>

      {/* Logout */}
      <TouchableOpacity
        style={[s.logoutBtn, { backgroundColor: colors.error + '15' }]}
        onPress={handleLogout}
      >
        <Text style={[s.logoutText, { color: colors.error }]}>{t('auth.logout')}</Text>
      </TouchableOpacity>
    </>
  );

  // ════════════════ PRIVACY TAB ════════════════
  const renderPrivacy = () => (
    <>
      {/* Account privacy */}
      <SectionHeader title={t('settingsPanel.account')} />
      <View style={[s.card, { backgroundColor: colors.surface }]}>
        <ToggleRow icon="⊘" label={t('settingsPanel.privateAccount')} desc={t('settingsPanel.privateAccountDesc')} value={privateAccount} onValueChange={setPrivateAccount} />
      </View>

      {/* Interactions */}
      <SectionHeader title="Interactions" />
      <View style={[s.card, { backgroundColor: colors.surface }]}>
        <ToggleRow icon="▨" label={t('settingsPanel.allowComments')} desc={t('settingsPanel.allowCommentsDesc')} value={allowComments} onValueChange={setAllowComments} />
        <ToggleRow icon="✉" label={t('settingsPanel.allowMessages')} desc={t('settingsPanel.allowMessagesDesc')} value={allowMessages} onValueChange={setAllowMessages} />
        {isTeacher && (
          <ToggleRow icon="▩" label={t('settingsPanel.allowDuets')} desc={t('settingsPanel.allowDuetsDesc')} value={allowDuets} onValueChange={setAllowDuets} />
        )}
      </View>

      {/* Blocked users */}
      <SectionHeader title={t('settingsPanel.blockedUsers')} />
      <View style={[s.card, { backgroundColor: colors.surface }]}>
        <View style={s.emptyBlock}>
          <Text style={{ fontSize: 32, color: GRAY }}>⊘</Text>
          <Text style={[s.emptyText, { color: colors.textSecondary }]}>{t('settingsPanel.noBlockedUsers')}</Text>
        </View>
      </View>

      {/* Data & storage */}
      <SectionHeader title={t('settingsPanel.dataStorage')} />
      <View style={[s.card, { backgroundColor: colors.surface }]}>
        <LinkRow icon="◧" label={t('settingsPanel.cacheSize')} value="12.4 MB" />
        <LinkRow icon="⊟" label={t('settingsPanel.clearCache')} onPress={() => showAlert(t('settingsPanel.comingSoon'))} />
        <ToggleRow icon="▥" label={t('settingsPanel.downloadOverWifi')} desc={t('settingsPanel.downloadWifiDesc')} value={wifiOnly} onValueChange={setWifiOnly} />
      </View>
    </>
  );

  // ════════════════ ACTIVITY TAB ════════════════
  const renderActivity = () => (
    <>
      {/* Activity overview */}
      <SectionHeader title={t('settingsPanel.activity')} />
      <View style={s.statsGrid}>
        <StatCard icon="" value={(user as any)?.totalViewsCount || 0} label={t('settingsPanel.videosWatched')} />
        <StatCard icon="" value={(user as any)?.totalLikesGiven || 0} label={t('settingsPanel.videosLiked')} />
        <StatCard icon="" value={(user as any)?.totalCommentsPosted || 0} label={t('settingsPanel.commentsPosted')} />
        <StatCard icon="" value={(user as any)?.savedCount || 0} label={t('profile.saved')} />
      </View>

      {/* Content activity */}
      <SectionHeader title={t('settingsPanel.watchHistory')} />
      <View style={[s.card, { backgroundColor: colors.surface }]}>
        <LinkRow icon="▷" label={t('settingsPanel.watchHistory')} value={t('settingsPanel.comingSoon')} onPress={() => showAlert(t('settingsPanel.comingSoon'))} />
        <LinkRow icon="♡" label={t('settingsPanel.likedVideos')} value={t('settingsPanel.comingSoon')} onPress={() => showAlert(t('settingsPanel.comingSoon'))} />
        <LinkRow icon="▨" label={t('settingsPanel.commentedVideos')} value={t('settingsPanel.comingSoon')} onPress={() => showAlert(t('settingsPanel.comingSoon'))} />
      </View>

      {/* Login activity */}
      <SectionHeader title={t('settingsPanel.loginActivity')} />
      <View style={[s.card, { backgroundColor: colors.surface }]}>
        <LinkRow icon="●" label={t('settingsPanel.currentSession')} value="Web" />
        <LinkRow icon="◔" label={t('settingsPanel.lastLogin')} value={new Date().toLocaleDateString()} />
        <LinkRow icon="▣" label={t('settingsPanel.accountCreated')} value={new Date((user as any)?.createdAt || Date.now()).toLocaleDateString()} />
      </View>
    </>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={[s.container, { backgroundColor: colors.background }]}>
          {/* ── Header ── */}
          <View style={[s.header, { borderBottomColor: colors.border }]}>
            <Text style={[s.headerTitle, { color: colors.text }]}>{t('settingsPanel.title')}</Text>
            <TouchableOpacity onPress={onClose} style={s.closeBtn}>
              <Text style={{ fontSize: 22, color: colors.textSecondary }}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* ── Tab bar ── */}
          <View style={[s.tabBar, { borderBottomColor: colors.border }]}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[
                  s.tab,
                  activeTab === tab.key && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
                ]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text style={{ fontSize: 16, color: activeTab === tab.key ? colors.primary : GRAY }}>{tab.icon}</Text>
                <Text
                  style={[
                    s.tabLabel,
                    { color: activeTab === tab.key ? colors.primary : colors.textSecondary },
                    activeTab === tab.key && { fontWeight: '700' },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Content ── */}
          <ScrollView
            style={s.scrollContent}
            contentContainerStyle={s.scrollInner}
            showsVerticalScrollIndicator={false}
          >
            {activeTab === 'settings' && renderSettings()}
            {activeTab === 'privacy' && renderPrivacy()}
            {activeTab === 'activity' && renderActivity()}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ════════════════ STYLES ════════════════
const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    height: '92%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderBottomWidth: 0.5,
  },
  headerTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: '800',
  },
  closeBtn: {
    position: 'absolute',
    right: Spacing.xl,
    padding: Spacing.xs,
  },
  // Tab bar
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.xs,
  },
  tabLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
  },
  // Scroll
  scrollContent: {
    flex: 1,
  },
  scrollInner: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxxl,
  },
  // Sections
  sectionHeader: {
    fontSize: Typography.sizes.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  card: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  // Toggle row
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 0.5,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.md,
    marginRight: Spacing.md,
  },
  toggleTexts: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: Typography.sizes.md,
    fontWeight: '600',
  },
  toggleDesc: {
    fontSize: Typography.sizes.xs,
    marginTop: 2,
  },
  // Link row
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 0.5,
  },
  linkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  linkLabel: {
    fontSize: Typography.sizes.md,
    fontWeight: '600',
  },
  linkRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  linkValue: {
    fontSize: Typography.sizes.sm,
  },
  // Stats grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  statCard: {
    width: '47%',
    flexGrow: 1,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    alignItems: 'center',
    minWidth: 140,
  },
  statValue: {
    fontSize: Typography.sizes.xxl,
    fontWeight: '800',
    marginTop: Spacing.xs,
  },
  statLabel: {
    fontSize: Typography.sizes.xs,
    marginTop: 2,
    textAlign: 'center',
  },
  // Empty
  emptyBlock: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.sm,
  },
  emptyText: {
    fontSize: Typography.sizes.md,
  },
  // Lang dropdown
  langDropdown: {
    paddingHorizontal: Spacing.sm,
  },
  langItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 0.5,
    borderRadius: Radius.md,
  },
  langText: {
    flex: 1,
    fontSize: Typography.sizes.md,
    fontWeight: '600',
  },
  // Logout
  logoutBtn: {
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    alignItems: 'center',
    marginTop: Spacing.xxl,
  },
  logoutText: {
    fontSize: Typography.sizes.md,
    fontWeight: '700',
  },
});
