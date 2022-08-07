import grpc, { Metadata } from "@grpc/grpc-js"
import {resolve} from "node:path"
import protoLoader from "@grpc/proto-loader"
import {grpcGatewayProxyInterceptor} from "../src/interceptor.mjs"

const options = {
  // 是否保留字段名称，转换为大驼峰
  keepCase: false,
  // long 数字转换成字符串
  longs: 'string',
  // 枚举转换为字符串
  enums: 'string',
}

const protoURL = resolve(process.cwd(), "proto/greeter/v1/services/greeter.proto")

const packageDefinition = protoLoader.loadSync(protoURL, options)

const client = new grpc.Client("127.0.0.1:9091", grpc.credentials.createInsecure(), {
  interceptors: [
    await grpcGatewayProxyInterceptor({
      enable: true,
      getaway: "127.0.0.1:4501",
      openapiDir: resolve(process.cwd(), "./openapi"),
    })
  ]
})

// grpc.loadPackageDefinition 会为 service 调用 makeClientConstructor 方法创建一个 client 构造函数
// grpc.makeGenericClientConstructor 是 grpc.makeClientConstructor 的 export 别名
// grpc.makeGenericClientConstructor 方法已经为生成了所有的gRPC方法调用。不过他的调用是同步的。我们需要时一个异步的。
// grpc.makeGenericClientConstructor 内部也是使用 client.makeUnaryRequest 方法创建 gRPC 对应的方法的。
// 这里就不用 grpc.loadPackageDefinition 方法了。我们自己生成一个 services 对象

function getAllServiceDefinition(packageDefinition) {
  const definition = []
  Object.keys(packageDefinition).forEach(name => {
    // 如果存在 format 属性就不是一个 Service 结构
    if(!packageDefinition[name]['format']) {
      definition.push({name, definition: packageDefinition[name]})
    }
  })
  return definition
}

function partial(that, requesterFunc, path, serialize, deserialize) {
  return function (metadata, body) {
    return new Promise((resolve, reject) => {
      const metadata1 = new Metadata()
      for (const [key, value] of Object.entries(metadata)) {
        metadata1.set(key, value)
      }
      const result = {}
      let doneCount = 0;
      function onReply(key, value) {
        result[key] = value;
        if ((doneCount+=1) === 3) {
          resolve(result)
        }
      }
      const emitter = requesterFunc.call(that, path, serialize, deserialize, body, metadata1, (err, value) => {
        if (err !== null) reject(err)
        onReply('response', value)
      } )
      emitter.on('metadata', value => onReply('metadata', value))
      emitter.on('status', value => onReply('status', value))
    })
  }
}

function getRequesterFuncs(attrs) {
  let methodType = 'makeUnaryRequest'
  if (attrs.requestStream) {
    if (attrs.responseStream) {
      methodType = 'makeBidiStreamRequest';
    } else {
      methodType = 'makeClientStreamRequest';
    }
  } else {
    if (attrs.responseStream) {
      methodType = 'makeServerStreamRequest';
    } else {
      methodType = 'makeUnaryRequest';
    }
  }
  return methodType
}

function build(packageDefinition) {
  const services = getAllServiceDefinition(packageDefinition)
  const result = {}
  for (const {name, definition} of services) {
    const service = name.split(".").pop()
    const methods = {}
    for (const [key, attrs] of Object.entries(definition)) {
      methods[key] = partial(client, client[getRequesterFuncs(attrs)], attrs.path, attrs.requestSerialize, attrs.responseDeserialize)
    }
    result[service] = methods
  }
  return result
}

const services = build(packageDefinition)

// 请注意 metadata 的 value 必须符合 MetadataValue 类型也就是说是一个字符串或 Buffer， 因为会在内部调用 Metadata 的 set 方法添加
// grpc 协议在 http2 的任意自定义请求头都将会认为是 metadata
const result = await services.Greeter.SayHello({traceId: "11111"}, {name: "Li Ming"})
// const result = await services.Greeter.SayHello({traceId: "11111"}, {name: ""})


console.log("result: ", result)

console.log(result.status.metadata)
