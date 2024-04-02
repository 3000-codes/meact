import { isFunction } from '@meact/shared'

enum EffectTag {
  PLACEMENT = 1, // 新增
  UPDATE = 2, // 更新
  DELETION = 3 // 删除
}

/**
 * Represents an interface for a React element.
 */
export interface RElement {
  type: string;
  props: Record<string, any>;
}

/**
 * Represents an interface for a Fiber node.
 */
interface Fiber {
  type: string | Function;
  props: Record<string, any>;
  parent: Fiber | null; // parent node
  child: Fiber | null; // child node
  sibling: Fiber | null;
  dom: HTMLElement | Text | null;
  alternate: Fiber | null; // used to record the previous Fiber node
  effectTag?: EffectTag;
  hooks?: any[];// state hooks
  effectHooks?: EffectHook[]; // effect hooks
}

/**
 * 创建一个React元素。
 * @param type 元素类型。
 * @param props 元素属性。
 * @param children 子元素。
 * @returns 创建的React元素。
 */
export function createElement(
  type: string,
  props: Record<string, any> | null,
  ...children: (RElement | string)[]
): RElement {
  const formatElement = (child: RElement | string) =>
    typeof child === "object" ? child : createTextElement(child);

  return {
    type,
    props: {
      ...props,
      children: children.reduce((acc, child) => {
        if (!child) return acc
        return Array.isArray(child) // 在jsx中使用直接array.map 导致children是二维数组，需要处理
          ? [...acc, ...child.map(formatElement)]
          : [...acc, formatElement(child)]
      }, [] as RElement[])
    },
  };
}

/**
 * 创建一个文本元素。
 * @param text 文本内容。
 * @returns 创建的文本元素。
 */
export function createTextElement(text: string): RElement {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  };
}

export function render(el: RElement, container: HTMLElement) {
  nextWorkOfUnit = {
    dom: container,
    props: {
      children: [el],
    },
  };
  deletions = []
  wipRoot = nextWorkOfUnit;
}

let wipRoot: Partial<Fiber> | null = null; // root node
let nextWorkOfUnit: Partial<Fiber> | null = null; // next task to be executed
let currentRoot: Fiber | null = null; // current root node
let deletions: Fiber[] = []; // nodes to be deleted
let wipFiber: Fiber | null = null; // work in progress fiber

function workLoop(deadline: IdleDeadline) {
  let shouldYield = false;
  while (!shouldYield && nextWorkOfUnit) {
    nextWorkOfUnit = performWorkOfUnit(nextWorkOfUnit as Fiber);
    if (wipRoot?.sibling?.type === nextWorkOfUnit?.type) {
      // why??
      nextWorkOfUnit = null
    }

    shouldYield = deadline.timeRemaining() < 1;
  }

  if (!nextWorkOfUnit && wipRoot) {
    // 如果没有下一个工作单元，但是有根节点,说明已经完成了所有的工作
    commitRoot(); // 提交根节点
  }

  requestIdleCallback(workLoop);
}

requestIdleCallback(workLoop);

function commitRoot() {
  deletions.forEach(commitWork); // 先删除节点
  // if (!wipRoot?.child) return; // NOTED: ???
  commitWork(wipRoot!.child!);
  commitEffectHooks(wipRoot as Fiber);
  currentRoot = wipRoot as Fiber;
  wipRoot = null;
  deletions = []; // 清空deletions
}

function commitDeletion(fiber: Fiber, domParent: HTMLElement | Text) {
  try {
    // 可能是函数组件，没有dom节点，需要向下查找
    if (fiber.dom) {
      domParent.removeChild(fiber.dom);
    } else {
      commitDeletion(fiber.child!, domParent);
    }
  } catch (error) {
    // 为什么加上捕获才会成功？？？
  }

}

function commitWork(fiber: Fiber | null) {
  if (!fiber) return;

  let fiberParent = fiber.parent!
  while (!fiberParent.dom) {
    // 如果父节点没有dom属性，说明父节点是一个函数组件，继续向上查找
    fiberParent = fiberParent.parent!
  }

  if (fiber.dom != null && fiber.effectTag === EffectTag.PLACEMENT) {
    // 如果是新增节点，添加到父节点
    (fiberParent.dom as HTMLElement).append(fiber.dom);
  }
  else if (fiber.dom != null && fiber.effectTag === EffectTag.UPDATE) {
    // 如果是更新节点，更新节点
    updateProps(fiber.dom, fiber.alternate!.props, fiber.props);
  }
  else if (fiber.effectTag === EffectTag.DELETION) {
    // 如果是删除节点，删除节点
    commitDeletion(fiber, fiberParent.dom);
    fiber.effectHooks?.forEach(item => item.cleanup?.())
    fiber.child = null
  }
  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

function commitEffectHooks(fiber: Fiber) {
  if (!fiber) return
  const setCleanup = (hook: EffectHook) => hook.cleanup = hook.cleanup ?? hook.callback() ?? undefined;

  if (!fiber.alternate) {
    // 如果没有上一次的fiber，说明是新增节点
    fiber.effectHooks?.forEach(setCleanup);
  } else {
    // 如果有上一次的fiber，说明是更新节点
    fiber.effectHooks?.forEach((hook: EffectHook, index: number) => {
      const deps = hook.deps;
      const oldDeps = fiber.alternate?.effectHooks?.[index]?.deps;
      const hasChanged = !oldDeps || deps?.some((dep, i) => dep !== oldDeps[i]);
      hasChanged && setCleanup(hook);
    });
  }
  commitEffectHooks(fiber.child!);
  commitEffectHooks(fiber.sibling!);
}

function createDom(fiber: Fiber): HTMLElement | Text {
  const dom = fiber.type === "TEXT_ELEMENT"
    ? document.createTextNode("")
    : document.createElement(fiber.type as string);
  updateProps(dom, {}, fiber.props ?? {}); // 设置属性
  return dom;
}

const isEvent = (key: string) => key.startsWith("on");
const isProperty = (key: string) => key !== "children" && !isEvent(key);
function updateProps(dom: HTMLElement | Text, oldProps: Record<string, any> = {}, newProps: Record<string, any> = {}) {
  Object.keys(oldProps).forEach((key) => {
    // 删除旧属性
    if (isProperty(key)) {
      if (!(key in newProps))
        (dom as any)[key] = "";
    }
    // 删除旧事件
    if (isEvent(key)) {
      const eventType = key.toLowerCase().substring(2);
      dom.removeEventListener(eventType, oldProps[key]);
    }
  });
  Object.keys(newProps).forEach((name) => {
    if (isProperty(name)) {
      (dom as any)[name] = newProps[name];
    }
    if (isEvent(name)) {
      const eventType = name.toLowerCase().substring(2);
      dom.addEventListener(eventType, newProps[name]);
    }
  });
}

function reconcileChildren(fiber: Fiber, elements: RElement[]) {
  let prevSibling: Fiber | null = null;
  let oldFiber = fiber.alternate?.child;

  // 1. 创建子节点
  let index = 0;
  while (index < elements.length || oldFiber) {
    const element = elements[index];
    let newFiber: Fiber | null = null;
    const sameType = oldFiber && element && element.type === oldFiber.type;  // 判断是否是同一个节点

    if (sameType) {
      // 如果是同一个节点，复用节点
      newFiber = {
        type: oldFiber!.type,
        props: element.props,
        parent: fiber,
        dom: oldFiber!.dom,
        child: null,
        sibling: null,
        alternate: oldFiber!,
        effectTag: EffectTag.UPDATE,
        hooks: fiber?.hooks,
      };
    }

    if (element && !sameType) {
      // 如果不是同一个节点，创建新节点
      newFiber = {
        type: element.type,
        props: element.props,
        parent: fiber,
        dom: null,
        child: null,
        sibling: null,
        alternate: null,
        effectTag: EffectTag.PLACEMENT,
        hooks: fiber?.hooks,
      };
    }

    if (oldFiber && !sameType) {
      // 如果不是同一个节点，删除节点
      oldFiber.effectTag = EffectTag.DELETION;
      // oldFiber.dom?.remove();
      deletions.push(oldFiber);
    }
    if (oldFiber) {
      oldFiber = oldFiber.sibling; // 更新oldFiber
    }

    if (index === 0) {
      // 如果是第一个子节点，设置为child
      fiber.child = newFiber;
    } else {
      // 如果不是第一个子节点，设置为sibling
      prevSibling!.sibling = newFiber;
    }
    if (newFiber) {
      prevSibling = newFiber; // 更新prevSibling
    }
    index++;
  }

  while (oldFiber as Fiber) {
    // 如果oldFiber还有子节点，删除节点
    oldFiber!.effectTag = EffectTag.DELETION;
    deletions.push(oldFiber!);
    oldFiber = oldFiber!.sibling;
  }
}


let hookIndex: null | number = null; // hook index

function updateFunctionComponent(fiber: Fiber) {
  wipFiber = fiber;
  hookIndex = 0;
  wipFiber.hooks = [];
  wipFiber.effectHooks = [];
  // 函数组件没有自己的dom节点，所以不需要创建dom节点
  const children = [(fiber.type as Function)(fiber.props)];
  reconcileChildren(fiber, children);
}

function updateHostComponent(fiber: Fiber) {
  fiber.dom ??= createDom((fiber))
  const children = fiber.props?.children ?? [];
  reconcileChildren(fiber, children);
}

type StateAction<T> = T | ((state: T) => T);
type StateHook<T> = {
  state: T;
  queue: (StateAction<T>)[];
}

export function useState<T>(initial: T): [T, (newState: T) => void] {
  const oldHook = wipFiber?.alternate?.hooks?.[hookIndex as number]; // 获取上一次的hook
  const hook: StateHook<T> = {
    state: oldHook ? oldHook.state : initial, // 如果有上一次的hook，使用上一次的state，否则使用initial
    queue: [], // 保存更新的state
  }
  const actions = oldHook ? oldHook.queue : [];
  actions.forEach((action: StateAction<T>) => {
    hook.state = action instanceof Function ? action(hook.state) : action; // 更新state
  });

  const setState = (action: StateAction<T>) => {
    hook.queue.push(action); // 将更新的state保存到queue中
    wipRoot = {
      dom: currentRoot?.dom,
      props: currentRoot?.props,
      alternate: currentRoot,
    };
    nextWorkOfUnit = wipRoot; // 重新执行任务
    deletions = []; // 状态更新后，需要清空deletions
  };
  wipFiber?.hooks?.push(hook);
  hookIndex!++;

  return [hook.state, setState];

}

function performWorkOfUnit(fiber: Fiber): Fiber | null {

  if (isFunction(fiber.type)) {
    updateFunctionComponent(fiber);
  } else {
    updateHostComponent(fiber);
  }
  // 4. Return the next task to be executed
  if (fiber.child) {
    return fiber.child; // 如果有子节点，返回子节点
  }

  let nextFiber: Fiber | null = fiber; // linkNode point to the parent node
  while (nextFiber) {
    if (nextFiber.sibling) return nextFiber.sibling;  // 如果没有子节点，返回兄弟节点
    nextFiber = nextFiber.parent;
  }
  /**
   * 1. 如果有子节点，返回子节点
   * 2. 如果没有子节点，返回兄弟节点
   * 3. 如果没有兄弟节点，返回父节点的兄弟节点
   */
  return null;
}

type EffectHook = {
  callback: () => (() => void) | void;
  deps?: any[];
  cleanup?: () => void;
}

export function useEffect(callback: EffectHook['callback'], deps?: any[]) {
  const effectHook: EffectHook = {
    callback,
    deps,
  }
  wipFiber?.effectHooks?.push(effectHook)
}
