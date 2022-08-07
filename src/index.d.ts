import { Interceptor } from "@grpc/grpc-js"

interface InterceptorOptions {
  getaway: string
  enable: boolean
  openapiDir: string
}

declare function grpcGatewayProxyInterceptor (opt: InterceptorOptions): Interceptor;

interface Repository {
  // git 仓库地址
  url: string
  // proto 文件存放目录（如果是根目录则可不传）
  source?: string
  // git 仓库对应的分支名（默认是 master 分支）
  branch?: string
}

interface GenerateOptions {
  // 是否输出执行的命令（默认：false）
  debug?: boolean
  // openapi 文件输出目录（默认：openapi）
  outputDir?: string
  // 目录名称-不包含路径（默认：grpc-proxy-build）
  buildDir?: string
  // 是否禁用 rm 命令（默认：false）
  disabledRemoveCommand?: boolean
  // 依赖的git仓库地址列表
  gitRepository: Array<Repository>
}
declare function generate(opt: GenerateOptions): Promise<void>
