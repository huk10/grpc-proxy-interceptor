import { Metadata } from "@grpc/grpc-js";
import { Status } from "@grpc/grpc-js/src/constants";
import { StatusCodes as httpStatus } from "http-status-codes";
export declare function httpStatus2GrpcStatus(code: httpStatus): Status;
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
