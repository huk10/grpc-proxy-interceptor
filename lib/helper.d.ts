import * as protoLoader from "@grpc/proto-loader";
import { Configuration } from "./type";
/**
 * 执行一个 shell 命令
 * @param command {string}
 * @return {Promise<string>}
 */
export declare function shell(command: string): Promise<string>;
/**
 * 获取一个命令的 PATH
 * @param command {string}
 * @return {Promise<string>}
 */
export declare function which(command: string): Promise<string>;
/**
 * 检查一个命令是否存在
 * @param command {string}
 * @return {Promise<boolean>}
 */
export declare function checkCommandIsExist(command: string): Promise<boolean>;
/**
 * 检查 git 仓库是否存在指定的远程分支。
 * @param repo {string} - git 仓库地址
 * @param branch {string} - 指定的远程仓库
 */
export declare function isExistBranch(repo: string, branch: string): Promise<boolean>;
/**
 * 对目录下文件进行遍历
 * @param uri {string} - 目录绝对路径
 * @param callback {(url: string) => void | Promise<void>}
 */
export declare function fsForEach(uri: string, callback: (url: string) => void | Promise<void>): Promise<void>;
/**
 * 对目录下文件进行过滤
 * @param uri {string} - 目录绝对路径
 * @param callback {(url: string) => boolean | Promise<boolean>}
 * @return {Promise<string[]>}
 */
export declare function fsFilter(uri: string, callback: (url: string) => boolean | Promise<boolean>): Promise<string[]>;
/**
 * 检查路径是否存在
 * @param url {string} - 绝对路径
 * @return {Promise<boolean>}
 */
export declare function checkPathIsExist(url: string): Promise<boolean>;
/**
 * 是否存在 Service 定义
 * @param proto {string} - protobuf 文件地址
 * @param options - protoLoader.load 的options参数
 * @return {Promise<boolean>}
 */
export declare function isExistService(proto: string, options?: protoLoader.Options): Promise<boolean>;
/**
 * 获取目录下所有的 proto 文件（仅包含 rpc service 的 proto 文件）
 * @param uri
 * @return {Promise<string[]>}
 */
export declare function getProtoFileInDirectory(uri: string): Promise<string[]>;
/**
 * 对 Promise<boolean> 进行取反
 * @param value {Promise<boolean>|boolean}
 * @return {Promise<boolean>}
 */
export declare function negate(value: Promise<boolean> | boolean): Promise<boolean>;
/**
 * 加载配置文件
 * @param [path=./openapi-proxy.config.js] {string} 配置文件相对于 process.cwd()
 * @return {Configuration}
 */
export declare function loadConfiguration(path?: string): Promise<Configuration>;
