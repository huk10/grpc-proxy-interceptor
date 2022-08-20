import {resolve} from 'node:path'
import {checkPathIsExist} from '../helper/fs'

export interface Repository {
  // git 仓库地址
  url: string
  // proto 文件存放目录（如果是根目录则可不传）
  source?: string
  // git 仓库对应的分支名（默认是 master 分支）
  branch?: string
}

// 配置项
export interface Configuration {
  // 是否输出执行的命令（默认：false）
  debug?: boolean
  // 是否开启拦截器
  enable: boolean
  // grpc-gateway 服务地址
  getaway: string
  // 目录名称-不包含路径（默认：openapi-proxy-build）
  buildDir?: string
  // openapi 文件输出目录（默认：openapi）
  openapiDir?: string
  // 依赖的git仓库地址列表
  gitRepository?: Repository[]
  // 是否禁用 rm 命令（默认：false）
  disabledRemoveCommand?: boolean
}

// 默认配置
export const defaultConfiguration: Configuration = {
  debug: false,
  enable: false,
  getaway: '',
  gitRepository: [],
  openapiDir: 'openapi',
  buildDir: 'openapi-proxy-build',
  disabledRemoveCommand: false,
}

/**
 * 加载配置文件
 * @param [path=./openapi-proxy.config.js] {string} 配置文件相对于 process.cwd()
 * @return {Configuration}
 */
export async function loadConfiguration(path = './openapi-proxy.config.js'): Promise<Configuration> {
  const configurationPath = resolve(process.cwd(), path)
  if (await checkPathIsExist(configurationPath)) {
    const result = await import(configurationPath)
    return Object.assign({}, defaultConfiguration, result.default)
  }
  return defaultConfiguration
}
