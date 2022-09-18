import json from "@rollup/plugin-json";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import nodeResolve from "@rollup/plugin-node-resolve";

/** @type import('rollup').RollupOptions */
const common = {
  // external: ["@grpc/proto-loader", "@grpc/grpc-js"],
  plugins: [json(), commonjs(), nodeResolve(), typescript({ tsconfig: "./tsconfig.build.json" })],
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
