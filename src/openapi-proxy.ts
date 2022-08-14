import { resolve } from "node:path";
import { readFile } from "fs/promises";
import { OpenAPIV2 } from "openapi-types";
// @ts-ignore
import * as SwaggerClient from "swagger-client";
import { checkPathIsExist, fsForEach, negate } from "./helper"
import { Metadata, MetadataValue, status } from "@grpc/grpc-js";

export class ApiProxy {
  public loadDone: boolean;
  private readonly openapi: OpenAPIV2.Document[];
  constructor (public readonly enable: boolean, private getaway:string, private openapiDir:string) {
    this.openapi = []
    this.loadDone = false
  }

  // 查找 grpc callPath 对应的 openapi 定义
  // callPath = /<package名>.<service名>/<rpc名>
  // 这里注意：像 googleapis 的规范中 package 名是多段的如：google.ads.v11.services
  private findDefinition(callPath: string) {
    const { pkg, service, method } = splitCallPath(callPath)
    const tag = `${pkg}.${service}`;
    const operationId = `${service}_${method}`;
    for (const definition of this.openapi) {
      if (definition.tags?.some(( val: { name: string; }) => val.name === tag)) {
        for (const methods of Object.values( definition.paths )) {
          for (const spec of Object.values( methods) as OpenAPIV2.OperationObject[]) {
            if(spec.operationId === operationId) {
              return { spec: definition, operationId }
            }
          }
        }
      }
    }
    return null
  }

  // 加载 openapi 文件
  async loadOpenapiFile () {
    const dirname = resolve(process.cwd(), this.openapiDir)
    if (await negate(await checkPathIsExist(dirname))) {
      throw new Error("openapi 目录不存在，请使用脚本生成！")
    }

    await fsForEach(dirname, async (url:string) => {
      if(url.endsWith(".swagger.json")) {
        const openapi = await parseOpenApiSpec(url)
        openapi.host = this.getaway
        this.openapi.push(openapi)
      }
    });
    this.loadDone = true
  }

  // 根据 callPath 查找 openapi 定义然后使用 http 调用它
  async call(callPath:string, metadata: { [key: string]: MetadataValue[] }, body:{}) {
    if (!this.loadDone) throw new Error("openapi 文件未加载完毕！")
    const definition = this.findDefinition(callPath)
    if (definition === null) throw new Error("没有找到 openapi 定义！")
    const {spec, operationId} = definition;

    const request = SwaggerClient.buildRequest({
      spec: spec,
      operationId,
      parameters: body,
      requestInterceptor: ( req: { headers: { [x: string]: (string | Buffer)[] }; }) => {
        for (const [key, value] of Object.entries(metadata)) {
          req.headers[`Grpc-metadata-${key}`] = value
        }
      }
    })

    function getResponseMetadata( headers: ArrayLike<unknown> | { [s: string]: unknown; } ) {
      return Object.entries(headers)
        .filter(([value]) => value.startsWith("grpc-metadata-"))
        .reduce((prev, [key, value]) => {
          prev[key.substring(14)] = value as string
          return prev
        }, {} as Record<string, MetadataValue>)
    }

    const result = await SwaggerClient.http(request).catch(( err: { response: any; }) => err.response)
    const responseMetadata = toMetadata(getResponseMetadata(result.headers))
    const code = result.ok ? status.OK : result.body.code
    return {
      response: result.body,
      metadata: responseMetadata,
      status: {
        code,
        metadata: responseMetadata,
        details: result.ok ? '' : result.body.message,
      }
    }
  }
}

// 转换成 grpc 的 Metadata 对象
export function toMetadata (metadata1: Record<string, MetadataValue>):Metadata {
  const metadata = new Metadata()
  for (const [key, value] of Object.entries(metadata1)) {
    metadata.set(key, value)
  }
  return metadata
}

/**
 * 解析一个 openapi 文件到 json 格式
 * @param url {string}
 * @return {Promise<OpenAPIV2.Document>}
 */
async function parseOpenApiSpec(url:string):Promise<OpenAPIV2.Document> {
  const str = await readFile(url, "utf8");
  return JSON.parse(str);
}

/**
 * 解析 rpc 的方法调用 path
 * 正则：/\/(?<pkg>.+)\.(?<service>.+)(?=\/)\/(?<method>.+)/
 * 输入：/example.greeter.v1.services.Greeter/SayHello
 * groups = {pkg: 'example.greeter.v1.services', service: 'Greeter', method: 'SayHello'}
 * @param path {string}
 * @returns {{pkg: string, service: string, method: string}}
 */
function splitCallPath(path:string):{pkg:string, service: string, method:string} {
  const match = path.match(/\/(?<pkg>.+)\.(?<service>.+)(?=\/)\/(?<method>.+)/)
  if (!match?.groups) throw new Error("rpc path parse error!")
  return match.groups as {pkg:string, service: string, method:string}
}
