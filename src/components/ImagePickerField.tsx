import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Colors, ThemeColors } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { getDriveImageUrl } from '../services/api';
import { ImageViewModal } from './ImageViewModal';

export interface FilePayload {
  name: string;
  mimeType: string;
  base64: string;
}

interface ImagePickerFieldProps {
  label: string;
  value?: string;
  onChange: (url: string, filesPayload: FilePayload[]) => void;
  type?: 'avatar' | 'card';
  helperText?: string;
  multiple?: boolean;
}

export function ImagePickerField({
  label,
  value,
  onChange,
  type = 'card',
  helperText,
  multiple = false,
}: ImagePickerFieldProps) {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [selectedPreviewUrl, setSelectedPreviewUrl] = useState<string | null>(null);

  const imageUrls = value ? value.split(' | ').filter(Boolean) : [];

  const pickImage = async () => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Please grant permission to access your photo library.');
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: !multiple && type === 'avatar',
        aspect: type === 'avatar' ? [1, 1] : undefined,
        quality: 0.7,
        base64: true,
        allowsMultipleSelection: multiple,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const files: FilePayload[] = [];
        const localUris: string[] = [];

        for (const asset of result.assets) {
          if (asset.uri) {
            localUris.push(asset.uri);
          }
          if (asset.base64) {
            const fileName = asset.fileName || `photo_${Date.now()}.${asset.mimeType?.split('/')[1] || 'jpg'}`;
            files.push({
              name: fileName,
              mimeType: asset.mimeType || 'image/jpeg',
              base64: asset.base64,
            });
          }
        }

        if (multiple) {
          const combinedUrls = [...imageUrls, ...localUris].join(' | ');
          onChange(combinedUrls, files);
        } else {
          onChange(localUris[0] || '', files);
        }
      }
    } catch (e: any) {
      console.warn('[ImagePicker] Error picking image:', e);
      Alert.alert('Error', 'Failed to pick image: ' + (e.message || 'Unknown error'));
    }
  };

  const removeImage = (indexToRemove?: number) => {
    if (indexToRemove !== undefined) {
      const remaining = imageUrls.filter((_, idx) => idx !== indexToRemove);
      onChange(remaining.join(' | '), []);
    } else {
      onChange('', []);
    }
  };

  const openPreview = (url: string) => {
    setSelectedPreviewUrl(url);
    setPreviewModalVisible(true);
  };

  if (type === 'avatar') {
    const hasImage = imageUrls.length > 0;
    const directUrl = hasImage ? getDriveImageUrl(imageUrls[0]) : '';

    return (
      <View style={styles.avatarContainer}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.avatarRow}>
          <TouchableOpacity
            style={styles.avatarWrapper}
            onPress={() => (hasImage ? openPreview(imageUrls[0]) : pickImage())}
          >
            {hasImage ? (
              <Image source={{ uri: directUrl || imageUrls[0] }} style={styles.avatarImage} contentFit="cover" />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={36} color={Colors.textMuted} />
              </View>
            )}
            <View style={styles.avatarBadge}>
              <Ionicons name="camera" size={14} color="#ffffff" />
            </View>
          </TouchableOpacity>

          <View style={styles.avatarActions}>
            <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
              <Ionicons name="cloud-upload-outline" size={16} color={Colors.primaryDark} />
              <Text style={styles.uploadBtnText}>{hasImage ? 'Change Photo' : 'Upload Photo'}</Text>
            </TouchableOpacity>

            {hasImage && (
              <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage()}>
                <Ionicons name="trash-outline" size={14} color={Colors.danger} />
                <Text style={styles.removeBtnText}>Remove</Text>
              </TouchableOpacity>
            )}

            {helperText && <Text style={styles.helperText}>{helperText}</Text>}
          </View>
        </View>

        <ImageViewModal
          visible={previewModalVisible}
          imageUrl={selectedPreviewUrl}
          title={label}
          onClose={() => setPreviewModalVisible(false)}
        />
      </View>
    );
  }

  return (
    <View style={styles.cardContainer}>
      <View style={styles.cardHeader}>
        <Text style={styles.label}>{label}</Text>
        <TouchableOpacity style={styles.uploadCardBtn} onPress={pickImage}>
          <Ionicons name="add-circle-outline" size={16} color={Colors.primaryDark} />
          <Text style={styles.uploadCardBtnText}>{multiple ? 'Add Images' : 'Select Image'}</Text>
        </TouchableOpacity>
      </View>

      {imageUrls.length === 0 ? (
        <TouchableOpacity style={styles.emptyCard} onPress={pickImage}>
          <Ionicons name="image-outline" size={28} color={Colors.textMuted} />
          <Text style={styles.emptyCardText}>Tap here to select {multiple ? 'images' : 'an image'} from your device</Text>
          {helperText && <Text style={styles.helperText}>{helperText}</Text>}
        </TouchableOpacity>
      ) : (
        <View style={styles.galleryGrid}>
          {imageUrls.map((url, idx) => {
            const directUrl = getDriveImageUrl(url);
            return (
              <View key={idx} style={styles.thumbnailWrapper}>
                <TouchableOpacity onPress={() => openPreview(url)}>
                  <Image source={{ uri: directUrl || url }} style={styles.thumbnail} contentFit="cover" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.thumbnailDelete} onPress={() => removeImage(idx)}>
                  <Ionicons name="close-circle" size={20} color="#dc2626" />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}

      <ImageViewModal
        visible={previewModalVisible}
        imageUrl={selectedPreviewUrl}
        title={label}
        onClose={() => setPreviewModalVisible(false)}
      />
    </View>
  );
}

const getStyles = (colors: ThemeColors, isDark: boolean) => StyleSheet.create({
  avatarContainer: {
    marginBottom: 16,
  },
  cardContainer: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarWrapper: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    borderColor: colors.primary,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    paddingVertical: 2,
  },
  avatarActions: {
    flex: 1,
    gap: 6,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: isDark ? '#261a02' : colors.primarySubtle,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: isDark ? '#784e08' : colors.primaryLight,
  },
  uploadBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: isDark ? '#fbbf24' : colors.primaryDark,
  },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  removeBtnText: {
    fontSize: 11,
    color: colors.danger,
    fontWeight: '500',
  },
  helperText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  uploadCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  uploadCardBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: isDark ? '#fbbf24' : colors.primaryDark,
  },
  emptyCard: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: isDark ? '#334155' : colors.borderDark,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: isDark ? '#111827' : '#fafafa',
    gap: 4,
  },
  emptyCardText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingTop: 4,
  },
  thumbnailWrapper: {
    position: 'relative',
    width: 80,
    height: 80,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailDelete: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: isDark ? '#0f172a' : '#ffffff',
    borderRadius: 10,
  },
});