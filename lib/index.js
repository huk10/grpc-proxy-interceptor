"use strict";

Object.defineProperty(exports, "__esModule", { value: true });

var node_path = require("node:path");
var fs = require("fs");
var promises = require("node:fs/promises");
var require$$0 = require("util");
var grpcJs = require("@grpc/grpc-js");
var axios = require("axios");

function _interopDefaultLegacy(e) {
  return e && typeof e === "object" && "default" in e ? e : { default: e };
}

var require$$0__default = /*#__PURE__*/ _interopDefaultLegacy(require$$0);
var axios__default = /*#__PURE__*/ _interopDefaultLegacy(axios);

/**
 * 获取目录下所有文件
 * @param path {string} - 目录绝对路径
 * @return {Promise<string[]>}
 */
async function getAllTheFilesInTheDirectory(path) {
  const paths = [];
  const stack = [path];
  const pathStat = await promises.stat(path);
  const defaultIgnore = ["node_modules", ".git", ".vscode", ".idea"];
  if (!pathStat.isDirectory()) {
    return paths;
  }
  while (stack.length > 0) {
    const url = stack.pop();
    const dirs = await promises.readdir(url);
    for (const part of dirs) {
      const nextUri = node_path.resolve(url, part);
      const info = await promises.stat(nextUri);
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
async function forEachDirectory(uri, callback) {
  const paths = await getAllTheFilesInTheDirectory(uri);
  for (const path of paths) {
    await callback(path);
  }
}
/**
 * 同步对目录下文件进行遍历
 * @param {string} path
 * @param {Callback} callback
 */
function forEachDirectorySync(path, callback) {
  const stack = [path];
  const pathStat = fs.statSync(path);
  const defaultIgnore = ["node_modules", ".git", ".vscode", ".idea"];
  if (!pathStat.isDirectory()) {
    return;
  }
  while (stack.length > 0) {
    const url = stack.pop();
    const dirs = fs.readdirSync(url);
    for (const part of dirs) {
      const nextUri = node_path.resolve(url, part);
      const info = fs.statSync(nextUri);
      if (info.isDirectory() && !defaultIgnore.includes(part)) {
        stack.push(nextUri);
        continue;
      }
      if (info.isFile()) {
        callback(nextUri);
      }
    }
  }
}
/**
 * 检查路径是否存在
 * @param url {string} - 绝对路径
 * @return {Promise<boolean>}
 */
async function checkPathIsExist(url) {
  try {
    await promises.stat(url);
    return true;
  } catch (err) {
    return false;
  }
}
/**
 * 同步检查路径是否存在
 * @param url {string} - 绝对路径
 * @return {Promise<boolean>}
 */
async function checkPathIsExistSync(url) {
  try {
    fs.statSync(url);
    return true;
  } catch (err) {
    return false;
  }
}
/**
 * 是否是一个有效的 URL
 * @param url {string}
 * @return {boolean}
 */
function isValidUrl(url) {
  return /^https?:\/\/.+?/.test(url);
}

function getDefaultExportFromCjs(x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
}

/* eslint complexity: [2, 18], max-statements: [2, 33] */
var shams = function hasSymbols() {
  if (typeof Symbol !== "function" || typeof Object.getOwnPropertySymbols !== "function") {
    return false;
  }
  if (typeof Symbol.iterator === "symbol") {
    return true;
  }

  var obj = {};
  var sym = Symbol("test");
  var symObj = Object(sym);
  if (typeof sym === "string") {
    return false;
  }

  if (Object.prototype.toString.call(sym) !== "[object Symbol]") {
    return false;
  }
  if (Object.prototype.toString.call(symObj) !== "[object Symbol]") {
    return false;
  }

  // temp disabled per https://github.com/ljharb/object.assign/issues/17
  // if (sym instanceof Symbol) { return false; }
  // temp disabled per https://github.com/WebReflection/get-own-property-symbols/issues/4
  // if (!(symObj instanceof Symbol)) { return false; }

  // if (typeof Symbol.prototype.toString !== 'function') { return false; }
  // if (String(sym) !== Symbol.prototype.toString.call(sym)) { return false; }

  var symVal = 42;
  obj[sym] = symVal;
  for (sym in obj) {
    return false;
  } // eslint-disable-line no-restricted-syntax, no-unreachable-loop
  if (typeof Object.keys === "function" && Object.keys(obj).length !== 0) {
    return false;
  }

  if (typeof Object.getOwnPropertyNames === "function" && Object.getOwnPropertyNames(obj).length !== 0) {
    return false;
  }

  var syms = Object.getOwnPropertySymbols(obj);
  if (syms.length !== 1 || syms[0] !== sym) {
    return false;
  }

  if (!Object.prototype.propertyIsEnumerable.call(obj, sym)) {
    return false;
  }

  if (typeof Object.getOwnPropertyDescriptor === "function") {
    var descriptor = Object.getOwnPropertyDescriptor(obj, sym);
    if (descriptor.value !== symVal || descriptor.enumerable !== true) {
      return false;
    }
  }

  return true;
};

var origSymbol = typeof Symbol !== "undefined" && Symbol;
var hasSymbolSham = shams;

var hasSymbols$1 = function hasNativeSymbols() {
  if (typeof origSymbol !== "function") {
    return false;
  }
  if (typeof Symbol !== "function") {
    return false;
  }
  if (typeof origSymbol("foo") !== "symbol") {
    return false;
  }
  if (typeof Symbol("bar") !== "symbol") {
    return false;
  }

  return hasSymbolSham();
};

/* eslint no-invalid-this: 1 */

var ERROR_MESSAGE = "Function.prototype.bind called on incompatible ";
var slice = Array.prototype.slice;
var toStr$1 = Object.prototype.toString;
var funcType = "[object Function]";

var implementation$1 = function bind(that) {
  var target = this;
  if (typeof target !== "function" || toStr$1.call(target) !== funcType) {
    throw new TypeError(ERROR_MESSAGE + target);
  }
  var args = slice.call(arguments, 1);

  var bound;
  var binder = function () {
    if (this instanceof bound) {
      var result = target.apply(this, args.concat(slice.call(arguments)));
      if (Object(result) === result) {
        return result;
      }
      return this;
    } else {
      return target.apply(that, args.concat(slice.call(arguments)));
    }
  };

  var boundLength = Math.max(0, target.length - args.length);
  var boundArgs = [];
  for (var i = 0; i < boundLength; i++) {
    boundArgs.push("$" + i);
  }

  bound = Function(
    "binder",
    "return function (" + boundArgs.join(",") + "){ return binder.apply(this,arguments); }"
  )(binder);

  if (target.prototype) {
    var Empty = function Empty() {};
    Empty.prototype = target.prototype;
    bound.prototype = new Empty();
    Empty.prototype = null;
  }

  return bound;
};

var implementation = implementation$1;

var functionBind = Function.prototype.bind || implementation;

var bind$1 = functionBind;

var src = bind$1.call(Function.call, Object.prototype.hasOwnProperty);

var undefined$1;

var $SyntaxError = SyntaxError;
var $Function = Function;
var $TypeError$1 = TypeError;

// eslint-disable-next-line consistent-return
var getEvalledConstructor = function (expressionSyntax) {
  try {
    return $Function('"use strict"; return (' + expressionSyntax + ").constructor;")();
  } catch (e) {}
};

var $gOPD = Object.getOwnPropertyDescriptor;
if ($gOPD) {
  try {
    $gOPD({}, "");
  } catch (e) {
    $gOPD = null; // this is IE 8, which has a broken gOPD
  }
}

var throwTypeError = function () {
  throw new $TypeError$1();
};
var ThrowTypeError = $gOPD
  ? (function () {
      try {
        // eslint-disable-next-line no-unused-expressions, no-caller, no-restricted-properties
        arguments.callee; // IE 8 does not throw here
        return throwTypeError;
      } catch (calleeThrows) {
        try {
          // IE 8 throws on Object.getOwnPropertyDescriptor(arguments, '')
          return $gOPD(arguments, "callee").get;
        } catch (gOPDthrows) {
          return throwTypeError;
        }
      }
    })()
  : throwTypeError;

var hasSymbols = hasSymbols$1();

var getProto =
  Object.getPrototypeOf ||
  function (x) {
    return x.__proto__;
  }; // eslint-disable-line no-proto

var needsEval = {};

var TypedArray = typeof Uint8Array === "undefined" ? undefined$1 : getProto(Uint8Array);

var INTRINSICS = {
  "%AggregateError%": typeof AggregateError === "undefined" ? undefined$1 : AggregateError,
  "%Array%": Array,
  "%ArrayBuffer%": typeof ArrayBuffer === "undefined" ? undefined$1 : ArrayBuffer,
  "%ArrayIteratorPrototype%": hasSymbols ? getProto([][Symbol.iterator]()) : undefined$1,
  "%AsyncFromSyncIteratorPrototype%": undefined$1,
  "%AsyncFunction%": needsEval,
  "%AsyncGenerator%": needsEval,
  "%AsyncGeneratorFunction%": needsEval,
  "%AsyncIteratorPrototype%": needsEval,
  "%Atomics%": typeof Atomics === "undefined" ? undefined$1 : Atomics,
  "%BigInt%": typeof BigInt === "undefined" ? undefined$1 : BigInt,
  "%Boolean%": Boolean,
  "%DataView%": typeof DataView === "undefined" ? undefined$1 : DataView,
  "%Date%": Date,
  "%decodeURI%": decodeURI,
  "%decodeURIComponent%": decodeURIComponent,
  "%encodeURI%": encodeURI,
  "%encodeURIComponent%": encodeURIComponent,
  "%Error%": Error,
  "%eval%": eval, // eslint-disable-line no-eval
  "%EvalError%": EvalError,
  "%Float32Array%": typeof Float32Array === "undefined" ? undefined$1 : Float32Array,
  "%Float64Array%": typeof Float64Array === "undefined" ? undefined$1 : Float64Array,
  "%FinalizationRegistry%": typeof FinalizationRegistry === "undefined" ? undefined$1 : FinalizationRegistry,
  "%Function%": $Function,
  "%GeneratorFunction%": needsEval,
  "%Int8Array%": typeof Int8Array === "undefined" ? undefined$1 : Int8Array,
  "%Int16Array%": typeof Int16Array === "undefined" ? undefined$1 : Int16Array,
  "%Int32Array%": typeof Int32Array === "undefined" ? undefined$1 : Int32Array,
  "%isFinite%": isFinite,
  "%isNaN%": isNaN,
  "%IteratorPrototype%": hasSymbols ? getProto(getProto([][Symbol.iterator]())) : undefined$1,
  "%JSON%": typeof JSON === "object" ? JSON : undefined$1,
  "%Map%": typeof Map === "undefined" ? undefined$1 : Map,
  "%MapIteratorPrototype%":
    typeof Map === "undefined" || !hasSymbols ? undefined$1 : getProto(new Map()[Symbol.iterator]()),
  "%Math%": Math,
  "%Number%": Number,
  "%Object%": Object,
  "%parseFloat%": parseFloat,
  "%parseInt%": parseInt,
  "%Promise%": typeof Promise === "undefined" ? undefined$1 : Promise,
  "%Proxy%": typeof Proxy === "undefined" ? undefined$1 : Proxy,
  "%RangeError%": RangeError,
  "%ReferenceError%": ReferenceError,
  "%Reflect%": typeof Reflect === "undefined" ? undefined$1 : Reflect,
  "%RegExp%": RegExp,
  "%Set%": typeof Set === "undefined" ? undefined$1 : Set,
  "%SetIteratorPrototype%":
    typeof Set === "undefined" || !hasSymbols ? undefined$1 : getProto(new Set()[Symbol.iterator]()),
  "%SharedArrayBuffer%": typeof SharedArrayBuffer === "undefined" ? undefined$1 : SharedArrayBuffer,
  "%String%": String,
  "%StringIteratorPrototype%": hasSymbols ? getProto(""[Symbol.iterator]()) : undefined$1,
  "%Symbol%": hasSymbols ? Symbol : undefined$1,
  "%SyntaxError%": $SyntaxError,
  "%ThrowTypeError%": ThrowTypeError,
  "%TypedArray%": TypedArray,
  "%TypeError%": $TypeError$1,
  "%Uint8Array%": typeof Uint8Array === "undefined" ? undefined$1 : Uint8Array,
  "%Uint8ClampedArray%": typeof Uint8ClampedArray === "undefined" ? undefined$1 : Uint8ClampedArray,
  "%Uint16Array%": typeof Uint16Array === "undefined" ? undefined$1 : Uint16Array,
  "%Uint32Array%": typeof Uint32Array === "undefined" ? undefined$1 : Uint32Array,
  "%URIError%": URIError,
  "%WeakMap%": typeof WeakMap === "undefined" ? undefined$1 : WeakMap,
  "%WeakRef%": typeof WeakRef === "undefined" ? undefined$1 : WeakRef,
  "%WeakSet%": typeof WeakSet === "undefined" ? undefined$1 : WeakSet,
};

var doEval = function doEval(name) {
  var value;
  if (name === "%AsyncFunction%") {
    value = getEvalledConstructor("async function () {}");
  } else if (name === "%GeneratorFunction%") {
    value = getEvalledConstructor("function* () {}");
  } else if (name === "%AsyncGeneratorFunction%") {
    value = getEvalledConstructor("async function* () {}");
  } else if (name === "%AsyncGenerator%") {
    var fn = doEval("%AsyncGeneratorFunction%");
    if (fn) {
      value = fn.prototype;
    }
  } else if (name === "%AsyncIteratorPrototype%") {
    var gen = doEval("%AsyncGenerator%");
    if (gen) {
      value = getProto(gen.prototype);
    }
  }

  INTRINSICS[name] = value;

  return value;
};

var LEGACY_ALIASES = {
  "%ArrayBufferPrototype%": ["ArrayBuffer", "prototype"],
  "%ArrayPrototype%": ["Array", "prototype"],
  "%ArrayProto_entries%": ["Array", "prototype", "entries"],
  "%ArrayProto_forEach%": ["Array", "prototype", "forEach"],
  "%ArrayProto_keys%": ["Array", "prototype", "keys"],
  "%ArrayProto_values%": ["Array", "prototype", "values"],
  "%AsyncFunctionPrototype%": ["AsyncFunction", "prototype"],
  "%AsyncGenerator%": ["AsyncGeneratorFunction", "prototype"],
  "%AsyncGeneratorPrototype%": ["AsyncGeneratorFunction", "prototype", "prototype"],
  "%BooleanPrototype%": ["Boolean", "prototype"],
  "%DataViewPrototype%": ["DataView", "prototype"],
  "%DatePrototype%": ["Date", "prototype"],
  "%ErrorPrototype%": ["Error", "prototype"],
  "%EvalErrorPrototype%": ["EvalError", "prototype"],
  "%Float32ArrayPrototype%": ["Float32Array", "prototype"],
  "%Float64ArrayPrototype%": ["Float64Array", "prototype"],
  "%FunctionPrototype%": ["Function", "prototype"],
  "%Generator%": ["GeneratorFunction", "prototype"],
  "%GeneratorPrototype%": ["GeneratorFunction", "prototype", "prototype"],
  "%Int8ArrayPrototype%": ["Int8Array", "prototype"],
  "%Int16ArrayPrototype%": ["Int16Array", "prototype"],
  "%Int32ArrayPrototype%": ["Int32Array", "prototype"],
  "%JSONParse%": ["JSON", "parse"],
  "%JSONStringify%": ["JSON", "stringify"],
  "%MapPrototype%": ["Map", "prototype"],
  "%NumberPrototype%": ["Number", "prototype"],
  "%ObjectPrototype%": ["Object", "prototype"],
  "%ObjProto_toString%": ["Object", "prototype", "toString"],
  "%ObjProto_valueOf%": ["Object", "prototype", "valueOf"],
  "%PromisePrototype%": ["Promise", "prototype"],
  "%PromiseProto_then%": ["Promise", "prototype", "then"],
  "%Promise_all%": ["Promise", "all"],
  "%Promise_reject%": ["Promise", "reject"],
  "%Promise_resolve%": ["Promise", "resolve"],
  "%RangeErrorPrototype%": ["RangeError", "prototype"],
  "%ReferenceErrorPrototype%": ["ReferenceError", "prototype"],
  "%RegExpPrototype%": ["RegExp", "prototype"],
  "%SetPrototype%": ["Set", "prototype"],
  "%SharedArrayBufferPrototype%": ["SharedArrayBuffer", "prototype"],
  "%StringPrototype%": ["String", "prototype"],
  "%SymbolPrototype%": ["Symbol", "prototype"],
  "%SyntaxErrorPrototype%": ["SyntaxError", "prototype"],
  "%TypedArrayPrototype%": ["TypedArray", "prototype"],
  "%TypeErrorPrototype%": ["TypeError", "prototype"],
  "%Uint8ArrayPrototype%": ["Uint8Array", "prototype"],
  "%Uint8ClampedArrayPrototype%": ["Uint8ClampedArray", "prototype"],
  "%Uint16ArrayPrototype%": ["Uint16Array", "prototype"],
  "%Uint32ArrayPrototype%": ["Uint32Array", "prototype"],
  "%URIErrorPrototype%": ["URIError", "prototype"],
  "%WeakMapPrototype%": ["WeakMap", "prototype"],
  "%WeakSetPrototype%": ["WeakSet", "prototype"],
};

var bind = functionBind;
var hasOwn$1 = src;
var $concat$1 = bind.call(Function.call, Array.prototype.concat);
var $spliceApply = bind.call(Function.apply, Array.prototype.splice);
var $replace$1 = bind.call(Function.call, String.prototype.replace);
var $strSlice = bind.call(Function.call, String.prototype.slice);
var $exec = bind.call(Function.call, RegExp.prototype.exec);

/* adapted from https://github.com/lodash/lodash/blob/4.17.15/dist/lodash.js#L6735-L6744 */
var rePropName = /[^%.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|%$))/g;
var reEscapeChar = /\\(\\)?/g; /** Used to match backslashes in property paths. */
var stringToPath = function stringToPath(string) {
  var first = $strSlice(string, 0, 1);
  var last = $strSlice(string, -1);
  if (first === "%" && last !== "%") {
    throw new $SyntaxError("invalid intrinsic syntax, expected closing `%`");
  } else if (last === "%" && first !== "%") {
    throw new $SyntaxError("invalid intrinsic syntax, expected opening `%`");
  }
  var result = [];
  $replace$1(string, rePropName, function (match, number, quote, subString) {
    result[result.length] = quote ? $replace$1(subString, reEscapeChar, "$1") : number || match;
  });
  return result;
};
/* end adaptation */

var getBaseIntrinsic = function getBaseIntrinsic(name, allowMissing) {
  var intrinsicName = name;
  var alias;
  if (hasOwn$1(LEGACY_ALIASES, intrinsicName)) {
    alias = LEGACY_ALIASES[intrinsicName];
    intrinsicName = "%" + alias[0] + "%";
  }

  if (hasOwn$1(INTRINSICS, intrinsicName)) {
    var value = INTRINSICS[intrinsicName];
    if (value === needsEval) {
      value = doEval(intrinsicName);
    }
    if (typeof value === "undefined" && !allowMissing) {
      throw new $TypeError$1("intrinsic " + name + " exists, but is not available. Please file an issue!");
    }

    return {
      alias: alias,
      name: intrinsicName,
      value: value,
    };
  }

  throw new $SyntaxError("intrinsic " + name + " does not exist!");
};

var getIntrinsic = function GetIntrinsic(name, allowMissing) {
  if (typeof name !== "string" || name.length === 0) {
    throw new $TypeError$1("intrinsic name must be a non-empty string");
  }
  if (arguments.length > 1 && typeof allowMissing !== "boolean") {
    throw new $TypeError$1('"allowMissing" argument must be a boolean');
  }

  if ($exec(/^%?[^%]*%?$/g, name) === null) {
    throw new $SyntaxError("`%` may not be present anywhere but at the beginning and end of the intrinsic name");
  }
  var parts = stringToPath(name);
  var intrinsicBaseName = parts.length > 0 ? parts[0] : "";

  var intrinsic = getBaseIntrinsic("%" + intrinsicBaseName + "%", allowMissing);
  var intrinsicRealName = intrinsic.name;
  var value = intrinsic.value;
  var skipFurtherCaching = false;

  var alias = intrinsic.alias;
  if (alias) {
    intrinsicBaseName = alias[0];
    $spliceApply(parts, $concat$1([0, 1], alias));
  }

  for (var i = 1, isOwn = true; i < parts.length; i += 1) {
    var part = parts[i];
    var first = $strSlice(part, 0, 1);
    var last = $strSlice(part, -1);
    if (
      (first === '"' || first === "'" || first === "`" || last === '"' || last === "'" || last === "`") &&
      first !== last
    ) {
      throw new $SyntaxError("property names with quotes must have matching quotes");
    }
    if (part === "constructor" || !isOwn) {
      skipFurtherCaching = true;
    }

    intrinsicBaseName += "." + part;
    intrinsicRealName = "%" + intrinsicBaseName + "%";

    if (hasOwn$1(INTRINSICS, intrinsicRealName)) {
      value = INTRINSICS[intrinsicRealName];
    } else if (value != null) {
      if (!(part in value)) {
        if (!allowMissing) {
          throw new $TypeError$1("base intrinsic for " + name + " exists, but the property is not available.");
        }
        return void undefined$1;
      }
      if ($gOPD && i + 1 >= parts.length) {
        var desc = $gOPD(value, part);
        isOwn = !!desc;

        // By convention, when a data property is converted to an accessor
        // property to emulate a data property that does not suffer from
        // the override mistake, that accessor's getter is marked with
        // an `originalValue` property. Here, when we detect this, we
        // uphold the illusion by pretending to see that original data
        // property, i.e., returning the value rather than the getter
        // itself.
        if (isOwn && "get" in desc && !("originalValue" in desc.get)) {
          value = desc.get;
        } else {
          value = value[part];
        }
      } else {
        isOwn = hasOwn$1(value, part);
        value = value[part];
      }

      if (isOwn && !skipFurtherCaching) {
        INTRINSICS[intrinsicRealName] = value;
      }
    }
  }
  return value;
};

var callBind$1 = { exports: {} };

(function (module) {
  var bind = functionBind;
  var GetIntrinsic = getIntrinsic;

  var $apply = GetIntrinsic("%Function.prototype.apply%");
  var $call = GetIntrinsic("%Function.prototype.call%");
  var $reflectApply = GetIntrinsic("%Reflect.apply%", true) || bind.call($call, $apply);

  var $gOPD = GetIntrinsic("%Object.getOwnPropertyDescriptor%", true);
  var $defineProperty = GetIntrinsic("%Object.defineProperty%", true);
  var $max = GetIntrinsic("%Math.max%");

  if ($defineProperty) {
    try {
      $defineProperty({}, "a", { value: 1 });
    } catch (e) {
      // IE 8 has a broken defineProperty
      $defineProperty = null;
    }
  }

  module.exports = function callBind(originalFunction) {
    var func = $reflectApply(bind, $call, arguments);
    if ($gOPD && $defineProperty) {
      var desc = $gOPD(func, "length");
      if (desc.configurable) {
        // original length, plus the receiver, minus any additional arguments (after the receiver)
        $defineProperty(func, "length", { value: 1 + $max(0, originalFunction.length - (arguments.length - 1)) });
      }
    }
    return func;
  };

  var applyBind = function applyBind() {
    return $reflectApply(bind, $apply, arguments);
  };

  if ($defineProperty) {
    $defineProperty(module.exports, "apply", { value: applyBind });
  } else {
    module.exports.apply = applyBind;
  }
})(callBind$1);

var GetIntrinsic$1 = getIntrinsic;

var callBind = callBind$1.exports;

var $indexOf = callBind(GetIntrinsic$1("String.prototype.indexOf"));

var callBound$1 = function callBoundIntrinsic(name, allowMissing) {
  var intrinsic = GetIntrinsic$1(name, !!allowMissing);
  if (typeof intrinsic === "function" && $indexOf(name, ".prototype.") > -1) {
    return callBind(intrinsic);
  }
  return intrinsic;
};

var util_inspect = require$$0__default["default"].inspect;

var hasMap = typeof Map === "function" && Map.prototype;
var mapSizeDescriptor =
  Object.getOwnPropertyDescriptor && hasMap ? Object.getOwnPropertyDescriptor(Map.prototype, "size") : null;
var mapSize = hasMap && mapSizeDescriptor && typeof mapSizeDescriptor.get === "function" ? mapSizeDescriptor.get : null;
var mapForEach = hasMap && Map.prototype.forEach;
var hasSet = typeof Set === "function" && Set.prototype;
var setSizeDescriptor =
  Object.getOwnPropertyDescriptor && hasSet ? Object.getOwnPropertyDescriptor(Set.prototype, "size") : null;
var setSize = hasSet && setSizeDescriptor && typeof setSizeDescriptor.get === "function" ? setSizeDescriptor.get : null;
var setForEach = hasSet && Set.prototype.forEach;
var hasWeakMap = typeof WeakMap === "function" && WeakMap.prototype;
var weakMapHas = hasWeakMap ? WeakMap.prototype.has : null;
var hasWeakSet = typeof WeakSet === "function" && WeakSet.prototype;
var weakSetHas = hasWeakSet ? WeakSet.prototype.has : null;
var hasWeakRef = typeof WeakRef === "function" && WeakRef.prototype;
var weakRefDeref = hasWeakRef ? WeakRef.prototype.deref : null;
var booleanValueOf = Boolean.prototype.valueOf;
var objectToString = Object.prototype.toString;
var functionToString = Function.prototype.toString;
var $match = String.prototype.match;
var $slice = String.prototype.slice;
var $replace = String.prototype.replace;
var $toUpperCase = String.prototype.toUpperCase;
var $toLowerCase = String.prototype.toLowerCase;
var $test = RegExp.prototype.test;
var $concat = Array.prototype.concat;
var $join = Array.prototype.join;
var $arrSlice = Array.prototype.slice;
var $floor = Math.floor;
var bigIntValueOf = typeof BigInt === "function" ? BigInt.prototype.valueOf : null;
var gOPS = Object.getOwnPropertySymbols;
var symToString =
  typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? Symbol.prototype.toString : null;
var hasShammedSymbols = typeof Symbol === "function" && typeof Symbol.iterator === "object";
// ie, `has-tostringtag/shams
var toStringTag =
  typeof Symbol === "function" &&
  Symbol.toStringTag &&
  (typeof Symbol.toStringTag === hasShammedSymbols ? "object" : "symbol")
    ? Symbol.toStringTag
    : null;
var isEnumerable = Object.prototype.propertyIsEnumerable;

var gPO =
  (typeof Reflect === "function" ? Reflect.getPrototypeOf : Object.getPrototypeOf) ||
  ([].__proto__ === Array.prototype // eslint-disable-line no-proto
    ? function (O) {
        return O.__proto__; // eslint-disable-line no-proto
      }
    : null);

function addNumericSeparator(num, str) {
  if (
    num === Infinity ||
    num === -Infinity ||
    num !== num ||
    (num && num > -1000 && num < 1000) ||
    $test.call(/e/, str)
  ) {
    return str;
  }
  var sepRegex = /[0-9](?=(?:[0-9]{3})+(?![0-9]))/g;
  if (typeof num === "number") {
    var int = num < 0 ? -$floor(-num) : $floor(num); // trunc(num)
    if (int !== num) {
      var intStr = String(int);
      var dec = $slice.call(str, intStr.length + 1);
      return (
        $replace.call(intStr, sepRegex, "$&_") + "." + $replace.call($replace.call(dec, /([0-9]{3})/g, "$&_"), /_$/, "")
      );
    }
  }
  return $replace.call(str, sepRegex, "$&_");
}

var utilInspect = util_inspect;
var inspectCustom = utilInspect.custom;
var inspectSymbol = isSymbol(inspectCustom) ? inspectCustom : null;

var objectInspect = function inspect_(obj, options, depth, seen) {
  var opts = options || {};

  if (has$3(opts, "quoteStyle") && opts.quoteStyle !== "single" && opts.quoteStyle !== "double") {
    throw new TypeError('option "quoteStyle" must be "single" or "double"');
  }
  if (
    has$3(opts, "maxStringLength") &&
    (typeof opts.maxStringLength === "number"
      ? opts.maxStringLength < 0 && opts.maxStringLength !== Infinity
      : opts.maxStringLength !== null)
  ) {
    throw new TypeError('option "maxStringLength", if provided, must be a positive integer, Infinity, or `null`');
  }
  var customInspect = has$3(opts, "customInspect") ? opts.customInspect : true;
  if (typeof customInspect !== "boolean" && customInspect !== "symbol") {
    throw new TypeError("option \"customInspect\", if provided, must be `true`, `false`, or `'symbol'`");
  }

  if (
    has$3(opts, "indent") &&
    opts.indent !== null &&
    opts.indent !== "\t" &&
    !(parseInt(opts.indent, 10) === opts.indent && opts.indent > 0)
  ) {
    throw new TypeError('option "indent" must be "\\t", an integer > 0, or `null`');
  }
  if (has$3(opts, "numericSeparator") && typeof opts.numericSeparator !== "boolean") {
    throw new TypeError('option "numericSeparator", if provided, must be `true` or `false`');
  }
  var numericSeparator = opts.numericSeparator;

  if (typeof obj === "undefined") {
    return "undefined";
  }
  if (obj === null) {
    return "null";
  }
  if (typeof obj === "boolean") {
    return obj ? "true" : "false";
  }

  if (typeof obj === "string") {
    return inspectString(obj, opts);
  }
  if (typeof obj === "number") {
    if (obj === 0) {
      return Infinity / obj > 0 ? "0" : "-0";
    }
    var str = String(obj);
    return numericSeparator ? addNumericSeparator(obj, str) : str;
  }
  if (typeof obj === "bigint") {
    var bigIntStr = String(obj) + "n";
    return numericSeparator ? addNumericSeparator(obj, bigIntStr) : bigIntStr;
  }

  var maxDepth = typeof opts.depth === "undefined" ? 5 : opts.depth;
  if (typeof depth === "undefined") {
    depth = 0;
  }
  if (depth >= maxDepth && maxDepth > 0 && typeof obj === "object") {
    return isArray$3(obj) ? "[Array]" : "[Object]";
  }

  var indent = getIndent(opts, depth);

  if (typeof seen === "undefined") {
    seen = [];
  } else if (indexOf(seen, obj) >= 0) {
    return "[Circular]";
  }

  function inspect(value, from, noIndent) {
    if (from) {
      seen = $arrSlice.call(seen);
      seen.push(from);
    }
    if (noIndent) {
      var newOpts = {
        depth: opts.depth,
      };
      if (has$3(opts, "quoteStyle")) {
        newOpts.quoteStyle = opts.quoteStyle;
      }
      return inspect_(value, newOpts, depth + 1, seen);
    }
    return inspect_(value, opts, depth + 1, seen);
  }

  if (typeof obj === "function" && !isRegExp$1(obj)) {
    // in older engines, regexes are callable
    var name = nameOf(obj);
    var keys = arrObjKeys(obj, inspect);
    return (
      "[Function" +
      (name ? ": " + name : " (anonymous)") +
      "]" +
      (keys.length > 0 ? " { " + $join.call(keys, ", ") + " }" : "")
    );
  }
  if (isSymbol(obj)) {
    var symString = hasShammedSymbols
      ? $replace.call(String(obj), /^(Symbol\(.*\))_[^)]*$/, "$1")
      : symToString.call(obj);
    return typeof obj === "object" && !hasShammedSymbols ? markBoxed(symString) : symString;
  }
  if (isElement(obj)) {
    var s = "<" + $toLowerCase.call(String(obj.nodeName));
    var attrs = obj.attributes || [];
    for (var i = 0; i < attrs.length; i++) {
      s += " " + attrs[i].name + "=" + wrapQuotes(quote(attrs[i].value), "double", opts);
    }
    s += ">";
    if (obj.childNodes && obj.childNodes.length) {
      s += "...";
    }
    s += "</" + $toLowerCase.call(String(obj.nodeName)) + ">";
    return s;
  }
  if (isArray$3(obj)) {
    if (obj.length === 0) {
      return "[]";
    }
    var xs = arrObjKeys(obj, inspect);
    if (indent && !singleLineValues(xs)) {
      return "[" + indentedJoin(xs, indent) + "]";
    }
    return "[ " + $join.call(xs, ", ") + " ]";
  }
  if (isError(obj)) {
    var parts = arrObjKeys(obj, inspect);
    if (!("cause" in Error.prototype) && "cause" in obj && !isEnumerable.call(obj, "cause")) {
      return (
        "{ [" + String(obj) + "] " + $join.call($concat.call("[cause]: " + inspect(obj.cause), parts), ", ") + " }"
      );
    }
    if (parts.length === 0) {
      return "[" + String(obj) + "]";
    }
    return "{ [" + String(obj) + "] " + $join.call(parts, ", ") + " }";
  }
  if (typeof obj === "object" && customInspect) {
    if (inspectSymbol && typeof obj[inspectSymbol] === "function" && utilInspect) {
      return utilInspect(obj, { depth: maxDepth - depth });
    } else if (customInspect !== "symbol" && typeof obj.inspect === "function") {
      return obj.inspect();
    }
  }
  if (isMap(obj)) {
    var mapParts = [];
    mapForEach.call(obj, function (value, key) {
      mapParts.push(inspect(key, obj, true) + " => " + inspect(value, obj));
    });
    return collectionOf("Map", mapSize.call(obj), mapParts, indent);
  }
  if (isSet(obj)) {
    var setParts = [];
    setForEach.call(obj, function (value) {
      setParts.push(inspect(value, obj));
    });
    return collectionOf("Set", setSize.call(obj), setParts, indent);
  }
  if (isWeakMap(obj)) {
    return weakCollectionOf("WeakMap");
  }
  if (isWeakSet(obj)) {
    return weakCollectionOf("WeakSet");
  }
  if (isWeakRef(obj)) {
    return weakCollectionOf("WeakRef");
  }
  if (isNumber(obj)) {
    return markBoxed(inspect(Number(obj)));
  }
  if (isBigInt(obj)) {
    return markBoxed(inspect(bigIntValueOf.call(obj)));
  }
  if (isBoolean(obj)) {
    return markBoxed(booleanValueOf.call(obj));
  }
  if (isString(obj)) {
    return markBoxed(inspect(String(obj)));
  }
  if (!isDate(obj) && !isRegExp$1(obj)) {
    var ys = arrObjKeys(obj, inspect);
    var isPlainObject = gPO ? gPO(obj) === Object.prototype : obj instanceof Object || obj.constructor === Object;
    var protoTag = obj instanceof Object ? "" : "null prototype";
    var stringTag =
      !isPlainObject && toStringTag && Object(obj) === obj && toStringTag in obj
        ? $slice.call(toStr(obj), 8, -1)
        : protoTag
        ? "Object"
        : "";
    var constructorTag =
      isPlainObject || typeof obj.constructor !== "function"
        ? ""
        : obj.constructor.name
        ? obj.constructor.name + " "
        : "";
    var tag =
      constructorTag +
      (stringTag || protoTag ? "[" + $join.call($concat.call([], stringTag || [], protoTag || []), ": ") + "] " : "");
    if (ys.length === 0) {
      return tag + "{}";
    }
    if (indent) {
      return tag + "{" + indentedJoin(ys, indent) + "}";
    }
    return tag + "{ " + $join.call(ys, ", ") + " }";
  }
  return String(obj);
};

function wrapQuotes(s, defaultStyle, opts) {
  var quoteChar = (opts.quoteStyle || defaultStyle) === "double" ? '"' : "'";
  return quoteChar + s + quoteChar;
}

function quote(s) {
  return $replace.call(String(s), /"/g, "&quot;");
}

function isArray$3(obj) {
  return toStr(obj) === "[object Array]" && (!toStringTag || !(typeof obj === "object" && toStringTag in obj));
}
function isDate(obj) {
  return toStr(obj) === "[object Date]" && (!toStringTag || !(typeof obj === "object" && toStringTag in obj));
}
function isRegExp$1(obj) {
  return toStr(obj) === "[object RegExp]" && (!toStringTag || !(typeof obj === "object" && toStringTag in obj));
}
function isError(obj) {
  return toStr(obj) === "[object Error]" && (!toStringTag || !(typeof obj === "object" && toStringTag in obj));
}
function isString(obj) {
  return toStr(obj) === "[object String]" && (!toStringTag || !(typeof obj === "object" && toStringTag in obj));
}
function isNumber(obj) {
  return toStr(obj) === "[object Number]" && (!toStringTag || !(typeof obj === "object" && toStringTag in obj));
}
function isBoolean(obj) {
  return toStr(obj) === "[object Boolean]" && (!toStringTag || !(typeof obj === "object" && toStringTag in obj));
}

// Symbol and BigInt do have Symbol.toStringTag by spec, so that can't be used to eliminate false positives
function isSymbol(obj) {
  if (hasShammedSymbols) {
    return obj && typeof obj === "object" && obj instanceof Symbol;
  }
  if (typeof obj === "symbol") {
    return true;
  }
  if (!obj || typeof obj !== "object" || !symToString) {
    return false;
  }
  try {
    symToString.call(obj);
    return true;
  } catch (e) {}
  return false;
}

function isBigInt(obj) {
  if (!obj || typeof obj !== "object" || !bigIntValueOf) {
    return false;
  }
  try {
    bigIntValueOf.call(obj);
    return true;
  } catch (e) {}
  return false;
}

var hasOwn =
  Object.prototype.hasOwnProperty ||
  function (key) {
    return key in this;
  };
function has$3(obj, key) {
  return hasOwn.call(obj, key);
}

function toStr(obj) {
  return objectToString.call(obj);
}

function nameOf(f) {
  if (f.name) {
    return f.name;
  }
  var m = $match.call(functionToString.call(f), /^function\s*([\w$]+)/);
  if (m) {
    return m[1];
  }
  return null;
}

function indexOf(xs, x) {
  if (xs.indexOf) {
    return xs.indexOf(x);
  }
  for (var i = 0, l = xs.length; i < l; i++) {
    if (xs[i] === x) {
      return i;
    }
  }
  return -1;
}

function isMap(x) {
  if (!mapSize || !x || typeof x !== "object") {
    return false;
  }
  try {
    mapSize.call(x);
    try {
      setSize.call(x);
    } catch (s) {
      return true;
    }
    return x instanceof Map; // core-js workaround, pre-v2.5.0
  } catch (e) {}
  return false;
}

function isWeakMap(x) {
  if (!weakMapHas || !x || typeof x !== "object") {
    return false;
  }
  try {
    weakMapHas.call(x, weakMapHas);
    try {
      weakSetHas.call(x, weakSetHas);
    } catch (s) {
      return true;
    }
    return x instanceof WeakMap; // core-js workaround, pre-v2.5.0
  } catch (e) {}
  return false;
}

function isWeakRef(x) {
  if (!weakRefDeref || !x || typeof x !== "object") {
    return false;
  }
  try {
    weakRefDeref.call(x);
    return true;
  } catch (e) {}
  return false;
}

function isSet(x) {
  if (!setSize || !x || typeof x !== "object") {
    return false;
  }
  try {
    setSize.call(x);
    try {
      mapSize.call(x);
    } catch (m) {
      return true;
    }
    return x instanceof Set; // core-js workaround, pre-v2.5.0
  } catch (e) {}
  return false;
}

function isWeakSet(x) {
  if (!weakSetHas || !x || typeof x !== "object") {
    return false;
  }
  try {
    weakSetHas.call(x, weakSetHas);
    try {
      weakMapHas.call(x, weakMapHas);
    } catch (s) {
      return true;
    }
    return x instanceof WeakSet; // core-js workaround, pre-v2.5.0
  } catch (e) {}
  return false;
}

function isElement(x) {
  if (!x || typeof x !== "object") {
    return false;
  }
  if (typeof HTMLElement !== "undefined" && x instanceof HTMLElement) {
    return true;
  }
  return typeof x.nodeName === "string" && typeof x.getAttribute === "function";
}

function inspectString(str, opts) {
  if (str.length > opts.maxStringLength) {
    var remaining = str.length - opts.maxStringLength;
    var trailer = "... " + remaining + " more character" + (remaining > 1 ? "s" : "");
    return inspectString($slice.call(str, 0, opts.maxStringLength), opts) + trailer;
  }
  // eslint-disable-next-line no-control-regex
  var s = $replace.call($replace.call(str, /(['\\])/g, "\\$1"), /[\x00-\x1f]/g, lowbyte);
  return wrapQuotes(s, "single", opts);
}

function lowbyte(c) {
  var n = c.charCodeAt(0);
  var x = {
    8: "b",
    9: "t",
    10: "n",
    12: "f",
    13: "r",
  }[n];
  if (x) {
    return "\\" + x;
  }
  return "\\x" + (n < 0x10 ? "0" : "") + $toUpperCase.call(n.toString(16));
}

function markBoxed(str) {
  return "Object(" + str + ")";
}

function weakCollectionOf(type) {
  return type + " { ? }";
}

function collectionOf(type, size, entries, indent) {
  var joinedEntries = indent ? indentedJoin(entries, indent) : $join.call(entries, ", ");
  return type + " (" + size + ") {" + joinedEntries + "}";
}

function singleLineValues(xs) {
  for (var i = 0; i < xs.length; i++) {
    if (indexOf(xs[i], "\n") >= 0) {
      return false;
    }
  }
  return true;
}

function getIndent(opts, depth) {
  var baseIndent;
  if (opts.indent === "\t") {
    baseIndent = "\t";
  } else if (typeof opts.indent === "number" && opts.indent > 0) {
    baseIndent = $join.call(Array(opts.indent + 1), " ");
  } else {
    return null;
  }
  return {
    base: baseIndent,
    prev: $join.call(Array(depth + 1), baseIndent),
  };
}

function indentedJoin(xs, indent) {
  if (xs.length === 0) {
    return "";
  }
  var lineJoiner = "\n" + indent.prev + indent.base;
  return lineJoiner + $join.call(xs, "," + lineJoiner) + "\n" + indent.prev;
}

function arrObjKeys(obj, inspect) {
  var isArr = isArray$3(obj);
  var xs = [];
  if (isArr) {
    xs.length = obj.length;
    for (var i = 0; i < obj.length; i++) {
      xs[i] = has$3(obj, i) ? inspect(obj[i], obj) : "";
    }
  }
  var syms = typeof gOPS === "function" ? gOPS(obj) : [];
  var symMap;
  if (hasShammedSymbols) {
    symMap = {};
    for (var k = 0; k < syms.length; k++) {
      symMap["$" + syms[k]] = syms[k];
    }
  }

  for (var key in obj) {
    // eslint-disable-line no-restricted-syntax
    if (!has$3(obj, key)) {
      continue;
    } // eslint-disable-line no-restricted-syntax, no-continue
    if (isArr && String(Number(key)) === key && key < obj.length) {
      continue;
    } // eslint-disable-line no-restricted-syntax, no-continue
    if (hasShammedSymbols && symMap["$" + key] instanceof Symbol) {
      // this is to prevent shammed Symbols, which are stored as strings, from being included in the string key section
      continue; // eslint-disable-line no-restricted-syntax, no-continue
    } else if ($test.call(/[^\w$]/, key)) {
      xs.push(inspect(key, obj) + ": " + inspect(obj[key], obj));
    } else {
      xs.push(key + ": " + inspect(obj[key], obj));
    }
  }
  if (typeof gOPS === "function") {
    for (var j = 0; j < syms.length; j++) {
      if (isEnumerable.call(obj, syms[j])) {
        xs.push("[" + inspect(syms[j]) + "]: " + inspect(obj[syms[j]], obj));
      }
    }
  }
  return xs;
}

var GetIntrinsic = getIntrinsic;
var callBound = callBound$1;
var inspect = objectInspect;

var $TypeError = GetIntrinsic("%TypeError%");
var $WeakMap = GetIntrinsic("%WeakMap%", true);
var $Map = GetIntrinsic("%Map%", true);

var $weakMapGet = callBound("WeakMap.prototype.get", true);
var $weakMapSet = callBound("WeakMap.prototype.set", true);
var $weakMapHas = callBound("WeakMap.prototype.has", true);
var $mapGet = callBound("Map.prototype.get", true);
var $mapSet = callBound("Map.prototype.set", true);
var $mapHas = callBound("Map.prototype.has", true);

/*
 * This function traverses the list returning the node corresponding to the
 * given key.
 *
 * That node is also moved to the head of the list, so that if it's accessed
 * again we don't need to traverse the whole list. By doing so, all the recently
 * used nodes can be accessed relatively quickly.
 */
var listGetNode = function (list, key) {
  // eslint-disable-line consistent-return
  for (var prev = list, curr; (curr = prev.next) !== null; prev = curr) {
    if (curr.key === key) {
      prev.next = curr.next;
      curr.next = list.next;
      list.next = curr; // eslint-disable-line no-param-reassign
      return curr;
    }
  }
};

var listGet = function (objects, key) {
  var node = listGetNode(objects, key);
  return node && node.value;
};
var listSet = function (objects, key, value) {
  var node = listGetNode(objects, key);
  if (node) {
    node.value = value;
  } else {
    // Prepend the new node to the beginning of the list
    objects.next = {
      // eslint-disable-line no-param-reassign
      key: key,
      next: objects.next,
      value: value,
    };
  }
};
var listHas = function (objects, key) {
  return !!listGetNode(objects, key);
};

var sideChannel = function getSideChannel() {
  var $wm;
  var $m;
  var $o;
  var channel = {
    assert: function (key) {
      if (!channel.has(key)) {
        throw new $TypeError("Side channel does not contain " + inspect(key));
      }
    },
    get: function (key) {
      // eslint-disable-line consistent-return
      if ($WeakMap && key && (typeof key === "object" || typeof key === "function")) {
        if ($wm) {
          return $weakMapGet($wm, key);
        }
      } else if ($Map) {
        if ($m) {
          return $mapGet($m, key);
        }
      } else {
        if ($o) {
          // eslint-disable-line no-lonely-if
          return listGet($o, key);
        }
      }
    },
    has: function (key) {
      if ($WeakMap && key && (typeof key === "object" || typeof key === "function")) {
        if ($wm) {
          return $weakMapHas($wm, key);
        }
      } else if ($Map) {
        if ($m) {
          return $mapHas($m, key);
        }
      } else {
        if ($o) {
          // eslint-disable-line no-lonely-if
          return listHas($o, key);
        }
      }
      return false;
    },
    set: function (key, value) {
      if ($WeakMap && key && (typeof key === "object" || typeof key === "function")) {
        if (!$wm) {
          $wm = new $WeakMap();
        }
        $weakMapSet($wm, key, value);
      } else if ($Map) {
        if (!$m) {
          $m = new $Map();
        }
        $mapSet($m, key, value);
      } else {
        if (!$o) {
          /*
           * Initialize the linked list as an empty node, so that we don't have
           * to special-case handling of the first node: we can always refer to
           * it as (previous node).next, instead of something like (list).head
           */
          $o = { key: {}, next: null };
        }
        listSet($o, key, value);
      }
    },
  };
  return channel;
};

var replace = String.prototype.replace;
var percentTwenties = /%20/g;

var Format = {
  RFC1738: "RFC1738",
  RFC3986: "RFC3986",
};

var formats$3 = {
  default: Format.RFC3986,
  formatters: {
    RFC1738: function (value) {
      return replace.call(value, percentTwenties, "+");
    },
    RFC3986: function (value) {
      return String(value);
    },
  },
  RFC1738: Format.RFC1738,
  RFC3986: Format.RFC3986,
};

var formats$2 = formats$3;

var has$2 = Object.prototype.hasOwnProperty;
var isArray$2 = Array.isArray;

var hexTable = (function () {
  var array = [];
  for (var i = 0; i < 256; ++i) {
    array.push("%" + ((i < 16 ? "0" : "") + i.toString(16)).toUpperCase());
  }

  return array;
})();

var compactQueue = function compactQueue(queue) {
  while (queue.length > 1) {
    var item = queue.pop();
    var obj = item.obj[item.prop];

    if (isArray$2(obj)) {
      var compacted = [];

      for (var j = 0; j < obj.length; ++j) {
        if (typeof obj[j] !== "undefined") {
          compacted.push(obj[j]);
        }
      }

      item.obj[item.prop] = compacted;
    }
  }
};

var arrayToObject = function arrayToObject(source, options) {
  var obj = options && options.plainObjects ? Object.create(null) : {};
  for (var i = 0; i < source.length; ++i) {
    if (typeof source[i] !== "undefined") {
      obj[i] = source[i];
    }
  }

  return obj;
};

var merge = function merge(target, source, options) {
  /* eslint no-param-reassign: 0 */
  if (!source) {
    return target;
  }

  if (typeof source !== "object") {
    if (isArray$2(target)) {
      target.push(source);
    } else if (target && typeof target === "object") {
      if ((options && (options.plainObjects || options.allowPrototypes)) || !has$2.call(Object.prototype, source)) {
        target[source] = true;
      }
    } else {
      return [target, source];
    }

    return target;
  }

  if (!target || typeof target !== "object") {
    return [target].concat(source);
  }

  var mergeTarget = target;
  if (isArray$2(target) && !isArray$2(source)) {
    mergeTarget = arrayToObject(target, options);
  }

  if (isArray$2(target) && isArray$2(source)) {
    source.forEach(function (item, i) {
      if (has$2.call(target, i)) {
        var targetItem = target[i];
        if (targetItem && typeof targetItem === "object" && item && typeof item === "object") {
          target[i] = merge(targetItem, item, options);
        } else {
          target.push(item);
        }
      } else {
        target[i] = item;
      }
    });
    return target;
  }

  return Object.keys(source).reduce(function (acc, key) {
    var value = source[key];

    if (has$2.call(acc, key)) {
      acc[key] = merge(acc[key], value, options);
    } else {
      acc[key] = value;
    }
    return acc;
  }, mergeTarget);
};

var assign = function assignSingleSource(target, source) {
  return Object.keys(source).reduce(function (acc, key) {
    acc[key] = source[key];
    return acc;
  }, target);
};

var decode = function (str, decoder, charset) {
  var strWithoutPlus = str.replace(/\+/g, " ");
  if (charset === "iso-8859-1") {
    // unescape never throws, no try...catch needed:
    return strWithoutPlus.replace(/%[0-9a-f]{2}/gi, unescape);
  }
  // utf-8
  try {
    return decodeURIComponent(strWithoutPlus);
  } catch (e) {
    return strWithoutPlus;
  }
};

var encode = function encode(str, defaultEncoder, charset, kind, format) {
  // This code was originally written by Brian White (mscdex) for the io.js core querystring library.
  // It has been adapted here for stricter adherence to RFC 3986
  if (str.length === 0) {
    return str;
  }

  var string = str;
  if (typeof str === "symbol") {
    string = Symbol.prototype.toString.call(str);
  } else if (typeof str !== "string") {
    string = String(str);
  }

  if (charset === "iso-8859-1") {
    return escape(string).replace(/%u[0-9a-f]{4}/gi, function ($0) {
      return "%26%23" + parseInt($0.slice(2), 16) + "%3B";
    });
  }

  var out = "";
  for (var i = 0; i < string.length; ++i) {
    var c = string.charCodeAt(i);

    if (
      c === 0x2d || // -
      c === 0x2e || // .
      c === 0x5f || // _
      c === 0x7e || // ~
      (c >= 0x30 && c <= 0x39) || // 0-9
      (c >= 0x41 && c <= 0x5a) || // a-z
      (c >= 0x61 && c <= 0x7a) || // A-Z
      (format === formats$2.RFC1738 && (c === 0x28 || c === 0x29)) // ( )
    ) {
      out += string.charAt(i);
      continue;
    }

    if (c < 0x80) {
      out = out + hexTable[c];
      continue;
    }

    if (c < 0x800) {
      out = out + (hexTable[0xc0 | (c >> 6)] + hexTable[0x80 | (c & 0x3f)]);
      continue;
    }

    if (c < 0xd800 || c >= 0xe000) {
      out = out + (hexTable[0xe0 | (c >> 12)] + hexTable[0x80 | ((c >> 6) & 0x3f)] + hexTable[0x80 | (c & 0x3f)]);
      continue;
    }

    i += 1;
    c = 0x10000 + (((c & 0x3ff) << 10) | (string.charCodeAt(i) & 0x3ff));
    /* eslint operator-linebreak: [2, "before"] */
    out +=
      hexTable[0xf0 | (c >> 18)] +
      hexTable[0x80 | ((c >> 12) & 0x3f)] +
      hexTable[0x80 | ((c >> 6) & 0x3f)] +
      hexTable[0x80 | (c & 0x3f)];
  }

  return out;
};

var compact = function compact(value) {
  var queue = [{ obj: { o: value }, prop: "o" }];
  var refs = [];

  for (var i = 0; i < queue.length; ++i) {
    var item = queue[i];
    var obj = item.obj[item.prop];

    var keys = Object.keys(obj);
    for (var j = 0; j < keys.length; ++j) {
      var key = keys[j];
      var val = obj[key];
      if (typeof val === "object" && val !== null && refs.indexOf(val) === -1) {
        queue.push({ obj: obj, prop: key });
        refs.push(val);
      }
    }
  }

  compactQueue(queue);

  return value;
};

var isRegExp = function isRegExp(obj) {
  return Object.prototype.toString.call(obj) === "[object RegExp]";
};

var isBuffer = function isBuffer(obj) {
  if (!obj || typeof obj !== "object") {
    return false;
  }

  return !!(obj.constructor && obj.constructor.isBuffer && obj.constructor.isBuffer(obj));
};

var combine = function combine(a, b) {
  return [].concat(a, b);
};

var maybeMap = function maybeMap(val, fn) {
  if (isArray$2(val)) {
    var mapped = [];
    for (var i = 0; i < val.length; i += 1) {
      mapped.push(fn(val[i]));
    }
    return mapped;
  }
  return fn(val);
};

var utils$2 = {
  arrayToObject: arrayToObject,
  assign: assign,
  combine: combine,
  compact: compact,
  decode: decode,
  encode: encode,
  isBuffer: isBuffer,
  isRegExp: isRegExp,
  maybeMap: maybeMap,
  merge: merge,
};

var getSideChannel = sideChannel;
var utils$1 = utils$2;
var formats$1 = formats$3;
var has$1 = Object.prototype.hasOwnProperty;

var arrayPrefixGenerators = {
  brackets: function brackets(prefix) {
    return prefix + "[]";
  },
  comma: "comma",
  indices: function indices(prefix, key) {
    return prefix + "[" + key + "]";
  },
  repeat: function repeat(prefix) {
    return prefix;
  },
};

var isArray$1 = Array.isArray;
var split = String.prototype.split;
var push = Array.prototype.push;
var pushToArray = function (arr, valueOrArray) {
  push.apply(arr, isArray$1(valueOrArray) ? valueOrArray : [valueOrArray]);
};

var toISO = Date.prototype.toISOString;

var defaultFormat = formats$1["default"];
var defaults$1 = {
  addQueryPrefix: false,
  allowDots: false,
  charset: "utf-8",
  charsetSentinel: false,
  delimiter: "&",
  encode: true,
  encoder: utils$1.encode,
  encodeValuesOnly: false,
  format: defaultFormat,
  formatter: formats$1.formatters[defaultFormat],
  // deprecated
  indices: false,
  serializeDate: function serializeDate(date) {
    return toISO.call(date);
  },
  skipNulls: false,
  strictNullHandling: false,
};

var isNonNullishPrimitive = function isNonNullishPrimitive(v) {
  return (
    typeof v === "string" ||
    typeof v === "number" ||
    typeof v === "boolean" ||
    typeof v === "symbol" ||
    typeof v === "bigint"
  );
};

var sentinel = {};

var stringify$1 = function stringify(
  object,
  prefix,
  generateArrayPrefix,
  commaRoundTrip,
  strictNullHandling,
  skipNulls,
  encoder,
  filter,
  sort,
  allowDots,
  serializeDate,
  format,
  formatter,
  encodeValuesOnly,
  charset,
  sideChannel
) {
  var obj = object;

  var tmpSc = sideChannel;
  var step = 0;
  var findFlag = false;
  while ((tmpSc = tmpSc.get(sentinel)) !== void undefined && !findFlag) {
    // Where object last appeared in the ref tree
    var pos = tmpSc.get(object);
    step += 1;
    if (typeof pos !== "undefined") {
      if (pos === step) {
        throw new RangeError("Cyclic object value");
      } else {
        findFlag = true; // Break while
      }
    }
    if (typeof tmpSc.get(sentinel) === "undefined") {
      step = 0;
    }
  }

  if (typeof filter === "function") {
    obj = filter(prefix, obj);
  } else if (obj instanceof Date) {
    obj = serializeDate(obj);
  } else if (generateArrayPrefix === "comma" && isArray$1(obj)) {
    obj = utils$1.maybeMap(obj, function (value) {
      if (value instanceof Date) {
        return serializeDate(value);
      }
      return value;
    });
  }

  if (obj === null) {
    if (strictNullHandling) {
      return encoder && !encodeValuesOnly ? encoder(prefix, defaults$1.encoder, charset, "key", format) : prefix;
    }

    obj = "";
  }

  if (isNonNullishPrimitive(obj) || utils$1.isBuffer(obj)) {
    if (encoder) {
      var keyValue = encodeValuesOnly ? prefix : encoder(prefix, defaults$1.encoder, charset, "key", format);
      if (generateArrayPrefix === "comma" && encodeValuesOnly) {
        var valuesArray = split.call(String(obj), ",");
        var valuesJoined = "";
        for (var i = 0; i < valuesArray.length; ++i) {
          valuesJoined +=
            (i === 0 ? "" : ",") + formatter(encoder(valuesArray[i], defaults$1.encoder, charset, "value", format));
        }
        return [
          formatter(keyValue) +
            (commaRoundTrip && isArray$1(obj) && valuesArray.length === 1 ? "[]" : "") +
            "=" +
            valuesJoined,
        ];
      }
      return [formatter(keyValue) + "=" + formatter(encoder(obj, defaults$1.encoder, charset, "value", format))];
    }
    return [formatter(prefix) + "=" + formatter(String(obj))];
  }

  var values = [];

  if (typeof obj === "undefined") {
    return values;
  }

  var objKeys;
  if (generateArrayPrefix === "comma" && isArray$1(obj)) {
    // we need to join elements in
    objKeys = [{ value: obj.length > 0 ? obj.join(",") || null : void undefined }];
  } else if (isArray$1(filter)) {
    objKeys = filter;
  } else {
    var keys = Object.keys(obj);
    objKeys = sort ? keys.sort(sort) : keys;
  }

  var adjustedPrefix = commaRoundTrip && isArray$1(obj) && obj.length === 1 ? prefix + "[]" : prefix;

  for (var j = 0; j < objKeys.length; ++j) {
    var key = objKeys[j];
    var value = typeof key === "object" && typeof key.value !== "undefined" ? key.value : obj[key];

    if (skipNulls && value === null) {
      continue;
    }

    var keyPrefix = isArray$1(obj)
      ? typeof generateArrayPrefix === "function"
        ? generateArrayPrefix(adjustedPrefix, key)
        : adjustedPrefix
      : adjustedPrefix + (allowDots ? "." + key : "[" + key + "]");

    sideChannel.set(object, step);
    var valueSideChannel = getSideChannel();
    valueSideChannel.set(sentinel, sideChannel);
    pushToArray(
      values,
      stringify(
        value,
        keyPrefix,
        generateArrayPrefix,
        commaRoundTrip,
        strictNullHandling,
        skipNulls,
        encoder,
        filter,
        sort,
        allowDots,
        serializeDate,
        format,
        formatter,
        encodeValuesOnly,
        charset,
        valueSideChannel
      )
    );
  }

  return values;
};

var normalizeStringifyOptions = function normalizeStringifyOptions(opts) {
  if (!opts) {
    return defaults$1;
  }

  if (opts.encoder !== null && typeof opts.encoder !== "undefined" && typeof opts.encoder !== "function") {
    throw new TypeError("Encoder has to be a function.");
  }

  var charset = opts.charset || defaults$1.charset;
  if (typeof opts.charset !== "undefined" && opts.charset !== "utf-8" && opts.charset !== "iso-8859-1") {
    throw new TypeError("The charset option must be either utf-8, iso-8859-1, or undefined");
  }

  var format = formats$1["default"];
  if (typeof opts.format !== "undefined") {
    if (!has$1.call(formats$1.formatters, opts.format)) {
      throw new TypeError("Unknown format option provided.");
    }
    format = opts.format;
  }
  var formatter = formats$1.formatters[format];

  var filter = defaults$1.filter;
  if (typeof opts.filter === "function" || isArray$1(opts.filter)) {
    filter = opts.filter;
  }

  return {
    addQueryPrefix: typeof opts.addQueryPrefix === "boolean" ? opts.addQueryPrefix : defaults$1.addQueryPrefix,
    allowDots: typeof opts.allowDots === "undefined" ? defaults$1.allowDots : !!opts.allowDots,
    charset: charset,
    charsetSentinel: typeof opts.charsetSentinel === "boolean" ? opts.charsetSentinel : defaults$1.charsetSentinel,
    delimiter: typeof opts.delimiter === "undefined" ? defaults$1.delimiter : opts.delimiter,
    encode: typeof opts.encode === "boolean" ? opts.encode : defaults$1.encode,
    encoder: typeof opts.encoder === "function" ? opts.encoder : defaults$1.encoder,
    encodeValuesOnly: typeof opts.encodeValuesOnly === "boolean" ? opts.encodeValuesOnly : defaults$1.encodeValuesOnly,
    filter: filter,
    format: format,
    formatter: formatter,
    serializeDate: typeof opts.serializeDate === "function" ? opts.serializeDate : defaults$1.serializeDate,
    skipNulls: typeof opts.skipNulls === "boolean" ? opts.skipNulls : defaults$1.skipNulls,
    sort: typeof opts.sort === "function" ? opts.sort : null,
    strictNullHandling:
      typeof opts.strictNullHandling === "boolean" ? opts.strictNullHandling : defaults$1.strictNullHandling,
  };
};

var stringify_1 = function (object, opts) {
  var obj = object;
  var options = normalizeStringifyOptions(opts);

  var objKeys;
  var filter;

  if (typeof options.filter === "function") {
    filter = options.filter;
    obj = filter("", obj);
  } else if (isArray$1(options.filter)) {
    filter = options.filter;
    objKeys = filter;
  }

  var keys = [];

  if (typeof obj !== "object" || obj === null) {
    return "";
  }

  var arrayFormat;
  if (opts && opts.arrayFormat in arrayPrefixGenerators) {
    arrayFormat = opts.arrayFormat;
  } else if (opts && "indices" in opts) {
    arrayFormat = opts.indices ? "indices" : "repeat";
  } else {
    arrayFormat = "indices";
  }

  var generateArrayPrefix = arrayPrefixGenerators[arrayFormat];
  if (opts && "commaRoundTrip" in opts && typeof opts.commaRoundTrip !== "boolean") {
    throw new TypeError("`commaRoundTrip` must be a boolean, or absent");
  }
  var commaRoundTrip = generateArrayPrefix === "comma" && opts && opts.commaRoundTrip;

  if (!objKeys) {
    objKeys = Object.keys(obj);
  }

  if (options.sort) {
    objKeys.sort(options.sort);
  }

  var sideChannel = getSideChannel();
  for (var i = 0; i < objKeys.length; ++i) {
    var key = objKeys[i];

    if (options.skipNulls && obj[key] === null) {
      continue;
    }
    pushToArray(
      keys,
      stringify$1(
        obj[key],
        key,
        generateArrayPrefix,
        commaRoundTrip,
        options.strictNullHandling,
        options.skipNulls,
        options.encode ? options.encoder : null,
        options.filter,
        options.sort,
        options.allowDots,
        options.serializeDate,
        options.format,
        options.formatter,
        options.encodeValuesOnly,
        options.charset,
        sideChannel
      )
    );
  }

  var joined = keys.join(options.delimiter);
  var prefix = options.addQueryPrefix === true ? "?" : "";

  if (options.charsetSentinel) {
    if (options.charset === "iso-8859-1") {
      // encodeURIComponent('&#10003;'), the "numeric entity" representation of a checkmark
      prefix += "utf8=%26%2310003%3B&";
    } else {
      // encodeURIComponent('✓')
      prefix += "utf8=%E2%9C%93&";
    }
  }

  return joined.length > 0 ? prefix + joined : "";
};

var utils = utils$2;

var has = Object.prototype.hasOwnProperty;
var isArray = Array.isArray;

var defaults = {
  allowDots: false,
  allowPrototypes: false,
  allowSparse: false,
  arrayLimit: 20,
  charset: "utf-8",
  charsetSentinel: false,
  comma: false,
  decoder: utils.decode,
  delimiter: "&",
  depth: 5,
  ignoreQueryPrefix: false,
  interpretNumericEntities: false,
  parameterLimit: 1000,
  parseArrays: true,
  plainObjects: false,
  strictNullHandling: false,
};

var interpretNumericEntities = function (str) {
  return str.replace(/&#(\d+);/g, function ($0, numberStr) {
    return String.fromCharCode(parseInt(numberStr, 10));
  });
};

var parseArrayValue = function (val, options) {
  if (val && typeof val === "string" && options.comma && val.indexOf(",") > -1) {
    return val.split(",");
  }

  return val;
};

// This is what browsers will submit when the ✓ character occurs in an
// application/x-www-form-urlencoded body and the encoding of the page containing
// the form is iso-8859-1, or when the submitted form has an accept-charset
// attribute of iso-8859-1. Presumably also with other charsets that do not contain
// the ✓ character, such as us-ascii.
var isoSentinel = "utf8=%26%2310003%3B"; // encodeURIComponent('&#10003;')

// These are the percent-encoded utf-8 octets representing a checkmark, indicating that the request actually is utf-8 encoded.
var charsetSentinel = "utf8=%E2%9C%93"; // encodeURIComponent('✓')

var parseValues = function parseQueryStringValues(str, options) {
  var obj = {};
  var cleanStr = options.ignoreQueryPrefix ? str.replace(/^\?/, "") : str;
  var limit = options.parameterLimit === Infinity ? undefined : options.parameterLimit;
  var parts = cleanStr.split(options.delimiter, limit);
  var skipIndex = -1; // Keep track of where the utf8 sentinel was found
  var i;

  var charset = options.charset;
  if (options.charsetSentinel) {
    for (i = 0; i < parts.length; ++i) {
      if (parts[i].indexOf("utf8=") === 0) {
        if (parts[i] === charsetSentinel) {
          charset = "utf-8";
        } else if (parts[i] === isoSentinel) {
          charset = "iso-8859-1";
        }
        skipIndex = i;
        i = parts.length; // The eslint settings do not allow break;
      }
    }
  }

  for (i = 0; i < parts.length; ++i) {
    if (i === skipIndex) {
      continue;
    }
    var part = parts[i];

    var bracketEqualsPos = part.indexOf("]=");
    var pos = bracketEqualsPos === -1 ? part.indexOf("=") : bracketEqualsPos + 1;

    var key, val;
    if (pos === -1) {
      key = options.decoder(part, defaults.decoder, charset, "key");
      val = options.strictNullHandling ? null : "";
    } else {
      key = options.decoder(part.slice(0, pos), defaults.decoder, charset, "key");
      val = utils.maybeMap(parseArrayValue(part.slice(pos + 1), options), function (encodedVal) {
        return options.decoder(encodedVal, defaults.decoder, charset, "value");
      });
    }

    if (val && options.interpretNumericEntities && charset === "iso-8859-1") {
      val = interpretNumericEntities(val);
    }

    if (part.indexOf("[]=") > -1) {
      val = isArray(val) ? [val] : val;
    }

    if (has.call(obj, key)) {
      obj[key] = utils.combine(obj[key], val);
    } else {
      obj[key] = val;
    }
  }

  return obj;
};

var parseObject = function (chain, val, options, valuesParsed) {
  var leaf = valuesParsed ? val : parseArrayValue(val, options);

  for (var i = chain.length - 1; i >= 0; --i) {
    var obj;
    var root = chain[i];

    if (root === "[]" && options.parseArrays) {
      obj = [].concat(leaf);
    } else {
      obj = options.plainObjects ? Object.create(null) : {};
      var cleanRoot = root.charAt(0) === "[" && root.charAt(root.length - 1) === "]" ? root.slice(1, -1) : root;
      var index = parseInt(cleanRoot, 10);
      if (!options.parseArrays && cleanRoot === "") {
        obj = { 0: leaf };
      } else if (
        !isNaN(index) &&
        root !== cleanRoot &&
        String(index) === cleanRoot &&
        index >= 0 &&
        options.parseArrays &&
        index <= options.arrayLimit
      ) {
        obj = [];
        obj[index] = leaf;
      } else if (cleanRoot !== "__proto__") {
        obj[cleanRoot] = leaf;
      }
    }

    leaf = obj;
  }

  return leaf;
};

var parseKeys = function parseQueryStringKeys(givenKey, val, options, valuesParsed) {
  if (!givenKey) {
    return;
  }

  // Transform dot notation to bracket notation
  var key = options.allowDots ? givenKey.replace(/\.([^.[]+)/g, "[$1]") : givenKey;

  // The regex chunks

  var brackets = /(\[[^[\]]*])/;
  var child = /(\[[^[\]]*])/g;

  // Get the parent

  var segment = options.depth > 0 && brackets.exec(key);
  var parent = segment ? key.slice(0, segment.index) : key;

  // Stash the parent if it exists

  var keys = [];
  if (parent) {
    // If we aren't using plain objects, optionally prefix keys that would overwrite object prototype properties
    if (!options.plainObjects && has.call(Object.prototype, parent)) {
      if (!options.allowPrototypes) {
        return;
      }
    }

    keys.push(parent);
  }

  // Loop through children appending to the array until we hit depth

  var i = 0;
  while (options.depth > 0 && (segment = child.exec(key)) !== null && i < options.depth) {
    i += 1;
    if (!options.plainObjects && has.call(Object.prototype, segment[1].slice(1, -1))) {
      if (!options.allowPrototypes) {
        return;
      }
    }
    keys.push(segment[1]);
  }

  // If there's a remainder, just add whatever is left

  if (segment) {
    keys.push("[" + key.slice(segment.index) + "]");
  }

  return parseObject(keys, val, options, valuesParsed);
};

var normalizeParseOptions = function normalizeParseOptions(opts) {
  if (!opts) {
    return defaults;
  }

  if (opts.decoder !== null && opts.decoder !== undefined && typeof opts.decoder !== "function") {
    throw new TypeError("Decoder has to be a function.");
  }

  if (typeof opts.charset !== "undefined" && opts.charset !== "utf-8" && opts.charset !== "iso-8859-1") {
    throw new TypeError("The charset option must be either utf-8, iso-8859-1, or undefined");
  }
  var charset = typeof opts.charset === "undefined" ? defaults.charset : opts.charset;

  return {
    allowDots: typeof opts.allowDots === "undefined" ? defaults.allowDots : !!opts.allowDots,
    allowPrototypes: typeof opts.allowPrototypes === "boolean" ? opts.allowPrototypes : defaults.allowPrototypes,
    allowSparse: typeof opts.allowSparse === "boolean" ? opts.allowSparse : defaults.allowSparse,
    arrayLimit: typeof opts.arrayLimit === "number" ? opts.arrayLimit : defaults.arrayLimit,
    charset: charset,
    charsetSentinel: typeof opts.charsetSentinel === "boolean" ? opts.charsetSentinel : defaults.charsetSentinel,
    comma: typeof opts.comma === "boolean" ? opts.comma : defaults.comma,
    decoder: typeof opts.decoder === "function" ? opts.decoder : defaults.decoder,
    delimiter:
      typeof opts.delimiter === "string" || utils.isRegExp(opts.delimiter) ? opts.delimiter : defaults.delimiter,
    // eslint-disable-next-line no-implicit-coercion, no-extra-parens
    depth: typeof opts.depth === "number" || opts.depth === false ? +opts.depth : defaults.depth,
    ignoreQueryPrefix: opts.ignoreQueryPrefix === true,
    interpretNumericEntities:
      typeof opts.interpretNumericEntities === "boolean"
        ? opts.interpretNumericEntities
        : defaults.interpretNumericEntities,
    parameterLimit: typeof opts.parameterLimit === "number" ? opts.parameterLimit : defaults.parameterLimit,
    parseArrays: opts.parseArrays !== false,
    plainObjects: typeof opts.plainObjects === "boolean" ? opts.plainObjects : defaults.plainObjects,
    strictNullHandling:
      typeof opts.strictNullHandling === "boolean" ? opts.strictNullHandling : defaults.strictNullHandling,
  };
};

var parse$1 = function (str, opts) {
  var options = normalizeParseOptions(opts);

  if (str === "" || str === null || typeof str === "undefined") {
    return options.plainObjects ? Object.create(null) : {};
  }

  var tempObj = typeof str === "string" ? parseValues(str, options) : str;
  var obj = options.plainObjects ? Object.create(null) : {};

  // Iterate over the keys and setup the new object

  var keys = Object.keys(tempObj);
  for (var i = 0; i < keys.length; ++i) {
    var key = keys[i];
    var newObj = parseKeys(key, tempObj[key], options, typeof str === "string");
    obj = utils.merge(obj, newObj, options);
  }

  if (options.allowSparse === true) {
    return obj;
  }

  return utils.compact(obj);
};

var stringify = stringify_1;
var parse = parse$1;
var formats = formats$3;

var lib = {
  formats: formats,
  parse: parse,
  stringify: stringify,
};

var bathEs5 = {};

var names$1 = {};

var pathTemplateToParameterNames = {};

Object.defineProperty(pathTemplateToParameterNames, "__esModule", {
  value: true,
});
pathTemplateToParameterNames.pathTempalteToParameterNames = void 0;

const pathTempalteToParameterNames = (template) => {
  const nameMatcher = template.match(/\{[A-Za-z0-9_-]+\}/g);
  return nameMatcher === null ? [] : nameMatcher.map((x) => x.substring(1, x.length - 1));
};

pathTemplateToParameterNames.pathTempalteToParameterNames = pathTempalteToParameterNames;

Object.defineProperty(names$1, "__esModule", {
  value: true,
});
names$1.names = void 0;

var _pathTemplateToParameterNames$2 = pathTemplateToParameterNames;

const names = (template) => {
  const ns = (0, _pathTemplateToParameterNames$2.pathTempalteToParameterNames)(template);
  return ns.filter((i, index, array) => array.indexOf(i) === index);
};

names$1.names = names;

var params$1 = {};

var toParameterPattern$1 = {};

Object.defineProperty(toParameterPattern$1, "__esModule", {
  value: true,
});
toParameterPattern$1.toParameterPattern = void 0;

var _pathTemplateToParameterNames$1 = pathTemplateToParameterNames;

const toParameterPattern = (template, patterns) => {
  const userParameterPatterns =
    typeof patterns === "undefined"
      ? []
      : Object.keys(patterns).map((name) => {
          const patternOrUndefined = patterns[name];
          const pattern = typeof patternOrUndefined === "undefined" ? null : patternOrUndefined;
          return {
            name,
            pattern,
          };
        });
  const parameterNames = (0, _pathTemplateToParameterNames$1.pathTempalteToParameterNames)(template);
  const parameters = parameterNames.map((name) => {
    const userPattern = userParameterPatterns.find(({ name: n }) => n === name);
    const pattern = typeof userPattern === "undefined" ? null : userPattern.pattern;
    return {
      name,
      pattern,
    };
  });
  return parameters;
};

toParameterPattern$1.toParameterPattern = toParameterPattern;

Object.defineProperty(params$1, "__esModule", {
  value: true,
});
params$1.params = void 0;

var _toParameterPattern$1 = toParameterPattern$1;

const params = (template, patterns) => {
  const notFound = null;
  const pathPattern = toPathPattern(template);
  const parameterPattern = (0, _toParameterPattern$1.toParameterPattern)(template, patterns);
  return (pathname) => {
    const vs = matchPathPattern(pathname, pathPattern);
    if (vs === null) return notFound;
    const npvs = matchParameterPattern(vs, parameterPattern);
    if (npvs === null) return notFound;
    return toParameters(npvs);
  };
};

params$1.params = params;

const toParameters = (npvs) => {
  return npvs
    .map(({ name, value }) => ({
      [name]: value,
    }))
    .reduce((a, x) => Object.assign(a, x), {});
};

const matchParameterPattern = (parameterValues, parameterPattern) => {
  const npvs = parameterValues
    .map(({ value }) => decodeURIComponent(value))
    .map((value, i) => {
      const { name, pattern } = parameterPattern[i];
      return {
        name,
        pattern,
        value,
      };
    });
  const hasUnmatchParameter = npvs.some(({ pattern, value }) => {
    return pattern !== null && value.match(pattern) === null;
  });
  if (hasUnmatchParameter) return null;
  const hasInvalidDuplicatedParameter = npvs.some(({ name, value }) => {
    return npvs.some(({ name: n, value: v }) => n === name && v !== value);
  });
  if (hasInvalidDuplicatedParameter) return null;
  return npvs;
};

const matchPathPattern = (pathname, pathPattern) => {
  const m = pathname.match(pathPattern);
  if (m === null) return null;
  const vs = m.slice(1).map((value) => ({
    value,
  }));
  return vs;
};

const toPathPattern = (template) => {
  return new RegExp("^" + template.replace(/\{[A-Za-z0-9_-]+\}/g, "([^\\/]*)") + "$");
};

var path$1 = {};

Object.defineProperty(path$1, "__esModule", {
  value: true,
});
path$1.path = void 0;

var _pathTemplateToParameterNames = pathTemplateToParameterNames;

var _toParameterPattern = toParameterPattern$1;

const path = (template, patterns) => {
  const parameterNames = (0, _pathTemplateToParameterNames.pathTempalteToParameterNames)(template);
  return (params) => {
    if (parameterNames.some((name) => typeof params[name] !== "string")) {
      return null;
    }

    const parameterPattern = (0, _toParameterPattern.toParameterPattern)(template, patterns);

    if (
      parameterPattern.some(({ name, pattern }) => {
        return pattern !== null && params[name].match(pattern) === null;
      })
    ) {
      return null;
    }

    return parameterNames.reduce((a, name) => {
      return a.split("{" + name + "}").join(encodeURIComponent(params[name]));
    }, template);
  };
};

path$1.path = path;

(function (exports) {
  Object.defineProperty(exports, "__esModule", {
    value: true,
  });
  Object.defineProperty(exports, "names", {
    enumerable: true,
    get: function () {
      return _names.names;
    },
  });
  Object.defineProperty(exports, "params", {
    enumerable: true,
    get: function () {
      return _params.params;
    },
  });
  Object.defineProperty(exports, "path", {
    enumerable: true,
    get: function () {
      return _path.path;
    },
  });
  exports.bath = exports.default = void 0;

  var _names = names$1;

  var _params = params$1;

  var _path = path$1;

  const bath = (template, patterns) => {
    const names = (0, _names.names)(template);
    const path = (0, _path.path)(template, patterns);
    const params = (0, _params.params)(template, patterns);
    return {
      names,
      path,
      params,
    };
  };

  exports.bath = bath;
  var _default = bath;
  exports.default = _default;
})(bathEs5);

var bath = /*@__PURE__*/ getDefaultExportFromCjs(bathEs5);

/**
 * OpenAPI allowed HTTP methods
 */
var HttpMethod;
(function (HttpMethod) {
  HttpMethod["Get"] = "get";
  HttpMethod["Put"] = "put";
  HttpMethod["Post"] = "post";
  HttpMethod["Patch"] = "patch";
  HttpMethod["Delete"] = "delete";
  HttpMethod["Options"] = "options";
  HttpMethod["Head"] = "head";
  HttpMethod["Trace"] = "trace";
})(HttpMethod || (HttpMethod = {}));
/**
 * OpenAPI parameters "in"
 */
var ParamType;
(function (ParamType) {
  ParamType["Query"] = "query";
  ParamType["Header"] = "header";
  ParamType["Path"] = "path";
  ParamType["Cookie"] = "cookie";
})(ParamType || (ParamType = {}));
/**
 * 解析一个 openapi 文件到 json 格式
 * @param url {string}
 * @return {Promise<OpenAPIV2.Document>}
 */
async function parseOpenApiSpec(url) {
  const str = await promises.readFile(url, "utf8");
  return JSON.parse(str);
}
/**
 * 同步解析一个 openapi 文件到 json 格式
 * @param {string} url
 * @return {OpenAPIV2.Document}
 */
function parseOpenApiSpecSync(url) {
  const str = fs.readFileSync(url, "utf8");
  return JSON.parse(str);
}
class OpenapiV2Parser {
  openapiDir;
  loading = false;
  documentLists = [];
  constructor(openapiDir) {
    this.openapiDir = openapiDir;
  }
  init(sync) {
    if (sync) {
      this.initSync();
    } else {
      return this.initAsync();
    }
  }
  // 同步加载 openapi 文件
  initSync() {
    const dirname = node_path.resolve(process.cwd(), this.openapiDir);
    if (!checkPathIsExistSync(dirname)) {
      this.loading = false;
      console.warn("openapi 目录不存在，请使用脚本生成！");
      return;
    }
    forEachDirectorySync(dirname, (url) => {
      if (url.endsWith(".swagger.json")) {
        this.documentLists.push({ filePath: url, document: parseOpenApiSpecSync(url) });
      }
    });
    this.loading = true;
  }
  // 异步加载 openapi 文件
  async initAsync() {
    const dirname = node_path.resolve(process.cwd(), this.openapiDir);
    const isExist = await checkPathIsExist(dirname);
    if (!isExist) {
      this.loading = false;
      console.warn("openapi 目录不存在，请使用脚本生成！");
      return;
    }
    await forEachDirectory(dirname, async (url) => {
      if (url.endsWith(".swagger.json")) {
        const json = await parseOpenApiSpec(url);
        this.documentLists.push({ filePath: url, document: json });
      }
    });
    this.loading = true;
  }
  getOperation(requestID) {
    const tag = `${requestID.package}.${requestID.service}`;
    const operationId = `${requestID.service}_${requestID.method}`;
    for (const { filePath, document } of this.documentLists) {
      const { paths, tags } = document;
      if (!tags?.find((val) => val.name === tag)) {
        continue;
      }
      for (const [pathIndex, pathItemObject] of Object.entries(paths)) {
        for (const [method, operationObject] of Object.entries(pathItemObject)) {
          if (operationObject.operationId === operationId) {
            return {
              filePath,
              path: pathIndex,
              operationId: operationId,
              method: method.toLowerCase(),
              parameters: operationObject.parameters,
            };
          }
        }
      }
    }
    return null;
  }
  getRequestConfigForOperation(operation, args) {
    const [paramsArray, payload] = args;
    const pathParams = {};
    const searchParams = new URLSearchParams();
    const query = {};
    const headers = {};
    const cookies = {};
    const parameters = operation.parameters || [];
    const setRequestParam = (name, value, type) => {
      switch (type) {
        case ParamType.Path:
          pathParams[name] = value;
          break;
        case ParamType.Query:
          if (Array.isArray(value)) {
            for (const valueItem of value) {
              searchParams.append(name, valueItem);
            }
          } else {
            searchParams.append(name, value);
          }
          query[name] = value;
          break;
        case ParamType.Header:
          headers[name] = value;
          break;
        case ParamType.Cookie:
          cookies[name] = value;
          break;
      }
    };
    const getParamType = (paramName) => {
      const param = parameters.find(({ name }) => name === paramName);
      if (param) {
        return param.in;
      }
      // default all params to query if operation doesn't specify param
      return ParamType.Query;
    };
    const getFirstOperationParam = () => {
      const firstRequiredParam = parameters.find(({ required }) => required === true);
      if (firstRequiredParam) {
        return firstRequiredParam;
      }
      const firstParam = parameters[0];
      if (firstParam) {
        return firstParam;
      }
    };
    if (Array.isArray(paramsArray)) {
      // ParamsArray
      for (const param of paramsArray) {
        setRequestParam(param.name, param.value, param.in || getParamType(param.name));
      }
    } else if (typeof paramsArray === "object") {
      // ParamsObject
      for (const name in paramsArray) {
        if (paramsArray[name] !== undefined) {
          setRequestParam(name, paramsArray[name], getParamType(name));
        }
      }
    } else if (paramsArray) {
      const firstParam = getFirstOperationParam();
      if (!firstParam) {
        throw new Error(`No parameters found for operation ${operation.operationId}`);
      }
      setRequestParam(firstParam.name, paramsArray, firstParam.in);
    }
    // path parameters
    const pathBuilder = bath(operation.path);
    // make sure all path parameters are set
    for (const name of pathBuilder.names) {
      const value = pathParams[name];
      pathParams[name] = `${value}`;
    }
    const path = pathBuilder.path(pathParams);
    // queryString parameter
    const queryString = searchParams.toString();
    // full url with query string
    const url = `${path}${queryString ? `?${queryString}` : ""}`;
    // construct request config
    return {
      url,
      path,
      query,
      headers,
      cookies,
      payload,
      pathParams,
      queryString,
      method: operation.method,
    };
  }
}

/**
 * 转换成 grpc 的 Metadata 对象
 * @param metadata1 {{[key: string]: string}}
 * @return {Metadata}
 */
function toMetadata(metadata1) {
  const metadata = new grpcJs.Metadata();
  for (const [key, value] of Object.entries(metadata1)) {
    metadata.set(key, value);
  }
  return metadata;
}
// 解析 rpc 的方法调用 path
// 正则：/\/(?<pkg>.+)\.(?<service>.+)(?=\/)\/(?<method>.+)/
// 输入：/example.greeter.v1.services.Greeter/SayHello
// groups = {pkg: 'example.greeter.v1.services', service: 'Greeter', method: 'SayHello'}
// callPath = /<package名>.<service名>/<rpc名>
// 这里注意：像 googleapis 的规范中 package 名是多段的如：google.ads.v11.services
function parseCallPath(callPath) {
  const match = callPath.match(/\/(?<pkg>.+)\.(?<service>.+)(?=\/)\/(?<method>.+)/);
  if (!match?.groups) throw new Error("rpc path parse error!");
  const { pkg, service, method } = match.groups;
  return {
    package: pkg,
    method: method,
    service: service,
  };
}

// Generated file. Do not edit
var StatusCodes;
(function (StatusCodes) {
  /**
   * Official Documentation @ https://tools.ietf.org/html/rfc7231#section-6.3.3
   *
   * The request has been received but not yet acted upon. It is non-committal, meaning that there is no way in HTTP to later send an asynchronous response indicating the outcome of processing the request. It is intended for cases where another process or server handles the request, or for batch processing.
   */
  StatusCodes[(StatusCodes["ACCEPTED"] = 202)] = "ACCEPTED";
  /**
   * Official Documentation @ https://tools.ietf.org/html/rfc7231#section-6.6.3
   *
   * This error response means that the server, while working as a gateway to get a response needed to handle the request, got an invalid response.
   */
  StatusCodes[(StatusCodes["BAD_GATEWAY"] = 502)] = "BAD_GATEWAY";
  /**
   * Official Documentation @ https://tools.ietf.org/html/rfc7231#section-6.5.1
   *
   * This response means that server could not understand the request due to invalid syntax.
   */
  StatusCodes[(StatusCodes["BAD_REQUEST"] = 400)] = "BAD_REQUEST";
  /**
   * Official Documentation @ https://tools.ietf.org/html/rfc7231#section-6.5.8
   *
   * This response is sent when a request conflicts with the current state of the server.
   */
  StatusCodes[(StatusCodes["CONFLICT"] = 409)] = "CONFLICT";
  /**
   * Official Documentation @ https://tools.ietf.org/html/rfc7231#section-6.2.1
   *
   * This interim response indicates that everything so far is OK and that the client should continue with the request or ignore it if it is already finished.
   */
  StatusCodes[(StatusCodes["CONTINUE"] = 100)] = "CONTINUE";
  /**
   * Official Documentation @ https://tools.ietf.org/html/rfc7231#section-6.3.2
   *
   * The request has succeeded and a new resource has been created as a result of it. This is typically the response sent after a PUT request.
   */
  StatusCodes[(StatusCodes["CREATED"] = 201)] = "CREATED";
  /**
   * Official Documentation @ https://tools.ietf.org/html/rfc7231#section-6.5.14
   *
   * This response code means the expectation indicated by the Expect request header field can't be met by the server.
   */
  StatusCodes[(StatusCodes["EXPECTATION_FAILED"] = 417)] = "EXPECTATION_FAILED";
  /**
   * Official Documentation @ https://tools.ietf.org/html/rfc2518#section-10.5
   *
   * The request failed due to failure of a previous request.
   */
  StatusCodes[(StatusCodes["FAILED_DEPENDENCY"] = 424)] = "FAILED_DEPENDENCY";
  /**
   * Official Documentation @ https://tools.ietf.org/html/rfc7231#section-6.5.3
   *
   * The client does not have access rights to the content, i.e. they are unauthorized, so server is rejecting to give proper response. Unlike 401, the client's identity is known to the server.
   */
  StatusCodes[(StatusCodes["FORBIDDEN"] = 403)] = "FORBIDDEN";
  /**
   * Official Documentation @ https://tools.ietf.org/html/rfc7231#section-6.6.5
   *
   * This error response is given when the server is acting as a gateway and cannot get a response in time.
   */
  StatusCodes[(StatusCodes["GATEWAY_TIMEOUT"] = 504)] = "GATEWAY_TIMEOUT";
  /**
   * Official Documentation @ https://tools.ietf.org/html/rfc7231#section-6.5.9
   *
   * This response would be sent when the requested content has been permenantly deleted from server, with no forwarding address. Clients are expected to remove their caches and links to the resource. The HTTP specification intends this status code to be used for "limited-time, promotional services". APIs should not feel compelled to indicate resources that have been deleted with this status code.
   */
  StatusCodes[(StatusCodes["GONE"] = 410)] = "GONE";
  /**
   * Official Documentation @ https://tools.ietf.org/html/rfc7231#section-6.6.6
   *
   * The HTTP version used in the request is not supported by the server.
   */
  StatusCodes[(StatusCodes["HTTP_VERSION_NOT_SUPPORTED"] = 505)] = "HTTP_VERSION_NOT_SUPPORTED";
  /**
   * Official Documentation @ https://tools.ietf.org/html/rfc2324#section-2.3.2
   *
   * Any attempt to brew coffee with a teapot should result in the error code "418 I'm a teapot". The resulting entity body MAY be short and stout.
   */
  StatusCodes[(StatusCodes["IM_A_TEAPOT"] = 418)] = "IM_A_TEAPOT";
  /**
   * Official Documentation @ https://tools.ietf.org/html/rfc2518#section-10.6
   *
   * The 507 (Insufficient Storage) status code means the method could not be performed on the resource because the server is unable to store the representation needed to successfully complete the request. This condition is considered to be temporary. If the request which received this status code was the result of a user action, the request MUST NOT be repeated until it is requested by a separate user action.
   */
  StatusCodes[(StatusCodes["INSUFFICIENT_SPACE_ON_RESOURCE"] = 419)] = "INSUFFICIENT_SPACE_ON_RESOURCE";
  /**
   * Official Documentation @ https://tools.ietf.org/html/rfc2518#section-10.6
   *
   * The server has an internal configuration error: the chosen variant resource is configured to engage in transparent content negotiation itself, and is therefore not a proper end point in the negotiation process.
   */
  StatusCodes[(StatusCodes["INSUFFICIENT_STORAGE"] = 507)] = "INSUFFICIENT_STORAGE";
  /**
   * Official Documentation @ https://tools.ietf.org/html/rfc7231#section-6.6.1
   *
   * The server encountered an unexpected condition that prevented it from fulfilling the request.
   */
  StatusCodes[(StatusCodes["INTERNAL_SERVER_ERROR"] = 500)] = "INTERNAL_SERVER_ERROR";
  /**
   * Official Documentation @ https://tools.ietf.org/html/rfc7231#section-6.5.10
   *
   * The server rejected the request because the Content-Length header field is not defined and the server requires it.
   */
  StatusCodes[(StatusCodes["LENGTH_REQUIRED"] = 411)] = "LENGTH_REQUIRED";
  /**
   * Official Documentation @ https://tools.ietf.org/html/rfc2518#section-10.4
   *
   * The resource that is being accessed is locked.
   */
  StatusCodes[(StatusCodes["LOCKED"] = 423)] = "LOCKED";
  /**
   * @deprecated
   * Official Documentation @ https://tools.ietf.org/rfcdiff?difftype=--hwdiff&url2=draft-ietf-webdav-protocol-06.txt
   *
   * A deprecated response used by the Spring Framework when a method has failed.
   */
  StatusCodes[(StatusCodes["METHOD_FAILURE"] = 420)] = "METHOD_FAILURE";
  /**
   * Official Documentation @ https://tools.ietf.org/html/rfc7231#section-6.5.5
   *
   * The request method is known by the server but has been disabled and cannot be used. For example, an API may forbid DELETE-ing a resource. The two mandatory methods, GET and HEAD, must never be disabled and should not return this error code.
   */
  StatusCodes[(StatusCodes["METHOD_NOT_ALLOWED"] = 405)] = "METHOD_NOT_ALLOWED";
  /**
   * Official Documentation @ https://tools.ietf.org/html/rfc7231#section-6.4.2
   *
   * This response code means that URI of requested resource has been changed. Probably, new URI would be given in the response.
   */
  StatusCodes[(StatusCodes["MOVED_PERMANENTLY"] = 301)] = "MOVED_PERMANENTLY";
  /**
   * Official Documentation @ https://tools.ietf.org/html/rfc7231#section-6.4.3
   *
   * This response code means that URI of requested resource has been changed temporarily. New changes in the URI might be made in the future. Therefore, this same URI should be used by the client in future requests.
   */
  StatusCodes[(StatusCodes["MOVED_TEMPORARILY"] = 302)] = "MOVED_TEMPORARILY";
  /**
   * Official Documentation @ https://tools.ietf.org/html/rfc2518#section-10.2
   *
   * A Multi-Status response conveys information about multiple resources in situations where multiple status codes might be appropriate.
   */
  StatusCodes[(StatusCodes["MULTI_STATUS"] = 207)] = "MULTI_STATUS";
  /**
   * Official Documentation @ https://tools.ietf.org/html/rfc7231#section-6.4.1
   *
   * The request has more than one possible responses. User-agent or user should choose one of them. There is no standardized way to choose one of the responses.
   */
  StatusCodes[(StatusCodes["MULTIPLE_CHOICES"] = 300)] = "MULTIPLE_CHOICES";
  /**
   * Official Documentation @ https://tools.ietf.org/html/rfc6585#section-6
   *
   * The 511 status code indicates that the client needs to authenticate to gain network access.
   */
  StatusCodes[(StatusCodes["NETWORK_AUTHENTICATION_REQUIRED"] = 511)] = "NETWORK_AUTHENTICATION_REQUIRED";
  /**
   * Official Documentation @ https://tools.ietf.org/html/rfc7231#section-6.3.5
   *
   * There is no content to send for this request, but the headers may be useful. The user-agent may update its cached headers for this resource with the new ones.
   */
  StatusCodes[(StatusCodes["NO_CONTENT"] = 204)] = "NO_CONTENT";
  /**
   * Official Documentation @ https://tools.ietf.org/html/rfc7231#section-6.3.4
   *
   * This response code means returned meta-information set is not exact set as available from the origin server, but collected from a local or a third party copy. Except this condition, 200 OK response should be preferred instead of this response.
   */
  StatusCodes[(StatusCodes["NON_AUTHORITATIVE_INFORMATION"] = 203)] = "NON_AUTHORITATIVE_INFORMATION";
  /**
   * Official Documentation @ https://tools.ietf.org/html/rfc7231#section-6.5.6
   *
   * This response is sent when the web server, after performing server-driven content negotiation, doesn't find any content following the criteria given by the user agent.
   */
  StatusCodes[(StatusCodes["NOT_ACCEPTABLE"] = 406)] = "NOT_ACCEPTABLE";
  /**
   * Official Documentation @ https://tools.ietf.org/html/rfc7231#section-6.5.4
   *
   * The server can not find requested resource. In the browser, this means the URL is not recognized. In an API, this can also mean that the endpoint is valid but the resource itself does not exist. Servers may also send this response instead of 403 to hide the existence of a resource from an unauthorized client. This response code is probably the most famous one due to its frequent occurence on the web.
   */
  StatusCodes[(StatusCodes["NOT_FOUND"] = 404)] = "NOT_FOUND";
  /**
   * Official Documentation @ https://tools.ietf.org/html/rfc7231#section-6.6.2
   *
   * The request method is not supported by the server and cannot be handled. The only methods that servers are required to support (and therefore that must not return this code) are GET and HEAD.
   */
  StatusCodes[(StatusCodes["NOT_IMPLEMENTED"] = 501)] = "NOT_IMPLEMENTED";
  /**
   * Official Documentation @ https://tools.ietf.org/html/rfc7232#section-4.1
   *
   * This is used for caching purposes. It is telling to client that response has not been modified. So, client can continue to use same cached version of response.
   */
  StatusCodes[(StatusCodes["NOT_MODIFIED"] = 304)] = "NOT_MODIFIED";
  /**
   * Official Documentation @ https://tools.ietf.org/html/rfc7231#section-6.3.1
   *
   * The request has succeeded. The meaning of a success varies depending on the HTTP method:
   * GET: The resource has been fetched and is transmitted in the message body.
   * HEAD: The entity headers are in the message body.
   * POST: The resource describing the result of the action is transmitted in the message body.
   * TRACE: The message body contains the request message as received by the server
   */
  StatusCodes[(StatusCodes["OK"] = 200)] = "OK";
  /**
   * Official Documentation @ https://tools.ietf.org/html/rfc7233#section-4.1
   *
   * This response code is used because of range header sent by the client to separate download into multiple streams.
   */
  StatusCodes[(StatusCodes["PARTIAL_CONTENT"] = 206)] = "PARTIAL_CONTENT";
  /**
   * Official Documentation @ https://tools.ietf.org/html/rfc7231#section-6.5.2
   *
   * This response code is reserved for future use. Initial aim for creating this code was using it for digital payment systems however this is not used currently.
   */
  StatusCodes[(StatusCodes["PAYMENT_REQUIRED"] = 402)] = "PAYMENT_REQUIRED";
  /**
   * Official Documentation @ https://tools.ietf.org/html/rfc7538#section-3
   *
   * This means that the resource is now permanently located at another URI, specified by the Location: HTTP Response header. This has the same semantics as the 301 Moved Permanently HTTP response code, with the exception that the user agent must not change the HTTP method used: if a POST was used in the first request, a POST must be used in the second request.
   */
  StatusCodes[(StatusCodes["PERMANENT_REDIRECT"] = 308)] = "PERMANENT_REDIRECT";
  /**
   * Official Documentation @ https://tools.ietf.org/html/rfc7232#section-4.2
   *
   * The client has indicated preconditions in its headers which the server does not meet.
   */
  StatusCodes[(StatusCodes["PRECONDITION_FAILED"] = 412)] = "PRECONDITION_FAILED";
  /**
   * Official Documentation @ https://tools.ietf.org/html/rfc6585#section-3
   *
   * The origin server requires the request to be conditional. Intended to prevent the 'lost update' problem, where a client GETs a resource's state, modifies it, and PUTs it back to the server, when meanwhile a third party has modified the state on the server, leading to a conflict.
   */
  StatusCodes[(StatusCodes["PRECONDITION_REQUIRED"] = 428)] = "PRECONDITION_REQUIRED";
  /**
   * Official Documentation @ https://tools.ietf.org/html/rfc2518#section-10.1
   *
   * This code indicates that the server has received and is processing the request, but no response is available yet.
   */
  StatusCodes[(StatusCodes["PROCESSING"] = 102)] = "PROCESSING";
  /**
   * Official Documentation @ https://tools.ietf.org/html/rfc7235#section-3.2
   *
   * This is similar to 401 but authentication is needed to be done by a proxy.
   */
  StatusCodes[(StatusCodes["PROXY_AUTHENTICATION_REQUIRED"] = 407)] = "PROXY_AUTHENTICATION_REQUIRED";
  /**
   * Official Documentation @ https://tools.ietf.org/html/rfc6585#section-5
   *
   * The server is unwilling to process the request because its header fields are too large. The request MAY be resubmitted after reducing the size of the request header fields.
   */
  StatusCodes[(StatusCodes["REQUEST_HEADER_FIELDS_TOO_LARGE"] = 431)] = "REQUEST_HEADER_FIELDS_TOO_LARGE";
  /**
   * Official Documentation @ https://tools.ietf.org/html/rfc7231#section-6.5.7
   *
   * This response is sent on an idle connection by some servers, even without any previous request by the client. It means that the server would like to shut down this unused connection. This response is used much more since some browsers, like Chrome, Firefox 27+, or IE9, use HTTP pre-connection mechanisms to speed up surfing. Also note that some servers merely shut down the connection without sending this message.
   */
  StatusCodes[(StatusCodes["REQUEST_TIMEOUT"] = 408)] = "REQUEST_TIMEOUT";
  /**
   * Official Documentation @ https://tools.ietf.org/html/rfc7231#section-6.5.11
   *
   * Request entity is larger than limits defined by server; the server might close the connection or return an Retry-After header field.
   */
  StatusCodes[(StatusCodes["REQUEST_TOO_LONG"] = 413)] = "REQUEST_TOO_LONG";
  /**
   * Official Documentation @ https://tools.ietf.org/html/rfc7231#section-6.5.12
   *
   * The URI requested by the client is longer than the server is willing to interpret.
   */
  StatusCodes[(StatusCodes["REQUEST_URI_TOO_LONG"] = 414)] = "REQUEST_URI_TOO_LONG";
  /**
   * Official Documentation @ https://tools.ietf.org/html/rfc7233#section-4.4
   *
   * The range specified by the Range header field in the request can't be fulfilled; it's possible that the range is outside the size of the target URI's data.
   */
  StatusCodes[(StatusCodes["REQUESTED_RANGE_NOT_SATISFIABLE"] = 416)] = "REQUESTED_RANGE_NOT_SATISFIABLE";
  /**
   * Official Documentation @ https://tools.ietf.org/html/rfc7231#section-6.3.6
   *
   * This response code is sent after accomplishing request to tell user agent reset document view which sent this request.
   */
  StatusCodes[(StatusCodes["RESET_CONTENT"] = 205)] = "RESET_CONTENT";
  /**
   * Official Documentation @ https://tools.ietf.org/html/rfc7231#section-6.4.4
   *
   * Server sent this response to directing client to get requested resource to another URI with an GET request.
   */
  StatusCodes[(StatusCodes["SEE_OTHER"] = 303)] = "SEE_OTHER";
  /**
   * Official Documentation @ https://tools.ietf.org/html/rfc7231#section-6.6.4
   *
   * The server is not ready to handle the request. Common causes are a server that is down for maintenance or that is overloaded. Note that together with this response, a user-friendly page explaining the problem should be sent. This responses should be used for temporary conditions and the Retry-After: HTTP header should, if possible, contain the estimated time before the recovery of the service. The webmaster must also take care about the caching-related headers that are sent along with this response, as these temporary condition responses should usually not be cached.
   */
  StatusCodes[(StatusCodes["SERVICE_UNAVAILABLE"] = 503)] = "SERVICE_UNAVAILABLE";
  /**
   * Official Documentation @ https://tools.ietf.org/html/rfc7231#section-6.2.2
   *
   * This code is sent in response to an Upgrade request header by the client, and indicates the protocol the server is switching too.
   */
  StatusCodes[(StatusCodes["SWITCHING_PROTOCOLS"] = 101)] = "SWITCHING_PROTOCOLS";
  /**
   * Official Documentation @ https://tools.ietf.org/html/rfc7231#section-6.4.7
   *
   * Server sent this response to directing client to get requested resource to another URI with same method that used prior request. This has the same semantic than the 302 Found HTTP response code, with the exception that the user agent must not change the HTTP method used: if a POST was used in the first request, a POST must be used in the second request.
   */
  StatusCodes[(StatusCodes["TEMPORARY_REDIRECT"] = 307)] = "TEMPORARY_REDIRECT";
  /**
   * Official Documentation @ https://tools.ietf.org/html/rfc6585#section-4
   *
   * The user has sent too many requests in a given amount of time ("rate limiting").
   */
  StatusCodes[(StatusCodes["TOO_MANY_REQUESTS"] = 429)] = "TOO_MANY_REQUESTS";
  /**
   * Official Documentation @ https://tools.ietf.org/html/rfc7235#section-3.1
   *
   * Although the HTTP standard specifies "unauthorized", semantically this response means "unauthenticated". That is, the client must authenticate itself to get the requested response.
   */
  StatusCodes[(StatusCodes["UNAUTHORIZED"] = 401)] = "UNAUTHORIZED";
  /**
   * Official Documentation @ https://tools.ietf.org/html/rfc7725
   *
   * The user-agent requested a resource that cannot legally be provided, such as a web page censored by a government.
   */
  StatusCodes[(StatusCodes["UNAVAILABLE_FOR_LEGAL_REASONS"] = 451)] = "UNAVAILABLE_FOR_LEGAL_REASONS";
  /**
   * Official Documentation @ https://tools.ietf.org/html/rfc2518#section-10.3
   *
   * The request was well-formed but was unable to be followed due to semantic errors.
   */
  StatusCodes[(StatusCodes["UNPROCESSABLE_ENTITY"] = 422)] = "UNPROCESSABLE_ENTITY";
  /**
   * Official Documentation @ https://tools.ietf.org/html/rfc7231#section-6.5.13
   *
   * The media format of the requested data is not supported by the server, so the server is rejecting the request.
   */
  StatusCodes[(StatusCodes["UNSUPPORTED_MEDIA_TYPE"] = 415)] = "UNSUPPORTED_MEDIA_TYPE";
  /**
   * @deprecated
   * Official Documentation @ https://tools.ietf.org/html/rfc7231#section-6.4.6
   *
   * Was defined in a previous version of the HTTP specification to indicate that a requested response must be accessed by a proxy. It has been deprecated due to security concerns regarding in-band configuration of a proxy.
   */
  StatusCodes[(StatusCodes["USE_PROXY"] = 305)] = "USE_PROXY";
  /**
   * Official Documentation @ https://datatracker.ietf.org/doc/html/rfc7540#section-9.1.2
   *
   * Defined in the specification of HTTP/2 to indicate that a server is not able to produce a response for the combination of scheme and authority that are included in the request URI.
   */
  StatusCodes[(StatusCodes["MISDIRECTED_REQUEST"] = 421)] = "MISDIRECTED_REQUEST";
})(StatusCodes || (StatusCodes = {}));

// 该方式是 grpc-getaway 库的转换方式.
// 转换 http 状态码到 gRPC 状态码
// https://github.com/grpc-ecosystem/grpc-gateway/blob/master/runtime/errors.go#L15
// See: https://github.com/googleapis/googleapis/blob/master/google/rpc/code.proto
//
// 下面这三种 code 都会转换成 httpStatus.CONFLICT
// 这里接收到 409 将会只转换为 status.ABORTED（10）
// status.ALREADY_EXISTS
// status.ABORTED
//
// 下面这三种 code 都会转换成 httpStatus.BAD_REQUEST
// 这里接收到 400 将会只转换为 status.INVALID_ARGUMENT（3）
// status.INVALID_ARGUMENT
// status.FAILED_PRECONDITION
// status.OUT_OF_RANGE
//
// 下面这三种 code 都会转换成 httpStatus.INTERNAL_SERVER_ERROR
// 未在上面定义转换的 code 也都会转换为 httpStatus.INTERNAL_SERVER_ERROR
// 这里接收到 500 将会只转换为 status.INTERNAL（13）
// status.INTERNAL
// status.UNKNOWN
// status.DATA_LOSS
function httpStatus2GrpcStatus(code) {
  switch (code) {
    case StatusCodes.OK:
      return grpcJs.status.OK;
    case StatusCodes.REQUEST_TIMEOUT:
      return grpcJs.status.CANCELLED;
    case StatusCodes.INTERNAL_SERVER_ERROR:
      return grpcJs.status.INTERNAL;
    case StatusCodes.GATEWAY_TIMEOUT:
      return grpcJs.status.DEADLINE_EXCEEDED;
    case StatusCodes.NOT_FOUND:
      return grpcJs.status.NOT_FOUND;
    case StatusCodes.FORBIDDEN:
      return grpcJs.status.PERMISSION_DENIED;
    case StatusCodes.UNAUTHORIZED:
      return grpcJs.status.UNAUTHENTICATED;
    case StatusCodes.TOO_MANY_REQUESTS:
      return grpcJs.status.RESOURCE_EXHAUSTED;
    case StatusCodes.BAD_REQUEST:
      return grpcJs.status.INVALID_ARGUMENT;
    case StatusCodes.CONFLICT:
      return grpcJs.status.ABORTED;
    case StatusCodes.NOT_IMPLEMENTED:
      return grpcJs.status.UNIMPLEMENTED;
    case StatusCodes.SERVICE_UNAVAILABLE:
      return grpcJs.status.UNAVAILABLE;
  }
  return grpcJs.status.INTERNAL;
}
/**
 * 转换 Metadata 到 grpc-getaway 库支持的形式
 * ! 注意此处不确定 axios node 端是否支持 Buffer 类型的 value
 * @param metadata {Metadata}
 * @return {{[key: string]: string}}
 */
function toMetadataHeader(metadata) {
  // buffer 的 header axios 不支持吗？
  return Object.entries(metadata.getMap()).reduce(
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
    record[rawHeaders[i]] = rawHeaders[i + 1];
  }
  return toMetadata(
    Object.entries(record).reduce((header, [key, value]) => {
      header[key.replace(/^Grpc-Trailer-/, "")] = value;
      return header;
    }, {})
  );
}

// 根据 callPath 查找 openapi 定义然后使用 http 调用它
class OpenapiV2Proxy {
  dir;
  getaway;
  openapiV2Parser;
  request;
  constructor(dir, getaway) {
    this.dir = dir;
    this.getaway = getaway;
    this.request = axios__default["default"].create();
    this.openapiV2Parser = new OpenapiV2Parser(this.dir);
  }
  getLoadStatus() {
    return this.openapiV2Parser.loading;
  }
  load(sync) {
    return this.openapiV2Parser.init(sync);
  }
  getBaseUrl(callPath, filePath) {
    return typeof this.getaway === "function" ? this.getaway({ callPath, filePath }) : this.getaway;
  }
  async call(callPath, message, metadata) {
    if (!this.openapiV2Parser.loading) throw new Error("openapi 文件未加载完毕！");
    const requestId = parseCallPath(callPath);
    const operation = this.openapiV2Parser.getOperation(requestId);
    if (operation === null) throw new Error("没有找到 openapi 定义！");
    const baseUrl = this.getBaseUrl(callPath, operation.filePath);
    const requestConfig = this.openapiV2Parser.getRequestConfigForOperation(operation, [message, message]);
    const axiosConfig = {
      baseURL: baseUrl,
      url: requestConfig.path,
      data: requestConfig.payload,
      method: requestConfig.method,
      paramsSerializer: (params) => new URLSearchParams(params).toString(),
      headers: Object.assign({}, requestConfig.headers, toMetadataHeader(metadata)),
      params: requestConfig.method === "get" ? lib.stringify(requestConfig.query) : undefined,
    };
    try {
      const result = await this.request.request(axiosConfig);
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
        metadata: new grpcJs.Metadata(),
        status: {
          metadata: new grpcJs.Metadata(),
          details: err.message,
          code: grpcJs.status.UNKNOWN,
        },
      };
    }
  }
}

// 默认配置
const defaultConfiguration = {
  getaway: "",
  openapiDir: "openapi",
};
/**
 * 对拦截器的配置进行校验和设置默认值
 * @param {Options} opts
 * @return {Options}
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
 * 拦截器的内部实现
 * @return {Interceptor}
 * @param apiProxy
 */
function interceptorImpl(apiProxy) {
  return function (options, nextCall) {
    if (!apiProxy || !apiProxy?.getLoadStatus()) {
      return new grpcJs.InterceptingCall(nextCall(options));
    }
    const callPath = options.method_definition.path;
    // grpc-web 是支持 responseStream 的
    if (options.method_definition.requestStream || options.method_definition.responseStream) {
      console.warn(`${callPath}: 不支持流式调用!`);
      return new grpcJs.InterceptingCall(nextCall(options));
    }
    const ref = {
      message: null,
      metadata: new grpcJs.Metadata(),
      listener: {},
    };
    return new grpcJs.InterceptingCall(nextCall(options), {
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
        const result = await apiProxy.call(callPath, message, metadata);
        // 下面方法的顺序是有要求的。
        listener.onReceiveMessage(result.response);
        listener.onReceiveMetadata(result.metadata);
        listener.onReceiveStatus(result.status);
      },
    });
  };
}
/**
 * grpc client interceptor 代理 grpc 请求到 grpc-getaway 的拦截器
 *  1. 使用时确保该拦截器在最后一个（此拦截器不会调用后续的拦截器）
 *  2. 注意调用该拦截器是会异步读取并解析 openapi 文件，期间拦截器将不工作
 * @param [opts] {Options}
 * @return {Promise<Interceptor>}
 */
async function openapiInterceptor(opts) {
  const opt = handleInterceptorOption(opts);
  const apiProxy = new OpenapiV2Proxy(opt.openapiDir, opt.getaway);
  await apiProxy.load(false);
  return interceptorImpl(apiProxy);
}
/**
 * 同步初始化版本, 会有一段短暂的不可用时间。
 * @param {Options} opts
 * @return {Interceptor}
 */
function openapiInterceptorSync(opts) {
  const opt = handleInterceptorOption(opts);
  const apiProxy = new OpenapiV2Proxy(opt.openapiDir, opt.getaway);
  apiProxy.load(true);
  return interceptorImpl(apiProxy);
}

const proxy = axios__default["default"].create();
function getRequestUrl(getaway, callPath) {
  const baseUrl = typeof getaway === "function" ? getaway(callPath) : getaway;
  return baseUrl + callPath;
}
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
      metadata: new grpcJs.Metadata(),
      status: {
        metadata: new grpcJs.Metadata(),
        details: err.message,
        code: grpcJs.status.UNKNOWN,
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
    const callPath = options.method_definition.path;
    const { enable, getaway } = checkInterceptorOption(opt);
    if (!enable) {
      return new grpcJs.InterceptingCall(nextCall(options));
    }
    // grpc-web 是支持 responseStream 的
    if (options.method_definition.requestStream) {
      console.warn(`${callPath}: 不支持流式调用!`);
      return new grpcJs.InterceptingCall(nextCall(options));
    }
    const ref = {
      message: null,
      metadata: new grpcJs.Metadata(),
      listener: {},
    };
    return new grpcJs.InterceptingCall(nextCall(options), {
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
        const result = await proxyTo(getRequestUrl(getaway, callPath), message, metadata);
        // 下面方法的顺序是有要求的。
        listener.onReceiveMessage(result.response);
        listener.onReceiveMetadata(result.metadata);
        listener.onReceiveStatus(result.status);
      },
    });
  };
}

exports.interceptor = interceptor;
exports.openapiInterceptor = openapiInterceptor;
exports.openapiInterceptorSync = openapiInterceptorSync;
