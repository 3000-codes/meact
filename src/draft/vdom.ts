
type RElement = {
  type: string,
  props: Record<string, any>
}

function v1() {
  const dom = document.createElement('h1')
  const textNode = document.createTextNode('')
  textNode.nodeValue = 'app'
  dom.append(textNode)

  const root = document.getElementById('root')!
  root.appendChild(dom)
}


// v2()

function v2() {
  const el: RElement = {
    type: "h1",
    props: {
      title: "foo",
      children: "Hello",
    },
  }

  render(el, document.getElementById('root')!)


  function render(el: RElement, container: HTMLElement) {
    const tag = document.createElement(el.type)
    for (const key in el.props) {
      if (key === 'children') {
        // tag.textContent = el.props[key]
        if (typeof el.props[key] === 'string') {
          const textNode = document.createTextNode('')
          textNode.nodeValue = el.props[key]
          tag.appendChild(textNode)
        } else if (Array.isArray(el.props[key])) {
          el.props[key].forEach((child: RElement) => {
            render(child, tag)
          })
        }
      } else {
        tag.setAttribute(key, el.props[key])
      }
    }
    container.appendChild(tag)
  }
}

// v3()
function v3() {
  function createElement(type: string, props: Record<string, any>, ...children: (RElement | string)[]): RElement {
    return {
      type,
      props: {
        ...props,
        children,
      },
    }
  }

  function createTextNode(text: string): RElement {
    return {
      type: 'TEXT_ELEMENT',
      props: {
        text,
      }
    }
  }

  function render(el: RElement, container: HTMLElement) {
    const tag = document.createElement(el.type)
    const props = el.props
    for (const key in props) {
      if (key === 'children') {
        if (typeof props[key] === 'string') {
          const textNode = document.createTextNode('')
          textNode.nodeValue = props[key]
          tag.appendChild(textNode)
        } else if (Array.isArray(props[key])) {
          props[key].forEach((child: RElement | string) => {
            if (typeof child === 'string') {
              const textNode = document.createTextNode('')
              textNode.nodeValue = child
              tag.appendChild(textNode)
            } else {
              render(child, tag)
            }
          })
        }
      } else {
        tag.setAttribute(key, props[key])
      }
    }
    container.appendChild(tag)
  }
  const el = createElement('h1', { title: 'foo' }, 'Hello', createElement('h2', {}, 'world'), createTextNode('!'))
  render(el, document.getElementById('root')!)
}

function v3_5() {
  function createElement(type: string, props: Record<string, any>, ...children: (RElement | string)[]): RElement {
    return {
      type,
      props: {
        ...props,
        children: children.map(child => typeof child === 'string' ? createTextNode(child) : child),
      },
    }
  }

  function createTextNode(text: string): RElement {
    return {
      type: 'TEXT_ELEMENT',
      props: {
        text,
      }
    }
  }

  function render(el: RElement, container: HTMLElement) {
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
            // const textNode = document.createTextNode('')
            // textNode.nodeValue = props[key]
            // tag.appendChild(textNode)
            renderText(tag, props[key])
          } else if (Array.isArray(props[key])) {
            props[key].forEach((child: RElement | string) => {
              if (typeof child === 'string') {
                // const textNode = document.createTextNode('')
                // textNode.nodeValue = child
                //   ; (tag as HTMLElement).appendChild(textNode)
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

  console.log(createElement('h1', { title: 'foo' }, 'Hello', createElement('h2', {}, 'world'), '!', createElement('h3', {}, 'world')));

  render(
    createElement('h1', { title: 'foo' }, 'Hello', createElement('h2', {}, 'world'), '!', createElement('h3', {}, 'world')),
    document.getElementById('root')!)
}

export {
  v1,
  v2,
  v3,
  v3_5,
}