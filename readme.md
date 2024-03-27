# React的简单实现

## 1. DOM的转化

### 1.1 DOM到Virtual DOM

假设有如下的DOM结构：

```html
<div id="root">
    <p>hello, world</p>
</div>
```

我们可以将其转化为如下的Virtual DOM：

```javascript
{
    type: 'div',
    props: {
        id: 'root',
        children: [{
            type: 'p',
            props: {
                children: ['hello, world']
            }
        }]
    }
}
```

其中， `type` 表示节点的类型， `props` 表示节点的属性， `children` 表示节点的子节点。

为了统一处理，我们将所有的文本节点都转化为 `type` 为 `TEXT_ELEMENT` 的节点：

```javascript
{
    type: 'TEXT_ELEMENT',
    props: {
        nodeValue: 'hello, world'
    }
}
```

#### 1.1.1 从DOM到Virtual DOM

我们可以通过递归的方式将DOM转化为Virtual DOM：

```javascript
function domToVdom(node) {
    if (node.nodeType === Node.TEXT_NODE) {
        return {
            type: 'TEXT_ELEMENT',
            props: {
                nodeValue: node.nodeValue
            }
        };
    }
    return {
        type: node.tagName.toLowerCase(),
        props: {
            children: Array.from(node.childNodes).map(domToVdom)
        }
    };
}
```

### 1.2 Virtual DOM到DOM

我们可以渲染Virtual DOM到真实的DOM：

```javascript
// 命令式的创建DOM（1.1节中的HTML）
const root = document.createElement('div');
root.id = 'root';
const p = document.createElement('p');
p.appendChild(document.createTextNode('hello, world'));
root.appendChild(p);
document.body.appendChild(root);
```

将操作封装为函数：

```javascript
function render(element) {
    const dom = element.type === 'TEXT_ELEMENT' ? document.createTextNode('') : document.createElement(element.type);
    const isTextElement = element.type === 'TEXT_ELEMENT';
    const children = element.props.children || [];
    children.forEach(child => render(child, dom));
    Object.keys(element.props).filter(key => key !== 'children').forEach(name => {
        dom[name] = element.props[name];
    });
    return dom;
}
document.body.appendChild(render(vdom)); // 此处的vdom为1.1节中的Virtual DOM
```

### 1.3 JSX到Virtual DOM

```jsx
const vdom = ( <div id = "root" > <p> hello, world </p> </div > );

/**
 * 与1.1节中的domToVdom函数类似
 * 我们设计两个工具函数createElement和createTextElement
 */

function createElement(type, props, ...children) {
    return {
        type,
        props: {
            ...props,
            children: children.map(child => typeof child === 'object' ? child : createTextElement(child))
        }
    };
}

function createTextElement(text) {
    return {
        type: 'TEXT_ELEMENT',
        props: {
            nodeValue: text，
            children: []
        }
    };
}
```

当我们使用JSX时，我们可以通过[Babel](https://babeljs.io/docs/babel-plugin-transform-react-jsx)将JSX转化为createElement函数的调用：

```jsx
/** @jsx XXX.BBB */

// 我们的jsx，通过@jsx注释告诉babel使用XXX.BBB函数
const input = (
    <div id = "root" >
        <p> hello, world </p>
    </div>
);

// babel转化后的代码
const outpu = XXX.BBB(
    'div',
    { id: 'root' },
    XXX.BBB('p', null, 'hello, world')
);
```

### 1.4 DOM的渲染

从jsx到真实dom的过程
* jsx -> createElement -> vdom -> render -> dom

```jsx
/** @jsx createElement */
const App = (
    <div id = "root" >
        <p> hello, world </p>
    </div>
);

function createElement(type, props, ...children) {
    return {
        type,
        props: {
            ...props,
            children: children.map(child => typeof child === 'object' ? child : createTextElement(child))
        }
    };
}

function createTextElement(text) {
    return {
        type: 'TEXT_ELEMENT',
        props: {
            nodeValue: text，
            children: []
        }
    };
}

function render(element, container) {
    const dom = element.type === 'TEXT_ELEMENT' ? document.createTextNode('') : document.createElement(element.type);
    const isTextElement = element.type === 'TEXT_ELEMENT';
    const children = element.props.children || [];
    children.forEach(child => render(child, dom));
    Object.keys(element.props).filter(key => key !== 'children').forEach(name => {
        dom[name] = element.props[name];
    });
    container.appendChild(dom);
}

render(App, document.body);
```

### 1.4.1 渲染优化

当dom节点过于庞大时，我们的运算量会很大，可以观察到明显的白屏时间。我们可以通过 `requestIdleCallback` 来进行渲染优化：

```javascript
let nextUnitOfWork = null; // 下一个工作单元

function workLoop(deadline) {
    // 该函数会在浏览器空闲时执行
    let shouldYield = false;
    while (nextUnitOfWork && !shouldYield) {
        nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
        shouldYield = deadline.timeRemaining() < 1;
    }
    requestIdleCallback(workLoop);
}
requestIdleCallback(workLoop);

function performUnitOfWork(nextUnitOfWork) {
    // TODO 在下一节将vnode升级为fiber后实现
}
```

## 2. Fiber

### 2.1 Fiber的结构

```jsx
const example= (
<div>
    <h1>
      <p />
      <a />
    </h1>
    <h2 />
  </div>
  )
  // 在(1. DOM的转化)我们将其转化为如下的Virtual DOM：
 const output {
    type: 'div',
    props: {
        children: [
            {
                type: 'h1',
                props: {
                    children: [
                        { type: 'p', props: {} },
                        { type: 'a', props: {} }
                    ]
                }
            },
            { type: 'h2', props: {} }
        ]
    }
 }
```

我们观察任意两个相邻结点之间的关系，可以发现如下的关系：
* 父子关系
* 兄弟关系

通过这两种关系，我们可以将Virtual DOM转化为Fiber：

```javascript
{
    type: 'div',
    parent: null,
    sibling: null,
    children: [
        //...
    ],
    child: 'h1', // 长子
    dom: null // 该fiber的宿主dom节点
}
```

我们为什么要使用Fiber呢？

  因为我们需要将渲染任务分解为多个小任务，这样我们可以在浏览器空闲时执行这些小任务，从而提高渲染性能。

那么fiber的任务有哪些呢？
  
    - 将元素添加到dom节点
    - 为子元素创建fiber
    - 执行下一个fiber任务

### 2.2 Fiber的构建

将1.4.1 节中的 `render` 函数修改为：

```javascript
function createDOM(fiber) {
    const dom = fiber.type === 'TEXT_ELEMENT' ? document.createTextNode('') : document.createElement(fiber.type);
    Object.keys(fiber.props).filter(key => key !== 'children').forEach(name => {
        dom[name] = fiber.props[name];
    });
    return dom;

}

function render(element, container) {

    // 我们何时开始渲染呢？
    // workLoop函数中的nextUnitOfWork不为null时，我们开始渲染任务，所以我们需要给nextUnitOfWork赋值
    nextUnitOfWork = {
        dom: container,
        props: {
            children: [element]
        }
    };
}

let nextUnitOfWork = null;

function workLoop(deadline) {

    let shouldYield = false;
    while (nextUnitOfWork && !shouldYield) {
        nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
        shouldYield = deadline.timeRemaining() < 1;
    }
    requestIdleCallback(workLoop);

}

requestIdleCallback(workLoop);

function performUnitOfWork(fiber) {
    // 执行fiber的三个任务

    // 任务1：将元素添加到dom节点
    if (!fiber.dom) {
        fiber.dom = createDOM(fiber);
    }
    if (fiber.parent) {
        // NOTE：此时已经从vnode开始与真实dom挂钩了
        fiber.parent.dom.appendChild(fiber.dom);
    }

    // 任务2：为子元素创建fiber
    const elements = fiber.props.children;
    let index = 0;
    let prevSibling = null; // 上一个兄弟节点（用于兄弟关系）
    while (index < elements.length) {
        const element = elements[index];
        const newFiber = {
            type: element.type,
            props: element.props,
            parent: fiber,
            dom: null
        };
        if (index === 0) {
            fiber.child = newFiber; // 长子
        } else {
            prevSibling.sibling = newFiber; // 与上一个兄弟节点建立关系
        }
        prevSibling = newFiber; // 更新上一个兄弟节点
        index++;
    }

    // 任务3：执行下一个fiber任务（dfs）
    /**
     * 1. 如果有子节点，返回子节点
     * 2. 如果没有子节点，返回兄弟节点
     * 3. 如果没有兄弟节点，返回父节点的兄弟节点
     */
    if (fiber.child) {
        return fiber.child;
    }
    let nextFiber = fiber;
    while (nextFiber) {
        if (nextFiber.sibling) {
            return nextFiber.sibling;
        }
        nextFiber = nextFiber.parent;
    }
    return null;
}
```

运行 `src/drafts/第一章.jsx` 与 `src/drafts/第二章.jsx` ，中100万个节点的渲染时间对比，可以发现Fiber的渲染时间明显小于Virtual DOM的渲染时间。

## 3. 统一提交

在2.2节中的 `performUnitOfWork` 函数中，我们将渲染任务分解为多个小任务，但是我们并没有统一提交这些小任务，而每次提交都会触发一次浏览器的重绘，这样会导致性能的浪费。

```javascript
function performUnitOfWork(fiber) {

    // ...codes
    if (fiber.parent) {
        // NOTE：此时已经从vnode开始与真实dom挂钩了
        fiber.parent.dom.appendChild(fiber.dom);
    }
    // ...codes

}
```

我们可以将渲染任务统一提交：
  + 什么时候提交呢？
    - 当所有的任务都执行完毕时，我们统一提交
  + 在哪里提交呢？
    - 在 `workLoop` 函数中提交
  + 如何提交呢？
    - 我们可以将所有的任务放入一个数组中，然后遍历数组，将所有的任务提交

```javascript
let nextUnitOfWork = null;
let wipRoot = null; // work in progress root

function render(element, container) {
    wipRoot = {
        dom: container,
        props: {
            children: [element]
        }
    };
    nextUnitOfWork = wipRoot;
}

function workLoop(deadline) {

    let shouldYield = false;
    while (nextUnitOfWork && !shouldYield) {
        nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
        shouldYield = deadline.timeRemaining() < 1;
    }
    if (!nextUnitOfWork && wipRoot) {
        commitRoot(); // 统一提交
    }
    requestIdleCallback(workLoop);

}

function commitRoot() {
    commitWork(wipRoot.child); // 从长子开始提交
    wipRoot = null;

}

function commitWork(fiber) {

    if (!fiber) {
        return;
    }
    const domParent = fiber.parent.dom; // 父节点的dom节点
    domParent.appendChild(fiber.dom); // 将子节点添加到父节点(真实dom)中
    commitWork(fiber.child); // 递归子节点
    commitWork(fiber.sibling); // 递归兄弟节点

}
```

## 4. 更新与删除fiber

在3节中，我们只实现了渲染，但是我们并没有实现更新与删除。其本质就是将fiber的children与siblings进行更新与删除。

### 4.1 更新

我们可以通过比较新旧节点的type与props来判断是否需要更新：

```javascript
```
