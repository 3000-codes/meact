// import { v3_5 } from "./draft";
// v3_5()

import ReactDOM from "@meact/dom";
import { createElement } from "@meact/core";

const App = createElement('h1', { title: '标题' }, 'hi-', 'mini-', 'react')

console.log(App);


ReactDOM.createRoot(document.getElementById('root')!).render(App)