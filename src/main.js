import { compileToFunctions } from './compileToFunctions';

// Vue 对象
function Vue (options) {
  // 获取模板
  const selected = document.querySelector(options.el);
  this.$mount(selected);
}

//VUE原型添加$mount方法 处理模板
Vue.prototype.$mount = function (el) {
  const html = el.outerHTML;
  compileToFunctions(html, { a: 123 })
}



export default Vue;