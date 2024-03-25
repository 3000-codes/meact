
import ReactDOM from "@meact/dom";
import { createElement, createTextElement } from "@meact/core";
import App2 from "./draft/App";

const App = createElement('h1', { title: '标题' }, 'hi-', 'mini-', 'react')
console.log(App2)

const root = ReactDOM.createRoot(document.getElementById('root')!)
root.render(App)
// setTimeout(() => {
//   ReactDOM.createRoot(document.getElementById('root')!).render(App)
// }, 1000)


// setInterval(() => {
//   App.props.children.push(createTextElement('world'))
//   root.render(App)
// }, 1000)