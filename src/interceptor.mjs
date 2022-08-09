import {ApiProxy} from "./proxy.mjs";
import { InterceptingCall, Metadata } from "@grpc/grpc-js";

/**
 * 对拦截器的配置进行校验和设置默认值。
 * @param opts
 */
function handleInterceptorOption(opts) {
  const defaultValue = {enable: false, getaway: null, openapiDir: null}
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
 * grpc client interceptor
 * 代理 grpc 请求到 grpc-getaway 的拦截器，使用时确保该拦截器在最后一个（此拦截器不会调用后续的拦截器）
 */
export async function grpcGatewayProxyInterceptor ( opts) {
  const opt = handleInterceptorOption(opts)
  const apiProxy = new ApiProxy(opt.getaway, opt.openapiDir)
  await apiProxy.loadOpenapiFile()
  console.log(opt)
  return function interceptor(options, nextCall) {
    const ref = {
      metadata: new Metadata(),
      listener: undefined
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
          if (!opt.enable || !apiProxy.loadDone) return next(message)
          // 这里的 message 是还没有被 protobuf 序列化的。
          // 注意此刻的 metadata 的 key 会被全部转换为小写，但是通过 get 方法取值时，是大小写不敏感的。
          // 此刻的 value 类型是 [MedataValue]
          const result = await apiProxy.call(options.method_definition.path, metadata.toJSON(), message)
          console.log('http result：', result)
          listener.onReceiveMessage(result.response)
          listener.onReceiveMetadata(result.metadata)
          listener.onReceiveStatus(result.status)
          // next(message)
        } catch (err) {
          console.info("出错了，正在回退，本次请求不走代理！error: ", err.message)
          next(message)
        }
      }
    })
  }
}



