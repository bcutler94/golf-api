const { build } = require('esbuild');
const { nodeExternalsPlugin } = require('esbuild-node-externals');

build({
  entryPoints: ['./src/index.ts'],
  outdir: 'dist',
  bundle: true,
  platform: 'node',
  plugins: [nodeExternalsPlugin()],
  tsconfig: 'tsconfig.json',
  format: 'cjs',
  target: 'node12',
  minify: process.env.NODE_ENV === 'prod'
})