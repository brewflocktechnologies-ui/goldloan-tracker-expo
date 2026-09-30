import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { UserOptionsMenu } from '../../../src/components/users/UserOptionsMenu';

beforeEach(() => {
  jest.spyOn(View.prototype, 'measureInWindow').mockImplementation(function (this: unknown, cb: any) {
    cb(0, 100, 40, 40);
  });
});
afterEach(() => jest.restoreAllMocks());

const base = { textPrimaryColor: '#fff', isSuperAdmin: true, onEdit: jest.fn(), onDelete: jest.fn(), onCopyId: jest.fn() };

describe('UserOptionsMenu dark mode and optional actions', () => {
  it('uses the dark palette for menu items in dark mode and light otherwise', async () => {
    const { unmount } = render(<UserOptionsMenu {...base} isDark onCall={jest.fn()} onWhatsApp={jest.fn()} />);
    fireEvent.press(screen.getByLabelText('Menu options'));
    await waitFor(() => expect(screen.getByText('Edit Customer')).toBeTruthy());
    expect(StyleSheet.flatten(screen.getByText('Edit Customer').props.style).color).toBe('#f8fafc');
    unmount();

    render(<UserOptionsMenu {...base} isDark={false} onCall={jest.fn()} onWhatsApp={jest.fn()} />);
    fireEvent.press(screen.getByLabelText('Menu options'));
    await waitFor(() => expect(screen.getByText('Edit Customer')).toBeTruthy());
    expect(StyleSheet.flatten(screen.getByText('Edit Customer').props.style).color).toBe('#0f172a');
  });

  it('omits Call/WhatsApp when handlers are absent and still closes when an action is undefined', async () => {
    render(<UserOptionsMenu {...base} isDark onEdit={undefined as any} />);
    fireEvent.press(screen.getByLabelText('Menu options'));
    expect(await screen.findByText('Edit Customer')).toBeTruthy();
    expect(screen.queryByText('Call Customer')).toBeNull();
    expect(screen.queryByText('WhatsApp Customer')).toBeNull();
    fireEvent.press(screen.getByText('Edit Customer'));
    await waitFor(() => expect(screen.queryByText('Edit Customer')).toBeNull());
  });
});
