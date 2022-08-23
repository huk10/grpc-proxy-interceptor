import * as qs from "qs";
import { resolve } from "node:path";
import { OpenAPIV2 } from "openapi-types";
import { negate } from "../helper/utils";
import { CallResult } from "./grpc-utils";
import { Metadata, status } from "@grpc/grpc-js";
import { Getaway } from "./configuration";
import { OpenAPIClientAxios } from "openapi-client-axios";
import { httpStatus2GrpcStatus } from "./status-converts";
import { checkPathIsExist, fsForEach } from "../helper/fs";
import {
  getMetadataFromHeader,
  getTrailersMetadata,
  handleParameters,
  parseOpenApiSpec,
  toMetadataHeader,
} from "./openapi-utils";

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
      throw new Error("openapi 目录不存在，请使用脚本生成！");
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
