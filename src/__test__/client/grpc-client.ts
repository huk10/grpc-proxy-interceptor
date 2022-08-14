import {resolve} from "node:path"
import * as grpc from "@grpc/grpc-js"
import { fileURLToPath, URL } from "node:url";
import * as protoLoader from "@grpc/proto-loader"
import { grpcGatewayProxyInterceptor } from "../..";
import { ServiceClientConstructor } from "@grpc/grpc-js";

const dirname = fileURLToPath(new URL(".", import.meta.url))

/**
 * @type import("@grpc/proto-loader").Options
 */
const options = {
  // 是否保留字段名称，不转换为小驼峰
  keepCase: false,
  // 需要设置此项，不然返回的 bool = false 将会去掉字段
  defaults: true,
  includeDirs: [resolve(dirname, "../proto")]
}

const packageDefinition = protoLoader.loadSync(resolve(dirname,  "../proto/greeter.proto"), options)

const grpcObject = grpc.loadPackageDefinition(packageDefinition)

// @ts-ignore
const GreeterClient = grpcObject.example.greeter.v1.services.Greeter as ServiceClientConstructor

export const client = new GreeterClient("127.0.0.1:9091", grpc.credentials.createInsecure(), {
  interceptors: []
})

export async function getClientWithInterceptor() {
  return new GreeterClient("127.0.0.1:9091", grpc.credentials.createInsecure(), {
    interceptors: [ await grpcGatewayProxyInterceptor({
      // 是否启用拦截器
      enable: true,
      // grpc-getaway 服务地址
      getaway: "127.0.0.1:4501",
      // openapi 文件输出目录
      openapiDir: resolve(dirname, '../server/openapi'),
    }) ]
  })
}
