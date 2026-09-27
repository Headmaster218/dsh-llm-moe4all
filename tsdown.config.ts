import { defineConfig } from 'tsdown'

const id = 'dsh-llm-moe4all'

export default defineConfig({
  name: `${id}/client`,
  entry: { client: 'src/client/index.ts' },
  outDir: 'lib',
  format: 'cjs',
  platform: 'browser',
  target: 'es2022',
  dts: false,
  sourcemap: true,
  clean: false,
  deps: {
    neverBundle: specifier => specifier === 'react' || specifier === 'react/jsx-runtime',
  },
  outputOptions: {
    entryFileNames: 'client.js',
    exports: 'named',
    banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(id)}, factory: (require) => {`,
    footer: 'return module.exports; } });',
    intro: 'var module = { exports: {} }; var exports = module.exports;',
  },
})
