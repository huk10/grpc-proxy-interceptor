import { resolve } from "node:path";
import { fileURLToPath, URL } from "node:url";
import {
  negate,
  isExistService,
  checkPathIsExist,
  checkCommandIsExist,
  getProtoFileInDirectory
} from "../helper";

const dirname = fileURLToPath(new URL(".", import.meta.url))

describe("helper: Git functions", () => {
  // jest.setTimeout(30000)
  // test("isExistBranch:", async () => {
  //   const repo = "https://github.com/swagger-api/swagger-js.git";
  //   expect(await isExistBranch(repo, "master")).toBe(true)
  //   expect(await isExistBranch(repo, "mast22222er")).toBe(false)
  // })
})

describe("helper: Protobuf functions", () => {
  const options = {includeDirs: [ resolve(dirname, "./proto")]}
  test("isExistService:", async () => {
    expect(await isExistService(resolve(dirname, "./proto/greeter.proto"), options)).toBe(true)
    expect(await isExistService(resolve(dirname, "./proto/common.proto"), options)).toBe(false)
  })

  test("getProtoFileInDirectory:no-includeDirs-params", async () => {
    expect(await getProtoFileInDirectory(resolve(dirname, "./proto"))).toEqual([
      resolve(dirname, "./proto/greeter.proto")
    ])
  })
  test("getProtoFileInDirectory:exist-includeDirs-params", async () => {
    expect(await getProtoFileInDirectory(resolve(dirname, "./proto"), options.includeDirs)).toEqual([
      resolve(dirname, "./proto/greeter.proto")
    ])
  })
})


describe("helper: Shell functions", () => {
  test("checkCommandIsExist:", async () => {
    expect(await checkCommandIsExist("protoc")).toBe(true)
    expect(await checkCommandIsExist("protocxxx")).toBe(false)
  })
})

describe("helper: File system functions", () => {
  test("checkPathIsExist:", async () => {
    expect(await checkPathIsExist(resolve(dirname, "./proto/greeter.proto"))).toBe(true)
    expect(await checkPathIsExist(resolve(dirname, "./proto/greeter.noexist.proto"))).toBe(false)
  })
})


describe("helper: Other functions", () => {
  test("negate:", async () => {
    expect(await negate(false)).toBe(true)
    expect(await negate(Promise.resolve(false))).toBe(true)
  })
})
