import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, Radius } from '@/constants/theme';

const EMOJI_CATEGORIES = [
  {
    name: '😊',
    emojis: ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','😊','😇','🥰','😍','🤩','😘','😗','😋','😛','😜','🤪','😝','🤑','🤗','🤭','😏','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🥵','🥶','🥴','😵','🤯','🤠','🥳','😎','🤓','🧐'],
  },
  {
    name: '👍',
    emojis: ['👍','👎','👊','✊','🤛','🤜','🤝','👏','🙌','👐','🤲','🙏','💪','🤟','🤘','👌','🤌','👈','👉','👆','👇','✌️','🤞','🫰','❤️','🧡','💛','💚','💙','💜','🖤','🤎','🤍','💯','💥','💫','⭐','🌟','✨','💢','💦','💨'],
  },
  {
    name: '🎉',
    emojis: ['🎉','🎊','🎈','🎂','🎁','🏆','🥇','🥈','🥉','⚽','🏀','🏈','🎯','🎮','🎵','🎶','🎤','🎧','🎸','🎹','🎺','🎻','🎬','📸','📱','💻','🖥️','⌨️','🖱️','💡','📚','📖','✏️','📝','📌','📍'],
  },
  {
    name: '🍕',
    emojis: ['🍕','🍔','🍟','🌭','🍿','🧂','🥚','🍳','🧇','🥞','🧈','🍞','🥐','🥖','🥨','🧀','🥗','🥙','🥪','🌮','🌯','🫔','🥘','🍝','🍜','🍲','🍛','🍣','🍱','🥟','🍦','🍧','🍨','🍩','🍪','🎂','🍰','🧁','🥧','🍫','🍬','🍭','🍮'],
  },
  {
    name: '🐱',
    emojis: ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🙈','🙉','🙊','🐔','🐧','🐦','🐤','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🪱','🐛','🦋','🐌','🐞','🐜','🪰','🪲','🪳'],
  },
];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  colors: any;
}

export default function EmojiPicker({ onSelect, colors }: EmojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState(0);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
      {/* Category tabs */}
      <View style={styles.categoryRow}>
        {EMOJI_CATEGORIES.map((cat, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => setActiveCategory(i)}
            style={[
              styles.categoryTab,
              i === activeCategory && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
            ]}
          >
            <Text style={styles.categoryIcon}>{cat.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {/* Emoji grid */}
      <ScrollView
        style={styles.grid}
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={false}
      >
        {EMOJI_CATEGORIES[activeCategory].emojis.map((emoji, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => onSelect(emoji)}
            style={styles.emojiBtn}
          >
            <Text style={styles.emoji}>{emoji}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 0.5,
    maxHeight: 220,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 4,
  },
  categoryTab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  categoryIcon: {
    fontSize: 20,
  },
  grid: {
    maxHeight: 170,
  },
  gridContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  emojiBtn: {
    width: '12.5%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 24,
  },
});
