import { Metadata, MetadataValue, status, StatusObject } from "@grpc/grpc-js";
import { Status } from "@grpc/grpc-js/src/constants";
import { StatusCodes as httpStatus } from "http-status-codes";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { OpenAPIClientAxios } from "openapi-client-axios";
import { OpenAPIV2 } from "openapi-types";
import * as qs from "qs";
import { checkPathIsExist, fsForEach, negate } from "./helper";

/**
 * 转换成 grpc 的 Metadata 对象
 * @param metadata1 {{[key: string]: string}}
 * @return {Metadata}
 */
export function toMetadata(metadata1: Record<string, MetadataValue>): Metadata {
  const metadata = new Metadata();
  for (const [key, value] of Object.entries(metadata1)) {
    metadata.set(key, value);
  }
  return metadata;
}

export interface CallResult<Response> {
  response: Response;
  metadata: Metadata;
  status: StatusObject;
}

// 该方式是 grpc-getaway 库的转换方式.
// 转换 http 状态码到 gRPC 状态码
// https://github.com/grpc-ecosystem/grpc-gateway/blob/master/runtime/errors.go#L15
// See: https://github.com/googleapis/googleapis/blob/master/google/rpc/code.proto
//
// 下面这三种 code 都会转换成 httpStatus.CONFLICT
// 这里接收到 409 将会只转换为 status.ABORTED（10）
// status.ALREADY_EXISTS
// status.ABORTED
//
// 下面这三种 code 都会转换成 httpStatus.BAD_REQUEST
// 这里接收到 400 将会只转换为 status.INVALID_ARGUMENT（3）
// status.INVALID_ARGUMENT
// status.FAILED_PRECONDITION
// status.OUT_OF_RANGE
//
// 下面这三种 code 都会转换成 httpStatus.INTERNAL_SERVER_ERROR
// 未在上面定义转换的 code 也都会转换为 httpStatus.INTERNAL_SERVER_ERROR
// 这里接收到 500 将会只转换为 status.INTERNAL（13）
// status.INTERNAL
// status.UNKNOWN
// status.DATA_LOSS
export function httpStatus2GrpcStatus(code: httpStatus): Status {
  switch (code) {
    case httpStatus.OK:
      return status.OK;
    case httpStatus.REQUEST_TIMEOUT:
      return status.CANCELLED;
    case httpStatus.INTERNAL_SERVER_ERROR:
      return status.INTERNAL;
    case httpStatus.GATEWAY_TIMEOUT:
      return status.DEADLINE_EXCEEDED;
    case httpStatus.NOT_FOUND:
      return status.NOT_FOUND;
    case httpStatus.FORBIDDEN:
      return status.PERMISSION_DENIED;
    case httpStatus.UNAUTHORIZED:
      return status.UNAUTHENTICATED;
    case httpStatus.TOO_MANY_REQUESTS:
      return status.RESOURCE_EXHAUSTED;
    case httpStatus.BAD_REQUEST:
      return status.INVALID_ARGUMENT;
    case httpStatus.CONFLICT:
      return status.ABORTED;
    case httpStatus.NOT_IMPLEMENTED:
      return status.UNIMPLEMENTED;
    case httpStatus.SERVICE_UNAVAILABLE:
      return status.UNAVAILABLE;
  }
  return status.INTERNAL;
} // FIXME trailers 为什么会重复呢？这不知道咋处理了。暂时先只取一个值
interface CallPath {
  pkg: string;
  service: string;
  method: string;
}

interface OpenAPIDefinition {
  path: string;
  filePath: string;
  operationId: string;
  document: OpenAPIV2.Document;
  parameters: OpenAPIV2.Parameters[];
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
}

/**
 * 解析 rpc 的方法调用 path
 * 正则：/\/(?<pkg>.+)\.(?<service>.+)(?=\/)\/(?<method>.+)/
 * 输入：/example.greeter.v1.services.Greeter/SayHello
 * groups = {pkg: 'example.greeter.v1.services', service: 'Greeter', method: 'SayHello'}
 * @param path {string}
 * @returns {{pkg: string, service: string, method: string}}
 */
function splitCallPath(path: string): CallPath {
  const match = path.match(/\/(?<pkg>.+)\.(?<service>.+)(?=\/)\/(?<method>.+)/);
  if (!match?.groups) throw new Error("rpc path parse error!");
  return match.groups as unknown as CallPath;
}

/**
 * 处理 URL 上 的params
 * @param parameters {OpenAPIV2.Parameters[]}
 * @param data {object}
 * @return {{[key: string]: string} | null}
 */
export function handleParameters(
  parameters: OpenAPIV2.Parameters[],
  data: unknown
): Record<string, string> | null {
  if (!Array.isArray(parameters)) {
    return null;
  }
  return parameters.reduce((param, schema) => {
    // @ts-ignore
    param[schema.name] = data[schema.name];
    return param;
  }, {});
}

/**
 * 转换 Metadata 到 grpc-getaway 库支持的形式
 * ! 注意此处不确定 axios node 端是否支持 Buffer 类型的 value
 * @param metadata {Metadata}
 * @return {{[key: string]: string}}
 */
export function toMetadataHeader(metadata: Metadata): Record<string, string> {
  // buffer 的 header axios 不支持吗？
  return Object.entries(metadata.getMap()).reduce(
    (headers, [key, value]) => {
      headers[`Grpc-Metadata-${key}`] = value as unknown as string;
      return headers;
    },
    // 必须加这个头才能接收到 trailers headers
    { TE: "trailers" } as Record<string, string>
  );
}

/**
 * 从响应 Headers 中获取metadata
 * grpc 的 Header 和 Trailer 两种 metadata 都从这里获取。这里无法区分，所以客户端从这两个地方取的 Metadata 都会是相同的。
 * @param headers {{[key: string]: string}}
 * @return {Metadata}
 */
export function getMetadataFromHeader(
  headers: Record<string, string>
): Metadata {
  const kv = Object.entries(headers)
    .filter(([value]) => value.startsWith("grpc-metadata-"))
    .reduce((prev, [key, value]) => {
      prev[key.replace(/^grpc-metadata-/, "")] = value as string;
      return prev;
    }, {} as Record<string, string>);
  return toMetadata(kv);
}

export function getTrailersMetadata(rawHeaders: string[]): Metadata {
  const record = {};
  for (let i = 0, len = rawHeaders.length; i < len; i += 2) {
    // @ts-ignore
    // record[rawHeaders[i]] = Array.isArray(record[rawHeaders[i]]) ? record[rawHeaders[i]].concat(rawHeaders[i+1]) : [rawHeaders[i+1]]
    record[rawHeaders[i]] = rawHeaders[i + 1];
  }
  return toMetadata(
    Object.entries(record).reduce((header, [key, value]) => {
      header[key.replace(/^Grpc-Trailer-/, "")] = value as string;
      return header;
    }, {} as Record<string, string>)
  );
}

/**
 * 解析一个 openapi 文件到 json 格式
 * @param url {string}
 * @return {Promise<OpenAPIV2.Document>}
 */
export async function parseOpenApiSpec(
  url: string
): Promise<OpenAPIV2.Document> {
  const str = await readFile(url, "utf8");
  return JSON.parse(str);
}
export type Getaway =
  | string
  | ((value: { filePath: string; callPath: string }) => string);
export class ApiProxy {
  public loadDone: boolean;
  private readonly openapi: Array<{ path: string; data: OpenAPIV2.Document }>;

  constructor(
    public readonly enable: boolean,
    private getaway: Getaway,
    private openapiDir: string
  ) {
    this.openapi = [];
    this.loadDone = false;
  }

  /**
   * 从 openapi v2 定义中查找需要的信息
   * @param tag {string}
   * @param operationId {string}
   */
  private findOpenapiDocument(
    tag: string,
    operationId: string
  ): OpenAPIDefinition | null {
    for (const { path: filePath, data: document } of this.openapi) {
      if (document.tags?.some((val) => val.name === tag)) {
        for (const [path, methods] of Object.entries(document.paths)) {
          for (const [method, spec] of Object.entries(methods)) {
            // @ts-ignore
            if (spec.operationId === operationId) {
              return {
                path,
                filePath,
                document,
                // @ts-ignore
                method: method.toUpperCase(),
                operationId,
                // @ts-ignore
                parameters: spec.parameters,
              };
            }
          }
        }
      }
    }
    return null;
  }

  // 查找 grpc callPath 对应的 openapi 定义
  // callPath = /<package名>.<service名>/<rpc名>
  // 这里注意：像 googleapis 的规范中 package 名是多段的如：google.ads.v11.services
  private findDefinition(callPath: string) {
    const { pkg, service, method } = splitCallPath(callPath);
    const tag = `${pkg}.${service}`;
    const operationId = `${service}_${method}`;
    return this.findOpenapiDocument(tag, operationId);
  }

  // 加载 openapi 文件
  async loadOpenapiFile() {
    const dirname = resolve(process.cwd(), this.openapiDir);
    if (await negate(await checkPathIsExist(dirname))) {
      this.loadDone = false;
      console.warn("openapi 目录不存在，请使用脚本生成！");
      return;
    }
    await fsForEach(dirname, async (url: string) => {
      if (url.endsWith(".swagger.json")) {
        const json = await parseOpenApiSpec(url);
        this.openapi.push({ path: url, data: json });
      }
    });
    this.loadDone = true;
  }

  // 根据 callPath 查找 openapi 定义然后使用 http 调用它
  async call<Body = any, Response = any>(
    callPath: string,
    metadata: Metadata,
    body: Body
  ): Promise<CallResult<Response>> {
    try {
      if (!this.loadDone) throw new Error("openapi 文件未加载完毕！");
      const definition = this.findDefinition(callPath);
      if (definition === null) throw new Error("没有找到 openapi 定义！");
      const { operationId, document, method, parameters, filePath } =
        definition;
      const params = handleParameters(parameters, body);
      const client = await new OpenAPIClientAxios({
        definition: document as any,
      }).init();

      const result = await client[operationId](
        params as unknown as any,
        method === "GET" ? null : body,
        {
          baseURL:
            typeof this.getaway === "function"
              ? this.getaway({ callPath, filePath })
              : this.getaway,
          headers: toMetadataHeader(metadata),
          params: method === "GET" ? qs.stringify(body) : undefined,
        }
      );
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
          response: err.response.data as Response,
          metadata: getMetadataFromHeader(err.response.headers),
          status: {
            metadata: getTrailersMetadata(err.response.request.res.rawTrailers),
            details: err.response.data.message,
            code: httpStatus2GrpcStatus(err.response.status),
          },
        };
      }
      return {
        response: null as unknown as Response,
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
