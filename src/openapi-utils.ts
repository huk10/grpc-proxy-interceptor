import { toMetadata } from "./grpc-utils";
import { Metadata, status } from "@grpc/grpc-js";
import { Status } from "@grpc/grpc-js/src/constants";
import { StatusCodes as httpStatus } from "http-status-codes";

// 该方式是 grpc-getaway 库的转换方式.
// 转换 http 状态码到 gRPC 状态码
// https://github.com/grpc-ecosystem/grpc-gateway/blob/master/runtime/errors.go#L15
// See: https://github.com/googleapis/googleapis/blob/master/google/rpc/code.proto
//
// 下面这三种 code 都会转换成 httpStatus.CONFLICT
// 这里接收到 409 将会只转换为 status.ABORTED（10）
// status.ALREADY_EXISTS
// status.ABORTED
//
// 下面这三种 code 都会转换成 httpStatus.BAD_REQUEST
// 这里接收到 400 将会只转换为 status.INVALID_ARGUMENT（3）
// status.INVALID_ARGUMENT
// status.FAILED_PRECONDITION
// status.OUT_OF_RANGE
//
// 下面这三种 code 都会转换成 httpStatus.INTERNAL_SERVER_ERROR
// 未在上面定义转换的 code 也都会转换为 httpStatus.INTERNAL_SERVER_ERROR
// 这里接收到 500 将会只转换为 status.INTERNAL（13）
// status.INTERNAL
// status.UNKNOWN
// status.DATA_LOSS
export function httpStatus2GrpcStatus(code: httpStatus): Status {
  switch (code) {
    case httpStatus.OK:
      return status.OK;
    case httpStatus.REQUEST_TIMEOUT:
      return status.CANCELLED;
    case httpStatus.INTERNAL_SERVER_ERROR:
      return status.INTERNAL;
    case httpStatus.GATEWAY_TIMEOUT:
      return status.DEADLINE_EXCEEDED;
    case httpStatus.NOT_FOUND:
      return status.NOT_FOUND;
    case httpStatus.FORBIDDEN:
      return status.PERMISSION_DENIED;
    case httpStatus.UNAUTHORIZED:
      return status.UNAUTHENTICATED;
    case httpStatus.TOO_MANY_REQUESTS:
      return status.RESOURCE_EXHAUSTED;
    case httpStatus.BAD_REQUEST:
      return status.INVALID_ARGUMENT;
    case httpStatus.CONFLICT:
      return status.ABORTED;
    case httpStatus.NOT_IMPLEMENTED:
      return status.UNIMPLEMENTED;
    case httpStatus.SERVICE_UNAVAILABLE:
      return status.UNAVAILABLE;
  }
  return status.INTERNAL;
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
    record[rawHeaders[i]] = rawHeaders[i + 1];
  }
  return toMetadata(
    Object.entries(record).reduce((header, [key, value]) => {
      header[key.replace(/^Grpc-Trailer-/, "")] = value as string;
      return header;
    }, {} as Record<string, string>)
  );
}
