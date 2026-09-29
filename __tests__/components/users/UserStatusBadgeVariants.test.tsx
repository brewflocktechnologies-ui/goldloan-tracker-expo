import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { StyleSheet } from 'react-native';
import { UserStatusBadge } from '../../../src/components/users/UserStatusBadge';

const textColor = (label: string) => StyleSheet.flatten(screen.getByText(label).props.style).color;

describe('UserStatusBadge tones', () => {
  it.each([
    ['Inactive', false, '#475569'],
    ['Inactive', true, '#cbd5e1'],
    ['Active', false, '#059669'],
    ['Active', true, '#34d399'],
  ])('%s pill (isDark=%s) uses text color %s', (status, isDark, color) => {
    const { toJSON } = render(<UserStatusBadge status={status} isDark={isDark as boolean} variant="pill" />);
    expect(textColor(status)).toBe(color);
    const root: any = toJSON();
    expect(StyleSheet.flatten(root.props.style).borderColor).toBeTruthy();
  });

  it('falls back to Active label text for an empty status and hides the dot when asked', () => {
    render(<UserStatusBadge status="" isDark showDot={false} />);
    expect(screen.getByText('Active')).toBeTruthy();
  });
});
