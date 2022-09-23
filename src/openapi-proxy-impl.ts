import * as qs from "qs";
import { Metadata, status } from "@grpc/grpc-js";
import { OpenapiV2Parser } from "./openapi-v2-parser";
import { CallResult, parseCallPath } from "./grpc-utils";
import axios, { AxiosInstance, AxiosRequestConfig, Method } from "axios";
import {
  getMetadataFromHeader,
  getTrailersMetadata,
  httpStatus2GrpcStatus,
  toMetadataHeader,
} from "./openapi-utils";

type GetGetawayFn = (value: { filePath: string; callPath: string }) => string;
export type Getaway = string | GetGetawayFn;

// 根据 callPath 查找 openapi 定义然后使用 http 调用它
export class OpenapiV2Proxy {
  private readonly openapiV2Parser: OpenapiV2Parser;
  private readonly request: AxiosInstance;

  constructor(private dir: string, private getaway: Getaway) {
    this.request = axios.create();
    this.openapiV2Parser = new OpenapiV2Parser(this.dir);
  }

  public getLoadStatus(): boolean {
    return this.openapiV2Parser.loading;
  }

  public load(sync: boolean): void | Promise<void> {
    return this.openapiV2Parser.init(sync);
  }

  private getBaseUrl(callPath: string, filePath: string): string {
    return typeof this.getaway === "function"
      ? this.getaway({ callPath, filePath })
      : this.getaway;
  }

  public async call<B = any, T = any>(
    callPath: string,
    message: B,
    metadata: Metadata
  ): Promise<CallResult<T>> {
    if (!this.openapiV2Parser.loading)
      throw new Error("openapi 文件未加载完毕！");
    const requestId = parseCallPath(callPath);
    const operation = this.openapiV2Parser.getOperation(requestId);
    if (operation === null) throw new Error("没有找到 openapi 定义！");
    const baseUrl = this.getBaseUrl(callPath, operation.filePath);
    const requestConfig = this.openapiV2Parser.getRequestConfigForOperation(
      operation,
      [message as any, message]
    );
    const axiosConfig: AxiosRequestConfig = {
      baseURL: baseUrl,
      url: requestConfig.path,
      data: requestConfig.payload,
      method: requestConfig.method as Method,
      paramsSerializer: (params) => new URLSearchParams(params).toString(),
      headers: Object.assign(
        {},
        requestConfig.headers,
        toMetadataHeader(metadata)
      ),
      params:
        requestConfig.method === "get"
          ? qs.stringify(requestConfig.query)
          : undefined,
    };
    try {
      const result = await this.request.request(axiosConfig);
      const resultMetadata = getMetadataFromHeader(result.headers);
      return {
        response: result.data,
        metadata: resultMetadata,
        status: {
          code: httpStatus2GrpcStatus(result.status),
          details: "",
          metadata: getTrailersMetadata(result.request.res.rawTrailers),
        },
      };
    } catch (err: any) {
      if (err.response) {
        return {
          response: err.response.data as T,
          metadata: getMetadataFromHeader(err.response.headers),
          status: {
            metadata: getTrailersMetadata(err.response.request.res.rawTrailers),
            details: err.response.data.message,
            code: httpStatus2GrpcStatus(err.response.status),
          },
        };
      }
      return {
        response: null as unknown as T,
        metadata: new Metadata(),
        status: {
          metadata: new Metadata(),
          details: (err as Error).message,
          code: status.UNKNOWN,
        },
      };
    }
  }
}
