import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import type { UserFormState } from './UserFormView';

/** Camera / gallery photo pickers that write the chosen photo into the user form. */
export function useCustomerPhotoPicker(
  setForm: (updater: (prev: UserFormState) => UserFormState) => void,
  setFilesPayload: (files: any[]) => void
) {
  // Take photo with camera
  const handlePickCamera = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission Denied', 'Camera permission is required to capture photos.');
        return;
      }
      const res = await ImagePicker.launchCameraAsync({
        quality: 0.7,
        allowsEditing: true,
        aspect: [1, 1],
        base64: true,
      });
      if (!res.canceled && res.assets && res.assets[0]) {
        const asset = res.assets[0];
        setForm(p => ({ ...p, CustomerPhoto: asset.uri }));
        if (asset.base64) {
          setFilesPayload([
            {
              name: `avatar_${Date.now()}.jpg`,
              mimeType: asset.mimeType || 'image/jpeg',
              base64: asset.base64,
            },
          ]);
        }
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to capture photo');
    }
  };

  // Choose photo from gallery
  const handlePickGallery = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.7,
        allowsEditing: true,
        aspect: [1, 1],
        base64: true,
      });
      if (!res.canceled && res.assets && res.assets[0]) {
        const asset = res.assets[0];
        setForm(p => ({ ...p, CustomerPhoto: asset.uri }));
        if (asset.base64) {
          setFilesPayload([
            {
              name: `avatar_${Date.now()}.jpg`,
              mimeType: asset.mimeType || 'image/jpeg',
              base64: asset.base64,
            },
          ]);
        }
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to select photo');
    }
  };

  return { handlePickCamera, handlePickGallery };
}
