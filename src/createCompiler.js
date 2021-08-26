import { parse } from "./parse";

function createCompileToFunctionFn (compile) {
  // console.log('%c createCompileToFunctionFn-参数', css, compile)
  // 返回函数compileToFunctions
  return function compileToFunctions (template, options) {
    // 执行接收到的参数compile函数， 此时这里拿到了用户传入的template\options
    const compiled = compile(template, options)
  }
}

function createCompilerCreator (baseCompile) {
  // console.log('%c basecreateCompilerCreator参数', css, baseCompile)
  // 1. 返回函数 createCompiler
  return function createCompiler () {
    // 1.1创建compile函数并且执行传进来的baseCompile函数
    function compile (template, options) {
      const compiled = baseCompile(template, options)
    }
    // 1.2 返回两个函数，compileToFunctions且调用 createCompileToFunctionFn且传入compile
    return {
      compile,
      compileToFunctions: createCompileToFunctionFn(compile)
    }
  }
}
// ⭐ js柯里化是逐步传参，逐步缩小函数的适用范围，逐步求解的过程。
export const createCompiler = createCompilerCreator(function (template, options) {
  console.log('这是要处理的template字符串 -->', template, options)
  // 生成 ast语法树
  const ast = parse(template.trim(), options);
  console.log('这是处理后的ast(抽象语法树)对象 -->', ast);
  // 打印字符串
  // console.log('这是处理后的ast(抽象语法树)字符串 -->', jsonify(ast));
});
// json格式化
function jsonify (obj) {
  let cache = [];
  const json = JSON.stringify(obj, function (key, value) {
    if (typeof value === 'object' && value !== null) {
      if (cache.indexOf(value) !== -1) {
        return;
      }
      cache.push(value);
    }
    return value;
  });
  cache = null;
  return json;
}