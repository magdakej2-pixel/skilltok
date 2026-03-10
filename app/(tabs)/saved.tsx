import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Platform, TextInput, KeyboardAvoidingView, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from 'expo-router';
import { messagesAPI } from '@/services/api';
import { Spacing, Typography, Radius } from '@/constants/theme';
import { useRoleColors } from '@/hooks/useRoleColors';
import { useAuthStore } from '@/store';

// ============ CHAT VIEW ============
function ChatView({
  conversation, userId, colors, t, onBack,
}: {
  conversation: any; userId: string; colors: any; t: any; onBack: () => void;
}) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const pollingRef = useRef<any>(null);

  const otherUser = conversation.participants?.find(
    (p: any) => p._id !== userId
  );

  const loadMessages = useCallback(async () => {
    try {
      const res = await messagesAPI.getMessages(conversation._id);
      setMessages(res.data.messages || []);
    } catch (e) {
      console.error('Load messages error:', e);
    }
    setLoading(false);
  }, [conversation._id]);

  useFocusEffect(
    useCallback(() => {
      loadMessages();
      // Poll for new messages every 3 seconds
      pollingRef.current = setInterval(loadMessages, 3000);
      return () => clearInterval(pollingRef.current);
    }, [loadMessages])
  );

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const res = await messagesAPI.sendMessage(conversation._id, text.trim());
      setMessages(prev => [...prev, res.data.message]);
      setText('');
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (e) {
      console.error('Send error:', e);
    }
    setSending(false);
  };

  const timeFormat = (date: string) => {
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={[styles.chatContainer, { backgroundColor: colors.background }]}>
      {/* Chat header */}
      <View style={[styles.chatHeader, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.chatHeaderInfo}>
          <View style={[styles.chatAvatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.chatAvatarText}>
              {otherUser?.displayName?.charAt(0) || '?'}
            </Text>
          </View>
          <View>
            <Text style={[styles.chatHeaderName, { color: colors.text }]}>
              {otherUser?.displayName || 'User'}
            </Text>
          </View>
        </View>
      </View>

      {/* Messages */}
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) => {
            const isMine = item.senderId?._id === userId || item.senderId === userId;
            return (
              <View style={[styles.messageBubbleRow, isMine && { justifyContent: 'flex-end' }]}>
                <View style={[
                  styles.messageBubble,
                  isMine
                    ? { backgroundColor: colors.primary, borderBottomRightRadius: 4 }
                    : { backgroundColor: colors.surface, borderBottomLeftRadius: 4 },
                ]}>
                  <Text style={[styles.messageText, { color: isMine ? '#fff' : colors.text }]}>
                    {item.text}
                  </Text>
                  <Text style={[styles.messageTime, { color: isMine ? 'rgba(255,255,255,0.6)' : colors.textTertiary }]}>
                    {timeFormat(item.createdAt)}
                  </Text>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Input */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.inputRow, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TextInput
            style={[styles.textInput, { color: colors.text }]}
            placeholder={t('messages.typeMessage')}
            placeholderTextColor={colors.textTertiary}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={2000}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!text.trim() || sending}
            style={[styles.sendBtn, { opacity: text.trim() ? 1 : 0.4 }]}
          >
            {sending ? (
              <ActivityIndicator color={colors.primary} size="small" />
            ) : (
              <Ionicons name="send" size={20} color={colors.primary} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ============ MESSAGES SCREEN ============
export default function MessagesScreen() {
  const { t } = useTranslation();
  const colors = useRoleColors();
  const { user } = useAuthStore();

  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeConversation, setActiveConversation] = useState<any>(null);

  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, [])
  );

  const loadConversations = async () => {
    setLoading(true);
    try {
      const res = await messagesAPI.getConversations();
      setConversations(res.data.conversations || []);
    } catch (e) {
      console.error('Load conversations error:', e);
    }
    setLoading(false);
  };

  const timeAgo = (date: string) => {
    if (!date) return '';
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  // Chat view
  if (activeConversation) {
    return (
      <ChatView
        conversation={activeConversation}
        userId={user?._id || ''}
        colors={colors}
        t={t}
        onBack={() => {
          setActiveConversation(null);
          loadConversations();
        }}
      />
    );
  }

  // Conversation list
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.text }]}>{t('messages.title')}</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : conversations.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="chatbubbles-outline" size={60} color={colors.textTertiary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {t('messages.noConversations')}
          </Text>
          <Text style={[styles.emptyHint, { color: colors.textTertiary }]}>
            {t('messages.startChat')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item._id}
          onRefresh={loadConversations}
          refreshing={loading}
          renderItem={({ item }) => {
            const otherUser = item.participants?.find(
              (p: any) => p._id !== user?._id
            );
            const unread = item.unreadCount?.[user?._id || ''] || 0;
            return (
              <TouchableOpacity
                style={[styles.convItem, { borderBottomColor: colors.border }]}
                onPress={() => setActiveConversation(item)}
                activeOpacity={0.6}
              >
                <View style={[styles.convAvatar, { backgroundColor: colors.primary }]}>
                  <Text style={styles.convAvatarText}>
                    {otherUser?.displayName?.charAt(0) || '?'}
                  </Text>
                </View>
                <View style={styles.convInfo}>
                  <View style={styles.convTop}>
                    <Text style={[styles.convName, { color: colors.text }]} numberOfLines={1}>
                      {otherUser?.displayName || 'User'}
                    </Text>
                    <Text style={[styles.convTime, { color: colors.textTertiary }]}>
                      {timeAgo(item.lastMessage?.createdAt || item.updatedAt)}
                    </Text>
                  </View>
                  <View style={styles.convBottom}>
                    <Text
                      style={[
                        styles.convPreview,
                        { color: unread > 0 ? colors.text : colors.textSecondary },
                        unread > 0 && { fontWeight: '700' },
                      ]}
                      numberOfLines={1}
                    >
                      {item.lastMessage?.senderId?.toString() === user?._id
                        ? `${t('messages.you')}: `
                        : ''}
                      {item.lastMessage?.text || ''}
                    </Text>
                    {unread > 0 && (
                      <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                        <Text style={styles.unreadText}>{unread}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  title: { fontSize: Typography.sizes.xxl, fontWeight: '800' },
  // Empty state
  emptyState: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    gap: Spacing.md, paddingHorizontal: Spacing.xxl,
  },
  emptyText: { fontSize: Typography.sizes.lg, fontWeight: '600' },
  emptyHint: { fontSize: Typography.sizes.md, textAlign: 'center' },
  // Conversation list
  convItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg,
    borderBottomWidth: 0.5, gap: Spacing.lg,
  },
  convAvatar: {
    width: 52, height: 52, borderRadius: 26,
    justifyContent: 'center', alignItems: 'center',
  },
  convAvatarText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  convInfo: { flex: 1 },
  convTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 4,
  },
  convName: { fontSize: Typography.sizes.md, fontWeight: '700', flex: 1 },
  convTime: { fontSize: Typography.sizes.xs, marginLeft: Spacing.sm },
  convBottom: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  convPreview: { fontSize: Typography.sizes.sm, flex: 1 },
  unreadBadge: {
    minWidth: 20, height: 20, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 6, marginLeft: Spacing.sm,
  },
  unreadText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  // Chat view
  chatContainer: { flex: 1 },
  chatHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: Spacing.md, paddingBottom: Spacing.md,
    borderBottomWidth: 0.5, gap: Spacing.sm,
  },
  backBtn: { padding: Spacing.xs },
  chatHeaderInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  chatAvatar: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
  },
  chatAvatarText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  chatHeaderName: { fontSize: Typography.sizes.lg, fontWeight: '700' },
  // Messages
  messagesList: {
    padding: Spacing.lg, gap: Spacing.sm,
    flexGrow: 1, justifyContent: 'flex-end',
  },
  messageBubbleRow: { flexDirection: 'row' },
  messageBubble: {
    maxWidth: '75%', paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm, borderRadius: Radius.xl,
  },
  messageText: { fontSize: Typography.sizes.md, lineHeight: 22 },
  messageTime: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  // Input
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderTopWidth: 0.5, gap: Spacing.sm,
  },
  textInput: {
    flex: 1, fontSize: Typography.sizes.md,
    maxHeight: 100, paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  sendBtn: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm },
});
