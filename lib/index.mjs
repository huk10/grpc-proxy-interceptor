import { resolve, extname, sep, basename } from "node:path";
import { stat, readdir, readFile } from "node:fs/promises";
import * as protoLoader from "@grpc/proto-loader";
import { setTimeout } from "timers/promises";
import { exec } from "node:child_process";
import * as qs from "qs";
import { status, Metadata, InterceptingCall } from "@grpc/grpc-js";
import { OpenAPIClientAxios } from "openapi-client-axios";
import { StatusCodes } from "http-status-codes";
import axios from "axios";

/**
 * 对 Promise<boolean> 进行取反
 * @param value {Promise<boolean>|boolean}
 * @return {Promise<boolean>}
 */
async function negate(value) {
  const result = await value;
  return !result;
}
/**
 * 是否是一个有效的 URL
 * @param url {string}
 * @return {boolean}
 */
function isValidUrl(url) {
  return /^https?:\/\/.+?/.test(url);
}

/**
 * 获取目录下所有文件
 * @param path {string} - 目录绝对路径
 * @return {Promise<string[]>}
 */
async function getAllTheFilesInTheDirectory(path) {
  const paths = [];
  const stack = [path];
  const pathStat = await stat(path);
  const defaultIgnore = ["node_modules", ".git", ".vscode", ".idea"];
  if (!pathStat.isDirectory()) {
    return paths;
  }
  while (stack.length > 0) {
    const url = stack.pop();
    const dirs = await readdir(url);
    for (const part of dirs) {
      const nextUri = resolve(url, part);
      const info = await stat(nextUri);
      if (info.isDirectory() && !defaultIgnore.includes(part)) {
        stack.push(nextUri);
        continue;
      }
      if (info.isFile()) {
        paths.push(nextUri);
      }
    }
  }
  return paths;
}
/**
 * 对目录下文件进行遍历
 * @param uri {string} - 目录绝对路径
 * @param callback {(url: string) => void | Promise<void>}
 */
async function fsForEach(uri, callback) {
  const paths = await getAllTheFilesInTheDirectory(uri);
  for (const path of paths) {
    await callback(path);
  }
}
/**
 * 对目录下文件进行过滤
 * @param uri {string} - 目录绝对路径
 * @param callback {(url: string) => boolean | Promise<boolean>}
 * @return {Promise<string[]>}
 */
async function fsFilter(uri, callback) {
  const array = [];
  for (const path of await getAllTheFilesInTheDirectory(uri)) {
    if (await callback(path)) {
      array.push(path);
    }
  }
  return array;
}
/**
 * 检查路径是否存在
 * @param url {string} - 绝对路径
 * @return {Promise<boolean>}
 */
async function checkPathIsExist(url) {
  try {
    await stat(url);
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * 是否存在 Service 定义
 * @param proto {string} - protobuf 文件地址
 * @param options {protoLoader.Options} - protoLoader.load 的options参数
 * @return {Promise<boolean>}
 */
async function isExistService(proto, options = {}) {
  const packageDefinition = await protoLoader.load(proto, options);
  for (const key of Object.keys(packageDefinition)) {
    // 如果存在 format 属性就不是一个 Service 结构
    if (!packageDefinition[key].format) {
      return true;
    }
  }
  return false;
}
/**
 * 获取目录下所有的 proto 文件（仅包含 rpc service 的 proto 文件）
 * @param uri {string} - proto 存放路径。
 * @param [includeDirs] {string[]} proto 文件中 import 其他 proto 的相对目录
 * @return {Promise<string[]>}
 */
async function getProtoFileInDirectory(uri, includeDirs) {
  return fsFilter(uri, async (proto) => {
    if (!proto.endsWith(".proto")) return false;
    return isExistService(proto, {
      // 一般来说 includeDirs 就是其根目录
      includeDirs: Array.isArray(includeDirs) ? includeDirs : [uri],
    });
  });
}

/**
 * 执行一个 shell 命令
 * @param command {string}
 * @return {Promise<string>}
 */
function shell(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) reject(error);
      if (stderr) reject(error);
      resolve(stdout);
    });
  });
}
/**
 * 获取一个命令的 PATH
 * @param command {string}
 * @return {Promise<string>}
 */
function which(command) {
  return shell(`which ${command}`);
}
/**
 * 检查一个命令是否存在
 * @param command {string}
 * @return {Promise<boolean>}
 */
function checkCommandIsExist(command) {
  return which(command)
    .then(() => true)
    .catch(() => false);
}
/**
 * 检查 git 仓库是否存在指定的远程分支。
 * @param repo {string} - git 仓库地址
 * @param branch {string} - 指定的远程仓库
 */
async function isExistBranch(repo, branch) {
  const result = await shell(
    `git ls-remote --heads ${repo} ${branch} --exit-code`
  );
  return !!result;
}

// 默认配置
const defaultConfiguration = {
  debug: false,
  enable: false,
  getaway: "",
  gitRepository: [],
  openapiDir: "openapi",
  buildDir: "openapi-proxy-build",
  disabledRemoveCommand: false,
};

class Generate {
  debug;
  buildDir;
  openapiDir;
  gitRepository;
  disabledRemoveCommand;
  constructor(opt) {
    this.checkOption(opt);
    const {
      debug,
      buildDir,
      gitRepository,
      openapiDir,
      disabledRemoveCommand,
    } = opt;
    this.debug = debug;
    this.buildDir = buildDir;
    this.openapiDir = openapiDir;
    this.gitRepository = gitRepository;
    this.disabledRemoveCommand = disabledRemoveCommand;
  }
  // 处理 Option 参数
  checkOption(opts) {
    if (!Array.isArray(opts.gitRepository)) {
      throw new TypeError("need is a array.");
    }
    if (!opts.buildDir) throw new Error("Requires `buildDir` configuration.");
    if (!opts.openapiDir)
      throw new Error("Requires `openapiDir` configuration.");
  }
  // 运行一个 shell 命令
  runShell(command) {
    if (this.debug) console.info(command);
    return shell(command);
  }
  // 将 git repo 的指定目录拉下来
  async cloneRepo(repo, branch = "master", path = "") {
    const service = serviceName(repo);
    const existBranch =
      branch !== "master" ? await isExistBranch(repo, branch) : true;
    path = pathNormalize(path);
    branch = existBranch ? branch : "master";
    // 这里需要是 zip tar 正常解压仁会抛出 stderr ？？
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
  // 将一组 git repo 拉下来
  async pullGitRepo() {
    await this.runShell(`rm -rf ./${this.buildDir} && mkdir ${this.buildDir}`);
    for (const repo of this.gitRepository) {
      await this.cloneRepo(repo.url, repo.branch ?? "master", repo.source);
      await setTimeout(1000);
    }
  }
  // 生成 openapi 的 json 文件
  async genOpenApi() {
    // 一个服务一个服务的处理
    await this.runShell(
      `rm -rf ./${this.openapiDir} && mkdir ${this.openapiDir}`
    );
    // 注意此处有些 proto 定义的不够规范：
    // 1. proto 没有定义 go_package 😲，还好我这里只生成 openapi 不生成代码。
    // 2. 就算定义了 go_package 也不是符合规范的 go_package
    // 我们需要添加生成 protoc的 M 参数。M 参数只是通过编译，不影响其他。
    for (const repo of this.gitRepository) {
      const mParams = [];
      const rootDir = resolve(process.cwd(), this.buildDir);
      const paths = await getProtoFileInDirectory(
        resolve(rootDir, "proto", serviceName(repo.url))
      );
      const proto = paths.map((value) => value.replace(rootDir + "/", ""));
      for (const u of proto) {
        mParams.push(
          `--openapiv2_opt=M${u}=example.com/${u.replace(extname(u), "")}`
        );
      }
      await this.runShell(
        [
          `protoc --proto_path=${this.buildDir}`,
          `--openapiv2_out=${this.openapiDir}`,
          `--openapiv2_opt include_package_in_tags=true,openapi_naming_strategy=fqn`,
          mParams.join(" "),
          proto.join(" "),
        ].join(" ")
      );
    }
  }
  // 生成 openapi 文件
  async generate() {
    if (this.gitRepository.length === 0) return;
    await this.pullGitRepo();
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
function firstPart(path) {
  return pathNormalize(path).split(sep)[0];
}
// 路径规划化-去除前后的斜杠（只接受绝对路径，会清除一切的路径符号）
function pathNormalize(path) {
  return path
    .split(sep)
    .filter((val) => ["..", ".", ""].includes(val.trim()))
    .join(sep);
}
// 获取服务名称-注意go服务在编译时会将中横杆转换为下划线
function serviceName(repo) {
  return basename(repo, extname(repo)).replace(/-/g, "_");
}
/**
 * 拉下 git 仓库中的 proto 文件并生成对应的 openapi 文件
 * @see JSDocGenerateOptions
 * @param opts {GenerateOptions}
 * @returns {Promise<void>}
 */
async function generate(opts) {
  await checkDependencies();
  const conf = Object.assign({}, defaultConfiguration, opts);
  if (!Array.isArray(conf.gitRepository) || conf.gitRepository.length === 0) {
    console.info("There is no `gitRepository` configuration！");
    process.exit(0);
  }
  await new Generate(conf).generate();
}

// 该方式是 grpc-getaway 库的转换方式.
// 转换 http 状态码到 gRPC 状态码
// https://github.com/grpc-ecosystem/grpc-gateway/blob/master/runtime/errors.go#L15
// See: https://github.com/googleapis/googleapis/blob/master/google/rpc/code.proto
// 下面这三种 code 都会转换成 httpStatus.CONFLICT
// 这里接收到 409 将会只转换为 status.ABORTED（10）
// status.ALREADY_EXISTS
// status.ABORTED
// 下面这三种 code 都会转换成 httpStatus.BAD_REQUEST
// 这里接收到 400 将会只转换为 status.INVALID_ARGUMENT（3）
// status.INVALID_ARGUMENT
// status.FAILED_PRECONDITION
// status.OUT_OF_RANGE
// 下面这三种 code 都会转换成 httpStatus.INTERNAL_SERVER_ERROR
// 未在上面定义转换的 code 也都会转换为 httpStatus.INTERNAL_SERVER_ERROR
// 这里接收到 500 将会只转换为 status.INTERNAL（13）
// status.INTERNAL
// status.UNKNOWN
// status.DATA_LOSS
function httpStatus2GrpcStatus(code) {
  switch (code) {
    case StatusCodes.OK:
      return status.OK;
    case StatusCodes.REQUEST_TIMEOUT:
      return status.CANCELLED;
    case StatusCodes.INTERNAL_SERVER_ERROR:
      return status.INTERNAL;
    case StatusCodes.GATEWAY_TIMEOUT:
      return status.DEADLINE_EXCEEDED;
    case StatusCodes.NOT_FOUND:
      return status.NOT_FOUND;
    case StatusCodes.FORBIDDEN:
      return status.PERMISSION_DENIED;
    case StatusCodes.UNAUTHORIZED:
      return status.UNAUTHENTICATED;
    case StatusCodes.TOO_MANY_REQUESTS:
      return status.RESOURCE_EXHAUSTED;
    case StatusCodes.BAD_REQUEST:
      return status.INVALID_ARGUMENT;
    case StatusCodes.CONFLICT:
      return status.ABORTED;
    case StatusCodes.NOT_IMPLEMENTED:
      return status.UNIMPLEMENTED;
    case StatusCodes.SERVICE_UNAVAILABLE:
      return status.UNAVAILABLE;
  }
  return status.INTERNAL;
}

/**
 * 转换成 grpc 的 Metadata 对象
 * @param metadata1 {{[key: string]: string}}
 * @return {Metadata}
 */
function toMetadata(metadata1) {
  const metadata = new Metadata();
  for (const [key, value] of Object.entries(metadata1)) {
    metadata.set(key, value);
  }
  return metadata;
}

/**
 * 处理 URL 上 的params
 * @param parameters {OpenAPIV2.Parameters[]}
 * @param data {object}
 * @return {{[key: string]: string} | null}
 */
function handleParameters(parameters, data) {
  if (!Array.isArray(parameters)) {
    return null;
  }
  return parameters.reduce((param, schema) => {
    // @ts-ignore
    param[schema.name] = data[schema.name];
    return param;
  }, {});
}
/**
 * 转换 Metadata 到 grpc-getaway 库支持的形式
 * ! 注意此处不确定 axios node 端是否支持 Buffer 类型的 value
 * @param metadata {Metadata}
 * @return {{[key: string]: string}}
 */
function toMetadataHeader(metadata) {
  // buffer 的 header axios 不支持吗？
  return Object.entries(metadata.toHttp2Headers()).reduce(
    (headers, [key, value]) => {
      headers[`Grpc-Metadata-${key}`] = value;
      return headers;
    },
    // 必须加这个头才能接收到 trailers headers
    { TE: "trailers" }
  );
}
/**
 * 从响应 Headers 中获取metadata
 * grpc 的 Header 和 Trailer 两种 metadata 都从这里获取。这里无法区分，所以客户端从这两个地方取的 Metadata 都会是相同的。
 * @param headers {{[key: string]: string}}
 * @return {Metadata}
 */
function getMetadataFromHeader(headers) {
  const kv = Object.entries(headers)
    .filter(([value]) => value.startsWith("grpc-metadata-"))
    .reduce((prev, [key, value]) => {
      prev[key.replace(/^grpc-metadata-/, "")] = value;
      return prev;
    }, {});
  return toMetadata(kv);
}
// FIXME trailers 为什么会重复呢？这不知道咋处理了。暂时先只取一个值
function getTrailersMetadata(rawHeaders) {
  const record = {};
  for (let i = 0, len = rawHeaders.length; i < len; i += 2) {
    // @ts-ignore
    // record[rawHeaders[i]] = Array.isArray(record[rawHeaders[i]]) ? record[rawHeaders[i]].concat(rawHeaders[i+1]) : [rawHeaders[i+1]]
    record[rawHeaders[i]] = rawHeaders[i + 1];
  }
  return toMetadata(
    Object.entries(record).reduce((header, [key, value]) => {
      header[key.replace(/^Grpc-Trailer-/, "")] = value;
      return header;
    }, {})
  );
}
/**
 * 解析一个 openapi 文件到 json 格式
 * @param url {string}
 * @return {Promise<OpenAPIV2.Document>}
 */
async function parseOpenApiSpec(url) {
  const str = await readFile(url, "utf8");
  return JSON.parse(str);
}

/**
 * 解析 rpc 的方法调用 path
 * 正则：/\/(?<pkg>.+)\.(?<service>.+)(?=\/)\/(?<method>.+)/
 * 输入：/example.greeter.v1.services.Greeter/SayHello
 * groups = {pkg: 'example.greeter.v1.services', service: 'Greeter', method: 'SayHello'}
 * @param path {string}
 * @returns {{pkg: string, service: string, method: string}}
 */
function splitCallPath(path) {
  const match = path.match(/\/(?<pkg>.+)\.(?<service>.+)(?=\/)\/(?<method>.+)/);
  if (!match?.groups) throw new Error("rpc path parse error!");
  return match.groups;
}
class ApiProxy {
  enable;
  getaway;
  openapiDir;
  loadDone;
  openapi;
  constructor(enable, getaway, openapiDir) {
    this.enable = enable;
    this.getaway = getaway;
    this.openapiDir = openapiDir;
    this.openapi = [];
    this.loadDone = false;
  }
  /**
   * 从 openapi v2 定义中查找需要的信息
   * @param tag {string}
   * @param operationId {string}
   */
  findOpenapiDocument(tag, operationId) {
    for (const { path: filePath, data: document } of this.openapi) {
      if (document.tags?.some((val) => val.name === tag)) {
        for (const [path, methods] of Object.entries(document.paths)) {
          for (const [method, spec] of Object.entries(methods)) {
            // @ts-ignore
            if (spec.operationId === operationId) {
              return {
                path,
                filePath,
                document,
                // @ts-ignore
                method: method.toUpperCase(),
                operationId,
                // @ts-ignore
                parameters: spec.parameters,
              };
            }
          }
        }
      }
    }
    return null;
  }
  // 查找 grpc callPath 对应的 openapi 定义
  // callPath = /<package名>.<service名>/<rpc名>
  // 这里注意：像 googleapis 的规范中 package 名是多段的如：google.ads.v11.services
  findDefinition(callPath) {
    const { pkg, service, method } = splitCallPath(callPath);
    const tag = `${pkg}.${service}`;
    const operationId = `${service}_${method}`;
    return this.findOpenapiDocument(tag, operationId);
  }
  // 加载 openapi 文件
  async loadOpenapiFile() {
    const dirname = resolve(process.cwd(), this.openapiDir);
    if (await negate(await checkPathIsExist(dirname))) {
      throw new Error("openapi 目录不存在，请使用脚本生成！");
    }
    await fsForEach(dirname, async (url) => {
      if (url.endsWith(".swagger.json")) {
        const json = await parseOpenApiSpec(url);
        this.openapi.push({ path: url, data: json });
      }
    });
    this.loadDone = true;
  }
  // 根据 callPath 查找 openapi 定义然后使用 http 调用它
  async call(callPath, metadata, body) {
    try {
      if (!this.loadDone) throw new Error("openapi 文件未加载完毕！");
      const definition = this.findDefinition(callPath);
      if (definition === null) throw new Error("没有找到 openapi 定义！");
      const { operationId, document, method, parameters, filePath } =
        definition;
      const params = handleParameters(parameters, body);
      const client = await new OpenAPIClientAxios({
        definition: document,
      }).init();
      const result = await client[operationId](
        params,
        method === "GET" ? null : body,
        {
          baseURL:
            typeof this.getaway === "function"
              ? this.getaway({ callPath, filePath })
              : this.getaway,
          headers: toMetadataHeader(metadata),
          params: method === "GET" ? qs.stringify(body) : undefined,
        }
      );
      const resultMetadata = getMetadataFromHeader(result.headers);
      return {
        response: result.data,
        metadata: resultMetadata,
        status: {
          code: httpStatus2GrpcStatus(result.status),
          details: "",
          metadata: getTrailersMetadata(result.request.res.rawTrailers),
        },
      };
    } catch (err) {
      if (err.response) {
        return {
          response: err.response.data,
          metadata: getMetadataFromHeader(err.response.headers),
          status: {
            metadata: getTrailersMetadata(err.response.request.res.rawTrailers),
            details: err.response.data.message,
            code: httpStatus2GrpcStatus(err.response.status),
          },
        };
      }
      return {
        response: null,
        metadata: new Metadata(),
        status: {
          metadata: new Metadata(),
          details: err.message,
          code: status.UNKNOWN,
        },
      };
    }
  }
}

/**
 * 对拦截器的配置进行校验和设置默认值。
 * @param opts {OpenapiInterceptorOptions}
 * @return {OpenapiInterceptorOptions}
 */
function handleInterceptorOption(opts) {
  const defaultValue = { ...defaultConfiguration };
  const result = Object.assign(defaultValue, opts || {});
  if (typeof result.getaway === "string" && result.getaway === "") {
    throw new Error("Opt.getaway is a required parameter！");
  }
  if (typeof result.getaway === "string" && !isValidUrl(result.getaway)) {
    throw new Error("Invalid opt.getaway ！");
  }
  if (typeof result.openapiDir !== "string" || result.openapiDir === "") {
    throw new Error("Opt.openapiDir is a required parameter！");
  }
  return result;
}
/**
 * 初始化拦截器的配置
 * @param opts {OpenapiInterceptorOptions}
 * @param [status] {{status: boolean}}
 */
async function initInterceptor(opts, status) {
  const opt = handleInterceptorOption(opts);
  const apiProxy = new ApiProxy(opt.enable, opt.getaway, opt.openapiDir);
  await apiProxy.loadOpenapiFile();
  status ? (status.done = true) : void 0;
  return apiProxy;
}
/**
 * grpc client interceptor 代理 grpc 请求到 grpc-getaway 的拦截器
 *  1. 使用时确保该拦截器在最后一个（此拦截器不会调用后续的拦截器）
 *  2. 注意调用该拦截器是会异步读取并解析 openapi 文件，期间拦截器将不工作
 * @param [opts] {OpenapiInterceptorOptions}
 * @return {Promise<Interceptor>}
 */
async function openapiInterceptor(opts) {
  const apiProxy = await initInterceptor(opts);
  return function interceptorImpl(options, nextCall) {
    if (!apiProxy.enable || !apiProxy.loadDone) {
      return new InterceptingCall(nextCall(options));
    }
    const ref = {
      message: null,
      metadata: new Metadata(),
      listener: {},
    };
    return new InterceptingCall(nextCall(options), {
      start: function (metadata, listener, next) {
        ref.metadata = metadata;
        ref.listener = listener;
      },
      sendMessage: async function (message, next) {
        ref.message = message;
      },
      halfClose: async function (next) {
        const { metadata, message, listener } = ref;
        // 这里的 message 是还没有被 protobuf 序列化的。
        // 注意此刻的 metadata 的 key 会被全部转换为小写，但是通过 get 方法取值时，是大小写不敏感的。
        // 此刻的 value 类型是 [MedataValue]
        // call 方法保证即使是内部错误，也会返回一个正确的结构
        const result = await apiProxy.call(
          options.method_definition.path,
          metadata,
          message
        );
        listener.onReceiveMessage(result.response);
        listener.onReceiveMetadata(result.metadata);
        listener.onReceiveStatus(result.status);
      },
    });
  };
}

const proxy = axios.create();
function checkInterceptorOption(opt) {
  if (typeof opt.getaway === "string" && opt.getaway === "") {
    throw new Error("opt.getaway is a required parameter！");
  }
  if (typeof opt.getaway === "string" && !isValidUrl(opt.getaway)) {
    throw new Error("Invalid opt.getaway ！");
  }
  return opt;
}
// TODO 对 grpc.status 和 metadata 进行核对
async function proxyTo(path, message, metadata) {
  try {
    const result = await proxy.post(path, message, {
      headers: toMetadataHeader(metadata),
    });
    const resultMetadata = getMetadataFromHeader(result.headers);
    return {
      response: result.data,
      metadata: resultMetadata,
      status: {
        code: httpStatus2GrpcStatus(result.status),
        details: "",
        metadata: getTrailersMetadata(result.request.res.rawTrailers),
      },
    };
  } catch (err) {
    if (err.response) {
      return {
        response: err.response.data,
        metadata: getMetadataFromHeader(err.response.headers),
        status: {
          metadata: getTrailersMetadata(err.response.request.res.rawTrailers),
          details: err.response.data.message,
          code: httpStatus2GrpcStatus(err.response.status),
        },
      };
    }
    return {
      response: null,
      metadata: new Metadata(),
      status: {
        metadata: new Metadata(),
        details: err.message,
        code: status.UNKNOWN,
      },
    };
  }
}
/**
 * grpc client interceptor 代理 grpc 请求到 grpc-getaway 的拦截器
 *  1. 使用时确保该拦截器在最后一个（此拦截器不会调用后续的拦截器）
 *  2. 注意调用该拦截器是会异步读取并解析 openapi 文件，期间拦截器将不工作
 * @return {Promise<Interceptor>}
 */
function interceptor(opt) {
  return function interceptorImpl(options, nextCall) {
    const { enable, getaway } = checkInterceptorOption(opt);
    if (!enable) {
      return new InterceptingCall(nextCall(options));
    }
    const ref = {
      message: null,
      metadata: new Metadata(),
      listener: {},
    };
    return new InterceptingCall(nextCall(options), {
      start: function (metadata, listener, next) {
        ref.metadata = metadata;
        ref.listener = listener;
      },
      sendMessage: async function (message, next) {
        ref.message = message;
      },
      halfClose: async function (next) {
        // 这里的 message 是还没有被 protobuf 序列化的。
        // 注意此刻的 metadata 的 key 会被全部转换为小写，但是通过 get 方法取值时，是大小写不敏感的。
        // 此刻的 value 类型是 [MedataValue]
        // call 方法保证即使是内部错误，也会返回一个正确的结构
        const { metadata, message, listener } = ref;
        const baseUrl =
          typeof getaway === "function"
            ? getaway(options.method_definition.path)
            : getaway;
        const result = await proxyTo(
          baseUrl + options.method_definition.path,
          message,
          metadata
        );
        listener.onReceiveMessage(result.response);
        listener.onReceiveMetadata(result.metadata);
        listener.onReceiveStatus(result.status);
      },
    });
  };
}

export { generate, interceptor, openapiInterceptor };
