const bc = require('@babel/core');
try {
  const cfg = bc.loadPartialConfig({
    filename: 'node_modules/expo-router/entry.js',
    configFile: './babel.config.js',
    babelrc: false,
  });
  const plugins = cfg.options.plugins || [];
  const presets = cfg.options.presets || [];
  console.log('plugins count', plugins.length);
  plugins.forEach((p, i) => {
    const val = p.value;
    console.log(i, 'type', typeof val, 'name', val && (val.name || val.displayName || val.constructor.name || 'anon'));
    if (typeof val === 'object' && val !== null) {
      console.log('  keys', Object.keys(val));
    }
  });
  console.log('presets count', presets.length);
  presets.forEach((p, i) => {
    const val = p.value;
    console.log(i, 'type', typeof val, 'name', val && (val.name || val.displayName || val.constructor.name || 'anon'));
    if (p.options) console.log('  options', Object.keys(p.options));
  });
} catch (e) {
  console.error(e.stack || e.message);
  process.exit(1);
}
