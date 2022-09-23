import bath from "bath-es5";
import { readFileSync } from "fs";
import { resolve } from "node:path";
import { OpenAPIV2 } from "openapi-types";
import { AxiosRequestConfig } from "axios";
import { readFile } from "node:fs/promises";
import {
  checkPathIsExist,
  checkPathIsExistSync,
  forEachDirectory,
  forEachDirectorySync,
} from "./helper";

type RequestPayload = any;

/**
 * OpenAPI allowed HTTP methods
 */
export enum HttpMethod {
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
export enum ParamType {
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

type Args = [paramsArray?: Parameters, payload?: RequestPayload];

/**
 * 解析一个 openapi 文件到 json 格式
 * @param url {string}
 * @return {Promise<OpenAPIV2.Document>}
 */
async function parseOpenApiSpec(url: string): Promise<OpenAPIV2.Document> {
  const str = await readFile(url, "utf8");
  return JSON.parse(str);
}

/**
 * 同步解析一个 openapi 文件到 json 格式
 * @param {string} url
 * @return {OpenAPIV2.Document}
 */
function parseOpenApiSpecSync(url: string): OpenAPIV2.Document {
  const str = readFileSync(url, "utf8");
  return JSON.parse(str);
}

export class OpenapiV2Parser {
  public loading = false;
  private documentLists: DocumentList[] = [];
  constructor(private openapiDir: string) {}

  public init(sync: boolean): void | Promise<void> {
    if (sync) {
      this.initSync();
    } else {
      return this.initAsync();
    }
  }

  // 同步加载 openapi 文件
  private initSync() {
    const dirname = resolve(process.cwd(), this.openapiDir);
    if (!checkPathIsExistSync(dirname)) {
      this.loading = false;
      console.warn("openapi 目录不存在，请使用脚本生成！");
      return;
    }
    forEachDirectorySync(dirname, (url: string) => {
      if (url.endsWith(".swagger.json")) {
        this.documentLists.push({
          filePath: url,
          document: parseOpenApiSpecSync(url),
        });
      }
    });
    this.loading = true;
  }

  // 异步加载 openapi 文件
  private async initAsync() {
    const dirname = resolve(process.cwd(), this.openapiDir);
    const isExist = await checkPathIsExist(dirname);
    if (!isExist) {
      this.loading = false;
      console.warn("openapi 目录不存在，请使用脚本生成！");
      return;
    }
    await forEachDirectory(dirname, async (url: string) => {
      if (url.endsWith(".swagger.json")) {
        const json = await parseOpenApiSpec(url);
        this.documentLists.push({ filePath: url, document: json });
      }
    });
    this.loading = true;
  }

  public getOperation(requestID: RequestID): Operation | null {
    const tag = `${requestID.package}.${requestID.service}`;
    const operationId = `${requestID.service}_${requestID.method}`;
    for (const { filePath, document } of this.documentLists) {
      const { paths, tags } = document;
      if (!tags?.find((val) => val.name === tag)) {
        continue;
      }
      for (const [pathIndex, pathItemObject] of Object.entries(paths)) {
        for (const [method, operationObject] of Object.entries(
          pathItemObject
        )) {
          if (
            (operationObject as OpenAPIV2.OperationObject).operationId ===
            operationId
          ) {
            return {
              filePath,
              path: pathIndex,
              operationId: operationId,
              method: method.toLowerCase() as HttpMethod,
              parameters: (operationObject as OpenAPIV2.OperationObject)
                .parameters as OpenAPIV2.Parameter[],
            };
          }
        }
      }
    }
    return null;
  }

  public getRequestConfigForOperation(
    operation: Operation,
    args: Args
  ): RequestConfig {
    const [paramsArray, payload] = args;
    const pathParams = {} as RequestConfig["pathParams"];
    const searchParams = new URLSearchParams();
    const query = {} as RequestConfig["query"];
    const headers = {} as NonNullable<RequestConfig["headers"]>;
    const cookies = {} as RequestConfig["cookies"];
    const parameters = (operation.parameters || []) as OpenAPIV2.Parameter[];

    const setRequestParam = (
      name: string,
      value: any,
      type: ParamType | string
    ) => {
      switch (type) {
        case ParamType.Path:
          pathParams[name] = value;
          break;
        case ParamType.Query:
          if (Array.isArray(value)) {
            for (const valueItem of value) {
              searchParams.append(name, valueItem);
            }
          } else {
            searchParams.append(name, value);
          }
          query[name] = value;
          break;
        case ParamType.Header:
          headers[name] = value;
          break;
        case ParamType.Cookie:
          cookies[name] = value;
          break;
      }
    };

    const getParamType = (paramName: string): ParamType => {
      const param = parameters.find(({ name }) => name === paramName);
      if (param) {
        return param.in as ParamType;
      }
      // default all params to query if operation doesn't specify param
      return ParamType.Query;
    };

    const getFirstOperationParam = () => {
      const firstRequiredParam = parameters.find(
        ({ required }) => required === true
      );
      if (firstRequiredParam) {
        return firstRequiredParam;
      }
      const firstParam = parameters[0];
      if (firstParam) {
        return firstParam;
      }
    };

    if (Array.isArray(paramsArray)) {
      // ParamsArray
      for (const param of paramsArray) {
        setRequestParam(
          param.name,
          param.value,
          param.in || getParamType(param.name)
        );
      }
    } else if (typeof paramsArray === "object") {
      // ParamsObject
      for (const name in paramsArray) {
        if (paramsArray[name] !== undefined) {
          setRequestParam(name, paramsArray[name], getParamType(name));
        }
      }
    } else if (paramsArray) {
      const firstParam = getFirstOperationParam();
      if (!firstParam) {
        throw new Error(
          `No parameters found for operation ${operation.operationId}`
        );
      }
      setRequestParam(firstParam.name, paramsArray, firstParam.in as ParamType);
    }

    // path parameters
    const pathBuilder = bath(operation.path);
    // make sure all path parameters are set
    for (const name of pathBuilder.names) {
      const value = pathParams[name];
      pathParams[name] = `${value}`;
    }
    const path = pathBuilder.path(pathParams) as string;

    // queryString parameter
    const queryString = searchParams.toString();

    // full url with query string
    const url = `${path}${queryString ? `?${queryString}` : ""}`;

    // construct request config
    return {
      url,
      path,
      query,
      headers,
      cookies,
      payload,
      pathParams,
      queryString,
      method: operation.method,
    };
  }
}
