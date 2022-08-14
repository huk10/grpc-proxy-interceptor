import { resolve, extname, sep, basename } from 'node:path';
import { exec } from 'node:child_process';
import { stat, readdir } from 'node:fs/promises';
import * as protoLoader from '@grpc/proto-loader';
import { readFile } from 'fs/promises';
import * as SwaggerClient from 'swagger-client';
import { status, Metadata, InterceptingCall } from '@grpc/grpc-js';

// 默认配置
const defaultConfiguration = {
    debug: false,
    enable: false,
    getaway: '',
    gitRepository: [],
    openapiDir: "openapi",
    buildDir: 'openapi-proxy-build',
    disabledRemoveCommand: false,
};

/*---------------------- shell ----------------------*/
/**
 * 执行一个 shell 命令
 * @param command {string}
 * @return {Promise<string>}
 */
function shell(command) {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error)
                reject(error);
            if (stderr)
                reject(error);
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
    return which(command).then(() => true).catch(() => false);
}
/*---------------------- git ----------------------*/
/**
 * 检查 git 仓库是否存在指定的远程分支。
 * @param repo {string} - git 仓库地址
 * @param branch {string} - 指定的远程仓库
 */
async function isExistBranch(repo, branch) {
    const result = await shell(`git ls-remote --heads ${repo} ${branch} --exit-code`);
    return !!result;
}
/*---------------------- fs ----------------------*/
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
    }
    catch (err) {
        return false;
    }
}
/*---------------------- proto ----------------------*/
/**
 * 是否存在 Service 定义
 * @param proto {string} - protobuf 文件地址
 * @param options - protoLoader.load 的options参数
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
 * @param uri
 * @return {Promise<string[]>}
 */
async function getProtoFileInDirectory(uri) {
    return fsFilter(uri, async (proto) => {
        if (!proto.endsWith(".proto"))
            return false;
        return isExistService(proto);
    });
}
/*---------------------- logic ----------------------*/
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
 * 加载配置文件
 * @param [path=./openapi-proxy.config.js] {string} 配置文件相对于 process.cwd()
 * @return {Configuration}
 */
async function loadConfiguration(path = "./openapi-proxy.config.js") {
    const configurationPath = resolve(process.cwd(), path);
    if (await (checkPathIsExist(configurationPath))) {
        const result = await import(configurationPath);
        return Object.assign({}, defaultConfiguration, result.default);
    }
    return defaultConfiguration;
}

class Generate {
    debug;
    buildDir;
    outputDir;
    gitRepository;
    disabledRemoveCommand;
    constructor(opt) {
        this.checkOption(opt);
        const { debug, buildDir, gitRepository, outputDir, disabledRemoveCommand } = opt;
        this.debug = debug;
        this.buildDir = buildDir;
        this.outputDir = outputDir;
        this.gitRepository = gitRepository;
        this.disabledRemoveCommand = disabledRemoveCommand;
    }
    // 处理 Option 参数
    checkOption(opts) {
        if (!Array.isArray(opts.gitRepository))
            throw new TypeError("need is a array.");
        if (!opts.buildDir)
            throw new Error("Requires `buildDir` configuration.");
        if (!opts.outputDir)
            throw new Error("Requires `outputDir` configuration.");
    }
    // 运行一个 shell 命令
    runShell(command) {
        if (this.debug)
            console.info(command);
        return shell(command);
    }
    // 将 git repo 的指定目录拉下来
    async cloneRepo(repo, branch = "master", path = "") {
        path = pathNormalize(path);
        const service = serviceName(repo);
        const existBranch = branch !== "master" ? await isExistBranch(repo, branch) : true;
        branch = existBranch ? branch : "master";
        // 这里需要是 zip tar 正常解压仁会抛出 stderr ？？
        await this.runShell(`cd ${this.buildDir} && git archive --remote=${repo} ${branch} ${path} --output=${service}.zip`);
        if (path && path !== ".") {
            await this.runShell(`cd ${this.buildDir} && mkdir ${service} && unzip ./${service}.zip && mv ${path}/* ${service}`);
            if (!this.disabledRemoveCommand) {
                await this.runShell(`cd ${this.buildDir} && rm -rf ./${firstPart(path)} rm -f ./${service}.zip`);
            }
        }
        else {
            await this.runShell(`cd ${this.buildDir} && mkdir ${service} && unzip ./${service}.zip -d ./${service}`);
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
        }
    }
    // 生成 openapi 的 json 文件
    async genOpenApi() {
        // 一个服务一个服务的处理
        await this.runShell(`rm -rf ./${this.outputDir} && mkdir ${this.outputDir}`);
        // 注意此处有些 proto 定义的不够规范：
        // 1. proto 没有定义 go_package 😲，还好我这里只生成 openapi 不生成代码。
        // 2. 就算定义了 go_package 也不是符合规范的 go_package
        // 我们需要添加生成 protoc的 M 参数。M 参数只是通过编译，不影响其他。
        for (const repo of this.gitRepository) {
            const mParams = [];
            const rootDir = resolve(process.cwd(), this.buildDir);
            const paths = await getProtoFileInDirectory(resolve(rootDir, "proto", serviceName(repo.url)));
            const proto = paths.map((value) => value.replace(rootDir + "/", ""));
            for (const u of proto) {
                mParams.push(`--openapiv2_opt=M${u}=example.com/${u.replace(extname(u), "")}`);
            }
            await this.runShell([
                `protoc --proto_path=${this.buildDir}`,
                `--openapiv2_out=${this.outputDir}`,
                `--openapiv2_opt include_package_in_tags=true,openapi_naming_strategy=fqn`,
                mParams.join(" "),
                proto.join(" ")
            ].join(" "));
        }
    }
    // 生成 openapi 文件
    async generate() {
        if (this.gitRepository.length === 0)
            return;
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
        console.info("Go here: download from https://github.com/protocolbuffers/protobuf#protocol-compiler-installation");
        process.exit(-1);
    }
    if (await negate(await checkCommandIsExist("protoc-gen-openapiv2"))) {
        console.info("The `protoc-gen-openapiv2` command path is not found.");
        console.info("Can be run: `go install github.com/grpc-ecosystem/grpc-gateway/v2/protoc-gen-openapiv2`");
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
// 从配置文件中获取配置
async function withConfiguration$1(args) {
    const configuration = await loadConfiguration();
    return Object.assign({}, {
        debug: configuration.debug,
        buildDir: configuration.buildDir,
        outputDir: configuration.openapiDir,
        gitRepository: configuration.gitRepository,
        disabledRemoveCommand: configuration.disabledRemoveCommand
    }, args ?? {});
}
/**
 * 拉下 git 仓库中的 proto 文件并生成对应的 openapi 文件
 * @see JSDocGenerateOptions
 * @param opts {GenerateOptions}
 * @returns {Promise<void>}
 */
async function generate(opts) {
    await checkDependencies();
    const conf = await withConfiguration$1(opts);
    if (!Array.isArray(conf.gitRepository) || conf.gitRepository.length === 0) {
        console.info("There is no `gitRepository` configuration！");
        process.exit(0);
    }
    await new Generate(conf).generate();
}

class ApiProxy {
    loadDone;
    openapi;
    getaway;
    openapiDir;
    constructor(getaway, openapiDir) {
        this.openapi = [];
        this.loadDone = false;
        this.getaway = getaway;
        this.openapiDir = openapiDir;
    }
    // 查找 grpc callPath 对应的 openapi 定义
    // callPath = /<package名>.<service名>/<rpc名>
    // 这里注意：像 googleapis 的规范中 package 名是多段的如：google.ads.v11.services
    findDefinition(callPath) {
        const { pkg, service, method } = splitCallPath(callPath);
        const tag = `${pkg}.${service}`;
        const operationId = `${service}_${method}`;
        for (const definition of this.openapi) {
            if (definition.tags?.some((val) => val.name === tag)) {
                for (const methods of Object.values(definition.paths)) {
                    for (const spec of Object.values(methods)) {
                        if (spec.operationId === operationId) {
                            return { spec: definition, operationId };
                        }
                    }
                }
            }
        }
        return null;
    }
    // 加载 openapi 文件
    async loadOpenapiFile() {
        const dirname = resolve(process.cwd(), this.openapiDir);
        if (await negate(await checkPathIsExist(dirname))) {
            throw new Error("openapi 目录不存在，请使用脚本生成！");
        }
        await fsForEach(dirname, async (url) => {
            if (url.endsWith(".swagger.json")) {
                const openapi = await parseOpenApiSpec(url);
                openapi.host = this.getaway;
                this.openapi.push(openapi);
            }
        });
        this.loadDone = true;
    }
    // 根据 callPath 查找 openapi 定义然后使用 http 调用它
    async call(callPath, metadata, body) {
        if (!this.loadDone)
            throw new Error("openapi 文件未加载完毕！");
        const definition = this.findDefinition(callPath);
        if (definition === null)
            throw new Error("没有找到 openapi 定义！");
        const { spec, operationId } = definition;
        const request = SwaggerClient.buildRequest({
            spec: spec,
            operationId,
            parameters: body,
            requestInterceptor: (req) => {
                for (const [key, value] of Object.entries(metadata)) {
                    req.headers[`Grpc-metadata-${key}`] = value;
                }
            }
        });
        function getResponseMetadata(headers) {
            return Object.entries(headers)
                .filter(([value]) => value.startsWith("grpc-metadata-"))
                .reduce((prev, [key, value]) => {
                prev[key.substring(14)] = value;
                return prev;
            }, {});
        }
        const result = await SwaggerClient.http(request).catch((err) => err.response);
        const responseMetadata = toMetadata(getResponseMetadata(result.headers));
        const code = result.ok ? status.OK : result.body.code;
        return {
            response: result.body,
            metadata: responseMetadata,
            status: {
                code,
                metadata: responseMetadata,
                details: result.ok ? '' : result.body.message,
            }
        };
    }
}
// 转换成 grpc 的 Metadata 对象
function toMetadata(metadata1) {
    const metadata = new Metadata();
    for (const [key, value] of Object.entries(metadata1)) {
        metadata.set(key, value);
    }
    return metadata;
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
    if (!match?.groups)
        throw new Error("rpc path parse error!");
    return match.groups;
}

/**
 * grpc client interceptor 代理 grpc 请求到 grpc-getaway 的拦截器
 *  1. 使用时确保该拦截器在最后一个（此拦截器不会调用后续的拦截器）
 *  2. 注意调用该拦截器是会异步读取并解析 openapi 文件，期间拦截器将不工作
 * @see JSDocInterceptorOptions
 * @param [opts] {InterceptorOptions}
 * @return {Promise<Interceptor>}
 */
async function grpcGatewayProxyInterceptor(opts) {
    const opt = handleInterceptorOption(await withConfiguration(opts));
    const apiProxy = new ApiProxy(opt.getaway, opt.openapiDir);
    await apiProxy.loadOpenapiFile();
    console.log(opt);
    return function interceptor(options, nextCall) {
        const ref = {
            metadata: new Metadata(),
            listener: undefined
        };
        return new InterceptingCall(nextCall(options), {
            start: function (metadata, listener, next) {
                ref.metadata = metadata;
                ref.listener = listener;
                // next(metadata, listener)
            },
            sendMessage: async function (message, next) {
                try {
                    const { metadata, listener } = ref;
                    if (!opt.enable || !apiProxy.loadDone)
                        return next(message);
                    // 这里的 message 是还没有被 protobuf 序列化的。
                    // 注意此刻的 metadata 的 key 会被全部转换为小写，但是通过 get 方法取值时，是大小写不敏感的。
                    // 此刻的 value 类型是 [MedataValue]
                    const result = await apiProxy.call(options.method_definition.path, metadata.toJSON(), message);
                    console.log('http result：', result);
                    listener.onReceiveMessage(result.response);
                    listener.onReceiveMetadata(result.metadata);
                    listener.onReceiveStatus(result.status);
                    // next(message)
                }
                catch (err) {
                    console.info("出错了，正在回退，本次请求不走代理！error: ", err.message);
                    next(message);
                }
            }
        });
    };
}
/**
 * 对拦截器的配置进行校验和设置默认值。
 * @param opts {InterceptorOptions}
 * @return {InterceptorOptions}
 */
function handleInterceptorOption(opts) {
    const defaultValue = { enable: false, getaway: null, openapiDir: null };
    const result = Object.assign(defaultValue, opts || {});
    if (typeof result.getaway !== 'string' || result.getaway === '') {
        throw new Error("Opt.getaway is a required parameter！");
    }
    if (typeof result.openapiDir !== 'string' || result.openapiDir === '') {
        throw new Error("Opt.openapiDir is a required parameter！");
    }
    return result;
}
// 从配置文件中获取配置
async function withConfiguration(args) {
    const configuration = await loadConfiguration();
    return Object.assign({}, {
        enable: configuration.enable,
        getaway: configuration.getaway,
        openapiDir: configuration.openapiDir
    }, args ?? {});
}

export { generate, grpcGatewayProxyInterceptor };
