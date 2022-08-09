import { fsFilter } from "./utils.mjs";
import * as protoLoader from "@grpc/proto-loader"

/**
 * 是否存在 Service 定义
 * @param proto {string} - protobuf 文件地址
 * @param options - protoLoader.load 的options参数
 * @return {Promise<boolean>}
 */
export async function isExistService(proto, options = {}) {
  const packageDefinition = await protoLoader.load(proto, options)
  for (const key of Object.keys(packageDefinition)) {
    // 如果存在 format 属性就不是一个 Service 结构
    if (!packageDefinition[key].format) {
      return true
    }
  }
  return false
}

// 获取目录下所有的 proto 文件（仅包含 rpc service 的 proto 文件）
export async function getProtoFileInDirectory(uri) {
  return fsFilter(uri, async (proto) => {
    if ( !proto.endsWith( ".proto" ) ) return false;
    return isExistService(proto)
  })
}
