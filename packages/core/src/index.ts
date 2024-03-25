/**
 * 表示一个React元素的接口。
 */
interface RElement {
  type: string;
  props: Record<string, any>;
}

/**
 * 表示一个Fiber节点的接口。
 */
interface Fiber {
  type: string; // fiber type
  props: Record<string, any>;
  parent: Fiber | null; // parent node
  child: Fiber | null; // child node
  sibling: Fiber | null;
  dom: HTMLElement | Text | null;
  alternate: Fiber | null; // 用于记录上一次的Fiber节点
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

/**
 * @deprecated
 * 渲染React元素到指定的容器。
 * @param el 要渲染的React元素。
 * @param container 容器元素。
 */
export function _render(el: RElement, container: HTMLElement): void {
  let tag: HTMLElement | Text | null = null;
  const props = el.props;

  /**
   * 渲染文本节点。
   * @param tag 目标节点。
   * @param text 文本内容。
   * @returns 渲染后的节点。
   */
  const renderText = (tag: HTMLElement, text: string): HTMLElement => {
    const textNode = document.createTextNode("");
    textNode.nodeValue = text;
    tag.appendChild(textNode);
    return tag;
  };

  if (el.type === "TEXT_ELEMENT") {
    tag = document.createTextNode("");
    tag.nodeValue = el.props.nodeValue;
  } else {
    tag = document.createElement(el.type);

    for (const key in props) {
      if (key === "children") {
        if (typeof props[key] === "string") {
          renderText(tag, props[key]);
        } else if (Array.isArray(props[key])) {
          props[key].forEach((child: RElement | string) => {
            if (typeof child === "string") {
              renderText(tag as HTMLElement, child);
            } else {
              render(child, tag as HTMLElement);
            }
          });
        }
      } else {
        tag.setAttribute(key, props[key]);
      }
    }
  }

  container.appendChild(tag);
}

/**
 * 创建DOM节点。
 * @param fiber Fiber节点。
 * @returns 创建的DOM节点。
 */
function createDom(fiber: Fiber): HTMLElement | Text {
  let tag: HTMLElement | Text | null = null;
  const props = fiber.props;

  /**
   * 渲染文本节点。
   * @param tag 目标节点。
   * @param text 文本内容。
   * @returns 渲染后的节点。
   */
  const renderText = (tag: HTMLElement, text: string): HTMLElement => {
    const textNode = document.createTextNode("");
    textNode.nodeValue = text;
    tag.appendChild(textNode);
    return tag;
  };

  if (fiber.type === "TEXT_ELEMENT") {
    tag = document.createTextNode("");
    tag.nodeValue = fiber.props.nodeValue;
  } else {
    tag = document.createElement(fiber.type);

    for (const key in props) {
      if (key === "children") {
        if (typeof props[key] === "string") {
          renderText(tag, props[key]);
        } else if (Array.isArray(props[key])) {
          props[key].forEach((child: RElement | string) => {
            if (typeof child === "string") {
              renderText(tag as HTMLElement, child);
            } else {
              render(child, tag as HTMLElement);
            }
          });
        }
      } else {
        tag.setAttribute(key, props[key]);
      }
    }
  }

  return tag;
}

function commitRoot() {
  commitWork(wipRoot!.child!);
  currentRoot = wipRoot;
  wipRoot = null;
}

function commitWork(fiber: Fiber) {
  debugger
  if (!fiber) return;
  const domParent = fiber.parent!.dom; // 第一次渲染时，fiber.parent.dom为container，之后为父节点的dom
  if (fiber.dom) {
    domParent!.appendChild(fiber.dom);
  }
  commitWork(fiber.child!);
  commitWork(fiber.sibling!);
}

/**
 * 渲染React元素到指定的容器。
 * @param el 要渲染的React元素。
 * @param container 容器元素。
 */
export function render(el: RElement, container: HTMLElement): void {
  wipRoot = {
    dom: container,
    props: {
      children: [el],
    },
    parent: null,
    child: null,
    sibling: null,
    type: "",
    alternate: currentRoot

  };
  nextUnitOfWork = wipRoot;// 第一次渲染的Fiber节点
}

let nextUnitOfWork: Fiber | null = null;
let currentRoot: Fiber | null = null;
let wipRoot: Fiber | null = null; // 根节点


/**
 * 工作循环函数。
 * @param deadline 空闲时间截止对象。
 */
function workLoop(deadline: IdleDeadline): void {
  console.log('i am waiting');
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    // 等待时间片结束
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    // console.log(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }
  while (!nextUnitOfWork && wipRoot) {
    // 如果没有下一个工作单元，但是有根节点,说明已经完成了所有的工作
    debugger
    commitRoot(); // 提交根节点
  }

  requestIdleCallback(workLoop);
}

requestIdleCallback(workLoop);

/**
 * 执行Fiber节点的工作单元。
 * @param fiber Fiber节点。
 * @returns 下一个工作单元。
 */
function performUnitOfWork(fiber: Fiber): Fiber | null {
  if (!fiber.dom) fiber.dom = createDom(fiber); // 创建DOM节点

  if (fiber.parent) { // 不需要每次都去判断，当nextUnitOfWork清空时，就可以直接插入到DOM中
    fiber.parent.dom!.appendChild(fiber.dom); // 插入并渲染DOM节点
  }
  const elements = fiber.props.children;
  reconcileChildren(fiber, elements); // 协调子节点

  if (fiber.child) {
    return fiber.child; // 如果有子节点，返回子节点
  }
  let nextFiber: Fiber | null = fiber; // linkNode point to the parent node
  while (nextFiber) {
    // 如果没有子节点，返回兄弟节点
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.parent;
  }
  /**
   * 1. 如果有子节点，返回子节点
   * 2. 如果没有子节点，返回兄弟节点
   * 3. 如果没有兄弟节点，返回父节点的兄弟节点
   */
  return null;
}


function reconcileChildren(fiber: Fiber, elements: RElement[]): void {
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
      alternate: null
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