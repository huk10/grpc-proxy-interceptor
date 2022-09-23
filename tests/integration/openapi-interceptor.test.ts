import { GreeterClient, testGrpcRequest } from "./testlist";
import { clientWithInterceptor } from "../resources/client/client";

let client = null as unknown as GreeterClient;
beforeAll(async () => {
  client = clientWithInterceptor() as GreeterClient;
});

describe(`openapi-interceptor.ts`, () => {
  testGrpcRequest(() => client);
});
