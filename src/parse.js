/*
ast解析

我们知道HTML模板是有标签、文本、注释组成的，这里不考虑注释，而标签又分为单元素标签（如：img，br 等）和普通标签（如： div， table 等）。文本又分为带有绑定的文本（含有{{}} 双大括号）和普通文本（不含有{{}} 双大括号）。
所以解析HTML最少要分两个方法，一个处理标签，一个处理文本，但是无论单元素还是普通标签都有开始和闭合，只是形式不一样罢了。所以把解析HTML 可以分成start（处理开始标签）、end（处理结束标签）、char（处理文本）：
*/

// 
// parseHTML: 用正则匹配的方式，逐一循环HTML字符串，分类不同匹配项，保存最基本的tagName（标签名），attrs（属性），此时属性并没有区分是内置属性还是普通属性，只是简单的分隔了属性名和属性值。从函数名中可以看到加了HTML
import { parseHTML } from "./html-parser";
import { parseText } from "./parse-text";
// 处理指令
import {
  processFor,
  processIf,
  processElement,
  processOnce,
  processIfConditions,
  addIfCondition
} from './processes';

// ⭐ parse： 从parseHTML解析的基本属性数组中重新解析，区分不同属性做不同处理，普通属性与内置属性处理方式是不一样的。并且判断该元素是在哪个位置，也就是确定该元素的父节点、兄弟节点、子节点，最终形成ast。
// 实现原理： 指针思想+栈
export function parse (template, options) {
  // 暂存没有闭合的标签元素基本信息， 当找到闭合标签后清除存在于stack里面的元素
  // stack  栈算法实现
  const stack = [];
  // 这里就是解析后的最终数据，这里主要应用了引用类型的特性，最终使root滚雪球一样，保存标签的所有信息
  let root;
  // 当前需要处理的元素父级元素
  let currentParent;
  parseHTML(template, {
    /**
     * 这个和end相对应，主要处理开始标签和标签的属性（内置和普通属性），
     * @param tag 标签名
     * @param attrs 元素属性
     * @param unary 该元素是否单元素， 如img
     */
    start (tag, attrs, unary) {
      // 创建ast容器
      let element = createASTElement(tag, attrs, currentParent);

      // 下面是加工、处理各种Vue支持的内置属性和普通属性
      processFor(element);
      processIf(element);
      processOnce(element);
      processElement(element);
      if (!root) {
        root = element;
      } else if (!stack.length && root.if && (element.elseif || element.else)) {
        // 在element的ifConditions属性中加入condition
        addIfCondition(root, {
          exp: element.elseif,
          block: element
        })
      }
      if (currentParent) {
        if (element.elseif || element.else) {
          processIfConditions(element, currentParent);
        } else if (element.slotScope) {
          // 父级元素是普通元素
          currentParent.plain = false;
          const name = element.slotTarget || '"default"';
          (currentParent.scopedSlots || (currentParent.scopedSlots = {}))[name] = element;
        } else {
          // 把当前元素添加到父元素的children数组中
          currentParent.children.push(element);
          // 设置当前元素的父元素
          element.parent = currentParent;
        }
      }
      // 非单元素，更新父级和保存该元素
      if (!unary) {
        currentParent = element;
        stack.push(element);
      }
    },
    /**
     * 闭合元素，更新stack和currentParent
     */
    end () {
      // 取出stack中最后一个元素，其实这也是需要闭合元素的开始标签，如</div> 的开始标签就是<div>
      // 此时取出的element包含该元素的所有信息，包括他的子元素信息
      const element = stack[stack.length - 1];
      // 取出当前元素的最后一个子节点
      const lastNode = element.children[element.children.length - 1];
      // 如果最后一个子节点是空文本节点，清除当前子节点, 为什么这么做呢？
      // 因为我们在写HTML时，标签之间都有间距，有时候就需要这个间距才能达到我们想要的效果，
      // 比如：<div> <span>111</span> <span>222</span> </div>
      // 此时111与222之间就有一格的间距，在ast模板解析时，这个不能忽略，
      // 此时的div的子节点会解析成三个数组， 中间的就是一个文本，只是这个文本是个空格，
      // 而222的span标签后面的空格我们是不需要的，因为如果我们写了，div的兄弟节点之间会有一个空格的。
      // 所以我们需要清除children数组中没有用的项
      if (lastNode && lastNode.type === 3 && lastNode.text === ' ') {
        element.children.pop();
      }
      // 下面才是最重要的，也是end方法真正要做的，
      // 就是找到了闭合标签，就把保存的开始标签的信息清除，并更新currentParent
      stack.length -= 1;
      currentParent = stack[stack.length - 1];
    },
    /**
     * 处理文本和{{}}
     * @param text 文本内容
     */
    chars (text) {
      // 如果是文本，没有父节点，直接返回
      if (!currentParent) {
        return;
      }
      const children = currentParent.children;
      // 判断与处理text, 如果children有值，text为空，那么text = ' '; 原因在end中
      text = text.trim()
        ? text
        : children.length ? ' ' : '';
      if (text) {
        // 解析文本，处理{{}} 这种形式的文本
        const expression = parseText(text);
        if (text !== ' ' && expression) {
          children.push({
            type: 2,
            expression,
            text,
          });
        } else if (text !== ' ' || !children.length || children[children.length - 1].text !== ' ') {
          children.push({
            type: 3,
            text,
          })
        }
      }
    },
  });
  // 把解析后返回出去，这个就是ast(抽象语法树)
  console.log(root)
  return root;
}

/**
 * ast 的容器
 * @param tag
 * @param attrs
 * @param parent
 * @returns {{type: number, tag: *, attrsList: *, attrsMap, parent: *, children: Array}}
 */
function createASTElement (tag, attrs, parent) {
  return {
    type: 1,
    tag,
    attrsList: attrs, // 暂存的属性数组，这里面是通过match和循环组装的一个{name, value}的数组，这里面包含vue内置的指令和用户自定义的属性，然后通过process等一系列方法，处理这里面的属性，并逐一删除
    attrsMap: makeAttrsMap(attrs),
    parent,
    children: []
  }
}

function makeAttrsMap (attrs) {
  const map = {};
  for (let i = 0, l = attrs.length; i < l; i++) {
    map[attrs[i].name] = attrs[i].value;
  }
  return map;
}
