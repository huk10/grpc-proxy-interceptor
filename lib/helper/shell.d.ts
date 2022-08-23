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
export declare function isExistBranch(
  repo: string,
  branch: string
): Promise<boolean>;
