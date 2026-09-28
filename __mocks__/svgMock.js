const React = require('react');
const { View } = require('react-native');

const SvgMock = React.forwardRef((props, ref) => React.createElement(View, { ...props, ref }));
SvgMock.displayName = 'SvgMock';

module.exports = SvgMock;
module.exports.default = SvgMock;
