import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { CustomerPickerModal } from '../../../src/components/ornaments/CustomerPickerModal';
import { User } from '../../../src/types';

const USERS: User[] = [
  { UserId: 'U001', FullName: 'Asha Rao', MobileNumber: '9900011111', City: 'Bengaluru' } as User,
  { UserId: 'U002', FullName: 'Bharath Kumar', MobileNumber: '9900022222', City: 'Mysuru' } as User,
];

function setup(overrides: Partial<React.ComponentProps<typeof CustomerPickerModal>> = {}) {
  const props: React.ComponentProps<typeof CustomerPickerModal> = {
    visible: true,
    users: USERS,
    searchQuery: '',
    onSearchChange: jest.fn(),
    selectedUserId: '',
    onSelect: jest.fn(),
    onClose: jest.fn(),
    isDark: false,
    secondaryTextColor: '#64748b',
    placeholderColor: '#94a3b8',
    ...overrides,
  };
  render(<CustomerPickerModal {...props} />);
  return props;
}

describe('CustomerPickerModal', () => {
  it('lists all customers when there is no search query', () => {
    setup();
    expect(screen.getByText('Asha Rao')).toBeTruthy();
    expect(screen.getByText('Bharath Kumar')).toBeTruthy();
  });

  it('filters the customer list by the search query (name, id, phone, city)', () => {
    setup({ searchQuery: 'mysuru' });
    expect(screen.queryByText('Asha Rao')).toBeNull();
    expect(screen.getByText('Bharath Kumar')).toBeTruthy();
  });

  it('shows an empty state when no customer matches the search', () => {
    setup({ searchQuery: 'no-such-customer' });
    expect(screen.getByText('No customers found')).toBeTruthy();
  });

  it('always offers a "None (No Customer)" option and calls onSelect("") for it', () => {
    const onSelect = jest.fn();
    setup({ onSelect });
    fireEvent.press(screen.getByText('None (No Customer)'));
    expect(onSelect).toHaveBeenCalledWith('');
  });

  it('calls onSelect with the tapped customer id', () => {
    const onSelect = jest.fn();
    setup({ onSelect });
    fireEvent.press(screen.getByText('Asha Rao'));
    expect(onSelect).toHaveBeenCalledWith('U001');
  });

  it('forwards search text edits via onSearchChange', () => {
    const onSearchChange = jest.fn();
    setup({ onSearchChange });
    fireEvent.changeText(screen.getByPlaceholderText('Search by name, phone or ID...'), 'bharath');
    expect(onSearchChange).toHaveBeenCalledWith('bharath');
  });
});
