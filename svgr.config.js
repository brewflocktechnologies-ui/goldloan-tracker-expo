module.exports = {
  native: true,
  plugins: ["@svgr/plugin-svgo", "@svgr/plugin-jsx"],
  svgoConfig: {
    plugins: [
      {
        name: "preset-default",
        params: {
          overrides: {
            inlineStyles: {
              onlyMatchedOnce: false,
            },
            removeViewBox: false,
            removeUnknownsAndDefaults: false,
            convertColors: false,
          },
        },
      },
      // Without this, every icon's <mask> gets the same short id (e.g. "a"),
      // and since react-native-web renders to real SVG/DOM, ids collide
      // globally across the page — icons end up masked by an unrelated
      // icon's mask. Prefixing with the filename keeps each id unique.
      "prefixIds",
    ],
  },
};
