// 拦截器的配置选项
/**
 * @typedef JSDocInterceptorOptions
 * @type {object}
 * @property {string} getaway - grpc-gateway 服务地址
 * @property {boolean} [enable=false] - 是否开启拦截器
 * @property {string} openapiDir - openapi 目录
 */
export interface InterceptorOptions {
  // grpc-gateway 服务地址
  getaway: string
  // 是否开启拦截器
  enable: boolean
  // openapi 目录
  openapiDir: string
}

/**
 * @typedef JSDocRepository
 * @type {object}
 * @property {string} url - git 仓库地址
 * @property {string} [source] - proto 文件存放目录（如果是根目录则可不传）
 * @property {string} [branch=master] - git 仓库对应的分支名（默认是 master 分支）
 */
export interface Repository {
  // git 仓库地址
  url: string
  // proto 文件存放目录（如果是根目录则可不传）
  source?: string
  // git 仓库对应的分支名（默认是 master 分支）
  branch?: string
}

/**
 * @typedef JSDocGenerateOptions
 * @type {object}
 * @property {boolean} [debug=false] - 是否输出执行的命令（默认：false）
 * @property {string} [outputDir=openapi] - openapi 文件输出目录（默认：openapi）
 * @property {string} [buildDir=grpc-proxy-build] - 目录名称-不包含路径（默认：grpc-proxy-build）
 * @property {boolean} [disabledRemoveCommand=false] - 是否禁用 rm 命令（默认：false）
 * @property {array<JSDocRepository>} gitRepository - 依赖的git仓库地址列表
 */
export interface GenerateOptions {
  // 是否输出执行的命令（默认：false）
  debug?: boolean
  // openapi 文件输出目录（默认：openapi）
  outputDir?: string
  // 目录名称-不包含路径（默认：grpc-proxy-build）
  buildDir?: string
  // 是否禁用 rm 命令（默认：false）
  disabledRemoveCommand?: boolean
  // 依赖的git仓库地址列表
  gitRepository?: Array<Repository>
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
export const defaultConfiguration:Configuration = {
  debug: false,
  enable: false,
  getaway: '',
  gitRepository: [],
  openapiDir: "openapi",
  buildDir: 'openapi-proxy-build',
  disabledRemoveCommand: false,
}
