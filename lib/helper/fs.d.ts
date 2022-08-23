/**
 * 对目录下文件进行遍历
 * @param uri {string} - 目录绝对路径
 * @param callback {(url: string) => void | Promise<void>}
 */
export declare function fsForEach(
  uri: string,
  callback: (url: string) => void | Promise<void>
): Promise<void>;
/**
 * 对目录下文件进行过滤
 * @param uri {string} - 目录绝对路径
 * @param callback {(url: string) => boolean | Promise<boolean>}
 * @return {Promise<string[]>}
 */
export declare function fsFilter(
  uri: string,
  callback: (url: string) => boolean | Promise<boolean>
): Promise<string[]>;
/**
 * 检查路径是否存在
 * @param url {string} - 绝对路径
 * @return {Promise<boolean>}
 */
export declare function checkPathIsExist(url: string): Promise<boolean>;
