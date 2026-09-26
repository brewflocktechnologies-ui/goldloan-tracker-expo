import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

/** Opens the gallery for multi-select and resolves to the chosen URIs ([] if cancelled or failed). */
export async function pickOrnamentImages(): Promise<string[]> {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      return result.assets.map(a => a.uri);
    }
  } catch (e: any) {
    Alert.alert('Error', e?.message || 'Failed to select image');
  }
  return [];
}
