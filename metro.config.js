const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

["types.js", "types.ts"].forEach((ext) => {
  if (!config.resolver.sourceExts.includes(ext)) {
    config.resolver.sourceExts.push(ext);
  }
});

module.exports = config;
