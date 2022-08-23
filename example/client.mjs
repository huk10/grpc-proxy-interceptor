import { resolve } from "node:path";
import protoLoader from "@grpc/proto-loader";
import { fileURLToPath, URL } from "node:url";
import grpc, { Metadata } from "@grpc/grpc-js";
import { openapiInterceptor } from "../lib/index.mjs";
const dirname = fileURLToPath(new URL(".", import.meta.url));

/**
 * @type import("@grpc/proto-loader").Options
 */
const options = {
  defaults: true,
  keepCase: false,
  includeDirs: [resolve(dirname, "./proto")],
};

const packageDefinition = protoLoader.loadSync(
  resolve(dirname, "./proto/greeter/v1/services/greeter.proto"),
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
      await openapiInterceptor({
        // 是否启用拦截器
        enable: true,
        // grpc-getaway 服务地址
        getaway: "http://127.0.0.1:4501",
        // openapi 文件输出目录
        openapiDir: "openapi",
      }),
    ],
  }
);

const emitter = client.SayHello(
  { name: "Li Ming" },
  new Metadata(),
  (err, res) => {
    if (err) {
      return console.log("error:", err);
    }
    console.log("result:", res);
  }
);

emitter.on("status", (status) => {
  console.log("status:", status, status.metadata.toJSON());
});
emitter.on("metadata", (md) => {
  console.log("metadata:", md);
});
