declare type Callback = (url: string) => void | Promise<void>;
/**
 * 对目录下文件进行遍历
 * @param uri {string} - 目录绝对路径
 * @param callback {(url: string) => void | Promise<void>}
 */
export declare function forEachDirectory(
  uri: string,
  callback: Callback
): Promise<void>;
/**
 * 同步对目录下文件进行遍历
 * @param {string} path
 * @param {Callback} callback
 */
export declare function forEachDirectorySync(
  path: string,
  callback: Callback
): void;
/**
 * 检查路径是否存在
 * @param url {string} - 绝对路径
 * @return {Promise<boolean>}
 */
export declare function checkPathIsExist(url: string): Promise<boolean>;
/**
 * 同步检查路径是否存在
 * @param url {string} - 绝对路径
 * @return {Promise<boolean>}
 */
export declare function checkPathIsExistSync(url: string): Promise<boolean>;
/**
 * 是否是一个有效的 URL
 * @param url {string}
 * @return {boolean}
 */
export declare function isValidUrl(url: string): boolean;
export {};
