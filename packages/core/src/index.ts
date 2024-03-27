import { isFunction } from '@meact/shared'

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
}

const isEvent = (key: string) => key.startsWith("on");
const isProperty = (key: string) => key !== "children" && !isEvent(key);

/**
 * 创建一个React元素。
 * @param type 元素类型。
 * @param props 元素属性。
 * @param children 子元素。
 * @returns 创建的React元素。
 */
export function createElement(
  type: string,
  props?: Record<string, any> | null,
  ...children: (RElement | string)[]
): RElement {
  return {
    type,
    props: {
      ...props,
      children: children.map((child) =>
        typeof child === "object" ? child : createTextElement(child)
      ),
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

  wipRoot = nextWorkOfUnit;

}

let wipRoot: Partial<Fiber> | null = null; // root node
let nextWorkOfUnit: Partial<Fiber> | null = null; // next task to be executed

function workLoop(deadline: IdleDeadline) {
  let shouldYield = false;
  while (!shouldYield && nextWorkOfUnit) {
    nextWorkOfUnit = performWorkOfUnit(nextWorkOfUnit as Fiber);
    shouldYield = deadline.timeRemaining() < 1;
  }

  if (!nextWorkOfUnit && wipRoot) {
    // 如果没有下一个工作单元，但是有根节点,说明已经完成了所有的工作
    // debugger
    commitRoot(); // 提交根节点
  }

  requestIdleCallback(workLoop);
}

requestIdleCallback(workLoop);

function commitRoot() {
  if (!wipRoot?.child) return;
  commitWork(wipRoot.child);
  wipRoot = null;
}

function commitWork(fiber: Fiber | null) {
  if (!fiber) return;

  let fiberParent = fiber.parent!
  while (!fiberParent.dom) {
    // 如果父节点没有dom属性，说明父节点是一个函数组件，继续向上查找
    fiberParent = fiberParent.parent!
  }

  if (fiber.dom) {
    (fiberParent.dom as HTMLElement).append(fiber.dom);
  }
  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

function createDom(type: string): HTMLElement | Text {
  return type === "TEXT_ELEMENT"
    ? document.createTextNode("")
    : document.createElement(type);
}

function updateProps(dom: HTMLElement | Text, newProps: Record<string, any>) {
  for (let key in newProps) {
    if (key !== "children") {
      if (isEvent(key)) {
        const eventType = key.toLowerCase().substring(2);
        const handler = newProps[key] as EventListener;
        dom.removeEventListener(eventType, handler); // 先移除之前的事件,防止重复绑定
        dom.addEventListener(eventType, handler);
      }
      else {
        (dom as any)[key] = newProps[key];
      }

    }

  }
}

function initChildren(fiber: Fiber, elements: RElement[]) {
  let index = 0;
  let prevSibling: Fiber | null = null;

  // 1. 创建子节点
  while (index < elements.length) {
    const element = elements[index];
    const newFiber: Fiber = {
      type: element.type,
      props: element.props,
      parent: fiber,
      dom: null,
      child: null,
      sibling: null,
      alternate: null,
    };
    if (index === 0) {
      // 如果是第一个子节点，设置为child
      fiber.child = newFiber;
    } else {
      // 如果不是第一个子节点，设置为sibling
      prevSibling!.sibling = newFiber;
    }
    prevSibling = newFiber; // 更新prevSibling
    index++;
  }
}

function updateFunctionComponent(fiber: Fiber) {
  const children = [(fiber.type as Function)(fiber.props)];

  initChildren(fiber, children);
}

function updateHostComponent(fiber: Fiber) {
  if (!fiber.dom) {
    const dom = (fiber.dom = createDom((fiber.type as string)));
    updateProps(dom, fiber.props);
  }

  const children = fiber.props.children;
  initChildren(fiber, children);
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