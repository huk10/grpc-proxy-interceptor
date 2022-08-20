import {fsFilter} from './fs'
import * as protoLoader from '@grpc/proto-loader'

/**
 * 是否存在 Service 定义
 * @param proto {string} - protobuf 文件地址
 * @param options {protoLoader.Options} - protoLoader.load 的options参数
 * @return {Promise<boolean>}
 */
export async function isExistService(proto: string, options: protoLoader.Options = {}): Promise<boolean> {
  const packageDefinition = await protoLoader.load(proto, options)
  for (const key of Object.keys(packageDefinition)) {
    // 如果存在 format 属性就不是一个 Service 结构
    if (!packageDefinition[key].format) {
      return true
    }
  }
  return false
}

/**
 * 获取目录下所有的 proto 文件（仅包含 rpc service 的 proto 文件）
 * @param uri {string} - proto 存放路径。
 * @param [includeDirs] {string[]} proto 文件中 import 其他 proto 的相对目录
 * @return {Promise<string[]>}
 */
export async function getProtoFileInDirectory(uri: string, includeDirs?: string[]): Promise<string[]> {
  return fsFilter(uri, async proto => {
    if (!proto.endsWith('.proto')) return false
    return isExistService(proto, {
      // 一般来说 includeDirs 就是其根目录
      includeDirs: Array.isArray(includeDirs) ? includeDirs : [uri],
    })
  })
}
