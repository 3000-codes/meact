interface RElement {
  type: string;
  props: Record<string, any>;
}

interface Fiber {
  type: string;
  props: Record<string, any>;
  parent: Fiber | null;
  child: Fiber | null;
  sibling: Fiber | null;
  dom: HTMLElement | Text | null;
}

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
 */
export function _render(el: RElement, container: HTMLElement): void {
  let tag: HTMLElement | Text | null = null;
  const props = el.props;
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

function createDom(fiber: Fiber): HTMLElement | Text {
  let tag: HTMLElement | Text | null = null;
  const props = fiber.props;
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

export function render(el: RElement, container: HTMLElement): void {
  nextUnitOfWork = {
    dom: container,
    props: {
      children: [el],
    },
    parent: null,
    child: null,
    sibling: null,
    type: "",
  };
}

let nextUnitOfWork: Fiber | null = null;

function workLoop(deadline: IdleDeadline): void {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }
  requestIdleCallback(workLoop);
}

function performUnitOfWork(fiber: Fiber): Fiber | null {
  if (!fiber.dom) fiber.dom = createDom(fiber);
  if (fiber.parent) fiber.parent.dom!.appendChild(fiber.dom);
  const elements = fiber.props.children;
  let index = 0;
  let prevSibling: Fiber | null = null;

  while (index < elements.length) {
    const element = elements[index];
    const newFiber: Fiber = {
      type: element.type,
      props: element.props,
      parent: fiber,
      dom: null,
      child: null,
      sibling: null,
    };
    if (index === 0) {
      fiber.child = newFiber;
    } else {
      prevSibling!.sibling = newFiber;
    }
    prevSibling = newFiber;
    index++;
  }

  if (fiber.child) {
    return fiber.child;
  }
  let nextFiber: Fiber | null = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.parent;
  }
  return null;
}
