/**
 * 对 Promise<boolean> 进行取反
 * @param value {Promise<boolean>|boolean}
 * @return {Promise<boolean>}
 */
export declare function negate(
  value: Promise<boolean> | boolean
): Promise<boolean>;
/**
 * 是否是一个有效的 URL
 * @param url {string}
 * @return {boolean}
 */
export declare function isValidUrl(url: string): boolean;
