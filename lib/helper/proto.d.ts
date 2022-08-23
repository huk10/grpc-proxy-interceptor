import * as protoLoader from "@grpc/proto-loader";
/**
 * 是否存在 Service 定义
 * @param proto {string} - protobuf 文件地址
 * @param options {protoLoader.Options} - protoLoader.load 的options参数
 * @return {Promise<boolean>}
 */
export declare function isExistService(
  proto: string,
  options?: protoLoader.Options
): Promise<boolean>;
/**
 * 获取目录下所有的 proto 文件（仅包含 rpc service 的 proto 文件）
 * @param uri {string} - proto 存放路径。
 * @param [includeDirs] {string[]} proto 文件中 import 其他 proto 的相对目录
 * @return {Promise<string[]>}
 */
export declare function getProtoFileInDirectory(
  uri: string,
  includeDirs?: string[]
): Promise<string[]>;
