import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import typescript from "@rollup/plugin-typescript";

/** @type import('rollup').RollupOptions */
const common = {
  external: ["@grpc/proto-loader", "@grpc/grpc-js"],
  plugins: [commonjs(), json(), typescript({ tsconfig: "./tsconfig.build.json" })],
};

export default {
  input: "src/index.ts",
  output: [
    {
      format: "esm",
      file: "lib/index.mjs",
    },
    {
      format: "cjs",
      file: "lib/index.js",
    },
  ],
  ...common,
};
