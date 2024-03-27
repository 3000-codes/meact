
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

/** @jsx createElement */
const App = (
  <p> hello, world </p>
);
render(App, document.getElementById('root'));


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
// render(list2, document.getElementById('root'));


