import {resolve} from 'node:path'
import {readdir, stat} from 'node:fs/promises'

/**
 * 获取目录下所有文件
 * @param path {string} - 目录绝对路径
 * @return {Promise<string[]>}
 */
async function getAllTheFilesInTheDirectory(path: string): Promise<string[]> {
  const paths: string[] = []
  const stack: string[] = [path]
  const pathStat = await stat(path)
  const defaultIgnore = ['node_modules', '.git', '.vscode', '.idea']
  if (!pathStat.isDirectory()) {
    return paths
  }
  while (stack.length > 0) {
    const url = stack.pop() as string
    const dirs = await readdir(url)
    for (const part of dirs) {
      const nextUri = resolve(url, part)
      const info = await stat(nextUri)
      if (info.isDirectory() && !defaultIgnore.includes(part)) {
        stack.push(nextUri)
        continue
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
export async function fsForEach(uri: string, callback: (url: string) => void | Promise<void>): Promise<void> {
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
export async function fsFilter(uri: string, callback: (url: string) => boolean | Promise<boolean>): Promise<string[]> {
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
export async function checkPathIsExist(url: string): Promise<boolean> {
  try {
    await stat(url)
    return true
  } catch (err) {
    return false
  }
}
