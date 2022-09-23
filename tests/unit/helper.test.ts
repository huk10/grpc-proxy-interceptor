import { resolve } from "node:path";
import { fileURLToPath, URL } from "node:url";
import { checkPathIsExist } from "../../src/helper";

const dirname = fileURLToPath(new URL(".", import.meta.url));

describe("helper: File system functions", () => {
  test("checkPathIsExist:", async () => {
    expect(
      await checkPathIsExist(
        resolve(dirname, "../resources/proto/greeter.proto")
      )
    ).toBe(true);
    expect(
      await checkPathIsExist(
        resolve(dirname, "../resources/proto/greeter.noexist.proto")
      )
    ).toBe(false);
  });
});
