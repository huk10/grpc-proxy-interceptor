import SwaggerClient from "swagger-client";
import { resolve } from "node:path";
import { traverseAllTheFilesInTheDirectory } from "./utils.mjs";
import { status } from "@grpc/grpc-js";

export class ApiProxy {
  constructor (getaway, openapiDir) {
    this.paths = []
    this.openapi = []
    this.loadDone = false
    this.getaway = getaway
    this.openapiDir = openapiDir
  }

  // 加载 openapi 文件
  async loadOpenapiFile () {
    const dirname = resolve(process.cwd(), this.openapiDir)
    const isExist = await checkPathIsExist(dirname)
    if (!isExist) {
      throw new Error("openapi 目录不存在，请使用脚本生成！")
    }
    await traverseAllTheFilesInTheDirectory(dirname, async (url) => {
      if(url.endsWith(".swagger.json")) {
        const openapi = await parseOpenApiSpec(url)
        openapi.host = this.getaway
        this.paths.push(url)
        this.openapi.push(openapi)
      }
    })
    this.loadDone = true
  }

  findDefinition(callPath) {
    // options.path = /<package名>.<service名>/<rpc名>
    // 这里注意：像 googleapis 的规范中 package 名是多段的如：google.ads.v11.services
    const { pkg, service, method } = splitCallPath(callPath)
    const tag = `${pkg}.${service}`;
    const operationId = `${service}_${method}`;
    for (const definition of this.openapi) {
      if (definition.tags.some(val => val.name === tag)) {
        for (let methods of Object.values(definition.paths)) {
          for (let spec of Object.values(methods)) {
            if(spec.operationId === operationId) {
              return { spec: definition, operationId }
            }
          }
        }
      }
    }
    return null
  }

  async call(callPath, metadata, body) {
    if (!this.loadDone) throw new Error("openapi 文件未加载完毕！")
    const definition = this.findDefinition(callPath)
    if (definition === null) throw new Error("没有找到 openapi 定义！")
    const {spec, operationId} = definition;

    const request = SwaggerClient.buildRequest({
      spec: spec,
      operationId,
      parameters: body,
      requestInterceptor: req => {
        for (const [key, value] of Object.entries(metadata)) {
          req.headers[`Grpc-metadata-${key}`] = value
        }
      }
    })

    function getResponseMetadata( headers ) {
      return Object.entries(headers)
        .filter(([value]) => value.startsWith("grpc-metadata-"))
        .reduce((prev, [key, value]) => {
          prev[key.substring(14)] = value
          return prev
        }, {})
    }

    const result = await SwaggerClient.http(request).catch(err => err.response)
    const responseMetadata = getResponseMetadata(result.headers)
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


/**
 * 检查路径是否存在
 * @param url {string}
 */
async function checkPathIsExist (url) {
  try {
    await stat(url)
    return true
  } catch (err) {
    return false
  }
}

/**
 * 解析一个 openapi 文件到 json 格式
 * @param url {string}
 * @return {Promise<object>}
 */
async function parseOpenApiSpec(url) {
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
function splitCallPath(path) {
  const match = path.match(/\/(?<pkg>.+)\.(?<service>.+)(?=\/)\/(?<method>.+)/)
  if (!match.groups) throw new Error("rpc path parse error!")
  return match.groups
}
