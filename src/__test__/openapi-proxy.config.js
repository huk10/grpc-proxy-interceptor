// 这个文件仅被 configuration.test.ts 引用
/** @type {import("../src/type").Configuration} */
const config = {
  // 是否启用拦截器
  enable: true,
  // grpc-getaway 服务地址
  getaway: "127.0.0.1:4501",
  // openapi 文件输出目录
  openapiDir: 'openapi',
}

export default config
