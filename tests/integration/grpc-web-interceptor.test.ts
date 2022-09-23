import { GreeterClient, testGrpcRequest } from "./testlist";
import { clientWithGrpcWeb } from "../resources/client/client";

let client = null as unknown as GreeterClient;

beforeAll(() => {
  client = clientWithGrpcWeb() as GreeterClient;
});

describe(`grpc-web-interceptor.ts`, () => {
  testGrpcRequest(() => client);
});
