import { GenerateOptions } from "./shared/configuration";
/**
 * 拉下 git 仓库中的 proto 文件并生成对应的 openapi 文件
 * @see JSDocGenerateOptions
 * @param opts {GenerateOptions}
 * @returns {Promise<void>}
 */
export declare function generate(opts?: GenerateOptions): Promise<void>;
