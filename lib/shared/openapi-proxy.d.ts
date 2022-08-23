import { CallResult } from "./grpc-utils";
import { Metadata } from "@grpc/grpc-js";
import { Getaway } from "./configuration";
export declare class ApiProxy {
  readonly enable: boolean;
  private getaway;
  private openapiDir;
  loadDone: boolean;
  private readonly openapi;
  constructor(enable: boolean, getaway: Getaway, openapiDir: string);
  /**
   * 从 openapi v2 定义中查找需要的信息
   * @param tag {string}
   * @param operationId {string}
   */
  private findOpenapiDocument;
  private findDefinition;
  loadOpenapiFile(): Promise<void>;
  call<Body = any, Response = any>(
    callPath: string,
    metadata: Metadata,
    body: Body
  ): Promise<CallResult<Response>>;
}
