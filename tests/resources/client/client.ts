import { resolve } from "node:path";
import * as grpc from "@grpc/grpc-js";
import { interceptor } from "../../../src";
import { fileURLToPath, URL } from "node:url";
import * as protoLoader from "@grpc/proto-loader";
import { openapiInterceptorSync } from "../../../src";

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

export function clientWithInterceptor() {
  return new GreeterClient(
    "127.0.0.1:9091",
    grpc.credentials.createInsecure(),
    {
      interceptors: [
        openapiInterceptorSync({
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
export function clientWithGrpcWeb() {
  return new GreeterClientV2(
    "127.0.0.1:9091",
    grpc.credentials.createInsecure(),
    {
      interceptors: [
        interceptor({
          enable: true,
          // grpc-getaway 服务地址
          getaway: "http://127.0.0.1:4501",
        }),
      ],
    }
  );
}
