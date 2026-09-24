import React, { createRef } from 'react';
import { View } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { OrnamentOptionsMenu, OrnamentOptionsMenuHandle } from '../../../src/components/ornaments/OrnamentOptionsMenu';

// The menu positions itself off of the trigger's measured layout; jsdom/RN-test-renderer
// doesn't lay anything out, so stub measureInWindow to invoke its callback synchronously.
beforeEach(() => {
  jest.spyOn(View.prototype, 'measureInWindow').mockImplementation(function (
    this: unknown,
    callback: (x: number, y: number, width: number, height: number) => void
  ) {
    callback(0, 100, 40, 40);
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

function setup(overrides: Partial<React.ComponentProps<typeof OrnamentOptionsMenu>> = {}) {
  const ref = createRef<OrnamentOptionsMenuHandle>();
  const props: React.ComponentProps<typeof OrnamentOptionsMenu> = {
    isDark: false,
    textPrimaryColor: '#0f172a',
    isSuperAdmin: true,
    onEdit: jest.fn(),
    onDelete: jest.fn(),
    onCopyId: jest.fn(),
    ...overrides,
  };
  render(<OrnamentOptionsMenu ref={ref} {...props} />);
  return { ref, props };
}

describe('OrnamentOptionsMenu', () => {
  it('hides Edit/Delete for non super-admins but still offers Copy Ornament ID', async () => {
    setup({ isSuperAdmin: false });
    fireEvent.press(screen.getByLabelText('Menu options'));

    await waitFor(() => expect(screen.getByText('Copy Ornament ID')).toBeTruthy());
    expect(screen.queryByText('Edit Ornament')).toBeNull();
    expect(screen.queryByText('Delete Ornament')).toBeNull();
  });

  it('shows Edit/Delete/Copy for super-admins and runs the right callback', async () => {
    const { props } = setup({ isSuperAdmin: true });
    fireEvent.press(screen.getByLabelText('Menu options'));

    await waitFor(() => expect(screen.getByText('Edit Ornament')).toBeTruthy());
    fireEvent.press(screen.getByText('Edit Ornament'));

    expect(props.onEdit).toHaveBeenCalledTimes(1);
    expect(props.onDelete).not.toHaveBeenCalled();
  });

  it('closes via the imperative handle', async () => {
    const { ref } = setup({ isSuperAdmin: true });
    fireEvent.press(screen.getByLabelText('Menu options'));

    await waitFor(() => expect(ref.current?.isOpen()).toBe(true));
    act(() => ref.current?.close());
    await waitFor(() => expect(ref.current?.isOpen()).toBe(false));
  });
});
