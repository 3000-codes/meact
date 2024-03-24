
import ReactDOM from "@meact/dom";
import { createElement } from "@meact/core";
import App2 from "./draft/App";

const App = createElement('h1', { title: '标题' }, 'hi-', 'mini-', 'react')
console.log(App2)

ReactDOM.createRoot(document.getElementById('root')!).render(App)

