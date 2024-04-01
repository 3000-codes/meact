/**  @jsx CReact.createElement */
import CReact from "@meact/core";
import ReactDOM from "@meact/dom";
// import CReact, { ReactDOM } from './draft/React'
import App from './App'

const root = ReactDOM.createRoot(document.getElementById('root')!)
root.render(<App />)
