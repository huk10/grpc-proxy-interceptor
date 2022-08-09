import { shell } from "./shell.mjs";

export async function isExistBranch(repo, branch) {
  const result = await shell(`git ls-remote --heads ${repo} ${branch} --exit-code`)
  return !!result
}
