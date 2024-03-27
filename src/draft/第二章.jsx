
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
      nodeValue: text,
      children: []
    }
  };
}

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

// 测试 3 个元素
const list = {
  type: 'ul',
  props: {
    children: [{
      type: 'li',
      props: {
        children: [{
          type: 'TEXT_ELEMENT',
          props: {
            nodeValue: 'Item 1',
            children: []
          }
        }]
      }
    }, {
      type: 'li',
      props: {
        children: [{
          type: 'TEXT_ELEMENT',
          props: {
            nodeValue: 'Item 2',
            children: []
          }
        }]
      }
    }, {
      type: 'li',
      props: {
        children: [{
          type: 'TEXT_ELEMENT',
          props: {
            nodeValue: 'Item 3',
            children: []
          }
        }]
      }
    }]
  }
};

// 测试 1e6 个元素
const list2 = {
  type: 'ul',
  props: {
    children: Array.from({ length: 1e6 }, (_, i) => ({
      type: 'li',
      props: {
        children: [{
          type: 'TEXT_ELEMENT',
          props: {
            nodeValue: `Item ${i}`,
            children: []
          }
        }]
      }
    }))
  }
};

render(list, document.getElementById('root'));