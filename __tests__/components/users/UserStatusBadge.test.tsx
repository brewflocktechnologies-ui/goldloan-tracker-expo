import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { StyleSheet } from 'react-native';
import { UserStatusBadge } from '../../../src/components/users/UserStatusBadge';

const flat = (node: any) => StyleSheet.flatten(node.props.style);

describe('UserStatusBadge', () => {
  it('renders the status text', () => {
    render(<UserStatusBadge status="Active" isDark={false} />);
    expect(screen.getByText('Active')).toBeTruthy();
  });

  it('defaults empty status to "Active"', () => {
    render(<UserStatusBadge status="" isDark={false} />);
    expect(screen.getByText('Active')).toBeTruthy();
  });

  it('uses green text for Active and slate for Inactive (light)', () => {
    const { rerender } = render(<UserStatusBadge status="Active" isDark={false} />);
    expect(flat(screen.getByText('Active')).color).toBe('#059669');
    rerender(<UserStatusBadge status="Inactive" isDark={false} />);
    expect(flat(screen.getByText('Inactive')).color).toBe('#475569');
  });

  it('uses lighter text tones in dark mode', () => {
    const { rerender } = render(<UserStatusBadge status="Active" isDark />);
    expect(flat(screen.getByText('Active')).color).toBe('#34d399');
    rerender(<UserStatusBadge status="Inactive" isDark />);
    expect(flat(screen.getByText('Inactive')).color).toBe('#cbd5e1');
  });

  it('treats unknown statuses as Inactive-toned', () => {
    render(<UserStatusBadge status="Deleted" isDark={false} />);
    expect(flat(screen.getByText('Deleted')).color).toBe('#475569');
  });

  it('badge variant has a tinted background and no border colour', () => {
    const { toJSON } = render(<UserStatusBadge status="Active" isDark={false} />);
    const root: any = toJSON();
    expect(flat(root).backgroundColor).toBe('#ecfdf5');
    expect(flat(root).borderColor).toBeUndefined();
  });

  it('pill variant has its own background and border colour', () => {
    const { toJSON } = render(<UserStatusBadge status="Active" isDark={false} variant="pill" />);
    const root: any = toJSON();
    expect(flat(root).backgroundColor).toBe('#dcfce7');
    expect(flat(root).borderColor).toBe('#bbf7d0');
  });

  it('renders a status dot by default and omits it with showDot={false}', () => {
    const withDot: any = render(<UserStatusBadge status="Active" isDark={false} />).toJSON();
    expect(withDot.children).toHaveLength(2);

    const noDot: any = render(<UserStatusBadge status="Active" isDark={false} showDot={false} />).toJSON();
    expect(noDot.children).toHaveLength(1);
  });
});
