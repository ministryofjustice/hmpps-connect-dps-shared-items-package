import fs from 'node:fs/promises'
import typescript from '@rollup/plugin-typescript'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import multiEntry from '@rollup/plugin-multi-entry'
import copy from 'rollup-plugin-copy'
import { dts } from 'rollup-plugin-dts'
import scss from 'rollup-plugin-scss'
import pkg from './package.json'

export default [
  {
    input: ['src/index.ts', 'src/types/**/*.ts', '!**/*test*', '!src/assets'],
    output: [
      { file: pkg.main, format: 'cjs', sourcemap: true },
      { file: pkg.module, format: 'esm', sourcemap: true },
    ],
    plugins: [
      nodeResolve({ preferBuiltins: true }),
      typescript({
        tsconfig: './tsconfig.json',
        noEmitOnError: true,
      }),
      multiEntry(),
      copy({
        targets: [{ src: 'src/assets', dest: 'dist' }],
        filter: src => !src.endsWith('/tsconfig.json'),
      }),
    ],
    external: [...Object.keys(pkg.dependencies || {})],
  },
  {
    input: 'src/assets/js/all.js',
    output: {
      dir: 'dist/assets',
      format: 'esm',
      preserveModules: true,
      preserveModulesRoot: 'src/assets',
    },
    plugins: [
      typescript({
        tsconfig: './src/assets/tsconfig.json',
        noEmitOnError: true,
      }),
    ],
  },
  {
    input: 'dist/assets/scss/all.ts',
    output: { file: 'dist/assets/scss/all.js', format: 'cjs' },
    plugins: [
      scss({ fileName: 'all.css' }),
      {
        name: 'cleanup',
        closeBundle: () =>
          Promise.all(['dist/assets/scss/all.js', 'dist/assets/scss/all.ts'].map(path => fs.rm(path, { force: true }))),
      },
    ],
  },
  {
    input: 'dist/types/public/**/*.d.ts',
    output: [{ file: 'dist/index.d.ts', format: 'esm' }],
    plugins: [nodeResolve({ preferBuiltins: true }), dts(), multiEntry()],
    external: [...Object.keys(pkg.dependencies || {})],
  },
]
