import { negate } from "./helper/utils.mjs";
import { checkCommandIsExist } from "./helper/shell.mjs";

export async function checkDependencies() {
  if(await negate(await checkCommandIsExist("git"))) {
    console.info("`git` command path not detected. please install `git`")
    process.exit(-1)
  }
  if(await negate(await checkCommandIsExist("protoc"))) {
    console.info("`protoc` command path not detected. please install `protoc`")
    process.exit(-1)
  }
  if(await negate(await checkCommandIsExist("protoc-gen-openapiv22"))) {
    console.info("`protoc-gen-openapiv2` command path not detected. please install `protoc-gen-openapiv2`")
    console.info()
    console.info("Can be run: `go install github.com/grpc-ecosystem/grpc-gateway/v2/protoc-gen-openapiv2`")
    process.exit(-1)
  }
}

