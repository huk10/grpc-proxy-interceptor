import { Interceptor } from "@grpc/grpc-js";
import { OpenapiInterceptorOptions } from "./shared/configuration";
/**
 * grpc client interceptor 代理 grpc 请求到 grpc-getaway 的拦截器
 *  1. 使用时确保该拦截器在最后一个（此拦截器不会调用后续的拦截器）
 *  2. 注意调用该拦截器是会异步读取并解析 openapi 文件，期间拦截器将不工作
 * @param [opts] {OpenapiInterceptorOptions}
 * @return {Promise<Interceptor>}
 */
export declare function openapiInterceptor(
  opts: OpenapiInterceptorOptions
): Promise<Interceptor>;
