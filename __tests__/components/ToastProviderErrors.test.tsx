import { act, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

jest.mock('../../src/context/ThemeContext', () => ({
  useTheme: () => ({ isDark: false, colors: require('../../src/constants/theme').LightColors }),
}));

const mockSetHandler = jest.fn();
jest.mock('../../src/services/store', () => ({
  setMutationErrorHandler: (fn: any) => mockSetHandler(fn),
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { ToastProvider } = require('../../src/context/ToastContext');

describe('ToastProvider — failed-save messages', () => {
  beforeEach(() => jest.clearAllMocks());

  it('registers a handler with the store while mounted and clears it on unmount', () => {
    const view = render(
      <ToastProvider>
        <Text>child</Text>
      </ToastProvider>
    );
    expect(mockSetHandler).toHaveBeenCalledWith(expect.any(Function));
    view.unmount();
    expect(mockSetHandler).toHaveBeenLastCalledWith(null);
  });

  it('shows the message from a failed save as a toast', async () => {
    render(
      <ToastProvider>
        <Text>child</Text>
      </ToastProvider>
    );
    const handler = mockSetHandler.mock.calls[0][0];
    await act(async () => {
      handler('Customer "Ravi" was not saved: Server is busy');
    });
    expect(screen.getByText('Customer "Ravi" was not saved: Server is busy')).toBeTruthy();
  });
});
