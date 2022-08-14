import grpc from "@grpc/grpc-js"
import {resolve} from "node:path"
import protoLoader from "@grpc/proto-loader"
import { grpcGatewayProxyInterceptor } from "../lib/index.mjs";

/**
 * @type import("@grpc/proto-loader").Options
 */
const options = {
  // 是否保留字段名称，转换为大驼峰
  keepCase: false,
  // long 数字转换成字符串
  longs: 'string',
  // 枚举转换为字符串
  enums: 'string',
}

const packageDefinition = protoLoader.loadSync(resolve(process.cwd(), "proto/greeter/v1/services/greeter.proto"), options)

const grpcObject = grpc.loadPackageDefinition(packageDefinition)

/**
 * @type import("@grpc/grpc-js").ServiceClientConstructor
 */
const GreeterClient = grpcObject.example.greeter.v1.services.Greeter

const client = new GreeterClient("127.0.0.1:9091", grpc.credentials.createInsecure(), {
  interceptors: [
    await grpcGatewayProxyInterceptor()
  ]
})

client.SayHello( {name: "Li Ming"},  {traceId: "11111"}, (err, value) => {
  console.log(value)
})

