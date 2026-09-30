import { act, renderHook } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { useCustomerPhotoPicker } from '../../../src/components/users/useCustomerPhotoPicker';

jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ImagePicker = require('expo-image-picker');

function setup() {
  const setForm = jest.fn();
  const setFilesPayload = jest.fn();
  const { result } = renderHook(() => useCustomerPhotoPicker(setForm, setFilesPayload));
  return { result, setForm, setFilesPayload };
}

let alertSpy: jest.SpyInstance;
beforeEach(() => {
  jest.clearAllMocks();
  alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

describe('useCustomerPhotoPicker - camera', () => {
  it('alerts and does not launch the camera when permission is denied', async () => {
    ImagePicker.requestCameraPermissionsAsync.mockResolvedValue({ granted: false });
    const { result, setForm, setFilesPayload } = setup();
    await act(async () => { await result.current.handlePickCamera(); });
    expect(alertSpy).toHaveBeenCalledWith('Permission Denied', 'Camera permission is required to capture photos.');
    expect(ImagePicker.launchCameraAsync).not.toHaveBeenCalled();
    expect(setForm).not.toHaveBeenCalled();
    expect(setFilesPayload).not.toHaveBeenCalled();
  });

  it('sets the form photo and files payload (with base64 + mime type) when captured', async () => {
    ImagePicker.requestCameraPermissionsAsync.mockResolvedValue({ granted: true });
    ImagePicker.launchCameraAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file://cam.png', base64: 'QUJD', mimeType: 'image/png' }],
    });
    const { result, setForm, setFilesPayload } = setup();
    await act(async () => { await result.current.handlePickCamera(); });
    const updater = setForm.mock.calls[0][0];
    expect(updater({ FullName: 'X', CustomerPhoto: '' })).toEqual({ FullName: 'X', CustomerPhoto: 'file://cam.png' });
    const files = setFilesPayload.mock.calls[0][0];
    expect(files).toHaveLength(1);
    expect(files[0]).toEqual(expect.objectContaining({ mimeType: 'image/png', base64: 'QUJD' }));
    expect(files[0].name).toMatch(/^avatar_\d+\.jpg$/);
  });

  it('defaults the mime type to image/jpeg and skips the payload without base64', async () => {
    ImagePicker.requestCameraPermissionsAsync.mockResolvedValue({ granted: true });
    ImagePicker.launchCameraAsync.mockResolvedValueOnce({ canceled: false, assets: [{ uri: 'file://a.jpg', base64: 'Zg==' }] });
    const { result, setFilesPayload } = setup();
    await act(async () => { await result.current.handlePickCamera(); });
    expect(setFilesPayload.mock.calls[0][0][0].mimeType).toBe('image/jpeg');

    ImagePicker.launchCameraAsync.mockResolvedValueOnce({ canceled: false, assets: [{ uri: 'file://b.jpg' }] });
    setFilesPayload.mockClear();
    await act(async () => { await result.current.handlePickCamera(); });
    expect(setFilesPayload).not.toHaveBeenCalled();
  });

  it('ignores a canceled capture or an empty asset list', async () => {
    ImagePicker.requestCameraPermissionsAsync.mockResolvedValue({ granted: true });
    const { result, setForm } = setup();
    ImagePicker.launchCameraAsync.mockResolvedValueOnce({ canceled: true, assets: [] });
    await act(async () => { await result.current.handlePickCamera(); });
    ImagePicker.launchCameraAsync.mockResolvedValueOnce({ canceled: false, assets: [] });
    await act(async () => { await result.current.handlePickCamera(); });
    expect(setForm).not.toHaveBeenCalled();
  });

  it('alerts with the thrown message, or a fallback when there is none', async () => {
    ImagePicker.requestCameraPermissionsAsync.mockResolvedValue({ granted: true });
    const { result } = setup();
    ImagePicker.launchCameraAsync.mockRejectedValueOnce(new Error('Camera busy'));
    await act(async () => { await result.current.handlePickCamera(); });
    expect(alertSpy).toHaveBeenCalledWith('Error', 'Camera busy');
    ImagePicker.launchCameraAsync.mockRejectedValueOnce({});
    await act(async () => { await result.current.handlePickCamera(); });
    expect(alertSpy).toHaveBeenCalledWith('Error', 'Failed to capture photo');
  });
});

describe('useCustomerPhotoPicker - gallery', () => {
  it('sets the form photo and files payload on success', async () => {
    ImagePicker.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file://g.jpg', base64: 'R0g=', mimeType: 'image/webp' }],
    });
    const { result, setForm, setFilesPayload } = setup();
    await act(async () => { await result.current.handlePickGallery(); });
    expect(setForm.mock.calls[0][0]({ CustomerPhoto: '' })).toEqual({ CustomerPhoto: 'file://g.jpg' });
    expect(setFilesPayload.mock.calls[0][0][0]).toEqual(expect.objectContaining({ mimeType: 'image/webp', base64: 'R0g=' }));
  });

  it('does nothing when canceled or when there are no assets', async () => {
    const { result, setForm, setFilesPayload } = setup();
    ImagePicker.launchImageLibraryAsync.mockResolvedValueOnce({ canceled: true, assets: null });
    await act(async () => { await result.current.handlePickGallery(); });
    ImagePicker.launchImageLibraryAsync.mockResolvedValueOnce({ canceled: false, assets: [] });
    await act(async () => { await result.current.handlePickGallery(); });
    expect(setForm).not.toHaveBeenCalled();
    expect(setFilesPayload).not.toHaveBeenCalled();
  });

  it('skips the payload without base64 and defaults the mime type', async () => {
    const { result, setForm, setFilesPayload } = setup();
    ImagePicker.launchImageLibraryAsync.mockResolvedValueOnce({ canceled: false, assets: [{ uri: 'file://n.jpg' }] });
    await act(async () => { await result.current.handlePickGallery(); });
    expect(setForm).toHaveBeenCalled();
    expect(setFilesPayload).not.toHaveBeenCalled();
    ImagePicker.launchImageLibraryAsync.mockResolvedValueOnce({ canceled: false, assets: [{ uri: 'u', base64: 'x' }] });
    await act(async () => { await result.current.handlePickGallery(); });
    expect(setFilesPayload.mock.calls[0][0][0].mimeType).toBe('image/jpeg');
  });

  it('alerts on error with the message or a fallback', async () => {
    const { result } = setup();
    ImagePicker.launchImageLibraryAsync.mockRejectedValueOnce(new Error('Gallery busy'));
    await act(async () => { await result.current.handlePickGallery(); });
    expect(alertSpy).toHaveBeenCalledWith('Error', 'Gallery busy');
    ImagePicker.launchImageLibraryAsync.mockRejectedValueOnce(undefined);
    await act(async () => { await result.current.handlePickGallery(); });
    expect(alertSpy).toHaveBeenCalledWith('Error', 'Failed to select photo');
  });
});
