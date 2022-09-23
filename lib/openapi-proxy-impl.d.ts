import { Metadata } from "@grpc/grpc-js";
import { CallResult } from "./grpc-utils";
declare type GetGetawayFn = (value: {
  filePath: string;
  callPath: string;
}) => string;
export declare type Getaway = string | GetGetawayFn;
export declare class OpenapiV2Proxy {
  private dir;
  private getaway;
  private readonly openapiV2Parser;
  private readonly request;
  constructor(dir: string, getaway: Getaway);
  getLoadStatus(): boolean;
  load(sync: boolean): void | Promise<void>;
  private getBaseUrl;
  call<B = any, T = any>(
    callPath: string,
    message: B,
    metadata: Metadata
  ): Promise<CallResult<T>>;
}
export {};
