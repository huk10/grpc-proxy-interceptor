import { OpenAPIV2 } from "openapi-types";
import { readFile } from "node:fs/promises";
import { Metadata } from "@grpc/grpc-js";
import { toMetadata } from "./grpc-utils";

/**
 * 处理 URL 上 的params
 * @param parameters {OpenAPIV2.Parameters[]}
 * @param data {object}
 * @return {{[key: string]: string} | null}
 */
export function handleParameters(
  parameters: OpenAPIV2.Parameters[],
  data: unknown
): Record<string, string> | null {
  if (!Array.isArray(parameters)) {
    return null;
  }
  return parameters.reduce((param, schema) => {
    // @ts-ignore
    param[schema.name] = data[schema.name];
    return param;
  }, {});
}

/**
 * 转换 Metadata 到 grpc-getaway 库支持的形式
 * ! 注意此处不确定 axios node 端是否支持 Buffer 类型的 value
 * @param metadata {Metadata}
 * @return {{[key: string]: string}}
 */
export function toMetadataHeader(metadata: Metadata): Record<string, string> {
  // buffer 的 header axios 不支持吗？
  return Object.entries(metadata.getMap()).reduce(
    (headers, [key, value]) => {
      headers[`Grpc-Metadata-${key}`] = value as unknown as string;
      return headers;
    },
    // 必须加这个头才能接收到 trailers headers
    { TE: "trailers" } as Record<string, string>
  );
}

/**
 * 从响应 Headers 中获取metadata
 * grpc 的 Header 和 Trailer 两种 metadata 都从这里获取。这里无法区分，所以客户端从这两个地方取的 Metadata 都会是相同的。
 * @param headers {{[key: string]: string}}
 * @return {Metadata}
 */
export function getMetadataFromHeader(
  headers: Record<string, string>
): Metadata {
  const kv = Object.entries(headers)
    .filter(([value]) => value.startsWith("grpc-metadata-"))
    .reduce((prev, [key, value]) => {
      prev[key.replace(/^grpc-metadata-/, "")] = value as string;
      return prev;
    }, {} as Record<string, string>);
  return toMetadata(kv);
}

// FIXME trailers 为什么会重复呢？这不知道咋处理了。暂时先只取一个值
export function getTrailersMetadata(rawHeaders: string[]): Metadata {
  const record = {};
  for (let i = 0, len = rawHeaders.length; i < len; i += 2) {
    // @ts-ignore
    // record[rawHeaders[i]] = Array.isArray(record[rawHeaders[i]]) ? record[rawHeaders[i]].concat(rawHeaders[i+1]) : [rawHeaders[i+1]]
    record[rawHeaders[i]] = rawHeaders[i + 1];
  }
  return toMetadata(
    Object.entries(record).reduce((header, [key, value]) => {
      header[key.replace(/^Grpc-Trailer-/, "")] = value as string;
      return header;
    }, {} as Record<string, string>)
  );
}

/**
 * 解析一个 openapi 文件到 json 格式
 * @param url {string}
 * @return {Promise<OpenAPIV2.Document>}
 */
export async function parseOpenApiSpec(
  url: string
): Promise<OpenAPIV2.Document> {
  const str = await readFile(url, "utf8");
  return JSON.parse(str);
}
