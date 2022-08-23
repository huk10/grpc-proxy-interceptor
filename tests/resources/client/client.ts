import { resolve } from "node:path";
import * as grpc from "@grpc/grpc-js";
import { fileURLToPath, URL } from "node:url";
import * as protoLoader from "@grpc/proto-loader";
import { interceptor } from "../../../src/grpc-web-interceptor";
import { openapiInterceptor as openapiInterceptor } from "../../../src/openapi-interceptor";

const dirname = fileURLToPath(new URL(".", import.meta.url));

const options: protoLoader.Options = {
  // 是否保留字段名称，转换为大驼峰
  keepCase: false,
  // 保留默认值如：布尔值如果为 false 现在会保留这个字段
  defaults: true,
  // proto 文件的根目录，关系到如何解析 proto 文件的相互 import
  includeDirs: [resolve(dirname, "../grpc-server/proto")],
};

// 服务端提供 grpc-gateway（这个是 go 的包，不知道其他语言是否有支持） 的实现
const grpGatewayServerDefinition = resolve(
  dirname,
  "../grpc-server/proto/greeter/v1/services/greeter.proto"
);
// 服务端提供 grpc-web+json 的实现（grpc-gateway 也有实现这个。）
const grpGatewayServerDefinitionV2 = resolve(
  dirname,
  "../grpc-server/proto/greeter/v2/services/greeter.proto"
);

const packageDefinition = protoLoader.loadSync(
  grpGatewayServerDefinition,
  options
);
const packageDefinitionV2 = protoLoader.loadSync(
  grpGatewayServerDefinitionV2,
  options
);

const grpcObject = grpc.loadPackageDefinition(packageDefinition);
const grpcObjectV2 = grpc.loadPackageDefinition(packageDefinitionV2);

// @ts-ignore
const GreeterClient = grpcObject.example.greeter.v1.services
  .Greeter as typeof grpc.Client;

// @ts-ignore
const GreeterClientV2 = grpcObjectV2.example.greeter.v2.services
  .Greeter as typeof grpc.Client;

export const client = new GreeterClient(
  "127.0.0.1:9091",
  grpc.credentials.createInsecure()
);

export async function clientWithInterceptor() {
  return new GreeterClient(
    "127.0.0.1:9091",
    grpc.credentials.createInsecure(),
    {
      interceptors: [
        await openapiInterceptor({
          // 是否启用拦截器
          enable: true,
          // grpc-getaway 服务地址
          getaway: "http://127.0.0.1:4501",
          // openapi 文件输出目录
          openapiDir: resolve(dirname, "../grpc-server/openapi"),
        }),
      ],
    }
  );
}

// 服务端支持 gRPC-Web 协议
export async function clientWithGrpcWeb() {
  return new GreeterClientV2(
    "127.0.0.1:9091",
    grpc.credentials.createInsecure(),
    {
      interceptors: [
        interceptor({
          // grpc-getaway 服务地址
          getaway: "http://127.0.0.1:4501",
        }),
      ],
    }
  );
}

//
// function toMetadata(metadata1) {
//   const metadata = new Metadata();
//   for (const [key, value] of Object.entries(metadata1)) {
//     metadata.set(key, value);
//   }
//   return metadata;
// }
// const record = { code: "1234", buf: "buffer", hello: "word" };
// const rmd = toMetadata(record);
//
// // const emitter = client.SayHello({ name: "Li Ming" }, rmd, (err, res) => {
// // const emitter = client.Metadata({metadata: record}, rmd, (err, res) => {
// // const emitter = client.Status({status: status.INTERNAL, errorMsg: "hihhii"}, rmd, (err, res) => {
// // const emitter = client.Metadata({metadata: record}, rmd, (err, res) => {
// const emitter = client.Trailer({ metadata: record }, rmd, (err, res) => {
//   if (err) {
//     return console.log("error:", err);
//   }
//   console.log("result:", res);
// });
// emitter.on("status", (status) => {
//   console.log("status:", status);
// });
// emitter.on("metadata", (md) => {
//   console.log("metadata:", md);
// });
