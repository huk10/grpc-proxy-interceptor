import { resolve } from "node:path";
import {isExistService} from "../proto.mjs";
import {fileURLToPath, URL} from "node:url";
const dirname = fileURLToPath(new URL(".", import.meta.url))

describe("proto.mjs", () => {
  test("isExistService:", async () => {
    expect(await isExistService(resolve(dirname, "./greeter.proto"))).toBe(true)
    expect(await isExistService(resolve(dirname, "./common.proto"))).toBe(false)
  })
})
