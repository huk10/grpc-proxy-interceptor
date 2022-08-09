import {resolve} from "node:path"
import { readdir, stat } from "node:fs/promises";

// 获取目录下所有文件
async function getAllTheFilesInTheDirectory( uri) {
  const paths = []
  const dirs = await readdir(uri);
  for (const dir of dirs) {
    const nextUri = resolve(uri, dir);
    const info = await stat(nextUri);
    if (info.isDirectory()) {
      const value = await getAllTheFilesInTheDirectory(nextUri);
      paths.push(...value)
      continue;
    }
    paths.push(nextUri)
  }
  return paths
}

// 对目录下文件进行遍历
export async function fsForEach(uri, callback) {
  const paths = await getAllTheFilesInTheDirectory(uri)
  for (const path of paths) {
    await callback(path)
  }
}

// 对目录下文件进行过滤
export async function fsFilter(uri, callback) {
  const array = []
  const paths = await getAllTheFilesInTheDirectory(uri)
  for (const path of paths) {
    if (await callback(path)) {
      array.push(path)
    }
  }
  return array
}

// 对 Promise<boolean> 进行区反
export async function negate(value) {
  const result = await value
  return !result
}

/**
 * 检查路径是否存在
 * @param url {string}
 */
export async function checkPathIsExist (url) {
  try {
    await stat(url)
    return true
  } catch (err) {
    return false
  }
}
