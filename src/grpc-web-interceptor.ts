import axios from 'axios'
import {CallResult} from './shared/grpc-utils'
import {httpStatus2GrpcStatus} from './shared/status-converts'
import {InterceptingListener} from '@grpc/grpc-js/build/src/call-stream'
import {InterceptingCall, Interceptor, InterceptorOptions, Metadata, status} from '@grpc/grpc-js'
import {getMetadataFromHeader, getTrailersMetadata, toMetadataHeader} from './shared/openapi-utils'
import {isValidUrl} from './helper/utils'

const proxy = axios.create()

export interface InterceptorOption {
  // 是否开启拦截器
  enable: boolean
  // 提供服务的服务器地址如：http://127.0.0.1:9090
  getaway: string
}

function checkInterceptorOption(opt: InterceptorOption): InterceptorOption {
  if (typeof opt.getaway !== 'string' || opt.getaway === '') {
    throw new Error('opt.getaway is a required parameter！')
  }
  if (!isValidUrl(opt.getaway)) {
    throw new Error('Invalid opt.getaway ！')
  }
  return opt
}

// TODO 对 grpc.status 和 metadata 进行核对
async function proxyTo(path: string, message: any, metadata: Metadata): Promise<CallResult<any>> {
  try {
    const result = await proxy.post(path, message, {headers: toMetadataHeader(metadata)})
    const resultMetadata = getMetadataFromHeader(result.headers)
    return {
      response: result.data,
      metadata: resultMetadata,
      status: {
        code: httpStatus2GrpcStatus(result.status),
        details: '',
        metadata: getTrailersMetadata(result.request.res.rawTrailers),
      },
    }
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
      }
    }
    return {
      response: null as unknown as Response,
      metadata: new Metadata(),
      status: {
        metadata: new Metadata(),
        details: (err as Error).message,
        code: status.UNKNOWN,
      },
    }
  }
}

/**
 * grpc client interceptor 代理 grpc 请求到 grpc-getaway 的拦截器
 *  1. 使用时确保该拦截器在最后一个（此拦截器不会调用后续的拦截器）
 *  2. 注意调用该拦截器是会异步读取并解析 openapi 文件，期间拦截器将不工作
 * @return {Promise<Interceptor>}
 */
export function interceptor(opt: InterceptorOption): Interceptor {
  return function interceptorImpl(options, nextCall) {
    const {enable, getaway} = checkInterceptorOption(opt)
    if (!enable) {
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
        const result = await proxyTo(getaway + options.method_definition.path, message, metadata)
        listener.onReceiveMessage(result.response)
        listener.onReceiveMetadata(result.metadata)
        listener.onReceiveStatus(result.status)
      },
    })
  }
}
