import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { StyleSheet } from 'react-native';
import { OrnamentStatusBadge } from '../../../src/components/ornaments/OrnamentStatusBadge';

describe('OrnamentStatusBadge neutral tone', () => {
  it.each([
    [false, '#475569', '#f1f5f9', '#e2e8f0'],
    [true, '#cbd5e1', 'rgba(100, 116, 139, 0.15)', '#64748b'],
  ])('renders an unknown status as a neutral pill (isDark=%s)', (isDark, text, bg, border) => {
    const { toJSON } = render(<OrnamentStatusBadge status="Sold" isDark={isDark} variant="pill" />);
    expect(StyleSheet.flatten(screen.getByText('Sold').props.style).color).toBe(text);
    const style = StyleSheet.flatten((toJSON() as any).props.style);
    expect(style.backgroundColor).toBe(bg);
    expect(style.borderColor).toBe(border);
  });

  it('renders the neutral badge variant without a border color', () => {
    const { toJSON } = render(<OrnamentStatusBadge status="Sold" isDark={false} />);
    expect(StyleSheet.flatten((toJSON() as any).props.style).borderColor).toBeUndefined();
  });
});
