import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import typescript from '@rollup/plugin-typescript'

/** @type import('rollup').RollupOptions */
const config = {
  input: 'src/index.ts',
  output: [
    {
      format: 'esm',
      dir: 'lib',
    },
    {
      format: 'cjs',
      dir: 'lib',
    },
  ],
  external: ['@grpc/proto-loader', '@grpc/grpc-js'],
  plugins: [commonjs(), json(), typescript({tsconfig: './tsconfig.build.json'})],
}

export default [
  {
    ...config,
    input: '',
  },
]
