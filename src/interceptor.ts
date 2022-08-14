import {ApiProxy} from "./openapi-proxy"
import { loadConfiguration } from "./helper";
import { type InterceptorOptions } from "./type";
import { InterceptingCall, Interceptor, Metadata } from "@grpc/grpc-js";
import { InterceptingListener } from "@grpc/grpc-js/build/src/call-stream";

/**
 * grpc client interceptor 代理 grpc 请求到 grpc-getaway 的拦截器
 *  1. 使用时确保该拦截器在最后一个（此拦截器不会调用后续的拦截器）
 *  2. 注意调用该拦截器是会异步读取并解析 openapi 文件，期间拦截器将不工作
 * @see JSDocInterceptorOptions
 * @param [opts] {InterceptorOptions}
 * @return {Promise<Interceptor>}
 */
export async function grpcGatewayProxyInterceptor (opts: InterceptorOptions):Promise<Interceptor> {
  const apiProxy = await initInterceptor(opts)
  return interceptorImpl(apiProxy)
}

/**
 * openapi 拦截器的实现
 * @param apiProxy {ApiProxy}
 * @return {Interceptor}
 */
export function interceptorImpl(apiProxy: ApiProxy): Interceptor {
  return function interceptor( options, nextCall ) {
    const ref = {
      metadata: new Metadata(),
      listener: undefined as unknown as InterceptingListener
    }
    return new InterceptingCall(nextCall(options), {
      start: function(metadata, listener, next) {
        ref.metadata = metadata
        ref.listener = listener
        // next(metadata, listener)
      },
      sendMessage: async function(message, next) {
        try {
          const {metadata, listener} = ref
          if (!apiProxy.enable || !apiProxy.loadDone) return next(message)
          // 这里的 message 是还没有被 protobuf 序列化的。
          // 注意此刻的 metadata 的 key 会被全部转换为小写，但是通过 get 方法取值时，是大小写不敏感的。
          // 此刻的 value 类型是 [MedataValue]
          const result = await apiProxy.call(options.method_definition.path, metadata.toJSON(), message)
          console.log('http result：', result)
          listener.onReceiveMessage(result.response)
          listener.onReceiveMetadata(result.metadata)
          listener.onReceiveStatus(result.status)
          // next(message)
        } catch (err: unknown) {
          console.info("出错了，正在回退，本次请求不走代理！error: ", (err as Error).message)
          next(message)
        }
      }
    })
  }
}

/**
 * 对拦截器的配置进行校验和设置默认值。
 * @param opts {InterceptorOptions}
 * @return {InterceptorOptions}
 */
function handleInterceptorOption(opts:InterceptorOptions) {
  const defaultValue = { enable: false, getaway: null, openapiDir: null } as unknown as InterceptorOptions
  const result = Object.assign(defaultValue, opts || {})
  if (typeof result.getaway !== 'string' || result.getaway === '') {
    throw new Error("Opt.getaway is a required parameter！")
  }
  if (typeof result.openapiDir !== 'string' || result.openapiDir === '') {
    throw new Error("Opt.openapiDir is a required parameter！")
  }
  return result
}

/**
 * 初始化拦截器的配置
 * @param opts {InterceptorOptions}
 * @param [status] {{status: boolean}}
 */
export async function initInterceptor(opts: InterceptorOptions, status?: {done: boolean}) {
  const defaultOption = await withConfiguration(opts)
  const opt = handleInterceptorOption(defaultOption)
  const apiProxy = new ApiProxy(opt.enable, opt.getaway, opt.openapiDir)
  await apiProxy.loadOpenapiFile()
  status ? status.done = true : void 0
  return apiProxy
}

// 从配置文件中获取配置
async function withConfiguration ( args: InterceptorOptions | undefined ):Promise<InterceptorOptions> {
  const configuration = await loadConfiguration()
  return Object.assign({}, {
    enable: configuration.enable,
    getaway: configuration.getaway,
    openapiDir: configuration.openapiDir
  }, args ?? {}) as InterceptorOptions
}
