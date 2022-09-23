import { isValidUrl } from "./helper";
import { Getaway, OpenapiV2Proxy } from "./openapi-proxy-impl";
import { InterceptingCall, Interceptor, Metadata } from "@grpc/grpc-js";
import { InterceptingListener } from "@grpc/grpc-js/build/src/call-stream";

// 拦截器的配置选项
interface Options {
  // grpc-gateway 服务地址
  getaway: Getaway;
  // openapi 目录
  openapiDir: string;
}

// 默认配置
const defaultConfiguration: Options = {
  getaway: "",
  openapiDir: "openapi",
};

/**
 * 对拦截器的配置进行校验和设置默认值
 * @param {Options} opts
 * @return {Options}
 */
function handleInterceptorOption(opts?: Options) {
  const defaultValue = { ...defaultConfiguration };
  const result = Object.assign(defaultValue, opts || {}) as Options;
  if (typeof result.getaway === "string" && result.getaway === "") {
    throw new Error("Opt.getaway is a required parameter！");
  }
  if (typeof result.getaway === "string" && !isValidUrl(result.getaway)) {
    throw new Error("Invalid opt.getaway ！");
  }
  if (typeof result.openapiDir !== "string" || result.openapiDir === "") {
    throw new Error("Opt.openapiDir is a required parameter！");
  }
  return result;
}

/**
 * 拦截器的内部实现
 * @return {Interceptor}
 * @param apiProxy
 */
function interceptorImpl(apiProxy: OpenapiV2Proxy): Interceptor {
  return function (options, nextCall) {
    if (!apiProxy || !apiProxy?.getLoadStatus()) {
      return new InterceptingCall(nextCall(options));
    }
    const callPath = options.method_definition.path;
    // grpc-web 是支持 responseStream 的
    if (
      options.method_definition.requestStream ||
      options.method_definition.responseStream
    ) {
      console.warn(`${callPath}: 不支持流式调用!`);
      return new InterceptingCall(nextCall(options));
    }
    const ref = {
      message: null as unknown,
      metadata: new Metadata(),
      listener: {} as InterceptingListener,
    };
    return new InterceptingCall(nextCall(options), {
      start: function (metadata, listener, next) {
        ref.metadata = metadata;
        ref.listener = listener;
      },
      sendMessage: async function (message, next) {
        ref.message = message;
      },
      halfClose: async function (next) {
        const { metadata, message, listener } = ref;
        // 这里的 message 是还没有被 protobuf 序列化的。
        // 注意此刻的 metadata 的 key 会被全部转换为小写，但是通过 get 方法取值时，是大小写不敏感的。
        // 此刻的 value 类型是 [MedataValue]
        // call 方法保证即使是内部错误，也会返回一个正确的结构
        const result = await apiProxy.call(callPath, message, metadata);
        // 下面方法的顺序是有要求的。
        listener.onReceiveMessage(result.response);
        listener.onReceiveMetadata(result.metadata);
        listener.onReceiveStatus(result.status);
      },
    });
  };
}

/**
 * grpc client interceptor 代理 grpc 请求到 grpc-getaway 的拦截器
 *  1. 使用时确保该拦截器在最后一个（此拦截器不会调用后续的拦截器）
 *  2. 注意调用该拦截器是会异步读取并解析 openapi 文件，期间拦截器将不工作
 * @param [opts] {Options}
 * @return {Promise<Interceptor>}
 */
export async function openapiInterceptor(opts?: Options): Promise<Interceptor> {
  const opt = handleInterceptorOption(opts);
  const apiProxy = new OpenapiV2Proxy(opt.openapiDir, opt.getaway);
  await apiProxy.load(false);
  return interceptorImpl(apiProxy);
}

/**
 * 同步初始化版本, 会有一段短暂的不可用时间。
 * @param {Options} opts
 * @return {Interceptor}
 */
export function openapiInterceptorSync(opts: Options): Interceptor {
  const opt = handleInterceptorOption(opts);
  const apiProxy = new OpenapiV2Proxy(opt.openapiDir, opt.getaway);
  apiProxy.load(true);
  return interceptorImpl(apiProxy);
}
