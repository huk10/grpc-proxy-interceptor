import { exec } from "node:child_process";

/**
 * 执行一个 shell 命令
 * @param command {string}
 * @return {Promise<string>}
 */
export function shell(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) return reject(error);
      if (!!stderr && stderr !== "null") return reject(stderr);
      resolve(stdout);
    });
  });
}

/**
 * 获取一个命令的 PATH
 * @param command {string}
 * @return {Promise<string>}
 */
export function which(command: string): Promise<string> {
  return shell(`which ${command}`);
}

/**
 * 检查一个命令是否存在
 * @param command {string}
 * @return {Promise<boolean>}
 */
export function checkCommandIsExist(command: string): Promise<boolean> {
  return which(command)
    .then(() => true)
    .catch(() => false);
}

/**
 * 检查 git 仓库是否存在指定的远程分支。
 * @param repo {string} - git 仓库地址
 * @param branch {string} - 指定的远程仓库
 */
export async function isExistBranch(
  repo: string,
  branch: string
): Promise<boolean> {
  const result = await shell(
    `git ls-remote --heads ${repo} ${branch} --exit-code`
  );
  return !!result;
}
