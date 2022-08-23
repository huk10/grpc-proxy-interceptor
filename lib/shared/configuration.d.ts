export interface Repository {
  url: string;
  source?: string;
  branch?: string;
}
export interface GenerateOptions {
  debug?: boolean;
  openapiDir?: string;
  buildDir?: string;
  disabledRemoveCommand?: boolean;
  gitRepository?: Array<Repository>;
}
export declare type Getaway =
  | string
  | ((value: { filePath: string; callPath: string }) => string);
export interface OpenapiInterceptorOptions {
  getaway: Getaway;
  enable: boolean;
  openapiDir: string;
}
export declare type Configuration = OpenapiInterceptorOptions & GenerateOptions;
export declare const defaultConfiguration: Configuration;
