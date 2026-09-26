import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React, { createRef } from 'react';
import { View } from 'react-native';
import { UserOptionsMenu, UserOptionsMenuHandle } from '../../../src/components/users/UserOptionsMenu';

// The menu positions itself off of the trigger's measured layout; the test renderer
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

function setup(overrides: Partial<React.ComponentProps<typeof UserOptionsMenu>> = {}) {
  const ref = createRef<UserOptionsMenuHandle>();
  const props: React.ComponentProps<typeof UserOptionsMenu> = {
    isDark: false,
    textPrimaryColor: '#0f172a',
    isSuperAdmin: true,
    onEdit: jest.fn(),
    onDelete: jest.fn(),
    onCopyId: jest.fn(),
    onCall: jest.fn(),
    onWhatsApp: jest.fn(),
    ...overrides,
  };
  render(<UserOptionsMenu ref={ref} {...props} />);
  return { ref, props };
}

const open = () => fireEvent.press(screen.getByLabelText('Menu options'));

describe('UserOptionsMenu', () => {
  it('is closed until the trigger is pressed', () => {
    setup();
    expect(screen.queryByText('Copy Customer Code')).toBeNull();
  });

  it('hides Edit/Delete for non super-admins but still offers Copy Customer Code', async () => {
    setup({ isSuperAdmin: false });
    open();
    await waitFor(() => expect(screen.getByText('Copy Customer Code')).toBeTruthy());
    expect(screen.queryByText('Edit Customer')).toBeNull();
    expect(screen.queryByText('Delete Customer')).toBeNull();
  });

  it('shows every action for super-admins', async () => {
    setup();
    open();
    await waitFor(() => expect(screen.getByText('Edit Customer')).toBeTruthy());
    expect(screen.getByText('Call Customer')).toBeTruthy();
    expect(screen.getByText('WhatsApp Customer')).toBeTruthy();
    expect(screen.getByText('Copy Customer Code')).toBeTruthy();
    expect(screen.getByText('Delete Customer')).toBeTruthy();
  });

  it('omits Call and WhatsApp when no handlers are provided', async () => {
    setup({ onCall: undefined, onWhatsApp: undefined });
    open();
    await waitFor(() => expect(screen.getByText('Edit Customer')).toBeTruthy());
    expect(screen.queryByText('Call Customer')).toBeNull();
    expect(screen.queryByText('WhatsApp Customer')).toBeNull();
  });

  it.each([
    ['Edit Customer', 'onEdit'],
    ['Call Customer', 'onCall'],
    ['WhatsApp Customer', 'onWhatsApp'],
    ['Copy Customer Code', 'onCopyId'],
    ['Delete Customer', 'onDelete'],
  ] as const)('pressing "%s" runs %s', async (label, handler) => {
    const { props } = setup();
    open();
    fireEvent.press(await screen.findByText(label));
    expect(props[handler]).toHaveBeenCalledTimes(1);
  });

  it('closes after an action is chosen', async () => {
    const { ref } = setup();
    open();
    fireEvent.press(await screen.findByText('Copy Customer Code'));
    await waitFor(() => expect(ref.current?.isOpen()).toBe(false));
  });

  it('exposes isOpen() and close() through its ref', async () => {
    const { ref } = setup();
    expect(ref.current?.isOpen()).toBe(false);
    open();
    await waitFor(() => expect(ref.current?.isOpen()).toBe(true));
    act(() => ref.current?.close());
    await waitFor(() => expect(ref.current?.isOpen()).toBe(false));
  });
});
