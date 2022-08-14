## openapi-proxy
提供一个 gRPC 拦截器，在 gRPC 协议调用不可用时，通过[grpc-getaway](https://github.com/grpc-ecosystem/grpc-gateway) 提供的 http 接口与 gRPC 后端通信。

## 工作原理
1. 如果 gRPC 服务端接入了 grpc-getaway，那么在其提供的 protobuf 文件中会存在一些对应的 option 字段。
2. grpc-getaway 提供了通过 protobuf 文件生成 openapi 文件的方法。
3. gRPC 客户端在调用 rpc 接口的时候可以配置一个拦截器。
4. 我们可以通过拦截器传递的 rpc path 从生成的 openapi 中找到其定义信息，使用 http 请求调用其方法。

## 环境依赖
本方案有一些环境依赖，需要自行安装，并添加到 PATH 中。
* git
* protoc
* grpc-getaway 提供的 [protoc-gen-openapiv2](https://github.com/grpc-ecosystem/grpc-gateway/v2/protoc-gen-openapiv2) 插件。

如果仅使用 gRPC 拦截器的话便不需要这些。

## 使用方式

可以参考 [example](./example) 中的用法。

1. 从 protobuf 文件中生成对应的 openapi 文件（ 也可以自行使用 protoc 命令生成 openapi 文件，[参考命令](#protoc-命令参考)）。
```javascript
import {generate} from "grpc-openapi-proxy-interceptor"
await generate(configuration);
```
2. 在 grpc 客户端的 interceptors 中添加依赖即可。
```javascript
import {grpcGatewayProxyInterceptor} from "grpc-openapi-proxy-interceptor"
const client = new grpc.Client("127.0.0.1:9091", grpc.credentials.createInsecure(), {
  interceptors: [
    await grpcGatewayProxyInterceptor({
      enable: true,
      getaway: "127.0.0.1:4501",
      openapiDir: resolve(process.cwd(), "./openapi"),
    })
  ]
})
```

## 配置选项
配置可以填写在配置文件中，也可以在通过函数参数传递。

配置文件使用 esm 语法，路径为 `resolve(process.cwd(), "./openapi-proxy.config.js")`

配置会进行合并，优先级为：`default < openapi-proxy.config.js < function arguments`

下面是默认配置项：
```javascript
/** @type {import("./src/type").Configuration} */
const config = {
  // 是否输出执行的命令（默认：false）
  debug: false,
  // 是否启用拦截器（默认：false）
  enable: false,
  // grpc-getaway 服务地址
  getaway: '',
  // openapi 文件输出目录
  openapiDir: 'openapi',
  // 构建 openapi 的目录
  buildDir: 'openapi-proxy-build',
  // 依赖的git仓库地址列表
  gitRepository: [],
  // 是否禁用 rm 命令（默认：false）
  disabledRemoveCommand: false,
}

export default config
```

## protoc 命令参考

**注意 `--openapiv2_opt include_package_in_tags=true,openapi_naming_strategy=fqn` 是必要的**

命令中的 `$PROTO_DIR` 和 `$API_OUT_DIR` 需要替换成你自己对应目录。

```shell
protoc --proto_path=$PROTO_DIR \
         --openapiv2_out=$API_OUT_DIR \
         --openapiv2_opt include_package_in_tags=true,openapi_naming_strategy=fqn \
         greeter/v1/services/greeter.proto
```
