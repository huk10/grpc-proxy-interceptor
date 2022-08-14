import { resolve } from "node:path";
import { fileURLToPath, URL } from "node:url";
import { loadConfiguration } from "../helper";
import { defaultConfiguration } from "../type";

const dirname = fileURLToPath(new URL(".", import.meta.url))

describe("configuration", () => {
  test("loadConfiguration:exist", async () => {
    const conf = await loadConfiguration(resolve(dirname, "./openapi-proxy.config.js"))
    expect(conf.debug).toBe(false)
    expect(conf.enable).toBe(true)
    expect(conf.getaway).toBe("127.0.0.1:4501")
    expect(conf.buildDir).toBe("openapi-proxy-build")
    expect(conf.openapiDir).toBe("openapi")
    expect(conf.gitRepository).toEqual([])
    expect(conf.disabledRemoveCommand).toBe(false)
  })

  test("loadConfiguration:no-exist", async () => {
    const conf = await loadConfiguration(resolve(dirname, "../../example/openapi-proxy.config.noexist.js"))
    expect(conf).toBe(defaultConfiguration)
  })
})
