
class EffectTag {
  static PLACEMENT = 'PLACEMENT';
  static DELETION = 'DELETION';
  static UPDATE = 'UPDATE';
}

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
  wipRoot = {
    dom: container,
    props: {
      children: [element]
    }
  };
  deletions.length = 0; // 初始化deletions
  nextWorkOfUnit = wipRoot;
}

let nextWorkOfUnit = null;
let wipRoot = null; // work in progress root
let deletions = []; // 需要删除的节点
let currentRoot = null;
function workLoop(deadline) {

  let shouldYield = false;
  while (nextWorkOfUnit && !shouldYield) {
    nextWorkOfUnit = performUnitOfWork(nextWorkOfUnit);
    shouldYield = deadline.timeRemaining() < 1;
  }
  if (!nextWorkOfUnit && wipRoot) {
    commitRoot(); // 统一提交
  }
  requestIdleCallback(workLoop);

}

requestIdleCallback(workLoop);


function commitRoot() {
  deletions.forEach(commitWork); // 删除节点
  commitWork(wipRoot.child); // 从长子开始提交
  currentRoot = wipRoot; // 更新currentRoot
  wipRoot = null;
}

function commitWork(fiber) {
  if (!fiber) {
    return;
  }
  let domParentFiber = fiber.parent;
  while (!domParentFiber.dom) {
    domParentFiber = domParentFiber.parent;
  }
  const domParent = domParentFiber.dom; // 父节点的dom节点

  if (fiber.effectTag === EffectTag.PLACEMENT && fiber.dom) {
    // 将子节点添加到父节点(真实dom)中
    domParent.appendChild(fiber.dom);
  } else if (fiber.effectTag === EffectTag.UPDATE && fiber.dom) {
    // 更新节点
    updateProps(fiber.dom, fiber.alternate?.props || {}, fiber.props);
  } else if (fiber.effectTag === EffectTag.DELETION) {
    //  删除节点
    commitDeletion(fiber, domParent);
  }
  commitWork(fiber.child); // 递归子节点
  commitWork(fiber.sibling); // 递归兄弟节点
}

function updateProps(dom, oldProps = {}, newProps = {}) {
  const isEvent = key => key.startsWith('on'); // 约定以on开头的属性为事件
  const isProperty = key => key !== 'children' && !isEvent(key);
  Object.keys(oldProps).forEach((key) => {
    // 删除旧属性
    if (isProperty(key)) {
      if (!(key in newProps))
        (dom)[key] = "";
    }
    // 删除旧事件
    if (isEvent(key)) {
      const eventType = key.toLowerCase().substring(2);
      dom.removeEventListener(eventType, oldProps[key]);
    }
  });
  Object.keys(newProps).forEach((name) => {
    if (isProperty(name)) {
      // 设置属性
      (dom)[name] = newProps[name];
    }
    if (isEvent(name)) {
      // 设置事件
      const eventType = name.toLowerCase().substring(2);
      dom.addEventListener(eventType, newProps[name]);
    }
  });
}

function commitDeletion(fiber, domParent) {
  // 如果没有dom节点，递归删除子节点
  if (fiber.dom) { domParent.removeChild(fiber.dom); }
  else {
    commitDeletion(fiber.child, domParent);
  }
}

function performUnitOfWork(fiber) {
  // 执行fiber的三个任务
  wipFiber = fiber;
  // 任务1：将元素添加到dom节点
  if (!fiber.dom) {
    fiber.dom = createDOM(fiber);
  }
  if (fiber.parent) {
    // NOTE：此时已经从vnode开始与真实dom挂钩了
    fiber.parent.dom.appendChild(fiber.dom);
  }

  // 任务2：为子元素创建fiber
  reconcileChildren(fiber, fiber.props.children);

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


function reconcileChildren(fiber, elements) {
  let prevSibling = null;
  let oldFiber = fiber.alternate?.child;
  let index = 0

  while (index < elements.length || oldFiber) {
    // index < elements.length => 新增节点
    // oldFiber => 修改或者删除节点

    const element = elements[index];
    let newFiber = null;
    const sameType = oldFiber && element && element.type === oldFiber.type; // 判断是否是同一个节点

    if (sameType) {
      // 如果是同一个节点，复用节点
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        parent: fiber,
        dom: oldFiber.dom,
        alternate: oldFiber,
        effectTag: EffectTag.UPDATE,
      };
    } else {
      if (element) {
        // 新增节点
        newFiber = {
          type: element.type,
          props: element.props,
          parent: fiber,
          dom: null,
          alternate: null, // 新增节点没有旧节点
          effectTag: EffectTag.PLACEMENT,
        };
      }
      if (oldFiber) {
        // 删除节点
        oldFiber.effectTag = EffectTag.DELETION;
        // oldFiber.dom?.remove();
        deletions.push(oldFiber);
      }
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling; // 更新oldFiber
    }
    if (index === 0) {
      // 如果是第一个子节点，设置为child
      fiber.child = newFiber;
    } else {
      // 如果不是第一个子节点，设置为sibling
      prevSibling.sibling = newFiber;
    }
    prevSibling = newFiber; // 更新prevSibling
    index++;
  }
}

let wipFiber = null;
function update() {
  let currentFiber = wipFiber;

  return () => {
    wipRoot = {
      ...currentFiber,
      alternate: currentFiber,
    };
    nextWorkOfUnit = wipRoot;
  };
}

/**@jsx createElement */
const element = () => (
  <div>
    <h1>hello world</h1>
    <h2>It is a test</h2>
    <ul>
      <li>item 1</li>
      <li>item 2</li>
      <li>item 3</li>
    </ul>
  </div>
);


render(<element />, document.getElementById('root'));