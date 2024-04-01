
class EffectTag {
  static PLACEMENT = 'PLACEMENT';
  static DELETION = 'DELETION';
  static UPDATE = 'UPDATE';
}

export function createElement(
  type,
  props,
  ...children
) {
  const formatElement = (child) =>
    typeof child === "object" ? child : createTextElement(child);

  return {
    type,
    props: {
      ...props,
      children: children.reduce((acc, child) => {
        console.log(child);
        if (!child) return acc
        return Array.isArray(child) // 在jsx中使用直接array.map 导致children是二维数组，需要处理
          ? [...acc, ...child.map(formatElement)]
          : [...acc, formatElement(child)]
      }, [])
    },
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
  updateProps(dom, {}, fiber.props ?? {}); // 设置属性
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
  commitEffectHooks(wipRoot.child); // 提交effectHooks
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
    fiber.effectHooks?.forEach(item => item.cleanup?.()) // 执行cleanup
    fiber.child = null
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


function commitEffectHooks(fiber) {
  if (!fiber) return
  const setCleanup = (hook) => hook.cleanup = hook.cleanup ?? hook.callback() ?? undefined;

  if (!fiber.alternate) {
    // 如果没有上一次的fiber，说明是新增节点
    fiber.effectHooks?.forEach(setCleanup);
  } else {
    // 如果有上一次的fiber，说明是更新节点
    fiber.effectHooks?.forEach((hook, index) => {
      const deps = hook.deps;
      const oldDeps = fiber.alternate?.effectHooks?.[index]?.deps;
      const hasChanged = !oldDeps || deps?.some((dep, i) => dep !== oldDeps[i]);
      hasChanged && setCleanup(hook);
    });
  }
  commitEffectHooks(fiber.child); // 递归子节点
  commitEffectHooks(fiber.sibling); // 递归兄弟节点
}

function updateFunctionComponent(fiber) {
  wipFiber = fiber; // 获取当前fiber
  stateIndex = 0 // 初始化状态索引
  wipFiber.hooks = []; // 初始化hooks
  wipFiber.effectHooks = []; // 初始化effectHooks
  const children = [fiber.type(fiber.props)];
  reconcileChildren(fiber, children);
}

function updateHostComponent(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDOM(fiber);
  }
  reconcileChildren(fiber, fiber.props?.children || []);
}


function performUnitOfWork(fiber) {
  if (fiber.type instanceof Function) {
    updateFunctionComponent(fiber);
  } else {
    updateHostComponent(fiber);
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
let stateIndex; // 状态索引(每个组件都可能有多个状态)

function useState(initial) {
  const oldHook = wipFiber?.alternate?.hooks?.[stateIndex]; // 获取上一次的hook
  const hook = {
    state: oldHook ? oldHook.state : initial, // 如果有上一次的hook，使用上一次的state，否则使用initial
    queue: [], // 可能执行多次setState，所以使用队列
  }

  const actions = oldHook ? oldHook.queue : [];
  actions.forEach(action => {
    // 获取执行后的state
    hook.state = action instanceof Function ? action(hook.state) : action;
  });

  wipFiber?.hooks?.push(hook); // 将hook添加到hooks中
  stateIndex++; // 更新状态索引
  const setState = (action) => {
    hook.queue.push(action); // 将action添加到队列中
    wipRoot = {
      dom: currentRoot.dom,
      props: currentRoot.props,
      alternate: currentRoot,
    };
    nextWorkOfUnit = wipRoot;
    deletions.length = 0;
  };
  return [hook.state, setState];

}

function useEffect(callback, deps) {
  wipFiber?.effectHooks?.push({
    callback,
    deps,
  })
}



/**@jsx createElement */

const Interval = ({ children }) => {
  console.log('interval', children);
  useEffect(() => {
    const id = setInterval(() => {
      console.log('interval');
    }, 1000);
    return () => clearInterval(id);
  }, []);
  return children;
}

const List = () => {
  const [title, setTitle] = useState('hello world');
  const [show, setShow] = useState(true);
  return (
    <div>
      <h1>{title}</h1>
      <h2 onClick={
        () => {
          setTitle('hello React');
        }}>
        set a new title
      </h2>
      <button onClick={() => setShow(!show)}>toggle</button>
      {show ? (
        <Interval>
        </Interval>
      ) : null}
    </div>
  );
}


render(<List />, document.getElementById('root'));