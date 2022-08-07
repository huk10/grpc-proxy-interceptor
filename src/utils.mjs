import {resolve} from "node:path"
import { readdir, stat } from "node:fs/promises";
// 遍历目录下所有文件
export async function traverseAllTheFilesInTheDirectory(uri, callback) {
  const dirs = await readdir(uri);
  for (const dir of dirs) {
    const nextUri = resolve(uri, dir);
    const info = await stat(nextUri);
    if (info.isDirectory()) {
      await traverseAllTheFilesInTheDirectory(nextUri, callback);
      continue;
    }
    await callback(nextUri);
  }
}
