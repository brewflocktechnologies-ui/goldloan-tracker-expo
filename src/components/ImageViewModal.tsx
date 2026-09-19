import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Dimensions, Linking } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { getDriveImageUrl } from '../services/api';

interface ImageViewModalProps {
  visible: boolean;
  imageUrl?: string | null;
  title?: string;
  onClose: () => void;
}

export function ImageViewModal({ visible, imageUrl, title, onClose }: ImageViewModalProps) {
  if (!visible || !imageUrl) return null;

  const directUrl = getDriveImageUrl(imageUrl);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {title || 'Image Preview'}
          </Text>
          <View style={styles.headerActions}>
            {imageUrl.startsWith('http') && (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => Linking.openURL(imageUrl)}
                accessibilityLabel="Open original link"
              >
                <Ionicons name="open-outline" size={20} color="#ffffff" />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.imageContainer}>
          <Image
            source={{ uri: directUrl || imageUrl }}
            style={styles.image}
            contentFit="contain"
            transition={200}
          />
        </View>
      </View>
    </Modal>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.94)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    position: 'absolute',
    top: 40,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  title: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    marginRight: 10,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionBtn: {
    padding: 6,
  },
  closeBtn: {
    padding: 4,
  },
  imageContainer: {
    width: Math.min(width * 0.92, 800),
    height: Math.min(height * 0.75, 600),
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
