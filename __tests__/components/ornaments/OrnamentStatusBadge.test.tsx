import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { OrnamentStatusBadge } from '../../../src/components/ornaments/OrnamentStatusBadge';

describe('OrnamentStatusBadge', () => {
  it.each(['Available', 'Pledged', 'Released'] as const)(
    'renders the %s status text',
    (status) => {
      render(<OrnamentStatusBadge status={status} isDark={false} />);
      expect(screen.getByText(status)).toBeTruthy();
    }
  );

  it('falls back to the Released tone for an unknown status', () => {
    render(<OrnamentStatusBadge status="SomethingElse" isDark={false} />);
    expect(screen.getByText('SomethingElse')).toBeTruthy();
  });

  it('defaults to the compact "badge" variant when none is given', () => {
    render(<OrnamentStatusBadge status="Available" isDark={false} />);
    expect(screen.getByText('Available')).toBeTruthy();
  });

  it('renders in both light and dark mode without crashing', () => {
    const { rerender } = render(<OrnamentStatusBadge status="Pledged" isDark={false} variant="pill" />);
    expect(screen.getByText('Pledged')).toBeTruthy();

    rerender(<OrnamentStatusBadge status="Pledged" isDark={true} variant="pill" />);
    expect(screen.getByText('Pledged')).toBeTruthy();
  });
});
