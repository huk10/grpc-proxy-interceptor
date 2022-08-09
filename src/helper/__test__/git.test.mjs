import { isExistBranch } from "../git.mjs";

describe("git.mjs", () => {
  jest.setTimeout(30000)
  test("isExistBranch:", async () => {
    const repo = "https://github.com/swagger-api/swagger-js.git";
    expect(await isExistBranch(repo, "master")).toBe(true)
    expect(await isExistBranch(repo, "mast22222er")).toBe(false)
  })
})
