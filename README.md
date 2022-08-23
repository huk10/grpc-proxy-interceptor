## openapi-proxy

在不能直连 gRPC 端口时，通过 [grpc-getaway](https://github.com/grpc-ecosystem/grpc-gateway) 提供的 http 接口与 gRPC 后端通信。

两个拦截器的使用场景：

- `openapiInterceptor`： proto 文件中定义了 `google.api.http` 并且服务器提供了支持。
- `interceptor`：gRPC 服务提供了 `grpc-web` 协议的支持。

## 工作原理

1. 如果 gRPC 服务端接入了 grpc-getaway，那么在其提供的 protobuf 文件中会存在一些对应的 option 字段。
2. grpc-getaway 提供了通过 protobuf 文件生成 openapi 文件的方法。
3. gRPC 客户端在调用 rpc 接口的时候可以配置一个拦截器。
4. 我们可以通过拦截器传递的 rpc path 从生成的 openapi 中找到其定义信息，使用 http 请求调用其方法。

## 环境依赖

本方案有一些环境依赖，需要自行安装，并添加到 PATH 中。

- git
- protoc
- grpc-getaway 提供的 [protoc-gen-openapiv2](https://github.com/grpc-ecosystem/grpc-gateway/v2/protoc-gen-openapiv2) 插件。

如果仅使用 gRPC 拦截器的话便不需要这些。

## 使用方式

可以参考 [example](./example) 中的用法。

1. 从 protobuf 文件中生成对应的 openapi 文件（ 也可以自行使用 protoc 命令生成 openapi 文件，[参考命令](#protoc-命令参考)）。

```javascript
await generate({
  // 是否输出执行的命令（默认：false）
  debug: false,
  // openapi 文件输出目录
  openapiDir: "openapi",
  // 构建 openapi 的目录
  buildDir: "openapi-proxy-build",
  // 依赖的git仓库地址列表
  gitRepository: [],
  // 是否禁用 rm 命令（默认：false）
  disabledRemoveCommand: false,
});
```

2. 在 grpc 客户端的 interceptors 中添加依赖即可。

```javascript
const client = new grpc.Client(
  "127.0.0.1:9091",
  grpc.credentials.createInsecure(),
  {
    interceptors: [
      await openapiInterceptor({
        enable: true,
        getaway: "http://127.0.0.1:4501",
        openapiDir: "openapi",
      }),
    ],
  }
);
```

## 已知问题。

1. trailers metadata 现在可能有些问题。处理时发现接受的值有重复，还不知道原因。。
2. get 请求的 params 会使用 qs.stringify 进行转换。
3. grpc.status 状态码可能不准确。

```text
// 下面这两种 code 都会转换成 httpStatus.CONFLICT
// 这里接收到 409 将会只转换为 status.ABORTED（10）
// status.ALREADY_EXISTS
// status.ABORTED

// 下面这三种 code 都会转换成 httpStatus.BAD_REQUEST
// 这里接收到 400 将会只转换为 status.INVALID_ARGUMENT（3）
// status.INVALID_ARGUMENT
// status.FAILED_PRECONDITION
// status.OUT_OF_RANGE

// 下面这三种 code 都会转换成 httpStatus.INTERNAL_SERVER_ERROR
// 未在上面定义转换的 code 也都会转换为 httpStatus.INTERNAL_SERVER_ERROR
// 这里接收到 500 将会只转换为 status.INTERNAL（13）
// status.INTERNAL
// status.UNKNOWN
// status.DATA_LOSS
```

## 使用方法

**generate**

| 参数名                | 是否必填 | 类型          | 默认值              | 描述                    |
| --------------------- | -------- | ------------- | ------------------- | ----------------------- |
| debug                 | 否       | Boolean       | false               | 是否输出执行的命令      |
| openapiDir            | 否       | String        | openapi             | openapi 文件输出目录    |
| buildDir              | 否       | String        | openapi-proxy-build | 构建 openapi 的目录     |
| gitRepository         | 是       | Array<String> | 无                  | 依赖的 git 仓库地址列表 |
| disabledRemoveCommand | 否       | String        | false               | 是否禁用 rm 命令        |

**openapiInterceptor**

| 参数名     | 是否必填 | 类型                                                                         | 默认值  | 描述                 |
| ---------- | -------- | ---------------------------------------------------------------------------- | ------- | -------------------- |
| enable     | 否       | Boolean                                                                      | false   | 是否启用拦截器       |
| getaway    | 是       | String or Function `(value: {filePath: string; callPath: string}) => string` | 无      | grpc 服务地址        |
| openapiDir | 否       | String                                                                       | openapi | openapi 文件输出目录 |

**interceptor**

| 参数名  | 是否必填 | 类型                                              | 默认值 | 描述           |
| ------- | -------- | ------------------------------------------------- | ------ | -------------- |
| enable  | 否       | Boolean                                           | false  | 是否启用拦截器 |
| getaway | 是       | String or Function `(callPath: string) => string` | 无     | grpc 服务地址  |

## protoc 命令参考

**注意 `--openapiv2_opt include_package_in_tags=true,openapi_naming_strategy=fqn` 是必要的**

命令中的 `$PROTO_DIR` 和 `$API_OUT_DIR` 需要替换成你自己对应目录。

```shell
protoc --proto_path=$PROTO_DIR \
         --openapiv2_out=$API_OUT_DIR \
         --openapiv2_opt generate_unbound_methods=true,include_package_in_tags=true,openapi_naming_strategy=fqn \
         greeter/v1/services/greeter.proto
```
