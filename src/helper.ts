import { resolve } from "node:path";
import { exec } from "node:child_process";
import { readdir, stat } from "node:fs/promises";
import * as protoLoader from "@grpc/proto-loader";
import { Configuration, defaultConfiguration } from "./type";
import { statSync } from "fs";

/*---------------------- shell ----------------------*/
/**
 * 执行一个 shell 命令
 * @param command {string}
 * @return {Promise<string>}
 */
export function shell(command:string):Promise<string> {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) reject(error);
      if (stderr) reject(error);
      resolve(stdout);
    });
  });
}

/**
 * 获取一个命令的 PATH
 * @param command {string}
 * @return {Promise<string>}
 */
export function which(command:string):Promise<string> {
  return shell(`which ${command}`)
}

/**
 * 检查一个命令是否存在
 * @param command {string}
 * @return {Promise<boolean>}
 */
export function checkCommandIsExist(command:string):Promise<boolean> {
  return which(command).then(() => true).catch(() => false)
}

/*---------------------- git ----------------------*/
/**
 * 检查 git 仓库是否存在指定的远程分支。
 * @param repo {string} - git 仓库地址
 * @param branch {string} - 指定的远程仓库
 */
export async function isExistBranch(repo:string, branch:string):Promise<boolean> {
  const result = await shell(`git ls-remote --heads ${repo} ${branch} --exit-code`)
  return !!result
}

/*---------------------- fs ----------------------*/
/**
 * 获取目录下所有文件
 * @param path {string} - 目录绝对路径
 * @return {Promise<string[]>}
 */
async function getAllTheFilesInTheDirectory(path:string):Promise<string[]> {
  const paths: string[] = []
  const stack: string[] = [path]
  const pathStat = await stat(path);
  const defaultIgnore = ["node_modules", ".git", ".vscode", ".idea"]
  if (!pathStat.isDirectory()) {
    return paths
  }
  while ( stack.length > 0 ) {
    const url = stack.pop() as string
    const dirs = await readdir(url);
    for (const part of dirs) {
      const nextUri = resolve(url, part);
      const info = await stat(nextUri);
      if (info.isDirectory() && !defaultIgnore.includes(part)) {
        stack.push(nextUri)
        continue;
      }
      if (info.isFile()) {
        paths.push(nextUri)
      }
    }
  }
  return paths
}

/**
 * 对目录下文件进行遍历
 * @param uri {string} - 目录绝对路径
 * @param callback {(url: string) => void | Promise<void>}
 */
export async function fsForEach(uri:string, callback: (url:string) => void|Promise<void>):Promise<void> {
  const paths = await getAllTheFilesInTheDirectory(uri)
  for (const path of paths) {
    await callback(path)
  }
}

/**
 * 对目录下文件进行过滤
 * @param uri {string} - 目录绝对路径
 * @param callback {(url: string) => boolean | Promise<boolean>}
 * @return {Promise<string[]>}
 */
export async function fsFilter(uri:string, callback: (url:string) => boolean|Promise<boolean>):Promise<string[]> {
  const array = []
  for (const path of await getAllTheFilesInTheDirectory(uri)) {
    if (await callback(path)) {
      array.push(path)
    }
  }
  return array
}

/**
 * 检查路径是否存在
 * @param url {string} - 绝对路径
 * @return {Promise<boolean>}
 */
export async function checkPathIsExist (url:string):Promise<boolean> {
  try {
    await stat(url)
    return true
  } catch (err) {
    return false
  }
}

/**
 * 同步检查路径是否存在
 * @param url {string} - 绝对路径
 * @return {Promise<boolean>}
 */
export function checkPathIsExistSync (url:string):boolean {
  try {
    statSync(url)
    return true
  } catch (err) {
    return false
  }
}

/*---------------------- proto ----------------------*/
/**
 * 是否存在 Service 定义
 * @param proto {string} - protobuf 文件地址
 * @param options {protoLoader.Options} - protoLoader.load 的options参数
 * @return {Promise<boolean>}
 */
export async function isExistService(proto:string, options:protoLoader.Options={}):Promise<boolean> {
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
export async function getProtoFileInDirectory(uri:string, includeDirs?: string[]):Promise<string[]> {
  return fsFilter(uri, async (proto) => {
    if ( !proto.endsWith( ".proto" ) ) return false;
    return isExistService(proto, {
      // 一般来说 includeDirs 就是其根目录
      includeDirs: Array.isArray(includeDirs) ? includeDirs : [uri]
    })
  })
}

/*---------------------- logic ----------------------*/
/**
 * 对 Promise<boolean> 进行取反
 * @param value {Promise<boolean>|boolean}
 * @return {Promise<boolean>}
 */
export async function negate(value:Promise<boolean>|boolean):Promise<boolean> {
  const result = await value
  return !result
}

/**
 * 加载配置文件
 * @param [path=./openapi-proxy.config.js] {string} 配置文件相对于 process.cwd()
 * @return {Configuration}
 */
export async function loadConfiguration(path= "./openapi-proxy.config.js"):Promise<Configuration> {
  const configurationPath = resolve(process.cwd(), path)
  if (await (checkPathIsExist(configurationPath))) {
    const result = await import(configurationPath)
    return Object.assign({}, defaultConfiguration, result.default)
  }
  return defaultConfiguration
}
