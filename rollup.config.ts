import typescript from '@rollup/plugin-typescript'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import multiEntry from '@rollup/plugin-multi-entry'
import copy from 'rollup-plugin-copy'
import { dts } from 'rollup-plugin-dts'
import scss from 'rollup-plugin-scss'
import pkg from './package.json'

export default [
  {
    input: ['src/index.ts', 'src/types/**/*.ts', '!**/*test*'],
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
      copy({ targets: [{ src: 'src/assets', dest: 'dist' }] }),
    ],
    external: [...Object.keys(pkg.dependencies || {})],
  },
  {
    input: ['dist/assets/scss/all.ts'],
    output: { file: 'dist/assets/scss/all.js', format: 'cjs' },
    plugins: [scss({ fileName: 'all.css' })],
  },
  {
    input: 'dist/types/public/**/*.d.ts',
    output: [{ file: 'dist/index.d.ts', format: 'esm' }],
    plugins: [nodeResolve({ preferBuiltins: true }), dts(), multiEntry()],
    external: [...Object.keys(pkg.dependencies || {})],
  },
]
