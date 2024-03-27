
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

/** @jsx createElement */
const App = (
  <p> hello, world </p>
);

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

render(App, document.getElementById('root'));