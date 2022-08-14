import json from "@rollup/plugin-json";
import commonjs from '@rollup/plugin-commonjs';
import typescript from "@rollup/plugin-typescript";

/** @type import('rollup').RollupOptions */
const config = {
  input: 'src/index.ts',
  output: [
    {
      file: 'lib/bundle.mjs',
      format: 'esm'
    },
    {
      file: 'lib/bundle.js',
      format: 'cjs'
    }
  ],
  external: [
    "swagger-client",
    "@grpc/proto-loader",
    "@grpc/grpc-js"
  ],
  plugins: [commonjs(), json(), typescript({tsconfig: "./tsconfig.build.json"})]
};

export default config
