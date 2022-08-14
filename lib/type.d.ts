/**
 * @typedef JSDocInterceptorOptions
 * @type {object}
 * @property {string} getaway - grpc-gateway 服务地址
 * @property {boolean} [enable=false] - 是否开启拦截器
 * @property {string} openapiDir - openapi 目录
 */
export interface InterceptorOptions {
    getaway: string;
    enable: boolean;
    openapiDir: string;
}
/**
 * @typedef JSDocRepository
 * @type {object}
 * @property {string} url - git 仓库地址
 * @property {string} [source] - proto 文件存放目录（如果是根目录则可不传）
 * @property {string} [branch=master] - git 仓库对应的分支名（默认是 master 分支）
 */
export interface Repository {
    url: string;
    source?: string;
    branch?: string;
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
    debug?: boolean;
    outputDir?: string;
    buildDir?: string;
    disabledRemoveCommand?: boolean;
    gitRepository?: Array<Repository>;
}
export interface Configuration {
    debug?: boolean;
    enable: boolean;
    getaway: string;
    buildDir?: string;
    openapiDir?: string;
    gitRepository?: Repository[];
    disabledRemoveCommand?: boolean;
}
export declare const defaultConfiguration: Configuration;
