import { Metadata, MetadataValue, StatusObject } from "@grpc/grpc-js";
/**
 * 转换成 grpc 的 Metadata 对象
 * @param metadata1 {{[key: string]: string}}
 * @return {Metadata}
 */
export declare function toMetadata(
  metadata1: Record<string, MetadataValue>
): Metadata;
export interface CallResult<Response> {
  response: Response;
  metadata: Metadata;
  status: StatusObject;
}
