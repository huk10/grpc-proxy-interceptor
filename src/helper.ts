import { resolve } from "node:path";
import { readdirSync, statSync } from "fs";
import { readdir, stat } from "node:fs/promises";

type Callback = (url: string) => void | Promise<void>;

/**
 * 获取目录下所有文件
 * @param path {string} - 目录绝对路径
 * @return {Promise<string[]>}
 */
async function getAllTheFilesInTheDirectory(path: string): Promise<string[]> {
  const paths: string[] = [];
  const stack: string[] = [path];
  const pathStat = await stat(path);
  const defaultIgnore = ["node_modules", ".git", ".vscode", ".idea"];
  if (!pathStat.isDirectory()) {
    return paths;
  }
  while (stack.length > 0) {
    const url = stack.pop() as string;
    const dirs = await readdir(url);
    for (const part of dirs) {
      const nextUri = resolve(url, part);
      const info = await stat(nextUri);
      if (info.isDirectory() && !defaultIgnore.includes(part)) {
        stack.push(nextUri);
        continue;
      }
      if (info.isFile()) {
        paths.push(nextUri);
      }
    }
  }
  return paths;
}

/**
 * 对目录下文件进行遍历
 * @param uri {string} - 目录绝对路径
 * @param callback {(url: string) => void | Promise<void>}
 */
export async function forEachDirectory(
  uri: string,
  callback: Callback
): Promise<void> {
  const paths = await getAllTheFilesInTheDirectory(uri);
  for (const path of paths) {
    await callback(path);
  }
}

/**
 * 同步对目录下文件进行遍历
 * @param {string} path
 * @param {Callback} callback
 */
export function forEachDirectorySync(path: string, callback: Callback) {
  const stack: string[] = [path];
  const pathStat = statSync(path);
  const defaultIgnore = ["node_modules", ".git", ".vscode", ".idea"];
  if (!pathStat.isDirectory()) {
    return;
  }
  while (stack.length > 0) {
    const url = stack.pop() as string;
    const dirs = readdirSync(url);
    for (const part of dirs) {
      const nextUri = resolve(url, part);
      const info = statSync(nextUri);
      if (info.isDirectory() && !defaultIgnore.includes(part)) {
        stack.push(nextUri);
        continue;
      }
      if (info.isFile()) {
        callback(nextUri);
      }
    }
  }
}

/**
 * 检查路径是否存在
 * @param url {string} - 绝对路径
 * @return {Promise<boolean>}
 */
export async function checkPathIsExist(url: string): Promise<boolean> {
  try {
    await stat(url);
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * 同步检查路径是否存在
 * @param url {string} - 绝对路径
 * @return {Promise<boolean>}
 */
export async function checkPathIsExistSync(url: string): Promise<boolean> {
  try {
    statSync(url);
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * 是否是一个有效的 URL
 * @param url {string}
 * @return {boolean}
 */
export function isValidUrl(url: string): boolean {
  return /^https?:\/\/.+?/.test(url);
}
