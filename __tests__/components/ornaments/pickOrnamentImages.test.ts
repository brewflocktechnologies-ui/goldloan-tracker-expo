import { Alert } from 'react-native';
import { pickOrnamentImages } from '../../../src/components/ornaments/pickOrnamentImages';

jest.mock('expo-image-picker', () => ({
  MediaTypeOptions: { Images: 'Images' },
  launchImageLibraryAsync: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ImagePicker = require('expo-image-picker');

afterEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
});

describe('pickOrnamentImages', () => {
  it('opens the gallery in multi-select image mode', async () => {
    ImagePicker.launchImageLibraryAsync.mockResolvedValue({ canceled: true, assets: [] });
    await pickOrnamentImages();
    expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalledWith(
      expect.objectContaining({ allowsMultipleSelection: true, mediaTypes: 'Images' })
    );
  });

  it('resolves to the chosen URIs', async () => {
    ImagePicker.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'a.jpg' }, { uri: 'b.jpg' }],
    });
    await expect(pickOrnamentImages()).resolves.toEqual(['a.jpg', 'b.jpg']);
  });

  it('resolves to [] when cancelled', async () => {
    ImagePicker.launchImageLibraryAsync.mockResolvedValue({ canceled: true, assets: [{ uri: 'x.jpg' }] });
    await expect(pickOrnamentImages()).resolves.toEqual([]);
  });

  it('resolves to [] when no assets come back', async () => {
    ImagePicker.launchImageLibraryAsync.mockResolvedValue({ canceled: false, assets: [] });
    await expect(pickOrnamentImages()).resolves.toEqual([]);
  });

  it('alerts with the error message and resolves to [] when the picker throws', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    ImagePicker.launchImageLibraryAsync.mockRejectedValue(new Error('Denied'));
    await expect(pickOrnamentImages()).resolves.toEqual([]);
    expect(alert).toHaveBeenCalledWith('Error', 'Denied');
  });

  it('falls back to a generic message for errors without one', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    ImagePicker.launchImageLibraryAsync.mockRejectedValue({});
    await pickOrnamentImages();
    expect(alert).toHaveBeenCalledWith('Error', 'Failed to select image');
  });
});
