import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { OptionPickerModal } from '../../../src/components/ornaments/OptionPickerModal';

const OPTIONS = ['Necklace', 'Bangles', 'Ring'];

describe('OptionPickerModal', () => {
  it('renders nothing meaningful when not visible', () => {
    render(
      <OptionPickerModal
        visible={false}
        title="Select Category"
        options={OPTIONS}
        selectedValue="Necklace"
        onSelect={jest.fn()}
        onClose={jest.fn()}
        isDark={false}
        secondaryTextColor="#64748b"
      />
    );
    expect(screen.queryByText('Select Category')).toBeNull();
  });

  it('lists every option with the title when visible', () => {
    render(
      <OptionPickerModal
        visible={true}
        title="Select Category"
        options={OPTIONS}
        selectedValue="Necklace"
        onSelect={jest.fn()}
        onClose={jest.fn()}
        isDark={false}
        secondaryTextColor="#64748b"
      />
    );
    expect(screen.getByText('Select Category')).toBeTruthy();
    OPTIONS.forEach(opt => expect(screen.getByText(opt)).toBeTruthy());
  });

  it('calls onSelect with the tapped option', () => {
    const onSelect = jest.fn();
    render(
      <OptionPickerModal
        visible={true}
        title="Select Category"
        options={OPTIONS}
        selectedValue="Necklace"
        onSelect={onSelect}
        onClose={jest.fn()}
        isDark={false}
        secondaryTextColor="#64748b"
      />
    );
    fireEvent.press(screen.getByText('Bangles'));
    expect(onSelect).toHaveBeenCalledWith('Bangles');
  });

  it('calls onClose when the close icon is pressed', () => {
    const onClose = jest.fn();
    render(
      <OptionPickerModal
        visible={true}
        title="Select Category"
        options={OPTIONS}
        selectedValue="Necklace"
        onSelect={jest.fn()}
        onClose={onClose}
        isDark={false}
        secondaryTextColor="#64748b"
      />
    );
    fireEvent.press(screen.UNSAFE_getByProps({ name: 'close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
