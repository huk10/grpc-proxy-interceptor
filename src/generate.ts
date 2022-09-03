import { negate } from "./helper/utils";
import { getProtoFileInDirectory } from "./helper/proto";
import { basename, extname, resolve, sep } from "node:path";
import { setTimeout } from "timers/promises";
import { checkCommandIsExist, isExistBranch, shell } from "./helper/shell";
import {
  defaultConfiguration,
  GenerateOptions,
  Repository,
} from "./shared/configuration";
import { checkPathIsExist } from "./helper/fs";

class Generate {
  private readonly debug: boolean;
  private readonly buildDir: string;
  private readonly openapiDir: string;
  private readonly accessToken: string;
  private readonly extraProtoIncludeDirs: string[];
  private readonly gitRepository: Array<Repository>;
  private readonly disabledRemoveCommand: boolean;
  constructor(opt: GenerateOptions) {
    this.checkOption(opt);
    const {
      debug,
      buildDir,
      openapiDir,
      accessToken,
      gitRepository,
      disabledRemoveCommand,
      extraProtoIncludeDirs,
    } = opt as Required<GenerateOptions>;
    this.debug = debug;
    this.buildDir = buildDir;
    this.openapiDir = openapiDir;
    this.extraProtoIncludeDirs = extraProtoIncludeDirs ?? [];
    this.accessToken = accessToken;
    this.gitRepository = gitRepository;
    this.disabledRemoveCommand = disabledRemoveCommand;
  }

  // 处理 Option 参数
  private checkOption(opts: GenerateOptions) {
    if (!Array.isArray(opts.gitRepository)) {
      throw new TypeError("need is a array.");
    }
    if (!opts.buildDir) throw new Error("Requires `buildDir` configuration.");
    if (!opts.openapiDir)
      throw new Error("Requires `openapiDir` configuration.");
  }

  // 运行一个 shell 命令
  private runShell(command: string) {
    if (this.debug) console.info(command);
    return shell(command);
  }

  // 将 git repo 的指定目录拉下来
  private async archiveRepo(repo: string, branch = "master", path = "") {
    const service = serviceName(repo);
    const existBranch =
      branch !== "master" ? await isExistBranch(repo, branch) : true;
    path = pathNormalize(path);
    branch = existBranch ? branch : "master";

    await this.runShell(
      `cd ${this.buildDir} && git archive --remote=${repo} ${branch} ${path} --output=${service}.zip`
    );
    if (path && path !== ".") {
      await this.runShell(
        `cd ${this.buildDir} && mkdir ${service} && unzip ./${service}.zip && mv ${path}/* ${service}`
      );
      if (!this.disabledRemoveCommand) {
        await this.runShell(
          `cd ${this.buildDir} && rm -rf ./${firstPart(
            path
          )} rm -f ./${service}.zip`
        );
      }
    } else {
      await this.runShell(
        `cd ${this.buildDir} && mkdir ${service} && unzip ./${service}.zip -d ./${service}`
      );
      if (!this.disabledRemoveCommand) {
        await this.runShell(`cd ${this.buildDir} && rm -f ./${service}.zip`);
      }
    }
  }

  private async checkoutBranch(service: string, branch: string) {
    try {
      await this.runShell(
        `cd ${this.buildDir}/${service} && git checkout ${branch}`
      );
      if (this.debug) {
        console.info(`${service} 使用 ${branch} 进行构建`);
      }
    } catch (err) {
      if (this.debug) {
        console.info(`${service} ${branch} 分支不存在，使用 master 进行构建`);
      }
    }
  }

  private async cloneRepo(repo: string, branch = "master", path = "") {
    const service = serviceName(repo);
    path = pathNormalize(path);
    const repoUrl = `${protocolConvert(repo, this.accessToken)} ${service}`;
    await this.runShell(
      `cd ${this.buildDir}/proto && git clone --depth 1 ${repoUrl}`
    ).catch((err) => console.log("clone error: ", err));

    if (branch !== "master") {
      await this.checkoutBranch(service, branch);
    }
    if (path && path !== ".") {
      const sourcePath = resolve(
        process.cwd(),
        `./${this.buildDir}/proto/${service}/${path}`
      );
      // 目录不存在就不管他。
      if (await negate(checkPathIsExist(sourcePath))) {
        return;
      }
      await this.runShell(
        `mv ./${this.buildDir}/proto/${service} ./${this.buildDir}/.stash/${service}`
      );
      await this.runShell(
        `mv ./${this.buildDir}/.stash/${service}/${path} ./${this.buildDir}/proto/${service}`
      );
    }
  }

  // 将一组 git repo 拉下来
  private async pullGitRepo() {
    const mkCommand = `rm -rf ./${this.buildDir} && mkdir -p ./${this.buildDir}/.stash/ && mkdir -p ./${this.buildDir}/proto/`;
    await this.runShell(mkCommand);
    for (const repo of this.gitRepository) {
      await this.cloneRepo(repo.url, repo.branch ?? "master", repo.source);
    }
    if (!this.disabledRemoveCommand) {
      await this.runShell(`rm -rf ./${this.buildDir}/.stash`);
    }
    // ...又是下划线又是中划线。。。
    if (
      await checkPathIsExist(
        resolve(process.cwd(), `./${this.buildDir}/proto/y_common`)
      )
    ) {
      await this.runShell(
        `cp -r ./${this.buildDir}/proto/y_common ./${this.buildDir}/proto/y-common`
      );
    }
  }

  // 生成 openapi 的 json 文件
  private async genOpenApi() {
    // 一个服务一个服务的处理
    await this.runShell(
      `rm -rf ./${this.openapiDir} && mkdir ${this.openapiDir}`
    );
    // 注意此处有些 proto 定义的不够规范：
    // 1. proto 没有定义 go_package 😲，还好我这里只生成 openapi 不生成代码。
    // 2. 就算定义了 go_package 也不是符合规范的 go_package
    // 3. import路径也是乱七八糟的。
    // 我们需要添加生成 protoc的 M 参数。M 参数只是通过编译，不影响其他。
    for (const repo of this.gitRepository) {
      const mParams = [];
      const rootDir = resolve(process.cwd(), this.buildDir);
      const includeDirs = [
        this.buildDir,
        this.buildDir + "/proto/",
        ...this.extraProtoIncludeDirs,
      ];
      const paths = await getProtoFileInDirectory(
        resolve(rootDir, "proto", serviceName(repo.url)),
        includeDirs
      );
      if (paths.length === 0) {
        continue;
      }
      const proto = paths.map((value) =>
        value.replace(rootDir + "/proto/", "")
      );
      for (const u of proto) {
        mParams.push(
          `--openapiv2_opt=M${u}=example.com/${u.replace(extname(u), "")}`
        );
      }
      await this.runShell(
        [
          `protoc ${includeDirs
            .map((value) => `--proto_path=${value}`)
            .join(" ")}`,
          `--openapiv2_out=${this.openapiDir}`,
          `--openapiv2_opt include_package_in_tags=true,openapi_naming_strategy=fqn`,
          mParams.join(" "),
          proto.join(" "),
        ].join(" ")
      ).catch((err) => console.log("gen error", err));
    }
  }

  // 生成 openapi 文件
  public async generate() {
    if (this.gitRepository.length === 0) return;
    // 如果目录已存在就不重新拉 proto
    if (
      await negate(
        checkPathIsExist(resolve(process.cwd(), `./${this.buildDir}/proto`))
      )
    ) {
      await this.pullGitRepo();
    }
    await this.genOpenApi();
  }
}

// 检查必须的命令行依赖
async function checkDependencies() {
  if (await negate(await checkCommandIsExist("git"))) {
    console.info("The `git` command path is not found.");
    process.exit(-1);
  }
  if (await negate(await checkCommandIsExist("protoc"))) {
    console.info("The `protoc` command path is not found.");
    console.info(
      "Go here: download from https://github.com/protocolbuffers/protobuf#protocol-compiler-installation"
    );
    process.exit(-1);
  }
  if (await negate(await checkCommandIsExist("protoc-gen-openapiv2"))) {
    console.info("The `protoc-gen-openapiv2` command path is not found.");
    console.info(
      "Can be run: `go install github.com/grpc-ecosystem/grpc-gateway/v2/protoc-gen-openapiv2`"
    );
    process.exit(-1);
  }
}

// 获取最上层的目录名称
function firstPart(path: string): string {
  return pathNormalize(path).split(sep)[0];
}

// 路径规划化-去除前后的斜杠（只接受绝对路径，会清除一切的路径符号）
function pathNormalize(path: string): string {
  return path
    .split(sep)
    .filter((val) => !["..", ".", ""].includes(val.trim()))
    .join(sep);
}

// 获取服务名称-注意go服务在编译时会将中横杆转换为下划线
function serviceName(repo: string): string {
  return basename(repo, extname(repo)).replace(/-/g, "_");
}

// 针对性的处理。
function protocolConvert(repo: string, accessToken: string) {
  if (/^git@/.test(repo)) {
    return `https://oauth2:${accessToken}@${repo
      .replace(/^git@/, "")
      .replace(":", "/")}`;
  }
  if (/^https?:\/\//.test(repo)) {
    if (/^https/.test(repo)) {
      return repo.replace(/^http:\/\//, `http://oauth2:${accessToken}@`);
    }
    return repo.replace(/^https:\/\//, `https://oauth2:${accessToken}@`);
  }
  throw new Error("不支持的协议！");
}

/**
 * 拉下 git 仓库中的 proto 文件并生成对应的 openapi 文件
 * @see JSDocGenerateOptions
 * @param opts {GenerateOptions}
 * @returns {Promise<void>}
 */
export async function generate(opts?: GenerateOptions) {
  await checkDependencies();
  const conf = Object.assign({}, defaultConfiguration, opts);
  if (!Array.isArray(conf.gitRepository) || conf.gitRepository.length === 0) {
    console.info("There is no `gitRepository` configuration！");
    process.exit(0);
  }
  await new Generate(conf).generate();
}
