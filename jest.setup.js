// Icon fonts trigger async setState during their loading lifecycle, which
// logs "not wrapped in act(...)" noise in every test that renders one.
// Swap icon sets for a lightweight Text stub that renders the icon name,
// so icons stay queryable (screen.getByText('close')) without the async churn.
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');

  const createIconSetMock = (familyName) => {
    const IconMock = ({ name, children, ...props }) =>
      React.createElement(Text, props, name ?? children);
    IconMock.displayName = familyName;
    return IconMock;
  };

  return new Proxy(
    {},
    {
      get: (_target, prop) => createIconSetMock(String(prop)),
    }
  );
});
