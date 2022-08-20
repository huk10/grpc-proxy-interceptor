/**
 * 对 Promise<boolean> 进行取反
 * @param value {Promise<boolean>|boolean}
 * @return {Promise<boolean>}
 */

export async function negate(value: Promise<boolean> | boolean): Promise<boolean> {
  const result = await value
  return !result
}

/**
 * 是否是一个有效的 URL
 * @param url {string}
 * @return {boolean}
 */
export function isValidUrl(url: string): boolean {
  return /^https?:\/\/.+?/.test(url)
}
