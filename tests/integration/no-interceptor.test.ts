import {GreeterClient, testGrpcRequest} from './testlist'
import {client} from '../resources/client/client'

describe(`no-interceptor.ts`, () => {
  testGrpcRequest(() => client as GreeterClient)
})
