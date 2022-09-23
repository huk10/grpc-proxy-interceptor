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
export declare function toMetadata(
  metadata1: Record<string, MetadataValue>
): Metadata;
export declare function parseCallPath(callPath: string): RequestID;
