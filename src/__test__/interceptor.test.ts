import { promisify } from "util";
import { toMetadata } from "../openapi-proxy";
import { Metadata, status } from "@grpc/grpc-js";
import { type Status } from "@grpc/grpc-js/build/src/constants";
import { type StatusObject } from "@grpc/grpc-js/src/call-stream";
import { type ClientUnaryCall } from "@grpc/grpc-js/build/src/call";
import { type Client, type UnaryCallback } from "@grpc/grpc-js/build/src/client";
import { client as grpcDefaultClient, getClientWithInterceptor } from "./client/grpc-client";

interface GreeterClient extends Client {
  SayHello(body: {name: string}, md: Metadata, callback: UnaryCallback<{ message: string }>): ClientUnaryCall
  SayHello(body: {name: string}, callback: UnaryCallback<{ message: string }>): ClientUnaryCall


  Metadata(body: {metadata: Record<string, string>}, md: Metadata, callback: UnaryCallback<void>): ClientUnaryCall

  EqMetadata(body: {metadata: Record<string, string>}, md: Metadata, callback: UnaryCallback<{ ok: boolean }>): ClientUnaryCall

  Status(body: {status: Status, errorMsg?: string}, md: Metadata, callback: UnaryCallback<void>): ClientUnaryCall
  Status(body: {status: Status, errorMsg?: string}, callback: UnaryCallback<void>): ClientUnaryCall
}


let clientWithInterceptor = null as unknown as GreeterClient
beforeAll(async () => {
  clientWithInterceptor = await getClientWithInterceptor()
})

describe(`interceptor.ts: 没有拦截器`, () => {
  describe(`interceptor.ts: 没有拦截器`, () => {
    testGrpcRequest("", () => grpcDefaultClient)
  })
  describe(`interceptor.ts: 没有拦截器`, () => {
    testGrpcRequest("", () => clientWithInterceptor)
  })
})

function testGrpcRequest (name: string, getClient: () => GreeterClient) {
  test(`没有拦截器-SayHello`, async () => {
    const client = await getClient()
    const SayHello = promisify(client.SayHello).bind(client)
    const result = await SayHello({name: "Li Ming"})
    expect(result).toEqual({message: "hello Li Ming"})
  })
  test(`没有拦截器-Metadata`, async () => {
    const client = await getClient()
    const record = {code: "1234", buf: "buffer", hello: "word"}
    const rmd = toMetadata(record)
    const md = await new Promise((resolve1, reject) => {
      const emitter = client.Metadata({metadata: record}, rmd, () => void 0)
      emitter.on("metadata", (md: Metadata) => {
        resolve1(md)
      })
    }) as Metadata
    expect(md.get("code")).toEqual(rmd.get('code'))
    expect(md.get("buf")).toEqual(rmd.get('buf'))
    expect(md.get("key2")).toEqual(rmd.get('key2'))
  })
  test(`没有拦截器-EqMetadata`, async () => {
    const client = await getClient()
    const record = {code: "1234", buf: "buffer", hello: "word"}
    const rmd = toMetadata(record)
    const EqMetadata = promisify(client.EqMetadata).bind(client)
    const result = await EqMetadata({metadata: record}, rmd)
    expect(result).toEqual({ok: true})
    const result2 = await EqMetadata({metadata: { ...record, c: "9" }}, rmd)
    expect(result2).toEqual({ok: false})
  })
  test(`没有拦截器-Status`, async () => {
    const client = await getClient()
    async function callWithStatus(status: Status, msg?: string): Promise<StatusObject> {
      return new Promise((resolve1, reject) => {
        const emitter = client.Status({status: status, errorMsg: msg}, () => void 0)
        emitter.on("status", (md: StatusObject) => {
          resolve1(md)
        })
      })
    }
    const testStatus = async (status: Status, msg?: string) => {
      const result = await callWithStatus(status,  msg)
      expect(result.code).toEqual(status)
      expect(result.details).toEqual(msg||'')
      // expect(result.metadata).toEqual(toMetadata({hello: "buffer"}))
    }

    // ok 服务端不会认为是错误，会直接返回 nil
    await testStatus(status.OK)
    await testStatus(status.DEADLINE_EXCEEDED)
    await testStatus(status.ABORTED, "123123123")
    await testStatus(status.INVALID_ARGUMENT, "无效的参数")
  })
}
