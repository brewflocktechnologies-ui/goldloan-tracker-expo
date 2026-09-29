import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { CustomerPickerModal } from '../../../src/components/ornaments/CustomerPickerModal';
import { OptionPickerModal } from '../../../src/components/ornaments/OptionPickerModal';
import { OrnamentOptionsMenu } from '../../../src/components/ornaments/OrnamentOptionsMenu';

beforeEach(() => {
  jest.spyOn(View.prototype, 'measureInWindow').mockImplementation(function (this: unknown, cb: any) {
    cb(0, 100, 40, 40);
  });
});
afterEach(() => jest.restoreAllMocks());

describe('OptionPickerModal theming', () => {
  const renderPicker = (isDark: boolean, selectedValue: string) =>
    render(
      <OptionPickerModal
        visible
        title="Pick"
        options={['A', 'B']}
        selectedValue={selectedValue}
        onSelect={jest.fn()}
        onClose={jest.fn()}
        isDark={isDark}
        secondaryTextColor="#64748b"
      />
    );

  it.each([
    [true, '#f8fafc'],
    [false, '#0d172a'],
  ])('title color follows isDark=%s', (isDark, color) => {
    renderPicker(isDark, 'A');
    expect(StyleSheet.flatten(screen.getByText('Pick').props.style).color).toBe(color);
  });

  it('item text color follows the theme, for selected and unselected options', () => {
    renderPicker(true, 'B');
    expect(StyleSheet.flatten(screen.getByText('A').props.style).color).toBe('#f8fafc');
    expect(StyleSheet.flatten(screen.getByText('B').props.style).color).toBe('#f8fafc');
  });
});

describe('CustomerPickerModal clear button', () => {
  it('shows a clear button only with a query and clears it on press', () => {
    const onSearchChange = jest.fn();
    const props = {
      visible: true,
      users: [{ UserId: 'U1', FullName: 'Ravi', MobileNumber: '1', City: 'X' }] as any,
      onSearchChange,
      selectedUserId: '',
      onSelect: jest.fn(),
      onClose: jest.fn(),
      isDark: true,
      secondaryTextColor: '#64748b',
      placeholderColor: '#94a3b8',
    };
    const { rerender } = render(<CustomerPickerModal {...props} searchQuery="" />);
    expect(screen.queryByText('close-circle')).toBeNull();
    rerender(<CustomerPickerModal {...props} searchQuery="rav" />);
    fireEvent.press(screen.getByText('close-circle'));
    expect(onSearchChange).toHaveBeenCalledWith('');
  });
});

describe('OrnamentOptionsMenu', () => {
  it('runs onCopyId and closes the menu when Copy Ornament ID is pressed', async () => {
    const onCopyId = jest.fn();
    render(
      <OrnamentOptionsMenu isDark textPrimaryColor="#fff" isSuperAdmin={false} onEdit={jest.fn()} onDelete={jest.fn()} onCopyId={onCopyId} />
    );
    fireEvent.press(screen.getByLabelText('Menu options'));
    fireEvent.press(await screen.findByText('Copy Ornament ID'));
    expect(onCopyId).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByText('Copy Ornament ID')).toBeNull());
  });
});
