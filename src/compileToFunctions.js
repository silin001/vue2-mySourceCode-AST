import { createCompiler } from "./createCompiler";
// console.log(`%c ${createCompiler}`, style)
console.log('%c createCompiler', css, createCompiler)

const { compileToFunctions } = createCompiler({});
export { compileToFunctions }