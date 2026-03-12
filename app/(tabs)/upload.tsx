import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '@/services/firebase';
import { videosAPI, categoriesAPI } from '@/services/api';
import { useAuthStore } from '@/store';
import { Spacing, Typography, Radius, CategoryConfig } from '@/constants/theme';
import { useRoleColors } from '@/hooks/useRoleColors';
import { useColorScheme } from '@/components/useColorScheme';

const showAlert = (title: string, msg?: string) => {
  const text = msg ? `${title}: ${msg}` : title;
  if (typeof window !== 'undefined') window.alert(text);
  else Alert.alert(title, msg);
};

export default function UploadScreen() {
  const { t } = useTranslation();
  const colors = useRoleColors();
  const { user } = useAuthStore();

  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null); // Web only: raw File object
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const res = await categoriesAPI.getAll();
      setCategories(res.data.categories);
    } catch {}
  };

  const pickVideo = async () => {
    if (Platform.OS === 'web') {
      // Use native HTML file input on web
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'video/*';
      input.onchange = (e: any) => {
        const file = e.target?.files?.[0];
        if (file) {
          if (file.size > 50 * 1024 * 1024) {
            showAlert(t('common.error'), t('upload.maxSize'));
            return;
          }
          setVideoFile(file);
          setVideoUri(URL.createObjectURL(file));
        }
      };
      input.click();
      return;
    }

    // Native: use expo-image-picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 0.8,
      videoMaxDuration: 120,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > 50 * 1024 * 1024) {
        showAlert(t('common.error'), t('upload.maxSize'));
        return;
      }
      setVideoFile(null);
      setVideoUri(asset.uri);
    }
  };

  const handleUpload = async () => {
    if (!videoUri || !title.trim() || !category) {
      showAlert(t('common.error'), t('upload.fillRequired'));
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      let uploadBlob: Blob | File;

      if (Platform.OS === 'web' && videoFile) {
        // Web: use File object directly — no XHR needed
        uploadBlob = videoFile;
      } else {
        // Native: convert URI to blob via XHR
        uploadBlob = await new Promise<Blob>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.onload = () => resolve(xhr.response);
          xhr.onerror = () => reject(new Error('Failed to load video file'));
          xhr.responseType = 'blob';
          xhr.open('GET', videoUri, true);
          xhr.send();
        });
      }

      // Upload video to Firebase Storage
      const filename = `videos/${user?._id}/${Date.now()}.mp4`;
      const storageRef = ref(storage, filename);

      const uploadTask = uploadBytesResumable(storageRef, uploadBlob);

      uploadTask.on('state_changed',
        (snapshot) => {
          const prog = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(Math.round(prog));
        },
        (error) => {
          console.error('Upload error:', error);
          showAlert(t('common.error'), t('upload.uploadFailed'));
          setUploading(false);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

          // Create video record in database
          await videosAPI.create({
            videoUrl: downloadURL,
            title: title.trim(),
            description: description.trim(),
            tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
            category,
          });

          showAlert('✅', t('upload.uploadSuccess'));
          // Reset form
          setVideoUri(null);
          setVideoFile(null);
          setTitle('');
          setDescription('');
          setTags('');
          setCategory('');
          setUploading(false);
          setProgress(0);
        }
      );
    } catch (error: any) {
      console.error('Upload error:', error);
      showAlert(t('common.error'), error?.message || t('upload.uploadFailed'));
      setUploading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.text }]}>{t('upload.title')}</Text>
      </View>

      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        {/* Video picker */}
        <TouchableOpacity
          style={[styles.videoPicker, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={pickVideo}
          activeOpacity={0.7}
        >
          {videoUri ? (
            <View style={styles.videoPreview}>
              <Text style={styles.previewIcon}>🎬</Text>
              <Text style={[styles.previewText, { color: colors.text }]}>{t('upload.videoSelected')}</Text>
            </View>
          ) : (
            <View style={styles.pickerContent}>
              <Text style={styles.pickerIcon}>📹</Text>
              <Text style={[styles.pickerText, { color: colors.primary }]}>{t('upload.selectVideo')}</Text>
              <Text style={[styles.pickerHint, { color: colors.textTertiary }]}>{t('upload.maxSize')}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Title */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>{t('upload.videoTitle')}</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
          placeholder={t('upload.titlePlaceholder')}
          placeholderTextColor={colors.textTertiary}
          value={title}
          onChangeText={setTitle}
          maxLength={200}
        />

        {/* Description */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>{t('upload.description')}</Text>
        <TextInput
          style={[styles.input, styles.textArea, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
          placeholder={t('upload.descPlaceholder')}
          placeholderTextColor={colors.textTertiary}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          maxLength={1000}
        />

        {/* Tags */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>{t('upload.tags')}</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
          placeholder={t('upload.tagsPlaceholder')}
          placeholderTextColor={colors.textTertiary}
          value={tags}
          onChangeText={setTags}
        />

        {/* Category */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>{t('upload.category')}</Text>
        <View style={styles.categoryGrid}>
          {categories.map((cat) => {
            const config = CategoryConfig[cat.slug] || { icon: '📚', color: '#6C5CE7' };
            const isSelected = category === cat.slug;
            return (
              <TouchableOpacity
                key={cat._id}
                style={[styles.categoryChip, { backgroundColor: isSelected ? config.color : colors.surface, borderColor: colors.border }]}
                onPress={() => setCategory(cat.slug)}
              >
                <Text style={styles.chipIcon}>{config.icon}</Text>
                <Text style={[styles.chipText, { color: isSelected ? '#FFF' : colors.text }]}>
                  {t(`categories.${cat.slug}`, cat.name)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Upload progress */}
        {uploading && (
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: colors.surface }]}>
              <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: colors.primary }]} />
            </View>
            <Text style={[styles.progressText, { color: colors.text }]}>{progress}%</Text>
          </View>
        )}

        {/* Publish button */}
        <TouchableOpacity
          style={[styles.publishButton, { backgroundColor: colors.primary, opacity: uploading || !videoUri ? 0.5 : 1 }]}
          onPress={handleUpload}
          disabled={uploading || !videoUri}
          activeOpacity={0.8}
        >
          {uploading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.publishText}>{t('upload.publish')}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingHorizontal: Spacing.xl, paddingBottom: Spacing.md },
  title: { fontSize: Typography.sizes.xxl, fontWeight: '800' },
  form: { flex: 1, paddingHorizontal: Spacing.xl },
  videoPicker: {
    height: 180, borderRadius: Radius.xl, borderWidth: 1.5, borderStyle: 'dashed',
    justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.xxl,
  },
  pickerContent: { alignItems: 'center', gap: Spacing.sm },
  pickerIcon: { fontSize: 40 },
  pickerText: { fontSize: Typography.sizes.lg, fontWeight: '600' },
  pickerHint: { fontSize: Typography.sizes.sm },
  videoPreview: { alignItems: 'center', gap: Spacing.sm },
  previewIcon: { fontSize: 40 },
  previewText: { fontSize: Typography.sizes.md, fontWeight: '600' },
  label: { fontSize: Typography.sizes.sm, fontWeight: '600', marginBottom: Spacing.xs },
  input: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderRadius: Radius.lg, borderWidth: 1, fontSize: Typography.sizes.md,
    marginBottom: Spacing.lg,
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.xxl },
  categoryChip: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: Radius.full, borderWidth: 1,
  },
  chipIcon: { fontSize: 14 },
  chipText: { fontSize: Typography.sizes.sm, fontWeight: '600' },
  progressContainer: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.lg },
  progressBar: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  progressText: { fontSize: Typography.sizes.md, fontWeight: '700', width: 40 },
  publishButton: {
    paddingVertical: Spacing.lg, borderRadius: Radius.xl, alignItems: 'center',
    marginBottom: Spacing.xxxxl,
  },
  publishText: { color: '#FFF', fontSize: Typography.sizes.lg, fontWeight: '700' },
});
