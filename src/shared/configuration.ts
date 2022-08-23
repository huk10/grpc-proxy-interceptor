export interface Repository {
  // git 仓库地址
  url: string;
  // proto 文件存放目录（如果是根目录则可不传）
  source?: string;
  // git 仓库对应的分支名（默认是 master 分支）
  branch?: string;
}

export interface GenerateOptions {
  // 是否输出执行的命令（默认：false）
  debug?: boolean;
  // openapi 文件输出目录（默认：openapi）
  openapiDir?: string;
  // 目录名称-不包含路径（默认：openapi-proxy-build）
  buildDir?: string;
  // 是否禁用 rm 命令（默认：false）
  disabledRemoveCommand?: boolean;
  // 依赖的git仓库地址列表
  gitRepository?: Array<Repository>;
}

export type Getaway =
  | string
  | ((value: { filePath: string; callPath: string }) => string);

// 拦截器的配置选项
export interface OpenapiInterceptorOptions {
  // grpc-gateway 服务地址
  getaway: Getaway;
  // 是否开启拦截器
  enable: boolean;
  // openapi 目录
  openapiDir: string;
}

// 配置项
export type Configuration = OpenapiInterceptorOptions & GenerateOptions;

// 默认配置
export const defaultConfiguration: Configuration = {
  debug: false,
  enable: false,
  getaway: "",
  gitRepository: [],
  openapiDir: "openapi",
  buildDir: "openapi-proxy-build",
  disabledRemoveCommand: false,
};
