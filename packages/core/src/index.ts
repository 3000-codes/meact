export function createElement(type: string, props?: Record<string, any> | null, ...children: (RElement | string)[]): RElement {
  console.log('really???');

  return {
    type,
    props: {
      ...props,
      children: children.map(child => typeof child === 'string' ? createTextNode(child) : child),
    },
    children
  }
}

export function createTextNode(text: string): RElement {
  return {
    type: 'TEXT_ELEMENT',
    props: {
      text,
    },
    children: [text]
  }
}

export function render(el: RElement, container: HTMLElement) {
  let tag: HTMLElement | Text | null = null
  const props = el.props
  const renderText = (tag: HTMLElement, text: string) => {
    const textNode = document.createTextNode('')
    textNode.nodeValue = text
    tag.appendChild(textNode)
    return tag
  }
  if (el.type === 'TEXT_ELEMENT') {
    tag = document.createTextNode('')
    tag.nodeValue = el.props.text ?? ''
  } else {
    tag = document.createElement(el.type)

    for (const key in props) {
      if (key === 'children') {
        if (typeof props[key] === 'string') {
          renderText(tag, props[key])
        } else if (Array.isArray(props[key])) {
          props[key].forEach((child: RElement | string) => {
            if (typeof child === 'string') {
              renderText(tag as HTMLElement, child)
            } else {
              render(child, tag as HTMLElement)
            }
          })
        }
      } else {
        tag.setAttribute(key, props[key])
      }
    }
  }
  container.appendChild(tag)
}

