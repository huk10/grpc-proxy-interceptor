import { isValidUrl } from "./helper";
import { ApiProxy, Getaway } from "./openapi-proxy-impl";
import { InterceptingCall, Interceptor, Metadata } from "@grpc/grpc-js";
import { InterceptingListener } from "@grpc/grpc-js/build/src/call-stream";

// 拦截器的配置选项
interface OpenapiInterceptorOptions {
  // grpc-gateway 服务地址
  getaway: Getaway;
  // 是否开启拦截器
  enable: boolean;
  // openapi 目录
  openapiDir: string;
}

// 默认配置
const defaultConfiguration = {
  enable: false,
  getaway: "",
  openapiDir: "openapi",
};

/**
 * 对拦截器的配置进行校验和设置默认值。
 * @param opts {OpenapiInterceptorOptions}
 * @return {OpenapiInterceptorOptions}
 */
function handleInterceptorOption(opts: OpenapiInterceptorOptions) {
  const defaultValue = { ...defaultConfiguration };
  const result = Object.assign(
    defaultValue,
    opts || {}
  ) as OpenapiInterceptorOptions;
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
 * 初始化拦截器的配置
 * @param opts {OpenapiInterceptorOptions}
 * @param [status] {{status: boolean}}
 */
async function initInterceptor(
  opts: OpenapiInterceptorOptions,
  status?: { done: boolean }
) {
  const opt = handleInterceptorOption(opts);
  const apiProxy = new ApiProxy(opt.enable, opt.getaway, opt.openapiDir);
  await apiProxy.loadOpenapiFile();
  status ? (status.done = true) : void 0;
  return apiProxy;
}

/**
 * grpc client interceptor 代理 grpc 请求到 grpc-getaway 的拦截器
 *  1. 使用时确保该拦截器在最后一个（此拦截器不会调用后续的拦截器）
 *  2. 注意调用该拦截器是会异步读取并解析 openapi 文件，期间拦截器将不工作
 * @param [opts] {OpenapiInterceptorOptions}
 * @return {Promise<Interceptor>}
 */
export async function openapiInterceptor(
  opts: OpenapiInterceptorOptions
): Promise<Interceptor> {
  const apiProxy = await initInterceptor(opts);
  return function interceptorImpl(options, nextCall) {
    if (!apiProxy.enable || !apiProxy.loadDone) {
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
        const result = await apiProxy.call(
          options.method_definition.path,
          metadata,
          message
        );
        listener.onReceiveMessage(result.response);
        listener.onReceiveMetadata(result.metadata);
        listener.onReceiveStatus(result.status);
      },
    });
  };
}

export function openapiInterceptorSync(
  opts: OpenapiInterceptorOptions
): Interceptor {
  const apiProxyRef = { apiProxy: null as unknown as ApiProxy };
  initInterceptor(opts).then((res) => (apiProxyRef.apiProxy = res));
  return function interceptorImpl(options, nextCall) {
    if (!apiProxyRef.apiProxy?.enable || !apiProxyRef.apiProxy?.loadDone) {
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
        const result = await apiProxyRef.apiProxy.call(
          options.method_definition.path,
          metadata,
          message
        );
        listener.onReceiveMessage(result.response);
        listener.onReceiveMetadata(result.metadata);
        listener.onReceiveStatus(result.status);
      },
    });
  };
}
