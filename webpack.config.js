// 载入node 专门操作路径的模块 path
const path = require('path')
module.exports = {
  mode: 'development',  // production
  entry: './src/test.js',
  // entry: path.resolve(__dirname, './test.js'),
  output: { // 出口
    // filename: "bundle.js", // 默认  main.js
    // 指定输出文件所在的目录，path必须要是绝对路径， __dirname nodejs的变量，代表当前文件的目录绝对路径
    // path: path.resolve(__dirname, 'dist'),  // 发布生产环境时配置
    publicPath: "xuni", // 虚拟路径,用于本地实时调试，不会被物理生成。
  },
  module: {
    rules: [
      {
        test: path.join(__dirname, 'js'),
        use: ["babel-loader"]
      },
    ],
  },
  devServer: {
    port: 8080,
    // open: true,
  }
}