import grpc, { Metadata, status } from "@grpc/grpc-js";
import { resolve } from "node:path";
import protoLoader from "@grpc/proto-loader";
import { grpcGatewayProxyInterceptor } from "../lib/bundle.mjs";

/**
 * @type import("@grpc/proto-loader").Options
 */
const options = {
  // 是否保留字段名称，转换为大驼峰
  keepCase: false,
  // long 数字转换成字符串
  longs: "string",
  // 枚举转换为字符串
  enums: "string",
  includeDirs: [resolve(process.cwd(), "src/__test__/proto")],
};

// const packageDefinition = protoLoader.loadSync(resolve(process.cwd(), "proto/greeter/v1/services/greeter.proto"), options)
const packageDefinition = protoLoader.loadSync(
  resolve(process.cwd(), "src/__test__/proto/greeter.proto"),
  options
);

const grpcObject = grpc.loadPackageDefinition(packageDefinition);

/**
 * @type import("@grpc/grpc-js").ServiceClientConstructor
 */
const GreeterClient = grpcObject.example.greeter.v1.services.Greeter;

const client = new GreeterClient(
  "127.0.0.1:9091",
  grpc.credentials.createInsecure(),
  {
    interceptors: [
      await grpcGatewayProxyInterceptor({
        // 是否启用拦截器
        enable: true,
        // grpc-getaway 服务地址
        getaway: "http://127.0.0.1:4501",
        // openapi 文件输出目录
        openapiDir: resolve(process.cwd(), "src/__test__/server/openapi"),
      }),
    ],
  }
);

const emitter = client.SayHello({ name: "Li Ming" }, new Metadata(), (err, res) => {
  if (err) {
    return console.log("error:", err);
  }
  console.log("result:", res);
});

emitter.on("status", (status) => {
  console.log("status:", status, status.metadata.toJSON());
});
emitter.on("metadata", (md) => {
  console.log("metadata:", md);
});
