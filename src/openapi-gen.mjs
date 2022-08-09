import { shell } from "./helper/shell.mjs";
import { checkDependencies } from "./check.mjs";
import { isExistBranch } from "./helper/git.mjs";
import { basename, extname, sep, resolve } from "node:path";
import { getProtoFileInDirectory } from "./helper/proto.mjs";

/**
 * @typedef Repository
 * @type {object}
 * @property {string} url - git 仓库地址
 * @property {string} source - proto 文件存放目录（如果是根目录则可不传）
 * @property {string} branch - git 仓库对应的分支名（默认是 master 分支）
 */

/**
 * @typedef Options
 * @type {object}
 * @property {boolean} debug - 是否输出执行的命令（默认：false）
 * @property {string} outputDir - openapi 文件输出目录（默认：openapi）
 * @property {string} buildDir - 目录名称-不包含路径（默认：grpc-proxy-build）
 * @property {boolean} disabledRemoveCommand - 是否禁用 rm 命令（默认：false）
 * @property {array<Repository>} gitRepository - 依赖的git仓库地址列表
 */

/**
 *
 * @param {Options} opts
 * @return {Options}
 */
function handleOpts( opts ) {
  if ( !Array.isArray( opts.gitRepository ) ) throw new TypeError( "need is a array." );
  return {
    debug: opts.debug ?? false,
    buildDir: opts.buildDir ?? "grpc-proxy-build",
    outputDir: opts.outputDir ?? "openapi",
    gitRepository: opts.gitRepository ?? [],
    disabledRemoveCommand: opts.disabledRemoveCommand ?? false,
  };
}


class Generate {
  constructor( opt ) {
    const { debug, buildDir, gitRepository, outputDir, disabledRemoveCommand } = handleOpts( opt );
    this.debug = debug;
    this.buildDir = buildDir;
    this.outputDir = outputDir;
    this.gitRepository = gitRepository;
    this.disabledRemoveCommand = disabledRemoveCommand;
  }

  // 运行一个 shell 命令
  runShell( command ) {
    if ( this.debug ) console.info( command );
    return shell( command )
  }

  // 将 git repo 的指定目录拉下来
  async cloneRepo( repo, branch = "master", path = "" ) {
    path = pathNormalize( path );
    const service = serviceName( repo );
    const existBranch = branch !== "master" ? await isExistBranch(repo, branch) : true
    branch = existBranch ? branch : "master"

    // 这里需要是 zip tar 正常解压仁会抛出 stderr ？？
    await this.runShell( `cd ${ this.buildDir } && git archive --remote=${ repo } ${ branch } ${ path } --output=${ service }.zip` );
    if ( path && path !== "." ) {
      await this.runShell( `cd ${ this.buildDir } && mkdir ${ service } && unzip ./${ service }.zip && mv ${ path }/* ${ service }` );
      if ( !this.disabledRemoveCommand ) {
        await this.runShell( `cd ${ this.buildDir } && rm -rf ./${ firstPart( path ) } rm -f ./${ service }.zip` );
      }
    } else {
      await this.runShell( `cd ${ this.buildDir } && mkdir ${ service } && unzip ./${ service }.zip -d ./${ service }` );
      if ( !this.disabledRemoveCommand ) {
        await this.runShell( `cd ${ this.buildDir } && rm -f ./${ service }.zip` );
      }
    }
  }

  // 将一组 git repo 拉下来
  async pullGitRepo() {
    await this.runShell( `rm -rf ./${ this.buildDir } && mkdir ${ this.buildDir }` );
    for ( const repo of this.gitRepository ) {
      await this.cloneRepo( repo.url, repo.branch ?? "master", repo.source );
    }
  }

  // 生成 openapi的json 文件
  async genOpenApi() {
    // 一个服务一个服务的处理
    await this.runShell( `rm -rf ./${ this.outputDir } && mkdir ${ this.outputDir }` );
    for ( const repo of this.gitRepository ) {
      const mParams = [];
      const rootDir = resolve( process.cwd(), this.buildDir );
      const paths = await getProtoFileInDirectory( resolve( rootDir, "proto", serviceName( repo.url ) ) );
      const proto = paths.map( ( value ) => value.replace( rootDir + "/", "" ) );
      for ( const u of proto ) {
        mParams.push( `--openapiv2_opt=M${ u }=example.com/${ u.replace( extname( u ), "" ) }` );
      }
      await this.runShell( [
        `protoc --proto_path=${ this.buildDir }`,
        `--openapiv2_out=${ this.outputDir }`,
        `--openapiv2_opt include_package_in_tags=true,openapi_naming_strategy=fqn`,
        mParams.join( " " ),
        proto.join( " " )
      ].join( " " ) );
    }
  }

  // 生成 openapi 文件
  async generate() {
    await checkDependencies()
    // 真实头疼-有些 proto 没有定义 go_package 😲，还好我不生成代码。。。
    // 就是定义了 go_package 也不是符合规范的 go_package 。。。
    await this.pullGitRepo();
    await this.genOpenApi();
  }
}

/**
 * 拉下 git 仓库中的 proto 文件并生成对应的 openapi 文件
 * @param opts {Options}
 * @returns {Promise<void>}
 */
export async function generate( opts ) {
  await new Generate(opts).generate()
}

// 获取最上层的目录名称
function firstPart( path ) {
  return pathNormalize( path ).split( sep )[ 0 ];
}

// 路径规划化-去除前后的斜杠（只接受绝对路径，会清除一切的路径符号）
function pathNormalize( path ) {
  return path
    .split( sep )
    .filter( ( val ) => [ "..", ".", "" ].includes( val.trim() ) )
    .join( sep );
}

// 获取服务名称-注意go服务在编译时会将中横杆转换为下划线
function serviceName( repo ) {
  return basename( repo, extname( repo ) ).replace( /-/g, "_" );
}
