import {isValidUrl} from './helper/utils'
import {ApiProxy} from './shared/openapi-proxy'
import {loadConfiguration} from './shared/configuration'
import {InterceptingCall, Interceptor, Metadata} from '@grpc/grpc-js'
import {InterceptingListener} from '@grpc/grpc-js/build/src/call-stream'

// 拦截器的配置选项
interface InterceptorOptions {
  // grpc-gateway 服务地址
  getaway: string
  // 是否开启拦截器
  enable: boolean
  // openapi 目录
  openapiDir: string
}

/**
 * 对拦截器的配置进行校验和设置默认值。
 * @param opts {InterceptorOptions}
 * @return {InterceptorOptions}
 */
function handleInterceptorOption(opts: InterceptorOptions) {
  const defaultValue = {
    enable: false,
    getaway: null,
    openapiDir: null,
  } as unknown as InterceptorOptions
  const result = Object.assign(defaultValue, opts || {})
  if (typeof result.getaway !== 'string' || result.getaway === '') {
    throw new Error('Opt.getaway is a required parameter！')
  }
  if (!isValidUrl(result.getaway)) {
    throw new Error('Invalid opt.getaway ！')
  }
  if (typeof result.openapiDir !== 'string' || result.openapiDir === '') {
    throw new Error('Opt.openapiDir is a required parameter！')
  }
  return result
}

/**
 * 初始化拦截器的配置
 * @param opts {InterceptorOptions}
 * @param [status] {{status: boolean}}
 */
async function initInterceptor(opts: InterceptorOptions, status?: {done: boolean}) {
  const defaultOption = await withConfiguration(opts)
  const opt = handleInterceptorOption(defaultOption)
  const apiProxy = new ApiProxy(opt.enable, opt.getaway, opt.openapiDir)
  await apiProxy.loadOpenapiFile()
  status ? (status.done = true) : void 0
  return apiProxy
}

// 从配置文件中获取配置
async function withConfiguration(args: InterceptorOptions | undefined): Promise<InterceptorOptions> {
  const configuration = await loadConfiguration()
  return Object.assign(
    {},
    {
      enable: configuration.enable,
      getaway: configuration.getaway,
      openapiDir: configuration.openapiDir,
    },
    args ?? {}
  ) as InterceptorOptions
}

/**
 * grpc client interceptor 代理 grpc 请求到 grpc-getaway 的拦截器
 *  1. 使用时确保该拦截器在最后一个（此拦截器不会调用后续的拦截器）
 *  2. 注意调用该拦截器是会异步读取并解析 openapi 文件，期间拦截器将不工作
 * @param [opts] {InterceptorOptions}
 * @return {Promise<Interceptor>}
 */
export async function interceptor(opts: InterceptorOptions): Promise<Interceptor> {
  const apiProxy = await initInterceptor(opts)
  return function interceptorImpl(options, nextCall) {
    if (!apiProxy.enable || !apiProxy.loadDone) {
      return new InterceptingCall(nextCall(options))
    }
    const ref = {
      message: null as unknown,
      metadata: new Metadata(),
      listener: {} as InterceptingListener,
    }
    return new InterceptingCall(nextCall(options), {
      start: function (metadata, listener, next) {
        ref.metadata = metadata
        ref.listener = listener
      },
      sendMessage: async function (message, next) {
        ref.message = message
      },
      halfClose: async function (next) {
        const {metadata, message, listener} = ref
        // 这里的 message 是还没有被 protobuf 序列化的。
        // 注意此刻的 metadata 的 key 会被全部转换为小写，但是通过 get 方法取值时，是大小写不敏感的。
        // 此刻的 value 类型是 [MedataValue]
        // call 方法保证即使是内部错误，也会返回一个正确的结构
        const result = await apiProxy.call(options.method_definition.path, metadata, message)
        listener.onReceiveMessage(result.response)
        listener.onReceiveMetadata(result.metadata)
        listener.onReceiveStatus(result.status)
      },
    })
  }
}
