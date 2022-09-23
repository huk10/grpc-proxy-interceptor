import { OpenAPIV2 } from "openapi-types";
import { AxiosRequestConfig } from "axios";
declare type RequestPayload = any;
/**
 * OpenAPI allowed HTTP methods
 */
export declare enum HttpMethod {
  Get = "get",
  Put = "put",
  Post = "post",
  Patch = "patch",
  Delete = "delete",
  Options = "options",
  Head = "head",
  Trace = "trace",
}
/**
 * OpenAPI parameters "in"
 */
export declare enum ParamType {
  Query = "query",
  Header = "header",
  Path = "path",
  Cookie = "cookie",
}
/**
 * Generic request config object
 */
export interface RequestConfig {
  method: HttpMethod;
  url: string;
  path: string;
  pathParams: {
    [key: string]: string;
  };
  query: {
    [key: string]: string | string[];
  };
  queryString: string;
  headers: AxiosRequestConfig["headers"];
  cookies: {
    [cookie: string]: string;
  };
  payload?: RequestPayload;
}
export interface Operation {
  path: string;
  filePath: string;
  method: HttpMethod;
  operationId: string;
  parameters: OpenAPIV2.Parameter[];
}
/**
 * Operation method spec
 */
export declare type ImplicitParamValue = string | number;
export interface ExplicitParamValue {
  value: string | number;
  name: string;
  in?: ParamType | string;
}
export interface UnknownParamsObject {
  [parameter: string]: ImplicitParamValue | ImplicitParamValue[];
}
export declare type ParamsArray = ExplicitParamValue[];
export declare type SingleParam = ImplicitParamValue;
export declare type Parameters<ParamsObject = UnknownParamsObject> =
  | ParamsObject
  | ParamsArray
  | SingleParam;
export interface RequestID {
  package: string;
  service: string;
  method: string;
}
export interface DocumentList {
  filePath: string;
  document: OpenAPIV2.Document;
}
declare type Args = [paramsArray?: Parameters, payload?: RequestPayload];
export declare class OpenapiV2Parser {
  private openapiDir;
  loading: boolean;
  private documentLists;
  constructor(openapiDir: string);
  init(sync: boolean): void | Promise<void>;
  private initSync;
  private initAsync;
  getOperation(requestID: RequestID): Operation | null;
  getRequestConfigForOperation(operation: Operation, args: Args): RequestConfig;
}
export {};
