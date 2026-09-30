import { act, renderHook } from '@testing-library/react-native';
import { Linking, Platform } from 'react-native';
import { useContactActions } from '../../../src/components/users/useContactActions';

const mockToast = { success: jest.fn(), danger: jest.fn(), info: jest.fn(), warning: jest.fn() };
jest.mock('../../../src/context/ToastContext', () => ({ useToast: () => mockToast }));

const flush = () => act(async () => { await Promise.resolve(); });

beforeEach(() => jest.clearAllMocks());
afterEach(() => jest.restoreAllMocks());

describe('useContactActions', () => {
  it('opens tel: and toasts danger when the dialer rejects', async () => {
    const spy = jest.spyOn(Linking, 'openURL').mockRejectedValue(new Error('no'));
    const { result } = renderHook(() => useContactActions());
    result.current.handleCallCustomer(9876543210);
    await flush();
    expect(spy).toHaveBeenCalledWith('tel:9876543210');
    expect(mockToast.danger).toHaveBeenCalledWith('Could not open phone dialer');
  });

  it('opens wa.me (prefixing 91) and toasts danger when WhatsApp rejects', async () => {
    const spy = jest.spyOn(Linking, 'openURL').mockRejectedValue(new Error('no'));
    const { result } = renderHook(() => useContactActions());
    result.current.handleWhatsAppCustomer('98765-43210');
    await flush();
    expect(spy).toHaveBeenCalledWith('https://wa.me/919876543210');
    expect(mockToast.danger).toHaveBeenCalledWith('Could not open WhatsApp');
  });

  it('does not toast danger when opening succeeds', async () => {
    jest.spyOn(Linking, 'openURL').mockResolvedValue(true as any);
    const { result } = renderHook(() => useContactActions());
    result.current.handleCallCustomer('9876543210');
    result.current.handleWhatsAppCustomer('9876543210');
    await flush();
    expect(mockToast.danger).not.toHaveBeenCalled();
  });

  it('warns when there is no phone number', () => {
    const spy = jest.spyOn(Linking, 'openURL').mockResolvedValue(true as any);
    const { result } = renderHook(() => useContactActions());
    result.current.handleCallCustomer('');
    result.current.handleWhatsAppCustomer(undefined);
    expect(mockToast.warning).toHaveBeenCalledTimes(2);
    expect(mockToast.warning).toHaveBeenCalledWith('No mobile number available');
    expect(spy).not.toHaveBeenCalled();
  });

  it('copy: ignores an empty code; toasts on native; writes to clipboard on web', () => {
    const { result } = renderHook(() => useContactActions());
    result.current.handleCopyCode(undefined);
    expect(mockToast.info).not.toHaveBeenCalled();

    result.current.handleCopyCode('C-1');
    expect(mockToast.info).toHaveBeenCalledWith('Copied Code: C-1');

    const original = Platform.OS;
    const writeText = jest.fn();
    (Platform as any).OS = 'web';
    (globalThis as any).navigator = { clipboard: { writeText } };
    try {
      result.current.handleCopyCode('C-2');
      expect(writeText).toHaveBeenCalledWith('C-2');
      expect(mockToast.info).toHaveBeenCalledWith('Copied Code: C-2');
    } finally {
      (Platform as any).OS = original;
      delete (globalThis as any).navigator;
    }
  });
});
