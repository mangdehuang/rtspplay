import typescript from '@rollup/plugin-typescript'
import resolve from '@rollup/plugin-node-resolve'

export default [
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.js',
      format: 'es',
      sourcemap: true
    },
    external: ['ws', 'child_process', 'http', 'url'],
    plugins: [
      resolve(),
      typescript({
        tsconfig: './tsconfig.json'
      })
    ]
  },
  {
    input: 'src/cli.ts',
    output: {
      file: 'dist/cli.js',
      format: 'es',
      sourcemap: true,
      banner: '#!/usr/bin/env node'
    },
    external: ['ws', 'child_process', 'http', 'url', './index.js'],
    plugins: [
      resolve(),
      typescript({
        tsconfig: './tsconfig.json'
      })
    ]
  }
]
