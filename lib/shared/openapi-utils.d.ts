import { OpenAPIV2 } from "openapi-types";
import { Metadata } from "@grpc/grpc-js";
/**
 * 处理 URL 上 的params
 * @param parameters {OpenAPIV2.Parameters[]}
 * @param data {object}
 * @return {{[key: string]: string} | null}
 */
export declare function handleParameters(
  parameters: OpenAPIV2.Parameters[],
  data: unknown
): Record<string, string> | null;
/**
 * 转换 Metadata 到 grpc-getaway 库支持的形式
 * ! 注意此处不确定 axios node 端是否支持 Buffer 类型的 value
 * @param metadata {Metadata}
 * @return {{[key: string]: string}}
 */
export declare function toMetadataHeader(
  metadata: Metadata
): Record<string, string>;
/**
 * 从响应 Headers 中获取metadata
 * grpc 的 Header 和 Trailer 两种 metadata 都从这里获取。这里无法区分，所以客户端从这两个地方取的 Metadata 都会是相同的。
 * @param headers {{[key: string]: string}}
 * @return {Metadata}
 */
export declare function getMetadataFromHeader(
  headers: Record<string, string>
): Metadata;
export declare function getTrailersMetadata(rawHeaders: string[]): Metadata;
/**
 * 解析一个 openapi 文件到 json 格式
 * @param url {string}
 * @return {Promise<OpenAPIV2.Document>}
 */
export declare function parseOpenApiSpec(
  url: string
): Promise<OpenAPIV2.Document>;
