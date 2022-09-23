import { RequestID } from "./openapi-v2-parser";
import { Metadata, MetadataValue, StatusObject } from "@grpc/grpc-js";

export interface CallResult<Response> {
  response: Response;
  metadata: Metadata;
  status: StatusObject;
}

/**
 * 转换成 grpc 的 Metadata 对象
 * @param metadata1 {{[key: string]: string}}
 * @return {Metadata}
 */
export function toMetadata(metadata1: Record<string, MetadataValue>): Metadata {
  const metadata = new Metadata();
  for (const [key, value] of Object.entries(metadata1)) {
    metadata.set(key, value);
  }
  return metadata;
}

// 解析 rpc 的方法调用 path
// 正则：/\/(?<pkg>.+)\.(?<service>.+)(?=\/)\/(?<method>.+)/
// 输入：/example.greeter.v1.services.Greeter/SayHello
// groups = {pkg: 'example.greeter.v1.services', service: 'Greeter', method: 'SayHello'}
// callPath = /<package名>.<service名>/<rpc名>
// 这里注意：像 googleapis 的规范中 package 名是多段的如：google.ads.v11.services
export function parseCallPath(callPath: string): RequestID {
  const match = callPath.match(
    /\/(?<pkg>.+)\.(?<service>.+)(?=\/)\/(?<method>.+)/
  );
  if (!match?.groups) throw new Error("rpc path parse error!");
  const { pkg, service, method } = match.groups;
  return {
    package: pkg,
    method: method,
    service: service,
  };
}
