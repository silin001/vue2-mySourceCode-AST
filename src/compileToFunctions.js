import { createCompiler } from "./createCompiler";
// console.log(`%c ${createCompiler}`, style)
// console.log('%c createCompiler', css, createCompiler())

//解构赋值拿到 compileToFunctions 
const { compileToFunctions } = createCompiler({});
export { compileToFunctions }