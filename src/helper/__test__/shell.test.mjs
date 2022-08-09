import { checkCommandIsExist, which } from "../shell.mjs";

describe("shell.mjs", () => {
  test("which:", async () => {
    expect(await which("protoc")).toBe("/usr/local/bin/protoc\n")
  })
  test("checkCommandIsExist:", async () => {
    expect(await checkCommandIsExist("protoc")).toBe(true)
    expect(await checkCommandIsExist("protocxxx")).toBe(false)
  })
})
