const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Supabase v2.100+ uses dynamic import() to optionally load @opentelemetry/api.
// Metro skips Babel transforms on node_modules by default, so Hermes sees the
// raw import() and fails. Force-transform the affected packages so Babel can
// convert dynamic imports to Promise.resolve(require(...)).
config.transformer.transformIgnorePatterns = [
  'node_modules/(?!(@supabase|@opentelemetry)/)',
];

module.exports = config;
